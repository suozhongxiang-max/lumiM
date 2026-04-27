/**
 * 画廊模型数据类型
 */

// 模型状态
export type ModelStatus = 'PENDING' | 'GENERATING' | 'COMPLETED' | 'FAILED';

// 模型可见性
export type ModelVisibility = 'PRIVATE' | 'PUBLIC';

// 用户信息
export interface UserInfo {
  id: string;
  name: string | null;
}

// 画廊模型摘要(用于列表显示)
export interface ModelSummary {
  id: string;
  name: string;
  previewImageUrl: string | null;
  visibility: ModelVisibility;
  likeCount: number;
  favoriteCount: number;
  downloadCount: number;
  createdAt: string;
}

// 画廊模型完整信息(用于详情显示)
export interface GalleryModel {
  id: string;
  externalUserId: string;
  source: 'AI_GENERATED' | 'USER_UPLOADED';
  requestId: string | null;
  sourceImageId: string | null;
  name: string;
  description: string | null;
  modelUrl: string | null;
  mtlUrl: string | null;
  textureUrl: string | null;
  previewImageUrl: string | null;
  format: string;
  fileSize: number | null;
  visibility: ModelVisibility;
  publishedAt: string | null;
  viewCount: number;
  likeCount: number;
  favoriteCount: number;
  downloadCount: number;
  sliceTaskId: string | null;
  printStatus:
    | 'NOT_STARTED'
    | 'SLICING'
    | 'SLICE_COMPLETE'
    | 'PRINTING'
    | 'PRINT_COMPLETE'
    | 'FAILED'
    | null;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  failedAt: string | null;
  errorMessage: string | null;

  // 向后兼容字段(可选)
  user?: UserInfo;
  faceCount?: number | null;
  vertexCount?: number | null;
}
