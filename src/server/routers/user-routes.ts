import { ORPCError } from "@orpc/server"
import { and, eq } from "drizzle-orm"

import { auth } from "#/server/auth"
import { logActivity } from "#/server/activity"
import { cacheDel } from "#/libs/redis"
import { db } from "#/libs/drizzle"
import * as schema from "#/libs/drizzle/schema"
import {
	adminProcedure,
	ownerProcedure,
} from "#/server/orpc/middleware"
import {
	banUserSchema,
	createUserSchema,
	deleteUserSchema,
	setRoleSchema,
	unbanUserSchema,
	updateUserSchema,
} from "#/server/orpc/schema"
import { assertNotSelf, assertOutranksTarget } from "./helpers"

export const listUsers = adminProcedure.handler(async ({ context }) => {
	const activeOrgId = context.session.session?.activeOrganizationId
	if (!activeOrgId) {
		throw new ORPCError("BAD_REQUEST", { message: "No active organization" })
	}
	const orgMembers = await db
		.select({
			id: schema.user.id,
			name: schema.user.name,
			email: schema.user.email,
			role: schema.member.role,
			banned: schema.user.banned,
			createdAt: schema.member.createdAt,
		})
		.from(schema.member)
		.innerJoin(schema.user, eq(schema.member.userId, schema.user.id))
		.where(eq(schema.member.organizationId, activeOrgId))
	return { users: orgMembers }
})

export const banUser = adminProcedure
	.input(banUserSchema)
	.handler(async ({ input, context }) => {
		assertNotSelf(context, input.userId, "ban")
		const activeOrgId = context.session.session?.activeOrganizationId
		if (!activeOrgId) {
			throw new ORPCError("BAD_REQUEST", { message: "No active organization" })
		}
		await assertOutranksTarget(context.orgRole, input.userId, activeOrgId)
		await auth.api.banUser({
			body: { userId: input.userId, banReason: input.banReason },
			headers: context.headers,
		})
		await logActivity({
			userId: context.session.user.id,
			organizationId: activeOrgId,
			action: "ban",
			resource: "user",
			resourceId: input.userId,
			metadata: { banReason: input.banReason },
		})
		return { success: true }
	})

export const unbanUser = adminProcedure
	.input(unbanUserSchema)
	.handler(async ({ input, context }) => {
		const activeOrgId = context.session.session?.activeOrganizationId
		if (!activeOrgId) {
			throw new ORPCError("BAD_REQUEST", { message: "No active organization" })
		}
		await assertOutranksTarget(context.orgRole, input.userId, activeOrgId)
		await auth.api.unbanUser({
			body: { userId: input.userId },
			headers: context.headers,
		})
		await logActivity({
			userId: context.session.user.id,
			organizationId: activeOrgId,
			action: "unban",
			resource: "user",
			resourceId: input.userId,
		})
		return { success: true }
	})

export const setRole = ownerProcedure
	.input(setRoleSchema)
	.handler(async ({ input, context }) => {
		assertNotSelf(context, input.userId, "change the role of")
		const activeOrgId = context.session.session?.activeOrganizationId
		if (!activeOrgId) {
			throw new ORPCError("BAD_REQUEST", { message: "No active organization" })
		}
		await assertOutranksTarget(context.orgRole, input.userId, activeOrgId)
		await db
			.update(schema.member)
			.set({ role: input.role })
			.where(
				and(
					eq(schema.member.userId, input.userId),
					eq(schema.member.organizationId, activeOrgId),
				),
			)
		await cacheDel(`member:role:${input.userId}:${activeOrgId}`)
		await logActivity({
			userId: context.session.user.id,
			organizationId: activeOrgId,
			action: "set-role",
			resource: "user",
			resourceId: input.userId,
			metadata: { role: input.role },
		})
		return { success: true }
	})

export const createUser = adminProcedure
	.input(createUserSchema)
	.handler(async ({ input, context }) => {
		if (context.orgRole !== "owner" && input.role !== "member") {
			throw new ORPCError("FORBIDDEN", {
				message: "Admins can only create users with the 'member' role",
			})
		}
		const activeOrgId = context.session.session?.activeOrganizationId
		if (!activeOrgId) {
			throw new ORPCError("BAD_REQUEST", { message: "No active organization" })
		}
		const result = await auth.api.createUser({
			body: {
				name: input.name,
				email: input.email,
				password: input.password,
			},
			headers: context.headers,
		})
		const newUserId = (result as { user?: { id?: string } })?.user?.id
		if (newUserId) {
			await db.insert(schema.member).values({
				id: crypto.randomUUID(),
				organizationId: activeOrgId,
				userId: newUserId,
				role: input.role,
			})
			await cacheDel(`user:default-org:${newUserId}`)
		}
		await logActivity({
			userId: context.session.user.id,
			organizationId: activeOrgId,
			action: "create",
			resource: "user",
			resourceId: newUserId,
			metadata: { email: input.email, role: input.role },
		})
		return result
	})

export const updateUser = adminProcedure
	.input(updateUserSchema)
	.handler(async ({ input, context }) => {
		assertNotSelf(context, input.userId, "update via admin panel — use your profile page instead")
		const activeOrgId = context.session.session?.activeOrganizationId
		if (!activeOrgId) {
			throw new ORPCError("BAD_REQUEST", { message: "No active organization" })
		}
		await assertOutranksTarget(context.orgRole, input.userId, activeOrgId)
		const { userId, ...data } = input
		await auth.api.adminUpdateUser({
			body: { userId, data },
			headers: context.headers,
		})
		await logActivity({
			userId: context.session.user.id,
			organizationId: activeOrgId,
			action: "update",
			resource: "user",
			resourceId: input.userId,
			metadata: data,
		})
		return { success: true }
	})

export const deleteUser = ownerProcedure
	.input(deleteUserSchema)
	.handler(async ({ input, context }) => {
		assertNotSelf(context, input.userId, "delete")
		await auth.api.removeUser({
			body: { userId: input.userId },
			headers: context.headers,
		})
		await logActivity({
			userId: context.session.user.id,
			organizationId: context.session.session?.activeOrganizationId,
			action: "delete",
			resource: "user",
			resourceId: input.userId,
		})
		return { success: true }
	})
