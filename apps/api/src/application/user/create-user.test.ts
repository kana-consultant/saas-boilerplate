import { describe, expect, it, vi } from "vitest"

import type { ActivityRepository } from "#/domain/activity/activity-repository.ts"
import type { MemberRepository } from "#/domain/member/member-repository.ts"
import type { AuthService } from "#/domain/ports/auth-service.ts"
import type { Cache } from "#/domain/ports/cache.ts"
import type { AppRole } from "#/domain/role/permissions.ts"
import type { Session } from "#/domain/session/session.ts"
import { AppError } from "../shared/errors.ts"
import type { AuthedContext } from "../shared/context.ts"
import { makeCreateUser } from "./create-user.ts"

const makeSession = (): Session => ({
	user: {
		id: "caller",
		email: "caller@x",
		name: "Caller",
		role: "user",
		banned: false,
		emailVerified: true,
		createdAt: new Date(),
		updatedAt: new Date(),
	},
	session: {
		id: "s1",
		token: "t",
		userId: "caller",
		expiresAt: new Date(Date.now() + 3600_000),
		activeOrganizationId: "org-1",
	},
})

const makeCtx = (orgRole: AppRole = "admin"): AuthedContext => ({
	session: makeSession(),
	orgRole,
	headers: new Headers(),
})

const makeDeps = () => {
	const auth: Pick<AuthService, "createUser"> = {
		createUser: vi.fn().mockResolvedValue({ id: "new-user", email: "n@x" }),
	}
	const memberRepo: MemberRepository = {
		findRole: vi.fn(),
		insert: vi.fn(),
		updateRole: vi.fn(),
	}
	const activityRepo: ActivityRepository = { insert: vi.fn(), list: vi.fn() }
	const cache: Cache = {
		get: vi.fn(),
		set: vi.fn(),
		del: vi.fn(),
		delPattern: vi.fn(),
	}
	return { auth, memberRepo, activityRepo, cache }
}

describe("makeCreateUser", () => {
	it("admin can create a member", async () => {
		const deps = makeDeps()
		const createUser = makeCreateUser(deps as never)
		const result = await createUser(
			{
				name: "Jane",
				email: "jane@x",
				password: "pw",
				role: "member",
			},
			makeCtx("admin"),
		)

		expect(result.user.id).toBe("new-user")
		expect(deps.memberRepo.insert).toHaveBeenCalledWith(
			expect.objectContaining({
				organizationId: "org-1",
				userId: "new-user",
				role: "member",
			}),
		)
		expect(deps.cache.del).toHaveBeenCalledWith("user:default-org:new-user")
	})

	it("admin cannot create an admin or owner", async () => {
		const deps = makeDeps()
		const createUser = makeCreateUser(deps as never)

		await expect(
			createUser(
				{ name: "J", email: "j@x", password: "pw", role: "admin" },
				makeCtx("admin"),
			),
		).rejects.toThrow(AppError)
		expect(deps.auth.createUser).not.toHaveBeenCalled()
	})

	it("owner can create an admin or owner", async () => {
		const deps = makeDeps()
		const createUser = makeCreateUser(deps as never)

		await expect(
			createUser(
				{ name: "J", email: "j@x", password: "pw", role: "admin" },
				makeCtx("owner"),
			),
		).resolves.toEqual({ user: { id: "new-user", email: "n@x" } })
	})
})
