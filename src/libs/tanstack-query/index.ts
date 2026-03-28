import { QueryClient } from '@tanstack/react-query'

let client: QueryClient | undefined

export const getQueryClient = (): QueryClient => {
  if (!client) {
    client = new QueryClient()
  }
  return client
}

export { QueryClient }
export {
  useQuery,
  useMutation,
  useInfiniteQuery,
  useSuspenseQuery,
  useQueryClient,
  queryOptions,
  infiniteQueryOptions,
  mutationOptions,
} from '@tanstack/react-query'
export type {
  QueryKey,
  QueryOptions,
  MutationOptions,
  InfiniteQueryObserverOptions,
  UseQueryResult,
  UseMutationResult,
  UseInfiniteQueryResult,
  UseSuspenseQueryResult,
} from '@tanstack/react-query'
