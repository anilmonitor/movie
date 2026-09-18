import React from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  basePath: string; // e.g. "/" or "/category/bollywood" or "/search?q=xyz"
}

export default function Pagination({ currentPage, totalPages, basePath }: PaginationProps) {
  if (totalPages <= 1) return null;

  const getPageUrl = (page: number) => {
    const separator = basePath.includes('?') ? '&' : '?';
    return `${basePath}${separator}page=${page}`;
  };

  // Generate visible page numbers
  const pages: number[] = [];
  const startPage = Math.max(1, currentPage - 2);
  const endPage = Math.min(totalPages, currentPage + 2);

  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  return (
    <nav className="flex items-center justify-center gap-1 sm:gap-1.5 mt-8 sm:mt-12 py-4 flex-wrap" aria-label="Pagination">
      {/* Previous */}
      {currentPage > 1 ? (
        <Link
          href={getPageUrl(currentPage - 1)}
          className="flex items-center gap-1 px-2.5 sm:px-3.5 py-2 rounded-lg bg-slate-100 dark:bg-gray-900/90 text-xs sm:text-sm font-medium text-slate-700 dark:text-gray-200 hover:bg-slate-200 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-white/10 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Prev</span>
        </Link>
      ) : (
        <span className="flex items-center gap-1 px-2.5 sm:px-3.5 py-2 rounded-lg bg-slate-50 dark:bg-gray-900/40 text-xs sm:text-sm font-medium text-slate-300 dark:text-gray-600 border border-slate-100 dark:border-white/5 cursor-not-allowed">
          <ChevronLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Prev</span>
        </span>
      )}

      {/* First page if skipped */}
      {startPage > 1 && (
        <>
          <Link
            href={getPageUrl(1)}
            className="px-2.5 sm:px-3.5 py-2 rounded-lg bg-slate-100 dark:bg-gray-900/90 text-xs sm:text-sm font-medium text-slate-700 dark:text-gray-300 hover:bg-slate-200 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 transition-colors"
          >
            1
          </Link>
          {startPage > 2 && <span className="px-1 text-slate-400 dark:text-gray-500">...</span>}
        </>
      )}

      {/* Pages */}
      {pages.map((page) => {
        const isActive = page === currentPage;
        return (
          <Link
            key={page}
            href={getPageUrl(page)}
            className={`px-2.5 sm:px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
              isActive
                ? 'bg-red-600 text-white shadow-lg shadow-red-600/30 scale-105'
                : 'bg-slate-100 dark:bg-gray-900/90 text-slate-700 dark:text-gray-300 hover:bg-slate-200 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-white/10'
            }`}
          >
            {page}
          </Link>
        );
      })}

      {/* Last page if skipped */}
      {endPage < totalPages && (
        <>
          {endPage < totalPages - 1 && <span className="px-1 text-slate-400 dark:text-gray-500">...</span>}
          <Link
            href={getPageUrl(totalPages)}
            className="px-2.5 sm:px-3.5 py-2 rounded-lg bg-slate-100 dark:bg-gray-900/90 text-xs sm:text-sm font-medium text-slate-700 dark:text-gray-300 hover:bg-slate-200 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 transition-colors"
          >
            {totalPages}
          </Link>
        </>
      )}

      {/* Next */}
      {currentPage < totalPages ? (
        <Link
          href={getPageUrl(currentPage + 1)}
          className="flex items-center gap-1 px-2.5 sm:px-3.5 py-2 rounded-lg bg-slate-100 dark:bg-gray-900/90 text-xs sm:text-sm font-medium text-slate-700 dark:text-gray-200 hover:bg-slate-200 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-white/10 transition-colors"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="w-4 h-4" />
        </Link>
      ) : (
        <span className="flex items-center gap-1 px-2.5 sm:px-3.5 py-2 rounded-lg bg-slate-50 dark:bg-gray-900/40 text-xs sm:text-sm font-medium text-slate-300 dark:text-gray-600 border border-slate-100 dark:border-white/5 cursor-not-allowed">
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="w-4 h-4" />
        </span>
      )}
    </nav>
  );
}
