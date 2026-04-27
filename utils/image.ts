/**
 * 图片处理工具函数
 */

import * as FileSystem from 'expo-file-system/legacy';
import * as ImageManipulator from 'expo-image-manipulator';
import { logger } from '@/utils/logger';

/**
 * 压缩图片
 *
 * @param uri - 原始图片 URI
 * @param maxWidth - 最大宽度（默认800）
 * @param maxHeight - 最大高度（默认800）
 * @param quality - 压缩质量 0-1（默认0.7）
 * @returns 压缩后的图片 URI
 */
async function compressImage(
  uri: string,
  maxWidth: number = 800,
  maxHeight: number = 800,
  quality: number = 0.7
): Promise<string> {
  try {
    logger.info('[Image] 开始压缩图片:', { uri, maxWidth, maxHeight, quality });

    // 获取原始图片信息
    const originalInfo = await ImageManipulator.getManipulatedInfoAsync(uri);
    logger.info('[Image] 原始图片信息:', {
      width: originalInfo.width,
      height: originalInfo.height,
      size: originalInfo.size,
    });

    // 计算缩放比例（保持宽高比）
    const scale = Math.min(
      maxWidth / originalInfo.width,
      maxHeight / originalInfo.height,
      1
    );

    // 如果图片不需要压缩，直接返回
    if (scale >= 1 && quality >= 1) {
      logger.info('[Image] 图片无需压缩');
      return uri;
    }

    // 计算新的尺寸
    const newWidth = Math.round(originalInfo.width * scale);
    const newHeight = Math.round(originalInfo.height * scale);

    logger.info('[Image] 压缩后尺寸:', { newWidth, newHeight, scale });

    // 执行压缩
    const result = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: newWidth, height: newHeight } }],
      {
        compress: quality,
        format: ImageManipulator.SaveFormat.JPEG,
      }
    );

    // 获取压缩后的信息
    const compressedInfo = await ImageManipulator.getManipulatedInfoAsync(result.uri);
    logger.info('[Image] 压缩完成:', {
      originalSize: originalInfo.size,
      compressedSize: compressedInfo.size,
      compressionRatio: ((1 - compressedInfo.size / originalInfo.size) * 100).toFixed(2) + '%',
    });

    return result.uri;
  } catch (error) {
    logger.error('[Image] 图片压缩失败:', error);
    // 压缩失败时返回原始 URI
    return uri;
  }
}

/**
 * 检查并递归压缩图片直到满足大小要求
 *
 * @param uri - 图片 URI
 * @param maxSizeKB - 最大大小（KB），默认 200KB
 * @returns 压缩后的图片 URI
 */
async function compressImageToSize(uri: string, maxSizeKB: number = 200): Promise<string> {
  let currentUri = uri;
  let attempt = 0;
  const maxAttempts = 4;

  // 压缩配置：从最激进开始
  const compressionConfigs = [
    { maxWidth: 420, maxHeight: 420, quality: 0.5 }, // 最小尺寸，最低质量
    { maxWidth: 512, maxHeight: 512, quality: 0.6 }, // 稍大尺寸
    { maxWidth: 640, maxHeight: 640, quality: 0.7 }, // 中等尺寸
    { maxWidth: 800, maxHeight: 800, quality: 0.8 }, // 较大尺寸
  ];

  for (attempt = 0; attempt < maxAttempts; attempt++) {
    const config = compressionConfigs[attempt];
    logger.info(`[Image] 第 ${attempt + 1} 次压缩尝试:`, config);

    // 执行压缩
    currentUri = await compressImage(
      currentUri,
      config.maxWidth,
      config.maxHeight,
      config.quality
    );

    // 获取压缩后的大小
    const fileInfo = await FileSystem.getInfoAsync(currentUri, { size: true });
    const sizeInBytes = fileInfo.size || 0;
    const sizeInKB = sizeInBytes / 1024;

    logger.info(`[Image] 第 ${attempt + 1} 次压缩后大小:`, {
      sizeInKB: sizeInKB.toFixed(2),
      maxSizeKB,
      withinLimit: sizeInKB <= maxSizeKB,
    });

    // 如果大小满足要求，停止压缩
    if (sizeInKB <= maxSizeKB) {
      logger.info('[Image] 压缩后大小符合要求，停止压缩');
      break;
    }

    // 如果是最后一次尝试，使用超激进的压缩
    if (attempt === maxAttempts - 1) {
      logger.warn('[Image] 达到最大压缩次数，使用超激进压缩');
      currentUri = await compressImage(currentUri, 320, 320, 0.4);
    }
  }

  return currentUri;
}

