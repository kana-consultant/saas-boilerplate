import { db } from "#/libs/drizzle"
import * as schema from "#/libs/drizzle/schema"

export async function logActivity(entry: {
	userId?: string | null
	organizationId?: string | null
	action: string
	resource: string
	resourceId?: string | null
	metadata?: Record<string, unknown>
	ipAddress?: string | null
	userAgent?: string | null
}) {
	await db.insert(schema.activityLog).values({
		id: crypto.randomUUID(),
		userId: entry.userId ?? null,
		organizationId: entry.organizationId ?? null,
		action: entry.action,
		resource: entry.resource,
		resourceId: entry.resourceId ?? null,
		metadata: entry.metadata ? JSON.stringify(entry.metadata) : null,
		ipAddress: entry.ipAddress ?? null,
		userAgent: entry.userAgent ?? null,
	})
}
