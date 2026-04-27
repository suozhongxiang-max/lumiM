import type { ModelSummary } from '@/types';
import type { ModelListStore, FetchOptions as BaseFetchOptions } from '../create-model-list-store';

/**
 * 画廊 Store 类型
 * 使用通用的 ModelListStore 类型
 */
export type GalleryState = ModelListStore;

/**
 * 画廊获取选项
 * 扩展基础 FetchOptions，添加画廊特定的选项
 */
export interface FetchOptions extends BaseFetchOptions {
  // 可以在这里添加画廊特定的选项
}
