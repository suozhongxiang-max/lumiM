import AsyncStorage from '@react-native-async-storage/async-storage';
import { createJSONStorage } from 'zustand/middleware';

/**
 * Zustand persist 中间件的存储配置
 * 使用 AsyncStorage 作为 React Native 的持久化存储
 *
 * createJSONStorage 会自动处理 JSON 序列化/反序列化
 */
export const zustandStorage = createJSONStorage(() => AsyncStorage);
