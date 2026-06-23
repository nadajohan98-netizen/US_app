import cloudinaryConfig from '../cloudinary-config.json';

// Cloudinary unsigned uploads: the cloud name and (unsigned) upload preset are
// public by design — they are meant to live in client code. No secret here.
const CLOUD_NAME: string = cloudinaryConfig.cloudName || '';
const UPLOAD_PRESET: string = cloudinaryConfig.uploadPreset || '';
const ENDPOINT = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`;

function isConfigured(): boolean {
  return (
    !!CLOUD_NAME &&
    !CLOUD_NAME.startsWith('YOUR_') &&
    !!UPLOAD_PRESET &&
    !UPLOAD_PRESET.startsWith('YOUR_')
  );
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// 'auto' lets Cloudinary detect images vs audio/video automatically.
async function uploadToCloudinary(file: Blob | string, folder: string): Promise<string> {
  const form = new FormData();
  form.append('file', file as Blob);
  form.append('upload_preset', UPLOAD_PRESET);
  if (folder) form.append('folder', folder);

  const res = await fetch(ENDPOINT, { method: 'POST', body: form });
  if (!res.ok) {
    throw new Error(`Cloudinary upload failed: ${res.status}`);
  }
  const data = await res.json();
  if (!data.secure_url) {
    throw new Error('Cloudinary response missing secure_url');
  }
  return data.secure_url as string;
}

/**
 * Uploads a Blob/File and returns its public URL. Keeps heavy media out of app
 * state, localStorage and the backend DB. Falls back to an inline base64 data
 * URL if Cloudinary isn't configured or the upload fails, so media is never lost.
 */
export async function uploadMedia(data: Blob, folder: string = 'amour'): Promise<string> {
  if (!isConfigured()) return blobToDataUrl(data);
  try {
    return await uploadToCloudinary(data, folder);
  } catch (err) {
    console.warn('Cloudinary upload failed, falling back to inline data:');
    return blobToDataUrl(data);
  }
}

/**
 * Uploads media we only have as a base64 / data URL (e.g. from FileReader).
 * Cloudinary accepts data URIs directly. Falls back to the original data URL
 * if Cloudinary isn't configured or the upload fails.
 */
export async function uploadDataUrl(dataUrl: string, folder: string = 'amour'): Promise<string> {
  if (!isConfigured()) return dataUrl;
  try {
    return await uploadToCloudinary(dataUrl, folder);
  } catch (err) {
    console.warn('Cloudinary upload failed, falling back to inline data:');
    return dataUrl;
  }
}

