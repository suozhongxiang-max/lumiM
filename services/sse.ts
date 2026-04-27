import { API_CONFIG } from '@/config/api';
import { tokenManager } from '@/services/api-client';

const EVENT_STREAM_CONTENT_TYPE = 'text/event-stream';
const URL_FIELDS = ['url', 'imageUrl', 'modelUrl', 'mtlUrl', 'textureUrl', 'previewImageUrl'] as const;
const DEFAULT_RECONNECT_DELAY = 2000;

type SseMessageHandler<T = unknown> = (
  data: T,
  event: {
    type: string;
    data: string;
    lastEventId?: string;
  }
) => void;

export interface SseSubscriptionOptions<T = unknown> {
  url: string;
  events?: string[];
  onMessage?: SseMessageHandler<T>;
  onOpen?: (response: ResponseLike) => void | Promise<void>;
  onError?: (error: unknown) => void;
  maxReconnectAttempts?: number;
}

export interface SseSubscription {
  close: () => void;
}

interface ResponseLike {
  ok: boolean;
  status: number;
  headers: {
    get: (name: string) => string | null;
  };
}

interface ParsedEvent {
  event: string;
  data: string;
  id?: string;
  retry?: number;
}

function buildApiUrl(endpoint: string): string {
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const baseURL = API_CONFIG.baseURL;

  if (!baseURL) {
    return normalizedEndpoint;
  }

  const normalizedBaseURL = baseURL.endsWith('/') ? baseURL.slice(0, -1) : baseURL;
  return `${normalizedBaseURL}${normalizedEndpoint}`;
}

export function normalizeApiUrls<T>(data: T): T {
  if (data === null || data === undefined) {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(item => normalizeApiUrls(item)) as T;
  }

  if (typeof data === 'object') {
    const result: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(data)) {
      if (
        (URL_FIELDS as readonly string[]).includes(key) &&
        typeof value === 'string' &&
        value.startsWith('/')
      ) {
        result[key] = buildApiUrl(value);
      } else if (typeof value === 'object') {
        result[key] = normalizeApiUrls(value);
      } else {
        result[key] = value;
      }
    }

    return result as T;
  }

  return data;
}

function parseSseData<T>(rawData: string): T {
  if (!rawData) {
    return undefined as T;
  }

  try {
    return JSON.parse(rawData) as T;
  } catch {
    return rawData as T;
  }
}

function parseResponseHeaders(rawHeaders: string): Map<string, string> {
  const headers = new Map<string, string>();
  const lines = rawHeaders.split(/\r?\n/);

  for (const line of lines) {
    const index = line.indexOf(':');
    if (index <= 0) continue;

    const key = line.slice(0, index).trim().toLowerCase();
    const value = line.slice(index + 1).trim();
    headers.set(key, value);
  }

  return headers;
}

function createResponseLike(xhr: XMLHttpRequest): ResponseLike {
  const headers = parseResponseHeaders(xhr.getAllResponseHeaders?.() ?? '');

  return {
    ok: xhr.status >= 200 && xhr.status < 300,
    status: xhr.status,
    headers: {
      get: (name: string) => headers.get(name.toLowerCase()) ?? null,
    },
  };
}

function parseEventBlock(block: string): ParsedEvent | null {
  const lines = block.split(/\r?\n/);
  let event = 'message';
  const dataLines: string[] = [];
  let id: string | undefined;
  let retry: number | undefined;

  for (const line of lines) {
    if (!line || line.startsWith(':')) {
      continue;
    }

    const separatorIndex = line.indexOf(':');
    const field = separatorIndex === -1 ? line : line.slice(0, separatorIndex);
    const rawValue = separatorIndex === -1 ? '' : line.slice(separatorIndex + 1);
    const value = rawValue.startsWith(' ') ? rawValue.slice(1) : rawValue;

    switch (field) {
      case 'event':
        event = value || 'message';
        break;
      case 'data':
        dataLines.push(value);
        break;
      case 'id':
        id = value;
        break;
      case 'retry': {
        const parsedRetry = Number(value);
        if (Number.isFinite(parsedRetry) && parsedRetry >= 0) {
          retry = parsedRetry;
        }
        break;
      }
    }
  }

  if (dataLines.length === 0 && !id && retry === undefined) {
    return null;
  }

  return {
    event,
    data: dataLines.join('\n'),
    id,
    retry,
  };
}

function extractBlocks(buffer: string): { blocks: string[]; rest: string } {
  const normalized = buffer.replace(/\r\n/g, '\n');
  const parts = normalized.split('\n\n');

  if (parts.length === 1) {
    return {
      blocks: [],
      rest: normalized,
    };
  }

  const rest = parts.pop() ?? '';
  return {
    blocks: parts,
    rest,
  };
}

