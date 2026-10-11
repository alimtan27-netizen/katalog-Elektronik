export interface ProcessedImageResult {
  dataUrl: string;
  originalName: string;
  originalSizeMb: number;
  processedSizeKb: number;
  width: number;
  height: number;
}

export const MAX_ALLOWED_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50 Megabytes

// Helper to convert HEIC/HEIF to JPEG blob if needed
async function prepareImageBlob(file: File): Promise<Blob> {
  const isHeic =
    file.type === 'image/heic' ||
    file.type === 'image/heif' ||
    /\.hei[cf]$/i.test(file.name);

  if (isHeic) {
    try {
      // Dynamic import to prevent SSR/bundle blocking
      const heic2anyModule = await import('heic2any');
      const heic2any = (heic2anyModule.default || heic2anyModule) as (options: any) => Promise<Blob | Blob[]>;
      const converted = await heic2any({
        blob: file,
        toType: 'image/jpeg',
        quality: 0.8,
      });
      return Array.isArray(converted) ? converted[0] : converted;
    } catch (err) {
      console.warn('HEIC conversion failed, proceeding with original file', err);
    }
  }

  return file;
}

export async function processAndCompressImage(file: File): Promise<ProcessedImageResult> {
  const originalSizeMb = parseFloat((file.size / (1024 * 1024)).toFixed(2));

  if (file.size > MAX_ALLOWED_FILE_SIZE_BYTES) {
    throw new Error(`Ukuran file melebihi batas 50 MB (File Anda: ${originalSizeMb} MB).`);
  }

  const blob = await prepareImageBlob(file);

  // Use ObjectURL to avoid allocating massive base64 strings in mobile RAM
  const objectUrl = URL.createObjectURL(blob);

  return new Promise((resolve, reject) => {
    const img = new Image();

    const cleanup = () => {
      try {
        URL.revokeObjectURL(objectUrl);
      } catch (e) {
        // ignore
      }
    };

    img.onerror = () => {
      cleanup();
      reject(new Error('Format foto tidak terbaca atau rusak. Mohon gunakan foto berformat JPG, PNG, atau WEBP.'));
    };

    img.onload = () => {
      try {
        let maxDimension = 760;
        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;

        if (width <= 0 || height <= 0) {
          cleanup();
          reject(new Error('Dimensi gambar tidak valid.'));
          return;
        }

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          cleanup();
          reject(new Error('Canvas kontek sistem tidak tersedia'));
          return;
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Export to efficient JPEG
        let quality = 0.65;
        let dataUrl = canvas.toDataURL('image/jpeg', quality);

        // If still over 100KB, do a gentle downscale to ensure safety in local storage
        if (dataUrl.length > 130000) {
          const smallerCanvas = document.createElement('canvas');
          const scale = 0.82;
          smallerCanvas.width = Math.round(width * scale);
          smallerCanvas.height = Math.round(height * scale);
          const smallCtx = smallerCanvas.getContext('2d');
          if (smallCtx) {
            smallCtx.imageSmoothingEnabled = true;
            smallCtx.imageSmoothingQuality = 'high';
            smallCtx.drawImage(canvas, 0, 0, smallerCanvas.width, smallerCanvas.height);
            dataUrl = smallerCanvas.toDataURL('image/jpeg', 0.58);
            width = smallerCanvas.width;
            height = smallerCanvas.height;
          }
        }

        const head = 'data:image/jpeg;base64,';
        const base64Len = Math.max(0, dataUrl.length - head.length);
        const processedBytes = Math.round((base64Len * 3) / 4);
        const processedSizeKb = parseFloat((processedBytes / 1024).toFixed(1));

        cleanup();

        resolve({
          dataUrl,
          originalName: file.name,
          originalSizeMb,
          processedSizeKb,
          width,
          height,
        });
      } catch (err: any) {
        cleanup();
        reject(err instanceof Error ? err : new Error(String(err)));
      }
    };

    img.src = objectUrl;
  });
}
