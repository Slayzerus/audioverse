import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import KaraokeUploader from '../components/controls/karaoke/KaraokeUploader';

const mockParseUltrastar = vi.fn(async (p: any) => ({ id: 's1', title: p.fileName, data: p.data }));

vi.mock('../scripts/api/apiKaraoke', () => ({
  parseUltrastar: (...a: any[]) => mockParseUltrastar(...a),
}));

describe('KaraokeUploader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockParseUltrastar.mockImplementation(async (p: any) => ({ id: 's1', title: p.fileName, data: p.data }));
    // mock FileReader to synchronously call onload with text
    class MockReader {
      onload: any = null;
      readAsText(file: File) {
        // simulate async load
        setTimeout(() => {
          this.onload && this.onload({ target: { result: 'fake ultrastar content' } });
        }, 0);
      }
    }
    // @ts-ignore
    global.FileReader = MockReader;
  });

  test('uploads file via file input and calls onSongUpload', async () => {
    const onSongUpload = vi.fn();
    const { container } = render(<KaraokeUploader onSongUpload={onSongUpload} />);

    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['abc'], 'song.txt', { type: 'text/plain' });

    // fire change event
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => expect(onSongUpload).toHaveBeenCalled());
    const calledWith = (onSongUpload as any).mock.calls[0][0];
    expect(calledWith.title).toBe('song.txt');
  });

  test('renders upload area with instructions', () => {
    const { container } = render(<KaraokeUploader onSongUpload={() => {}} />);
    expect(container.textContent).toContain('Click or drag & drop');
  });

  test('triggers file input on click', () => {
    const { container } = render(<KaraokeUploader onSongUpload={() => {}} />);
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    const clickSpy = vi.spyOn(fileInput, 'click');
    fireEvent.click(container.querySelector('.karaoke-uploader')!);
    expect(clickSpy).toHaveBeenCalled();
  });

  test('shows Change Song button after successful upload', async () => {
    const { container } = render(<KaraokeUploader onSongUpload={() => {}} />);
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [new File(['x'], 'a.txt')] } });
    await waitFor(() => expect(container.textContent).toContain('Change Song'));
  });

  test('Change Song button resets to upload area', async () => {
    const { container } = render(<KaraokeUploader onSongUpload={() => {}} />);
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [new File(['x'], 'a.txt')] } });
    await waitFor(() => expect(container.textContent).toContain('Change Song'));
    const btn = Array.from(container.querySelectorAll('button')).find(b => b.textContent?.includes('Change Song'))!;
    fireEvent.click(btn);
    await waitFor(() => expect(container.textContent).toContain('Click or drag & drop'));
  });

  test('handles parseUltrastar error without calling onSongUpload', async () => {
    mockParseUltrastar.mockRejectedValue(new Error('Parse fail'));
    const onSongUpload = vi.fn();
    const { container } = render(<KaraokeUploader onSongUpload={onSongUpload} />);
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [new File(['bad'], 'bad.txt')] } });
    await waitFor(() => expect(mockParseUltrastar).toHaveBeenCalled());
    expect(onSongUpload).not.toHaveBeenCalled();
    expect(container.textContent).toContain('Click or drag & drop');
  });

  test('handles drag and drop', async () => {
    const onSongUpload = vi.fn();
    const { container } = render(<KaraokeUploader onSongUpload={onSongUpload} />);
    const dropZone = container.querySelector('.karaoke-uploader')!;
    const file = new File(['content'], 'drop.txt', { type: 'text/plain' });
    fireEvent.drop(dropZone, { dataTransfer: { files: [file] } });
    await waitFor(() => expect(onSongUpload).toHaveBeenCalled());
  });

  test('dragOver prevents default', () => {
    const { container } = render(<KaraokeUploader onSongUpload={() => {}} />);
    const dropZone = container.querySelector('.karaoke-uploader')!;
    const event = new Event('dragover', { bubbles: true, cancelable: true });
    dropZone.dispatchEvent(event);
  });

  test('sends base64-encoded content to parseUltrastar', async () => {
    const { container } = render(<KaraokeUploader onSongUpload={() => {}} />);
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [new File(['hello'], 'test.txt')] } });
    await waitFor(() => expect(mockParseUltrastar).toHaveBeenCalled());
    const callArg = mockParseUltrastar.mock.calls[0][0];
    expect(callArg.fileName).toBe('test.txt');
    expect(typeof callArg.data).toBe('string');
    // data should be base64
    expect(callArg.data.length).toBeGreaterThan(0);
  });
});
