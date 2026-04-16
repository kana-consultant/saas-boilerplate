import type { ActivityRepository } from "#/domain/activity/activity-repository.ts"
import type { RoleRepository } from "#/domain/role/role-repository.ts"
import type { AuthedContext } from "../shared/context.ts"
import { requireActiveOrg } from "../shared/context.ts"

export interface UpdateRoleInput {
	id: string
	label?: string
	description?: string
}

export interface UpdateRoleDeps {
	roleRepo: RoleRepository
	activityRepo: ActivityRepository
}

export function makeUpdateRole(deps: UpdateRoleDeps) {
	return async (input: UpdateRoleInput, ctx: AuthedContext) => {
		const activeOrgId = requireActiveOrg(ctx)
		const { id, ...data } = input
		await deps.roleRepo.update(id, activeOrgId, data)
		await deps.activityRepo.insert({
			userId: ctx.session.user.id,
			organizationId: activeOrgId,
			action: "update",
			resource: "role",
			resourceId: id,
			metadata: data,
		})
		return { success: true as const }
	}
}
