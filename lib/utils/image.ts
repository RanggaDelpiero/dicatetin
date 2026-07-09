// ============================================
// Pundi — Client-side Image Compression Utility
// ============================================

/**
 * Compresses and resizes a base64 image string to keep payload sizes small.
 */
export async function compressImage(base64Str: string, maxWidth = 1024, quality = 0.75): Promise<string> {
  if (typeof window === 'undefined') return base64Str;

  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Resize if wider than maxWidth
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(base64Str);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        // Export as JPEG with defined quality (0.0 to 1.0)
        const compressed = canvas.toDataURL('image/jpeg', quality);
        resolve(compressed);
      } catch (err) {
        console.error('Image compression failed, using original:', err);
        resolve(base64Str);
      }
    };
    img.onerror = () => {
      resolve(base64Str);
    };
  });
}
