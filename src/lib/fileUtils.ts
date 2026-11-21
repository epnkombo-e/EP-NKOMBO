export const MAX_DIRECT_FILE_BYTES = 500 * 1024;
export const MAX_ENCODED_DATA_LENGTH = 700000;
export const MAX_IMAGE_DATA_LENGTH = 240000;

export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return 'External link';
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb < 10 ? kb.toFixed(1) : Math.round(kb)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(1)} MB`;
}

export function getFileExtensionLabel(fileName: string, mimeType?: string): string {
  const cleanName = fileName.trim();
  const dotIdx = cleanName.lastIndexOf('.');
  if (dotIdx > 0 && dotIdx < cleanName.length - 1) {
    const ext = cleanName.slice(dotIdx + 1).toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (ext && ext.length <= 6) return ext;
  }
  const mime = (mimeType || '').toLowerCase();
  if (mime.includes('pdf')) return 'PDF';
  if (mime.includes('csv')) return 'CSV';
  if (mime.includes('wordprocessingml') || mime.includes('msword')) return 'DOCX';
  if (mime.includes('spreadsheetml') || mime.includes('ms-excel')) return 'XLSX';
  if (mime.includes('presentationml') || mime.includes('powerpoint')) return 'PPTX';
  if (mime.startsWith('image/')) return mime.slice(6).toUpperCase().slice(0, 5) || 'IMG';
  if (mime.startsWith('video/')) return mime.slice(6).toUpperCase().slice(0, 5) || 'VIDEO';
  if (mime.startsWith('text/')) return 'TXT';
  return 'FILE';
}

export function isSafeHttpUrl(rawUrl?: string | null): boolean {
  if (!rawUrl) return false;
  const trimmed = rawUrl.trim();
  if (!trimmed) return false;
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

export function isSafeDownloadDataUri(rawData?: string | null): boolean {
  if (!rawData) return false;
  const trimmed = rawData.trim();
  return /^data:[a-zA-Z0-9.+/-]+(;charset=[a-zA-Z0-9-]+)?;base64,[A-Za-z0-9+/=]+$/.test(trimmed);
}

export function utf8ToBase64DataUrl(mimeType: string, text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return `data:${mimeType};charset=utf-8;base64,${btoa(binary)}`;
}

export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Could not read file contents.'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read selected file.'));
    reader.readAsDataURL(file);
  });
}

/**
 * Downscales and JPEG-compresses an image file via canvas until its base64 data URI
 * stays comfortably within Firestore field size bounds.
 */
export async function compressImageToDataUrl(
  file: File,
  maxDimension = 1400,
  maxLength = MAX_IMAGE_DATA_LENGTH,
): Promise<string> {
  const rawUrl = await readFileAsDataUrl(file);
  if (rawUrl.length <= maxLength && file.type === 'image/jpeg') {
    return rawUrl;
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let width = img.naturalWidth || img.width;
      let height = img.naturalHeight || img.height;
      if (!width || !height) {
        reject(new Error('Invalid image dimensions.'));
        return;
      }

      if (width > maxDimension || height > maxDimension) {
        const scale = Math.min(maxDimension / width, maxDimension / height);
        width = Math.max(1, Math.round(width * scale));
        height = Math.max(1, Math.round(height * scale));
      }

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Browser canvas is unavailable for image optimization.'));
        return;
      }

      const tryRender = (w: number, h: number, quality: number): string => {
        canvas.width = w;
        canvas.height = h;
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);
        return canvas.toDataURL('image/jpeg', quality);
      };

      const qualities = [0.84, 0.72, 0.6, 0.48];
      for (const q of qualities) {
        const out = tryRender(width, height, q);
        if (out.length <= maxLength) {
          resolve(out);
          return;
        }
      }

      // Secondary resize pass if original photo is still very dense
      const smallerW = Math.max(320, Math.round(width * 0.65));
      const smallerH = Math.max(240, Math.round(height * 0.65));
      const fallback = tryRender(smallerW, smallerH, 0.55);
      if (fallback.length <= maxLength) {
        resolve(fallback);
      } else {
        reject(new Error('Photo could not be compressed small enough. Please choose a smaller image or paste an image URL.'));
      }
    };
    img.onerror = () => reject(new Error('Selected file could not be decoded as an image.'));
    img.src = rawUrl;
  });
}

export function triggerSchoolFileDownload(file: {
  fileName: string;
  sourceType: string;
  fileData?: string;
  fileUrl?: string;
}): boolean {
  const safeName = (file.fileName || 'ep-saint-pierre-nkombo-file')
    .replace(/[/\\?%*:|"<>]/g, '-')
    .trim();

  if (file.fileData && isSafeDownloadDataUri(file.fileData)) {
    const link = document.createElement('a');
    link.href = file.fileData;
    link.download = safeName || 'school-document';
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return true;
  }

  if (file.fileUrl && isSafeHttpUrl(file.fileUrl)) {
    const link = document.createElement('a');
    link.href = file.fileUrl;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.download = safeName;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return true;
  }

  return false;
}
