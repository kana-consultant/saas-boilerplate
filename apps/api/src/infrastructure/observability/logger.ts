import { pino } from "pino"

import { env } from "#/infrastructure/config/env.ts"

export const logger = pino({
	level: env.NODE_ENV === "production" ? "info" : "debug",
	base: { service: "@saas/api", env: env.NODE_ENV },
})

export type Logger = typeof logger
