/**
 * 阴影样式库
 * 统一的阴影效果定义
 */

import { Platform, type ViewStyle } from 'react-native';

export const shadows = {
  none: {
    shadowOpacity: 0,
    elevation: 0,
  } as ViewStyle,

  small: (isDark: boolean): ViewStyle =>
    Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: isDark ? 0.2 : 0.05,
        shadowRadius: 2,
      },
      android: { elevation: 2 },
      default: {},
    }) as ViewStyle,

  medium: (isDark: boolean): ViewStyle =>
    Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: isDark ? 0.3 : 0.08,
        shadowRadius: 8,
      },
      android: { elevation: 4 },
      default: {},
    }) as ViewStyle,

  large: (isDark: boolean): ViewStyle =>
    Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: isDark ? 0.4 : 0.12,
        shadowRadius: 16,
      },
      android: { elevation: 8 },
      default: {},
    }) as ViewStyle,
};
