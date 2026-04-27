/**
 * 导航防抖 Hook
 * 防止快速双击导致重复跳转
 */

import { useRef, useCallback } from 'react';
import { logger } from '@/utils/logger';

/**
 * 导航防抖配置
 */
interface NavigationDebounceOptions {
  /** 防抖延迟时间（毫秒），默认 300ms */
  delay?: number;
}

/**
 * 导航防抖 Hook
 *
 * 用于防止快速双击导致的重复导航跳转
 *
 * @example
 * ```tsx
 * const handleNavigate = useNavigationDebounce((id: string) => {
 *   router.push(`/model/${id}`);
 * });
 *
 * <TouchableOpacity onPress={() => handleNavigate(model.id)}>
 *   <Text>点击跳转</Text>
 * </TouchableOpacity>
 * ```
 */
export function useNavigationDebounce<T extends (...args: any[]) => void>(
  navigate: T,
  options: NavigationDebounceOptions = {}
): T {
  const { delay = 300 } = options;

  // 记录上次跳转的时间
  const lastNavigateTimeRef = useRef<number>(0);
  // 记录是否正在跳转中（简单标记，不使用 JSON.stringify）
  const isNavigatingRef = useRef<boolean>(false);

  return useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now();

      // 如果正在跳转中，忽略
      if (isNavigatingRef.current) {
        logger.debug('[useNavigationDebounce] 正在跳转中，忽略重复点击');
        return;
      }

      // 如果距离上次跳转时间太短，忽略
      if (now - lastNavigateTimeRef.current < delay) {
        logger.debug('[useNavigationDebounce] 跳转过于频繁，忽略本次点击', {
          timeSinceLast: now - lastNavigateTimeRef.current,
          delay,
        });
        return;
      }

      // 执行跳转
      logger.info('[useNavigationDebounce] 执行导航跳转', { args, argsType: typeof args });
      lastNavigateTimeRef.current = now;
      isNavigatingRef.current = true;

      try {
        navigate(...args);
      } catch (error) {
        logger.error('[useNavigationDebounce] 导航跳转失败:', error);
        isNavigatingRef.current = false;
      }

      // 延迟后清除正在跳转标记
      setTimeout(() => {
        isNavigatingRef.current = false;
      }, delay + 100);
    },
    [navigate, delay]
  ) as T;
}

/**
 * 创建防抖的导航函数（不使用 Hook，适用于组件外部）
 *
 * @example
 * ```tsx
 * const navigateToModel = createDebouncedNavigation((id: string) => {
 *   router.push(`/model/${id}`);
 * });
 *
 * // 直接使用
 * navigateToModel(model.id);
 * ```
 */
export function createDebouncedNavigation<T extends (...args: any[]) => void>(
  navigate: T,
  options: NavigationDebounceOptions = {}
): T {
  const { delay = 300 } = options;

  let lastNavigateTime = 0;
  let isNavigating = false;

  return ((...args: Parameters<T>) => {
    const now = Date.now();

    // 如果正在跳转中，忽略
    if (isNavigating) {
      logger.debug('[createDebouncedNavigation] 正在跳转中，忽略重复点击');
      return;
    }

    // 如果距离上次跳转时间太短，忽略
    if (now - lastNavigateTime < delay) {
      logger.debug('[createDebouncedNavigation] 跳转过于频繁，忽略本次点击', {
        timeSinceLast: now - lastNavigateTime,
        delay,
      });
      return;
    }

    // 执行跳转
    logger.info('[createDebouncedNavigation] 执行导航跳转', { args, argsType: typeof args });
    lastNavigateTime = now;
    isNavigating = true;

    try {
      navigate(...args);
    } catch (error) {
      logger.error('[createDebouncedNavigation] 导航跳转失败:', error);
      isNavigating = false;
    }

    // 延迟后清除正在跳转标记
    setTimeout(() => {
      isNavigating = false;
    }, delay + 100);
  }) as T;
}
