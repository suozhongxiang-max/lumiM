/**
 * 图片代理服务
 * 用于解决跨域问题
 */

import { API_CONFIG, API_ENDPOINTS } from '@/config/api';

const API_BASE_URL = API_CONFIG.baseURL;

/**
 * 将原始图片 URL 转换为代理 URL
 * @param imageUrl 原始图片 URL
 * @returns 代理后的 URL,如果不需要代理则返回原 URL
 */
export function getProxiedImageUrl(imageUrl: string | null | undefined): string {
  if (!imageUrl) {
    return '';
  }

  // 如果已经是代理 URL,直接返回
  if (imageUrl.startsWith(API_BASE_URL)) {
    return imageUrl;
  }

  // 如果是相对路径或本地路径,直接返回
  if (!imageUrl.startsWith('http')) {
    return imageUrl;
  }

  // 使用代理服务
  const proxyUrl = `${API_BASE_URL}${API_ENDPOINTS.proxy.image}`;
  return `${proxyUrl}?url=${encodeURIComponent(imageUrl)}`;
}

/**
 * 检查 URL 是否需要代理
 */
export function needsProxy(url: string | null | undefined): boolean {
  if (!url) return false;

  // 腾讯云 COS、阿里云 OSS、SiliconFlow 需要代理
  const proxyDomains = ['.myqcloud.com', '.aliyuncs.com', '.siliconflow.cn'];

  return proxyDomains.some(domain => url.includes(domain));
}
