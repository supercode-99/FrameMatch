export interface ImageFrameData {
  id: 'frameA' | 'frameB';
  name: string;
  dataUrl: string;
  width: number;
  height: number;
  aspectRatio: number;
}

export interface SubtitleConfig {
  mode: 'auto' | 'bottom_percentage' | 'custom' | 'none';
  bottomPercent: number; // e.g. 18 = bottom 18%
  topPercent: number;    // e.g. 0 = top 0%
  autoDetectThreshold: number; // threshold for text edge detection
  applyMask: boolean;
}

export interface ThresholdConfig {
  shotSimilarityThreshold: number; // e.g. 78% (above this is same shot)
  shotSSIMThreshold: number;        // e.g. 0.70
  sceneSimilarityThreshold: number; // e.g. 55% (above this is same scene)
  sceneColorThreshold: number;      // e.g. 0.60
  weights: {
    ssim: number;       // default: 0.35
    color: number;      // default: 0.30
    edge: number;       // default: 0.20
    phash: number;      // default: 0.15
  };
}

export interface DetailedMetrics {
  ssim: number;                // 0 to 1
  colorHistogramHsv: number;   // 0 to 1 (Spatial HSV correlation)
  edgeGradientSim: number;     // 0 to 1 (Sobel gradient orientation & magnitude)
  phashSimilarity: number;     // 0 to 1 (1 - hammingDist / 64)
  phashDistance: number;       // 0 to 64
  luminanceDiff: number;       // average delta Y
  dominantColorDist: number;   // 0 to 1 distance in dominant palette
  maskedPixelPercentageA: number;
  maskedPixelPercentageB: number;
}

export interface ComparisonResult {
  overallSimilarity: number; // 0 to 100 (%)
  confidence: number;        // 0 to 100 (%)
  isSameShot: boolean;       // 是否同一镜头
  isSameScene: boolean;      // 是否相同场景
  verdictTitle: string;
  verdictDescription: string;
  reasoning: string[];
  metrics: DetailedMetrics;
  processingTimeMs: number;
  detectedSubtitleBoxA?: { yStart: number; height: number };
  detectedSubtitleBoxB?: { yStart: number; height: number };
  diffHeatmapUrl?: string;
  maskOverlayUrlA?: string;
  maskOverlayUrlB?: string;
}

export interface PresetSample {
  id: string;
  title: string;
  category: 'same_shot' | 'same_scene_different_shot' | 'different_scene' | 'motion_shot';
  description: string;
  expectedShot: boolean;
  expectedScene: boolean;
  frameAUrl: string;
  frameBUrl: string;
}
