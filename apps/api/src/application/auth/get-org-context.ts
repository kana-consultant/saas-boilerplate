import type { MemberRepository } from "#/domain/member/member-repository.ts"
import type { OrganizationRepository } from "#/domain/organization/organization-repository.ts"
import type { Cache } from "#/domain/ports/cache.ts"
import type { Organization } from "#/domain/organization/organization.ts"
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
		const [, org] = await Promise.all([
			Promise.resolve(ctx.session),
			(async () => {
				const cached = await deps.cache.get<Organization>(cacheKey)
				if (cached) return cached
				const row = await deps.orgRepo.findBySlug(input.orgSlug)
				if (row) await deps.cache.set(cacheKey, row, ORG_TTL)
				return row
			})(),
		])

		if (!ctx.session?.user) return null

		if (!org) {
			const firstOrg = await deps.orgRepo.findFirstForUser(ctx.session.user.id)
			return {
				org: null,
				orgRole: null,
				redirectSlug: firstOrg?.slug ?? firstOrg?.id ?? null,
			}
		}

		if (ctx.session.user.role === PLATFORM_SUPER_ADMIN) {
			return { org, orgRole: "owner", redirectSlug: null }
		}

		const roleKey = `member:role:${ctx.session.user.id}:${org.id}`
		const cachedRole = await deps.cache.get<AppRole>(roleKey)
		let orgRole: AppRole | null = cachedRole
		if (!cachedRole) {
			orgRole = await deps.memberRepo.findRole(ctx.session.user.id, org.id)
			if (orgRole) await deps.cache.set(roleKey, orgRole, ROLE_TTL)
		}

		return { org, orgRole, redirectSlug: null }
	}
}
