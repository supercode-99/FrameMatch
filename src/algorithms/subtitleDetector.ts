import { GrayImageData } from './imageUtils';

export interface DetectedSubtitleBox {
  yStart: number;
  height: number;
  confidence: number;
  hasSubtitle: boolean;
}

/**
 * Detects subtitle text bands in the lower region of a video frame
 * by analyzing row-wise horizontal high-frequency edge energy and contrast.
 */
export function detectSubtitleBand(
  gray: GrayImageData,
  searchRegionBottomRatio: number = 0.28
): DetectedSubtitleBox {
  const { width, height, data } = gray;
  const startY = Math.floor(height * (1 - searchRegionBottomRatio));
  const endY = height - 2;

  const rowEnergy = new Float32Array(height);
  const rowContrast = new Float32Array(height);

  // Compute horizontal edge gradients (Sobel-like horizontal derivative) across the lower region
  // Subtitle text lines have dense transitions: e.g. background -> dark stroke -> bright text -> dark stroke
  for (let y = startY; y <= endY; y++) {
    let edgeSum = 0;
    let minVal = 255;
    let maxVal = 0;
    let highEdgeCount = 0;

    const rowOffset = y * width;
    for (let x = 1; x < width - 1; x++) {
      const val = data[rowOffset + x];
      if (val < minVal) minVal = val;
      if (val > maxVal) maxVal = val;

      const diff = Math.abs(data[rowOffset + x + 1] - data[rowOffset + x - 1]);
      if (diff > 25) {
        highEdgeCount++;
        edgeSum += diff;
      }
    }

    rowEnergy[y] = highEdgeCount / width;
    rowContrast[y] = maxVal - minVal;
  }

  // Find continuous bands where row energy and contrast exceed baseline thresholds
  // Subtitle text typically spans 8 to 40 pixels in vertical height on standard downsampled image
  let bestStart = -1;
  let bestLength = 0;
  let curStart = -1;
  let curLength = 0;
  let totalPeakEnergy = 0;

  for (let y = startY; y <= endY; y++) {
    const isTextLike = rowEnergy[y] > 0.08 && rowContrast[y] > 60;
    if (isTextLike) {
      if (curStart === -1) {
        curStart = y;
        curLength = 1;
      } else {
        curLength++;
      }
      totalPeakEnergy += rowEnergy[y];
    } else {
      if (curLength > bestLength) {
        bestLength = curLength;
        bestStart = curStart;
      }
      curStart = -1;
      curLength = 0;
    }
  }

  if (curLength > bestLength) {
    bestLength = curLength;
    bestStart = curStart;
  }

  // Minimum height for text line (at least 6-8 pixels at ~256px resolution)
  if (bestStart !== -1 && bestLength >= 6) {
    // Add padding of 3-4 pixels above and below to cover font ascenders/descenders & drop shadows
    const paddedStart = Math.max(0, bestStart - 4);
    const paddedHeight = Math.min(height - paddedStart, bestLength + 8);
    const confidence = Math.min(0.98, Math.max(0.4, (totalPeakEnergy / bestLength) * 3));

    return {
      yStart: paddedStart,
      height: paddedHeight,
      confidence,
      hasSubtitle: true,
    };
  }

  return {
    yStart: Math.floor(height * 0.82),
    height: Math.floor(height * 0.18),
    confidence: 0,
    hasSubtitle: false,
  };
}
