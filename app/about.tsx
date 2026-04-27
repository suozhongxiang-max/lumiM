/**
 * 关于页面 - 显示 App 信息、版本和检查更新功能
 */

import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { Stack } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

import { ScreenWrapper } from '@/components/screen-wrapper';
import { ThemedText } from '@/components/themed-text';
import { FontSize, FontWeight, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useI18n } from '@/hooks/use-i18n';
import { logger } from '@/utils/logger';

export default function AboutScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme.isDark;
  const { t } = useI18n();
  const colors = getPalette(isDark);

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: t('about.title'),
          headerTintColor: colors.headerText,
          headerStyle: {
            backgroundColor: colors.card,
          },
          headerBackVisible: true,
          headerBackTitle: t('common.back'),
        }}
      />
      <AboutContent />
    </>
  );
}

// 定义 AboutContent 组件，使用独立的函数组件
function AboutContent() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme.isDark;
  const { t } = useI18n();
  const colors = getPalette(isDark);

  // 检查更新状态
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);

  // 获取版本号
  const appVersion = Constants.expoConfig?.version || '1.0.0';
  const appName = Constants.expoConfig?.name || 'Lumi';

  /**
   * 检查更新功能
   * 注意：这是一个模拟实现，实际项目中需要接入真实的更新检测 API
   */
  const handleCheckUpdate = async () => {
    logger.info('用户点击检查更新');

    // 设置加载状态
    setIsCheckingUpdate(true);

    try {
      // 模拟网络请求延迟
      await new Promise(resolve => setTimeout(resolve, 2000));

      // TODO: 实际项目中应该调用后端 API 检查更新
      // const response = await fetch('https://api.example.com/check-update');
      // const data = await response.json();

      // 模拟检查结果：显示已是最新版本
      Alert.alert(
        t('about.checkUpdate'),
        t('about.latestVersion'),
        [{ text: t('dialog.common.confirm') }]
      );

      logger.info('检查更新完成：已是最新版本');
    } catch (error) {
      // 发生错误时显示错误提示
      logger.error('检查更新失败:', error);
      Alert.alert(
        t('about.checkUpdate'),
        t('about.checkUpdateFailed'),
        [{ text: t('dialog.common.confirm') }]
      );
    } finally {
      // 恢复加载状态
      setIsCheckingUpdate(false);
    }
  };

  return (
    <ScreenWrapper edges={['top']}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* App 图标和名称卡片 */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          {/* App 图标 */}
          <View style={styles.appIconContainer}>
            <Image
              source={require('../assets/images/icon.png')}
              style={styles.appIcon}
              resizeMode="contain"
            />
          </View>

          {/* App 名称 */}
          <ThemedText style={[styles.appName, { color: colors.headerText }]}>
            {appName}
          </ThemedText>

          {/* 版本号 */}
          <ThemedText style={[styles.versionText, { color: colors.secondaryText }]}>
            {t('about.version')} {appVersion}
          </ThemedText>
        </View>

        {/* 功能按钮卡片 */}
        <View style={[styles.card, styles.cardSpacing, { backgroundColor: colors.card }]}>
          {/* 检查更新按钮 */}
          <TouchableOpacity
            style={[styles.menuRow]}
            onPress={handleCheckUpdate}
            activeOpacity={0.7}
            disabled={isCheckingUpdate}
          >
            <View style={[styles.iconContainer, { backgroundColor: colors.iconBackground }]}>
              {isCheckingUpdate ? (
                <ActivityIndicator size="small" color={colors.iconTint} />
              ) : (
                <Ionicons name="refresh-outline" size={24} color={colors.iconTint} />
              )}
            </View>
            <ThemedText style={[styles.menuLabel, { color: colors.headerText }]}>
              {t('about.checkUpdate')}
            </ThemedText>
            <Ionicons name="chevron-forward" size={20} color={colors.chevron} />
          </TouchableOpacity>

          {/* 分隔线 */}
          <View style={[styles.divider, { backgroundColor: colors.divider }]} />

          {/* 用户协议按钮 */}
          <TouchableOpacity
            style={[styles.menuRow]}
            onPress={() => {
              logger.info('点击用户协议');
              // TODO: 跳转到用户协议页面
              Alert.alert(t('about.userAgreement'), t('about.comingSoon'));
            }}
            activeOpacity={0.7}
          >
            <View style={[styles.iconContainer, { backgroundColor: colors.iconBackground }]}>
              <Ionicons name="document-text-outline" size={24} color={colors.iconTint} />
            </View>
            <ThemedText style={[styles.menuLabel, { color: colors.headerText }]}>
              {t('about.userAgreement')}
            </ThemedText>
            <Ionicons name="chevron-forward" size={20} color={colors.chevron} />
          </TouchableOpacity>

          {/* 分隔线 */}
          <View style={[styles.divider, { backgroundColor: colors.divider }]} />

          {/* 隐私政策按钮 */}
          <TouchableOpacity
            style={[styles.menuRow]}
            onPress={() => {
              logger.info('点击隐私政策');
              // TODO: 跳转到隐私政策页面
              Alert.alert(t('about.privacyPolicy'), t('about.comingSoon'));
            }}
            activeOpacity={0.7}
          >
            <View style={[styles.iconContainer, { backgroundColor: colors.iconBackground }]}>
              <Ionicons name="shield-checkmark-outline" size={24} color={colors.iconTint} />
            </View>
            <ThemedText style={[styles.menuLabel, { color: colors.headerText }]}>
              {t('about.privacyPolicy')}
            </ThemedText>
            <Ionicons name="chevron-forward" size={20} color={colors.chevron} />
          </TouchableOpacity>
        </View>

        {/* 版权信息 - 放到最下面 */}
        <View style={[styles.copyrightContainer]}>
          <ThemedText style={[styles.copyrightText, { color: colors.secondaryText }]}>
            {t('about.copyright')}
          </ThemedText>
          <ThemedText style={[styles.copyrightText, { color: colors.secondaryText }]}>
            {t('about.allRightsReserved')}
          </ThemedText>
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
}

/**
 * 根据当前主题生成颜色配置
 * @param isDark 是否为暗黑模式
 * @returns 颜色配置对象
 */
function getPalette(isDark: boolean) {
  return {
    card: isDark ? '#2C2C2E' : '#FFFFFF',
    headerText: isDark ? '#FFFFFF' : '#111A2C',
    secondaryText: isDark ? '#AEAEB2' : '#576482',
    iconBackground: isDark ? 'rgba(53,108,244,0.15)' : '#E4EEFF',
    iconTint: '#3F7EEC',
    chevron: isDark ? '#98A0B1' : '#9BA4B7',
    divider: isDark ? 'rgba(255,255,255,0.1)' : '#EDF1F7',
  };
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingTop: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  card: {
    borderRadius: 20,
    padding: Spacing.xl,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 3,
  },
  cardSpacing: {
    marginTop: Spacing.lg,
  },
  appIconContainer: {
    marginBottom: Spacing.sm,
  },
  appIcon: {
    width: 72,
    height: 72,
    borderRadius: 18,
  },
  appName: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  versionText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xs,
  },
  menuLabel: {
    flex: 1,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    marginLeft: Spacing.sm,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    width: '100%',
    marginVertical: Spacing.sm,
    marginLeft: 60,
  },
  copyrightContainer: {
    marginTop: Spacing.xl,
    marginBottom: Spacing.lg,
    alignItems: 'center',
  },
  copyrightText: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
});
