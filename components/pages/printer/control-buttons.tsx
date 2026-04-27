/**
 * 操作按钮组组件
 *
 * 设计原则（基于 UI/UX Pro Max）：
 * - Primary/Secondary Actions - 清晰的主次按钮关系
 * - Visual Feedback - 图标+颜色+文字三重反馈
 * - Loading States - 操作中显示加载状态
 * - Accessibility - 支持触觉反馈和屏幕阅读器
 */

import { ThemedText } from '@/components/themed-text';
import { BorderRadius, Colors, FontSize, FontWeight, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useI18n } from '@/hooks/use-i18n';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, TouchableOpacity, View } from 'react-native';
import type { PrinterStatus } from './printer-status-card';

/**
 * 操作按钮组组件的 Props
 */
export interface ControlButtonsProps {
  /** 打印机当前状态 */
  status: PrinterStatus;
  /** 暂停按钮点击回调 */
  onPause?: () => Promise<void> | void;
  /** 继续按钮点击回调 */
  onResume?: () => Promise<void> | void;
  /** 停止按钮点击回调 */
  onStop?: () => Promise<void> | void;
  /** 是否禁用所有按钮 */
  disabled?: boolean;
}

/**
 * 操作按钮组组件
 *
 * 根据打印机状态显示不同的控制按钮
 */
