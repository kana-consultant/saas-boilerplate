import type { RoleRepository } from "#/domain/role/role-repository.ts"
import type { AuthedContext } from "../shared/context.ts"
import { requireActiveOrg } from "../shared/context.ts"

export interface ListRolesDeps {
	roleRepo: RoleRepository
}

export function makeListRoles(deps: ListRolesDeps) {
	return async (ctx: AuthedContext) => {
		const activeOrgId = requireActiveOrg(ctx)
		let roles = await deps.roleRepo.listByOrg(activeOrgId)
		if (roles.length === 0) {
			await deps.roleRepo.seedSystemRoles(activeOrgId)
			roles = await deps.roleRepo.listByOrg(activeOrgId)
		}
		return { roles }
	}
}
