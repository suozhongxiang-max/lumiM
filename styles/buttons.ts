import { Platform } from 'react-native';

/**
 * 按钮样式变体
 * 统一应用中的按钮样式，避免硬编码
 */

export const buttonStyles = {
  /** 主要按钮样式 - 蓝色背景，圆角16px */
  primary: {
    backgroundColor: '#007AFF',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 12,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    minWidth: 120,
  },

  /** 次要按钮样式 - 灰色背景，圆角16px */
  secondary: {
    backgroundColor: '#F2F2F7',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },

  /** 文本按钮样式 - 无背景，用于轻量操作 */
  text: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },

  /** 小型按钮样式 */
  small: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    minWidth: 80,
  },
};

/** 按钮文字样式 */
export const buttonTextStyles = {
  primary: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  secondary: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '500' as const,
  },
  text: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '500' as const,
  },
  small: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500' as const,
  },
};

/** 平台特定按钮调整 */
export const getPlatformButtonStyle = (baseStyle: any) => {
  return Platform.select({
    ios: baseStyle,
    android: {
      ...baseStyle,
      // Android 可以添加特定的调整，如最小触摸区域
      minHeight: 48,
    },
  });
};
