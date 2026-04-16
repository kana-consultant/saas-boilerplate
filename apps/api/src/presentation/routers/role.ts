import type { UseCases } from "#/application/use-cases.ts"
import {
	adminProcedure,
	ownerProcedure,
	toAuthedContext,
} from "../orpc/middleware.ts"
import {
	createRoleSchema,
	deleteRoleSchema,
	setRolePermissionSchema,
	updateRoleSchema,
} from "../orpc/schemas.ts"

export function buildRoleRouter(useCases: UseCases["role"]) {
	return {
		listRoles: adminProcedure.handler(({ context }) =>
			useCases.list(toAuthedContext(context)),
		),

		createRole: ownerProcedure
			.input(createRoleSchema)
			.handler(({ input, context }) =>
				useCases.create(input, toAuthedContext(context)),
			),

		updateRole: ownerProcedure
			.input(updateRoleSchema)
			.handler(({ input, context }) =>
				useCases.update(input, toAuthedContext(context)),
			),

		deleteRole: ownerProcedure
			.input(deleteRoleSchema)
			.handler(({ input, context }) =>
				useCases.delete(input, toAuthedContext(context)),
			),

		listRolePermissions: adminProcedure.handler(({ context }) =>
			useCases.listPermissions(toAuthedContext(context)),
		),

		setRolePermission: ownerProcedure
			.input(setRolePermissionSchema)
			.handler(({ input, context }) =>
				useCases.setPermission(input, toAuthedContext(context)),
			),
	}
}
