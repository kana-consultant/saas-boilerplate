import { IconTrash, IconUserX } from "@tabler/icons-react"

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
import { Separator } from "#/components/ui/separator"
import { OrgInviteForm } from "../org-invite-form"
import { useOrgMembers } from "./hook"
import { ROLES, type OrgRole } from "./schema"

export function OrgMembers() {
	const {
		activeOrg,
		members,
		invitations,
		refetch,
		handleChangeRole,
		handleRemoveMember,
		handleCancelInvitation,
	} = useOrgMembers()

	if (!activeOrg) return null

	return (
		<div className="space-y-6">
			<OrgInviteForm
				organizationId={activeOrg.id}
				onInvited={() => refetch?.()}
			/>

			<Card>
				<CardHeader>
					<CardTitle>Members</CardTitle>
					<CardDescription>{members.length} member(s)</CardDescription>
				</CardHeader>
				<CardContent className="space-y-0 p-0">
					{members.map((member, idx) => (
						<div key={member.id}>
							{idx > 0 && <Separator />}
							<div className="flex items-center gap-3 px-6 py-4">
								<div className="flex-1 min-w-0">
									<p className="truncate font-medium text-sm">{member.user.name}</p>
									<p className="truncate text-xs text-muted-foreground">{member.user.email}</p>
								</div>
								<Select
									value={member.role}
									onValueChange={(v) => handleChangeRole(member.id, v as OrgRole)}
								>
									<SelectTrigger className="w-28 h-8 text-xs">
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
								<Button
									variant="ghost"
									size="icon"
									className="size-8 text-muted-foreground hover:text-destructive"
									onClick={() => handleRemoveMember(member.id)}
								>
									<IconUserX className="size-4" />
								</Button>
							</div>
						</div>
					))}
				</CardContent>
			</Card>

			{invitations.length > 0 && (
				<Card>
					<CardHeader>
						<CardTitle>Pending invitations</CardTitle>
					</CardHeader>
					<CardContent className="space-y-0 p-0">
						{invitations.map((inv, idx) => (
							<div key={inv.id}>
								{idx > 0 && <Separator />}
								<div className="flex items-center gap-3 px-6 py-4">
									<div className="flex-1 min-w-0">
										<p className="truncate text-sm">{inv.email}</p>
									</div>
									<Badge variant="secondary" className="capitalize text-xs">{inv.role}</Badge>
									<Badge variant="outline" className="text-xs">{inv.status}</Badge>
									<Button
										variant="ghost"
										size="icon"
										className="size-8 text-muted-foreground hover:text-destructive"
										onClick={() => handleCancelInvitation(inv.id)}
									>
										<IconTrash className="size-4" />
									</Button>
								</div>
							</div>
						))}
					</CardContent>
				</Card>
			)}
		</div>
	)
}
