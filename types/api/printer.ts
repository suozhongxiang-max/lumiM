/**
 * 打印机 API 类型定义
 * 定义后端接口的请求和响应格式
 */

/**
 * 打印机状态枚举（后端 API 格式）
 */
export type PrinterApiStatus = 'ONLINE' | 'OFFLINE' | 'PRINTING' | 'PAUSED' | 'ERROR';

/**
 * 产品信息
 */
export interface ProductInfo {
  // 产品 ID
  productId: string;
  // 产品名称
  productName: string;
  // 产品型号
  model: string;
  // 产品描述
  description?: string;
}

/**
 * 实时状态数据
 */
export interface RealtimeStatus {
  // 喷嘴温度
  nozzleTemperature: {
    current: number; // 当前温度（℃）
    target: number; // 目标温度（℃）
  };
  // 热床温度
  bedTemperature: {
    current: number; // 当前温度（℃）
    target: number; // 目标温度（℃）
  };
  // 内部温度（℃）
  innerTemperature: number;
  // 位置信息
  position: {
    x: number;
    y: number;
    z: number;
  };
  // 风扇是否启用
  fanEnabled: boolean;
  // LED 是否启用
  ledEnabled: boolean;
}

/**
 * 当前任务信息
 */
export interface CurrentJob {
  // 任务名称
  name: string;
  // 打印进度（0-100）
  progress: number;
  // 剩余时间（秒）
  timeRemaining: number;
  // 开始时间（ISO 8601 格式）
  startedAt: string;
}

/**
 * 打印机基本信息（列表项）
 */
export interface PrinterBasicInfo {
  // 设备 ID（后端字段名为 id）
  id: string;
  // 设备名称（后端字段名为 name）
  name: string;
  // 设备名称（后端字段名为 deviceName）
  deviceName: string;
  // 产品 ID（可选）
  productId?: string;
  // 产品名称（可选）
  productName?: string;
  // 产品型号
  model: string;
  // 打印机状态
  status: PrinterApiStatus;
  // 最后在线时间（ISO 8601 格式，可选）
  lastOnline?: string;
  // 固件版本（可选）
  firmwareVersion?: string;
}

/**
 * 打印机详情信息
 */
export interface PrinterDetailInfo {
  // 设备 ID
  id: string;
  // 设备名称
  name: string;
  // 设备名称
  deviceName: string;
  // 产品型号
  model: string;
  // 打印机状态
  status: PrinterApiStatus;
  // 最后在线时间（ISO 8601 格式）
  lastOnline: string;
  // 固件版本
  firmwareVersion: string;
  // 实时状态数据（可能为 null）
  realtimeStatus: RealtimeStatus | null;
  // 当前任务信息（可能为 null）
  currentJob: CurrentJob | null;
}

/**
 * 绑定打印机请求参数
 */
export interface BindPrinterRequest {
  // 设备名称（如 R1-AX6FFI）
  deviceName: string;
  // 绑定码（6 位字母数字）
  code: string;
}

/**
 * 解绑打印机请求参数
 */
export interface UnbindPrinterRequest {
  // 设备 ID
  deviceId: string;
}

/**
 * 创建打印任务请求参数
 * deviceId 已移到路径参数，不再包含在请求体中
 */
export interface CreatePrintTaskRequest {
  // 模型 ID
  modelId: string;
  // 任务名称
  taskName: string;
}

/**
 * 打印机列表响应
 */
export interface PrinterListResponse {
  // 打印机列表
  printers: PrinterBasicInfo[];
  // 总数
  total: number;
  // 当前页码
  page: number;
  // 每页数量
  size: number;
}

/**
 * 产品列表响应
 */
export interface ProductListResponse {
  // 产品列表
  products: ProductInfo[];
  // 总数
  total: number;
}

/**
 * 绑定打印机响应
 * 新版本 API 只返回 message，不再返回 printer 对象
 */
export interface BindPrinterResponse {
  // 成功消息
  message: string;
}

/**
 * 创建打印任务响应
 */
export interface CreatePrintTaskResponse {
  // 任务 ID
  taskId: string;
  // 任务名称
  taskName: string;
  // 创建时间（ISO 8601 格式）
  createTime: string;
}

/**
 * 打印机详情响应
 * 新版本 API 返回格式（包含嵌套的 printer 字段）
 */
export interface PrinterDetailResponse {
  // 打印机详情（嵌套在 printer 字段中）
  printer: PrinterDetailInfo;
}
