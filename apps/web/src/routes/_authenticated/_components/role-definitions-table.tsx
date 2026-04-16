import { IconPencil, IconPlus, IconTrash } from "@tabler/icons-react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { Badge } from "#/components/ui/badge"
import { Button } from "#/components/ui/button"
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "#/components/ui/table"
import { useHasPermission } from "#/routes/_public/auth/_hooks/use-has-permission"
import { orpc } from "#/libs/orpc/client"

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

interface RoleDefinitionsTableProps {
	roleDefinitions: RoleRow[]
	onEdit: (role: RoleRow) => void
	onCreate: () => void
}

export function RoleDefinitionsTable({ roleDefinitions, onEdit, onCreate }: RoleDefinitionsTableProps) {
	const queryClient = useQueryClient()
	const canSetRole = useHasPermission("user", ["set-role"])

	const deleteRole = useMutation({
		...orpc.admin.deleteRole.mutationOptions(),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: orpc.admin.listRoles.key() })
			toast.success("Role deleted")
		},
		onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to delete role"),
	})

	return (
		<div className="flex flex-col gap-4">
			<div className="flex items-center justify-between">
				<div>
					<h2 className="text-lg font-semibold">Role Definitions</h2>
					<p className="text-muted-foreground text-sm">
						Create and manage application roles.
					</p>
				</div>
				{canSetRole && (
					<Button size="sm" onClick={onCreate}>
						<IconPlus className="size-4" />
						New Role
					</Button>
				)}
			</div>

			<div className="rounded-md border">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>ID</TableHead>
							<TableHead>Display Name</TableHead>
							<TableHead>Description</TableHead>
							<TableHead>Type</TableHead>
							{canSetRole && <TableHead className="w-24" />}
						</TableRow>
					</TableHeader>
					<TableBody>
						{roleDefinitions.length === 0 ? (
							<TableRow>
								<TableCell colSpan={5} className="h-16 text-center text-sm text-muted-foreground">
									Loading roles…
								</TableCell>
							</TableRow>
						) : (
							roleDefinitions.map((r) => {
								const variant = BUILT_IN_VARIANTS[r.id] ?? "outline"
								return (
									<TableRow key={r.id}>
										<TableCell>
											<Badge variant={variant}>{r.id}</Badge>
										</TableCell>
										<TableCell className="font-medium">{r.label}</TableCell>
										<TableCell className="text-muted-foreground text-sm max-w-xs truncate">
											{r.description || "—"}
										</TableCell>
										<TableCell>
											<Badge variant={r.isSystem ? "secondary" : "outline"}>
												{r.isSystem ? "System" : "Custom"}
											</Badge>
										</TableCell>
										{canSetRole && (
											<TableCell>
												<div className="flex items-center gap-1">
													<Button
														variant="ghost"
														size="icon"
														className="size-8"
														onClick={() => onEdit(r)}
													>
														<IconPencil className="size-4" />
													</Button>
													{!r.isSystem && (
														<Button
															variant="ghost"
															size="icon"
															className="size-8 text-destructive hover:text-destructive"
															disabled={deleteRole.isPending}
															onClick={() => deleteRole.mutate({ id: r.id })}
														>
															<IconTrash className="size-4" />
														</Button>
													)}
												</div>
											</TableCell>
										)}
									</TableRow>
								)
							})
						)}
					</TableBody>
				</Table>
			</div>
		</div>
	)
}
