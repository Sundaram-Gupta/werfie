import React from 'react';

export function useAdminPageController({
    initialPage = 1,
    limit = 20
}) {
    const [page, setPage] = React.useState(initialPage);
    const bindQuery = ({ data, isFetching = false, isError = false, error = null }) => {
        const rows = data?.data || [];
        const pagination = data?.pagination;

        return {
            rows,
            pagination,
            tablePagination: {
                page: pagination?.page || page,
                pages: pagination?.pages || 1,
                isFetching,
                onPageChange: setPage
            },
            queryState: {
                isLoading: isFetching && rows.length === 0,
                isError,
                error,
                isEmpty: rows.length === 0
            }
        };
    };

    return {
        page,
        setPage,
        limit,
        bindQuery
    };
}

