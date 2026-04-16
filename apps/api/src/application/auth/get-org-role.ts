import type { MemberRepository } from "#/domain/member/member-repository.ts"
import { PLATFORM_SUPER_ADMIN } from "#/domain/role/permissions.ts"
import type { OptionalAuthContext } from "../shared/context.ts"

export interface GetOrgRoleInput {
	orgId: string
}

export interface GetOrgRoleDeps {
	memberRepo: MemberRepository
}

export function makeGetOrgRole(deps: GetOrgRoleDeps) {
	return async (input: GetOrgRoleInput, ctx: OptionalAuthContext) => {
		if (!ctx.session?.user) return null
		if (ctx.session.user.role === PLATFORM_SUPER_ADMIN) return "owner"
		return deps.memberRepo.findRole(ctx.session.user.id, input.orgId)
	}
}
