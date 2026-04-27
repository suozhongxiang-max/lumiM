/**
 * MenuGroup 组件的 Props 类型定义
 *
 * 菜单分组组件用于将相关的菜单项组织在一起
 * 提供统一的容器样式和间距
 */

import type { StyleProp, ViewStyle } from 'react-native';
import type { ReactNode } from 'react';

/**
 * 菜单分组 Props 接口
 */
export interface MenuGroupProps {
  /** 分组内容（MenuItem 组件） */
  children: ReactNode;
  /** 自定义容器样式 */
  containerStyle?: StyleProp<ViewStyle>;
  /** 分组标题（可选） */
  title?: string;
}
