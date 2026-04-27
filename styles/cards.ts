import { Platform } from 'react-native';

/**
 * 卡片容器样式变体
 * 统一应用中的卡片布局样式
 */

export const cardStyles = {
  /** 标准卡片 - 16px圆角，16px内边距 */
  standard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },

  /** 紧凑卡片 - 12px圆角，12px内边距 */
  compact: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },

  /** 大型卡片 - 20px圆角，20px内边距 */
  large: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
  },

  /** 无边距卡片 - 用于列表项 */
  noMargin: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 0,
  },

  /** 圆形卡片 */
  round: {
    borderRadius: 999,
    padding: 16,
    marginBottom: 16,
    aspectRatio: 1,
  },
};

/** 卡片背景色 */
export const cardBackgrounds = {
  light: {
    backgroundColor: '#FFFFFF',
  },
  dark: {
    backgroundColor: '#1C1C1E',
  },
  glass: {
    // 用于毛玻璃效果的背景
    backgroundColor: Platform.select({
      ios: 'rgba(255, 255, 255, 0.8)',
      android: 'rgba(255, 255, 255, 0.95)',
    }),
  },
};

/** 卡片阴影样式（结合现有的 shadows.ts） */
export const cardShadows = {
  none: {},
  small: {
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  medium: {
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  large: {
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
};

/** 获取完整卡片样式 */
export const getCardStyle = (
  variant: keyof typeof cardStyles = 'standard',
  background: keyof typeof cardBackgrounds = 'light',
  shadow: keyof typeof cardShadows = 'small'
) => {
  return {
    ...cardStyles[variant],
    ...cardBackgrounds[background],
    ...cardShadows[shadow],
  };
};
