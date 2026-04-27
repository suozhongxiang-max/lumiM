/**
 * 3D 模型加载 Hook
 * 统一管理模型加载状态、进度和错误处理
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { Platform } from 'react-native';
import { Directory, File, Paths } from 'expo-file-system';
import type {
  ModelLoadingState,
  ModelLoadProgress,
  ModelError,
  ModelErrorType,
} from '@/types/models/3d-viewer';
import { ViewerConfig } from '@/config/3d-viewer';
import { logger } from '@/utils/logger';

interface UseModelLoaderOptions {
  /** 加载超时时间（毫秒） */
  timeout?: number;
  /** 加载成功回调 */
  onLoad?: (data: any) => void;
  /** 加载进度回调 */
  onProgress?: (progress: ModelLoadProgress) => void;
  /** 加载错误回调 */
  onError?: (error: ModelError) => void;
}

interface UseModelLoaderResult {
  /** 加载状态 */
  state: ModelLoadingState;
  /** 加载进度 */
  progress: ModelLoadProgress;
  /** 错误信息 */
  error: ModelError | null;
  /** 加载模型 */
  loadModel: (url: string) => Promise<void>;
  /** 加载 MTL 材质文件 */
  loadMtl: (url: string) => Promise<string | null>;
  /** 重试加载 */
  retry: () => Promise<void>;
  /** 取消加载 */
  cancel: () => void;
}

