/**
 * 统一的 ModelCard 主组件
 * 使用 BlurView 提供一致的毛玻璃内容区效果
 * 支持点赞和收藏交互功能
 * 支持管理操作（可见性切换和删除）
 */

import { BorderRadius, Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useI18n } from '@/hooks/use-i18n';
import { useModelInteraction } from '@/hooks/use-model-interaction';
import { useNavigationDebounce } from '@/hooks/use-navigation-debounce';
import { useAuthStore } from '@/stores';
import { getImageUrl } from '@/utils/url';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import React, { useCallback, useMemo } from 'react';
import { Image, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CardActions } from './card-actions';
import { CardContent } from './card-content';
import type { ModelCardProps } from './types';

/**
 * 预计算卡片样式
 * 根据主题生成动态样式对象
 */
const createCardStyles = (isDark: boolean) => ({
  // 卡片阴影
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: isDark ? 0.3 : 0.08,
    shadowRadius: 8,
    elevation: 3, // Android elevation
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: isDark ? Colors.dark.border : Colors.light.border,
  },
  // BlurView 配置
  blurView: {
    intensity: isDark ? 40 : 60, // 毛玻璃强度
    tint: (isDark ? 'dark' : 'light') as 'dark' | 'light',
    // BlurView 内容区边框
    blurContent: {
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
      borderTopWidth: StyleSheet.hairlineWidth,
    },
  },
});

/**
 * ModelCard 组件
 *
 * @param modelId - 模型ID
 * @param title - 模型标题
 * @param creator - 创作者（可选）
 * @param imageUrl - 图片URL
 * @param likes - 点赞数
 * @param favorites - 收藏数
 * @param visibility - 模型可见性（可选）
 * @param onPress - 点击回调（可选，默认跳转到详情页）
 * @param onToggleVisibility - 切换可见性回调（可选）
 * @param onDelete - 删除模型回调（可选）
 * @param showManageActions - 是否显示管理操作（可选）
 */
export const ModelCard = React.memo(
  ({
    modelId,
    title,
    creator,
    imageUrl,
    likes,
    favorites,
    visibility,
    onPress,
    onToggleVisibility,
    onDelete,
    showManageActions = false,
  }: ModelCardProps) => {
    const colorScheme = useColorScheme();
    const isDark = colorScheme.isDark;
    const router = useRouter();
    const { t } = useI18n();

    // 私有/公开状态
    const isPrivate = visibility === 'PRIVATE';

    // 获取用户认证状态
    const isAuthenticated = useAuthStore(state => state.isAuthenticated);

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
      modelId,
      initialLikes: likes,
      initialFavorites: favorites,
      isAuthenticated,
      onRequireLogin: () => {
        // 跳转到登录页
        router.push('/login');
      },
    });

    // 预计算样式对象，避免每次渲染时重新创建
    const cardStyles = useMemo(() => createCardStyles(isDark), [isDark]);

    // 创建防抖的导航函数
    const navigateToDetail = useCallback(
      (id: string) => {
        if (onPress) {
          onPress(id);
        } else {
          // 默认跳转到模型详情页
          router.push(`/model/${id}`);
        }
      },
      [onPress, router]
    );

    // 使用防抖 Hook 包装导航函数
    const handlePress = useNavigationDebounce(navigateToDetail, { delay: 300 });

    // 转换图片URL为绝对路径
    const absoluteImageUrl = useMemo(() => getImageUrl(imageUrl), [imageUrl]);

    return (
      <Pressable
        onPress={() => handlePress(modelId)}
        style={({ pressed }) => [
          styles.card,
          {
            backgroundColor: isDark ? Colors.dark.cardBackground : Colors.light.cardBackground,
            opacity: pressed ? 0.9 : 1, // 按压时降低不透明度
          },
          cardStyles.card,
        ]}
      >
        {/* 模型预览图容器 */}
        <View style={styles.imageContainer}>
          {/* 模型预览图 */}
          <Image source={{ uri: absoluteImageUrl }} style={styles.image} resizeMode="cover" />

          {/* 图片遮罩层：仅在深色模式下显示，使白色背景变暗 */}
          {isDark && <View style={styles.imageOverlay} />}

          {/* 右上角可见性切换 - 文字版本 */}
          {showManageActions && onToggleVisibility && (
            <TouchableOpacity
              style={[
                styles.visibilityButton,
                {
                  backgroundColor: isPrivate
                    ? 'rgba(255, 255, 255, 0.25)'
                    : isDark
                      ? 'rgba(46, 125, 50, 0.25)' // 暗色模式墨绿色背景
                      : 'rgba(76, 175, 80, 0.25)', // 浅色模式绿色背景
                }
              ]}
              onPress={(e) => {
                e.stopPropagation();
                onToggleVisibility(modelId, !isPrivate);
              }}
              hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
            >
              <Text style={[
                styles.visibilityText,
                {
                  color: isPrivate
                    ? (isDark ? '#FFFFFF' : '#666666') // 暗色模式白色，浅色模式中灰色
                    : (isDark ? '#2E7D32' : '#4CAF50'), // 暗色模式墨绿色，浅色模式绿色
                }
              ]}>
                {isPrivate ? t('modelCard.private') : t('modelCard.public')}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* BlurView 毛玻璃内容区 */}
        <BlurView
          intensity={cardStyles.blurView.intensity}
          tint={cardStyles.blurView.tint}
          style={[styles.blurContent, cardStyles.blurView.blurContent]}
        >
          {/* 卡片内容（标题、创作者） */}
          <CardContent title={title} creator={creator} likes={currentLikes} />

          {/* 卡片操作（点赞、收藏） */}
          <CardActions
            likes={currentLikes}
            favorites={currentFavorites}
            isLiked={isLiked}
            isFavorited={isFavorited}
            isLoading={isLoading}
            onLike={handleLike}
            onFavorite={handleFavorite}
          />
        </BlurView>

        {/* 底部删除按钮 - 仅在启用时显示 */}
        {showManageActions && onDelete && (
          <TouchableOpacity
            style={styles.deleteButtonFull}
            onPress={(e) => {
              e.stopPropagation();
              onDelete(modelId);
            }}
            activeOpacity={0.8}
          >
            <Ionicons name="trash-outline" size={18} color="#ffffff" />
            <Text style={styles.deleteButtonText}>{t('modelDetail.deleteModel') || '删除模型'}</Text>
          </TouchableOpacity>
        )}
      </Pressable>
    );
  }
);

ModelCard.displayName = 'ModelCard';

const styles = StyleSheet.create({
  // 卡片容器
  card: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden', // 确保圆角和BlurView正确裁剪
    marginBottom: Spacing.xl,
    backgroundColor: 'transparent',
  },
  // 图片容器
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: 180,
  },
  // 预览图
  image: {
    width: '100%',
    height: '100%',
    backgroundColor: '#E5E5EA', // 图片加载时的占位背景色
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
  // BlurView 内容区
  blurContent: {
    padding: Spacing.sm + Spacing.xs,
    overflow: 'hidden', // 确保毛玻璃效果正确裁剪
  },
  // 可见性按钮样式
  visibilityButton: {
    position: 'absolute',
    top: 6,
    right: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 40,
  },
  visibilityText: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  // 底部删除按钮 - 全宽扁长样式
  deleteButtonFull: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#d6332a', // 正常红色背景
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 8,
  },
  // 删除按钮文字
  deleteButtonText: {
    color: '#ffff', // 红色文字
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});
