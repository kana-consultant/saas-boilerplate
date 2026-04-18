import type { ActivityRepository } from "#/domain/activity/activity-repository.ts"
import type { MemberRepository } from "#/domain/member/member-repository.ts"
import type { AuthService } from "#/domain/ports/auth-service.ts"
import { assertNotSelf, assertOutranksTarget } from "../shared/authorization.ts"
import type { AuthedContext } from "../shared/context.ts"

export interface DeleteUserInput {
	userId: string
}

export interface DeleteUserDeps {
	auth: AuthService
	memberRepo: MemberRepository
	activityRepo: ActivityRepository
}

export function makeDeleteUser(deps: DeleteUserDeps) {
	return async (input: DeleteUserInput, ctx: AuthedContext) => {
		assertNotSelf(ctx.session.user.id, input.userId, "delete")
		const activeOrgId = ctx.session.session?.activeOrganizationId ?? null
		if (activeOrgId) {
			await assertOutranksTarget(
				deps.memberRepo,
				ctx.orgRole,
				input.userId,
				activeOrgId,
			)
		}
		await deps.auth.removeUser(input.userId, { headers: ctx.headers })
		await deps.activityRepo.insert({
			userId: ctx.session.user.id,
			organizationId: activeOrgId,
			action: "delete",
			resource: "user",
			resourceId: input.userId,
		})
		return { success: true as const }
	}
}
