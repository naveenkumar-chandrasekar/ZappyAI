import { z } from 'zod'

export const requestOtpSchema = z.object({
  mobile_number: z.string().min(1),
})

export const verifyOtpSchema = z.object({
  mobile_number: z.string().min(1),
  code: z.string().length(6),
  name: z.string().optional(),
  birthday: z.string().optional(),
})
