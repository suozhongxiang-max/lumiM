import type { GenerationTask } from '@/stores';

/**
 * CreateTaskRenderer 组件的 Props 接口
 */
export interface CreateTaskRendererProps {
  // 任务数据
  task: GenerationTask;

  // 回调函数 - 图片页面
  onSelectImage: (imageId: string) => void;
  onGenerateModel: () => void;
  onCancel?: () => void;

  // 回调函数 - 模型页面
  onView3D?: () => void;
  onCreateNew?: () => void;
  onPrint?: () => void;
  onResetPlace?: () => void;

  // 样式相关
  paddingBottom?: number;
  isDark?: boolean;
  isNotBack?: boolean; // 是否隐藏返回按钮（图片页面）
}
