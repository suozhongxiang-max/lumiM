import React from 'react';
import { Colors } from '@/constants/theme';
import type { TextStyle } from 'react-native';
import type { NativeStackNavigationOptions } from '@react-navigation/native-stack';
import { HeaderGradientBackground } from '@/components/navigation/header-gradient';
import type { ColorScheme } from '@/hooks/use-color-scheme';

interface ImmersiveHeaderOptions {
  title?: string;
  colorScheme: ColorScheme;
  transparent?: boolean;
  /**
   * 透明模式下文字/图标颜色，默认白色
   */
  transparentTintColor?: string;
}

/**
 * 统一创建带渐变背景的沉浸式导航栏配置
 */
export function createImmersiveHeaderOptions({
  title,
  colorScheme,
  transparent = false,
  transparentTintColor,
}: ImmersiveHeaderOptions): NativeStackNavigationOptions {
  const scheme = colorScheme.isDark ? 'dark' : 'light';
  const palette = Colors[scheme];

  const tintColor = transparent ? transparentTintColor || '#FFFFFF' : palette.text;

  return {
    headerShown: true,
    headerTitle: title || '',
    headerTitleAlign: 'center', // 标题居中显示
    headerTitleStyle: {
      color: tintColor,
      fontWeight: '600' as TextStyle['fontWeight'],
    } satisfies TextStyle,
    headerTintColor: tintColor,
    headerTransparent: transparent,
    headerStyle: {
      backgroundColor: transparent ? 'transparent' : palette.background,
    },
    headerShadowVisible: !transparent,
    headerBackVisible: true, // 强制显示返回按钮
    headerBackground: transparent
      ? function HeaderBackground() {
          return React.createElement(HeaderGradientBackground, null);
        }
      : undefined,
  };
}
