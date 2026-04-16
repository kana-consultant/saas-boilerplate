import type { AppRole } from "#/domain/role/permissions.ts"
import type { Session } from "#/domain/session/session.ts"

// Present on protected use cases — session is guaranteed non-null.
export interface AuthedContext {
	session: Session
	orgRole: AppRole | null
	headers: Headers
}

// For public/optional-auth use cases (e.g. getSession itself).
export interface OptionalAuthContext {
	session: Session | null
	orgRole: AppRole | null
	headers: Headers
}

export function requireActiveOrg(ctx: AuthedContext): string {
	const activeOrgId = ctx.session.session?.activeOrganizationId
	if (!activeOrgId) {
		throw new Error("No active organization")
	}
	return activeOrgId
}
