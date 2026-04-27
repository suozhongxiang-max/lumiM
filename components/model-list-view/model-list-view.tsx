import { LoadingStateView } from '@/components/loading-state-view';
import { MasonryGrid } from '@/components/masonry-grid';
import { ModelCard } from '@/components/model-card';
import { SearchBar } from '@/components/search-bar';
import { Colors, FontSize, FontWeight, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useI18n } from '@/hooks/use-i18n';
import { deleteModel as deleteModelApi, updateModelVisibility } from '@/services';
import { useInteractionStore } from '@/stores';
import { logger } from '@/utils/logger';
import { useIsFocused } from '@react-navigation/native';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator, Alert, Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View
} from 'react-native';
import type { ModelListViewProps } from './types';

/**
 * 模型列表视图组件
 *
 * 完整的模型列表视图，集成了：
 * - 搜索栏（可选）
 * - 下拉刷新
 * - 无限滚动加载更多
 * - 加载/错误/空状态处理
 * - 双列瀑布流布局
 * - 模型卡片展示
 * - 点赞收藏功能
 * - 页面聚焦时自动同步交互状态
 *
 * @example
 * ```tsx
 * <ModelListView
 *   models={store.models}
 *   loading={store.loading}
 *   refreshing={store.refreshing}
 *   error={store.error}
 *   hasMore={store.hasMore}
 *   onRefresh={store.refreshModels}
 *   onLoadMore={store.loadMore}
 *   onModelPress={(id) => router.push(`/model/${id}`)}
 *   onRetry={() => store.fetchModels(1)}
 *   enableSearch={true}
 *   emptyText="暂无模型"
 * />
 * ```
 */
