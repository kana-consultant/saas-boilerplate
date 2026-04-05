import { Badge } from "#/components/ui/badge"
import { Button } from "#/components/ui/button"
import { Input } from "#/components/ui/input"
import { Label } from "#/components/ui/label"
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetTitle,
} from "#/components/ui/sheet"
import {
	nameSchema,
	emailSchema,
	fieldError,
	extractErrorMessage,
	type UserFormSheetProps,
} from "../user-form-helpers"
import { UserFormCreate } from "../user-form-create"
import { useUserFormSheet } from "./hook"

export function UserFormSheet({
	mode,
	user,
	defaultRole = "member",
	open,
	onOpenChange,
}: UserFormSheetProps) {
	const { editForm, updateUser, deleteUser } = useUserFormSheet({ mode, user, onOpenChange })

	if (mode === "delete") {
		return (
			<Sheet open={open} onOpenChange={onOpenChange}>
				<SheetContent side="right">
					<SheetHeader>
						<SheetTitle>Delete User</SheetTitle>
						<SheetDescription>This action cannot be undone.</SheetDescription>
					</SheetHeader>
					<div className="px-4 py-4">
						<p className="text-sm">
							Are you sure you want to delete{" "}
							<span className="font-medium">{user?.name}</span>{" "}
							<span className="text-muted-foreground">({user?.email})</span>?
						</p>
						{deleteUser.error && (
							<p className="text-destructive mt-3 text-sm" role="alert">
								{extractErrorMessage(deleteUser.error)}
							</p>
						)}
					</div>
					<SheetFooter>
						<Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
						<Button
							variant="destructive"
							disabled={deleteUser.isPending}
							onClick={() => user && deleteUser.mutate({ userId: user.id })}
						>
							{deleteUser.isPending ? "Deleting…" : "Delete"}
						</Button>
					</SheetFooter>
				</SheetContent>
			</Sheet>
		)
	}

	if (mode === "edit") {
		return (
			<Sheet open={open} onOpenChange={onOpenChange}>
				<SheetContent side="right">
					<SheetHeader>
						<SheetTitle>Edit User</SheetTitle>
						<SheetDescription>Update name and email.</SheetDescription>
					</SheetHeader>
					<form
						className="flex flex-col gap-4 px-4 py-4"
						onSubmit={(e) => { e.preventDefault(); editForm.handleSubmit() }}
					>
						<editForm.Field
							name="name"
							validators={{
								onChange: ({ value }) => fieldError(nameSchema, value),
								onBlur: ({ value }) => fieldError(nameSchema, value),
							}}
						>
							{(field) => (
								<div className="flex flex-col gap-1.5">
									<Label htmlFor="edit-name">Name</Label>
									<Input
										id="edit-name"
										placeholder="e.g. Jane Smith"
										autoComplete="name"
										maxLength={100}
										value={field.state.value}
										onChange={(e) => field.handleChange(e.target.value)}
										onBlur={field.handleBlur}
										aria-invalid={field.state.meta.errors.length > 0}
									/>
									{field.state.meta.errors[0] && (
										<p className="text-destructive text-sm" role="alert">
											{field.state.meta.errors[0]}
										</p>
									)}
								</div>
							)}
						</editForm.Field>

						<editForm.Field
							name="email"
							validators={{
								onChange: ({ value }) => fieldError(emailSchema, value),
								onBlur: ({ value }) => fieldError(emailSchema, value),
							}}
						>
							{(field) => (
								<div className="flex flex-col gap-1.5">
									<Label htmlFor="edit-email">Email</Label>
									<Input
										id="edit-email"
										type="email"
										placeholder="e.g. jane@example.com"
										autoComplete="email"
										maxLength={254}
										value={field.state.value}
										onChange={(e) => field.handleChange(e.target.value)}
										onBlur={field.handleBlur}
										aria-invalid={field.state.meta.errors.length > 0}
									/>
									{field.state.meta.errors[0] && (
										<p className="text-destructive text-sm" role="alert">
											{field.state.meta.errors[0]}
										</p>
									)}
								</div>
							)}
						</editForm.Field>

						<div className="flex flex-col gap-1.5">
							<Label>Role</Label>
							<Badge variant="outline" className="w-fit">{user?.role ?? "member"}</Badge>
							<p className="text-muted-foreground text-xs">Change role from the Users table.</p>
						</div>

						{updateUser.error && (
							<p className="text-destructive text-sm" role="alert">
								{extractErrorMessage(updateUser.error)}
							</p>
						)}

						<SheetFooter className="px-0">
							<Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
								Cancel
							</Button>
							<editForm.Subscribe
								selector={(s) => ({
									canSubmit: s.canSubmit,
									isSubmitting: s.isSubmitting,
									name: s.values.name,
									email: s.values.email,
								})}
							>
								{({ canSubmit, isSubmitting, name, email }) => (
									<Button
										type="submit"
										disabled={!canSubmit || isSubmitting || !name.trim() || !email.trim()}
									>
										{isSubmitting ? "Saving…" : "Save"}
									</Button>
								)}
							</editForm.Subscribe>
						</SheetFooter>
					</form>
				</SheetContent>
			</Sheet>
		)
	}

	return (
		<UserFormCreate defaultRole={defaultRole} open={open} onOpenChange={onOpenChange} />
	)
}
