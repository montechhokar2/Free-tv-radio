import React, { useState } from 'react';
import { 
  Globe2, 
  Radio, 
  ExternalLink, 
  Sparkles, 
  Layers, 
  Compass, 
  Waves, 
  Flame, 
  CheckCircle2, 
  Search, 
  X,
  Play,
  Volume2
} from 'lucide-react';
import { WORLD_RADIO_PLATFORMS } from '../../data/radioPlatforms';
import { RadioPlatform } from '../../types';

export const RadioPlatformsHub: React.FC = () => {
  const [selectedPlatform, setSelectedPlatform] = useState<RadioPlatform | null>(null);
  const [platformSearch, setPlatformSearch] = useState('');

  const filteredPlatforms = WORLD_RADIO_PLATFORMS.filter(p => {
    if (!platformSearch.trim()) return true;
    const q = platformSearch.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.coverage.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.stationCount.toLowerCase().includes(q)
    );
  });

  return (
    <section className="space-y-6">
      {/* Header Banner */}
      <div className="relative rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-sky-950/70 via-slate-900 to-amber-950/40 border border-slate-800 shadow-xl overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5">
                <Globe2 className="w-3.5 h-3.5" />
                WORLDWIDE RADIO DIRECTORIES
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                7 PREMIER PLATFORMS INTEGRATED
              </span>
            </div>

            <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight">
              Global Internet Radio Platforms Hub
            </h2>

            <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
              Explore radio stations worldwide across <strong>Radio Garden</strong>, <strong>Radio Browser</strong>, <strong>TuneIn</strong>, <strong>Roam Radio</strong> (67k+ stations), <strong>Online Radio FM</strong> (58k+ stations), <strong>Air Drift</strong> (59k+ stations), and <strong>Airtune</strong>.
            </p>
          </div>

          {/* Quick Search */}
          <div className="relative w-full md:w-64 shrink-0">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={platformSearch}
              onChange={e => setPlatformSearch(e.target.value)}
              placeholder="Search platforms..."
              className="w-full min-h-[44px] pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-base sm:text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>
      </div>

      {/* Grid of the 7 Platforms */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPlatforms.map((platform) => {
          return (
            <div
              key={platform.id}
              className="group relative rounded-2xl bg-slate-900 border border-slate-800 hover:border-amber-500/50 p-5 flex flex-col justify-between transition-all hover:shadow-xl hover:shadow-amber-500/5"
            >
              <div>
                {/* Platform Header: Logo & Badge */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-950 border border-slate-800 p-1 flex items-center justify-center shrink-0 overflow-hidden group-hover:scale-105 transition-transform">
                    <img
                      src={platform.logoUrl}
                      alt={platform.name}
                      loading="lazy"
                      className="w-full h-full object-cover rounded-xl"
                    />
                  </div>

                  <span className="px-2.5 py-1 rounded-full bg-slate-950 border border-slate-800 text-amber-400 text-[11px] font-mono font-bold">
                    {platform.stationCount}
                  </span>
                </div>

                {/* Name & Coverage */}
                <h3 className="text-base font-bold text-white group-hover:text-amber-400 transition-colors flex items-center gap-1.5">
                  <span>{platform.name}</span>
                </h3>

                <p className="text-[11px] font-semibold text-emerald-400 mt-0.5">
                  {platform.coverage}
                </p>

                <p className="text-xs text-slate-300 mt-2 line-clamp-3 leading-relaxed">
                  {platform.description}
                </p>

                {/* Feature Tags */}
                <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-slate-800/80">
                  {platform.features.map(f => (
                    <span 
                      key={f}
                      className="px-2 py-0.5 rounded-lg bg-slate-950 text-[10px] text-slate-400 border border-slate-800/80"
                    >
                      {f}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-4 mt-4 border-t border-slate-800">
                <a
                  href={platform.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 min-h-[44px] py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-amber-500/20 cursor-pointer"
                >
                  <span>Launch Platform</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>

                <button
                  onClick={() => setSelectedPlatform(platform)}
                  className="min-h-[44px] py-2 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-colors cursor-pointer"
                >
                  Info
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Platform Info Modal */}
      {selectedPlatform && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="w-full max-w-lg max-h-[90dvh] overflow-y-auto bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-12 h-12 rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shrink-0">
                  <img src={selectedPlatform.logoUrl} alt={selectedPlatform.name} className="w-full h-full object-cover" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-display text-lg font-bold text-white truncate">{selectedPlatform.name}</h3>
                  <p className="text-xs text-amber-400 font-medium truncate">{selectedPlatform.coverage}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedPlatform(null)}
                aria-label="Close platform details"
                className="min-w-[44px] min-h-[44px] p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer flex items-center justify-center shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {selectedPlatform.description}
            </p>

            <div className="space-y-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Platform Capabilities</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {selectedPlatform.features.map(feat => (
                  <div key={feat} className="flex items-center gap-1.5 text-slate-300 p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span className="truncate">{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-400">Total Listed Broadcasters:</span>
              <strong className="text-amber-400 font-mono text-sm">{selectedPlatform.stationCount}</strong>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setSelectedPlatform(null)}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs cursor-pointer"
              >
                Close
              </button>
              <a
                href={selectedPlatform.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="min-h-[44px] px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 cursor-pointer"
              >
                <span>Open {selectedPlatform.name}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
