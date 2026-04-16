import * as React from "react"
import { useForm } from "@tanstack/react-form"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { orpc } from "#/libs/orpc/client"
import { extractErrorMessage, type UserFormSheetProps } from "../user-form-helpers"

export function useUserFormSheet({
	mode,
	user,
	onOpenChange,
}: Pick<UserFormSheetProps, "mode" | "user" | "onOpenChange">) {
	const queryClient = useQueryClient()

	const invalidate = () =>
		queryClient.invalidateQueries({ queryKey: orpc.admin.listUsers.key() })

	const updateUser = useMutation({
		...orpc.admin.updateUser.mutationOptions(),
		onSuccess: () => {
			invalidate()
			onOpenChange(false)
			toast.success("User updated")
		},
		onError: (err) => toast.error(extractErrorMessage(err)),
	})

	const deleteUser = useMutation({
		...orpc.admin.deleteUser.mutationOptions(),
		onSuccess: () => {
			invalidate()
			onOpenChange(false)
			toast.success("User deleted")
		},
		onError: (err) => toast.error(extractErrorMessage(err)),
	})

	const editForm = useForm({
		defaultValues: {
			name: user?.name ?? "",
			email: user?.email ?? "",
		},
		onSubmit: async ({ value }) => {
			if (!user) return
			await updateUser.mutateAsync({
				userId: user.id,
				name: value.name.trim(),
				email: value.email.trim().toLowerCase(),
			})
		},
	})

	React.useEffect(() => {
		if (mode === "edit" && user) {
			editForm.reset({ name: user.name, email: user.email })
		}
	}, [user?.id, mode]) // eslint-disable-line react-hooks/exhaustive-deps

	return { editForm, updateUser, deleteUser }
}
