import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

export function usePaginatedPrefetch({
    pagination,
    page,
    limit,
    queryKey,
    queryFn,
    extraParams = null
}) {
    const queryClient = useQueryClient();

    useEffect(() => {
        if (!pagination || page >= pagination.pages) return;
        const nextParams = { ...(extraParams || {}), page: page + 1, limit };
        queryClient.prefetchQuery({
            queryKey: [queryKey, nextParams],
            queryFn: () => queryFn(nextParams)
        });
    }, [extraParams, limit, page, pagination, queryClient, queryFn, queryKey]);
}

