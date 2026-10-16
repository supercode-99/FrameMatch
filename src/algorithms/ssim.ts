import { GrayImageData } from './imageUtils';

export interface SSIMResult {
  meanSSIM: number;       // 0 to 1
  validWindows: number;
  maskedWindows: number;
}

const C1 = 6.5025;   // (0.01 * 255)^2
const C2 = 58.5225;  // (0.03 * 255)^2

/**
 * Computes Masked Structural Similarity Index (SSIM) between two grayscale images.
 * Pixels marked as 1 in `mask` are completely excluded from SSIM evaluation,
 * preventing subtitles and captions from falsely degrading structural similarity.
 */
export function computeMaskedSSIM(
  grayA: GrayImageData,
  grayB: GrayImageData,
  mask: Uint8Array,
  windowSize: number = 8,
  stepSize: number = 4
): SSIMResult {
  const { width, height } = grayA;
  const dataA = grayA.data;
  const dataB = grayB.data;

  let totalSSIM = 0;
  let validCount = 0;
  let maskedCount = 0;

  const halfWin = Math.floor(windowSize / 2);
  const minPixelsPerWindow = Math.floor(windowSize * windowSize * 0.7); // at least 70% unmasked

  for (let y = 0; y <= height - windowSize; y += stepSize) {
    for (let x = 0; x <= width - windowSize; x += stepSize) {
      let sumA = 0;
      let sumB = 0;
      let count = 0;

      // First pass: compute local means over unmasked pixels
      for (let wy = 0; wy < windowSize; wy++) {
        const row = (y + wy) * width;
        for (let wx = 0; wx < windowSize; wx++) {
          const idx = row + (x + wx);
          if (mask[idx] === 0) {
            sumA += dataA[idx];
            sumB += dataB[idx];
            count++;
          }
        }
      }

      if (count < minPixelsPerWindow) {
        maskedCount++;
        continue; // skip windows largely covered by subtitle mask
      }

      const meanA = sumA / count;
      const meanB = sumB / count;

      // Second pass: compute local variances and covariance
      let varA = 0;
      let varB = 0;
      let covAB = 0;

      for (let wy = 0; wy < windowSize; wy++) {
        const row = (y + wy) * width;
        for (let wx = 0; wx < windowSize; wx++) {
          const idx = row + (x + wx);
          if (mask[idx] === 0) {
            const diffA = dataA[idx] - meanA;
            const diffB = dataB[idx] - meanB;
            varA += diffA * diffA;
            varB += diffB * diffB;
            covAB += diffA * diffB;
          }
        }
      }

      const varianceA = varA / (count - 1);
      const varianceB = varB / (count - 1);
      const covarianceAB = covAB / (count - 1);

      // SSIM formula
      const numerator = (2 * meanA * meanB + C1) * (2 * covarianceAB + C2);
      const denominator = (meanA * meanA + meanB * meanB + C1) * (varianceA + varianceB + C2);
      const localSSIM = numerator / denominator;

      // Bound between -1 and 1
      const clampedSSIM = Math.max(-1, Math.min(1, localSSIM));
      // Normalize to 0..1 for standard metric usage
      const normalizedSSIM = Math.max(0, (clampedSSIM + 1) / 2);

      totalSSIM += normalizedSSIM;
      validCount++;
    }
  }

  const meanSSIM = validCount > 0 ? totalSSIM / validCount : 0.5;

  return {
    meanSSIM,
    validWindows: validCount,
    maskedWindows: maskedCount,
  };
}
