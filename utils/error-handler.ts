import { logger } from '@/utils/logger';

export enum ErrorType {
  NETWORK = 'network',
  SERVER = 'server',
  VALIDATION = 'validation',
  UNKNOWN = 'unknown',
}

/**
 * 错误分类结果类型
 * 使用 i18n 键而不是硬编码的消息文本
 */
export interface ErrorCategory {
  type: ErrorType;
  messageKey: string; // i18n 键，调用方使用 t() 函数翻译
}

/**
 * 错误分类函数
 * 返回错误类型和对应的 i18n 翻译键
 */
export const categorizeError = (error: Error): ErrorCategory => {
  if (error.message.includes('无法连接到服务器') || error.message.includes('网络请求失败')) {
    return {
      type: ErrorType.NETWORK,
      messageKey: 'error.network',
    };
  }

  if (error.message.includes('服务器出错了')) {
    return {
      type: ErrorType.SERVER,
      messageKey: 'error.server',
    };
  }

  if (error.message.includes('请输入') || error.message.includes('请选择')) {
    return {
      type: ErrorType.VALIDATION,
      messageKey: error.message, // 验证错误直接使用原始消息
    };
  }

  return {
    type: ErrorType.UNKNOWN,
    messageKey: 'error.unknown',
  };
};

/**
 * 记录错误到日志系统
 * 返回错误类型和翻译键
 */
export const logError = (error: Error, context?: string) => {
  const { type, messageKey } = categorizeError(error);
  logger.error(`[${type.toUpperCase()}] ${context || '未知错误'}:`, error);
  return { type, messageKey };
};
