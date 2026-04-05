export interface UserRow {
	id: string
	name: string
	email: string
	role?: string | null
	createdAt: string | Date
}

export interface RoleRow {
	id: string
	label: string
	description: string
	isSystem: boolean
}

export const BUILT_IN_VARIANTS: Record<string, "default" | "secondary" | "outline"> = {
	owner: "default",
	admin: "secondary",
	member: "outline",
}

export type RoleSheetState =
	| { open: false }
	| { open: true; mode: "create" }
	| { open: true; mode: "edit"; role: RoleRow }
