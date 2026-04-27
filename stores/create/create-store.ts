import {
  createImageTo3DTask as apiCreateImageTo3DTask,
  createTextToImageTask,
  selectImageForModel,
  type BackendGenerationTask,
} from '@/services/api/tasks';
import { subscribeTaskEvents } from '@/services/api/task-events';
import { logger } from '@/utils/logger';
import { zustandStorage } from '@/utils/storage';
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { CreateState, GeneratedImage, GenerationTask, TaskStatus } from './types';

function mapBackendStatus(
  backendStatus: BackendGenerationTask['status']
): GenerationTask['status'] {
  switch (backendStatus) {
    case 'IMAGE_PENDING':
    case 'IMAGE_GENERATING':
      return 'generating_images';
    case 'IMAGE_COMPLETED':
      return 'images_ready';
    case 'IMAGE_FAILED':
      return 'failed';
    case 'MODEL_PENDING':
    case 'MODEL_GENERATING':
      return 'generating_model';
    case 'MODEL_COMPLETED':
    case 'COMPLETED':
      return 'model_ready';
    case 'MODEL_FAILED':
      return 'failed';
    default:
      logger.warn('未知的后端任务状态', backendStatus);
      return 'failed';
  }
}

function calculateImageProgress(images: GeneratedImage[]): number {
  if (!images || images.length === 0) return 0;

  const completedCount = images.filter(img => img.imageStatus === 'COMPLETED').length;
  return Math.floor((completedCount / 4) * 100);
}

function calculateModelProgress(backendTask: BackendGenerationTask): number {
  if (typeof backendTask.modelProgress === 'number') {
    return Math.min(Math.max(backendTask.modelProgress, 0), 100);
  }

  const { model } = backendTask;
  if (!model) return 0;

  if (model.completedAt) {
    return 100;
  }

  if (model.failedAt) {
    return 0;
  }

  if (model.generationJob) {
    const jobStatus = model.generationJob.status;
    const jobProgress = model.generationJob.progress || 0;

    if (jobStatus === 'COMPLETED') {
      return 100;
    }

    if (jobStatus === 'FAILED' || jobStatus === 'TIMEOUT') {
      return 0;
    }

    return Math.min(Math.max(jobProgress, 0), 100);
  }

  return 0;
}

function adaptBackendTask(backendTask: BackendGenerationTask): GenerationTask {
  logger.debug('[Store] adaptBackendTask start:', {
    taskId: backendTask.id,
    status: backendTask.status,
    phase: backendTask.phase,
    hasImages: !!backendTask.images,
    imageCount: backendTask.images?.length || 0,
    hasModel: !!backendTask.model,
    selectedImageIndex: backendTask.selectedImageIndex,
  });

  const hasReferenceImages =
    !!(backendTask as any).referenceImages && (backendTask as any).referenceImages.length > 0;

  const images: GeneratedImage[] | undefined = backendTask.images?.map(img => ({
    id: img.id,
    index: img.index,
    imageStatus: img.imageStatus,
    imageUrl: img.imageUrl,
    imagePrompt: img.imagePrompt,
    url: img.imageUrl || undefined,
    thumbnail: img.imageUrl || undefined,
  }));

  const imageProgress = images ? calculateImageProgress(images) : 0;

  let selectedImageId: string | undefined;
  if (backendTask.selectedImageIndex !== null && images) {
    const selectedImage = images.find(img => img.index === backendTask.selectedImageIndex);
    selectedImageId = selectedImage?.id;
  }

  const modelProgress = calculateModelProgress(backendTask);

  let status = mapBackendStatus(backendTask.status);
  if (hasReferenceImages && (status === 'generating_images' || status === 'images_ready')) {
    logger.info('[Store] image-to-3d task forced to generating_model');
    status = 'generating_model';
  }

  const frontendTask: GenerationTask = {
    id: backendTask.id,
    prompt: backendTask.originalPrompt,
    referenceImages: (backendTask as any).referenceImages,
    status,
    createdAt: new Date(backendTask.createdAt),
    updatedAt: new Date(backendTask.updatedAt),
    images,
    imageProgress,
    selectedImageId,
    selectedImageIndex: backendTask.selectedImageIndex ?? undefined,
    model: backendTask.model
      ? {
          id: backendTask.model.id,
          sourceImageId: backendTask.model.sourceImageId,
          name: backendTask.model.name,
          modelUrl: backendTask.model.modelUrl,
          previewImageUrl: backendTask.model.previewImageUrl,
          format: backendTask.model.format,
          fileSize: backendTask.model.fileSize,
          completedAt: backendTask.model.completedAt,
          failedAt: backendTask.model.failedAt,
          errorMessage: backendTask.model.errorMessage,
          generationJob: backendTask.model.generationJob,
        }
      : undefined,
    modelProgress,
    error: backendTask.model?.errorMessage ?? undefined,
  };

  logger.debug('[Store] adaptBackendTask done:', {
    taskId: frontendTask.id,
    status: frontendTask.status,
    isImageTo3D: hasReferenceImages,
    imageProgress: frontendTask.imageProgress,
    modelProgress: frontendTask.modelProgress,
    imageCount: frontendTask.images?.length || 0,
    selectedImageId: frontendTask.selectedImageId,
    selectedImageIndex: frontendTask.selectedImageIndex,
    hasModel: !!frontendTask.model,
    modelUrl: frontendTask.model?.modelUrl,
    previewImageUrl: frontendTask.model?.previewImageUrl,
    error: frontendTask.error,
  });

  return frontendTask;
}

