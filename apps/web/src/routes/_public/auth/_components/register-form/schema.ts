import { z } from "zod"

export const registerSchema = z.object({
	name: z.string().min(1, "Name is required"),
	email: z.string().email("Invalid email address"),
	password: z.string().min(8, "Password must be at least 8 characters"),
})

export const validate = <K extends keyof typeof registerSchema.shape>(
	field: K,
	value: string,
) => {
	const result = registerSchema.shape[field].safeParse(value)
	return result.success ? undefined : result.error.issues[0]?.message
}
