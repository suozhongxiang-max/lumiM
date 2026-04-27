/**
 * 加载页面组件
 * 用于认证状态检查等场景的加载提示
 */

import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';

/**
 * 加载屏幕组件
 * 显示一个居中的加载指示器和文本提示
 */
export function LoadingScreen() {
  // 获取当前颜色模式
  const colorScheme = useColorScheme();
  // 根据颜色模式选择对应的颜色主题
  const colors = colorScheme.isDark ? Colors.dark : Colors.light;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* 加载指示器 */}
      <ActivityIndicator size="large" color={colors.tint} />
      {/* 加载提示文本 */}
      <ThemedText style={styles.text}>加载中...</ThemedText>
    </View>
  );
}

/**
 * 样式定义
 */
const styles = StyleSheet.create({
  // 容器样式 - 占满整个屏幕并居中内容
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // 文本样式
  text: {
    marginTop: 16,
    fontSize: 16,
  },
});
