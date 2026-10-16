/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { ImageUploader } from './components/ImageUploader';
import { SubtitleMaskConfig } from './components/SubtitleMaskConfig';
import { ResultsOverview } from './components/ResultsOverview';
import { VisualComparison } from './components/VisualComparison';
import { MetricsBreakdown } from './components/MetricsBreakdown';
import { ThresholdSettingsModal } from './components/ThresholdSettingsModal';
import { VideoExtractModal } from './components/VideoExtractModal';
import {
  ComparisonResult,
  ImageFrameData,
  PresetSample,
  SubtitleConfig,
  ThresholdConfig,
} from './types/comparison';
import {
  compareFrames,
  DEFAULT_SUBTITLE_CONFIG,
  DEFAULT_THRESHOLDS,
} from './algorithms/comparator';
import { getPresetSamples } from './data/presetSamples';
import {
  Loader2,
  AlertCircle,
  Copy,
  Check,
  Download,
  Info,
  Layers,
  Sparkles,
} from 'lucide-react';

export default function App() {
  const [presets, setPresets] = useState<PresetSample[]>([]);
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);

  const [frameA, setFrameA] = useState<ImageFrameData | null>(null);
  const [frameB, setFrameB] = useState<ImageFrameData | null>(null);

  const [subtitleConfig, setSubtitleConfig] = useState<SubtitleConfig>(DEFAULT_SUBTITLE_CONFIG);
  const [thresholds, setThresholds] = useState<ThresholdConfig>(DEFAULT_THRESHOLDS);

  const [result, setResult] = useState<ComparisonResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  const [showMaskPreview, setShowMaskPreview] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [copiedReport, setCopiedReport] = useState(false);

  // Initialize presets on mount and auto-load preset 1 for immediate live view
  useEffect(() => {
    try {
      const sampleList = getPresetSamples();
      setPresets(sampleList);
      if (sampleList.length > 0) {
        const firstPreset = sampleList[0];
        setSelectedPresetId(firstPreset.id);
        setFrameA({
          id: 'frameA',
          name: `${firstPreset.title} - 帧 A`,
          dataUrl: firstPreset.frameAUrl,
          width: 640,
          height: 360,
          aspectRatio: 1.78,
        });
        setFrameB({
          id: 'frameB',
          name: `${firstPreset.title} - 帧 B`,
          dataUrl: firstPreset.frameBUrl,
          width: 640,
          height: 360,
          aspectRatio: 1.78,
        });
      }
    } catch (err) {
      console.error('初始化示例数据失败:', err);
    }
  }, []);

  // Global Clipboard paste listener (Ctrl+V anywhere in page)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          const file = items[i].getAsFile();
          if (!file) continue;

          const reader = new FileReader();
          reader.onload = (event) => {
            const dataUrl = event.target?.result as string;
            const img = new Image();
            img.onload = () => {
              const frameData: ImageFrameData = {
                id: !frameA ? 'frameA' : 'frameB',
                name: `剪贴板粘贴截图_${Date.now()}`,
                dataUrl,
                width: img.naturalWidth,
                height: img.naturalHeight,
                aspectRatio: Number((img.naturalWidth / img.naturalHeight).toFixed(2)),
              };

              if (!frameA) {
                setFrameA(frameData);
              } else {
                setFrameB(frameData);
              }
              setSelectedPresetId(null);
            };
            img.src = dataUrl;
          };
          reader.readAsDataURL(file);
          break;
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [frameA]);

  // Run algorithmic comparison whenever frameA, frameB, subtitleConfig, or thresholds change
  const runComparison = useCallback(async () => {
    if (!frameA || !frameB) {
      setResult(null);
      return;
    }

    setIsAnalyzing(true);
    setAnalysisError(null);

    try {
      const res = await compareFrames(
        frameA.dataUrl,
        frameB.dataUrl,
        subtitleConfig,
        thresholds
      );
      setResult(res);
    } catch (err) {
      console.error('算法比对失败:', err);
      setAnalysisError(err instanceof Error ? err.message : '图像算法计算出错');
    } finally {
      setIsAnalyzing(false);
    }
  }, [frameA, frameB, subtitleConfig, thresholds]);

  useEffect(() => {
    runComparison();
  }, [runComparison]);

  // Preset selection handler
  const handleSelectPreset = (preset: PresetSample) => {
    setSelectedPresetId(preset.id);
    setFrameA({
      id: 'frameA',
      name: `${preset.title} - 帧 A`,
      dataUrl: preset.frameAUrl,
      width: 640,
      height: 360,
      aspectRatio: 1.78,
    });
    setFrameB({
      id: 'frameB',
      name: `${preset.title} - 帧 B`,
      dataUrl: preset.frameBUrl,
      width: 640,
      height: 360,
      aspectRatio: 1.78,
    });
  };

  const handleSwapFrames = () => {
    if (!frameA || !frameB) return;
    const tempA = { ...frameA, id: 'frameB' as const };
    const tempB = { ...frameB, id: 'frameA' as const };
    setFrameA(tempB);
    setFrameB(tempA);
  };

  const handleClearFrame = (id: 'frameA' | 'frameB') => {
    if (id === 'frameA') setFrameA(null);
    if (id === 'frameB') setFrameB(null);
    setSelectedPresetId(null);
  };

  const handleResetAll = () => {
    setFrameA(null);
    setFrameB(null);
    setResult(null);
    setSelectedPresetId(null);
  };

  const handleCopyReport = () => {
    if (!result) return;
    const reportText = `【FrameMatch 视频关键帧比对报告】
• 总体相似度: ${result.overallSimilarity}%
• 算法置信度: ${result.confidence}%
• 是否同一连续镜头: ${result.isSameShot ? '是 (同一连续镜头)' : '否 (切镜或非连续)'}
• 是否属于相同场景: ${result.isSameScene ? '是 (同场景)' : '否 (不同场景)'}
• 结论描述: ${result.verdictDescription}
• 技术指标:
  - SSIM 结构相似度: ${(result.metrics.ssim * 100).toFixed(1)}%
  - HSV 色彩分布相关度: ${(result.metrics.colorHistogramHsv * 100).toFixed(1)}%
  - 边缘梯度相干度: ${(result.metrics.edgeGradientSim * 100).toFixed(1)}%
  - pHash 汉明距离: ${result.metrics.phashDistance}/64 (相似度 ${(result.metrics.phashSimilarity * 100).toFixed(1)}%)
  - 排除字幕区域占比: ${result.metrics.maskedPixelPercentageA}%
• 耗时: ${result.processingTimeMs}ms`;

    navigator.clipboard.writeText(reportText);
    setCopiedReport(true);
    setTimeout(() => setCopiedReport(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500/30">
      {/* Top Navigation */}
      <Header
        presets={presets}
        selectedPresetId={selectedPresetId}
        onSelectPreset={handleSelectPreset}
        onOpenVideoExtractor={() => setIsVideoModalOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onReset={handleResetAll}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Notice Banner if analyzing */}
        {isAnalyzing && (
          <div className="bg-indigo-950/40 border border-indigo-500/30 rounded-xl p-3 flex items-center justify-center gap-2 text-indigo-300 text-xs animate-pulse">
            <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
            <span>计算机视觉算法正在提取高频边缘、HSV色彩直方图及SSIM空间特征...</span>
          </div>
        )}

        {/* Error notification */}
        {analysisError && (
          <div className="bg-rose-950/40 border border-rose-500/40 rounded-xl p-3 flex items-center gap-2 text-rose-300 text-xs">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>算法计算异常: {analysisError}</span>
          </div>
        )}

        {/* Dual Upload Zone */}
        <ImageUploader
          frameA={frameA}
          frameB={frameB}
          onFrameLoaded={(id, data) => {
            if (id === 'frameA') setFrameA(data);
            else setFrameB(data);
            setSelectedPresetId(null);
          }}
          onBatchFramesLoaded={(dataA, dataB) => {
            setFrameA(dataA);
            setFrameB(dataB);
            setSelectedPresetId(null);
          }}
          onSwapFrames={handleSwapFrames}
          onClearFrame={handleClearFrame}
        />

        {/* Subtitle Mask Configuration Panel */}
        <SubtitleMaskConfig
          config={subtitleConfig}
          onChange={(newConf) => setSubtitleConfig(newConf)}
          showMaskPreview={showMaskPreview}
          onToggleMaskPreview={() => setShowMaskPreview(!showMaskPreview)}
          maskedRatio={result?.metrics.maskedPixelPercentageA}
        />

        {/* Results Section */}
        {result && frameA && frameB ? (
          <div className="space-y-6 animate-fadeIn">
            {/* Header of results & copy report button */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
                  判定分析结果
                </h2>
              </div>
              <button
                onClick={handleCopyReport}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium transition-colors"
              >
                {copiedReport ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-300">已复制诊断报告</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-indigo-400" />
                    <span>复制诊断结果报告</span>
                  </>
                )}
              </button>
            </div>

            {/* Verdict Cards & Rationale */}
            <ResultsOverview result={result} />

            {/* Interactive Visual Comparison */}
            <VisualComparison
              frameA={frameA}
              frameB={frameB}
              result={result}
              showSubtitleMaskOverlay={showMaskPreview}
            />

            {/* Mathematical Metrics Breakdown */}
            <MetricsBreakdown metrics={result.metrics} thresholds={thresholds} />
          </div>
        ) : (
          !frameA || !frameB ? (
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 mx-auto flex items-center justify-center">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-200">
                请先上传两张视频关键帧图片
              </h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                您可以点击上方的「快速示例」即时载入预置影视帧，或者通过剪贴板截图粘贴（Ctrl+V）、拖拽本地文件开始分析。
              </p>
            </div>
          ) : null
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-900/60 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-wrap items-center justify-between gap-2">
          <span>
            FrameMatch 视频关键帧图像相似度引擎 · 纯客户端轻量级精准算法（无大模型API调用）
          </span>
          <span className="text-[11px] text-slate-600">
            支持 SSIM · 空间 HSV 颜色巴氏距离 · 64-bit DCT pHash · Sobel 梯度
          </span>
        </div>
      </footer>

      {/* Settings Modal */}
      <ThresholdSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        thresholds={thresholds}
        onChange={(newTh) => setThresholds(newTh)}
      />

      {/* Video Scrub Extractor Modal */}
      <VideoExtractModal
        isOpen={isVideoModalOpen}
        onClose={() => setIsVideoModalOpen(false)}
        onSetFrameA={(data) => {
          setFrameA(data);
          setSelectedPresetId(null);
        }}
        onSetFrameB={(data) => {
          setFrameB(data);
          setSelectedPresetId(null);
        }}
      />
    </div>
  );
}
