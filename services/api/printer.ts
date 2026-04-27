/**
 * 打印机 API 服务
 * 封装所有打印机相关的 API 调用
 */

import { apiGet, apiPost, apiDelete } from '../api-client';
import { API_ENDPOINTS } from '@/config/api';
import { logger } from '@/utils/logger';
import {
  mapApiStatusToInternal,
  parseISODate,
  calculateElapsedTime,
  calculateRemainingTime,
} from '@/utils/printer-helpers';
import type {
  PrinterDetailInfo,
  PrinterBasicInfo,
  PrinterListResponse,
  ProductListResponse,
  BindPrinterRequest,
  BindPrinterResponse,
  UnbindPrinterRequest,
  CreatePrintTaskRequest,
  CreatePrintTaskResponse,
  ProductInfo,
  PrinterDetailResponse,
} from '@/types/api/printer';
import type { Printer, PrinterListItem, Product } from '@/types/models/printer';

/**
 * API 调用选项
 */
interface ApiCallOptions {
  // 取消信号
  signal?: AbortSignal;
}

/**
 * 转换 API 详情数据为内部模型
 * @param apiData - API 返回的打印机详情数据
 * @returns 内部打印机模型
 */
function transformPrinterDetail(apiData: PrinterDetailInfo): Printer {
  // 构建基础打印机信息
  const printer: Printer = {
    deviceId: apiData.id, // 后端字段名为 id
    deviceName: apiData.deviceName,
    productId: '', // 后端没有返回，使用空字符串
    productName: '', // 后端没有返回，使用空字符串
    model: apiData.model,
    status: mapApiStatusToInternal(apiData.status),
    bindTime: parseISODate(apiData.lastOnline), // 使用 lastOnline 作为绑定时间
    nozzleTemp: apiData.realtimeStatus?.nozzleTemperature.current || 0,
    nozzleTargetTemp: apiData.realtimeStatus?.nozzleTemperature.target || 0,
    bedTemp: apiData.realtimeStatus?.bedTemperature.current || 0,
    bedTargetTemp: apiData.realtimeStatus?.bedTemperature.target || 0,
    printSpeed: 100, // 后端没有返回，使用默认值
    fanSpeed: apiData.realtimeStatus?.fanEnabled ? 100 : 0, // 根据 fanEnabled 推断
    lastUpdateTime: parseISODate(apiData.lastOnline),
  };

  // 如果有当前任务，添加任务信息
  if (apiData.currentJob) {
    const startTime = parseISODate(apiData.currentJob.startedAt);
    const remainingTime = apiData.currentJob.timeRemaining;
    const estimatedEndTime =
      remainingTime > 0 ? new Date(startTime.getTime() + remainingTime * 1000) : undefined;

    printer.currentTask = {
      taskId: '', // 后端没有返回 taskId，使用空字符串
      taskName: apiData.currentJob.name,
      progress: apiData.currentJob.progress,
      startTime,
      estimatedEndTime,
      elapsedTime: calculateElapsedTime(startTime),
      remainingTime: apiData.currentJob.timeRemaining,
      currentLayer: 0, // 后端没有返回，使用默认值
      totalLayers: 0, // 后端没有返回，使用默认值
    };
  }

  return printer;
}

/**
 * 转换 API 列表数据为内部模型
 * @param apiData - API 返回的打印机基本信息
 * @returns 内部打印机列表项模型
 */
function transformPrinterListItem(apiData: PrinterBasicInfo): PrinterListItem {
  return {
    deviceId: apiData.id, // 后端字段名为 id
    deviceName: apiData.deviceName,
    model: apiData.model,
    status: mapApiStatusToInternal(apiData.status),
    bindTime: apiData.lastOnline ? parseISODate(apiData.lastOnline) : new Date(), // 使用 lastOnline 作为绑定时间
  };
}

/**
 * 转换产品信息
 * @param apiData - API 返回的产品信息
 * @returns 内部产品模型
 */
function transformProduct(apiData: ProductInfo): Product {
  return {
    productId: apiData.productId,
    productName: apiData.productName,
    model: apiData.model,
    description: apiData.description,
  };
}

/**
 * 查询产品列表
 * @param options - API 调用选项
 * @returns 产品列表
 */
export async function fetchProducts(options?: ApiCallOptions): Promise<Product[]> {
  logger.info('[PrinterAPI] 查询产品列表');

  const result = await apiGet<ProductListResponse>(API_ENDPOINTS.printer.products, {
    signal: options?.signal,
  });

  if (!result.success) {
    logger.error('[PrinterAPI] 查询产品列表失败:', result.error);
    throw result.error;
  }

  logger.info('[PrinterAPI] 查询产品列表成功，共', result.data.total, '个产品');
  return result.data.products.map(transformProduct);
}

