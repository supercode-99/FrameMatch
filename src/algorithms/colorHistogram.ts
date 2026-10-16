import { ImageDataRGB, rgbToHsv } from './imageUtils';

export interface ColorHistogramResult {
  similarity: number;          // 0 to 1 (Bhattacharyya correlation)
  dominantDistance: number;    // 0 to 1
  averageLuminanceDiff: number; // 0 to 255
}

const HUE_BINS = 16;
const SAT_BINS = 4;
const VAL_BINS = 4;
const TOTAL_BINS_PER_CELL = HUE_BINS * SAT_BINS * VAL_BINS; // 256 bins

/**
 * Computes a Spatial Grid (3x3 cells) HSV Color Histogram, excluding masked pixels.
 * Uses Bhattacharyya distance / histogram intersection to compare color atmospheres.
 */
export function computeMaskedColorHistogram(
  imgDataA: ImageDataRGB,
  imgDataB: ImageDataRGB,
  mask: Uint8Array,
  gridCols: number = 3,
  gridRows: number = 3
): ColorHistogramResult {
  const { width, height } = imgDataA;
  const numCells = gridCols * gridRows;

  // Allocate histograms for each spatial cell
  const histA = new Float32Array(numCells * TOTAL_BINS_PER_CELL);
  const histB = new Float32Array(numCells * TOTAL_BINS_PER_CELL);
  const cellCountsA = new Float32Array(numCells);
  const cellCountsB = new Float32Array(numCells);

  let lumSumA = 0;
  let lumSumB = 0;
  let totalValidPixels = 0;

  const dataA = imgDataA.data;
  const dataB = imgDataB.data;

  const cellW = width / gridCols;
  const cellH = height / gridRows;

  for (let y = 0; y < height; y++) {
    const cellY = Math.min(gridRows - 1, Math.floor(y / cellH));
    const rowOffset = y * width;

    for (let x = 0; x < width; x++) {
      const idx = rowOffset + x;
      if (mask[idx] === 1) continue; // ignore subtitle pixels

      const cellX = Math.min(gridCols - 1, Math.floor(x / cellW));
      const cellIndex = cellY * gridCols + cellX;
      const cellOffset = cellIndex * TOTAL_BINS_PER_CELL;

      const pIdx = idx * 4;

      // Pixel A
      const rA = dataA[pIdx];
      const gA = dataA[pIdx + 1];
      const bA = dataA[pIdx + 2];
      const [hA, sA, vA] = rgbToHsv(rA, gA, bA);
      lumSumA += 0.2126 * rA + 0.7152 * gA + 0.0722 * bA;

      const hBinA = Math.min(HUE_BINS - 1, Math.floor((hA / 360) * HUE_BINS));
      const sBinA = Math.min(SAT_BINS - 1, Math.floor(sA * SAT_BINS));
      const vBinA = Math.min(VAL_BINS - 1, Math.floor(vA * VAL_BINS));
      const binIndexA = hBinA * (SAT_BINS * VAL_BINS) + sBinA * VAL_BINS + vBinA;

      histA[cellOffset + binIndexA]++;
      cellCountsA[cellIndex]++;

      // Pixel B
      const rB = dataB[pIdx];
      const gB = dataB[pIdx + 1];
      const bB = dataB[pIdx + 2];
      const [hB, sB, vB] = rgbToHsv(rB, gB, bB);
      lumSumB += 0.2126 * rB + 0.7152 * gB + 0.0722 * bB;

      const hBinB = Math.min(HUE_BINS - 1, Math.floor((hB / 360) * HUE_BINS));
      const sBinB = Math.min(SAT_BINS - 1, Math.floor(sB * SAT_BINS));
      const vBinB = Math.min(VAL_BINS - 1, Math.floor(vB * VAL_BINS));
      const binIndexB = hBinB * (SAT_BINS * VAL_BINS) + sBinB * VAL_BINS + vBinB;

      histB[cellOffset + binIndexB]++;
      cellCountsB[cellIndex]++;

      totalValidPixels++;
    }
  }

  // Normalize each cell histogram and compute Bhattacharyya coefficient
  let overallSimilarity = 0;
  let activeCells = 0;

  for (let c = 0; c < numCells; c++) {
    const countA = cellCountsA[c];
    const countB = cellCountsB[c];
    if (countA === 0 || countB === 0) continue;

    const cellOffset = c * TOTAL_BINS_PER_CELL;
    let bhattacharyya = 0;

    for (let b = 0; b < TOTAL_BINS_PER_CELL; b++) {
      const p = histA[cellOffset + b] / countA;
      const q = histB[cellOffset + b] / countB;
      bhattacharyya += Math.sqrt(p * q);
    }

    overallSimilarity += bhattacharyya;
    activeCells++;
  }

  const finalSim = activeCells > 0 ? Math.min(1, Math.max(0, overallSimilarity / activeCells)) : 0.5;
  const avgLumA = totalValidPixels > 0 ? lumSumA / totalValidPixels : 128;
  const avgLumB = totalValidPixels > 0 ? lumSumB / totalValidPixels : 128;
  const luminanceDiff = Math.abs(avgLumA - avgLumB);

  return {
    similarity: finalSim,
    dominantDistance: 1 - finalSim,
    averageLuminanceDiff: luminanceDiff,
  };
}
