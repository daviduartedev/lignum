export const DEFAULT_PAGE_SIZE = 10;

export type PaginationMeta = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type PaginationArgs = {
  skip: number;
  take: number;
  page: number;
  pageSize: number;
};

function safePositiveInt(raw: string | null, fallback: number, max: number): number {
  const n = Number.parseInt(raw ?? "", 10);
  if (!Number.isFinite(n) || n < 1 || n > max) {
    return fallback;
  }
  return n;
}

export function parsePagination(searchParams: URLSearchParams): PaginationArgs {
  const page = safePositiveInt(searchParams.get("page"), 1, 1_000_000);
  const rawSize = safePositiveInt(searchParams.get("pageSize"), DEFAULT_PAGE_SIZE, 100);
  const pageSize = Math.min(100, Math.max(1, rawSize));
  return {
    page,
    pageSize,
    skip: (page - 1) * pageSize,
    take: pageSize,
  };
}

export function paginationMeta(total: number, page: number, pageSize: number): PaginationMeta {
  return {
    page,
    pageSize,
    total,
    totalPages: Math.ceil(total / pageSize) || 1,
  };
}
