import type { ModelVisibility } from '@/types';

export interface ModelCardProps {
  modelId: string;
  title: string;
  creator?: string; // 可选,API 可能不返回
  imageUrl: string | null; // 图片URL可能为null
  likes: number;
  favorites: number; // 新增：收藏数
  visibility?: ModelVisibility; // 新增：模型可见性
  onPress?: (modelId: string) => void;
  onToggleVisibility?: (modelId: string, isPrivate: boolean) => void; // 新增：切换可见性回调
  onDelete?: (modelId: string) => void; // 新增：删除回调
  showManageActions?: boolean; // 新增：是否显示管理操作（切换和删除）
}

export interface CardContentProps {
  title: string;
  creator?: string; // 可选,API 可能不返回
  likes: number;
}

export interface CardActionsProps {
  likes: number;
  favorites: number; // 新增：收藏数
  isLiked?: boolean; // 新增：是否已点赞
  isFavorited?: boolean; // 新增：是否已收藏
  isLoading?: boolean; // 新增：是否正在操作中
  onLike?: () => void; // 新增：点赞回调
  onFavorite?: () => void; // 新增：收藏回调
}
