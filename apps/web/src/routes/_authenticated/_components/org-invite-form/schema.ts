export type OrgRole = "owner" | "admin" | "member"

export const ROLES: OrgRole[] = ["owner", "admin", "member"]

export interface OrgInviteFormProps {
	organizationId: string
	onInvited?: () => void
}
