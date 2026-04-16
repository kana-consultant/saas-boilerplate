import { describe, expect, it } from "vitest"

import {
	hasPermission,
	outranks,
	ROLE_RANK,
	rolePermissions,
} from "./permissions.ts"

describe("ROLE_RANK", () => {
	it("orders owner > admin > member", () => {
		expect(ROLE_RANK.owner).toBeGreaterThan(ROLE_RANK.admin)
		expect(ROLE_RANK.admin).toBeGreaterThan(ROLE_RANK.member)
	})
})

describe("outranks", () => {
	it("owner outranks admin and member", () => {
		expect(outranks("owner", "admin")).toBe(true)
		expect(outranks("owner", "member")).toBe(true)
	})

	it("admin outranks member but not owner", () => {
		expect(outranks("admin", "member")).toBe(true)
		expect(outranks("admin", "owner")).toBe(false)
	})

	it("equal roles do not outrank each other", () => {
		expect(outranks("admin", "admin")).toBe(false)
		expect(outranks("owner", "owner")).toBe(false)
	})

	it("null caller defaults to member", () => {
		expect(outranks(null, "member")).toBe(false)
		expect(outranks(null, "admin")).toBe(false)
	})

	it("null target defaults to member", () => {
		expect(outranks("admin", null)).toBe(true)
		expect(outranks("member", null)).toBe(false)
	})
})

describe("hasPermission", () => {
	it("owner can do everything listed for owner", () => {
		for (const [resource, actions] of Object.entries(rolePermissions.owner)) {
			for (const action of actions ?? []) {
				expect(hasPermission("owner", resource as "user", [action])).toBe(true)
			}
		}
	})

	it("admin can ban users but cannot set-role", () => {
		expect(hasPermission("admin", "user", ["ban"])).toBe(true)
		expect(hasPermission("admin", "user", ["set-role"])).toBe(false)
	})

	it("member can only get users", () => {
		expect(hasPermission("member", "user", ["get"])).toBe(true)
		expect(hasPermission("member", "user", ["create"])).toBe(false)
		expect(hasPermission("member", "user", ["ban"])).toBe(false)
	})

	it("requires every action to be allowed for a multi-action check", () => {
		expect(hasPermission("admin", "user", ["ban", "get"])).toBe(true)
		expect(hasPermission("admin", "user", ["ban", "set-role"])).toBe(false)
	})
})
