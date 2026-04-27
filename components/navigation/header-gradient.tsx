import React from 'react';
import { StyleSheet } from 'react-native';
import { LinearGradient, LinearGradientProps } from 'expo-linear-gradient';

interface HeaderGradientBackgroundProps {
  /**
   * 渐变颜色列表，默认从深到浅的透明黑
   */
  colors?: LinearGradientProps['colors'];
  /**
   * 自定义样式
   */
  style?: LinearGradientProps['style'];
  /**
   * 渐变方向
   */
  start?: LinearGradientProps['start'];
  end?: LinearGradientProps['end'];
}

/**
 * 顶部导航栏使用的渐变背景，帮助透明 Header 与内容自然衔接
 */
export function HeaderGradientBackground({
  colors = ['rgba(0,0,0,0.65)', 'rgba(0,0,0,0.15)', 'rgba(0,0,0,0)'],
  style,
  start = { x: 0, y: 0 },
  end = { x: 0, y: 1 },
}: HeaderGradientBackgroundProps) {
  return (
    <LinearGradient
      colors={colors}
      start={start}
      end={end}
      style={[StyleSheet.absoluteFillObject, style]}
      pointerEvents="none"
    />
  );
}
