import React, { useRef, useState } from 'react';
import { Upload, Image as ImageIcon, ArrowLeftRight, X, Sparkles, FileUp } from 'lucide-react';
import { ImageFrameData } from '../types/comparison';

interface ImageUploaderProps {
  frameA: ImageFrameData | null;
  frameB: ImageFrameData | null;
  onFrameLoaded: (id: 'frameA' | 'frameB', data: ImageFrameData) => void;
  onBatchFramesLoaded: (dataA: ImageFrameData, dataB: ImageFrameData) => void;
  onSwapFrames: () => void;
  onClearFrame: (id: 'frameA' | 'frameB') => void;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  frameA,
  frameB,
  onFrameLoaded,
  onBatchFramesLoaded,
  onSwapFrames,
  onClearFrame,
}) => {
  const [isGlobalDragging, setIsGlobalDragging] = useState(false);
  const [dragTarget, setDragTarget] = useState<'both' | 'frameA' | 'frameB' | null>(null);

  const fileInputRefA = useRef<HTMLInputElement>(null);
  const fileInputRefB = useRef<HTMLInputElement>(null);
  const batchInputRef = useRef<HTMLInputElement>(null);

  const processFile = (file: File): Promise<ImageFrameData> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        const img = new Image();
        img.onload = () => {
          resolve({
            id: 'frameA',
            name: file.name,
            dataUrl,
            width: img.naturalWidth,
            height: img.naturalHeight,
            aspectRatio: Number((img.naturalWidth / img.naturalHeight).toFixed(2)),
          });
        };
        img.onerror = () => reject(new Error('无法解析图片文件'));
        img.src = dataUrl;
      };
      reader.onerror = () => reject(new Error('读取文件失败'));
      reader.readAsDataURL(file);
    });
  };

  const handleBatchFiles = async (files: FileList | File[]) => {
    const validFiles = Array.from(files).filter((f) => f.type.startsWith('image/'));
    if (validFiles.length >= 2) {
      try {
        const [resA, resB] = await Promise.all([
          processFile(validFiles[0]),
          processFile(validFiles[1]),
        ]);
        onBatchFramesLoaded(
          { ...resA, id: 'frameA' },
          { ...resB, id: 'frameB' }
        );
      } catch (err) {
        console.error('批量加载图片失败:', err);
      }
    } else if (validFiles.length === 1) {
      // If only one uploaded in batch zone, put in empty slot
      const res = await processFile(validFiles[0]);
      if (!frameA) {
        onFrameLoaded('frameA', { ...res, id: 'frameA' });
      } else {
        onFrameLoaded('frameB', { ...res, id: 'frameB' });
      }
    }
  };

  const handleSingleFileInput = async (
    e: React.ChangeEvent<HTMLInputElement>,
    target: 'frameA' | 'frameB'
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (files.length >= 2) {
      await handleBatchFiles(files);
      return;
    }

    try {
      const res = await processFile(files[0]);
      onFrameLoaded(target, { ...res, id: target });
    } catch (err) {
      console.error('加载图片失败:', err);
    }
    // Reset input value to allow re-uploading same file
    e.target.value = '';
  };

  const handleDrop = async (
    e: React.DragEvent<HTMLDivElement>,
    target: 'both' | 'frameA' | 'frameB'
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setIsGlobalDragging(false);
    setDragTarget(null);

    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;

    if (target === 'both' || files.length >= 2) {
      await handleBatchFiles(files);
    } else {
      const res = await processFile(files[0]);
      onFrameLoaded(target, { ...res, id: target });
    }
  };

  return (
    <div className="space-y-3">
      {/* Dual Upload / Drag Area Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-200">输入对比图像</span>
          <span className="text-xs text-slate-400">
            (支持同时选中2张图片拖入，或分别上传、Ctrl+V 截图粘贴)
          </span>
        </div>
        <div className="flex items-center gap-2">
          {/* Batch 2-images upload button */}
          <input
            type="file"
            ref={batchInputRef}
            multiple
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              if (e.target.files) handleBatchFiles(e.target.files);
              e.target.value = '';
            }}
          />
          <button
            onClick={() => batchInputRef.current?.click()}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-md transition-colors"
          >
            <FileUp className="w-3.5 h-3.5 text-indigo-400" />
            <span>同时上传两张图片</span>
          </button>

          {frameA && frameB && (
            <button
              onClick={onSwapFrames}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-md transition-colors"
              title="交换两帧顺序"
            >
              <ArrowLeftRight className="w-3.5 h-3.5 text-cyan-400" />
              <span>互换顺序</span>
            </button>
          )}
        </div>
      </div>

      {/* Two Frame Upload Slots */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Frame A */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsGlobalDragging(true);
            setDragTarget('frameA');
          }}
          onDragLeave={() => {
            setIsGlobalDragging(false);
            setDragTarget(null);
          }}
          onDrop={(e) => handleDrop(e, 'frameA')}
          className={`relative rounded-xl border transition-all duration-200 overflow-hidden ${
            dragTarget === 'frameA'
              ? 'border-indigo-500 bg-indigo-500/10 shadow-lg shadow-indigo-500/10'
              : 'border-slate-800 bg-slate-900/80 hover:border-slate-700'
          }`}
        >
          <input
            type="file"
            ref={fileInputRefA}
            multiple
            accept="image/*"
            className="hidden"
            onChange={(e) => handleSingleFileInput(e, 'frameA')}
          />

          <div className="p-3 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/90">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-md bg-indigo-600/30 text-indigo-400 border border-indigo-500/40 text-xs font-bold flex items-center justify-center">
                A
              </span>
              <span className="text-xs font-medium text-slate-200">
                基准帧 (Keyframe A)
              </span>
            </div>

            {frameA && (
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-400">
                  {frameA.width} × {frameA.height} ({frameA.aspectRatio}:1)
                </span>
                <button
                  onClick={() => onClearFrame('frameA')}
                  className="p-1 text-slate-400 hover:text-rose-400 rounded transition-colors"
                  title="移除此图片"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {frameA ? (
            <div className="relative aspect-video bg-black/60 flex items-center justify-center p-2 group">
              <img
                src={frameA.dataUrl}
                alt="Frame A"
                className="max-h-full max-w-full object-contain rounded shadow-sm"
              />
              <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-[2px]">
                <button
                  onClick={() => fileInputRefA.current?.click()}
                  className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-medium rounded-lg hover:bg-indigo-500 shadow-md transition-colors"
                >
                  替换图片
                </button>
              </div>
            </div>
          ) : (
            <div
              onClick={() => fileInputRefA.current?.click()}
              className="aspect-video flex flex-col items-center justify-center p-6 text-center cursor-pointer hover:bg-slate-800/40 transition-colors"
            >
              <div className="w-12 h-12 rounded-xl bg-slate-800/90 border border-slate-700/80 flex items-center justify-center text-slate-400 mb-2">
                <Upload className="w-6 h-6 text-indigo-400" />
              </div>
              <p className="text-xs font-medium text-slate-200">点击上传或将图片拖拽至此</p>
              <p className="text-[11px] text-slate-500 mt-1">支持 JPG, PNG, WEBP, 截图剪贴板粘贴</p>
            </div>
          )}
        </div>

        {/* Frame B */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsGlobalDragging(true);
            setDragTarget('frameB');
          }}
          onDragLeave={() => {
            setIsGlobalDragging(false);
            setDragTarget(null);
          }}
          onDrop={(e) => handleDrop(e, 'frameB')}
          className={`relative rounded-xl border transition-all duration-200 overflow-hidden ${
            dragTarget === 'frameB'
              ? 'border-cyan-500 bg-cyan-500/10 shadow-lg shadow-cyan-500/10'
              : 'border-slate-800 bg-slate-900/80 hover:border-slate-700'
          }`}
        >
          <input
            type="file"
            ref={fileInputRefB}
            multiple
            accept="image/*"
            className="hidden"
            onChange={(e) => handleSingleFileInput(e, 'frameB')}
          />

          <div className="p-3 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/90">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-md bg-cyan-600/30 text-cyan-400 border border-cyan-500/40 text-xs font-bold flex items-center justify-center">
                B
              </span>
              <span className="text-xs font-medium text-slate-200">
                对比帧 (Keyframe B)
              </span>
            </div>

            {frameB && (
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-400">
                  {frameB.width} × {frameB.height} ({frameB.aspectRatio}:1)
                </span>
                <button
                  onClick={() => onClearFrame('frameB')}
                  className="p-1 text-slate-400 hover:text-rose-400 rounded transition-colors"
                  title="移除此图片"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {frameB ? (
            <div className="relative aspect-video bg-black/60 flex items-center justify-center p-2 group">
              <img
                src={frameB.dataUrl}
                alt="Frame B"
                className="max-h-full max-w-full object-contain rounded shadow-sm"
              />
              <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-[2px]">
                <button
                  onClick={() => fileInputRefB.current?.click()}
                  className="px-3 py-1.5 bg-cyan-600 text-white text-xs font-medium rounded-lg hover:bg-cyan-500 shadow-md transition-colors"
                >
                  替换图片
                </button>
              </div>
            </div>
          ) : (
            <div
              onClick={() => fileInputRefB.current?.click()}
              className="aspect-video flex flex-col items-center justify-center p-6 text-center cursor-pointer hover:bg-slate-800/40 transition-colors"
            >
              <div className="w-12 h-12 rounded-xl bg-slate-800/90 border border-slate-700/80 flex items-center justify-center text-slate-400 mb-2">
                <Upload className="w-6 h-6 text-cyan-400" />
              </div>
              <p className="text-xs font-medium text-slate-200">点击上传或将图片拖拽至此</p>
              <p className="text-[11px] text-slate-500 mt-1">支持 JPG, PNG, WEBP, 截图剪贴板粘贴</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
