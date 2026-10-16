import {
  ComparisonResult,
  DetailedMetrics,
  SubtitleConfig,
  ThresholdConfig,
} from '../types/comparison';
import {
  createSubtitleMask,
  getImageDataResized,
  loadImage,
  toGrayscale,
  unionMasks,
} from './imageUtils';
import { detectSubtitleBand } from './subtitleDetector';
import { computeMaskedSSIM } from './ssim';
import { computeMaskedColorHistogram } from './colorHistogram';
import { computeMaskedPHash } from './phash';
import { computeMaskedEdgeGradient } from './edgeGradient';
import { generateDifferenceHeatmapAndMasks } from './differenceHeatmap';

export const DEFAULT_SUBTITLE_CONFIG: SubtitleConfig = {
  mode: 'auto',
  bottomPercent: 18,
  topPercent: 0,
  autoDetectThreshold: 0.12,
  applyMask: true,
};

export const DEFAULT_THRESHOLDS: ThresholdConfig = {
  shotSimilarityThreshold: 74,
  shotSSIMThreshold: 0.68,
  sceneSimilarityThreshold: 52,
  sceneColorThreshold: 0.62,
  weights: {
    ssim: 0.35,
    color: 0.30,
    edge: 0.20,
    phash: 0.15,
  },
};

const ANALYSIS_WIDTH = 320;
const ANALYSIS_HEIGHT = 180; // Standard 16:9 ratio

/**
 * Primary comparison engine executing the full multi-dimensional algorithmic pipeline
 */
