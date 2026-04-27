/**
 * Toast 轻提示组件
 * 用于显示短暂的提示信息
 */

import { useColorScheme } from '@/hooks/use-color-scheme';
import { useI18n } from '@/hooks/use-i18n';
import { logger } from '@/utils/logger';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export interface ToastConfig {
  /** 提示内容（如果是 i18n key，会自动翻译） */
  message: string;
  /** 图标名称（可选） */
  icon?: keyof typeof Ionicons.glyphMap;
  /** 显示时长（毫秒），默认 2000 */
  duration?: number;
  /** 类型 */
  type?: 'success' | 'error' | 'info';
}

// 全局 Toast 状态
let toastConfig: ToastConfig | null = null;
let toastListeners: ((config: ToastConfig | null) => void)[] = [];

/**
 * 显示 Toast
 * @param config Toast 配置
 */
export const showToast = (config: ToastConfig) => {
  logger.info('显示 Toast:', config);
  toastConfig = config;
  // 通知所有监听器
  toastListeners.forEach(listener => listener(config));
};

/**
 * 隐藏 Toast
 */
export const hideToast = () => {
  toastConfig = null;
  toastListeners.forEach(listener => listener(null));
};

/**
 * 显示成功提示
 */
export const showSuccess = (message: string) => {
  showToast({ message, icon: 'checkmark-circle', type: 'success' });
};

/**
 * 显示错误提示
 */
export const showError = (message: string) => {
  showToast({ message, icon: 'close-circle', type: 'error' });
};

/**
 * 显示信息提示
 */
export const showInfo = (message: string) => {
  showToast({ message, icon: 'information-circle', type: 'info' });
};

export const Toast: React.FC = () => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme.isDark;
  const { t } = useI18n();
  const insets = useSafeAreaInsets();

  // Toast 显示状态
  const [visible, setVisible] = React.useState(false);
  const [config, setConfig] = React.useState<ToastConfig | null>(null);

  // 动画值
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 监听全局 Toast 变化
  useEffect(() => {
    const listener = (newConfig: ToastConfig | null) => {
      setConfig(newConfig);

      if (newConfig) {
        // 显示 Toast
        setVisible(true);
        Animated.parallel([
          Animated.timing(translateY, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start();

        // 自动隐藏
        const duration = newConfig.duration ?? 2000;
        if (timerRef.current) {
          clearTimeout(timerRef.current);
        }
        timerRef.current = setTimeout(() => {
          hide();
        }, duration);
      } else {
        // 隐藏 Toast
        hide();
      }
    };

    // 注册监听器
    toastListeners.push(listener);

    // 如果初始状态有 Toast 配置，立即显示
    if (toastConfig) {
      listener(toastConfig);
    }

    return () => {
      // 移除监听器
      const index = toastListeners.indexOf(listener);
      if (index > -1) {
        toastListeners.splice(index, 1);
      }

      // 清理定时器
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  // 隐藏 Toast
  const hide = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setVisible(false);
      setConfig(null);
    });
  };

  // 如果不可见，不渲染
  if (!visible || !config) {
    return null;
  }

  // 获取翻译后的消息
  const message = t(config.message, {}, config.message); // 如果找不到翻译，使用原始消息

  // 根据类型确定颜色
  const getColors = () => {
    switch (config.type) {
      case 'success':
        return {
          bgColor: isDark ? '#1C3A2E' : '#E8F5E9',
          textColor: isDark ? '#81C784' : '#2E7D32',
          iconColor: '#4CAF50',
        };
      case 'error':
        return {
          bgColor: isDark ? '#3A1C1C' : '#FFEBEE',
          textColor: isDark ? '#E57373' : '#C62828',
          iconColor: '#F44336',
        };
      case 'info':
      default:
        return {
          bgColor: isDark ? '#1C2A3A' : '#E3F2FD',
          textColor: isDark ? '#64B5F6' : '#1565C0',
          iconColor: '#2196F3',
        };
    }
  };

  const colors = getColors();

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      <Animated.View
        style={[
          styles.toast,
          {
            backgroundColor: colors.bgColor,
            transform: [{ translateY }],
            opacity,
          },
        ]}
      >
        {config.icon && (
          <Ionicons name={config.icon} size={20} color={colors.iconColor} style={styles.icon} />
        )}
        <Text style={[styles.message, { color: colors.textColor }]} numberOfLines={2}>
          {message}
        </Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 9999,
    pointerEvents: 'none', // 不阻挡下层交互
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  icon: {
    marginRight: 8,
  },
  message: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
});
