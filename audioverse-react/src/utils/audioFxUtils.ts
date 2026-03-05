// FX utility functions extracted from AudioEditor
import { EffectType, EffectSlot, LayerSettings } from '../models/editor/audioTypes';

export function addEffectToLayer(
  setLayerSettings: React.Dispatch<React.SetStateAction<Record<number, LayerSettings>>>,
  layerId: number,
  effectType: EffectType
) {
  const effectId = `${layerId}-${effectType}-${Date.now()}`;
  const defaultParams: Record<EffectType, Record<string, number>> = {
    'eq3': { lowGain: 0, midGain: 0, highGain: 0, lowFreq: 250, highFreq: 4000 },
    'compressor': { threshold: -24, ratio: 4, attack: 0.003, release: 0.25, knee: 30 },
    'delay': { time: 0.25, feedback: 0.3, mix: 0.3 },
    'reverb': { decay: 2.0, mix: 0.3 },
    'distortion': { amount: 20, mix: 0.5 }
  };
  const newEffect: EffectSlot = {
    id: effectId,
    type: effectType,
    bypass: false,
    params: defaultParams[effectType]
  };
  setLayerSettings(prev => ({
    ...prev,
    [layerId]: {
      ...prev[layerId],
      effectChain: [...(prev[layerId]?.effectChain || []), newEffect]
    }
  }));
}

export function removeEffectFromLayer(
  setLayerSettings: React.Dispatch<React.SetStateAction<Record<number, LayerSettings>>>,
  layerId: number,
  effectId: string
) {
  setLayerSettings(prev => ({
    ...prev,
    [layerId]: {
      ...prev[layerId],
      effectChain: prev[layerId]?.effectChain?.filter((e: EffectSlot) => e.id !== effectId) || []
    }
  }));
}

export function toggleEffectBypass(
  setLayerSettings: React.Dispatch<React.SetStateAction<Record<number, LayerSettings>>>,
  layerId: number,
  effectId: string
) {
  setLayerSettings(prev => ({
    ...prev,
    [layerId]: {
      ...prev[layerId],
      effectChain: prev[layerId]?.effectChain?.map((e: EffectSlot) =>
        e.id === effectId ? { ...e, bypass: !e.bypass } : e
      ) || []
    }
  }));
}

export function updateEffectParams(
  setLayerSettings: React.Dispatch<React.SetStateAction<Record<number, LayerSettings>>>,
  layerId: number,
  effectId: string,
  params: Record<string, number>
) {
  setLayerSettings(prev => ({
    ...prev,
    [layerId]: {
      ...prev[layerId],
      effectChain: prev[layerId]?.effectChain?.map((e: EffectSlot) =>
        e.id === effectId ? { ...e, params: { ...e.params, ...params } } : e
      ) || []
    }
  }));
}
