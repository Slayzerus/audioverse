// src/workers/useWorker.ts
import { useRef, useEffect, useCallback } from 'react';

type PendingResolve<R> = (value: R) => void;

/**
 * Generic hook that wraps a Web Worker in a promise-based API.
 * - Lazily creates the worker on first call
 * - Auto-terminates on unmount
 * - Returns an `invoke(data)` function that returns a promise
 */
export function useWorker<Req extends { id: number }, Res extends { id: number }>(
  factory: () => Worker,
) {
  const workerRef = useRef<Worker | null>(null);
  const pendingRef = useRef(new Map<number, PendingResolve<Res>>());
  const nextIdRef = useRef(1);

  const getWorker = useCallback(() => {
    if (!workerRef.current) {
      const w = factory();
      w.onmessage = (e: MessageEvent<Res>) => {
        const { id } = e.data;
        const resolve = pendingRef.current.get(id);
        if (resolve) {
          pendingRef.current.delete(id);
          resolve(e.data);
        }
      };
      workerRef.current = w;
    }
    return workerRef.current;
  }, [factory]);

  useEffect(() => {
    return () => {
      workerRef.current?.terminate();
      workerRef.current = null;
      pendingRef.current.clear();
    };
  }, []);

  const invoke = useCallback(
    (data: Omit<Req, 'id'>, transferables?: Transferable[]): Promise<Res> => {
      const id = nextIdRef.current++;
      const w = getWorker();
      return new Promise<Res>((resolve) => {
        pendingRef.current.set(id, resolve);
        w.postMessage({ ...data, id } as Req, transferables ?? []);
      });
    },
    [getWorker],
  );

  return invoke;
}
