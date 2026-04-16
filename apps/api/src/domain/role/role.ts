export interface OrgRole {
	id: string
	organizationId: string
	label: string
	description: string
	isSystem: boolean
	createdAt: Date
}

export interface OrgRolePermission {
	roleId: string
	organizationId: string
	resource: string
	action: string
}
