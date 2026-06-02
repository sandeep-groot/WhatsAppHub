export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
};

export type ApiResponse<T> = {
  success: true;
  data: T;
  meta?: PaginationMeta;
};

export function createApiResponse<T>(
  data: T,
  meta?: PaginationMeta,
): ApiResponse<T> {
  return meta ? { success: true, data, meta } : { success: true, data };
}
