import { useRef, useState } from "react"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { IconBuilding } from "@tabler/icons-react"
import { z } from "zod"

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
import { authClient } from "#/libs/auth/client"
import { FieldError, useForm } from "#/libs/tanstack-form"

export const Route = createFileRoute("/_authenticated/org/create")({
	component: CreateOrgPage,
})

const createOrgSchema = z.object({
	name: z.string().min(1, "Name is required").max(100, "Name too long"),
	slug: z
		.string()
		.min(1, "Slug is required")
		.max(50, "Slug too long")
		.regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers, and hyphens only"),
})

function slugify(value: string) {
	return value
		.toLowerCase()
		.replace(/\s+/g, "-")
		.replace(/[^a-z0-9-]/g, "")
		.replace(/-+/g, "-")
		.replace(/^-|-$/g, "")
}

function CreateOrgPage() {
	const navigate = useNavigate()
	const [submitError, setSubmitError] = useState<string | null>(null)
	const slugEditedRef = useRef(false)

	const form = useForm({
		defaultValues: { name: "", slug: "" },
		validators: { onChange: createOrgSchema },
		onSubmit: async ({ value }) => {
			setSubmitError(null)
			const { error } = await authClient.organization.create({
				name: value.name.trim(),
				slug: value.slug.trim(),
			})
			if (error) {
				setSubmitError(error.message ?? "Failed to create organization")
				return
			}
			navigate({
				to: "/$orgSlug/dashboard",
				params: { orgSlug: value.slug.trim() },
			})
		},
	})

	return (
		<div className="flex min-h-screen items-center justify-center bg-background p-4">
			<Card className="w-full max-w-md">
				<CardHeader className="text-center">
					<div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-full bg-muted">
						<IconBuilding className="size-6" />
					</div>
					<CardTitle>Create your organization</CardTitle>
					<CardDescription>
						Set up an organization to get started.
					</CardDescription>
				</CardHeader>
				<CardContent>
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
									<Label htmlFor="name">Organization name</Label>
									<Input
										id="name"
										placeholder="Acme Inc."
										value={field.state.value}
										onChange={(e) => {
											const v = e.target.value
											field.handleChange(v)
											if (!slugEditedRef.current) {
												form.setFieldValue("slug", slugify(v))
											}
										}}
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
									<Label htmlFor="slug">Slug</Label>
									<Input
										id="slug"
										placeholder="acme-inc"
										value={field.state.value}
										onChange={(e) => {
											slugEditedRef.current = true
											field.handleChange(slugify(e.target.value))
										}}
										onBlur={field.handleBlur}
										aria-invalid={field.state.meta.errors.length > 0}
									/>
									<p className="text-xs text-muted-foreground">
										Used in URLs. Only lowercase letters, numbers, and hyphens.
									</p>
									<FieldError field={field} />
								</div>
							)}
						</form.Field>

						{submitError && (
							<p className="text-sm text-destructive">{submitError}</p>
						)}

						<form.Subscribe
							selector={(s) => ({
								canSubmit: s.canSubmit,
								isSubmitting: s.isSubmitting,
							})}
						>
							{({ canSubmit, isSubmitting }) => (
								<Button
									type="submit"
									className="w-full"
									disabled={!canSubmit || isSubmitting}
								>
									{isSubmitting ? "Creating..." : "Create Organization"}
								</Button>
							)}
						</form.Subscribe>
					</form>
				</CardContent>
			</Card>
		</div>
	)
}
