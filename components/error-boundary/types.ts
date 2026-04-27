/**
 * 错误边界组件类型定义
 */

import type { ReactNode } from 'react';

/**
 * 错误边界组件 Props
 */
export interface ErrorBoundaryProps {
  /** 子组件 */
  children: ReactNode;
  /** 自定义错误展示组件 */
  fallback?: (error: Error, resetError: () => void) => ReactNode;
  /** 错误回调函数 */
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

/**
 * 错误边界组件 State
 */
export interface ErrorBoundaryState {
  /** 是否有错误 */
  hasError: boolean;
  /** 错误对象 */
  error: Error | null;
}
