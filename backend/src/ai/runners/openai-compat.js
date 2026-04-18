import { buildSystemPrompt } from '../prompts/zappy-system.js'
import { TOOLS_OPENAI, executeTool } from '../db-tools.js'
import { openaiCompatClient, OPENAI_COMPAT_MODEL, MAX_TURNS, APP_MODE } from '../config.js'

const FAKE_CONFIRM_RE = /\b(done|added|created|updated|deleted|saved|marked|removed|scheduled)\b/i
const FAKE_LOOKUP_RE = /\b(i'?m checking|let me check|let me look|i'?ll (look|search|check|query|fetch|retrieve)|looking up|searching for|checking for|fetching|i couldn'?t find|no results|not found in your|isn'?t in your)\b/i
const TEXT_TOOL_RE = /\b(query_db|mutate_db|get_schema)\s*\((\{[\s\S]*?\})\)/g
const FUNC_TAG_RE = /<function\((query_db|mutate_db|get_schema)\)(\{[\s\S]*?\})(?:<\/function>)?/g
const RAW_SQL_RE = /^\s*(SELECT|INSERT|UPDATE|DELETE)\b[\s\S]+?;?\s*$/i

function extractTextToolCalls(text) {
  const calls = []
  let match
  TEXT_TOOL_RE.lastIndex = 0
  while ((match = TEXT_TOOL_RE.exec(text)) !== null) {
    try {
      calls.push({ name: match[1], input: JSON.parse(match[2]) })
    } catch {
    }
  }
  FUNC_TAG_RE.lastIndex = 0
  while ((match = FUNC_TAG_RE.exec(text)) !== null) {
    try {
      calls.push({ name: match[1], input: JSON.parse(match[2]) })
    } catch {
    }
  }

  if (!calls.length && RAW_SQL_RE.test(text)) {
    const sql = text.trim().replace(/;+$/, '')
    const isWrite = /^\s*(INSERT|UPDATE|DELETE)\b/i.test(sql)
    calls.push({ name: isWrite ? 'mutate_db' : 'query_db', input: { sql, params: ['<userId>'] } })
  }

  return calls
}

async function extractToolCallViaJson(messages) {
  const userMessages = messages.filter(m => m.role === 'user').slice(-3).map(m => m.content).join('\n')

  const prompt = `You are a SQL generator. Output ONLY a JSON object, nothing else.

EXACT TABLE SCHEMA:
tasks: id UUID, user_id UUID, person_id UUID nullable, title TEXT, description TEXT nullable, due_at TIMESTAMPTZ nullable, status TEXT ('Pending'|'Completed'), created_at TIMESTAMPTZ

RULES:
- Output exactly: {"tool":"mutate_db","sql":"...","params":["<userId>",...]}
- $1 = <userId> always. Other values use $2, $3, etc.
- id must use gen_random_uuid()
- status must be 'Pending' or 'Completed'
- due_at column (not due_date). Use TIMESTAMPTZ format.
- title column (not task_name, task_desc, description, content)
- RETURNING * required on INSERT

User request: ${userMessages}

JSON:`

  try {
    const res = await openaiCompatClient.chat.completions.create({
      model: OPENAI_COMPAT_MODEL,
      messages: [{ role: 'user', content: prompt }],
    })
    const raw = (res.choices[0].message.content || '').trim()
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return null
    return JSON.parse(jsonMatch[0])
  } catch {
    return null
  }
}

