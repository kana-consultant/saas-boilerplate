import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
	type ColumnDef,
	getCoreRowModel,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	useReactTable,
} from "@tanstack/react-table"
import * as React from "react"
import { toast } from "sonner"

import { Badge } from "#/components/ui/badge"
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "#/components/ui/select"
import type { AppRole } from "#/libs/auth/permissions"
import { orpc } from "#/libs/orpc/client"
import { useHasPermission } from "#/routes/_public/auth/_hooks/use-has-permission"
import {
	BUILT_IN_VARIANTS,
	type RoleRow,
	type RoleSheetState,
	type UserRow,
} from "./schema"

export function useRolesOverview(users: UserRow[]) {
	const [activeTab, setActiveTab] = React.useState<string>("all")
	const [createUserSheetOpen, setCreateUserSheetOpen] = React.useState(false)
	const [createUserSheetRole, setCreateUserSheetRole] =
		React.useState<AppRole>("member")
	const [roleSheet, setRoleSheet] = React.useState<RoleSheetState>({
		open: false,
	})

	const canSetRole = useHasPermission("user", ["set-role"])
	const queryClient = useQueryClient()

	const { data: rolesData } = useQuery(orpc.admin.listRoles.queryOptions())
	const roleDefinitions: RoleRow[] = rolesData?.roles ?? []

	const setRole = useMutation({
		...orpc.admin.setRole.mutationOptions(),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: orpc.admin.listUsers.key() })
			toast.success("Role updated")
		},
		onError: (err) =>
			toast.error(err instanceof Error ? err.message : "Failed to update role"),
	})

	const allRoleIds = React.useMemo(
		() => roleDefinitions.map((r) => r.id),
		[roleDefinitions],
	)

	const roleCounts = React.useMemo(
		() =>
			allRoleIds.reduce(
				(acc, id) => {
					acc[id] = users.filter((u) => (u.role ?? "member") === id).length
					return acc
				},
				{} as Record<string, number>,
			),
		[users, allRoleIds],
	)

	const filteredUsers = React.useMemo(
		() =>
			activeTab === "all"
				? users
				: users.filter((u) => (u.role ?? "member") === activeTab),
		[users, activeTab],
	)

	const userColumns: ColumnDef<UserRow>[] = [
		{ accessorKey: "name", header: "Name" },
		{ accessorKey: "email", header: "Email" },
		{
			id: "role",
			header: "Role",
			cell: ({ row }) => {
				const role = row.original.role ?? "user"
				const def = roleDefinitions.find((r) => r.id === role)
				const variant = BUILT_IN_VARIANTS[role] ?? "outline"
				return <Badge variant={variant}>{def?.label ?? role}</Badge>
			},
		},
		{
			accessorKey: "createdAt",
			header: "Joined",
			cell: ({ row }) =>
				new Date(row.original.createdAt).toLocaleDateString(undefined, {
					year: "numeric",
					month: "short",
					day: "numeric",
				}),
		},
		...(canSetRole
			? [
					{
						id: "changeRole",
						header: "Change Role",
						cell: ({ row }: { row: { original: UserRow } }) => (
							<Select
								value={row.original.role ?? "user"}
								onValueChange={(value) =>
									setRole.mutate({
										userId: row.original.id,
										role: value as AppRole,
									})
								}
							>
								<SelectTrigger className="w-36">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{roleDefinitions.map((r) => (
										<SelectItem key={r.id} value={r.id}>
											{r.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						),
					} satisfies ColumnDef<UserRow>,
				]
			: []),
	]

	const table = useReactTable({
		data: filteredUsers,
		columns: userColumns,
		getCoreRowModel: getCoreRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		getSortedRowModel: getSortedRowModel(),
	})

	return {
		activeTab,
		setActiveTab,
		createUserSheetOpen,
		setCreateUserSheetOpen,
		createUserSheetRole,
		setCreateUserSheetRole,
		roleSheet,
		setRoleSheet,
		roleDefinitions,
		roleCounts,
		userColumns,
		table,
		users,
	}
}
