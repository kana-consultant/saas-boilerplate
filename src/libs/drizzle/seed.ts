import { db } from "./index.ts"
import { organization, member } from "./schema.ts"
import { auth } from "#/server/auth/index.ts"

async function seed() {
	console.log("Seeding users...")

	// Super admin
	const superAdmin = await auth.api.createUser({
		body: {
			name: "Super Admin",
			email: "superadmin@example.com",
			password: "Password123!",
			role: "super-admin",
		},
	})
	console.log("✓ Super admin:", superAdmin.user.email)

	// Normal user
	const normalUser = await auth.api.createUser({
		body: {
			name: "John Doe",
			email: "user@example.com",
			password: "Password123!",
			role: "user",
		},
	})
	console.log("✓ Normal user:", normalUser.user.email)

	// Create a demo org
	const orgId = crypto.randomUUID()
	await db.insert(organization).values({
		id: orgId,
		name: "Demo Organization",
		slug: "demo",
		createdAt: new Date(),
	})
	console.log("✓ Org: Demo Organization (slug: demo)")

	// Super admin → owner
	await db.insert(member).values({
		id: crypto.randomUUID(),
		organizationId: orgId,
		userId: superAdmin.user.id,
		role: "owner",
		createdAt: new Date(),
	})

	// Normal user → member
	await db.insert(member).values({
		id: crypto.randomUUID(),
		organizationId: orgId,
		userId: normalUser.user.id,
		role: "member",
		createdAt: new Date(),
	})
	console.log("✓ Members seeded")

	console.log("\nCredentials:")
	console.log("  Super admin : superadmin@example.com / Password123!")
	console.log("  Normal user : user@example.com / Password123!")
}

seed().catch(console.error).finally(() => process.exit(0))
