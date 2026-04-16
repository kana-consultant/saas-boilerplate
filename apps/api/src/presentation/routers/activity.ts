import type { UseCases } from "#/application/use-cases.ts"
import { requirePermission, toAuthedContext } from "../orpc/middleware.ts"
import { listActivityLogsSchema } from "../orpc/schemas.ts"

export function buildActivityRouter(useCases: UseCases["activity"]) {
	return {
		listActivityLogs: requirePermission("activity-log", ["list"])
			.input(listActivityLogsSchema)
			.handler(({ input, context }) =>
				useCases.list(input, toAuthedContext(context)),
			),
	}
}
