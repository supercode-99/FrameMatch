import React from 'react';
import {
  Film,
  Clapperboard,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Activity,
  Layers,
  Sparkles,
  ShieldCheck,
  Clock,
} from 'lucide-react';
import { ComparisonResult } from '../types/comparison';

interface ResultsOverviewProps {
  result: ComparisonResult;
}

export const ResultsOverview: React.FC<ResultsOverviewProps> = ({ result }) => {
  const {
    overallSimilarity,
    confidence,
    isSameShot,
    isSameScene,
    verdictTitle,
    verdictDescription,
    reasoning,
    processingTimeMs,
  } = result;

  // Visual grade color for overall similarity
  const getSimColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10';
    if (score >= 55) return 'text-amber-400 border-amber-500/40 bg-amber-500/10';
    return 'text-rose-400 border-rose-500/40 bg-rose-500/10';
  };

  return (
    <div className="space-y-4">
      {/* 4 Key Decision Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Metric 1: Overall Similarity */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">综合图像相似度</span>
            <Activity className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="my-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold tracking-tight text-white font-mono">
              {overallSimilarity.toFixed(1)}%
            </span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-semibold border ${getSimColor(
                overallSimilarity
              )}`}
            >
              {overallSimilarity >= 75
                ? '高契合'
                : overallSimilarity >= 52
                ? '中等关联'
                : '低关联度'}
            </span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                overallSimilarity >= 75
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                  : overallSimilarity >= 52
                  ? 'bg-gradient-to-r from-amber-500 to-yellow-400'
                  : 'bg-gradient-to-r from-rose-500 to-orange-400'
              }`}
              style={{ width: `${overallSimilarity}%` }}
            />
          </div>
        </div>

        {/* Metric 2: Confidence */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">算法置信度</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="my-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold tracking-tight text-white font-mono">
              {confidence.toFixed(1)}%
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full font-semibold border text-emerald-300 border-emerald-500/30 bg-emerald-500/10">
              {confidence >= 90 ? '极高置信' : '高置信'}
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>4维特征相互印证</span>
            <span className="flex items-center gap-1 text-slate-500">
              <Clock className="w-3 h-3" />
              {processingTimeMs}ms
            </span>
          </div>
        </div>

        {/* Decision 1: Same Shot (同一镜头) */}
        <div
          className={`border rounded-xl p-4 shadow-sm flex flex-col justify-between transition-all ${
            isSameShot
              ? 'bg-emerald-950/20 border-emerald-500/40'
              : 'bg-slate-900/90 border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Film className="w-4 h-4 text-indigo-400" />
              是否同一镜头 (Same Shot)
            </span>
            {isSameShot ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <XCircle className="w-4 h-4 text-slate-400" />
            )}
          </div>
          <div className="my-2">
            <div className="flex items-center gap-2">
              <span
                className={`text-2xl font-black tracking-tight ${
                  isSameShot ? 'text-emerald-400' : 'text-slate-300'
                }`}
              >
                {isSameShot ? '是同一连续镜头' : '非同一连续镜头'}
              </span>
            </div>
          </div>
          <p className="text-[11px] text-slate-400 leading-tight">
            {isSameShot
              ? '摄像机机位连续录制，构图与背景高度一致'
              : '存在切镜头、视角切换或机位重组'}
          </p>
        </div>

        {/* Decision 2: Same Scene (相同场景) */}
        <div
          className={`border rounded-xl p-4 shadow-sm flex flex-col justify-between transition-all ${
            isSameScene
              ? 'bg-cyan-950/20 border-cyan-500/40'
              : 'bg-slate-900/90 border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-cyan-400" />
              是否相同场景 (Same Scene)
            </span>
            {isSameScene ? (
              <CheckCircle2 className="w-4 h-4 text-cyan-400" />
            ) : (
              <XCircle className="w-4 h-4 text-rose-400" />
            )}
          </div>
          <div className="my-2">
            <div className="flex items-center gap-2">
              <span
                className={`text-2xl font-black tracking-tight ${
                  isSameScene ? 'text-cyan-400' : 'text-rose-400'
                }`}
              >
                {isSameScene ? '处于相同场景' : '处于不同场景'}
              </span>
            </div>
          </div>
          <p className="text-[11px] text-slate-400 leading-tight">
            {isSameScene
              ? '属于同一时空物理环境，光温与色彩体系契合'
              : '环境光照与材质色谱发生本质跳跃'}
          </p>
        </div>
      </div>

      {/* Main Diagnostic Verdict Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm space-y-3.5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              {verdictTitle}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">{verdictDescription}</p>
          </div>
        </div>

        {/* Detailed algorithmic rationale */}
        <div className="space-y-2 pt-2 border-t border-slate-800/80">
          <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            判定理由与算法诊断分解：
          </span>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
            {reasoning.map((item, idx) => (
              <div
                key={idx}
                className="bg-slate-800/50 border border-slate-700/60 rounded-lg p-2.5 text-slate-300 flex items-start gap-2"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                <span className="leading-relaxed">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
