import type { AppRole } from "#/domain/role/permissions.ts"
import type { Session } from "#/domain/session/session.ts"
import type { UseCases } from "#/application/use-cases.ts"

export interface ORPCContext {
	headers: Headers
	session: Session | null
	orgRole: AppRole | null
	useCases: UseCases
}
