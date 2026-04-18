export function userMessageRequiresDataTools(text) {
  const t = text.trim().toLowerCase()
  if (t === 'thanks' || (t.length < 12 && /^(thanks|ok|cool)$/i.test(t))) return false
  if (/verify.*pending|still in pending/i.test(t)) return true
  if (/(complete|mark).*(task|gift|buy)/i.test(text)) return true
  if (/buy\s+gift\s+for/i.test(t)) return true
  return false
}

export function userMessageRequiresTaskMutation(text) {
  const t = text.trim().toLowerCase()
  if (/^show\s+my\s+tasks\b/.test(t) || /\blist\s+all(\s+the)?\s+tasks\b/.test(t)) return false
  if (/\bmove\s+this\s+task\s+to\s+pending\b/.test(t)) return true
  if (/^complete\s+/.test(t) && /\bfor\b/.test(t)) return true
  if (/\breopen\s+the\s+task\b/i.test(t)) return true
  return false
}

export function extractTitleSearchForCompleteIntent(text) {
  const m = text.match(/complete\s+the\s+task\s+(.+)/i)
  return m ? m[1].trim() : null
}

export function extractTitleSearchForReopenIntent(text) {
  let m = text.match(/^(.+?)\s+move\s+this\s+task\s+to\s+pending\s*$/i)
  if (m) return m[1].trim()
  m = text.match(/reopen\s+the\s+task\s+(.+)/i)
  return m ? m[1].trim() : null
}

export function sanitizeAssistantReply(raw) {
  if (!raw || typeof raw !== 'string') return raw
  let s = raw.replace(/\*\*([^*]+)\*\*/g, '$1')
  if (/mutate_db|`INSERT|`SELECT|USER_ID_HERE|"tool"\s*:\s*"mutate_db"/i.test(s)) {
    return 'What would you like to call this task?'
  }
  const lines = s.split('\n').filter(line => {
    const l = line.trim()
    return !/^(Task ID|Title|Due At|Completed):/i.test(l)
  })
  s = lines.join('\n')
  s = s.replace(/\b[0-9a-f]{8}-[0-9a-f-]{27}\b/gi, '')
  s = s.replace(/\b\d{8}\b/g, '')
  s = s.replace(/\d{4}-\d{2}-\d{2}T[\d:.]+Z/g, '')
  s = s.replace(/\b(FALSE|TRUE)\b/gi, '')
  const nameDump = s.match(/\bname:\s*([^,}\n]+)/i)
  if (nameDump && /id:\s*/i.test(raw) && !s.includes('Good morning')) {
    return `Here: ${nameDump[1].trim()}.`
  }
  return s.trim()
}
