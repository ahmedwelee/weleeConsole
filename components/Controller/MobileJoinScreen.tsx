import React, { useState, useEffect } from 'react';
import { Smartphone, QrCode, Type, ArrowRight } from 'lucide-react';
import { extractRoomCodeFromURL, extractModeFromURL } from '../../services/mobile';
import { normalizeRoomCode } from '../../services/roomCode';

interface MobileJoinScreenProps {
  onJoinAttempt: (name: string, code: string) => void;
  isConnecting: boolean;
  error?: string | null;
}

const MobileJoinScreen: React.FC<MobileJoinScreenProps> = ({ onJoinAttempt, isConnecting, error }) => {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [method, setMethod] = useState<'manual' | 'url'>('manual');
  const [isLandscape, setIsLandscape] = useState(false);

  // Auto-detect landscape mode
  useEffect(() => {
    const handleOrientationChange = () => {
      setIsLandscape(window.innerHeight < window.innerWidth);
    };

    window.addEventListener('orientationchange', handleOrientationChange);
    window.addEventListener('resize', handleOrientationChange);

    handleOrientationChange();

    return () => {
      window.removeEventListener('orientationchange', handleOrientationChange);
      window.removeEventListener('resize', handleOrientationChange);
    };
  }, []);

  // Auto-fill code from URL if present
  useEffect(() => {
    const urlCode = extractRoomCodeFromURL();
    if (urlCode) {
      setCode(normalizeRoomCode(urlCode));
      setMethod('url');
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && code.trim()) {
      onJoinAttempt(name.toUpperCase(), normalizeRoomCode(code));
    }
  };

  const handleCodeInput = (value: string) => {
    setCode(normalizeRoomCode(value));
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col items-center justify-center p-4 ${isLandscape ? 'p-2' : ''}`}>
      {/* Header */}
      <div className={`text-center space-y-4 mb-6 ${isLandscape ? 'mb-2' : ''}`}>
        <div className="relative group">
          <Smartphone size={isLandscape ? 48 : 64} className="mx-auto text-cyan-400 group-hover:rotate-12 transition-transform duration-500" />
          <div className="absolute inset-0 bg-cyan-400/20 blur-2xl rounded-full -z-10 opacity-50" />
        </div>

        <div>
          <h1 className={`font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 ${isLandscape ? 'text-2xl' : 'text-4xl'}`}>
            WELEECONSOLE
          </h1>
          <p className="text-slate-500 text-xs md:text-sm font-medium uppercase tracking-widest mt-2">
            Enter room code to join
          </p>
        </div>
      </div>

      {/* Main Form */}
      <form onSubmit={handleSubmit} className={`w-full max-w-sm space-y-4 ${isLandscape ? 'max-w-lg' : ''}`}>
        {/* Error Message */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/50 p-3 rounded-2xl text-red-400 text-sm animate-in fade-in slide-in-from-top-2">
            ⚠️ {error}
          </div>
        )}

        {/* Name Input */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-500 uppercase ml-2 tracking-widest">
            Your Name
          </label>
          <input
            type="text"
            placeholder="Enter your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={20}
            disabled={isConnecting}
            className="w-full bg-slate-900/80 p-4 rounded-2xl text-lg font-bold outline-none border-2 border-slate-800 focus:border-cyan-500 transition-colors placeholder:opacity-30 disabled:opacity-50 disabled:cursor-not-allowed"
            required
          />
        </div>

        {/* Code Input */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-500 uppercase ml-2 tracking-widest">
            {method === 'url' ? '🎯 Room Code (from URL)' : '🔢 Room Code'}
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder="A7X2"
              value={code}
              onChange={(e) => handleCodeInput(e.target.value)}
              disabled={isConnecting || method === 'url'}
              inputMode="text"
              maxLength={4}
              className={`w-full bg-slate-900/80 p-4 rounded-2xl text-5xl text-center font-black outline-none border-2 border-slate-800 focus:border-purple-500 transition-colors placeholder:opacity-20 tracking-[2rem] disabled:opacity-50 disabled:cursor-not-allowed ${
                method === 'url' ? 'text-cyan-400' : ''
              }`}
              required
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 text-2xl">/4</div>
          </div>

          {/* Method Toggle */}
          {method === 'manual' && (
            <p className="text-xs text-slate-600 text-center mt-2">
              Scan the QR code on the big screen or ask the host
            </p>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isConnecting || !name.trim() || code.length !== 4}
          className={`w-full p-4 rounded-2xl text-xl font-black shadow-lg active:scale-95 transition-all flex items-center justify-center gap-3 ${
            isConnecting || !name.trim() || code.length !== 4
              ? 'bg-slate-800 cursor-not-allowed text-slate-500'
              : 'bg-gradient-to-r from-cyan-600 to-purple-600 hover:brightness-110 text-white'
          }`}
        >
          {isConnecting ? (
            <>
              <div className="animate-spin">⏳</div>
              Connecting...
            </>
          ) : (
            <>
              <ArrowRight size={20} />
              Join Game
            </>
          )}
        </button>

        {/* Info Box */}
        <div className="bg-slate-900/50 border border-slate-700/50 p-3 rounded-2xl text-xs text-slate-400 space-y-1">
          <p>💡 <span className="text-slate-300">Need the room code?</span></p>
          <p className="ml-5">Ask the host to scan the QR code on your device, or ask for the 4-character code</p>
        </div>
      </form>

      {/* Footer - Connection Info */}
      <div className="mt-auto text-xs text-slate-600 text-center pt-6">
        <p>🌐 Connected to local network</p>
        <p className="text-slate-700 text-xs mt-2">Make sure you're on the same WiFi as the host</p>
      </div>
    </div>
  );
};

export default MobileJoinScreen;
