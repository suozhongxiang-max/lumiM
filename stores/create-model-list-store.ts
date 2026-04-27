import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { ModelSummary } from '@/types';
import { logger } from '@/utils/logger';
import { zustandStorage } from '@/utils/storage';

/**
 * 模型列表 Store 的状态接口
 */
export interface ModelListState {
  // 数据状态
  models: ModelSummary[]; // 模型列表数据
  loading: boolean; // 是否正在加载
  refreshing: boolean; // 是否正在刷新
  error: string | null; // 错误信息

  // 分页状态
  currentPage: number; // 当前页码
  hasMore: boolean; // 是否还有更多数据
  pageSize: number; // 每页数据量

  // 搜索状态
  searchQuery: string; // 搜索关键词
  searchResults: ModelSummary[]; // 搜索结果
  isSearching: boolean; // 是否正在搜索

  // 筛选状态
  sort: 'latest' | 'popular' | 'trending'; // 排序方式，默认最新

  // 缓存控制
  lastFetchTime: number; // 最后一次获取数据的时间戳
  cacheDuration: number; // 缓存有效期（毫秒）
}

/**
 * 模型列表 Store 的操作接口
 */
export interface ModelListActions {
  // 获取模型列表
  fetchModels: (
    page?: number,
    options?: FetchOptions,
    abortController?: AbortController
  ) => Promise<void>;
  // 刷新模型列表
  refreshModels: () => Promise<void>;
  // 加载更多
  loadMore: () => Promise<void>;
  // 搜索模型
  searchModels: (query: string) => Promise<void>;
  // 清除搜索
  clearSearch: () => void;
  // 设置排序方式
  setSort: (sort: 'latest' | 'popular' | 'trending') => Promise<void>;
  // 清除错误
  clearError: () => void;
  // 重置状态
  reset: () => void;
  // 根据 ID 获取单个模型
  getModelById: (id: string) => ModelSummary | undefined;
}

/**
 * 完整的 Store 类型
 */
export type ModelListStore = ModelListState & ModelListActions;

/**
 * 获取选项
 */
export interface FetchOptions {
  sort?: 'latest' | 'popular' | 'trending'; // 排序方式
  category?: string; // 分类
  searchQuery?: string; // 搜索关键词
}

/**
 * API 响应格式
 * 支持多种格式：
 * 1. { items: ModelSummary[]; total?: number } - 带分页信息
 * 2. ModelSummary[] - 直接返回数组
 */
export type ApiResponse = { items: ModelSummary[]; total?: number } | ModelSummary[];

/**
 * Fetch 函数类型
 * 接收分页参数和请求选项，返回模型数据
 *
 * 参数类型设计为灵活的对象，支持不同 API 的参数结构
 */
export type FetchFunction = (
  params: {
    page?: number;
    limit?: number;
    offset?: number;
    sort?: string;
    category?: string;
    searchQuery?: string;
    [key: string]: any; // 允许额外的参数
  },
  options?: {
    signal?: AbortSignal;
  }
) => Promise<ApiResponse>;

/**
 * 创建模型列表 Store 的工厂函数
 *
 * @param storeName - Store 名称，用于 devtools 和持久化
 * @param fetchFunction - 数据获取函数，接收分页参数返回模型数据
 * @param options - 可选配置
 * @returns Zustand Store Hook
 *
 * @example
 * ```typescript
 * // 创建发现页 Store
 * export const useGalleryStore = createModelListStore(
 *   'gallery-store',
 *   fetchGalleryModels
 * );
 *
 * // 创建收藏页 Store
 * export const useFavoritesStore = createModelListStore(
 *   'favorites-store',
 *   fetchUserFavorites
 * );
 * ```
 */
