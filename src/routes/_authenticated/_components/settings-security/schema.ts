import { z } from "zod"

export const passwordSchema = z
	.string()
	.min(8, "Password must be at least 8 characters")
	.max(72, "Password too long")

export function fieldError(schema: z.ZodTypeAny, value: string) {
	const r = schema.safeParse(value)
	return r.success ? undefined : r.error.issues[0]?.message
}
