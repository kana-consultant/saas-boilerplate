import { ORPCError } from "@orpc/server"
import { and, eq } from "drizzle-orm"

import { auth } from "#/server/auth"
import type { AppRole } from "#/server/auth/permissions"
import { resourceActions, roles } from "#/server/auth/permissions"
import { db } from "#/libs/drizzle"
import * as schema from "#/libs/drizzle/schema"
import {
	adminProcedure,
	protectedProcedure,
	publicProcedure,
	superAdminProcedure,
} from "#/server/orpc/middleware"
import {
	banUserSchema,
	createRoleSchema,
	createUserSchema,
	deleteRoleSchema,
	deleteUserSchema,
	setRolePermissionSchema,
	setRoleSchema,
	unbanUserSchema,
	updateRoleSchema,
	updateUserSchema,
} from "#/server/orpc/schema"

// ─── Role rank: higher number = more privileged ───────────────────────────

const ROLE_RANK: Record<string, number> = {
	user: 0,
	admin: 1,
	"super-admin": 2,
}

function callerRank(role: string): number {
	return ROLE_RANK[role] ?? 0
}

async function assertOutranksTarget(
	context: { headers: Headers; session: { user: { id: string; role?: string | null } } },
	targetUserId: string,
) {
	const target = await auth.api.getUser({
		query: { id: targetUserId },
		headers: context.headers,
	})
	const targetRole = (target as { role?: string | null } | null)?.role ?? "user"
	if (callerRank(context.session.user.role ?? "user") <= callerRank(targetRole)) {
		throw new ORPCError("FORBIDDEN", {
			message: "Cannot perform this action on a user with equal or higher privileges",
		})
	}
}

function assertNotSelf(
	context: { session: { user: { id: string } } },
	targetUserId: string,
	action: string,
) {
	if (targetUserId === context.session.user.id) {
		throw new ORPCError("FORBIDDEN", {
			message: `You cannot ${action} your own account`,
		})
	}
}

// ─── Role / Permission seed helpers ───────────────────────────────────────

async function seedRoles() {
	await db
		.insert(schema.appRole)
		.values([
			{
				id: "user",
				label: "User",
				description: "Standard authenticated user with basic access",
				isSystem: true,
			},
			{
				id: "admin",
				label: "Admin",
				description: "Can manage users and moderate content",
				isSystem: true,
			},
			{
				id: "super-admin",
				label: "Super Admin",
				description: "Full system access including role assignment",
				isSystem: true,
			},
		])
		.onConflictDoNothing()
}

async function seedPermissions() {
	await seedRoles()
	const perms: { roleId: string; resource: string; action: string }[] = []
	for (const [roleKey, roleObj] of Object.entries(roles)) {
		for (const [resource, actions] of Object.entries(resourceActions)) {
			for (const action of actions as readonly string[]) {
				const result = roleObj.authorize({ [resource]: [action] } as Parameters<
					typeof roleObj.authorize
				>[0])
				if (result.success) {
					perms.push({ roleId: roleKey, resource, action })
				}
			}
		}
	}
	if (perms.length > 0) {
		await db.insert(schema.rolePermission).values(perms).onConflictDoNothing()
	}
}

// ─── Router ───────────────────────────────────────────────────────────────

