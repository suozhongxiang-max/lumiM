/**
 * 3D 模型全屏预览页面（动态路由）
 * 从模型详情页进入，显示完整的 3D 模型预览
 */

import { Viewer3D, Viewer3DInstance } from '@/components/3d-viewer';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useI18n } from '@/hooks/use-i18n';
import { fetchModelDetail } from '@/services';
import type { GalleryModel } from '@/types';
import { logger } from '@/utils/logger';
import { getModelUrl } from '@/utils/url';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ModelViewer3DScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme.isDark;
  const { t } = useI18n();
  // 使用 toString() 获取颜色方案字符串
  const colors = Colors[colorScheme.toString()];
  const { id, modelUrl: directModelUrl } = useLocalSearchParams<{
    id: string;
    modelUrl?: string;
  }>();

  // 状态管理
  const [model, setModel] = useState<GalleryModel | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // 模型颜色状态：默认 null 表示使用原始贴图
  const [modelColor, setModelColor] = useState<number | null>(null);
  // 是否显示场景坐标网格
  const [showGrid, setShowGrid] = useState(false);

  // 3D 查看器引用，用于调用重置视角方法
  const viewerRef = useRef<Viewer3DInstance>(null);

  // 颜色配置数组 - 使用i18n
  const colorOptions = useMemo(
    () => [
      {
        id: 'original',
        name: t('modelViewer.colors.original'),
        colorValue: null as number | null,
        icon: '🎨',
      },
      {
        id: 'white',
        name: t('modelViewer.colors.white'),
        colorValue: 0xf5f5f5,
        icon: '⚪',
      },
      {
        id: 'blue',
        name: t('modelViewer.colors.blue'),
        colorValue: 0x2196f3,
        icon: '🔵',
      },
      {
        id: 'green',
        name: t('modelViewer.colors.green'),
        colorValue: 0x4caf50,
        icon: '🟢',
      },
    ],
    [t]
  );

  // 判断是否为直接预览模式（从 AI 创作页面过来）
  const isDirectPreview = Boolean(directModelUrl);

  // 从 API 获取模型详情（仅在画廊模式下）
  useEffect(() => {
    if (!id) return;

    // 如果是直接预览模式，跳过 API 调用
    if (isDirectPreview) {
      logger.info(`直接预览模式，使用传入的 modelUrl: ${id}`, 'ModelViewer3DScreen');
      setIsLoading(false);
      return;
    }

    // 画廊模式：从 API 获取模型详情
    const loadModelDetail = async () => {
      try {
        setIsLoading(true);
        setError(null);
        logger.info(`画廊模式，获取模型详情: ${id}`, 'ModelViewer3DScreen');

        const data = await fetchModelDetail(id);
        setModel(data);

        logger.debug('模型详情数据:', {
          id: data.id,
          name: data.name,
          modelUrl: data.modelUrl,
          mtlUrl: data.mtlUrl,
          textureUrl: data.textureUrl,
        });
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : '模型数据未找到';
        logger.error('获取模型详情失败:', err);
        setError(errorMsg);
      } finally {
        setIsLoading(false);
      }
    };

    loadModelDetail();
  }, [id, isDirectPreview]);

  const handleBack = () => {
    router.back();
  };

  const handleLoad = () => {
    logger.info('3D model loaded successfully', 'ModelViewer3DScreen');
  };

  const handleError = (error: any) => {
    logger.error(`Failed to load 3D model: ${error.message}`, 'ModelViewer3DScreen');

    // 根据错误类型显示不同的错误消息（双语支持）
    let errorMessage = t('modelViewer.error');
    if (error?.type === 'size') {
      errorMessage = t('modelViewer.errorSize');
    } else if (error?.type === 'network') {
      errorMessage = t('modelViewer.errorNetwork');
    } else if (error?.type === 'parse') {
      errorMessage = t('modelViewer.errorSize');
    } else if (error?.type === 'timeout') {
      errorMessage = t('modelViewer.errorTimeout');
    }

    setError(errorMessage);
  };

  // 重置相机视角
  const handleResetCamera = () => {
    logger.info('Resetting camera view', 'ModelViewer3DScreen');
    viewerRef.current?.resetCamera();
  };

  // 切换场景坐标网格显示
  const toggleGrid = () => {
    const newValue = !showGrid;
    logger.info(`Toggle grid: ${newValue}`, 'ModelViewer3DScreen');
    setShowGrid(newValue);
  };

  // 转换模型URL为绝对路径
  const absoluteModelUrl = useMemo(() => {
    // 直接预览模式：使用传入的 modelUrl
    if (isDirectPreview && directModelUrl) {
      const decoded = decodeURIComponent(directModelUrl);
      logger.debug('直接预览模式 - 模型 URL:', {
        encoded: directModelUrl,
        decoded,
      });
      return decoded;
    }

    // 画廊模式：使用 model 中的 modelUrl
    const url = getModelUrl(model?.modelUrl);
    logger.debug('画廊模式 - 模型 URL 转换:', {
      original: model?.modelUrl,
      absolute: url,
    });
    return url;
  }, [isDirectPreview, directModelUrl, model?.modelUrl]);

  // 转换 MTL URL 为绝对路径（仅画廊模式）
  const absoluteMtlUrl = useMemo(() => {
    if (isDirectPreview) return undefined; // 直接预览模式不需要 MTL
    if (!model?.mtlUrl) return undefined;
    const url = getModelUrl(model.mtlUrl);
    logger.debug('MTL URL 转换:', {
      original: model.mtlUrl,
      absolute: url,
    });
    return url;
  }, [isDirectPreview, model?.mtlUrl]);

  // 转换纹理 URL 为绝对路径（仅画廊模式）
  const absoluteTextureUrl = useMemo(() => {
    if (isDirectPreview) return undefined; // 直接预览模式不需要纹理
    if (!model?.textureUrl) return undefined;
    const url = getModelUrl(model.textureUrl);
    logger.debug('纹理 URL 转换:', {
      original: model.textureUrl,
      absolute: url,
    });
    return url;
  }, [isDirectPreview, model?.textureUrl]);

  // 加载中状态
  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar barStyle="dark-content" />
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.tint} />
          <Text style={[styles.loadingText, { color: colors.text }]}>
            {t('modelViewer.loading')}
          </Text>
        </View>
      </View>
    );
  }

  // 错误状态
  if (error || (!isDirectPreview && !model)) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar barStyle="dark-content" />
        <Stack.Screen options={{ headerShown: false }} />
        <SafeAreaView
          edges={['top']}
          style={[styles.header, { backgroundColor: colors.background }]}
        >
          <View style={styles.headerContent}>
            <TouchableOpacity
              style={[styles.backButton, { backgroundColor: colors.background }]}
              onPress={handleBack}
              activeOpacity={0.7}
            >
              <IconSymbol name="chevron.left" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
        <View style={styles.centerContainer}>
          <Text style={[styles.errorText, { color: colors.text }]}>
            {error || t('modelViewer.modelNotFound')}
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: colors.tint }]}
            onPress={handleBack}
          >
            <Text style={styles.retryButtonText}>{t('modelViewer.back')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // 获取模型名称（直接预览模式使用默认名称）
  const modelName = isDirectPreview
    ? t('modelViewer.aiModel')
    : model?.name || t('modelViewer.defaultName');

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />

      {/* 左上角返回按钮 - 所有平台显示 */}
      <SafeAreaView edges={['top']} style={styles.backButtonWrapper}>
        <TouchableOpacity
          style={styles.backButtonContainer}
          onPress={handleBack}
          activeOpacity={0.7}
        >
          <IconSymbol name="chevron.left" size={32} color={isDark ? '#FFFFFF' : '#4e4d4d'} />
          <Text style={[styles.backButtonText, { color: isDark ? '#FFFFFF' : '#4e4d4d' }]}>
            {t('modelViewer.back')}
          </Text>
        </TouchableOpacity>
      </SafeAreaView>

      {/* 顶部导航栏 - 仅 iOS 显示（带标题） */}
      {Platform.OS === 'ios' && (
        <SafeAreaView
          edges={['top']}
          style={[styles.header, { backgroundColor: colors.background }]}
        >
          <View style={styles.headerContent}>
            <View style={styles.placeholder} />
            <View style={styles.titleContainer}>
              <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
                {modelName}
              </Text>
            </View>
            <View style={styles.placeholder} />
          </View>
        </SafeAreaView>
      )}

      {/* 3D 查看器 */}
      <Viewer3D
        ref={viewerRef}
        modelUrl={absoluteModelUrl}
        mtlUrl={absoluteMtlUrl}
        textureUrl={absoluteTextureUrl}
        modelColor={modelColor}
        showGrid={showGrid}
        showProgress
        showPlaceholder
        onLoad={handleLoad}
        onError={handleError}
        style={styles.viewer}
      />

      {/* 底部控制栏 - 包含坐标网格、重置视角和颜色选择 */}
      <SafeAreaView edges={['bottom']} style={styles.bottomControls}>
        <View style={[styles.controlsContainer, { backgroundColor: 'rgba(0, 0, 0, 0.5)' }]}>
          {/* 坐标网格切换按钮 - 最左边 */}
          <TouchableOpacity
            style={[styles.controlButton, showGrid && styles.controlButtonActive]}
            onPress={toggleGrid}
            activeOpacity={0.7}
          >
            <IconSymbol name="grid.Feather" size={20} color="#fff" />
          </TouchableOpacity>

          {/* 分隔线 */}
          <View style={styles.divider} />

          {/* 重置视角按钮 */}
          <TouchableOpacity
            style={styles.controlButton}
            onPress={handleResetCamera}
            activeOpacity={0.7}
          >
            <IconSymbol name="camera.fill" size={20} color="#fff" />
          </TouchableOpacity>

          {/* 分隔线 */}
          <View style={styles.divider} />

          {/* 颜色选择器 */}
          <View style={styles.colorPicker}>
            {colorOptions.map(option => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.colorButton,
                  modelColor === option.colorValue && styles.colorButtonActive,
                ]}
                onPress={() => {
                  logger.info(`切换到${option.name}`, 'ModelViewer3DScreen');
                  setModelColor(option.colorValue);
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.colorIcon}>{option.icon}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f0f0',
  },
  // 返回按钮外层容器样式
  backButtonWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 100,
    paddingTop: Platform.OS === 'ios' ? 8 : 16,
    paddingLeft: 16,
  },
  // 返回按钮容器样式（包含图标和文字）
  backButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backIconButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 20,
    color: '#4e4d4d',
    marginLeft: -4,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  titleContainer: {
    flex: 1,
    marginHorizontal: 12,
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
  placeholder: {
    width: 40,
  },
  viewer: {
    flex: 1,
  },
  // 底部控制栏样式
  bottomControls: {
    position: 'absolute',
    bottom: 10,
    right: 0,
    padding: 16,
  },
  // 控制按钮容器样式
  controlsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 6,
    borderRadius: 8,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  // 分隔线样式
  divider: {
    width: 1,
    height: 36,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginHorizontal: 8,
  },
  // 通用控制按钮样式
  controlButton: {
    width: 42,
    height: 42,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  // 激活状态的控制按钮样式
  controlButtonActive: {
    borderColor: 'rgba(255, 193, 7, 0.5)',
    backgroundColor: 'rgba(255, 193, 7, 0.1)',
    borderWidth: 1.5,
  },
  // 颜色选择器样式
  colorPicker: {
    flexDirection: 'row',
    gap: 6,
  },
  colorButton: {
    width: 42,
    height: 42,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  colorButtonActive: {
    borderColor: 'rgba(255, 193, 7, 0.5)',
    backgroundColor: 'rgba(255, 193, 7, 0.1)',
    borderWidth: 1.5,
    transform: [{ scale: 1.05 }],
  },
  colorIcon: {
    fontSize: 30,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
