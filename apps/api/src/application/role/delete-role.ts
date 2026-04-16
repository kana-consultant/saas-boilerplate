import type { ActivityRepository } from "#/domain/activity/activity-repository.ts"
import type { RoleRepository } from "#/domain/role/role-repository.ts"
import type { AuthedContext } from "../shared/context.ts"
import { requireActiveOrg } from "../shared/context.ts"
import { forbidden, notFound } from "../shared/errors.ts"

export interface DeleteRoleInput {
	id: string
}

export interface DeleteRoleDeps {
	roleRepo: RoleRepository
	activityRepo: ActivityRepository
}

export function makeDeleteRole(deps: DeleteRoleDeps) {
	return async (input: DeleteRoleInput, ctx: AuthedContext) => {
		const activeOrgId = requireActiveOrg(ctx)
		const found = await deps.roleRepo.findByIdAndOrg(input.id, activeOrgId)
		if (!found) throw notFound("Role not found")
		if (found.isSystem) throw forbidden("System roles cannot be deleted")

		await deps.roleRepo.delete(input.id, activeOrgId)
		await deps.activityRepo.insert({
			userId: ctx.session.user.id,
			organizationId: activeOrgId,
			action: "delete",
			resource: "role",
			resourceId: input.id,
			metadata: { label: found.label },
		})
		return { success: true as const }
	}
}
