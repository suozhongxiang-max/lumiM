/**
 * 统一日志管理模块
 * 使用 react-native-logs 实现分级日志、环境区分、彩色输出
 */

import { logger as rnLogger, consoleTransport } from 'react-native-logs';
import { isDevelopment, isProduction } from '@/config/env';

/**
 * 日志级别配置
 * - debug: 详细调试信息（仅开发环境）
 * - info: 一般信息（如用户操作）
 * - warn: 警告信息（如 API 降级）
 * - error: 错误信息（需要关注）
 */
const config = {
  levels: {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
  },
  severity: isDevelopment ? ('debug' as const) : ('error' as const), // 开发环境显示所有，生产环境仅 error
  transport: consoleTransport,
  transportOptions: {
    colors: {
      debug: 'blueBright' as const,
      info: 'greenBright' as const,
      warn: 'yellowBright' as const,
      error: 'redBright' as const,
    },
  },
  async: true,
  dateFormat: 'time' as const, // 显示时间戳
  printLevel: true, // 显示日志级别
  printDate: true, // 显示日期
  enabled: true,
};

// 创建日志实例
const loggerInstance = rnLogger.createLogger(config);

/**
 * 统一日志接口
 *
 * @example
 * ```typescript
 * import { logger } from '@/utils/logger';
 *
 * // 调试信息
 * logger.debug('用户点击了按钮', { buttonId: 'submit' });
 *
 * // 一般信息
 * logger.info('用户登录成功', { userId: '123' });
 *
 * // 警告信息
 * logger.warn('API 响应较慢', { duration: 3000 });
 *
 * // 错误信息
 * logger.error('网络请求失败', error);
 * ```
 */
export const logger = {
  /**
   * 调试信息 - 仅开发环境显示
   * 用于详细的调试输出，如函数调用、状态变化等
   */
  debug: (message: string, ...args: unknown[]) => {
    loggerInstance.debug(message, ...args);
  },

  /**
   * 一般信息
   * 用于记录正常的业务流程，如用户操作、状态更新等
   */
  info: (message: string, ...args: unknown[]) => {
    loggerInstance.info(message, ...args);
  },

  /**
   * 警告信息
   * 用于记录潜在问题，如 API 降级、性能警告等
   */
  warn: (message: string, ...args: unknown[]) => {
    loggerInstance.warn(message, ...args);
  },

  /**
   * 错误信息 - 所有环境都会显示
   * 用于记录错误，如网络失败、异常捕获等
   */
  error: (message: string, ...args: unknown[]) => {
    loggerInstance.error(message, ...args);
  },
};

/**
 * 禁用所有日志（用于测试环境）
 */
export const disableLogger = () => {
  loggerInstance.setSeverity('error');
};

/**
 * 启用所有日志
 */
export const enableLogger = () => {
  loggerInstance.setSeverity(isDevelopment ? 'debug' : 'error');
};

/**
 * 生产环境静默模式
 * 在生产环境完全禁用 console 输出，防止信息泄露
 */
if (isProduction) {
  // 覆盖原生 console 方法（仅生产环境）
  const noop = () => {};
  console.log = noop;
  console.debug = noop;
  console.info = noop;
  // 保留 console.warn 和 console.error 用于严重问题追踪
}

export default logger;
