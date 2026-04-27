/**
 * 加载进度条组件
 * 显示模型加载的百分比进度
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import type { ModelLoadProgress } from '@/types/models/3d-viewer';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface ProgressBarProps {
  progress: ModelLoadProgress;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ progress }) => {
  const colorScheme = useColorScheme();
  const widthAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(widthAnim, {
      toValue: progress.percentage,
      duration: 300,
      useNativeDriver: false, // width 不支持 native driver
    }).start();
  }, [progress.percentage, widthAnim]);

  // 确保 colorScheme 不为 null，提供默认值 'light'
  const colors = Colors[colorScheme ?? 'light'];

  // 格式化文件大小
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  const progressWidth = widthAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.container}>
      {/* 进度条 */}
      <View style={[styles.progressTrack, { backgroundColor: colors.tabIconDefault }]}>
        <Animated.View
          style={[styles.progressFill, { width: progressWidth, backgroundColor: colors.tint }]}
        />
      </View>

      {/* 进度信息 */}
      <View style={styles.infoRow}>
        <Text style={[styles.percentageText, { color: colors.text }]}>
          {progress.percentage.toFixed(0)}%
        </Text>
        <Text style={[styles.sizeText, { color: colors.tabIconDefault }]}>
          {formatBytes(progress.loaded)} / {formatBytes(progress.total)}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '80%',
    paddingVertical: 20,
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  percentageText: {
    fontSize: 16,
    fontWeight: '600',
  },
  sizeText: {
    fontSize: 12,
  },
});