async function buildSseHeaders(lastEventId?: string): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    Accept: EVENT_STREAM_CONTENT_TYPE,
    'Cache-Control': 'no-cache',
  };

  const token = await tokenManager.getToken();
  if (token) {
    headers.Authorization = token;
  }

  if (lastEventId) {
    headers['Last-Event-ID'] = lastEventId;
  }

  return headers;
}

export function subscribeSse<T = unknown>({
  url,
  events = [],
  onMessage,
  onOpen,
  onError,
  maxReconnectAttempts = 5,
}: SseSubscriptionOptions<T>): SseSubscription {
  let closed = false;
  let reconnectAttempts = 0;
  let reconnectDelay = DEFAULT_RECONNECT_DELAY;
  let lastEventId: string | undefined;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  let xhr: XMLHttpRequest | null = null;
  let processedLength = 0;
  let buffer = '';

  const clearReconnectTimer = () => {
    if (!reconnectTimer) return;
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  };

  const cleanupXhr = () => {
    if (!xhr) return;
    xhr.onreadystatechange = null;
    xhr.onprogress = null;
    xhr.onerror = null;
    xhr.onabort = null;
    xhr.onloadend = null;
    xhr.abort();
    xhr = null;
  };

  const handleParsedEvent = (parsedEvent: ParsedEvent) => {
    if (parsedEvent.id) {
      lastEventId = parsedEvent.id;
    }

    if (parsedEvent.retry !== undefined) {
      reconnectDelay = parsedEvent.retry;
    }

    const eventType = parsedEvent.event || 'message';
    const shouldHandle =
      eventType === 'message' || events.length === 0 || events.includes(eventType);

    if (!shouldHandle) {
      return;
    }

    onMessage?.(parseSseData<T>(parsedEvent.data), {
      type: eventType,
      data: parsedEvent.data,
      lastEventId: parsedEvent.id,
    });
  };

  const consumeChunk = (text: string) => {
    if (!text) return;

    buffer += text;
    const { blocks, rest } = extractBlocks(buffer);
    buffer = rest;

    for (const block of blocks) {
      const parsedEvent = parseEventBlock(block);
      if (parsedEvent) {
        handleParsedEvent(parsedEvent);
      }
    }
  };

  const scheduleReconnect = () => {
    if (closed) return;

    reconnectAttempts += 1;
    if (reconnectAttempts >= maxReconnectAttempts) {
      closed = true;
      cleanupXhr();
      return;
    }

    clearReconnectTimer();
    reconnectTimer = setTimeout(() => {
      void connect();
    }, reconnectDelay);
  };

  const connect = async () => {
    cleanupXhr();
    processedLength = 0;
    buffer = '';

    const request = new XMLHttpRequest();
    xhr = request;

    const headers = await buildSseHeaders(lastEventId);
    const requestUrl = buildApiUrl(url);

    request.open('GET', requestUrl, true);
    request.setRequestHeader('Accept', EVENT_STREAM_CONTENT_TYPE);

    for (const [key, value] of Object.entries(headers)) {
      request.setRequestHeader(key, value);
    }

    request.onreadystatechange = () => {
      if (request.readyState !== XMLHttpRequest.HEADERS_RECEIVED) {
        return;
      }

      const response = createResponseLike(request);
      void Promise.resolve(onOpen?.(response)).catch(error => {
        onError?.(error);
      });

      if (!response.ok) {
        onError?.(new Error(`SSE 连接失败: HTTP ${response.status}`));
        cleanupXhr();
        scheduleReconnect();
        return;
      }

      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes(EVENT_STREAM_CONTENT_TYPE)) {
        onError?.(new Error(`SSE 响应类型错误: ${contentType || 'unknown'}`));
        cleanupXhr();
        scheduleReconnect();
      }
    };

    request.onprogress = () => {
      const nextText = request.responseText.slice(processedLength);
      processedLength = request.responseText.length;
      consumeChunk(nextText);
    };

    request.onerror = () => {
      if (closed) return;
      onError?.(new Error('SSE 网络异常'));
      cleanupXhr();
      scheduleReconnect();
    };

    request.onloadend = () => {
      if (closed) return;

      const nextText = request.responseText.slice(processedLength);
      processedLength = request.responseText.length;
      consumeChunk(nextText);

      if (buffer.trim()) {
        const parsedEvent = parseEventBlock(buffer);
        if (parsedEvent) {
          handleParsedEvent(parsedEvent);
        }
        buffer = '';
      }

      cleanupXhr();
      scheduleReconnect();
    };

    request.onabort = () => {
      cleanupXhr();
    };

    reconnectAttempts = 0;
    request.send();
  };

  void connect();

  return {
    close: () => {
      if (closed) return;
      closed = true;
      clearReconnectTimer();
      cleanupXhr();
    },
  };
}