export function createModelListStore(
  storeName: string,
  fetchFunction: FetchFunction,
  options: {
    pageSize?: number; // 每页数据量，默认 20
    cacheDuration?: number; // 缓存有效期（毫秒），默认 5 分钟
    enableDevtools?: boolean; // 是否启用 Redux DevTools，默认 true
    enablePersist?: boolean; // 是否启用持久化，默认 true
  } = {}
) {
  // 默认配置
  const DEFAULT_PAGE_SIZE = options.pageSize || 20;
  const DEFAULT_CACHE_DURATION = options.cacheDuration || 5 * 60 * 1000; // 5 分钟
  const enableDevtools = options.enableDevtools !== false;
  const enablePersist = options.enablePersist !== false;

  // 创建基础 Store
  const baseStore = immer<ModelListStore>((set, get) => ({
    // ==================== 初始状态 ====================
    models: [],
    loading: false,
    refreshing: false,
    error: null,

    // 分页状态
    currentPage: 1,
    hasMore: true,
    pageSize: DEFAULT_PAGE_SIZE,

    // 搜索状态
    searchQuery: '',
    searchResults: [],
    isSearching: false,

    // 筛选状态
    sort: 'latest', // 默认按最新排序

    // 缓存控制
    lastFetchTime: 0,
    cacheDuration: DEFAULT_CACHE_DURATION,

    // ==================== 获取模型列表 ====================
    fetchModels: async (
      page = 1,
      fetchOptions: FetchOptions = {},
      abortController?: AbortController
    ) => {
      const { models: existingModels, pageSize } = get();

      // 信息流设计: 总是获取最新数据
      // 不使用缓存时间判断，每次都刷新
      // 持久化的数据只在应用启动时显示，避免白屏

      // 设置加载状态
      if (page === 1) {
        // 如果正在刷新，保持 refreshing 状态，不设置 loading
        const currentRefreshing = get().refreshing;
        if (currentRefreshing) {
          // 下拉刷新中，不设置 loading
          set({ error: null });
        } else {
          // 普通加载，设置 loading
          set({
            loading: true,
            error: null,
            refreshing: false,
          });
        }
      } else {
        // 加载更多，设置 loading
        set({ loading: true });
      }

      try {
        logger.info(`[${storeName}] 获取模型数据: page=${page}, options=`, fetchOptions);

        // 调用传入的 fetch 函数获取数据
        const response = await fetchFunction(
          {
            page,
            limit: pageSize,
            offset: (page - 1) * pageSize,
            ...(fetchOptions.sort && { sort: fetchOptions.sort }),
            ...(fetchOptions.category && { category: fetchOptions.category }),
            ...(fetchOptions.searchQuery && { searchQuery: fetchOptions.searchQuery }),
          },
          {
            signal: abortController?.signal,
          }
        );

        // 处理不同的响应格式
        const newModels = Array.isArray(response) ? response : (response.items ?? []);

        set(state => {
          if (page === 1) {
            // 第一页: 替换数据
            state.models = newModels;
          } else {
            // 后续页: 追加数据
            state.models = [...existingModels, ...newModels];
          }

          state.currentPage = page;
          // 根据返回的数据量判断是否还有更多
          state.hasMore = newModels.length >= pageSize;
          state.lastFetchTime = Date.now();
          state.loading = false;
          state.error = null;
        });

        logger.info(
          `[${storeName}] 成功获取 ${newModels.length} 个模型，当前总数: ${get().models.length}`
        );
      } catch (error) {
        // 如果是取消错误，不设置错误状态
        if (error instanceof Error && error.name === 'AbortError') {
          logger.debug(`[${storeName}] 请求被取消`);
          return;
        }

        const errorMessage = error instanceof Error ? error.message : '加载失败，请重试';

        logger.error(`[${storeName}] 获取模型失败:`, error);

        set(state => {
          state.loading = false;
          state.error = errorMessage;
          state.refreshing = false;
        });
      }
    },

    // ==================== 刷新模型列表 ====================
    refreshModels: async () => {
      set({ refreshing: true, lastFetchTime: 0 }); // 重置缓存时间以强制刷新
      await get().fetchModels(1);
      set({ refreshing: false });
    },

    // ==================== 加载更多 ====================
    loadMore: async () => {
      const { currentPage, hasMore, loading } = get();

      if (!hasMore || loading) {
        logger.debug(`[${storeName}] 无法加载更多: hasMore=${hasMore}, loading=${loading}`);
        return;
      }

      logger.debug(`[${storeName}] 加载更多模型...`);
      await get().fetchModels(currentPage + 1);
    },

    // ==================== 搜索模型 ====================
    searchModels: async (query: string) => {
      set({
        searchQuery: query,
        isSearching: true,
      });

      logger.info(`[${storeName}] 搜索模型: query="${query}"`);

      // 使用搜索关键词重新加载第一页
      await get().fetchModels(1, { searchQuery: query });

      set({ isSearching: false });
    },

    // ==================== 清除搜索 ====================
    clearSearch: () => {
      set({
        searchQuery: '',
        searchResults: [],
      });
    },

    // ==================== 设置排序方式 ====================
    /**
     * 设置排序方式并重新加载数据
     * @param sort - 排序方式（latest/latest/trending）
     */
    setSort: async (sort: 'latest' | 'popular' | 'trending') => {
      const currentSort = get().sort;

      // 如果排序方式未改变，直接返回
      if (currentSort === sort) {
        logger.debug(`[${storeName}] 排序方式未改变，跳过刷新: ${sort}`);
        return;
      }

      logger.info(`[${storeName}] 切换排序方式: ${currentSort} -> ${sort}`);

      // 更新排序方式
      set({ sort });

      // 重新加载第一页数据
      await get().fetchModels(1, { sort });
    },

    // ==================== 清除错误 ====================
    clearError: () => {
      set({ error: null });
    },

    // ==================== 重置状态 ====================
    reset: () => {
      set(state => {
        state.models = [];
        state.loading = false;
        state.refreshing = false;
        state.error = null;
        state.currentPage = 1;
        state.hasMore = true;
        state.searchQuery = '';
        state.searchResults = [];
        state.isSearching = false;
        state.sort = 'latest';
        state.lastFetchTime = 0;
      });
    },

    // ==================== 根据 ID 获取单个模型 ====================
    getModelById: (id: string): ModelSummary | undefined => {
      return get().models.find(model => model.id === id);
    },
  }));

  // 应用中间件
  let storeWithMiddleware = baseStore;

  // 持久化中间件
  if (enablePersist) {
    storeWithMiddleware = persist(storeWithMiddleware, {
      name: storeName,
      storage: zustandStorage,
      // 只持久化模型数据和最后获取时间，其他状态不持久化
      partialize: state => ({
        models: state.models,
        lastFetchTime: state.lastFetchTime,
      }),
    }) as typeof baseStore;
  }

  // DevTools 中间件
  if (enableDevtools) {
    storeWithMiddleware = devtools(storeWithMiddleware, {
      name: storeName,
    }) as typeof baseStore;
  }

  // 创建 Store
  return create(storeWithMiddleware);
}

