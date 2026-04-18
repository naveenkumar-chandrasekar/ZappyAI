import { query as agentQuery } from '@anthropic-ai/claude-agent-sdk'
import { User } from '../../models/index.js'
import { createDbMcpServer } from '../../services/mcp-db.js'
import { buildSystemPrompt } from '../prompts/zappy-system.js'
import { resolveAgentSdkModel, MAX_TURNS, APP_MODE } from '../config.js'

async function saveUserSession(userId, sessionId, currentSettings) {
  await User.update(
    { settings: { ...(currentSettings || {}), agent_session_id: sessionId } },
    { where: { id: userId } }
  )
}

export async function runAgentSdkLoop(userId, userMessage) {
  const user = await User.findByPk(userId, { attributes: ['settings'] })
  const sessionId = user?.settings?.agent_session_id ?? null
  const dbServer = createDbMcpServer(userId)
  const model = resolveAgentSdkModel()

  const options = {
    model,
    systemPrompt: buildSystemPrompt(),
    tools: [],
    mcpServers: { 'zappy-db': dbServer },
    allowedTools: ['mcp__zappy-db__*'],
    settingSources: [],
    settings: {
      allowedMcpServers: [{ serverName: 'zappy-db' }],
    },
    maxTurns: MAX_TURNS,
    permissionMode: 'bypassPermissions',
    allowDangerouslySkipPermissions: true,
    ...(sessionId ? { resume: sessionId } : {}),
  }

  console.log(`[Assistant] mode=${APP_MODE} backend=agent-sdk model=${model} session=${sessionId ?? 'new'}`)

  let resultText = "I'm having trouble right now. Please try again in a moment."
  let newSessionId = null

  for await (const message of agentQuery({ prompt: userMessage, options })) {
    if (message.type === 'system' && message.subtype === 'init') {
      newSessionId = message.session_id
      const failed = (message.mcp_servers || []).filter(
        s => s.status !== 'connected' && s.name === 'zappy-db'
      )
      if (failed.length) console.warn('[Assistant] MCP connect failed (zappy-db):', failed)
    }
    if (message.type === 'result') {
      newSessionId = message.session_id ?? newSessionId
      if (message.subtype === 'success') resultText = message.result
      else console.error('[Assistant] Agent error:', message.subtype)
    }
  }

  if (newSessionId) await saveUserSession(userId, newSessionId, user?.settings)
  return resultText
}
