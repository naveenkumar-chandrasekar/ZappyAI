import { z } from 'zod'

export const updateSettingsSchema = z.object({
  name: z.string().min(1).optional(),
  settings: z.record(z.unknown()).optional(),
}).refine(data => data.name !== undefined || data.settings !== undefined, {
  message: 'No valid fields to update. Provide name or settings.',
})
