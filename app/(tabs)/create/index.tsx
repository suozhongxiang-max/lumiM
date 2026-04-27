import { AuthGuard } from '@/components/auth';
import { CreateTaskRenderer } from '@/components/create-task-renderer';
import { ScreenWrapper } from '@/components/screen-wrapper';
import { IconSymbol, type IconSymbolName } from '@/components/ui/icon-symbol';
import { BorderRadius, FontSize, FontWeight, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useI18n } from '@/hooks/use-i18n';
import { useSafeAreaSpacing } from '@/hooks/use-safe-area-spacing';
import { useCreateStore } from '@/stores';
import { logger } from '@/utils/logger';
import { useFocusEffect } from '@react-navigation/native';
import { imageToBase64, isBase64Image } from '@/utils/image';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  Dimensions,
  Image,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { SafeAreaView } from 'react-native-safe-area-context';

type QuickStyle = {
  id: string;
  label: string;
  icon: IconSymbolName;
  prompt: string;
};

// 定义三组不同的快速灵感配置，每组6个风格选项
const QUICK_STYLES_GROUPS: QuickStyle[][] = [
  // 第一组：基础风格
  [
    {
      id: 'scifi',
      label: 'scifi',
      icon: 'sparkles',
      prompt: 'scifi',
    },
    {
      id: 'nature',
      label: 'nature',
      icon: 'leaf.fill',
      prompt: 'nature',
    },
    {
      id: 'characters',
      label: 'characters',
      icon: 'person.crop.circle',
      prompt: 'characters',
    },
    {
      id: 'architecture',
      label: 'architecture',
      icon: 'building.columns',
      prompt: 'architecture',
    },
    {
      id: 'fantasy',
      label: 'fantasy',
      icon: 'wand.and.stars',
      prompt: 'fantasy',
    },
    {
      id: 'vehicles',
      label: 'vehicles',
      icon: 'car.fill',
      prompt: 'vehicles',
    },
  ],
  // 第二组：艺术风格
  [
    {
      id: 'anime',
      label: 'anime',
      icon: 'star.fill',
      prompt: 'anime',
    },
    {
      id: 'realistic',
      label: 'realistic',
      icon: 'camera.fill',
      prompt: 'realistic',
    },
    {
      id: 'cartoon',
      label: 'cartoon',
      icon: 'paintbrush.fill',
      prompt: 'cartoon',
    },
    {
      id: 'watercolor',
      label: 'watercolor',
      icon: 'drop.fill',
      prompt: 'watercolor',
    },
    {
      id: 'oilpainting',
      label: 'oilpainting',
      icon: 'paintpalette',
      prompt: 'oilpainting',
    },
    {
      id: 'pixelart',
      label: 'pixelart',
      icon: 'square.grid.3x3.fill',
      prompt: 'pixelart',
    },
  ],
  // 第三组：主题风格
  [
    {
      id: 'cyberpunk',
      label: 'cyberpunk',
      icon: 'brain.head.profile',
      prompt: 'cyberpunk',
    },
    {
      id: 'steampunk',
      label: 'steampunk',
      icon: 'cog.fill',
      prompt: 'steampunk',
    },
    {
      id: 'vintage',
      label: 'vintage',
      icon: 'clock.fill',
      prompt: 'vintage style',
    },
    {
      id: 'minimalist',
      label: 'minimalist',
      icon: 'minus',
      prompt: 'minimalist',
    },
    {
      id: 'gothic',
      label: 'gothic',
      icon: 'moon.stars.fill',
      prompt: 'gothic style',
    },
    {
      id: 'popart',
      label: 'popart',
      icon: 'circle.fill',
      prompt: 'pop art',
    },
  ],
];

