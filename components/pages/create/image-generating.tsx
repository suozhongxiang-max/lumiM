import { IconSymbol, type IconSymbolName } from '@/components/ui/icon-symbol';
import { BorderRadius, FontSize, FontWeight, Spacing } from '@/constants/theme';
import { useI18n } from '@/hooks/use-i18n';
import type { GenerationTask } from '@/stores/create/types';
import { logger } from '@/utils/logger';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
const LIGHT_UI = {
  background: '#F5F7FB',
  card: '#FFFFFF',
  border: '#E0E7F6',
  text: '#0F172A',
  secondary: '#6B7796',
  accent: '#2680FF',
  placeholder: '#EEF2FB',
  placeholderIcon: '#CBD4EA',
  disabled: '#C5D4EF',
};

const DARK_UI = {
  background: '#070B15',
  card: '#111A2C',
  border: '#24304B',
  text: '#F6F7FF',
  secondary: '#9AA8C7',
  accent: '#5EA0FF',
  placeholder: '#1A2239',
  placeholderIcon: '#3D4B6B',
  disabled: '#2B3853',
};

interface ImageGeneratingProps {
  task: GenerationTask;
  onSelectImage?: (imageId: string) => void;
  onGenerateModel?: () => void;
  onCancel?: () => void;
  onResetPlace?: () => void;
  paddingBottom?: number;
  isDark?: boolean;
  isNotBack?: boolean;
}

/**
 * 图片生成组件 - 新版干净卡片风格
 */
