import React, { useState } from 'react';
import { Smartphone, X, WifiOff } from 'lucide-react';
import { usePWAInstall, useOnlineStatus } from '../../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    return (
      <button
        onClick={() => void install()}
        title="Install Mobile App"
        className="flex items-center justify-center gap-1.5 min-w-[44px] min-h-[44px] px-2.5 sm:px-3 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0"
      >
        <Smartphone className="w-4 h-4" />
        <span className="hidden sm:inline">Install App</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          title="Install on iPhone / iPad"
          className="flex items-center justify-center gap-1.5 min-w-[44px] min-h-[44px] px-2.5 sm:px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0"
        >
          <Smartphone className="w-4 h-4 text-amber-400" />
          <span className="hidden sm:inline">Install App</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-2xl space-y-3 max-h-[90dvh] overflow-y-auto">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-amber-400" />
                  <span>Install on iPhone / iPad</span>
                </h3>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  aria-label="Close install instructions"
                  className="min-w-[40px] min-h-[40px] flex items-center justify-center text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                1. Tap the <strong>Share</strong> button in Safari&apos;s toolbar.<br />
                2. Scroll down and tap <strong>Add to Home Screen</strong>.
              </p>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="w-full min-h-[44px] py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold cursor-pointer"
              >
                Got it
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom))] md:bottom-4 left-3 sm:left-4 z-50 flex items-center gap-2 rounded-xl bg-amber-500 px-3 py-2 text-xs font-bold text-slate-950 shadow-lg max-w-[calc(100vw-1.5rem)]">
      <WifiOff className="w-3.5 h-3.5 shrink-0" />
      <span className="truncate">Offline Mode — Cached app shell active.</span>
    </div>
  );
};
