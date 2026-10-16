import React from 'react';
import { X, RotateCcw, Sliders, Check } from 'lucide-react';
import { ThresholdConfig } from '../types/comparison';
import { DEFAULT_THRESHOLDS } from '../algorithms/comparator';

interface ThresholdSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  thresholds: ThresholdConfig;
  onChange: (newThresholds: ThresholdConfig) => void;
}

export const ThresholdSettingsModal: React.FC<ThresholdSettingsModalProps> = ({
  isOpen,
  onClose,
  thresholds,
  onChange,
}) => {
  if (!isOpen) return null;

  const handleReset = () => {
    onChange(DEFAULT_THRESHOLDS);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-indigo-400" />
            <h3 className="text-base font-bold text-white">算法门限与加权参数设置</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5 overflow-y-auto">
          <p className="text-xs text-slate-400">
            根据不同类型的影视作品（如快速剪辑MV、长镜头纪录片或高动态动作电影）可微调判定灵敏度门限。
          </p>

          {/* Section 1: Shot Continuity */}
          <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-3.5 space-y-3">
            <div className="text-xs font-semibold text-slate-200">
              连续镜头判定条件 (Same Shot Criteria)
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs text-slate-300">
                <span>镜头综合相似度门限</span>
                <span className="font-mono text-indigo-400 font-bold">
                  {thresholds.shotSimilarityThreshold}%
                </span>
              </div>
              <input
                type="range"
                min={60}
                max={90}
                step={1}
                value={thresholds.shotSimilarityThreshold}
                onChange={(e) =>
                  onChange({
                    ...thresholds,
                    shotSimilarityThreshold: Number(e.target.value),
                  })
                }
                className="w-full accent-indigo-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>60% (宽容，动作微运镜)</span>
                <span>74% (标准影视推荐)</span>
                <span>90% (极严苛近乎静止)</span>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs text-slate-300">
                <span>SSIM 结构布局门限</span>
                <span className="font-mono text-indigo-400 font-bold">
                  {(thresholds.shotSSIMThreshold * 100).toFixed(0)}%
                </span>
              </div>
              <input
                type="range"
                min={0.5}
                max={0.88}
                step={0.02}
                value={thresholds.shotSSIMThreshold}
                onChange={(e) =>
                  onChange({
                    ...thresholds,
                    shotSSIMThreshold: Number(e.target.value),
                  })
                }
                className="w-full accent-indigo-500 cursor-pointer"
              />
            </div>
          </div>

          {/* Section 2: Scene Continuity */}
          <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-3.5 space-y-3">
            <div className="text-xs font-semibold text-slate-200">
              相同场景判定条件 (Same Scene Criteria)
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs text-slate-300">
                <span>场景色彩空间相关度门限</span>
                <span className="font-mono text-cyan-400 font-bold">
                  {(thresholds.sceneColorThreshold * 100).toFixed(0)}%
                </span>
              </div>
              <input
                type="range"
                min={0.45}
                max={0.8}
                step={0.02}
                value={thresholds.sceneColorThreshold}
                onChange={(e) =>
                  onChange({
                    ...thresholds,
                    sceneColorThreshold: Number(e.target.value),
                  })
                }
                className="w-full accent-cyan-500 cursor-pointer"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs text-slate-300">
                <span>场景综合相似度门限</span>
                <span className="font-mono text-cyan-400 font-bold">
                  {thresholds.sceneSimilarityThreshold}%
                </span>
              </div>
              <input
                type="range"
                min={40}
                max={70}
                step={1}
                value={thresholds.sceneSimilarityThreshold}
                onChange={(e) =>
                  onChange({
                    ...thresholds,
                    sceneSimilarityThreshold: Number(e.target.value),
                  })
                }
                className="w-full accent-cyan-500 cursor-pointer"
              />
            </div>
          </div>

          {/* Section 3: Feature Weights */}
          <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-3.5 space-y-2.5">
            <div className="text-xs font-semibold text-slate-200">
              综合相似度算法权重配比 (Weights)
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">
                  SSIM 结构权重: {(thresholds.weights.ssim * 100).toFixed(0)}%
                </label>
                <input
                  type="range"
                  min={0.1}
                  max={0.6}
                  step={0.05}
                  value={thresholds.weights.ssim}
                  onChange={(e) =>
                    onChange({
                      ...thresholds,
                      weights: { ...thresholds.weights, ssim: Number(e.target.value) },
                    })
                  }
                  className="w-full accent-indigo-500 cursor-pointer"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">
                  色彩直方图权重: {(thresholds.weights.color * 100).toFixed(0)}%
                </label>
                <input
                  type="range"
                  min={0.1}
                  max={0.6}
                  step={0.05}
                  value={thresholds.weights.color}
                  onChange={(e) =>
                    onChange({
                      ...thresholds,
                      weights: { ...thresholds.weights, color: Number(e.target.value) },
                    })
                  }
                  className="w-full accent-cyan-500 cursor-pointer"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">
                  边缘梯度权重: {(thresholds.weights.edge * 100).toFixed(0)}%
                </label>
                <input
                  type="range"
                  min={0.05}
                  max={0.4}
                  step={0.05}
                  value={thresholds.weights.edge}
                  onChange={(e) =>
                    onChange({
                      ...thresholds,
                      weights: { ...thresholds.weights, edge: Number(e.target.value) },
                    })
                  }
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">
                  pHash 哈希权重: {(thresholds.weights.phash * 100).toFixed(0)}%
                </label>
                <input
                  type="range"
                  min={0.05}
                  max={0.3}
                  step={0.05}
                  value={thresholds.weights.phash}
                  onChange={(e) =>
                    onChange({
                      ...thresholds,
                      weights: { ...thresholds.weights, phash: Number(e.target.value) },
                    })
                  }
                  className="w-full accent-purple-500 cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-400 hover:text-white transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>恢复默认推荐参数</span>
          </button>
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition-colors"
          >
            <Check className="w-4 h-4" />
            <span>保存并生效</span>
          </button>
        </div>
      </div>
    </div>
  );
};