export function ModelListView({
  models,
  loading,
  refreshing,
  error,
  hasMore,
  searchQuery = '',
  onRefresh,
  onLoadMore,
  onModelPress,
  onRetry,
  onSearchChange,
  onSortChange,
  enableSearch = false,
  searchPlaceholder = '搜索...',
  emptyText = '暂无数据',
  headerComponent,
  showManageActions = false, // 默认不显示管理操作
  sort = 'latest',
}: ModelListViewProps) {
  // ==================== Hooks ====================
  const colorScheme = useColorScheme();
  const isDark = colorScheme.isDark;
  const { t } = useI18n();

  // 从 Interaction Store 获取批量加载方法
  const fetchBatchStatus = useInteractionStore(state => state.fetchBatchStatus);

  // 监听页面聚焦状态
  const isFocused = useIsFocused();

  // 标记是否已经初始加载过交互状态（避免首次加载两次）
  const hasInitialLoadedRef = useRef(false);

  // ==================== 筛选下拉框状态 ====================
  /**
   * 筛选下拉框显示状态
   */
  const [showSortDropdown, setShowSortDropdown] = useState(false);

  /**
   * 筛选选项配置
   */
  const sortOptions = [
    { value: 'latest' as const, label: t('discover.filter.latest') },
    { value: 'popular' as const, label: t('discover.filter.popular') },
  ];

  /**
   * 获取当前选中选项的标签
   */
  const selectedSortLabel = sortOptions.find(option => option.value === sort)?.label || sortOptions[0].label;

  /**
   * 处理筛选按钮点击
   */
  const handleDropdownPress = () => {
    setShowSortDropdown(!showSortDropdown);
  };

  /**
   * 处理筛选选项点击
   */
  const handleSortSelect = (value: 'latest' | 'popular') => {
    setShowSortDropdown(false);
    onSortChange?.(value);
  };

  // ==================== 处理模型管理操作 ====================
  /**
   * 处理切换模型可见性
   */
  const handleToggleVisibility = async (modelId: string, isPrivate: boolean) => {
    try {
      logger.info('[ModelListView] 切换模型可见性:', { modelId, isPrivate });
      const newVisibility = isPrivate ? ('PRIVATE' as const) : ('PUBLIC' as const);

      const result = await updateModelVisibility(modelId, newVisibility);

      if (result.success) {
        // 成功后刷新列表
        logger.info('[ModelListView] 模型可见性更新成功，刷新列表');
        onRefresh?.();
      } else {
        Alert.alert(
          t('modelDetail.updateFailed.title') || '更新失败',
          result.error.message || t('modelDetail.updateFailed.message') || '更新模型可见性时发生错误'
        );
      }
    } catch (error) {
      logger.error('[ModelListView] 切换模型可见性失败:', error);
      Alert.alert(
        t('modelDetail.updateFailed.title') || '更新失败',
        t('modelDetail.updateFailed.message') || '更新模型可见性时发生错误'
      );
    }
  };

  /**
   * 处理删除模型
   */
  const handleDelete = async (modelId: string) => {
    Alert.alert(
      t('modelDetail.deleteConfirm.title') || '确认删除',
      t('modelDetail.deleteConfirm.message') || '确定要删除这个模型吗？此操作无法撤销。',
      [
        {
          text: t('dialog.common.cancel') || '取消',
          style: 'cancel',
        },
        {
          text: t('dialog.common.confirm') || '删除',
          style: 'destructive',
          onPress: async () => {
            try {
              logger.info('[ModelListView] 删除模型:', modelId);
              const result = await deleteModelApi(modelId);

              if (result.success) {
                // 成功后刷新列表
                logger.info('[ModelListView] 模型删除成功，刷新列表');
                onRefresh?.();
              } else {
                Alert.alert(
                  t('modelDetail.deleteFailed.title') || '删除失败',
                  result.error.message || t('modelDetail.deleteFailed.message') || '删除模型时发生错误'
                );
              }
            } catch (error) {
              logger.error('[ModelListView] 删除模型失败:', error);
              Alert.alert(
                t('modelDetail.deleteFailed.title') || '删除失败',
                t('modelDetail.deleteFailed.message') || '删除模型时发生错误'
              );
            }
          },
        },
      ]
    );
  };

  // ==================== 批量加载交互状态（首次加载） ====================
  /**
   * 模型列表加载完成后，批量获取所有模型的点赞收藏状态
   * 避免 N+1 查询问题
   */
  useEffect(() => {
    if (models && models.length > 0) {
      // 提取所有模型 ID
      const modelIds = models.map(model => model.id);
      // 批量加载交互状态
      logger.info(`[ModelListView] 首次批量加载 ${modelIds.length} 个模型的交互状态`);
      fetchBatchStatus(modelIds);
      // 标记已初始加载
      hasInitialLoadedRef.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [models]); // ✅ 只依赖 models，避免 fetchBatchStatus 导致的无限循环

  // ==================== 页面聚焦时重新加载交互状态和数量 ====================
  /**
   * 当用户从详情页返回列表页时：
   * 1. 重新加载交互状态（isLiked, isFavorited）
   * 2. 通过 onRefresh 刷新列表数据（包括 likeCount, favoriteCount）
   * 这样可以确保用户在详情页修改的状态能够完全同步到列表页
   */
  useEffect(() => {
    // 只有在页面聚焦、已经初始加载过、且有模型数据时才重新加载
    if (isFocused && hasInitialLoadedRef.current && models && models.length > 0) {
      // 1. 批量重新加载交互状态（图标状态）
      const modelIds = models.map(model => model.id);
      logger.info(`[ModelListView] 页面聚焦，重新加载 ${modelIds.length} 个模型的交互状态`);
      fetchBatchStatus(modelIds);

      // 2. 刷新列表数据（数量）
      // 注意：这里使用静默刷新（不显示 RefreshControl），避免打断用户
      logger.info(`[ModelListView] 页面聚焦，刷新模型列表数据以同步最新数量`);
      onRefresh();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFocused]); // ✅ 只依赖 isFocused，避免频繁触发

  // ==================== 渲染模型卡片 ====================
  /**
   * 渲染单个模型卡片
   */
  const renderModelCard = (model: (typeof models)[0]) => {
    // 使用 prop 传入的 showManageActions 来控制是否显示管理操作
    const shouldShowManageActions = showManageActions && 'visibility' in model;

    return (
      <ModelCard
        key={model.id}
        modelId={model.id}
        title={model.name}
        imageUrl={model.previewImageUrl}
        likes={model.likeCount}
        favorites={model.favoriteCount || 0}
        visibility={model.visibility}
        onPress={onModelPress}
        showManageActions={shouldShowManageActions}
        onToggleVisibility={shouldShowManageActions ? handleToggleVisibility : undefined}
        onDelete={shouldShowManageActions ? handleDelete : undefined}
      />
    );
  };

  // ==================== 渲染 ====================
  return (
    <View style={styles.container}>
      {/* 搜索栏和筛选下拉框（同一行） */}
      {enableSearch && (
        <View style={styles.searchAndFilterRow}>
          <View style={styles.searchBarWrapper}>
            <SearchBar
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChangeText={onSearchChange}
            />
          </View>

          {/* 筛选下拉框（可选） */}
          {onSortChange && (
            <View style={styles.sortDropdownWrapper}>
              {/* 下拉框触发按钮和弹出菜单的包裹容器 */}
              <View>
                {/* 下拉框触发按钮 */}
                <Pressable
                  style={[
                    styles.sortDropdownButton,
                    {
                      backgroundColor: isDark
                        ? Colors.dark.inputBackground
                        : Colors.light.inputBackground,
                      borderColor: isDark ? Colors.dark.border : Colors.light.border,
                    },
                  ]}
                  onPress={handleDropdownPress}
                >
                  <Text
                    style={[
                      styles.sortDropdownButtonText,
                      { color: isDark ? Colors.dark.text : Colors.light.text },
                    ]}
                  >
                    {sort === 'latest' ? t('discover.filter.latest') : t('discover.filter.popular')}
                  </Text>
                </Pressable>

                {/* 下拉选项弹窗 */}
                {showSortDropdown && (
                  <Modal
                    visible={showSortDropdown}
                    transparent={true}
                    animationType="fade"
                    onRequestClose={() => setShowSortDropdown(false)}
                  >
                    <TouchableWithoutFeedback onPress={() => setShowSortDropdown(false)}>
                      <View style={styles.sortDropdownModalOverlay}>
                        <TouchableWithoutFeedback onPress={() => { }}>
                          <View
                            style={[
                              styles.sortDropdownMenu,
                              {
                                backgroundColor: isDark
                                  ? Colors.dark.cardBackground
                                  : Colors.light.cardBackground,
                                borderColor: isDark ? Colors.dark.border : Colors.light.border,
                              },
                            ]}
                          >
                            {sortOptions.map(option => (
                              <Pressable
                                key={option.value}
                                style={[
                                  styles.sortDropdownOption,
                                  sort === option.value && styles.sortDropdownOptionActive,
                                ]}
                                onPress={() => handleSortSelect(option.value)}
                              >
                                <Text
                                  style={[
                                    styles.sortDropdownOptionText,
                                    {
                                      color:
                                        sort === option.value
                                          ? isDark
                                            ? Colors.dark.tint
                                            : Colors.light.tint
                                          : isDark
                                            ? Colors.dark.text
                                            : Colors.light.text,
                                    },
                                  ]}
                                >
                                  {option.label}
                                </Text>
                                {sort === option.value && (
                                  <Text
                                    style={[
                                      styles.sortDropdownCheck,
                                      {
                                        color: isDark
                                          ? Colors.dark.tint
                                          : Colors.light.tint,
                                      },
                                    ]}
                                  >
                                    ✓
                                  </Text>
                                )}
                              </Pressable>
                            ))}
                          </View>
                        </TouchableWithoutFeedback>
                      </View>
                    </TouchableWithoutFeedback>
                  </Modal>
                )}
              </View>
            </View>
          )}
        </View>
      )}

      {/* 顶部加载指示器 - 加载更多时显示在顶部，不遮挡内容 */}
      {loading && !refreshing && models.length > 0 && (
        <View style={styles.topLoadingIndicator}>
          <ActivityIndicator size="small" color={isDark ? Colors.dark.tint : Colors.light.tint} />
        </View>
      )}

      {/* 使用 LoadingStateView 处理首次加载、错误、空状态 */}
      <LoadingStateView
        loading={loading && !refreshing && models.length === 0} // 首次加载
        error={error}
        isEmpty={models.length === 0 && !loading}
        onRetry={onRetry}
        loadingText={t('common.loading')}
        emptyText={emptyText}
      >
        {/* 瀑布流网格 */}
        <MasonryGrid
          data={models}
          renderItem={renderModelCard}
          keyExtractor={model => model.id}
          numColumns={2} // 双列布局
          columnGap={Spacing.md} // 列间距
          rowGap={Spacing.md} // 行间距
          refreshing={refreshing}
          onRefresh={onRefresh}
          onEndReached={hasMore ? onLoadMore : undefined} // 只有还有更多数据时才触发加载更多
          onEndReachedThreshold={100} // 距离底部 100px 时触发
          ListHeaderComponent={headerComponent}
        />
      </LoadingStateView>
    </View>
  );
}

/**
 * 样式定义
 */
const styles = StyleSheet.create({
  // 容器样式
  container: {
    flex: 1,
  },

  // 顶部加载指示器样式
  topLoadingIndicator: {
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ==================== 搜索栏和筛选下拉框同行布局 ====================
  // 搜索栏和下拉框的行容器
  searchAndFilterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md, // 减小水平内边距
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
    gap: Spacing.sm, // 减小间距
  },

  // 搜索栏包裹容器
  searchBarWrapper: {
    flex: 1, // 占据剩余空间
  },

  // ==================== 筛选下拉框样式 ====================
  // 下拉框包裹容器
  sortDropdownWrapper: {
    // 不设置宽度，根据内容自适应
  },

  // 下拉框按钮样式（小巧）
  sortDropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm, // 减小水平padding给文字更多空间
    borderRadius: 8,
    borderWidth: 1,
    minWidth: 100, // 进一步增加最小宽度
    height: 40, // 固定高度与搜索框一致
  },

  // 下拉框按钮文本样式
  sortDropdownButtonText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
  },

  // Modal 遮罩层样式
  sortDropdownModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
    paddingTop: 80, // 距离顶部，给搜索栏留出空间
    paddingHorizontal: Spacing.lg,
  },

  // 下拉菜单容器样式
  sortDropdownMenu: {
    alignSelf: 'flex-end', // 右对齐，与按钮对齐
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    minWidth: 120, // 菜单最小宽度
  },

  // 下拉选项样式
  sortDropdownOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    minHeight: 44,
  },

  // 下拉选项激活状态样式
  sortDropdownOptionActive: {
    backgroundColor: 'rgba(10, 126, 164, 0.1)',
  },

  // 下拉选项文本样式
  sortDropdownOptionText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.regular,
  },

  // 下拉选项勾选标记样式
  sortDropdownCheck: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },
});
