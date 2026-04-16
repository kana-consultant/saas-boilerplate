import "#/polyfill"

import { readFile } from "node:fs/promises"
import { resolve } from "node:path"

import { serve } from "@hono/node-server"
import { serveStatic } from "@hono/node-server/serve-static"
import { Hono } from "hono"
import { cors } from "hono/cors"
import { onError } from "@orpc/server"
import { RPCHandler } from "@orpc/server/fetch"
import { OpenAPIHandler } from "@orpc/openapi/fetch"
import { ZodToJsonSchemaConverter } from "@orpc/zod/zod4"
import { SmartCoercionPlugin } from "@orpc/json-schema"
import { OpenAPIReferencePlugin } from "@orpc/openapi/plugins"
import { P, match } from "ts-pattern"

import { buildUseCases } from "#/application/use-cases.ts"
import type { AppRole } from "#/domain/role/permissions.ts"
import { PLATFORM_SUPER_ADMIN } from "#/domain/role/permissions.ts"
import type { Session } from "#/domain/session/session.ts"
import { createDb } from "#/infrastructure/db/client.ts"
import { createActivityRepository } from "#/infrastructure/db/repositories/activity-repository.ts"
import { createMemberRepository } from "#/infrastructure/db/repositories/member-repository.ts"
import { createOrganizationRepository } from "#/infrastructure/db/repositories/organization-repository.ts"
import {
	createPermissionRepository,
	createRoleRepository,
} from "#/infrastructure/db/repositories/role-repository.ts"
import { createUserRepository } from "#/infrastructure/db/repositories/user-repository.ts"
import { createRedisCache } from "#/infrastructure/cache/redis.ts"
import { buildAuth } from "#/infrastructure/auth/better-auth.ts"
import { createAuthService } from "#/infrastructure/auth/auth-service.ts"
import { buildRouter } from "#/presentation/routers/index.ts"

// ─── Composition root ──────────────────────────────────────────────────────
const db = createDb(process.env.DATABASE_URL!)

const activityRepo = createActivityRepository(db)
const userRepo = createUserRepository(db)
const memberRepo = createMemberRepository(db)
const orgRepo = createOrganizationRepository(db)
const roleRepo = createRoleRepository(db)
const permRepo = createPermissionRepository(db)

const cache = createRedisCache(process.env.REDIS_URL ?? "redis://127.0.0.1:6379")

const betterAuthInstance = buildAuth({ db, activityRepo })
const auth = createAuthService(betterAuthInstance)

const useCases = buildUseCases({
	userRepo,
	memberRepo,
	orgRepo,
	roleRepo,
	permRepo,
	activityRepo,
	cache,
	auth,
})

const router = buildRouter(useCases)

// ─── HTTP server ────────────────────────────────────────────────────────────
const app = new Hono()

const WEB_ORIGIN = process.env.WEB_ORIGIN ?? "http://localhost:3000"

app.use(
	"*",
	cors({
		origin: WEB_ORIGIN,
		credentials: true,
		allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"],
		allowHeaders: ["Content-Type", "Authorization"],
	}),
)

app.on(["GET", "POST"], "/auth/*", (c) => auth.handler(c.req.raw))

const resolveOrgRole = (session: Session | null): Promise<AppRole | null> =>
	match(session)
		.with(null, async () => null)
		.with({ user: { role: PLATFORM_SUPER_ADMIN } }, async (): Promise<AppRole> => "owner")
		.with(
			{ session: { activeOrganizationId: P.string } },
			async (s) =>
				(await memberRepo.findRole(s.user.id, s.session.activeOrganizationId)) as AppRole | null,
		)
		.otherwise(async () => null)

const buildContext = async (headers: Headers) => {
	const session = await auth.getSession(headers)
	const orgRole = await resolveOrgRole(session)
	return { headers, session, orgRole, useCases }
}

const rpcHandler = new RPCHandler(router)
app.all("/rpc/*", async (c) => {
	const { matched, response } = await rpcHandler.handle(c.req.raw, {
		prefix: "/rpc",
		context: await buildContext(c.req.raw.headers),
	})
	return matched && response ? response : c.notFound()
})

const openApiHandler = new OpenAPIHandler(router, {
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
					title: "SaaS Boilerplate API",
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

app.all("/api/*", async (c) => {
	const { matched, response } = await openApiHandler.handle(c.req.raw, {
		prefix: "/api",
		context: await buildContext(c.req.raw.headers),
	})
	return matched && response ? response : c.notFound()
})

const webDistPath = process.env.WEB_DIST_PATH
if (webDistPath) {
	const absDist = resolve(webDistPath)
	const indexHtmlPath = resolve(absDist, "index.html")
	app.use("/assets/*", serveStatic({ root: absDist }))
	app.use("/*", serveStatic({ root: absDist }))
	app.get("*", async (c) => {
		try {
			const html = await readFile(indexHtmlPath, "utf8")
			return c.html(html)
		} catch {
			return c.notFound()
		}
	})
}

const port = Number(process.env.PORT ?? 3001)

serve({ fetch: app.fetch, port }, () => {
	console.log(`api listening on http://localhost:${port}`)
})
