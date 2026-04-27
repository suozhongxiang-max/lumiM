/**
 * 我喜欢的 Store
 * 管理用户喜欢的模型列表数据、分页、刷新等状态
 */

import {
  createModelListStore,
  createModelListSelectors,
  type ModelListStore,
} from '../create-model-list-store';
import { fetchMyLikes } from '@/services';

/**
 * 我喜欢的 Store
 * 使用通用的模型列表 Store 工厂函数创建
 */
export const useMyLikesStore = createModelListStore(
  'my-likes-store', // Store 名称，用于 devtools 和持久化
  fetchMyLikes, // 数据获取函数
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
const selectors = createModelListSelectors(useMyLikesStore);

// 导出选择器 Hooks
export const useMyLikes = selectors.useModels;
export const useMyLikesLoading = selectors.useLoading;
export const useMyLikesRefreshing = selectors.useRefreshing;
export const useMyLikesError = selectors.useError;
export const useMyLikesPagination = selectors.usePagination;
export const useMyLikesSearch = selectors.useSearch;

// 导出类型
export type MyLikesStore = ModelListStore;
