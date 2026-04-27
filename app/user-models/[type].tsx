/**
 * 通用用户模型列表页面
 *
 * 根据路由参数 type 显示不同类型的模型列表：
 * - my-models: 我创建的模型
 * - my-favorites: 我收藏的模型
 * - my-likes: 我喜欢的模型
 */

import { useEffect, useMemo, useCallback } from 'react';
import { StatusBar, TouchableOpacity, StyleSheet } from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScreenWrapper } from '@/components/screen-wrapper';
import { ModelListView } from '@/components/model-list-view';
import { AuthGuard } from '@/components/auth';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useI18n } from '@/hooks/use-i18n';
import { useAsyncController } from '@/hooks/useAsyncController';
import { useNavigationDebounce } from '@/hooks/use-navigation-debounce';
import { useMyModelsStore, useMyFavoritesStore, useMyLikesStore } from '@/stores';
import { logger } from '@/utils/logger';
import { createImmersiveHeaderOptions } from '@/utils/navigation';

/**
 * 页面类型配置（不含文本，文本由i18n提供）
 */
const PAGE_CONFIG = {
  'my-models': {
    useStore: useMyModelsStore,
    titleKey: 'userModels.myModels.title' as const,
    emptyKey: 'userModels.myModels.empty' as const,
  },
  'my-favorites': {
    useStore: useMyFavoritesStore,
    titleKey: 'userModels.myFavorites.title' as const,
    emptyKey: 'userModels.myFavorites.empty' as const,
  },
  'my-likes': {
    useStore: useMyLikesStore,
    titleKey: 'userModels.myLikes.title' as const,
    emptyKey: 'userModels.myLikes.empty' as const,
  },
} as const;

/**
 * 用户模型列表页面
 */
export default function UserModelsScreen() {
  // ==================== Hooks ====================
  const colorScheme = useColorScheme();
  const isDark = colorScheme.isDark;
  const { t } = useI18n();

  // 获取路由参数
  const { type } = useLocalSearchParams<{ type: string }>();

  // 异步操作控制器，用于取消请求
  const { createController } = useAsyncController();

  // 根据 type 获取对应的配置
  const config = useMemo(() => {
    const validType = type as keyof typeof PAGE_CONFIG;
    return PAGE_CONFIG[validType] || PAGE_CONFIG['my-models'];
  }, [type]);

  // 获取i18n文本
  const pageTitle = t(config.titleKey);
  const emptyText = t(config.emptyKey);

  // 根据配置获取对应的 Store
  const store = config.useStore();

  // ==================== 初始化加载 ====================
  /**
   * 组件挂载时加载第一页数据
   */
  useEffect(() => {
    const controller = createController();
    store.fetchModels(1, {}, controller);
  }, [store.fetchModels, createController]);

  // ==================== 事件处理 ====================
  /**
   * 处理返回按钮
   * 从 Tabs 跳转过来的页面必须自定义返回逻辑
   */
  const handleBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      // 如果无法返回，跳转到个人中心
      router.push('/(tabs)/profile');
    }
  }, []);

  /**
   * 获取导航栏配置
   */
  const getHeaderOptions = useCallback(() => {
    const baseOptions = createImmersiveHeaderOptions({
      title: pageTitle,
      colorScheme,
      transparent: false,
    });

    return {
      ...baseOptions,
      // 隐藏默认返回按钮（避免显示 "(tabs)"）
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
            {t('userModels.back')}
          </ThemedText>
        </TouchableOpacity>
      ),
    };
  }, [pageTitle, colorScheme, isDark, handleBack, t]);

  /**
   * 处理模型卡片点击事件
   * 跳转到模型详情页面（带防抖）
   */
  const navigateToModelDetail = useCallback(
    (modelId: string) => {
      logger.info(`🔍 [UserModelsScreen-${type}] 点击模型卡片，跳转到模型详情:`, modelId);
      router.push(`/model/${modelId}`);
    },
    [type]
  );

  // 使用防抖 Hook 包装导航函数
  const handleModelPress = useNavigationDebounce(navigateToModelDetail, { delay: 300 });

  /**
   * 处理错误重试
   * 清除错误状态并重新加载第一页
   */
  const handleRetry = () => {
    const controller = createController();
    store.clearError();
    store.fetchModels(1, {}, controller);
  };

  // ==================== 渲染 ====================
  return (
    <AuthGuard>
      {/* 配置导航栏 */}
      <Stack.Screen options={getHeaderOptions()} />

      {/* 页面内容 - edges={[]} 因为导航栏已经处理了顶部安全区域 */}
      <ScreenWrapper edges={[]}>
        {/* 状态栏 */}
        <StatusBar
          barStyle={isDark ? 'light-content' : 'dark-content'}
          backgroundColor={isDark ? Colors.dark.background : Colors.light.background}
        />

        {/* 模型列表视图 */}
        <ModelListView
          // 数据和状态
          models={store.models}
          loading={store.loading}
          refreshing={store.refreshing}
          error={store.error}
          hasMore={store.hasMore}
          // 回调
          onRefresh={store.refreshModels}
          onLoadMore={store.loadMore}
          onModelPress={handleModelPress}
          onRetry={handleRetry}
          // UI 配置
          enableSearch={false} // 用户模型页面不需要搜索
          emptyText={emptyText}
          // 管理操作：仅在"我的模型"页面显示私有/发布和删除按钮
          showManageActions={type === 'my-models'}
        />
      </ScreenWrapper>
    </AuthGuard>
  );
}

/**
 * 样式定义
 */
const styles = StyleSheet.create({
  // 导航栏返回按钮样式
  headerBackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  headerBackText: {
    fontSize: 17,
    fontWeight: '400',
  },
});
