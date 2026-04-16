import type { ActivityRepository } from "#/domain/activity/activity-repository.ts"
import type { MemberRepository } from "#/domain/member/member-repository.ts"
import type { AuthService } from "#/domain/ports/auth-service.ts"
import type { AuthedContext } from "../shared/context.ts"
import { requireActiveOrg } from "../shared/context.ts"
import { assertOutranksTarget } from "../shared/authorization.ts"

export interface UnbanUserInput {
	userId: string
}

export interface UnbanUserDeps {
	auth: AuthService
	memberRepo: MemberRepository
	activityRepo: ActivityRepository
}

export function makeUnbanUser(deps: UnbanUserDeps) {
	return async (input: UnbanUserInput, ctx: AuthedContext) => {
		const activeOrgId = requireActiveOrg(ctx)
		await assertOutranksTarget(deps.memberRepo, ctx.orgRole, input.userId, activeOrgId)

		await deps.auth.unbanUser(input.userId, { headers: ctx.headers })
		await deps.activityRepo.insert({
			userId: ctx.session.user.id,
			organizationId: activeOrgId,
			action: "unban",
			resource: "user",
			resourceId: input.userId,
		})
		return { success: true as const }
	}
}
