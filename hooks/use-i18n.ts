/**
 * i18n 国际化 Hook
 * 提供语言切换和翻译功能
 */

import { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  changeLanguage,
  getLanguageDisplayName,
  getSupportedLanguages,
  loadLanguage,
  getCurrentLanguageSetting,
  resolveLanguage,
  type SupportedLanguage,
} from '@/i18n';

/**
 * 使用国际化的 Hook
 */
export function useI18n() {
  const { t } = useTranslation();
  const [currentLanguage, setCurrentLanguage] = useState<SupportedLanguage>('auto');
  const [isLoading, setIsLoading] = useState(false);

  // 初始化语言设置（组件挂载时加载保存的语言）
  useEffect(() => {
    const initLanguage = async () => {
      try {
        // 加载保存的语言设置（可能是 'auto'）
        const savedLang = await loadLanguage();
        setCurrentLanguage(savedLang);
      } catch (error) {
        console.error('初始化语言设置失败:', error);
      }
    };

    initLanguage();
  }, []);

  /**
   * 切换语言
   */
  const switchLanguage = useCallback(async (language: SupportedLanguage) => {
    try {
      setIsLoading(true);
      await changeLanguage(language);
      setCurrentLanguage(language);
      console.log('语言已切换至:', language);
    } catch (error) {
      console.error('切换语言失败:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * 获取所有支持的语言列表
   */
  const supportedLanguages = getSupportedLanguages();

  return {
    t,
    currentLanguage,
    switchLanguage,
    supportedLanguages,
    isLoading,
    getLanguageDisplayName,
  };
}
