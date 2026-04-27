import { AuthGuard } from '@/components/auth';
import { CreateTaskRenderer } from '@/components/create-task-renderer';
import { LoadingStateView } from '@/components/loading-state-view';
import { ScreenWrapper } from '@/components/screen-wrapper';
import { ThemedText } from '@/components/themed-text';
import { FontSize, FontWeight } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useI18n } from '@/hooks/use-i18n';
import { useSafeAreaSpacing } from '@/hooks/use-safe-area-spacing';
import { fetchTaskStatus } from '@/services/api/tasks';
import type { GenerationTask } from '@/stores';
import { useCreateStore } from '@/stores';
import { logger } from '@/utils/logger';
import { createImmersiveHeaderOptions } from '@/utils/navigation';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';

/**
 * 历史任务详情页面
 * 加载任务数据并使用 CreateTaskRenderer 渲染对应的页面状态
 */
export default function CreateHistoryDetailScreen() {
  // ==================== Hooks ====================
  const { id: taskId } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme();
  const isDark = colorScheme.isDark;
  const { t } = useI18n();
  const { contentPaddingBottom } = useSafeAreaSpacing();

  // ==================== Store ====================
  // 从 Store 获取任务处理方法
  const selectImage = useCreateStore(state => state.selectImage);
  const generateModel = useCreateStore(state => state.generateModel);
  const setStoreTask = useCreateStore(state => state.setStoreTask);
  const startTaskSubscription = useCreateStore(state => state._startTaskSubscription);
  const stopTaskSubscription = useCreateStore(state => state._stopTaskSubscription);
  const currentTask = useCreateStore(state => state.tasks.find(t => t.id === taskId) ?? null);
  // ==================== State ====================
  // const [currentTask, setTask] = useState<GenerationTask | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  logger.debug('[CreateHistoryDetail-store] 当前任务:', currentTask);
  // ==================== 数据加载 ====================
  /**
   * 加载任务详情
   */
  useEffect(() => {
    const loadTaskDetail = async () => {
      if (!taskId) {
        logger.error('[CreateHistoryDetail] taskId 为空');
        setError('任务 ID 无效');
        setLoading(false);
        return;
      }

      try {
        logger.info('[CreateHistoryDetail] 加载任务详情:', taskId);
        setLoading(true);
        setError(null);

        // 调用 API 获取任务详情
        const result = await fetchTaskStatus(taskId);

        if (!result.success) {
          throw new Error(result.error.message);
        }

        logger.info('[CreateHistoryDetail] 任务详情加载成功:', {
          taskId,
          status: result.data.status,
          phase: result.data.phase,
          hasImages: !!result.data.images,
          imageCount: result.data.images?.length || 0,
          selectedImageIndex: result.data.selectedImageIndex,
          hasModel: !!result.data.model,
        });

        // 保留参考图片（图生3D任务需要）
        const referenceImages = (result.data as any).referenceImages;

        // 判断是否为图生3D任务的辅助条件
        // 1. 有 referenceImages（最直接）
        // 2. 没有 images 且 phase 是 MODEL_GENERATION（可能是图生3D）
        // 3. selectedImageIndex 为 null 且状态是 MODEL_PENDING/MODEL_GENERATING
        const hasReferenceImages = referenceImages && referenceImages.length > 0;
        const isModelPhase = result.data.phase === 'MODEL_GENERATION';
        const noImages = !result.data.images || result.data.images.length === 0;
        const isModelGenerating = result.data.status === 'MODEL_PENDING' || result.data.status === 'MODEL_GENERATING';
        const isSelectedIndexNull = result.data.selectedImageIndex === null;

        // 综合判断是否为图生3D任务
        const isImageTo3DTask = hasReferenceImages || (isModelPhase && noImages) || (isModelGenerating && isSelectedIndexNull && noImages);

        logger.info('[CreateHistoryDetail] 图生3D任务判断:', {
          hasReferenceImages,
          isModelPhase,
          noImages,
          isModelGenerating,
          isSelectedIndexNull,
          isImageTo3DTask,
        });

        // 如果判定为图生3D任务但没有 referenceImages，添加标记
        if (isImageTo3DTask && !referenceImages) {
          (result.data as any).isImageTo3DTask = true;
        }

        // 将后端数据转换为前端格式
        const frontendTask: GenerationTask = {
          id: result.data.id,
          prompt: result.data.originalPrompt,
          referenceImages,
          status: mapBackendStatus(result.data.status, isImageTo3DTask),
          createdAt: new Date(result.data.createdAt),
          updatedAt: new Date(result.data.updatedAt),
          images: result.data.images?.map(img => ({
            id: img.id,
            index: img.index,
            imageStatus: img.imageStatus,
            imageUrl: img.imageUrl,
            imagePrompt: img.imagePrompt,
            url: img.imageUrl || undefined,
            thumbnail: img.imageUrl || undefined,
          })),
          selectedImageIndex: result.data.selectedImageIndex ?? undefined,
          imageProgress: calculateImageProgress(result.data.images),
          // 模型数据（保留后端对象结构）
          model: result.data.model ? {
            id: result.data.model.id,
            sourceImageId: result.data.model.sourceImageId,
            name: result.data.model.name,
            modelUrl: result.data.model.modelUrl,
            previewImageUrl: result.data.model.previewImageUrl,
            format: result.data.model.format,
            fileSize: result.data.model.fileSize,
            completedAt: result.data.model.completedAt,
            failedAt: result.data.model.failedAt,
            errorMessage: result.data.model.errorMessage,
            generationJob: result.data.model.generationJob,
          } : undefined,
          modelProgress: calculateModelProgress(result.data),
          error: result.data.model?.errorMessage ?? undefined,
        };

        logger.info('[CreateHistoryDetail] 任务适配完成:', {
          taskId: frontendTask.id,
          backendStatus: result.data.status,
          frontendStatus: frontendTask.status,
          hasReferenceImages: !!frontendTask.referenceImages,
          referenceImagesCount: frontendTask.referenceImages?.length || 0,
          selectedImageIndex: frontendTask.selectedImageIndex,
          hasModel: !!frontendTask.model,
          modelPreviewImageUrl: frontendTask.model?.previewImageUrl,
        });
        setStoreTask(taskId, frontendTask);
        // setTask(frontendTask);
      } catch (err) {
        logger.error('[CreateHistoryDetail] 加载任务详情失败:', err);
        setError(err instanceof Error ? err.message : t('createHistory.error'));
      } finally {
        setLoading(false);
      }
    };

    loadTaskDetail();
  }, [taskId]);

  useFocusEffect(
    useCallback(() => {
      if (!taskId || !currentTask) {
        return undefined;
      }

      logger.info('[CreateHistoryDetail] focus start task SSE subscription:', {
        taskId,
        status: currentTask.status,
      });
      startTaskSubscription(taskId);

      return () => {
        logger.info('[CreateHistoryDetail] blur stop task SSE subscription:', { taskId });
        stopTaskSubscription(taskId);
      };
    }, [taskId, currentTask?.status, !!currentTask, startTaskSubscription, stopTaskSubscription])
  );

  // ==================== 事件处理 ====================
  /**
   * 处理返回按钮
   */
  const handleBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.push('/create-history');
    }
  }, []);

  /**
   * 获取导航栏配置
   */
  const getHeaderOptions = useCallback(() => {
    const baseOptions = createImmersiveHeaderOptions({
      title: t('createHistory.taskDetail'),
      colorScheme,
      transparent: false,
    });

    return {
      ...baseOptions,
      // 隐藏默认返回按钮
      headerBackVisible: false,
      // 自定义左侧返回按钮
      headerLeft: () => (
        <TouchableOpacity
          style={styles.headerBackButton}
          onPress={handleBack}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="chevron-back" size={28} color={isDark ? '#0A84FF' : '#007AFF'} />
          <ThemedText style={[styles.headerBackText, { color: isDark ? '#0A84FF' : '#007AFF' }]}>
            {t('createHistory.back')}
          </ThemedText>
        </TouchableOpacity>
      ),
    };
  }, [colorScheme, isDark, handleBack, t]);

  /**
   * 处理选择图片
   */
  const handleSelectImage = async (imageId: string) => {
    if (!currentTask) return;
    await selectImage(currentTask.id, imageId);
    // 重新加载任务以更新状态
    // TODO: 这里可以优化，直接更新本地状态而不是重新加载
  };

  /**
   * 处理生成模型
   */
  const handleGenerateModel = async () => {
    if (!currentTask) return;
    await generateModel(currentTask.id);
  };

  /**
   * 处理查看 3D 模型
   */
  const handleView3D = () => {
    if (!currentTask?.model?.modelUrl || !currentTask?.model?.id) {
      logger.warn('[CreateHistoryDetail] 模型数据不完整，无法查看3D:', {
        hasModel: !!currentTask?.model,
        hasModelUrl: !!currentTask?.model?.modelUrl,
        hasModelId: !!currentTask?.model?.id,
      });
      return;
    }
    const encodedUrl = encodeURIComponent(currentTask.model.modelUrl);
    router.push(`/model-viewer/${currentTask.model.id}?modelUrl=${encodedUrl}`);
  };

  /**
   * 处理重试
   */
  const handleRetry = () => {
    // 重新加载任务
    setLoading(true);
    setError(null);
  };

  /**
   * 开始新任务-回到ai创作
   */
  const handleCreateNew = () => {
    router.push(`/(tabs)/create`);
  };

  /**
   * 开始新任务-回到ai创作
   */
  const handleResetPlace = (prompt: string) => {
    router.push(`/(tabs)/create?prompt=${prompt}`);
  };
  // ==================== 渲染 ====================
  return (
    <AuthGuard>
      {/* 配置导航栏 */}
      <Stack.Screen options={getHeaderOptions()} />

      {/* 页面内容 */}
      <ScreenWrapper
        edges={[]}
        style={{ flex: 1 }}
        backgroundColor={isDark ? '#000000' : '#FFFFFF'}
      >
        {/* 内容 */}
        {/* {loading ? (
          <LoadingStateView type="loading" message="加载中..." />
        ) : error ? (
          <LoadingStateView type="error" message={error} onRetry={handleRetry} />
        ) : !currentTask ? (
          <LoadingStateView type="empty" message="任务不存在" />
        ) : (
          <CreateTaskRenderer
            task={currentTask}
            onSelectImage={handleSelectImage}
            onGenerateModel={handleGenerateModel}
            onView3D={handleView3D}
            onResetPlace={handleResetPlace}
            paddingBottom={contentPaddingBottom}
            isDark={isDark}
          />
        )} */}
        <LoadingStateView
          loading={loading && !currentTask} // 首次加载
          error={error}
          isEmpty={!currentTask && !loading}
          onRetry={handleRetry}
          loadingText={t('createHistory.loading')}
          emptyText={t('createHistory.taskNotFound')}
        >
          <CreateTaskRenderer
            task={currentTask}
            onSelectImage={handleSelectImage}
            onGenerateModel={handleGenerateModel}
            onView3D={handleView3D}
            onResetPlace={handleResetPlace}
            paddingBottom={contentPaddingBottom}
            isDark={isDark}
            isNotBack
          />
        </LoadingStateView>
      </ScreenWrapper>
    </AuthGuard>
  );
}