const LIGHT_PALETTE = {
  // 移除自定义的 background，使用 ScreenWrapper 的统一背景
  card: '#FFFFFF',
  border: '#DDE5F2',
  text: '#0F172A',
  secondary: '#5F6B85',
  tertiary: '#A1B1CE',
  accent: '#2680FF',
  divider: '#E5EBF5',
  sparkleBg: '#E6EEFF',
  sparkleIcon: '#1E6FEA',
  pillBorder: '#D7E1F5',
  disabled: '#B8C7E2',
};

const DARK_PALETTE = {
  // 移除自定义的 background，使用 ScreenWrapper 的统一背景
  card: '#2C2C2E', // 使用灰色而不是太黑的颜色
  border: '#3A3A3C',
  text: '#FFFFFF',
  secondary: '#AEAEB2',
  tertiary: '#8E8E93',
  accent: '#3B82F6',
  divider: '#1E2538',
  sparkleBg: 'rgba(59, 130, 246, 0.2)',
  sparkleIcon: '#9CC4FF',
  pillBorder: '#3A3A3C',
  disabled: '#516089',
};

/**
 * AI 创作页面
 * 根据 currentTask 的状态显示不同的 UI:
 * - 无任务: 显示输入界面
 * - generating_images: 图片生成中（骨架屏）
 * - images_ready: 图片生成完成（在同一页面显示真实图片供选择）
 * - generating_model: 3D模型生成中
 * - model_ready: 生成完成
 */
