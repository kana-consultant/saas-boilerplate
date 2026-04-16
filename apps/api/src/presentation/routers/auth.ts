import type { UseCases } from "#/application/use-cases.ts"
import { publicProcedure, toOptionalAuthContext } from "../orpc/middleware.ts"
import {
	getOrgContextSchema,
	getOrgRoleSchema,
} from "../orpc/schemas.ts"

export function buildAuthRouter(useCases: UseCases["auth"]) {
	return {
		getSession: publicProcedure.handler(({ context }) =>
			useCases.getSession(context.headers),
		),

		listOrganizations: publicProcedure.handler(({ context }) =>
			useCases.listOrganizations(context.headers),
		),

		getOrgRole: publicProcedure
			.input(getOrgRoleSchema)
			.handler(({ input, context }) =>
				useCases.getOrgRole(input, toOptionalAuthContext(context)),
			),

		getDefaultOrg: publicProcedure.handler(({ context }) =>
			useCases.getDefaultOrg(toOptionalAuthContext(context)),
		),

		getOrgContext: publicProcedure
			.input(getOrgContextSchema)
			.handler(({ input, context }) =>
				useCases.getOrgContext(input, toOptionalAuthContext(context)),
			),
	}
}
