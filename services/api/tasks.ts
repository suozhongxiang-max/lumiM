/**
 * AI 创作任务相关 API 服务
 *
 * 核心功能：
 * - 创建文生图任务
 * - 轮询任务状态（支持 HTTP 304 优化）
 * - 选择图片生成 3D 模型
 */

import { apiGet, apiPost, apiPatch, apiDelete, type ApiResult } from '@/services/api-client';
import { API_ENDPOINTS } from '@/config/api';
import { logger } from '@/utils/logger';

/**
 * 图片状态枚举
 */
export type ImageStatus = 'PENDING' | 'GENERATING' | 'COMPLETED' | 'FAILED';

/**
 * 任务状态枚举（后端定义）
 */
export type BackendTaskStatus =
  | 'IMAGE_PENDING' // 图片队列中
  | 'IMAGE_GENERATING' // 图片生成中
  | 'IMAGE_COMPLETED' // 图片完成
  | 'IMAGE_FAILED' // 图片失败
  | 'MODEL_PENDING' // 模型队列中
  | 'MODEL_GENERATING' // 模型生成中
  | 'MODEL_COMPLETED' // 模型完成
  | 'MODEL_FAILED' // 模型失败
  | 'COMPLETED'; // 整个任务完成（后端可能返回的状态）

/**
 * 生成的图片（后端响应格式）
 */
export interface BackendGeneratedImage {
  // 图片唯一标识符
  id: string;
  // 图片在任务中的索引（0-3）
  index: number;
  // 图片状态
  imageStatus: ImageStatus;
  // 图片 URL（生成完成后才有）
  imageUrl: string | null;
  // 实际使用的提示词（LLM 生成的风格化提示词）
  imagePrompt: string | null;
}

/**
 * 生成任务（后端响应格式）
 */
export interface BackendGenerationTask {
  // 任务 ID
  id: string;
  // 用户 ID（可能是 userId 或 externalUserId）
  userId?: string;
  externalUserId?: string;
  // 用户输入的原始提示词
  originalPrompt: string;
  // 任务状态
  status: BackendTaskStatus;
  // 当前阶段
  phase: 'IMAGE_GENERATION' | 'MODEL_GENERATION';
  // 选择的图片索引（0-3，选择后才有）
  selectedImageIndex: number | null;
  // 创建时间
  createdAt: string;
  // 更新时间
  updatedAt: string;
  // 完成时间（可选）
  completedAt?: string | null;
  // 生成的图片列表（固定 4 张，首次创建时可能没有）
  images?: BackendGeneratedImage[];
  // 3D 模型信息（生成后才有）
  model?: {
    id: string;
    sourceImageId: string;
    name: string;
    modelUrl: string | null;
    format: 'OBJ' | 'GLB';
    fileSize?: number | null;
    completedAt?: string | null;
    failedAt?: string | null;
    errorMessage?: string | null;
    // 模型生成任务信息（用于获取进度）
    generationJob?: {
      id: string;
      status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'TIMEOUT';
      progress: number; // 0-100
      startedAt?: string | null;
      completedAt?: string | null;
      failedAt?: string | null;
      errorMessage?: string | null;
    };
  };
}

/**
 * 创建文生图任务的请求参数
 */
export interface CreateTaskRequest {
  // 用户输入的文本描述
  prompt: string;
  // 用户上传的参考图片 URL 列表（可选）
  referenceImages?: string[];
}

/**
 * 创建文生图任务的响应
 */
export interface CreateTaskResponse {
  // 任务详情
  task: BackendGenerationTask;
}

/**
 * 查询任务状态的响应
 */
export interface TaskStatusResponse {
  // 任务详情（仅返回更新的字段）
  task: BackendGenerationTask;
}

/**
 * 选择图片的请求参数
 */
export interface SelectImageRequest {
  // 选择的图片索引（0-3）
  selectedImageIndex: number;
}

/**
 * 选择图片的响应
 */
export interface SelectImageResponse {
  // 更新后的任务
  task: BackendGenerationTask;
  // 生成的 3D 模型信息
  model: {
    id: string;
    sourceImageId: string;
    name: string;
    modelUrl: string | null;
    format: 'OBJ' | 'GLB';
  };
}

/**
 * 任务列表的响应
 */
export interface TaskListResponse {
  // 任务列表
  items: BackendGenerationTask[];
  // 总数
  total: number;
}

/**
 * 获取任务列表
 *
 * @param page - 页码（从 1 开始）
 * @param pageSize - 每页数量
 * @returns API 响应结果
 *
 * @example
 * const result = await fetchTaskList(1, 20);
 * if (result.success) {
 *   console.log('任务列表:', result.data.items);
 * }
 */
