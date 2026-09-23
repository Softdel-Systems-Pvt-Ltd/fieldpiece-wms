// Transport-level shapes shared by every feature (backend Section 6.3 / 6.4).

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface PageParams {
  page?: number;
  pageSize?: number;
  sort?: string; // "field" or "-field" for descending
  q?: string;
}

/** Error body every API endpoint returns on failure. */
export interface ApiErrorBody {
  code: string;
  message: string;
  fieldErrors?: Record<string, string[] | string>;
  details?: Record<string, unknown>;
  requestId?: string;
}
