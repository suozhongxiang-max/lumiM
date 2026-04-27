/**
 * 打印机辅助函数
 * 提供状态映射、时间格式化等工具函数
 */

import type { PrinterApiStatus } from '@/types/api/printer';
import type { PrinterStatus } from '@/types/models/printer';

/**
 * 映射 API 状态到内部状态
 * @param apiStatus - API 状态
 * @returns 内部状态
 */
export function mapApiStatusToInternal(apiStatus: PrinterApiStatus): PrinterStatus {
  const statusMap: Record<PrinterApiStatus, PrinterStatus> = {
    ONLINE: 'idle',
    OFFLINE: 'offline',
    PRINTING: 'printing',
    PAUSED: 'paused',
    ERROR: 'error',
  };
  return statusMap[apiStatus];
}

/**
 * 映射内部状态到 API 状态
 * @param internalStatus - 内部状态
 * @returns API 状态
 */
export function mapInternalStatusToApi(internalStatus: PrinterStatus): PrinterApiStatus {
  const statusMap: Record<PrinterStatus, PrinterApiStatus> = {
    idle: 'ONLINE',
    offline: 'OFFLINE',
    printing: 'PRINTING',
    paused: 'PAUSED',
    error: 'ERROR',
  };
  return statusMap[internalStatus];
}

/**
 * 解析 ISO 8601 时间字符串为 Date 对象
 * @param isoString - ISO 8601 格式的时间字符串
 * @returns Date 对象
 */
export function parseISODate(isoString: string): Date {
  return new Date(isoString);
}

/**
 * 计算已打印时间（秒）
 * @param startTime - 开始时间
 * @returns 已打印时间（秒）
 */
export function calculateElapsedTime(startTime: Date): number {
  const now = new Date();
  const elapsed = Math.floor((now.getTime() - startTime.getTime()) / 1000);
  return Math.max(0, elapsed);
}

/**
 * 计算剩余时间（秒）
 * @param startTime - 开始时间
 * @param estimatedEndTime - 预计结束时间（可选）
 * @returns 剩余时间（秒），如果没有预计结束时间则返回 0
 */
export function calculateRemainingTime(startTime: Date, estimatedEndTime?: Date): number {
  if (!estimatedEndTime) {
    return 0;
  }

  const now = new Date();
  const remaining = Math.floor((estimatedEndTime.getTime() - now.getTime()) / 1000);
  return Math.max(0, remaining);
}

/**
 * 格式化时间（秒）为可读字符串
 * @param seconds - 秒数
 * @returns 格式化的时间字符串（如 "1h 23m"）
 */
export function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`;
  }

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  return `${minutes}m`;
}

/**
 * 根据打印机状态决定轮询间隔
 * @param status - 打印机状态
 * @returns 轮询间隔（毫秒）
 */
export function getPollingInterval(status: PrinterStatus): number {
  // 打印中状态：5 秒轮询
  if (status === 'printing') {
    return 5000;
  }

  // 其他状态：10 秒轮询
  return 10000;
}

/**
 * 获取状态显示文本
 * @param status - 打印机状态
 * @param t - 翻译函数（从 useI18n 获取）
 * @returns 状态显示文本
 */
export function getStatusText(status: PrinterStatus, t: (key: string) => string): string {
  const statusKeyMap: Record<PrinterStatus, string> = {
    idle: 'printer.status.idle',
    printing: 'printer.status.printing',
    paused: 'printer.status.paused',
    offline: 'printer.status.offline',
    error: 'printer.status.error',
  };
  const key = statusKeyMap[status];
  return t(key);
}

/**
 * 获取状态颜色
 * @param status - 打印机状态
 * @returns 状态颜色（十六进制）
 */
export function getStatusColor(status: PrinterStatus): string {
  const statusColorMap: Record<PrinterStatus, string> = {
    idle: '#4CAF50', // 绿色
    printing: '#2196F3', // 蓝色
    paused: '#FF9800', // 橙色
    offline: '#9E9E9E', // 灰色
    error: '#F44336', // 红色
  };
  return statusColorMap[status];
}

/**
 * 验证设备名称格式
 * @param deviceName - 设备名称
 * @returns 是否有效
 */
export function validateDeviceName(deviceName: string): boolean {
  // 设备名称格式：R1-AX6FFI（字母数字和连字符）
  const pattern = /^[A-Z0-9]+-[A-Z0-9]+$/i;
  return pattern.test(deviceName);
}

/**
 * 验证绑定码格式
 * @param code - 绑定码
 * @returns 是否有效
 */
export function validateBindCode(code: string): boolean {
  // 绑定码格式：6 位字母数字
  const pattern = /^[A-Z0-9]{6}$/i;
  return pattern.test(code);
}
