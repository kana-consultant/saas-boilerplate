import { createFileRoute, redirect } from "@tanstack/react-router"

import { client } from "#/libs/orpc/client"

export const Route = createFileRoute("/")({
	beforeLoad: async ({ context }) => {
		if (!context.session) {
			throw redirect({ to: "/auth/login" })
		}
		const slug = await client.auth.getDefaultOrg()
		if (!slug) throw redirect({ to: "/org/create" })
		throw redirect({ to: "/$orgSlug/dashboard", params: { orgSlug: slug } })
	},
})
