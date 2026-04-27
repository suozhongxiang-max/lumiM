import { AuthGuard } from '@/components/auth';
import { LoadingStateView } from '@/components/loading-state-view';
import { ScreenWrapper } from '@/components/screen-wrapper';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { BorderRadius, FontSize, FontWeight, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useI18n } from '@/hooks/use-i18n';
import { useAsyncController } from '@/hooks/useAsyncController';
import { useNavigationDebounce } from '@/hooks/use-navigation-debounce';
import { fetchTaskList, deleteTask as deleteTaskApi, type BackendGenerationTask } from '@/services/api/tasks';
import { logger } from '@/utils/logger';
import { createImmersiveHeaderOptions } from '@/utils/navigation';
import { Ionicons } from '@expo/vector-icons';
import { router, Stack, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, FlatList, Image, StyleSheet, TouchableOpacity, View } from 'react-native';

/**
 * 状态标签配置
 */
interface StatusConfig {
  backgroundColor: string;
  textColor: string;
  label: string;
  icon?: string;
}

/**
 * 根据任务状态获取状态标签配置
 */
function getStatusConfig(status: string, t: (key: string) => string): StatusConfig {
  switch (status) {
    case 'IMAGE_COMPLETED':
      return {
        backgroundColor: '#FFF4E5', // 黄色背景
        textColor: '#FF9500', // 黄色文字
        label: t('createHistory.status.imagesReady'),
      };
    case 'MODEL_COMPLETED':
    case 'COMPLETED':
      return {
        backgroundColor: '#E8F5E9', // 绿色背景
        textColor: '#4CAF50', // 绿色文字
        label: t('createHistory.status.modelReady'),
      };
    case 'IMAGE_PENDING':
    case 'IMAGE_GENERATING':
      return {
        backgroundColor: '#E3F2FD', // 蓝色背景
        textColor: '#2196F3', // 蓝色文字
        label: t('createHistory.status.generatingImages'),
      };
    case 'MODEL_PENDING':
    case 'MODEL_GENERATING':
      return {
        backgroundColor: '#E3F2FD', // 蓝色背景
        textColor: '#2196F3', // 蓝色文字
        label: t('createHistory.status.generatingModel'),
      };
    case 'IMAGE_FAILED':
    case 'MODEL_FAILED':
      return {
        backgroundColor: '#FFEBEE', // 红色背景
        textColor: '#F44336', // 红色文字
        label: t('createHistory.status.failed'),
      };
    default:
      return {
        backgroundColor: '#F5F5F5',
        textColor: '#9E9E9E',
        label: t('createHistory.status.unknown'),
      };
  }
}

/**
 * 创作历史列表页面
 * 展示用户的所有 AI 创作任务，以网格布局呈现
 */
