/**
 * 打印机状态卡片组件
 *
 * 设计原则（基于 UI/UX Pro Max）：
 * - IoT Dashboard 风格 - 实时状态监控
 * - Glassmorphism - 毛玻璃效果
 * - 状态驱动 - 图标+颜色+文字三重反馈
 * - 高对比度 - 确保文本可读性（4.5:1 最小对比度）
 */

import React, { useMemo } from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { Colors, BorderRadius, Spacing, FontSize, FontWeight } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useI18n } from '@/hooks/use-i18n';

/**
 * 打印机状态枚举
 *
 * - printing: 正在打印（绿色）
 * - paused: 已暂停（橙色）
 * - idle: 空闲（蓝色）
 * - offline: 离线（灰色）
 * - error: 错误（红色）
 */
export type PrinterStatus = 'printing' | 'paused' | 'idle' | 'offline' | 'error';

/**
 * 打印机状态卡片组件的 Props
 */
export interface PrinterStatusCardProps {
  /** 打印机名称 */
  printerName: string;
  /** 打印机型号 */
  printerModel: string;
  /** 当前状态 */
  status: PrinterStatus;
  /** 下拉箭头点击回调（用于切换打印机） */
  onSwitchPress?: () => void;
}

/**
 * 状态配置（颜色 + 文本 + 图标）
 * 遵循无障碍原则：不仅依赖颜色，同时使用图标和文字
 */
const STATUS_CONFIG: Record<
  PrinterStatus,
  {
    color: string; // 状态颜色
    label: string; // 状态文本（会被 i18n 覆盖）
    icon: keyof typeof Ionicons.glyphMap; // 状态图标
  }
> = {
  printing: {
    color: '#34C759', // iOS 绿色 - 正在运行
    label: 'Printing', // 默认英文，会被 i18n 覆盖
    icon: 'play-circle',
  },
  paused: {
    color: '#FF9500', // iOS 橙色 - 已暂停
    label: 'Paused',
    icon: 'pause-circle',
  },
  idle: {
    color: '#007AFF', // iOS 蓝色 - 空闲
    label: 'Idle',
    icon: 'checkmark-circle',
  },
  offline: {
    color: '#8E8E93', // iOS 灰色 - 离线
    label: 'Offline',
    icon: 'cloud-offline-outline',
  },
  error: {
    color: '#FF3B30', // iOS 红色 - 错误
    label: 'Error',
    icon: 'alert-circle',
  },
};

/**
 * 打印机状态卡片组件
 *
 * 显示打印机名称、型号、当前状态和设置按钮
 */
