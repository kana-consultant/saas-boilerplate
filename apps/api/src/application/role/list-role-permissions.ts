import type { PermissionRepository } from "#/domain/role/role-repository.ts"
import type { AuthedContext } from "../shared/context.ts"
import { requireActiveOrg } from "../shared/context.ts"
import type { makeSeedPermissions } from "./seed-permissions.ts"

export interface ListRolePermissionsDeps {
	permRepo: PermissionRepository
	seedPermissions: ReturnType<typeof makeSeedPermissions>
}

export function makeListRolePermissions(deps: ListRolePermissionsDeps) {
	return async (ctx: AuthedContext) => {
		const activeOrgId = requireActiveOrg(ctx)
		let permissions = await deps.permRepo.listByOrg(activeOrgId)
		if (permissions.length === 0) {
			await deps.seedPermissions(activeOrgId)
			permissions = await deps.permRepo.listByOrg(activeOrgId)
		}
		return { permissions }
	}
}
