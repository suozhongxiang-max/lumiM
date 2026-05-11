/**
 * OTA 更新按钮组件
 * 用于设置页面，用户可手动检查更新
 *
 * 注意：开发模式下不可用，需要构建发布版本才能测试更新功能
 */

import { useState } from 'react';
import { Alert, ActivityIndicator, StyleSheet, TouchableOpacity, View } from 'react-native';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { otaUpdateManager } from '@/utils/ota-update';
import { useThemeColor } from '@/hooks/use-theme-color';
import type { OtaUpdateButtonProps } from './types';

export function OtaUpdateButton({ style, onCheckComplete }: OtaUpdateButtonProps) {
  /** 是否处于开发模式 */
  const isDev = __DEV__;
  const [isChecking, setIsChecking] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  /** 获取版本文本颜色 */
  const textColor = useThemeColor({}, 'text');
  /** 获取提示文本颜色 */
  const subtleColor = useThemeColor({}, 'tabIconDefault');

  /**
   * 处理检查更新
   */
  const handleCheckUpdate = async () => {
    // 防止重复点击
    if (isChecking || isUpdating) {
      return;
    }

    // 开发模式下显示提示
    if (isDev) {
      Alert.alert(
        '开发模式',
        'OTA 更新功能仅在发布构建中可用。\n\n如需测试更新功能，请使用以下命令构建发布版本：\n\n• iOS: npx expo run:ios --configuration Release\n• Android: npx expo run:android --variant Release'
      );
      return;
    }

    setIsChecking(true);

    try {
      // 检查更新
      const result = await otaUpdateManager.checkForUpdate();

      if (!result.isAvailable) {
        // 没有更新
        Alert.alert('检查更新', '当前已是最新版本');
        onCheckComplete?.(false);
        return;
      }

      // 有更新，显示确认对话框
      Alert.alert(
        '发现新版本',
        '发现新版本更新，是否立即下载并安装？',
        [
          {
            text: '稍后',
            style: 'cancel',
            onPress: () => {
              setIsChecking(false);
              onCheckComplete?.(true);
            },
          },
          {
            text: '立即更新',
            onPress: async () => {
              setIsUpdating(true);
              const success = await otaUpdateManager.fetchAndApplyUpdate({
                type: 'manual',
                restartNow: true,
              });
              setIsUpdating(false);
              onCheckComplete?.(success);
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert('检查更新失败', '无法连接到更新服务器，请检查网络连接');
      onCheckComplete?.(false);
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <TouchableOpacity
      style={[styles.container, style]}
      onPress={handleCheckUpdate}
      disabled={isChecking || isUpdating}
      activeOpacity={0.7}
    >
      <ThemedView style={styles.content}>
        <View style={styles.textContainer}>
          <ThemedText style={styles.title}>检查更新</ThemedText>
          <ThemedText style={[styles.subtitle, { color: subtleColor }]}>
            {isDev ? '开发模式不可用' : '检查最新版本'}
          </ThemedText>
        </View>

        {/* 加载指示器 */}
        {(isChecking || isUpdating) && (
          <ActivityIndicator
            style={styles.spinner}
            size="small"
            color={textColor}
          />
        )}
      </ThemedView>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    minHeight: 56,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  spinner: {
    marginLeft: 12,
  },
});
