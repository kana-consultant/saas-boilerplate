import { Button } from "#/components/ui/button"
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "#/components/ui/card"
import { Input } from "#/components/ui/input"
import { Label } from "#/components/ui/label"
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "#/components/ui/select"
import { FieldError } from "#/libs/tanstack-form"
import { useOrgInviteForm } from "./hook"
import { type OrgInviteFormProps, type OrgRole, ROLES } from "./schema"

export function OrgInviteForm({
	organizationId,
	onInvited,
}: OrgInviteFormProps) {
	const { form, inviteError } = useOrgInviteForm({ organizationId, onInvited })

	return (
		<Card>
			<CardHeader>
				<CardTitle>Invite member</CardTitle>
				<CardDescription>
					Send an invitation to add someone to this organization.
				</CardDescription>
			</CardHeader>
			<CardContent>
				<form
					onSubmit={(e) => {
						e.preventDefault()
						form.handleSubmit()
					}}
					className="flex gap-3"
				>
					<form.Field name="email">
						{(field) => (
							<div className="flex-1 space-y-1">
								<Label htmlFor="invite-email" className="sr-only">
									Email
								</Label>
								<Input
									id="invite-email"
									type="email"
									placeholder="colleague@example.com"
									value={field.state.value}
									onChange={(e) => field.handleChange(e.target.value)}
									onBlur={field.handleBlur}
									aria-invalid={field.state.meta.errors.length > 0}
								/>
								<FieldError field={field} />
							</div>
						)}
					</form.Field>

					<form.Field name="role">
						{(field) => (
							<Select
								value={field.state.value}
								onValueChange={(v) => field.handleChange(v as OrgRole)}
							>
								<SelectTrigger className="w-32">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{ROLES.map((r) => (
										<SelectItem key={r} value={r}>
											{r.charAt(0).toUpperCase() + r.slice(1)}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						)}
					</form.Field>

					<form.Subscribe
						selector={(s) => ({
							canSubmit: s.canSubmit,
							isSubmitting: s.isSubmitting,
						})}
					>
						{({ canSubmit, isSubmitting }) => (
							<Button type="submit" disabled={!canSubmit || isSubmitting}>
								{isSubmitting ? "Sending..." : "Invite"}
							</Button>
						)}
					</form.Subscribe>
				</form>
				{inviteError && (
					<p className="mt-2 text-sm text-destructive">{inviteError}</p>
				)}
			</CardContent>
		</Card>
	)
}
