import type { ActivityRepository } from "#/domain/activity/activity-repository.ts"
import type { RoleRepository } from "#/domain/role/role-repository.ts"
import type { AuthedContext } from "../shared/context.ts"
import { requireActiveOrg } from "../shared/context.ts"
import { conflict } from "../shared/errors.ts"

export interface CreateRoleInput {
	id: string
	label: string
	description: string
}

export interface CreateRoleDeps {
	roleRepo: RoleRepository
	activityRepo: ActivityRepository
}

export function makeCreateRole(deps: CreateRoleDeps) {
	return async (input: CreateRoleInput, ctx: AuthedContext) => {
		const activeOrgId = requireActiveOrg(ctx)

		const existing = await deps.roleRepo.findByIdAndOrg(input.id, activeOrgId)
		if (existing) {
			throw conflict(`A role with ID "${input.id}" already exists`)
		}

		await deps.roleRepo.create({
			id: input.id,
			organizationId: activeOrgId,
			label: input.label,
			description: input.description,
			isSystem: false,
		})
		await deps.activityRepo.insert({
			userId: ctx.session.user.id,
			organizationId: activeOrgId,
			action: "create",
			resource: "role",
			resourceId: input.id,
			metadata: { label: input.label },
		})
		return { success: true as const }
	}
}
