/**
 * 认证相关 API 类型定义
 */

/**
 * 验证码类型
 */
export type VerificationCodeType = 'login' | 'register' | 'modify_password';

/**
 * 发送验证码请求参数
 */
export interface SendVerificationCodeRequest {
  email: string;
  type: VerificationCodeType;
}

/**
 * 注册请求参数
 */
export interface RegisterRequest {
  email: string;
  code: string;
}

/**
 * 登录请求参数
 */
export interface LoginRequest {
  email: string;
  code: string;
}

/**
 * 登录响应数据
 */
export interface LoginResponseData {
  token: string;
}

/**
 * 获取用户信息响应数据
 */
export interface GetUserProfileResponseData {
  status: 'authenticated' | 'unauthenticated';
  /** 用户信息（仅在 authenticated 状态下存在） */
  user: import('@/stores/auth/types').UserProfile | null;
}

/**
 * JSend 成功响应格式
 */
export interface JSendSuccess<T = any> {
  status: 'success';
  data: T;
}

/**
 * JSend 失败响应格式
 */
export interface JSendFail {
  status: 'fail';
  data: {
    message: string;
    code?: string;
  };
}

/**
 * JSend 错误响应格式
 */
export interface JSendError {
  status: 'error';
  message: string;
}

/**
 * JSend 响应联合类型
 */
export type JSendResponse<T = any> = JSendSuccess<T> | JSendFail | JSendError;
