/**
 * 错误回退组件
 * 当模型加载失败时显示友好的错误信息和重试按钮
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { ModelError } from '@/types/models/3d-viewer';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { IconSymbol } from '@/components/ui/icon-symbol';

interface ErrorFallbackProps {
  error: ModelError;
  onRetry?: () => void;
}

export const ErrorFallback: React.FC<ErrorFallbackProps> = ({ error, onRetry }) => {
  const colorScheme = useColorScheme();
  // 确保 colorScheme 不为 null，提供默认值 'light'
  const colors = Colors[colorScheme ?? 'light'];

  // 根据错误类型显示不同的图标和消息
  const getErrorConfig = () => {
    switch (error.type) {
      case 'network':
        return {
          icon: 'wifi.slash' as const,
          title: '网络连接失败',
          description: '无法加载 3D 模型，请检查网络连接',
        };
      case 'parse':
        return {
          icon: 'exclamationmark.triangle' as const,
          title: '模型格式错误',
          description: '该 3D 模型文件格式不正确或已损坏',
        };
      case 'timeout':
        return {
          icon: 'clock' as const,
          title: '加载超时',
          description: '模型加载时间过长，请稍后重试',
        };
      case 'size':
        return {
          icon: 'doc.badge.gearshape' as const,
          title: '文件过大',
          description: '该 3D 模型文件太大，无法加载',
        };
      default:
        return {
          icon: 'xmark.circle' as const,
          title: '加载失败',
          description: error.message || '未知错误',
        };
    }
  };

  const config = getErrorConfig();

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* 错误图标 */}
        <IconSymbol name={config.icon} size={64} color={colors.tabIconDefault} />

        {/* 错误标题 */}
        <Text style={[styles.title, { color: colors.text }]}>{config.title}</Text>

        {/* 错误描述 */}
        <Text style={[styles.description, { color: colors.tabIconDefault }]}>
          {config.description}
        </Text>

        {/* 重试按钮 */}
        {onRetry && (
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: colors.tint }]}
            onPress={onRetry}
            activeOpacity={0.7}
          >
            <IconSymbol name="arrow.clockwise" size={18} color="#fff" />
            <Text style={styles.retryText}>重试</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    alignItems: 'center',
    maxWidth: 300,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 24,
  },
  retryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
