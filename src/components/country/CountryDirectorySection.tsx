import React, { useState, useEffect, useMemo } from 'react';
import { 
  Globe, 
  Search, 
  Play, 
  Filter, 
  ShieldCheck, 
  Tv, 
  Radio, 
  Sparkles, 
  Heart, 
  Layers, 
  CheckCircle2, 
  Activity, 
  ChevronRight,
  RefreshCw,
  SlidersHorizontal
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { WORLD_COUNTRIES } from '../../services/iptvOrgService';
import { CountryDirectoryItem, Channel } from '../../types';
import { TV_CATEGORIES_LIST } from '../../data/initialChannels';
import { VideoPlayer } from '../player/VideoPlayer';

export const CountryDirectorySection: React.FC = () => {
  const { 
    selectedCountryItem, 
    setSelectedCountryItem, 
    countryLiveChannels, 
    isLoadingCountryChannels, 
    loadCountryChannels,
    playTVChannel,
    activeTV,
    closeTVPlayer,
    toggleFavorite,
    isFavorite,
    channels
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedRegion, setSelectedRegion] = useState<string>('All');

  // Load channels when selected country changes
  useEffect(() => {
    loadCountryChannels(selectedCountryItem);
  }, [selectedCountryItem, loadCountryChannels]);

  // Unique regions
  const regions = useMemo(() => {
    const set = new Set<string>();
    WORLD_COUNTRIES.forEach(c => set.add(c.region));
    return ['All', ...Array.from(set)];
  }, []);

  // Filtered countries based on region / country search
  const filteredCountries = useMemo(() => {
    return WORLD_COUNTRIES.filter(c => {
      if (selectedRegion !== 'All' && c.region !== selectedRegion) return false;
      return true;
    });
  }, [selectedRegion]);

  // Combined channels (live dynamically fetched + pre-curated channels)
  const displayChannels = useMemo(() => {
    // Merge channels for this country from main catalog and dynamic country list
    const pool = countryLiveChannels.length > 0 
      ? countryLiveChannels 
      : channels.filter(c => 
          c.type === 'tv' && (
            c.country.toLowerCase() === selectedCountryItem.name.toLowerCase() ||
            c.countryCode?.toLowerCase() === selectedCountryItem.code.toLowerCase()
          )
        );

    return pool.filter(ch => {
      if (selectedCategory !== 'All') {
        const cat = (ch.category || '').toLowerCase();
        const sel = selectedCategory.toLowerCase();
        if (!cat.includes(sel) && !sel.includes(cat)) return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = ch.name.toLowerCase().includes(q);
        const matchesCategory = ch.category.toLowerCase().includes(q);
        const matchesDesc = ch.description.toLowerCase().includes(q);
        const matchesLang = ch.language.toLowerCase().includes(q);
        if (!matchesName && !matchesCategory && !matchesDesc && !matchesLang) return false;
      }

      return true;
    });
  }, [countryLiveChannels, channels, selectedCountryItem, selectedCategory, searchQuery]);

  return (
    <div className="space-y-8 pb-24">
      {/* Active Streaming Video Player */}
      {activeTV && (
        <section className="scroll-mt-20">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping" />
              <h2 className="text-sm font-bold tracking-wider text-slate-300 uppercase">
                Now Streaming: {activeTV.name} ({activeTV.country})
              </h2>
            </div>
            <button
              onClick={closeTVPlayer}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
            >
              <span>Close Player</span>
            </button>
          </div>
          <VideoPlayer channel={activeTV} onClose={closeTVPlayer} />
        </section>
      )}

      {/* Hero Header Banner */}
      <section className="relative rounded-3xl p-6 sm:p-10 bg-gradient-to-r from-sky-950/70 via-slate-900 to-amber-950/40 border border-slate-800 shadow-xl overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[11px] font-bold uppercase tracking-wider mb-3">
            <Globe className="w-3.5 h-3.5" />
            <span>Country-Wise Channel Directory</span>
          </div>

          <h1 className="font-display text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
            Worldwide Live TV by Country
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
            Browse legally authorized Free-To-Air television channels from India, USA, UK, Canada, Australia, Germany, France, Japan, South Korea, UAE, Saudi Arabia, Pakistan, Bangladesh, Nepal, and across the globe.
          </p>

          <div className="flex flex-wrap items-center gap-4 mt-4 text-xs text-slate-400">
            <div className="flex items-center gap-1 text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
              <span>Real-Time IPTV-org Sync</span>
            </div>
            <div className="flex items-center gap-1 text-sky-400">
              <Activity className="w-4 h-4" />
              <span>24+ Nations Indexed</span>
            </div>
          </div>
        </div>
      </section>

      {/* Region and Country Selector Hub */}
      <div className="space-y-4">
        {/* Region Filter Tabs */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none text-xs">
            <span className="text-slate-400 font-semibold shrink-0 mr-1">Region:</span>
            {regions.map(r => (
              <button
                key={r}
                onClick={() => setSelectedRegion(r)}
                className={`px-3 py-1 rounded-xl text-xs font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                  selectedRegion === r
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          <button
            onClick={() => loadCountryChannels(selectedCountryItem)}
            disabled={isLoadingCountryChannels}
            title="Refresh current country streams"
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer shrink-0"
          >
            <RefreshCw className={`w-4 h-4 ${isLoadingCountryChannels ? 'animate-spin text-amber-400' : ''}`} />
          </button>
        </div>

        {/* Country Flags Carousel */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
          {filteredCountries.map(country => {
            const isSelected = selectedCountryItem.code === country.code;
            return (
              <button
                key={country.code}
                onClick={() => setSelectedCountryItem(country)}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                  isSelected
                    ? 'bg-amber-500/15 border-amber-500/50 shadow-md shadow-amber-500/10'
                    : 'bg-slate-900/80 hover:bg-slate-850 border-slate-800 hover:border-slate-700'
                }`}
              >
                <span className="text-2xl shrink-0">{country.flag}</span>
                <div className="min-w-0">
                  <div className={`text-xs font-bold truncate ${isSelected ? 'text-amber-400' : 'text-white'}`}>
                    {country.name}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">
                    {country.region}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Country Banner & Channel Controls */}
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{selectedCountryItem.flag}</span>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span>{selectedCountryItem.name} Television Network</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/30">
                {displayChannels.length} Streams
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Languages: {selectedCountryItem.popularLanguage} · Region: {selectedCountryItem.region}
            </p>
          </div>
        </div>

        {/* Search inside Country */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={`Search ${selectedCountryItem.name} channels...`}
            className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
          />
        </div>
      </div>

      {/* Categories Filter Strip */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none text-xs">
        {TV_CATEGORIES_LIST.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
              selectedCategory === cat
                ? 'bg-white text-slate-950 font-bold shadow-sm'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Loading Indicator */}
      {isLoadingCountryChannels && (
        <div className="p-12 text-center space-y-3">
          <div className="w-8 h-8 mx-auto border-3 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-400">Fetching live streams for {selectedCountryItem.name} from IPTV-org...</p>
        </div>
      )}

      {/* Channel Cards Grid with all 8 mandatory indicators:
          1. Channel logo
          2. Channel name
          3. Country
          4. Language
          5. Category
          6. Live status
          7. Stream quality
          8. Play button
      */}
      {!isLoadingCountryChannels && displayChannels.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {displayChannels.map((channel, idx) => {
            const isFav = isFavorite(channel.id);
            const isCurrentPlaying = activeTV?.id === channel.id;

            return (
              <div
                key={`${channel.id}-${idx}`}
                className="group relative rounded-2xl bg-slate-900 border border-slate-800 hover:border-amber-500/50 overflow-hidden flex flex-col justify-between transition-all hover:shadow-xl hover:shadow-amber-500/5"
              >
                {/* Card Top: Logo, Live Status, Quality, Favorite */}
                <div className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    {/* 1. Channel Logo */}
                    <div className="w-14 h-14 rounded-2xl bg-slate-950 border border-slate-800 p-2 flex items-center justify-center shrink-0 overflow-hidden group-hover:scale-105 transition-transform">
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

                    {/* Badges: 6. Live Status & 7. Stream Quality */}
                    <div className="flex flex-col items-end gap-1.5">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-600/20 text-red-400 border border-red-500/30 text-[10px] font-black uppercase tracking-wider">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                        LIVE 24/7
                      </span>

                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-mono font-semibold">
                        {channel.quality?.[0] || '1080p HD'}
                      </span>
                    </div>
                  </div>

                  {/* Channel Details */}
                  <div>
                    {/* 2. Channel Name */}
                    <h3 className="text-sm font-bold text-white group-hover:text-amber-400 transition-colors line-clamp-1">
                      {channel.name}
                    </h3>

                    {/* 3. Country & 4. Language & 5. Category */}
                    <div className="flex flex-wrap items-center gap-1.5 mt-1.5 text-[11px] text-slate-400">
                      <span className="font-semibold text-slate-300 flex items-center gap-1">
                        {selectedCountryItem.flag} {channel.country}
                      </span>
                      <span>•</span>
                      <span>{channel.language}</span>
                      <span>•</span>
                      <span className="px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-400 font-medium border border-amber-500/20">
                        {channel.category}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-400 line-clamp-2 mt-2 leading-relaxed">
                      {channel.description}
                    </p>
                  </div>
                </div>

                {/* Card Bottom: 8. Play Button & Favorite Toggle */}
                <div className="p-3 bg-slate-950/60 border-t border-slate-800 flex items-center justify-between gap-2">
                  <button
                    onClick={() => playTVChannel(channel)}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      isCurrentPlaying
                        ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                        : 'bg-slate-800 hover:bg-amber-500 text-slate-200 hover:text-slate-950'
                    }`}
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>{isCurrentPlaying ? 'Now Playing' : 'Watch Live'}</span>
                  </button>

                  <button
                    onClick={() => toggleFavorite(channel.id)}
                    title={isFav ? 'Remove from favorites' : 'Add to favorites'}
                    className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                      isFav 
                        ? 'bg-rose-500/10 border-rose-500/30 text-rose-400' 
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-rose-500' : ''}`} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {!isLoadingCountryChannels && displayChannels.length === 0 && (
        <div className="p-12 text-center rounded-2xl bg-slate-900/50 border border-slate-800 space-y-3">
          <Globe className="w-8 h-8 text-slate-500 mx-auto" />
          <h3 className="text-sm font-bold text-white">No channels found for {selectedCountryItem.name}</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Try resetting your search query or selecting a different category filter above to discover authorized free-to-air feeds.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('All');
            }}
            className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 text-xs font-bold hover:bg-amber-400 transition-colors cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      )}
    </div>
  );
};
