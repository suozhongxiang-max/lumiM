/**
 * 任务进度卡片组件
 *
 * 设计原则（基于 UI/UX Pro Max）：
 * - Real-Time Monitoring - 实时进度更新
 * - Data Visualization - 进度条视觉化
 * - Information Hierarchy - 清晰的信息层次
 * - 流畅动画 - 进度条平滑过渡（200-300ms）
 */

import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { Colors, BorderRadius, Spacing, FontSize, FontWeight } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useI18n } from '@/hooks/use-i18n';

/**
 * 任务进度卡片组件的 Props
 */
export interface TaskProgressCardProps {
  /** 任务名称 */
  taskName: string;
  /** 进度百分比（0-100） */
  progress: number;
  /** 已打印时间（秒） */
  elapsedTime: number;
  /** 剩余时间（秒） */
  remainingTime: number;
  /** 当前层数（可选） */
  currentLayer?: number;
  /** 总层数（可选） */
  totalLayers?: number;
}

/**
 * 格式化时间（秒 -> HH:MM:SS）
 *
 * @param seconds 秒数
 * @returns 格式化后的时间字符串
 */
function formatTime(seconds: number): string {
  // 计算小时数
  const hours = Math.floor(seconds / 3600);
  // 计算分钟数
  const minutes = Math.floor((seconds % 3600) / 60);
  // 计算剩余秒数
  const secs = Math.floor(seconds % 60);

  // 格式化为 HH:MM:SS
  const hoursStr = hours.toString().padStart(2, '0');
  const minutesStr = minutes.toString().padStart(2, '0');
  const secsStr = secs.toString().padStart(2, '0');

  return `${hoursStr}:${minutesStr}:${secsStr}`;
}

/**
 * 任务进度卡片组件
 *
 * 显示任务名称、进度条、时间信息和层数信息
 */
export function TaskProgressCard({
  taskName,
  progress,
  elapsedTime,
  remainingTime,
  currentLayer,
  totalLayers,
}: TaskProgressCardProps) {
  // 获取 i18n 翻译函数
  const { t } = useI18n();

  // 获取主题配置
  const colorScheme = useColorScheme();
  const isDark = colorScheme.isDark;

  // 获取主题颜色
  const backgroundColor = isDark ? Colors.dark.cardBackground : Colors.light.cardBackground;
  const textColor = isDark ? Colors.dark.text : Colors.light.text;
  const secondaryTextColor = isDark ? Colors.dark.secondaryText : Colors.light.secondaryText;
  const tertiaryTextColor = isDark ? Colors.dark.tertiaryText : Colors.light.tertiaryText;
  const borderColor = isDark ? Colors.dark.border : Colors.light.border;

  // 进度条动画值
  const progressAnim = useRef(new Animated.Value(0)).current;

  // 当进度变化时，动画更新进度条
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progress, // 目标值
      duration: 300, // 持续时间 300ms（遵循 UI/UX 指南）
      useNativeDriver: false, // 宽度动画不支持原生驱动
    }).start();
  }, [progress, progressAnim]);

  // 进度条宽度（百分比）
  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 100], // 输入范围
    outputRange: ['0%', '100%'], // 输出范围
  });

  // 进度颜色（根据进度百分比动态变化）
  const progressColor = progress < 30 ? '#FF9500' : progress < 70 ? '#007AFF' : '#34C759';

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor,
          borderColor,
          // iOS 风格阴影
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: isDark ? 0.3 : 0.08,
          shadowRadius: 8,
          // Android elevation
          elevation: 3,
        },
      ]}
    >
      {/* 顶部：任务名称 */}
      <View style={styles.header}>
        <Ionicons name="document-text-outline" size={20} color={textColor} />
        <ThemedText
          style={[styles.taskName, { color: textColor }]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {taskName}
        </ThemedText>
      </View>

      {/* 进度条容器 */}
      <View style={styles.progressContainer}>
        {/* 进度条背景 */}
        <View
          style={[
            styles.progressTrack,
            {
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
            },
          ]}
        >
          {/* 进度条填充（动画） */}
          <Animated.View
            style={[
              styles.progressBar,
              {
                width: progressWidth, // 动画宽度
                backgroundColor: progressColor, // 动态颜色
              },
            ]}
          />
        </View>

        {/* 进度百分比 */}
        <ThemedText style={[styles.progressText, { color: textColor }]}>
          {progress.toFixed(0)}%
        </ThemedText>
      </View>

      {/* 时间信息 */}
      <View style={styles.timeContainer}>
        {/* 已打印时间 */}
        <View style={styles.timeItem}>
          <Ionicons name="time-outline" size={16} color={secondaryTextColor} />
          <View style={styles.timeInfo}>
            <ThemedText style={[styles.timeLabel, { color: tertiaryTextColor }]}>
              {t('taskProgress.printed')}
            </ThemedText>
            <ThemedText style={[styles.timeValue, { color: secondaryTextColor }]}>
              {formatTime(elapsedTime)}
            </ThemedText>
          </View>
        </View>

        {/* 剩余时间 */}
        <View style={styles.timeItem}>
          <Ionicons name="hourglass-outline" size={16} color={secondaryTextColor} />
          <View style={styles.timeInfo}>
            <ThemedText style={[styles.timeLabel, { color: tertiaryTextColor }]}>
              {t('taskProgress.remaining')}
            </ThemedText>
            <ThemedText style={[styles.timeValue, { color: secondaryTextColor }]}>
              {formatTime(remainingTime)}
            </ThemedText>
          </View>
        </View>
      </View>

      {/* 层数信息（如果提供） */}
      {currentLayer !== undefined && totalLayers !== undefined && (
        <>
          {/* 分隔线 */}
          <View style={[styles.divider, { backgroundColor: borderColor }]} />

          {/* 层数显示 */}
          <View style={styles.layerContainer}>
            <Ionicons name="layers-outline" size={16} color={secondaryTextColor} />
            <ThemedText style={[styles.layerText, { color: secondaryTextColor }]}>
              {t('taskProgress.layer', { current: currentLayer, total: totalLayers })}
            </ThemedText>
          </View>
        </>
      )}
    </View>
  );
}

