export interface Organization {
	id: string
	name: string
	slug: string | null
	logo: string | null
	metadata: string | null
	createdAt: Date
}

export interface OrganizationSummary {
	id: string
	slug: string | null
}
