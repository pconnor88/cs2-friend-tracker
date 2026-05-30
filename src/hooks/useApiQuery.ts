import { QueryKey, UseQueryOptions, UseQueryResult, useQuery } from "@tanstack/react-query";

export type ApiQueryOptions<T> = Omit<UseQueryOptions<T, Error, T, QueryKey>, "queryKey" | "queryFn">;

export const useApiQuery = <T>(
    key: QueryKey,
    fetcher: () => Promise<T>,
    options?: ApiQueryOptions<T>
): UseQueryResult<T, Error> =>
    useQuery({ queryKey: key, queryFn: fetcher, ...(options ?? {}) });
