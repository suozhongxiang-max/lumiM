/**
 * 统一的 API 客户端
 * 参考 web 端实现，适配移动端特性
 *
 * 核心功能：
 * - 自动拦截 401 并跳转登录
 * - 自动添加 Bearer Token
 * - 支持 JSend 响应格式
 * - 统一错误处理
 * - 自动 URL 转换
 */

import { API_CONFIG } from '@/config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { logger } from '@/utils/logger';

// Token 存储键
const TOKEN_KEY = 'auth_token';

/**
 * URL 字段名称列表（需要自动转换的字段）
 */
const URL_FIELDS = [
  'url',
  'imageUrl',
  'modelUrl',
  'mtlUrl',
  'textureUrl',
  'previewImageUrl',
] as const;

/**
 * 递归转换对象中的所有 URL 字段（相对路径 → 完整 URL）
 */
function transformUrls<T>(data: T): T {
  if (data === null || data === undefined) {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(item => transformUrls(item)) as T;
  }

  if (typeof data === 'object') {
    const result: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(data)) {
      if (
        (URL_FIELDS as readonly string[]).includes(key) &&
        typeof value === 'string' &&
        value.startsWith('/')
      ) {
        result[key] = `${API_CONFIG.baseURL}${value}`;
      } else if (typeof value === 'object') {
        result[key] = transformUrls(value);
      } else {
        result[key] = value;
      }
    }

    return result as T;
  }

  return data;
}

/**
 * API 错误类
 */
export class ApiError extends Error {
  public readonly status: number;
  public readonly code?: string;
  public readonly data?: any;

  constructor(status: number, message: string, code?: string, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.data = data;
  }

  isClientError(): boolean {
    return this.status >= 400 && this.status < 500;
  }

  isServerError(): boolean {
    return this.status >= 500;
  }

  hasStatus(status: number): boolean {
    return this.status === status;
  }

  hasCode(code: string): boolean {
    return this.code === code;
  }
}

/**
 * 未授权回调
 */
type UnauthorizedHandler = () => void | Promise<void>;
let unauthorizedHandler: UnauthorizedHandler | null = null;
let isHandlingUnauthorized = false;

async function handleUnauthorizedNavigation() {
  if (isHandlingUnauthorized) {
    return;
  }
  isHandlingUnauthorized = true;

  try {
    if (unauthorizedHandler) {
      await unauthorizedHandler();
    } else {
      router.replace('/login');
    }
  } catch (navigationError) {
    logger.warn('跳转登录页面失败:', navigationError);
  } finally {
    isHandlingUnauthorized = false;
  }
}

export const setUnauthorizedHandler = (handler: UnauthorizedHandler | null) => {
  unauthorizedHandler = handler;
};

/**
 * Token 管理工具
 */
export const tokenManager = {
  getToken: async (): Promise<string | null> => {
    try {
      return await AsyncStorage.getItem(TOKEN_KEY);
    } catch (error) {
      logger.error('获取 Token 失败:', error);
      return null;
    }
  },

  setToken: async (token: string): Promise<void> => {
    try {
      await AsyncStorage.setItem(TOKEN_KEY, token);
    } catch (error) {
      logger.error('保存 Token 失败:', error);
    }
  },

  clearToken: async (): Promise<void> => {
    try {
      await AsyncStorage.removeItem(TOKEN_KEY);
    } catch (error) {
      logger.error('清除 Token 失败:', error);
    }
  },
};

function isJSendSuccess(value: any): value is { status: 'success'; data: unknown } {
  return value && typeof value === 'object' && value.status === 'success' && 'data' in value;
}

async function parseResponseBody(response: Response): Promise<any> {
  if (response.status === 204 || response.status === 205) {
    return null;
  }

  const rawText = await response.text();
  if (!rawText.trim()) {
    return null;
  }

  const contentType = response.headers.get('content-type') ?? '';
  if (!contentType.includes('application/json')) {
    return rawText;
  }

  try {
    return JSON.parse(rawText);
  } catch (error) {
    throw new ApiError(0, '响应解析失败: 非法 JSON', undefined, { body: rawText });
  }
}

/**
 * API 客户端选项
 */
export interface ApiClientOptions extends RequestInit {
  /** 是否禁用自动重试（默认 false） */
  disableRetry?: boolean;
  /** 是否禁用自动错误处理（默认 false） */
  disableErrorHandling?: boolean;
}

/**
 * 核心 API 客户端（内部函数）
 */
