import type { PermissionRepository, RoleRepository } from "#/domain/role/role-repository.ts"
import {
	hasPermission,
	resourceActions,
	rolePermissions,
} from "#/domain/role/permissions.ts"
import type { AppRole, Resource } from "#/domain/role/permissions.ts"

export interface SeedPermissionsDeps {
	roleRepo: RoleRepository
	permRepo: PermissionRepository
}

export function makeSeedPermissions(deps: SeedPermissionsDeps) {
	return async (organizationId: string) => {
		await deps.roleRepo.seedSystemRoles(organizationId)
		const rows: { roleId: string; organizationId: string; resource: string; action: string }[] = []
		for (const roleKey of Object.keys(rolePermissions) as AppRole[]) {
			for (const [resource, actions] of Object.entries(resourceActions)) {
				for (const action of actions as readonly string[]) {
					if (hasPermission(roleKey, resource as Resource, [action])) {
						rows.push({ roleId: roleKey, organizationId, resource, action })
					}
				}
			}
		}
		if (rows.length > 0) await deps.permRepo.insertMany(rows)
	}
}
