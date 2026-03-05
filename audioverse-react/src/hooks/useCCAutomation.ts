// ─── useCCAutomation ───────────────────────────────────────────────────────────
// React hook combining CC lane editing, undo/redo, clipboard, and recording.

import { useCallback, useReducer, useRef } from 'react';
import { MidiCCEvent } from '../models/editor/midiTypes';
import {
  CCHistoryState,
  CCLaneSnapshot,
  createCCHistory,
  pushCCState,
  undoCC,
  redoCC,
  canUndo,
  canRedo,
  copyCCEvents,
  pasteCCEvents,
  cutCCEvents,
  deleteCCEventsInRange,
  recordCCEvent,
  thinCCEvents,
  exportCCLane,
  importCCLane,
  CCTimeRange,
} from '../utils/ccAutomation';

// ─── Reducer ────────────────────────────────────────────────────────────────────

type Action =
  | { type: 'ADD_EVENT'; layerId: number; event: MidiCCEvent }
  | { type: 'UPDATE_EVENT'; layerId: number; id: number; value: number; time: number; handleType?: 'linear' | 'step' | 'exp' }
  | { type: 'REMOVE_EVENT'; layerId: number; id: number }
  | { type: 'SET_EVENTS'; layerId: number; events: MidiCCEvent[] }
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'PASTE'; layerId: number; clipboard: MidiCCEvent[]; targetTime: number }
  | { type: 'CUT'; layerId: number; range: CCTimeRange }
  | { type: 'DELETE_RANGE'; layerId: number; range: CCTimeRange }
  | { type: 'RECORD'; layerId: number; cc: number; value: number; time: number }
  | { type: 'THIN'; layerId: number; keepEveryN?: number }
  | { type: 'IMPORT'; layerId: number; json: string };

function getLayerEvents(snapshots: CCLaneSnapshot[], layerId: number): MidiCCEvent[] {
  return snapshots.find((s) => s.layerId === layerId)?.events ?? [];
}

function setLayerEvents(
  snapshots: CCLaneSnapshot[],
  layerId: number,
  events: MidiCCEvent[],
): CCLaneSnapshot[] {
  const existing = snapshots.find((s) => s.layerId === layerId);
  if (existing) {
    return snapshots.map((s) => (s.layerId === layerId ? { ...s, events } : s));
  }
  return [...snapshots, { layerId, events }];
}

function reducer(state: CCHistoryState, action: Action): CCHistoryState {
  switch (action.type) {
    case 'UNDO':
      return undoCC(state);
    case 'REDO':
      return redoCC(state);
    default: {
      // All other actions mutate present and push to history
      let next = state.present;

      switch (action.type) {
        case 'ADD_EVENT': {
          const events = [...getLayerEvents(next, action.layerId), action.event];
          next = setLayerEvents(next, action.layerId, events);
          break;
        }
        case 'UPDATE_EVENT': {
          const events = getLayerEvents(next, action.layerId).map((e) =>
            e.id === action.id
              ? { ...e, value: action.value, time: action.time, handleType: action.handleType ?? e.handleType }
              : e,
          );
          next = setLayerEvents(next, action.layerId, events);
          break;
        }
        case 'REMOVE_EVENT': {
          const events = getLayerEvents(next, action.layerId).filter((e) => e.id !== action.id);
          next = setLayerEvents(next, action.layerId, events);
          break;
        }
        case 'SET_EVENTS':
          next = setLayerEvents(next, action.layerId, action.events);
          break;
        case 'PASTE': {
          const existing = getLayerEvents(next, action.layerId);
          const merged = pasteCCEvents(existing, action.clipboard, action.targetTime);
          next = setLayerEvents(next, action.layerId, merged);
          break;
        }
        case 'CUT': {
          const existing = getLayerEvents(next, action.layerId);
          const { remaining } = cutCCEvents(existing, action.range);
          next = setLayerEvents(next, action.layerId, remaining);
          break;
        }
        case 'DELETE_RANGE': {
          const existing = getLayerEvents(next, action.layerId);
          const filtered = deleteCCEventsInRange(existing, action.range);
          next = setLayerEvents(next, action.layerId, filtered);
          break;
        }
        case 'RECORD': {
          const existing = getLayerEvents(next, action.layerId);
          const recorded = recordCCEvent(existing, action.cc, action.value, action.time);
          next = setLayerEvents(next, action.layerId, recorded);
          break;
        }
        case 'THIN': {
          const existing = getLayerEvents(next, action.layerId);
          const thinned = thinCCEvents(existing, action.keepEveryN);
          next = setLayerEvents(next, action.layerId, thinned);
          break;
        }
        case 'IMPORT': {
          const imported = importCCLane(action.json);
          if (imported.length > 0) {
            next = setLayerEvents(next, action.layerId, imported);
          }
          break;
        }
      }

      return pushCCState(state, next);
    }
  }
}

