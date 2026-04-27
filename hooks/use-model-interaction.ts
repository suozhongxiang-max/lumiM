/**
 * 模型交互 Hook
 * 封装点赞和收藏的交互逻辑，提供给组件使用
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert } from 'react-native';
import { useInteractionStore } from '@/stores';
import { useI18n } from '@/hooks/use-i18n';
import { logger } from '@/utils/logger';

/**
 * Hook 参数接口
 */
export interface UseModelInteractionParams {
  /** 模型 ID */
  modelId: string;
  /** 初始点赞数 */
  initialLikes: number;
  /** 初始收藏数 */
  initialFavorites: number;
  /** 是否已登录（可选，用于显示登录提示） */
  isAuthenticated?: boolean;
  /** 点击未登录按钮时的回调（可选） */
  onRequireLogin?: () => void;
}

/**
 * Hook 返回值接口
 */
export interface UseModelInteractionResult {
  /** 是否已点赞 */
  isLiked: boolean;
  /** 是否已收藏 */
  isFavorited: boolean;
  /** 当前点赞数 */
  currentLikes: number;
  /** 当前收藏数 */
  currentFavorites: number;
  /** 是否正在操作中 */
  isLoading: boolean;
  /** 点赞操作 */
  handleLike: () => void;
  /** 收藏操作 */
  handleFavorite: () => void;
}

/**
 * 使用模型交互功能
 * 自动处理点赞、收藏的状态管理和 API 调用
 *
 * @example
 * ```typescript
 * const {
 *   isLiked,
 *   isFavorited,
 *   currentLikes,
 *   currentFavorites,
 *   isLoading,
 *   handleLike,
 *   handleFavorite,
 * } = useModelInteraction({
 *   modelId: 'model-123',
 *   initialLikes: 100,
 *   initialFavorites: 50,
 *   isAuthenticated: true,
 * });
 * ```
 */
export function useModelInteraction({
  modelId,
  initialLikes,
  initialFavorites,
  isAuthenticated = true,
  onRequireLogin,
}: UseModelInteractionParams): UseModelInteractionResult {
  const { t } = useI18n();
  // ✅ 修复：使用稳定的选择器，避免创建新对象导致无限循环
  const statusMap = useInteractionStore(state => state.statusMap);
  const toggleLike = useInteractionStore(state => state.toggleLike);
  const toggleFavorite = useInteractionStore(state => state.toggleFavorite);
  const loadingIds = useInteractionStore(state => state.loadingIds);

  // 本地状态：当前的点赞数和收藏数
  const [currentLikes, setCurrentLikes] = useState(initialLikes);
  const [currentFavorites, setCurrentFavorites] = useState(initialFavorites);

  // ✅ 使用 useMemo 缓存交互状态，避免每次都创建新对象
  const interactionStatus = useMemo(
    () => statusMap[modelId] || { isLiked: false, isFavorited: false },
    [statusMap, modelId]
  );

  // 从缓存的状态中获取值
  const isLiked = interactionStatus.isLiked;
  const isFavorited = interactionStatus.isFavorited;

  // 是否正在操作中
  const isLoading = loadingIds.has(modelId);

  // 调试日志：打印当前模型的交互状态
  useEffect(() => {
    logger.debug(
      `[ModelInteraction] modelId=${modelId}, isLiked=${isLiked}, isFavorited=${isFavorited}`
    );
  }, [modelId, isLiked, isFavorited]);

  // 同步初始计数（当 props 变化时）
  useEffect(() => {
    setCurrentLikes(initialLikes);
  }, [initialLikes]);

  useEffect(() => {
    setCurrentFavorites(initialFavorites);
  }, [initialFavorites]);

  /**
   * 处理点赞操作
   */
  const handleLike = useCallback(async () => {
    // 1. 检查登录状态
    if (!isAuthenticated) {
      // 未登录，显示提示
      Alert.alert(t('dialog.common.title'), t('dialog.auth.requireLogin'), [
        {
          text: t('dialog.common.cancel'),
          style: 'cancel',
        },
        {
          text: t('dialog.auth.gotoLogin'),
          onPress: () => {
            if (onRequireLogin) {
              onRequireLogin();
            } else {
              logger.warn('未提供 onRequireLogin 回调');
            }
          },
        },
      ]);
      return;
    }

    // 2. 防止重复点击
    if (isLoading) {
      logger.warn(`模型 ${modelId} 正在操作中，跳过点击`);
      return;
    }

    // 3. 乐观更新计数器（立即反馈）
    const optimisticLikes = isLiked ? currentLikes - 1 : currentLikes + 1;
    setCurrentLikes(optimisticLikes);

    logger.debug(`点赞操作: modelId=${modelId}, isLiked=${isLiked} -> ${!isLiked}`);

    // 4. 调用 Store 的 toggleLike 方法
    try {
      const result = await toggleLike(modelId, currentLikes);

      // 5. 使用服务端返回的权威数据更新计数器
      setCurrentLikes(result.likeCount);

      logger.info(`点赞成功: modelId=${modelId}, likeCount=${result.likeCount}`);
    } catch (error) {
      // 6. 失败时回滚计数器
      setCurrentLikes(currentLikes);
      logger.error('点赞失败:', error);

      // 显示错误提示
      Alert.alert(t('dialog.error.title'), t('dialog.interaction.likeFailed'));
    }
  }, [modelId, isAuthenticated, isLoading, isLiked, currentLikes, toggleLike, onRequireLogin, t]);

  /**
   * 处理收藏操作
   */
  const handleFavorite = useCallback(async () => {
    // 1. 检查登录状态
    if (!isAuthenticated) {
      // 未登录，显示提示
      Alert.alert(t('dialog.common.title'), t('dialog.auth.requireLogin'), [
        {
          text: t('dialog.common.cancel'),
          style: 'cancel',
        },
        {
          text: t('dialog.auth.gotoLogin'),
          onPress: () => {
            if (onRequireLogin) {
              onRequireLogin();
            } else {
              logger.warn('未提供 onRequireLogin 回调');
            }
          },
        },
      ]);
      return;
    }

    // 2. 防止重复点击
    if (isLoading) {
      logger.warn(`模型 ${modelId} 正在操作中，跳过点击`);
      return;
    }

    // 3. 乐观更新计数器（立即反馈）
    const optimisticFavorites = isFavorited ? currentFavorites - 1 : currentFavorites + 1;
    setCurrentFavorites(optimisticFavorites);

    logger.debug(`收藏操作: modelId=${modelId}, isFavorited=${isFavorited} -> ${!isFavorited}`);

    // 4. 调用 Store 的 toggleFavorite 方法
    try {
      const result = await toggleFavorite(modelId, currentFavorites);

      // 5. 使用服务端返回的权威数据更新计数器
      setCurrentFavorites(result.favoriteCount);

      logger.info(`收藏成功: modelId=${modelId}, favoriteCount=${result.favoriteCount}`);
    } catch (error) {
      // 6. 失败时回滚计数器
      setCurrentFavorites(currentFavorites);
      logger.error('收藏失败:', error);

      // 显示错误提示
      Alert.alert(t('dialog.error.title'), t('dialog.interaction.favoriteFailed'));
    }
  }, [
    modelId,
    isAuthenticated,
    isLoading,
    isFavorited,
    currentFavorites,
    toggleFavorite,
    onRequireLogin,
    t,
  ]);

  return {
    isLiked,
    isFavorited,
    currentLikes,
    currentFavorites,
    isLoading,
    handleLike,
    handleFavorite,
  };
}
