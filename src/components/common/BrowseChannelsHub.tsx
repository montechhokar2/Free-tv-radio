import React, { useState, useMemo } from 'react';
import { 
  Tv, 
  Radio, 
  Search, 
  Play, 
  Heart, 
  ShieldCheck, 
  Sparkles, 
  Layers, 
  Grid3X3, 
  List, 
  CheckCircle2, 
  Activity,
  Flame,
  Volume2,
  Music,
  TrendingUp,
  Globe
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Channel } from '../../types';
import { ALL_LANGUAGES } from '../../data/initialChannels';

export const BrowseChannelsHub: React.FC = () => {
  const { 
    channels, 
    playChannel, 
    activeTV, 
    activeRadio, 
    isRadioPlaying, 
    toggleFavorite, 
    isFavorite,
    setCurrentTab
  } = useApp();

  const [activeFilter, setActiveFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('All');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [pageLimit, setPageLimit] = useState<number>(24);

  const filterTabs = [
    { id: 'All', label: 'All Channels', icon: Layers },
    { id: 'worldwide', label: 'Worldwide Streams 🌐', icon: Globe },
    { id: 'tv', label: 'Live TV', icon: Tv },
    { id: 'radio', label: 'Internet Radio', icon: Radio },
    { id: 'Music', label: 'Music TV', icon: Music },
    { id: 'usa', label: 'Trending USA 🇺🇸', icon: TrendingUp },
    { id: 'freetv', label: 'Free TV Networks', icon: Tv },
    { id: 'jiotv-colito', label: 'JioTV & Colito', icon: Flame },
    { id: 'YouTube Live', label: 'YouTube Live', icon: Play },
    { id: 'News', label: 'News 24/7', icon: Activity },
    { id: 'Sports', label: 'Sports', icon: Sparkles },
    { id: 'Entertainment', label: 'Entertainment', icon: Tv },
    { id: 'Regional', label: 'Regional', icon: Sparkles },
  ];

  const filteredChannels = useMemo(() => {
    return channels.filter(channel => {
      // 1. Tab filter
      if (activeFilter === 'worldwide') {
        if (channel.country === 'India') return false;
      } else if (activeFilter === 'tv') {
        if (channel.type !== 'tv') return false;
      } else if (activeFilter === 'radio') {
        if (channel.type !== 'radio') return false;
      } else if (activeFilter === 'usa') {
        if (channel.country !== 'USA') return false;
      } else if (activeFilter === 'freetv') {
        const isFreeTv = 
          channel.name.toLowerCase().includes('free tv') || 
          channel.broadcaster?.toLowerCase().includes('free tv') ||
          channel.description.toLowerCase().includes('free tv') ||
          channel.verifiedFta;
        if (!isFreeTv) return false;
      } else if (activeFilter === 'jiotv-colito') {
        const isJioOrColito = 
          channel.name.toLowerCase().includes('jio') ||
          channel.name.toLowerCase().includes('colito') ||
          channel.broadcaster?.toLowerCase().includes('jio') ||
          channel.broadcaster?.toLowerCase().includes('coolita') ||
          channel.broadcaster?.toLowerCase().includes('colito');
        if (!isJioOrColito) return false;
      } else if (activeFilter === 'YouTube Live') {
        if (channel.category !== 'YouTube Live' && channel.streamFormat !== 'youtube') return false;
      } else if (activeFilter !== 'All') {
        if (channel.category !== activeFilter) return false;
      }

      // 2. Language filter
      if (selectedLanguage !== 'All') {
        if (channel.language.toLowerCase() !== selectedLanguage.toLowerCase()) return false;
      }

      // 3. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = channel.name.toLowerCase().includes(q);
        const matchesCategory = channel.category.toLowerCase().includes(q);
        const matchesBroadcaster = channel.broadcaster?.toLowerCase().includes(q) || false;
        const matchesProg = channel.currentProgram?.toLowerCase().includes(q) || false;
        const matchesDesc = channel.description.toLowerCase().includes(q);
        if (!matchesName && !matchesCategory && !matchesBroadcaster && !matchesProg && !matchesDesc) {
          return false;
        }
      }

      return true;
    });
  }, [channels, activeFilter, selectedLanguage, searchQuery]);

  const isChannelActive = (ch: Channel) => {
    if (ch.type === 'tv') return activeTV?.id === ch.id;
    return activeRadio?.id === ch.id && isRadioPlaying;
  };

  return (
    <section className="space-y-5 rounded-3xl p-6 sm:p-7 bg-slate-900/90 border border-slate-800 shadow-2xl">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              CHANNEL BROWSER
            </span>
            <span className="text-xs text-slate-400 font-mono">
              {filteredChannels.length} Channels Available
            </span>
          </div>
          <h2 className="font-display text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>Browse All Channels</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Explore free verified TV channels, online radio stations, JioTV streams, and Colito FAST linear feeds
          </p>
        </div>

        {/* View Mode Toggle & Quick Action */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex items-center gap-1">
            <button
              onClick={() => setViewMode('grid')}
              title="Grid View"
              aria-label="Grid View"
              className={`min-w-[40px] min-h-[40px] p-2 rounded-lg transition-colors cursor-pointer flex items-center justify-center ${
                viewMode === 'grid' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              title="Compact List View"
              aria-label="Compact List View"
              className={`min-w-[40px] min-h-[40px] p-2 rounded-lg transition-colors cursor-pointer flex items-center justify-center ${
                viewMode === 'list' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => setCurrentTab('ott')}
            className="min-h-[44px] px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Layers className="w-3.5 h-3.5 text-red-400" />
            <span>JioTV &amp; OTT Hub</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
        {filterTabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeFilter === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveFilter(tab.id);
                setPageLimit(24);
              }}
              className={`min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-medium whitespace-nowrap shrink-0 transition-all cursor-pointer flex items-center gap-1.5 ${
                isActive
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                  : 'bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Search & Language Dropdown Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-slate-800/80">
        <div className="relative flex-1 sm:max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search channel name, show or broadcaster..."
            value={searchQuery}
            onChange={e => {
              setSearchQuery(e.target.value);
              setPageLimit(24);
            }}
            className="w-full min-h-[44px] pl-9 pr-4 py-2 text-base sm:text-xs bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-amber-500/60 transition-colors"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label className="text-xs text-slate-400 font-medium shrink-0">Language:</label>
          <select
            value={selectedLanguage}
            onChange={e => {
              setSelectedLanguage(e.target.value);
              setPageLimit(24);
            }}
            className="flex-1 sm:flex-initial min-h-[44px] px-3 py-2 text-base sm:text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500/60 cursor-pointer"
          >
            {ALL_LANGUAGES.map(lang => (
              <option key={lang} value={lang}>
                {lang}
              </option>
            ))}
          </select>

          {(searchQuery || selectedLanguage !== 'All' || activeFilter !== 'All') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedLanguage('All');
                setActiveFilter('All');
                setPageLimit(24);
              }}
              className="min-h-[44px] px-3 text-xs text-amber-400 hover:underline cursor-pointer shrink-0"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Channel Grid or List */}
      {filteredChannels.length === 0 ? (
        <div className="text-center py-12 px-4 rounded-2xl bg-slate-950/60 border border-slate-800">
          <Tv className="w-8 h-8 text-slate-500 mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-white">No channels found</h3>
          <p className="text-xs text-slate-400 mt-1">Try clearing filters or searching for another term</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredChannels.slice(0, pageLimit).map(channel => {
            const active = isChannelActive(channel);
            const fav = isFavorite(channel.id);

            return (
              <div
                key={channel.id}
                onClick={() => playChannel(channel)}
                className={`group relative rounded-2xl p-4 transition-all duration-200 cursor-pointer flex flex-col justify-between border ${
                  active
                    ? 'bg-amber-500/10 border-amber-500/60 shadow-lg shadow-amber-500/10 ring-1 ring-amber-500/40'
                    : 'bg-slate-950/80 hover:bg-slate-950 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div>
                  {/* Top Metadata Row */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-1.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                        channel.type === 'tv'
                          ? 'bg-red-600/20 text-red-400 border border-red-500/30'
                          : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}>
                        {channel.type === 'tv' ? 'LIVE TV' : 'RADIO'}
                      </span>
                      {channel.category === 'OTT Feeds' && (
                        <span className="px-1.5 py-0.5 rounded bg-blue-600/20 text-blue-400 border border-blue-500/30 text-[9px] font-bold uppercase">
                          OTT
                        </span>
                      )}
                    </div>

                    <button
                      onClick={e => {
                        e.stopPropagation();
                        toggleFavorite(channel.id);
                      }}
                      title={fav ? 'Remove from favorites' : 'Add to favorites'}
                      className="min-w-[40px] min-h-[40px] text-slate-400 hover:text-red-500 p-2 cursor-pointer transition-colors flex items-center justify-center"
                    >
                      <Heart className={`w-4 h-4 ${fav ? 'fill-red-500 text-red-500' : ''}`} />
                    </button>
                  </div>

                  {/* Channel Logo and Info */}
                  <div className="flex items-center gap-3 mb-2.5">
                    <div className="w-11 h-11 rounded-xl bg-slate-800 border border-slate-700 overflow-hidden shrink-0 flex items-center justify-center">
                      {channel.logoUrl ? (
                        <img
                          src={channel.logoUrl}
                          alt={channel.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                          referrerPolicy="no-referrer"
                          onError={e => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      ) : channel.type === 'tv' ? (
                        <Tv className="w-5 h-5 text-amber-400" />
                      ) : (
                        <Radio className="w-5 h-5 text-amber-400" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-bold text-white group-hover:text-amber-400 transition-colors truncate">
                        {channel.name}
                      </h3>
                      <p className="text-[11px] text-slate-400 truncate">
                        {channel.broadcaster || channel.country}
                      </p>
                    </div>
                  </div>

                  {/* Description / Program */}
                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-3">
                    {channel.currentProgram || channel.description}
                  </p>
                </div>

                {/* Card Footer */}
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                    <span>{channel.language}</span>
                    <span>·</span>
                    <span className="font-mono text-[10px]">{channel.quality?.[0] || 'HD'}</span>
                  </div>

                  <div className="inline-flex items-center gap-1 text-xs font-bold text-amber-400 group-hover:text-amber-300">
                    {active ? (
                      <span className="inline-flex items-center gap-1 text-emerald-400 text-xs">
                        <Volume2 className="w-3.5 h-3.5 animate-pulse" />
                        <span>Playing</span>
                      </span>
                    ) : (
                      <>
                        <Play className="w-3 h-3 fill-amber-400" />
                        <span>Play</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Compact List View */
        <div className="divide-y divide-slate-800/80 rounded-2xl bg-slate-950/80 border border-slate-800 overflow-hidden">
          {filteredChannels.slice(0, pageLimit).map(channel => {
            const active = isChannelActive(channel);
            const fav = isFavorite(channel.id);

            return (
              <div
                key={channel.id}
                onClick={() => playChannel(channel)}
                className={`p-3.5 flex items-center justify-between gap-3 hover:bg-slate-900 transition-colors cursor-pointer group ${
                  active ? 'bg-amber-500/10' : ''
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 overflow-hidden shrink-0 flex items-center justify-center">
                    {channel.logoUrl ? (
                      <img
                        src={channel.logoUrl}
                        alt={channel.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <Tv className="w-4 h-4 text-amber-400" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white group-hover:text-amber-400 transition-colors truncate">
                        {channel.name}
                      </span>
                      <span className="text-[10px] font-semibold text-slate-400 px-1.5 py-0.2 rounded bg-slate-800">
                        {channel.language}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 truncate">
                      {channel.currentProgram || channel.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
                    {channel.category}
                  </span>
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      toggleFavorite(channel.id);
                    }}
                    className="min-w-[40px] min-h-[40px] text-slate-400 hover:text-red-500 p-2 cursor-pointer flex items-center justify-center"
                  >
                    <Heart className={`w-4 h-4 ${fav ? 'fill-red-500 text-red-500' : ''}`} />
                  </button>
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      playChannel(channel);
                    }}
                    className="min-h-[40px] px-3.5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <Play className="w-3.5 h-3.5 fill-slate-950" />
                    <span>Play</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {filteredChannels.length > pageLimit && (
        <div className="flex justify-center pt-1">
          <button
            onClick={() => setPageLimit(prev => prev + 24)}
            className="min-h-[44px] px-6 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-amber-400 cursor-pointer"
          >
            Load More Channels ({filteredChannels.length - pageLimit} remaining)
          </button>
        </div>
      )}

      {/* Trust & Streaming Check Notice */}
      <div className="pt-2 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400 border-t border-slate-800/80">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Smooth Streaming Checked: HLS buffer optimization with auto-recovery enabled</span>
        </div>
        <span className="font-mono text-[11px] text-slate-400">
          Includes JioTV, Colito TV, DD Free Dish &amp; YouTube Live feeds
        </span>
      </div>
    </section>
  );
};
