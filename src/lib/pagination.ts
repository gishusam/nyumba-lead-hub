export const PAGE_SIZE_OPTIONS = [5, 10] as const;

export type PaginationItem = number | "ellipsis";

export type Paginated<T> = {
  items: T[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  from: number;
  to: number;
};

export function paginate<T>(
  items: readonly T[],
  requestedPage: number,
  pageSize: number,
): Paginated<T> {
  const safePageSize = Math.max(1, Math.floor(pageSize));
  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / safePageSize));
  const page = Math.min(totalPages, Math.max(1, Math.floor(requestedPage)));
  const startIndex = (page - 1) * safePageSize;
  const pageItems = items.slice(startIndex, startIndex + safePageSize);

  return {
    items: pageItems,
    page,
    pageSize: safePageSize,
    totalItems,
    totalPages,
    from: totalItems === 0 ? 0 : startIndex + 1,
    to: totalItems === 0 ? 0 : startIndex + pageItems.length,
  };
}

export function paginationItems(
  totalPages: number,
  currentPage: number,
): PaginationItem[] {
  const pages = Math.max(1, Math.floor(totalPages));
  const current = Math.min(pages, Math.max(1, Math.floor(currentPage)));

  if (pages <= 5) {
    return Array.from({ length: pages }, (_, index) => index + 1);
  }

  if (current <= 3) {
    return [1, 2, 3, "ellipsis", pages];
  }

  if (current >= pages - 2) {
    return [1, "ellipsis", pages - 2, pages - 1, pages];
  }

  return [
    1,
    "ellipsis",
    current - 1,
    current,
    current + 1,
    "ellipsis",
    pages,
  ];
}
