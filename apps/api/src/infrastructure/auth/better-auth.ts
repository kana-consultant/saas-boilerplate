import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { admin } from "better-auth/plugins/admin"
import { organization } from "better-auth/plugins/organization"
import { eq } from "drizzle-orm"

import type { ActivityRepository } from "#/domain/activity/activity-repository.ts"
import type { Db } from "../db/client.ts"
import * as schema from "../db/schema.ts"
import { ac, platformRoles } from "./permissions.ts"

export interface BuildAuthDeps {
	db: Db
	activityRepo: ActivityRepository
}

export function buildAuth({ db, activityRepo }: BuildAuthDeps) {
	return betterAuth({
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
						await activityRepo
							.insert({
								userId: user.id,
								action: "sign-up",
								resource: "user",
								resourceId: user.id,
								metadata: { email: user.email, name: user.name },
							})
							.catch(() => {})
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

						await activityRepo
							.insert({
								userId: session.userId,
								organizationId:
									(session.activeOrganizationId as string | null | undefined) ??
									membership?.organizationId ??
									null,
								action: "sign-in",
								resource: "session",
								resourceId: session.id,
							})
							.catch(() => {})
					},
				},
				delete: {
					after: async (session) => {
						await activityRepo
							.insert({
								userId: session.userId,
								organizationId:
									(session.activeOrganizationId as string | null | undefined) ?? null,
								action: "sign-out",
								resource: "session",
								resourceId: session.id,
							})
							.catch(() => {})
					},
				},
			},
		},
		plugins: [
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
}

export type BetterAuth = ReturnType<typeof buildAuth>
