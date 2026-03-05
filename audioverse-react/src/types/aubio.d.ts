/**
 * Type declarations for the Aubio WASM module (aubiojs).
 *
 * Aubio is a C library compiled to WebAssembly via Emscripten.
 * These types cover the Emscripten module interface and the
 * pitch detector wrapper used in AudioPitchAnalyzer.
 *
 * When the Aubio CDN script loads, it attaches to the global
 * window as `window.Aubio`, `window.Module`, or `window.aubio`.
 */

/** Emscripten-based WASM module interface exposed by aubiojs */
export interface AubioWasmModule {
  /** Allocate bytes on the WASM heap; returns a pointer (byte offset) */
  _malloc(bytes: number): number;
  /** Free a previously allocated WASM heap pointer */
  _free(ptr: number): void;
  /** Float32 view of the WASM linear memory heap */
  HEAPF32: Float32Array;
  /**
   * Create a JS wrapper for a C function exported from the WASM module.
   * @param name   Exported C function name
   * @param returnType  'number' | 'string' | null
   * @param argTypes    Array of argument types
   */
  cwrap(
    name: string,
    returnType: 'number' | 'string' | null,
    argTypes: Array<'number' | 'string'>
  ): (...args: number[]) => number;
  /**
   * Call a C function exported from the WASM module directly.
   * @param name        Exported C function name
   * @param returnType  'number' | 'string' | null
   * @param argTypes    Array of argument types
   * @param args        Actual argument values
   */
  ccall(
    name: string,
    returnType: 'number' | 'string' | null,
    argTypes: Array<'number' | 'string'>,
    args: number[]
  ): number;
}

/** Aubio pitch detector instance (JS wrapper around aubio_pitch) */
export interface AubioPitchDetector {
  /** Run pitch detection on a buffer. Returns detected frequency in Hz. */
  do(input: Float32Array | number[] | number, length?: number, sampleRate?: number): number;
}

/** Augment the global Window to include possible Aubio global bindings */
declare global {
  interface Window {
    /** Aubio module attached by CDN script (uppercase) */
    Aubio?: AubioWasmModule;
    /** Emscripten Module global (common fallback) */
    Module?: AubioWasmModule;
    /** Aubio module attached by CDN script (lowercase) */
    aubio?: AubioWasmModule;
  }
}
