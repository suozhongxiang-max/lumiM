/**
 * 主题管理 Store
 * 支持跟随系统、手动切换
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 主题模式类型
export type ThemeMode = 'light' | 'dark' | 'auto';

// 主题状态接口
interface ThemeState {
  // 当前主题模式
  themeMode: ThemeMode;
  // 是否生效的深色模式（实际使用的模式）
  isDark: boolean;
}

// 主题操作接口
interface ThemeActions {
  // 设置主题模式
  setThemeMode: (mode: ThemeMode) => void;
  // 切换深色/浅色模式（手动）
  toggleTheme: () => void;
  // 根据当前时间和系统设置计算实际主题
  updateEffectiveTheme: (systemColorScheme: 'light' | 'dark' | null) => void;
}

// 创建主题 Store
export const useThemeStore = create<ThemeState & ThemeActions>()(
  persist(
    (set, get) => ({
      // 初始状态
      themeMode: 'auto',
      isDark: false,

      // 设置主题模式
      setThemeMode: (mode) => {
        set({ themeMode: mode });
        // 立即更新实际主题
        get().updateEffectiveTheme(null);
      },

      // 手动切换主题
      toggleTheme: () => {
        const currentMode = get().themeMode;
        if (currentMode === 'auto') {
          // 如果当前是自动，切换到手动并反转当前状态
          const currentDark = get().isDark;
          set({ themeMode: currentDark ? 'light' : 'dark' });
        } else {
          // 如果是手动，直接反转
          set({ themeMode: currentMode === 'light' ? 'dark' : 'light' });
        }
        // 立即更新实际主题
        get().updateEffectiveTheme(null);
      },

      // 根据当前时间和系统设置计算实际主题
      updateEffectiveTheme: (systemColorScheme) => {
        const { themeMode } = get();
        let isDark = false;

        // 如果传入的是 null，尝试从当前状态推断
        if (themeMode === 'auto') {
          // 跟随系统
          isDark = systemColorScheme === 'dark';
        } else if (themeMode === 'dark') {
          // 手动深色
          isDark = true;
        } else {
          // 手动浅色
          isDark = false;
        }

        set({ isDark });
      },
    }),
    {
      name: 'theme-storage',
      storage: createJSONStorage(() => AsyncStorage),
      // 在 Store 创建后立即初始化主题
      onRehydrateStorage: () => (state) => {
        // 从持久化存储恢复后，立即计算实际主题
        if (state) {
          // 使用 requestAnimationFrame 确保在下一帧执行
          requestAnimationFrame(() => {
            state.updateEffectiveTheme(null);
          });
        }
      },
    }
  )
);
