/**
 * 统一的 ThemedView 组件
 * 使用统一的阴影系统提供一致的视觉效果
 */

import { StyleSheet, View } from 'react-native';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useColorScheme } from '@/hooks/use-color-scheme';
import type { ThemedViewProps } from './types';

/**
 * ThemedView 组件
 * 支持主题化的背景色和统一的阴影效果
 *
 * @param lightColor - 浅色主题背景色（可选）
 * @param darkColor - 深色主题背景色（可选）
 * @param shadow - 是否显示阴影（默认 false）
 * @param style - 自定义样式
 * @param otherProps - 其他 View 属性
 */
export function ThemedView({
  style,
  lightColor,
  darkColor,
  shadow = false,
  ...otherProps
}: ThemedViewProps) {
  // 获取当前主题（支持多种用法）
  const colorScheme = useColorScheme();
  const isDark = colorScheme.isDark;

  // 获取主题化的背景色
  const backgroundColor = useThemeColor({ light: lightColor, dark: darkColor }, 'background');

  return (
    <View
      style={[
        { backgroundColor },
        // 统一的阴影效果
        shadow
          ? {
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: isDark ? 0.3 : 0.1,
              shadowRadius: 4,
              elevation: 3, // 同时设置 elevation 以支持 Android
            }
          : undefined,
        style,
      ]}
      {...otherProps}
    />
  );
}
