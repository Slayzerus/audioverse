// Utility functions for the audio editor

// Tworzy unikalny identyfikator dla zaznaczenia klipu
export function makeClipSelectionId(layerId: number, clipId: number | string) {
  return `${layerId}:${clipId}`;
}
