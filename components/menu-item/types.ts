/**
 * MenuItem 组件的 Props 类型定义
 *
 * 菜单项组件用于个人中心页面的功能入口展示
 * 支持平台特定的视觉风格（iOS/Android）
 */

import type { StyleProp, ViewStyle } from 'react-native';
import type { IconSymbolName } from '@/components/ui/icon-symbol';

/**
 * 菜单项 Props 接口
 */
export interface MenuItemProps {
  /** 菜单项图标名称（SF Symbols 或 Material Icons） */
  icon: IconSymbolName;
  /** 菜单项标题文本 */
  title: string;
  /** 可选的描述文本（显示在标题下方） */
  subtitle?: string;
  /** 点击事件处理函数 */
  onPress: () => void;
  /** 自定义容器样式 */
  containerStyle?: StyleProp<ViewStyle>;
  /** 是否显示右箭头（默认显示） */
  showArrow?: boolean;
  /** 是否启用（默认启用） */
  disabled?: boolean;
}
