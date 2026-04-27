/**
 * 统一的 ThemedText 组件
 * 使用统一的字体系统提供一致的文本样式
 */

import { StyleSheet, Text } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Colors } from '@/constants/theme';
import type { ThemedTextProps } from './types';

/**
 * ThemedText 组件
 * 支持主题化的文本颜色和统一的字体样式
 *
 * @param lightColor - 浅色主题文本颜色（可选）
 * @param darkColor - 深色主题文本颜色（可选）
 * @param type - 文本类型（默认 'default'）
 * @param style - 自定义样式
 * @param rest - 其他 Text 属性
 */
export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = 'default',
  ...rest
}: ThemedTextProps) {
  // 获取当前主题（支持多种用法）
  const colorScheme = useColorScheme();
  const isDark = colorScheme.isDark;

  // 获取主题化的文本颜色
  const color = useThemeColor({ light: lightColor, dark: darkColor }, 'text');

  return (
    <Text
      style={[
        { color },
        // 根据 type 应用不同的样式
        type === 'default' ? styles.default : undefined,
        type === 'title' ? styles.title : undefined,
        type === 'defaultSemiBold' ? styles.defaultSemiBold : undefined,
        type === 'subtitle' ? styles.subtitle : undefined,
        type === 'link'
          ? {
              ...styles.link,
              // 链接使用主题色
              color: isDark ? Colors.dark.tint : Colors.light.tint,
            }
          : undefined,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  // 默认文本样式
  default: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400', // Regular
  },
  // 半粗体文本样式
  defaultSemiBold: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600', // SemiBold
  },
  // 标题样式
  title: {
    fontSize: 32,
    fontWeight: 'bold', // Bold (700)
    lineHeight: 36, // 折中的行高
  },
  // 副标题样式
  subtitle: {
    fontSize: 20,
    fontWeight: '600', // SemiBold
    lineHeight: 26, // 折中的行高
  },
  // 链接样式
  link: {
    fontSize: 16,
    lineHeight: 30,
    fontWeight: '400', // Regular
  },
});
