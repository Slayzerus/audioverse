/**
 * Parsuje metadata z formatu: v=youtubeId,co=cover.jpg,bg=background.jpg
 * Używane w tagach VIDEO w plikach karaoke.
 * 
 * @example
 * parseVideoMetadata("v=l9ml3nyww80,co=cruel-summer.jpg,bg=bananarama.jpg")
 * // returns { youtubeId: "l9ml3nyww80", coverImage: "cruel-summer.jpg", backgroundImage: "bananarama.jpg" }
 */
export interface VideoMetadata {
    youtubeId?: string;
    coverImage?: string;
    backgroundImage?: string;
}

export function parseVideoMetadata(metadata: string | null | undefined): VideoMetadata {
    const result: VideoMetadata = {};
    
    if (!metadata) return result;
    
    // Format: v=xxx,co=yyy,bg=zzz
    const parts = metadata.split(',');
    
    for (const part of parts) {
        const trimmed = part.trim();
        if (trimmed.startsWith('v=')) {
            result.youtubeId = trimmed.substring(2);
        } else if (trimmed.startsWith('co=')) {
            result.coverImage = trimmed.substring(3);
        } else if (trimmed.startsWith('bg=')) {
            result.backgroundImage = trimmed.substring(3);
        }
    }
    
    return result;
}

/**
 * Konstruuje URL do okładki na podstawie metadanych.
 * Jeśli coverImage jest pełnym URL-em (http/https), zwraca go bezpośrednio.
 * Jeśli jest relatywną nazwą pliku, buduje URL przez backend API.
 * Jeśli jest youtubeId, zwraca URL do thumbnail YouTube.
 * W przeciwnym razie zwraca placeholder.
 */
export function getCoverUrl(metadata: VideoMetadata, baseUrl = '/api/karaoke/cover'): string {
    const isFullUrl = metadata.coverImage?.startsWith('http://') || metadata.coverImage?.startsWith('https://');

    // Full external URL cover — use directly (always reliable)
    if (metadata.coverImage && isFullUrl) {
        return metadata.coverImage;
    }

    // YouTube thumbnail — reliable, prefer over unreliable relative filenames
    if (metadata.youtubeId) {
        return `https://img.youtube.com/vi/${metadata.youtubeId}/hqdefault.jpg`;
    }
    
    // Relative cover filename — last resort, often broken
    if (metadata.coverImage) {
        return `${baseUrl}?filePath=${encodeURIComponent(metadata.coverImage)}`;
    }
    
    return "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='320' height='180'%3E%3Crect width='320' height='180' fill='%23333'/%3E%3Ctext x='160' y='95' text-anchor='middle' fill='%23999' font-size='16'%3ENo Cover%3C/text%3E%3C/svg%3E";
}

/**
 * Konstruuje URL do tła na podstawie metadanych.
 */
export function getBackgroundUrl(metadata: VideoMetadata, baseUrl = '/backgrounds'): string {
    if (metadata.backgroundImage) {
        return `${baseUrl}/${metadata.backgroundImage}`;
    }
    
    return '';
}
