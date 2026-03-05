import { CoverArtRelease } from '../types/coverArt';
import { logger } from '../utils/logger';
const log = logger.scoped('coverArtApiClient');

const BASE = 'https://coverartarchive.org';
const MB_BASE = 'https://musicbrainz.org/ws/2';

export async function getRelease(mbid: string): Promise<CoverArtRelease | null> {
  const url = `${BASE}/release/${mbid}`;
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Cover Art API error: ${res.status} ${res.statusText}`);
  return (await res.json()) as CoverArtRelease;
}

/**
 * Search MusicBrainz for a release by artist + title.
 * Returns the first matching release MBID, or null.
 */
export async function searchReleaseByArtistTitle(
  artist: string,
  title: string
): Promise<string | null> {
  const query = `release:"${title}" AND artist:"${artist}"`;
  const url = `${MB_BASE}/release/?query=${encodeURIComponent(query)}&limit=1&fmt=json`;
  try {
    const res = await fetch(url, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'AudioVerse/1.0 (https://audioverse.app)',
      },
    });
    if (!res.ok) return null;
    const data = await res.json();
    const releases = data?.releases;
    if (releases && releases.length > 0) {
      return releases[0].id ?? null;
    }
  } catch (e) {
    log.warn('searchReleaseByArtistTitle error', e);
  }
  return null;
}

export async function fetchImageByUrl(url: string): Promise<Blob> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch image: ${res.status} ${res.statusText}`);
  return res.blob();
}

export default {
  getRelease,
  fetchImageByUrl,
  searchReleaseByArtistTitle,
};
