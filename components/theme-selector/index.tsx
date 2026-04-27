/**
 * 主题选择器组件
 * 支持跟随系统、手动切换
 */

import { useEffect, useMemo, useRef } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { FontSize, FontWeight, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useI18n } from '@/hooks/use-i18n';
import { useThemeStore, ThemeMode } from '@/stores';
import { logger } from '@/utils/logger';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ThemeSelectorProps {
  visible: boolean;
  onClose: () => void;
  isLoading?: boolean;
  onThemeChange?: (mode: ThemeMode) => Promise<void>;
}

export function ThemeSelector({ visible, onClose, isLoading = false, onThemeChange }: ThemeSelectorProps) {
  const colorScheme = useColorScheme();
  const { t } = useI18n();
  const { themeMode, setThemeMode } = useThemeStore();
  const insets = useSafeAreaInsets();
  const prevLoadingRef = useRef(isLoading);

  // 实时计算当前是否为深色模式
  // 优先使用用户的主题设置，如果用户选择的是 auto，则使用系统设置
  const isDark = themeMode === 'dark' || (themeMode === 'auto' && colorScheme.isDark);

  // 使用 useMemo 确保主题变化时重新计算颜色
  const colors = useMemo(() => getPalette(isDark), [isDark, themeMode]);

  // 监听loading状态变化，从loading变为完成时关闭弹窗
  useEffect(() => {
    // 如果之前是loading状态，现在不是loading了，说明切换完成了
    if (prevLoadingRef.current && !isLoading && visible) {
      logger.info('主题切换完成，关闭弹窗');
      onClose();
    }
    // 更新ref
    prevLoadingRef.current = isLoading;
  }, [isLoading, visible, onClose]);

  /**
   * 选择主题模式
   */
  const handleSelectMode = async (mode: ThemeMode) => {
    if (isLoading) return; // loading时禁止操作

    logger.info('选择主题模式:', mode);

    // 如果提供了 onThemeChange 回调，使用它；否则直接设置主题
    if (onThemeChange) {
      try {
        await onThemeChange(mode);
      } catch (error) {
        logger.error('主题切换失败:', error);
      }
    } else {
      setThemeMode(mode);
      // 如果没有回调，立即关闭弹窗
      onClose();
    }
  };

  /**
   * 主题选项配置
   */
  const themeOptions = [
    {
      mode: 'auto' as ThemeMode,
      label: t('appearance.followSystem'),
      icon: 'phone-portrait-outline',
      description: t('appearance.followSystemDesc'),
    },
    {
      mode: 'light' as ThemeMode,
      label: t('appearance.lightMode'),
      icon: 'sunny-outline',
      description: t('appearance.lightModeDesc'),
    },
    {
      mode: 'dark' as ThemeMode,
      label: t('appearance.darkMode'),
      icon: 'moon-outline',
      description: t('appearance.darkModeDesc'),
    },
  ];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      {/* 背景遮罩 */}
      <View style={[styles.overlay, { backgroundColor: colors.modalOverlay }]}>
        <View style={[styles.modalContent, { backgroundColor: colors.modalBackground, paddingBottom: 24 + insets.bottom }]}>
          {/* 标题栏 */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={styles.titleContainer}>
              <ThemedText style={[styles.title, { color: colors.text }]}>{t('appearance.title')}</ThemedText>
              {isLoading && (
                <ActivityIndicator size="small" color="#3B82F6" style={styles.titleLoading} />
              )}
            </View>
            {!isLoading && (
              <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            )}
            {isLoading && <View style={styles.closeButtonPlaceholder} />}
          </View>

          {/* 主题模式选择 */}
          <View style={[styles.section, { opacity: isLoading ? 0.5 : 1 }]}>
            <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>{t('appearance.themeMode')}</ThemedText>
            <View style={[styles.card, { backgroundColor: colors.card }]}>
              {themeOptions.map((option) => {
                const isSelected = themeMode === option.mode;
                const isCurrentItemLoading = isLoading && isSelected;

                return (
                  <TouchableOpacity
                    key={option.mode}
                    style={[
                      styles.optionItem,
                      { borderBottomColor: colors.border },
                    ]}
                    onPress={() => handleSelectMode(option.mode)}
                    activeOpacity={0.7}
                    disabled={isLoading}
                  >
                    <View style={[styles.optionIcon, { backgroundColor: colors.iconBackground }]}>
                      <Ionicons
                        name={option.icon as any}
                        size={20}
                        color={isSelected ? colors.accent : colors.icon}
                      />
                    </View>
                    <View style={styles.optionInfo}>
                      <ThemedText style={[styles.optionLabel, { color: colors.text }]}>
                        {option.label}
                      </ThemedText>
                      <ThemedText style={[styles.optionDesc, { color: colors.secondaryText }]}>
                        {option.description}
                      </ThemedText>
                    </View>
                    {isCurrentItemLoading ? (
                      <ActivityIndicator size="small" color="#3B82F6" />
                    ) : (
                      isSelected && (
                        <Ionicons name="checkmark-circle" size={20} color={colors.accent} />
                      )
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

        </View>
      </View>
    </Modal>
  );
}

/**
 * 根据当前主题生成颜色配置
 */
function getPalette(isDark: boolean) {
  return {
    text: isDark ? '#FFFFFF' : '#000000',
    secondaryText: isDark ? '#AEAEB2' : '#8E8E93',
    card: isDark ? '#2C2C2E' : '#FFFFFF',
    border: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
    iconBackground: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
    icon: isDark ? '#AEAEB2' : '#8E8E93',
    accent: '#007AFF',
    switchOff: isDark ? '#3A3A3C' : '#E5E5EA',
    modalOverlay: 'rgba(0, 0, 0, 0.5)',
    modalBackground: isDark ? '#2C2C2E' : '#FFFFFF',
  };
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 16,
    paddingHorizontal: 20,
    paddingBottom: 24,
    maxHeight: '65%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  titleLoading: {
    marginLeft: 8,
  },
  closeButtonPlaceholder: {
    width: 40,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  card: {
    borderRadius: 16,
    paddingVertical: 4,
    overflow: 'hidden',
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  optionInfo: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  optionDesc: {
    fontSize: 14,
  },
});
