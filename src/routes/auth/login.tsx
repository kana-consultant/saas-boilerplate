import { createFileRoute, redirect } from "@tanstack/react-router"

import { AuthSidebar } from "./_components/auth-sidebar"
import { LoginForm } from "./_components/login-form"

export const Route = createFileRoute("/auth/login")({
	beforeLoad: async ({ context }) => {
		if (context.session) {
			throw redirect({ to: "/" })
		}
	},
	component: LoginPage,
})

const LoginPage = () => (
	<div className="grid h-svh lg:grid-cols-2">
		<AuthSidebar />
		<div className="bg-background flex items-center justify-center p-8">
			<LoginForm />
		</div>
	</div>
)
