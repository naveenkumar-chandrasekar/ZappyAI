import OpenAI from 'openai'

/**
 * Assistant routing by APP_MODE:
 * - development | production → Claude Agent SDK (`runAgentSdkLoop`). Model: `resolveAgentSdkModel()`
 *   (env order AGENT_MODEL → LLM_MODEL if LLM_PROVIDER≠ollama → ANTHROPIC_MODEL → default).
 *   When LLM_PROVIDER=ollama, LLM_MODEL is not used for Agent SDK (Ollama tags are not valid Claude
 *   Code model IDs); set AGENT_MODEL or wire a proxy via Claude Code env. This file does not
 *   hardcode providers.
 * - demo → OpenAI-compatible Groq (`runOpenAICompatLoop`), model `GROQ_MODEL` / default.
 */
export const APP_MODE = process.env.APP_MODE || 'production'
export const IS_DEV = APP_MODE === 'development'
export const IS_DEMO = APP_MODE === 'demo'

export const USE_OPENAI_COMPAT = IS_DEMO

export const openaiCompatClient = IS_DEMO
  ? new OpenAI({
      baseURL: 'https://api.groq.com/openai/v1',
      apiKey: process.env.GROQ_API_KEY,
    })
  : null

export const OPENAI_COMPAT_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile'

export const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || 'claude-opus-4-6'

export const MAX_TURNS = 10
export const HISTORY_LIMIT = 20

export function resolveAgentSdkModel() {
  if (process.env.AGENT_MODEL) return process.env.AGENT_MODEL
  if (process.env.LLM_MODEL && process.env.LLM_PROVIDER !== 'ollama') {
    return process.env.LLM_MODEL
  }
  if (process.env.ANTHROPIC_MODEL) return process.env.ANTHROPIC_MODEL
  return ANTHROPIC_MODEL
}
