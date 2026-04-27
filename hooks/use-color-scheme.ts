/**
 * 颜色模式 Hook
 * 使用主题 Store 管理应用的颜色模式
 */

import { useEffect } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';
import { useThemeStore } from '@/stores';

// 创建一个兼容的对象类型
interface ColorSchemeResult {
  readonly isDark: boolean;
  readonly toString: () => 'light' | 'dark';
  readonly valueOf: () => boolean;
}

// 创建颜色方案对象
function createColorScheme(isDark: boolean): ColorSchemeResult {
  return {
    isDark,
    toString: () => (isDark ? 'dark' : 'light'),
    valueOf: () => isDark,
  };
}

/**
 * 颜色模式 Hook
 * @returns 当前是否为深色模式（boolean）
 *
 * 使用示例：
 * const isDark = useColorScheme();
 * const isDark2 = useColorScheme().isDark;
 * const colorScheme = useColorScheme().toString(); // 'light' | 'dark'
 */
export function useColorScheme(): ColorSchemeResult {
  const systemColorScheme = useRNColorScheme(); // 系统颜色模式：'light' | 'dark' | null
  const { isDark, updateEffectiveTheme } = useThemeStore();

  // 监听系统颜色模式变化，更新实际主题
  useEffect(() => {
    updateEffectiveTheme(systemColorScheme);
  }, [systemColorScheme, updateEffectiveTheme]);

  return createColorScheme(isDark);
}

/**
 * 颜色模式 Hook（字符串版本，向后兼容）
 * @returns 'light' | 'dark'
 *
 * @deprecated 建议使用 useColorScheme() 返回 boolean
 *
 * 使用示例：
 * const colorScheme = useColorSchemeAsString();
 * const isDark = colorScheme === 'dark';
 */
export function useColorSchemeAsString(): 'light' | 'dark' {
  const scheme = useColorScheme();
  return scheme.toString();
}

// 同时导出原始的 React Native hook 以供特殊场景使用
export { useColorScheme as useRNColorScheme } from 'react-native';

