/**
 * 认证相关 API 服务
 * 使用统一的 API 客户端
 */

import { apiPost, apiGet, type ApiResult } from '../api-client';
import type {
  LoginRequest,
  LoginResponseData,
  RegisterRequest,
  SendVerificationCodeRequest,
  GetUserProfileResponseData,
} from '@/types/api/auth';
import type { UserProfile } from '@/stores/auth/types';
import { logger } from '@/utils/logger';

/**
 * 发送验证码
 */
export async function sendVerificationCode(
  params: SendVerificationCodeRequest
): Promise<ApiResult<null>> {
  logger.info('发送验证码:', params.email, params.type);

  const result = await apiPost<null>('/api/auth/send-code', params);

  if (result.success) {
    logger.info('验证码发送成功');
  } else {
    logger.error('验证码发送失败:', result.error.message);
  }

  return result;
}

/**
 * 用户注册
 */
export async function register(params: RegisterRequest): Promise<ApiResult<null>> {
  logger.info('用户注册:', params.email);

  const result = await apiPost<null>('/api/auth/register', params);

  if (result.success) {
    logger.info('注册成功');
  } else {
    logger.error('注册失败:', result.error.message);
  }

  return result;
}

/**
 * 用户登录
 */
export async function login(params: LoginRequest): Promise<ApiResult<LoginResponseData>> {
  logger.info('用户登录:', params.email);

  const result = await apiPost<LoginResponseData>('/api/auth/login', params);

  if (result.success) {
    logger.info('登录成功，token:', result.data.token?.substring(0, 20) + '...');
  } else {
    logger.error('登录失败:', result.error.message);
  }

  return result;
}

/**
 * 用户登出
 */
export async function logout(): Promise<ApiResult<null>> {
  logger.info('用户登出');

  const result = await apiPost<null>('/api/auth/logout', {});

  if (result.success) {
    logger.info('登出成功');
  } else {
    logger.error('登出失败:', result.error.message);
  }

  return result;
}

/**
 * 获取用户信息（需要 Token）
 */
export async function getUserProfile(): Promise<ApiResult<UserProfile>> {
  logger.info('获取用户信息');

  const result = await apiGet<GetUserProfileResponseData>('/api/auth/me');

  if (result.success) {
    // 打印完整的响应数据，用于调试
    logger.info('API 原始响应 data:', JSON.stringify(result.data, null, 2));

    // 检查认证状态
    if (result.data.status === 'authenticated' && result.data.user) {
      logger.info('用户已认证，提取用户数据');
      return {
        success: true,
        data: result.data.user,
      };
    } else if (result.data.status === 'unauthenticated') {
      // Token 无效或已过期
      logger.warn('Token 无效或已过期，用户未认证');
      return {
        success: false,
        error: {
          type: 'authentication',
          message: 'Token 无效或已过期',
          statusCode: 401,
        },
      };
    } else {
      // 其他错误情况
      logger.error('未知的认证状态:', result.data.status);
      return {
        success: false,
        error: {
          type: 'unknown',
          message: '未知的认证状态',
          statusCode: 500,
        },
      };
    }
  } else {
    logger.error('获取用户信息失败:', result.error.message);
    return result;
  }
}