export function PrinterStatusCard({
  printerName,
  printerModel,
  status,
  onSwitchPress,
}: PrinterStatusCardProps) {
  // 获取主题配置
  const colorScheme = useColorScheme();
  const isDark = colorScheme.isDark;

  // 获取 i18n 翻译函数
  const { t } = useI18n();

  // 获取主题颜色
  const backgroundColor = isDark ? Colors.dark.cardBackground : Colors.light.cardBackground;
  const textColor = isDark ? Colors.dark.text : Colors.light.text;
  const secondaryTextColor = isDark ? Colors.dark.secondaryText : Colors.light.secondaryText;
  const borderColor = isDark ? Colors.dark.border : Colors.light.border;

  // 获取当前状态配置（使用 useMemo 缓存翻译后的配置）
  const statusConfig = useMemo(() => {
    const baseConfig = STATUS_CONFIG[status];
    return {
      ...baseConfig,
      label: t(`printer.status.${status}`),
    };
  }, [status, t]);

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
      {/* 顶部：打印机信息和下拉箭头 */}
      <View style={styles.header}>
        {/* 左侧：打印机图标和信息 */}
        <View style={styles.headerLeft}>
          {/* 打印机图标容器 */}
          <View
            style={[
              styles.printerIconContainer,
              {
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 122, 255, 0.1)', // 蓝色背景
              },
            ]}
          >
            <Ionicons
              name="hardware-chip-outline"
              size={24}
              color="#007AFF" // iOS 蓝色
            />
          </View>

          {/* 打印机名称和型号 */}
          <View style={styles.printerInfo}>
            <ThemedText
              style={[styles.printerName, { color: textColor }]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {printerName}
            </ThemedText>
            <ThemedText
              style={[styles.printerModel, { color: secondaryTextColor }]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {printerModel}
            </ThemedText>
          </View>
        </View>

        {/* 右侧：下拉箭头按钮（用于切换打印机） */}
        {onSwitchPress && (
          <TouchableOpacity
            onPress={onSwitchPress}
            style={[
              styles.switchButton,
              {
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
              },
            ]}
            activeOpacity={0.7}
          >
            <Ionicons
              name="chevron-down"
              size={20}
              color={isDark ? Colors.dark.icon : Colors.light.icon}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* 分隔线 */}
      <View style={[styles.divider, { backgroundColor: borderColor }]} />

      {/* 底部：状态信息 */}
      <View style={styles.statusContainer}>
        <View style={styles.statusBadge}>
          {/* 状态图标 */}
          <Ionicons name={statusConfig.icon} size={20} color={statusConfig.color} />
          {/* 状态文本 */}
          <ThemedText style={[styles.statusText, { color: statusConfig.color }]}>
            {statusConfig.label}
          </ThemedText>
        </View>

        {/* 状态指示器（动态脉冲效果，仅在打印中时显示） */}
        {status === 'printing' && (
          <View style={styles.statusIndicator}>
            <View
              style={[
                styles.statusDot,
                {
                  backgroundColor: statusConfig.color,
                },
              ]}
            />
          </View>
        )}
      </View>
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
    // 移除 marginHorizontal，由父容器的 paddingHorizontal 统一控制
    borderWidth: StyleSheet.hairlineWidth, // 细边框
  },

  // 头部容器
  header: {
    flexDirection: 'row', // 水平布局
    alignItems: 'center', // 垂直居中
    justifyContent: 'space-between', // 两端对齐
  },

  // 头部左侧（图标 + 信息）
  headerLeft: {
    flexDirection: 'row', // 水平布局
    alignItems: 'center', // 垂直居中
    flex: 1, // 占据剩余空间
    marginRight: Spacing.md, // 右侧间距
  },

  // 打印机图标容器
  printerIconContainer: {
    width: 48, // 宽度
    height: 48, // 高度
    borderRadius: BorderRadius.md, // 圆角
    alignItems: 'center', // 水平居中
    justifyContent: 'center', // 垂直居中
    marginRight: Spacing.md, // 右侧间距
  },

  // 打印机信息容器
  printerInfo: {
    flex: 1, // 占据剩余空间
    justifyContent: 'center', // 垂直居中
  },

  // 打印机名称
  printerName: {
    fontSize: FontSize.lg, // 字号 20
    fontWeight: FontWeight.semibold, // 字重 600
    marginBottom: 2, // 底部间距
  },

  // 打印机型号
  printerModel: {
    fontSize: FontSize.sm, // 字号 14
    fontWeight: FontWeight.regular, // 字重 400
  },

  // 下拉箭头按钮（用于切换打印机）
  switchButton: {
    width: 36, // 宽度
    height: 36, // 高度
    borderRadius: BorderRadius.sm, // 圆角
    alignItems: 'center', // 水平居中
    justifyContent: 'center', // 垂直居中
  },

  // 分隔线
  divider: {
    height: StyleSheet.hairlineWidth, // 1像素线
    marginVertical: Spacing.md, // 上下间距 12
  },

  // 状态容器
  statusContainer: {
    flexDirection: 'row', // 水平布局
    alignItems: 'center', // 垂直居中
    justifyContent: 'space-between', // 两端对齐
  },

  // 状态徽章
  statusBadge: {
    flexDirection: 'row', // 水平布局
    alignItems: 'center', // 垂直居中
    gap: Spacing.xs, // 间距 4
  },

  // 状态文本
  statusText: {
    fontSize: FontSize.md, // 字号 16
    fontWeight: FontWeight.medium, // 字重 500
  },

  // 状态指示器容器
  statusIndicator: {
    flexDirection: 'row', // 水平布局
    alignItems: 'center', // 垂直居中
  },

  // 状态指示点
  statusDot: {
    width: 8, // 宽度
    height: 8, // 高度
    borderRadius: 4, // 圆形
  },
});
