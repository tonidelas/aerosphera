// Use deployed Vercel proxy for Deezer API requests with CORS proxy
const DEEZER_PROXY_URL = 'https://corsproxy.io/?https://proxyforaerofy-7u67k38z1-tonidelas-projects.vercel.app/api/deezer-search';

export interface DeezerTrack {
  id: string;
  title: string;
  artist: { name: string };
  album: { cover: string };
  preview?: string;
}

/**
 * Search for tracks on Deezer (via Vercel proxy with CORS proxy)
 * @param query The search query
 * @param limit Number of results to return (default 20)
 * @returns Array of tracks (may or may not have preview URLs)
 */
export async function searchDeezerTracks(query: string, limit: number = 20): Promise<DeezerTrack[]> {
  try {
    const url = `${DEEZER_PROXY_URL}?q=${encodeURIComponent(query)}&limit=${limit}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch tracks');
    const data = await res.json();
    // Return all tracks, not just those with a preview URL
    return data.data || [];
  } catch (error) {
    console.error('Error searching Deezer:', error);
    return [];
  }
} 