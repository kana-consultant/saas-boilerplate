import type { MemberRepository } from "#/domain/member/member-repository.ts"
import type { AppRole } from "#/domain/role/permissions.ts"
import { outranks } from "#/domain/role/permissions.ts"
import { forbidden } from "./errors.ts"

export function assertNotSelf(callerUserId: string, targetUserId: string, action: string) {
	if (targetUserId === callerUserId) {
		throw forbidden(`You cannot ${action} your own account`)
	}
}

export async function assertOutranksTarget(
	memberRepo: MemberRepository,
	callerOrgRole: AppRole | null,
	targetUserId: string,
	organizationId: string,
) {
	const targetRole = await memberRepo.findRole(targetUserId, organizationId)
	if (!outranks(callerOrgRole, targetRole)) {
		throw forbidden("Cannot perform this action on a user with equal or higher privileges")
	}
}
