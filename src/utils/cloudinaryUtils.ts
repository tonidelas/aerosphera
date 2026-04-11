import { CLOUDINARY_CLOUD_NAME, CLOUDINARY_UPLOAD_PRESET } from './config';

interface UploadResult {
  secure_url: string;
  public_id: string;
}

interface UploadProgressCallback {
  (progress: number): void;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB limit for Cloudinary

/**
 * Compresses an image file if it's too large
 */
const compressImage = async (file: File, maxWidth = 1600, maxHeight = 1600, quality = 0.8): Promise<File | Blob> => {
  if (file.type === 'image/gif') return file; // Skip compression for GIFs to preserve animation
  
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(new File([blob], file.name, { type: 'image/jpeg' }));
          } else {
            resolve(file);
          }
        }, 'image/jpeg', quality);
      };
      img.onerror = () => resolve(file);
    };
    reader.onerror = () => resolve(file);
  });
};

/**
 * Uploads an image to Cloudinary with retry functionality
 * @param file The file to upload
 * @param progressCallback Optional callback for upload progress
 * @param maxRetries Maximum number of retries on failure
 * @returns The secure URL of the uploaded image
 */
export const uploadImage = async (
  file: File | Blob, 
  progressCallback?: UploadProgressCallback,
  maxRetries = 2
): Promise<string> => {
  let finalFile = file;

  // 1. Try to compress if it's a non-GIF large file (> 1MB)
  // Check type: either File.type or if it's a Blob, assume image/jpeg for cropping results
  const isGif = 'type' in file && file.type === 'image/gif';
  
  if (!isGif && file.size > 1024 * 1024) {
    try {
      // Cast to any to handle File/Blob polyfills
      finalFile = await compressImage(file as any);
      
      // If it's STILL too large after first compression, try more aggressive compression
      if (finalFile.size > MAX_FILE_SIZE) {
        console.log('File still too large after first compression, attempting aggressive compression...');
        finalFile = await compressImage(file as any, 1000, 1000, 0.6);
      }
    } catch (e) {
      console.warn('Compression failed, will check original size', e);
    }
  }

  // 2. NOW check file size
  const currentLimit = file.type === 'image/gif' ? 20 * 1024 * 1024 : MAX_FILE_SIZE;
  if (finalFile.size > currentLimit) {
    const gotMB = Math.round(finalFile.size / 1024 / 1024 * 10) / 10;
    const limitMB = Math.round(currentLimit / 1024 / 1024);
    if (file.type === 'image/gif') {
      throw new Error(`GIF is too large (${gotMB}MB). Max allowed for animations is ${limitMB}MB.`);
    } else {
      throw new Error(`Image is too large even after compression (${gotMB}MB). Max allowed is ${limitMB}MB.`);
    }
  }

  let retries = 0;
  
  // Create function to handle the actual upload
  const attemptUpload = async (): Promise<UploadResult> => {
    const formData = new FormData();
    formData.append('file', finalFile);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    
    // For GIFs over 10MB, try uploading as 'video' resource type which usually has higher limits
    if (file.type === 'image/gif' && file.size > 10 * 1024 * 1024) {
      formData.append('resource_type', 'video');
    }

    try {
      // If XMLHttpRequest is available, use it to track progress
      if (window.XMLHttpRequest && progressCallback) {
        return await new Promise<UploadResult>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          
          xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
              const progress = Math.round((event.loaded / event.total) * 100);
              progressCallback(progress);
            }
          };
          
          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              try {
                const data = JSON.parse(xhr.responseText);
                resolve(data);
              } catch (e) {
                reject(new Error('Invalid response format'));
              }
            } else {
              reject(new Error(`Upload failed with status ${xhr.status}`));
            }
          };
          
          xhr.onerror = () => reject(new Error('Network error during upload'));
          xhr.onabort = () => reject(new Error('Upload aborted'));
          
          xhr.open('POST', `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`);
          xhr.send(formData);
        });
      } else {
        // Fallback to fetch API if XMLHttpRequest is not available
        const response = await fetch(
          `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`,
          {
            method: 'POST',
            body: formData,
          }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            `Failed to upload image: ${response.status} ${errorData.error?.message || response.statusText}`
          );
        }

        return await response.json();
      }
    } catch (error) {
      console.error(`Upload attempt ${retries + 1} failed:`, error);
      throw error;
    }
  };

  // Try the upload with retries
  while (retries <= maxRetries) {
    try {
      const data = await attemptUpload();
      return data.secure_url;
    } catch (error) {
      retries++;
      
      if (retries > maxRetries) {
        console.error('Max retries reached. Upload failed.', error);
        throw error;
      }
      
      // Wait before retry (exponential backoff)
      const delay = Math.min(1000 * Math.pow(2, retries), 10000);
      console.log(`Retrying upload in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  // This should never be reached due to the throw in the catch block
  throw new Error('Upload failed after maximum retries');
}; 