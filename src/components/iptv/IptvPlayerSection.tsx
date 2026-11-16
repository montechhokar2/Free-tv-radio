import React, { useState, useMemo, useEffect } from 'react';
import {
  Tv,
  Search,
  RefreshCw,
  CalendarClock,
  Play,
  Heart,
  ListVideo,
  LayoutGrid,
  Link2,
  Clock,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  X,
  SlidersHorizontal,
  Trophy,
  PanelRightClose,
  PanelRightOpen
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { VideoPlayer } from '../player/VideoPlayer';
import {
  DEFAULT_FREE_TV_PLAYLIST_URL,
  findEpgProgramsForChannel,
  getCurrentAndUpcoming,
  formatEpgTime,
  formatEpgDuration
} from '../../services/epgService';
import { IPTV_ORG_SPORTS_PLAYLIST_URL } from '../../services/iptvOrgService';
import { getDeviceRuntimeProfile } from '../../services/devicePerformance';

const SPORTS_GROUP_KEY = 'Sports (IPTV-org)';

const POPULAR_GROUPS = [
  'All',
  SPORTS_GROUP_KEY,
  'UK',
  'India',
  'News',
  'USA',
  'Canada',
  'Australia',
  'Germany',
  'France',
  'Business',
  'Documentaries (EN)',
  'Music (EN)',
  'Spain',
  'Italy',
  'Brazil',
  '日本 / Japan'
];

export const IptvPlayerSection: React.FC = () => {
  const {
    iptvPlaylistUrl,
    iptvChannels,
    iptvGroups,
    iptvEpgUrls,
    isLoadingIptvPlaylist,
    iptvPlaylistError,
    epgProgramsByChannelId,
    isLoadingEpg,
    epgFetchedSources,
    epgLastUpdated,
    loadIptvPlaylist,
    loadEpgForChannels,
    loadSingleEpgUrl,
    activeTV,
    playTVChannel,
    closeTVPlayer,
    toggleFavorite,
    isFavorite,
    sportsIptvChannels,
    isLoadingSportsIptv,
    syncSportsIptv
  } = useApp();

  const runtimeProfile = useMemo(() => getDeviceRuntimeProfile(), []);
  const pageStep = runtimeProfile.recommendedPageSize;

  const [selectedGroup, setSelectedGroup] = useState<string>('UK');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [viewMode, setViewMode] = useState<'grid' | 'guide'>('grid');
  const [onlyWithEpg, setOnlyWithEpg] = useState<boolean>(false);
  const [formatFilter, setFormatFilter] = useState<'all' | 'hls' | 'youtube'>('all');
  const [showSourcePanel, setShowSourcePanel] = useState<boolean>(false);
  const [isEpgPanelOpen, setIsEpgPanelOpen] = useState<boolean>(true);
  const [customPlaylistInput, setCustomPlaylistInput] = useState<string>(iptvPlaylistUrl);
  const [customXmltvInput, setCustomXmltvInput] = useState<string>('');
  const [epgSourceMessage, setEpgSourceMessage] = useState<string | null>(null);
  const [pageLimit, setPageLimit] = useState<number>(pageStep);
  const [nowMs, setNowMs] = useState<number>(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNowMs(Date.now()), 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (
      iptvGroups.length > 0 &&
      selectedGroup !== 'All' &&
      selectedGroup !== SPORTS_GROUP_KEY &&
      !iptvGroups.includes(selectedGroup)
    ) {
      setSelectedGroup('All');
    }
  }, [iptvGroups, selectedGroup]);

  const isSportsCategoryActive = selectedGroup === SPORTS_GROUP_KEY;

  const activeSourceChannels = useMemo(() => {
    return isSportsCategoryActive ? sportsIptvChannels : iptvChannels;
  }, [isSportsCategoryActive, sportsIptvChannels, iptvChannels]);

  const filteredChannels = useMemo(() => {
    return activeSourceChannels.filter(ch => {
      if (
        !isSportsCategoryActive &&
        selectedGroup !== 'All' &&
        (ch.groupTitle || ch.country) !== selectedGroup
      ) {
        return false;
      }
      if (formatFilter !== 'all' && ch.streamFormat !== formatFilter) {
        return false;
      }
      if (onlyWithEpg) {
        const progs = findEpgProgramsForChannel(ch, epgProgramsByChannelId);
        if (progs.length === 0) return false;
      }
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchesName = ch.name.toLowerCase().includes(q);
        const matchesTvgId = ch.tvgId?.toLowerCase().includes(q);
        const matchesGroup = (ch.groupTitle || ch.country).toLowerCase().includes(q);
        const matchesCountry = ch.country.toLowerCase().includes(q);
        if (!matchesName && !matchesTvgId && !matchesGroup && !matchesCountry) return false;
      }
      return true;
    });
  }, [
    activeSourceChannels,
    isSportsCategoryActive,
    selectedGroup,
    formatFilter,
    onlyWithEpg,
    searchTerm,
    epgProgramsByChannelId
  ]);

  const visibleChannels = useMemo(() => {
    return filteredChannels.slice(0, pageLimit);
  }, [filteredChannels, pageLimit]);

  useEffect(() => {
    if (visibleChannels.length === 0) return;
    const sampleForGroup = visibleChannels.slice(0, 48);
    void loadEpgForChannels(sampleForGroup);
  }, [selectedGroup, iptvChannels.length, sportsIptvChannels.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const activeChannelEpg = useMemo(() => {
    if (!activeTV) return null;
    const programs = findEpgProgramsForChannel(activeTV, epgProgramsByChannelId);
    return {
      programs,
      summary: getCurrentAndUpcoming(programs, nowMs),
    };
  }, [activeTV, epgProgramsByChannelId, nowMs]);

  const handleLoadPlaylistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customPlaylistInput.trim()) return;
    await loadIptvPlaylist(customPlaylistInput.trim());
    setPageLimit(pageStep);
  };

  const handleLoadCustomXmltv = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customXmltvInput.trim()) return;
    setEpgSourceMessage(null);
    try {
      const count = await loadSingleEpgUrl(customXmltvInput.trim());
      setEpgSourceMessage(`Loaded EPG schedules for ${count} channels.`);
    } catch (err) {
      setEpgSourceMessage(`Error: ${(err as Error).message}`);
    }
  };

  const epgMatchedCount = useMemo(() => {
    return visibleChannels.filter(
      ch => findEpgProgramsForChannel(ch, epgProgramsByChannelId).length > 0
    ).length;
  }, [visibleChannels, epgProgramsByChannelId]);

  return (
    <div className="space-y-6 pb-24">
      {/* ACTIVE IPTV PLAYER + LIVE EPG SIDE-BY-SIDE PANEL */}
      {activeTV && (
        <section className="rounded-3xl bg-slate-900/90 border border-slate-800 p-4 sm:p-5 shadow-2xl space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping shrink-0" />
              <h2 className="text-sm font-bold tracking-wider text-white uppercase truncate">
                IPTV Player · {activeTV.name}
              </h2>
              {activeTV.tvgId && (
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-md bg-slate-800 text-[10px] font-mono text-amber-400 border border-slate-700">
                  EPG ID: {activeTV.tvgId}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setIsEpgPanelOpen(prev => !prev)}
                aria-expanded={isEpgPanelOpen}
                className={`min-h-[40px] px-3 py-1.5 rounded-lg text-xs font-semibold border flex items-center gap-1.5 cursor-pointer transition-colors ${
                  isEpgPanelOpen
                    ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                    : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
                }`}
              >
                {isEpgPanelOpen ? (
                  <>
                    <PanelRightClose className="w-4 h-4" />
                    <span>Hide Guide</span>
                  </>
                ) : (
                  <>
                    <PanelRightOpen className="w-4 h-4" />
                    <span>Show Guide</span>
                  </>
                )}
              </button>
              <button
                onClick={closeTVPlayer}
                className="min-h-[40px] px-2.5 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
                <span>Close Player</span>
              </button>
            </div>
          </div>

          <div
            className={`grid gap-4 items-start ${
              isEpgPanelOpen ? 'grid-cols-1 lg:grid-cols-[minmax(0,65fr)_minmax(0,35fr)]' : 'grid-cols-1'
            }`}
          >
            <div className="min-w-0">
              <VideoPlayer channel={activeTV} onClose={closeTVPlayer} />
            </div>

            {isEpgPanelOpen && (
            <div className="rounded-2xl bg-slate-950 border border-slate-800 p-4 flex flex-col h-full max-h-[380px] lg:max-h-[480px] min-w-0">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <CalendarClock className="w-4 h-4 text-amber-400" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                    Program Guide (EPG)
                  </h3>
                </div>
                <button
                  onClick={() => void loadEpgForChannels([activeTV], true)}
                  disabled={isLoadingEpg}
                  className="min-h-[40px] px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-amber-400 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingEpg ? 'animate-spin' : ''}`} />
                  <span>{isLoadingEpg ? 'Syncing' : 'Sync'}</span>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto pt-3 space-y-3 pr-1">
                {activeChannelEpg?.summary.currentProgram ? (
                  <>
                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-2">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="px-2 py-0.5 rounded bg-amber-500 text-slate-950 font-black uppercase tracking-wider">
                          ON NOW
                        </span>
                        <span className="font-mono text-amber-300 font-semibold">
                          {formatEpgTime(activeChannelEpg.summary.currentProgram.startMs)} –{' '}
                          {formatEpgTime(activeChannelEpg.summary.currentProgram.stopMs)}
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-white leading-snug">
                        {activeChannelEpg.summary.currentProgram.title}
                      </h4>

                      {activeChannelEpg.summary.currentProgram.category && (
                        <span className="inline-block text-[10px] px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800">
                          {activeChannelEpg.summary.currentProgram.category}
                        </span>
                      )}

                      {activeChannelEpg.summary.currentProgram.description && (
                        <p className="text-[11px] text-slate-300 leading-relaxed line-clamp-3">
                          {activeChannelEpg.summary.currentProgram.description}
                        </p>
                      )}

                      <div className="space-y-1 pt-1">
                        <div className="w-full h-1.5 rounded-full bg-slate-900 overflow-hidden">
                          <div
                            className="h-full bg-amber-500 transition-all duration-500"
                            style={{ width: `${activeChannelEpg.summary.progressPercent}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-slate-400">
                          <span>{activeChannelEpg.summary.progressPercent}% elapsed</span>
                          <span>{activeChannelEpg.summary.remainingMinutes}m remaining</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h5 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        Upcoming Schedule
                      </h5>
                      {activeChannelEpg.summary.upcomingPrograms.length > 0 ? (
                        activeChannelEpg.summary.upcomingPrograms.map((prog, idx) => (
                          <div
                            key={prog.id}
                            className={`p-2.5 rounded-xl border text-xs ${
                              idx === 0
                                ? 'bg-slate-900 border-slate-700'
                                : 'bg-slate-950 border-slate-800/80'
                            }`}
                          >
                            <div className="flex items-center justify-between text-[10px] text-slate-400 mb-0.5">
                              <span className="font-mono text-sky-400 font-semibold">
                                {formatEpgTime(prog.startMs)} – {formatEpgTime(prog.stopMs)}
                              </span>
                              <span>
                                {idx === 0 ? 'UP NEXT · ' : ''}
                                {formatEpgDuration(prog.startMs, prog.stopMs)}
                              </span>
                            </div>
                            <p className="font-semibold text-white line-clamp-1">{prog.title}</p>
                            {prog.description && (
                              <p className="text-[11px] text-slate-400 line-clamp-2 mt-0.5">
                                {prog.description}
                              </p>
                            )}
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-slate-500">No additional upcoming programs listed.</p>
                      )}
                    </div>
                  </>
                ) : activeChannelEpg && activeChannelEpg.summary.upcomingPrograms.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-[11px] text-amber-400 font-semibold">Upcoming Programs</p>
                    {activeChannelEpg.summary.upcomingPrograms.map(prog => (
                      <div key={prog.id} className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                        <div className="font-mono text-[10px] text-sky-400">
                          {formatEpgTime(prog.startMs)} – {formatEpgTime(prog.stopMs)}
                        </div>
                        <p className="font-semibold text-white mt-0.5">{prog.title}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-10 text-center space-y-2.5">
                    <Clock className="w-7 h-7 text-slate-600 mx-auto" />
                    <p className="text-xs font-semibold text-slate-300">
                      {isLoadingEpg ? 'Fetching XMLTV Program Guide...' : 'No Live EPG Found for Channel'}
                    </p>
                    <p className="text-[11px] text-slate-500 max-w-xs mx-auto leading-relaxed">
                      {activeTV.tvgId
                        ? `EPG ID "${activeTV.tvgId}" had no matching XMLTV entries in the current window. Try syncing EPG or opening the XMLTV source manager.`
                        : 'This broadcaster stream does not publish a tvg-id guide tag.'}
                    </p>
                  </div>
                )}
              </div>
            </div>
            )}
          </div>
        </section>
      )}

      {/* HEADER & PLAYLIST / EPG CONFIG BAR */}
      <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800 p-5 sm:p-6 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 text-[10px] font-bold uppercase tracking-wider">
                Free-TV M3U8 + XMLTV EPG
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
                {iptvChannels.length.toLocaleString()} Channels · {sportsIptvChannels.length} Sports M3U · {iptvEpgUrls.length} EPG Feeds
              </span>
            </div>
            <h1 className="font-display text-fluid-title font-extrabold text-white flex items-center gap-2.5">
              <ListVideo className="w-6 h-6 sm:w-7 sm:h-7 text-amber-400 shrink-0" />
              <span>IPTV Player &amp; Live TV Guide (EPG)</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Streaming directly from <span className="font-mono text-slate-300">Free-TV/IPTV</span> playlist with synchronized XMLTV show schedules.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => void loadEpgForChannels(visibleChannels.slice(0, 35), true)}
              disabled={isLoadingEpg || visibleChannels.length === 0}
              className="min-h-[44px] px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingEpg ? 'animate-spin' : ''}`} />
              <span>{isLoadingEpg ? 'Fetching EPG...' : 'Refresh Live EPG'}</span>
            </button>

            <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  viewMode === 'grid' ? 'bg-slate-800 text-amber-400' : 'text-slate-400 hover:text-white'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Channels</span>
              </button>
              <button
                onClick={() => setViewMode('guide')}
                className={`min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  viewMode === 'guide' ? 'bg-slate-800 text-amber-400' : 'text-slate-400 hover:text-white'
                }`}
              >
                <CalendarClock className="w-3.5 h-3.5" />
                <span>TV Guide</span>
              </button>
            </div>

            <button
              onClick={() => setShowSourcePanel(prev => !prev)}
              className="min-h-[44px] px-3.5 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-300 flex items-center gap-1.5 cursor-pointer"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" />
              <span>Playlist &amp; EPG Sources</span>
              {showSourcePanel ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {showSourcePanel && (
          <div className="pt-4 border-t border-slate-800 grid grid-cols-1 lg:grid-cols-2 gap-4 text-xs">
            <form onSubmit={handleLoadPlaylistSubmit} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <Link2 className="w-3.5 h-3.5 text-amber-400" />
                  <span>M3U / M3U8 Playlist URL</span>
                </span>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setCustomPlaylistInput(IPTV_ORG_SPORTS_PLAYLIST_URL);
                      void loadIptvPlaylist(IPTV_ORG_SPORTS_PLAYLIST_URL);
                    }}
                    className="text-[11px] text-emerald-400 hover:underline cursor-pointer font-semibold"
                  >
                    Load IPTV-org Sports M3U
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCustomPlaylistInput(DEFAULT_FREE_TV_PLAYLIST_URL);
                      void loadIptvPlaylist(DEFAULT_FREE_TV_PLAYLIST_URL);
                    }}
                    className="text-[11px] text-amber-400 hover:underline cursor-pointer"
                  >
                    Reset to Free-TV Master
                  </button>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="url"
                  value={customPlaylistInput}
                  onChange={e => setCustomPlaylistInput(e.target.value)}
                  placeholder="https://raw.githubusercontent.com/Free-TV/IPTV/master/playlist.m3u8"
                  className="flex-1 min-h-[44px] px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono text-base sm:text-xs focus:outline-none focus:border-amber-500"
                />
                <button
                  type="submit"
                  disabled={isLoadingIptvPlaylist}
                  className="min-h-[44px] px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold cursor-pointer disabled:opacity-50 shrink-0"
                >
                  {isLoadingIptvPlaylist ? 'Loading...' : 'Load M3U8'}
                </button>
              </div>
              <p className="text-[11px] text-slate-400">
                Active: <span className="font-mono text-slate-300 break-all">{iptvPlaylistUrl}</span>
              </p>
            </form>

            <form onSubmit={handleLoadCustomXmltv} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <CalendarClock className="w-3.5 h-3.5 text-sky-400" />
                  <span>XMLTV EPG Feed Fetcher (.xml / .xml.gz)</span>
                </span>
                <span className="text-[11px] text-emerald-400 font-mono">
                  {epgFetchedSources.length} source(s) cached
                </span>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="url"
                  value={customXmltvInput}
                  onChange={e => setCustomXmltvInput(e.target.value)}
                  placeholder="Paste any XMLTV .xml or .xml.gz URL (or pick below)"
                  className="flex-1 min-h-[44px] px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono text-base sm:text-xs focus:outline-none focus:border-sky-500"
                />
                <button
                  type="submit"
                  disabled={isLoadingEpg}
                  className="min-h-[44px] px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold cursor-pointer disabled:opacity-50 shrink-0"
                >
                  Fetch XMLTV
                </button>
              </div>
              {iptvEpgUrls.length > 0 && (
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <span className="text-[11px] text-slate-400 shrink-0">Linked Feeds:</span>
                  <select
                    onChange={e => {
                      if (e.target.value) setCustomXmltvInput(e.target.value);
                    }}
                    value={customXmltvInput}
                    className="flex-1 min-h-[44px] px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-base sm:text-xs text-slate-300 font-mono focus:outline-none"
                  >
                    <option value="">Select from {iptvEpgUrls.length} linked x-tvg-url sources...</option>
                    {iptvEpgUrls.map(url => (
                      <option key={url} value={url}>
                        {url.split('/').pop()}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              {epgSourceMessage && (
                <p className="text-[11px] text-emerald-400 font-medium">{epgSourceMessage}</p>
              )}
            </form>
          </div>
        )}

        <div className="flex flex-col gap-3 pt-2 border-t border-slate-800/80">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 sm:max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => {
                  setSearchTerm(e.target.value);
                  setPageLimit(48);
                }}
                placeholder={`Search ${activeSourceChannels.length.toLocaleString()} IPTV channels, country, or tvg-id...`}
                className="w-full min-h-[44px] pl-9 pr-10 py-2 bg-slate-950 border border-slate-800 rounded-xl text-base sm:text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  aria-label="Clear search"
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:flex sm:flex-wrap items-center gap-2 text-xs">
              <select
                value={selectedGroup}
                onChange={e => {
                  const val = e.target.value;
                  setSelectedGroup(val);
                  setPageLimit(48);
                  if (val === SPORTS_GROUP_KEY && sportsIptvChannels.length === 0) {
                    void syncSportsIptv();
                  }
                }}
                className="w-full sm:w-auto min-h-[44px] px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-base sm:text-xs text-white focus:outline-none focus:border-amber-500"
              >
                <option value="All">All Countries / Groups ({iptvChannels.length})</option>
                <option value={SPORTS_GROUP_KEY}>
                  Sports (IPTV-org M3U · {sportsIptvChannels.length})
                </option>
                {iptvGroups.map(g => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>

              <select
                value={formatFilter}
                onChange={e => setFormatFilter(e.target.value as 'all' | 'hls' | 'youtube')}
                className="w-full sm:w-auto min-h-[44px] px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-base sm:text-xs text-white focus:outline-none focus:border-amber-500"
              >
                <option value="all">All Stream Types</option>
                <option value="hls">Direct HLS (.m3u8)</option>
                <option value="youtube">YouTube Live</option>
              </select>

              <button
                onClick={() => setOnlyWithEpg(prev => !prev)}
                className={`w-full sm:w-auto min-h-[44px] px-3 py-2 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                  onlyWithEpg
                    ? 'bg-sky-500/20 border-sky-500/40 text-sky-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <CalendarClock className="w-3.5 h-3.5" />
                <span>Has Live EPG</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
            {POPULAR_GROUPS.filter(
              g => g === 'All' || g === SPORTS_GROUP_KEY || iptvGroups.includes(g)
            ).map(group => {
              const isActive = selectedGroup === group;
              const isSports = group === SPORTS_GROUP_KEY;
              return (
                <button
                  key={group}
                  onClick={() => {
                    setSelectedGroup(group);
                    setPageLimit(48);
                    if (isSports && sportsIptvChannels.length === 0) {
                      void syncSportsIptv();
                    }
                  }}
                  className={`min-h-[40px] px-3 py-1.5 rounded-xl whitespace-nowrap shrink-0 font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
                    isActive
                      ? isSports
                        ? 'bg-emerald-500 text-slate-950 font-bold'
                        : 'bg-amber-500 text-slate-950 font-bold'
                      : isSports
                      ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800'
                  }`}
                >
                  {isSports && <Trophy className="w-3.5 h-3.5" />}
                  <span>
                    {isSports ? `Sports M3U (${sportsIptvChannels.length})` : group}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {isSportsCategoryActive && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <Trophy className="w-4 h-4 text-emerald-400 shrink-0" />
            <div className="min-w-0">
              <p className="font-bold text-white">
                IPTV-org Live Sports Category ({sportsIptvChannels.length} channels)
              </p>
              <p className="text-[11px] text-emerald-300/80 font-mono truncate">
                {IPTV_ORG_SPORTS_PLAYLIST_URL}
              </p>
            </div>
          </div>
          <button
            onClick={() => void syncSportsIptv()}
            disabled={isLoadingSportsIptv}
            className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingSportsIptv ? 'animate-spin' : ''}`} />
            <span>{isLoadingSportsIptv ? 'Syncing Sports M3U...' : 'Refresh Sports M3U'}</span>
          </button>
        </div>
      )}

      {iptvPlaylistError && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-between gap-3 text-xs text-rose-300">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{iptvPlaylistError}</span>
          </div>
          <button
            onClick={() => void loadIptvPlaylist(iptvPlaylistUrl)}
            className="px-3 py-1.5 rounded-lg bg-rose-500 text-white font-bold cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <span
            className={`w-2 h-2 rounded-full ${
              (isSportsCategoryActive ? isLoadingSportsIptv : isLoadingIptvPlaylist)
                ? 'bg-amber-400 animate-ping'
                : 'bg-emerald-400'
            }`}
          />
          <span>
            Showing <strong>{visibleChannels.length}</strong> of <strong>{filteredChannels.length}</strong> channels
            {selectedGroup !== 'All' ? ` in ${selectedGroup}` : ''}
          </span>
        </div>
        <div className="flex items-center gap-3 text-[11px]">
          {isLoadingEpg ? (
            <span className="text-amber-400 font-semibold flex items-center gap-1.5">
              <RefreshCw className="w-3 h-3 animate-spin" />
              Fetching XMLTV Program Guide...
            </span>
          ) : (
            <span className="text-emerald-400 font-medium">
              EPG Matched: {epgMatchedCount} / {visibleChannels.length} visible channels
              {epgLastUpdated ? ` · Updated ${formatEpgTime(epgLastUpdated)}` : ''}
            </span>
          )}
        </div>
      </div>

      {(isSportsCategoryActive
        ? isLoadingSportsIptv && sportsIptvChannels.length === 0
        : isLoadingIptvPlaylist && iptvChannels.length === 0) ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-48 rounded-2xl bg-slate-900/70 border border-slate-800 animate-pulse p-4" />
          ))}
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {visibleChannels.map((ch, idx) => {
            const isFav = isFavorite(ch.id);
            const isCurrent = activeTV?.id === ch.id;
            const programs = findEpgProgramsForChannel(ch, epgProgramsByChannelId);
            const summary = getCurrentAndUpcoming(programs, nowMs);

            return (
              <div
                key={`${ch.id}-${idx}`}
                className={`group rounded-2xl bg-slate-900 border p-4 flex flex-col justify-between gap-3 transition-all hover:shadow-xl ${
                  isCurrent ? 'border-amber-500 shadow-lg shadow-amber-500/10' : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="w-12 h-12 rounded-xl bg-slate-950 border border-slate-800 p-1.5 flex items-center justify-center overflow-hidden shrink-0">
                      <img
                        src={ch.logoUrl}
                        alt={ch.name}
                        className="w-full h-full object-contain"
                        loading="lazy"
                        referrerPolicy="no-referrer"
                        onError={e => {
                          (e.target as HTMLImageElement).src =
                            'https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?w=160&auto=format&fit=crop&q=80';
                        }}
                      />
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                          ch.streamFormat === 'youtube'
                            ? 'bg-red-600/20 text-red-400 border border-red-500/30'
                            : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        }`}
                      >
                        {ch.streamFormat === 'youtube' ? 'YouTube Live' : 'HLS Live'}
                      </span>
                      {ch.tvgChno && (
                        <span className="text-[10px] font-mono text-slate-400">CH {ch.tvgChno}</span>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-white group-hover:text-amber-400 transition-colors line-clamp-1">
                      {ch.name}
                    </h3>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
                      <span className="text-slate-300 font-medium">
                        {ch.country && ch.groupTitle && ch.country !== ch.groupTitle
                          ? `${ch.country} · ${ch.groupTitle}`
                          : ch.groupTitle || ch.country}
                      </span>
                      <span>•</span>
                      <span className="truncate">{ch.category}</span>
                    </div>
                  </div>

                  {summary.currentProgram ? (
                    <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/90 space-y-1.5">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-amber-400 font-bold uppercase">On Now</span>
                        <span className="font-mono text-slate-400">
                          {formatEpgTime(summary.currentProgram.startMs)}–{formatEpgTime(summary.currentProgram.stopMs)}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-white line-clamp-1">
                        {summary.currentProgram.title}
                      </p>
                      <div className="w-full h-1 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className="h-full bg-amber-500"
                          style={{ width: `${summary.progressPercent}%` }}
                        />
                      </div>
                      {summary.nextProgram && (
                        <p className="text-[10px] text-slate-400 line-clamp-1 pt-0.5">
                          <span className="text-sky-400 font-semibold">Next {formatEpgTime(summary.nextProgram.startMs)}:</span>{' '}
                          {summary.nextProgram.title}
                        </p>
                      )}
                    </div>
                  ) : summary.nextProgram ? (
                    <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/90 text-[11px]">
                      <span className="text-sky-400 font-semibold">
                        Next {formatEpgTime(summary.nextProgram.startMs)}:
                      </span>{' '}
                      <span className="text-slate-200 line-clamp-1">{summary.nextProgram.title}</span>
                    </div>
                  ) : (
                    <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/60 text-[11px] text-slate-500 flex items-center justify-between">
                      <span className="truncate">
                        {ch.tvgId ? `EPG: ${ch.tvgId}` : 'Live 24/7 Stream'}
                      </span>
                      {ch.isGeoBlocked && (
                        <span className="text-[9px] text-amber-500/80 font-mono shrink-0 ml-1">GEO</span>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80">
                  <button
                    onClick={() => {
                      playTVChannel(ch);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className={`flex-1 min-h-[44px] py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      isCurrent
                        ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                        : 'bg-slate-800 hover:bg-amber-500 text-slate-200 hover:text-slate-950'
                    }`}
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>{isCurrent ? 'Streaming' : 'Watch Live'}</span>
                  </button>
                  <button
                    onClick={() => toggleFavorite(ch.id)}
                    className={`min-w-[44px] min-h-[44px] p-2 rounded-xl border transition-colors cursor-pointer flex items-center justify-center ${
                      isFav
                        ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                    title={isFav ? 'Remove Favorite' : 'Add to Favorites'}
                  >
                    <Heart className={`w-4 h-4 ${isFav ? 'fill-rose-500' : ''}`} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden">
          <div className="divide-y divide-slate-800">
            {visibleChannels.map((ch, idx) => {
              const programs = findEpgProgramsForChannel(ch, epgProgramsByChannelId);
              const summary = getCurrentAndUpcoming(programs, nowMs);
              const isCurrent = activeTV?.id === ch.id;

              return (
                <div
                  key={`${ch.id}-guide-${idx}`}
                  className={`p-3.5 sm:p-4 flex flex-col lg:flex-row lg:items-center gap-3.5 transition-colors ${
                    isCurrent ? 'bg-amber-500/5' : 'hover:bg-slate-800/40'
                  }`}
                >
                  <div className="lg:w-64 shrink-0 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-800 p-1 flex items-center justify-center shrink-0">
                        <img
                          src={ch.logoUrl}
                          alt={ch.name}
                          className="w-full h-full object-contain"
                          loading="lazy"
                          referrerPolicy="no-referrer"
                          onError={e => {
                            (e.target as HTMLImageElement).src =
                              'https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?w=160&auto=format&fit=crop&q=80';
                          }}
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-white truncate">{ch.name}</p>
                        <p className="text-[10px] text-slate-400 truncate">
                          {ch.tvgChno ? `CH ${ch.tvgChno} · ` : ''}
                          {ch.groupTitle || ch.country}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        playTVChannel(ch);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className={`min-h-[40px] px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 shrink-0 cursor-pointer ${
                        isCurrent
                          ? 'bg-amber-500 text-slate-950'
                          : 'bg-slate-800 hover:bg-amber-500 text-white hover:text-slate-950'
                      }`}
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Watch</span>
                    </button>
                  </div>

                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {summary.currentProgram ? (
                      <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-1">
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="font-black text-amber-400 uppercase">NOW</span>
                          <span className="font-mono text-slate-300">
                            {formatEpgTime(summary.currentProgram.startMs)} –{' '}
                            {formatEpgTime(summary.currentProgram.stopMs)}
                          </span>
                        </div>
                        <p className="text-xs font-bold text-white line-clamp-1">
                          {summary.currentProgram.title}
                        </p>
                        <div className="w-full h-1 rounded-full bg-slate-900 overflow-hidden">
                          <div
                            className="h-full bg-amber-500"
                            style={{ width: `${summary.progressPercent}%` }}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center text-[11px] text-slate-500">
                        Live Broadcast ({ch.category})
                      </div>
                    )}

                    {summary.upcomingPrograms.slice(0, 2).map((prog, pIdx) => (
                      <div
                        key={prog.id}
                        className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1"
                      >
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="font-bold text-sky-400 uppercase">
                            {pIdx === 0 ? 'UP NEXT' : 'LATER'}
                          </span>
                          <span className="font-mono text-slate-400">
                            {formatEpgTime(prog.startMs)} – {formatEpgTime(prog.stopMs)}
                          </span>
                        </div>
                        <p className="text-xs font-semibold text-slate-200 line-clamp-1">
                          {prog.title}
                        </p>
                        {prog.category && (
                          <span className="text-[10px] text-slate-500 block truncate">
                            {prog.category}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {filteredChannels.length > visibleChannels.length && (
        <div className="flex justify-center pt-2">
          <button
            onClick={() => setPageLimit(prev => prev + pageStep)}
            className="min-h-[44px] px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-amber-400 cursor-pointer transition-colors"
          >
            Load More Channels ({filteredChannels.length - visibleChannels.length} remaining)
          </button>
        </div>
      )}

      {!(isSportsCategoryActive ? isLoadingSportsIptv : isLoadingIptvPlaylist) &&
        filteredChannels.length === 0 && (
        <div className="p-10 text-center rounded-2xl bg-slate-900 border border-slate-800 space-y-2.5">
          <Tv className="w-8 h-8 text-slate-500 mx-auto" />
          <h3 className="text-sm font-bold text-white">No IPTV Channels Match Filter</h3>
          <p className="text-xs text-slate-400">
            Try clearing your search query or switching to All Countries / Groups.
          </p>
          <button
            onClick={() => {
              setSelectedGroup('All');
              setSearchTerm('');
              setOnlyWithEpg(false);
              setFormatFilter('all');
            }}
            className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 text-xs font-bold cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      )}
    </div>
  );
};