async function apiClient(url: string, options: ApiClientOptions = {}): Promise<Response> {
  const {
    disableRetry = false,
    disableErrorHandling = false,
    headers = {},
    method,
    body,
    ...fetchOptions
  } = options;

  // 构建完整的 API URL
  const fullUrl = url.startsWith('http') ? url : `${API_CONFIG.baseURL}${url}`;

  // 准备请求头
  const finalHeaders: Record<string, string> = {
    ...(headers as Record<string, string>),
  };

  // 只有在有 body 的情况下才添加 Content-Type
  // DELETE 和 GET 请求通常没有 body，不需要 Content-Type
  if (method !== 'GET' && method !== 'DELETE' && body !== undefined) {
    finalHeaders['Content-Type'] = 'application/json';
  }

  // 自动添加 Token（后端返回的 token 已包含 "Bearer " 前缀，直接使用）
  const token = await tokenManager.getToken();
  if (token) {
    finalHeaders['Authorization'] = token;
  }

  // 发送请求
  const response = await fetch(fullUrl, {
    ...fetchOptions,
    method,
    body,
    headers: finalHeaders,
  });

  // 特殊处理：401 Unauthorized
  if (response.status === 401 && !disableRetry) {
    try {
      const data = await response.json();

      const isAuthError =
        (data.status === 'fail' &&
          (data.data?.code === 'UNAUTHORIZED' || data.data?.code === 'UNAUTHENTICATED')) ||
        data.code === 401;

      if (isAuthError) {
        // 清除无效 Token
        await tokenManager.clearToken();

        // 通知未授权处理器
        await handleUnauthorizedNavigation();

        // 返回一个特殊的错误，由调用方处理
        throw new ApiError(401, '未登录，请先登录', 'UNAUTHORIZED');
      }
    } catch (_error) {
      // JSON 解析失败，继续处理
    }
  }

  // 自动错误处理：4xx/5xx 状态码自动抛出 ApiError
  if (!disableErrorHandling && !response.ok) {
    let errorMessage = `请求失败 (HTTP ${response.status})`;
    let errorCode: string | undefined;
    let errorData: any;

    try {
      const data = await response.json();
      errorData = data;

      // 从 JSend 响应中提取错误信息
      if (data.status === 'fail' && data.data) {
        errorMessage = data.data.message || errorMessage;
        errorCode = data.data.code;
      } else if (data.status === 'error') {
        errorMessage = data.message || errorMessage;
        errorCode = data.code;
      } else if (data.message) {
        errorMessage = data.message;
        errorCode = data.code;
      }
    } catch (_error) {
      errorMessage = `${errorMessage}: ${response.statusText}`;
    }

    throw new ApiError(response.status, errorMessage, errorCode, errorData);
  }

  return response;
}

/**
 * API 请求结果（成功）
 */
export interface ApiSuccess<T = any> {
  success: true;
  data: T;
}

/**
 * API 请求结果（失败）
 */
export interface ApiFailure {
  success: false;
  error: ApiError;
}

/**
 * API 请求结果（联合类型）
 */
export type ApiResult<T = any> = ApiSuccess<T> | ApiFailure;

/**
 * 高级 API 请求方法
 *
 * 返回 { success, data, error } 结构，无需 try-catch
 * 自动解析 JSON 响应
 * 自动提取 JSend 格式中的 data 字段
 */
export async function apiRequest<T = any>(
  url: string,
  options: ApiClientOptions = {}
): Promise<ApiResult<T>> {
  try {
    const response = await apiClient(url, options);

    const parsedBody = await parseResponseBody(response);
    const resultData = isJSendSuccess(parsedBody) ? parsedBody.data : parsedBody;
    const transformed = transformUrls(resultData as T);

    return {
      success: true,
      data: transformed,
    };
  } catch (error) {
    if (error instanceof ApiError) {
      return {
        success: false,
        error,
      };
    }

    const networkError = new ApiError(
      0,
      error instanceof Error ? error.message : '网络错误，请检查网络连接'
    );

    return {
      success: false,
      error: networkError,
    };
  }
}

/**
 * GET 请求
 */
export async function apiGet<T = any>(
  url: string,
  options: Omit<ApiClientOptions, 'method' | 'body'> = {}
): Promise<ApiResult<T>> {
  return apiRequest<T>(url, {
    ...options,
    method: 'GET',
  });
}

/**
 * POST 请求
 */
export async function apiPost<T = any>(
  url: string,
  body: unknown,
  options: Omit<ApiClientOptions, 'method' | 'body'> = {}
): Promise<ApiResult<T>> {
  return apiRequest<T>(url, {
    ...options,
    method: 'POST',
    body: JSON.stringify(body),
  });
}

/**
 * PUT 请求
 */
export async function apiPut<T = any>(
  url: string,
  body: unknown,
  options: Omit<ApiClientOptions, 'method' | 'body'> = {}
): Promise<ApiResult<T>> {
  return apiRequest<T>(url, {
    ...options,
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

/**
 * PATCH 请求
 */
export async function apiPatch<T = any>(
  url: string,
  body: unknown,
  options: Omit<ApiClientOptions, 'method' | 'body'> = {}
): Promise<ApiResult<T>> {
  return apiRequest<T>(url, {
    ...options,
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

/**
 * DELETE 请求
 */
export async function apiDelete<T = any>(
  url: string,
  options: Omit<ApiClientOptions, 'method' | 'body'> = {}
): Promise<ApiResult<T>> {
  return apiRequest<T>(url, {
    ...options,
    method: 'DELETE',
  });
}
