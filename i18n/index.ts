/**
 * i18n 国际化配置
 * 支持中文和英文两种语言
 */

import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 导入翻译资源
import zh from './locales/zh.json';
import en from './locales/en.json';

// 存储语言设置的 key
const LANGUAGE_KEY = '@app_language';

// 支持的语言类型（添加 'auto' 表示跟随系统）
export type SupportedLanguage = 'auto' | 'zh' | 'en';

// 语言列表配置
export const LANGUAGES: Record<
  SupportedLanguage,
  { name: string; nativeName: string; flag: string }
> = {
  auto: {
    name: 'Auto',
    nativeName: '跟随系统',
    flag: '🔄',
  },
  zh: {
    name: 'Chinese',
    nativeName: '中文',
    flag: '🇨🇳',
  },
  en: {
    name: 'English',
    nativeName: 'English',
    flag: '🇺🇸',
  },
};

/**
 * 获取设备默认语言（同步）
 * 将 'auto' 转换为实际的语言代码
 */
export const getDeviceLanguage = (): 'zh' | 'en' => {
  const deviceLocales = getLocales();
  const deviceLanguage = deviceLocales[0]?.languageCode || 'zh';

  // 如果设备语言是英文或中文，直接返回
  if (deviceLanguage === 'en' || deviceLanguage === 'zh') {
    return deviceLanguage as 'zh' | 'en';
  }

  // 其他语言默认返回中文
  return 'zh';
};

/**
 * 解析语言设置：将 'auto' 转换为实际语言
 */
export const resolveLanguage = (language: SupportedLanguage): 'zh' | 'en' => {
  if (language === 'auto') {
    return getDeviceLanguage();
  }
  return language;
};

// 立即同步初始化 i18next（模块加载时执行）
// 使用默认语言初始化，稍后异步加载用户保存的语言
const initI18n = () => {
  i18next.use(initReactI18next).init({
    compatibilityJSON: 'v4',
    resources: {
      zh: { translation: zh },
      en: { translation: en },
    },
    lng: 'zh', // 默认语言：中文（稍后会被异步加载的语言替换）
    fallbackLng: 'zh',
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false, // 禁用 Suspense
    },
  });
};

// 立即执行初始化
initI18n();

/**
 * 内部函数：从本地存储加载语言设置
 */
const loadLanguageInternal = async (): Promise<SupportedLanguage> => {
  try {
    const savedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);
    if (
      savedLanguage &&
      (savedLanguage === 'auto' || savedLanguage === 'zh' || savedLanguage === 'en')
    ) {
      return savedLanguage as SupportedLanguage;
    }
  } catch (error) {
    console.error('加载语言设置失败:', error);
  }

  // 如果没有保存的语言设置，默认使用 'auto'（跟随系统）
  return 'auto';
};

/**
 * 保存语言设置到本地存储
 */
export const saveLanguage = async (language: SupportedLanguage): Promise<void> => {
  try {
    await AsyncStorage.setItem(LANGUAGE_KEY, language);
  } catch (error) {
    console.error('保存语言设置失败:', error);
  }
};

/**
 * 从本地存储加载语言设置并应用
 */
export const loadLanguage = async (): Promise<SupportedLanguage> => {
  const savedLanguage = await loadLanguageInternal();

  // 将 'auto' 解析为实际语言
  const actualLanguage = resolveLanguage(savedLanguage);

  // 如果实际语言与当前语言不同，则切换
  if (actualLanguage !== i18next.language) {
    await i18next.changeLanguage(actualLanguage);
  }

  return savedLanguage;
};

/**
 * 切换语言
 */
export const changeLanguage = async (language: SupportedLanguage): Promise<void> => {
  // 保存用户选择的语言设置（可能是 'auto'）
  await saveLanguage(language);

  // 将 'auto' 解析为实际语言并切换
  const actualLanguage = resolveLanguage(language);
  await i18next.changeLanguage(actualLanguage);
};

/**
 * 获取当前语言设置（可能是 'auto'）
 */
export const getCurrentLanguageSetting = async (): Promise<SupportedLanguage> => {
  try {
    const savedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);
    if (
      savedLanguage &&
      (savedLanguage === 'auto' || savedLanguage === 'zh' || savedLanguage === 'en')
    ) {
      return savedLanguage as SupportedLanguage;
    }
  } catch (error) {
    console.error('获取语言设置失败:', error);
  }

  // 默认返回 'auto'
  return 'auto';
};

/**
 * 获取当前实际使用的语言
 */
export const getCurrentLanguage = (): 'zh' | 'en' => {
  return i18next.language as 'zh' | 'en';
};

/**
 * 获取语言显示名称
 */
export const getLanguageDisplayName = (language: SupportedLanguage): string => {
  return LANGUAGES[language].nativeName;
};

/**
 * 获取所有支持的语言列表
 */
export const getSupportedLanguages = (): Array<{
  code: SupportedLanguage;
  name: string;
  nativeName: string;
  flag: string;
}> => {
  return Object.entries(LANGUAGES).map(([code, config]) => ({
    code: code as SupportedLanguage,
    ...config,
  }));
};

// 导出 i18next 实例
export { i18next as i18n };

// 默认导出 i18next 实例
export default i18next;
