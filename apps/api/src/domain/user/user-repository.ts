import type { OrgMemberListing } from "./user.ts"

export interface UserRepository {
	listOrgMembers(organizationId: string): Promise<OrgMemberListing[]>
}
