import React from 'react';
import { Film, Clapperboard, Sliders, Video, RotateCcw } from 'lucide-react';
import { PresetSample } from '../types/comparison';

interface HeaderProps {
  presets: PresetSample[];
  selectedPresetId: string | null;
  onSelectPreset: (preset: PresetSample) => void;
  onOpenVideoExtractor: () => void;
  onOpenSettings: () => void;
  onReset: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  presets,
  selectedPresetId,
  onSelectPreset,
  onOpenVideoExtractor,
  onOpenSettings,
  onReset,
}) => {
  return (
    <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-blue-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white">
            <Film className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-white tracking-tight">FrameMatch</h1>
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                计算机视觉算法引擎
              </span>
            </div>
            <p className="text-xs text-slate-400">
              视频关键帧图像相似度分析 · 连续镜头与同场景智能识别 · 消除字幕干扰
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center flex-wrap gap-2.5">
          {/* Preset Selector */}
          <div className="flex items-center gap-1.5 bg-slate-800/80 border border-slate-700/70 rounded-lg p-1">
            <span className="text-xs text-slate-400 px-2 flex items-center gap-1 font-medium">
              <Clapperboard className="w-3.5 h-3.5 text-amber-400" />
              快速示例:
            </span>
            <div className="flex items-center gap-1">
              {presets.map((preset, idx) => (
                <button
                  key={preset.id}
                  onClick={() => onSelectPreset(preset)}
                  className={`text-xs px-2.5 py-1 rounded transition-all font-medium ${
                    selectedPresetId === preset.id
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
                  }`}
                  title={preset.description}
                >
                  示例 {idx + 1}
                </button>
              ))}
            </div>
          </div>

          {/* Video Scrub Extractor */}
          <button
            onClick={onOpenVideoExtractor}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors"
            title="从本地视频文件中截取任意两帧"
          >
            <Video className="w-3.5 h-3.5 text-cyan-400" />
            <span>提取视频帧</span>
          </button>

          {/* Algorithm Settings */}
          <button
            onClick={onOpenSettings}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors"
            title="调整算法门限与加权参数"
          >
            <Sliders className="w-3.5 h-3.5 text-indigo-400" />
            <span>算法参数</span>
          </button>

          {/* Reset */}
          <button
            onClick={onReset}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
            title="清空重置"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
