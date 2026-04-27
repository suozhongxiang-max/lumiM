/**
 * 通用 API 类型定义
 */

// 通用 API 响应格式
export interface APIResponse<T = any> {
  success: boolean;
  data: T;
}

// API 错误响应
export interface APIErrorResponse {
  success: false;
  error: string;
  code: string;
  details?: any;
}

// 分页数据
export interface PaginatedData<T> {
  items: T[];
  total: number;
  hasMore: boolean;
}

// 查询参数
export interface PaginationParams {
  limit?: number;
  offset?: number;
}

export interface SortParams {
  sortBy?: string;
  order?: 'asc' | 'desc';
}

export type QueryParams = PaginationParams & SortParams;
