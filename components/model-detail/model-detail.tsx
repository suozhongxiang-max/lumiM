import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { BorderRadius, Colors, Spacing, Typography } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useI18n } from '@/hooks/use-i18n';
import { useModelInteraction } from '@/hooks/use-model-interaction';
import { useNavigationDebounce } from '@/hooks/use-navigation-debounce';
import { useAuthStore } from '@/stores';
import { logger } from '@/utils/logger';
import { getImageUrl } from '@/utils/url';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import type { ModelDetailProps } from './types';

// 格式化数字（例如：8192 → 8.2k）
const formatNumber = (num: number): string => {
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}k`;
  }
  return num.toString();
};

// 格式化文件大小（字节转为 MB）
const formatFileSize = (bytes: number | null | undefined): string => {
  if (!bytes) return 'N/A';
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(1)} MB`;
};

export const ModelDetail = React.memo(({
  model,
  onPrint,
  on3DPreview,
  onTogglePrivate,
  onDelete
}: ModelDetailProps) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme.isDark;
  const router = useRouter();
  const { t } = useI18n();

  // 私有/公开切换状态
  const [isPrivate, setIsPrivate] = useState(model.visibility === 'PRIVATE');

  // 检查是否是模型的所有者
  const isOwner = useAuthStore(state => state.user?.id === model.externalUserId);

  // 获取用户认证状态
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);

  // 使用 ref 来跟踪防抖状态
  const lastLikeTimeRef = useRef<number>(0);
  const lastFavoriteTimeRef = useRef<number>(0);
  const DEBOUNCE_DELAY = 300; // 300ms 防抖延迟

  // 使用交互 Hook 管理点赞和收藏状态
  const {
    isLiked,
    isFavorited,
    currentLikes,
    currentFavorites,
    isLoading,
    handleLike,
    handleFavorite,
  } = useModelInteraction({
    modelId: model.id,
    initialLikes: model.likeCount,
    initialFavorites: model.favoriteCount,
    isAuthenticated,
    onRequireLogin: () => {
      // 跳转到登录页
      router.push('/login');
    },
  });

  // 处理点赞按钮点击（带防抖）
  const handleLikePress = useCallback(() => {
    const now = Date.now();

    // 防抖：如果距离上次点击时间太短，忽略
    if (now - lastLikeTimeRef.current < DEBOUNCE_DELAY) {
      return;
    }

    // 更新最后点击时间
    lastLikeTimeRef.current = now;

    // 先调用 handleLike，再触发触觉反馈（避免异步问题）
    handleLike();
    // 触觉反馈使用 Promise.catch() 避免阻塞
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(error => {
      // 忽略触觉反馈错误
    });
  }, [handleLike]);

  // 处理收藏按钮点击（带防抖）
  const handleFavoritePress = useCallback(() => {
    const now = Date.now();

    // 防抖：如果距离上次点击时间太短，忽略
    if (now - lastFavoriteTimeRef.current < DEBOUNCE_DELAY) {
      return;
    }

    // 更新最后点击时间
    lastFavoriteTimeRef.current = now;

    // 先调用 handleFavorite，再触发触觉反馈（避免异步问题）
    handleFavorite();
    // 触觉反馈使用 Promise.catch() 避免阻塞
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(error => {
      // 忽略触觉反馈错误
    });
  }, [handleFavorite]);

  // 处理一键打印（带防抖）
  const executePrint = useCallback(() => {
    logger.info('一键打印模型:', model.name);
    onPrint?.();
  }, [model.name, onPrint]);

  const handlePrintDebounced = useNavigationDebounce(executePrint, { delay: 300 });

  // 处理 3D 预览（带防抖）
  const execute3DPreview = useCallback(() => {
    logger.info('预览 3D 模型:', model.name);
    on3DPreview?.();
  }, [model.name, on3DPreview]);

  const handle3DPreviewDebounced = useNavigationDebounce(execute3DPreview, { delay: 300 });

  // 处理私有/公开切换
  const handleTogglePrivacy = useCallback((value: boolean) => {
    setIsPrivate(value);
    onTogglePrivate?.(value);
    logger.info('模型可见性已切换:', { modelId: model.id, isPrivate: value });
  }, [model.id, onTogglePrivate]);

  // 处理删除模型
  const handleDelete = useCallback(() => {
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
          onPress: () => {
            onDelete?.();
            logger.info('模型已删除:', model.id);
          },
        },
      ]
    );
  }, [t, model.id, onDelete]);

  // 预计算样式
  const dynamicStyles = useMemo(
    () => ({
      card: {
        backgroundColor: isDark ? Colors.dark.cardBackground : Colors.light.cardBackground,
        elevation: 4,
      },
      // 主要按钮：浅色模式使用蓝色，深色模式使用暗一点的蓝色
      primaryButton: {
        backgroundColor: isDark ? '#0a5c84' : '#0a7ea4', // 深色模式使用暗蓝色，浅色模式使用标准蓝色
        elevation: 4,
      },
      secondaryButton: {
        backgroundColor: isDark ? 'rgba(74, 144, 226, 0.15)' : 'rgba(0, 122, 255, 0.08)',
        borderColor: isDark ? '#4a90e2' : '#0a7ea4', // 按钮边框也使用一致的蓝色系
      },
    }),
    [isDark]
  );

  // 转换图片URL为绝对路径
  const absoluteImageUrl = useMemo(
    () => getImageUrl(model.previewImageUrl),
    [model.previewImageUrl]
  );

  return (
    <ThemedView style={styles.container}>
      {/* 状态栏 */}
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent
      />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* 主图 */}
        <View style={styles.imageContainer}>
          <Image source={{ uri: absoluteImageUrl }} style={styles.mainImage} resizeMode="cover" />

          {/* 图片遮罩层：仅在深色模式下显示，使白色背景变暗 */}
          {isDark && <View style={styles.imageOverlay} />}

          {/* 3D 预览按钮 */}
          <View style={styles.previewButtonContainer}>
            <TouchableOpacity
              style={styles.previewButtonWrapper}
              onPress={() => handle3DPreviewDebounced()}
              activeOpacity={0.9}
            >
              {/* 按钮背景光晕效果 */}
              <View
                style={[
                  styles.previewButtonGlow,
                  {
                    backgroundColor: isDark ? 'rgba(10, 92, 132, 0.4)' : 'rgba(10, 126, 164, 0.3)',
                  },
                ]}
              />
              {/* 主按钮 */}
              <View
                style={[
                  styles.previewButton,
                  {
                    backgroundColor: isDark ? '#0a5c84' : '#0a7ea4', // 深色模式使用暗蓝色，浅色模式使用标准蓝色
                  },
                ]}
              >
                <IconSymbol name="cube" size={22} color="#fff" />
                <Text style={styles.previewButtonText}>{t('modelDetail.preview3D')}</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* 内容区域 */}
        <View style={styles.content}>
          {/* 标题 */}
          <ThemedText style={styles.title}>{model.name}</ThemedText>

          {/* 创作者信息 */}
          <View style={styles.creatorSection}>
            <View style={styles.creatorInfo}>
              <View
                style={[
                  styles.avatar,
                  { backgroundColor: isDark ? '#0a5c84' : '#0a7ea4' }, // 深色模式使用暗蓝色，浅色模式使用标准蓝色
                ]}
              >
                <Text style={styles.avatarText}>
                  {(model.user?.name || 'A').charAt(0).toUpperCase()}
                </Text>
              </View>
              <ThemedText style={styles.creatorName}>
                {model.user?.name || t('modelDetail.anonymousUser')}
              </ThemedText>
            </View>

            {/* Follow 按钮暂时隐藏，功能待开发 */}
            {/* <TouchableOpacity
                style={[styles.followButton, dynamicStyles.primaryButton]}
                activeOpacity={0.85}
              >
                <Text style={styles.followButtonText}>Follow</Text>
              </TouchableOpacity> */}
          </View>

          {/* 统计数据卡片 */}
          <View style={[styles.statsCard, dynamicStyles.card]}>
            {/* 喜欢数量 - 可点击 */}
            <TouchableOpacity
              style={styles.statItem}
              onPress={() => handleLikePress()}
              disabled={isLoading}
              activeOpacity={0.6}
            >
              <View style={styles.statInfo}>
                <Ionicons
                  name={isLiked ? 'heart' : 'heart-outline'}
                  size={22}
                  color={
                    isLiked
                      ? isDark
                        ? '#FF453A'
                        : '#FF3B30'
                      : isDark
                        ? Colors.dark.icon
                        : Colors.light.icon
                  }
                />
                <ThemedText
                  style={[
                    styles.statValue,
                    isLiked && {
                      color: isDark ? '#FF453A' : '#FF3B30',
                    },
                  ]}
                >
                  {formatNumber(currentLikes)}
                </ThemedText>
              </View>
              <ThemedText style={styles.statLabel}>{t('modelDetail.likes')}</ThemedText>
            </TouchableOpacity>

            <View style={styles.statDivider} />

            {/* 收藏数量 - 可点击 */}
            <TouchableOpacity
              style={styles.statItem}
              onPress={() => handleFavoritePress()}
              disabled={isLoading}
              activeOpacity={0.6}
            >
              <View style={styles.statInfo}>
                <Ionicons
                  name={isFavorited ? 'star' : 'star-outline'}
                  size={22}
                  color={
                    isFavorited
                      ? isDark
                        ? '#FFD60A'
                        : '#FFCC00'
                      : isDark
                        ? Colors.dark.icon
                        : Colors.light.icon
                  }
                />
                <ThemedText
                  style={[
                    styles.statValue,
                    isFavorited && {
                      color: isDark ? '#FFD60A' : '#FFCC00',
                    },
                  ]}
                >
                  {formatNumber(currentFavorites)}
                </ThemedText>
              </View>
              <ThemedText style={styles.statLabel}>{t('modelDetail.favorites')}</ThemedText>
            </TouchableOpacity>

            <View style={styles.statDivider} />

            {/* 浏览数量 - 仅展示 */}
            <View style={styles.statItem}>
              <View style={styles.statInfo}>
                <Ionicons
                  name="eye-outline"
                  size={22}
                  color={isDark ? Colors.dark.icon : Colors.light.icon}
                />
                <ThemedText style={styles.statValue}>{formatNumber(model.viewCount)}</ThemedText>
              </View>
              <ThemedText style={styles.statLabel}>{t('modelDetail.views')}</ThemedText>
            </View>

            {/* 加载指示器 */}
            {isLoading && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator
                  size="small"
                  color={isDark ? Colors.dark.tint : Colors.light.tint}
                />
              </View>
            )}
          </View>

          {/* 模型管理卡片 - 仅模型所有者可见 */}
          {isOwner && (
            <View style={[styles.manageCard, dynamicStyles.card]}>
              <ThemedText style={styles.sectionTitle}>{t('modelDetail.manage')}</ThemedText>

              {/* 私有/公开切换 */}
              <View style={styles.manageItem}>
                <View style={styles.manageItemLeft}>
                  <Ionicons
                    name={isPrivate ? 'lock-closed' : 'globe'}
                    size={20}
                    color={isDark ? Colors.dark.icon : Colors.light.icon}
                  />
                  <View style={styles.manageItemText}>
                    <ThemedText style={styles.manageItemTitle}>
                      {t('modelDetail.visibility')}
                    </ThemedText>
                    <ThemedText style={styles.manageItemDesc}>
                      {isPrivate ? t('modelDetail.private') : t('modelDetail.public')}
                    </ThemedText>
                  </View>
                </View>
                <Switch
                  value={!isPrivate}
                  onValueChange={handleTogglePrivacy}
                  trackColor={{ false: '#767577', true: isDark ? '#0a5c84' : '#0a7ea4' }}
                  thumbColor="#FFFFFF"
                />
              </View>

              <View style={styles.manageDivider} />

              {/* 删除按钮 */}
              <TouchableOpacity style={styles.deleteItem} onPress={handleDelete}>
                <Ionicons name="trash-outline" size={20} color="#FF3B30" />
                <ThemedText style={styles.deleteText}>{t('modelDetail.deleteModel')}</ThemedText>
              </TouchableOpacity>
            </View>
          )}

          {/* 描述 */}
          {model.description && (
            <View style={styles.descriptionSection}>
              <ThemedText style={styles.description}>{model.description}</ThemedText>
            </View>
          )}

          {/* 技术规格卡片 */}
          <View style={[styles.specsCard, dynamicStyles.card]}>
            <ThemedText style={styles.sectionTitle}>{t('modelDetail.techSpecs')}</ThemedText>

            <View style={styles.specRow}>
              <ThemedText style={styles.specLabel}>{t('modelDetail.format')}</ThemedText>
              <ThemedText style={styles.specValue}>{model.format || 'STL'}</ThemedText>
            </View>

            <View style={styles.specRow}>
              <ThemedText style={styles.specLabel}>{t('modelDetail.fileSize')}</ThemedText>
              <ThemedText style={styles.specValue}>{formatFileSize(model.fileSize)}</ThemedText>
            </View>

            {model.faceCount && (
              <View style={styles.specRow}>
                <ThemedText style={styles.specLabel}>{t('modelDetail.faceCount')}</ThemedText>
                <ThemedText style={styles.specValue}>{formatNumber(model.faceCount)}</ThemedText>
              </View>
            )}

            {model.vertexCount && (
              <View style={styles.specRow}>
                <ThemedText style={styles.specLabel}>{t('modelDetail.vertexCount')}</ThemedText>
                <ThemedText style={styles.specValue}>{formatNumber(model.vertexCount)}</ThemedText>
              </View>
            )}
          </View>

          {/* 操作按钮 */}
          <View style={styles.actionsSection}>
            <TouchableOpacity
              style={[styles.primaryActionButton, dynamicStyles.primaryButton]}
              onPress={() => handlePrintDebounced()}
              activeOpacity={0.8}
            >
              <IconSymbol name="printer.fill" size={20} color="#fff" />
              <Text style={styles.primaryActionText}>{t('modelDetail.print')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </ThemedView>
  );
});

