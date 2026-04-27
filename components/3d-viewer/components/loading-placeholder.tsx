/**
 * 3D 模型加载占位图组件
 * 显示一个带动画的立方体线框
 */

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export const LoadingPlaceholder: React.FC = () => {
  const colorScheme = useColorScheme();
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    // 旋转动画
    const rotateAnimation = Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true,
      })
    );

    // 呼吸缩放动画
    const scaleAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );

    // 透明度动画
    const opacityAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0.3,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );

    rotateAnimation.start();
    scaleAnimation.start();
    opacityAnimation.start();

    return () => {
      rotateAnimation.stop();
      scaleAnimation.stop();
      opacityAnimation.stop();
    };
  }, [rotateAnim, scaleAnim, opacityAnim]);

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // 确保 colorScheme 不为 null，提供默认值 'light'
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.wireframe,
          {
            opacity: opacityAnim,
            transform: [{ rotate }, { scale: scaleAnim }],
          },
        ]}
      >
        {/* 外层正方形 */}
        <View style={[styles.square, { borderColor: colors.tint }]} />

        {/* 内层正方形（模拟透视效果） */}
        <View
          style={[styles.square, styles.innerSquare, { borderColor: colors.tint, opacity: 0.6 }]}
        />

        {/* 连接线（模拟立方体边） */}
        <View style={[styles.line, styles.lineTopLeft, { backgroundColor: colors.tint }]} />
        <View style={[styles.line, styles.lineTopRight, { backgroundColor: colors.tint }]} />
        <View style={[styles.line, styles.lineBottomLeft, { backgroundColor: colors.tint }]} />
        <View style={[styles.line, styles.lineBottomRight, { backgroundColor: colors.tint }]} />
      </Animated.View>
    </View>
  );
};

const SIZE = 100;
const INNER_SIZE = 60;
const OFFSET = (SIZE - INNER_SIZE) / 2;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  wireframe: {
    width: SIZE,
    height: SIZE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  square: {
    position: 'absolute',
    width: SIZE,
    height: SIZE,
    borderWidth: 2,
    borderRadius: 4,
  },
  innerSquare: {
    width: INNER_SIZE,
    height: INNER_SIZE,
  },
  line: {
    position: 'absolute',
    width: 2,
    height: OFFSET,
  },
  lineTopLeft: {
    top: 0,
    left: 0,
  },
  lineTopRight: {
    top: 0,
    right: 0,
  },
  lineBottomLeft: {
    bottom: 0,
    left: 0,
  },
  lineBottomRight: {
    bottom: 0,
    right: 0,
  },
});
