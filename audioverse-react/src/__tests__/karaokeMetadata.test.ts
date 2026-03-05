import { describe, it, expect } from 'vitest';
import { parseVideoMetadata, getCoverUrl, getBackgroundUrl, type VideoMetadata } from '../utils/karaokeMetadata';

describe('parseVideoMetadata', () => {
  it('returns empty object for null/undefined/empty', () => {
    expect(parseVideoMetadata(null)).toEqual({});
    expect(parseVideoMetadata(undefined)).toEqual({});
    expect(parseVideoMetadata('')).toEqual({});
  });

  it('parses all three fields', () => {
    const res = parseVideoMetadata('v=l9ml3nyww80,co=cruel-summer.jpg,bg=bananarama.jpg');
    expect(res).toEqual({
      youtubeId: 'l9ml3nyww80',
      coverImage: 'cruel-summer.jpg',
      backgroundImage: 'bananarama.jpg',
    });
  });

  it('parses partial fields', () => {
    expect(parseVideoMetadata('v=abc')).toEqual({ youtubeId: 'abc' });
    expect(parseVideoMetadata('co=img.png')).toEqual({ coverImage: 'img.png' });
    expect(parseVideoMetadata('bg=wall.jpg')).toEqual({ backgroundImage: 'wall.jpg' });
  });

  it('handles whitespace between parts', () => {
    const res = parseVideoMetadata('v=x , co=y , bg=z');
    expect(res).toEqual({ youtubeId: 'x', coverImage: 'y', backgroundImage: 'z' });
  });

  it('ignores unknown keys', () => {
    const res = parseVideoMetadata('v=a,unknown=b,co=c');
    expect(res).toEqual({ youtubeId: 'a', coverImage: 'c' });
  });
});

describe('getCoverUrl', () => {
  it('returns full external URL directly', () => {
    const m: VideoMetadata = { coverImage: 'https://cdn.example.com/img.jpg' };
    expect(getCoverUrl(m)).toBe('https://cdn.example.com/img.jpg');
  });

  it('returns http URL directly', () => {
    const m: VideoMetadata = { coverImage: 'http://cdn.example.com/img.jpg' };
    expect(getCoverUrl(m)).toBe('http://cdn.example.com/img.jpg');
  });

  it('prefers full URL over youtubeId', () => {
    const m: VideoMetadata = { coverImage: 'https://cdn.example.com/a.jpg', youtubeId: 'yt1' };
    expect(getCoverUrl(m)).toBe('https://cdn.example.com/a.jpg');
  });

  it('returns YouTube thumbnail when youtubeId present and no full URL cover', () => {
    const m: VideoMetadata = { youtubeId: 'abc123' };
    expect(getCoverUrl(m)).toBe('https://img.youtube.com/vi/abc123/hqdefault.jpg');
  });

  it('prefers YouTube thumbnail over relative cover filename', () => {
    const m: VideoMetadata = { youtubeId: 'y', coverImage: 'local.jpg' };
    expect(getCoverUrl(m)).toBe('https://img.youtube.com/vi/y/hqdefault.jpg');
  });

  it('returns API URL for relative cover filename when no youtubeId', () => {
    const m: VideoMetadata = { coverImage: 'local.jpg' };
    expect(getCoverUrl(m)).toBe('/api/karaoke/cover?filePath=local.jpg');
  });

  it('uses custom baseUrl', () => {
    const m: VideoMetadata = { coverImage: 'x.png' };
    expect(getCoverUrl(m, '/custom')).toBe('/custom?filePath=x.png');
  });

  it('returns SVG placeholder when nothing provided', () => {
    const url = getCoverUrl({});
    expect(url).toContain('data:image/svg+xml');
    expect(url).toContain('No Cover');
  });
});

describe('getBackgroundUrl', () => {
  it('returns background URL when present', () => {
    const m: VideoMetadata = { backgroundImage: 'bg.jpg' };
    expect(getBackgroundUrl(m)).toBe('/backgrounds/bg.jpg');
  });

  it('uses custom baseUrl', () => {
    const m: VideoMetadata = { backgroundImage: 'wall.png' };
    expect(getBackgroundUrl(m, '/static')).toBe('/static/wall.png');
  });

  it('returns empty string when no background', () => {
    expect(getBackgroundUrl({})).toBe('');
  });
});
