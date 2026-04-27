import { API_ENDPOINTS } from '@/config/api';
import type { BackendGenerationTask } from '@/services/api/tasks';
import { normalizeApiUrls, type SseSubscription, subscribeSse } from '@/services/sse';

type TaskSnapshotPayload = {
  status: 'success';
  data: BackendGenerationTask;
};

type TaskHeartbeatPayload = {
  timestamp: string;
};

type TaskDonePayload = {
  taskId: string;
  status: 'COMPLETED' | 'FAILED' | 'CANCELLED';
};

type TaskStreamErrorPayload = {
  message: string;
  code?: string;
};

type TaskEventPayload =
  | TaskSnapshotPayload
  | TaskHeartbeatPayload
  | TaskDonePayload
  | TaskStreamErrorPayload;

interface SubscribeTaskEventsOptions {
  taskId: string;
  onTaskUpdate: (task: BackendGenerationTask) => void;
  onTaskDone?: (payload: TaskDonePayload) => void;
  onHeartbeat?: (payload: TaskHeartbeatPayload) => void;
  onError?: (error: unknown) => void;
}

const TASK_EVENT_NAMES = ['task_snapshot', 'heartbeat', 'done', 'error'];

function isTaskSnapshotPayload(payload: TaskEventPayload): payload is TaskSnapshotPayload {
  return (
    typeof payload === 'object' &&
    payload !== null &&
    'status' in payload &&
    payload.status === 'success' &&
    'data' in payload
  );
}

export function subscribeTaskEvents({
  taskId,
  onTaskUpdate,
  onTaskDone,
  onHeartbeat,
  onError,
}: SubscribeTaskEventsOptions): SseSubscription {
  let subscription: SseSubscription | null = null;

  subscription = subscribeSse<TaskEventPayload>({
    url: API_ENDPOINTS.tasks.events(taskId),
    events: TASK_EVENT_NAMES,
    onMessage: (payload, event) => {
      console.log('[TaskEvents] SSE event received', {
        taskId,
        eventType: event.type,
        lastEventId: event.lastEventId,
        payload,
      });

      switch (event.type) {
        case 'task_snapshot':
          if (!isTaskSnapshotPayload(payload)) return;
          onTaskUpdate(normalizeApiUrls(payload.data));
          return;

        case 'heartbeat':
          onHeartbeat?.(payload as TaskHeartbeatPayload);
          return;

        case 'done':
          onTaskDone?.(payload as TaskDonePayload);
          subscription?.close();
          return;

        case 'error': {
          const errorPayload = payload as TaskStreamErrorPayload;
          onError?.(new Error(errorPayload.message || errorPayload.code || '任务事件流异常中断'));
          subscription?.close();
          return;
        }
      }
    },
    onError,
  });

  return subscription;
}
