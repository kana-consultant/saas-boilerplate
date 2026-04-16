import { authClient } from "#/libs/auth/client"

export const useActiveOrganization = () => authClient.useActiveOrganization()
