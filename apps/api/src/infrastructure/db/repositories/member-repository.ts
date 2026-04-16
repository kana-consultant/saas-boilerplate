import { and, eq } from "drizzle-orm"

import type { MemberRepository } from "#/domain/member/member-repository.ts"
import type { AppRole } from "#/domain/role/permissions.ts"
import type { Db } from "../client.ts"
import * as schema from "../schema.ts"

export function createMemberRepository(db: Db): MemberRepository {
	return {
		async findRole(userId, organizationId) {
			const row = await db
				.select({ role: schema.member.role })
				.from(schema.member)
				.where(
					and(
						eq(schema.member.userId, userId),
						eq(schema.member.organizationId, organizationId),
					),
				)
				.then((r) => r[0])
			return (row?.role as AppRole | undefined) ?? null
		},

		async insert(input) {
			await db.insert(schema.member).values({
				id: input.id,
				userId: input.userId,
				organizationId: input.organizationId,
				role: input.role,
				createdAt: input.createdAt ?? new Date(),
			})
		},

		async updateRole(userId, organizationId, role) {
			await db
				.update(schema.member)
				.set({ role })
				.where(
					and(
						eq(schema.member.userId, userId),
						eq(schema.member.organizationId, organizationId),
					),
				)
		},
	}
}
