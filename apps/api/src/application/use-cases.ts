import type { ActivityRepository } from "#/domain/activity/activity-repository.ts"
import type { MemberRepository } from "#/domain/member/member-repository.ts"
import type { OrganizationRepository } from "#/domain/organization/organization-repository.ts"
import type { AuthService } from "#/domain/ports/auth-service.ts"
import type { Cache } from "#/domain/ports/cache.ts"
import type {
	PermissionRepository,
	RoleRepository,
} from "#/domain/role/role-repository.ts"
import type { UserRepository } from "#/domain/user/user-repository.ts"

import { makeListActivityLogs } from "./activity/list-activity-logs.ts"
import { makeGetDefaultOrg } from "./auth/get-default-org.ts"
import { makeGetOrgContext } from "./auth/get-org-context.ts"
import { makeGetOrgRole } from "./auth/get-org-role.ts"
import { makeGetSession } from "./auth/get-session.ts"
import { makeListOrganizations } from "./auth/list-organizations.ts"
import { makeCreateRole } from "./role/create-role.ts"
import { makeDeleteRole } from "./role/delete-role.ts"
import { makeListRolePermissions } from "./role/list-role-permissions.ts"
import { makeListRoles } from "./role/list-roles.ts"
import { makeSeedPermissions } from "./role/seed-permissions.ts"
import { makeSetRolePermission } from "./role/set-role-permission.ts"
import { makeUpdateRole } from "./role/update-role.ts"
import { makeBanUser } from "./user/ban-user.ts"
import { makeCreateUser } from "./user/create-user.ts"
import { makeDeleteUser } from "./user/delete-user.ts"
import { makeListUsers } from "./user/list-users.ts"
import { makeSetRole } from "./user/set-role.ts"
import { makeUnbanUser } from "./user/unban-user.ts"
import { makeUpdateUser } from "./user/update-user.ts"

export interface Dependencies {
	userRepo: UserRepository
	memberRepo: MemberRepository
	orgRepo: OrganizationRepository
	roleRepo: RoleRepository
	permRepo: PermissionRepository
	activityRepo: ActivityRepository
	cache: Cache
	auth: AuthService
}

export function buildUseCases(deps: Dependencies) {
	const seedPermissions = makeSeedPermissions({
		roleRepo: deps.roleRepo,
		permRepo: deps.permRepo,
	})

	return {
		auth: {
			getSession: makeGetSession({ auth: deps.auth }),
			listOrganizations: makeListOrganizations({ auth: deps.auth }),
			getOrgRole: makeGetOrgRole({ memberRepo: deps.memberRepo }),
			getDefaultOrg: makeGetDefaultOrg({
				orgRepo: deps.orgRepo,
				cache: deps.cache,
			}),
			getOrgContext: makeGetOrgContext({
				orgRepo: deps.orgRepo,
				memberRepo: deps.memberRepo,
				cache: deps.cache,
			}),
		},
		user: {
			list: makeListUsers({ userRepo: deps.userRepo }),
			ban: makeBanUser({
				auth: deps.auth,
				memberRepo: deps.memberRepo,
				activityRepo: deps.activityRepo,
			}),
			unban: makeUnbanUser({
				auth: deps.auth,
				memberRepo: deps.memberRepo,
				activityRepo: deps.activityRepo,
			}),
			setRole: makeSetRole({
				memberRepo: deps.memberRepo,
				activityRepo: deps.activityRepo,
				cache: deps.cache,
			}),
			create: makeCreateUser({
				auth: deps.auth,
				memberRepo: deps.memberRepo,
				activityRepo: deps.activityRepo,
				cache: deps.cache,
			}),
			update: makeUpdateUser({
				auth: deps.auth,
				memberRepo: deps.memberRepo,
				activityRepo: deps.activityRepo,
			}),
			delete: makeDeleteUser({
				auth: deps.auth,
				activityRepo: deps.activityRepo,
			}),
		},
		role: {
			list: makeListRoles({ roleRepo: deps.roleRepo }),
			create: makeCreateRole({
				roleRepo: deps.roleRepo,
				activityRepo: deps.activityRepo,
			}),
			update: makeUpdateRole({
				roleRepo: deps.roleRepo,
				activityRepo: deps.activityRepo,
			}),
			delete: makeDeleteRole({
				roleRepo: deps.roleRepo,
				activityRepo: deps.activityRepo,
			}),
			listPermissions: makeListRolePermissions({
				permRepo: deps.permRepo,
				seedPermissions,
			}),
			setPermission: makeSetRolePermission({
				permRepo: deps.permRepo,
				activityRepo: deps.activityRepo,
			}),
		},
		activity: {
			list: makeListActivityLogs({ activityRepo: deps.activityRepo }),
		},
	}
}

export type UseCases = ReturnType<typeof buildUseCases>