const router = {
	health: publicProcedure.handler(() => ({ status: "ok" as const })),

	me: protectedProcedure.handler(({ context }) => ({
		user: context.session.user,
	})),

	admin: {
		listUsers: adminProcedure.handler(async ({ context }) => {
			const result = await auth.api.listUsers({
				headers: context.headers,
				query: { limit: 100 },
			})
			return result
		}),

		banUser: adminProcedure
			.input(banUserSchema)
			.handler(async ({ input, context }) => {
				assertNotSelf(context, input.userId, "ban")
				await assertOutranksTarget(context, input.userId)
				await auth.api.banUser({
					body: { userId: input.userId, banReason: input.banReason },
					headers: context.headers,
				})
				return { success: true }
			}),

		unbanUser: adminProcedure
			.input(unbanUserSchema)
			.handler(async ({ input, context }) => {
				await assertOutranksTarget(context, input.userId)
				await auth.api.unbanUser({
					body: { userId: input.userId },
					headers: context.headers,
				})
				return { success: true }
			}),

		setRole: superAdminProcedure
			.input(setRoleSchema)
			.handler(async ({ input, context }) => {
				assertNotSelf(context, input.userId, "change the role of")
				await auth.api.setRole({
					body: { userId: input.userId, role: input.role },
					headers: context.headers,
				})
				return { success: true }
			}),

		createUser: adminProcedure
			.input(createUserSchema)
			.handler(async ({ input, context }) => {
				const callerRole = context.session.user.role as AppRole
				// Admins can only create regular users; only super-admins can elevate
				if (callerRole !== "super-admin" && input.role !== "user") {
					throw new ORPCError("FORBIDDEN", {
						message: "Admins can only create users with the 'user' role",
					})
				}
				const result = await auth.api.createUser({
					body: {
						name: input.name,
						email: input.email,
						password: input.password,
						role: input.role,
					},
					headers: context.headers,
				})
				return result
			}),

		updateUser: adminProcedure
			.input(updateUserSchema)
			.handler(async ({ input, context }) => {
				assertNotSelf(context, input.userId, "update via admin panel — use your profile page instead")
				await assertOutranksTarget(context, input.userId)
				const { userId, ...data } = input
				await auth.api.adminUpdateUser({
					body: { userId, data },
					headers: context.headers,
				})
				return { success: true }
			}),

		deleteUser: superAdminProcedure
			.input(deleteUserSchema)
			.handler(async ({ input, context }) => {
				assertNotSelf(context, input.userId, "delete")
				// No rank check needed: super-admin procedure already restricts to top rank
				await auth.api.removeUser({
					body: { userId: input.userId },
					headers: context.headers,
				})
				return { success: true }
			}),

		// ── Role CRUD ────────────────────────────────────────────────────────

		listRoles: adminProcedure.handler(async () => {
			let appRoles = await db
				.select()
				.from(schema.appRole)
				.orderBy(schema.appRole.createdAt)
			if (appRoles.length === 0) {
				await seedRoles()
				appRoles = await db
					.select()
					.from(schema.appRole)
					.orderBy(schema.appRole.createdAt)
			}
			return { roles: appRoles }
		}),

		createRole: superAdminProcedure
			.input(createRoleSchema)
			.handler(async ({ input }) => {
				const existing = await db
					.select()
					.from(schema.appRole)
					.where(eq(schema.appRole.id, input.id))
				if (existing.length > 0) {
					throw new ORPCError("CONFLICT", {
						message: `A role with ID "${input.id}" already exists`,
					})
				}
				await db.insert(schema.appRole).values({
					id: input.id,
					label: input.label,
					description: input.description,
					isSystem: false,
				})
				return { success: true }
			}),

		updateRole: superAdminProcedure
			.input(updateRoleSchema)
			.handler(async ({ input }) => {
				const { id, ...data } = input
				await db
					.update(schema.appRole)
					.set(data)
					.where(eq(schema.appRole.id, id))
				return { success: true }
			}),

		deleteRole: superAdminProcedure
			.input(deleteRoleSchema)
			.handler(async ({ input }) => {
				const found = await db
					.select()
					.from(schema.appRole)
					.where(eq(schema.appRole.id, input.id))
					.then((r) => r[0])
				if (!found) {
					throw new ORPCError("NOT_FOUND", { message: "Role not found" })
				}
				if (found.isSystem) {
					throw new ORPCError("FORBIDDEN", {
						message: "System roles cannot be deleted",
					})
				}
				await db.delete(schema.appRole).where(eq(schema.appRole.id, input.id))
				return { success: true }
			}),

		// ── Permission CRUD ──────────────────────────────────────────────────

		listRolePermissions: adminProcedure.handler(async () => {
			let perms = await db.select().from(schema.rolePermission)
			if (perms.length === 0) {
				await seedPermissions()
				perms = await db.select().from(schema.rolePermission)
			}
			return { permissions: perms }
		}),

		setRolePermission: superAdminProcedure
			.input(setRolePermissionSchema)
			.handler(async ({ input }) => {
				if (input.granted) {
					await db
						.insert(schema.rolePermission)
						.values({
							roleId: input.roleId,
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
								eq(schema.rolePermission.resource, input.resource),
								eq(schema.rolePermission.action, input.action),
							),
						)
				}
				return { success: true }
			}),
	},
}

export default router
