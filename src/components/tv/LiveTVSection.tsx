import React, { useState, useMemo } from 'react';
import { 
  Tv, 
  Search, 
  Globe, 
  X, 
  Heart, 
  Play, 
  Activity,
  RefreshCw,
  CalendarClock,
  ListVideo,
  Trophy,
  PanelRightClose,
  PanelRightOpen,
  Clock
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { VideoPlayer } from '../player/VideoPlayer';
import { TV_CATEGORIES_LIST, ALL_COUNTRIES } from '../../data/initialChannels';
import { Channel } from '../../types';
import {
  findEpgProgramsForChannel,
  getCurrentAndUpcoming,
  formatEpgTime
} from '../../services/epgService';
import { useTabletViewport } from '../../hooks/useTabletViewport';
import { getDeviceRuntimeProfile } from '../../services/devicePerformance';

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
    epgProgramsByChannelId,
    loadEpgForChannels,
    isLoadingEpg,
    iptvChannels,
    sportsIptvChannels,
    isLoadingSportsIptv,
    syncSportsIptv,
    user
  } = useApp();

  const viewport = useTabletViewport();
  const runtimeProfile = useMemo(() => getDeviceRuntimeProfile(), []);
  const pageStep = runtimeProfile.recommendedPageSize;

  const [tvSearch, setTvSearch] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('All');
  const [selectedCountry, setSelectedCountry] = useState<string>('All');
  const [visibleCount, setVisibleCount] = useState<number>(pageStep);

  // Two-panel tablet Live TV drawer states
  const [isChannelPanelOpen, setIsChannelPanelOpen] = useState<boolean>(true);
  const [panelTab, setPanelTab] = useState<'all' | 'favorites' | 'recent'>('all');
  const [panelSearch, setPanelSearch] = useState<string>('');
  const [panelCategory, setPanelCategory] = useState<string>('All');

  // Unified pool of available TV + Sports M3U channels
  const allCombinedTv = useMemo(() => {
    const baseTv = channels.filter(c => c.type === 'tv');
    const seenUrls = new Set(baseTv.map(c => c.streamUrl));
    return [
      ...baseTv,
      ...sportsIptvChannels.filter(s => !seenUrls.has(s.streamUrl)),
    ];
  }, [channels, sportsIptvChannels]);

  // Filter TV channels across 20 standard TV categories, language, country and search query
  const tvChannels = useMemo(() => {
    return allCombinedTv.filter(channel => {
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
  }, [allCombinedTv, selectedCategory, selectedLanguage, selectedCountry, tvSearch]);

  // Lookup map across TV + IPTV channels for Favorites / Recently Watched inside the right drawer
  const searchableTvPool = useMemo(() => {
    const seen = new Set<string>();
    const combined: Channel[] = [];
    for (const ch of [...allCombinedTv, ...iptvChannels]) {
      if (!seen.has(ch.id)) {
        seen.add(ch.id);
        combined.push(ch);
      }
    }
    return combined;
  }, [allCombinedTv, iptvChannels]);

  const panelChannels = useMemo(() => {
    let source: Channel[] = allCombinedTv;
    if (panelTab === 'favorites') {
      const favSet = new Set(user.favorites);
      source = searchableTvPool.filter(c => favSet.has(c.id));
    } else if (panelTab === 'recent') {
      const byId = new Map(searchableTvPool.map(c => [c.id, c]));
      source = user.recentIds.map(id => byId.get(id)).filter(Boolean) as Channel[];
    }

    return source.filter(ch => {
      if (panelCategory !== 'All') {
        const cat = ch.category.toLowerCase();
        const sel = panelCategory.toLowerCase();
        if (!cat.includes(sel) && !sel.includes(cat)) return false;
      }
      if (panelSearch.trim()) {
        const q = panelSearch.toLowerCase();
        const matchName = ch.name.toLowerCase().includes(q);
        const matchCat = ch.category.toLowerCase().includes(q);
        const matchCountry = ch.country.toLowerCase().includes(q);
        if (!matchName && !matchCat && !matchCountry) return false;
      }
      return true;
    });
  }, [allCombinedTv, searchableTvPool, panelTab, user.favorites, user.recentIds, panelCategory, panelSearch]);

  const activeChannelEpg = useMemo(() => {
    if (!activeTV) return null;
    const programs = findEpgProgramsForChannel(activeTV, epgProgramsByChannelId);
    return getCurrentAndUpcoming(programs);
  }, [activeTV, epgProgramsByChannelId]);

  const clearFilters = () => {
    setSelectedCategory('All');
    setSelectedLanguage('All');
    setSelectedCountry('All');
    setTvSearch('');
    setVisibleCount(pageStep);
  };

  const hasActiveFilters = selectedCategory !== 'All' || selectedLanguage !== 'All' || selectedCountry !== 'All' || tvSearch !== '';
  const visibleChannels = tvChannels.slice(0, visibleCount);

  return (
    <div className="space-y-6 pb-8">
      {/* Dedicated Two-Panel Tablet Live TV Workspace (65% Left Player/Info + 35% Right Channel Panel in Landscape; Stacked in Portrait) */}
      {activeTV && (
        <section
          aria-label="Live TV Two-Panel Tablet Player"
          className="scroll-mt-20 rounded-2xl sm:rounded-3xl bg-slate-900/90 border border-slate-800 p-3 sm:p-4 lg:p-5 shadow-2xl space-y-3"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping shrink-0" />
              <h2 className="text-xs sm:text-sm font-bold tracking-wider text-white uppercase truncate">
                Now Streaming: {activeTV.name}
              </h2>
              <span className="hidden md:inline-block px-2 py-0.5 rounded bg-slate-800 text-[10px] font-semibold text-amber-400 border border-slate-700">
                {activeTV.category} · {activeTV.language}
              </span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setIsChannelPanelOpen(prev => !prev)}
                aria-expanded={isChannelPanelOpen}
                aria-label={isChannelPanelOpen ? 'Collapse channel panel' : 'Expand channel panel'}
                className={`min-h-[40px] px-3 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-colors cursor-pointer ${
                  isChannelPanelOpen
                    ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 hover:bg-amber-500/25'
                    : 'bg-slate-950 border-slate-800 text-slate-200 hover:bg-slate-800'
                }`}
              >
                {isChannelPanelOpen ? (
                  <>
                    <PanelRightClose className="w-4 h-4" />
                    <span>Hide Channels</span>
                  </>
                ) : (
                  <>
                    <PanelRightOpen className="w-4 h-4" />
                    <span>Show Channels</span>
                  </>
                )}
              </button>

              <button
                onClick={closeTVPlayer}
                className="min-h-[40px] px-2.5 rounded-lg text-xs text-slate-300 hover:text-white bg-slate-950 border border-slate-800 flex items-center gap-1 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                <span>Close</span>
              </button>
            </div>
          </div>

          <div
            className={`grid gap-4 items-start ${
              isChannelPanelOpen
                ? viewport.isLandscape
                  ? 'grid-cols-1 lg:grid-cols-[minmax(0,65fr)_minmax(0,35fr)]'
                  : 'grid-cols-1 lg:grid-cols-[minmax(0,65fr)_minmax(0,35fr)]'
                : 'grid-cols-1'
            }`}
          >
            {/* LEFT PANEL: Video Player + Channel Info + Current Programme */}
            <div className="space-y-3 min-w-0">
              <VideoPlayer channel={activeTV} onClose={closeTVPlayer} />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Channel Information */}
                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-xl bg-slate-900 border border-slate-800 p-1 flex items-center justify-center shrink-0 overflow-hidden">
                      {activeTV.logoUrl ? (
                        <img
                          src={activeTV.logoUrl}
                          alt={activeTV.name}
                          className="w-full h-full object-contain"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <Tv className="w-5 h-5 text-amber-400" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-white truncate">{activeTV.name}</h3>
                      <p className="text-[11px] text-slate-400 truncate">
                        {activeTV.broadcaster ? `${activeTV.broadcaster} · ` : ''}
                        {activeTV.country} · {activeTV.language}
                      </p>
                      <p className="text-[10px] text-amber-400 font-semibold mt-0.5 truncate">
                        {activeTV.quality?.[0] || '1080p HD'} · {activeTV.category}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleFavorite(activeTV.id)}
                    aria-label={isFavorite(activeTV.id) ? 'Remove active channel favorite' : 'Favorite active channel'}
                    className={`min-w-[44px] min-h-[44px] rounded-xl border flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                      isFavorite(activeTV.id)
                        ? 'bg-rose-500/15 border-rose-500/40 text-rose-400'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${isFavorite(activeTV.id) ? 'fill-rose-500' : ''}`} />
                  </button>
                </div>

                {/* Current Programme Card */}
                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-amber-400 font-black uppercase tracking-wider flex items-center gap-1">
                      <CalendarClock className="w-3.5 h-3.5" />
                      <span>Current Programme</span>
                    </span>
                    {activeChannelEpg?.currentProgram ? (
                      <span className="font-mono text-slate-300">
                        {formatEpgTime(activeChannelEpg.currentProgram.startMs)} –{' '}
                        {formatEpgTime(activeChannelEpg.currentProgram.stopMs)}
                      </span>
                    ) : (
                      <span className="font-mono text-emerald-400">24x7 LIVE</span>
                    )}
                  </div>
                  <p className="text-xs sm:text-sm font-bold text-white line-clamp-1">
                    {activeChannelEpg?.currentProgram?.title || activeTV.currentProgram || `${activeTV.name} Live Broadcast`}
                  </p>
                  {activeChannelEpg?.currentProgram ? (
                    <div className="space-y-1">
                      <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className="h-full bg-amber-500 transition-all duration-300"
                          style={{ width: `${activeChannelEpg.progressPercent}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-slate-400 truncate">
                        {activeChannelEpg.nextProgram
                          ? `Next (${formatEpgTime(activeChannelEpg.nextProgram.startMs)}): ${activeChannelEpg.nextProgram.title}`
                          : `${activeChannelEpg.remainingMinutes}m remaining`}
                      </p>
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-400 line-clamp-1">
                      {activeTV.description}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* RIGHT PANEL: Collapsible Tablet Channel Drawer (Logos, Search, Categories, Favourites, Recent) */}
            {isChannelPanelOpen && (
              <aside
                aria-label="Live TV Channel List Panel"
                className="rounded-2xl bg-slate-950 border border-slate-800 p-3 flex flex-col gap-2.5 h-[420px] lg:h-[520px] min-w-0"
              >
                {/* Drawer Tabs: All / Favourites / Recent */}
                <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                  {(
                    [
                      { id: 'all', label: 'All' },
                      { id: 'favorites', label: 'Favourites' },
                      { id: 'recent', label: 'Recent' },
                    ] as const
                  ).map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setPanelTab(tab.id)}
                      className={`min-h-[36px] px-2 py-1 rounded-lg font-bold transition-colors cursor-pointer truncate ${
                        panelTab === tab.id
                          ? 'bg-amber-500 text-slate-950'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Drawer Search & Category Filter */}
                <div className="flex flex-col sm:flex-row lg:flex-col gap-2">
                  <div className="relative flex-1">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={panelSearch}
                      onChange={e => setPanelSearch(e.target.value)}
                      placeholder="Quick channel search..."
                      aria-label="Search channel panel"
                      className="w-full min-h-[40px] pl-8 pr-8 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-base sm:text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
                    />
                    {panelSearch && (
                      <button
                        onClick={() => setPanelSearch('')}
                        aria-label="Clear channel panel search"
                        className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-white cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <select
                    value={panelCategory}
                    onChange={e => setPanelCategory(e.target.value)}
                    aria-label="Filter channel panel by category"
                    className="min-h-[40px] px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-base sm:text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                  >
                    {TV_CATEGORIES_LIST.map(cat => (
                      <option key={cat} value={cat}>
                        {cat === 'All' ? 'All Categories' : cat}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Channel Rows */}
                <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
                  {panelChannels.length === 0 ? (
                    <div className="py-10 text-center space-y-2 text-slate-400">
                      {panelTab === 'favorites' ? (
                        <>
                          <Heart className="w-6 h-6 mx-auto text-slate-600" />
                          <p className="text-xs font-medium">No favourite TV channels yet.</p>
                        </>
                      ) : panelTab === 'recent' ? (
                        <>
                          <Clock className="w-6 h-6 mx-auto text-slate-600" />
                          <p className="text-xs font-medium">No recently watched TV channels yet.</p>
                        </>
                      ) : (
                        <>
                          <Tv className="w-6 h-6 mx-auto text-slate-600" />
                          <p className="text-xs font-medium">No matching channels.</p>
                        </>
                      )}
                    </div>
                  ) : (
                    panelChannels.slice(0, 60).map((ch, idx) => {
                      const isCurrent = ch.id === activeTV.id;
                      const isFav = isFavorite(ch.id);
                      return (
                        <div
                          key={`${ch.id}-panel-${idx}`}
                          className={`rounded-xl border p-2 flex items-center gap-2.5 transition-colors ${
                            isCurrent
                              ? 'bg-amber-500/15 border-amber-500/50'
                              : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <button
                            onClick={() => playTVChannel(ch)}
                            className="flex items-center gap-2.5 min-w-0 flex-1 text-left cursor-pointer"
                          >
                            <div className="w-10 h-10 rounded-lg bg-slate-950 border border-slate-800 p-1 flex items-center justify-center shrink-0 overflow-hidden">
                              {ch.logoUrl ? (
                                <img
                                  src={ch.logoUrl}
                                  alt={ch.name}
                                  loading="lazy"
                                  className="w-full h-full object-contain"
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                <Tv className="w-4 h-4 text-slate-400" />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className={`text-xs font-bold truncate ${isCurrent ? 'text-amber-400' : 'text-white'}`}>
                                {ch.name}
                              </p>
                              <p className="text-[10px] text-slate-400 truncate">
                                {ch.category} · {ch.country}
                              </p>
                            </div>
                          </button>
                          <button
                            onClick={() => toggleFavorite(ch.id)}
                            aria-label={isFav ? `Remove ${ch.name} from favorites` : `Add ${ch.name} to favorites`}
                            className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg text-slate-400 hover:text-rose-400 cursor-pointer shrink-0"
                          >
                            <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-rose-500 text-rose-500' : ''}`} />
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </aside>
            )}
          </div>
        </section>
      )}

      {/* Header and Filter Toolbar */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-fluid-title font-extrabold text-white flex items-center gap-2.5">
              <Tv className="w-6 h-6 sm:w-7 sm:h-7 text-amber-400 shrink-0" />
              <span>Worldwide Live TV</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Official Free-to-Air streams covering World News, India, USA, Sports, Movies, Kids, and Regional TV.
            </p>
          </div>

          {/* Actions: IPTV Playlist & EPG, Sync EPG, Country Directory & Search */}
          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
            <button
              onClick={() => setCurrentTab('cricket')}
              className="min-h-[44px] px-3.5 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/35 text-emerald-300 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <Trophy className="w-3.5 h-3.5 text-emerald-400" />
              <span>Cricket Hub</span>
            </button>

            <button
              onClick={() => setCurrentTab('iptv')}
              className="min-h-[44px] px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0 shadow-sm shadow-amber-500/20"
            >
              <ListVideo className="w-3.5 h-3.5" />
              <span>IPTV ({iptvChannels.length > 0 ? iptvChannels.length.toLocaleString() : 'M3U8'}) &amp; EPG</span>
            </button>

            <button
              onClick={() => void loadEpgForChannels(tvChannels.slice(0, 25), true)}
              disabled={isLoadingEpg || tvChannels.length === 0}
              className="min-h-[44px] px-3 py-2 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 text-sky-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingEpg ? 'animate-spin' : ''}`} />
              <span>{isLoadingEpg ? 'Syncing EPG...' : 'Sync EPG'}</span>
            </button>

            <button
              onClick={() => void syncSportsIptv()}
              disabled={isLoadingSportsIptv}
              className="min-h-[44px] px-3 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0 disabled:opacity-50"
            >
              <Activity className={`w-3.5 h-3.5 ${isLoadingSportsIptv ? 'animate-spin' : ''}`} />
              <span>{isLoadingSportsIptv ? 'Syncing...' : `Sports M3U (${sportsIptvChannels.length})`}</span>
            </button>

            <button
              onClick={() => setCurrentTab('countries')}
              className="min-h-[44px] px-3.5 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Countries</span>
            </button>

            {/* Search Bar */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={tvSearch}
                onChange={e => {
                  setTvSearch(e.target.value);
                  setVisibleCount(pageStep);
                }}
                placeholder="Search channels, shows, news..."
                className="w-full min-h-[44px] pl-9 pr-10 py-2 bg-slate-900 border border-slate-800 rounded-xl text-base sm:text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
              />
              {tvSearch && (
                <button
                  onClick={() => setTvSearch('')}
                  aria-label="Clear search"
                  className="absolute right-1 top-1/2 -translate-y-1/2 min-w-[36px] min-h-[36px] flex items-center justify-center text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
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
                onClick={() => {
                  setSelectedCategory(cat);
                  setVisibleCount(pageStep);
                }}
                className={`min-h-[40px] px-3.5 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
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
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-900">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs w-full sm:w-auto">
            <span className="text-slate-400 font-semibold shrink-0">Country:</span>
            {ALL_COUNTRIES.slice(0, 10).map(c => (
              <button
                key={c}
                onClick={() => {
                  setSelectedCountry(c);
                  setVisibleCount(pageStep);
                }}
                className={`min-h-[36px] px-2.5 py-1 rounded-lg text-[11px] whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
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
              className="min-h-[36px] px-2 text-xs text-amber-400 hover:text-amber-300 underline underline-offset-2 cursor-pointer"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Channel Count Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>
            Showing <strong>{visibleChannels.length}</strong> of <strong>{tvChannels.length}</strong> active TV channels
          </span>
        </div>
        <span className="text-[11px] font-mono text-slate-400">100% Verified Legal Public Feeds</span>
      </div>

      {/* Channel Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5 sm:gap-4">
        {visibleChannels.map((channel, idx) => {
          const isFav = isFavorite(channel.id);
          const isCurrent = activeTV?.id === channel.id;
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
                  className={`flex-1 min-h-[44px] py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
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
                  aria-label={isFav ? 'Remove from favorites' : 'Add to favorites'}
                  className={`min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl border transition-colors cursor-pointer ${
                    isFav
                      ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <Heart className={`w-4 h-4 ${isFav ? 'fill-rose-500' : ''}`} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {visibleChannels.length < tvChannels.length && (
        <div className="flex justify-center pt-2">
          <button
            onClick={() => setVisibleCount(prev => prev + pageStep)}
            className="min-h-[44px] px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-amber-400 text-xs font-bold transition-colors cursor-pointer"
          >
            Load More Channels ({tvChannels.length - visibleChannels.length} remaining)
          </button>
        </div>
      )}

      {tvChannels.length === 0 && (
        <div className="p-8 sm:p-12 text-center rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <Tv className="w-8 h-8 text-slate-500 mx-auto" />
          <h3 className="text-sm font-bold text-white">No Live TV Channels Match Your Filter</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Try resetting your category or search query to view all available worldwide channels.
          </p>
          <button
            onClick={clearFilters}
            className="min-h-[44px] px-5 py-2 rounded-xl bg-amber-500 text-slate-950 text-xs font-bold hover:bg-amber-400 transition-colors cursor-pointer"
          >
            Clear Filters
          </button>
        </div>
      )}
    </div>
  );
};
