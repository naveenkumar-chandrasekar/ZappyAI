const STRUCTURED = new Set(['tasks_complete', 'tasks_list'])

export function isStructuredTool(name) {
  return STRUCTURED.has(name)
}

export async function invokeStructuredTool(name, _input, _userId) {
  if (!STRUCTURED.has(name)) return { error: 'unknown_tool' }
  return {}
}
