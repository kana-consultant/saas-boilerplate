import type { AuthService } from "#/domain/ports/auth-service.ts"

export interface ListOrganizationsDeps {
	auth: AuthService
}

export function makeListOrganizations(deps: ListOrganizationsDeps) {
	return (headers: Headers) => deps.auth.listOrganizations(headers)
}
