import { vi, describe, it, expect } from 'vitest';
import {
  MIME,
  toFormDataImage,
  toFormDataVideo,
} from '../models/modelsAiVideo';

describe('modelsAiVideo', () => {
  it('MIME constants are correct', () => {
    expect(MIME.imageJpeg).toBe('image/jpeg');
    expect(MIME.imagePng).toBe('image/png');
    expect(MIME.videoMp4).toBe('video/mp4');
    expect(MIME.json).toBe('application/json');
  });

  it('toFormDataImage creates FormData with file', () => {
    const file = new File(['px'], 'img.jpg', { type: 'image/jpeg' });
    const fd = toFormDataImage(file);
    expect(fd).toBeInstanceOf(FormData);
    expect(fd.get('file')).toBeInstanceOf(File);
  });

  it('toFormDataVideo creates FormData with file', () => {
    const file = new File(['vid'], 'clip.mp4', { type: 'video/mp4' });
    const fd = toFormDataVideo(file);
    expect(fd).toBeInstanceOf(FormData);
    expect(fd.get('file')).toBeInstanceOf(File);
  });
});