// ─── Hook ───────────────────────────────────────────────────────────────────────

export interface UseCCAutomation {
  /** Current snapshot of all CC lane events */
  snapshots: CCLaneSnapshot[];
  /** Get events for a specific layer */
  getEvents: (layerId: number) => MidiCCEvent[];
  /** Add a CC event */
  addEvent: (layerId: number, event: MidiCCEvent) => void;
  /** Update a CC event */
  updateEvent: (layerId: number, id: number, value: number, time: number, handleType?: 'linear' | 'step' | 'exp') => void;
  /** Remove a CC event */
  removeEvent: (layerId: number, id: number) => void;
  /** Set all events for a layer */
  setEvents: (layerId: number, events: MidiCCEvent[]) => void;
  /** Undo / Redo */
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  /** Clipboard */
  copy: (layerId: number, range: CCTimeRange) => void;
  cut: (layerId: number, range: CCTimeRange) => void;
  paste: (layerId: number, targetTime: number) => void;
  clipboard: MidiCCEvent[];
  /** Delete range */
  deleteRange: (layerId: number, range: CCTimeRange) => void;
  /** Recording */
  record: (layerId: number, cc: number, value: number, time: number) => void;
  thin: (layerId: number, keepEveryN?: number) => void;
  /** Export / Import */
  exportLane: (layerId: number) => string;
  importLane: (layerId: number, json: string) => void;
}

export function useCCAutomation(initialSnapshots: CCLaneSnapshot[] = []): UseCCAutomation {
  const [state, dispatch] = useReducer(reducer, createCCHistory(initialSnapshots));
  const clipboardRef = useRef<MidiCCEvent[]>([]);

  const getEvents = useCallback(
    (layerId: number) => getLayerEvents(state.present, layerId),
    [state.present],
  );

  const addEvent = useCallback(
    (layerId: number, event: MidiCCEvent) => dispatch({ type: 'ADD_EVENT', layerId, event }),
    [],
  );

  const updateEvent = useCallback(
    (layerId: number, id: number, value: number, time: number, handleType?: 'linear' | 'step' | 'exp') =>
      dispatch({ type: 'UPDATE_EVENT', layerId, id, value, time, handleType }),
    [],
  );

  const removeEvent = useCallback(
    (layerId: number, id: number) => dispatch({ type: 'REMOVE_EVENT', layerId, id }),
    [],
  );

  const setEvents = useCallback(
    (layerId: number, events: MidiCCEvent[]) => dispatch({ type: 'SET_EVENTS', layerId, events }),
    [],
  );

  const undo = useCallback(() => dispatch({ type: 'UNDO' }), []);
  const redo = useCallback(() => dispatch({ type: 'REDO' }), []);

  const copy = useCallback(
    (layerId: number, range: CCTimeRange) => {
      clipboardRef.current = copyCCEvents(getLayerEvents(state.present, layerId), range);
    },
    [state.present],
  );

  const cut = useCallback(
    (layerId: number, range: CCTimeRange) => {
      clipboardRef.current = copyCCEvents(getLayerEvents(state.present, layerId), range);
      dispatch({ type: 'CUT', layerId, range });
    },
    [state.present],
  );

  const paste = useCallback(
    (layerId: number, targetTime: number) => {
      if (clipboardRef.current.length > 0) {
        dispatch({ type: 'PASTE', layerId, clipboard: clipboardRef.current, targetTime });
      }
    },
    [],
  );

  const deleteRange = useCallback(
    (layerId: number, range: CCTimeRange) => dispatch({ type: 'DELETE_RANGE', layerId, range }),
    [],
  );

  const record = useCallback(
    (layerId: number, cc: number, value: number, time: number) =>
      dispatch({ type: 'RECORD', layerId, cc, value, time }),
    [],
  );

  const thin = useCallback(
    (layerId: number, keepEveryN?: number) => dispatch({ type: 'THIN', layerId, keepEveryN }),
    [],
  );

  const exportLane = useCallback(
    (layerId: number) => exportCCLane(getLayerEvents(state.present, layerId)),
    [state.present],
  );

  const importLane = useCallback(
    (layerId: number, json: string) => dispatch({ type: 'IMPORT', layerId, json }),
    [],
  );

  return {
    snapshots: state.present,
    getEvents,
    addEvent,
    updateEvent,
    removeEvent,
    setEvents,
    undo,
    redo,
    canUndo: canUndo(state),
    canRedo: canRedo(state),
    copy,
    cut,
    paste,
    clipboard: clipboardRef.current,
    deleteRange,
    record,
    thin,
    exportLane,
    importLane,
  };
}
