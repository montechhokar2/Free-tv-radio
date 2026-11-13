import React, { useState, useMemo, useEffect } from 'react';
import { 
  Radio, 
  Search, 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Moon, 
  Globe, 
  ShieldCheck, 
  X, 
  Heart, 
  Activity, 
  RefreshCw, 
  Sparkles,
  Music2,
  Clock,
  Globe2
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { RADIO_CATEGORIES_LIST, ALL_COUNTRIES } from '../../data/initialChannels';
import { Channel, SleepTimerOption } from '../../types';
import { searchRadioBrowser, fetchRadioByCountry, fetchRadioByTag } from '../../services/radioBrowserService';
import { RadioPlatformsHub } from './RadioPlatformsHub';

export const RadioSection: React.FC = () => {
  const { 
    channels, 
    activeRadio, 
    isRadioPlaying, 
    toggleRadioPlay, 
    playRadioStation,
    radioVolume,
    setRadioVolume,
    isRadioMuted,
    toggleRadioMute,
    sleepTimer, 
    setSleepTimer,
    toggleFavorite,
    isFavorite,
    liveRadioStations,
    isLoadingLiveRadio,
    syncRadioBrowser,
    user
  } = useApp();

  const [radioTab, setRadioTab] = useState<'stations' | 'platforms'>('stations');
  const [radioSearch, setRadioSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedCountry, setSelectedCountry] = useState<string>('All');
  const [apiSearchResults, setApiSearchResults] = useState<Channel[]>([]);
  const [isSearchingApi, setIsSearchingApi] = useState<boolean>(false);

  // Sync category changes with Radio Browser API
  const handleCategoryClick = (cat: string) => {
    setSelectedCategory(cat);
    if (cat !== 'All') {
      syncRadioBrowser(cat);
    } else {
      syncRadioBrowser();
    }
  };

  // Perform live Radio Browser API search on debounced query
  useEffect(() => {
    if (!radioSearch.trim() || radioSearch.length < 2) {
      setApiSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingApi(true);
      try {
        const results = await searchRadioBrowser(radioSearch, 25);
        setApiSearchResults(results);
      } catch (err) {
        console.warn('Live radio search error:', err);
      } finally {
        setIsSearchingApi(false);
      }
    }, 450);

    return () => clearTimeout(timer);
  }, [radioSearch]);

  // Combined stations: API search results > Live Radio Browser stations + Local Curated Stations
  const displayedStations = useMemo(() => {
    if (apiSearchResults.length > 0) {
      return apiSearchResults;
    }

    // Merge catalog radio channels + live fetched radio browser stations
    const pool = [...liveRadioStations, ...channels.filter(c => c.type === 'radio')];

    // Deduplicate by streamUrl / name
    const seenUrls = new Set<string>();
    const uniqueStations: Channel[] = [];

    for (const st of pool) {
      const key = (st.streamUrl || st.name).toLowerCase();
      if (!seenUrls.has(key)) {
        seenUrls.add(key);
        uniqueStations.push(st);
      }
    }

    return uniqueStations.filter(station => {
      if (selectedCategory !== 'All') {
        const cat = (station.category || '').toLowerCase();
        const sel = selectedCategory.toLowerCase();
        if (!cat.includes(sel) && !sel.includes(cat)) return false;
      }

      if (selectedCountry !== 'All') {
        const c = (station.country || '').toLowerCase();
        const selC = selectedCountry.toLowerCase();
        if (!c.includes(selC) && !selC.includes(c)) return false;
      }

      if (radioSearch.trim() && apiSearchResults.length === 0) {
        const q = radioSearch.toLowerCase();
        const inName = station.name.toLowerCase().includes(q);
        const inCountry = station.country.toLowerCase().includes(q);
        const inDesc = station.description.toLowerCase().includes(q);
        if (!inName && !inCountry && !inDesc) return false;
      }

      return true;
    });
  }, [apiSearchResults, liveRadioStations, channels, selectedCategory, selectedCountry, radioSearch]);

  // Recently played stations
  const recentStations = useMemo(() => {
    return user.recentIds
      .map(id => channels.find(c => c.id === id && c.type === 'radio'))
      .filter(Boolean) as Channel[];
  }, [user.recentIds, channels]);

  const timerOptions: SleepTimerOption[] = [0, 15, 30, 45, 60, 90];

  return (
    <div className="space-y-8 pb-28">
      {/* Radio Studio Showcase Banner */}
      <section className="relative rounded-3xl overflow-hidden bg-slate-900 border border-slate-800 shadow-xl">
        <div className="relative min-h-[260px] sm:min-h-[300px] flex items-center">
          <img 
            src="/src/assets/images/radio_studio_live_1794217863423.jpg" 
            alt="Radio Broadcast Studio" 
            className="absolute inset-0 w-full h-full object-cover filter brightness-[0.32] contrast-105"
            referrerPolicy="no-referrer"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/70 to-transparent" />

          <div className="relative z-10 max-w-2xl px-6 sm:px-10 py-8">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded bg-amber-500 text-slate-950 text-[10px] font-black tracking-widest uppercase">
                WORLDWIDE RADIO
              </span>
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold uppercase">
                RADIO BROWSER API CONNECTED
              </span>
            </div>

            <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight leading-tight mb-2">
              Worldwide Free Internet Radio
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-5 max-w-xl">
              Listen to thousands of live FM and online radio stations across Bollywood, English Pop, Punjabi, Classical, Jazz, Rock, News, Sports, and Devotional channels with continuous background audio playback.
            </p>

            {/* Quick Controls: Sleep timer & Live Status */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-850/90 border border-slate-700 text-xs text-slate-200">
                <Moon className="w-3.5 h-3.5 text-amber-400" />
                <span>Sleep Timer:</span>
                <select
                  value={sleepTimer}
                  onChange={e => setSleepTimer(Number(e.target.value) as SleepTimerOption)}
                  className="bg-transparent text-amber-400 font-semibold focus:outline-none cursor-pointer"
                >
                  {timerOptions.map(m => (
                    <option key={m} value={m} className="bg-slate-900 text-white">
                      {m === 0 ? 'Off' : `${m} mins`}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={() => syncRadioBrowser(selectedCategory)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-850/90 hover:bg-slate-800 border border-slate-700 text-xs text-slate-200 transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${isLoadingLiveRadio ? 'animate-spin' : ''}`} />
                <span>Sync Live Streams</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Radio Hub Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setRadioTab('stations')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
            radioTab === 'stations'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Radio className="w-4 h-4" />
          <span>Live Radio Stations ({displayedStations.length})</span>
        </button>

        <button
          onClick={() => setRadioTab('platforms')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
            radioTab === 'platforms'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Globe2 className="w-4 h-4" />
          <span>7 Global Radio Platforms (Radio Garden, Roam, Air Drift, Airtune...)</span>
        </button>
      </div>

      {/* When Platforms Tab Active, Show Platforms Hub Directly */}
      {radioTab === 'platforms' && (
        <RadioPlatformsHub />
      )}
      {recentStations.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-400" />
            <span>Recently Played Radio</span>
          </h3>

          <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
            {recentStations.slice(0, 6).map(st => (
              <button
                key={st.id}
                onClick={() => playRadioStation(st)}
                className="p-2.5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-amber-500/50 flex items-center gap-3 shrink-0 text-left transition-all cursor-pointer"
              >
                <img
                  src={st.logoUrl}
                  alt={st.name}
                  className="w-9 h-9 rounded-xl object-contain bg-slate-950 p-1"
                />
                <div className="pr-2">
                  <div className="text-xs font-bold text-white line-clamp-1">{st.name}</div>
                  <div className="text-[10px] text-amber-400">{st.category}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-xl font-bold text-white flex items-center gap-2">
              <Radio className="w-5 h-5 text-amber-400" />
              <span>Explore Radio Stations</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Live broadcast audio feeds synced from the global Radio Browser directory
            </p>
          </div>

          {/* Search by station or country */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={radioSearch}
              onChange={e => setRadioSearch(e.target.value)}
              placeholder="Search station name, country, genre..."
              className="w-full pl-9 pr-8 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
            />
            {radioSearch && (
              <button
                onClick={() => setRadioSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* 16 Standardized Radio Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none text-xs">
          {RADIO_CATEGORIES_LIST.map(cat => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => handleCategoryClick(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                    : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Country Quick Filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
          <span className="text-slate-400 font-semibold shrink-0 mr-1">Country:</span>
          {ALL_COUNTRIES.map(c => (
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
      </div>

      {/* Loading State */}
      {(isLoadingLiveRadio || isSearchingApi) && (
        <div className="p-8 text-center space-y-2">
          <div className="w-6 h-6 mx-auto border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-400">Loading radio streams from Radio Browser API...</p>
        </div>
      )}

      {/* Radio Station Cards Grid (Station logo, Station name, Country, Language, Genre, Play/Pause, Volume, Favorite) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {displayedStations.map((station, idx) => {
          const isCurrentStation = activeRadio?.id === station.id;
          const isPlayingThis = isCurrentStation && isRadioPlaying;
          const isFav = isFavorite(station.id);

          return (
            <div
              key={`${station.id}-${idx}`}
              className={`relative rounded-2xl bg-slate-900 border p-4 flex flex-col justify-between gap-4 transition-all hover:shadow-lg ${
                isCurrentStation
                  ? 'border-amber-500/80 bg-slate-900/90 shadow-md shadow-amber-500/10'
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              {/* Station Info */}
              <div className="flex items-start gap-3">
                {/* Station Logo */}
                <div className="relative w-12 h-12 rounded-2xl bg-slate-950 border border-slate-800 p-1.5 flex items-center justify-center shrink-0 overflow-hidden">
                  <img
                    src={station.logoUrl}
                    alt={station.name}
                    className="w-full h-full object-contain"
                    loading="lazy"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                  {isPlayingThis && (
                    <div className="absolute inset-0 bg-amber-500/20 backdrop-blur-[1px] flex items-center justify-center">
                      <div className="flex items-end gap-0.5 h-4">
                        <span className="w-1 bg-amber-400 animate-pulse h-full" />
                        <span className="w-1 bg-amber-400 animate-pulse h-2/3" />
                        <span className="w-1 bg-amber-400 animate-pulse h-5/6" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Name, Genre, Country, Language */}
                <div className="min-w-0 flex-1">
                  <h3 className="text-xs sm:text-sm font-bold text-white truncate">
                    {station.name}
                  </h3>

                  <div className="flex items-center gap-1.5 mt-1 text-[10px] text-slate-400">
                    <span className="text-amber-400 font-semibold truncate">{station.category}</span>
                    <span>•</span>
                    <span className="truncate">{station.country}</span>
                  </div>

                  <div className="text-[10px] text-slate-400 truncate mt-0.5">
                    {station.language} · {station.quality?.[0] || '128 kbps'}
                  </div>
                </div>
              </div>

              {/* Station Controls: Play/Pause, Favorite */}
              <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800/80">
                <button
                  onClick={() => {
                    if (isCurrentStation) {
                      toggleRadioPlay();
                    } else {
                      playRadioStation(station);
                    }
                  }}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    isPlayingThis
                      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                      : 'bg-slate-800 hover:bg-amber-500 text-slate-200 hover:text-slate-950'
                  }`}
                >
                  {isPlayingThis ? (
                    <>
                      <Pause className="w-3.5 h-3.5 fill-current" />
                      <span>Pause Radio</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Listen Live</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => toggleFavorite(station.id)}
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

      {displayedStations.length === 0 && !isLoadingLiveRadio && !isSearchingApi && (
        <div className="p-12 text-center rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <Radio className="w-8 h-8 text-slate-500 mx-auto" />
          <h3 className="text-sm font-bold text-white">No Radio Stations Found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Try searching for another genre or clearing the country filter to explore global live broadcasts.
          </p>
          <button
            onClick={() => {
              setSelectedCategory('All');
              setSelectedCountry('All');
              setRadioSearch('');
              syncRadioBrowser();
            }}
            className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 text-xs font-bold hover:bg-amber-400 transition-colors cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      )}

      {/* Worldwide Radio Platforms Section */}
      {radioTab === 'stations' && (
        <div className="pt-6 border-t border-slate-800">
          <RadioPlatformsHub />
        </div>
      )}
    </div>
  );
};