export const useModelLoader = (options: UseModelLoaderOptions = {}): UseModelLoaderResult => {
  const { timeout = ViewerConfig.loading.timeout, onLoad, onProgress, onError } = options;

  const [state, setState] = useState<ModelLoadingState>('idle');
  const [progress, setProgress] = useState<ModelLoadProgress>({
    loaded: 0,
    total: 0,
    percentage: 0,
  });
  const [error, setError] = useState<ModelError | null>(null);

  const currentUrlRef = useRef<string>('');
  const abortControllerRef = useRef<AbortController | null>(null);
  // 在 React Native 中，setTimeout 返回 number 类型
  const timeoutIdRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 清理函数
  const cleanup = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (timeoutIdRef.current) {
      clearTimeout(timeoutIdRef.current);
      timeoutIdRef.current = null;
    }
  }, []);

  // 组件卸载时清理
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  // 创建错误对象
  const createError = useCallback(
    (type: ModelErrorType, message: string, originalError?: Error): ModelError => {
      const modelError: ModelError = { type, message, originalError };
      logger.error(`Model load error [${type}]: ${message}`, 'useModelLoader');
      if (originalError) {
        logger.error(originalError.message, 'useModelLoader');
      }
      return modelError;
    },
    []
  );

  // 更新进度
  const updateProgress = useCallback(
    (loaded: number, total: number) => {
      const percentage = total > 0 ? (loaded / total) * 100 : 0;
      const progressData: ModelLoadProgress = { loaded, total, percentage };
      setProgress(progressData);
      onProgress?.(progressData);
    },
    [onProgress]
  );

  // 检查文件大小限制
  const checkFileSize = useCallback(
    (contentLength: number): boolean => {
      const maxSize =
        ViewerConfig.performance.maxModelSize[
          Platform.OS as keyof typeof ViewerConfig.performance.maxModelSize
        ] || ViewerConfig.performance.maxModelSize.default;

      if (contentLength > maxSize) {
        const errorObj = createError(
          'size',
          `文件过大 (${(contentLength / 1024 / 1024).toFixed(1)}MB)，超过限制 (${(maxSize / 1024 / 1024).toFixed(1)}MB)`
        );
        setError(errorObj);
        setState('error');
        onError?.(errorObj);
        return false;
      }
      return true;
    },
    [createError, onError]
  );

  // 加载模型
  const loadModel = useCallback(
    async (url: string) => {
      logger.info(`Starting to load model: ${url}`, 'useModelLoader');

      // 取消之前的加载
      cleanup();

      // 重置状态
      setState('loading');
      setError(null);
      setProgress({ loaded: 0, total: 0, percentage: 0 });
      currentUrlRef.current = url;

      // 创建新的 AbortController
      const controller = new AbortController();
      abortControllerRef.current = controller;

      // 设置超时
      timeoutIdRef.current = setTimeout(() => {
        controller.abort();
        const errorObj = createError('timeout', '加载超时，请稍后重试');
        setError(errorObj);
        setState('error');
        onError?.(errorObj);
      }, timeout);

      try {
        // 使用 expo-file-system 新 API 下载文件 (SDK 54)
        // 生成唯一的文件名
        const fileName = `model_${Date.now()}.obj`;
        const modelsDir = new Directory(Paths.cache, '3d-models');

        // 确保目录存在
        if (!modelsDir.exists) {
          modelsDir.create();
        }

        logger.info('Starting download with new File API', 'useModelLoader');

        // 创建 File 对象，然后下载
        const targetFile = new File(modelsDir, fileName);
        const downloadedFile = await File.downloadFileAsync(url, targetFile);

        logger.info(`File downloaded to: ${downloadedFile.uri}`, 'useModelLoader');

        // 检查文件是否存在
        if (!downloadedFile.exists) {
          throw new Error('文件下载失败');
        }

        // 获取文件大小
        const fileSize = downloadedFile.size || 0;
        if (fileSize > 0 && !checkFileSize(fileSize)) {
          // 删除文件
          downloadedFile.delete();
          return;
        }

        // 清除超时
        if (timeoutIdRef.current) {
          clearTimeout(timeoutIdRef.current);
          timeoutIdRef.current = null;
        }

        // 更新进度为 100%
        updateProgress(fileSize, fileSize);

        // 加载成功，返回本地文件 URI
        setState('loaded');
        logger.info('Model downloaded successfully', 'useModelLoader');
        onLoad?.(downloadedFile.uri);
      } catch (err: any) {
        // 取消请求不算错误
        if (err.name === 'AbortError') {
          logger.info('Model loading cancelled', 'useModelLoader');
          return;
        }

        // 判断错误类型
        let errorType: ModelErrorType = 'unknown';
        let errorMessage = '加载失败';

        if (err.message.includes('fetch') || err.message.includes('Network')) {
          errorType = 'network';
          errorMessage = '网络连接失败，请检查网络';
        } else if (err.message.includes('parse') || err.message.includes('format')) {
          errorType = 'parse';
          errorMessage = '模型格式错误';
        } else if (err.name === 'TimeoutError') {
          errorType = 'timeout';
          errorMessage = '加载超时';
        } else {
          errorMessage = err.message || errorMessage;
        }

        const errorObj = createError(errorType, errorMessage, err);
        setError(errorObj);
        setState('error');
        onError?.(errorObj);
      } finally {
        cleanup();
      }
    },
    [cleanup, createError, checkFileSize, updateProgress, onLoad, onError, timeout]
  );

  /**
   * 加载 MTL 材质文件
   * @param url MTL 文件的 URL
   * @returns 本地 MTL 文件的 URI，失败返回 null
   */
  const loadMtl = useCallback(async (url: string): Promise<string | null> => {
    try {
      logger.info(`Starting to load MTL: ${url}`, 'useModelLoader');

      // 使用 expo-file-system 下载文件
      const fileName = `material_${Date.now()}.mtl`;
      const materialsDir = new Directory(Paths.cache, '3d-materials');

      // 确保目录存在
      if (!materialsDir.exists) {
        materialsDir.create();
      }

      logger.info('Starting MTL download with File API', 'useModelLoader');

      // 创建 File 对象，然后下载
      const targetFile = new File(materialsDir, fileName);
      const downloadedFile = await File.downloadFileAsync(url, targetFile);

      logger.info(`MTL file downloaded to: ${downloadedFile.uri}`, 'useModelLoader');

      // 检查文件是否存在
      if (!downloadedFile.exists) {
        logger.error('MTL file download failed', 'useModelLoader');
        return null;
      }

      logger.info('MTL downloaded successfully', 'useModelLoader');
      return downloadedFile.uri;
    } catch (error: any) {
      logger.error(`Failed to load MTL: ${error.message}`, 'useModelLoader');
      return null;
    }
  }, []);

  // 重试加载
  const retry = useCallback(async () => {
    if (currentUrlRef.current) {
      logger.info('Retrying to load model', 'useModelLoader');
      await loadModel(currentUrlRef.current);
    }
  }, [loadModel]);

  // 取消加载
  const cancel = useCallback(() => {
    logger.info('Cancelling model loading', 'useModelLoader');
    cleanup();
    setState('idle');
    setError(null);
    setProgress({ loaded: 0, total: 0, percentage: 0 });
  }, [cleanup]);

  return {
    state,
    progress,
    error,
    loadModel,
    loadMtl,
    retry,
    cancel,
  };
};
