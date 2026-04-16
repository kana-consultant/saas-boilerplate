export interface User {
	id: string
	name: string
	email: string
	role: string
	banned: boolean
	createdAt: Date
}

export interface OrgMemberListing {
	id: string
	name: string
	email: string
	role: string
	banned: boolean
	createdAt: Date
}
