import { QueryClient, QueryKey, useQuery, useMutation, useInfiniteQuery, UseQueryOptions, UseMutationOptions, UseInfiniteQueryOptions, InfiniteData, QueryMeta } from '@tanstack/react-query';

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30 * 1000,
        gcTime: 5 * 60 * 1000,
        retry: 2,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
      },
      mutations: {
        retry: 1,
      },
    },
  });
}

export const queryClient = createQueryClient();

type KeyFactorySegment = string | number | Record<string, unknown> | undefined | null;

export function createQueryKeyFactory(prefix: string) {
  const all = (): QueryKey => [prefix];
  const list = (filters?: Record<string, unknown>): QueryKey => [prefix, 'list', filters].filter(Boolean);
  const detail = (id: string | number): QueryKey => [prefix, 'detail', id];
  const byTenant = (tenantId: string): QueryKey => [prefix, 'tenant', tenantId];

  return {
    all,
    list,
    detail,
    byTenant,
    bySlug: (slug: string): QueryKey => [prefix, 'slug', slug],
    paginated: (params: Record<string, unknown>): QueryKey => [prefix, 'paginated', params],
    custom: (...segments: KeyFactorySegment[]): QueryKey => [prefix, ...segments.filter((s) => s !== undefined && s !== null)],
  };
}

export const bookingsKeys = createQueryKeyFactory('bookings');
export const paymentsKeys = createQueryKeyFactory('payments');
export const jobsKeys = createQueryKeyFactory('jobs');
export const workersKeys = createQueryKeyFactory('workers');
export const customersKeys = createQueryKeyFactory('customers');
export const servicesKeys = createQueryKeyFactory('services');
export const usersKeys = createQueryKeyFactory('users');
export const documentsKeys = createQueryKeyFactory('documents');
export const notificationsKeys = createQueryKeyFactory('notifications');
export const auditKeys = createQueryKeyFactory('audit');
export const analyticsKeys = createQueryKeyFactory('analytics');

export interface InfiniteScrollParams {
  limit?: number;
  cursor?: string;
}

export interface InfiniteScrollResponse<T> {
  items: T[];
  nextCursor: string | null;
  total?: number;
}

export function useInfiniteScroll<T>(
  queryKey: QueryKey,
  fetcher: (params: InfiniteScrollParams) => Promise<InfiniteScrollResponse<T>>,
  options?: Omit<UseInfiniteQueryOptions<InfiniteScrollResponse<T>, Error, InfiniteData<InfiniteScrollResponse<T>>, InfiniteScrollResponse<T>, QueryKey>, 'queryKey' | 'queryFn' | 'initialPageParam' | 'getNextPageParam'>,
) {
  return useInfiniteQuery<InfiniteScrollResponse<T>, Error, InfiniteData<InfiniteScrollResponse<T>>, QueryKey>({
    queryKey,
    queryFn: ({ pageParam }) => fetcher(pageParam as InfiniteScrollParams),
    initialPageParam: { limit: 20 } as InfiniteScrollParams,
    getNextPageParam: (lastPage) => {
      if (!lastPage.nextCursor) return undefined;
      return { cursor: lastPage.nextCursor, limit: 20 };
    },
    ...options,
  });
}

export function createOptimisticUpdater<TItem extends { id: string }>(
  queryKey: QueryKey,
) {
  return {
    addItem: (newItem: TItem) => ({
      previousQueries: queryClient.getQueryData<TItem[]>(queryKey),
      updater: (old: TItem[] | undefined) => (old ? [newItem, ...old] : [newItem]),
    }),

    updateItem: (itemId: string, updates: Partial<TItem>) => ({
      previousQueries: queryClient.getQueryData<TItem[]>(queryKey),
      updater: (old: TItem[] | undefined) =>
        old?.map((item) => (item.id === itemId ? { ...item, ...updates } : item)) || [],
    }),

    removeItem: (itemId: string) => ({
      previousQueries: queryClient.getQueryData<TItem[]>(queryKey),
      updater: (old: TItem[] | undefined) => old?.filter((item) => item.id !== itemId) || [],
    }),
  };
}

export function useOptimisticMutation<TData, TVariables>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options: Omit<UseMutationOptions<TData, Error, TVariables>, 'mutationFn'> & {
    onMutate?: (variables: TVariables) => Promise<void> | void;
    invalidateKeys?: QueryKey[];
    rollbackOnError?: boolean;
  },
) {
  const { invalidateKeys, rollbackOnError, ...mutationOptions } = options;

  return useMutation<TData, Error, TVariables>({
    mutationFn,
    ...mutationOptions,
    onMutate: async (variables) => {
      await options.onMutate?.(variables);
    },
    onSettled: async (_data, _error, _variables) => {
      if (invalidateKeys) {
        for (const key of invalidateKeys) {
          await queryClient.invalidateQueries({ queryKey: key });
        }
      }
    },
  });
}

export function invalidateQueries(keys: QueryKey[]): Promise<void[]> {
  return Promise.all(keys.map((key) => queryClient.invalidateQueries({ queryKey: key })));
}

export function clearQueries(keys: QueryKey[]): Promise<void[]> {
  return Promise.all(keys.map((key) => queryClient.removeQueries({ queryKey: key })));
}

export function resetQueries(keys: QueryKey[]): Promise<void[]> {
  return Promise.all(keys.map((key) => queryClient.resetQueries({ queryKey: key })));
}

export function prefetchQuery<T>(
  queryKey: QueryKey,
  fetcher: () => Promise<T>,
  options?: UseQueryOptions<T>,
): Promise<void> {
  return queryClient.prefetchQuery<T>({
    queryKey,
    queryFn: fetcher,
    ...options,
  });
}

export function setQueryData<T>(queryKey: QueryKey, data: T): void {
  queryClient.setQueryData(queryKey, data);
}

export function getQueryData<T>(queryKey: QueryKey): T | undefined {
  return queryClient.getQueryData<T>(queryKey);
}
