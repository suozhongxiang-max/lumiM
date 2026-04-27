/**
 * 打印机选项项组件
 * 显示单个打印机的信息，包括名称、型号、状态、进度等
 */

import React, { useRef, useMemo } from 'react';
import { View, Text, StyleSheet, Animated, Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { useI18n } from '@/hooks/use-i18n';
import { Colors } from '@/constants/theme';
import { PrinterStatus } from '@/types';
import { PrinterOptionItemProps } from './types';

/**
 * 打印机状态配置
 * 定义不同状态的颜色、标签和图标
 */
const STATUS_CONFIG: Record<
  PrinterStatus,
  { color: string; label: string; icon: keyof typeof Ionicons.glyphMap }
> = {
  // 打印中：绿色
  printing: { color: '#34C759', label: '打印中', icon: 'play-circle' },
  // 已暂停：橙色
  paused: { color: '#FF9500', label: '已暂停', icon: 'pause-circle' },
  // 空闲：蓝色
  idle: { color: '#007AFF', label: '空闲', icon: 'checkmark-circle' },
  // 离线：灰色
  offline: { color: '#8E8E93', label: '离线', icon: 'cloud-offline-outline' },
  // 错误：红色
  error: { color: '#FF3B30', label: '错误', icon: 'alert-circle' },
};

/**
 * 打印机选项项组件
 */
export function PrinterOptionItem({
  printer,
  isSelected,
  onPress,
  onDelete,
}: PrinterOptionItemProps) {
  // 获取当前主题
  const colorScheme = useColorScheme();
  const isDark = colorScheme.isDark;

  // 获取 i18n 翻译函数
  const { t } = useI18n();

  // 缩放动画值
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // 获取状态配置（使用 useMemo 缓存翻译后的配置）
  const statusConfig = useMemo(() => {
    const baseConfig = STATUS_CONFIG[printer.status];
    return {
      ...baseConfig,
      label: t(`printer.status.${printer.status}`),
    };
  }, [printer.status, t]);

  /**
   * 处理按下事件
   * 触发缩放动画和触觉反馈
   */
  const handlePressIn = () => {
    // 缩放至 0.97
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
      speed: 50,
      bounciness: 0,
    }).start();
  };

  /**
   * 处理松开事件
   * 恢复原始大小
   */
  const handlePressOut = () => {
    // 恢复至 1.0
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  /**
   * 处理点击事件
   * 触发触觉反馈并调用回调
   */
  const handlePress = () => {
    // Medium 强度触觉反馈
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // 调用回调
    onPress();
  };

  /**
   * 处理删除按钮点击
   * 阻止事件冒泡，避免触发选择操作
   */
  const handleDeletePress = (event: any) => {
    // 阻止事件冒泡
    event?.stopPropagation?.();
    // Medium 强度触觉反馈
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // 调用删除回调
    onDelete(printer.deviceId, printer.deviceName);
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        style={[
          styles.container,
          {
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
            borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
          },
          // 选中状态高亮
          isSelected && {
            backgroundColor: 'rgba(0, 122, 255, 0.08)',
            borderColor: 'rgba(0, 122, 255, 0.3)',
            borderWidth: 1,
          },
        ]}
      >
        {/* 左侧：打印机图标 */}
        <View
          style={[
            styles.iconContainer,
            {
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
            },
          ]}
        >
          <Ionicons
            name="hardware-chip-outline"
            size={24}
            color={isDark ? Colors.dark.text : Colors.light.text}
          />
        </View>

        {/* 中间：打印机信息 */}
        <View style={styles.infoContainer}>
          {/* 打印机名称 */}
          <Text
            style={[styles.name, { color: isDark ? Colors.dark.text : Colors.light.text }]}
            numberOfLines={1}
          >
            {printer.deviceName}
          </Text>

          {/* 型号和状态 */}
          <View style={styles.metaRow}>
            {/* 型号 */}
            <Text
              style={[styles.model, { color: isDark ? Colors.dark.icon : Colors.light.icon }]}
              numberOfLines={1}
            >
              {printer.model}
            </Text>

            {/* 分隔符 */}
            <View
              style={[
                styles.separator,
                { backgroundColor: isDark ? Colors.dark.icon : Colors.light.icon },
              ]}
            />

            {/* 状态徽章 */}
            <View style={styles.statusBadge}>
              <Ionicons name={statusConfig.icon} size={12} color={statusConfig.color} />
              <Text style={[styles.statusText, { color: statusConfig.color }]}>
                {statusConfig.label}
              </Text>
            </View>
          </View>

          {/* 任务进度条（仅打印中时显示） */}
          {printer.status === 'printing' && printer.currentTaskProgress !== undefined && (
            <View style={styles.progressContainer}>
              {/* 任务名称 */}
              {printer.currentTaskName && (
                <Text
                  style={[
                    styles.taskName,
                    { color: isDark ? Colors.dark.icon : Colors.light.icon },
                  ]}
                  numberOfLines={1}
                >
                  {printer.currentTaskName}
                </Text>
              )}

              {/* 进度条 */}
              <View style={styles.progressBarContainer}>
                <View
                  style={[
                    styles.progressBarBackground,
                    {
                      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.progressBarFill,
                      {
                        width: `${printer.currentTaskProgress}%`,
                        backgroundColor: statusConfig.color,
                      },
                    ]}
                  />
                </View>

                {/* 进度百分比 */}
                <Text
                  style={[
                    styles.progressText,
                    { color: isDark ? Colors.dark.icon : Colors.light.icon },
                  ]}
                >
                  {printer.currentTaskProgress}%
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* 右侧：选中标记或删除按钮 */}
        {isSelected ? (
          // 选中状态：显示勾选图标
          <View style={styles.checkmarkContainer}>
            <Ionicons name="checkmark-circle" size={24} color="#007AFF" />
          </View>
        ) : (
          // 未选中状态：显示删除按钮
          <Pressable
            onPress={handleDeletePress}
            style={styles.deleteButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="trash-outline" size={20} color={isDark ? '#FF6B6B' : '#FF3B30'} />
          </Pressable>
        )}
      </Pressable>
    </Animated.View>
  );
}

/**
 * 样式定义
 */
const styles = StyleSheet.create({
  // 容器
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },

  // 图标容器
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

  // 信息容器
  infoContainer: {
    flex: 1,
  },

  // 打印机名称
  name: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },

  // 元数据行
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  // 型号
  model: {
    fontSize: 13,
    fontWeight: '400',
  },

  // 分隔符
  separator: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    marginHorizontal: 8,
  },

  // 状态徽章
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  // 状态文字
  statusText: {
    fontSize: 13,
    fontWeight: '500',
  },

  // 进度容器
  progressContainer: {
    marginTop: 8,
  },

  // 任务名称
  taskName: {
    fontSize: 12,
    fontWeight: '400',
    marginBottom: 4,
  },

  // 进度条容器
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  // 进度条背景
  progressBarBackground: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },

  // 进度条填充
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
  },

  // 进度文字
  progressText: {
    fontSize: 12,
    fontWeight: '500',
    minWidth: 36,
    textAlign: 'right',
  },

  // 选中标记容器
  checkmarkContainer: {
    marginLeft: 12,
  },

  // 删除按钮
  deleteButton: {
    marginLeft: 12,
    padding: 4,
  },
});
