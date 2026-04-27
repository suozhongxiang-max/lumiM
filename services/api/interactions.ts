/**
 * 交互 API 服务
 * 提供点赞、收藏等用户与模型交互的 API 方法
 */

import { API_ENDPOINTS } from '@/config/api';
import type {
  BatchInteractionsRequest,
  BatchInteractionsResponse,
  InteractionToggleRequest,
  InteractionToggleResponse,
  InteractionType,
} from '@/types';
import { logger } from '@/utils/logger';
import { apiPost } from '../api-client';

/**
 * 切换点赞或收藏状态（Toggle 模式）
 * 如果已点赞/收藏，则取消；如果未点赞/收藏，则添加
 *
 * @param modelId 模型 ID
 * @param type 交互类型（LIKE 或 FAVORITE）
 * @returns 返回切换后的状态和最新的计数器
 *
 * @example
 * ```typescript
 * // 切换点赞
 * const result = await toggleInteraction('model-123', 'LIKE');
 * if (result.isInteracted) {
 *   console.log('已点赞，当前点赞数:', result.likeCount);
 * } else {
 *   console.log('已取消点赞，当前点赞数:', result.likeCount);
 * }
 * ```
 */
export async function toggleInteraction(
  modelId: string,
  type: InteractionType
): Promise<InteractionToggleResponse> {
  // 构造请求体
  const requestBody: InteractionToggleRequest = { type };

  logger.debug(`切换交互状态:`, {
    modelId,
    type,
  });

  // 调用 API
  const result = await apiPost<InteractionToggleResponse>(
    API_ENDPOINTS.gallery.interactions(modelId),
    requestBody
  );

  // 错误处理
  if (!result.success) {
    logger.error(`切换交互状态失败:`, {
      modelId,
      type,
      error: result.error,
    });
    throw result.error;
  }

  logger.info(`交互状态切换成功:`, {
    modelId,
    type,
    isInteracted: result.data.isInteracted,
    likeCount: result.data.likeCount,
    favoriteCount: result.data.favoriteCount,
  });

  return result.data;
}

/**
 * 批量获取多个模型的交互状态
 * 用于列表页一次性获取所有模型的点赞和收藏状态，提升性能
 *
 * @param modelIds 模型 ID 数组（最多 100 个）
 * @returns 返回交互状态映射 { [modelId]: { isLiked, isFavorited } }
 *
 * @example
 * ```typescript
 * const modelIds = ['model-1', 'model-2', 'model-3'];
 * const result = await fetchBatchInteractions(modelIds);
 *
 * if (result.isAuthenticated) {
 *   // 用户已登录，可以获取交互状态
 *   const model1Status = result.interactions['model-1'];
 *   console.log('model-1 已点赞?', model1Status.isLiked);
 *   console.log('model-1 已收藏?', model1Status.isFavorited);
 * } else {
 *   // 用户未登录，所有状态为空
 *   console.log('未登录，无法获取交互状态');
 * }
 * ```
 */
export async function fetchBatchInteractions(
  modelIds: string[]
): Promise<BatchInteractionsResponse> {
  // 参数校验
  if (modelIds.length === 0) {
    logger.warn('批量获取交互状态：模型 ID 列表为空');
    // 返回空结果，避免无意义的 API 调用
    return {
      isAuthenticated: false,
      interactions: {},
    };
  }

  if (modelIds.length > 100) {
    logger.warn(`批量获取交互状态：模型 ID 数量超过限制 (${modelIds.length} > 100)`);
    // 截取前 100 个
    modelIds = modelIds.slice(0, 100);
  }

  // 构造请求体
  const requestBody: BatchInteractionsRequest = { modelIds };

  logger.debug(`批量获取交互状态:`, {
    count: modelIds.length,
    modelIds: modelIds.slice(0, 3), // 只记录前 3 个 ID
  });

  // 调用 API
  const result = await apiPost<BatchInteractionsResponse>(
    API_ENDPOINTS.gallery.batchInteractions,
    requestBody
  );

  // 错误处理
  if (!result.success) {
    logger.error(`批量获取交互状态失败:`, {
      error: result.error,
    });
    throw result.error;
  }

  logger.info(`批量获取交互状态成功:`, {
    isAuthenticated: result.data.isAuthenticated,
    count: Object.keys(result.data.interactions).length,
  });

  return result.data;
}
