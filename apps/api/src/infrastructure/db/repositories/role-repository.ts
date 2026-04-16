import { and, eq } from "drizzle-orm"

import type {
	PermissionRepository,
	RoleRepository,
} from "#/domain/role/role-repository.ts"
import type { Db } from "../client.ts"
import * as schema from "../schema.ts"

export function createRoleRepository(db: Db): RoleRepository {
	return {
		async listByOrg(organizationId) {
			return db
				.select()
				.from(schema.appRole)
				.where(eq(schema.appRole.organizationId, organizationId))
				.orderBy(schema.appRole.createdAt)
		},

		async findByIdAndOrg(id, organizationId) {
			return (
				(await db
					.select()
					.from(schema.appRole)
					.where(
						and(
							eq(schema.appRole.id, id),
							eq(schema.appRole.organizationId, organizationId),
						),
					)
					.then((r) => r[0])) ?? null
			)
		},

		async create(input) {
			await db.insert(schema.appRole).values(input)
		},

		async update(id, organizationId, data) {
			await db
				.update(schema.appRole)
				.set(data)
				.where(
					and(
						eq(schema.appRole.id, id),
						eq(schema.appRole.organizationId, organizationId),
					),
				)
		},

		async delete(id, organizationId) {
			await db
				.delete(schema.appRole)
				.where(
					and(
						eq(schema.appRole.id, id),
						eq(schema.appRole.organizationId, organizationId),
					),
				)
		},

		async seedSystemRoles(organizationId) {
			await db
				.insert(schema.appRole)
				.values([
					{
						id: "member",
						organizationId,
						label: "Member",
						description: "Standard member with basic access",
						isSystem: true,
					},
					{
						id: "admin",
						organizationId,
						label: "Admin",
						description: "Can manage users and moderate content",
						isSystem: true,
					},
					{
						id: "owner",
						organizationId,
						label: "Owner",
						description: "Full organization access including role assignment",
						isSystem: true,
					},
				])
				.onConflictDoNothing()
		},
	}
}

export function createPermissionRepository(db: Db): PermissionRepository {
	return {
		async listByOrg(organizationId) {
			return db
				.select()
				.from(schema.rolePermission)
				.where(eq(schema.rolePermission.organizationId, organizationId))
		},

		async grant(row) {
			await db.insert(schema.rolePermission).values(row).onConflictDoNothing()
		},

		async revoke(row) {
			await db
				.delete(schema.rolePermission)
				.where(
					and(
						eq(schema.rolePermission.roleId, row.roleId),
						eq(schema.rolePermission.organizationId, row.organizationId),
						eq(schema.rolePermission.resource, row.resource),
						eq(schema.rolePermission.action, row.action),
					),
				)
		},

		async insertMany(rows) {
			if (rows.length === 0) return
			await db.insert(schema.rolePermission).values(rows).onConflictDoNothing()
		},
	}
}