export default function CreateScreen() {
  const { prompt: initialPrompt = '', imageUrl: initialImageUrl = '' } = useLocalSearchParams<{
    prompt?: string;
    imageUrl?: string;
  }>();

  const colorScheme = useColorScheme();
  const isDark = colorScheme.isDark;
  const { contentPaddingBottom } = useSafeAreaSpacing();
  const { t } = useI18n();

  // 快速灵感当前显示的组索引（0、1、2 对应三组不同的数据）
  // 必须在 useMemo 之前定义，否则会导致访问 undefined
  const [quickStylesGroupIndex, setQuickStylesGroupIndex] = useState(0);

  // 动态生成快速风格数组，使用i18n翻译，并根据当前组索引选择对应的数据组
  const QUICK_STYLES: QuickStyle[] = useMemo(() => {
    // 根据当前组索引获取对应的数据组
    const currentGroup = QUICK_STYLES_GROUPS[quickStylesGroupIndex];
    return currentGroup.map(style => ({
      ...style,
      label: t(`create.styles.${style.label}`),
      prompt: t(`create.stylePrompts.${style.prompt}`),
    }));
  }, [t, quickStylesGroupIndex]);

  const [prompt, setPrompt] = useState(initialPrompt);
  // 改为单个图片URL，限制只能上传一张图片
  const [imageUrl, setImageUrl] = useState<string>(initialImageUrl || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeStyleId, setActiveStyleId] = useState<string | null>(null);
  // 图片预览 Modal 相关状态
  const [previewImageVisible, setPreviewImageVisible] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string>('');

  // 从 Store 获取当前任务（从 tasks 数组中计算派生状态）
  const currentTask = useCreateStore(
    state => state.tasks.find(t => t.id === state.currentTaskId) ?? null
  );
  const createTask = useCreateStore(state => state.createTask);
  const createImageTo3DTask = useCreateStore(state => state.createImageTo3DTask);
  const selectImage = useCreateStore(state => state.selectImage);
  const generateModel = useCreateStore(state => state.generateModel);
  const cancelTask = useCreateStore(state => state.cancelTask);
  const reset = useCreateStore(state => state.reset);
  const startTaskSubscription = useCreateStore(state => state._startTaskSubscription);
  const stopTaskSubscription = useCreateStore(state => state._stopTaskSubscription);

  // 动态颜色
  const palette = useMemo(() => (isDark ? DARK_PALETTE : LIGHT_PALETTE), [isDark]);
  const textColor = palette.text;
  const secondaryTextColor = palette.secondary;
  const tertiaryTextColor = palette.tertiary;

  useFocusEffect(
    useCallback(() => {
      const activeTaskId = currentTask?.id;
      if (!activeTaskId) {
        return undefined;
      }

      logger.info('[CreateScreen] focus start task SSE subscription:', {
        taskId: activeTaskId,
        status: currentTask.status,
      });
      startTaskSubscription(activeTaskId);

      return () => {
        logger.info('[CreateScreen] blur stop task SSE subscription:', {
          taskId: activeTaskId,
        });
        stopTaskSubscription(activeTaskId);
      };
    }, [currentTask?.id, currentTask?.status, startTaskSubscription, stopTaskSubscription])
  );

  // 处理提交
  const handleSubmit = async (promptInput: string | undefined) => {
    const finalPrompt = promptInput || prompt;

    // 如果有上传图片，检查图片是否准备就绪
    if (imageUrl && !isSubmitting) {
      try {
        setIsSubmitting(true);
        logger.info('创建图生3D任务:', { prompt: finalPrompt, imageUrl });

        let base64Data = imageUrl;

        // 如果还不是 base64 格式，需要转换
        if (!isBase64Image(imageUrl)) {
          logger.info('图片不是 base64 格式，开始转换...');
          base64Data = await imageToBase64(imageUrl);
          logger.info('图片转换为 base64 成功');
        }

        // 调用图生3D接口，直接生成3D模型
        await createImageTo3DTask(finalPrompt.trim(), base64Data);

        // 清空输入
        setPrompt('');
        setActiveStyleId(null);
        setImageUrl('');
      } catch (error) {
        logger.error('创建图生3D任务失败:', error);
        Alert.alert(
          t('create.error.title') || '生成失败',
          error instanceof Error ? error.message : '创建任务失败，请重试'
        );
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    // 没有上传图片的情况，必须填写文字
    if (!finalPrompt.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      logger.info('创建文生图任务:', { prompt: finalPrompt });

      // 创建文生图任务（原有流程）
      await createTask(finalPrompt.trim(), undefined);

      // 清空输入
      setPrompt('');
      setActiveStyleId(null);
    } catch (error) {
      logger.error('创建任务失败:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePromptChange = (value: string) => {
    setPrompt(value);
    if (activeStyleId) {
      setActiveStyleId(null);
    }
  };

  // 删除图片
  const handleRemoveImage = () => {
    setImageUrl('');
  };

  // 打开图片预览 Modal
  const handlePreviewImage = (imageUrlParam: string) => {
    setPreviewImageUrl(imageUrlParam);
    setPreviewImageVisible(true);
    logger.info('[Create] 打开图片预览:', { imageUrl: imageUrlParam });
  };

  // 关闭图片预览 Modal
  const handleClosePreview = () => {
    setPreviewImageVisible(false);
    setPreviewImageUrl('');
    logger.info('[Create] 关闭图片预览');
  };

  // 选择新图片
  const handlePickImage = async () => {
    try {
      logger.info('[handlePickImage] 开始选择图片流程');

      // 检查是否已有图片（限制只能上传一张）
      if (imageUrl) {
        logger.warn('[handlePickImage] 已有图片，需要先删除现有图片才能上传新图片');
        Alert.alert(
          t('create.imageLimit.title') || '图片数量限制',
          t('create.imageLimit.singleMessage') || '只能上传一张参考图片，请先删除现有图片'
        );
        return;
      }

      logger.info('[handlePickImage] 准备调用 DocumentPicker.getDocumentAsync');

      // 打开文档选择器（单选）
      const result = await DocumentPicker.getDocumentAsync({
        type: 'image/*', // 只选择图片类型
        multiple: false, // 不允许多选
        copyToCacheDirectory: true, // 复制到缓存目录
      });

      logger.info('[handlePickImage] DocumentPicker 返回结果:', {
        canceled: result.canceled,
        hasAssets: !!result.assets,
        assetCount: result.assets?.length || 0,
      });

      // 处理取消情况
      if (result.canceled) {
        logger.info('[handlePickImage] 用户取消选择图片');
        return;
      }

      // 处理选择结果
      if (result.assets && result.assets.length > 0) {
        // 获取选中图片的 URI（只取第一张）
        let selectedUri = result.assets[0].uri;

        logger.info('[handlePickImage] 原始 URI:', {
          uri: selectedUri,
          scheme: selectedUri.split('://')[0],
        });

        // 对于 Android 的 content URI，需要复制到缓存目录
        if (selectedUri.startsWith('content://')) {
          logger.info('[handlePickImage] 检测到 content URI，需要复制到缓存目录');
          try {
            // 读取文件信息
            const fileInfo = await FileSystem.getInfoAsync(selectedUri);
            if (!fileInfo.exists) {
              throw new Error('文件不存在');
            }

            // 使用 documentDirectory 作为缓存目录
            const documentDir = FileSystem.documentDirectory!;
            const fileName = `image_${Date.now()}.jpg`;
            const cachePath = `${documentDir}${fileName}`;

            // 复制文件到缓存目录
            await FileSystem.copyAsync({
              from: selectedUri,
              to: cachePath,
            });

            selectedUri = cachePath;
            logger.info('[handlePickImage] 文件已复制到缓存目录:', { cachePath });
          } catch (copyError) {
            logger.error('[handlePickImage] 复制文件失败:', copyError);
            Alert.alert(
              t('create.imageError.title') || '选择失败',
              '无法读取选中的图片，请选择其他图片'
            );
            return;
          }
        }

        logger.info('[handlePickImage] 准备添加图片:', {
          selectedUri,
        });

        setImageUrl(selectedUri);

        logger.info('[handlePickImage] 图片已设置');
      } else {
        logger.warn('[handlePickImage] 没有选择任何文件');
      }
    } catch (error) {
      logger.error('[handlePickImage] 选择图片异常:', error);
      Alert.alert(
        t('create.imageError.title') || '选择失败',
        String(error) || t('create.imageError.message') || '选择图片时发生错误，请重试'
      );
    }
  };

  const handleSelectStyle = (styleId: string, value: string) => {
    setPrompt(value);
    setActiveStyleId(styleId);
  };

  // 处理图片选择
  const handleSelectImage = async (imageId: string) => {
    if (!currentTask) return;
    await selectImage(currentTask.id, imageId);
  };

  // 处理生成3D模型
  const handleGenerateModel = async () => {
    if (!currentTask) {
      logger.warn('[Create] handleGenerateModel: currentTask 为空');
      return;
    }

    try {
      logger.info('[Create] 用户点击生成3D模型按钮:', {
        taskId: currentTask.id,
        selectedImageId: currentTask.selectedImageId,
        selectedImageIndex: currentTask.selectedImageIndex,
      });

      // 调用 Store 方法生成3D模型
      await generateModel(currentTask.id);

      logger.info('[Create] 生成3D模型请求已发送');
    } catch (error) {
      logger.error('[Create] 生成3D模型失败:', error);

      // TODO: 可以在这里添加用户友好的错误提示
      // 例如使用 Alert 或 Toast 组件
    }
  };

  // 处理取消任务
  const handleCancel = () => {
    if (!currentTask) return;
    cancelTask(currentTask.id);
  };

  // 处理查看3D模型
  const handleView3D = () => {
    if (!currentTask?.model?.modelUrl || !currentTask?.model?.id) {
      logger.warn('[Create] handleView3D: modelUrl 或 modelId 为空', {
        hasModel: !!currentTask?.model,
        hasModelUrl: !!currentTask?.model?.modelUrl,
        hasModelId: !!currentTask?.model?.id,
      });
      return;
    }

    logger.info('[Create] 导航到 3D 模型查看器:', {
      modelId: currentTask.model.id,
      modelUrl: currentTask.model.modelUrl,
    });

    // 导航到3D查看器页面，传递 modelUrl 作为查询参数
    // 这样可以直接预览，不需要从 API 获取模型详情
    const encodedUrl = encodeURIComponent(currentTask.model.modelUrl);
    router.push(`/model-viewer/${currentTask.model.id}?modelUrl=${encodedUrl}`);
  };

  // 处理继续创作新的
  const handleCreateNew = () => {
    reset(); // 重置当前任务
    setPrompt(''); // 清空输入
    setImageUrl(''); // 清空图片
  };

  // 处理刷新快速灵感组
  const handleRefreshQuickStyles = () => {
    // 切换到下一组，循环切换（0 -> 1 -> 2 -> 0）
    setQuickStylesGroupIndex(prev => (prev + 1) % QUICK_STYLES_GROUPS.length);
    // 刷新时清空当前选中的样式
    setActiveStyleId(null);
    logger.info('[Create] 切换快速灵感组:', quickStylesGroupIndex + 1);
  };

  // 按钮激活状态：有图片时不需要文字，没图片时必须有文字
  const isButtonActive = (imageUrl.length > 0 || prompt.trim().length > 0) && !isSubmitting;

  // 根据当前任务状态渲染不同的 UI
  const renderContent = () => {
    // 无任务或任务已取消 - 显示输入界面
    if (!currentTask || currentTask.status === 'cancelled') {
      return (
        <View style={styles.creatorContainer}>
          <View style={[styles.pageHeader, { borderBottomColor: palette.divider }]}>
            <View style={styles.pageLogo}>
              <LinearGradient
                colors={[palette.accent, isDark ? '#3B68FF' : '#5A8BFF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.pageLogoGradient}
              >
                <IconSymbol name="wand.and.stars" size={18} color="#FFFFFF" />
              </LinearGradient>
              <Text style={[styles.pageLabel, { color: palette.accent }]}>{t('create.title')}</Text>
            </View>
            <Text style={[styles.pageTitle, { color: textColor }]}>{t('create.studio')}</Text>
            <Text style={[styles.pageSubtitle, { color: secondaryTextColor }]}>
              {t('create.subtitle')}
            </Text>
          </View>

          <KeyboardAwareScrollView
            style={styles.scrollView}
            contentContainerStyle={[
              styles.scrollContent,
              { paddingBottom: contentPaddingBottom + Spacing.xxl },
            ]}
            showsVerticalScrollIndicator={true}
            scrollEnabled={true}
            keyboardShouldPersistTaps="handled"
          >
            <View
              style={[
                styles.promptCard,
                {
                  backgroundColor: palette.card,
                  borderColor: palette.border,
                  ...Platform.select({
                    ios: {
                      shadowColor: '#0B1A3A',
                      shadowOffset: { width: 0, height: 8 },
                      shadowOpacity: isDark ? 0.25 : 0.08,
                      shadowRadius: 16,
                    },
                    android: {
                      elevation: 3,
                    },
                  }),
                },
              ]}
            >
              {/* 清空按钮 - 只在有文本或有图片时显示 */}
              {(prompt.length > 0 || imageUrl.length > 0) && (
                <TouchableOpacity
                  style={[styles.clearButton]}
                  onPress={() => {
                    // 清空输入、选中的样式和图片
                    setPrompt('');
                    setActiveStyleId(null);
                    setImageUrl('');
                  }}
                  activeOpacity={0.7}
                >
                  <IconSymbol name="clear.col" size={24} color={palette.tertiary} />
                </TouchableOpacity>
              )}

              {/* 图片预览区域 - 单张图片显示 */}
              {imageUrl.length > 0 && (
                <View style={styles.imagePreviewContainer}>
                  <View style={styles.imagePreviewWrapper}>
                    {/* 图片点击区域 - 点击查看大图 */}
                    <TouchableOpacity
                      style={styles.imagePreviewTouchable}
                      onPress={() => handlePreviewImage(imageUrl)}
                      activeOpacity={0.9}
                    >
                      <Image
                        source={{ uri: imageUrl }}
                        style={styles.imagePreview}
                        resizeMode="cover"
                      />
                    </TouchableOpacity>
                    {/* 删除按钮 - 独立的点击区域，不会被图片点击事件触发 */}
                    <TouchableOpacity
                      style={[styles.removeImageButton, { backgroundColor: palette.card }]}
                      onPress={handleRemoveImage}
                      activeOpacity={0.7}
                    >
                      <IconSymbol name="clear.col" size={20} color={palette.tertiary} />
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* 无图片时显示添加图片按钮 */}
              {imageUrl.length === 0 && (
                <TouchableOpacity
                  style={[styles.noImageAddButton, { borderColor: palette.border }]}
                  onPress={handlePickImage}
                  activeOpacity={0.7}
                >
                  <IconSymbol
                    name="photo.on.rectangle.angled"
                    size={20}
                    color={palette.secondary}
                  />
                  <Text style={[styles.addImageText, { color: palette.secondary }]}>
                    {t('create.addImage')}
                  </Text>
                </TouchableOpacity>
              )}

              <TextInput
                style={[
                  styles.input,
                  {
                    color: textColor,
                    // 当有图片时，减少输入框最小高度
                    minHeight: imageUrl.length > 0 ? 80 : 120,
                  },
                ]}
                placeholder={t('create.promptPlaceholder')}
                placeholderTextColor={tertiaryTextColor}
                value={prompt}
                onChangeText={handlePromptChange}
                multiline
                maxLength={500}
                returnKeyType="default"
                blurOnSubmit
              />
              <TouchableOpacity
                style={[
                  styles.sparkleButton,
                  {
                    backgroundColor: palette.sparkleBg,
                    opacity: isButtonActive ? 1 : 0.65,
                  },
                ]}
                onPress={() => handleSubmit(prompt)}
                disabled={!isButtonActive}
                activeOpacity={0.8}
              >
                <IconSymbol name="sparkles" size={22} color={palette.sparkleIcon} />
              </TouchableOpacity>
            </View>

            <View style={styles.quickStylesSection}>
              <View style={styles.quickStylesHeader}>
                {/* 刷新按钮 - 点击切换不同的快速灵感组 */}
                <TouchableOpacity
                  style={[
                    styles.quickStylesIcon,
                    {
                      backgroundColor: isDark
                        ? 'rgba(38, 128, 255, 0.15)'
                        : 'rgba(38, 128, 255, 0.1)',
                    },
                  ]}
                  onPress={handleRefreshQuickStyles}
                  activeOpacity={0.7}
                >
                  <IconSymbol name="arrow.triangle.2.circlepath" size={16} color={palette.accent} />
                </TouchableOpacity>
                <Text style={[styles.quickStylesTitle, { color: textColor }]}>
                  {t('create.quickInspiration')}
                </Text>
              </View>

              <View style={styles.quickStylesGrid}>
                {QUICK_STYLES.map(style => {
                  const isActive = activeStyleId === style.id;
                  return (
                    <TouchableOpacity
                      key={style.id}
                      style={[
                        styles.quickStylePill,
                        {
                          borderColor: isActive ? palette.accent : palette.pillBorder,
                          backgroundColor: isActive ? 'rgba(38, 128, 255, 0.06)' : palette.card,
                        },
                      ]}
                      onPress={() => handleSelectStyle(style.id, style.prompt)}
                      activeOpacity={0.85}
                    >
                      <IconSymbol
                        name={style.icon}
                        size={16}
                        color={isActive ? palette.accent : secondaryTextColor}
                      />
                      <Text
                        style={[
                          styles.quickStyleText,
                          { color: isActive ? palette.accent : secondaryTextColor },
                        ]}
                      >
                        {style.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={[styles.tipText, { color: tertiaryTextColor }]}>{t('create.tip')}</Text>
            </View>
            <View style={[styles.actionSection, { paddingBottom: Spacing.lg }]}>
              <TouchableOpacity
                style={[
                  styles.primaryButton,
                  {
                    backgroundColor: isButtonActive ? palette.accent : palette.disabled,
                    ...Platform.select({
                      ios: {
                        shadowColor: palette.accent,
                        shadowOffset: { width: 0, height: 8 },
                        shadowOpacity: isButtonActive ? 0.3 : 0,
                        shadowRadius: 20,
                      },
                      android: {
                        elevation: isButtonActive ? 6 : 0,
                      },
                    }),
                  },
                ]}
                onPressIn={() => handleSubmit(prompt)}
                disabled={!isButtonActive}
                activeOpacity={0.85}
              >
                <Text style={styles.primaryButtonText}>
                  {isSubmitting ? t('create.generating') : t('create.generateImage')}
                </Text>
              </TouchableOpacity>
            </View>
          </KeyboardAwareScrollView>
        </View>
      );
    }

    // 失败状态 - 显示错误页面
    if (currentTask.status === 'failed') {
      return (
        <View style={[styles.errorContainer, { paddingBottom: contentPaddingBottom }]}>
          <IconSymbol name="exclamationmark.triangle.fill" size={60} color="#FF3B30" />
          <Text style={[styles.errorTitle, { color: '#FF3B30' }]}>
            {t('create.generateFailed')}
          </Text>
          <Text style={[styles.errorMessage, { color: textColor }]}>{currentTask.error}</Text>
          <TouchableOpacity
            style={[styles.retryButton, { borderColor: '#FF3B30' }]}
            onPress={handleCreateNew}
            activeOpacity={0.7}
          >
            <IconSymbol name="arrow.clockwise" size={20} color="#FF3B30" />
            <Text style={[styles.retryButtonText, { color: '#FF3B30' }]}>
              {t('create.restart')}
            </Text>
          </TouchableOpacity>
        </View>
      );
    }
    logger.debug('[Create] xxxxxx当前任务状态:', currentTask);
    // 有任务 - 使用 CreateTaskRenderer 组件（数据驱动的渲染）
    return (
      <CreateTaskRenderer
        task={currentTask}
        onSelectImage={handleSelectImage}
        onGenerateModel={handleGenerateModel}
        onCancel={handleCancel}
        onView3D={handleView3D}
        onCreateNew={handleCreateNew}
        onResetPlace={handleSubmit}
        paddingBottom={contentPaddingBottom}
        isDark={isDark}
      />
    );
  };

  return (
    <AuthGuard>
      <ScreenWrapper edges={['top']} style={{ flex: 1 }}>
        {renderContent()}
      </ScreenWrapper>

      {/* 图片预览 Modal */}
      <Modal
        visible={previewImageVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={handleClosePreview}
      >
        <SafeAreaView style={styles.previewContainer}>
          {/* 背景遮罩 - 点击关闭 */}
          <TouchableOpacity
            style={styles.previewMask}
            activeOpacity={1}
            onPress={handleClosePreview}
          >
            {/* 大图显示区域 */}
            <View style={styles.previewImageContainer}>
              <TouchableOpacity
                activeOpacity={1}
                onPress={e => {
                  // 阻止事件冒泡，防止点击图片时关闭 Modal
                  e.stopPropagation();
                }}
              >
                <Image
                  source={{ uri: previewImageUrl }}
                  style={styles.previewImage}
                  resizeMode="contain"
                />
              </TouchableOpacity>

              {/* 关闭按钮 */}
              <TouchableOpacity
                style={[styles.previewCloseButton, { backgroundColor: palette.card }]}
                onPress={handleClosePreview}
                activeOpacity={0.7}
              >
                <IconSymbol name="clear.col" size={24} color={palette.text} />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </SafeAreaView>
      </Modal>
    </AuthGuard>
  );
}

const styles = StyleSheet.create({
  creatorContainer: {
    flex: 1,
  },
  pageHeader: {
    paddingTop: 0, // 移除顶部 padding，由 ScreenWrapper 处理
    paddingBottom: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: Spacing.lg,
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  pageSubtitle: {
    fontSize: FontSize.sm,
    lineHeight: 18,
  },
  pageLogo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  pageLogoGradient: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageLabel: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md, // 减小顶部间距，从 20 改为 12
    gap: Spacing.xl,
  },
  promptCard: {
    borderRadius: 26,
    borderWidth: 1,
    padding: Spacing.lg,
    // 动态高度，根据内容自动调整
  },
  input: {
    fontSize: FontSize.md,
    lineHeight: 24,
    minHeight: 120,
    textAlignVertical: 'top',
    // 为右上角的清空按钮留出空间
    paddingRight: 50,
  },
  // 图片预览容器（单张图片显示）
  imagePreviewContainer: {
    width: '100%',
    marginBottom: Spacing.md,
    alignItems: 'flex-start',
  },
  imagePreviewWrapper: {
    position: 'relative',
    width: 120,
    height: 120,
    borderRadius: 16,
    overflow: 'hidden',
  },
  // 图片点击区域
  imagePreviewTouchable: {
    width: '100%',
    height: '100%',
  },
  // 图片预览
  imagePreview: {
    width: '100%',
    height: '100%',
  },
  // 删除图片按钮
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  // 添加图片按钮（无图片时显示）
  noImageAddButton: {
    width: '100%',
    paddingVertical: Spacing.md,
    borderRadius: 16,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  addImageText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
  },
  // 清空按钮样式 - 定位在右上角
  clearButton: {
    position: 'absolute',
    right: 20,
    top: 20,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1, // 确保在输入框上方
  },
  sparkleButton: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickStylesSection: {
    gap: Spacing.md,
  },
  quickStylesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  quickStylesIcon: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickStylesTitle: {
    fontSize: 16,
    fontWeight: FontWeight.semibold,
  },
  quickStylesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickStylePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    gap: 8,
  },
  quickStyleText: {
    fontSize: 14,
    fontWeight: FontWeight.semibold,
  },
  tipText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
  },
  actionSection: {
    paddingHorizontal: Spacing.lg,
  },
  primaryButton: {
    borderRadius: 20,
    paddingVertical: 18,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: FontWeight.semibold,
  },
  // 错误容器样式
  errorContainer: {
    flex: 1, // 占满空间
    justifyContent: 'center', // 水平居中
    alignItems: 'center', // 垂直居中
    paddingHorizontal: Spacing.xl, // 使用主题间距
    gap: Spacing.lg, // 使用主题间距
  },

  // 错误标题样式
  errorTitle: {
    fontSize: FontSize.xxl, // 使用主题字号
    fontWeight: FontWeight.bold, // 使用主题字重
  },

  // 错误消息样式
  errorMessage: {
    fontSize: FontSize.md, // 使用主题字号
    textAlign: 'center', // 居中对齐
    marginBottom: Spacing.md, // 使用主题间距
  },

  // 重试按钮样式
  retryButton: {
    flexDirection: 'row', // 横向排列
    alignItems: 'center', // 垂直居中
    paddingVertical: Spacing.md, // 使用主题间距
    paddingHorizontal: Spacing.xl, // 使用主题间距
    borderRadius: BorderRadius.md, // 使用主题圆角
    borderWidth: 1.5, // 边框宽度
    gap: Spacing.sm, // 使用主题间距
  },

  // 重试按钮文字样式
  retryButtonText: {
    fontSize: FontSize.md, // 使用主题字号
    fontWeight: FontWeight.semibold, // 使用主题字重
  },
  // 图片预览 Modal 容器样式
  previewContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // 图片预览遮罩样式
  previewMask: {
    flex: 1,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // 图片预览图片容器样式
  previewImageContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  // 大图样式
  previewImage: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  },
  // 关闭按钮样式
  previewCloseButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 10,
  },
});
