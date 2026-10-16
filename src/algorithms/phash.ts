import { GrayImageData } from './imageUtils';

export interface PHashResult {
  hashA: string;
  hashB: string;
  hammingDistance: number;
  similarity: number; // 1 - distance / 64
}

const PHASH_SIZE = 32;
const DCT_SIZE = 8;

/**
 * Precomputes cosine coefficients for 1D DCT-II
 */
function createCosineTable(n: number): Float32Array {
  const table = new Float32Array(n * n);
  for (let k = 0; k < n; k++) {
    for (let x = 0; x < n; x++) {
      table[k * n + x] = Math.cos(((2 * x + 1) * k * Math.PI) / (2 * n));
    }
  }
  return table;
}

const cosTable32 = createCosineTable(PHASH_SIZE);

/**
 * 2D DCT-II on 32x32 matrix
 */
function dct2D(matrix: Float32Array): Float32Array {
  const intermediate = new Float32Array(PHASH_SIZE * PHASH_SIZE);
  const result = new Float32Array(PHASH_SIZE * PHASH_SIZE);

  // 1D DCT on rows
  for (let y = 0; y < PHASH_SIZE; y++) {
    const rowOffset = y * PHASH_SIZE;
    for (let u = 0; u < PHASH_SIZE; u++) {
      let sum = 0;
      const cosRow = u * PHASH_SIZE;
      for (let x = 0; x < PHASH_SIZE; x++) {
        sum += matrix[rowOffset + x] * cosTable32[cosRow + x];
      }
      intermediate[rowOffset + u] = sum;
    }
  }

  // 1D DCT on columns
  for (let x = 0; x < PHASH_SIZE; x++) {
    for (let v = 0; v < PHASH_SIZE; v++) {
      let sum = 0;
      const cosRow = v * PHASH_SIZE;
      for (let y = 0; y < PHASH_SIZE; y++) {
        sum += intermediate[y * PHASH_SIZE + x] * cosTable32[cosRow + y];
      }
      result[v * PHASH_SIZE + x] = sum;
    }
  }

  return result;
}

/**
 * Resamples grayscale image to 32x32 with subtitle mask infilling
 */
function resampleTo32x32(gray: GrayImageData, mask: Uint8Array): Float32Array {
  const { width, height, data } = gray;
  const out = new Float32Array(PHASH_SIZE * PHASH_SIZE);

  const scaleX = width / PHASH_SIZE;
  const scaleY = height / PHASH_SIZE;

  // Compute global average of non-masked pixels for infill
  let globalSum = 0;
  let globalCount = 0;
  for (let i = 0; i < data.length; i++) {
    if (mask[i] === 0) {
      globalSum += data[i];
      globalCount++;
    }
  }
  const globalMean = globalCount > 0 ? globalSum / globalCount : 128;

  for (let py = 0; py < PHASH_SIZE; py++) {
    const srcY = Math.min(height - 1, Math.floor(py * scaleY));
    const srcRow = srcY * width;
    const outRow = py * PHASH_SIZE;

    for (let px = 0; px < PHASH_SIZE; px++) {
      const srcX = Math.min(width - 1, Math.floor(px * scaleX));
      const idx = srcRow + srcX;

      if (mask[idx] === 1) {
        // Subtitle pixel: infill with global mean to avoid high-frequency subtitle edge interference
        out[outRow + px] = globalMean;
      } else {
        out[outRow + px] = data[idx];
      }
    }
  }

  return out;
}

/**
 * Computes 64-bit Perceptual Hash
 */
function generatePHashFromMatrix(matrix32: Float32Array): string {
  const dct = dct2D(matrix32);

  // Extract top-left 8x8 low frequency AC coeffs (exclude 0,0 DC coefficient)
  const coeffs = new Float32Array(DCT_SIZE * DCT_SIZE - 1);
  let k = 0;
  for (let y = 0; y < DCT_SIZE; y++) {
    for (let x = 0; x < DCT_SIZE; x++) {
      if (y === 0 && x === 0) continue;
      coeffs[k++] = dct[y * PHASH_SIZE + x];
    }
  }

  // Calculate median
  const sorted = Array.from(coeffs).sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const median = sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;

  // Build 64-bit binary hash string
  let hashStr = '';
  for (let y = 0; y < DCT_SIZE; y++) {
    for (let x = 0; x < DCT_SIZE; x++) {
      const val = dct[y * PHASH_SIZE + x];
      hashStr += val > median ? '1' : '0';
    }
  }

  return hashStr;
}

/**
 * Computes Hamming distance between two binary hash strings
 */
export function hammingDistance(hash1: string, hash2: string): number {
  let dist = 0;
  const len = Math.min(hash1.length, hash2.length);
  for (let i = 0; i < len; i++) {
    if (hash1[i] !== hash2[i]) dist++;
  }
  return dist + Math.abs(hash1.length - hash2.length);
}

/**
 * Computes Masked Perceptual Hash (pHash) for both frames
 */
export function computeMaskedPHash(
  grayA: GrayImageData,
  grayB: GrayImageData,
  mask: Uint8Array
): PHashResult {
  const matrixA = resampleTo32x32(grayA, mask);
  const matrixB = resampleTo32x32(grayB, mask);

  const hashA = generatePHashFromMatrix(matrixA);
  const hashB = generatePHashFromMatrix(matrixB);

  const dist = hammingDistance(hashA, hashB);
  const similarity = Math.max(0, 1 - dist / 64);

  return {
    hashA,
    hashB,
    hammingDistance: dist,
    similarity,
  };
}
