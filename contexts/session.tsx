/**
 * 认证会话上下文
 * 符合 Expo Router 官方最佳实践
 *
 * 职责：
 * - 提供全局认证状态访问
 * - 管理 SplashScreen 显示/隐藏
 * - 初始化认证状态检查
 */

import React, { createContext, useContext, useEffect, type PropsWithChildren } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { useAuthStore } from '@/stores';
import { logger } from '@/utils/logger';

// ============================================
// 类型定义
// ============================================

/**
 * 会话数据类型
 */
type SessionContextType = {
  /**
   * 用户会话信息（Token）
   * null 表示未登录
   */
  session: string | null;

  /**
   * 是否正在加载认证状态
   */
  isLoading: boolean;

  /**
   * 检查并恢复认证状态
   */
  checkAuth: () => Promise<void>;
};

// ============================================
// Context 创建
// ============================================

const SessionContext = createContext<SessionContextType>({
  session: null,
  isLoading: true,
  checkAuth: async () => {},
});

// ============================================
// Provider 组件
// ============================================

/**
 * SessionProvider
 * 包裹整个应用，提供认证状态访问
 */
export function SessionProvider({ children }: PropsWithChildren) {
  // 从 Zustand Store 获取认证状态
  const token = useAuthStore(state => state.token);
  const isLoading = useAuthStore(state => state.isLoading);
  const checkAuth = useAuthStore(state => state.checkAuth);

  // 应用启动时初始化认证状态（仅执行一次）
  useEffect(() => {
    // 防止 SplashScreen 自动隐藏
    SplashScreen.preventAutoHideAsync();

    logger.debug('SessionProvider 初始化，检查认证状态');

    // 检查认证状态
    checkAuth().finally(() => {
      // 认证检查完成后隐藏 SplashScreen
      logger.debug('认证状态检查完成，隐藏 SplashScreen');
      SplashScreen.hideAsync();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 空依赖数组：只在首次挂载时执行一次

  // 构建 Context 值
  const value: SessionContextType = {
    session: token,
    isLoading,
    checkAuth,
  };

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

// ============================================
// Hook 导出
// ============================================

/**
 * useSession Hook
 * 在组件中访问认证会话状态
 *
 * @returns 会话信息和加载状态
 * @example
 * const { session, isLoading } = useSession();
 * if (session) {
 *   // 已登录
 * }
 */
export function useSession() {
  const context = useContext(SessionContext);

  if (!context) {
    throw new Error('useSession 必须在 SessionProvider 内部使用');
  }

  return context;
}
