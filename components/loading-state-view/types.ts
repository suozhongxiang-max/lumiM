import type { ReactNode } from 'react';

/**
 * 加载状态视图组件的 Props 接口
 */
export interface LoadingStateViewProps {
  // ==================== 状态 ====================
  /**
   * 是否正在加载（首次加载）
   */
  loading: boolean;

  /**
   * 错误信息，null 表示无错误
   */
  error: string | null;

  /**
   * 是否为空（无数据）
   */
  isEmpty: boolean;

  // ==================== 回调 ====================
  /**
   * 重试回调，点击重试按钮时触发
   */
  onRetry?: () => void;

  // ==================== 自定义文本 ====================
  /**
   * 加载中的提示文本，默认"加载中..."
   */
  loadingText?: string;

  /**
   * 空状态的提示文本，默认"暂无数据"
   */
  emptyText?: string;

  // ==================== 子组件 ====================
  /**
   * 成功状态下显示的内容
   * 当 loading=false, error=null, isEmpty=false 时显示
   */
  children: ReactNode;
}