/**
 * 获取打印机列表
 * @param options - API 调用选项
 * @returns 打印机列表
 */
export async function fetchPrinterList(options?: ApiCallOptions): Promise<PrinterListItem[]> {
  logger.info('[PrinterAPI] 获取打印机列表');

  const result = await apiGet<PrinterListResponse>(API_ENDPOINTS.printer.list, {
    signal: options?.signal,
  });

  if (!result.success) {
    logger.error('[PrinterAPI] 获取打印机列表失败:', result.error);
    throw result.error;
  }

  // 检查响应数据结构
  if (!result.data || !result.data.printers) {
    logger.error('[PrinterAPI] 响应数据格式错误');
    return [];
  }

  logger.info('[PrinterAPI] 获取打印机列表成功，共', result.data.total, '台打印机');

  // 转换数据
  return result.data.printers.map(transformPrinterListItem);
}

/**
 * 获取打印机详情
 * @param deviceId - 设备 ID
 * @param options - API 调用选项
 * @returns 打印机详情
 */
export async function fetchPrinterDetail(
  deviceId: string,
  options?: ApiCallOptions
): Promise<Printer> {
  logger.info('[PrinterAPI] 获取打印机详情:', deviceId);

  // 使用新版本 API 端点（RESTful 风格，路径参数）
  const result = await apiGet<PrinterDetailResponse>(API_ENDPOINTS.printer.detail(deviceId), {
    signal: options?.signal,
  });

  if (!result.success) {
    logger.error('[PrinterAPI] 获取打印机详情失败:', result.error);
    throw result.error;
  }

  // 新版本 API 返回格式：{ printer: PrinterDetailInfo }
  logger.info('[PrinterAPI] 获取打印机详情成功:', result.data.printer.deviceName);
  return transformPrinterDetail(result.data.printer);
}

/**
 * 绑定打印机
 * @param deviceName - 设备名称
 * @param code - 绑定码
 * @param options - API 调用选项
 * @returns 绑定结果
 */
export async function bindPrinter(
  deviceName: string,
  code: string,
  options?: ApiCallOptions
): Promise<BindPrinterResponse> {
  logger.info('[PrinterAPI] 绑定打印机:', deviceName);

  const requestBody: BindPrinterRequest = {
    deviceName,
    code,
  };

  const result = await apiPost<BindPrinterResponse>(API_ENDPOINTS.printer.bind, requestBody, {
    signal: options?.signal,
  });

  if (!result.success) {
    logger.error('[PrinterAPI] 绑定打印机失败:', result.error);
    throw result.error;
  }

  // 新版本 API 只返回 message，不再返回 printer 对象
  logger.info('[PrinterAPI] 绑定打印机成功:', result.data.message);
  return result.data;
}

/**
 * 解绑打印机
 * @param deviceId - 设备 ID
 * @param options - API 调用选项
 */
export async function unbindPrinter(deviceId: string, options?: ApiCallOptions): Promise<void> {
  logger.info('[PrinterAPI] 解绑打印机:', deviceId);

  // 使用新版本 API：DELETE 方法，deviceId 作为路径参数
  const result = await apiDelete<{ message: string }>(API_ENDPOINTS.printer.unbind(deviceId), {
    signal: options?.signal,
  });

  if (!result.success) {
    logger.error('[PrinterAPI] 解绑打印机失败:', result.error);
    throw result.error;
  }

  logger.info('[PrinterAPI] 解绑打印机成功');
}

/**
 * 创建打印任务
 * @param deviceId - 设备 ID
 * @param modelId - 模型 ID
 * @param taskName - 任务名称
 * @param options - API 调用选项
 * @returns 创建结果
 */
export async function createPrintTask(
  deviceId: string,
  modelId: string,
  taskName: string,
  options?: ApiCallOptions
): Promise<CreatePrintTaskResponse> {
  logger.info('[PrinterAPI] 创建打印任务:', { deviceId, modelId, taskName });

  // 使用新版本 API：deviceId 作为路径参数，不再包含在请求体中
  const requestBody: CreatePrintTaskRequest = {
    modelId,
    taskName,
  };

  const result = await apiPost<CreatePrintTaskResponse>(
    API_ENDPOINTS.printer.createTask(deviceId),
    requestBody,
    {
      signal: options?.signal,
    }
  );

  if (!result.success) {
    logger.error('[PrinterAPI] 创建打印任务失败:', result.error);
    throw result.error;
  }

  // 新版本 API 返回 201 状态码，但 apiPost 会自动处理
  logger.info('[PrinterAPI] 创建打印任务成功:', result.data.taskId);
  return result.data;
}
