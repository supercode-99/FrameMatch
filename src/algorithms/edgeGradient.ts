import { GrayImageData } from './imageUtils';

export interface EdgeGradientResult {
  similarity: number; // 0 to 1
  edgeDensityA: number;
  edgeDensityB: number;
}

const ORIENTATION_BINS = 8;
const SOBEL_X = [-1, 0, 1, -2, 0, 2, -1, 0, 1];
const SOBEL_Y = [-1, -2, -1, 0, 0, 0, 1, 2, 1];

/**
 * Computes Edge Gradient Magnitude and Orientation Coherence (HOG-like spatial descriptor)
 * excluding subtitle masked pixels.
 */
export function computeMaskedEdgeGradient(
  grayA: GrayImageData,
  grayB: GrayImageData,
  mask: Uint8Array,
  gridCols: number = 4,
  gridRows: number = 4
): EdgeGradientResult {
  const { width, height } = grayA;
  const numCells = gridCols * gridRows;
  const cellHistA = new Float32Array(numCells * ORIENTATION_BINS);
  const cellHistB = new Float32Array(numCells * ORIENTATION_BINS);

  let highEdgeCountA = 0;
  let highEdgeCountB = 0;
  let validPixelCount = 0;

  const cellW = width / gridCols;
  const cellH = height / gridRows;

  const dataA = grayA.data;
  const dataB = grayB.data;

  // 1px margin for 3x3 Sobel
  for (let y = 1; y < height - 1; y++) {
    const cellY = Math.min(gridRows - 1, Math.floor(y / cellH));
    const rowOffset = y * width;

    for (let x = 1; x < width - 1; x++) {
      const idx = rowOffset + x;
      if (mask[idx] === 1) continue;

      const cellX = Math.min(gridCols - 1, Math.floor(x / cellW));
      const cellIdx = cellY * gridCols + cellX;
      const cellOffset = cellIdx * ORIENTATION_BINS;

      validPixelCount++;

      // Sobel Frame A
      let gxA = 0;
      let gyA = 0;
      let k = 0;
      for (let ky = -1; ky <= 1; ky++) {
        const kRow = (y + ky) * width;
        for (let kx = -1; kx <= 1; kx++) {
          const val = dataA[kRow + (x + kx)];
          gxA += val * SOBEL_X[k];
          gyA += val * SOBEL_Y[k];
          k++;
        }
      }
      const magA = Math.sqrt(gxA * gxA + gyA * gyA);
      if (magA > 30) highEdgeCountA++;

      // Angle [0, PI)
      let angleA = Math.atan2(gyA, gxA);
      if (angleA < 0) angleA += Math.PI;
      const binA = Math.min(ORIENTATION_BINS - 1, Math.floor((angleA / Math.PI) * ORIENTATION_BINS));
      cellHistA[cellOffset + binA] += magA;

      // Sobel Frame B
      let gxB = 0;
      let gyB = 0;
      k = 0;
      for (let ky = -1; ky <= 1; ky++) {
        const kRow = (y + ky) * width;
        for (let kx = -1; kx <= 1; kx++) {
          const val = dataB[kRow + (x + kx)];
          gxB += val * SOBEL_X[k];
          gyB += val * SOBEL_Y[k];
          k++;
        }
      }
      const magB = Math.sqrt(gxB * gxB + gyB * gyB);
      if (magB > 30) highEdgeCountB++;

      let angleB = Math.atan2(gyB, gxB);
      if (angleB < 0) angleB += Math.PI;
      const binB = Math.min(ORIENTATION_BINS - 1, Math.floor((angleB / Math.PI) * ORIENTATION_BINS));
      cellHistB[cellOffset + binB] += magB;
    }
  }

  // Compute Cosine similarity over spatial edge descriptors
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  const totalBins = numCells * ORIENTATION_BINS;

  for (let i = 0; i < totalBins; i++) {
    const a = cellHistA[i];
    const b = cellHistB[i];
    dotProduct += a * b;
    normA += a * a;
    normB += b * b;
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  const similarity = denominator > 0 ? Math.min(1, Math.max(0, dotProduct / denominator)) : 0.5;

  return {
    similarity,
    edgeDensityA: validPixelCount > 0 ? highEdgeCountA / validPixelCount : 0,
    edgeDensityB: validPixelCount > 0 ? highEdgeCountB / validPixelCount : 0,
  };
}
