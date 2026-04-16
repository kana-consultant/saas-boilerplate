import { z } from "zod"

export const loginSchema = z.object({
	email: z.string().email("Invalid email address"),
	password: z.string().min(1, "Password is required"),
})

export const validate = <K extends keyof typeof loginSchema.shape>(
	field: K,
	value: string,
) => {
	const result = loginSchema.shape[field].safeParse(value)
	return result.success ? undefined : result.error.issues[0]?.message
}
