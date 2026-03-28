import "#/polyfill"

import { RPCHandler } from "@orpc/server/fetch"
import { createFileRoute } from "@tanstack/react-router"

import { auth } from "#/server/auth"
import router from "#/server/routers"

const handler = new RPCHandler(router)

const handle = async ({ request }: { request: Request }): Promise<Response> => {
	const session = await auth.api.getSession({ headers: request.headers })
	const { response } = await handler.handle(request, {
		prefix: "/api/rpc",
		context: { headers: request.headers, session },
	})

	return response ?? new Response("Not Found", { status: 404 })
}

export const Route = createFileRoute("/api/rpc/$")({
	server: {
		handlers: {
			HEAD: handle,
			GET: handle,
			POST: handle,
			PUT: handle,
			PATCH: handle,
			DELETE: handle,
		},
	},
})
