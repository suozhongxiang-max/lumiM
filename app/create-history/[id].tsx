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
        });

        // 将后端数据转换为前端格式
        const frontendTask: GenerationTask = {
          id: result.data.id,
          prompt: result.data.originalPrompt,
          status: mapBackendStatus(result.data.status),
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
          // 模型数据
          modelId: result.data.model?.id,
          modelUrl: result.data.model?.modelUrl ?? undefined,
          modelProgress: calculateModelProgress(result.data.model),
          error: result.data.model?.errorMessage ?? undefined,
        };
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
    if (!currentTask?.modelUrl || !currentTask?.modelId) return;
    const encodedUrl = encodeURIComponent(currentTask.modelUrl);
    router.push(`/model-viewer/${currentTask.modelId}?modelUrl=${encodedUrl}`);
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
function mapBackendStatus(backendStatus: string): GenerationTask['status'] {
  switch (backendStatus) {
    case 'IMAGE_PENDING':
    case 'IMAGE_GENERATING':
      return 'generating_images';
    case 'IMAGE_COMPLETED':
      return 'images_ready';
    case 'IMAGE_FAILED':
      return 'failed';
    case 'MODEL_PENDING':
    case 'MODEL_GENERATING':
      return 'generating_model';
    case 'MODEL_COMPLETED':
    case 'COMPLETED':
      return 'model_ready';
    case 'MODEL_FAILED':
      return 'failed';
    default:
      logger.warn('[CreateHistoryDetail] 未知的后端任务状态:', backendStatus);
      return 'failed';
  }
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
function calculateModelProgress(model?: any): number {
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
