/**
 * 打印机 Store 类型定义
 */

import type { Printer, PrinterListItem } from '@/types/models/printer';

/**
 * 打印机 Store 状态接口
 */
export interface PrinterState {
  // 打印机列表
  printers: PrinterListItem[];
  // 当前选中的打印机详情
  currentPrinter: Printer | null;
  // 当前选中的打印机 ID（用于记住用户选择）
  selectedPrinterId: string | null;
  // 加载状态
  loading: boolean;
  // 刷新状态
  refreshing: boolean;
  // 错误信息
  error: string | null;
  // 轮询开关
  pollingEnabled: boolean;
  // 轮询间隔（毫秒）
  pollingInterval: number;
}

/**
 * 打印机 Store 操作接口
 */
export interface PrinterActions {
  /**
   * 获取打印机列表
   */
  fetchPrinters: () => Promise<void>;

  /**
   * 获取打印机详情
   * @param deviceId - 设备 ID
   */
  fetchPrinterDetail: (deviceId: string) => Promise<void>;

  /**
   * 刷新当前打印机详情
   */
  refreshCurrentPrinter: () => Promise<void>;

  /**
   * 绑定打印机
   * @param deviceName - 设备名称
   * @param code - 绑定码
   */
  bindPrinter: (deviceName: string, code: string) => Promise<void>;

  /**
   * 解绑打印机
   * @param deviceId - 设备 ID
   */
  unbindPrinter: (deviceId: string) => Promise<void>;

  /**
   * 创建打印任务
   * @param deviceId - 设备 ID
   * @param modelId - 模型 ID
   * @param taskName - 任务名称
   */
  createPrintTask: (deviceId: string, modelId: string, taskName: string) => Promise<void>;

  /**
   * 启用/禁用轮询
   * @param enabled - 是否启用
   */
  setPollingEnabled: (enabled: boolean) => void;

  /**
   * 设置轮询间隔
   * @param interval - 轮询间隔（毫秒）
   */
  setPollingInterval: (interval: number) => void;

  /**
   * 清除错误
   */
  clearError: () => void;

  /**
   * 重置状态
   */
  reset: () => void;
}

/**
 * 打印机 Store 完整类型
 */
export type PrinterStore = PrinterState & PrinterActions;
