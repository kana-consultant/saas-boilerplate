export const PLATFORM_SUPER_ADMIN = "super-admin"

export type AppRole = "owner" | "admin" | "member"

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
	"activity-log": ["list", "export"],
} as const

export type Resource = keyof typeof resourceActions

export type ResourceAction<R extends Resource> =
	(typeof resourceActions)[R][number]

const ownerPermissions = {
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
	"activity-log": ["list", "export"],
} satisfies Partial<Record<Resource, readonly string[]>>

const adminPermissions = {
	user: ["create", "list", "ban", "get", "update"],
	session: ["list", "revoke"],
	"activity-log": ["list"],
} satisfies Partial<Record<Resource, readonly string[]>>

const memberPermissions = {
	user: ["get"],
	session: [],
	"activity-log": [],
} satisfies Partial<Record<Resource, readonly string[]>>

export const rolePermissions: Record<
	AppRole,
	Partial<Record<Resource, readonly string[]>>
> = {
	owner: ownerPermissions,
	admin: adminPermissions,
	member: memberPermissions,
}

export function hasPermission(
	role: AppRole,
	resource: Resource,
	actions: string[],
): boolean {
	const allowed = rolePermissions[role]?.[resource] ?? []
	return actions.every((a) => allowed.includes(a))
}

export const ROLE_RANK: Record<AppRole, number> = {
	member: 0,
	admin: 1,
	owner: 2,
}

export function outranks(
	caller: AppRole | null,
	target: AppRole | null,
): boolean {
	const c = ROLE_RANK[caller ?? "member"] ?? 0
	const t = ROLE_RANK[target ?? "member"] ?? 0
	return c > t
}
