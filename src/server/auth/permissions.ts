import { createAccessControl } from "better-auth/plugins/access"

export const resourceActions = {
	user: [
		"create",
		"list",
		"set-role",
		"ban",
		"impersonate",
		"impersonate-admins",
		"delete",
		"set-password",
		"get",
		"update",
	],
	session: ["list", "revoke", "delete"],
} as const

export const ac = createAccessControl(resourceActions)

export const superAdminRole = ac.newRole({
	user: [
		"create",
		"list",
		"set-role",
		"ban",
		"impersonate",
		"impersonate-admins",
		"delete",
		"set-password",
		"get",
		"update",
	],
	session: ["list", "revoke", "delete"],
})

export const adminRole = ac.newRole({
	user: ["create", "list", "ban", "get", "update"],
	session: ["list", "revoke"],
})

export const userRole = ac.newRole({
	user: ["get"],
	session: [],
})

export const roles = {
	"super-admin": superAdminRole,
	admin: adminRole,
	user: userRole,
} as const

export type AppRole = keyof typeof roles
