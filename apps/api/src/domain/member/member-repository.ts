import type { AppRole } from "../role/permissions.ts"

export interface MemberRepository {
	findRole(userId: string, organizationId: string): Promise<AppRole | null>
	insert(input: {
		id: string
		userId: string
		organizationId: string
		role: AppRole
		createdAt?: Date
	}): Promise<void>
	updateRole(userId: string, organizationId: string, role: AppRole): Promise<void>
}
