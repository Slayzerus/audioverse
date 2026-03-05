import api from './coverArtApiClient';
import { CoverArtImage } from '../types/coverArt';
import { logger } from '../utils/logger';

const log = logger.scoped('CoverArtService');

function pickBestImage(images: CoverArtImage[] | undefined): string | null {
  if (!images || images.length === 0) return null;
  // Prefer explicit front image
  const front = images.find((i) => i.front === true);
  const candidate = front || images[0];
  // Prefer large thumbnail, then small, then full image URL
  return (
    candidate.thumbnails?.large ||
    candidate.thumbnails?.small ||
    candidate.image ||
    null
  );
}

export async function getFrontImageUrlForRelease(mbid: string): Promise<string | null> {
  const release = await api.getRelease(mbid);
  if (!release) return null;
  return pickBestImage(release.images);
}

/**
 * Search MusicBrainz by artist + title, then get cover from Cover Art Archive.
 * Returns the cover image URL or null.
 */
export async function searchAndGetCover(artist: string, title: string): Promise<string | null> {
  const mbid = await api.searchReleaseByArtistTitle(artist, title);
  if (!mbid) {
    log.debug(`MusicBrainz search: no release found for "${artist}" - "${title}"`);
    return null;
  }
  log.debug(`MusicBrainz search: found release ${mbid} for "${artist}" - "${title}"`);
  return getFrontImageUrlForRelease(mbid);
}

export async function downloadCoverForRelease(mbid: string): Promise<Blob | null> {
  const url = await getFrontImageUrlForRelease(mbid);
  if (!url) return null;
  return api.fetchImageByUrl(url);
}

export async function fetchMissingCovers(
  releaseIds: string[],
  existsFn?: (id: string) => boolean | Promise<boolean>,
): Promise<Record<string, Blob | null>> {
  const results: Record<string, Blob | null> = {};
  for (const id of releaseIds) {
    try {
      const exists = existsFn ? await existsFn(id) : false;
      if (exists) {
        results[id] = null;
        continue;
      }
      const blob = await downloadCoverForRelease(id);
      results[id] = blob;
    } catch (err) {
      log.warn('Error fetching cover for', id, err);
      results[id] = null;
    }
  }
  return results;
}

export async function blobToDataUrl(blob: Blob | null): Promise<string | null> {
  if (!blob) return null;
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = (e) => reject(e);
    reader.readAsDataURL(blob);
  });
}

export default {
  getFrontImageUrlForRelease,
  downloadCoverForRelease,
  fetchMissingCovers,
  blobToDataUrl,
};
