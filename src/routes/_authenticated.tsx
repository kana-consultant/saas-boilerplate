import { Outlet, createFileRoute, redirect } from "@tanstack/react-router"

export const Route = createFileRoute("/_authenticated")({
	beforeLoad: async ({ context }) => {
		if (!context.session) {
			throw redirect({ to: "/auth/login" })
		}
	},
	component: AuthenticatedLayout,
})

const AuthenticatedLayout = () => <Outlet />
