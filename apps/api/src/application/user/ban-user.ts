import type { ActivityRepository } from "#/domain/activity/activity-repository.ts"
import type { MemberRepository } from "#/domain/member/member-repository.ts"
import type { AuthService } from "#/domain/ports/auth-service.ts"
import { assertNotSelf, assertOutranksTarget } from "../shared/authorization.ts"
import type { AuthedContext } from "../shared/context.ts"
import { requireActiveOrg } from "../shared/context.ts"

export interface BanUserInput {
	userId: string
	banReason?: string
}

export interface BanUserDeps {
	auth: AuthService
	memberRepo: MemberRepository
	activityRepo: ActivityRepository
}

export function makeBanUser(deps: BanUserDeps) {
	return async (input: BanUserInput, ctx: AuthedContext) => {
		assertNotSelf(ctx.session.user.id, input.userId, "ban")
		const activeOrgId = requireActiveOrg(ctx)
		await assertOutranksTarget(
			deps.memberRepo,
			ctx.orgRole,
			input.userId,
			activeOrgId,
		)

		await deps.auth.banUser(input.userId, input.banReason, {
			headers: ctx.headers,
		})
		await deps.activityRepo.insert({
			userId: ctx.session.user.id,
			organizationId: activeOrgId,
			action: "ban",
			resource: "user",
			resourceId: input.userId,
			metadata: { banReason: input.banReason },
		})
		return { success: true as const }
	}
}
