import { eq } from "drizzle-orm"

import type { UserRepository } from "#/domain/user/user-repository.ts"
import type { Db } from "../client.ts"
import * as schema from "../schema.ts"

export function createUserRepository(db: Db): UserRepository {
	return {
		async listOrgMembers(organizationId) {
			const rows = await db
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
				.where(eq(schema.member.organizationId, organizationId))
			return rows
		},
	}
}
