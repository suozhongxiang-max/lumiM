/**
 * 打印机数据模型类型定义
 * 定义应用内部使用的数据结构
 */

/**
 * 打印机状态枚举（内部格式）
 */
export type PrinterStatus = 'idle' | 'printing' | 'paused' | 'offline' | 'error';

/**
 * 打印任务信息
 */
export interface PrintTask {
  // 任务 ID
  taskId: string;
  // 任务名称
  taskName: string;
  // 打印进度（0-100）
  progress: number;
  // 开始时间（Date 对象）
  startTime: Date;
  // 预计结束时间（Date 对象，可选）
  estimatedEndTime?: Date;
  // 已打印时间（秒）
  elapsedTime: number;
  // 剩余时间（秒）
  remainingTime: number;
  // 当前层数
  currentLayer: number;
  // 总层数
  totalLayers: number;
}

/**
 * 打印机信息（完整数据）
 */
export interface Printer {
  // 设备 ID
  deviceId: string;
  // 设备名称
  deviceName: string;
  // 产品 ID
  productId: string;
  // 产品名称
  productName: string;
  // 产品型号
  model: string;
  // 打印机状态
  status: PrinterStatus;
  // 绑定时间（Date 对象）
  bindTime: Date;
  // 喷嘴温度（℃）
  nozzleTemp: number;
  // 喷嘴目标温度（℃）
  nozzleTargetTemp: number;
  // 热床温度（℃）
  bedTemp: number;
  // 热床目标温度（℃）
  bedTargetTemp: number;
  // 打印速度（%）
  printSpeed: number;
  // 风扇速度（%）
  fanSpeed: number;
  // 最后更新时间（Date 对象）
  lastUpdateTime: Date;
  // 当前任务信息（可选，仅在打印中时存在）
  currentTask?: PrintTask;
}

/**
 * 打印机列表项（简化数据）
 */
export interface PrinterListItem {
  // 设备 ID
  deviceId: string;
  // 设备名称
  deviceName: string;
  // 产品型号
  model: string;
  // 打印机状态
  status: PrinterStatus;
  // 绑定时间（Date 对象）
  bindTime: Date;
  // 当前任务名称（可选）
  currentTaskName?: string;
  // 当前任务进度（可选，0-100）
  currentTaskProgress?: number;
}

/**
 * 产品信息
 */
export interface Product {
  // 产品 ID
  productId: string;
  // 产品名称
  productName: string;
  // 产品型号
  model: string;
  // 产品描述
  description?: string;
}
