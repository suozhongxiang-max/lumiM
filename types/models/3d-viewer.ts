/**
 * 3D 查看器相关类型定义
 */

import type * as THREE from 'three';

/**
 * 模型加载状态
 */
export type ModelLoadingState = 'idle' | 'loading' | 'loaded' | 'error';

/**
 * 模型加载进度
 */
export interface ModelLoadProgress {
  /** 已加载字节数 */
  loaded: number;
  /** 总字节数 */
  total: number;
  /** 百分比 (0-100) */
  percentage: number;
}

/**
 * 模型加载错误类型
 */
export type ModelErrorType =
  | 'network' // 网络错误
  | 'parse' // 解析错误
  | 'timeout' // 超时
  | 'size' // 文件过大
  | 'unknown'; // 未知错误

/**
 * 模型加载错误信息
 */
export interface ModelError {
  type: ModelErrorType;
  message: string;
  originalError?: Error;
}

/**
 * 模型预设颜色
 */
export type ModelPresetColor = 'default' | 'white' | 'gray' | 'black';

/**
 * 3D 查看器属性
 */
export interface ViewerProps {
  /** 模型 URL */
  modelUrl: string;
  /** MTL 材质文件 URL (可选) */
  mtlUrl?: string;
  /** 纹理图片 URL (可选) */
  textureUrl?: string;
  /** 模型颜色 (十六进制颜色值，例如: 0xcccccc；null 表示使用原始贴图) */
  modelColor?: number | null;
  /** 是否显示场景坐标网格 */
  showGrid?: boolean;
  /** 是否显示加载进度 */
  showProgress?: boolean;
  /** 是否显示加载占位图 */
  showPlaceholder?: boolean;
  /** 加载完成回调 */
  onLoad?: (object: THREE.Object3D) => void;
  /** 加载进度回调 */
  onProgress?: (progress: ModelLoadProgress) => void;
  /** 加载错误回调 */
  onError?: (error: ModelError) => void;
  /** 样式 */
  style?: any;
}

/**
 * 手势状态
 */
export interface GestureState {
  /** 是否正在旋转 */
  isRotating: boolean;
  /** 是否正在缩放 */
  isScaling: boolean;
  /** 当前旋转角度 */
  rotation: {
    x: number;
    y: number;
  };
  /** 当前缩放值 */
  scale: number;
}

/**
 * 相机控制器接口
 */
export interface CameraController {
  /** 旋转相机 */
  rotate: (deltaX: number, deltaY: number) => void;
  /** 缩放相机 */
  zoom: (delta: number) => void;
  /** 重置相机 */
  reset: () => void;
  /** 获取当前状态 */
  getState: () => GestureState;
}

/**
 * 3D 查看器实例方法
 */
export interface ViewerInstance {
  /** 加载模型 */
  loadModel: (url: string) => Promise<void>;
  /** 重新加载 */
  reload: () => Promise<void>;
  /** 获取相机控制器 */
  getCameraController: () => CameraController | null;
  /** 清理资源 */
  dispose: () => void;
}
