/**
 * 登录/注册页面
 *
 * 功能：
 * - 邮箱 + 验证码登录（验证码为英文字母+数字组合）
 * - 邮箱 + 验证码注册（验证码为英文字母+数字组合）
 * - 选项卡切换登录/注册模式
 * - 倒计时验证码发送
 * - 表单验证
 * - 与项目风格保持一致
 */

import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  Pressable,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';

import { LanguageSelector } from '@/components/language-selector';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useI18n } from '@/hooks/use-i18n';
import { useThemeColor } from '@/hooks/use-theme-color';
import type { SupportedLanguage } from '@/i18n';
import { useAuthStore } from '@/stores';
import { logger } from '@/utils/logger';

// ============================================
// 类型定义
// ============================================

type AuthMode = 'login' | 'register';

// ============================================
// 常量
// ============================================

const COUNTDOWN_SECONDS = 60; // 验证码倒计时时长（秒）

// ============================================
// 主页面组件
// ============================================

export default function LoginScreen() {
  // 获取 i18n 翻译函数和方法
  const { t, currentLanguage, switchLanguage } = useI18n();

  // 获取主题颜色
  const tint = useThemeColor({}, 'tint');
  const background = useThemeColor({}, 'background');
  const cardBackground = useThemeColor({}, 'cardBackground');
  const text = useThemeColor({}, 'text');
  const secondaryText = useThemeColor({}, 'secondaryText');
  const border = useThemeColor({}, 'border');

  // 获取颜色主题
  const colorScheme = useColorScheme();
  const isDark = colorScheme.isDark;

  // 统一的按钮颜色：浅色模式使用标准蓝色，深色模式使用暗蓝色
  const buttonColor = isDark ? '#0a5c84' : '#0a7ea4';

  // 认证 Store
  const { sendVerificationCode, register, login, isSubmitting, isSendingCode } = useAuthStore();

  // 获取路由参数：登录成功后要跳转的页面
  const { returnUrl } = useLocalSearchParams<{ returnUrl?: string }>();

  // ============================================
  // 状态管理
  // ============================================

  // 当前模式（登录/注册）
  const [mode, setMode] = useState<AuthMode>('login');

  // 表单数据
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');

  // 错误信息
  const [emailError, setEmailError] = useState('');
  const [codeError, setCodeError] = useState('');
  const [submitError, setSubmitError] = useState('');

  // 验证码倒计时
  const [countdown, setCountdown] = useState(0);

  // 语言选择器状态
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);
  const [isChangingLanguage, setIsChangingLanguage] = useState(false);

  // ============================================
  // 倒计时效果
  // ============================================

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;

    if (countdown > 0) {
      interval = setInterval(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [countdown]);

  // ============================================
  // 验证函数
  // ============================================

  /**
   * 验证邮箱格式
   */
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  /**
   * 验证表单
   */
  const validateForm = (): boolean => {
    let isValid = true;

    // 验证邮箱
    if (!email.trim()) {
      setEmailError(t('auth.email.error.required'));
      isValid = false;
    } else if (!validateEmail(email)) {
      setEmailError(t('auth.email.error.invalid'));
      isValid = false;
    } else {
      setEmailError('');
    }

    // 验证验证码
    if (!code.trim()) {
      setCodeError(t('auth.code.error.required'));
      isValid = false;
    } else if (code.length < 4 || code.length > 6) {
      setCodeError(t('auth.code.error.invalid'));
      isValid = false;
    } else {
      setCodeError('');
    }

    return isValid;
  };

  // ============================================
  // 事件处理
  // ============================================

  /**
   * 发送验证码
   */
  const handleSendCode = async () => {
    // 清空之前的错误
    setEmailError('');
    setSubmitError('');

    // 验证邮箱
    if (!email.trim()) {
      setEmailError(t('auth.email.error.required'));
      return;
    }

    if (!validateEmail(email)) {
      setEmailError(t('auth.email.error.invalid'));
      return;
    }

    // 发送验证码
    const type = mode === 'login' ? 'login' : 'register';
    const success = await sendVerificationCode(email, type);

    if (success) {
      // 开始倒计时
      setCountdown(COUNTDOWN_SECONDS);
    } else {
      setSubmitError(t('auth.error.sendCodeFailed'));
    }
  };

  /**
   * 提交表单
   */
  const handleSubmit = async () => {
    // 清空之前的错误
    setSubmitError('');

    // 验证表单
    if (!validateForm()) {
      return;
    }

    // 根据模式执行不同操作
    let success = false;

    if (mode === 'login') {
      success = await login(email.trim(), code.trim());

      if (success) {
        // 登录成功，跳转到原页面或首页
        logger.info('登录成功，跳转到目标页面');
        const targetUrl = returnUrl || '/(tabs)/discover';
        router.replace(targetUrl as any);
      } else {
        setSubmitError(t('auth.error.loginFailed'));
      }
    } else {
      success = await register(email.trim(), code.trim());

      if (success) {
        // 注册成功，自动登录
        logger.info('注册成功，自动登录');
        success = await login(email.trim(), code.trim());

        if (success) {
          const targetUrl = returnUrl || '/(tabs)/discover';
          router.replace(targetUrl as any);
        }
      } else {
        setSubmitError(t('auth.error.registerFailed'));
      }
    }
  };

  /**
   * 处理语言切换
   */
  const handleLanguageChange = async (language: SupportedLanguage) => {
    try {
      setIsChangingLanguage(true);
      await switchLanguage(language);
      logger.info('语言已切换至:', language);

      // 清空所有错误信息，避免显示旧语言的错误提示
      setEmailError('');
      setCodeError('');
      setSubmitError('');
    } catch (error) {
      logger.error('切换语言失败:', error);
    } finally {
      setIsChangingLanguage(false);
    }
  };

  // ============================================
  // UI 渲染
  // ============================================

  return (
    <Pressable
      style={[styles.container, { backgroundColor: background }]}
      onPress={Keyboard.dismiss}
    >
      {/* ========================================
          语言切换按钮（右上角）
          ======================================== */}
      <View style={styles.languageSwitchContainer}>
        <TouchableOpacity
          style={[styles.languageButton, { backgroundColor: cardBackground, borderColor: border }]}
          onPress={() => setShowLanguageSelector(true)}
          activeOpacity={0.7}
        >
          <Ionicons name="globe" size={20} color={tint} />
          <ThemedText style={[styles.languageButtonText, { color: text }]}>
            {currentLanguage === 'auto'
              ? t('language.auto')
              : currentLanguage === 'zh'
                ? '中文'
                : 'English'}
          </ThemedText>
        </TouchableOpacity>
      </View>

      {/* ========================================
          主内容区域（使用 KeyboardAwareScrollView 处理键盘遮挡）
          ======================================== */}
      <KeyboardAwareScrollView
        style={styles.contentContainer}
        contentContainerStyle={styles.scrollContentContainer}
        keyboardShouldPersistTaps="handled"
        bottomOffset={20}
      >
        <Pressable style={styles.innerContent} onPress={Keyboard.dismiss}>
          {/* Logo 和标题区域 */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <LinearGradient
                colors={[tint, '#764BA2']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.logoGradient}
              >
                <ThemedText style={styles.logoText}>L</ThemedText>
              </LinearGradient>
            </View>

            <ThemedText style={styles.title} type="title">
              {mode === 'login' ? t('auth.login.title') : t('auth.register.title')}
            </ThemedText>

            <ThemedText
              style={styles.subtitle}
              lightColor={secondaryText}
              darkColor={secondaryText}
            >
              {mode === 'login' ? t('auth.login.subtitle') : t('auth.register.subtitle')}
            </ThemedText>
          </View>

          {/* 模式切换选项卡 */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[
                styles.tab,
                mode === 'login' && styles.tabActive,
                mode === 'login' && { borderColor: buttonColor },
              ]}
              onPress={() => {
                setMode('login');
                setSubmitError('');
              }}
            >
              <ThemedText
                style={[
                  styles.tabText,
                  mode === 'login' && styles.tabTextActive,
                  mode === 'login' && { color: buttonColor },
                ]}
              >
                {t('auth.login.tab')}
              </ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.tab,
                mode === 'register' && styles.tabActive,
                mode === 'register' && { borderColor: buttonColor },
              ]}
              onPress={() => {
                setMode('register');
                setSubmitError('');
              }}
            >
              <ThemedText
                style={[
                  styles.tabText,
                  mode === 'register' && styles.tabTextActive,
                  mode === 'register' && { color: buttonColor },
                ]}
              >
                {t('auth.register.tab')}
              </ThemedText>
            </TouchableOpacity>
          </View>

          {/* 表单区域 */}
          <View style={styles.form}>
            {/* 邮箱输入 */}
            <View style={styles.inputContainer}>
              <ThemedText style={styles.label}>{t('auth.email.label')}</ThemedText>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: cardBackground,
                    color: text,
                    borderColor: emailError ? '#FF3B30' : border,
                  },
                ]}
                placeholder={t('auth.email.placeholder')}
                placeholderTextColor={secondaryText}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                value={email}
                onChangeText={text => {
                  setEmail(text);
                  if (emailError) setEmailError('');
                }}
              />
              {emailError ? <ThemedText style={styles.errorText}>{emailError}</ThemedText> : null}
            </View>

            {/* 验证码输入 */}
            <View style={styles.inputContainer}>
              <ThemedText style={styles.label}>{t('auth.code.label')}</ThemedText>
              <View style={styles.codeInputRow}>
                <TextInput
                  style={[
                    styles.codeInput,
                    {
                      backgroundColor: cardBackground,
                      color: text,
                      borderColor: codeError ? '#FF3B30' : border,
                    },
                  ]}
                  placeholder={t('auth.code.placeholder')}
                  placeholderTextColor={secondaryText}
                  keyboardType="ascii-capable"
                  autoCapitalize="characters"
                  autoCorrect={false}
                  maxLength={6}
                  value={code}
                  onChangeText={text => {
                    setCode(text);
                    if (codeError) setCodeError('');
                  }}
                />

                <TouchableOpacity
                  style={[
                    styles.sendCodeButton,
                    countdown > 0 && styles.sendCodeButtonDisabled,
                    { backgroundColor: countdown > 0 ? `${border}` : buttonColor },
                  ]}
                  onPress={handleSendCode}
                  disabled={countdown > 0 || isSendingCode}
                >
                  {isSendingCode ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <ThemedText
                      style={[
                        styles.sendCodeButtonText,
                        { color: countdown > 0 ? secondaryText : '#FFFFFF' },
                      ]}
                    >
                      {countdown > 0
                        ? t('auth.code.countdown', { seconds: countdown })
                        : t('auth.code.send')}
                    </ThemedText>
                  )}
                </TouchableOpacity>
              </View>
              {codeError ? <ThemedText style={styles.errorText}>{codeError}</ThemedText> : null}
            </View>

            {/* 提交错误信息 */}
            {submitError ? (
              <ThemedText style={styles.submitErrorText}>{submitError}</ThemedText>
            ) : null}

            {/* 提交按钮 */}
            <TouchableOpacity
              style={[styles.submitButton, { backgroundColor: buttonColor }]}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <ThemedText style={styles.submitButtonText}>
                  {mode === 'login' ? t('auth.login.submit') : t('auth.register.submit')}
                </ThemedText>
              )}
            </TouchableOpacity>
          </View>

          {/* 底部信息 */}
          <View style={styles.footer}>
            <ThemedText
              style={styles.footerText}
              lightColor={Colors.light.tertiaryText}
              darkColor={Colors.dark.tertiaryText}
            >
              {t('auth.footer.terms')}
            </ThemedText>
          </View>
        </Pressable>
      </KeyboardAwareScrollView>

      {/* ========================================
          语言选择器
          ======================================== */}
      <LanguageSelector
        visible={showLanguageSelector}
        onClose={() => setShowLanguageSelector(false)}
        currentLanguage={currentLanguage}
        onLanguageChange={handleLanguageChange}
        isLoading={isChangingLanguage}
      />
    </Pressable>
  );
}

