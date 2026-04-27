/**
 * 统一的图标组件
 * 使用 Ionicons 作为跨平台图标库，提供一致的视觉效果
 */

import { logger } from '@/utils/logger';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ComponentProps } from 'react';
import { type StyleProp, type TextStyle } from 'react-native';

/**
 * 图标名称映射表
 * 将原有的 SF Symbols 名称映射到 Ionicons 名称
 */
const ICON_MAPPING = {
  // 导航和基础操作
  'house.fill': 'home', // 主页
  'paperplane.fill': 'send', // 发送
  'chevron.right': 'chevron-forward', // 右箭头
  'chevron.left': 'chevron-back', // 左箭头
  'chevron.back': 'chevron-back', // 返回箭头
  'chevron.forward': 'chevron-forward', // 前进箭头
  'chevron.left.forwardslash.chevron.right': 'code-slash', // 代码
  magnifyingglass: 'search', // 搜索
  checkmark: 'checkmark', // 对勾
  'xmark.circle': 'close-circle', // 关闭圆圈

  // 功能性图标
  'wand.and.stars': 'sparkles', // 魔法棒/AI
  sparkles: 'sparkles-outline', // 星星
  'plus.circle': 'add-circle-outline', // 添加
  'arrow.clockwise': 'reload', // 刷新
  'arrow.down.circle': 'cloud-download-outline', // 下载
  ellipsis: 'ellipsis-horizontal', // 更多
  'exclamationmark.triangle.fill': 'warning', // 警告
  'exclamationmark.triangle': 'warning-outline', // 警告（空心）
  'camera.fill': 'camera', // 摄像头
  'grid.Feather': 'grid', // 网格
  'clear.col': 'close-circle-outline', // 清除

  // 用户和社交
  'person.fill': 'person', // 用户
  'person.crop.circle': 'person-circle', // 用户头像
  heart: 'heart', // 喜欢（实心）
  'heart-outline': 'heart-outline', // 喜欢（空心）
  star: 'star', // 收藏/星标（实心）
  'star-outline': 'star-outline', // 收藏/星标（空心）
  bookmark: 'bookmark-outline', // 收藏
  eye: 'eye', // 浏览/查看（实心）
  'eye-outline': 'eye-outline', // 浏览/查看（空心）
  'square.and.arrow.up': 'share-outline', // 分享

  // 内容和媒体
  'photo.on.rectangle': 'images-outline', // 图片
  safari: 'compass-outline', // 浏览/探索
  cube: 'cube-outline', // 3D 立方体
  'cube.fill': 'cube', // 3D 立方体（实心）
  'cube.box.fill': 'cube', // 3D 打印机

  // 工具和设置
  'printer.fill': 'print', // 打印
  clock: 'time-outline', // 时间
  hourglass: 'hourglass-outline', // 沙漏
  'triangle.fill': 'triangle', // 三角形
  'doc.badge.gearshape': 'document-text-outline', // 文档设置
  'wifi.slash': 'wifi-outline', // WiFi 断开

  // 主题和分类
  'pawprint.fill': 'paw', // 宠物
  'building.2.fill': 'business', // 建筑
  'cpu.fill': 'hardware-chip', // 芯片
  'leaf.fill': 'leaf', // 自然
  'building.columns': 'business-outline', // 商业
  'car.fill': 'car', // 汽车
} as const;

// 导出图标名称类型
export type IconSymbolName = keyof typeof ICON_MAPPING;

// Ionicons 图标组件的属性类型
type IoniconsName = ComponentProps<typeof Ionicons>['name'];

/**
 * IconSymbol 组件属性
 */
export interface IconSymbolProps {
  /** 图标名称（使用原 SF Symbols 名称，会自动映射到 Ionicons） */
  name: IconSymbolName;
  /** 图标大小（默认 24） */
  size?: number;
  /** 图标颜色 */
  color: string;
  /** 自定义样式 */
  style?: StyleProp<TextStyle>;
  /** 权重（保留用于兼容性，Ionicons 不支持，将被忽略） */
  weight?: 'regular' | 'semibold' | 'bold';
}

/**
 * 统一的图标组件
 *
 * 使用示例:
 * ```tsx
 * <IconSymbol name="house.fill" size={24} color="#000" />
 * <IconSymbol name="sparkles" size={32} color="blue" />
 * ```
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
  weight, // weight 参数保留用于兼容性，但 Ionicons 不支持
}: IconSymbolProps) {
  // 从映射表获取 Ionicons 图标名称
  const iconName = ICON_MAPPING[name] as IoniconsName;

  // 如果映射表中没有找到，记录警告并使用默认图标
  if (!iconName) {
    logger.warn(`未找到图标映射: ${name}, 使用默认图标 "help-circle-outline"`);
  }

  return (
    <Ionicons name={iconName || 'help-circle-outline'} size={size} color={color} style={style} />
  );
}
