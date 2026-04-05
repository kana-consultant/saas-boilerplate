export type OrgRole = "owner" | "admin" | "member"

export const ROLES: OrgRole[] = ["owner", "admin", "member"]

export interface Member {
	id: string
	userId: string
	role: string
	user: { name: string; email: string; image?: string }
}

export interface Invitation {
	id: string
	email: string
	role: string
	status: string
}
