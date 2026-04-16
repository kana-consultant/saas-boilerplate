import { useEffect, useState } from "react"
import { IconTrash } from "@tabler/icons-react"
import { useNavigate } from "@tanstack/react-router"
import { toast } from "sonner"
import { z } from "zod"

import { Button } from "#/components/ui/button"
import { Input } from "#/components/ui/input"
import { Label } from "#/components/ui/label"
import { Separator } from "#/components/ui/separator"
import { authClient } from "#/libs/auth/client"
import { FieldError, useForm } from "#/libs/tanstack-form"
import { useActiveOrganization } from "#/routes/_public/auth/_hooks/use-active-organization"

const orgSettingsSchema = z.object({
	name: z.string().min(1, "Name is required").max(100, "Name too long"),
	slug: z
		.string()
		.min(1, "Slug is required")
		.max(50, "Slug too long")
		.regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers, and hyphens only"),
	logo: z.union([z.literal(""), z.string().url("Invalid URL")]),
})

function slugify(value: string) {
	return value
		.toLowerCase()
		.replace(/\s+/g, "-")
		.replace(/[^a-z0-9-]/g, "")
		.replace(/-+/g, "-")
		.replace(/^-|-$/g, "")
}

export function OrgSettingsGeneral() {
	const navigate = useNavigate()
	const { data: activeOrg } = useActiveOrganization()

	const [submitError, setSubmitError] = useState<string | null>(null)
	const [deleting, setDeleting] = useState(false)

	const form = useForm({
		defaultValues: {
			name: activeOrg?.name ?? "",
			slug: activeOrg?.slug ?? "",
			logo: activeOrg?.logo ?? "",
		},
		validators: { onChange: orgSettingsSchema },
		onSubmit: async ({ value }) => {
			if (!activeOrg) return
			setSubmitError(null)
			const { error } = await authClient.organization.update({
				organizationId: activeOrg.id,
				data: {
					name: value.name,
					slug: value.slug,
					logo: value.logo || undefined,
				},
			})
			if (error) {
				const msg = error.message ?? "Failed to update organization"
				setSubmitError(msg)
				toast.error(msg)
			} else {
				toast.success("Organization updated")
			}
		},
	})

	useEffect(() => {
		if (activeOrg) {
			form.reset({
				name: activeOrg.name,
				slug: activeOrg.slug ?? "",
				logo: activeOrg.logo ?? "",
			})
		}
	}, [activeOrg?.id])

	if (!activeOrg) return null

	const handleDelete = async () => {
		if (
			!window.confirm(
				`Are you sure you want to delete "${activeOrg.name}"? This cannot be undone.`,
			)
		)
			return

		setDeleting(true)
		const { error } = await authClient.organization.delete({
			organizationId: activeOrg.id,
		})

		if (error) {
			const msg = error.message ?? "Failed to delete organization"
			setSubmitError(msg)
			toast.error(msg)
			setDeleting(false)
		} else {
			toast.success("Organization deleted")
			navigate({ to: "/org/create" })
		}
	}

	return (
		<div className="space-y-8">
			<form
				onSubmit={(e) => {
					e.preventDefault()
					form.handleSubmit()
				}}
				className="space-y-4"
			>
				<form.Field name="name">
					{(field) => (
						<div className="space-y-2">
							<Label htmlFor="org-name">Organization name</Label>
							<Input
								id="org-name"
								value={field.state.value}
								onChange={(e) => field.handleChange(e.target.value)}
								onBlur={field.handleBlur}
								aria-invalid={field.state.meta.errors.length > 0}
							/>
							<FieldError field={field} />
						</div>
					)}
				</form.Field>

				<form.Field name="slug">
					{(field) => (
						<div className="space-y-2">
							<Label htmlFor="org-slug">Slug</Label>
							<Input
								id="org-slug"
								value={field.state.value}
								onChange={(e) => field.handleChange(slugify(e.target.value))}
								onBlur={field.handleBlur}
								aria-invalid={field.state.meta.errors.length > 0}
							/>
							<FieldError field={field} />
						</div>
					)}
				</form.Field>

				<form.Field name="logo">
					{(field) => (
						<div className="space-y-2">
							<Label htmlFor="org-logo">Logo URL</Label>
							<Input
								id="org-logo"
								type="url"
								placeholder="https://..."
								value={field.state.value}
								onChange={(e) => field.handleChange(e.target.value)}
								onBlur={field.handleBlur}
								aria-invalid={field.state.meta.errors.length > 0}
							/>
							<FieldError field={field} />
						</div>
					)}
				</form.Field>

				{submitError && <p className="text-sm text-destructive">{submitError}</p>}

				<form.Subscribe
					selector={(s) => ({ canSubmit: s.canSubmit, isSubmitting: s.isSubmitting })}
				>
					{({ canSubmit, isSubmitting }) => (
						<Button type="submit" disabled={!canSubmit || isSubmitting}>
							{isSubmitting ? "Saving..." : "Save changes"}
						</Button>
					)}
				</form.Subscribe>
			</form>

			<Separator />

			<div className="space-y-4">
				<div>
					<h3 className="text-base font-semibold text-destructive">
						Danger zone
					</h3>
					<p className="text-sm text-muted-foreground">
						Permanently delete this organization and all its data.
					</p>
				</div>
				<Button
					variant="destructive"
					onClick={handleDelete}
					disabled={deleting}
				>
					<IconTrash className="size-4" />
					{deleting ? "Deleting..." : "Delete Organization"}
				</Button>
			</div>
		</div>
	)
}
