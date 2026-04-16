import type { UseCases } from "#/application/use-cases.ts"
import type { AppRole } from "#/domain/role/permissions.ts"
import type { Session } from "#/domain/session/session.ts"

export interface ORPCContext {
	headers: Headers
	session: Session | null
	orgRole: AppRole | null
	useCases: UseCases
}
