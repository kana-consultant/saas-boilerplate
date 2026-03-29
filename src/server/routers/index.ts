import { ORPCError } from "@orpc/server"
import { and, desc, eq, sql } from "drizzle-orm"

import { logActivity } from "#/server/activity"
import { db } from "#/libs/drizzle"
import * as schema from "#/libs/drizzle/schema"
import {
	adminProcedure,
	ownerProcedure,
	protectedProcedure,
	publicProcedure,
	requirePermission,
} from "#/server/orpc/middleware"
import {
	createRoleSchema,
	deleteRoleSchema,
	listActivityLogsSchema,
	setRolePermissionSchema,
	updateRoleSchema,
} from "#/server/orpc/schema"
import { seedRoles, seedPermissions } from "./helpers"
import {
	listUsers,
	banUser,
	unbanUser,
	setRole,
	createUser,
	updateUser,
	deleteUser,
} from "./user-routes"

const router = {
	health: publicProcedure.handler(() => ({ status: "ok" as const })),

	me: protectedProcedure.handler(({ context }) => ({
		user: context.session.user,
	})),

	admin: {
		listUsers,
		banUser,
		unbanUser,
		setRole,
		createUser,
		updateUser,
		deleteUser,

		listRoles: adminProcedure.handler(async ({ context }) => {
			const activeOrgId = context.session.session?.activeOrganizationId
			if (!activeOrgId) {
				throw new ORPCError("BAD_REQUEST", { message: "No active organization" })
			}
			let appRoles = await db
				.select()
				.from(schema.appRole)
				.where(eq(schema.appRole.organizationId, activeOrgId))
				.orderBy(schema.appRole.createdAt)
			if (appRoles.length === 0) {
				await seedRoles(activeOrgId)
				appRoles = await db
					.select()
					.from(schema.appRole)
					.where(eq(schema.appRole.organizationId, activeOrgId))
					.orderBy(schema.appRole.createdAt)
			}
			return { roles: appRoles }
		}),

		createRole: ownerProcedure
			.input(createRoleSchema)
			.handler(async ({ input, context }) => {
				const activeOrgId = context.session.session?.activeOrganizationId
				if (!activeOrgId) {
					throw new ORPCError("BAD_REQUEST", { message: "No active organization" })
				}
				const existing = await db
					.select()
					.from(schema.appRole)
					.where(
						and(
							eq(schema.appRole.id, input.id),
							eq(schema.appRole.organizationId, activeOrgId),
						),
					)
				if (existing.length > 0) {
					throw new ORPCError("CONFLICT", {
						message: `A role with ID "${input.id}" already exists`,
					})
				}
				await db.insert(schema.appRole).values({
					id: input.id,
					organizationId: activeOrgId,
					label: input.label,
					description: input.description,
					isSystem: false,
				})
				await logActivity({
					userId: context.session.user.id,
					organizationId: activeOrgId,
					action: "create",
					resource: "role",
					resourceId: input.id,
					metadata: { label: input.label },
				})
				return { success: true }
			}),

		updateRole: ownerProcedure
			.input(updateRoleSchema)
			.handler(async ({ input, context }) => {
				const activeOrgId = context.session.session?.activeOrganizationId
				if (!activeOrgId) {
					throw new ORPCError("BAD_REQUEST", { message: "No active organization" })
				}
				const { id, ...data } = input
				await db
					.update(schema.appRole)
					.set(data)
					.where(
						and(
							eq(schema.appRole.id, id),
							eq(schema.appRole.organizationId, activeOrgId),
						),
					)
				await logActivity({
					userId: context.session.user.id,
					organizationId: activeOrgId,
					action: "update",
					resource: "role",
					resourceId: id,
					metadata: data,
				})
				return { success: true }
			}),

		deleteRole: ownerProcedure
			.input(deleteRoleSchema)
			.handler(async ({ input, context }) => {
				const activeOrgId = context.session.session?.activeOrganizationId
				if (!activeOrgId) {
					throw new ORPCError("BAD_REQUEST", { message: "No active organization" })
				}
				const found = await db
					.select()
					.from(schema.appRole)
					.where(
						and(
							eq(schema.appRole.id, input.id),
							eq(schema.appRole.organizationId, activeOrgId),
						),
					)
					.then((r) => r[0])
				if (!found) {
					throw new ORPCError("NOT_FOUND", { message: "Role not found" })
				}
				if (found.isSystem) {
					throw new ORPCError("FORBIDDEN", {
						message: "System roles cannot be deleted",
					})
				}
				await db
					.delete(schema.appRole)
					.where(
						and(
							eq(schema.appRole.id, input.id),
							eq(schema.appRole.organizationId, activeOrgId),
						),
					)
				await logActivity({
					userId: context.session.user.id,
					organizationId: activeOrgId,
					action: "delete",
					resource: "role",
					resourceId: input.id,
					metadata: { label: found.label },
				})
				return { success: true }
			}),

		listRolePermissions: adminProcedure.handler(async ({ context }) => {
			const activeOrgId = context.session.session?.activeOrganizationId
			if (!activeOrgId) {
				throw new ORPCError("BAD_REQUEST", { message: "No active organization" })
			}
			let perms = await db
				.select()
				.from(schema.rolePermission)
				.where(eq(schema.rolePermission.organizationId, activeOrgId))
			if (perms.length === 0) {
				await seedPermissions(activeOrgId)
				perms = await db
					.select()
					.from(schema.rolePermission)
					.where(eq(schema.rolePermission.organizationId, activeOrgId))
			}
			return { permissions: perms }
		}),

		setRolePermission: ownerProcedure
			.input(setRolePermissionSchema)
			.handler(async ({ input, context }) => {
				const activeOrgId = context.session.session?.activeOrganizationId
				if (!activeOrgId) {
					throw new ORPCError("BAD_REQUEST", { message: "No active organization" })
				}
				if (input.granted) {
					await db
						.insert(schema.rolePermission)
						.values({
							roleId: input.roleId,
							organizationId: activeOrgId,
							resource: input.resource,
							action: input.action,
						})
						.onConflictDoNothing()
				} else {
					await db
						.delete(schema.rolePermission)
						.where(
							and(
								eq(schema.rolePermission.roleId, input.roleId),
								eq(schema.rolePermission.organizationId, activeOrgId),
								eq(schema.rolePermission.resource, input.resource),
								eq(schema.rolePermission.action, input.action),
							),
						)
				}
				await logActivity({
					userId: context.session.user.id,
					organizationId: activeOrgId,
					action: input.granted ? "grant" : "revoke",
					resource: "permission",
					resourceId: input.roleId,
					metadata: { resource: input.resource, action: input.action },
				})
				return { success: true }
			}),

		listActivityLogs: requirePermission("activity-log", ["list"])
			.input(listActivityLogsSchema)
			.handler(async ({ input, context }) => {
				const activeOrgId = context.session.session?.activeOrganizationId
				if (!activeOrgId) {
					throw new ORPCError("BAD_REQUEST", { message: "No active organization" })
				}

				const conditions = [
					eq(schema.activityLog.organizationId, activeOrgId),
					input.userId ? eq(schema.activityLog.userId, input.userId) : undefined,
					input.resource ? eq(schema.activityLog.resource, input.resource) : undefined,
					input.action ? eq(schema.activityLog.action, input.action) : undefined,
				].filter(Boolean)

				const where = conditions.length > 0 ? and(...conditions) : undefined

				const [logs, [{ count }]] = await Promise.all([
					db
						.select({
							id: schema.activityLog.id,
							userId: schema.activityLog.userId,
							organizationId: schema.activityLog.organizationId,
							action: schema.activityLog.action,
							resource: schema.activityLog.resource,
							resourceId: schema.activityLog.resourceId,
							metadata: schema.activityLog.metadata,
							ipAddress: schema.activityLog.ipAddress,
							userAgent: schema.activityLog.userAgent,
							createdAt: schema.activityLog.createdAt,
							userName: schema.user.name,
							userEmail: schema.user.email,
						})
						.from(schema.activityLog)
						.leftJoin(schema.user, eq(schema.activityLog.userId, schema.user.id))
						.where(where)
						.orderBy(desc(schema.activityLog.createdAt))
						.limit(input.limit)
						.offset(input.offset),
					db
						.select({ count: sql<number>`count(*)::int` })
						.from(schema.activityLog)
						.where(where),
				])

				return { logs, total: count }
			}),
	},
}

export default router
