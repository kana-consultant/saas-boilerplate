import type { Organization, OrganizationSummary } from "./organization.ts"

export interface OrganizationRepository {
	findById(id: string): Promise<Organization | null>
	findBySlug(slug: string): Promise<Organization | null>
	findFirstForUser(userId: string): Promise<OrganizationSummary | null>
	create(input: {
		id: string
		name: string
		slug: string
		createdAt?: Date
	}): Promise<void>
}
