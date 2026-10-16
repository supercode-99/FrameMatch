import React from 'react';
import { ShieldCheck, ShieldAlert, SlidersHorizontal, Info, Eye } from 'lucide-react';
import { SubtitleConfig } from '../types/comparison';

interface SubtitleMaskConfigProps {
  config: SubtitleConfig;
  onChange: (newConfig: SubtitleConfig) => void;
  showMaskPreview: boolean;
  onToggleMaskPreview: () => void;
  maskedRatio?: number;
}

export const SubtitleMaskConfig: React.FC<SubtitleMaskConfigProps> = ({
  config,
  onChange,
  showMaskPreview,
  onToggleMaskPreview,
  maskedRatio,
}) => {
  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm space-y-4">
      {/* Header and Master Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2.5">
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
              config.applyMask
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
            }`}
          >
            {config.applyMask ? (
              <ShieldCheck className="w-4 h-4" />
            ) : (
              <ShieldAlert className="w-4 h-4" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-slate-200">
                字幕区域抗干扰屏蔽
              </h3>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                  config.applyMask
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-slate-700 text-slate-400'
                }`}
              >
                {config.applyMask ? '已启用抗干扰' : '未屏蔽字幕'}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              精准剔除视频底部/顶部台词字幕文字，避免台词更迭对镜头结构相似度的误伤
            </p>
          </div>
        </div>

        {/* Action Toggles */}
        <div className="flex items-center gap-2">
          {/* Mask Visual Preview Toggle */}
          <button
            onClick={onToggleMaskPreview}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              showMaskPreview
                ? 'bg-indigo-600/30 border-indigo-500/50 text-indigo-300'
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>{showMaskPreview ? '隐藏遮罩范围' : '预览屏蔽范围'}</span>
          </button>

          {/* Master Enable/Disable */}
          <button
            onClick={() => onChange({ ...config, applyMask: !config.applyMask })}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              config.applyMask
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
            }`}
          >
            {config.applyMask ? '开启中' : '点击启用'}
          </button>
        </div>
      </div>

      {config.applyMask && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          {/* Mode Switch */}
          <div className="md:col-span-5 space-y-1.5">
            <label className="text-xs font-medium text-slate-300 flex items-center gap-1">
              <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-400" />
              检测策略
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onChange({ ...config, mode: 'auto' })}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border text-left transition-all ${
                  config.mode === 'auto'
                    ? 'bg-indigo-600/25 border-indigo-500 text-indigo-200'
                    : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="font-semibold">智能边缘自适应</div>
                <div className="text-[10px] text-slate-400">检测文本高频边缘条带</div>
              </button>
              <button
                type="button"
                onClick={() => onChange({ ...config, mode: 'bottom_percentage' })}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border text-left transition-all ${
                  config.mode === 'bottom_percentage'
                    ? 'bg-indigo-600/25 border-indigo-500 text-indigo-200'
                    : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="font-semibold">固定底部比例</div>
                <div className="text-[10px] text-slate-400">稳定屏蔽底部指定高度</div>
              </button>
            </div>
          </div>

          {/* Slider for Bottom Region */}
          <div className="md:col-span-4 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-slate-300">底部屏蔽比例</span>
              <span className="font-mono text-indigo-400 font-bold">
                {config.bottomPercent}% 画面高度
              </span>
            </div>
            <input
              type="range"
              min={8}
              max={32}
              step={1}
              value={config.bottomPercent}
              onChange={(e) =>
                onChange({ ...config, bottomPercent: Number(e.target.value) })
              }
              className="w-full accent-indigo-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>8% (紧凑单行)</span>
              <span>18% (标准影视)</span>
              <span>32% (多行/双语)</span>
            </div>
          </div>

          {/* Mask stats / Notice */}
          <div className="md:col-span-3 bg-slate-800/40 rounded-lg p-2.5 border border-slate-700/50 text-[11px] text-slate-300">
            <div className="flex items-center gap-1.5 text-slate-400 mb-1">
              <Info className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span>当前排除像素比例</span>
            </div>
            <div className="text-sm font-semibold text-emerald-400">
              {maskedRatio !== undefined ? `${maskedRatio}%` : `${config.bottomPercent}%`}
            </div>
            <p className="text-[10px] text-slate-500 mt-0.5">
              SSIM、色彩、哈希与边缘算法已完全跳过此范围
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
