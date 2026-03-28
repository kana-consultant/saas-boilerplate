import * as React from "react"
import {
	IconDashboard,
	IconDatabase,
	IconFileWord,
	IconHelp,
	IconReport,
	IconSearch,
	IconSettings,
	IconShieldCheck,
	IconUserCog,
	IconUsers,
	IconUsersGroup,
	IconBuilding,
} from "@tabler/icons-react"

import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarHeader,
} from "#/components/ui/sidebar"
import { useHasPermission } from "#/routes/_public/auth/_hooks/use-has-permission"
import { useSession } from "#/routes/_public/auth/_hooks/use-session"
import { useActiveOrganization } from "#/routes/_public/auth/_hooks/use-active-organization"
import { NavDocuments } from "./nav-documents"
import { NavMain } from "./nav-main"
import { NavSecondary } from "./nav-secondary"
import { NavUser } from "./nav-user"
import { OrgSwitcher } from "./org-switcher"

const navSecondary = [
	{ title: "Settings", url: "/settings", icon: IconSettings },
	{ title: "Get Help", url: "#", icon: IconHelp },
	{ title: "Search", url: "#", icon: IconSearch },
]

const documents = [
	{ name: "Data Library", url: "#", icon: IconDatabase },
	{ name: "Reports", url: "#", icon: IconReport },
	{ name: "Word Assistant", url: "#", icon: IconFileWord },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
	const session = useSession()
	const canListUsers = useHasPermission("user", ["list"])
	const { data: activeOrg } = useActiveOrganization()

	const user = {
		name: session.data?.user?.name ?? "",
		email: session.data?.user?.email ?? "",
		avatar: session.data?.user?.image ?? "",
	}

	const navMain = [
		{ title: "Dashboard", url: "/dashboard", icon: IconDashboard },
		...(canListUsers
			? [
					{ title: "Users", url: "/users", icon: IconUsers },
					{ title: "Roles", url: "/roles", icon: IconUserCog },
					{ title: "Permissions", url: "/permissions", icon: IconShieldCheck },
				]
			: []),
		...(activeOrg
			? [
					{ title: "Organization", url: "/org/settings", icon: IconBuilding },
					{ title: "Members", url: "/org/settings?tab=members", icon: IconUsersGroup },
				]
			: []),
	]

	return (
		<Sidebar collapsible="icon" {...props}>
			<SidebarHeader>
				<OrgSwitcher />
			</SidebarHeader>
			<SidebarContent>
				<NavMain items={navMain} />
				<NavDocuments items={documents} />
				<NavSecondary items={navSecondary} className="mt-auto" />
			</SidebarContent>
			<SidebarFooter>
				<NavUser user={user} />
			</SidebarFooter>
		</Sidebar>
	)
}
