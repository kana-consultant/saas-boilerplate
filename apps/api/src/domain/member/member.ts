import type { AppRole } from "../role/permissions.ts"

export interface Membership {
	id: string
	userId: string
	organizationId: string
	role: AppRole
	createdAt: Date
}
