// Utility for searching tracks using the Unofficial Free Music API
// API Docs: https://github.com/mohd-baquir-qureshi/music-api

export interface MusicApiTrack {
  id: string;
  title: string;
  img: string;
  // Optionally, you can add more fields if needed
}

// Available search engines: gaama, seevn, hunjama, mtmusic, wunk
const DEFAULT_ENGINE = 'gaama';
const BASE_URL = 'https://musicapi.x007.workers.dev';

/**
 * Search for tracks using the Unofficial Free Music API
 * @param query The search query (song name or artist)
 * @param searchEngine The music search engine to use (default: gaama)
 * @returns Array of tracks
 */
export async function searchMusicApiTracks(query: string, searchEngine: string = DEFAULT_ENGINE): Promise<MusicApiTrack[]> {
  try {
    const url = `${BASE_URL}/search?q=${encodeURIComponent(query)}&searchEngine=${encodeURIComponent(searchEngine)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch tracks');
    const data = await res.json();
    if (data.status !== 200 || !Array.isArray(data.response)) return [];
    return data.response;
  } catch (error) {
    console.error('Error searching Music API:', error);
    return [];
  }
}

/**
 * Fetch a song's stream URL by ID
 * @param id The song ID
 * @returns The stream URL (mp3 or m3u8)
 */
export async function fetchMusicApiSongUrl(id: string): Promise<string | null> {
  try {
    const url = `${BASE_URL}/fetch?id=${encodeURIComponent(id)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch song URL');
    const data = await res.json();
    if (data.status !== 200 || !data.response) return null;
    return data.response;
  } catch (error) {
    console.error('Error fetching song URL from Music API:', error);
    return null;
  }
} 