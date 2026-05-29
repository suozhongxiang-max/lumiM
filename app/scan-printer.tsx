/**
 * 扫码绑定打印机页面
 * 使用 expo-camera 扫描二维码，获取打印机信息并绑定
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  Pressable,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { ScreenWrapper } from '@/components/screen-wrapper';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useI18n } from '@/hooks/use-i18n';
import { Colors } from '@/constants/theme';
import { usePrinterStore } from '@/stores';
import { logger } from '@/utils/logger';

/**
 * 二维码数据接口
 */
interface QRCodeData {
  deviceName: string;
  code: string;
}

/**
 * 扫码绑定打印机页面组件
 */
export default function ScanPrinterScreen() {
  // 获取主题配置
  const colorScheme = useColorScheme();
  const isDark = colorScheme.isDark;
  const { t } = useI18n();

  // 路由
  const router = useRouter();

  // 相机权限
  const [permission, requestPermission] = useCameraPermissions();

  // 扫描状态
  const [scanned, setScanned] = useState(false);
  const [binding, setBinding] = useState(false);

  // 从 Store 获取绑定方法
  const bindPrinter = usePrinterStore(state => state.bindPrinter);
  const fetchPrinters = usePrinterStore(state => state.fetchPrinters);

  /**
   * 请求相机权限
   */
  useEffect(() => {
    if (permission && !permission.granted && permission.canAskAgain) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  /**
   * 处理二维码扫描
   */
  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    // 如果已经扫描过或正在绑定，忽略
    if (scanned || binding) {
      return;
    }

    // 标记为已扫描
    setScanned(true);

    // 触觉反馈
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    logger.info('[ScanPrinterScreen] 扫描到二维码:', data);

    try {
      // 清理二维码数据：去除可能存在的首尾空格和单引号
      // 注意：某些二维码生成工具可能会在 JSON 字符串外层添加单引号
      // 这会导致 JSON.parse() 失败，因此需要先去除
      let cleanedData = data.trim();

      // 如果字符串被单引号包裹，去除单引号
      if (cleanedData.startsWith("'") && cleanedData.endsWith("'")) {
        cleanedData = cleanedData.slice(1, -1);
        logger.debug('[ScanPrinterScreen] 检测到单引号包裹，已自动去除');
      }

      // 解析二维码数据
      const qrData: QRCodeData = JSON.parse(cleanedData);

      // 验证数据格式
      if (!qrData.deviceName || !qrData.code) {
        throw new Error('二维码数据格式错误');
      }

      logger.info('[ScanPrinterScreen] 解析二维码成功:', qrData);

      // 显示确认对话框
      Alert.alert(
        t('dialog.scanner.confirmBind'),
        t('dialog.scanner.confirmBindMessage', {
          deviceName: qrData.deviceName,
          code: qrData.code,
        }).replace('\\n', '\n'),
        [
          {
            text: t('dialog.common.cancel'),
            style: 'cancel',
            onPress: () => {
              // 重置扫描状态，允许重新扫描
              setScanned(false);
            },
          },
          {
            text: t('dialog.common.confirm'),
            onPress: () => handleBindPrinter(qrData.deviceName, qrData.code),
          },
        ]
      );
    } catch (error) {
      // 解析失败
      logger.error('[ScanPrinterScreen] 解析二维码失败:', error);
      Alert.alert(t('dialog.error.title'), t('dialog.scanner.qrCodeError'), [
        {
          text: t('dialog.scanner.rescan'),
          onPress: () => setScanned(false),
        },
      ]);
    }
  };

  /**
   * 处理绑定打印机
   */
  const handleBindPrinter = async (deviceName: string, code: string) => {
    setBinding(true);

    try {
      // 调用绑定 API
      await bindPrinter(deviceName, code);

      logger.info('[ScanPrinterScreen] 绑定打印机成功');

      // 触觉反馈
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // 刷新打印机列表
      await fetchPrinters();

      // 显示成功提示
      Alert.alert(t('dialog.common.title'), t('dialog.scanner.bindSuccess'), [
        {
          text: t('dialog.common.confirm'),
          onPress: () => {
            // 返回上一页
            router.back();
          },
        },
      ]);
    } catch (error) {
      // 绑定失败
      logger.error('[ScanPrinterScreen] 绑定打印机失败:', error);

      // 触觉反馈
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

      Alert.alert(
        t('dialog.scanner.bindFailed'),
        error instanceof Error ? error.message : t('dialog.error.unknownError'),
        [
          {
            text: t('dialog.scanner.rescan'),
            onPress: () => {
              setScanned(false);
              setBinding(false);
            },
          },
          {
            text: t('dialog.common.cancel'),
            style: 'cancel',
            onPress: () => router.back(),
          },
        ]
      );
    }
  };

  /**
   * 处理返回按钮点击
   */
  const handleBack = () => {
    // 触觉反馈
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // 返回上一页
    router.back();
  };

  // 权限未授予
  if (!permission) {
    return (
      <ScreenWrapper edges={[]}>
        <View style={[styles.container, { backgroundColor: Colors[colorScheme].background }]}>
          <ActivityIndicator size="large" color={Colors[colorScheme].tint} />
          <Text style={[styles.message, { color: Colors[colorScheme].text }]}>
            {t('dialog.scanner.requestingPermission')}
          </Text>
        </View>
      </ScreenWrapper>
    );
  }

  // 权限被拒绝
  if (!permission.granted) {
    return (
      <ScreenWrapper edges={[]}>
        <View style={[styles.container, { backgroundColor: Colors[colorScheme].background }]}>
          <Ionicons
            name="camera-outline"
            size={64}
            color={Colors[colorScheme].icon}
            style={styles.icon}
          />
          <Text style={[styles.message, { color: Colors[colorScheme].text }]}>
            {t('dialog.scanner.needPermission')}
          </Text>
          <Pressable onPress={requestPermission} style={styles.button}>
            <Text style={styles.buttonText}>{t('dialog.scanner.grantPermission')}</Text>
          </Pressable>
          <Pressable onPress={handleBack} style={styles.cancelButton}>
            <Text style={[styles.cancelButtonText, { color: Colors[colorScheme].text }]}>
              {t('common.back')}
            </Text>
          </Pressable>
        </View>
      </ScreenWrapper>
    );
  }

  // 相机视图
  return (
    <ScreenWrapper edges={[]}>
      <View style={styles.cameraContainer}>
        {/* 相机视图 */}
        <CameraView
          style={styles.camera}
          facing="back"
          barcodeScannerSettings={{
            barcodeTypes: ['qr'],
          }}
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        />

        {/* 顶部导航栏 */}
        <View style={styles.topBar}>
          <Pressable onPress={handleBack} style={styles.backButton}>
            <View style={styles.backButtonBackground}>
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </View>
          </Pressable>
          <Text style={styles.topBarTitle}>{t('dialog.scanner.title')}</Text>
          <View style={styles.placeholder} />
        </View>

        {/* 扫描框 */}
        <View style={styles.scanFrame}>
          <View style={styles.scanFrameCorner} />
          <View style={[styles.scanFrameCorner, styles.scanFrameCornerTopRight]} />
          <View style={[styles.scanFrameCorner, styles.scanFrameCornerBottomLeft]} />
          <View style={[styles.scanFrameCorner, styles.scanFrameCornerBottomRight]} />
        </View>

        {/* 底部提示 */}
        <View style={styles.bottomBar}>
          <Text style={styles.hint}>{t('dialog.scanner.scanHint')}</Text>
        </View>

        {/* 绑定中遮罩 */}
        {binding && (
          <View style={styles.bindingOverlay}>
            <View style={styles.bindingContainer}>
              <ActivityIndicator size="large" color="#FFFFFF" />
              <Text style={styles.bindingText}>{t('dialog.scanner.binding')}</Text>
            </View>
          </View>
        )}
      </View>
    </ScreenWrapper>
  );
}

/**
 * 样式定义
 */
const styles = StyleSheet.create({
  // 容器
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },

  // 图标
  icon: {
    marginBottom: 20,
  },

  // 消息文字
  message: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
  },

  // 按钮
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 12,
  },

  // 按钮文字
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },

  // 取消按钮
  cancelButton: {
    paddingHorizontal: 32,
    paddingVertical: 12,
  },

  // 取消按钮文字
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },

  // 相机容器
  cameraContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },

  // 相机视图
  camera: {
    flex: 1,
  },

  // 顶部导航栏
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },

  // 返回按钮
  backButton: {
    padding: 4,
  },

  // 返回按钮背景
  backButtonBackground: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // 顶部标题
  topBarTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // 占位符
  placeholder: {
    width: 48,
  },

  // 扫描框
  scanFrame: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 250,
    height: 250,
    marginLeft: -125,
    marginTop: -125,
  },

  // 扫描框角
  scanFrameCorner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: '#FFFFFF',
    borderWidth: 3,
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },

  // 右上角
  scanFrameCornerTopRight: {
    left: undefined,
    right: 0,
    borderLeftWidth: 0,
    borderRightWidth: 3,
  },

  // 左下角
  scanFrameCornerBottomLeft: {
    top: undefined,
    bottom: 0,
    borderTopWidth: 0,
    borderBottomWidth: 3,
  },

  // 右下角
  scanFrameCornerBottomRight: {
    top: undefined,
    bottom: 0,
    left: undefined,
    right: 0,
    borderLeftWidth: 0,
    borderRightWidth: 3,
    borderTopWidth: 0,
    borderBottomWidth: 3,
  },

  // 底部提示栏
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: 30,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
  },

  // 提示文字
  hint: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
  },

  // 绑定中遮罩
  bindingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // 绑定中容器
  bindingContainer: {
    alignItems: 'center',
  },

  // 绑定中文字
  bindingText: {
    fontSize: 16,
    color: '#FFFFFF',
    marginTop: 16,
  },
});
