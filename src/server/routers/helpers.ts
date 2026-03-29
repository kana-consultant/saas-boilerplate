import { ORPCError } from "@orpc/server"
import { and, eq } from "drizzle-orm"

import type { AppRole } from "#/server/auth/permissions"
import { resourceActions, roles } from "#/server/auth/permissions"
import { db } from "#/libs/drizzle"
import * as schema from "#/libs/drizzle/schema"

export const ROLE_RANK: Record<string, number> = {
	member: 0,
	admin: 1,
	owner: 2,
}

export function assertNotSelf(
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

export async function assertOutranksTarget(
	callerOrgRole: AppRole | null,
	targetUserId: string,
	activeOrgId: string,
) {
	const targetMember = await db
		.select({ role: schema.member.role })
		.from(schema.member)
		.where(
			and(
				eq(schema.member.userId, targetUserId),
				eq(schema.member.organizationId, activeOrgId),
			),
		)
		.then((r) => r[0])

	const targetRole = targetMember?.role ?? "member"
	const callerRole = callerOrgRole ?? "member"

	if ((ROLE_RANK[callerRole] ?? 0) <= (ROLE_RANK[targetRole] ?? 0)) {
		throw new ORPCError("FORBIDDEN", {
			message: "Cannot perform this action on a user with equal or higher privileges",
		})
	}
}

export async function seedRoles(organizationId: string) {
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
}

export async function seedPermissions(organizationId: string) {
	await seedRoles(organizationId)
	const perms: { roleId: string; organizationId: string; resource: string; action: string }[] = []
	for (const [roleKey, roleObj] of Object.entries(roles)) {
		for (const [resource, actions] of Object.entries(resourceActions)) {
			for (const action of actions as readonly string[]) {
				const result = roleObj.authorize({ [resource]: [action] } as Parameters<
					typeof roleObj.authorize
				>[0])
				if (result.success) {
					perms.push({ roleId: roleKey, organizationId, resource, action })
				}
			}
		}
	}
	if (perms.length > 0) {
		await db.insert(schema.rolePermission).values(perms).onConflictDoNothing()
	}
}
