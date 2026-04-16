import type { ActivityRepository } from "#/domain/activity/activity-repository.ts"
import type { PermissionRepository } from "#/domain/role/role-repository.ts"
import type { AuthedContext } from "../shared/context.ts"
import { requireActiveOrg } from "../shared/context.ts"

export interface SetRolePermissionInput {
	roleId: string
	resource: string
	action: string
	granted: boolean
}

export interface SetRolePermissionDeps {
	permRepo: PermissionRepository
	activityRepo: ActivityRepository
}

export function makeSetRolePermission(deps: SetRolePermissionDeps) {
	return async (input: SetRolePermissionInput, ctx: AuthedContext) => {
		const activeOrgId = requireActiveOrg(ctx)
		const row = {
			roleId: input.roleId,
			organizationId: activeOrgId,
			resource: input.resource,
			action: input.action,
		}
		if (input.granted) {
			await deps.permRepo.grant(row)
		} else {
			await deps.permRepo.revoke(row)
		}
		await deps.activityRepo.insert({
			userId: ctx.session.user.id,
			organizationId: activeOrgId,
			action: input.granted ? "grant" : "revoke",
			resource: "permission",
			resourceId: input.roleId,
			metadata: { resource: input.resource, action: input.action },
		})
		return { success: true as const }
	}
}
