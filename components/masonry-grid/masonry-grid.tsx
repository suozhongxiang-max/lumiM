import React, { useMemo, useRef, useCallback } from 'react';
import {
  ScrollView,
  View,
  RefreshControl,
  StyleSheet,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
} from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import type { MasonryGridProps } from './types';
import { logger } from '@/utils/logger';

/**
 * 瀑布流网格组件
 *
 * 通用的双列（或多列）瀑布流布局组件
 * 支持下拉刷新、滚动加载更多、自动保存滚动位置等功能
 *
 * @template T - 数据项的类型
 *
 * @example
 * ```tsx
 * <MasonryGrid
 *   data={models}
 *   renderItem={(model) => <ModelCard model={model} />}
 *   keyExtractor={(model) => model.id}
 *   numColumns={2}
 *   refreshing={refreshing}
 *   onRefresh={handleRefresh}
 *   onEndReached={handleLoadMore}
 * />
 * ```
 */
export function MasonryGrid<T>({
  data,
  renderItem,
  keyExtractor,
  numColumns = 2,
  columnGap = 12,
  rowGap = 12,
  refreshing = false,
  onRefresh,
  onEndReached,
  onEndReachedThreshold = 100,
  ListEmptyComponent,
  ListHeaderComponent,
  ListFooterComponent,
  containerStyle,
  contentContainerStyle,
}: MasonryGridProps<T>) {
  // ==================== Refs ====================
  // ScrollView 引用，用于控制滚动
  const scrollViewRef = useRef<ScrollView>(null);
  // 滚动位置引用，用于保存和恢复滚动位置
  const scrollPositionRef = useRef(0);
  // 是否正在滚动到底部的标志，避免重复触发
  const isLoadingMoreRef = useRef(false);

  // 监听页面焦点状态，用于恢复滚动位置
  const isFocused = useIsFocused();

  // ==================== 计算列数据 ====================
  /**
   * 将数据分配到各列
   * 使用简单的轮流分配算法：第 0、2、4... 项到第一列，第 1、3、5... 项到第二列
   */
  const columns = useMemo(() => {
    // 创建 numColumns 个空数组
    const cols: T[][] = Array.from({ length: numColumns }, () => []);

    // 轮流分配数据到各列
    data.forEach((item, index) => {
      const columnIndex = index % numColumns;
      cols[columnIndex].push(item);
    });

    return cols;
  }, [data, numColumns]);

  // ==================== 滚动监听 ====================
  /**
   * 处理滚动事件
   * 1. 保存当前滚动位置，用于页面返回时恢复
   * 2. 检测是否滚动到底部，触发加载更多
   */
  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      // 立即提取事件数据，避免事件对象被回收
      const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;

      // 保存当前滚动位置
      scrollPositionRef.current = contentOffset.y;

      // 检测是否接近底部
      if (onEndReached && !isLoadingMoreRef.current) {
        // 计算距离底部的距离
        const distanceFromBottom = contentSize.height - layoutMeasurement.height - contentOffset.y;

        // 如果距离小于阈值，触发加载更多
        if (distanceFromBottom < onEndReachedThreshold) {
          // 只传递简单类型给 logger，避免序列化事件对象
          logger.debug(`MasonryGrid: 触发加载更多，距离底部 ${Math.round(distanceFromBottom)}px`);
          isLoadingMoreRef.current = true;
          onEndReached();

          // 500ms 后重置标志，避免频繁触发
          setTimeout(() => {
            isLoadingMoreRef.current = false;
          }, 500);
        }
      }
    },
    [onEndReached, onEndReachedThreshold]
  );

  // ==================== 恢复滚动位置 ====================
  /**
   * 页面重新聚焦时，恢复之前的滚动位置
   * 例如：从详情页返回列表页时，停留在之前浏览的位置
   */
  React.useEffect(() => {
    if (isFocused && scrollPositionRef.current > 0) {
      // 延迟执行，确保布局已完成
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({
          y: scrollPositionRef.current,
          animated: false, // 不使用动画，直接跳转
        });
        logger.debug(`MasonryGrid: 恢复滚动位置到 ${scrollPositionRef.current}px`);
      }, 100);
    }
  }, [isFocused]);

  // ==================== 渲染 ====================
  return (
    <ScrollView
      ref={scrollViewRef}
      style={[styles.container, containerStyle]}
      contentContainerStyle={[styles.contentContainer, contentContainerStyle]}
      onScroll={handleScroll}
      scrollEventThrottle={16} // 每 16ms 触发一次滚动事件（约 60fps）
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#999" // iOS 加载指示器颜色
            colors={['#999']} // Android 加载指示器颜色
          />
        ) : undefined
      }
    >
      {/* 头部组件 */}
      {ListHeaderComponent}

      {/* 瀑布流网格 */}
      {data.length > 0 ? (
        <View style={[styles.grid, { gap: columnGap }]}>
          {columns.map((columnData, columnIndex) => (
            <View
              key={`column-${columnIndex}`}
              style={[
                styles.column,
                {
                  width: `${100 / numColumns}%`,
                  gap: rowGap,
                },
              ]}
            >
              {columnData.map(item => (
                <View key={keyExtractor(item)}>{renderItem(item)}</View>
              ))}
            </View>
          ))}
        </View>
      ) : (
        // 空状态组件
        ListEmptyComponent
      )}

      {/* 底部组件 */}
      {ListFooterComponent}
    </ScrollView>
  );
}

/**
 * 样式定义
 */
const styles = StyleSheet.create({
  // 容器样式
  container: {
    flex: 1,
  },

  // 内容容器样式
  contentContainer: {
    paddingHorizontal: 16, // 左右内边距
    paddingTop: 16, // 顶部内边距 - 避免内容贴着导航栏
    paddingBottom: 32, // 底部内边距 - 避免被底部 Tab Bar 遮挡
  },

  // 网格容器样式
  grid: {
    flexDirection: 'row', // 水平排列列
    width: '100%',
  },

  // 列样式
  column: {
    flexDirection: 'column', // 垂直排列项目
  },
});
