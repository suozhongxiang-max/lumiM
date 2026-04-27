/**
 * 打印机选择器主组件
 * 使用 Modal 弹窗展示打印机列表，支持选择和切换
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Animated,
  Pressable,
  ScrollView,
  Platform,
  Alert,
} from 'react-native';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { useI18n } from '@/hooks/use-i18n';
import { Colors } from '@/constants/theme';
import { shadows } from '@/styles/shadows';
import { logger } from '@/utils/logger';
import { PrinterOptionItem } from './printer-option-item';
import { PrinterSelectorProps } from './types';

/**
 * 打印机选择器主组件
 */
export function PrinterSelector({
  visible,
  printers,
  selectedPrinterId,
  onSelect,
  onClose,
  onAddPrinter,
  onDelete,
}: PrinterSelectorProps) {
  // 获取当前主题
  const colorScheme = useColorScheme();
  const isDark = colorScheme.isDark;

  // 获取 i18n 翻译函数
  const { t } = useI18n();

  // 动画值：遮罩淡入淡出
  const fadeAnim = useRef(new Animated.Value(0)).current;
  // 动画值：内容缩放弹出
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  /**
   * 监听 visible 变化，触发进入/退出动画
   */
  useEffect(() => {
    if (visible) {
      // 进入动画：遮罩淡入 + 内容缩放弹出
      Animated.parallel([
        // 遮罩淡入（300ms）
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        // 内容缩放弹出（spring 动画）
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          speed: 12,
          bounciness: 4,
        }),
      ]).start();
    } else {
      // 退出动画：淡出 + 缩小
      Animated.parallel([
        // 遮罩淡出（200ms）
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        // 内容缩小（200ms）
        Animated.timing(scaleAnim, {
          toValue: 0.9,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, fadeAnim, scaleAnim]);

  /**
   * 处理遮罩点击
   * 点击遮罩关闭选择器
   */
  const handleOverlayPress = () => {
    // Medium 强度触觉反馈
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // 关闭选择器
    onClose();
  };

  /**
   * 处理关闭按钮点击
   */
  const handleClosePress = () => {
    // Medium 强度触觉反馈
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // 关闭选择器
    onClose();
  };

  /**
   * 处理添加打印机按钮点击
   */
  const handleAddPrinter = () => {
    // Medium 强度触觉反馈
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // 调用添加打印机回调
    onAddPrinter();
  };

  /**
   * 处理删除打印机
   * 显示二次确认对话框
   */
  const handleDeletePrinter = (deviceId: string, deviceName: string) => {
    logger.info('[PrinterSelector] 请求删除打印机:', deviceId, deviceName);

    // 显示二次确认对话框
    Alert.alert(
      t('printer.selector.unbindConfirm'),
      t('printer.selector.unbindMessage', { deviceName }),
      [
        {
          text: t('common.cancel'),
          style: 'cancel',
          onPress: () => {
            logger.info('[PrinterSelector] 取消删除打印机');
          },
        },
        {
          text: t('printer.selector.confirmUnbind'),
          style: 'destructive',
          onPress: () => {
            logger.info('[PrinterSelector] 确认删除打印机:', deviceId);
            // 调用删除回调
            onDelete(deviceId);
          },
        },
      ]
    );
  };

  /**
   * 处理打印机选择
   */
  const handleSelectPrinter = (deviceId: string) => {
    // 调用选择回调
    onSelect(deviceId);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      {/* 半透明遮罩 */}
      <Animated.View
        style={[
          styles.overlay,
          {
            opacity: fadeAnim,
          },
        ]}
      >
        {/* 遮罩点击区域 */}
        <Pressable style={StyleSheet.absoluteFill} onPress={handleOverlayPress} />

        {/* 内容区域 */}
        <Animated.View
          style={[
            styles.contentWrapper,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* BlurView 毛玻璃容器 */}
          <BlurView
            intensity={isDark ? 60 : 80}
            tint={isDark ? 'dark' : 'light'}
            style={[styles.content, shadows.large(isDark)]}
          >
            {/* 标题栏 */}
            <View style={styles.header}>
              {/* 标题 */}
              <View style={styles.titleContainer}>
                <Ionicons
                  name="hardware-chip"
                  size={24}
                  color={isDark ? Colors.dark.text : Colors.light.text}
                />
                <Text
                  style={[styles.title, { color: isDark ? Colors.dark.text : Colors.light.text }]}
                >
                  {t('printer.selector.title')}
                </Text>
              </View>

              {/* 关闭按钮 */}
              <Pressable onPress={handleClosePress} style={styles.closeButton}>
                <View
                  style={[
                    styles.closeButtonBackground,
                    {
                      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                    },
                  ]}
                >
                  <Ionicons
                    name="close"
                    size={20}
                    color={isDark ? Colors.dark.icon : Colors.light.icon}
                  />
                </View>
              </Pressable>
            </View>

            {/* 分隔线 */}
            <View
              style={[
                styles.divider,
                {
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                },
              ]}
            />

            {/* 打印机列表 */}
            <ScrollView
              style={styles.listContainer}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
            >
              {printers.map(printer => (
                <PrinterOptionItem
                  key={printer.deviceId}
                  printer={printer}
                  isSelected={printer.deviceId === selectedPrinterId}
                  onPress={() => handleSelectPrinter(printer.deviceId)}
                  onDelete={handleDeletePrinter}
                />
              ))}

              {/* 添加打印机按钮 */}
              <Pressable onPress={handleAddPrinter} style={styles.addButton}>
                <View
                  style={[
                    styles.addButtonContent,
                    {
                      backgroundColor: isDark
                        ? 'rgba(0, 122, 255, 0.15)'
                        : 'rgba(0, 122, 255, 0.1)',
                      borderColor: isDark ? 'rgba(0, 122, 255, 0.3)' : 'rgba(0, 122, 255, 0.2)',
                    },
                  ]}
                >
                  <Ionicons name="add-circle" size={24} color="#007AFF" />
                  <Text style={styles.addButtonText}>{t('printer.selector.addPrinter')}</Text>
                </View>
              </Pressable>
            </ScrollView>
          </BlurView>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

/**
 * 样式定义
 */
const styles = StyleSheet.create({
  // 遮罩层
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },

  // 内容包裹器
  contentWrapper: {
    width: '100%',
    maxWidth: 500,
    maxHeight: '80%',
  },

  // 内容区域
  content: {
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: Platform.select({
      ios: 'transparent',
      android: 'rgba(255, 255, 255, 0.95)',
    }),
  },

  // 标题栏
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingBottom: 16,
  },

  // 标题容器
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  // 标题文字
  title: {
    fontSize: 20,
    fontWeight: '600',
  },

  // 关闭按钮
  closeButton: {
    padding: 4,
  },

  // 关闭按钮背景
  closeButtonBackground: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // 分隔线
  divider: {
    height: 1,
    marginHorizontal: 20,
  },

  // 列表容器
  listContainer: {
    maxHeight: 400,
  },

  // 列表内容
  listContent: {
    padding: 20,
    paddingTop: 16,
  },

  // 添加打印机按钮
  addButton: {
    marginTop: 8,
  },

  // 添加按钮内容
  addButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    gap: 8,
  },

  // 添加按钮文字
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
});
