import { describe, expect, it, vi } from "vitest"

import type { ActivityRepository } from "#/domain/activity/activity-repository.ts"
import type { MemberRepository } from "#/domain/member/member-repository.ts"
import type { AuthService } from "#/domain/ports/auth-service.ts"
import type { AppRole } from "#/domain/role/permissions.ts"
import type { Session } from "#/domain/session/session.ts"
import { AppError } from "../shared/errors.ts"
import type { AuthedContext } from "../shared/context.ts"
import { makeBanUser } from "./ban-user.ts"

const makeSession = (userId = "caller-1", activeOrg = "org-1"): Session => ({
	user: {
		id: userId,
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
		userId,
		expiresAt: new Date(Date.now() + 3600_000),
		activeOrganizationId: activeOrg,
	},
})

const makeCtx = (orgRole: AppRole = "admin"): AuthedContext => ({
	session: makeSession(),
	orgRole,
	headers: new Headers(),
})

const makeDeps = (targetRole: AppRole | null = "member") => {
	const auth: Pick<AuthService, "banUser"> = { banUser: vi.fn() }
	const memberRepo: MemberRepository = {
		findRole: vi.fn().mockResolvedValue(targetRole),
		insert: vi.fn(),
		updateRole: vi.fn(),
	}
	const activityRepo: ActivityRepository = {
		insert: vi.fn(),
		list: vi.fn(),
	}
	return { auth, memberRepo, activityRepo }
}

describe("makeBanUser", () => {
	it("bans the target and logs the activity", async () => {
		const deps = makeDeps("member")
		const banUser = makeBanUser(deps as never)
		const result = await banUser(
			{ userId: "target-1", banReason: "spam" },
			makeCtx(),
		)

		expect(result).toEqual({ success: true })
		expect(deps.auth.banUser).toHaveBeenCalledWith(
			"target-1",
			"spam",
			expect.objectContaining({ headers: expect.any(Headers) }),
		)
		expect(deps.activityRepo.insert).toHaveBeenCalledWith(
			expect.objectContaining({
				action: "ban",
				resource: "user",
				resourceId: "target-1",
				metadata: { banReason: "spam" },
			}),
		)
	})

	it("rejects banning self", async () => {
		const deps = makeDeps("member")
		const banUser = makeBanUser(deps as never)
		const ctx = makeCtx()

		await expect(
			banUser({ userId: ctx.session.user.id }, ctx),
		).rejects.toBeInstanceOf(AppError)
		expect(deps.auth.banUser).not.toHaveBeenCalled()
	})

	it("rejects banning a target with equal or higher rank", async () => {
		const deps = makeDeps("owner")
		const banUser = makeBanUser(deps as never)

		await expect(banUser({ userId: "boss" }, makeCtx("admin"))).rejects.toThrow(
			/higher privileges/,
		)
		expect(deps.auth.banUser).not.toHaveBeenCalled()
	})

	it("rejects when there is no active org in the session", async () => {
		const deps = makeDeps("member")
		const banUser = makeBanUser(deps as never)
		const ctx: AuthedContext = {
			...makeCtx(),
			session: {
				...makeSession(),
				session: { ...makeSession().session, activeOrganizationId: null },
			},
		}

		await expect(banUser({ userId: "target-1" }, ctx)).rejects.toThrow()
		expect(deps.auth.banUser).not.toHaveBeenCalled()
	})
})
