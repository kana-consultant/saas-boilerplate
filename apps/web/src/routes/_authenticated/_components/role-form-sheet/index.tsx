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
import { Textarea } from "#/components/ui/textarea"
import { FieldError } from "#/libs/tanstack-form"
import { extractErrorMessage, type RoleFormSheetProps } from "../role-form-helpers"
import { useRoleFormSheet } from "./hook"

export function RoleFormSheet({ mode, role, open, onOpenChange }: RoleFormSheetProps) {
	const { form, mutation } = useRoleFormSheet({ mode, role, open, onOpenChange })

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent side="right">
				<SheetHeader>
					<SheetTitle>{mode === "create" ? "New Role" : "Edit Role"}</SheetTitle>
					<SheetDescription>
						{mode === "create"
							? "Create a new application role."
							: "Update the role's label and description."}
					</SheetDescription>
				</SheetHeader>
				<form
					className="flex flex-col gap-4 px-4 py-4"
					onSubmit={(e) => {
						e.preventDefault()
						form.handleSubmit()
					}}
				>
					{mode === "create" && (
						<form.Field name="id">
							{(field) => (
								<div className="flex flex-col gap-1.5">
									<Label htmlFor="role-id">Role ID</Label>
									<Input
										id="role-id"
										placeholder="e.g. moderator"
										maxLength={50}
										value={field.state.value}
										onChange={(e) => field.handleChange(e.target.value)}
										onBlur={field.handleBlur}
										aria-invalid={field.state.meta.errors.length > 0}
									/>
									<p className="text-muted-foreground text-xs">
										Lowercase letters, numbers, hyphens. Cannot be changed later.
									</p>
									<FieldError field={field} />
								</div>
							)}
						</form.Field>
					)}

					<form.Field name="label">
						{(field) => (
							<div className="flex flex-col gap-1.5">
								<Label htmlFor="role-label">Display Name</Label>
								<Input
									id="role-label"
									placeholder="e.g. Moderator"
									maxLength={100}
									value={field.state.value}
									onChange={(e) => field.handleChange(e.target.value)}
									onBlur={field.handleBlur}
									aria-invalid={field.state.meta.errors.length > 0}
								/>
								<FieldError field={field} />
							</div>
						)}
					</form.Field>

					<form.Field name="description">
						{(field) => (
							<div className="flex flex-col gap-1.5">
								<Label htmlFor="role-description">Description</Label>
								<Textarea
									id="role-description"
									placeholder="What can this role do?"
									maxLength={500}
									rows={3}
									value={field.state.value}
									onChange={(e) => field.handleChange(e.target.value)}
									onBlur={field.handleBlur}
									aria-invalid={field.state.meta.errors.length > 0}
								/>
								<FieldError field={field} />
							</div>
						)}
					</form.Field>

					{mutation.error && (
						<p className="text-destructive text-sm" role="alert">
							{extractErrorMessage(mutation.error)}
						</p>
					)}

					<SheetFooter className="px-0">
						<Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
							Cancel
						</Button>
						<form.Subscribe
							selector={(s) => ({
								canSubmit: s.canSubmit,
								isSubmitting: s.isSubmitting,
							})}
						>
							{({ canSubmit, isSubmitting }) => (
								<Button type="submit" disabled={!canSubmit || isSubmitting}>
									{isSubmitting
										? mode === "create" ? "Creating…" : "Saving…"
										: mode === "create" ? "Create" : "Save"}
								</Button>
							)}
						</form.Subscribe>
					</SheetFooter>
				</form>
			</SheetContent>
		</Sheet>
	)
}
