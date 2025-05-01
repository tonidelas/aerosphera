import { CLOUDINARY_CLOUD_NAME, CLOUDINARY_UPLOAD_PRESET } from './config';

interface UploadResult {
  secure_url: string;
  public_id: string;
}

interface UploadProgressCallback {
  (progress: number): void;
}

/**
 * Uploads an image to Cloudinary with retry functionality
 * @param file The file to upload
 * @param progressCallback Optional callback for upload progress
 * @param maxRetries Maximum number of retries on failure
 * @returns The secure URL of the uploaded image
 */
export const uploadImage = async (
  file: File, 
  progressCallback?: UploadProgressCallback,
  maxRetries = 2
): Promise<string> => {
  let retries = 0;
  
  // Create function to handle the actual upload
  const attemptUpload = async (): Promise<UploadResult> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

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
          
          xhr.open('POST', `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`);
          xhr.send(formData);
        });
      } else {
        // Fallback to fetch API if XMLHttpRequest is not available
        const response = await fetch(
          `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
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