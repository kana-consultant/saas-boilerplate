import { ORPCError, os } from "@orpc/server"

import type { AppRole } from "#/server/auth/permissions"
import type { ORPCContext } from "#/server/orpc/context"
import { roles } from "#/server/auth/permissions"

// Base builder — all procedures share this context type
export const publicProcedure = os.$context<ORPCContext>()

// Requires an authenticated session
export const protectedProcedure = publicProcedure.use(
	(options, input, output) => {
		if (!options.context.session) {
			throw new ORPCError("UNAUTHORIZED", {
				message: "You must be signed in",
			})
		}
		return options.next({
			context: {
				...options.context,
				session: options.context.session,
			},
		})
	},
)

// Requires one of the specified roles
export const requireRole = (...allowedRoles: AppRole[]) =>
	protectedProcedure.use((options, input, output) => {
		const role = options.context.session.user.role as AppRole
		if (!allowedRoles.includes(role)) {
			throw new ORPCError("FORBIDDEN", {
				message: `Required role: ${allowedRoles.join(" or ")}`,
			})
		}
		return options.next({ context: options.context })
	})

// Requires a specific permission on a resource
export const requirePermission = <R extends keyof (typeof roles)["user"]["statements"]>(
	resource: R,
	actions: string[],
) =>
	protectedProcedure.use((options, input, output) => {
		const role = options.context.session.user.role as AppRole
		const roleObj = roles[role]
		if (!roleObj) {
			throw new ORPCError("FORBIDDEN", { message: "Unknown role" })
		}
		const result = roleObj.authorize({ [resource]: actions } as Parameters<
			typeof roleObj.authorize
		>[0])
		if (!result.success) {
			throw new ORPCError("FORBIDDEN", {
				message: result.error ?? "Permission denied",
			})
		}
		return options.next({ context: options.context })
	})

// Convenience procedures
export const adminProcedure = requireRole("super-admin", "admin")
export const superAdminProcedure = requireRole("super-admin")
