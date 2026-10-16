import React, { useRef, useState } from 'react';
import { X, Video, Camera, Play, Pause, FastForward, Rewind, Check } from 'lucide-react';
import { ImageFrameData } from '../types/comparison';

interface VideoExtractModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSetFrameA: (data: ImageFrameData) => void;
  onSetFrameB: (data: ImageFrameData) => void;
}

export const VideoExtractModal: React.FC<VideoExtractModalProps> = ({
  isOpen,
  onClose,
  onSetFrameA,
  onSetFrameB,
}) => {
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [videoName, setVideoName] = useState<string>('');
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const [capturedA, setCapturedA] = useState<string | null>(null);
  const [capturedB, setCapturedB] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleVideoFile = (file: File) => {
    const url = URL.createObjectURL(file);
    setVideoSrc(url);
    setVideoName(file.name);
    setCurrentTime(0);
  };

  const captureCurrentFrame = (target: 'A' | 'B') => {
    const video = videoRef.current;
    if (!video) return;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 360;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
    const frameData: ImageFrameData = {
      id: target === 'A' ? 'frameA' : 'frameB',
      name: `${videoName}_${target}_${currentTime.toFixed(2)}s`,
      dataUrl,
      width: canvas.width,
      height: canvas.height,
      aspectRatio: Number((canvas.width / canvas.height).toFixed(2)),
    };

    if (target === 'A') {
      setCapturedA(dataUrl);
      onSetFrameA(frameData);
    } else {
      setCapturedB(dataUrl);
      onSetFrameB(frameData);
    }
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const stepFrame = (deltaSeconds: number) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = Math.max(
      0,
      Math.min(duration, videoRef.current.currentTime + deltaSeconds)
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Video className="w-5 h-5 text-cyan-400" />
            <h3 className="text-base font-bold text-white">从视频文件提取关键帧对比</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 overflow-y-auto">
          {!videoSrc ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-700 hover:border-cyan-500 rounded-2xl p-10 flex flex-col items-center justify-center cursor-pointer transition-colors text-center"
            >
              <input
                type="file"
                ref={fileInputRef}
                accept="video/mp4,video/webm,video/ogg,video/quicktime"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.[0]) handleVideoFile(e.target.files[0]);
                }}
              />
              <Video className="w-12 h-12 text-slate-500 mb-3" />
              <div className="text-sm font-semibold text-slate-200">
                点击选择本地视频文件 (MP4 / WebM / QuickTime)
              </div>
              <p className="text-xs text-slate-500 mt-1">
                完全在浏览器本地解析，无需上传云端，零流量泄露风险
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Video Player */}
              <div className="relative aspect-video bg-black rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center">
                <video
                  ref={videoRef}
                  src={videoSrc}
                  className="max-h-full max-w-full object-contain"
                  onTimeUpdate={() => {
                    if (videoRef.current) setCurrentTime(videoRef.current.currentTime);
                  }}
                  onLoadedMetadata={() => {
                    if (videoRef.current) setDuration(videoRef.current.duration);
                  }}
                  onEnded={() => setIsPlaying(false)}
                />
              </div>

              {/* Scrubber and controls */}
              <div className="space-y-2 bg-slate-800/40 border border-slate-700/50 rounded-xl p-3.5">
                <div className="flex items-center gap-3">
                  <button
                    onClick={togglePlay}
                    className="p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs"
                  >
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => stepFrame(-0.04)} // ~1 frame step at 24/25fps
                    className="p-1.5 text-slate-400 hover:text-white"
                    title="后退1帧"
                  >
                    <Rewind className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => stepFrame(0.04)}
                    className="p-1.5 text-slate-400 hover:text-white"
                    title="前进1帧"
                  >
                    <FastForward className="w-4 h-4" />
                  </button>

                  <input
                    type="range"
                    min={0}
                    max={duration || 100}
                    step={0.01}
                    value={currentTime}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setCurrentTime(val);
                      if (videoRef.current) videoRef.current.currentTime = val;
                    }}
                    className="flex-1 accent-indigo-500 cursor-pointer"
                  />

                  <div className="text-xs font-mono text-slate-300 w-24 text-right">
                    {currentTime.toFixed(2)}s / {duration.toFixed(2)}s
                  </div>
                </div>

                {/* Capture buttons */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-700/50 gap-3">
                  <button
                    onClick={() => captureCurrentFrame('A')}
                    className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-indigo-600/25 hover:bg-indigo-600/40 text-indigo-200 border border-indigo-500/50 rounded-lg text-xs font-semibold transition-colors"
                  >
                    <Camera className="w-4 h-4 text-indigo-400" />
                    <span>抓取当前时刻设为 [帧 A]</span>
                    {capturedA && <Check className="w-3.5 h-3.5 text-emerald-400 ml-1" />}
                  </button>

                  <button
                    onClick={() => captureCurrentFrame('B')}
                    className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-cyan-600/25 hover:bg-cyan-600/40 text-cyan-200 border border-cyan-500/50 rounded-lg text-xs font-semibold transition-colors"
                  >
                    <Camera className="w-4 h-4 text-cyan-400" />
                    <span>抓取当前时刻设为 [帧 B]</span>
                    {capturedB && <Check className="w-3.5 h-3.5 text-emerald-400 ml-1" />}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
          <button
            onClick={() => {
              setVideoSrc(null);
              setCapturedA(null);
              setCapturedB(null);
            }}
            className="text-xs text-slate-400 hover:text-slate-200"
          >
            清空已选视频
          </button>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition-colors"
          >
            完成并开始分析
          </button>
        </div>
      </div>
    </div>
  );
};
