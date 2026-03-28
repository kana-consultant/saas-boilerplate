import "#/polyfill"

import { OpenAPIHandler } from "@orpc/openapi/fetch"
import { ZodToJsonSchemaConverter } from "@orpc/zod/zod4"
import { SmartCoercionPlugin } from "@orpc/json-schema"
import { createFileRoute } from "@tanstack/react-router"
import { onError } from "@orpc/server"
import { OpenAPIReferencePlugin } from "@orpc/openapi/plugins"

import { auth } from "#/server/auth"
import router from "#/server/routers"

const handler = new OpenAPIHandler(router, {
	interceptors: [
		onError((error) => {
			console.error(error)
		}),
	],
	plugins: [
		new SmartCoercionPlugin({
			schemaConverters: [new ZodToJsonSchemaConverter()],
		}),
		new OpenAPIReferencePlugin({
			schemaConverters: [new ZodToJsonSchemaConverter()],
			specGenerateOptions: {
				info: {
					title: "TanStack ORPC Playground",
					version: "1.0.0",
				},
				security: [{ bearerAuth: [] }],
				components: {
					securitySchemes: {
						bearerAuth: {
							type: "http",
							scheme: "bearer",
						},
					},
				},
			},
			docsConfig: {
				authentication: {
					securitySchemes: {
						bearerAuth: {
							token: "default-token",
						},
					},
				},
			},
		}),
	],
})

const handle = async ({ request }: { request: Request }): Promise<Response> => {
	const session = await auth.api.getSession({ headers: request.headers })
	const { response } = await handler.handle(request, {
		prefix: "/api",
		context: { headers: request.headers, session },
	})

	return response ?? new Response("Not Found", { status: 404 })
}

export const Route = createFileRoute("/api/$")({
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