export function ControlButtons({
  status,
  onPause,
  onResume,
  onStop,
  disabled = false,
}: ControlButtonsProps) {
  // 获取主题配置
  const colorScheme = useColorScheme();
  const isDark = colorScheme.isDark;

  // 获取 i18n 翻译函数
  const { t } = useI18n();

  // 加载状态
  const [isPausing, setIsPausing] = useState(false);
  const [isResuming, setIsResuming] = useState(false);
  const [isStopping, setIsStopping] = useState(false);

  // 检查是否可以操作
  const canOperate = status === 'printing' || status === 'paused';
  const isDisabled = disabled || !canOperate;

  /**
   * 处理暂停操作
   */
  const handlePause = async () => {
    if (!onPause || isPausing) return;

    // 触觉反馈
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    setIsPausing(true);
    try {
      await onPause();
    } catch (error) {
      Alert.alert(t('dialog.printer.operationFailed'), t('printer.pauseFailed'));
    } finally {
      setIsPausing(false);
    }
  };

  /**
   * 处理继续操作
   */
  const handleResume = async () => {
    if (!onResume || isResuming) return;

    // 触觉反馈
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    setIsResuming(true);
    try {
      await onResume();
    } catch (error) {
      Alert.alert(t('dialog.printer.operationFailed'), t('printer.resumeFailed'));
    } finally {
      setIsResuming(false);
    }
  };

  /**
   * 处理停止操作（需要确认）
   */
  const handleStop = async () => {
    if (!onStop || isStopping) return;

    // 触觉反馈
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // 二次确认
    Alert.alert(t('printer.stopConfirm'), t('printer.stopConfirmMessage'), [
      {
        text: t('common.cancel'),
        style: 'cancel',
      },
      {
        text: t('printer.stop'),
        style: 'destructive',
        onPress: async () => {
          // 触觉反馈
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

          setIsStopping(true);
          try {
            await onStop();
          } catch (error) {
            Alert.alert(t('dialog.printer.operationFailed'), t('printer.stopFailed'));
          } finally {
            setIsStopping(false);
          }
        },
      },
    ]);
  };

  // 是否有任何操作正在进行
  const isAnyLoading = isPausing || isResuming || isStopping;

  return (
    <View style={styles.container}>
      {/* 主操作按钮（暂停/继续） */}
      {status === 'printing' ? (
        // 打印中 - 显示暂停按钮
        <TouchableOpacity
          onPress={handlePause}
          disabled={isDisabled || isAnyLoading}
          style={[
            styles.primaryButton,
            {
              backgroundColor: '#FF9500', // iOS 橙色
              opacity: isDisabled || isAnyLoading ? 0.5 : 1,
            },
          ]}
          activeOpacity={0.8}
        >
          {isPausing ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <>
              <Ionicons name="pause" size={20} color="#FFFFFF" />
              <ThemedText style={styles.primaryButtonText}>{t('printer.pause')}</ThemedText>
            </>
          )}
        </TouchableOpacity>
      ) : status === 'paused' ? (
        // 已暂停 - 显示继续按钮
        <TouchableOpacity
          onPress={handleResume}
          disabled={isDisabled || isAnyLoading}
          style={[
            styles.primaryButton,
            {
              backgroundColor: '#34C759', // iOS 绿色
              opacity: isDisabled || isAnyLoading ? 0.5 : 1,
            },
          ]}
          activeOpacity={0.8}
        >
          {isResuming ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <>
              <Ionicons name="play" size={20} color="#FFFFFF" />
              <ThemedText style={styles.primaryButtonText}>{t('printer.resume')}</ThemedText>
            </>
          )}
        </TouchableOpacity>
      ) : (
        // 其他状态 - 禁用的占位按钮
        <View
          style={[
            styles.primaryButton,
            {
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
              opacity: 0.5,
            },
          ]}
        >
          <Ionicons name="pause" size={20} color={isDark ? Colors.dark.text : Colors.light.text} />
          <ThemedText
            style={[
              styles.primaryButtonText,
              { color: isDark ? Colors.dark.text : Colors.light.text },
            ]}
          >
            {t('printer.pause')}
          </ThemedText>
        </View>
      )}

      {/* 次要操作按钮（停止） */}
      <TouchableOpacity
        onPress={handleStop}
        disabled={isDisabled || isAnyLoading}
        style={[
          styles.secondaryButton,
          {
            borderColor: '#FF3B30', // iOS 红色
            opacity: isDisabled || isAnyLoading ? 0.5 : 1,
          },
        ]}
        activeOpacity={0.8}
      >
        {isStopping ? (
          <ActivityIndicator color="#FF3B30" size="small" />
        ) : (
          <>
            <Ionicons name="stop" size={20} color="#FF3B30" />
            <ThemedText style={[styles.secondaryButtonText, { color: '#FF3B30' }]}>
              {t('printer.stop')}
            </ThemedText>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}

/**
 * 样式定义
 */
const styles = StyleSheet.create({
  // 容器
  container: {
    flexDirection: 'row', // 水平布局
    gap: Spacing.md, // 按钮间距
    // 移除所有 margin，由父容器的 paddingHorizontal、gap 和 paddingBottom 统一控制
  },

  // 主操作按钮（暂停/继续）
  primaryButton: {
    flex: 1, // 占据剩余空间
    height: 52, // 高度
    borderRadius: BorderRadius.md, // 圆角
    flexDirection: 'row', // 水平布局
    alignItems: 'center', // 垂直居中
    justifyContent: 'center', // 水平居中
    gap: Spacing.xs, // 图标和文字间距
    // iOS 风格阴影
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    // Android elevation
    elevation: 2,
  },

  // 主操作按钮文字
  primaryButtonText: {
    color: '#FFFFFF', // 白色文字
    fontSize: FontSize.md, // 字号 16
    fontWeight: FontWeight.semibold, // 字重 600
  },

  // 次要操作按钮（停止）
  secondaryButton: {
    flex: 1, // 占据剩余空间
    height: 52, // 高度
    borderRadius: BorderRadius.md, // 圆角
    flexDirection: 'row', // 水平布局
    alignItems: 'center', // 垂直居中
    justifyContent: 'center', // 水平居中
    gap: Spacing.xs, // 图标和文字间距
    borderWidth: 2, // 边框宽度
    backgroundColor: 'transparent', // 透明背景
  },

  // 次要操作按钮文字
  secondaryButtonText: {
    fontSize: FontSize.md, // 字号 16
    fontWeight: FontWeight.semibold, // 字重 600
  },
});
