import { z } from "zod"

export interface RoleRow {
	id: string
	label: string
	description: string
	isSystem: boolean
}

export interface RoleFormSheetProps {
	mode: "create" | "edit"
	role?: RoleRow
	open: boolean
	onOpenChange: (open: boolean) => void
}

const idSchema = z
	.string()
	.min(2, "Must be at least 2 characters")
	.max(50, "Too long")
	.regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers, and hyphens only")
const labelSchema = z.string().min(1, "Label is required").max(100, "Too long")
const descriptionSchema = z.string().max(500, "Too long")

export const createRoleSchema = z.object({
	id: idSchema,
	label: labelSchema,
	description: descriptionSchema,
})

export const editRoleSchema = z.object({
	id: z.string(),
	label: labelSchema,
	description: descriptionSchema,
})

export function extractErrorMessage(error: unknown): string {
	if (error instanceof Error) return error.message
	if (typeof error === "string") return error
	return "An unexpected error occurred"
}
