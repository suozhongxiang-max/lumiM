/**
 * 样式混入
 * 可复用的样式组合
 */

import type { TextStyle, ViewStyle } from 'react-native';
import { BorderRadius, Spacing } from '@/constants/theme';

// Flexbox 混入
export const flexCenter: ViewStyle = {
  justifyContent: 'center',
  alignItems: 'center',
};

export const flexRow: ViewStyle = {
  flexDirection: 'row',
};

export const flexColumn: ViewStyle = {
  flexDirection: 'column',
};

export const flexBetween: ViewStyle = {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
};

// 卡片样式
export const cardStyle = (isDark: boolean): ViewStyle => ({
  backgroundColor: isDark ? '#2C2C2E' : '#FFFFFF', // 深色模式使用 #2C2C2E (灰色，不要太黑)
  borderRadius: BorderRadius.lg,
  padding: Spacing.lg,
});

// 文本样式
export const truncateText: TextStyle = {
  overflow: 'hidden',
};
