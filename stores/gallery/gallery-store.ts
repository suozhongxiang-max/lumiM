import {
  createModelListStore,
  createModelListSelectors,
  type ModelListStore,
} from '../create-model-list-store';
import { fetchGalleryModels } from '@/services';

/**
 * 画廊 Store
 * 使用通用的模型列表 Store 工厂函数创建
 * 管理发现页的模型列表数据、分页、刷新、搜索等状态
 */
export const useGalleryStore = createModelListStore(
  'gallery-store', // Store 名称，用于 devtools 和持久化
  fetchGalleryModels, // 数据获取函数
  {
    pageSize: 20, // 每页 20 条数据
    cacheDuration: 5 * 60 * 1000, // 缓存 5 分钟
    enableDevtools: true, // 启用 Redux DevTools
    enablePersist: true, // 启用持久化
  }
);

/**
 * 选择器 Hooks，用于性能优化
 * 避免组件订阅整个 Store，只订阅需要的数据
 */
const selectors = createModelListSelectors(useGalleryStore);

// 导出选择器 Hooks，保持向后兼容
export const useGalleryModels = selectors.useModels;
export const useGalleryLoading = selectors.useLoading;
export const useGalleryRefreshing = selectors.useRefreshing;
export const useGalleryError = selectors.useError;
export const useGalleryPagination = selectors.usePagination;
export const useGallerySearch = selectors.useSearch;

// 导出类型，保持向后兼容
export type GalleryStore = ModelListStore;
