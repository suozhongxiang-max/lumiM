import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

/**
 * 瀑布流网格组件的 Props 接口
 *
 * @template T - 数据项的类型
 */
export interface MasonryGridProps<T> {
  // ==================== 数据 ====================
  /**
   * 数据数组
   */
  data: T[];

  /**
   * 渲染单个数据项的函数
   * @param item - 数据项
   * @returns React 元素
   */
  renderItem: (item: T) => ReactNode;

  /**
   * 提取数据项的唯一 key 的函数
   * @param item - 数据项
   * @returns 唯一标识符
   */
  keyExtractor: (item: T) => string;

  // ==================== 布局配置 ====================
  /**
   * 列数，默认 2
   */
  numColumns?: number;

  /**
   * 列之间的间距（px），默认 12
   */
  columnGap?: number;

  /**
   * 行之间的间距（px），默认 12
   */
  rowGap?: number;

  // ==================== 刷新 ====================
  /**
   * 是否正在刷新
   */
  refreshing?: boolean;

  /**
   * 下拉刷新回调
   */
  onRefresh?: () => void;

  // ==================== 加载更多 ====================
  /**
   * 滚动到底部的回调
   */
  onEndReached?: () => void;

  /**
   * 距离底部多少像素时触发 onEndReached，默认 100
   */
  onEndReachedThreshold?: number;

  // ==================== 自定义组件 ====================
  /**
   * 列表为空时显示的组件
   */
  ListEmptyComponent?: ReactNode;

  /**
   * 列表头部组件
   */
  ListHeaderComponent?: ReactNode;

  /**
   * 列表底部组件
   */
  ListFooterComponent?: ReactNode;

  // ==================== 样式 ====================
  /**
   * 容器样式
   */
  containerStyle?: StyleProp<ViewStyle>;

  /**
   * 内容容器样式
   */
  contentContainerStyle?: StyleProp<ViewStyle>;
}
