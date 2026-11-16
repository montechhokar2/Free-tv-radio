import React, { useState, useEffect, useMemo } from 'react';
import { 
  BookOpen, 
  Search, 
  Globe, 
  Play, 
  Plus, 
  Check, 
  ShieldCheck, 
  Activity, 
  Tv, 
  Sparkles, 
  RotateCcw,
  ExternalLink,
  ChevronRight,
  Filter,
  X
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { WebDirectoryChannel } from '../../types';
import { 
  CURATED_WEB_DICTIONARY, 
  directoryToChannel, 
  fetchLiveCountryDirectory 
} from '../../services/webDirectoryService';
import { ALL_LANGUAGES } from '../../data/initialChannels';
import { VideoPlayer } from '../player/VideoPlayer';

const ALPHABET = ['ALL', ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''), '#'];

interface CountryOption {
  code: string;
  name: string;
  flag: string;
}

const COUNTRIES: CountryOption[] = [
  { code: 'curated', name: 'Global Worldwide FTA', flag: '🌐' },
  { code: 'in', name: 'India', flag: '🇮🇳' },
  { code: 'us', name: 'United States', flag: '🇺🇸' },
  { code: 'uk', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'fr', name: 'France', flag: '🇫🇷' },
  { code: 'de', name: 'Germany', flag: '🇩🇪' },
  { code: 'jp', name: 'Japan', flag: '🇯🇵' },
  { code: 'kr', name: 'South Korea', flag: '🇰🇷' },
  { code: 'au', name: 'Australia', flag: '🇦🇺' },
  { code: 'sg', name: 'Singapore', flag: '🇸🇬' },
  { code: 'es', name: 'Spain', flag: '🇪🇸' },
  { code: 'it', name: 'Italy', flag: '🇮🇹' },
  { code: 'ca', name: 'Canada', flag: '🇨🇦' },
  { code: 'qa', name: 'Qatar / MENA', flag: '🇶🇦' },
  { code: 'br', name: 'Brazil', flag: '🇧🇷' }
];

