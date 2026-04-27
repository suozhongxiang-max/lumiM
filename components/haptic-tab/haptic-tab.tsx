/**
 * 统一的 HapticTab 组件
 * 底部标签栏按钮，带有统一的触觉反馈
 */

import { PlatformPressable } from '@react-navigation/elements';
import * as Haptics from 'expo-haptics';
import type { HapticTabProps } from './types';

/**
 * HapticTab 组件
 * 为底部标签栏提供统一的触觉反馈体验
 *
 * @param props - 底部标签栏按钮属性
 */
export function HapticTab(props: HapticTabProps) {
  return (
    <PlatformPressable
      {...props}
      onPressIn={ev => {
        // 统一使用 Medium 触觉反馈强度
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {
          // 如果设备不支持触觉反馈，静默失败
        });

        // 调用原有的 onPressIn 回调
        props.onPressIn?.(ev);
      }}
    />
  );
}