/**
 * 后端任务状态映射到前端任务状态
 */
function mapBackendStatus(
  backendStatus: string,
  isImageTo3DTask: boolean = false
): GenerationTask['status'] {
  // 基础状态映射
  let status: GenerationTask['status'];
  switch (backendStatus) {
    case 'IMAGE_PENDING':
    case 'IMAGE_GENERATING':
      status = 'generating_images';
      break;
    case 'IMAGE_COMPLETED':
      status = 'images_ready';
      break;
    case 'IMAGE_FAILED':
      status = 'failed';
      break;
    case 'MODEL_PENDING':
    case 'MODEL_GENERATING':
      status = 'generating_model';
      break;
    case 'MODEL_COMPLETED':
    case 'COMPLETED':
      status = 'model_ready';
      break;
    case 'MODEL_FAILED':
      status = 'failed';
      break;
    default:
      logger.warn('[CreateHistoryDetail] 未知的后端任务状态:', backendStatus);
      status = 'failed';
  }

  // 图生3D任务特殊处理：只处理图片生成相关的状态，不处理模型相关状态
  // 这样可以确保已完成的图生3D任务（MODEL_COMPLETED）正确显示为 model_ready
  if (isImageTo3DTask) {
    if (status === 'generating_images' || status === 'images_ready') {
      logger.info('[CreateHistoryDetail] 图生3D任务，强制设置为模型生成中状态', {
        backendStatus,
        originalStatus: status,
        newStatus: 'generating_model',
      });
      status = 'generating_model';
    }
    // 注意：model_ready 状态保持不变，这样已完成的任务会显示模型完成页面
  }

  return status;
}

