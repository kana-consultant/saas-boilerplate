import { eq } from "drizzle-orm"

import type { OrganizationRepository } from "#/domain/organization/organization-repository.ts"
import type { Db } from "../client.ts"
import * as schema from "../schema.ts"

export function createOrganizationRepository(db: Db): OrganizationRepository {
	return {
		async findById(id) {
			return (
				(await db
					.select()
					.from(schema.organization)
					.where(eq(schema.organization.id, id))
					.then((r) => r[0])) ?? null
			)
		},

		async findBySlug(slug) {
			return (
				(await db
					.select()
					.from(schema.organization)
					.where(eq(schema.organization.slug, slug))
					.then((r) => r[0])) ?? null
			)
		},

		async findFirstForUser(userId) {
			return (
				(await db
					.select({
						id: schema.organization.id,
						slug: schema.organization.slug,
					})
					.from(schema.organization)
					.innerJoin(
						schema.member,
						eq(schema.member.organizationId, schema.organization.id),
					)
					.where(eq(schema.member.userId, userId))
					.limit(1)
					.then((r) => r[0])) ?? null
			)
		},

		async create(input) {
			await db.insert(schema.organization).values({
				id: input.id,
				name: input.name,
				slug: input.slug,
				createdAt: input.createdAt ?? new Date(),
			})
		},
	}
}
