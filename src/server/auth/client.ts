import { createAuthClient } from "better-auth/react"
import { adminClient } from "better-auth/client/plugins"

import { ac, roles } from "#/server/auth/permissions"

export const authClient = createAuthClient({
	plugins: [
		adminClient({
			ac,
			roles,
		}),
	],
})

export type AuthSession = typeof authClient.$Infer.Session
