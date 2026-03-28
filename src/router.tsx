import { createRouter as createTanStackRouter } from "@tanstack/react-router"

import { routeTree } from "./routeTree.gen"
import { getQueryClient } from "#/libs/tanstack-query"

export const getRouter = () => {
	const router = createTanStackRouter({
		routeTree,
		context: {
			queryClient: getQueryClient(),
			session: null,
		},
		scrollRestoration: true,
		defaultPreload: "intent",
		defaultPreloadStaleTime: 0,
	})

	return router
}

declare module "@tanstack/react-router" {
	interface Register {
		router: ReturnType<typeof getRouter>
	}
}
