/**
 * 统一的 MenuGroup 组件
 * 菜单分组容器，用于将相关的菜单项组合在一起
 */

import { StyleSheet } from 'react-native';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import type { MenuGroupProps } from './types';

/**
 * MenuGroup 组件
 *
 * @param children - 子元素（通常是 MenuItem 组件）
 * @param containerStyle - 容器自定义样式
 * @param title - 分组标题（可选）
 */
export function MenuGroup({ children, containerStyle, title }: MenuGroupProps) {
  // 获取主题颜色
  const background = useThemeColor({}, 'background');
  const text = useThemeColor({}, 'text');
  const border = useThemeColor({}, 'border');

  return (
    <ThemedView style={styles.wrapper}>
      {/* 可选的分组标题 */}
      {title && <ThemedText style={[styles.groupTitle, { color: text }]}>{title}</ThemedText>}

      {/* 菜单分组容器 */}
      <ThemedView
        style={[
          styles.container,
          {
            backgroundColor: background,
            borderColor: border,
          },
          containerStyle,
        ]}
        shadow // 启用统一阴影
      >
        {children}
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  // 外层容器
  wrapper: {
    marginBottom: 24,
  },
  // 分组标题
  groupTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    marginLeft: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  // 菜单容器
  container: {
    borderRadius: 12,
    overflow: 'hidden', // 确保子元素不会超出圆角
    borderWidth: 0.5,
  },
});
