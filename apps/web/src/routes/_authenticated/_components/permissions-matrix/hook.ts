import * as React from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { useHasPermission } from "#/routes/_public/auth/_hooks/use-has-permission"
import { orpc } from "#/libs/orpc/client"
import { ALL_ROWS } from "../permissions-constants"

export function usePermissionsMatrix() {
	const queryClient = useQueryClient()
	const canEdit = useHasPermission("user", ["set-role"])

	const { data: rolesData, isLoading: rolesLoading } = useQuery(
		orpc.admin.listRoles.queryOptions(),
	)
	const { data: permsData, isLoading: permsLoading } = useQuery(
		orpc.admin.listRolePermissions.queryOptions(),
	)

	const roles = rolesData?.roles ?? []
	const permissions = permsData?.permissions ?? []

	const [selectedRoleId, setSelectedRoleId] = React.useState<string>("")
	const [pendingChanges, setPendingChanges] = React.useState<Map<string, boolean>>(new Map())
	const [isSaving, setIsSaving] = React.useState(false)

	React.useEffect(() => {
		if (roles.length > 0 && !selectedRoleId) {
			setSelectedRoleId(roles[0]!.id)
		}
	}, [roles, selectedRoleId])

	React.useEffect(() => {
		setPendingChanges(new Map())
	}, [selectedRoleId])

	const selectedRole = roles.find((r) => r.id === selectedRoleId)
	const setPermission = useMutation(orpc.admin.setRolePermission.mutationOptions())

	const isServerGranted = (resource: string, action: string) =>
		permissions.some(
			(p) =>
				p.roleId === selectedRoleId &&
				p.resource === resource &&
				p.action === action,
		)

	const isGranted = (resource: string, action: string) => {
		const key = `${resource}:${action}`
		if (pendingChanges.has(key)) return pendingChanges.get(key)!
		return isServerGranted(resource, action)
	}

	const handleToggle = (resource: string, action: string, checked: boolean) => {
		const key = `${resource}:${action}`
		const serverGranted = isServerGranted(resource, action)
		setPendingChanges((prev) => {
			const next = new Map(prev)
			if (checked === serverGranted) {
				next.delete(key)
			} else {
				next.set(key, checked)
			}
			return next
		})
	}

	const handleSave = async () => {
		setIsSaving(true)
		try {
			await Promise.all(
				Array.from(pendingChanges.entries()).map(([key, granted]) => {
					const colonIdx = key.indexOf(":")
					const resource = key.slice(0, colonIdx)
					const action = key.slice(colonIdx + 1)
					return setPermission.mutateAsync({
						roleId: selectedRoleId,
						resource,
						action,
						granted,
					})
				}),
			)
			await queryClient.invalidateQueries({
				queryKey: orpc.admin.listRolePermissions.key(),
			})
			setPendingChanges(new Map())
			toast.success("Permissions saved")
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Failed to save permissions")
		} finally {
			setIsSaving(false)
		}
	}

	const grantedCount = selectedRoleId
		? ALL_ROWS.filter(({ resource, action }) => isGranted(resource, action)).length
		: 0

	const isLoading = rolesLoading || permsLoading
	const hasPendingChanges = pendingChanges.size > 0

	return {
		roles,
		selectedRoleId,
		setSelectedRoleId,
		selectedRole,
		canEdit,
		isLoading,
		isSaving,
		pendingChanges,
		hasPendingChanges,
		grantedCount,
		isGranted,
		handleToggle,
		handleSave,
		discardChanges: () => setPendingChanges(new Map()),
	}
}
