import { authClient } from "#/server/auth/client"

import type { AppRole } from "#/server/auth/permissions"
import { roles } from "#/server/auth/permissions"

export const useHasPermission = (
	resource: keyof (typeof roles)["user"]["statements"],
	actions: string[],
): boolean => {
	const { data: session } = authClient.useSession()
	if (!session?.user?.role) return false

	const role = session.user.role as AppRole
	const roleObj = roles[role]
	if (!roleObj) return false

	return roleObj.authorize({ [resource]: actions } as Parameters<
		typeof roleObj.authorize
	>[0]).success
}