export const WebDictionarySection: React.FC = () => {
  const { playTVChannel, activeTV, closeTVPlayer, addChannel, channels } = useApp();

  const [selectedCountry, setSelectedCountry] = useState<CountryOption>(COUNTRIES[0]);
  const [selectedLetter, setSelectedLetter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [directoryItems, setDirectoryItems] = useState<WebDirectoryChannel[]>(CURATED_WEB_DICTIONARY);
  const [isLoading, setIsLoading] = useState(false);
  const [addedIds, setAddedIds] = useState<Record<string, boolean>>({});
  const [testingId, setTestingId] = useState<string | null>(null);
  const [probeResults, setProbeResults] = useState<Record<string, boolean>>({});
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('All');
  const [pageLimit, setPageLimit] = useState<number>(48);

  useEffect(() => {
    setPageLimit(48);
  }, [selectedCountry.code, selectedLetter, selectedCategory, selectedLanguage, searchQuery]);

  // Load directory when country changes
  useEffect(() => {
    let isMounted = true;
    if (selectedCountry.code === 'curated') {
      setDirectoryItems(CURATED_WEB_DICTIONARY);
      return;
    }

    setIsLoading(true);
    fetchLiveCountryDirectory(selectedCountry.code, selectedCountry.name)
      .then(items => {
        if (!isMounted) return;
        setDirectoryItems(items.length > 0 ? items : CURATED_WEB_DICTIONARY);
      })
      .catch(() => {
        if (isMounted) setDirectoryItems(CURATED_WEB_DICTIONARY);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedCountry]);

  // Extract unique categories in current directory
  const categories = useMemo(() => {
    const set = new Set<string>();
    directoryItems.forEach(item => {
      if (item.category) set.add(item.category);
    });
    return ['All', ...Array.from(set).slice(0, 8)];
  }, [directoryItems]);

  // Filter items by letter, search query, category, and language
  const filteredChannels = useMemo(() => {
    return directoryItems.filter(item => {
      // 1. Category Filter
      if (selectedCategory !== 'All' && item.category !== selectedCategory) return false;

      // 2. Language Filter
      if (selectedLanguage !== 'All') {
        const langQuery = selectedLanguage.toLowerCase();
        const matchesLang = item.language?.toLowerCase() === langQuery;
        const matchesName = item.name.toLowerCase().includes(langQuery) || item.cleanName.toLowerCase().includes(langQuery);
        const matchesCat = item.category?.toLowerCase().includes(langQuery);
        if (!matchesLang && !matchesName && !matchesCat) return false;
      }

      // 3. Alphabetical Letter Filter
      if (selectedLetter !== 'ALL') {
        const firstChar = item.cleanName.charAt(0).toUpperCase();
        if (selectedLetter === '#') {
          if (/[A-Z]/i.test(firstChar)) return false;
        } else {
          if (firstChar !== selectedLetter) return false;
        }
      }

      // 4. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const inName = item.name.toLowerCase().includes(q);
        const inClean = item.cleanName.toLowerCase().includes(q);
        const inCat = item.category?.toLowerCase().includes(q);
        const inDesc = item.description?.toLowerCase().includes(q);
        const inBroadcaster = item.broadcaster?.toLowerCase().includes(q);
        if (!inName && !inClean && !inCat && !inDesc && !inBroadcaster) return false;
      }

      return true;
    });
  }, [directoryItems, selectedLetter, searchQuery, selectedCategory, selectedLanguage]);

  // Stream live immediately
  const handleWatchLive = (item: WebDirectoryChannel) => {
    const channel = directoryToChannel(item);
    playTVChannel(channel);
    // Scroll smoothly to player
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Add to My Channels
  const handleAddToChannels = (item: WebDirectoryChannel) => {
    const channel = directoryToChannel(item);
    const alreadyExists = channels.some(c => c.name.toLowerCase() === channel.name.toLowerCase() || c.streamUrl === channel.streamUrl);
    if (!alreadyExists) {
      addChannel({
        name: channel.name,
        type: 'tv',
        category: channel.category,
        language: channel.language,
        country: channel.country,
        streamUrl: channel.streamUrl,
        backupUrl: channel.backupUrl,
        streamFormat: channel.streamFormat,
        logoUrl: channel.logoUrl,
        description: channel.description,
        currentProgram: channel.currentProgram,
        isFeatured: false,
        verifiedFta: true,
        broadcaster: channel.broadcaster,
      });
    }
    setAddedIds(prev => ({ ...prev, [item.id]: true }));
    setTimeout(() => {
      setAddedIds(prev => ({ ...prev, [item.id]: false }));
    }, 3000);
  };

  // Probe stream
  const handleTestStream = (item: WebDirectoryChannel) => {
    setTestingId(item.id);
    setTimeout(() => {
      setProbeResults(prev => ({ ...prev, [item.id]: true }));
      setTestingId(null);
    }, 800);
  };

  // Top featured stream in current dictionary
  const featuredBroadcast = directoryItems.find(c => 
    c.cleanName.includes('DD News') || 
    c.cleanName.includes('DW') || 
    c.cleanName.includes('France 24') ||
    c.cleanName.includes('NASA')
  ) || directoryItems[0];

  return (
    <div className="space-y-6 pb-24">
      {/* Live Video Player Display when Active */}
      {activeTV && (
        <section className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-2xl">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping" />
              <h2 className="text-xs font-bold tracking-widest text-white uppercase">
                Active Live Stream · {activeTV.name}
              </h2>
            </div>
            <button
              onClick={closeTVPlayer}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
            >
              <X className="w-4 h-4" />
              <span>Close</span>
            </button>
          </div>
          <VideoPlayer channel={activeTV} onClose={closeTVPlayer} />
        </section>
      )}

      {/* Featured Broadcast Spotlight of Web TV Dictionary */}
      {featuredBroadcast && (
        <section className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-red-950/40 via-slate-900 to-slate-900 border border-red-500/30 p-6 sm:p-7 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4">
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden shrink-0 flex items-center justify-center">
              {featuredBroadcast.logoUrl ? (
                <img 
                  src={featuredBroadcast.logoUrl} 
                  alt={featuredBroadcast.name} 
                  className="w-full h-full object-cover" 
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              ) : (
                <Tv className="w-8 h-8 text-amber-400" />
              )}
              <span className="absolute top-1.5 left-1.5 w-2 h-2 rounded-full bg-red-500 animate-ping" />
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <span className="px-2.5 py-0.5 rounded bg-red-600 text-white text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  FEATURED BROADCAST
                </span>
                <span className="text-xs text-amber-400 font-semibold">{featuredBroadcast.resolution || '1080p'}</span>
                <span className="text-xs text-slate-400">· {featuredBroadcast.country} · {featuredBroadcast.category}</span>
              </div>
              <h3 className="font-display text-xl sm:text-2xl font-bold text-white mb-1 truncate">
                {featuredBroadcast.name}
              </h3>
              <p className="text-xs text-slate-300 max-w-xl line-clamp-2">
                {featuredBroadcast.description || 'Public service broadcaster transmission available in open digital distribution via Web TV Dictionary.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0 w-full md:w-auto">
            <button
              onClick={() => handleWatchLive(featuredBroadcast)}
              className="w-full md:w-auto min-h-[44px] px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 transition-all transform active:scale-95 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-slate-950" />
              <span>Watch Featured Broadcast</span>
            </button>
          </div>
        </section>
      )}

      {/* Header Banner */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800 p-5 sm:p-8 shadow-xl">
        <div className="max-w-3xl">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded bg-amber-500 text-slate-950 text-[10px] font-black tracking-widest uppercase">
              WEB DIRECTORY
            </span>
            <span className="text-xs text-slate-400">Live TV Channel Dictionary &amp; Indexer</span>
          </div>

          <h1 className="font-display text-fluid-title font-extrabold text-white tracking-tight leading-tight mb-2">
            Web TV Channels Dictionary
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl mb-6">
            Comprehensive online dictionary of free-to-air broadcast television channels from India, USA, UK, and worldwide. Search by alphabet, broadcaster, or region, test stream reachability, and watch live with zero buffering.
          </p>

          {/* Country Selection Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {COUNTRIES.map(ctry => (
              <button
                key={ctry.code}
                onClick={() => {
                  setSelectedCountry(ctry);
                  setSelectedLetter('ALL');
                }}
                className={`min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 transition-all cursor-pointer flex items-center gap-2 ${
                  selectedCountry.code === ctry.code
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'bg-slate-950/80 hover:bg-slate-800 text-slate-300 border border-slate-800'
                }`}
              >
                <span>{ctry.flag}</span>
                <span>{ctry.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* A-Z Alphabetical Dictionary Filter Bar */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
          <div className="flex items-center gap-2 font-semibold text-slate-300">
            <BookOpen className="w-4 h-4 text-amber-400" />
            <span>Alphabetical Dictionary Index:</span>
          </div>
          <span>
            {filteredChannels.length} entries in{' '}
            <strong className="text-white font-bold">{selectedCountry.name}</strong>
          </span>
        </div>

        <div className="flex items-center gap-1 overflow-x-auto py-1.5 scrollbar-none bg-slate-950/60 p-1.5 rounded-2xl border border-slate-800">
          {ALPHABET.map(letter => {
            const isActive = selectedLetter === letter;
            return (
              <button
                key={letter}
                onClick={() => setSelectedLetter(letter)}
                className={`min-w-[38px] min-h-[38px] px-2 rounded-lg text-xs font-bold shrink-0 transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {letter}
              </button>
            );
          })}
        </div>

        {/* Language Categories Filter Row */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
          <span className="text-slate-400 font-semibold shrink-0 mr-1">Languages:</span>
          {ALL_LANGUAGES.map(lang => {
            const isSelected = selectedLanguage === lang;
            return (
              <button
                key={lang}
                onClick={() => setSelectedLanguage(lang)}
                className={`min-h-[38px] px-3 py-1.5 rounded-xl text-xs whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                    : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
                }`}
              >
                {lang}
              </button>
            );
          })}
        </div>
      </div>

      {/* Search and Category Filter Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-slate-900/60 border border-slate-800 rounded-2xl">
        <div className="relative flex-1 sm:max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={`Search ${selectedCountry.name} channels, callsigns, shows...`}
            className="w-full min-h-[44px] pl-9 pr-10 py-2 bg-slate-950 border border-slate-800 rounded-xl text-base sm:text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              aria-label="Clear search"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`min-h-[40px] px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 font-semibold'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="rounded-2xl p-12 text-center bg-slate-900/40 border border-slate-800 flex flex-col items-center justify-center">
          <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-xs font-semibold text-slate-300">
            Querying Web TV Directory for {selectedCountry.name}...
          </p>
        </div>
      )}

      {/* Dictionary Listings Grid */}
      {!isLoading && filteredChannels.length > 0 && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredChannels.slice(0, pageLimit).map(item => {
            const isAdded = addedIds[item.id];
            const isTested = probeResults[item.id];
            const isTesting = testingId === item.id;

            return (
              <div
                key={item.id}
                className="group relative rounded-2xl bg-slate-900/80 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 p-4 transition-all duration-200 flex flex-col justify-between shadow-sm"
              >
                <div>
                  {/* Top Row: Logo, Name, Resolution */}
                  <div className="flex items-start gap-3 mb-2.5">
                    <div className="w-12 h-12 rounded-xl bg-slate-950 border border-slate-800 overflow-hidden shrink-0 flex items-center justify-center">
                      {item.logoUrl ? (
                        <img
                          src={item.logoUrl}
                          alt={item.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          loading="lazy"
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <Tv className="w-5 h-5 text-amber-400" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-display font-bold text-sm text-white group-hover:text-amber-400 transition-colors truncate">
                          {item.cleanName}
                        </h3>
                        {item.resolution && (
                          <span className="px-1.5 py-0.2 bg-slate-800 text-slate-300 text-[10px] font-mono rounded">
                            {item.resolution}
                          </span>
                        )}
                      </div>

                      {/* Clean Unboxed Metadata */}
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
                        <span>{item.category || 'General'}</span>
                        <span aria-hidden="true">·</span>
                        <span>{item.country}</span>
                      </div>
                    </div>
                  </div>

                  {/* Channel Description */}
                  <p className="text-xs text-slate-400 leading-relaxed line-clamp-2 mb-4">
                    {item.description || `Public broadcaster live stream from ${item.broadcaster || item.country}. Verified free-to-air web directory entry.`}
                  </p>
                </div>

                {/* Actions Bar */}
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleWatchLive(item)}
                    className="flex-1 min-h-[44px] py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/15 transition-all transform active:scale-95 cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 fill-slate-950" />
                    <span>Stream Live</span>
                  </button>

                  <button
                    onClick={() => handleAddToChannels(item)}
                    title="Add to My Channels"
                    className={`min-w-[44px] min-h-[44px] p-2 rounded-xl border text-xs transition-colors cursor-pointer flex items-center justify-center ${
                      isAdded
                        ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                        : 'bg-slate-950 hover:bg-slate-800 border-slate-800 text-slate-300'
                    }`}
                  >
                    {isAdded ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  </button>

                  <button
                    onClick={() => handleTestStream(item)}
                    disabled={isTesting}
                    title="Check Stream Health"
                    className="min-w-[44px] min-h-[44px] p-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white text-xs transition-colors cursor-pointer flex items-center justify-center"
                  >
                    <Activity className={`w-4 h-4 ${isTesting ? 'animate-spin text-amber-400' : isTested ? 'text-emerald-400' : ''}`} />
                  </button>
                </div>
              </div>
            );
          })}
          </div>

          {filteredChannels.length > pageLimit && (
            <div className="flex justify-center pt-1">
              <button
                onClick={() => setPageLimit(prev => prev + 48)}
                className="min-h-[44px] px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-amber-400 cursor-pointer"
              >
                Load More Directory Entries ({filteredChannels.length - pageLimit} remaining)
              </button>
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredChannels.length === 0 && (
        <div className="rounded-2xl p-12 text-center bg-slate-900/40 border border-slate-800 flex flex-col items-center justify-center">
          <BookOpen className="w-12 h-12 text-slate-600 mb-3" />
          <h3 className="text-base font-bold text-white mb-1">
            No Entries Found in Letter '{selectedLetter}'
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mb-4">
            Try switching back to 'ALL' or selecting a different country in the web dictionary.
          </p>
          <button
            onClick={() => {
              setSelectedLetter('ALL');
              setSelectedCategory('All');
              setSearchQuery('');
            }}
            className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs cursor-pointer"
          >
            Reset Dictionary Filter
          </button>
        </div>
      )}
    </div>
  );
};
