// Regex to extract YouTube video IDs from various URL formats
const YOUTUBE_LINK_REGEX = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;

/**
 * Extracts the YouTube video ID from a URL.
 * Supports standard watch URLs, shortened URLs, embed URLs, and shorts URLs.
 * 
 * @param {string | null | undefined} url - The URL to extract the ID from
 * @returns {string | null} The video ID or null if not a valid YouTube URL
 */
export const getYoutubeVideoId = (url: string | null | undefined): string | null => {
  if (!url) return null;
  const match = url.match(YOUTUBE_LINK_REGEX);
  return match ? match[1] : null; // Return the ID (group 1)
};

/**
 * Extracts the first YouTube URL from content.
 * 
 * @param {string | null | undefined} content - HTML or text content
 * @returns {string | null} The full YouTube URL or null if none found
 */
export const extractYoutubeUrl = (content: string | null | undefined): string | null => {
  if (!content) return null;
  const match = content.match(YOUTUBE_LINK_REGEX);
  return match ? match[0] : null; // Return the full matched URL
}; 