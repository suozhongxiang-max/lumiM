/**
 * 环境配置管理
 * 统一管理所有环境变量
 */

export const ENV = {
  // API 配置
  API_URL: process.env.EXPO_PUBLIC_API_URL || 'http://lumi.ai3d.top:80',

  // 环境名称
  ENV_NAME: (process.env.EXPO_PUBLIC_ENV || 'development') as
    | 'development'
    | 'staging'
    | 'production',

  // 其他配置(可选)
  SENTRY_DSN: process.env.EXPO_PUBLIC_SENTRY_DSN,
  ANALYTICS_ID: process.env.EXPO_PUBLIC_ANALYTICS_ID,
} as const;

// 环境判断辅助函数
export const isDevelopment = ENV.ENV_NAME === 'development';
export const isStaging = ENV.ENV_NAME === 'staging';
export const isProduction = ENV.ENV_NAME === 'production';
