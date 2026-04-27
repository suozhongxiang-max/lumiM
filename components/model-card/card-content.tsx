/**
 * 统一的 CardContent 子组件
 * 显示卡片标题和创作者信息
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors, FontWeight, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import type { CardContentProps } from './types';

/**
 * CardContent 组件
 *
 * @param title - 模型标题
 * @param creator - 创作者（可选）
 * @param likes - 点赞数（用于布局，不在此组件显示）
 */
export function CardContent({ title, creator, likes }: CardContentProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme.isDark;

  return (
    <View style={styles.container}>
      {/* 模型标题 */}
      <Text
        style={[
          styles.title,
          {
            color: isDark ? Colors.dark.text : Colors.light.text,
          },
        ]}
        numberOfLines={1} // 单行显示，超出部分省略
      >
        {title}
      </Text>

      {/* 创作者信息（可选） */}
      {creator && (
        <Text
          style={[
            styles.creator,
            {
              // 使用主题色
              color: isDark ? '#0A84FF' : '#007AFF',
            },
          ]}
          numberOfLines={1} // 单行显示，超出部分省略
        >
          by {creator}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  // 容器
  container: {
    flex: 1,
  },
  // 标题
  title: {
    fontSize: 15,
    fontWeight: FontWeight.bold,
    marginBottom: Spacing.xs,
    lineHeight: 20,
  },
  // 创作者
  creator: {
    fontSize: 13,
    fontWeight: FontWeight.regular,
    marginBottom: Spacing.md,
    lineHeight: 18,
  },
});
