// Importing this module registers the jest-dom matchers with the test runner's
// `expect` via its side effects. This is the recommended pattern for Vitest.
import '@testing-library/jest-dom';

// Global shims for jsdom environment used by Vitest
// Always provide a working localStorage implementation (jsdom's may be broken)
{
	const store: Record<string, string> = {};
	(globalThis as any).localStorage = {
		getItem: (k: string) => (k in store ? store[k] : null),
		setItem: (k: string, v: string) => { store[k] = String(v); },
		removeItem: (k: string) => { delete store[k]; },
		clear: () => { Object.keys(store).forEach(k => delete store[k]); },
		get length() { return Object.keys(store).length; },
		key: (i: number) => Object.keys(store)[i] ?? null,
	} as Storage;
}

// Minimal AudioContext shim
if (typeof (globalThis as any).AudioContext === 'undefined') {
	class DummyAudioContext {
		state = 'suspended';
		resume = async () => { this.state = 'running'; };
		close = async () => { this.state = 'closed'; };
	}
	(globalThis as any).AudioContext = DummyAudioContext;
}

// Stub navigator.mediaDevices.getUserMedia
if (typeof (globalThis as any).navigator === 'undefined') (globalThis as any).navigator = {};
if (!((globalThis as any).navigator.mediaDevices?.getUserMedia)) {
	(globalThis as any).navigator.mediaDevices = (globalThis as any).navigator.mediaDevices || {};
	(globalThis as any).navigator.mediaDevices.getUserMedia = async () => ({ /* fake MediaStream placeholder */ });
}

// Stub HTMLMediaElement.load to avoid not-implemented errors
if (typeof HTMLMediaElement !== 'undefined' && !(HTMLMediaElement.prototype as any).load) {
	// @ts-ignore
	HTMLMediaElement.prototype.load = function () { /* no-op for tests */ };
}

// Provide a forgiving CanvasRenderingContext2D stub for tests that call drawing APIs
if (typeof HTMLCanvasElement !== 'undefined' && !(HTMLCanvasElement.prototype as any).getContext) {
	// @ts-ignore
	HTMLCanvasElement.prototype.getContext = function () {
		const ctx: any = {
			fillText: () => {},
			measureText: () => ({ width: 0 }),
			createLinearGradient: () => ({ addColorStop: () => {} }),
			createRadialGradient: () => ({ addColorStop: () => {} }),
			createPattern: () => ({}),
			drawImage: () => {},
			beginPath: () => {},
			closePath: () => {},
			rect: () => {},
			fill: () => {},
			stroke: () => {},
			translate: () => {},
			scale: () => {},
			save: () => {},
			restore: () => {},
			arc: () => {},
			moveTo: () => {},
			lineTo: () => {},
			quadraticCurveTo: () => {},
			clip: () => {},
			clearRect: () => {},
			fillRect: () => {},
		};
		return ctx;
	};
}

// Minimal FileReader stub to avoid errors when not mocked explicitly in tests
if (typeof (globalThis as any).FileReader === 'undefined') {
	class DummyFileReader {
		onload: ((ev: any) => void) | null = null;
		readAsText(_f: any) { if (this.onload) this.onload({ target: { result: '' } }); }
	}
	(globalThis as any).FileReader = DummyFileReader;
}
