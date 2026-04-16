import { useEffect } from "react"
import { Outlet, createFileRoute, redirect, useParams } from "@tanstack/react-router"

import { authClient } from "#/libs/auth/client"
import { client } from "#/libs/orpc/client"
import { useActiveOrganization } from "#/routes/_public/auth/_hooks/use-active-organization"
import { useListOrganizations } from "#/routes/_public/auth/_hooks/use-list-organizations"

export const Route = createFileRoute("/_authenticated/$orgSlug")({
	beforeLoad: async ({ params }) => {
		const ctx = await client.auth.getOrgContext({ orgSlug: params.orgSlug })
		if (!ctx) throw redirect({ to: "/auth/login" })
		if (!ctx.org) {
			if (!ctx.redirectSlug) throw redirect({ to: "/org/create" })
			throw redirect({ to: "/$orgSlug/dashboard", params: { orgSlug: ctx.redirectSlug } })
		}
		return { orgRole: ctx.orgRole }
	},
	component: OrgLayout,
})

function OrgLayout() {
	const { orgSlug } = useParams({ from: "/_authenticated/$orgSlug" })
	const { data: orgs } = useListOrganizations()
	const { data: activeOrg } = useActiveOrganization()

	useEffect(() => {
		const org = orgs?.find((o) => o.slug === orgSlug)
		if (org && activeOrg?.id !== org.id) {
			authClient.organization.setActive({ organizationId: org.id })
		}
	}, [orgSlug, orgs, activeOrg])

	return <Outlet />
}
