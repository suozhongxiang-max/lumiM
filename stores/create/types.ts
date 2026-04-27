import type { SseSubscription } from '@/services/sse';

// 任务状态类型（前端使用）
export type TaskStatus =
  | 'generating_images' // 正在生成图片
  | 'images_ready' // 图片已生成，等待选择
  | 'generating_model' // 正在生成3D模型
  | 'model_ready' // 3D模型已完成
  | 'failed' // 失败
  | 'cancelled'; // 已取消

// 图片状态类型（后端返回）
export type ImageStatus = 'PENDING' | 'GENERATING' | 'COMPLETED' | 'FAILED';

// 生成的图片接口（扩展后端字段）
export interface GeneratedImage {
  // 图片唯一标识符
  id: string;
  // 图片索引（0-3）
  index: number;
  // 图片状态（后端返回）
  imageStatus: ImageStatus;
  // 图片 URL
  imageUrl: string | null;
  // 实际使用的提示词（后端返回）
  imagePrompt: string | null;
  // 兼容旧字段
  url?: string;
  thumbnail?: string;
}

// 3D模型信息接口（与后端保持一致）
export interface ModelInfo {
  id: string;
  sourceImageId: string;
  name: string;
  modelUrl: string | null;
  previewImageUrl?: string | null; // 模型预览图 URL
  format: 'OBJ' | 'GLB';
  fileSize?: number | null;
  completedAt?: string | null;
  failedAt?: string | null;
  errorMessage?: string | null;
  // 模型生成任务信息（用于获取进度）
  generationJob?: {
    id: string;
    status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'TIMEOUT';
    progress: number; // 0-100
    startedAt?: string | null;
    completedAt?: string | null;
    failedAt?: string | null;
    errorMessage?: string | null;
  };
}

// 生成任务接口（扩展后端字段）
export interface GenerationTask {
  // 任务 ID
  id: string;
  // 用户输入的提示词
  prompt: string;
  // 用户上传的参考图片 URL 列表（可选，支持多张）
  referenceImages?: string[];
  // 任务状态（前端）
  status: TaskStatus;
  // 创建时间
  createdAt: Date;
  // 更新时间
  updatedAt: Date;

  // 图片生成阶段
  images?: GeneratedImage[];
  imageProgress?: number; // 0-100（前端计算）

  // 选择的图片
  selectedImageId?: string;
  selectedImageIndex?: number; // 选择的图片索引（0-3）

  // 3D模型信息（保留后端对象结构）
  model?: ModelInfo;
  modelProgress?: number; // 0-100（前端计算或后端返回）

  // 错误信息
  error?: string;
}

// Create Store 状态接口
export interface CreateState {
  // 当前活动任务的 ID（从 tasks 数组中派生 currentTask）
  currentTaskId: string | null;

  // 历史任务列表
  tasks: GenerationTask[];

  // SSE 订阅实例（每个任务独立管理）
  taskSubscriptions: Map<string, SseSubscription>;

  // 操作方法
  createTask: (prompt: string, referenceImages?: string[]) => Promise<string>; // 返回taskId，支持传入参考图片数组
  createImageTo3DTask: (prompt: string, imageData: string) => Promise<string>; // 创建图生3D任务，直接从图片生成3D模型
  selectImage: (taskId: string, imageId: string) => Promise<void>;
  generateModel: (taskId: string) => Promise<void>;
  cancelTask: (taskId: string) => void;
  deleteTask: (taskId: string) => void;
  getTask: (taskId: string) => GenerationTask | undefined;
  setStoreTask: (taskId: string, task: GenerationTask) => void; // 更新任务信息
  // 内部方法（不建议外部直接调用）
  _updateTaskProgress: (taskId: string, progress: Partial<GenerationTask>) => void;
  _startTaskSubscription: (taskId: string) => void; // 启动任务 SSE 订阅
  _stopTaskSubscription: (taskId: string) => void; // 停止指定任务 SSE 订阅
  _stopAllTaskSubscriptions: () => void; // 停止所有任务 SSE 订阅

  // 重置状态
  reset: () => void;
}
