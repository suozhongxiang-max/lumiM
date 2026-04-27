import { useEffect, useRef } from 'react';

export const useAsyncController = () => {
  const controllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    // 组件卸载时取消所有进行中的请求
    return () => {
      if (controllerRef.current) {
        controllerRef.current.abort();
      }
    };
  }, []);

  const createController = () => {
    // 取消之前的请求
    if (controllerRef.current) {
      controllerRef.current.abort();
    }
    controllerRef.current = new AbortController();
    return controllerRef.current;
  };

  const abortCurrent = () => {
    if (controllerRef.current) {
      controllerRef.current.abort();
      controllerRef.current = null;
    }
  };

  return { createController, abortCurrent };
};
