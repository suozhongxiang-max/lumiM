/**
 * URL 处理工具函数
 */

import { ENV } from '@/config/env';

/**
 * 将相对路径转换为完整URL
 * @param path 相对路径或完整URL
 * @returns 完整URL
 */
export function toAbsoluteUrl(path: string | null | undefined): string {
  if (!path) {
    return '';
  }

  // 如果已经是完整URL，直接返回
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  // 拼接baseURL
  const baseURL = ENV.API_URL;
  // 确保baseURL不以/结尾，path以/开头
  const cleanBase = baseURL.endsWith('/') ? baseURL.slice(0, -1) : baseURL;
  const cleanPath = path.startsWith('/') ? path : `/${path}`;

  return `${cleanBase}${cleanPath}`;
}

/**
 * 获取图片代理URL
 * @param imageUrl 图片URL（可能是相对路径）
 * @returns 完整的图片URL
 */
export function getImageUrl(imageUrl: string | null | undefined): string {
  return toAbsoluteUrl(imageUrl);
}

/**
 * 获取模型文件代理URL
 * @param modelUrl 模型文件URL（可能是相对路径）
 * @returns 完整的模型文件URL
 */
export function getModelUrl(modelUrl: string | null | undefined): string {
  return toAbsoluteUrl(modelUrl);
}