/**
 * 创建选择器 Hooks 的工厂函数
 *
 * @param useStore - Zustand Store Hook
 * @returns 选择器 Hooks 对象
 *
 * @example
 * ```typescript
 * const useGalleryStore = createModelListStore('gallery-store', fetchGalleryModels);
 * export const gallerySelectors = createModelListSelectors(useGalleryStore);
 *
 * // 在组件中使用
 * const models = gallerySelectors.useModels();
 * const loading = gallerySelectors.useLoading();
 * ```
 */
export function createModelListSelectors<T extends ModelListStore>(useStore: {
  (): T;
  <U>(selector: (state: T) => U): U;
}) {
  return {
    // 获取模型列表
    useModels: () => useStore(state => state.models),
    // 获取加载状态
    useLoading: () => useStore(state => state.loading),
    // 获取刷新状态
    useRefreshing: () => useStore(state => state.refreshing),
    // 获取错误信息
    useError: () => useStore(state => state.error),
    // 获取分页信息
    usePagination: () =>
      useStore(state => ({
        currentPage: state.currentPage,
        hasMore: state.hasMore,
        pageSize: state.pageSize,
      })),
    // 获取搜索信息
    useSearch: () =>
      useStore(state => ({
        searchQuery: state.searchQuery,
        searchResults: state.searchResults,
        isSearching: state.isSearching,
      })),
  };
}