ModelDetail.displayName = 'ModelDetail';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  imageContainer: {
    width: '100%',
    height: 400,
    position: 'relative', // 为遮罩层提供定位上下文
  },
  mainImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#E5E5EA',
  },
  // 图片遮罩层：半透明黑色，让白色背景变暗
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)', // 30% 不透明度的黑色遮罩
    pointerEvents: 'none', // 不拦截触摸事件
  },
  content: {
    padding: Spacing.xl,
  },
  title: {
    ...Typography.title1,
    fontSize: 36,
    marginBottom: Spacing.xl,
    lineHeight: 42,
  },
  creatorSection: {
    flexDirection: 'row',
    // 注释：Follow 按钮隐藏后，只需左对齐即可
    // justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xxl,
  },
  creatorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff', // 统一使用白色文字
  },
  creatorName: {
    ...Typography.body,
    fontSize: 16,
    fontWeight: '600',
  },
  followButton: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  followButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  statsCard: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.xxl,
    position: 'relative', // 为加载指示器提供定位上下文
  },
  statItem: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    gap: Spacing.xs,
    justifyContent: 'center',
  },
  statInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  statValue: {
    ...Typography.body,
    fontWeight: '700',
    fontSize: 20,
    marginBottom: 2,
  },
  statLabel: {
    ...Typography.caption2,
    fontSize: 11,
    opacity: 0.65,
    letterSpacing: 0.3,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(128, 128, 128, 0.15)',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: BorderRadius.lg,
  },
  // 模型管理卡片
  manageCard: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.xxl,
  },
  manageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  manageItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },
  manageItemText: {
    gap: 2,
  },
  manageItemTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  manageItemDesc: {
    fontSize: 13,
    opacity: 0.6,
  },
  manageDivider: {
    height: 1,
    backgroundColor: 'rgba(128, 128, 128, 0.15)',
    marginVertical: Spacing.lg,
  },
  deleteItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  deleteText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF3B30',
  },
  descriptionSection: {
    marginBottom: Spacing.xxl,
  },
  description: {
    ...Typography.body,
    lineHeight: 24,
    opacity: 0.85,
  },
  specsCard: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.xxl,
  },
  sectionTitle: {
    ...Typography.headline,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: Spacing.lg,
  },
  specRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(128, 128, 128, 0.15)',
  },
  specLabel: {
    ...Typography.body,
    fontSize: 15,
    fontWeight: '500',
    opacity: 0.7,
  },
  specValue: {
    ...Typography.body,
    fontSize: 15,
    fontWeight: '600',
  },
  actionsSection: {
    gap: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xxxl,
  },
  primaryActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.xl,
    borderRadius: BorderRadius.lg,
  },
  primaryActionText: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
    color: '#fff', // 统一使用白色文字
  },
  secondaryActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.xl,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
  },
  secondaryActionText: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  previewButtonContainer: {
    position: 'absolute',
    bottom: Spacing.xl,
    left: Spacing.xl,
    right: Spacing.xl,
  },
  previewButtonWrapper: {
    position: 'relative',
    borderRadius: 20,
    overflow: 'hidden',
  },
  previewButtonGlow: {
    position: 'absolute',
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderRadius: 22,
    filter: 'blur(8px)',
  },
  previewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 20,
    gap: 10,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  previewButtonText: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: '#fff', // 统一使用白色文字
  },
});
