import React, { useRef, useState, useEffect } from 'react';
import { X, Eraser, Pen, RotateCcw, Download } from 'lucide-react';

interface ScratchpadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ScratchpadModal: React.FC<ScratchpadModalProps> = ({ isOpen, onClose }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [mode, setMode] = useState<'pen' | 'eraser'>('pen');
  const [color, setColor] = useState('#2563eb');
  const [lineWidth, setLineWidth] = useState(2);

  useEffect(() => {
    if (!isOpen) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set canvas dimensions based on container
    canvas.width = canvas.parentElement?.clientWidth || 700;
    canvas.height = 450;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = mode === 'eraser' ? '#ffffff' : color;
    ctx.lineWidth = mode === 'eraser' ? 24 : lineWidth;
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-300 dark:border-slate-800 w-full max-w-3xl overflow-hidden flex flex-col">
        {/* Header Toolbar */}
        <div className="bg-slate-100 dark:bg-slate-800 px-4 py-3 flex items-center justify-between border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              📝 Rough Sheet / Scratchpad
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              (Use for rough calculations & derivations)
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Pen tool */}
            <button
              onClick={() => setMode('pen')}
              className={`p-1.5 rounded-lg flex items-center gap-1 text-xs font-medium ${
                mode === 'pen'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              <Pen size={14} /> Pen
            </button>

            {/* Eraser */}
            <button
              onClick={() => setMode('eraser')}
              className={`p-1.5 rounded-lg flex items-center gap-1 text-xs font-medium ${
                mode === 'eraser'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              <Eraser size={14} /> Eraser
            </button>

            {/* Color Palette */}
            {mode === 'pen' && (
              <div className="flex items-center gap-1 ml-2">
                {['#2563eb', '#dc2626', '#16a34a', '#0f172a'].map((c) => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    style={{ backgroundColor: c }}
                    className={`w-5 h-5 rounded-full border-2 ${
                      color === c ? 'border-amber-400 scale-110' : 'border-white dark:border-slate-900'
                    }`}
                  />
                ))}
              </div>
            )}

            {/* Clear button */}
            <button
              onClick={clearCanvas}
              className="ml-3 p-1.5 rounded-lg bg-red-100 hover:bg-red-200 text-red-700 dark:bg-red-950/60 dark:hover:bg-red-900 dark:text-red-300 flex items-center gap-1 text-xs font-medium"
            >
              <RotateCcw size={14} /> Clear Page
            </button>

            {/* Close */}
            <button
              onClick={onClose}
              className="ml-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Canvas Area with graph-paper grid pattern */}
        <div className="relative w-full h-[450px] bg-white cursor-crosshair">
          <canvas
            ref={canvasRef}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            className="w-full h-full block"
          />
        </div>
      </div>
    </div>
  );
};
