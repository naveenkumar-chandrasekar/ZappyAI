import { Op } from 'sequelize'
import { Note } from '../models/index.js'

function extractKeywords(content) {
  const stopWords = new Set([
    'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
    'should', 'may', 'might', 'shall', 'can', 'this', 'that', 'these',
    'those', 'i', 'you', 'he', 'she', 'we', 'they', 'it', 'my', 'your',
    'his', 'her', 'our', 'their', 'its', 'me', 'him', 'us', 'them',
  ])
  const words = content
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 3 && !stopWords.has(w))
  return [...new Set(words)].slice(0, 20)
}

export async function listNotes(userId, keyword) {
  if (keyword) {
    return Note.findAll({
      where: {
        user_id: userId,
        _keyword: keyword.toLowerCase(),
        [Op.or]: [
          { content: { [Op.iLike]: `%${keyword}%` } },
          { keywords: { [Op.contains]: [keyword.toLowerCase()] } },
        ],
      },
      order: [['created_at', 'DESC']],
    })
  }
  return Note.findAll({
    where: { user_id: userId },
    order: [['created_at', 'DESC']],
  })
}

export async function createNote(userId, data) {
  const { content, keywords } = data
  const parsedKeywords = Array.isArray(keywords) && keywords.length
    ? keywords.map(k => k.toLowerCase())
    : extractKeywords(content)
  return Note.create({ user_id: userId, content, keywords: parsedKeywords })
}

export async function findNoteByIdAndUser(id, userId) {
  return Note.findOne({ where: { id, user_id: userId } })
}

export async function updateNote(note, content) {
  const keywords = extractKeywords(content)
  return note.update({ content, keywords })
}

export async function deleteNote(note) {
  await note.destroy()
}
