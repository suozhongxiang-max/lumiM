import { categorizeError, ErrorType } from '@/utils/error-handler';
import React, { useMemo } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { LoadingStateViewProps } from './types';

/**
 * 加载状态视图组件
 *
 * 统一处理加载中、错误、空状态的显示逻辑
 * 只有当所有状态都正常时，才显示 children 内容
 *
 * @example
 * ```tsx
 * <LoadingStateView
 *   loading={loading}
 *   error={error}
 *   isEmpty={models.length === 0}
 *   onRetry={handleRetry}
 *   emptyText="暂无模型"
 * >
 *   <ModelList models={models} />
 * </LoadingStateView>
 * ```
 */
export function LoadingStateView({
  loading,
  error,
  isEmpty,
  onRetry,
  loadingText = '加载中...',
  emptyText = '暂无数据',
  children,
}: LoadingStateViewProps) {
  // ==================== 错误分类 ====================
  /**
   * 将错误信息分类，提供更友好的错误提示和图标
   */
  const errorInfo = useMemo(() => {
    if (!error) return null;

    const errorObj = new Error(error);
    return categorizeError(errorObj);
  }, [error]);

  // ==================== 获取错误图标 ====================
  /**
   * 根据错误类型返回对应的 Emoji 图标
   */
  const getErrorIcon = (type: ErrorType): string => {
    switch (type) {
      case ErrorType.NETWORK:
        return '🌐'; // 网络错误
      case ErrorType.SERVER:
        return '🔧'; // 服务器错误
      default:
        return '⚠️'; // 未知错误
    }
  };

  // ==================== 状态判断和渲染 ====================
  
  // 1. 加载中状态（首次加载，不是刷新）
  if (loading && !error && isEmpty) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#999" />
        <Text style={styles.loadingText}>{loadingText}</Text>
      </View>
    );
  }

  // 2. 错误状态
  if (error) {
    return (
      <View style={styles.centerContainer}>
        {/* 错误图标 */}
        <Text style={styles.errorIcon}>{errorInfo ? getErrorIcon(errorInfo.type) : '⚠️'}</Text>

        {/* 错误信息 */}
        <Text style={styles.errorText}>{errorInfo?.message || error}</Text>

        {/* 重试按钮 */}
        {onRetry && (
          <TouchableOpacity style={styles.retryButton} onPress={onRetry} activeOpacity={0.7}>
            <Text style={styles.retryButtonText}>重新加载</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  // 3. 空状态
  if (isEmpty && !loading) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyText}>{emptyText}</Text>
      </View>
    );
  }

  // 4. 正常状态，显示内容
  return <>{children}</>;
}

/**
 * 样式定义
 */
const styles = StyleSheet.create({
  // 居中容器样式（用于加载中、错误、空状态）
  centerContainer: {
    flex: 1,
    justifyContent: 'center', // 垂直居中
    alignItems: 'center', // 水平居中
    paddingHorizontal: 24,
    paddingVertical: 48,
  },

  // 加载中文本样式
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },

  // 错误图标样式
  errorIcon: {
    fontSize: 64,
    marginBottom: 16,
  },

  // 错误文本样式
  errorText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },

  // 重试按钮样式
  retryButton: {
    paddingVertical: 12,
    paddingHorizontal: 32,
    backgroundColor: '#007AFF', // iOS 蓝色
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2, // Android 阴影
  },

  // 重试按钮文本样式
  retryButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
    textAlign: 'center',
  },

  // 空状态文本样式
  emptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});
