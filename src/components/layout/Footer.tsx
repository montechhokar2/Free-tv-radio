import React from 'react';
import { Tv, ShieldCheck } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const Footer: React.FC = () => {
  const { setCurrentTab, setIsLegalModalOpen } = useApp();

  return (
    <footer className="border-t border-slate-900 bg-slate-950 text-slate-400 pt-8 pb-24 md:py-10 px-4 sm:px-6 lg:px-8 text-xs transition-colors">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-6">
        {/* Brand & Mission */}
        <div className="flex flex-col sm:flex-row items-center gap-3 text-center sm:text-left">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center font-bold shrink-0">
            <Tv className="w-4 h-4" />
          </div>
          <div>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <span className="font-display font-bold text-sm text-white">Free TV &amp; Radio Live</span>
              <span className="text-[10px] text-amber-400 font-medium px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20">
                Made by Monte Chhokar
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Public service broadcaster feeds &amp; free online radio from India and worldwide.
            </p>
          </div>
        </div>

        {/* Clean Nav Links */}
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs">
          <button onClick={() => setCurrentTab('home')} className="py-1.5 px-1 hover:text-white transition-colors cursor-pointer">
            Home
          </button>
          <button onClick={() => setCurrentTab('tv')} className="py-1.5 px-1 hover:text-white transition-colors cursor-pointer">
            Live TV
          </button>
          <button onClick={() => setCurrentTab('cricket')} className="py-1.5 px-1 text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer font-semibold">
            Cricket Hub
          </button>
          <button onClick={() => setCurrentTab('public_iptv')} className="py-1.5 px-1 text-sky-400 hover:text-sky-300 transition-colors cursor-pointer font-semibold">
            Open IPTV Sources
          </button>
          <button onClick={() => setCurrentTab('radio')} className="py-1.5 px-1 hover:text-white transition-colors cursor-pointer">
            Radio
          </button>
          <button onClick={() => setCurrentTab('dictionary')} className="py-1.5 px-1 hover:text-white transition-colors cursor-pointer">
            Web TV Dictionary
          </button>
          <button onClick={() => setCurrentTab('ott')} className="py-1.5 px-1 hover:text-white transition-colors cursor-pointer">
            OTT &amp; YouTube
          </button>
          <button onClick={() => setCurrentTab('adult18')} className="py-1.5 px-1 text-rose-400/90 hover:text-rose-300 transition-colors cursor-pointer">
            18+ Adult
          </button>
          <button onClick={() => setCurrentTab('favorites')} className="py-1.5 px-1 hover:text-white transition-colors cursor-pointer">
            Favorites
          </button>
          <button onClick={() => setCurrentTab('admin')} className="py-1.5 px-1 hover:text-white transition-colors cursor-pointer">
            Admin Console
          </button>
          <button 
            onClick={() => setIsLegalModalOpen(true)} 
            className="py-1.5 px-1 text-amber-400/90 hover:text-amber-300 font-medium flex items-center gap-1 cursor-pointer"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Legal Compliance &amp; FTA</span>
          </button>
        </div>

        {/* Copyright & Maker */}
        <div className="text-[11px] text-slate-500 text-center lg:text-right">
          <div>&copy; {new Date().getFullYear()} Free TV &amp; Radio Live · Crafted with care by <span className="text-slate-300 font-medium">Monte Chhokar</span></div>
          <div className="text-[10px] text-slate-600 mt-0.5">All broadcast trademarks belong to their respective networks.</div>
        </div>
      </div>
    </footer>
  );
};
