/**
 * 平台相关工具函数
 */

import { Platform } from 'react-native';

// 平台判断
export const isIOS = Platform.OS === 'ios';
export const isAndroid = Platform.OS === 'android';
export const isWeb = Platform.OS === 'web';

// 平台选择辅助函数
export function platformSelect<T>(config: { ios?: T; android?: T; web?: T; default: T }): T {
  return Platform.select(config) as T;
}
