import { useState, useCallback, useRef } from 'react';
import { AsyncState, UIStatus } from './types';

export interface UseAsyncStateOptions<T> {
  initialData?: T | null;
  initialStatus?: UIStatus;
  checkIsEmpty?: (data: T | null) => boolean;
}

export function useAsyncState<T>(
  asyncFn: () => Promise<T>,
  options: UseAsyncStateOptions<T> = {}
) {
  const {
    initialData = null,
    initialStatus = 'idle',
    checkIsEmpty = (d) => d === null || (Array.isArray(d) && d.length === 0),
  } = options;

  const [state, setState] = useState<AsyncState<T>>({
    status: initialStatus,
    data: initialData,
    error: null,
    isLoading: initialStatus === 'loading',
    isEmpty: checkIsEmpty(initialData),
    isError: initialStatus === 'error',
    isSuccess: initialStatus === 'success',
    isOffline: initialStatus === 'offline',
  });

  const activeCallId = useRef<number>(0);

  const execute = useCallback(async () => {
    const callId = ++activeCallId.current;

    setState((prev) => ({
      ...prev,
      status: 'loading',
      isLoading: true,
      error: null,
    }));

    try {
      const result = await asyncFn();

      if (callId !== activeCallId.current) return;

      const empty = checkIsEmpty(result);
      setState({
        status: empty ? 'empty' : 'success',
        data: result,
        error: null,
        isLoading: false,
        isEmpty: empty,
        isError: false,
        isSuccess: !empty,
        isOffline: false,
      });
      return result;
    } catch (err) {
      if (callId !== activeCallId.current) return;

      const isNetworkError =
        err instanceof Error &&
        (err.message.includes('Network') || err.message.includes('offline'));

      setState({
        status: isNetworkError ? 'offline' : 'error',
        data: null,
        error: err instanceof Error ? err : String(err),
        isLoading: false,
        isEmpty: false,
        isError: !isNetworkError,
        isSuccess: false,
        isOffline: isNetworkError,
      });
    }
  }, [asyncFn, checkIsEmpty]);

  const reset = useCallback(() => {
    activeCallId.current++;
    setState({
      status: 'idle',
      data: initialData,
      error: null,
      isLoading: false,
      isEmpty: checkIsEmpty(initialData),
      isError: false,
      isSuccess: false,
      isOffline: false,
    });
  }, [initialData, checkIsEmpty]);

  return {
    ...state,
    execute,
    retry: execute,
    reset,
  };
}
