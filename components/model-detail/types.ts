import type { GalleryModel } from '@/types';

export interface ModelDetailProps {
  model: GalleryModel;
  onPrint?: () => void;
  on3DPreview?: () => void;
  onTogglePrivate?: (isPrivate: boolean) => void;
  onDelete?: () => void;
}
