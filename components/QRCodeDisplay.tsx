import React from 'react';
import QRCode from 'qrcode.react';
import { Copy, Share2, Wifi } from 'lucide-react';

interface QRCodeDisplayProps {
  roomCode: string;
  joinURL: string;
  hostIP?: string;
  onCopyCode?: () => void;
  onShare?: () => void;
}

const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({
  roomCode,
  joinURL,
  hostIP,
  onCopyCode,
  onShare
}) => {
  const [copied, setCopied] = React.useState(false);
  const [showDetails, setShowDetails] = React.useState(false);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    onCopyCode?.();
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyURL = () => {
    navigator.clipboard.writeText(joinURL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join My Game',
          text: `Join my game with code: ${roomCode}`,
          url: joinURL
        });
        onShare?.();
      } catch (err) {
        console.log('Share cancelled or failed');
      }
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* QR Code Section */}
      <div className="flex flex-col items-center space-y-4">
        {/* QR Code Display */}
        <div className="bg-white p-6 rounded-3xl shadow-2xl border-4 border-cyan-500/30">
          <QRCode
            value={joinURL}
            size={280}
            level="H"
            includeMargin={true}
            fgColor="#000000"
            bgColor="#ffffff"
          />
        </div>

        {/* Room Code Display */}
        <div className="text-center space-y-2">
          <p className="text-sm text-slate-500 uppercase tracking-widest font-medium">Or Enter Code</p>
          <div className="text-5xl font-black tracking-[0.2em] text-white bg-gradient-to-r from-cyan-500 to-purple-600 bg-clip-text text-transparent">
            {roomCode}
          </div>
        </div>

        {/* Instructions */}
        <div className="text-center space-y-3 mt-6">
          <p className="text-slate-400 text-sm">
            📱 Players: Scan QR code or enter room code on your phone
          </p>
          <p className="text-slate-500 text-xs">
            {hostIP && (
              <>
                <Wifi className="inline mr-1" size={14} />
                Connect to: {hostIP}:3000
              </>
            )}
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={handleCopyCode}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/50 rounded-xl transition-all text-cyan-400 font-semibold text-sm"
        >
          <Copy size={16} />
          <span>{copied ? 'Copied!' : 'Copy Code'}</span>
        </button>

        <button
          onClick={handleCopyURL}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/50 rounded-xl transition-all text-purple-400 font-semibold text-sm"
        >
          <Copy size={16} />
          <span>Copy Link</span>
        </button>

        {navigator.share && (
          <button
            onClick={handleShare}
            className="col-span-2 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-green-500/20 to-emerald-500/20 hover:from-green-500/30 hover:to-emerald-500/30 border border-green-500/50 rounded-xl transition-all text-green-400 font-semibold"
          >
            <Share2 size={18} />
            <span>Share with Players</span>
          </button>
        )}
      </div>

      {/* Details Toggle */}
      <button
        onClick={() => setShowDetails(!showDetails)}
        className="w-full text-xs text-slate-500 hover:text-slate-400 transition-colors text-center py-2"
      >
        {showDetails ? '▼ Hide Details' : '▶ Show Connection Details'}
      </button>

      {/* Connection Details */}
      {showDetails && (
        <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-4 space-y-2 text-xs font-mono text-slate-400">
          <div>
            <span className="text-slate-500">Room Code:</span> {roomCode}
          </div>
          <div>
            <span className="text-slate-500">Join URL:</span>
            <div className="break-all mt-1 text-cyan-400">{joinURL}</div>
          </div>
          {hostIP && (
            <div>
              <span className="text-slate-500">Host IP:</span> {hostIP}
            </div>
          )}
          <div>
            <span className="text-slate-500">Players can:</span>
            <ul className="mt-2 space-y-1 ml-4">
              <li>✓ Scan the QR code</li>
              <li>✓ Enter the 4-character code</li>
              <li>✓ Open the link directly</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default QRCodeDisplay;
