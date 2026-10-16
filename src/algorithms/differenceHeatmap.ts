import { ImageDataRGB } from './imageUtils';

/**
 * Generates visual difference heatmap and mask visualization as Data URLs
 */
export function generateDifferenceHeatmapAndMasks(
  imgDataA: ImageDataRGB,
  imgDataB: ImageDataRGB,
  mask: Uint8Array,
  width: number,
  height: number
): {
  diffHeatmapUrl: string;
  maskOverlayUrlA: string;
  maskOverlayUrlB: string;
} {
  const canvasDiff = document.createElement('canvas');
  canvasDiff.width = width;
  canvasDiff.height = height;
  const ctxDiff = canvasDiff.getContext('2d')!;
  const diffImgData = ctxDiff.createImageData(width, height);

  const dataA = imgDataA.data;
  const dataB = imgDataB.data;
  const diffPixels = diffImgData.data;

  for (let y = 0; y < height; y++) {
    const rowOffset = y * width;
    for (let x = 0; x < width; x++) {
      const idx = rowOffset + x;
      const pIdx = idx * 4;

      if (mask[idx] === 1) {
        // Masked subtitle zone: render as muted translucent violet-slate with slight stripes
        const isStripe = (x + y) % 10 < 3;
        diffPixels[pIdx] = isStripe ? 120 : 70;      // R
        diffPixels[pIdx + 1] = isStripe ? 80 : 50;   // G
        diffPixels[pIdx + 2] = isStripe ? 160 : 110; // B
        diffPixels[pIdx + 3] = 230;                  // A
        continue;
      }

      // Delta across RGB channels
      const dr = Math.abs(dataA[pIdx] - dataB[pIdx]);
      const dg = Math.abs(dataA[pIdx + 1] - dataB[pIdx + 1]);
      const db = Math.abs(dataA[pIdx + 2] - dataB[pIdx + 2]);
      const diffIntensity = Math.min(255, (dr * 0.299 + dg * 0.587 + db * 0.114) * 2.2);

      // Colormap Turbo/Jet (blue -> cyan -> green -> yellow -> red)
      const t = diffIntensity / 255;
      let r = 0;
      let g = 0;
      let b = 0;

      if (t < 0.2) {
        // Deep blue to cyan
        const f = t / 0.2;
        r = Math.floor(15 * (1 - f));
        g = Math.floor(40 + 160 * f);
        b = Math.floor(120 + 130 * f);
      } else if (t < 0.45) {
        // Cyan to green
        const f = (t - 0.2) / 0.25;
        r = Math.floor(20 * (1 - f) + 40 * f);
        g = Math.floor(200 + 45 * f);
        b = Math.floor(250 * (1 - f));
      } else if (t < 0.75) {
        // Green to yellow / orange
        const f = (t - 0.45) / 0.3;
        r = Math.floor(40 * (1 - f) + 245 * f);
        g = Math.floor(245 * (1 - f) + 180 * f);
        b = 20;
      } else {
        // Orange to intense red/magenta
        const f = (t - 0.75) / 0.25;
        r = Math.floor(245 + 10 * f);
        g = Math.floor(180 * (1 - f));
        b = Math.floor(20 + 80 * f);
      }

      diffPixels[pIdx] = r;
      diffPixels[pIdx + 1] = g;
      diffPixels[pIdx + 2] = b;
      diffPixels[pIdx + 3] = 255;
    }
  }

  ctxDiff.putImageData(diffImgData, 0, 0);

  // Mask overlays for Image A and Image B
  const createMaskOverlay = (baseImgData: ImageDataRGB): string => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;
    const output = ctx.createImageData(width, height);
    const src = baseImgData.data;
    const dst = output.data;

    for (let i = 0; i < mask.length; i++) {
      const pIdx = i * 4;
      const isMasked = mask[i] === 1;

      if (isMasked) {
        // Red tint + darkened to show excluded subtitle area
        dst[pIdx] = Math.floor(src[pIdx] * 0.4 + 180);
        dst[pIdx + 1] = Math.floor(src[pIdx + 1] * 0.3);
        dst[pIdx + 2] = Math.floor(src[pIdx + 2] * 0.3);
        dst[pIdx + 3] = 255;
      } else {
        dst[pIdx] = src[pIdx];
        dst[pIdx + 1] = src[pIdx + 1];
        dst[pIdx + 2] = src[pIdx + 2];
        dst[pIdx + 3] = 255;
      }
    }

    ctx.putImageData(output, 0, 0);
    return canvas.toDataURL('image/png');
  };

  return {
    diffHeatmapUrl: canvasDiff.toDataURL('image/png'),
    maskOverlayUrlA: createMaskOverlay(imgDataA),
    maskOverlayUrlB: createMaskOverlay(imgDataB),
  };
}
