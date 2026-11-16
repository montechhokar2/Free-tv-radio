import React, { useState, useMemo } from 'react';
import { 
  Search, 
  X, 
  Tv, 
  Radio, 
  Sparkles, 
  Filter, 
  CheckCircle2, 
  Globe, 
  SlidersHorizontal,
  Flame,
  Volume2
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ChannelCard } from '../common/ChannelCard';
import { ALL_CATEGORIES, ALL_LANGUAGES, ALL_COUNTRIES } from '../../data/initialChannels';
import { MediaType } from '../../types';

export const SearchSection: React.FC = () => {
  const { channels, sportsIptvChannels, searchQuery, setSearchQuery } = useApp();
  const [selectedType, setSelectedType] = useState<MediaType | 'all'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('All');
  const [selectedCountry, setSelectedCountry] = useState<string>('All');
  const [onlyWorking, setOnlyWorking] = useState<boolean>(false);
  const [onlyHD, setOnlyHD] = useState<boolean>(false);
  const [visibleCount, setVisibleCount] = useState<number>(36);

  const popularSuggestions = [
    'Cricket',
    'Soccer',
    'WWE',
    'World News', 
    'BBC', 
    'Bollywood', 
    'DD News', 
    'Real Madrid',
    'Radio Garden',
    'FIFA',
    'NASA TV'
  ];

  const filteredResults = useMemo(() => {
    const seenUrls = new Set(channels.map(c => c.streamUrl));
    const searchableChannels = [
      ...channels,
      ...sportsIptvChannels.filter(s => !seenUrls.has(s.streamUrl)),
    ];
    return searchableChannels.filter(channel => {
      // 1. Media Type Filter (TV station vs Radio station)
      if (selectedType !== 'all' && channel.type !== selectedType) return false;

      // 2. Category / Genre Filter
      if (selectedCategory !== 'All') {
        const cat = channel.category.toLowerCase();
        const sel = selectedCategory.toLowerCase();
        if (!cat.includes(sel) && !sel.includes(cat)) return false;
      }

      // 3. Language Filter
      if (selectedLanguage !== 'All' && channel.language.toLowerCase() !== selectedLanguage.toLowerCase()) return false;

      // 4. Country Filter
      if (selectedCountry !== 'All' && channel.country.toLowerCase() !== selectedCountry.toLowerCase()) return false;

      // 5. Currently Working Filter
      if (onlyWorking && channel.isLive === false) return false;

      // 6. HD Channels Filter
      if (onlyHD) {
        const q = (channel.quality?.[0] || '').toLowerCase();
        const isHd = q.includes('1080') || q.includes('720') || q.includes('hd');
        if (!isHd) return false;
      }

      // 7. Search Query across Channel name, Country, Language, Category, Broadcaster, and Description
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const inName = channel.name.toLowerCase().includes(q);
        const inDesc = channel.description.toLowerCase().includes(q);
        const inProg = channel.currentProgram?.toLowerCase().includes(q);
        const inLang = channel.language.toLowerCase().includes(q);
        const inCat = channel.category.toLowerCase().includes(q);
        const inCountry = channel.country.toLowerCase().includes(q);
        const inBroadcaster = channel.broadcaster?.toLowerCase().includes(q);
        if (!inName && !inDesc && !inProg && !inLang && !inCat && !inCountry && !inBroadcaster) return false;
      }

      return true;
    });
  }, [channels, sportsIptvChannels, selectedType, selectedCategory, selectedLanguage, selectedCountry, onlyWorking, onlyHD, searchQuery]);

  const clearAll = () => {
    setSearchQuery('');
    setSelectedType('all');
    setSelectedCategory('All');
    setSelectedLanguage('All');
    setSelectedCountry('All');
    setOnlyWorking(false);
    setOnlyHD(false);
    setVisibleCount(36);
  };

  const hasActiveFilters = 
    selectedType !== 'all' || 
    selectedCategory !== 'All' || 
    selectedLanguage !== 'All' || 
    selectedCountry !== 'All' || 
    onlyWorking || 
    onlyHD;

  const visibleResults = filteredResults.slice(0, visibleCount);

  return (
    <div className="space-y-6 pb-8">
      {/* Search Header */}
      <div>
        <h1 className="font-display text-fluid-title font-extrabold text-white flex items-center gap-2.5">
          <Search className="w-6 h-6 sm:w-7 sm:h-7 text-amber-400 shrink-0" />
          <span>Worldwide Global Search</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Search across thousands of free TV channels and radio stations by channel name, country, language, genre, or broadcaster.
        </p>
      </div>

      {/* Main Search Input Box */}
      <div className="relative">
        <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={e => {
            setSearchQuery(e.target.value);
            setVisibleCount(36);
          }}
          placeholder="Search channel name, country, genre, artist, show, or broadcaster..."
          className="w-full min-h-[48px] pl-12 pr-12 py-3 bg-slate-900 border border-slate-700/80 rounded-2xl text-base text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 transition-all shadow-inner"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            aria-label="Clear search query"
            className="absolute right-2 top-1/2 -translate-y-1/2 min-w-[40px] min-h-[40px] flex items-center justify-center text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Suggestion Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
        <span className="text-slate-400 font-medium shrink-0">Trending Searches:</span>
        {popularSuggestions.map(term => (
          <button
            key={term}
            onClick={() => {
              setSearchQuery(term);
              setVisibleCount(36);
            }}
            className="min-h-[38px] px-3 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-amber-400 whitespace-nowrap shrink-0 transition-colors cursor-pointer"
          >
            {term}
          </button>
        ))}
      </div>

      {/* Type Toggle & Filters */}
      <div className="space-y-3 p-3.5 sm:p-4 bg-slate-900/60 border border-slate-800 rounded-2xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Media Type Segmented Buttons (TV station vs Radio station vs All) */}
          <div className="w-full sm:w-auto flex items-center gap-1 p-1 bg-slate-950 rounded-xl border border-slate-800">
            <button
              onClick={() => {
                setSelectedType('all');
                setVisibleCount(36);
              }}
              className={`flex-1 sm:flex-initial min-h-[40px] px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                selectedType === 'all' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              All
            </button>
            <button
              onClick={() => {
                setSelectedType('tv');
                setVisibleCount(36);
              }}
              className={`flex-1 sm:flex-initial min-h-[40px] px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                selectedType === 'tv' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Tv className="w-3.5 h-3.5" />
              <span>TV</span>
            </button>
            <button
              onClick={() => {
                setSelectedType('radio');
                setVisibleCount(36);
              }}
              className={`flex-1 sm:flex-initial min-h-[40px] px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                selectedType === 'radio' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Radio className="w-3.5 h-3.5" />
              <span>Radio</span>
            </button>
          </div>

          {/* Quick Checkbox Toggles: Working & HD */}
          <div className="flex flex-wrap items-center gap-4 text-xs">
            <label className="min-h-[36px] flex items-center gap-2 text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={onlyHD}
                onChange={e => setOnlyHD(e.target.checked)}
                className="w-4 h-4 rounded accent-amber-500"
              />
              <span>HD Only</span>
            </label>

            <label className="min-h-[36px] flex items-center gap-2 text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={onlyWorking}
                onChange={e => setOnlyWorking(e.target.checked)}
                className="w-4 h-4 rounded accent-emerald-500"
              />
              <span>Live Verified Only</span>
            </label>
          </div>
        </div>

        {/* Secondary Select Dropdowns: Country, Category, Language */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-slate-800/80">
          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Country</label>
            <select
              value={selectedCountry}
              onChange={e => {
                setSelectedCountry(e.target.value);
                setVisibleCount(36);
              }}
              className="w-full min-h-[44px] bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-base sm:text-xs text-slate-200 focus:outline-none focus:border-amber-500 cursor-pointer"
            >
              <option value="All">All Countries</option>
              {ALL_COUNTRIES.filter(c => c !== 'All').map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Category / Genre</label>
            <select
              value={selectedCategory}
              onChange={e => {
                setSelectedCategory(e.target.value);
                setVisibleCount(36);
              }}
              className="w-full min-h-[44px] bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-base sm:text-xs text-slate-200 focus:outline-none focus:border-amber-500 cursor-pointer"
            >
              <option value="All">All Categories</option>
              {ALL_CATEGORIES.filter(c => c !== 'All').map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Language</label>
            <select
              value={selectedLanguage}
              onChange={e => {
                setSelectedLanguage(e.target.value);
                setVisibleCount(36);
              }}
              className="w-full min-h-[44px] bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-base sm:text-xs text-slate-200 focus:outline-none focus:border-amber-500 cursor-pointer"
            >
              <option value="All">All Languages</option>
              {ALL_LANGUAGES.filter(l => l !== 'All').map(l => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>
        </div>

        {hasActiveFilters && (
          <div className="flex justify-end pt-1">
            <button
              onClick={clearAll}
              className="min-h-[36px] text-xs text-amber-400 hover:text-amber-300 underline cursor-pointer"
            >
              Reset all search filters
            </button>
          </div>
        )}
      </div>

      {/* Results Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
        <div>
          Showing <strong className="text-white">{visibleResults.length}</strong> of{' '}
          <strong className="text-white">{filteredResults.length}</strong> matching broadcast{filteredResults.length === 1 ? '' : 's'}
        </div>
        <div className="flex items-center gap-1.5 text-emerald-400">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>100% Free Public Streams</span>
        </div>
      </div>

      {/* Results Grid */}
      {filteredResults.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5 sm:gap-4">
            {visibleResults.map((channel, idx) => (
              <ChannelCard key={`${channel.id}-${idx}`} channel={channel} />
            ))}
          </div>

          {visibleResults.length < filteredResults.length && (
            <div className="flex justify-center pt-2">
              <button
                onClick={() => setVisibleCount(prev => prev + 36)}
                className="min-h-[44px] px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-amber-400 text-xs font-bold transition-colors cursor-pointer"
              >
                Load More Results ({filteredResults.length - visibleResults.length} remaining)
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="p-8 sm:p-12 text-center rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <Search className="w-8 h-8 text-slate-500 mx-auto" />
          <h3 className="text-sm font-bold text-white">No Broadcasts Matched Your Query</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Try adjusting your search terms or clearing the country and category filters.
          </p>
          <button
            onClick={clearAll}
            className="min-h-[44px] px-5 py-2 rounded-xl bg-amber-500 text-slate-950 text-xs font-bold hover:bg-amber-400 transition-colors cursor-pointer"
          >
            Clear Filters &amp; Show All
          </button>
        </div>
      )}
    </div>
  );
};
