/**
 * 打印机选择器组件类型定义
 */

import { PrinterListItem } from '@/types';

/**
 * 打印机选择器主组件 Props
 */
export interface PrinterSelectorProps {
  // 是否显示选择器
  visible: boolean;
  // 打印机列表
  printers: PrinterListItem[];
  // 当前选中的打印机 ID
  selectedPrinterId: string | null;
  // 选择打印机回调
  onSelect: (deviceId: string) => void;
  // 关闭选择器回调
  onClose: () => void;
  // 添加打印机回调
  onAddPrinter: () => void;
  // 删除打印机回调
  onDelete: (deviceId: string) => void;
}

/**
 * 打印机选项项组件 Props
 */
export interface PrinterOptionItemProps {
  // 打印机信息
  printer: PrinterListItem;
  // 是否选中
  isSelected: boolean;
  // 点击回调
  onPress: () => void;
  // 删除回调
  onDelete: (deviceId: string, deviceName: string) => void;
}
