import type { Organization } from "../organization/organization.ts"
import type { Session } from "../session/session.ts"

export interface AdminContext {
	headers: Headers
}

export interface CreateUserInput {
	name: string
	email: string
	password: string
	role?: string
}

export interface CreatedUser {
	id: string
	email: string
}

export interface AuthService {
	// Session / org lookups (read-only, pulls caller session from headers)
	getSession(headers: Headers): Promise<Session | null>
	listOrganizations(headers: Headers): Promise<Organization[]>

	// Admin ops — caller must have already been authorized by the use case.
	// Headers are still required because better-auth re-validates the admin
	// session server-side before performing the mutation.
	createUser(input: CreateUserInput, ctx: AdminContext): Promise<CreatedUser>
	banUser(userId: string, reason: string | undefined, ctx: AdminContext): Promise<void>
	unbanUser(userId: string, ctx: AdminContext): Promise<void>
	updateUser(
		userId: string,
		data: { name?: string; email?: string },
		ctx: AdminContext,
	): Promise<void>
	removeUser(userId: string, ctx: AdminContext): Promise<void>

	// Raw HTTP handler for /auth/* mount
	handler(request: Request): Promise<Response>
}
