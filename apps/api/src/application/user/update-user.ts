import type { ActivityRepository } from "#/domain/activity/activity-repository.ts"
import type { MemberRepository } from "#/domain/member/member-repository.ts"
import type { AuthService } from "#/domain/ports/auth-service.ts"
import type { AuthedContext } from "../shared/context.ts"
import { requireActiveOrg } from "../shared/context.ts"
import { assertNotSelf, assertOutranksTarget } from "../shared/authorization.ts"

export interface UpdateUserInput {
	userId: string
	name?: string
	email?: string
}

export interface UpdateUserDeps {
	auth: AuthService
	memberRepo: MemberRepository
	activityRepo: ActivityRepository
}

export function makeUpdateUser(deps: UpdateUserDeps) {
	return async (input: UpdateUserInput, ctx: AuthedContext) => {
		assertNotSelf(
			ctx.session.user.id,
			input.userId,
			"update via admin panel — use your profile page instead",
		)
		const activeOrgId = requireActiveOrg(ctx)
		await assertOutranksTarget(deps.memberRepo, ctx.orgRole, input.userId, activeOrgId)

		const { userId, ...data } = input
		await deps.auth.updateUser(userId, data, { headers: ctx.headers })
		await deps.activityRepo.insert({
			userId: ctx.session.user.id,
			organizationId: activeOrgId,
			action: "update",
			resource: "user",
			resourceId: userId,
			metadata: data,
		})
		return { success: true as const }
	}
}
