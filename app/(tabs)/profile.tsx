/**
 * 个人中心页面 - 对齐设计稿的 iOS 风格
 *
 * Mock 数据即可，无需接入真实 API。
 */

import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

import { AuthGuard, setLoggingOut } from '@/components/auth';
import { LanguageSelector } from '@/components/language-selector';
import { ThemeSelector } from '@/components/theme-selector';
import { ScreenWrapper } from '@/components/screen-wrapper';
import { ThemedText } from '@/components/themed-text';
import { LoadingScreen } from '@/components/ui/loading-screen';
import { Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useI18n } from '@/hooks/use-i18n';
import { useNavigationDebounce } from '@/hooks/use-navigation-debounce';
import { useAuthStore, useThemeStore } from '@/stores';
import { logger } from '@/utils/logger';

const DEFAULT_PROFILE = {
  name: 'Alex Chroma',
  email: 'alex.chroma@example.com',
  id: 'ID: 3D-884-219',
  avatar: 'https://images.unsplash.com/illustrations/2?auto=format&fit=crop&w=120&h=120&q=80',
};

// 默认统计数据（当 API 未返回时使用）
const DEFAULT_STATS = {
  totalModels: 0, // 我创建的模型数量
  totalFavorites: 0, // 我收藏的模型数量
  totalLikes: 0, // 我喜欢的模型数量
};

// 统计数据配置（标签和路由）
const STATS_CONFIG = [
  { key: 'totalModels' as const, i18nKey: 'models', route: '/user-models/my-models' }, // 对应我创建的模型
  { key: 'totalFavorites' as const, i18nKey: 'favorites', route: '/user-models/my-favorites' }, // 对应我的收藏模型
  { key: 'totalLikes' as const, i18nKey: 'likes', route: '/user-models/my-likes' }, // 对应我喜欢的模型
];

const MENU_SECTIONS = [
  [
    { label: 'Creation History', icon: 'time-outline', key: 'history' },
    { label: 'My Favorites', icon: 'heart', key: 'favorites' },
    { label: 'Language', icon: 'globe', key: 'language' },
    { label: 'Appearance', icon: 'moon-outline', key: 'appearance' },
    // { label: 'My Print Tasks', icon: 'print-outline', key: 'printTasks' },
    // { label: 'My Devices', icon: 'phone-portrait-outline', key: 'devices' },
  ],
  [{ label: 'About', icon: 'information-circle-outline', key: 'about' }],
];

