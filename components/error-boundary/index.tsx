/**
 * 全局错误边界组件
 * 捕获 React 组件树中的错误，防止应用崩溃
 */

import React, { Component, type ErrorInfo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { logger } from '@/utils/logger';
import { useI18n } from '@/hooks/use-i18n';
import type { ErrorBoundaryProps, ErrorBoundaryState } from './types';

/**
 * 错误边界组件类
 * 支持通过 props 传入翻译字符串
 */
class ErrorBoundaryClassInternal extends Component<
  ErrorBoundaryProps & {
    // 可选的翻译字符串，如果提供则使用，否则使用默认文本
    translations?: {
      title: string;
      description: string;
      details: string;
      reload: string;
    };
  },
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  /**
   * 静态方法：从错误中派生状态
   */
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  /**
   * 生命周期：捕获错误信息
   */
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // 记录错误到日志系统
    logger.error('React 组件错误边界捕获到错误:', {
      error: error.toString(),
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });

    // 调用自定义错误回调
    this.props.onError?.(error, errorInfo);

    // TODO: 这里可以添加错误上报到 Sentry 等服务
    // if (isProduction) {
    //   Sentry.captureException(error, { contexts: { react: { componentStack: errorInfo.componentStack } } });
    // }
  }

  /**
   * 重置错误状态
   */
  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
    });
    logger.info('用户重置了错误边界');
  };

  render() {
    if (this.state.hasError && this.state.error) {
      // 如果提供了自定义 fallback，使用它
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.resetError);
      }

      // 否则使用默认错误展示界面
      const texts = this.props.translations || {
        title: '应用遇到了问题',
        description: '很抱歉，应用遇到了一个意外错误。\n请尝试重启应用或联系技术支持。',
        details: '错误详情：',
        reload: '重新加载',
      };

      return (
        <View style={styles.container}>
          <View style={styles.content}>
            {/* 错误图标 */}
            <Text style={styles.icon}>⚠️</Text>

            {/* 错误标题 */}
            <Text style={styles.title}>{texts.title}</Text>

            {/* 错误描述 */}
            <Text style={styles.description}>{texts.description}</Text>

            {/* 错误详情（仅开发环境显示） */}
            {__DEV__ && this.state.error && (
              <View style={styles.errorDetails}>
                <Text style={styles.errorTitle}>{texts.details}</Text>
                <Text style={styles.errorMessage}>{this.state.error.toString()}</Text>
                {this.state.error.stack && (
                  <Text style={styles.errorStack}>{this.state.error.stack}</Text>
                )}
              </View>
            )}

            {/* 重试按钮 */}
            <TouchableOpacity style={styles.button} onPress={this.resetError} activeOpacity={0.8}>
              <Text style={styles.buttonText}>{texts.reload}</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 32,
    maxWidth: 400,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  icon: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  errorDetails: {
    backgroundColor: '#FFF5F5',
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
    width: '100%',
    maxHeight: 200,
  },
  errorTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#DC2626',
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 13,
    color: '#DC2626',
    marginBottom: 8,
    fontFamily: 'monospace',
  },
  errorStack: {
    fontSize: 11,
    color: '#EF4444',
    fontFamily: 'monospace',
    lineHeight: 16,
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 32,
    minWidth: 160,
    shadowColor: '#007AFF',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});

/**
 * 全局未处理的 Promise 拒绝捕获
 * 需要在应用启动时调用一次
 */
export const setupGlobalErrorHandlers = () => {
  // Web 环境：捕获未处理的 Promise 拒绝
  if (Platform.OS === 'web') {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      // 立即提取 reason，避免保留对事件对象的引用
      const reason = event.reason;
      logger.error('未处理的 Promise 拒绝:', reason);

      // TODO: 上报到错误监控服务
      // if (isProduction) {
      //   Sentry.captureException(reason);
      // }
    };

    if (typeof window !== 'undefined' && window.addEventListener) {
      window.addEventListener('unhandledrejection', handleUnhandledRejection);
    }
  }

  // React Native 环境：设置全局错误处理器
  if (Platform.OS !== 'web') {
    // 捕获未处理的 Promise 拒绝
    const promiseRejectionHandler = (_id: number, error: Error | unknown) => {
      logger.error('未处理的 Promise 拒绝:', error);

      // TODO: 上报到错误监控服务
      // if (isProduction) {
      //   Sentry.captureException(error);
      // }
    };

    // 使用 global 对象来处理未处理的 Promise 拒绝
    const globalAny = global as any;
    if (globalAny.HermesInternal?.hasPromise?.()) {
      // Hermes 引擎
      globalAny.HermesInternal.enablePromiseRejectionTracker?.(promiseRejectionHandler);
    }

    // 设置全局错误处理器
    const originalErrorHandler = ErrorUtils?.getGlobalHandler?.();
    if (originalErrorHandler) {
      ErrorUtils.setGlobalHandler((error, isFatal) => {
        logger.error('全局错误处理器捕获:', {
          error: error.toString(),
          stack: error.stack,
          isFatal,
        });

        // 调用原始处理器
        originalErrorHandler(error, isFatal);
      });
    }
  }

  logger.info('全局错误处理器已设置');
};

/**
 * 带有 i18n 支持的错误边界组件
 * 这是一个函数组件，可以使用 useI18n hook
 */
export function ErrorBoundary({ children, fallback, onError }: ErrorBoundaryProps) {
  const { t } = useI18n();

  // 准备翻译文本
  const translations = {
    title: t('errorBoundary.title'),
    description: t('errorBoundary.description'),
    details: t('errorBoundary.details'),
    reload: t('errorBoundary.reload'),
  };

  return (
    <ErrorBoundaryClassInternal translations={translations} fallback={fallback} onError={onError}>
      {children}
    </ErrorBoundaryClassInternal>
  );
}

// 导出类组件以便需要直接使用
export { ErrorBoundaryClassInternal as ErrorBoundaryClass };

// 默认导出函数组件
export default ErrorBoundary;
