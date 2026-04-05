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
import { useOrgInviteForm } from "./hook"
import { ROLES, type OrgInviteFormProps } from "./schema"

export function OrgInviteForm({ organizationId, onInvited }: OrgInviteFormProps) {
	const {
		inviteEmail,
		setInviteEmail,
		inviteRole,
		setInviteRole,
		inviting,
		inviteError,
		handleInvite,
	} = useOrgInviteForm({ organizationId, onInvited })

	return (
		<Card>
			<CardHeader>
				<CardTitle>Invite member</CardTitle>
				<CardDescription>
					Send an invitation to add someone to this organization.
				</CardDescription>
			</CardHeader>
			<CardContent>
				<form onSubmit={handleInvite} className="flex gap-3">
					<div className="flex-1 space-y-1">
						<Label htmlFor="invite-email" className="sr-only">Email</Label>
						<Input
							id="invite-email"
							type="email"
							placeholder="colleague@example.com"
							value={inviteEmail}
							onChange={(e) => setInviteEmail(e.target.value)}
							required
						/>
					</div>
					<Select value={inviteRole} onValueChange={(v) => setInviteRole(v as typeof inviteRole)}>
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
					<Button type="submit" disabled={inviting}>
						{inviting ? "Sending..." : "Invite"}
					</Button>
				</form>
				{inviteError && (
					<p className="mt-2 text-sm text-destructive">{inviteError}</p>
				)}
			</CardContent>
		</Card>
	)
}