type IoniconName = keyof typeof Ionicons.glyphMap;

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme.isDark;
  const { user, fetchProfile, logout } = useAuthStore();
  const { t, currentLanguage, switchLanguage, supportedLanguages, isLoading } = useI18n();
  const { setThemeMode } = useThemeStore();

  // 语言选择器显示状态
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);
  // 主题选择器显示状态
  const [showThemeSelector, setShowThemeSelector] = useState(false);
  // 主题切换 loading 状态
  const [isThemeLoading, setIsThemeLoading] = useState(false);

  // 使用 ref 标记是否是首次加载
  const isFirstLoadRef = useRef(!user);
  // 用于触发重新渲染的状态
  const [, forceUpdate] = useState(0);

  // 获取用户数据配置（计算属性，用于后续渲染）
  const profile = {
    name: user?.nickName || user?.userName || DEFAULT_PROFILE.name,
    email: user?.email || DEFAULT_PROFILE.email,
    id: user?.id ? `ID: ${user.id}` : DEFAULT_PROFILE.id,
    avatar: user?.avatar || DEFAULT_PROFILE.avatar,
  };

  // 获取真实的统计数据，如果没有则使用默认值
  const stats = user?.stats || DEFAULT_STATS;

  // 使用统一的主题颜色
  const colors = getPalette(isDark);

  // 处理退出登录
  const handleLogout = useCallback(async () => {
    logger.info('用户点击退出登录');

    // ✅ 先设置退出登录标记，防止 AuthGuard 显示"请先登录"的弹窗
    setLoggingOut(true);

    // 调用 Store 的 logout 方法，清除认证状态和 Token
    await logout();

    // 退出后立即跳转到登录页
    // 使用 replace 而不是 push，避免用户通过返回按钮回到个人中心
    router.replace('/login');
  }, [logout]);

  // 处理主题切换
  const handleThemeChange = useCallback(
    async (mode: 'light' | 'dark' | 'auto') => {
      logger.info('切换主题模式:', mode);
      setIsThemeLoading(true);

      try {
        // 模拟一个异步操作，让用户看到 loading 状态
        await new Promise(resolve => setTimeout(resolve, 500));

        // 设置主题
        setThemeMode(mode);

        logger.info('主题切换成功');
      } catch (error) {
        logger.error('主题切换失败:', error);
      } finally {
        setIsThemeLoading(false);
      }
    },
    [setThemeMode]
  );

  // 处理菜单项点击（带防抖）
  const navigateToMenuPage = useCallback((key: string) => {
    logger.info('点击菜单项:', key);

    switch (key) {
      case 'history':
        router.push('/create-history');
        break;
      case 'favorites':
        // 跳转到收藏页面
        router.push('/user-models/my-favorites');
        break;
      case 'language':
        // 打开语言选择器
        setShowLanguageSelector(true);
        break;
      case 'appearance':
        // 打开主题选择器
        setShowThemeSelector(true);
        break;
      case 'about':
        // 跳转到关于页面
        router.push('/about');
        break;
      case 'printTasks':
        // TODO: 跳转到打印任务页面
        logger.info('跳转到打印任务页面');
        break;
      case 'devices':
        // TODO: 跳转到设备管理页面
        logger.info('跳转到设备管理页面');
        break;
      case 'security':
        // TODO: 跳转到账户安全页面
        logger.info('跳转到账户安全页面');
        break;
      case 'help':
        // TODO: 跳转到帮助支持页面
        logger.info('跳转到帮助支持页面');
        break;
      default:
        logger.warn('未知的菜单项:', key);
    }
  }, []);

  // 使用防抖 Hook 包装菜单导航函数
  const handleMenuPress = useNavigationDebounce(navigateToMenuPage, { delay: 300 });

  // 处理统计项点击（带防抖）
  const navigateToStatPage = useCallback((route: string) => {
    logger.info('点击统计项，跳转到:', route);
    router.push(route);
  }, []);

  // 使用防抖 Hook 包装统计项导航函数
  const handleStatPress = useNavigationDebounce(navigateToStatPage, { delay: 300 });

  // 使用 useFocusEffect：每次页面获得焦点时执行
  // ⚠️ 必须放在所有 hooks 之后、早期返回之前
  useFocusEffect(
    useCallback(() => {
      const refreshProfile = async () => {
        logger.info('刷新用户信息');

        // 保存是否是首次加载的状态（在修改前）
        const isFirstLoad = isFirstLoadRef.current;

        const success = await fetchProfile();

        // 首次加载完成后，更新标记并触发重新渲染
        if (isFirstLoad) {
          isFirstLoadRef.current = false;
          forceUpdate(prev => prev + 1);
        }

        // 如果不是首次加载且刷新失败，弹窗提示
        if (!isFirstLoad && !success) {
          Alert.alert(t('dialog.common.title'), t('dialog.profile.refreshFailed'), [
            { text: t('dialog.common.confirm') },
          ]);
        }
      };

      refreshProfile();
    }, [fetchProfile, t])
  );

  // ⚠️ 早期返回必须放在所有 hooks 之后，确保每次渲染调用相同数量的 hooks
  // 首次加载且无数据，显示 loading
  if (isFirstLoadRef.current && !user) {
    return (
      <AuthGuard>
        <LoadingScreen />
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <ScreenWrapper edges={['top']}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* 第一个卡片不需要 marginTop，由 ScrollView 的 paddingTop 统一控制 */}
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            {/* 头像：如果用户有头像则显示图片，否则显示默认 emoji */}
            {user?.avatar ? (
              <Image source={{ uri: profile.avatar }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: colors.iconBackground }]}>
                <ThemedText style={styles.avatarEmoji}>😊</ThemedText>
              </View>
            )}
            <View style={styles.textContainer}>
              <ThemedText style={styles.name} numberOfLines={1} ellipsizeMode="tail">
                {profile.name}
              </ThemedText>
              <ThemedText
                style={[styles.email, { color: colors.secondaryText }]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {profile.email}
              </ThemedText>
              {/* <ThemedText
              style={[styles.id, { color: colors.secondaryText }]}
              numberOfLines={1}
              ellipsizeMode="middle"
            >
              {profile.id}
            </ThemedText> */}
            </View>
          </View>

          <View style={[styles.statsCard, styles.sectionSpacing, { backgroundColor: colors.card }]}>
            {STATS_CONFIG.map((config, index) => (
              <TouchableOpacity
                key={config.key}
                style={[
                  styles.statItem,
                  index === 1 && {
                    borderLeftWidth: StyleSheet.hairlineWidth,
                    borderRightWidth: StyleSheet.hairlineWidth,
                    borderColor: colors.statDivider,
                  },
                ]}
                activeOpacity={0.6}
                onPress={() => handleStatPress(config.route)}
              >
                <ThemedText style={[styles.statValue, { color: colors.headerText }]}>
                  {stats[config.key]}
                </ThemedText>
                <ThemedText style={[styles.statLabel, { color: colors.link }]}>
                  {t(`profile.stats.${config.i18nKey}`)}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </View>

          {MENU_SECTIONS.map((group, groupIndex) => (
            <View
              key={`group-${groupIndex}`}
              style={[styles.menuCard, styles.sectionSpacing, { backgroundColor: colors.card }]}
            >
              {group.map((item, index) => (
                <TouchableOpacity
                  key={item.key}
                  style={styles.menuRow}
                  activeOpacity={0.8}
                  onPress={() => handleMenuPress(item.key)}
                >
                  <View style={[styles.iconContainer, { backgroundColor: colors.iconBackground }]}>
                    <Ionicons name={item.icon as IoniconName} size={20} color={colors.iconTint} />
                  </View>
                  <ThemedText style={[styles.menuLabel, { color: colors.headerText }]}>
                    {t(`profile.menu.${item.key}`)}
                  </ThemedText>
                  <Ionicons name="chevron-forward" size={20} color={colors.chevron} />
                  {index !== group.length - 1 && (
                    <View style={[styles.rowDivider, { backgroundColor: colors.divider }]} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          ))}

          <TouchableOpacity
            style={[styles.logoutButton, styles.sectionSpacing, { backgroundColor: colors.logout }]}
            onPress={handleLogout}
            activeOpacity={0.9}
          >
            <ThemedText style={styles.logoutLabel}>{t('profile.logout')}</ThemedText>
          </TouchableOpacity>
        </ScrollView>
      </ScreenWrapper>

      {/* 语言选择器 */}
      <LanguageSelector
        visible={showLanguageSelector}
        onClose={() => setShowLanguageSelector(false)}
        currentLanguage={currentLanguage}
        onLanguageChange={switchLanguage}
        isLoading={isLoading}
      />

      {/* 主题选择器 */}
      <ThemeSelector
        visible={showThemeSelector}
        onClose={() => setShowThemeSelector(false)}
        onThemeChange={handleThemeChange}
        isLoading={isThemeLoading}
      />
    </AuthGuard>
  );
}

function getPalette(isDark: boolean) {
  return {
    // 移除自定义的 screen 背景色，使用 ScreenWrapper 的统一背景
    card: isDark ? '#2C2C2E' : '#FFFFFF',
    headerText: isDark ? '#FFFFFF' : '#111A2C',
    secondaryText: isDark ? '#AEAEB2' : '#576482',
    link: isDark ? '#7ab5ff' : '#2B65D9',
    iconBackground: isDark ? 'rgba(53,108,244,0.15)' : '#E4EEFF',
    iconTint: '#3F7EEC',
    chevron: isDark ? '#98A0B1' : '#9BA4B7',
    divider: isDark ? 'rgba(255,255,255,0.1)' : '#EDF1F7',
    statDivider: isDark ? 'rgba(255,255,255,0.2)' : '#E6EBF3',
    logout: '#E74343',
  };
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingTop: Spacing.lg, // 顶部内边距 - 16px，与其他页面一致
    paddingHorizontal: Spacing.lg, // 横向内边距 - 16px
    paddingBottom: Spacing.xxxl, // 底部内边距 - 32px，避免被 Tab Bar 遮挡
  },
  sectionSpacing: {
    marginTop: Spacing.md, // 区块之间的间距 - 12px，使用 Spacing 常量
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 3,
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    marginRight: 16,
  },
  avatarPlaceholder: {
    width: 70,
    height: 70,
    borderRadius: 35,
    marginRight: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: {
    fontSize: 32,
    lineHeight: 32,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  name: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    marginBottom: 4,
  },
  id: {
    fontSize: 14,
  },
  statsCard: {
    flexDirection: 'row',
    borderRadius: 24,
    paddingVertical: 18,
    justifyContent: 'space-around',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 6,
  },
  menuCard: {
    borderRadius: 28,
    paddingHorizontal: 12,
    paddingVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    position: 'relative',
  },
  iconContainer: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  menuLabel: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  rowDivider: {
    position: 'absolute',
    bottom: 0,
    left: 56,
    right: 0,
    height: StyleSheet.hairlineWidth,
  },
  logoutButton: {
    height: 52,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#F03D3D',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  logoutLabel: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
});
