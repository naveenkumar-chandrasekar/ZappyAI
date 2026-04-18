import { z } from 'zod'

export const createNoteSchema = z.object({
  content: z.string().min(1),
  keywords: z.array(z.string()).optional(),
})

export const updateNoteSchema = z.object({
  content: z.string().min(1),
})
