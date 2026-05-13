import { z } from 'zod';
import { isValidEgPhone, normalizeEgPhone } from '@wasalni/utils/phone';

/**
 * Egyptian phone schema. Accepts local (01XXXXXXXXX) or international
 * (+201XXXXXXXXX) form and normalises to E.164.
 */
export const phoneSchema = z
  .string()
  .trim()
  .refine(isValidEgPhone, {
    message: 'يجب إدخال رقم موبايل مصري صحيح',
  })
  .transform((raw) => {
    const normalized = normalizeEgPhone(raw);
    if (!normalized) throw new Error('unreachable — validated above');
    return normalized.e164;
  });

export const otpSchema = z
  .string()
  .trim()
  .regex(/^\d{4,6}$/, 'كود التحقق غير صحيح');

/** Mongo ObjectId-shaped string (24 hex chars). Backend uses Mongo. */
export const idSchema = z.string().regex(/^[a-fA-F0-9]{24}$/, 'invalid id');

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
