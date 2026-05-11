import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { enableMapSet } from 'immer';
import { useEffect } from 'react';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ErrorBoundary, setupGlobalErrorHandlers } from '@/components/error-boundary';
import { Toast } from '@/components/toast';
import { SessionProvider } from '@/contexts/session';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { setUnauthorizedHandler } from '@/services/api-client';
import { useAuthStore } from '@/stores';

// 初始化 i18n 国际化配置（必须在应用启动时导入）
import '@/i18n';

// 启用 Immer 的 MapSet 插件（支持在 Store 中使用 Map 和 Set）
enableMapSet();

/**
 * 根布局导航
 * Tab 页面通过 AuthGuard 组件实现认证保护
 */
function RootLayoutNav() {
  const colorScheme = useColorScheme();

  // 设置全局错误处理器（仅执行一次）
  useEffect(() => {
    setupGlobalErrorHandlers();
  }, []);

  // 设置 API 401 未授权处理器
  useEffect(() => {
    const handleUnauthorized = () => {
      const { reset } = useAuthStore.getState();
      reset();
      router.replace('/login');
    };

    setUnauthorizedHandler(handleUnauthorized);
    return () => setUnauthorizedHandler(null);
  }, []);

  return (
    <ThemeProvider value={colorScheme.isDark ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        {/* 应用入口 */}
        <Stack.Screen name="index" />

        {/* Tab 导航（受保护页面通过 AuthGuard 组件实现认证） */}
        <Stack.Screen name="(tabs)" />

        {/* 登录页（Modal 模式） */}
        <Stack.Screen
          name="login"
          options={{
            presentation: 'modal',
            headerShown: false,
          }}
        />

        {/* 模型详情页 */}
        <Stack.Screen name="model/[id]" options={{ headerShown: true }} />

        {/* 3D 模型查看器 */}
        <Stack.Screen name="model-viewer/[id]" />

        {/* 创作历史列表 */}
        <Stack.Screen name="create-history/index" options={{ headerShown: true }} />

        {/* 创作历史详情 */}
        <Stack.Screen name="create-history/[id]" options={{ headerShown: true }} />

        {/* 用户模型列表（通用页面，根据 type 参数区分）*/}
        <Stack.Screen name="user-models/[type]" options={{ headerShown: true }} />

        {/* 关于页面 */}
        <Stack.Screen name="about" options={{ headerShown: true }} />
      </Stack>
      {/* 全局 Toast 组件 */}
      <Toast />
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

/**
 * 根布局组件
 * 用 SessionProvider 包裹整个应用
 */
export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <KeyboardProvider>
        <ErrorBoundary>
          <SessionProvider>
            <RootLayoutNav />
          </SessionProvider>
        </ErrorBoundary>
      </KeyboardProvider>
    </SafeAreaProvider>
  );
}
