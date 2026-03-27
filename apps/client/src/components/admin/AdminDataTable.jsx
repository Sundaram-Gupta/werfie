import React from 'react';
import { AdminTable } from '@/components/admin/AdminTable';
import { AdminPagination } from '@/components/admin/AdminPagination';

export function AdminDataTable({
    headers = [],
    rows = [],
    rowKey,
    renderRow,
    page = 1,
    pages = 1,
    isFetching = false,
    onPageChange,
    paginationClassName = ''
}) {
    return (
        <>
            <AdminTable headers={headers}>
                {rows.map((row, index) => (
                    <React.Fragment key={typeof rowKey === 'function' ? rowKey(row, index) : index}>
                        {renderRow(row, index)}
                    </React.Fragment>
                ))}
            </AdminTable>
            <AdminPagination
                page={page}
                pages={pages}
                isFetching={isFetching}
                onPrev={() => onPageChange?.(Math.max(1, page - 1))}
                onNext={() => onPageChange?.(page + 1)}
                className={paginationClassName}
            />
        </>
    );
}

