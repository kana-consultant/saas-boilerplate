import { adminClient, organizationClient } from "better-auth/client/plugins"
import { createAuthClient } from "better-auth/react"

import { ac, roles } from "#/libs/auth/permissions"

const API_BASE =
	import.meta.env.VITE_API_URL ||
	(typeof window !== "undefined" ? window.location.origin : "")

export const authClient = createAuthClient({
	baseURL: `${API_BASE}/auth`,
	fetchOptions: {
		credentials: "include",
	},
	plugins: [
		adminClient({
			ac,
			roles,
		}),
		organizationClient(),
	],
})

export type AuthSession = typeof authClient.$Infer.Session
