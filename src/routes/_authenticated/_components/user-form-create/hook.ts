import { useForm } from "@tanstack/react-form"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { useHasPermission } from "#/routes/_public/auth/_hooks/use-has-permission"
import { orpc } from "#/server/orpc/client"
import { extractErrorMessage, type UserFormSheetProps } from "../user-form-helpers"

export function useUserFormCreate({
	defaultRole = "member",
	onOpenChange,
}: Pick<UserFormSheetProps, "defaultRole" | "onOpenChange">) {
	const queryClient = useQueryClient()
	const canSetRole = useHasPermission("user", ["set-role"])

	const invalidate = () =>
		queryClient.invalidateQueries({ queryKey: orpc.admin.listUsers.key() })

	const createUser = useMutation({
		...orpc.admin.createUser.mutationOptions(),
		onSuccess: () => {
			invalidate()
			onOpenChange(false)
			toast.success("User created")
		},
		onError: (err) => toast.error(extractErrorMessage(err)),
	})

	const createForm = useForm({
		defaultValues: {
			name: "",
			email: "",
			password: "",
			role: defaultRole,
		},
		onSubmit: async ({ value }) => {
			await createUser.mutateAsync({
				name: value.name.trim(),
				email: value.email.trim().toLowerCase(),
				password: value.password,
				role: value.role,
			})
		},
	})

	return { createForm, createUser, canSetRole }
}
