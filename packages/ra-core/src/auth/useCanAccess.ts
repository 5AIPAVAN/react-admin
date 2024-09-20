import { useEffect, useMemo } from 'react';
import {
    QueryObserverLoadingErrorResult,
    QueryObserverLoadingResult,
    QueryObserverRefetchErrorResult,
    QueryObserverSuccessResult,
    useQuery,
    UseQueryOptions,
} from '@tanstack/react-query';
import useAuthProvider from './useAuthProvider';
import useLogoutIfAccessDenied from './useLogoutIfAccessDenied';
import { HintedString } from '../types';

/**
 * A hook that calls the authProvider.canAccess() method using react-query for a provided resource and action (and optionally a record).
 *
 * The return value updates according to the request state:
 *
 * - start: { isPending: true }
 * - success: { canAccess: true | false, isPending: false }
 * - error: { error: [error from provider], isPending: false }
 *
 * Useful to enable or disable features based on users permissions.
 *
 * @param {Object} params Any params you want to pass to the authProvider
 * @param {string} params.resource The resource to check access for
 * @param {string} params.action The action to check access for
 * @param {Object} params.record Optional. The record to check access for
 *
 * @returns Return the react-query result and a canAccess property which is a boolean indicating the access status
 *
 * @example
 *     import { useCanAccess } from 'react-admin';
 *
 *     const PostDetail = () => {
 *         const { isPending, canAccess, error } = useCanAccess({
 *             resource: 'posts',
 *             action: 'read',
 *         });
 *         if (isPending || !canAccess) {
 *             return null;
 *         }
 *         if (error) {
 *             return <div>{error.message}</div>;
 *         }
 *         return <PostEdit />;
 *     };
 */
export const useCanAccess = <ErrorType = Error>(
    params: UseCanAccessOptions<ErrorType>
): UseCanAccessResult<ErrorType> => {
    const authProvider = useAuthProvider();
    const logout = useLogoutIfAccessDenied();

    const queryResult = useQuery({
        queryKey: ['auth', 'canAccess', JSON.stringify(params)],
        queryFn: async ({ signal }) => {
            if (!authProvider || !authProvider.canAccess) {
                return true;
            }
            return authProvider.canAccess({
                ...params,
                signal: authProvider.supportAbortSignal ? signal : undefined,
            });
        },
        ...params,
    });

    useEffect(() => {
        if (queryResult.error) {
            logout(queryResult.error);
        }
    }, [logout, queryResult.error]);

    const result = useMemo(() => {
        // Don't check for the authProvider or authProvider.canAccess method in the useMemo
        // to avoid unnecessary re-renders
        return {
            ...queryResult,
            canAccess: queryResult.data,
        } as UseCanAccessResult<ErrorType>;
    }, [queryResult]);

    return !authProvider || !authProvider.canAccess
        ? (emptyQueryObserverResult as UseCanAccessResult<ErrorType>)
        : result;
};

const emptyQueryObserverResult = {
    canAccess: true,
    data: true,
    dataUpdatedAt: 0,
    error: null,
    errorUpdatedAt: 0,
    errorUpdateCount: 0,
    failureCount: 0,
    failureReason: null,
    fetchStatus: 'idle',
    isError: false,
    isInitialLoading: false,
    isLoading: false,
    isLoadingError: false,
    isFetched: true,
    isFetchedAfterMount: true,
    isFetching: false,
    isPaused: false,
    isPlaceholderData: false,
    isPending: false,
    isRefetchError: false,
    isRefetching: false,
    isStale: false,
    isSuccess: true,
    status: 'success',
    refetch: () => Promise.resolve(emptyQueryObserverResult),
};

export interface UseCanAccessOptions<ErrorType = Error>
    extends Omit<UseQueryOptions<boolean, ErrorType>, 'queryKey' | 'queryFn'> {
    resource: string;
    action: HintedString<'list' | 'create' | 'edit' | 'show' | 'delete'>;
    record?: unknown;
}

export type UseCanAccessResult<ErrorType = Error> =
    | UseCanAccessLoadingResult<ErrorType>
    | UseCanAccessLoadingErrorResult<ErrorType>
    | UseCanAccessRefetchErrorResult<ErrorType>
    | UseCanAccessSuccessResult<ErrorType>;

export interface UseCanAccessLoadingResult<ErrorType = Error>
    extends QueryObserverLoadingResult<boolean, ErrorType> {
    canAccess: undefined;
}
export interface UseCanAccessLoadingErrorResult<ErrorType = Error>
    extends QueryObserverLoadingErrorResult<boolean, ErrorType> {
    canAccess: undefined;
}
export interface UseCanAccessRefetchErrorResult<ErrorType = Error>
    extends QueryObserverRefetchErrorResult<boolean, ErrorType> {
    canAccess: boolean;
}
export interface UseCanAccessSuccessResult<ErrorType = Error>
    extends QueryObserverSuccessResult<boolean, ErrorType> {
    canAccess: boolean;
}
