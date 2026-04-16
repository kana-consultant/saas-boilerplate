import { ORPCError, os } from "@orpc/server"
import type {
	AuthedContext,
	OptionalAuthContext,
} from "#/application/shared/context.ts"
import { AppError } from "#/application/shared/errors.ts"
import type { AppRole, Resource } from "#/domain/role/permissions.ts"
import {
	hasPermission,
	PLATFORM_SUPER_ADMIN,
} from "#/domain/role/permissions.ts"
import type { ORPCContext } from "./context.ts"

export const publicProcedure = os
	.$context<ORPCContext>()
	.use(async (options) => {
		try {
			return await options.next({ context: options.context })
		} catch (err) {
			if (!(err instanceof AppError)) throw err
			throw new ORPCError(err.code, { message: err.message })
		}
	})

export const protectedProcedure = publicProcedure.use((options) => {
	if (!options.context.session) {
		throw new ORPCError("UNAUTHORIZED", { message: "You must be signed in" })
	}
	return options.next({
		context: {
			...options.context,
			session: options.context.session,
		},
	})
})

export const requireRole = (...allowedRoles: AppRole[]) =>
	protectedProcedure.use((options) => {
		const role = options.context.orgRole
		if (!role || !allowedRoles.includes(role)) {
			throw new ORPCError("FORBIDDEN", {
				message: `Required role: ${allowedRoles.join(" or ")}`,
			})
		}
		return options.next({ context: options.context })
	})

export const requirePermission = (resource: Resource, actions: string[]) =>
	protectedProcedure.use((options) => {
		const role = options.context.orgRole
		if (!role) {
			throw new ORPCError("FORBIDDEN", { message: "No org membership" })
		}
		if (!hasPermission(role, resource, actions)) {
			throw new ORPCError("FORBIDDEN", { message: "Permission denied" })
		}
		return options.next({ context: options.context })
	})

export const adminProcedure = requireRole("owner", "admin")
export const ownerProcedure = requireRole("owner")

export const platformSuperAdminProcedure = protectedProcedure.use((options) => {
	if (options.context.session.user.role !== PLATFORM_SUPER_ADMIN) {
		throw new ORPCError("FORBIDDEN", {
			message: "Platform super-admin access required",
		})
	}
	return options.next({ context: options.context })
})

export function toAuthedContext(ctx: ORPCContext): AuthedContext {
	if (!ctx.session)
		throw new ORPCError("UNAUTHORIZED", { message: "Not authenticated" })
	return { session: ctx.session, orgRole: ctx.orgRole, headers: ctx.headers }
}

export function toOptionalAuthContext(ctx: ORPCContext): OptionalAuthContext {
	return { session: ctx.session, orgRole: ctx.orgRole, headers: ctx.headers }
}
