import { describe, expect, it, vi } from "vitest"

import type { MemberRepository } from "#/domain/member/member-repository.ts"
import type { Organization } from "#/domain/organization/organization.ts"
import type { OrganizationRepository } from "#/domain/organization/organization-repository.ts"
import type { Cache } from "#/domain/ports/cache.ts"
import type { Session } from "#/domain/session/session.ts"
import type { OptionalAuthContext } from "../shared/context.ts"
import { makeGetOrgContext } from "./get-org-context.ts"

const makeOrg = (over: Partial<Organization> = {}): Organization => ({
	id: "org-1",
	name: "Acme",
	slug: "acme",
	logo: null,
	metadata: null,
	createdAt: new Date(),
	...over,
})

const makeSession = (
	role = "user",
	activeOrg: string | null = "org-1",
): Session => ({
	user: {
		id: "u-1",
		email: "u@x",
		name: "U",
		role,
		banned: false,
		emailVerified: true,
		createdAt: new Date(),
		updatedAt: new Date(),
	},
	session: {
		id: "s1",
		token: "t",
		userId: "u-1",
		expiresAt: new Date(Date.now() + 3600_000),
		activeOrganizationId: activeOrg,
	},
})

const makeDeps = (
	overrides: {
		orgBySlug?: Organization | null
		firstOrg?: { id: string; slug: string | null } | null
		findRole?: string | null
		cachedOrg?: Organization | null
		cachedRole?: string | null
	} = {},
) => {
	const orgRepo: OrganizationRepository = {
		findById: vi.fn(),
		findBySlug: vi.fn().mockResolvedValue(overrides.orgBySlug ?? null),
		findFirstForUser: vi.fn().mockResolvedValue(overrides.firstOrg ?? null),
		create: vi.fn(),
	}
	const memberRepo: MemberRepository = {
		findRole: vi.fn().mockResolvedValue(overrides.findRole ?? null),
		insert: vi.fn(),
		updateRole: vi.fn(),
	}
	const cache: Cache = {
		get: vi
			.fn()
			.mockImplementation((key: string) =>
				key.startsWith("org:slug:")
					? (overrides.cachedOrg ?? null)
					: key.startsWith("member:role:")
						? (overrides.cachedRole ?? null)
						: null,
			),
		set: vi.fn(),
		del: vi.fn(),
		delPattern: vi.fn(),
		ping: vi.fn().mockResolvedValue(true),
	}
	return { orgRepo, memberRepo, cache }
}

const ctx = (session: Session | null): OptionalAuthContext => ({
	session,
	orgRole: null,
	headers: new Headers(),
})

describe("makeGetOrgContext", () => {
	it("returns null when there is no session", async () => {
		const deps = makeDeps({ orgBySlug: makeOrg() })
		const getOrgContext = makeGetOrgContext(deps)
		const result = await getOrgContext({ orgSlug: "acme" }, ctx(null))
		expect(result).toBeNull()
	})

	it("returns redirectSlug when the org slug is unknown", async () => {
		const deps = makeDeps({
			orgBySlug: null,
			firstOrg: { id: "o2", slug: "beta" },
		})
		const getOrgContext = makeGetOrgContext(deps)
		const result = await getOrgContext({ orgSlug: "ghost" }, ctx(makeSession()))
		expect(result).toEqual({ org: null, orgRole: null, redirectSlug: "beta" })
	})

	it("returns orgRole=owner for platform super-admin", async () => {
		const deps = makeDeps({ orgBySlug: makeOrg() })
		const getOrgContext = makeGetOrgContext(deps)
		const result = await getOrgContext(
			{ orgSlug: "acme" },
			ctx(makeSession("super-admin")),
		)
		expect(result).toEqual({
			org: expect.objectContaining({ slug: "acme" }),
			orgRole: "owner",
			redirectSlug: null,
		})
	})

	it("looks up member role for a regular user and caches it", async () => {
		const deps = makeDeps({
			orgBySlug: makeOrg(),
			findRole: "admin",
		})
		const getOrgContext = makeGetOrgContext(deps)
		const result = await getOrgContext({ orgSlug: "acme" }, ctx(makeSession()))
		expect(result?.orgRole).toBe("admin")
		expect(deps.memberRepo.findRole).toHaveBeenCalledWith("u-1", "org-1")
		expect(deps.cache.set).toHaveBeenCalledWith(
			"member:role:u-1:org-1",
			"admin",
			expect.any(Number),
		)
	})

	it("uses cached role without hitting the repo", async () => {
		const deps = makeDeps({ orgBySlug: makeOrg(), cachedRole: "member" })
		const getOrgContext = makeGetOrgContext(deps)
		const result = await getOrgContext({ orgSlug: "acme" }, ctx(makeSession()))
		expect(result?.orgRole).toBe("member")
		expect(deps.memberRepo.findRole).not.toHaveBeenCalled()
	})
})
