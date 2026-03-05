// src/workers/useScoringWorker.ts
import { useCallback } from 'react';
import { useWorker } from './useWorker';
import type { ScoringWorkerRequest, ScoringWorkerResponse } from './scoringWorker';
import type { NoteDescriptor, PitchPoint, ScoringParams, ScoringResult } from '../utils/karaokeScoring';

/**
 * Hook that offloads karaoke scoring to a Web Worker.
 * Returns `computeScore(notes, points, params)` → Promise<ScoringResult>.
 */
export function useScoringWorker() {
  const invoke = useWorker<ScoringWorkerRequest, ScoringWorkerResponse>(
    useCallback(
      () => new Worker(new URL('./scoringWorker.ts', import.meta.url), { type: 'module' }),
      [],
    ),
  );

  const computeScore = useCallback(
    async (notes: NoteDescriptor[], points: PitchPoint[], params: ScoringParams): Promise<ScoringResult> => {
      const res = await invoke({ notes, points, params });
      return res.result;
    },
    [invoke],
  );

  return computeScore;
}
