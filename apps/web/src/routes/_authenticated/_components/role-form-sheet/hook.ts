import * as React from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { orpc } from "#/libs/orpc/client"
import { useForm } from "#/libs/tanstack-form"
import {
	createRoleSchema,
	editRoleSchema,
	extractErrorMessage,
	type RoleFormSheetProps,
} from "../role-form-helpers"

export function useRoleFormSheet({ mode, role, open, onOpenChange }: RoleFormSheetProps) {
	const queryClient = useQueryClient()

	const invalidate = () =>
		queryClient.invalidateQueries({ queryKey: orpc.admin.listRoles.key() })

	const createRole = useMutation({
		...orpc.admin.createRole.mutationOptions(),
		onSuccess: () => {
			invalidate()
			onOpenChange(false)
			toast.success("Role created")
		},
		onError: (err) => toast.error(extractErrorMessage(err)),
	})

	const updateRole = useMutation({
		...orpc.admin.updateRole.mutationOptions(),
		onSuccess: () => {
			invalidate()
			onOpenChange(false)
			toast.success("Role updated")
		},
		onError: (err) => toast.error(extractErrorMessage(err)),
	})

	const mutation = mode === "create" ? createRole : updateRole

	const form = useForm({
		defaultValues: {
			id: role?.id ?? "",
			label: role?.label ?? "",
			description: role?.description ?? "",
		},
		validators: {
			onChange: mode === "create" ? createRoleSchema : editRoleSchema,
		},
		onSubmit: async ({ value }) => {
			if (mode === "create") {
				await createRole.mutateAsync({
					id: value.id.trim(),
					label: value.label.trim(),
					description: value.description.trim(),
				})
			} else if (role) {
				await updateRole.mutateAsync({
					id: role.id,
					label: value.label.trim(),
					description: value.description.trim(),
				})
			}
		},
	})

	React.useEffect(() => {
		if (open) {
			form.reset({
				id: role?.id ?? "",
				label: role?.label ?? "",
				description: role?.description ?? "",
			})
		}
	}, [open, role?.id]) // eslint-disable-line react-hooks/exhaustive-deps

	return { form, mutation }
}
