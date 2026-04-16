import * as React from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { match } from "ts-pattern"

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

	const mutation = match(mode)
		.with("create", () => createRole)
		.with("edit", () => updateRole)
		.exhaustive()

	const form = useForm({
		defaultValues: {
			id: role?.id ?? "",
			label: role?.label ?? "",
			description: role?.description ?? "",
		},
		validators: {
			onChange: match(mode)
				.with("create", () => createRoleSchema)
				.with("edit", () => editRoleSchema)
				.exhaustive(),
		},
		onSubmit: async ({ value }) =>
			match(mode)
				.with("create", () =>
					createRole.mutateAsync({
						id: value.id.trim(),
						label: value.label.trim(),
						description: value.description.trim(),
					}),
				)
				.with("edit", () =>
					role
						? updateRole.mutateAsync({
								id: role.id,
								label: value.label.trim(),
								description: value.description.trim(),
							})
						: Promise.resolve(),
				)
				.exhaustive(),
	})

	React.useEffect(() => {
		if (open) {
			form.reset({
				id: role?.id ?? "",
				label: role?.label ?? "",
				description: role?.description ?? "",
			})
		}
	}, [open, role?.id])

	return { form, mutation }
}