export const useCreateStore = create<CreateState>()(
  devtools(
    persist(
      immer((set, get) => ({
        currentTaskId: null,
        tasks: [],
        taskSubscriptions: new Map(),

        createTask: async (prompt: string, referenceImages?: string[]) => {
          try {
            logger.info('[Store] create task:', { prompt, referenceImages });

            const result = await createTextToImageTask(prompt, referenceImages);

            if (!result.success) {
              logger.error('[Store] create task failed:', result.error.message);
              throw new Error(result.error.message);
            }

            const newTask = adaptBackendTask(result.data);

            set(state => {
              state.tasks.unshift(newTask);
              state.currentTaskId = newTask.id;

              if (state.tasks.length > 20) {
                state.tasks = state.tasks.slice(0, 20);
              }
            });

            get()._startTaskSubscription(newTask.id);
            return newTask.id;
          } catch (error) {
            logger.error('[Store] create task exception:', error);
            throw error;
          }
        },

        createImageTo3DTask: async (prompt: string, imageData: string) => {
          try {
            logger.info('[Store] create image-to-3d task:', { prompt, hasImage: !!imageData });

            const result = await apiCreateImageTo3DTask(prompt, imageData);

            if (!result.success) {
              logger.error('[Store] create image-to-3d task failed:', result.error.message);
              throw new Error(result.error.message);
            }

            (result.data as any).referenceImages = [imageData];
            const adaptedTask = adaptBackendTask(result.data);

            set(state => {
              state.tasks.unshift(adaptedTask);
              state.currentTaskId = adaptedTask.id;

              if (state.tasks.length > 20) {
                state.tasks = state.tasks.slice(0, 20);
              }
            });

            get()._startTaskSubscription(adaptedTask.id);
            return adaptedTask.id;
          } catch (error) {
            logger.error('[Store] create image-to-3d task exception:', error);
            throw error;
          }
        },

        selectImage: async (taskId: string, imageId: string) => {
          logger.info('[Store] select image:', { taskId, imageId });

          set(state => {
            const task = state.tasks.find(t => t.id === taskId);
            if (task && task.status === 'images_ready') {
              task.selectedImageId = imageId;
              task.updatedAt = new Date();
            }
          });
        },

        generateModel: async (taskId: string) => {
          try {
            logger.info('[Store] generate model:', taskId);

            const task = get().tasks.find(t => t.id === taskId);
            if (!task) {
              throw new Error('任务不存在');
            }

            if (!task.selectedImageId) {
              throw new Error('未选择图片');
            }

            const selectedImage = task.images?.find(img => img.id === task.selectedImageId);
            if (!selectedImage) {
              throw new Error('选中的图片不存在');
            }

            set(state => {
              const currentTask = state.tasks.find(t => t.id === taskId);
              if (currentTask) {
                currentTask.status = 'generating_model';
                currentTask.modelProgress = 0;
                currentTask.selectedImageIndex = selectedImage.index;
                currentTask.updatedAt = new Date();
              }
            });

            const result = await selectImageForModel(taskId, selectedImage.index);

            if (!result.success) {
              set(state => {
                const currentTask = state.tasks.find(t => t.id === taskId);
                if (currentTask) {
                  currentTask.status = 'failed';
                  currentTask.error = result.error.message;
                  currentTask.updatedAt = new Date();
                }
              });
              return;
            }

            const updatedTask = adaptBackendTask(result.data.task);

            set(state => {
              const currentTask = state.tasks.find(t => t.id === taskId);
              if (currentTask) {
                Object.assign(currentTask, updatedTask);
              }
            });

            get()._startTaskSubscription(taskId);
          } catch (error) {
            logger.error('[Store] generate model exception:', error);

            set(state => {
              const task = state.tasks.find(t => t.id === taskId);
              if (task) {
                task.status = 'failed';
                task.error = error instanceof Error ? error.message : '未知错误';
                task.updatedAt = new Date();
              }
            });

            throw error;
          }
        },

        cancelTask: (taskId: string) => {
          logger.info('[Store] cancel task:', taskId);

          get()._stopTaskSubscription(taskId);

          set(state => {
            const task = state.tasks.find(t => t.id === taskId);
            if (task) {
              task.status = 'cancelled';
              task.updatedAt = new Date();
            }

            if (state.currentTaskId === taskId) {
              state.currentTaskId = null;
            }
          });
        },

        deleteTask: (taskId: string) => {
          logger.info('[Store] delete task:', taskId);

          get()._stopTaskSubscription(taskId);

          set(state => {
            state.tasks = state.tasks.filter(t => t.id !== taskId);

            if (state.currentTaskId === taskId) {
              state.currentTaskId = null;
            }
          });
        },

        getTask: (taskId: string) => {
          return get().tasks.find(t => t.id === taskId);
        },

        _updateTaskProgress: (taskId: string, progress: Partial<GenerationTask>) => {
          set(state => {
            const task = state.tasks.find(t => t.id === taskId);
            if (!task) return;

            const preservedReferenceImages = task.referenceImages;

            Object.assign(task, progress);
            task.updatedAt = new Date();

            if (preservedReferenceImages && !task.referenceImages) {
              task.referenceImages = preservedReferenceImages;
            }
          });
        },

        _startTaskSubscription: (taskId: string) => {
          logger.info('[Store] start task SSE subscription:', taskId);

          get()._stopTaskSubscription(taskId);

          const task = get().tasks.find(t => t.id === taskId);
          if (!task || task.status === 'cancelled') {
            return;
          }

          const finishedStatuses: TaskStatus[] = ['images_ready', 'model_ready', 'failed'];
          if (finishedStatuses.includes(task.status)) {
            return;
          }

          const subscription = subscribeTaskEvents({
            taskId,
            onTaskUpdate: backendTask => {
              const currentTask = get().tasks.find(t => t.id === taskId);
              if (!currentTask || currentTask.status === 'cancelled') {
                get()._stopTaskSubscription(taskId);
                return;
              }

              logger.info('[Store] task SSE snapshot received:', {
                taskId,
                backendStatus: backendTask.status,
                phase: backendTask.phase,
                imageCount: backendTask.images?.length || 0,
                completedImageCount:
                  backendTask.images?.filter(image => image.imageStatus === 'COMPLETED').length || 0,
                selectedImageIndex: backendTask.selectedImageIndex,
                hasModel: !!backendTask.model,
                modelProgress: backendTask.modelProgress,
                generationJobProgress: backendTask.model?.generationJob?.progress,
                modelUrl: backendTask.model?.modelUrl,
                previewImageUrl: backendTask.model?.previewImageUrl,
                updatedAt: backendTask.updatedAt,
              });

              const updatedTask = adaptBackendTask(backendTask);
              logger.info('[Store] task state updated from SSE:', {
                taskId,
                frontendStatus: updatedTask.status,
                imageProgress: updatedTask.imageProgress,
                modelProgress: updatedTask.modelProgress,
                imageCount: updatedTask.images?.length || 0,
                selectedImageIndex: updatedTask.selectedImageIndex,
                hasModel: !!updatedTask.model,
                modelUrl: updatedTask.model?.modelUrl,
              });
              get()._updateTaskProgress(taskId, updatedTask);

              if (finishedStatuses.includes(updatedTask.status)) {
                logger.info('[Store] task reached terminal state from SSE:', {
                  taskId,
                  status: updatedTask.status,
                });
                get()._stopTaskSubscription(taskId);
              }
            },
            onTaskDone: payload => {
              logger.info('[Store] task SSE done:', payload);

              if (payload.status === 'COMPLETED') {
                const currentTask = get().tasks.find(t => t.id === taskId);
                if (currentTask) {
                  const isModelFlow =
                    !!currentTask.model ||
                    currentTask.selectedImageIndex !== undefined ||
                    !!currentTask.referenceImages?.length;

                  get()._updateTaskProgress(taskId, {
                    status: isModelFlow ? 'model_ready' : 'images_ready',
                  });
                }
              }

              if (payload.status === 'FAILED') {
                get()._updateTaskProgress(taskId, {
                  status: 'failed',
                  error: '任务处理失败',
                });
              }

              if (payload.status === 'CANCELLED') {
                get()._updateTaskProgress(taskId, {
                  status: 'cancelled',
                });
              }

              get()._stopTaskSubscription(taskId);
            },
            onError: error => {
              logger.error('[Store] task SSE error:', {
                taskId,
                error,
              });
            },
          });

          set(state => {
            state.taskSubscriptions.set(taskId, subscription);
          });
        },

        _stopTaskSubscription: (taskId: string) => {
          const subscription = get().taskSubscriptions.get(taskId);
          if (!subscription) {
            return;
          }

          subscription.close();
          set(state => {
            state.taskSubscriptions.delete(taskId);
          });
        },

        _stopAllTaskSubscriptions: () => {
          const subscriptions = get().taskSubscriptions;
          if (subscriptions.size === 0) {
            return;
          }

          subscriptions.forEach(subscription => subscription.close());
          set(state => {
            state.taskSubscriptions.clear();
          });
        },

        reset: () => {
          logger.info('[Store] reset create state');

          get()._stopAllTaskSubscriptions();

          set(state => {
            state.currentTaskId = null;
          });
        },

        setStoreTask: (taskId: string, newTask: GenerationTask) => {
          logger.info('[Store] set task from outside:', { taskId });
          const task = get().tasks.find(t => t.id === taskId);

          if (!task) {
            set(state => {
              state.tasks.unshift(newTask);
            });
            return;
          }

          set(state => {
            return {
              ...state,
              tasks: state.tasks.map(t => {
                if (t.id === taskId) {
                  return { ...t, ...newTask };
                }
                return t;
              }),
            };
          });
        },
      })),
      {
        name: 'create-store',
        storage: zustandStorage,
        partialize: state => ({
          tasks: state.tasks,
        }),
      }
    ),
    {
      name: 'CreateStore',
    }
  )
);

export const useTasks = () => useCreateStore(state => state.tasks);
export const useTaskById = (taskId: string) =>
  useCreateStore(state => state.tasks.find(t => t.id === taskId));
