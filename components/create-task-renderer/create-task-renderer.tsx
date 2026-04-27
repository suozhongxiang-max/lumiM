import { ImageGenerating } from '@/components/pages/create/image-generating';
import { ModelComplete } from '@/components/pages/create/model-complete';
import { ModelGenerating } from '@/components/pages/create/model-generating';
import { logger } from '@/utils/logger';
import type { CreateTaskRendererProps } from './types';

/**
 * 任务渲染容器组件
 * 根据任务数据判断应该显示哪个页面（图片页面 / 模型生成中 / 模型完成）
 *
 * 判断逻辑（数据驱动）：
 * 1. 如果 selectedImageIndex === null → 图片页面
 * 2. 如果 selectedImageIndex !== null：
 *    - 如果 status === 'model_ready' → 模型完成页面
 *    - 否则 → 模型生成中页面
 */
export function CreateTaskRenderer({
  task,
  onSelectImage,
  onGenerateModel,
  onCancel,
  onView3D,
  onCreateNew,
  onPrint,
  onResetPlace,
  paddingBottom,
  isDark,
  isNotBack,
}: CreateTaskRendererProps) {
  if (!task) {
    logger.warn('[CreateTaskRenderer] 没有任务数据，无法渲染');
    return null;
  }
  logger.debug('[CreateTaskRenderer] 渲染任务:', {
    taskId: task.id,
    status: task.status,
    selectedImageIndex: task.selectedImageIndex,
    hasImages: !!task.images,
    imageCount: task.images?.length || 0,
    hasModel: !!task.modelUrl,
  });

  // 第一步：判断是图片页面还是模型页面
  // 判断依据：selectedImageIndex 是否为 null
  const isImagePage = task.selectedImageIndex === null || task.selectedImageIndex === undefined;

  if (isImagePage) {
    // 图片页面（包含生成中和选择两种状态）
    logger.debug('[CreateTaskRenderer] 渲染图片页面');
    return (
      <ImageGenerating
        task={task}
        onSelectImage={onSelectImage}
        onGenerateModel={onGenerateModel}
        onCancel={onCancel}
        onResetPlace={onResetPlace}
        paddingBottom={paddingBottom}
        isDark={isDark}
        isNotBack={isNotBack}
      />
    );
  }

  // 模型页面 - 判断是生成中还是已完成
  // 判断依据：status 是否为 'model_ready'
  const isModelComplete = task.status === 'model_ready';

  if (isModelComplete) {
    // 模型完成页面
    logger.debug('[CreateTaskRenderer] 渲染模型完成页面');
    return (
      <ModelComplete
        task={task}
        onView3D={onView3D}
        onCreateNew={onCreateNew}
        onPrint={onPrint}
        paddingBottom={paddingBottom}
        isDark={isDark}
      />
    );
  }

  // 模型生成中页面
  logger.debug('[CreateTaskRenderer] 渲染模型生成中页面');
  return <ModelGenerating task={task} paddingBottom={paddingBottom} isDark={isDark} />;
}
