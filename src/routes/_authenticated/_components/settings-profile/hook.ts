import * as React from "react"
import { useForm } from "@tanstack/react-form"
import { useRouter } from "@tanstack/react-router"
import { toast } from "sonner"

import { authClient } from "#/server/auth/client"
import { nameSchema } from "./schema"

export function useSettingsProfile({ name }: { name: string }) {
	const router = useRouter()
	const [submitError, setSubmitError] = React.useState<string | null>(null)

	const form = useForm({
		defaultValues: { name },
		onSubmit: async ({ value }) => {
			setSubmitError(null)
			try {
				await authClient.updateUser({ name: value.name.trim() })
				await router.invalidate()
				toast.success("Profile updated")
			} catch (err) {
				const msg = err instanceof Error ? err.message : "Failed to update profile"
				setSubmitError(msg)
				toast.error(msg)
			}
		},
	})

	const validateName = (value: string) => {
		const r = nameSchema.safeParse(value)
		return r.success ? undefined : r.error.issues[0]?.message
	}

	return { form, submitError, validateName }
}
