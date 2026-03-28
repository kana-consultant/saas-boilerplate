import type { Session } from "#/server/auth"

export interface ORPCContext {
	headers: Headers
	session: Session | null
}
