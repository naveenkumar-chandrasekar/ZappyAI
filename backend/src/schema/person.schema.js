import { z } from 'zod'

export const createPersonSchema = z.object({
  name: z.string().min(1),
  birthday: z.string().min(1),
  priority: z.enum(['High', 'Medium', 'Low']).optional(),
  custom_fields: z.record(z.unknown()).optional(),
})

export const updatePersonSchema = z.object({
  name: z.string().min(1).optional(),
  birthday: z.string().optional(),
  priority: z.enum(['High', 'Medium', 'Low']).optional(),
  custom_fields: z.record(z.unknown()).optional(),
}).refine(data => Object.keys(data).length > 0, { message: 'No fields to update' })
