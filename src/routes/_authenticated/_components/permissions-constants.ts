import { resourceActions } from "#/server/auth/permissions"

export const ACTION_LABELS: Record<string, string> = {
	create: "Create",
	list: "List",
	get: "View",
	update: "Update",
	delete: "Delete",
	ban: "Ban",
	"set-role": "Set Role",
	"set-password": "Set Password",
	impersonate: "Impersonate",
	"impersonate-admins": "Impersonate Admins",
	revoke: "Revoke",
	export: "Export",
}

export const ACTION_DESCRIPTIONS: Record<string, string> = {
	create: "Create new records",
	list: "List all records",
	get: "View a single record",
	update: "Edit existing records",
	delete: "Permanently remove records",
	ban: "Ban and restrict accounts",
	"set-role": "Assign roles to users",
	"set-password": "Change user passwords",
	impersonate: "Log in as another user",
	"impersonate-admins": "Log in as an admin user",
	revoke: "Revoke active sessions",
	export: "Export data to CSV/JSON",
}

export const RESOURCE_LABELS: Record<string, string> = {
	user: "Users",
	session: "Sessions",
	"activity-log": "Activity Log",
}

export const RESOURCE_DESCRIPTIONS: Record<string, string> = {
	user: "Manage user accounts, roles, and access",
	session: "Manage active login sessions",
	"activity-log": "View and export system activity events",
}

export const BUILT_IN_VARIANTS: Record<string, "default" | "secondary" | "outline"> = {
	owner: "default",
	admin: "secondary",
	member: "outline",
}

export const ALL_ROWS = (
	Object.entries(resourceActions) as [
		keyof typeof resourceActions,
		readonly string[],
	][]
).flatMap(([resource, actions]) =>
	actions.map((action) => ({ resource: resource as string, action })),
)
