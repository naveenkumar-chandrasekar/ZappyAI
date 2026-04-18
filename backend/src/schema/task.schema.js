import { z } from 'zod'

export const createTaskSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  due_at: z.string().optional(),
  person_id: z.string().uuid().optional(),
})

export const updateTaskSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  due_at: z.string().optional().nullable(),
  completed: z.boolean().optional(),
  status: z.enum(['Pending', 'Completed']).optional(),
  person_id: z.string().uuid().nullable().optional(),
}).refine(data => Object.keys(data).length > 0, { message: 'No fields to update' })