export async function runOpenAICompatLoop(messages, userId) {
  const systemPrompt = buildSystemPrompt()
  let mutateWasCalled = false
  let forceMutate = false
  let forceAttempts = 0
  let lastFakeText = null
  const seenTexts = new Map()

  for (let turn = 0; turn < MAX_TURNS; turn++) {
    let response
    try {
      response = await openaiCompatClient.chat.completions.create({
        model: OPENAI_COMPAT_MODEL,
        messages: [{ role: 'system', content: systemPrompt }, ...messages],
        tools: TOOLS_OPENAI,
        tool_choice: forceMutate ? 'required' : 'auto',
      })
    } catch (err) {
      console.error('[Assistant] LLM request failed:', err.message)
      return "I'm having trouble connecting. Please try again."
    }

    forceMutate = false
    const msg = response.choices[0].message

    if (!msg.tool_calls?.length) {
      const text = (msg.content || '').trim()
      console.log(`[Assistant] turn=${turn} finish=${response.choices[0].finish_reason} content=${JSON.stringify(text).slice(0, 300)}`)
      const textCalls = extractTextToolCalls(text)

      if (textCalls.length) {
        console.warn(`[Assistant] Text-embedded tool calls detected (${textCalls.map(c => c.name).join(', ')}) — executing`)
        messages.push({ role: 'assistant', content: text })

        let toolResults = []
        for (const tc of textCalls) {
          console.log(`[Assistant] tool(text)=${tc.name}`, JSON.stringify(tc.input).slice(0, 120))
          const result = await executeTool(tc.name, tc.input, userId)
          console.log(`[Assistant] result=`, JSON.stringify(result).slice(0, 200))
          if (tc.name === 'mutate_db' && result.success) mutateWasCalled = true
          toolResults.push(`${tc.name} result: ${JSON.stringify(result)}`)
        }

        messages.push({ role: 'user', content: toolResults.join('\n') })
        continue
      }

      const seenCount = (seenTexts.get(text) || 0) + 1
      seenTexts.set(text, seenCount)

      const isFakeLookup = FAKE_LOOKUP_RE.test(text) && !mutateWasCalled
      const isFakeConfirm = FAKE_CONFIRM_RE.test(text) && !mutateWasCalled

      if (isFakeLookup || isFakeConfirm || seenCount >= 2) {
        forceAttempts++
        console.warn(`[Assistant] ${isFakeConfirm ? 'Fake confirmation' : seenCount >= 2 ? 'Repeated response' : 'Fake lookup'} detected (attempt ${forceAttempts})`)

        if (forceAttempts >= 2) {
          console.warn('[Assistant] Force attempts exhausted — extracting tool call via JSON prompt')
          const extracted = await extractToolCallViaJson(messages)
          if (extracted?.tool && extracted?.sql) {
            console.log(`[Assistant] extracted tool=${extracted.tool}`, JSON.stringify(extracted).slice(0, 200))
            const result = await executeTool(extracted.tool, { sql: extracted.sql, params: extracted.params || ['<userId>'] }, userId)
            console.log(`[Assistant] extracted result=`, JSON.stringify(result).slice(0, 200))
            if (extracted.tool === 'mutate_db' && result.success) {
              mutateWasCalled = true
              messages.push({ role: 'assistant', content: text })
              messages.push({ role: 'user', content: `tool result: ${JSON.stringify(result)}. Now give the user a short friendly confirmation of what was done.` })
              forceAttempts = 0
              continue
            } else if (result.error) {
              console.error('[Assistant] JSON extraction failed:', result.error)
              return "Sorry, I ran into trouble saving that. Could you try rephrasing?"
            }
          } else {
            return "Sorry, I ran into trouble saving that. Could you try rephrasing?"
          }
        }

        if (isFakeConfirm) lastFakeText = text
        messages.push({ role: 'assistant', content: text })
        messages.push({
          role: 'user',
          content: isFakeConfirm
            ? 'You said it was done but the data was never saved to the database. You MUST call mutate_db right now with the correct SQL to save it.'
            : 'You described checking the database but did not call any tool. You MUST call query_db or mutate_db right now to actually access the data.',
        })
        forceMutate = true
        continue
      }

      if (!text) {
        if (!mutateWasCalled) {
          console.warn('[Assistant] Empty response before task complete — nudging')
          messages.push({ role: 'assistant', content: '' })
          messages.push({ role: 'user', content: 'Please continue and complete the task.' })
          continue
        }
        return "Done."
      }

      return text
    }

    messages.push({
      role: 'assistant',
      content: msg.content || null,
      tool_calls: msg.tool_calls,
    })

    for (const tc of msg.tool_calls) {
      let input
      try {
        input = JSON.parse(tc.function.arguments || '{}')
      } catch {
        console.error(`[Assistant] Invalid JSON in tool arguments for ${tc.function.name}`)
        messages.push({ role: 'tool', tool_call_id: tc.id, content: JSON.stringify({ error: 'Invalid tool arguments — malformed JSON.' }) })
        continue
      }

      console.log(`[Assistant] tool=${tc.function.name}`, JSON.stringify(input).slice(0, 120))
      const result = await executeTool(tc.function.name, input, userId)
      console.log(`[Assistant] result=`, JSON.stringify(result).slice(0, 200))

      if (tc.function.name === 'mutate_db' && result.success) {
        mutateWasCalled = true
      }

      messages.push({ role: 'tool', tool_call_id: tc.id, content: JSON.stringify(result) })

      if (tc.function.name === 'mutate_db' && result.success && lastFakeText) {
        lastFakeText = null
      }
    }
  }
  return 'I ran into a loop. Could you rephrase that?'
}

export function logOpenAiCompatStart() {
  console.log(`[Assistant] mode=${APP_MODE} backend=openai-compat model=${OPENAI_COMPAT_MODEL}`)
}
