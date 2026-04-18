export function presentNote(note) {
  return {
    id: note.id,
    user_id: note.user_id,
    content: note.content,
    keywords: note.keywords,
    created_at: note.created_at,
  }
}

export function presentNoteList(notes) {
  return notes.map(presentNote)
}
