import type { UserRepository } from "#/domain/user/user-repository.ts"
import type { AuthedContext } from "../shared/context.ts"
import { requireActiveOrg } from "../shared/context.ts"

export interface ListUsersDeps {
	userRepo: UserRepository
}

export function makeListUsers(deps: ListUsersDeps) {
	return async (ctx: AuthedContext) => {
		const activeOrgId = requireActiveOrg(ctx)
		const users = await deps.userRepo.listOrgMembers(activeOrgId)
		return { users }
	}
}
