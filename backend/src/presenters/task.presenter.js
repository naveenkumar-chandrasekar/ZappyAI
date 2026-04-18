const DONE_ALIASES = new Set(['completed', 'complete', 'done', 'closed'])

function normalizeTaskStatus(task) {
  const raw = task.status
  if (raw === 'In Progress') return 'Pending'
  const sl = String(raw || '').toLowerCase().trim()
  if (task.completed === true) return 'Completed'
  if (DONE_ALIASES.has(sl)) return 'Completed'
  if (sl === 'pending' || raw == null || raw === '') return 'Pending'
  if (sl.includes('progress')) return 'Pending'
  return 'Pending'
}

export function presentTask(task) {
  const status = normalizeTaskStatus(task)
  const completed = status === 'Completed'
  const person = task.Person
    ? {
        id: task.Person.id,
        name: task.Person.name,
        birthday: task.Person.birthday,
        priority: task.Person.priority,
        is_owner: task.Person.is_owner,
      }
    : null
  return {
    id: task.id,
    user_id: task.user_id,
    person_id: task.person_id,
    person_name: person ? person.name : null,
    person,
    title: task.title,
    description: task.description,
    due_at: task.due_at,
    completed,
    status,
    created_at: task.created_at,
  }
}

export function presentTaskList(tasks) {
  return tasks.map(presentTask)
}
