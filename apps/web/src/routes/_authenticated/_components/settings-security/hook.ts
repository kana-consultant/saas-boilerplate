import * as React from "react"
import { useForm } from "@tanstack/react-form"
import { toast } from "sonner"

import { authClient } from "#/libs/auth/client"
import { passwordSchema, fieldError } from "./schema"

export function useSettingsSecurity() {
	const [submitError, setSubmitError] = React.useState<string | null>(null)

	const form = useForm({
		defaultValues: {
			currentPassword: "",
			newPassword: "",
			confirmPassword: "",
		},
		onSubmit: async ({ value }) => {
			setSubmitError(null)

			if (value.newPassword !== value.confirmPassword) {
				setSubmitError("New passwords do not match")
				return
			}

			try {
				const result = await authClient.changePassword({
					currentPassword: value.currentPassword,
					newPassword: value.newPassword,
					revokeOtherSessions: false,
				})
				if (result.error) {
					const msg = result.error.message ?? "Failed to change password"
					setSubmitError(msg)
					toast.error(msg)
					return
				}
				toast.success("Password changed")
				form.reset()
			} catch (err) {
				const msg = err instanceof Error ? err.message : "Failed to change password"
				setSubmitError(msg)
				toast.error(msg)
			}
		},
	})

	return { form, submitError, passwordSchema, fieldError }
}