export async function fetchTaskList(
  page: number = 1,
  pageSize: number = 20
): Promise<ApiResult<TaskListResponse>> {
  logger.info('[API] 获取任务列表:', { page, pageSize });

  // 构建查询参数
  const queryParams = new URLSearchParams({
    page: page.toString(),
    pageSize: pageSize.toString(),
  });

  // 调用 GET /api/tasks?page=1&pageSize=20
  const result = await apiGet<TaskListResponse>(
    `${API_ENDPOINTS.tasks.list}?${queryParams.toString()}`
  );

  if (result.success) {
    logger.info('[API] 任务列表获取成功:', {
      total: result.data.total,
      count: result.data.items.length,
    });
  } else {
    logger.error('[API] 任务列表获取失败:', result.error.message);
  }

  return result;
}

/**
 * 创建文生图任务
 *
 * @param prompt - 用户输入的文本描述
 * @param referenceImages - 用户上传的参考图片 URL 列表（可选）
 * @returns API 响应结果
 *
 * @example
 * const result = await createTextToImageTask('一只可爱的猫咪');
 * if (result.success) {
 *   console.log('任务创建成功:', result.data.task.id);
 * }
 */
export async function createTextToImageTask(
  prompt: string,
  referenceImages?: string[]
): Promise<ApiResult<BackendGenerationTask>> {
  logger.info('[API] 创建文生图任务:', { prompt, referenceImages });

  // 构建请求体
  const requestBody: CreateTaskRequest = { prompt };
  if (referenceImages && referenceImages.length > 0) {
    requestBody.referenceImages = referenceImages;
  }

  // 调用 POST /api/tasks
  const result = await apiPost<BackendGenerationTask>(API_ENDPOINTS.tasks.create, requestBody);

  if (result.success) {
    logger.info('[API] 任务创建成功:', { taskId: result.data.id });
  } else {
    logger.error('[API] 任务创建失败:', result.error.message);
  }

  return result;
}

/**
 * 查询任务状态（支持 HTTP 304 优化）
 *
 * @param taskId - 任务 ID
 * @param since - 上次更新时间（ISO 8601 格式）
 * @returns API 响应结果
 *
 * @example
 * // 首次查询
 * const result = await fetchTaskStatus('task-123');
 *
 * // 后续轮询（携带 since 参数）
 * const result = await fetchTaskStatus('task-123', '2025-01-21T10:00:00Z');
 * if (!result.success && result.error.hasStatus(304)) {
 *   console.log('数据未更新');
 * }
 */
export async function fetchTaskStatus(
  taskId: string,
  since?: string
): Promise<ApiResult<BackendGenerationTask>> {
  // 构建 URL（如果有 since 参数，添加到查询字符串）
  const queryParams = since ? `?since=${encodeURIComponent(since)}` : '';
  const url = `${API_ENDPOINTS.tasks.status(taskId)}${queryParams}`;

  logger.debug('[API] 查询任务状态:', { taskId, since });

  // 调用 GET /api/tasks/{id}/status?since=...
  const result = await apiGet<BackendGenerationTask>(url);

  // 处理 HTTP 304 Not Modified
  if (!result.success && result.error.hasStatus(304)) {
    logger.debug('[API] 任务状态未更新 (HTTP 304)');
    return result;
  }

  if (result.success) {
    logger.debug('[API] 任务状态已更新:', {
      taskId,
      status: result.data.status,
      updatedAt: result.data.updatedAt,
    });
  } else {
    logger.error('[API] 查询任务状态失败:', result.error.message);
  }

  return result;
}

/**
 * 选择图片生成 3D 模型
 *
 * @param taskId - 任务 ID
 * @param imageIndex - 选择的图片索引（0-3）
 * @returns API 响应结果
 *
 * @example
 * const result = await selectImageForModel('task-123', 1);
 * if (result.success) {
 *   console.log('3D 模型生成已启动:', result.data.model.id);
 * }
 */
export async function selectImageForModel(
  taskId: string,
  imageIndex: number
): Promise<ApiResult<SelectImageResponse>> {
  logger.info('[API] 选择图片生成 3D 模型:', { taskId, imageIndex });

  // 调用 PATCH /api/tasks/{id}
  const result = await apiPatch<SelectImageResponse>(API_ENDPOINTS.tasks.selectImage(taskId), {
    selectedImageIndex: imageIndex,
  });

  if (result.success) {
    logger.info('[API] 3D 模型生成已启动:', { modelId: result.data.model.id });
  } else {
    logger.error('[API] 选择图片失败:', result.error.message);
  }

  return result;
}

/**
 * 删除任务
 *
 * @param taskId - 任务 ID
 * @returns API 响应结果
 *
 * @example
 * const result = await deleteTask('task-123');
 * if (result.success) {
 *   console.log('任务删除成功');
 * }
 */
export async function deleteTask(taskId: string): Promise<ApiResult<void>> {
  logger.info('[API] 删除任务:', taskId);

  // 调用 DELETE /api/tasks/{id}
  const result = await apiDelete<void>(API_ENDPOINTS.tasks.detail(taskId));

  if (result.success) {
    logger.info('[API] 任务删除成功:', taskId);
  } else {
    logger.error('[API] 删除任务失败:', result.error.message);
  }

  return result;
}
