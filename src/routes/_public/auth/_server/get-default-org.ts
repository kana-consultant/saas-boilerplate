import { createServerFn } from "@tanstack/react-start"
import { getRequestHeaders } from "@tanstack/react-start/server"
import { eq } from "drizzle-orm"

import { auth } from "#/server/auth"
import { db } from "#/libs/drizzle"
import { organization, member } from "#/libs/drizzle/schema"
import { cacheGet, cacheSet } from "#/libs/redis"

const DEFAULT_ORG_TTL = 300

export const getDefaultOrgFn = createServerFn({ method: "GET" }).handler(async () => {
	const headers = getRequestHeaders()
	const session = await auth.api.getSession({ headers })
	if (!session?.user) return null

	const cacheKey = `user:default-org:${session.user.id}`
	const cached = await cacheGet<string>(cacheKey)
	if (cached) return cached

	// Prefer active org from session
	const activeOrgId = session.session?.activeOrganizationId as string | null | undefined
	if (activeOrgId) {
		const org = await db
			.select({ slug: organization.slug, id: organization.id })
			.from(organization)
			.where(eq(organization.id, activeOrgId))
			.then((r) => r[0] ?? null)
		if (org) {
			const slug = org.slug ?? org.id
			await cacheSet(cacheKey, slug, DEFAULT_ORG_TTL)
			return slug
		}
	}

	// Fallback: first membership
	const first = await db
		.select({ slug: organization.slug, id: organization.id })
		.from(organization)
		.innerJoin(member, eq(member.organizationId, organization.id))
		.where(eq(member.userId, session.user.id))
		.limit(1)
		.then((r) => r[0] ?? null)

	const slug = first ? (first.slug ?? first.id) : null
	if (slug) await cacheSet(cacheKey, slug, DEFAULT_ORG_TTL)
	return slug
})
