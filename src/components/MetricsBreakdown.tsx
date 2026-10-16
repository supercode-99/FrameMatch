import React from 'react';
import {
  BarChart3,
  Hash,
  Palette,
  Compass,
  Sun,
  ShieldCheck,
  CheckCircle,
  HelpCircle,
} from 'lucide-react';
import { DetailedMetrics, ThresholdConfig } from '../types/comparison';

interface MetricsBreakdownProps {
  metrics: DetailedMetrics;
  thresholds: ThresholdConfig;
}

export const MetricsBreakdown: React.FC<MetricsBreakdownProps> = ({
  metrics,
  thresholds,
}) => {
  const {
    ssim,
    colorHistogramHsv,
    edgeGradientSim,
    phashSimilarity,
    phashDistance,
    luminanceDiff,
    maskedPixelPercentageA,
  } = metrics;

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-indigo-400" />
          <h3 className="text-sm font-semibold text-slate-200">
            算法多维技术指标解析 (Mathematical Metrics)
          </h3>
        </div>
        <span className="text-xs text-slate-500">
          剔除字幕干扰后的纯净画面数据
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Metric 1: SSIM */}
        <div className="bg-slate-800/50 border border-slate-700/60 rounded-xl p-3.5 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-300 flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-indigo-400" />
              SSIM 结构相似度
            </span>
            <span className="font-mono font-bold text-white text-sm">
              {(ssim * 100).toFixed(1)}%
            </span>
          </div>
          <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-indigo-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${Math.min(100, ssim * 100)}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-400 leading-snug">
            测量轮廓与空间布局稳定性。连续镜头门限 ≥ {(thresholds.shotSSIMThreshold * 100).toFixed(0)}%。
          </p>
        </div>

        {/* Metric 2: HSV Color */}
        <div className="bg-slate-800/50 border border-slate-700/60 rounded-xl p-3.5 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-300 flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-cyan-400" />
              HSV 空间色彩相关度
            </span>
            <span className="font-mono font-bold text-white text-sm">
              {(colorHistogramHsv * 100).toFixed(1)}%
            </span>
          </div>
          <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-cyan-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${Math.min(100, colorHistogramHsv * 100)}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-400 leading-snug">
            评估环境光温、物理材质及色调连续性。同场景门限 ≥ {(thresholds.sceneColorThreshold * 100).toFixed(0)}%。
          </p>
        </div>

        {/* Metric 3: Edge Gradient */}
        <div className="bg-slate-800/50 border border-slate-700/60 rounded-xl p-3.5 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-300 flex items-center gap-1.5">
              <Sun className="w-3.5 h-3.5 text-amber-400" />
              Sobel 梯度边缘相干度
            </span>
            <span className="font-mono font-bold text-white text-sm">
              {(edgeGradientSim * 100).toFixed(1)}%
            </span>
          </div>
          <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-amber-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${Math.min(100, edgeGradientSim * 100)}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-400 leading-snug">
            8方向梯度幅值与朝向直方图，衡量背景与物体的建筑线条一致性。
          </p>
        </div>

        {/* Metric 4: pHash */}
        <div className="bg-slate-800/50 border border-slate-700/60 rounded-xl p-3.5 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-300 flex items-center gap-1.5">
              <Hash className="w-3.5 h-3.5 text-purple-400" />
              pHash 频域感知哈希
            </span>
            <span className="font-mono font-bold text-white text-sm">
              {(phashSimilarity * 100).toFixed(1)}%
            </span>
          </div>
          <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-purple-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${Math.min(100, phashSimilarity * 100)}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-400 leading-snug">
            64位 DCT 频域离散余弦特征。汉明距离为 <span className="text-white font-mono">{phashDistance}</span>/64。
          </p>
        </div>
      </div>

      {/* Secondary diagnostic row */}
      <div className="bg-slate-950/40 rounded-lg p-3 border border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-2 text-slate-300">
          <span className="text-slate-500">平均亮度偏差 ΔY:</span>
          <span className="font-mono font-semibold text-white">
            {luminanceDiff.toFixed(1)} / 255
          </span>
          <span className="text-slate-500 text-[11px]">
            ({luminanceDiff < 15 ? '光照极度稳定' : luminanceDiff < 40 ? '光照轻微变动' : '光照显著改变'})
          </span>
        </div>

        <div className="flex items-center gap-2 text-slate-300">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-slate-500">剔除字幕面积:</span>
          <span className="font-mono font-semibold text-emerald-400">
            {maskedPixelPercentageA}%
          </span>
          <span className="text-slate-500 text-[11px]">(已完全移出计算权重)</span>
        </div>

        <div className="text-slate-400 text-[11px]">
          决策加权配比: SSIM {(thresholds.weights.ssim * 100).toFixed(0)}% · 色彩 {(thresholds.weights.color * 100).toFixed(0)}% · 边缘 {(thresholds.weights.edge * 100).toFixed(0)}% · pHash {(thresholds.weights.phash * 100).toFixed(0)}%
        </div>
      </div>
    </div>
  );
};
