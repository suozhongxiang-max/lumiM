/**
 * OTA (Over-The-Air) 更新管理工具
 * 基于 Expo Updates 实现应用热更新
 *
 * 功能：
 * - 检查更新
 * - 下载并应用更新
 * - 自动更新配置
 * - 更新错误处理
 */

import * as Updates from 'expo-updates';
import { Alert, Platform } from 'react-native';
import { logger } from './logger';

/**
 * 更新检查结果
 */
export interface UpdateCheckResult {
  /** 是否有可用更新 */
  isAvailable: boolean;
  /** 当前版本 */
  currentRuntimeVersion: string | null;
  /** 可用版本（如果有） */
  availableRuntimeVersion: string | null;
}

/**
 * 更新类型
 */
export type UpdateType = 'manual' | 'auto' | 'background';

/**
 * 更新配置选项
 */
export interface UpdateOptions {
  /** 更新类型 */
  type: UpdateType;
  /** 是否显示下载进度提示 */
  showProgress?: boolean;
  /** 更新完成后是否立即重启应用 */
  restartNow?: boolean;
}

/**
 * 默认配置
 */
const DEFAULT_OPTIONS: UpdateOptions = {
  type: 'auto',
  showProgress: true,
  restartNow: true,
};

/**
 * OTA 更新管理器
 */
