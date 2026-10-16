/**
 * Utility functions for image processing, canvas operations, color spaces, and mask manipulation
 */

export interface ImageDataRGB {
  width: number;
  height: number;
  data: Uint8ClampedArray; // RGBA
}

export interface GrayImageData {
  width: number;
  height: number;
  data: Float32Array; // Grayscale luminance 0..255
}

/**
 * Loads an image from a data URL or path and returns HTMLImageElement
 */
export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(new Error('Failed to load image: ' + String(err)));
    img.src = src;
  });
}

/**
 * Renders an image into a specified dimension offscreen canvas and retrieves ImageData
 */
export function getImageDataResized(
  img: HTMLImageElement,
  targetWidth: number,
  targetHeight: number
): ImageDataRGB {
  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) {
    throw new Error('Canvas 2D context not available');
  }

  // Draw image scaled to fit target dimensions
  ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
  const imgData = ctx.getImageData(0, 0, targetWidth, targetHeight);
  return {
    width: targetWidth,
    height: targetHeight,
    data: imgData.data,
  };
}

/**
 * Converts RGBA image to Float32Array Grayscale (standard Rec. 709 luminance Y = 0.2126R + 0.7152G + 0.0722B)
 */
export function toGrayscale(imgData: ImageDataRGB): GrayImageData {
  const { width, height, data } = imgData;
  const gray = new Float32Array(width * height);
  for (let i = 0, j = 0; i < data.length; i += 4, j++) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    gray[j] = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }
  return { width, height, data: gray };
}

/**
 * RGB (0..255) to HSV (H: 0..360, S: 0..1, V: 0..1)
 */
export function rgbToHsv(r: number, g: number, b: number): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  let h = 0;
  let s = max === 0 ? 0 : delta / max;
  const v = max;

  if (delta !== 0) {
    if (max === r) {
      h = ((g - b) / delta) % 6;
    } else if (max === g) {
      h = (b - r) / delta + 2;
    } else {
      h = (r - g) / delta + 4;
    }
    h *= 60;
    if (h < 0) h += 360;
  }

  return [h, s, v];
}

/**
 * Creates a boolean mask array: 1 = masked (exclude), 0 = include
 */
export function createSubtitleMask(
  width: number,
  height: number,
  bottomPercent: number,
  topPercent: number = 0,
  detectedBox?: { yStart: number; height: number }
): Uint8Array {
  const mask = new Uint8Array(width * height);
  const bottomCutoff = Math.floor(height * (1 - Math.max(0, Math.min(60, bottomPercent)) / 100));
  const topCutoff = Math.floor(height * (Math.max(0, Math.min(40, topPercent)) / 100));

  for (let y = 0; y < height; y++) {
    let isMasked = false;
    if (y >= bottomCutoff) isMasked = true;
    if (y < topCutoff) isMasked = true;

    // Detected bounding box inclusion if present
    if (detectedBox && y >= detectedBox.yStart && y <= detectedBox.yStart + detectedBox.height) {
      isMasked = true;
    }

    if (isMasked) {
      const rowOffset = y * width;
      for (let x = 0; x < width; x++) {
        mask[rowOffset + x] = 1;
      }
    }
  }

  return mask;
}

/**
 * Merges two masks (A and B) with union: if either frame has a subtitle in this area, mask it in both!
 */
export function unionMasks(maskA: Uint8Array, maskB: Uint8Array, length: number): Uint8Array {
  const combined = new Uint8Array(length);
  for (let i = 0; i < length; i++) {
    combined[i] = maskA[i] || maskB[i] ? 1 : 0;
  }
  return combined;
}
