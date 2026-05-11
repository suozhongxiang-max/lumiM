/**
 * OTA 更新组件类型定义
 */

import { type StyleProp, type ViewStyle } from 'react-native';

/**
 * OTA 更新按钮属性
 */
export interface OtaUpdateButtonProps {
  /** 按钮样式 */
  style?: StyleProp<ViewStyle>;
  /** 是否显示加载状态 */
  showLoading?: boolean;
  /** 检查完成回调 */
  onCheckComplete?: (hasUpdate: boolean) => void;
}