/**
 * 计算图片生成进度（0-100）
 */
function calculateImageProgress(images?: any[]): number {
  if (!images || images.length === 0) return 0;
  const completedCount = images.filter(img => img.imageStatus === 'COMPLETED').length;
  return Math.floor((completedCount / 4) * 100);
}

/**
 * 计算 3D 模型生成进度（0-100）
 */
function calculateModelProgress(task?: any): number {
  if (!task) return 0;

  if (typeof task.modelProgress === 'number') {
    return Math.min(Math.max(task.modelProgress, 0), 100);
  }

  const model = task.model;
  if (!model) return 0;

  // 如果模型已完成，进度为 100
  if (model.completedAt) {
    return 100;
  }

  // 如果模型失败，进度为 0
  if (model.failedAt) {
    return 0;
  }

  // 如果有 generationJob，使用 Job 的进度
  if (model.generationJob) {
    const jobStatus = model.generationJob.status;
    const jobProgress = model.generationJob.progress || 0;

    // 如果 Job 已完成，进度为 100
    if (jobStatus === 'COMPLETED') {
      return 100;
    }

    // 如果 Job 失败或超时，进度为 0
    if (jobStatus === 'FAILED' || jobStatus === 'TIMEOUT') {
      return 0;
    }

    // 否则使用 Job 的实际进度
    return Math.min(Math.max(jobProgress, 0), 100);
  }

  // 默认返回 0
  return 0;
}

const styles = StyleSheet.create({
  // 导航栏样式
  headerBackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  headerBackText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.regular,
  },
});
