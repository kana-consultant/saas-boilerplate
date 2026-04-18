import type {
	AppRole,
	Resource,
} from "#/domain/role/permissions.ts"
import { hasPermission } from "#/domain/role/permissions.ts"
import type {
	PermissionRepository,
	RoleRepository,
} from "#/domain/role/role-repository.ts"
import type { Cache } from "#/domain/ports/cache.ts"
import type { makeSeedPermissions } from "./seed-permissions.ts"

export interface CheckPermissionDeps {
	permRepo: PermissionRepository
	roleRepo: RoleRepository
	cache: Cache
	seedPermissions: ReturnType<typeof makeSeedPermissions>
}

const cacheKey = (orgId: string) => `org:${orgId}:perms`
const CACHE_TTL_SECONDS = 300

type PermRow = { roleId: string; resource: string; action: string }

async function loadPermissions(
	deps: CheckPermissionDeps,
	orgId: string,
): Promise<PermRow[] | null> {
	const cached = await deps.cache.get<PermRow[]>(cacheKey(orgId))
	if (cached) return cached
	let rows = await deps.permRepo.listByOrg(orgId)
	if (rows.length === 0) {
		await deps.seedPermissions(orgId)
		rows = await deps.permRepo.listByOrg(orgId)
	}
	if (rows.length === 0) return null
	const compact: PermRow[] = rows.map((r) => ({
		roleId: r.roleId,
		resource: r.resource,
		action: r.action,
	}))
	await deps.cache.set(cacheKey(orgId), compact, CACHE_TTL_SECONDS)
	return compact
}

export function makeCheckPermission(deps: CheckPermissionDeps) {
	return async (
		organizationId: string,
		role: AppRole,
		resource: Resource,
		actions: string[],
	): Promise<boolean> => {
		const perms = await loadPermissions(deps, organizationId)
		if (!perms) return hasPermission(role, resource, actions)
		return actions.every((action) =>
			perms.some(
				(p) => p.roleId === role && p.resource === resource && p.action === action,
			),
		)
	}
}

export function invalidatePermissionsCache(cache: Cache, orgId: string) {
	return cache.del(cacheKey(orgId))
}