/**
 * 将本地文件 URI 转换为 Base64 格式
 *
 * @param uri - 本地文件 URI
 * @param shouldCompress - 是否压缩图片（默认 true）
 * @param maxSizeKB - 最大大小限制（KB），默认 150KB（base64编码后会增加到约200KB）
 * @returns Base64 编码的图片数据（带 data:image 前缀）
 *
 * @example
 * const base64 = await imageToBase64('file:///path/to/image.jpg');
 * // 返回: 'data:image/jpeg;base64,/9j/4AAQSkZJRg...'
 */
export async function imageToBase64(
  uri: string,
  shouldCompress: boolean = true,
  maxSizeKB: number = 150
): Promise<string> {
  try {
    logger.info('[Image] 开始转换图片为 Base64:', { uri, shouldCompress, maxSizeKB });

    // 确保 URI 是可访问的文件路径
    // DocumentPicker 可能返回 content:// URI，需要转换为 file:// URI
    let fileUri = uri;
    if (uri.startsWith('content://')) {
      // 对于 content URI，使用 FileSystem 获取可读路径
      const fileInfo = await FileSystem.getInfoAsync(uri);
      if (!fileInfo.exists) {
        throw new Error('文件不存在或无法访问');
      }
      fileUri = uri; // FileSystem.readAsStringAsync 应该能直接处理 content URI
    }

    // 如果需要压缩，先压缩图片到指定大小
    if (shouldCompress) {
      fileUri = await compressImageToSize(fileUri, maxSizeKB);
    }

    // 使用字符串 'base64' 读取文件内容
    // 从 expo-file-system/legacy 导入的 API
    const base64 = await FileSystem.readAsStringAsync(fileUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // 获取文件 MIME 类型
    const mimeType = getMimeType(fileUri);

    // 拼接完整的 data URI 格式
    const dataUri = `data:${mimeType};base64,${base64}`;

    // 计算 Base64 后的实际大小
    const base64SizeInKB = (dataUri.length / 1024).toFixed(2);

    logger.info('[Image] Base64 转换完成:', {
      uri: fileUri,
      mimeType,
      base64Length: base64.length,
      dataUriLength: dataUri.length,
      base64SizeInKB,
      targetSizeKB: maxSizeKB,
    });

    return dataUri;
  } catch (error) {
    logger.error('[Image] Base64 转换失败:', error);

    // 提供更详细的错误信息
    let errorMessage = '图片转换失败，请重试';
    if (error instanceof Error) {
      if (error.message.includes('Unsupported scheme')) {
        errorMessage = '不支持的文件格式，请选择其他图片';
      } else if (error.message.includes('Unable to read file')) {
        errorMessage = '无法读取图片文件，请重新选择';
      } else if (error.message.includes('too large')) {
        errorMessage = '图片太大，请选择更小的图片';
      }
    }

    throw new Error(errorMessage);
  }
}

/**
 * 根据文件 URI 获取 MIME 类型
 *
 * @param uri - 文件 URI
 * @returns MIME 类型字符串
 */
function getMimeType(uri: string): string {
  // 获取文件扩展名
  const extension = uri.split('.').pop()?.toLowerCase() || '';

  // 映射常见图片格式到 MIME 类型
  const mimeTypes: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    bmp: 'image/bmp',
  };

  return mimeTypes[extension] || 'image/jpeg';
}

/**
 * 判断字符串是否为 Base64 格式的图片
 *
 * @param str - 待检查的字符串
 * @returns true 如果是 Base64 图片格式
 */
export function isBase64Image(str: string): boolean {
  return str.startsWith('data:image/') && str.includes('base64,');
}

/**
 * 从 Base64 Data URI 中提取纯 Base64 字符串
 *
 * @param dataUri - Base64 Data URI（例如 'data:image/jpeg;base64,/9j/4AAQ...'）
 * @returns 纯 Base64 字符串
 */
export function extractBase64(dataUri: string): string {
  const matches = dataUri.match(/^data:image\/\w+;base64,(.+)$/);
  return matches ? matches[1] : dataUri;
}
