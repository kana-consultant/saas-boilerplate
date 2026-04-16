import { useState } from "react"
import { toast } from "sonner"

import { authClient } from "#/libs/auth/client"
import { useForm } from "#/libs/tanstack-form"
import { orgInviteSchema, type OrgInviteFormProps } from "./schema"

export function useOrgInviteForm({ organizationId, onInvited }: OrgInviteFormProps) {
	const [inviteError, setInviteError] = useState<string | null>(null)

	const form = useForm({
		defaultValues: {
			email: "",
			role: "member" as "owner" | "admin" | "member",
		},
		validators: { onChange: orgInviteSchema },
		onSubmit: async ({ value }) => {
			setInviteError(null)
			const { error } = await authClient.organization.inviteMember({
				organizationId,
				email: value.email.trim(),
				role: value.role,
			})
			if (error) {
				const msg = error.message ?? "Failed to send invitation"
				setInviteError(msg)
				toast.error(msg)
			} else {
				form.reset()
				toast.success("Invitation sent")
				onInvited?.()
			}
		},
	})

	return { form, inviteError }
}
