import { createFileRoute, redirect } from "@tanstack/react-router"

import { getDefaultOrgFn } from "#/routes/_public/auth/_server/get-default-org"

export const Route = createFileRoute("/")({
	beforeLoad: async ({ context }) => {
		if (!context.session) {
			throw redirect({ to: "/auth/login" })
		}
		const slug = await getDefaultOrgFn()
		if (!slug) throw redirect({ to: "/org/create" })
		throw redirect({ to: "/$orgSlug/dashboard", params: { orgSlug: slug } })
	},
})
