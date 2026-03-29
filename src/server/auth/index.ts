import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { admin } from "better-auth/plugins/admin"
import { organization } from "better-auth/plugins/organization"
import { tanstackStartCookies } from "better-auth/tanstack-start"

import { eq } from "drizzle-orm"
import { db } from "#/libs/drizzle"
import * as schema from "#/libs/drizzle/schema"
import { ac, platformRoles } from "#/server/auth/permissions"
import { logActivity } from "#/server/activity"

export const auth = betterAuth({
	database: drizzleAdapter(db, { provider: "pg" }),
	emailAndPassword: {
		enabled: true,
	},
	socialProviders: {
		google: {
			clientId: process.env.GOOGLE_CLIENT_ID!,
			clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
		},
	},
	databaseHooks: {
		user: {
			create: {
				after: async (user) => {
					await logActivity({
						userId: user.id,
						action: "sign-up",
						resource: "user",
						resourceId: user.id,
						metadata: { email: user.email, name: user.name },
					}).catch(() => {})
				},
			},
		},
		session: {
			create: {
				after: async (session) => {
					const membership = await db
						.select({ organizationId: schema.member.organizationId })
						.from(schema.member)
						.where(eq(schema.member.userId, session.userId))
						.limit(1)
						.then((r) => r[0])

					await logActivity({
						userId: session.userId,
						organizationId: (session.activeOrganizationId as string | null | undefined) ?? membership?.organizationId ?? null,
						action: "sign-in",
						resource: "session",
						resourceId: session.id,
					}).catch(() => {})
				},
			},
			delete: {
				after: async (session) => {
					await logActivity({
						userId: session.userId,
						organizationId: (session.activeOrganizationId as string | null | undefined) ?? null,
						action: "sign-out",
						resource: "session",
						resourceId: session.id,
					}).catch(() => {})
				},
			},
		},
	},
	plugins: [
		tanstackStartCookies(),
		admin({
			defaultRole: "user",
			adminRoles: ["super-admin", "admin"],
			ac,
			roles: platformRoles,
		}),
		organization({
			allowUserToCreateOrganization: true,
			organizationLimit: 5,
			creatorRole: "owner",
			membershipLimit: 50,
		}),
	],
})

export type Session = typeof auth.$Infer.Session
export type User = Session["user"]
