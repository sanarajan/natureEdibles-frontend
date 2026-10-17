import React from 'react';

export interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    className?: string;
    style?: React.CSSProperties;
}

export const Pagination: React.FC<PaginationProps> = ({
    currentPage,
    totalPages,
    onPageChange,
    className = '',
    style = {}
}) => {
    if (totalPages <= 1) {
        return null;
    }

    const getPageNumbers = (): (number | string)[] => {
        if (totalPages <= 7) {
            return Array.from({ length: totalPages }, (_, i) => i + 1);
        }

        const pages: (number | string)[] = [];

        if (currentPage <= 4) {
            for (let i = 1; i <= 5; i++) {
                pages.push(i);
            }
            pages.push('...');
            pages.push(totalPages);
        } else if (currentPage >= totalPages - 3) {
            pages.push(1);
            pages.push('...');
            for (let i = totalPages - 4; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            pages.push(1);
            pages.push('...');
            pages.push(currentPage - 1);
            pages.push(currentPage);
            pages.push(currentPage + 1);
            pages.push('...');
            pages.push(totalPages);
        }

        return pages;
    };

    const pages = getPageNumbers();

    return (
        <nav
            aria-label="Pagination Navigation"
            className={`d-flex justify-content-center align-items-center my-4 ${className}`}
            style={style}
        >
            <ul className="pagination mb-0" style={{ display: 'flex', alignItems: 'center', gap: '4px', listStyle: 'none', padding: 0 }}>
                {/* Previous Button */}
                <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                    <button
                        type="button"
                        className="page-link"
                        onClick={() => currentPage > 1 && onPageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        aria-label="Previous Page"
                        style={{
                            cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                            borderRadius: '6px',
                            fontWeight: 500,
                            padding: '6px 12px'
                        }}
                    >
                        &lt;
                    </button>
                </li>

                {/* Page Number Buttons and Ellipses */}
                {pages.map((p, index) => {
                    if (typeof p === 'string') {
                        return (
                            <li key={`ellipsis-${index}`} className="page-item disabled">
                                <span
                                    className="page-link"
                                    style={{
                                        border: 'none',
                                        background: 'transparent',
                                        cursor: 'default',
                                        padding: '6px 10px',
                                        color: '#64748b'
                                    }}
                                >
                                    &hellip;
                                </span>
                            </li>
                        );
                    }

                    const isActive = p === currentPage;
                    return (
                        <li key={p} className={`page-item ${isActive ? 'active' : ''}`}>
                            <button
                                type="button"
                                className="page-link"
                                onClick={() => onPageChange(p)}
                                aria-label={`Page ${p}`}
                                aria-current={isActive ? 'page' : undefined}
                                style={{
                                    cursor: 'pointer',
                                    borderRadius: '6px',
                                    fontWeight: isActive ? 700 : 500,
                                    padding: '6px 12px'
                                }}
                            >
                                {p}
                            </button>
                        </li>
                    );
                })}

                {/* Next Button */}
                <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                    <button
                        type="button"
                        className="page-link"
                        onClick={() => currentPage < totalPages && onPageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        aria-label="Next Page"
                        style={{
                            cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                            borderRadius: '6px',
                            fontWeight: 500,
                            padding: '6px 12px'
                        }}
                    >
                        &gt;
                    </button>
                </li>
            </ul>
        </nav>
    );
};

export default Pagination;
