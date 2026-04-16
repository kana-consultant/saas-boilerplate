import type { ActivityRepository } from "#/domain/activity/activity-repository.ts"
import type { MemberRepository } from "#/domain/member/member-repository.ts"
import type { Cache } from "#/domain/ports/cache.ts"
import type { AppRole } from "#/domain/role/permissions.ts"
import { assertNotSelf, assertOutranksTarget } from "../shared/authorization.ts"
import type { AuthedContext } from "../shared/context.ts"
import { requireActiveOrg } from "../shared/context.ts"

export interface SetRoleInput {
	userId: string
	role: AppRole
}

export interface SetRoleDeps {
	memberRepo: MemberRepository
	activityRepo: ActivityRepository
	cache: Cache
}

export function makeSetRole(deps: SetRoleDeps) {
	return async (input: SetRoleInput, ctx: AuthedContext) => {
		assertNotSelf(ctx.session.user.id, input.userId, "change the role of")
		const activeOrgId = requireActiveOrg(ctx)
		await assertOutranksTarget(
			deps.memberRepo,
			ctx.orgRole,
			input.userId,
			activeOrgId,
		)

		await deps.memberRepo.updateRole(input.userId, activeOrgId, input.role)
		await deps.cache.del(`member:role:${input.userId}:${activeOrgId}`)
		await deps.activityRepo.insert({
			userId: ctx.session.user.id,
			organizationId: activeOrgId,
			action: "set-role",
			resource: "user",
			resourceId: input.userId,
			metadata: { role: input.role },
		})
		return { success: true as const }
	}
}
