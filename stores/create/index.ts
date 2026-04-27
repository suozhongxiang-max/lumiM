export type { CreateState, GenerationTask, GeneratedImage } from './types';
export { useCreateStore, useTasks, useTaskById } from './create-store';

// 使用 Zustand 全局状态管理，支持选择器优化性能
// 例如：const tasks = useTasks(); // 只订阅任务列表变化
// 或者：const { currentTaskId } = useCreateStore(); // 订阅多个状态
// currentTask 从 tasks 数组中计算：
// const currentTask = useCreateStore(state => state.tasks.find(t => t.id === state.currentTaskId) ?? null);
