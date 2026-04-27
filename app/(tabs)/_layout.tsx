import { BlurView } from 'expo-blur';
import { Tabs } from 'expo-router';
import { Platform, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useI18n } from '@/hooks/use-i18n';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme.isDark;
  const themeColors = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();
  const tabHeight = 60 + insets.bottom;
  const { t } = useI18n();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarActiveTintColor: isDark ? '#4A9EFF' : '#007AFF',
        tabBarInactiveTintColor: '#8E8E93',
        tabBarStyle: [
          styles.tabBar,
          {
            height: tabHeight,
            paddingBottom: insets.bottom,
            backgroundColor: themeColors.secondaryBackground,
            borderTopColor: themeColors.border,
            borderTopWidth: StyleSheet.hairlineWidth,
          },
        ],
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarIconStyle: styles.tabBarIcon,
        tabBarBackground:
          Platform.OS === 'ios'
            ? () => (
                <BlurView
                  intensity={100}
                  tint={isDark ? 'dark' : 'light'}
                  style={[
                    styles.blurView,
                    {
                      borderTopColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                    },
                  ]}
                />
              )
            : undefined,
      }}
    >
      {/* 发现 Tab - 公开访问 */}
      <Tabs.Screen
        name="discover/index"
        options={{
          title: t('tabs.discover'),
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="safari" color={color} />,
        }}
      />

      {/* AI创作 Tab - 受保护（页面内使用 AuthGuard） */}
      <Tabs.Screen
        name="create/index"
        options={{
          title: t('tabs.create'),
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="sparkles" color={color} />,
        }}
      />

      {/* 打印 Tab - 受保护（页面内使用 AuthGuard） */}
      <Tabs.Screen
        name="printer/index"
        options={{
          title: t('tabs.printer'),
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="cube.box.fill" color={color} />,
        }}
      />

      {/* 我的 Tab - 受保护（页面内使用 AuthGuard） */}
      <Tabs.Screen
        name="profile"
        options={{
          title: t('tabs.profile'),
          tabBarIcon: ({ color }) => (
            <IconSymbol size={24} name="person.crop.circle" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    ...Platform.select({
      ios: {
        borderTopWidth: 0,
        elevation: 0,
      },
      android: {
        elevation: 12,
      },
      default: {},
    }),
  },
  blurView: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  tabBarLabel: {
    fontSize: 10,
    fontWeight: '500',
    marginTop: 4,
    marginBottom: Platform.OS === 'ios' ? 0 : 8,
  },
  tabBarIcon: {
    marginTop: 8,
  },
});