export async function compareFrames(
  imageSrcA: string,
  imageSrcB: string,
  subtitleConfig: SubtitleConfig = DEFAULT_SUBTITLE_CONFIG,
  thresholds: ThresholdConfig = DEFAULT_THRESHOLDS
): Promise<ComparisonResult> {
  const startTime = performance.now();

  // 1. Load images concurrently
  const [imgA, imgB] = await Promise.all([loadImage(imageSrcA), loadImage(imageSrcB)]);

  // 2. Render to standardized analysis resolution
  const imgDataA = getImageDataResized(imgA, ANALYSIS_WIDTH, ANALYSIS_HEIGHT);
  const imgDataB = getImageDataResized(imgB, ANALYSIS_WIDTH, ANALYSIS_HEIGHT);

  const grayA = toGrayscale(imgDataA);
  const grayB = toGrayscale(imgDataB);

  // 3. Subtitle detection and mask construction
  let detectedBoxA: { yStart: number; height: number } | undefined;
  let detectedBoxB: { yStart: number; height: number } | undefined;

  let maskA: Uint8Array;
  let maskB: Uint8Array;

  if (!subtitleConfig.applyMask || subtitleConfig.mode === 'none') {
    maskA = new Uint8Array(ANALYSIS_WIDTH * ANALYSIS_HEIGHT);
    maskB = new Uint8Array(ANALYSIS_WIDTH * ANALYSIS_HEIGHT);
  } else if (subtitleConfig.mode === 'bottom_percentage') {
    maskA = createSubtitleMask(ANALYSIS_WIDTH, ANALYSIS_HEIGHT, subtitleConfig.bottomPercent, subtitleConfig.topPercent);
    maskB = maskA;
  } else {
    // Auto or hybrid detection
    const bandA = detectSubtitleBand(grayA);
    const bandB = detectSubtitleBand(grayB);

    if (bandA.hasSubtitle) detectedBoxA = { yStart: bandA.yStart, height: bandA.height };
    if (bandB.hasSubtitle) detectedBoxB = { yStart: bandB.yStart, height: bandB.height };

    // Fall back to bottomPercent if auto-band was narrow or user has standard bottom cutoff
    const effectiveBottom = Math.max(subtitleConfig.bottomPercent, 14);
    maskA = createSubtitleMask(
      ANALYSIS_WIDTH,
      ANALYSIS_HEIGHT,
      effectiveBottom,
      subtitleConfig.topPercent,
      detectedBoxA
    );
    maskB = createSubtitleMask(
      ANALYSIS_WIDTH,
      ANALYSIS_HEIGHT,
      effectiveBottom,
      subtitleConfig.topPercent,
      detectedBoxB
    );
  }

  // Combine masks so subtitle in EITHER image is masked in both comparisons
  const combinedMask = unionMasks(maskA, maskB, ANALYSIS_WIDTH * ANALYSIS_HEIGHT);

  // Compute percentage of masked pixels
  let maskedPixelCount = 0;
  for (let i = 0; i < combinedMask.length; i++) {
    if (combinedMask[i] === 1) maskedPixelCount++;
  }
  const maskedRatio = maskedPixelCount / (ANALYSIS_WIDTH * ANALYSIS_HEIGHT);

  // 4. Run precision algorithms on unmasked image pixels
  const ssimResult = computeMaskedSSIM(grayA, grayB, combinedMask);
  const colorResult = computeMaskedColorHistogram(imgDataA, imgDataB, combinedMask);
  const phashResult = computeMaskedPHash(grayA, grayB, combinedMask);
  const edgeResult = computeMaskedEdgeGradient(grayA, grayB, combinedMask);

  // 5. Compute Weighted Overall Similarity
  const w = thresholds.weights;
  const totalWeight = w.ssim + w.color + w.edge + w.phash;

  const rawScore =
    (ssimResult.meanSSIM * w.ssim +
      colorResult.similarity * w.color +
      edgeResult.similarity * w.edge +
      phashResult.similarity * w.phash) /
    totalWeight;

  const overallSimilarity = Math.round(Math.min(100, Math.max(0, rawScore * 100)) * 10) / 10;

  // 6. Formulate Confidence Score
  // Confidence factors:
  // a) Agreement amongst the 4 independent features (low standard deviation => high confidence)
  // b) Mask coverage penalty if mask is excessively huge (> 35%)
  // c) Proximity to hard decision boundaries (if right on the edge of 74%, confidence slightly lowers)
  const metricValues = [
    ssimResult.meanSSIM,
    colorResult.similarity,
    edgeResult.similarity,
    phashResult.similarity,
  ];
  const metricMean = metricValues.reduce((a, b) => a + b, 0) / 4;
  const metricVariance =
    metricValues.reduce((acc, v) => acc + Math.pow(v - metricMean, 2), 0) / 4;
  const metricStdDev = Math.sqrt(metricVariance);

  let confidenceBase = 96 - metricStdDev * 28;
  if (maskedRatio > 0.35) {
    confidenceBase -= (maskedRatio - 0.35) * 20;
  }
  // Boundary uncertainty margin
  const distToShotCut = Math.abs(overallSimilarity - thresholds.shotSimilarityThreshold);
  const distToSceneCut = Math.abs(overallSimilarity - thresholds.sceneSimilarityThreshold);
  const minBoundaryDist = Math.min(distToShotCut, distToSceneCut);
  if (minBoundaryDist < 3.0) {
    confidenceBase -= (3.0 - minBoundaryDist) * 2.0;
  }

  const confidence = Math.round(Math.min(99, Math.max(70, confidenceBase)) * 10) / 10;

  // 7. Determine Same Shot & Same Scene
  // Same continuous shot requires:
  // - SSIM >= shotSSIMThreshold (structural layout preserved)
  // - Overall similarity >= shotSimilarityThreshold
  // - pHash distance <= 16 (perceptually cohesive)
  const isSameShot =
    ssimResult.meanSSIM >= thresholds.shotSSIMThreshold &&
    overallSimilarity >= thresholds.shotSimilarityThreshold &&
    phashResult.hammingDistance <= 16;

  // Same scene criteria:
  // - If it's already the same shot, it is guaranteed the same scene.
  // - Otherwise, if color palette & lighting atmosphere correlate strongly (>= sceneColorThreshold)
  //   AND overall similarity >= sceneSimilarityThreshold, it indicates different camera angle/cut
  //   within the same physical setting.
  const isSameScene =
    isSameShot ||
    (colorResult.similarity >= thresholds.sceneColorThreshold &&
      overallSimilarity >= thresholds.sceneSimilarityThreshold);

  // 8. Generate Visual Heatmaps & Overlays
  const visualMaps = generateDifferenceHeatmapAndMasks(
    imgDataA,
    imgDataB,
    combinedMask,
    ANALYSIS_WIDTH,
    ANALYSIS_HEIGHT
  );

  // 9. Synthesize Diagnostic Reasoning
  const reasoning: string[] = [];
  let verdictTitle = '';
  let verdictDescription = '';

  if (isSameShot && isSameScene) {
    verdictTitle = '同一连续镜头（Same Continuous Shot）';
    verdictDescription =
      '两帧图像具有极高的时间连续性、空间构图一致性与光照色彩连贯性，确认为同一摄像机连续拍摄的镜头片段。';
    reasoning.push(
      `【结构高度契合】SSIM结构相似度达 ${(ssimResult.meanSSIM * 100).toFixed(1)}%，空间主体轮廓与背景布局保持高度稳定。`
    );
    reasoning.push(
      `【色彩与光影连续】HSV空间分布相似度达 ${(colorResult.similarity * 100).toFixed(1)}%，平均亮度差仅 ${colorResult.averageLuminanceDiff.toFixed(1)}，环境光照无突变。`
    );
    reasoning.push(
      `【感知特征距离极低】pHash汉明距离为 ${phashResult.hammingDistance}/64（相似度 ${(phashResult.similarity * 100).toFixed(1)}%），指纹特征几乎完全重合。`
    );
  } else if (!isSameShot && isSameScene) {
    verdictTitle = '同场景不同镜头 / 机位切换（Same Scene, Cut Shot）';
    verdictDescription =
      '两帧图像属于同一场景环境，但机位角度或焦点发生了剪辑切换（例如正反打对话镜头、全景切特写、或运镜切分）。';
    reasoning.push(
      `【环境色调与光源高度一致】色彩空间相似度高达 ${(colorResult.similarity * 100).toFixed(1)}%，表明两帧处于相同的色温、材质与物理光照环境中。`
    );
    reasoning.push(
      `【结构布局存在剪辑跳跃】SSIM结构相似度为 ${(ssimResult.meanSSIM * 100).toFixed(1)}%（低于连续镜头门限 ${(thresholds.shotSSIMThreshold * 100).toFixed(0)}%），表明摄影机发生了明显的视角平移、切镜或构图重心重组。`
    );
    reasoning.push(
      `【边缘梯度关联】边缘特征相似度为 ${(edgeResult.similarity * 100).toFixed(1)}%，保持了同类环境的纹理基调。`
    );
  } else {
    verdictTitle = '不同场景与镜头（Different Scene & Shot）';
    verdictDescription =
      '两帧图像在色彩体系、光照环境及构图特征上均存在显著差异，属于不同时空或独立拍摄的场景。';
    reasoning.push(
      `【全局色调与光影断裂】色彩分布相似度仅 ${(colorResult.similarity * 100).toFixed(1)}%，两帧色调分布与环境主色存在根本性差异。`
    );
    reasoning.push(
      `【空间结构完全独立】SSIM结构相似度仅 ${(ssimResult.meanSSIM * 100).toFixed(1)}%，画面中不存在连续的空间锚点或背景重叠。`
    );
    reasoning.push(
      `【感知指纹差异巨大】pHash汉明距离达到 ${phashResult.hammingDistance}/64，频域特征不具备同一场景关联性。`
    );
  }

  // Subtitle Masking Reasoning
  if (subtitleConfig.applyMask && maskedRatio > 0.03) {
    reasoning.push(
      `【智能字幕过滤已生效】成功识别并屏蔽了底部约 ${(maskedRatio * 100).toFixed(1)}% 的字幕/横幅区域，消除了字幕文字变动或台词刷新对核心画面相似度的干扰。`
    );
  }

  const detailedMetrics: DetailedMetrics = {
    ssim: ssimResult.meanSSIM,
    colorHistogramHsv: colorResult.similarity,
    edgeGradientSim: edgeResult.similarity,
    phashSimilarity: phashResult.similarity,
    phashDistance: phashResult.hammingDistance,
    luminanceDiff: colorResult.averageLuminanceDiff,
    dominantColorDist: colorResult.dominantDistance,
    maskedPixelPercentageA: Math.round(maskedRatio * 1000) / 10,
    maskedPixelPercentageB: Math.round(maskedRatio * 1000) / 10,
  };

  const processingTimeMs = Math.round(performance.now() - startTime);

  return {
    overallSimilarity,
    confidence,
    isSameShot,
    isSameScene,
    verdictTitle,
    verdictDescription,
    reasoning,
    metrics: detailedMetrics,
    processingTimeMs,
    detectedSubtitleBoxA: detectedBoxA,
    detectedSubtitleBoxB: detectedBoxB,
    diffHeatmapUrl: visualMaps.diffHeatmapUrl,
    maskOverlayUrlA: visualMaps.maskOverlayUrlA,
    maskOverlayUrlB: visualMaps.maskOverlayUrlB,
  };
}
