/**
 * Interaction Store 类型定义
 */

import type { ModelInteractionStatus } from '@/types';

/**
 * 交互状态映射
 * key: 模型 ID
 * value: 交互状态（isLiked, isFavorited）
 */
export type InteractionStatusMap = Record<string, ModelInteractionStatus>;

/**
 * Interaction Store 状态接口
 */
export interface InteractionState {
  /** 交互状态映射 { modelId: { isLiked, isFavorited } } */
  statusMap: InteractionStatusMap;

  /** 正在操作的模型 ID 集合（用于防止重复点击） */
  loadingIds: Set<string>;

  /**
   * 批量加载交互状态
   * @param modelIds 模型 ID 数组
   */
  fetchBatchStatus: (modelIds: string[]) => Promise<void>;

  /**
   * 获取单个模型的交互状态
   * @param modelId 模型 ID
   * @returns 交互状态，如果未加载则返回默认值
   */
  getStatus: (modelId: string) => ModelInteractionStatus;

  /**
   * 切换点赞状态
   * @param modelId 模型 ID
   * @param currentLikes 当前点赞数
   * @returns 返回最新的状态和计数
   */
  toggleLike: (
    modelId: string,
    currentLikes: number
  ) => Promise<{ isLiked: boolean; likeCount: number }>;

  /**
   * 切换收藏状态
   * @param modelId 模型 ID
   * @param currentFavorites 当前收藏数
   * @returns 返回最新的状态和计数
   */
  toggleFavorite: (
    modelId: string,
    currentFavorites: number
  ) => Promise<{ isFavorited: boolean; favoriteCount: number }>;

  /**
   * 更新单个模型的交互状态
   * @param modelId 模型 ID
   * @param status 新的交互状态
   */
  updateStatus: (modelId: string, status: Partial<ModelInteractionStatus>) => void;

  /**
   * 清空所有交互状态（用户登出时调用）
   */
  clearAll: () => void;
}
