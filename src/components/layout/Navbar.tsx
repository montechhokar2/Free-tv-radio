import React from 'react';
import { Tv, Radio, Heart, Shield, Sun, Moon, User, Search, Download } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const Navbar: React.FC = () => {
  const { 
    currentTab, 
    setCurrentTab, 
    theme, 
    toggleTheme, 
    user, 
    setIsAuthModalOpen,
    setIsDownloadModalOpen
  } = useApp();

  return (
    <header className="sticky top-0 z-30 bg-slate-950/90 dark:bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Brand Wordmark (Single text element in display face) */}
        <button 
          onClick={() => setCurrentTab('home')}
          className="flex items-center gap-2.5 text-left whitespace-nowrap shrink-0 group cursor-pointer focus:outline-none"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-600 via-amber-500 to-yellow-400 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform">
            <Tv className="w-5 h-5 text-slate-950" />
          </div>
          <span className="font-display text-lg font-bold tracking-tight text-white group-hover:text-amber-400 transition-colors">
            Free TV &amp; Radio Live
          </span>
        </button>

        {/* Zone 2: concise single-line text links */}
        <nav className="hidden md:flex items-center gap-5 text-sm font-medium">
          <button
            onClick={() => setCurrentTab('home')}
            className={`whitespace-nowrap shrink-0 transition-colors cursor-pointer py-1 ${
              currentTab === 'home' 
                ? 'text-amber-400 font-semibold border-b-2 border-amber-400' 
                : 'text-slate-300 hover:text-white'
            }`}
          >
            Home
          </button>
          <button
            onClick={() => setCurrentTab('tv')}
            className={`whitespace-nowrap shrink-0 transition-colors cursor-pointer py-1 ${
              currentTab === 'tv' 
                ? 'text-amber-400 font-semibold border-b-2 border-amber-400' 
                : 'text-slate-300 hover:text-white'
            }`}
          >
            Live TV
          </button>
          <button
            onClick={() => setCurrentTab('iptv')}
            className={`whitespace-nowrap shrink-0 transition-colors cursor-pointer py-1 ${
              currentTab === 'iptv' 
                ? 'text-amber-400 font-semibold border-b-2 border-amber-400' 
                : 'text-slate-300 hover:text-white'
            }`}
          >
            IPTV &amp; EPG
          </button>
          <button
            onClick={() => setCurrentTab('radio')}
            className={`whitespace-nowrap shrink-0 transition-colors cursor-pointer py-1 ${
              currentTab === 'radio' 
                ? 'text-amber-400 font-semibold border-b-2 border-amber-400' 
                : 'text-slate-300 hover:text-white'
            }`}
          >
            Radio
          </button>
          <button
            onClick={() => setCurrentTab('countries')}
            className={`whitespace-nowrap shrink-0 transition-colors cursor-pointer py-1 ${
              currentTab === 'countries' 
                ? 'text-amber-400 font-semibold border-b-2 border-amber-400' 
                : 'text-slate-300 hover:text-white'
            }`}
          >
            Countries
          </button>
          <button
            onClick={() => setCurrentTab('dictionary')}
            className={`whitespace-nowrap shrink-0 transition-colors cursor-pointer py-1 ${
              currentTab === 'dictionary' 
                ? 'text-amber-400 font-semibold border-b-2 border-amber-400' 
                : 'text-slate-300 hover:text-white'
            }`}
          >
            Web Dictionary
          </button>
          <button
            onClick={() => setCurrentTab('ott')}
            className={`whitespace-nowrap shrink-0 transition-colors cursor-pointer py-1 ${
              currentTab === 'ott' 
                ? 'text-amber-400 font-semibold border-b-2 border-amber-400' 
                : 'text-slate-300 hover:text-white'
            }`}
          >
            OTT &amp; YouTube
          </button>
          <button
            onClick={() => setCurrentTab('favorites')}
            className={`whitespace-nowrap shrink-0 transition-colors cursor-pointer py-1 flex items-center gap-1.5 ${
              currentTab === 'favorites' 
                ? 'text-amber-400 font-semibold border-b-2 border-amber-400' 
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <span>Favorites</span>
            {user.favorites.length > 0 && (
              <span className="px-1.5 py-0.2 bg-amber-500/20 text-amber-400 text-[10px] font-bold rounded-full">
                {user.favorites.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setCurrentTab('search')}
            className={`whitespace-nowrap shrink-0 transition-colors cursor-pointer py-1 flex items-center gap-1.5 ${
              currentTab === 'search' 
                ? 'text-amber-400 font-semibold border-b-2 border-amber-400' 
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>Search</span>
          </button>
          <button
            onClick={() => setCurrentTab('admin')}
            className={`whitespace-nowrap shrink-0 transition-colors cursor-pointer py-1 flex items-center gap-1 ${
              currentTab === 'admin' 
                ? 'text-amber-400 font-semibold border-b-2 border-amber-400' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Admin</span>
          </button>
        </nav>

        {/* Zone 3: 1 primary action area */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Download APK / App button */}
          <button
            onClick={() => setIsDownloadModalOpen(true)}
            title="Download Android App (APK)"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">Android APK</span>
          </button>

          {/* Quick theme toggle */}
          <button
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-amber-400 flex items-center justify-center transition-colors cursor-pointer"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* User profile / Login button */}
          <button
            onClick={() => setIsAuthModalOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-semibold shadow-md shadow-amber-500/10 transition-all cursor-pointer whitespace-nowrap shrink-0"
          >
            <User className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">
              {user.role === 'guest' ? 'Sign In' : user.name.split(' ')[0]}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};
