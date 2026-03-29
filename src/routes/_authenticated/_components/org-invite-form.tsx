import { useState } from "react"
import { toast } from "sonner"

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
import { authClient } from "#/server/auth/client"

type OrgRole = "owner" | "admin" | "member"

const ROLES: OrgRole[] = ["owner", "admin", "member"]

interface OrgInviteFormProps {
	organizationId: string
	onInvited?: () => void
}

export function OrgInviteForm({ organizationId, onInvited }: OrgInviteFormProps) {
	const [inviteEmail, setInviteEmail] = useState("")
	const [inviteRole, setInviteRole] = useState<OrgRole>("member")
	const [inviting, setInviting] = useState(false)
	const [inviteError, setInviteError] = useState<string | null>(null)

	const handleInvite = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!inviteEmail.trim()) return
		setInviting(true)
		setInviteError(null)

		const { error } = await authClient.organization.inviteMember({
			organizationId,
			email: inviteEmail.trim(),
			role: inviteRole,
		})

		if (error) {
			setInviteError(error.message ?? "Failed to send invitation")
			toast.error(error.message ?? "Failed to send invitation")
		} else {
			setInviteEmail("")
			toast.success("Invitation sent")
			onInvited?.()
		}
		setInviting(false)
	}

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
						<Label htmlFor="invite-email" className="sr-only">
							Email
						</Label>
						<Input
							id="invite-email"
							type="email"
							placeholder="colleague@example.com"
							value={inviteEmail}
							onChange={(e) => setInviteEmail(e.target.value)}
							required
						/>
					</div>
					<Select
						value={inviteRole}
						onValueChange={(v) => setInviteRole(v as OrgRole)}
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
