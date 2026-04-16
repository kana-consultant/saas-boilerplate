import type { OrgRole, OrgRolePermission } from "./role.ts"

export interface RoleRepository {
	listByOrg(organizationId: string): Promise<OrgRole[]>
	findByIdAndOrg(id: string, organizationId: string): Promise<OrgRole | null>
	create(input: {
		id: string
		organizationId: string
		label: string
		description: string
		isSystem: boolean
	}): Promise<void>
	update(
		id: string,
		organizationId: string,
		data: { label?: string; description?: string },
	): Promise<void>
	delete(id: string, organizationId: string): Promise<void>
	seedSystemRoles(organizationId: string): Promise<void>
}

export interface PermissionRepository {
	listByOrg(organizationId: string): Promise<OrgRolePermission[]>
	grant(row: OrgRolePermission): Promise<void>
	revoke(row: OrgRolePermission): Promise<void>
	insertMany(rows: OrgRolePermission[]): Promise<void>
}
