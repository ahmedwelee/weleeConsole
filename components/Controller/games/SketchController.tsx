
import React, { useRef, useState, useEffect } from 'react';
import { GameState } from '../../../types';
import { broadcast } from '../../../services/broadcast';
import { Eraser, Pencil, Send } from 'lucide-react';

const SketchController: React.FC<{ gameState: GameState, myId: string }> = ({ gameState, myId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Fix for high DPI screens
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    ctx.lineCap = 'round';
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#FFFFFF';
  }, []);

  const getPos = (e: any) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches ? e.touches[0] : e;
    return {
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top
    };
  };

  const startDrawing = (e: any) => {
    setIsDrawing(true);
    const ctx = canvasRef.current?.getContext('2d');
    const { x, y } = getPos(e);
    ctx?.beginPath();
    ctx?.moveTo(x, y);
  };

  const draw = (e: any) => {
    if (!isDrawing) return;
    const ctx = canvasRef.current?.getContext('2d');
    const { x, y } = getPos(e);
    ctx?.lineTo(x, y);
    ctx?.stroke();
    e.preventDefault();
  };

  const stopDrawing = () => setIsDrawing(false);

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const submit = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const imageData = canvas.toDataURL('image/png');
    broadcast.send('CONTROLLER_INPUT', { action: 'SUBMIT_SKETCH', imageData }, myId);
    setSubmitted(true);
  };

  if (submitted) return <div className="min-h-screen flex items-center justify-center font-bold text-3xl">Great Job! Submitting...</div>;

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col p-4 overflow-hidden">
      <div className="text-center py-2">
        <div className="text-xs uppercase text-slate-500 font-bold mb-1">Draw the prompt on TV</div>
        <div className="text-xl font-black text-cyan-400">{gameState.gameData?.prompt}</div>
      </div>
      
      <div className="flex-1 bg-black rounded-3xl overflow-hidden touch-none relative">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="w-full h-full"
        />
      </div>

      <div className="flex gap-4 pt-4">
        <button onClick={clear} className="flex-1 bg-slate-800 p-5 rounded-2xl flex items-center justify-center gap-2 font-bold">
          <Eraser /> Clear
        </button>
        <button onClick={submit} className="flex-[2] bg-gradient-to-r from-cyan-500 to-purple-600 p-5 rounded-2xl flex items-center justify-center gap-2 text-xl font-black">
          <Send /> Submit
        </button>
      </div>
    </div>
  );
};

export default SketchController;
