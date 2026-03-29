import * as React from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
	flexRender,
	getCoreRowModel,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	useReactTable,
	type ColumnDef,
} from "@tanstack/react-table"
import { IconPlus } from "@tabler/icons-react"

import { Badge } from "#/components/ui/badge"
import { Button } from "#/components/ui/button"
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle,
} from "#/components/ui/card"
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "#/components/ui/select"
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "#/components/ui/table"
import { Tabs, TabsList, TabsTrigger } from "#/components/ui/tabs"
import { useHasPermission } from "#/routes/_public/auth/_hooks/use-has-permission"
import type { AppRole } from "#/server/auth/permissions"
import { orpc } from "#/server/orpc/client"
import { RoleFormSheet } from "./role-form-sheet"
import { UserFormSheet } from "./user-form-sheet"
import { RoleDefinitionsTable } from "./role-definitions-table"

interface UserRow {
	id: string
	name: string
	email: string
	role?: string | null
	createdAt: string | Date
}

interface RoleRow {
	id: string
	label: string
	description: string
	isSystem: boolean
}

const BUILT_IN_VARIANTS: Record<string, "default" | "secondary" | "outline"> = {
	owner: "default",
	admin: "secondary",
	member: "outline",
}

type RoleSheetState =
	| { open: false }
	| { open: true; mode: "create" }
	| { open: true; mode: "edit"; role: RoleRow }

export function RolesOverview({ users }: { users: UserRow[] }) {
	const [activeTab, setActiveTab] = React.useState<string>("all")
	const [createUserSheetOpen, setCreateUserSheetOpen] = React.useState(false)
	const [createUserSheetRole, setCreateUserSheetRole] = React.useState<AppRole>("member")
	const [roleSheet, setRoleSheet] = React.useState<RoleSheetState>({ open: false })

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
		onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to update role"),
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

	return (
		<div className="flex flex-col gap-8">
			<RoleDefinitionsTable
				roleDefinitions={roleDefinitions}
				onEdit={(role) => setRoleSheet({ open: true, mode: "edit", role })}
				onCreate={() => setRoleSheet({ open: true, mode: "create" })}
			/>

			<div className="flex flex-col gap-4">
				<div>
					<h2 className="text-lg font-semibold">Role Assignments</h2>
					<p className="text-muted-foreground text-sm">
						Users grouped by role. Click a card to filter.
					</p>
				</div>

				<div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
					{roleDefinitions.map((r) => {
						const variant = BUILT_IN_VARIANTS[r.id] ?? "outline"
						return (
							<Card
								key={r.id}
								className={`transition-colors ${activeTab === r.id ? "ring-2 ring-primary" : ""}`}
							>
								<CardHeader
									className="cursor-pointer pb-2"
									onClick={() => setActiveTab(activeTab === r.id ? "all" : r.id)}
								>
									<div className="flex items-center justify-between">
										<CardTitle className="text-sm font-medium">{r.label}</CardTitle>
										<Badge variant={variant}>{r.id}</Badge>
									</div>
								</CardHeader>
								<CardContent
									className="cursor-pointer"
									onClick={() => setActiveTab(activeTab === r.id ? "all" : r.id)}
								>
									<p className="text-3xl font-bold">{roleCounts[r.id] ?? 0}</p>
									<p className="text-muted-foreground mt-1 text-xs">{r.description}</p>
								</CardContent>
								<CardFooter className="pt-0">
									<Button
										variant="outline"
										size="sm"
										className="w-full"
										onClick={() => {
											setCreateUserSheetRole(r.id as AppRole)
											setCreateUserSheetOpen(true)
										}}
									>
										<IconPlus className="size-3.5" />
										Add User
									</Button>
								</CardFooter>
							</Card>
						)
					})}
				</div>

				<Tabs value={activeTab} onValueChange={setActiveTab}>
					<TabsList>
						<TabsTrigger value="all">All ({users.length})</TabsTrigger>
						{roleDefinitions.map((r) => (
							<TabsTrigger key={r.id} value={r.id}>
								{r.label} ({roleCounts[r.id] ?? 0})
							</TabsTrigger>
						))}
					</TabsList>

					<div className="mt-4 rounded-md border">
						<Table>
							<TableHeader>
								{table.getHeaderGroups().map((hg) => (
									<TableRow key={hg.id}>
										{hg.headers.map((h) => (
											<TableHead key={h.id}>
												{h.isPlaceholder
													? null
													: flexRender(h.column.columnDef.header, h.getContext())}
											</TableHead>
										))}
									</TableRow>
								))}
							</TableHeader>
							<TableBody>
								{table.getRowModel().rows.length ? (
									table.getRowModel().rows.map((row) => (
										<TableRow key={row.id}>
											{row.getVisibleCells().map((cell) => (
												<TableCell key={cell.id}>
													{flexRender(cell.column.columnDef.cell, cell.getContext())}
												</TableCell>
											))}
										</TableRow>
									))
								) : (
									<TableRow>
										<TableCell
											colSpan={userColumns.length}
											className="h-24 text-center"
										>
											No users with this role.
										</TableCell>
									</TableRow>
								)}
							</TableBody>
						</Table>
					</div>

					<div className="mt-3 flex items-center justify-between">
						<p className="text-muted-foreground text-sm">
							{table.getRowModel().rows.length} user(s)
						</p>
						<div className="flex gap-2">
							<Button
								variant="outline"
								size="sm"
								onClick={() => table.previousPage()}
								disabled={!table.getCanPreviousPage()}
							>
								Previous
							</Button>
							<Button
								variant="outline"
								size="sm"
								onClick={() => table.nextPage()}
								disabled={!table.getCanNextPage()}
							>
								Next
							</Button>
						</div>
					</div>
				</Tabs>
			</div>

			<RoleFormSheet
				mode={roleSheet.open ? roleSheet.mode : "create"}
				role={roleSheet.open && roleSheet.mode === "edit" ? roleSheet.role : undefined}
				open={roleSheet.open}
				onOpenChange={(open) => !open && setRoleSheet({ open: false })}
			/>

			<UserFormSheet
				mode="create"
				defaultRole={createUserSheetRole}
				open={createUserSheetOpen}
				onOpenChange={setCreateUserSheetOpen}
			/>
		</div>
	)
}
