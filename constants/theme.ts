/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

export const Colors = {
  light: {
    text: '#000000',
    secondaryText: '#3C3C43',
    tertiaryText: '#8E8E93',
    background: '#F2F2F7', // iOS grouped background
    secondaryBackground: '#FFFFFF', // 卡片背景
    cardBackground: '#FFFFFF',
    inputBackground: '#F2F2F7',
    tint: tintColorLight,
    icon: '#3C3C43',
    tabIconDefault: '#3C3C43',
    tabIconSelected: tintColorLight,
    border: 'rgba(0, 0, 0, 0.15)', // 边框颜色，提高对比度
    separator: 'rgba(60, 60, 67, 0.29)',
    ripple: 'rgba(0, 0, 0, 0.06)', // Android 涟漪效果颜色
  },
  dark: {
    text: '#FFFFFF', // 主要文字 - 白色
    secondaryText: '#AEAEB2', // 次要文字 - 浅灰色
    tertiaryText: '#8E8E93',
    background: '#000000', // iOS grouped background
    secondaryBackground: '#2C2C2E', // 卡片背景 - 灰色（不要太黑）
    cardBackground: '#2C2C2E', // 统一的卡片背景色
    inputBackground: '#2C2C2E',
    tint: tintColorDark,
    icon: '#AEAEB2', // 图标颜色 - 浅灰色
    tabIconDefault: '#AEAEB2',
    tabIconSelected: tintColorDark,
    border: 'rgba(255, 255, 255, 0.2)', // 暗色模式边框，提高对比度
    separator: 'rgba(84, 84, 88, 0.65)',
    ripple: 'rgba(255, 255, 255, 0.08)', // Android 涟漪效果颜色（暗模式）
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});

/**
 * 间距系统 - 8px 基础单位
 */
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

/**
 * 圆角系统
 */
export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 999,
};

/**
 * 字体大小系统
 */
export const FontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 28,
  xxxl: 34,
};

/**
 * 字体粗细
 */
export const FontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

/**
 * Typography 系统 - 预定义的文字样式
 */
export const Typography = {
  // 大标题
  title1: {
    fontSize: FontSize.xxxl,
    fontWeight: FontWeight.bold,
  },
  title2: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
  },
  title3: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.semibold,
  },
  // 标题
  headline: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
  },
  // 正文
  body: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.regular,
  },
  // 次要文字
  callout: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.regular,
  },
  // 说明文字
  caption1: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.regular,
  },
  caption2: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.regular,
  },
};
