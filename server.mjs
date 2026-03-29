import { serve } from "@hono/node-server"
import { serveStatic } from "@hono/node-server/serve-static"
import { Hono } from "hono"
import { cache } from "hono/cache"

const app = new Hono()

// Static assets — immutable cache (hashed filenames)
app.use(
	"/assets/*",
	cache({ cacheName: "static", cacheControl: "public, max-age=31536000, immutable" }),
	serveStatic({ root: "./dist/client" }),
)

// SSR handler
const { default: server } = await import("./dist/server/server.js")

app.all("*", (c) => server.fetch(c.req.raw))

const port = Number(process.env.PORT ?? 3000)

serve({ fetch: app.fetch, port }, () => {
	console.log(`Listening on http://0.0.0.0:${port}`)
})