export const otaUpdateManager = {
  /**
   * 检查是否启用 OTA 更新
   * 注意：Expo Updates 仅在发布构建中可用，开发模式下无法使用
   *
   * @returns {boolean} 是否启用 OTA 更新
   */
  isEnabled(): boolean {
    // 开发模式下禁用（Updates API 仅在发布构建中可用）
    if (__DEV__) {
      return false;
    }
    // 生产模式只在非 Web 平台启用
    return Platform.OS !== 'web' && Updates.isEnabled;
  },

  /**
   * 获取当前运行时版本
   * 新版 API 使用常量而非异步方法
   */
  getRuntimeVersion(): string | null {
    try {
      if (!this.isEnabled()) {
        return null;
      }
      return Updates.runtimeVersion;
    } catch (error) {
      logger.error('获取运行时版本失败:', error);
      return null;
    }
  },

  /**
   * 获取当前通道名称
   */
  getChannel(): string | null {
    try {
      if (!this.isEnabled()) {
        return null;
      }
      return Updates.channel;
    } catch (error) {
      logger.error('获取更新通道失败:', error);
      return null;
    }
  },

  /**
   * 检查是否有可用更新
   *
   * 注意：新版 API 的 checkForUpdateAsync 不接受参数
   *
   * @returns 更新检查结果
   */
  async checkForUpdate(): Promise<UpdateCheckResult> {
    try {
      // 如果未启用 OTA 更新，返回无更新
      if (!this.isEnabled()) {
        logger.debug('OTA 更新未启用');
        return {
          isAvailable: false,
          currentRuntimeVersion: null,
          availableRuntimeVersion: null,
        };
      }

      // 获取当前运行时版本
      const currentRuntimeVersion = this.getRuntimeVersion();

      // 检查更新
      const updateResult = await Updates.checkForUpdateAsync();

      if (updateResult.isAvailable) {
        logger.info('发现可用更新', {
          currentVersion: currentRuntimeVersion,
          manifest: updateResult.manifest,
        });

        // 从 manifest 中获取版本信息
        const availableRuntimeVersion = (updateResult.manifest as any)?.runtimeVersion ?? null;

        return {
          isAvailable: true,
          currentRuntimeVersion,
          availableRuntimeVersion,
        };
      }

      logger.debug('当前已是最新版本');
      return {
        isAvailable: false,
        currentRuntimeVersion,
        availableRuntimeVersion: null,
      };
    } catch (error) {
      logger.error('检查更新失败:', error);
      // 网络错误等情况下返回无更新，避免影响用户使用
      return {
        isAvailable: false,
        currentRuntimeVersion: null,
        availableRuntimeVersion: null,
      };
    }
  },

  /**
   * 下载并应用更新
   *
   * @param options - 更新配置选项
   * @returns 是否成功应用更新
   */
  async fetchAndApplyUpdate(options: Partial<UpdateOptions> = {}): Promise<boolean> {
    const opts = { ...DEFAULT_OPTIONS, ...options };

    try {
      if (!this.isEnabled()) {
        logger.warn('OTA 更新未启用，跳过更新');
        return false;
      }

      // 显示下载提示（可选）
      if (opts.showProgress && opts.type === 'manual') {
        logger.info('正在下载更新...');
      }

      // 下载更新包
      const updateResult = await Updates.fetchUpdateAsync();

      if (updateResult.isNew) {
        logger.info('更新下载完成，准备重启应用');

        // 如果配置为立即重启，则重启应用
        if (opts.restartNow) {
          await this.restart();
        }

        return true;
      }

      logger.debug('没有新更新需要应用');
      return false;
    } catch (error) {
      logger.error('下载更新失败:', error);

      // 用户取消下载的情况
      if (error instanceof Error && error.message.includes('user cancelled')) {
        logger.info('用户取消了更新下载');
        return false;
      }

      // 显示错误提示（仅手动检查时）
      if (opts.type === 'manual') {
        Alert.alert('更新失败', '下载更新时发生错误，请稍后重试');
      }

      return false;
    }
  },

  /**
   * 重启应用以应用更新
   */
  async restart(): Promise<void> {
    try {
      await Updates.reloadAsync();
    } catch (error) {
      logger.error('重启应用失败:', error);
    }
  },

  /**
   * 检查并提示更新（带用户交互）
   * 适用于"检查更新"按钮或应用启动时的检查
   */
  async checkAndPromptUpdate(): Promise<void> {
    try {
      if (!this.isEnabled()) {
        return;
      }

      // 显示加载提示
      logger.info('正在检查更新...');

      // 检查更新
      const result = await this.checkForUpdate();

      if (!result.isAvailable) {
        // 没有更新
        Alert.alert('检查更新', '当前已是最新版本');
        return;
      }

      // 有更新，显示更新提示
      Alert.alert(
        '发现新版本',
        '发现新版本更新，是否立即下载并安装？',
        [
          {
            text: '稍后',
            style: 'cancel',
          },
          {
            text: '立即更新',
            onPress: async () => {
              await this.fetchAndApplyUpdate({ type: 'manual', restartNow: true });
            },
          },
        ]
      );
    } catch (error) {
      logger.error('检查更新失败:', error);
      Alert.alert('检查更新失败', '无法连接到更新服务器，请检查网络连接');
    }
  },

  /**
   * 静默检查并应用更新
   * 适用于应用启动时的自动更新
   *
   * @returns 是否成功应用了更新
   */
  async silentUpdate(): Promise<boolean> {
    try {
      if (!this.isEnabled()) {
        return false;
      }

      // 检查更新
      const result = await this.checkForUpdate();

      if (!result.isAvailable) {
        return false;
      }

      // 静默下载并应用更新
      const success = await this.fetchAndApplyUpdate({
        type: 'auto',
        showProgress: false,
        restartNow: false, // 不立即重启，让用户完成当前操作
      });

      return success;
    } catch (error) {
      logger.error('静默更新失败:', error);
      return false;
    }
  },

  /**
   * 获取更新相关信息（用于调试）
   */
  getUpdateInfo(): {
    channelId: string | null;
    runtimeVersion: string | null;
    isEmbeddedLaunch: boolean;
    isUsingEmbeddedAssets: boolean;
    updateId: string | null;
  } {
    try {
      return {
        channelId: this.getChannel(),
        runtimeVersion: this.getRuntimeVersion(),
        isEmbeddedLaunch: Updates.isEmbeddedLaunch,
        isUsingEmbeddedAssets: Updates.isUsingEmbeddedAssets,
        updateId: Updates.updateId,
      };
    } catch (error) {
      logger.error('获取更新信息失败:', error);
      return {
        channelId: null,
        runtimeVersion: null,
        isEmbeddedLaunch: false,
        isUsingEmbeddedAssets: false,
        updateId: null,
      };
    }
  },
};

/**
 * React Hook：自动检查并应用更新
 * 在应用启动时调用
 */
export function useAutoUpdate() {
  const runAutoUpdate = async () => {
    try {
      const hasUpdate = await otaUpdateManager.silentUpdate();
      if (hasUpdate) {
        logger.info('更新已下载，将在下次重启时应用');
      }
    } catch (error) {
      logger.error('自动更新失败:', error);
    }
  };

  return { runAutoUpdate };
}
