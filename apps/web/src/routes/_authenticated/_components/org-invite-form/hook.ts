import { useState } from "react"
import type { FormEvent } from "react"
import { toast } from "sonner"

import { authClient } from "#/libs/auth/client"
import { type OrgRole, type OrgInviteFormProps } from "./schema"

export function useOrgInviteForm({ organizationId, onInvited }: OrgInviteFormProps) {
	const [inviteEmail, setInviteEmail] = useState("")
	const [inviteRole, setInviteRole] = useState<OrgRole>("member")
	const [inviting, setInviting] = useState(false)
	const [inviteError, setInviteError] = useState<string | null>(null)

	const handleInvite = async (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault()
		if (!inviteEmail.trim()) return
		setInviting(true)
		setInviteError(null)

		const { error } = await authClient.organization.inviteMember({
			organizationId,
			email: inviteEmail.trim(),
			role: inviteRole,
		})

		if (error) {
			setInviteError(error.message ?? "Failed to send invitation")
			toast.error(error.message ?? "Failed to send invitation")
		} else {
			setInviteEmail("")
			toast.success("Invitation sent")
			onInvited?.()
		}
		setInviting(false)
	}

	return { inviteEmail, setInviteEmail, inviteRole, setInviteRole, inviting, inviteError, handleInvite }
}
