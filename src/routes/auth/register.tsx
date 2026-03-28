import { createFileRoute, redirect } from "@tanstack/react-router"

import { AuthSidebar } from "./_components/auth-sidebar"
import { RegisterForm } from "./_components/register-form"

export const Route = createFileRoute("/auth/register")({
	beforeLoad: async ({ context }) => {
		if (context.session) {
			throw redirect({ to: "/" })
		}
	},
	component: RegisterPage,
})

const RegisterPage = () => (
	<div className="grid h-svh lg:grid-cols-2">
		<AuthSidebar />
		<div className="bg-background flex items-center justify-center p-8">
			<RegisterForm />
		</div>
	</div>
)
