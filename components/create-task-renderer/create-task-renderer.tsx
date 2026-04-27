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
 * 1. 如果有 referenceImages（参考图片）且 selectedImageIndex === null → 图生3D任务，直接显示模型生成中页面
 * 2. 如果 selectedImageIndex === null → 图片页面（文生图任务）
 * 3. 如果 selectedImageIndex !== null：
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

  // 详细的调试日志
  const hasReferenceImages = !!task.referenceImages && task.referenceImages.length > 0;
  const hasSelectedIndex = task.selectedImageIndex !== null && task.selectedImageIndex !== undefined;
  const hasImages = !!task.images && task.images.length > 0;
  const hasModel = !!task.modelUrl || task.modelId;

  logger.info('[CreateTaskRenderer] 任务状态详情:', {
    taskId: task.id,
    status: task.status,
    selectedImageIndex: task.selectedImageIndex,
    hasReferenceImages,
    referenceImagesCount: task.referenceImages?.length || 0,
    hasImages,
    imageCount: task.images?.length || 0,
    hasModel,
    modelProgress: task.modelProgress,
  });

  // 第一步：判断是图片页面还是模型页面
  // 图生3D任务或模型生成中任务的判断条件：
  // 1. 有 referenceImages（图生3D任务的直接标记）
  // 2. 状态是 generating_model（模型生成中）
  // 3. 状态是 model_ready（模型完成）
  // 4. 有 modelUrl 或 modelId（已有模型）
  const isModelRelated = task.status === 'generating_model' || task.status === 'model_ready' || hasModel;
  const isImageTo3DTask = hasReferenceImages || (isModelRelated && !hasSelectedIndex);
  const isImagePage = !isImageTo3DTask && !hasSelectedIndex && !isModelRelated;

  logger.info('[CreateTaskRenderer] 页面判断:', {
    isImageTo3DTask,
    isImagePage,
    判断依据: isImageTo3DTask ? '图生3D任务' : hasSelectedIndex ? '已选图片' : '文生图任务',
  });

  if (isImagePage) {
    // 图片页面（包含生成中和选择两种状态）
    logger.info('[CreateTaskRenderer] >>> 渲染图片页面（文生图任务）');
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
    logger.info('[CreateTaskRenderer] >>> 渲染模型完成页面');
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

  // 模型生成中页面（包括图生3D任务和文生图任务）
  logger.info('[CreateTaskRenderer] >>> 渲染模型生成中页面（图生3D或已选图片）');
  return <ModelGenerating task={task} paddingBottom={paddingBottom} isDark={isDark} />;
}
