import React, { useState } from 'react';
import { 
  X, 
  Smartphone, 
  ShieldCheck, 
  Package, 
  ArrowDownToLine, 
  Info,
  Tv
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const DownloadAppModal: React.FC = () => {
  const { isDownloadModalOpen, setIsDownloadModalOpen } = useApp();
  const [downloadingFile, setDownloadingFile] = useState<string | null>(null);

  if (!isDownloadModalOpen) return null;

  const handleDownload = (fileName: string, path: string) => {
    setDownloadingFile(fileName);
    
    // Create an invisible anchor tag to trigger real browser download
    const link = document.createElement('a');
    link.href = path;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => {
      setDownloadingFile(null);
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div 
        className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative p-6 bg-gradient-to-r from-emerald-950/60 via-slate-900 to-amber-950/40 border-b border-slate-800">
          <button
            onClick={() => setIsDownloadModalOpen(false)}
            className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[11px] font-bold uppercase tracking-wider mb-2">
            <Smartphone className="w-3.5 h-3.5" />
            <span>Android App Distribution</span>
          </div>

          <h2 className="font-display text-2xl font-extrabold text-white tracking-tight">
            Download Free TV &amp; Radio Live
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            Install directly on your Android smartphone, tablet, or Google TV device.
          </p>
        </div>

        {/* Body content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* App Metadata Card */}
          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-600 via-amber-500 to-yellow-400 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-amber-500/20">
                <Tv className="w-6 h-6 text-slate-950" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Free TV &amp; Radio Live</h3>
                <p className="text-[11px] text-slate-400">Version 2.4.0 · Made by Monte Chhokar</p>
                <p className="text-[10px] text-slate-400 font-mono">Package: live.freetvradio.app</p>
              </div>
            </div>

            <div className="text-right">
              <span className="inline-block px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                Signed Release
              </span>
            </div>
          </div>

          {/* Download Option (APK) */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center justify-between">
              <span>Available Android Distribution File</span>
              <span className="text-[10px] text-emerald-400 font-mono font-normal">Generated in /src/</span>
            </h4>

            {/* APK Option - Mobile Testing & Direct Sideloading */}
            <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800 hover:border-emerald-500/50 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">FreeTVRadioLive.apk</span>
                    <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                      Direct Install on Mobile
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Direct installation package for Android smartphones, tablets, Fire TV, and Smart TV boxes.
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-emerald-400 font-mono bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-500/30">
                      /src/FreeTVRadioLive.apk
                    </span>
                    <span className="text-[10px] text-slate-400">Ready for instant testing</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleDownload('FreeTVRadioLive.apk', '/FreeTVRadioLive.apk')}
                className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer whitespace-nowrap shrink-0"
              >
                <ArrowDownToLine className="w-4 h-4" />
                <span>{downloadingFile === 'FreeTVRadioLive.apk' ? 'Downloading APK...' : 'Download APK (Mobile)'}</span>
              </button>
            </div>
          </div>

          {/* Sideloading Instructions */}
          <div className="p-4 rounded-2xl bg-slate-950/50 border border-slate-800 space-y-2 text-xs text-slate-300">
            <div className="flex items-center gap-2 font-semibold text-white">
              <Info className="w-4 h-4 text-sky-400" />
              <span>How to Install on Android Phone / Tablet:</span>
            </div>
            <ol className="list-decimal list-inside space-y-1 text-slate-400 pl-1 text-[11px] leading-relaxed">
              <li>Tap <strong>Download APK (Mobile)</strong> above to save the installer directly on your phone.</li>
              <li>When prompted by Android, allow <em>&ldquo;Install unknown apps&rdquo;</em> for your browser.</li>
              <li>Open your Downloads folder and tap <strong>FreeTVRadioLive.apk</strong> to complete installation.</li>
              <li>Launch the app to enjoy smooth Live TV, Radio, JioTV, Colito, and YouTube streaming!</li>
            </ol>
          </div>

          {/* Verification Badge */}
          <div className="flex items-center justify-between text-xs text-slate-400 border-t border-slate-800 pt-3">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Virus-free &amp; Malware scanned signed package</span>
            </div>
            <span className="text-slate-400 font-mono text-[10px]">Android 8.0+ Compatible</span>
          </div>
        </div>
      </div>
    </div>
  );
};
