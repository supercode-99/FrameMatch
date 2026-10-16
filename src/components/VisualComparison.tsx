import React, { useState, useEffect, useRef } from 'react';
import {
  SlidersHorizontal,
  Flame,
  Layers,
  Columns,
  Play,
  Pause,
  Eye,
  Shield,
  HelpCircle,
} from 'lucide-react';
import { ComparisonResult, ImageFrameData } from '../types/comparison';

interface VisualComparisonProps {
  frameA: ImageFrameData;
  frameB: ImageFrameData;
  result: ComparisonResult;
  showSubtitleMaskOverlay: boolean;
}

export const VisualComparison: React.FC<VisualComparisonProps> = ({
  frameA,
  frameB,
  result,
  showSubtitleMaskOverlay,
}) => {
  const [viewMode, setViewMode] = useState<'split' | 'heatmap' | 'blink' | 'side' | 'mask'>('split');
  const [sliderPos, setSliderPos] = useState(50); // 0 to 100%
  const [isBlinking, setIsBlinking] = useState(false);
  const [blinkActiveFrame, setBlinkActiveFrame] = useState<'A' | 'B'>('A');
  const [blinkSpeedMs, setBlinkSpeedMs] = useState(400);

  // Blink interval timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (viewMode === 'blink' && isBlinking) {
      timer = setInterval(() => {
        setBlinkActiveFrame((prev) => (prev === 'A' ? 'B' : 'A'));
      }, blinkSpeedMs);
    }
    return () => clearInterval(timer);
  }, [viewMode, isBlinking, blinkSpeedMs]);

  // Split slider drag handling
  const containerRef = useRef<HTMLDivElement>(null);
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (viewMode !== 'split' || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    setSliderPos((x / rect.width) * 100);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (viewMode !== 'split' || !containerRef.current || e.touches.length === 0) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, e.touches[0].clientX - rect.left));
    setSliderPos((x / rect.width) * 100);
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm space-y-4">
      {/* Tab Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-200">画面深度视觉比对</span>
          <span className="text-xs text-slate-500">
            (交互式卷帘 / 特征差异热力图 / 视频频闪)
          </span>
        </div>

        {/* View mode toggle buttons */}
        <div className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-lg border border-slate-700/60">
          <button
            onClick={() => setViewMode('split')}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded transition-colors ${
              viewMode === 'split'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>滑块卷帘</span>
          </button>

          <button
            onClick={() => setViewMode('heatmap')}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded transition-colors ${
              viewMode === 'heatmap'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-amber-300" />
            <span>差异热力图</span>
          </button>

          <button
            onClick={() => {
              setViewMode('blink');
              setIsBlinking(true);
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded transition-colors ${
              viewMode === 'blink'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-cyan-300" />
            <span>交替闪烁</span>
          </button>

          <button
            onClick={() => setViewMode('mask')}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded transition-colors ${
              viewMode === 'mask'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Shield className="w-3.5 h-3.5 text-emerald-300" />
            <span>字幕屏蔽区</span>
          </button>

          <button
            onClick={() => setViewMode('side')}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded transition-colors ${
              viewMode === 'side'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Columns className="w-3.5 h-3.5" />
            <span>双屏并排</span>
          </button>
        </div>
      </div>

      {/* Main Display Area */}
      <div className="relative aspect-video max-h-[500px] w-full bg-black/80 rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center select-none">
        {/* MODE 1: SPLIT SLIDER */}
        {viewMode === 'split' && (
          <div
            ref={containerRef}
            onMouseMove={handleMouseMove}
            onTouchMove={handleTouchMove}
            className="relative w-full h-full cursor-ew-resize overflow-hidden flex items-center justify-center"
          >
            {/* Base Image B (Right side) */}
            <img
              src={frameB.dataUrl}
              alt="Frame B"
              className="absolute inset-0 w-full h-full object-contain pointer-events-none"
            />

            {/* Overlaid Image A clipped to sliderPos */}
            <div
              className="absolute inset-0 overflow-hidden pointer-events-none"
              style={{ width: `${sliderPos}%` }}
            >
              <img
                src={frameA.dataUrl}
                alt="Frame A"
                className="absolute inset-0 w-full h-full object-contain"
                style={{
                  // Keep the image aligned to the full container
                  width: containerRef.current?.clientWidth || '100%',
                  maxWidth: 'none',
                }}
              />
            </div>

            {/* Divider Line */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)] pointer-events-none"
              style={{ left: `${sliderPos}%` }}
            >
              <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-slate-900 border-2 border-white shadow-lg flex items-center justify-center text-white">
                <SlidersHorizontal className="w-4 h-4" />
              </div>
            </div>

            {/* Frame Labels */}
            <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur px-2 py-1 rounded text-xs font-semibold text-indigo-300 border border-indigo-500/30">
              左侧：帧 A
            </div>
            <div className="absolute top-3 right-3 bg-slate-900/80 backdrop-blur px-2 py-1 rounded text-xs font-semibold text-cyan-300 border border-cyan-500/30">
              右侧：帧 B
            </div>
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-slate-950/80 px-3 py-1 rounded-full text-[11px] text-slate-300 border border-slate-800">
              左右拖动或滑动以对比细微差异
            </div>
          </div>
        )}

        {/* MODE 2: HEATMAP */}
        {viewMode === 'heatmap' && (
          <div className="relative w-full h-full flex items-center justify-center bg-black">
            {result.diffHeatmapUrl ? (
              <img
                src={result.diffHeatmapUrl}
                alt="Difference Heatmap"
                className="max-h-full max-w-full object-contain"
              />
            ) : (
              <div className="text-slate-400 text-xs">正在渲染热力图...</div>
            )}

            {/* Color Legend */}
            <div className="absolute bottom-3 left-4 right-4 bg-slate-950/90 backdrop-blur-md p-2.5 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-300">色彩差异色谱：</span>
                <div className="h-3 w-40 rounded-full bg-gradient-to-r from-blue-600 via-green-400 via-yellow-400 to-rose-600 border border-white/20" />
                <div className="flex justify-between w-40 text-[10px] text-slate-400">
                  <span>一致 (静止)</span>
                  <span>中度变动</span>
                  <span>显著剧变</span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-[11px] text-slate-300">
                <div className="w-3.5 h-3.5 rounded bg-purple-900 border border-purple-400/50" />
                <span>紫色条纹区域 = 算法排除的字幕区域（不计入差异）</span>
              </div>
            </div>
          </div>
        )}

        {/* MODE 3: BLINK */}
        {viewMode === 'blink' && (
          <div className="relative w-full h-full flex items-center justify-center bg-black">
            <img
              src={blinkActiveFrame === 'A' ? frameA.dataUrl : frameB.dataUrl}
              alt="Blink Active Frame"
              className="max-h-full max-w-full object-contain"
            />

            {/* Indicator Badge */}
            <div className="absolute top-3 left-3 bg-slate-900/90 backdrop-blur px-3 py-1.5 rounded-lg border border-slate-700 flex items-center gap-2 text-xs font-bold text-white shadow-lg">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  blinkActiveFrame === 'A' ? 'bg-indigo-400' : 'bg-cyan-400'
                }`}
              />
              <span>当前显示：{blinkActiveFrame === 'A' ? '帧 A (基准)' : '帧 B (对比)'}</span>
            </div>

            {/* Blink Controls */}
            <div className="absolute bottom-3 bg-slate-950/90 backdrop-blur px-4 py-2 rounded-xl border border-slate-800 flex items-center gap-4 text-xs">
              <button
                onClick={() => setIsBlinking(!isBlinking)}
                className="flex items-center gap-1.5 px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded font-medium"
              >
                {isBlinking ? (
                  <>
                    <Pause className="w-3.5 h-3.5" /> 暂停闪烁
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5" /> 开始交替
                  </>
                )}
              </button>

              <div className="flex items-center gap-2 text-slate-300">
                <span>闪烁频率:</span>
                <input
                  type="range"
                  min={150}
                  max={800}
                  step={50}
                  value={blinkSpeedMs}
                  onChange={(e) => setBlinkSpeedMs(Number(e.target.value))}
                  className="w-24 accent-indigo-500 cursor-pointer"
                />
                <span className="font-mono text-indigo-400 w-12 text-right">{blinkSpeedMs}ms</span>
              </div>
            </div>
          </div>
        )}

        {/* MODE 4: SUBTITLE MASK OVERLAY */}
        {viewMode === 'mask' && (
          <div className="relative w-full h-full grid grid-cols-2 gap-2 p-2 bg-black">
            <div className="relative flex items-center justify-center overflow-hidden rounded bg-slate-950">
              <img
                src={result.maskOverlayUrlA || frameA.dataUrl}
                alt="Mask A"
                className="max-h-full max-w-full object-contain"
              />
              <span className="absolute top-2 left-2 px-2 py-0.5 bg-slate-900/80 text-[10px] text-indigo-300 rounded font-semibold">
                帧 A 屏蔽示意 (红色区域已剔除)
              </span>
            </div>
            <div className="relative flex items-center justify-center overflow-hidden rounded bg-slate-950">
              <img
                src={result.maskOverlayUrlB || frameB.dataUrl}
                alt="Mask B"
                className="max-h-full max-w-full object-contain"
              />
              <span className="absolute top-2 left-2 px-2 py-0.5 bg-slate-900/80 text-[10px] text-cyan-300 rounded font-semibold">
                帧 B 屏蔽示意 (红色区域已剔除)
              </span>
            </div>
          </div>
        )}

        {/* MODE 5: SIDE BY SIDE */}
        {viewMode === 'side' && (
          <div className="w-full h-full grid grid-cols-2 gap-2 p-2 bg-black">
            <div className="relative flex items-center justify-center overflow-hidden rounded bg-slate-950">
              <img
                src={frameA.dataUrl}
                alt="Frame A"
                className="max-h-full max-w-full object-contain"
              />
              <span className="absolute top-2 left-2 px-2 py-0.5 bg-slate-900/80 text-[10px] text-indigo-300 rounded font-semibold">
                帧 A (基准)
              </span>
            </div>
            <div className="relative flex items-center justify-center overflow-hidden rounded bg-slate-950">
              <img
                src={frameB.dataUrl}
                alt="Frame B"
                className="max-h-full max-w-full object-contain"
              />
              <span className="absolute top-2 left-2 px-2 py-0.5 bg-slate-900/80 text-[10px] text-cyan-300 rounded font-semibold">
                帧 B (对比)
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
