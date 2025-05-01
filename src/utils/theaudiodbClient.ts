// Utility for searching tracks using TheAudioDB API
export interface TheAudioDBTrack {
  idTrack: string;
  strTrack: string;
  strArtist: string;
  strAlbum: string;
  strTrackThumb?: string;
  strMusicVid?: string; // YouTube link
}

/**
 * Search for tracks on TheAudioDB by artist and track name
 * @param artist The artist name
 * @param track The track name
 * @returns Array of tracks (with metadata and YouTube links)
 */
export async function searchTheAudioDBTracks(artist: string, track: string): Promise<TheAudioDBTrack[]> {
  try {
    const corsProxy = "https://corsproxy.io/?";
    const url = `${corsProxy}https://theaudiodb.com/api/v1/json/2/searchtrack.php?s=${encodeURIComponent(artist)}&t=${encodeURIComponent(track)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch tracks');
    const data = await res.json();
    return data.track || [];
  } catch (error) {
    console.error('Error searching TheAudioDB:', error);
    return [];
  }
}

/**
 * Search for tracks on TheAudioDB by keyword (artist or track)
 * @param query The search query (artist or track)
 * @returns Array of tracks (with metadata and YouTube links)
 */
export async function searchTheAudioDBByKeyword(query: string): Promise<TheAudioDBTrack[]> {
  try {
    const corsProxy = "https://corsproxy.io/?";
    const url = `${corsProxy}https://theaudiodb.com/api/v1/json/2/searchtrack.php?s=${encodeURIComponent(query)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch tracks');
    const contentType = res.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      // Not JSON, return empty
      return [];
    }
    const text = await res.text();
    if (!text) return [];
    const data = JSON.parse(text);
    return data.track || [];
  } catch (error) {
    console.error('Error searching TheAudioDB by keyword:', error);
    return [];
  }
} 