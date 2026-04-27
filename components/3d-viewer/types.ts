/**
 * 3D 查看器组件类型定义
 */

export * from '@/types/models/3d-viewer';

/**
 * 3D 查看器渲染模式
 */
export type ViewerMode = 'native' | 'webview' | 'auto';

/**
 * 扩展的查看器属性
 */
export interface ExtendedViewerProps {
  /** 模型 URL */
  modelUrl: string;
  /** MTL 材质文件 URL (可选) */
  mtlUrl?: string;
  /** 纹理图片 URL (可选) */
  textureUrl?: string;
  /** 模型颜色 (十六进制颜色值，例如: 0xcccccc；null 表示使用原始贴图) */
  modelColor?: number | null;
  /** 渲染模式 */
  mode?: ViewerMode;
  /** 是否显示加载进度 */
  showProgress?: boolean;
  /** 是否显示加载占位图 */
  showPlaceholder?: boolean;
  /** 加载完成回调 */
  onLoad?: (data: any) => void;
  /** 加载进度回调 */
  onProgress?: (progress: any) => void;
  /** 加载错误回调 */
  onError?: (error: any) => void;
  /** 样式 */
  style?: any;
}
