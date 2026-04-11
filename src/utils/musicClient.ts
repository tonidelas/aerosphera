/**
 * Music API Client
 * Using iTunes Search API (CORS-enabled) as the primary source for reliability.
 */

export interface MusicTrack {
  id: string;
  title: string;
  artist: { name: string };
  album: { cover: string };
  preview?: string;
  source: 'itunes' | 'deezer';
}

// Keep export for backward compatibility
export type DeezerTrack = MusicTrack;

/**
 * Search for tracks using iTunes Search API (CORS-friendly)
 * @param query The search query
 * @param limit Number of results to return (default 20)
 * @returns Array of tracks
 */
export async function searchMusicTracks(query: string, limit: number = 20): Promise<MusicTrack[]> {
  try {
    const url = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=song&limit=${limit}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch from iTunes');
    
    const data = await res.json();
    if (!data.results) return [];

    return data.results.map((item: any) => ({
      id: item.trackId.toString(),
      title: item.trackName,
      artist: { name: item.artistName },
      album: { 
        cover: item.artworkUrl100.replace('100x100bb', '600x600bb') 
      },
      preview: item.previewUrl,
      source: 'itunes'
    }));
  } catch (error) {
    console.error('Error searching iTunes:', error);
    // Fallback or just return empty
    return [];
  }
}

/**
 * Backward compatibility: redirect searchDeezerTracks to searchMusicTracks
 */
export async function searchDeezerTracks(query: string, limit: number = 20): Promise<MusicTrack[]> {
  return searchMusicTracks(query, limit);
}