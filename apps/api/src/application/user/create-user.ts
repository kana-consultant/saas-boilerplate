import type { ActivityRepository } from "#/domain/activity/activity-repository.ts"
import type { MemberRepository } from "#/domain/member/member-repository.ts"
import type { AuthService } from "#/domain/ports/auth-service.ts"
import type { Cache } from "#/domain/ports/cache.ts"
import type { AppRole } from "#/domain/role/permissions.ts"
import type { AuthedContext } from "../shared/context.ts"
import { requireActiveOrg } from "../shared/context.ts"
import { forbidden } from "../shared/errors.ts"

export interface CreateUserInput {
	name: string
	email: string
	password: string
	role: AppRole
}

export interface CreateUserDeps {
	auth: AuthService
	memberRepo: MemberRepository
	activityRepo: ActivityRepository
	cache: Cache
}

export function makeCreateUser(deps: CreateUserDeps) {
	return async (input: CreateUserInput, ctx: AuthedContext) => {
		if (ctx.orgRole !== "owner" && input.role !== "member") {
			throw forbidden("Admins can only create users with the 'member' role")
		}
		const activeOrgId = requireActiveOrg(ctx)

		const created = await deps.auth.createUser(
			{ name: input.name, email: input.email, password: input.password },
			{ headers: ctx.headers },
		)

		if (created.id) {
			await deps.memberRepo.insert({
				id: crypto.randomUUID(),
				organizationId: activeOrgId,
				userId: created.id,
				role: input.role,
			})
			await deps.cache.del(`user:default-org:${created.id}`)
		}

		await deps.activityRepo.insert({
			userId: ctx.session.user.id,
			organizationId: activeOrgId,
			action: "create",
			resource: "user",
			resourceId: created.id,
			metadata: { email: input.email, role: input.role },
		})

		return { user: { id: created.id, email: created.email } }
	}
}
