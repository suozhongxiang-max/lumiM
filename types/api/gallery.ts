/**
 * 画廊 API 类型定义
 */

import type { ModelSummary, GalleryModel } from '../models/gallery';

// 画廊列表响应 (JSend 格式)
export interface GalleryListResponse {
  status: 'success';
  data: {
    items: ModelSummary[];
    total: number;
  };
}

// 画廊查询参数
export interface GalleryQueryParams {
  sort?: 'latest' | 'popular' | 'liked';
  limit?: number;
  offset?: number;
  page?: number; // 页码（可选，与 offset 二选一）
  category?: string;
  searchQuery?: string; // 搜索关键词（可选）
  [key: string]: any; // 允许扩展其他参数
}

// 画廊模型详情响应 (JSend 格式)
export interface GalleryDetailResponse {
  status: 'success';
  data: GalleryModel;
}
