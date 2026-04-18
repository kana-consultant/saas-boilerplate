import { buildAuth } from "#/infrastructure/auth/better-auth.ts"
import { env } from "#/infrastructure/config/env.ts"
import { createDb } from "./client.ts"
import { createActivityRepository } from "./repositories/activity-repository.ts"
import { createMemberRepository } from "./repositories/member-repository.ts"
import { createOrganizationRepository } from "./repositories/organization-repository.ts"

async function seed() {
	const db = createDb(env.DATABASE_URL)
	const activityRepo = createActivityRepository(db)
	const orgRepo = createOrganizationRepository(db)
	const memberRepo = createMemberRepository(db)
	const auth = buildAuth({ db, activityRepo })

	console.log("Seeding users...")

	const superAdmin = await auth.api.createUser({
		body: {
			name: "Super Admin",
			email: "superadmin@example.com",
			password: "Password123!",
			role: "super-admin",
		},
	})
	console.log("✓ Super admin:", superAdmin.user.email)

	const normalUser = await auth.api.createUser({
		body: {
			name: "John Doe",
			email: "user@example.com",
			password: "Password123!",
			role: "user",
		},
	})
	console.log("✓ Normal user:", normalUser.user.email)

	const orgId = crypto.randomUUID()
	await orgRepo.create({
		id: orgId,
		name: "Demo Organization",
		slug: "demo",
	})
	console.log("✓ Org: Demo Organization (slug: demo)")

	await memberRepo.insert({
		id: crypto.randomUUID(),
		organizationId: orgId,
		userId: superAdmin.user.id,
		role: "owner",
	})

	await memberRepo.insert({
		id: crypto.randomUUID(),
		organizationId: orgId,
		userId: normalUser.user.id,
		role: "member",
	})
	console.log("✓ Members seeded")

	console.log("\nCredentials:")
	console.log("  Super admin : superadmin@example.com / Password123!")
	console.log("  Normal user : user@example.com / Password123!")
}

seed()
	.catch(console.error)
	.finally(() => process.exit(0))
