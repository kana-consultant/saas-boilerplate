import { createAccessControl } from "better-auth/plugins/access"

import {
	PLATFORM_SUPER_ADMIN,
	resourceActions,
	rolePermissions,
} from "#/domain/role/permissions.ts"

export { PLATFORM_SUPER_ADMIN }

type Statements = { [K in keyof typeof resourceActions]: readonly string[] }

export const ac = createAccessControl(resourceActions as unknown as Statements)

const buildRole = (roleKey: keyof typeof rolePermissions) => {
	const perms = rolePermissions[roleKey]
	const stmt: Record<string, readonly string[]> = {}
	for (const [resource, actions] of Object.entries(perms)) {
		stmt[resource] = actions ?? []
	}
	return ac.newRole(stmt as Statements)
}

export const ownerRole = buildRole("owner")
export const adminRole = buildRole("admin")
export const memberRole = buildRole("member")

// Org-level roles — passed to better-auth organization plugin for UI surfaces
export const roles = {
	owner: ownerRole,
	admin: adminRole,
	member: memberRole,
} as const

// Platform roles — admin plugin uses these for user.role column values
export const platformRoles = {
	"super-admin": ownerRole,
	admin: adminRole,
	user: memberRole,
} as const
