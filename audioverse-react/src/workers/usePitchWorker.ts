// src/workers/usePitchWorker.ts
import { useCallback } from 'react';
import { useWorker } from './useWorker';
import type { PitchWorkerRequest, PitchWorkerResponse } from './pitchWorker';

/**
 * Hook that offloads autoCorrelate pitch detection to a Web Worker.
 * Returns `detectPitch(buffer, sampleRate, rmsThreshold)` → Promise<number>.
 * Falls back to main-thread computation if Worker is unavailable.
 */
export function usePitchWorker() {
  const invoke = useWorker<PitchWorkerRequest, PitchWorkerResponse>(
    useCallback(
      () => new Worker(new URL('./pitchWorker.ts', import.meta.url), { type: 'module' }),
      [],
    ),
  );

  const detectPitch = useCallback(
    async (buffer: Float32Array, sampleRate: number, rmsThreshold: number = 0.01): Promise<number> => {
      const res = await invoke({ buffer, sampleRate, rmsThreshold });
      return res.hz;
    },
    [invoke],
  );

  return detectPitch;
}
