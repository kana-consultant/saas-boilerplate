import { match } from "ts-pattern"

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
	return (input: GetOrgRoleInput, ctx: OptionalAuthContext) =>
		match(ctx.session)
			.with(null, async () => null)
			.with(
				{ user: { role: PLATFORM_SUPER_ADMIN } },
				async (): Promise<string> => "owner",
			)
			.otherwise((s) => deps.memberRepo.findRole(s.user.id, input.orgId))
}
