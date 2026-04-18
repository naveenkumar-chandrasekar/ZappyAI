import { executeTool as runDbTool } from '../ai/db-tools.js'

export function isVagueTaskCreationMessage(msg) {
  const t = msg.trim()
  if (/create\s+a\s+task\s+(buy|to\s+call)/i.test(t)) return false
  const vaguePrefix =
    /^(create\s+(a\s+)?task|new\s+task|add\s+(a\s+)?task|make\s+(a\s+)?task)\b/i
  if (!vaguePrefix.test(t)) return false
  const rest = t.replace(vaguePrefix, '').trim().replace(/^[\s.,!?…]+/, '')
  if (!rest.replace(/[\s.,!?…]/g, '')) return true
  if (/^please\b/i.test(rest) && rest.split(/\s+/).length <= 2) return true
  return false
}

export function getTaskLinkTokens(text) {
  const g = text.match(/gift\s+for\s+([A-Za-z]+)/i)
  if (g) return [g[1]]
  const f = text.match(/for\s+my\s+friend\s+([A-Za-z]+)/i)
  if (f) return ['friend', f[1]]
  return []
}

export async function executeTool(payload, userId, options = {}) {
  const tool = payload.tool
  const input = { sql: payload.sql, params: payload.params ?? [] }

  if (tool === 'mutate_db' && options.lastUserMessage && isVagueTaskCreationMessage(options.lastUserMessage)) {
    if (/INSERT\s+INTO\s+tasks/i.test(payload.sql)) {
      return { error: 'MISSING_TASK_TITLE: add a specific task title first.' }
    }
  }

  return runDbTool(tool, input, userId)
}
