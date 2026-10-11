"use client";

import { formatFaNumber } from "@/lib/format/number";
import { Button } from "@/components/ui/button";

type TablePaginationProps = {
  page: number;
  pageSize: number;
  totalItems: number;
  pageSizeOptions?: number[];
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
};

export function TablePagination({
  page,
  pageSize,
  totalItems,
  pageSizeOptions = [10, 20, 50],
  onPageChange,
  onPageSizeChange,
}: TablePaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const currentPage = Math.min(page, totalPages);
  const rangeStart = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const rangeEnd = Math.min(currentPage * pageSize, totalItems);

  const visiblePages = (() => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, index) => index + 1);
    }

    const pages = new Set<number>([1, totalPages, currentPage]);
    if (currentPage > 1) pages.add(currentPage - 1);
    if (currentPage < totalPages) pages.add(currentPage + 1);
    return [...pages].sort((a, b) => a - b);
  })();

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3 text-sm text-muted-foreground">
      <div className="flex items-center gap-2">
        <span>نمایش</span>
        <select
          value={pageSize}
          onChange={(event) => onPageSizeChange(Number(event.target.value))}
          className="h-9 rounded-lg border border-input bg-background px-2"
        >
          {pageSizeOptions.map((size) => (
            <option key={size} value={size}>
              {formatFaNumber(size)}
            </option>
          ))}
        </select>
        <span>ردیف</span>
      </div>

      <p>
        {formatFaNumber(rangeStart)} تا {formatFaNumber(rangeEnd)} از{" "}
        {formatFaNumber(totalItems)} مورد
      </p>

      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="outline"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
        >
          قبلی
        </Button>
        {visiblePages.map((pageNumber, index) => {
          const prev = visiblePages[index - 1];
          const showEllipsis = prev !== undefined && pageNumber - prev > 1;

          return (
            <span key={pageNumber} className="flex items-center gap-1">
              {showEllipsis ? (
                <span className="px-1 text-muted-foreground">…</span>
              ) : null}
              <Button
                type="button"
                variant={pageNumber === currentPage ? "default" : "outline"}
                className="min-w-11"
                onClick={() => onPageChange(pageNumber)}
              >
                {formatFaNumber(pageNumber)}
              </Button>
            </span>
          );
        })}
        <Button
          type="button"
          variant="outline"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
        >
          بعدی
        </Button>
      </div>
    </div>
  );
}

export function paginateItems<T>(items: T[], page: number, pageSize: number) {
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * pageSize;

  return {
    totalPages,
    currentPage,
    pageItems: items.slice(start, start + pageSize),
  };
}
