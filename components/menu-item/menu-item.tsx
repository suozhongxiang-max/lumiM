/**
 * 统一的 MenuItem 组件
 * 菜单项，用于在菜单分组中显示可点击的选项
 */

import { StyleSheet, Pressable, Animated } from 'react-native';
import { useRef } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { IconSymbol } from '@/components/ui/icon-symbol';
import type { MenuItemProps } from './types';

/**
 * MenuItem 组件
 *
 * @param icon - 左侧图标名称
 * @param title - 标题文本
 * @param subtitle - 副标题文本（可选）
 * @param onPress - 点击回调
 * @param containerStyle - 容器自定义样式
 * @param showArrow - 是否显示右侧箭头（默认 true）
 * @param disabled - 是否禁用（默认 false）
 */
export function MenuItem({
  icon,
  title,
  subtitle,
  onPress,
  containerStyle,
  showArrow = true,
  disabled = false,
}: MenuItemProps) {
  // 获取主题颜色
  const tint = useThemeColor({}, 'tint');
  const secondaryText = useThemeColor({}, 'secondaryText');
  const cardBackground = useThemeColor({}, 'background');
  const border = useThemeColor({}, 'border');

  // 压按动画值
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // 处理按下事件
  const handlePressIn = () => {
    if (disabled) return;

    // 缩放动画（统一使用弹簧动画）
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  // 处理抬起事件
  const handlePressOut = () => {
    if (disabled) return;

    // 恢复动画
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        style={[
          styles.container,
          {
            backgroundColor: cardBackground,
            borderColor: border,
          },
          disabled && styles.disabled,
          containerStyle,
        ]}
      >
        {/* 左侧图标 */}
        <ThemedView style={styles.iconContainer}>
          <IconSymbol name={icon} size={24} color={tint} />
        </ThemedView>

        {/* 中间文本区域 */}
        <ThemedView style={styles.textContainer}>
          <ThemedText style={styles.title} numberOfLines={1}>
            {title}
          </ThemedText>
          {subtitle && (
            <ThemedText
              style={styles.subtitle}
              numberOfLines={1}
              lightColor={secondaryText}
              darkColor={secondaryText}
            >
              {subtitle}
            </ThemedText>
          )}
        </ThemedView>

        {/* 右侧箭头（可选） */}
        {showArrow && (
          <ThemedView style={styles.arrowContainer}>
            <Ionicons name="chevron-forward" size={20} color={secondaryText} style={styles.arrow} />
          </ThemedView>
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  // 容器
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 56,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
  },
  // 禁用状态
  disabled: {
    opacity: 0.5,
  },
  // 图标容器
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  // 文本容器
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  // 标题
  title: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 22,
  },
  // 副标题
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 2,
  },
  // 箭头容器
  arrowContainer: {
    marginLeft: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // 箭头样式
  arrow: {
    // 预留用于后续自定义
  },
});
