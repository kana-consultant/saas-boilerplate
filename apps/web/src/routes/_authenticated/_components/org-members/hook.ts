import { toast } from "sonner"

import { authClient } from "#/libs/auth/client"
import { useActiveOrganization } from "#/routes/_public/auth/_hooks/use-active-organization"
import type { Invitation, Member, OrgRole } from "./schema"

export function useOrgMembers() {
	const { data: activeOrg, refetch } = useActiveOrganization()

	const fullOrg = activeOrg as typeof activeOrg & {
		members?: Member[]
		invitations?: Invitation[]
	}

	const members = fullOrg?.members ?? []
	const invitations = (fullOrg?.invitations ?? []).filter(
		(i) => i.status === "pending",
	)

	const handleChangeRole = async (memberId: string, role: OrgRole) => {
		if (!activeOrg) return
		const { error } = await authClient.organization.updateMemberRole({
			organizationId: activeOrg.id,
			memberId,
			role,
		})
		if (error) {
			toast.error(error.message ?? "Failed to update role")
		} else {
			toast.success("Member role updated")
			refetch?.()
		}
	}

	const handleRemoveMember = async (memberId: string) => {
		if (!activeOrg) return
		const { error } = await authClient.organization.removeMember({
			organizationId: activeOrg.id,
			memberIdOrEmail: memberId,
		})
		if (error) {
			toast.error(error.message ?? "Failed to remove member")
		} else {
			toast.success("Member removed")
			refetch?.()
		}
	}

	const handleCancelInvitation = async (invitationId: string) => {
		const { error } = await authClient.organization.cancelInvitation({
			invitationId,
		})
		if (error) {
			toast.error(error.message ?? "Failed to cancel invitation")
		} else {
			toast.success("Invitation cancelled")
			refetch?.()
		}
	}

	return {
		activeOrg,
		members,
		invitations,
		refetch,
		handleChangeRole,
		handleRemoveMember,
		handleCancelInvitation,
	}
}
