/**
 * Validates if an image URL is valid and should be displayed
 */
export const isValidImageUrl = (url: string | null | undefined): boolean => {
  if (!url) return false;
  
  // Check for common invalid values
  const invalidValues = [
    '',
    'null',
    'undefined',
    '[Post image]',
    'https://via.placeholder.com/40' // placeholder avatars
  ];
  
  const trimmedUrl = url.trim();
  
  // Check if it's in the invalid values list
  if (invalidValues.includes(trimmedUrl)) return false;
  
  // Check if it contains invalid markers
  if (trimmedUrl.includes('[Post image]')) return false;
  
  // Basic URL validation
  try {
    new URL(trimmedUrl);
    return true;
  } catch {
    return false;
  }
};

/**
 * Safely handles image loading errors
 */
export const handleImageError = (element: HTMLImageElement) => {
  element.style.display = 'none';
}; 