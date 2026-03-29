import { createServerFn } from "@tanstack/react-start"
import { getRequestHeaders } from "@tanstack/react-start/server"
import { and, eq } from "drizzle-orm"
import { z } from "zod"

import { auth } from "#/server/auth"
import { PLATFORM_SUPER_ADMIN } from "#/server/auth/permissions"
import { db } from "#/libs/drizzle"
import { organization, member } from "#/libs/drizzle/schema"
import { cacheGet, cacheSet } from "#/libs/redis"

// Org metadata rarely changes — cache for 5 minutes
const ORG_TTL = 300
// Member role can change — cache for 60 seconds
const ROLE_TTL = 60

export const getOrgContextFn = createServerFn({ method: "GET" })
	.inputValidator(z.object({ orgSlug: z.string() }))
	.handler(async (ctx) => {
		const headers = getRequestHeaders()

		// Fetch session + org in parallel
		const [session, org] = await Promise.all([
			auth.api.getSession({ headers }),
			(async () => {
				const cacheKey = `org:slug:${ctx.data.orgSlug}`
				const cached = await cacheGet<typeof import("#/libs/drizzle/schema").organization.$inferSelect>(cacheKey)
				if (cached) return cached
				const row = await db
					.select()
					.from(organization)
					.where(eq(organization.slug, ctx.data.orgSlug))
					.then((r) => r[0] ?? null)
				if (row) await cacheSet(cacheKey, row, ORG_TTL)
				return row
			})(),
		])

		if (!session?.user) return null

		if (!org) {
			const firstOrg = await db
				.select({ slug: organization.slug, id: organization.id })
				.from(organization)
				.innerJoin(member, eq(member.organizationId, organization.id))
				.where(eq(member.userId, session.user.id))
				.limit(1)
				.then((r) => r[0] ?? null)
			return { org: null, orgRole: null, redirectSlug: firstOrg?.slug ?? firstOrg?.id ?? null }
		}

		if (session.user.role === PLATFORM_SUPER_ADMIN) {
			return { org, orgRole: "owner" as string, redirectSlug: null }
		}

		const roleKey = `member:role:${session.user.id}:${org.id}`
		const cachedRole = await cacheGet<string>(roleKey)
		const orgRole = cachedRole ?? await (async () => {
			const m = await db
				.select({ role: member.role })
				.from(member)
				.where(and(eq(member.userId, session.user.id), eq(member.organizationId, org.id)))
				.then((r) => r[0] ?? null)
			const role = m?.role ?? null
			if (role) await cacheSet(roleKey, role, ROLE_TTL)
			return role
		})()

		return { org, orgRole, redirectSlug: null }
	})
