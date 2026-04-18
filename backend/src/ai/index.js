import { Conversation } from '../models/index.js'
import { IS_DEMO, HISTORY_LIMIT } from './config.js'
import { runAgentSdkLoop } from './runners/agent-sdk.js'
import { runOpenAICompatLoop, logOpenAiCompatStart } from './runners/openai-compat.js'

export async function processMessage(userId, userMessage) {
  try {
    if (IS_DEMO) {
      logOpenAiCompatStart()
      const history = await Conversation.findAll({
        where: { user_id: userId },
        order: [['created_at', 'DESC']],
        limit: HISTORY_LIMIT,
      })
      const messages = [
        ...history.reverse().map(m => ({ role: m.role, content: m.message ?? m.content ?? '' })),
        { role: 'user', content: userMessage },
      ]
      return await runOpenAICompatLoop(messages, userId)
    }

    return await runAgentSdkLoop(userId, userMessage)
  } catch (err) {
    console.error('[Assistant] processMessage error:', err.message)
    return "I'm having trouble right now. Please try again in a moment."
  }
}

export { APP_MODE, IS_DEMO, USE_OPENAI_COMPAT } from './config.js'
