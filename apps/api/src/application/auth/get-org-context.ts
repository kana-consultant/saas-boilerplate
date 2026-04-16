import { match, P } from "ts-pattern"

import type { MemberRepository } from "#/domain/member/member-repository.ts"
import type { Organization } from "#/domain/organization/organization.ts"
import type { OrganizationRepository } from "#/domain/organization/organization-repository.ts"
import type { Cache } from "#/domain/ports/cache.ts"
import type { AppRole } from "#/domain/role/permissions.ts"
import { PLATFORM_SUPER_ADMIN } from "#/domain/role/permissions.ts"
import type { OptionalAuthContext } from "../shared/context.ts"

const ORG_TTL = 300
const ROLE_TTL = 60

export interface GetOrgContextInput {
	orgSlug: string
}

export interface GetOrgContextDeps {
	orgRepo: OrganizationRepository
	memberRepo: MemberRepository
	cache: Cache
}

export interface OrgContextResult {
	org: Organization | null
	orgRole: AppRole | "owner" | null
	redirectSlug: string | null
}

export function makeGetOrgContext(deps: GetOrgContextDeps) {
	return async (
		input: GetOrgContextInput,
		ctx: OptionalAuthContext,
	): Promise<OrgContextResult | null> => {
		const cacheKey = `org:slug:${input.orgSlug}`
		const org = await (async () => {
			const cached = await deps.cache.get<Organization>(cacheKey)
			if (cached) return cached
			const row = await deps.orgRepo.findBySlug(input.orgSlug)
			if (row) await deps.cache.set(cacheKey, row, ORG_TTL)
			return row
		})()

		return match({ session: ctx.session, org })
			.returnType<Promise<OrgContextResult | null>>()
			.with({ session: null }, async () => null)
			.with({ session: P.nonNullable, org: null }, async ({ session }) => {
				const firstOrg = await deps.orgRepo.findFirstForUser(session.user.id)
				return {
					org: null,
					orgRole: null,
					redirectSlug: firstOrg?.slug ?? firstOrg?.id ?? null,
				}
			})
			.with(
				{
					session: { user: { role: PLATFORM_SUPER_ADMIN } },
					org: P.nonNullable,
				},
				async ({ org: matchedOrg }) => ({
					org: matchedOrg,
					orgRole: "owner" as const,
					redirectSlug: null,
				}),
			)
			.with(
				{ session: P.nonNullable, org: P.nonNullable },
				async ({ session, org: matchedOrg }) => {
					const roleKey = `member:role:${session.user.id}:${matchedOrg.id}`
					const cachedRole = await deps.cache.get<AppRole>(roleKey)
					const orgRole =
						cachedRole ??
						(await (async () => {
							const r = await deps.memberRepo.findRole(
								session.user.id,
								matchedOrg.id,
							)
							if (r) await deps.cache.set(roleKey, r, ROLE_TTL)
							return r
						})())
					return { org: matchedOrg, orgRole, redirectSlug: null }
				},
			)
			.otherwise(async () => null)
	}
}
