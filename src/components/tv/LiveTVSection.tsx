import React, { useState, useMemo } from 'react';
import { 
  Tv, 
  Search, 
  Filter, 
  Globe, 
  Sparkles, 
  X, 
  BookOpen, 
  Heart, 
  Play, 
  CheckCircle2, 
  Activity,
  Layers,
  RefreshCw,
  CalendarClock,
  ListVideo,
  Trophy
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { VideoPlayer } from '../player/VideoPlayer';
import { TV_CATEGORIES_LIST, ALL_LANGUAGES, ALL_COUNTRIES } from '../../data/initialChannels';
import { Channel } from '../../types';
import {
  findEpgProgramsForChannel,
  getCurrentAndUpcoming,
  formatEpgTime
} from '../../services/epgService';

export const LiveTVSection: React.FC = () => {
  const { 
    channels, 
    activeTV, 
    closeTVPlayer, 
    selectedCategory, 
    setSelectedCategory,
    setCurrentTab,
    playTVChannel,
    toggleFavorite,
    isFavorite,
    isChannelRestricted,
    epgProgramsByChannelId,
    loadEpgForChannels,
    isLoadingEpg,
    iptvChannels,
    sportsIptvChannels,
    isLoadingSportsIptv,
    syncSportsIptv
  } = useApp();

  const [tvSearch, setTvSearch] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('All');
  const [selectedCountry, setSelectedCountry] = useState<string>('All');

  // Filter TV channels across 20 standard TV categories, language, country and search query
  const tvChannels = useMemo(() => {
    const baseTv = channels.filter(c => c.type === 'tv');
    const seenUrls = new Set(baseTv.map(c => c.streamUrl));
    const combinedTv = [
      ...baseTv,
      ...sportsIptvChannels.filter(s => !seenUrls.has(s.streamUrl)),
    ];

    return combinedTv.filter(channel => {
      // Category filter
      if (selectedCategory !== 'All') {
        const cat = channel.category.toLowerCase();
        const sel = selectedCategory.toLowerCase();
        const isSoccerMatch = (sel === 'soccer' || sel === 'football') && (cat.includes('soccer') || cat.includes('football'));
        const isWrestlingMatch = (sel.includes('wwe') || sel.includes('wrestling')) && (cat.includes('wwe') || cat.includes('wrestling'));
        if (!isSoccerMatch && !isWrestlingMatch && !cat.includes(sel) && !sel.includes(cat)) return false;
      }

      // Language filter
      if (selectedLanguage !== 'All' && channel.language !== selectedLanguage) return false;

      // Country filter
      if (selectedCountry !== 'All' && channel.country !== selectedCountry) return false;

      // Search query
      if (tvSearch.trim()) {
        const query = tvSearch.toLowerCase();
        const matchesName = channel.name.toLowerCase().includes(query);
        const matchesDesc = channel.description.toLowerCase().includes(query);
        const matchesProg = channel.currentProgram?.toLowerCase().includes(query);
        const matchesBroadcaster = channel.broadcaster?.toLowerCase().includes(query);
        if (!matchesName && !matchesDesc && !matchesProg && !matchesBroadcaster) return false;
      }

      return true;
    });
  }, [channels, sportsIptvChannels, selectedCategory, selectedLanguage, selectedCountry, tvSearch]);

  const clearFilters = () => {
    setSelectedCategory('All');
    setSelectedLanguage('All');
    setSelectedCountry('All');
    setTvSearch('');
  };

  const hasActiveFilters = selectedCategory !== 'All' || selectedLanguage !== 'All' || selectedCountry !== 'All' || tvSearch !== '';

  return (
    <div className="space-y-6 pb-24">
      {/* Active Streaming Video Player */}
      {activeTV && (
        <section className="scroll-mt-20">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping" />
              <h2 className="text-sm font-bold tracking-wider text-slate-300 uppercase">
                Now Streaming Live: {activeTV.name}
              </h2>
            </div>
            <button
              onClick={closeTVPlayer}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>Close Player</span>
            </button>
          </div>
          <VideoPlayer channel={activeTV} onClose={closeTVPlayer} />
        </section>
      )}

      {/* Header and Filter Toolbar */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-2.5">
              <Tv className="w-7 h-7 text-amber-400" />
              <span>Worldwide Live TV</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Official Free-to-Air streams covering World News, India, USA, Sports, Movies, Kids, and Regional TV.
            </p>
          </div>

          {/* Actions: IPTV Playlist & EPG, Sync EPG, Country Directory & Search */}
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => setCurrentTab('cricket')}
              className="px-3.5 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/35 text-emerald-300 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <Trophy className="w-3.5 h-3.5 text-emerald-400" />
              <span>Cricket Hub</span>
            </button>

            <button
              onClick={() => setCurrentTab('iptv')}
              className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0 shadow-sm shadow-amber-500/20"
            >
              <ListVideo className="w-3.5 h-3.5" />
              <span>IPTV Playlist ({iptvChannels.length > 0 ? iptvChannels.length.toLocaleString() : 'M3U8'}) &amp; EPG</span>
            </button>

            <button
              onClick={() => void loadEpgForChannels(tvChannels.slice(0, 25), true)}
              disabled={isLoadingEpg || tvChannels.length === 0}
              className="px-3 py-2 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 text-sky-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingEpg ? 'animate-spin' : ''}`} />
              <span>{isLoadingEpg ? 'Syncing EPG...' : 'Sync EPG'}</span>
            </button>

            <button
              onClick={() => void syncSportsIptv()}
              disabled={isLoadingSportsIptv}
              className="px-3 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0 disabled:opacity-50"
            >
              <Activity className={`w-3.5 h-3.5 ${isLoadingSportsIptv ? 'animate-spin' : ''}`} />
              <span>{isLoadingSportsIptv ? 'Syncing Sports...' : `Sports M3U (${sportsIptvChannels.length})`}</span>
            </button>

            <button
              onClick={() => setCurrentTab('countries')}
              className="px-3.5 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Browse by Country</span>
            </button>

            {/* Search Bar */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={tvSearch}
                onChange={e => setTvSearch(e.target.value)}
                placeholder="Search channels, shows, news..."
                className="w-full pl-9 pr-8 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
              />
              {tvSearch && (
                <button
                  onClick={() => setTvSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 20 Standardized TV Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none text-xs">
          {TV_CATEGORIES_LIST.map(cat => {
            const isActive = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-sm shadow-amber-500/20'
                    : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Filter Bar: Country & Language Pills */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-slate-900">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
            <span className="text-slate-400 font-semibold shrink-0">Country:</span>
            {ALL_COUNTRIES.slice(0, 10).map(c => (
              <button
                key={c}
                onClick={() => setSelectedCountry(c)}
                className={`px-2.5 py-1 rounded-lg text-[11px] whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                  selectedCountry === c
                    ? 'bg-slate-200 text-slate-950 font-bold'
                    : 'bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-800/80'
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-xs text-amber-400 hover:text-amber-300 underline underline-offset-2 cursor-pointer"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Channel Count Bar */}
      <div className="flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>Showing <strong>{tvChannels.length}</strong> active TV channels</span>
        </div>
        <span className="text-[11px] font-mono text-slate-400">100% Verified Legal Public Feeds</span>
      </div>

      {/* Channel Cards Grid with logo, name, country, language, category, live status, stream quality, and play button */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {tvChannels.map((channel, idx) => {
          const isFav = isFavorite(channel.id);
          const isCurrent = activeTV?.id === channel.id;
          const isRestricted = isChannelRestricted(channel);
          const epgPrograms = findEpgProgramsForChannel(channel, epgProgramsByChannelId);
          const epgSummary = getCurrentAndUpcoming(epgPrograms);

          return (
            <div
              key={`${channel.id}-${idx}`}
              className={`group relative rounded-2xl bg-slate-900 border p-4 flex flex-col justify-between gap-3 transition-all hover:shadow-xl ${
                isCurrent 
                  ? 'border-amber-500 shadow-md shadow-amber-500/10' 
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              <div>
                {/* Header Row: Logo, Live Status, Quality */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="w-12 h-12 rounded-xl bg-slate-950 border border-slate-800 p-1.5 flex items-center justify-center shrink-0 overflow-hidden group-hover:scale-105 transition-transform">
                    <img
                      src={channel.logoUrl}
                      alt={channel.name}
                      className="w-full h-full object-contain"
                      loading="lazy"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-600/20 text-red-400 border border-red-500/30 text-[9px] font-black uppercase">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                      LIVE
                    </span>
                    <span className="px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 text-[10px] font-mono">
                      {channel.quality?.[0] || '1080p'}
                    </span>
                  </div>
                </div>

                {/* Channel Name & Category */}
                <h3 className="text-sm font-bold text-white group-hover:text-amber-400 transition-colors line-clamp-1">
                  {channel.name}
                </h3>

                <div className="flex flex-wrap items-center gap-1.5 mt-1 text-[11px] text-slate-400">
                  <span className="text-slate-300 font-semibold">{channel.country}</span>
                  <span>•</span>
                  <span>{channel.language}</span>
                  <span>•</span>
                  <span className="text-amber-400">{channel.category}</span>
                </div>

                <p className="text-[11px] text-slate-400 line-clamp-2 mt-2 leading-relaxed">
                  {channel.description}
                </p>

                {epgSummary.currentProgram && (
                  <div className="mt-2.5 p-2 rounded-xl bg-slate-950 border border-slate-800/90 space-y-1">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-amber-400 font-bold uppercase flex items-center gap-1">
                        <CalendarClock className="w-3 h-3" />
                        <span>On Now</span>
                      </span>
                      <span className="font-mono text-slate-400">
                        {formatEpgTime(epgSummary.currentProgram.startMs)}–{formatEpgTime(epgSummary.currentProgram.stopMs)}
                      </span>
                    </div>
                    <p className="text-[11px] font-semibold text-white line-clamp-1">
                      {epgSummary.currentProgram.title}
                    </p>
                    {epgSummary.nextProgram && (
                      <p className="text-[10px] text-slate-400 line-clamp-1">
                        <span className="text-sky-400 font-semibold">Next:</span> {epgSummary.nextProgram.title}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Action Buttons: Watch Live & Favorite */}
              <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800/80">
                <button
                  onClick={() => playTVChannel(channel)}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    isCurrent
                      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                      : 'bg-slate-800 hover:bg-amber-500 text-slate-200 hover:text-slate-950'
                  }`}
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>{isCurrent ? 'Streaming Now' : 'Watch Live'}</span>
                </button>

                <button
                  onClick={() => toggleFavorite(channel.id)}
                  title={isFav ? 'Remove from favorites' : 'Add to favorites'}
                  className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                    isFav
                      ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-rose-500' : ''}`} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {tvChannels.length === 0 && (
        <div className="p-12 text-center rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <Tv className="w-8 h-8 text-slate-500 mx-auto" />
          <h3 className="text-sm font-bold text-white">No Live TV Channels Match Your Filter</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Try resetting your category or search query to view all available worldwide channels.
          </p>
          <button
            onClick={clearFilters}
            className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 text-xs font-bold hover:bg-amber-400 transition-colors cursor-pointer"
          >
            Clear Filters
          </button>
        </div>
      )}
    </div>
  );
};
