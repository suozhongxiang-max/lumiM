import { useMemo } from 'react';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Spacing } from '@/constants/theme';

/**
 * 统一管理安全区域间距的自定义 Hook
 *
 * @returns {object} 包含各种预计算的安全区域间距值
 */
export function useSafeAreaSpacing() {
  const insets = useSafeAreaInsets();

  return useMemo(() => {
    // 顶部安全区域 + 额外间距
    const headerPaddingTop = Platform.select({
      ios: insets.top + Spacing.md, // iOS: 安全区域 + 中等间距
      android: insets.top + Spacing.md, // Android: 状态栏高度 + 中等间距
      default: Spacing.md,
    });

    // 底部安全区域 + 标签栏高度
    const tabBarHeight = Platform.select({
      ios: 56 + insets.bottom, // iOS: 系统默认高度 + 底部安全区
      android: 60 + insets.bottom, // Android: 略高一些并考虑安全区
      default: 60 + insets.bottom,
    });

    // 内容区域底部间距（只保留安全区+小间距，Tab 不再浮在内容上）
    const contentPaddingBottom = insets.bottom + Spacing.lg;

    // 页面顶部安全区域（简单版本，不含额外间距）
    const topInset = insets.top;

    // 页面底部安全区域
    const bottomInset = insets.bottom;

    return {
      // 原始安全区域值
      insets,
      topInset,
      bottomInset,
      leftInset: insets.left,
      rightInset: insets.right,

      // 预计算的常用值
      headerPaddingTop, // 导航栏/头部的 paddingTop
      tabBarHeight, // 底部标签栏总高度
      contentPaddingBottom, // 内容区域底部 padding（避免被标签栏遮挡）

      // 便捷方法：添加额外间距
      withTopSpacing: (spacing: number = 0) => topInset + spacing,
      withBottomSpacing: (spacing: number = 0) => bottomInset + spacing,
    };
  }, [insets]);
}
