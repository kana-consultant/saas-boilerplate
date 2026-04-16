import { describe, expect, it, vi } from "vitest"

import type {
	PermissionRepository,
	RoleRepository,
} from "#/domain/role/role-repository.ts"
import { rolePermissions } from "#/domain/role/permissions.ts"
import { makeSeedPermissions } from "./seed-permissions.ts"

describe("makeSeedPermissions", () => {
	const makeDeps = () => {
		const roleRepo: RoleRepository = {
			listByOrg: vi.fn(),
			findByIdAndOrg: vi.fn(),
			create: vi.fn(),
			update: vi.fn(),
			delete: vi.fn(),
			seedSystemRoles: vi.fn(),
		}
		const permRepo: PermissionRepository = {
			listByOrg: vi.fn(),
			grant: vi.fn(),
			revoke: vi.fn(),
			insertMany: vi.fn(),
		}
		return { roleRepo, permRepo }
	}

	it("seeds system roles before inserting permissions", async () => {
		const deps = makeDeps()
		const seed = makeSeedPermissions(deps)
		await seed("org-1")

		expect(deps.roleRepo.seedSystemRoles).toHaveBeenCalledWith("org-1")
		expect(deps.permRepo.insertMany).toHaveBeenCalledTimes(1)
	})

	it("inserts one row per allowed (role, resource, action) tuple", async () => {
		const deps = makeDeps()
		const seed = makeSeedPermissions(deps)
		await seed("org-1")

		const expected = Object.entries(rolePermissions).reduce(
			(total, [, res]) =>
				total +
				Object.values(res).reduce(
					(sum, actions) => sum + (actions?.length ?? 0),
					0,
				),
			0,
		)

		const inserted = (deps.permRepo.insertMany as ReturnType<typeof vi.fn>).mock
			.calls[0][0] as unknown[]
		expect(inserted).toHaveLength(expected)

		for (const row of inserted as {
			roleId: string
			organizationId: string
			resource: string
			action: string
		}[]) {
			expect(row.organizationId).toBe("org-1")
			expect(row).toMatchObject({
				roleId: expect.any(String),
				resource: expect.any(String),
				action: expect.any(String),
			})
		}
	})

	it("skips insertMany when there are no rows", async () => {
		const deps = makeDeps()
		const seed = makeSeedPermissions(deps)

		const originalKeys = Object.keys(
			rolePermissions,
		) as (keyof typeof rolePermissions)[]
		const snapshot = Object.fromEntries(
			originalKeys.map((k) => [k, rolePermissions[k]]),
		)
		try {
			for (const k of originalKeys) rolePermissions[k] = {}
			await seed("org-1")
			expect(deps.permRepo.insertMany).not.toHaveBeenCalled()
		} finally {
			for (const k of originalKeys) rolePermissions[k] = snapshot[k]
		}
	})
})
