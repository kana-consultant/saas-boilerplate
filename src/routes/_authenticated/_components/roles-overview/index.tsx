import {
	flexRender,
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
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "#/components/ui/table"
import { Tabs, TabsList, TabsTrigger } from "#/components/ui/tabs"
import type { AppRole } from "#/server/auth/permissions"
import { RoleFormSheet } from "../role-form-sheet"
import { UserFormSheet } from "../user-form-sheet"
import { RoleDefinitionsTable } from "../role-definitions-table"
import { useRolesOverview } from "./hook"
import { BUILT_IN_VARIANTS, type UserRow } from "./schema"

export function RolesOverview({ users }: { users: UserRow[] }) {
	const {
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
	} = useRolesOverview(users)

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
												{h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}
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
										<TableCell colSpan={userColumns.length} className="h-24 text-center">
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
							<Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
								Previous
							</Button>
							<Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
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
