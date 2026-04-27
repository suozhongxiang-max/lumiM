import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, Text, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ModelDetail } from '@/components/model-detail';
import { fetchModelDetail, updateModelVisibility, deleteModel as deleteModelApi } from '@/services';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useI18n } from '@/hooks/use-i18n';
import { logger } from '@/utils/logger';
import { createImmersiveHeaderOptions } from '@/utils/navigation';
import { usePrinterStore, useAuthStore } from '@/stores';
import type { GalleryModel, ModelVisibility } from '@/types';

export default function ModelDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme.isDark;
  const { t } = useI18n();

  // 获取打印机状态和用户信息
  const printers = usePrinterStore(state => state.printers);
  const user = useAuthStore(state => state.user);

  // 状态管理
  const [model, setModel] = useState<GalleryModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  // 从 API 获取模型详情
  useEffect(() => {
    if (!id) return;

    const loadModelDetail = async () => {
      try {
        setLoading(true);
        setError(null);
        logger.info('获取模型详情:', id);

        const data = await fetchModelDetail(id);
        setModel(data);

        logger.debug('模型详情数据:', {
          id: data.id,
          name: data.name,
          modelUrl: data.modelUrl,
          previewImageUrl: data.previewImageUrl,
        });
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : '加载失败';
        logger.error('获取模型详情失败:', err);
        setError(errorMsg);
      } finally {
        setLoading(false);
      }
    };

    loadModelDetail();
  }, [id]);

  const getHeaderOptions = useCallback(
    (title?: string, options?: { transparent?: boolean }) => {
      const baseOptions = createImmersiveHeaderOptions({
        title,
        colorScheme,
        transparent: options?.transparent ?? false,
      });

      return {
        ...baseOptions,
        // 隐藏系统默认的返回按钮
        headerBackVisible: false,
        // 自定义返回按钮，修复 iOS 第二次进入返回失效的问题
        headerLeft: () => (
          <TouchableOpacity
            onPress={() => {
              logger.info('Header 返回按钮被点击');
              router.back();
            }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons
              name="chevron-back"
              size={28}
              color={colorScheme.isDark ? Colors.dark.text : Colors.light.text}
            />
          </TouchableOpacity>
        ),
      };
    },
    [colorScheme]
  );

  // 处理打印按钮点击（必须在条件返回之前定义）
  const handlePrint = useCallback(() => {
    // 检查是否有可用的打印机
    if (!printers || printers.length === 0) {
      // 没有打印机，显示提示
      logger.warn('[ModelDetail] 没有可用的打印机');
      Alert.alert(t('modelDetail.print'), t('modelDetail.noPrinter'), [
        {
          text: t('dialog.common.cancel'),
          style: 'cancel',
        },
        {
          text: t('modelDetail.connectPrinter'),
          onPress: () => {
            // 跳转到打印机页面
            router.push('/(tabs)/printer');
          },
        },
      ]);
      return;
    }

    // 有打印机，跳转到打印机页面
    logger.info('[ModelDetail] 跳转到打印机页面');
    router.push('/(tabs)/printer');
  }, [printers, t, router]);

  // 处理私有/公开切换
  const handleTogglePrivate = useCallback(
    async (isPrivate: boolean) => {
      if (!model) return;

      try {
        setUpdating(true);
        const newVisibility: ModelVisibility = isPrivate ? 'PRIVATE' : 'PUBLIC';

        logger.info('[ModelDetail] 切换模型可见性:', { modelId: model.id, newVisibility });

        const result = await updateModelVisibility(model.id, newVisibility);

        if (result.success) {
          // 更新本地模型数据
          setModel(prev => (prev ? { ...prev, visibility: newVisibility } : null));
          logger.info('[ModelDetail] 模型可见性已更新');
        } else {
          Alert.alert(
            t('modelDetail.updateFailed.title') || '更新失败',
            result.error.message ||
              t('modelDetail.updateFailed.message') ||
              '更新模型可见性时发生错误'
          );
          // 恢复开关状态
          setModel(prev => prev);
        }
      } catch (error) {
        logger.error('[ModelDetail] 更新模型可见性失败:', error);
        Alert.alert(
          t('modelDetail.updateFailed.title') || '更新失败',
          t('modelDetail.updateFailed.message') || '更新模型可见性时发生错误'
        );
        // 恢复开关状态
        setModel(prev => prev);
      } finally {
        setUpdating(false);
      }
    },
    [model, t]
  );

  // 处理删除模型
  const handleDelete = useCallback(async () => {
    if (!model) return;

    try {
      logger.info('[ModelDetail] 删除模型:', model.id);

      const result = await deleteModelApi(model.id);

      if (result.success) {
        logger.info('[ModelDetail] 模型删除成功');
        // 返回上一页
        router.back();
      } else {
        Alert.alert(
          t('modelDetail.deleteFailed.title') || '删除失败',
          result.error.message || t('modelDetail.deleteFailed.message') || '删除模型时发生错误'
        );
      }
    } catch (error) {
      logger.error('[ModelDetail] 删除模型失败:', error);
      Alert.alert(
        t('modelDetail.deleteFailed.title') || '删除失败',
        t('modelDetail.deleteFailed.message') || '删除模型时发生错误'
      );
    }
  }, [model, t, router]);

  // 如果模型不存在，显示错误页面
  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <Stack.Screen options={getHeaderOptions(t('modelDetail.title'))} />
        <View style={styles.errorContainer}>
          <ActivityIndicator size="large" color={isDark ? Colors.dark.tint : Colors.light.tint} />
          <ThemedText style={styles.loadingText}>{t('modelDetail.loading')}</ThemedText>
        </View>
      </ThemedView>
    );
  }

  if (error || !model) {
    logger.warn('模型未找到:', id);
    return (
      <ThemedView style={styles.container}>
        <Stack.Screen options={getHeaderOptions(t('modelDetail.title'))} />
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>😕</Text>
          <ThemedText style={styles.errorTitle}>{t('modelDetail.notFound')}</ThemedText>
          <ThemedText style={styles.errorMessage}>{error || t('modelDetail.error')}</ThemedText>
          <TouchableOpacity
            style={[
              styles.backButton,
              {
                backgroundColor: isDark ? Colors.dark.tint : Colors.light.tint,
              },
            ]}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>{t('modelDetail.back')}</Text>
          </TouchableOpacity>
        </View>
      </ThemedView>
    );
  }

  logger.info('查看模型详情:', model.name);

  return (
    <>
      <Stack.Screen options={getHeaderOptions(model.name, { transparent: false })} />
      <ModelDetail
        model={model}
        onPrint={handlePrint}
        on3DPreview={() => {
          logger.info('打开 3D 预览:', model.name);
          router.push(`/model-viewer/${id}` as any);
        }}
        onTogglePrivate={handleTogglePrivate}
        onDelete={handleDelete}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xxxl,
  },
  errorIcon: {
    fontSize: 64,
    marginBottom: Spacing.lg,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: Spacing.md,
  },
  errorMessage: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.7,
    marginBottom: Spacing.xl,
    lineHeight: 22,
  },
  loadingText: {
    marginTop: Spacing.lg,
    fontSize: 16,
    opacity: 0.7,
  },
  backButton: {
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
