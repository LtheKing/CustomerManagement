/**
 * Generic paginated result model
 */
export interface PagedResult<T> {
  data: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
  /** Sum of matching line amounts across all pages for current filters */
  filteredTotalAmount?: number;
  /** Sum of matching line quantities across all pages for current filters */
  filteredTotalQuantity?: number;
}

