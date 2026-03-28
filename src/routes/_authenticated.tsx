import { Outlet, createFileRoute, redirect } from "@tanstack/react-router"

import { listOrganizationsFn } from "#/routes/_public/auth/_server/list-organizations"

function AuthenticatedLayout() {
	return <Outlet />
}

export const Route = createFileRoute("/_authenticated")({
	beforeLoad: async ({ context, location }) => {
		if (!context.session) {
			throw redirect({ to: "/auth/login" })
		}

		const exemptPaths = ["/org/create", "/org/accept-invitation"]
		const isExempt = exemptPaths.some((p) => location.pathname.startsWith(p))

		if (!isExempt) {
			const orgs = await listOrganizationsFn()
			if (!orgs || orgs.length === 0) {
				throw redirect({ to: "/org/create" })
			}
		}
	},
	component: AuthenticatedLayout,
})
