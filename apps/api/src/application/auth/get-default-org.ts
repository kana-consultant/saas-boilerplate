import type { OrganizationRepository } from "#/domain/organization/organization-repository.ts"
import type { Cache } from "#/domain/ports/cache.ts"
import type { OptionalAuthContext } from "../shared/context.ts"

const DEFAULT_ORG_TTL = 300

export interface GetDefaultOrgDeps {
	orgRepo: OrganizationRepository
	cache: Cache
}

export function makeGetDefaultOrg(deps: GetDefaultOrgDeps) {
	return async (ctx: OptionalAuthContext) => {
		if (!ctx.session?.user) return null

		const cacheKey = `user:default-org:${ctx.session.user.id}`
		const cached = await deps.cache.get<string>(cacheKey)
		if (cached) return cached

		const activeOrgId = ctx.session.session?.activeOrganizationId
		if (activeOrgId) {
			const org = await deps.orgRepo.findById(activeOrgId)
			if (org) {
				const slug = org.slug ?? org.id
				await deps.cache.set(cacheKey, slug, DEFAULT_ORG_TTL)
				return slug
			}
		}

		const first = await deps.orgRepo.findFirstForUser(ctx.session.user.id)
		const slug = first ? (first.slug ?? first.id) : null
		if (slug) await deps.cache.set(cacheKey, slug, DEFAULT_ORG_TTL)
		return slug
	}
}
