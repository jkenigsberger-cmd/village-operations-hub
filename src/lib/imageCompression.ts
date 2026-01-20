export type ImageCompressionOptions = {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0..1
  mimeType?: 'image/jpeg' | 'image/webp';
};

const DEFAULTS: Required<ImageCompressionOptions> = {
  maxWidth: 1280,
  maxHeight: 1280,
  quality: 0.72,
  mimeType: 'image/jpeg',
};

function fileToDataUrl(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => resolve(reader.result as string);
    reader.readAsDataURL(file);
  });
}

async function loadImageFromFile(file: File): Promise<{ img: CanvasImageSource; width: number; height: number }> {
  // Prefer createImageBitmap when available (faster, avoids DOM Image)
  if (typeof createImageBitmap !== 'undefined') {
    const bitmap = await createImageBitmap(file);
    return { img: bitmap, width: bitmap.width, height: bitmap.height };
  }

  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('Failed to load image'));
      el.src = url;
    });
    return { img, width: img.naturalWidth, height: img.naturalHeight };
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function compressImageFileToDataUrl(
  file: File,
  options: ImageCompressionOptions = {}
): Promise<string> {
  const { maxWidth, maxHeight, quality, mimeType } = { ...DEFAULTS, ...options };

  // If it's not an image, fall back to raw DataURL
  if (!file.type.startsWith('image/')) {
    return fileToDataUrl(file);
  }

  const { img, width, height } = await loadImageFromFile(file);

  const scale = Math.min(1, maxWidth / width, maxHeight / height);
  const targetW = Math.max(1, Math.round(width * scale));
  const targetH = Math.max(1, Math.round(height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = targetW;
  canvas.height = targetH;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    // Very rare, but keep a safe fallback
    return fileToDataUrl(file);
  }

  ctx.drawImage(img, 0, 0, targetW, targetH);

  // Prefer toBlob (avoids huge base64 intermediates)
  const blob: Blob = await new Promise((resolve) => {
    canvas.toBlob(
      (b) => resolve(b ?? file),
      mimeType,
      quality
    );
  });

  return fileToDataUrl(blob);
}