// ============================================
// 样式定义
// ============================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },

  // 语言切换按钮
  languageSwitchContainer: {
    position: 'absolute',
    top: 60,
    right: 24,
    zIndex: 10,
  },
  languageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  languageButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },

  // 主内容容器
  contentContainer: {
    flex: 1,
  },
  // ScrollView 内容容器样式
  scrollContentContainer: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
    flexGrow: 1,
  },
  // 内部内容容器
  innerContent: {
    flex: 1,
    justifyContent: 'flex-start',
  },

  // 头部
  header: {
    alignItems: 'center',
    marginBottom: 16, // 进一步减小间距
  },
  logoContainer: {
    marginBottom: 16, // 减小间距
  },
  logoGradient: {
    width: 70,
    height: 70,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  logoText: {
    fontSize: 36,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 6,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
  },

  // 选项卡
  tabContainer: {
    flexDirection: 'row',
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  tabActive: {
    backgroundColor: '#FFFFFF',
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
  },
  tabTextActive: {
    fontWeight: '700',
  },

  // 表单
  form: {
    flex: 1,
    justifyContent: 'flex-start', // 改为从顶部开始，而不是居中
    minHeight: 200,
    marginTop: 20,
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
  },
  input: {
    height: 48,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 16,
    borderWidth: 1.5,
  },
  codeInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  codeInput: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 16,
    borderWidth: 1.5,
    marginRight: 10,
  },
  sendCodeButton: {
    height: 48,
    paddingHorizontal: 16,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 100,
  },
  sendCodeButtonDisabled: {
    opacity: 0.6,
  },
  sendCodeButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 12,
    color: '#FF3B30',
    marginTop: 4,
  },
  submitErrorText: {
    fontSize: 14,
    color: '#FF3B30',
    textAlign: 'center',
    marginBottom: 16,
  },
  submitButton: {
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // 底部
  footer: {
    marginTop: 24, // 增加间距
    paddingBottom: 30,
  },
  footerText: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
});
