import { z } from "zod"

export type OrgRole = "owner" | "admin" | "member"

export const ROLES: OrgRole[] = ["owner", "admin", "member"]

export const orgInviteSchema = z.object({
	email: z
		.string()
		.min(1, "Email is required")
		.email("Invalid email address")
		.max(254, "Email too long"),
	role: z.enum(["owner", "admin", "member"]),
})

export interface OrgInviteFormProps {
	organizationId: string
	onInvited?: () => void
}
