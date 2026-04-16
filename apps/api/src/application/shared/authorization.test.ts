import { describe, expect, it, vi } from "vitest"

import type { MemberRepository } from "#/domain/member/member-repository.ts"
import { assertNotSelf, assertOutranksTarget } from "./authorization.ts"
import { AppError } from "./errors.ts"

describe("assertNotSelf", () => {
	it("throws FORBIDDEN when caller targets themselves", () => {
		expect(() => assertNotSelf("user-1", "user-1", "ban")).toThrow(AppError)
		try {
			assertNotSelf("user-1", "user-1", "ban")
		} catch (err) {
			expect(err).toBeInstanceOf(AppError)
			expect((err as AppError).code).toBe("FORBIDDEN")
			expect((err as AppError).message).toMatch(/cannot ban/i)
		}
	})

	it("does not throw when targets are different", () => {
		expect(() => assertNotSelf("user-1", "user-2", "ban")).not.toThrow()
	})
})

describe("assertOutranksTarget", () => {
	const makeRepo = (targetRole: string | null): MemberRepository => ({
		findRole: vi.fn().mockResolvedValue(targetRole),
		insert: vi.fn(),
		updateRole: vi.fn(),
	})

	it("passes when caller outranks target", async () => {
		const repo = makeRepo("member")
		await expect(
			assertOutranksTarget(repo, "admin", "u", "org"),
		).resolves.toBeUndefined()
	})

	it("throws FORBIDDEN when caller equal to target", async () => {
		const repo = makeRepo("admin")
		await expect(
			assertOutranksTarget(repo, "admin", "u", "org"),
		).rejects.toThrow(AppError)
	})

	it("throws FORBIDDEN when target outranks caller", async () => {
		const repo = makeRepo("owner")
		await expect(
			assertOutranksTarget(repo, "admin", "u", "org"),
		).rejects.toThrow(/higher privileges/)
	})

	it("treats null caller role as member", async () => {
		const repo = makeRepo("member")
		await expect(assertOutranksTarget(repo, null, "u", "org")).rejects.toThrow(
			AppError,
		)
	})

	it("treats null target role as member", async () => {
		const repo = makeRepo(null)
		await expect(
			assertOutranksTarget(repo, "admin", "u", "org"),
		).resolves.toBeUndefined()
	})
})
