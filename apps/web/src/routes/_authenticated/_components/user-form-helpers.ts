import { z } from "zod"
import type { AppRole } from "#/libs/auth/permissions"

export const nameSchema = z.string().min(1, "Name is required").max(100, "Name too long")
export const emailSchema = z
	.string()
	.min(1, "Email is required")
	.email("Invalid email address")
	.max(254, "Email too long")
export const passwordSchema = z
	.string()
	.min(8, "Password must be at least 8 characters")
	.max(72, "Password too long")

export function fieldError(schema: z.ZodTypeAny, value: string) {
	const r = schema.safeParse(value)
	return r.success ? undefined : r.error.issues[0]?.message
}

export function extractErrorMessage(error: unknown): string {
	if (error instanceof Error) return error.message
	if (typeof error === "string") return error
	return "An unexpected error occurred"
}

export interface UserFormSheetProps {
	mode: "create" | "edit" | "delete"
	user?: {
		id: string
		name: string
		email: string
		role?: string | null
	}
	defaultRole?: AppRole
	open: boolean
	onOpenChange: (open: boolean) => void
}