export function ImageGenerating({
  task,
  onSelectImage,
  onGenerateModel,
  onCancel,
  onResetPlace,
  paddingBottom,
  isDark,
  isNotBack,
}: ImageGeneratingProps) {
  const { t } = useI18n();
  const palette = isDark ? DARK_UI : LIGHT_UI;
  const backgroundColor = palette.background;
  const textColor = palette.text;
  const secondaryTextColor = palette.secondary;
  const placeholderBg = palette.placeholder;
  const borderColor = palette.border;

  const shimmerValue = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const progress = task.imageProgress || 0;
  const isGenerating = task.status === 'generating_images';
  const isReady = task.status === 'images_ready';

  const [selectedId, setSelectedId] = useState<string | null>(task.selectedImageId || null);
  useEffect(() => {
    if (task.selectedImageId) {
      setSelectedId(task.selectedImageId);
    }
  }, [task.selectedImageId]);

  useEffect(() => {
    if (isGenerating) {
      setSelectedId(null);
    }
  }, [isGenerating]);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  useEffect(() => {
    if (isGenerating) {
      Animated.loop(
        Animated.timing(shimmerValue, {
          toValue: 1,
          duration: 1800,
          easing: Easing.ease,
          useNativeDriver: true,
        })
      ).start();
    }
  }, [shimmerValue, isGenerating]);

  const shimmerTranslate = shimmerValue.interpolate({
    inputRange: [0, 1],
    outputRange: [-200, 200],
  });

  const handleSelectImage = (imageId: string) => {
    logger.debug('[ImageGenerating] 选择图片:', imageId, isReady);
    if (!isReady) return;
    setSelectedId(imageId);
    onSelectImage?.(imageId);
  };

  const canGenerateModel = Boolean(selectedId && !isGenerating);

  const handleGenerateModel = () => {
    if (!canGenerateModel) return;
    onGenerateModel?.();
  };

  const handleReset = () => {
    const prompt = encodeURIComponent(task.prompt) || '';
    onResetPlace && onResetPlace(prompt);
  };

  const headerTitle = t('create.imageSelection.title');
  const headerSubtitle = isGenerating
    ? t('create.imageSelection.generating')
    : t('create.imageSelection.selectHint');
  const regenerateColor = isGenerating ? secondaryTextColor : palette.accent;
  const regenerateIcon: IconSymbolName = isGenerating ? 'hourglass' : 'arrow.clockwise';

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
        {!isNotBack && (
          <TouchableOpacity onPress={onCancel} activeOpacity={0.7} style={styles.backButton}>
            <IconSymbol name="chevron.left" size={24} color={textColor} />
          </TouchableOpacity>
        )}
        <View style={styles.headerTitles}>
          <Text style={[styles.headerTitle, { color: textColor }]}>{headerTitle}</Text>
          <Text style={[styles.headerSubtitle, { color: secondaryTextColor }]}>
            {headerSubtitle}
          </Text>
        </View>
        <View style={styles.headerSpacer} />
      </Animated.View>

      <Animated.ScrollView
        style={[styles.contentScroll, { opacity: fadeAnim }]}
        contentContainerStyle={[
          styles.contentScrollContent,
          { paddingBottom: paddingBottom + Spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <View style={styles.grid}>
          {isGenerating
            ? [0, 1, 2, 3].map(index => {
                const isCurrent = Math.floor(progress / 25) === index;
                return (
                  <View key={index} style={styles.cardWrapper}>
                    <View
                      style={[
                        styles.placeholderCard,
                        {
                          backgroundColor: placeholderBg,
                          borderColor: isCurrent ? palette.accent : borderColor,
                          borderWidth: isCurrent ? 2 : 1,
                        },
                        Platform.select({
                          ios: {
                            shadowColor: '#0b1738',
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: isCurrent ? 0.25 : 0.1,
                            shadowRadius: isCurrent ? 14 : 8,
                          },
                          android: {
                            elevation: isCurrent ? 4 : 1,
                          },
                        }),
                      ]}
                    >
                      {isCurrent && (
                        <Animated.View
                          style={[
                            styles.shimmer,
                            { transform: [{ translateX: shimmerTranslate }] },
                          ]}
                        >
                          <LinearGradient
                            colors={['transparent', 'rgba(38,128,255,0.35)', 'transparent']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.shimmerGradient}
                          />
                        </Animated.View>
                      )}
                      <View style={styles.placeholderIconWrapper}>
                        <IconSymbol
                          name="photo.on.rectangle"
                          size={26}
                          color={palette.placeholderIcon}
                        />
                      </View>
                    </View>
                  </View>
                );
              })
            : task.images?.map(image => {
                const isSelected = selectedId === image.id;
                return (
                  <TouchableOpacity
                    key={image.id}
                    style={styles.cardWrapper}
                    onPress={() => handleSelectImage(image.id)}
                    activeOpacity={0.85}
                  >
                    <View
                      style={[
                        styles.imageCard,
                        {
                          backgroundColor: palette.card,
                          borderColor: isSelected ? palette.accent : borderColor,
                          borderWidth: isSelected ? 2 : 1,
                        },
                        Platform.select({
                          ios: {
                            shadowColor: isSelected ? palette.accent : '#0b1738',
                            shadowOffset: { width: 0, height: isSelected ? 10 : 2 },
                            shadowOpacity: isSelected ? 0.3 : 0.08,
                            shadowRadius: isSelected ? 20 : 10,
                          },
                          android: {
                            elevation: isSelected ? 6 : 1,
                          },
                        }),
                      ]}
                    >
                      <Image
                        source={{ uri: image.imageUrl || image.url || image.thumbnail }}
                        style={styles.image}
                        resizeMode="cover"
                      />
                      {isSelected && (
                        <View style={[styles.selectionBadge, { backgroundColor: palette.accent }]}>
                          <IconSymbol name="checkmark" size={16} color="#FFFFFF" />
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
        </View>

        <View style={[styles.footer, { backgroundColor }]}>
          <View style={styles.footerRow}>
            <TouchableOpacity
              style={[
                styles.secondaryButton,
                {
                  borderColor,
                  backgroundColor: palette.card,
                  opacity: isGenerating ? 0.7 : 1,
                },
              ]}
              onPress={handleReset}
              disabled={isGenerating}
              activeOpacity={0.8}
            >
              <IconSymbol name={regenerateIcon} size={18} color={regenerateColor} />
              <Text style={[styles.secondaryButtonText, { color: regenerateColor }]}>
                {isGenerating ? t('create.generating') : t('create.regenerate')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.primaryButtonWrapper, { flex: 1 }]}
              onPress={handleGenerateModel}
              disabled={!canGenerateModel}
              activeOpacity={0.85}
            >
              {canGenerateModel ? (
                <LinearGradient
                  colors={[palette.accent, isDark ? '#4C86FD' : '#5A8BFF']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.primaryButton}
                >
                  <IconSymbol name="cube.fill" size={18} color="#FFFFFF" />
                  <Text style={styles.primaryButtonText}>
                    {t('create.imageSelection.generate3D')}
                  </Text>
                </LinearGradient>
              ) : (
                <View style={[styles.primaryButton, { backgroundColor: palette.disabled }]}>
                  <IconSymbol name="cube.fill" size={18} color="#FFFFFF" />
                  <Text style={styles.primaryButtonText}>
                    {t('create.imageSelection.generate3D')}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitles: {
    flex: 1,
    gap: 2,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: FontWeight.bold,
  },
  headerSubtitle: {
    fontSize: FontSize.sm,
  },
  headerSpacer: {
    width: 44,
  },
  statusBlock: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: 4,
    borderWidth: 1,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.sm,
    borderRadius: 20,
    alignItems: 'flex-start',
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: FontWeight.bold,
  },
  statusTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusCaption: {
    fontSize: FontSize.sm,
  },
  contentScroll: {
    flex: 1,
  },
  contentScrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    gap: Spacing.lg,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  cardWrapper: {
    width: '48%',
    aspectRatio: 1,
    marginBottom: 16,
  },
  placeholderCard: {
    flex: 1,
    borderRadius: 30,
    borderWidth: 1,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderIconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.45)',
  },
  shimmer: {
    ...StyleSheet.absoluteFillObject,
  },
  shimmerGradient: {
    flex: 1,
  },
  imageCard: {
    flex: 1,
    borderRadius: 32,
    borderWidth: 1,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  selectionBadge: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    paddingTop: Spacing.md,
    gap: Spacing.md,
    borderRadius: 28,
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
  },
  footerRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  secondaryButton: {
    borderWidth: 1,
    borderRadius: BorderRadius.full,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    flex: 1,
  },
  secondaryButtonText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
  },
  primaryButtonWrapper: {
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  primaryButton: {
    borderRadius: BorderRadius.full,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
  },
});