export default function CreateHistoryScreen() {
  // ==================== Hooks ====================
  const colorScheme = useColorScheme();
  const isDark = colorScheme.isDark;
  const { t } = useI18n();
  const { createController } = useAsyncController();

  // ==================== State ====================
  const [tasks, setTasks] = useState<BackendGenerationTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);

  // ==================== 事件处理 ====================
  /**
   * 处理返回按钮
   */
  const handleBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.push('/(tabs)/profile');
    }
  }, []);

  /**
   * 获取导航栏配置
   */
  const getHeaderOptions = useCallback(() => {
    const baseOptions = createImmersiveHeaderOptions({
      title: t('createHistory.title'), // 显示标题
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
   * 加载任务列表
   */
  const loadTasks = useCallback(
    async (pageNum: number, isRefresh: boolean = false) => {
      try {
        logger.info('[CreateHistory] 加载任务列表:', { page: pageNum, isRefresh });

        // 设置加载状态
        if (isRefresh) {
          setRefreshing(true);
        } else if (pageNum === 1) {
          setLoading(true);
        }

        // 清除错误
        setError(null);

        // 创建取消控制器
        const controller = createController();

        // 调用 API
        const result = await fetchTaskList(pageNum, 20);

        if (!result.success) {
          throw new Error(result.error.message);
        }

        logger.info('[CreateHistory] 任务列表加载成功:', {
          total: result.data.total,
          count: result.data.items.length,
          newTaskIds: result.data.items.map(t => t.id),
        });

        // 更新数据
        if (isRefresh || pageNum === 1) {
          // 刷新或首次加载，替换数据
          setTasks(result.data.items);
          logger.info('[CreateHistory] 数据已替换，任务数:', result.data.items.length);
        } else {
          // 加载更多，追加数据（去重，避免重复 key）
          setTasks(prev => {
            // 使用 Map 去重，保留最新的数据
            const taskMap = new Map();

            // 先添加现有任务
            prev.forEach(task => taskMap.set(task.id, task));

            // 记录原有任务 ID
            const existingIds = new Set(prev.map(t => t.id));

            // 再添加新任务（会覆盖同 ID 的旧任务）
            const newTasks = result.data.items.filter(task => !existingIds.has(task.id));
            const duplicateCount = result.data.items.length - newTasks.length;

            if (duplicateCount > 0) {
              logger.warn('[CreateHistory] 发现重复任务 ID，已过滤:', {
                duplicateCount,
                total: result.data.items.length,
              });
            }

            newTasks.forEach(task => taskMap.set(task.id, task));

            // 转换回数组
            const updatedTasks = Array.from(taskMap.values());
            logger.info('[CreateHistory] 数据已追加，任务数:', {
              before: prev.length,
              after: updatedTasks.length,
              new: newTasks.length,
            });

            return updatedTasks;
          });
        }

        // 更新分页状态
        setPage(pageNum);
        setHasMore(result.data.items.length === 20); // 如果返回20条，说明可能还有更多
      } catch (err) {
        logger.error('[CreateHistory] 加载任务列表失败:', err);
        setError(err instanceof Error ? err.message : t('createHistory.error'));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [createController]
  );

  /**
   * 页面聚焦时加载数据
   */
  useFocusEffect(
    useCallback(() => {
      loadTasks(1);
    }, [loadTasks])
  );

  /**
   * 下拉刷新
   */
  const handleRefresh = useCallback(() => {
    loadTasks(1, true);
  }, [loadTasks]);

  /**
   * 加载更多
   */
  const handleLoadMore = useCallback(() => {
    if (!loading && !refreshing && hasMore) {
      loadTasks(page + 1);
    }
  }, [loading, refreshing, hasMore, page, loadTasks]);

  /**
   * 点击任务卡片（带防抖）
   */
  const navigateToTaskDetail = useCallback((taskId: string) => {
    logger.info('[CreateHistory] 点击任务卡片:', taskId);
    router.push(`/create-history/${taskId}`);
  }, []);

  // 使用防抖 Hook 包装导航函数
  const handleTaskPress = useNavigationDebounce(navigateToTaskDetail, { delay: 300 });

  /**
   * 重试加载
   */
  const handleRetry = useCallback(() => {
    loadTasks(1);
  }, [loadTasks]);

  // ==================== 渲染任务卡片 ====================
  /**
   * 获取任务的预览图
   * 优先使用选中的图片，否则使用第一张图片
   */
  const getTaskPreviewImage = (task: BackendGenerationTask): string | null => {
    if (task.selectedImageIndex !== null && task.images) {
      const selectedImage = task.images.find(img => img.index === task.selectedImageIndex);
      if (selectedImage?.imageUrl) {
        return selectedImage.imageUrl;
      }
    }

    // 使用第一张图片
    return task.images?.[0]?.imageUrl || null;
  };

  /**
   * 渲染单个任务卡片
   */
  const renderTaskCard = ({ item }: { item: BackendGenerationTask }) => {
    const previewImage = getTaskPreviewImage(item);
    const statusConfig = getStatusConfig(item.status, t);

    // 格式化时间，包含时分秒
    const formatDate = (dateString: string) => {
      const date = new Date(dateString);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');
      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    };

    // 处理删除任务
    const handleDelete = (e: any) => {
      e.stopPropagation();

      Alert.alert(
        t('createHistory.deleteConfirm.title') || '确认删除',
        t('createHistory.deleteConfirm.message') || '确定要删除这个任务吗？',
        [
          {
            text: t('dialog.common.cancel') || '取消',
            style: 'cancel',
          },
          {
            text: t('dialog.common.confirm') || '确认',
            style: 'destructive',
            onPress: async () => {
              try {
                logger.info('[CreateHistory] 删除任务:', item.id);
                const result = await deleteTaskApi(item.id);

                if (result.success) {
                  // 从列表中移除已删除的任务
                  setTasks(prev => prev.filter(task => task.id !== item.id));
                  logger.info('[CreateHistory] 任务删除成功:', item.id);
                } else {
                  Alert.alert(
                    t('createHistory.deleteFailed.title') || '删除失败',
                    result.error.message || t('createHistory.deleteFailed.message') || '删除任务时发生错误'
                  );
                }
              } catch (error) {
                logger.error('[CreateHistory] 删除任务失败:', error);
                Alert.alert(
                  t('createHistory.deleteFailed.title') || '删除失败',
                  t('createHistory.deleteFailed.message') || '删除任务时发生错误'
                );
              }
            },
          },
        ]
      );
    };

    return (
      <TouchableOpacity
        style={[
          styles.taskCard,
          {
            backgroundColor: isDark ? '#2C2C2E' : '#FFFFFF',
          },
        ]}
        onPress={() => handleTaskPress(item.id)}
        activeOpacity={0.7}
      >
        {/* 预览图 */}
        <View style={styles.imageContainer}>
          {previewImage ? (
            <Image source={{ uri: previewImage }} style={styles.taskImage} resizeMode="cover" />
          ) : (
            <View
              style={[
                styles.taskImagePlaceholder,
                { backgroundColor: isDark ? '#3A3A3C' : '#F2F2F7' },
              ]}
            >
              <ThemedText style={styles.placeholderText}>{t('createHistory.noImage')}</ThemedText>
            </View>
          )}

          {/* 右上角状态标签 */}
          <View
            style={[
              styles.statusBadgeTopRight,
              { backgroundColor: statusConfig.backgroundColor },
            ]}
          >
            <ThemedText style={[styles.statusTextTopRight, { color: statusConfig.textColor }]}>
              {statusConfig.label}
            </ThemedText>
          </View>

          {/* 右下角删除按钮 */}
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDelete}
            hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
          >
            <Ionicons name="trash-outline" size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* 任务信息 */}
        <View style={styles.taskInfo}>
          <ThemedText numberOfLines={2} style={styles.taskPrompt}>
            {item.originalPrompt}
          </ThemedText>
          <ThemedText style={styles.taskDate}>
            {formatDate(item.createdAt)}
          </ThemedText>
        </View>
      </TouchableOpacity>
    );
  };

  // ==================== 渲染 ====================
  return (
    <AuthGuard>
      {/* 配置导航栏 */}
      <Stack.Screen options={getHeaderOptions()} />

      {/* 页面内容 */}
      <ScreenWrapper edges={[]} backgroundColor={isDark ? '#000000' : '#FFFFFF'}>
        <View style={styles.container}>
          {/* 列表 */}
          {/* {loading && tasks.length === 0 ? (
            <LoadingStateView type="loading" message="加载中..." />
          ) : error ? (
            <LoadingStateView type="error" message={error} onRetry={handleRetry} />
          ) : tasks.length === 0 ? (
            <LoadingStateView type="empty" message="暂无创作记录" />
          ) : (
            <FlatList
              data={tasks}
              renderItem={renderTaskCard}
              keyExtractor={(item, index) => {
                // 使用任务 ID 作为主 key，如果有 ID 冲突则加上索引
                const key = item.id || `task-${index}`;
                return key;
              }}
              numColumns={2}
              columnWrapperStyle={styles.row}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              refreshing={refreshing}
              onRefresh={handleRefresh}
              onEndReached={handleLoadMore}
              onEndReachedThreshold={0.3}
            />
          )} */}
          <LoadingStateView
            loading={loading && !refreshing && !tasks.length}
            error={error}
            isEmpty={!tasks.length}
            loadingText={t('createHistory.loading')}
            emptyText={t('createHistory.empty')}
          >
            <FlatList
              data={tasks}
              renderItem={renderTaskCard}
              keyExtractor={(item, index) => {
                // 使用任务 ID 作为主 key，如果有 ID 冲突则加上索引
                const key = item.id || `task-${index}`;
                return key;
              }}
              numColumns={2}
              columnWrapperStyle={styles.row}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              refreshing={refreshing}
              onRefresh={handleRefresh}
              onEndReached={handleLoadMore}
              onEndReachedThreshold={0.3}
            />
          </LoadingStateView>
        </View>
      </ScreenWrapper>
    </AuthGuard>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
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
  headerRightContainer: {
    flex: 1,
    justifyContent: 'center',
    marginLeft: Spacing.md,
  },
  headerSubtitle: {
    fontSize: FontSize.sm,
    opacity: 0.6,
  },
  // 列表样式
  listContent: {
    paddingHorizontal: Spacing.lg, // 左右内边距 - 16px
    paddingTop: Spacing.lg, // 顶部内边距 - 16px，避免内容贴着导航栏
    paddingBottom: Spacing.xl, // 底部内边距 - 24px
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  taskCard: {
    width: '48%',
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  // 图片容器（相对定位，用于放置状态标签和删除按钮）
  imageContainer: {
    position: 'relative',
    width: '100%',
    aspectRatio: 1,
  },
  taskImage: {
    width: '100%',
    height: '100%',
  },
  taskImagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: FontSize.sm,
    opacity: 0.4,
  },
  // 右上角状态标签样式
  statusBadgeTopRight: {
    position: 'absolute',
    top: 6,
    right: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  statusTextTopRight: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    lineHeight: 14,
  },
  // 删除按钮样式
  deleteButton: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FF3B30', // 红色背景
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF3B30',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  taskInfo: {
    padding: Spacing.sm,
  },
  taskPrompt: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    marginBottom: Spacing.xs,
    lineHeight: 18,
  },
  taskDate: {
    fontSize: FontSize.xs,
    opacity: 0.5,
  },
});
