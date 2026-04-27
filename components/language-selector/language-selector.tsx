/**
 * 语言选择弹窗组件
 */

import { useColorScheme } from '@/hooks/use-color-scheme';
import { useI18n } from '@/hooks/use-i18n';
import type { SupportedLanguage } from '@/i18n';
import { getSupportedLanguages, LANGUAGES, resolveLanguage } from '@/i18n';
import { showSuccess } from '@/components/toast';
import { logger } from '@/utils/logger';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface LanguageSelectorProps {
  visible: boolean;
  onClose: () => void;
  currentLanguage: SupportedLanguage;
  onLanguageChange: (language: SupportedLanguage) => Promise<void>;
  isLoading?: boolean;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  visible,
  onClose,
  currentLanguage,
  onLanguageChange,
  isLoading = false,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme.isDark;
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const prevLoadingRef = useRef(isLoading);

  const backgroundColor = isDark ? '#2C2C2E' : '#FFFFFF';
  const textColor = isDark ? '#FFFFFF' : '#111A2C';
  const secondaryTextColor = isDark ? '#AEAEB2' : '#576482';
  const itemBackgroundColor = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)';
  const borderColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';

  const supportedLanguages = getSupportedLanguages();

  // 监听loading状态变化，从loading变为完成时关闭弹窗
  useEffect(() => {
    // 如果之前是loading状态，现在不是loading了，说明切换完成了
    if (prevLoadingRef.current && !isLoading && visible) {
      logger.info('语言切换完成，关闭弹窗');
      // 显示切换成功的提示
      showSuccess('language.switchSuccess');
      onClose();
    }
    // 更新ref
    prevLoadingRef.current = isLoading;
  }, [isLoading, visible, onClose]);

  const handleLanguagePress = async (language: SupportedLanguage) => {
    if (isLoading) return; // loading时禁止操作

    logger.info('用户选择语言:', language);
    try {
      await onLanguageChange(language);
      // onLanguageChange 完成后，useEffect 会自动关闭弹窗
    } catch (error) {
      logger.error('切换语言失败:', error);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor, paddingBottom: 24 + insets.bottom }]}>
          {/* 标题栏 */}
          <View style={[styles.header, { borderBottomColor: borderColor }]}>
            <View style={styles.titleContainer}>
              <Text style={[styles.title, { color: textColor }]}>{t('language.title')}</Text>
              {isLoading && (
                <ActivityIndicator size="small" color="#3B82F6" style={styles.titleLoading} />
              )}
            </View>
            {!isLoading && (
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={secondaryTextColor} />
              </TouchableOpacity>
            )}
            {isLoading && <View style={styles.closeButtonPlaceholder} />}
          </View>

          {/* 语言列表 */}
          <ScrollView
            style={styles.languageList}
            showsVerticalScrollIndicator={false}
            scrollEnabled={!isLoading} // loading时禁止滚动
          >
            {supportedLanguages.map(language => {
              const isSelected = language.code === currentLanguage;
              const isCurrentItemLoading = isLoading && isSelected;

              // 对于 'auto' 模式，显示系统当前使用的语言
              const displayFlag =
                language.code === 'auto' ? LANGUAGES[resolveLanguage('auto')].flag : language.flag;

              // 对于 'auto' 模式，使用翻译文本而不是硬编码
              const displayName =
                language.code === 'auto' ? t('language.auto') : language.nativeName;
              const displaySubName =
                language.code === 'auto' ? t('language.selectLanguage') : language.name;

              return (
                <TouchableOpacity
                  key={language.code}
                  style={[
                    styles.languageItem,
                    {
                      backgroundColor: isSelected ? 'rgba(59, 130, 246, 0.1)' : itemBackgroundColor,
                      borderColor: isSelected ? '#3B82F6' : borderColor,
                      opacity: isLoading ? 0.5 : 1, // loading时降低透明度
                    },
                  ]}
                  onPress={() => handleLanguagePress(language.code)}
                  activeOpacity={0.7}
                  disabled={isLoading} // loading时禁用
                >
                  <View style={styles.languageInfo}>
                    <Text style={styles.languageFlag}>{displayFlag}</Text>
                    <View style={styles.languageTextContainer}>
                      <Text style={[styles.languageName, { color: textColor }]} numberOfLines={1}>
                        {displayName}
                      </Text>
                      <Text
                        style={[styles.languageSubName, { color: secondaryTextColor }]}
                        numberOfLines={1}
                      >
                        {displaySubName}
                      </Text>
                    </View>
                  </View>
                  {isCurrentItemLoading ? (
                    <ActivityIndicator size="small" color="#3B82F6" />
                  ) : (
                    isSelected && <Ionicons name="checkmark-circle" size={24} color="#3B82F6" />
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 16,
    paddingBottom: 24,
    maxHeight: '65%', // 增加高度，让3个选项都能显示
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
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
  closeButton: {
    padding: 8,
  },
  closeButtonPlaceholder: {
    width: 40,
  },
  languageList: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  languageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 8,
    borderRadius: 16,
    borderWidth: 1,
  },
  languageInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  languageFlag: {
    fontSize: 28,
    marginRight: 12,
  },
  languageTextContainer: {
    flex: 1,
  },
  languageName: {
    fontSize: 16,
    fontWeight: '600',
  },
  languageSubName: {
    fontSize: 14,
    marginTop: 2,
  },
});
