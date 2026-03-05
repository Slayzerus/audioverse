import { getAudioContext, resumeAudioContext } from '../scripts/audioContext';

describe('audioContext helpers', () => {
  test('getAudioContext returns singleton and resumeAudioContext resumes when suspended', async () => {
    const resumeSpy = vi.fn(() => Promise.resolve());
    class MockAudioContext {
      state: string = 'suspended';
      resume = resumeSpy;
    }
    // @ts-ignore
    global.window = global.window || {};
    // @ts-ignore
    global.window.AudioContext = MockAudioContext;

    const a1 = getAudioContext();
    expect(a1).toBeInstanceOf(MockAudioContext as any);

    // calling again returns same instance
    const a2 = getAudioContext();
    expect(a1).toBe(a2);

    // resume should be called when suspended
    resumeAudioContext();
    // allow microtask queue
    await Promise.resolve();
    expect(resumeSpy).toHaveBeenCalled();
  });
});
