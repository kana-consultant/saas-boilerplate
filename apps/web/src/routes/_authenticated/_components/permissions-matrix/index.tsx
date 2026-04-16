import { Badge } from "#/components/ui/badge"
import { Button } from "#/components/ui/button"
import {
	Card,
	CardContent,
	CardDescription,
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
import { Switch } from "#/components/ui/switch"
import { resourceActions } from "#/libs/auth/permissions"
import {
	ACTION_DESCRIPTIONS,
	ACTION_LABELS,
	ALL_ROWS,
	BUILT_IN_VARIANTS,
	RESOURCE_DESCRIPTIONS,
	RESOURCE_LABELS,
} from "../permissions-constants"
import { usePermissionsMatrix } from "./hook"

export function PermissionsMatrix() {
	const {
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
		discardChanges,
	} = usePermissionsMatrix()

	return (
		<div className="flex flex-col gap-6">
			<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
				<Select
					value={selectedRoleId}
					onValueChange={setSelectedRoleId}
					disabled={isLoading}
				>
					<SelectTrigger className="w-56">
						<SelectValue placeholder="Pick a role…" />
					</SelectTrigger>
					<SelectContent>
						{roles.map((r) => (
							<SelectItem key={r.id} value={r.id}>
								<div className="flex items-center gap-2">
									<Badge
										variant={BUILT_IN_VARIANTS[r.id] ?? "outline"}
										className="text-xs"
									>
										{r.id}
									</Badge>
									{r.label}
								</div>
							</SelectItem>
						))}
					</SelectContent>
				</Select>

				{selectedRole && (
					<div className="flex items-center gap-3">
						<Badge variant={BUILT_IN_VARIANTS[selectedRole.id] ?? "outline"}>
							{selectedRole.label}
						</Badge>
						{selectedRole.description && (
							<span className="text-muted-foreground text-sm">
								{selectedRole.description}
							</span>
						)}
						<span className="text-muted-foreground ml-auto text-sm">
							<span className="text-foreground font-semibold">
								{grantedCount}
							</span>
							{" / "}
							{ALL_ROWS.length} permissions
						</span>
					</div>
				)}
			</div>

			{!canEdit && (
				<p className="text-muted-foreground text-sm">
					Read-only. Only owners can modify permissions.
				</p>
			)}

			{canEdit && (
				<div className="flex items-center justify-between rounded-lg border px-4 py-3">
					<p className="text-sm text-muted-foreground">
						{hasPendingChanges
							? `${pendingChanges.size} unsaved change${pendingChanges.size === 1 ? "" : "s"}`
							: "No pending changes"}
					</p>
					<div className="flex gap-2">
						{hasPendingChanges && (
							<Button
								variant="outline"
								size="sm"
								onClick={discardChanges}
								disabled={isSaving}
							>
								Discard
							</Button>
						)}
						<Button
							size="sm"
							onClick={handleSave}
							disabled={!hasPendingChanges || isSaving}
						>
							{isSaving ? "Saving…" : "Save changes"}
						</Button>
					</div>
				</div>
			)}

			{selectedRole ? (
				<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
					{(
						Object.entries(resourceActions) as [
							keyof typeof resourceActions,
							readonly string[],
						][]
					).map(([resource, actions]) => {
						const grantedInResource = actions.filter((a) =>
							isGranted(resource as string, a),
						).length

						return (
							<Card key={resource}>
								<CardHeader className="pb-3">
									<div className="flex items-center justify-between">
										<div>
											<CardTitle className="text-base">
												{RESOURCE_LABELS[resource] ?? resource}
											</CardTitle>
											<CardDescription>
												{RESOURCE_DESCRIPTIONS[resource] ?? ""}
											</CardDescription>
										</div>
										<span className="text-muted-foreground text-sm">
											<span className="text-foreground font-semibold">
												{grantedInResource}
											</span>
											/{actions.length}
										</span>
									</div>
								</CardHeader>
								<CardContent className="flex flex-col gap-3">
									{actions.map((action) => {
										const granted = isGranted(resource as string, action)
										const isPending = pendingChanges.has(
											`${resource}:${action}`,
										)

										return (
											<div
												key={action}
												className="flex items-center justify-between"
											>
												<div>
													<p
														className={`text-sm font-medium${isPending ? " text-primary" : ""}`}
													>
														{ACTION_LABELS[action] ?? action}
													</p>
													{ACTION_DESCRIPTIONS[action] && (
														<p className="text-muted-foreground text-xs">
															{ACTION_DESCRIPTIONS[action]}
														</p>
													)}
												</div>
												<Switch
													checked={granted}
													disabled={!canEdit || isLoading || isSaving}
													onCheckedChange={(checked) =>
														handleToggle(resource as string, action, checked)
													}
												/>
											</div>
										)
									})}
								</CardContent>
							</Card>
						)
					})}
				</div>
			) : (
				!isLoading && (
					<p className="text-muted-foreground text-sm">
						No roles found. Create one on the Roles page first.
					</p>
				)
			)}
		</div>
	)
}
