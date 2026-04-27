/**
 * 打印机 Store 实现
 * 使用 Zustand + Immer 管理打印机状态
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { produce } from 'immer';
import type { PrinterStore } from './types';
import {
  fetchPrinterList,
  fetchPrinterDetail,
  bindPrinter as apiBind,
  unbindPrinter as apiUnbind,
  createPrintTask as apiCreateTask,
} from '@/services/api/printer';
import { logger } from '@/utils/logger';
import { categorizeError, logError } from '@/utils/error-handler';

/**
 * 初始状态
 */
const initialState = {
  printers: [],
  currentPrinter: null,
  selectedPrinterId: null, // 当前选中的打印机 ID
  loading: false,
  refreshing: false,
  error: null,
  pollingEnabled: false,
  pollingInterval: 5000, // 默认 5 秒轮询
};

/**
 * 创建打印机 Store
 */
export const usePrinterStore = create<PrinterStore>()(
  devtools(
    (set, get) => ({
      // 初始状态
      ...initialState,

      /**
       * 获取打印机列表
       */
      fetchPrinters: async () => {
        logger.info('[PrinterStore] 获取打印机列表');

        // 设置加载状态
        set(
          produce(state => {
            state.loading = true;
            state.error = null;
          })
        );

        try {
          // 调用 API
          const printers = await fetchPrinterList();

          // 获取当前选中的打印机 ID
          const { selectedPrinterId } = get();

          // 更新状态
          set(
            produce(state => {
              state.printers = printers;
              state.loading = false;

              // 检查当前选中的打印机是否还在列表中
              if (selectedPrinterId) {
                const stillExists = printers.some(p => p.deviceId === selectedPrinterId);

                if (!stillExists) {
                  // 如果当前选中的打印机已经不存在了
                  logger.warn('[PrinterStore] 当前选中的打印机已不存在:', selectedPrinterId);

                  // 清空当前打印机和选中 ID
                  state.currentPrinter = null;
                  state.selectedPrinterId = null;

                  // 如果列表不为空，自动选择第一台打印机
                  if (printers.length > 0) {
                    logger.info('[PrinterStore] 自动选择第一台打印机:', printers[0].deviceId);
                    // 注意：这里只设置 selectedPrinterId，不设置 currentPrinter
                    // currentPrinter 会在页面调用 fetchPrinterDetail 时设置
                    state.selectedPrinterId = printers[0].deviceId;
                  }
                }
              } else if (printers.length > 0 && !state.currentPrinter) {
                // 如果没有选中的打印机，且列表不为空，自动选择第一台
                logger.info('[PrinterStore] 自动选择第一台打印机:', printers[0].deviceId);
                state.selectedPrinterId = printers[0].deviceId;
              }
            })
          );

          logger.info('[PrinterStore] 获取打印机列表成功，共', printers.length, '台');

          // 如果选中的打印机 ID 发生了变化，自动获取详情
          const { selectedPrinterId: newSelectedId } = get();
          if (newSelectedId && newSelectedId !== selectedPrinterId) {
            logger.info('[PrinterStore] 自动获取新选中打印机的详情');
            await get().fetchPrinterDetail(newSelectedId);
          }
        } catch (error) {
          // 错误处理
          const errorInfo = categorizeError(error);
          set(
            produce(state => {
              state.loading = false;
              state.error = errorInfo.message;
            })
          );
          logError(error, 'PrinterStore.fetchPrinters');
        }
      },

      /**
       * 获取打印机详情
       */
      fetchPrinterDetail: async (deviceId: string) => {
        logger.info('[PrinterStore] 获取打印机详情:', deviceId);

        // 设置加载状态
        set(
          produce(state => {
            state.loading = true;
            state.error = null;
          })
        );

        try {
          // 调用 API
          const printer = await fetchPrinterDetail(deviceId);

          // 更新状态，同时记住选中的打印机 ID
          set(
            produce(state => {
              state.currentPrinter = printer;
              state.selectedPrinterId = deviceId; // 记住用户选择
              state.loading = false;
            })
          );

          logger.info('[PrinterStore] 获取打印机详情成功:', printer.deviceName);
        } catch (error) {
          // 错误处理
          const errorInfo = categorizeError(error);
          set(
            produce(state => {
              state.loading = false;
              state.error = errorInfo.message;
            })
          );
          logError(error, 'PrinterStore.fetchPrinterDetail');
        }
      },

      /**
       * 刷新当前打印机详情
       */
      refreshCurrentPrinter: async () => {
        const { selectedPrinterId } = get();

        // 如果没有选中的打印机 ID，不执行刷新
        if (!selectedPrinterId) {
          logger.warn('[PrinterStore] 没有选中的打印机，跳过刷新');
          return;
        }

        logger.debug('[PrinterStore] 刷新当前打印机详情:', selectedPrinterId);

        // 设置刷新状态
        set(
          produce(state => {
            state.refreshing = true;
            state.error = null;
          })
        );

        try {
          // 调用 API，使用 selectedPrinterId 而不是 currentPrinter.deviceId
          const printer = await fetchPrinterDetail(selectedPrinterId);

          // 更新状态
          set(
            produce(state => {
              state.currentPrinter = printer;
              state.refreshing = false;
            })
          );

          logger.debug('[PrinterStore] 刷新当前打印机详情成功');
        } catch (error) {
          // 如果是 AbortError，不记录错误（正常取消）
          if (error instanceof Error && error.name === 'AbortError') {
            logger.debug('[PrinterStore] 刷新请求已取消');
            set(
              produce(state => {
                state.refreshing = false;
              })
            );
            return;
          }

          // 错误处理
          const errorInfo = categorizeError(error);
          set(
            produce(state => {
              state.refreshing = false;
              state.error = errorInfo.message;
            })
          );
          logError(error, 'PrinterStore.refreshCurrentPrinter');
        }
      },

      /**
       * 绑定打印机
       */
      bindPrinter: async (deviceName: string, code: string) => {
        logger.info('[PrinterStore] 绑定打印机:', deviceName);

        // 设置加载状态
        set(
          produce(state => {
            state.loading = true;
            state.error = null;
          })
        );

        try {
          // 调用 API
          await apiBind(deviceName, code);

          // 绑定成功后，重新获取打印机列表
          await get().fetchPrinters();

          logger.info('[PrinterStore] 绑定打印机成功');
        } catch (error) {
          // 错误处理
          const errorInfo = categorizeError(error);
          set(
            produce(state => {
              state.loading = false;
              state.error = errorInfo.message;
            })
          );
          logError(error, 'PrinterStore.bindPrinter');
          throw error; // 重新抛出错误，让调用方处理
        }
      },

      /**
       * 解绑打印机
       */
      unbindPrinter: async (deviceId: string) => {
        logger.info('[PrinterStore] 解绑打印机:', deviceId);

        // 设置加载状态
        set(
          produce(state => {
            state.loading = true;
            state.error = null;
          })
        );

        try {
          // 调用 API
          await apiUnbind(deviceId);

          // 解绑成功后，重新获取打印机列表
          await get().fetchPrinters();

          // 如果解绑的是当前打印机，清除当前打印机
          const { currentPrinter } = get();
          if (currentPrinter && currentPrinter.deviceId === deviceId) {
            set(
              produce(state => {
                state.currentPrinter = null;
              })
            );
          }

          logger.info('[PrinterStore] 解绑打印机成功');
        } catch (error) {
          // 错误处理
          const errorInfo = categorizeError(error);
          set(
            produce(state => {
              state.loading = false;
              state.error = errorInfo.message;
            })
          );
          logError(error, 'PrinterStore.unbindPrinter');
          throw error; // 重新抛出错误，让调用方处理
        }
      },

      /**
       * 创建打印任务
       */
      createPrintTask: async (deviceId: string, modelId: string, taskName: string) => {
        logger.info('[PrinterStore] 创建打印任务:', { deviceId, modelId, taskName });

        // 设置加载状态
        set(
          produce(state => {
            state.loading = true;
            state.error = null;
          })
        );

        try {
          // 调用 API
          await apiCreateTask(deviceId, modelId, taskName);

          // 创建成功后，刷新打印机详情
          await get().fetchPrinterDetail(deviceId);

          logger.info('[PrinterStore] 创建打印任务成功');
        } catch (error) {
          // 错误处理
          const errorInfo = categorizeError(error);
          set(
            produce(state => {
              state.loading = false;
              state.error = errorInfo.message;
            })
          );
          logError(error, 'PrinterStore.createPrintTask');
          throw error; // 重新抛出错误，让调用方处理
        }
      },

      /**
       * 启用/禁用轮询
       */
      setPollingEnabled: (enabled: boolean) => {
        logger.debug('[PrinterStore] 设置轮询状态:', enabled);
        set(
          produce(state => {
            state.pollingEnabled = enabled;
          })
        );
      },

      /**
       * 设置轮询间隔
       */
      setPollingInterval: (interval: number) => {
        logger.debug('[PrinterStore] 设置轮询间隔:', interval);
        set(
          produce(state => {
            state.pollingInterval = interval;
          })
        );
      },

      /**
       * 清除错误
       */
      clearError: () => {
        set(
          produce(state => {
            state.error = null;
          })
        );
      },

      /**
       * 重置状态
       */
      reset: () => {
        logger.info('[PrinterStore] 重置状态');
        set(initialState);
      },
    }),
    {
      name: 'printer-store',
    }
  )
);
