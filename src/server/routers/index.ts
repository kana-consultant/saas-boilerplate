import { adminProcedure, protectedProcedure, publicProcedure } from "#/server/orpc/middleware"

const router = {
	health: publicProcedure.handler(() => ({ status: "ok" as const })),

	me: protectedProcedure.handler(({ context }) => ({
		user: context.session.user,
	})),

	admin: {
		listUsers: adminProcedure.handler(({ context }) => ({
			// Delegate to better-auth admin API for production use
			// Example: return auth.api.listUsers({ headers: context.headers })
			message: "admin endpoint — wire better-auth admin API here",
		})),
	},
}

export default router
