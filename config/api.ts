/**
 * API 配置
 * 集中管理所有 API 相关配置
 */

import { ENV } from './env';

// API 基础配置
export const API_CONFIG = {
  baseURL: ENV.API_URL,
  timeout: 30000, // 30秒超时
  retryAttempts: 3, // 重试次数
  retryDelay: 1000, // 重试延迟(毫秒)
} as const;

// API 端点
export const API_ENDPOINTS = {
  gallery: {
    models: '/api/gallery/models',
    modelDetail: (id: string) => `/api/gallery/models/${id}`,
    modelDownload: (id: string) => `/api/gallery/models/${id}/download`,
    // 交互相关端点
    interactions: (id: string) => `/api/gallery/models/${id}/interactions`,
    batchInteractions: '/api/gallery/models/batch-interactions',
    // 模型管理端点
    modelVisibility: (id: string) => `/api/models/${id}/visibility`,
    modelDelete: (id: string) => `/api/models/${id}`,
  },
  proxy: {
    image: '/api/proxy/image',
    model: '/api/proxy/model',
  },
  user: {
    profile: '/api/user/profile',
    login: '/api/auth/login',
    logout: '/api/auth/logout',
    // 用户模型列表
    myModels: '/api/users/my-models',
    // 用户收藏列表
    myFavorites: '/api/users/favorites',
    // 用户喜欢列表
    myLikes: '/api/users/likes',
  },
  // AI 创作任务相关端点
  tasks: {
    // 获取任务列表
    list: '/api/tasks',
    // 创建文生图任务
    create: '/api/tasks',
    // 创建图生3D任务（直接从图片生成3D模型）
    imageTo3D: '/api/tasks/image-to-3d',
    // 查询任务详情
    detail: (id: string) => `/api/tasks/${id}`,
    // 查询任务状态（支持 since 参数实现 HTTP 304 优化）
    status: (id: string) => `/api/tasks/${id}/status`,
    // SSE 任务事件流
    events: (id: string) => `/api/tasks/${id}/events`,
    // 选择图片生成 3D 模型
    selectImage: (id: string) => `/api/tasks/${id}`,
  },
  // 打印机相关端点
  printer: {
    // 查询产品列表
    products: '/api/devices/products',
    // 获取打印机列表（新版本 RESTful 风格）
    list: '/api/printers',
    // 获取打印机详情（新版本 RESTful 风格，使用路径参数）
    detail: (deviceId: string) => `/api/printers/${deviceId}`,
    // 绑定打印机（新版本 RESTful 风格）
    bind: '/api/printers',
    // 解绑打印机（新版本 RESTful 风格，使用 DELETE 方法和路径参数）
    unbind: (deviceId: string) => `/api/printers/${deviceId}`,
    // 创建打印任务（新版本 RESTful 风格，使用路径参数）
    createTask: (deviceId: string) => `/api/printers/${deviceId}/jobs`,
  },
} as const;

// 默认请求头
export const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
} as const;