/**
 * 样式定义
 */
const styles = StyleSheet.create({
  // 卡片容器
  card: {
    borderRadius: BorderRadius.lg, // 圆角
    padding: Spacing.lg, // 内边距
    // 移除 marginHorizontal 和 marginTop，由父容器的 paddingHorizontal 和 gap 统一控制
    borderWidth: StyleSheet.hairlineWidth, // 细边框
  },

  // 头部容器（任务名称）
  header: {
    flexDirection: 'row', // 水平布局
    alignItems: 'center', // 垂直居中
    marginBottom: Spacing.md, // 底部间距
    gap: Spacing.xs, // 图标和文本间距
  },

  // 任务名称
  taskName: {
    fontSize: FontSize.md, // 字号 16
    fontWeight: FontWeight.semibold, // 字重 600
    flex: 1, // 占据剩余空间
  },

  // 进度条容器
  progressContainer: {
    flexDirection: 'row', // 水平布局
    alignItems: 'center', // 垂直居中
    marginBottom: Spacing.lg, // 底部间距
    gap: Spacing.md, // 间距
  },

  // 进度条轨道（背景）
  progressTrack: {
    flex: 1, // 占据剩余空间
    height: 8, // 高度
    borderRadius: 4, // 圆角
    overflow: 'hidden', // 裁剪溢出内容
  },

  // 进度条（填充）
  progressBar: {
    height: '100%', // 填满高度
    borderRadius: 4, // 圆角
  },

  // 进度百分比文本
  progressText: {
    fontSize: FontSize.md, // 字号 16
    fontWeight: FontWeight.semibold, // 字重 600
    minWidth: 45, // 最小宽度（保持对齐）
    textAlign: 'right', // 右对齐
  },

  // 时间信息容器
  timeContainer: {
    flexDirection: 'row', // 水平布局
    justifyContent: 'space-between', // 两端对齐
  },

  // 时间项
  timeItem: {
    flexDirection: 'row', // 水平布局
    alignItems: 'center', // 垂直居中
    gap: Spacing.xs, // 间距
  },

  // 时间信息容器
  timeInfo: {
    flexDirection: 'column', // 垂直布局
  },

  // 时间标签
  timeLabel: {
    fontSize: FontSize.xs, // 字号 12
    fontWeight: FontWeight.regular, // 字重 400
    marginBottom: 2, // 底部间距
  },

  // 时间值
  timeValue: {
    fontSize: FontSize.sm, // 字号 14
    fontWeight: FontWeight.medium, // 字重 500
  },

  // 分隔线
  divider: {
    height: StyleSheet.hairlineWidth, // 1像素线
    marginVertical: Spacing.md, // 上下间距
  },

  // 层数容器
  layerContainer: {
    flexDirection: 'row', // 水平布局
    alignItems: 'center', // 垂直居中
    gap: Spacing.xs, // 间距
  },

  // 层数文本
  layerText: {
    fontSize: FontSize.sm, // 字号 14
    fontWeight: FontWeight.medium, // 字重 500
  },
});
