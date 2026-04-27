/**
 * 交互相关 API 类型定义
 * 包括点赞、收藏等用户与模型的交互行为
 */

/**
 * 交互类型枚举
 * LIKE - 点赞
 * FAVORITE - 收藏
 */
export type InteractionType = 'LIKE' | 'FAVORITE';

/**
 * 单个模型的交互状态
 * 用于表示用户对某个模型的点赞和收藏状态
 */
export interface ModelInteractionStatus {
  /** 是否已点赞 */
  isLiked: boolean;
  /** 是否已收藏 */
  isFavorited: boolean;
}

/**
 * GET /api/gallery/models/{id}/interactions 响应
 * 获取用户对指定模型的交互状态
 */
export interface InteractionStatusResponse {
  /** 用户是否已登录 */
  isAuthenticated: boolean;
  /** 交互类型数组 (['LIKE'] | ['FAVORITE'] | ['LIKE', 'FAVORITE'] | []) */
  interactions: InteractionType[];
  /** 是否已点赞（仅登录时返回） */
  isLiked?: boolean;
  /** 是否已收藏（仅登录时返回） */
  isFavorited?: boolean;
}

/**
 * POST /api/gallery/models/{id}/interactions 请求体
 * 创建或切换交互状态（Toggle 模式）
 */
export interface InteractionToggleRequest {
  /** 交互类型 */
  type: InteractionType;
}

/**
 * POST /api/gallery/models/{id}/interactions 响应
 * 返回切换后的状态和最新的计数器
 */
export interface InteractionToggleResponse {
  /** 当前交互状态（true=已点赞/收藏，false=已取消） */
  isInteracted: boolean;
  /** 交互类型 */
  type: InteractionType;
  /** 最新点赞总数 */
  likeCount: number;
  /** 最新收藏总数 */
  favoriteCount: number;
}

/**
 * POST /api/gallery/models/batch-interactions 请求体
 * 批量获取多个模型的交互状态
 */
export interface BatchInteractionsRequest {
  /** 模型 ID 列表（1-100 个） */
  modelIds: string[];
}

/**
 * POST /api/gallery/models/batch-interactions 响应
 * 返回批量交互状态映射
 */
export interface BatchInteractionsResponse {
  /** 用户是否已登录 */
  isAuthenticated: boolean;
  /** 交互状态映射 { [modelId]: { isLiked, isFavorited } } */
  interactions: Record<string, ModelInteractionStatus>;
}
