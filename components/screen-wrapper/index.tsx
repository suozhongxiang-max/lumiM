import { ReactNode } from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import { SafeAreaView, Edge } from 'react-native-safe-area-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';

interface ScreenWrapperProps {
  children: ReactNode;
  /**
   * 哪些边需要安全区域
   * 默认: ['top'] - 只处理顶部安全区域（底部由 Tab Bar 处理）
   */
  edges?: Edge[];
  /**
   * 自定义样式
   */
  style?: ViewStyle;
  /**
   * 背景颜色（如果不指定，使用主题默认颜色）
   */
  backgroundColor?: string;
}

/**
 * 屏幕包裹组件
 * 统一处理安全区域，避免每个页面都要手动添加 paddingTop
 *
 * @example
 * // 基础使用（默认处理顶部安全区域）
 * <ScreenWrapper>
 *   <View>内容</View>
 * </ScreenWrapper>
 *
 * @example
 * // 全屏页面（不需要安全区域）
 * <ScreenWrapper edges={[]}>
 *   <Image />
 * </ScreenWrapper>
 *
 * @example
 * // 处理顶部和底部
 * <ScreenWrapper edges={['top', 'bottom']}>
 *   <View>内容</View>
 * </ScreenWrapper>
 */
export function ScreenWrapper({
  children,
  edges = ['top'], // 默认只处理顶部，底部由 Tab Bar 自动处理
  style,
  backgroundColor,
}: ScreenWrapperProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme.isDark;

  // 默认背景色 - 使用统一的主题颜色
  const defaultBackgroundColor = isDark ? Colors.dark.background : Colors.light.background;

  return (
    <SafeAreaView
      style={[
        styles.container,
        {
          backgroundColor: backgroundColor || defaultBackgroundColor,
        },
        style,
      ]}
      edges={edges}
    >
      {children}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
