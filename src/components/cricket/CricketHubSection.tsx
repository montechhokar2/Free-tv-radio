import React, { useState, useMemo } from 'react';
import {
  Trophy,
  Play,
  RefreshCw,
  Calendar,
  Newspaper,
  Radio,
  Tv,
  Search,
  ExternalLink,
  Heart,
  X,
  AlertCircle,
  MapPin,
  Clock,
  Volume2,
  Film
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { VideoPlayer } from '../player/VideoPlayer';
import { CRICKET_SOURCE_LINKS } from '../../services/cricketHubService';
import { Channel } from '../../types';

type HubTab = 'streams' | 'matches' | 'highlights' | 'radio_news';
type StreamSourceFilter = 'all' | 'live' | 'cricombo' | 'cricketonair' | 'tv';
type MatchFormatFilter = 'All' | 'TEST' | 'ODI' | 'T20I' | 'T20' | 'FC';

const FALLBACK_CRICKET_IMG =
  'https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=320&auto=format&fit=crop&q=80';

function formatMatchDateTime(iso: string): string {
  if (!iso) return 'Schedule TBA';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export const CricketHubSection: React.FC = () => {
  const {
    channels,
    sportsIptvChannels,
    cricketHubData,
    cricketRadioStations,
    isLoadingCricketHub,
    cricketHubError,
    loadCricketHub,
    activeTV,
    playTVChannel,
    closeTVPlayer,
    activeRadio,
    isRadioPlaying,
    playRadioStation,
    toggleFavorite,
    isFavorite
  } = useApp();

  const [hubTab, setHubTab] = useState<HubTab>('streams');
  const [sourceFilter, setSourceFilter] = useState<StreamSourceFilter>('all');
  const [formatFilter, setFormatFilter] = useState<MatchFormatFilter>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [pageLimit, setPageLimit] = useState(36);

  // Merge curated 24/7 Cricket TV + IPTV-org Cricket streams + Cricombo & Cricket On Air live streams
  const curatedCricketTv = useMemo(() => {
    const base = channels.filter(c => c.type === 'tv' && c.category === 'Cricket');
    const seen = new Set(base.map(c => c.streamUrl));
    const iptvCricket = sportsIptvChannels.filter(
      s => !seen.has(s.streamUrl) && /cricket|willow|ipl|star sports|ten cricket|ptv sports/i.test(s.name)
    );
    return [...base, ...iptvCricket];
  }, [channels, sportsIptvChannels]);

  const combinedStreams = useMemo(() => {
    const remote = cricketHubData?.liveStreams || [];
    const seen = new Set(remote.map(c => c.streamUrl));
    const extraTv = curatedCricketTv.filter(c => !seen.has(c.streamUrl));
    return [...remote, ...extraTv];
  }, [cricketHubData, curatedCricketTv]);

  const filteredStreams = useMemo(() => {
    return combinedStreams.filter(ch => {
      if (sourceFilter === 'live' && !ch.isLive) return false;
      if (sourceFilter === 'cricombo' && !ch.id.startsWith('cricombo-')) return false;
      if (sourceFilter === 'cricketonair' && !ch.id.startsWith('coa-')) return false;
      if (sourceFilter === 'tv' && (ch.id.startsWith('cricombo-') || ch.id.startsWith('coa-'))) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          ch.name.toLowerCase().includes(q) ||
          (ch.broadcaster || '').toLowerCase().includes(q) ||
          ch.country.toLowerCase().includes(q) ||
          ch.description.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [combinedStreams, sourceFilter, searchQuery]);

  const filteredHighlights = useMemo(() => {
    const items = cricketHubData?.replaysAndHighlights || [];
    if (!searchQuery.trim()) return items;
    const q = searchQuery.toLowerCase();
    return items.filter(
      ch =>
        ch.name.toLowerCase().includes(q) ||
        (ch.broadcaster || '').toLowerCase().includes(q) ||
        ch.description.toLowerCase().includes(q)
    );
  }, [cricketHubData, searchQuery]);

  const filteredMatches = useMemo(() => {
    const list = cricketHubData?.matches || [];
    return list.filter(m => {
      if (formatFilter !== 'All') {
        const fmt = m.format.toUpperCase();
        if (formatFilter === 'T20' && !fmt.includes('T20')) return false;
        if (formatFilter !== 'T20' && fmt !== formatFilter) return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          m.title.toLowerCase().includes(q) ||
          m.tournamentName.toLowerCase().includes(q) ||
          m.venue.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [cricketHubData, formatFilter, searchQuery]);

  // Combined Cricket & Sports Radio stations for live audio commentary
  const combinedCricketRadio = useMemo(() => {
    const localSports = channels.filter(
      c => c.type === 'radio' && (c.category === 'Sports Radio' || c.category === 'News Radio')
    );
    const seen = new Set(cricketRadioStations.map(s => s.streamUrl));
    return [...cricketRadioStations, ...localSports.filter(s => !seen.has(s.streamUrl))];
  }, [cricketRadioStations, channels]);

  const handlePlayStream = (ch: Channel) => {
    playTVChannel(ch);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const showActiveCricketPlayer = Boolean(
    activeTV &&
      (activeTV.category === 'Cricket' ||
        activeTV.id.startsWith('cricombo-') ||
        activeTV.id.startsWith('coa-'))
  );

  return (
    <div className="space-y-6 pb-24">
      {/* ACTIVE CRICKET PLAYER */}
      {showActiveCricketPlayer && activeTV && (
        <section className="rounded-2xl bg-slate-900 border border-emerald-500/30 p-4 sm:p-5 shadow-2xl space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping shrink-0" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider truncate">
                Cricket Hub Live · {activeTV.name}
              </h2>
              {activeTV.broadcaster && (
                <span className="hidden sm:inline-block px-2 py-0.5 rounded bg-slate-800 text-[10px] font-semibold text-emerald-400 border border-slate-700">
                  {activeTV.broadcaster}
                </span>
              )}
            </div>
            <button
              onClick={closeTVPlayer}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
            >
              <X className="w-4 h-4" />
              <span>Close Player</span>
            </button>
          </div>
          <VideoPlayer channel={activeTV} onClose={closeTVPlayer} />
        </section>
      )}

      {/* CRICKET HUB HEADER */}
      <div className="rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/35 border border-slate-800 p-5 sm:p-6 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold">
              <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 uppercase tracking-wider">
                Official Free Cricket Broadcasts
              </span>
              <span className="px-2 py-0.5 rounded bg-slate-950 text-slate-300 border border-slate-800">
                {combinedStreams.length} Streams · {cricketHubData?.matches.length || 0} Fixtures · {combinedCricketRadio.length} Radio Feeds
              </span>
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-2.5">
              <Trophy className="w-7 h-7 text-amber-400" />
              <span>Cricket Hub</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-3xl">
              Live cricket broadcasts, match schedules, broadcast country guides, official highlights, news, and commentary radio aggregated from Cricombo and Cricket On Air.
            </p>
          </div>

          <button
            onClick={() => void loadCricketHub(true)}
            disabled={isLoadingCricketHub}
            className="self-start lg:self-auto px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-2 shadow-md shadow-amber-500/20 transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingCricketHub ? 'animate-spin' : ''}`} />
            <span>{isLoadingCricketHub ? 'Syncing Cricket Feeds...' : 'Refresh Cricket Hub'}</span>
          </button>
        </div>

        {/* 4 Integrated Source Directory Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {CRICKET_SOURCE_LINKS.map(src => (
            <a
              key={src.id}
              href={src.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group p-3 rounded-xl bg-slate-950/90 hover:bg-slate-950 border border-slate-800 hover:border-emerald-500/40 flex items-center justify-between gap-2 transition-colors"
            >
              <div className="min-w-0">
                <p className="text-xs font-bold text-white group-hover:text-emerald-400 transition-colors truncate">
                  {src.label}
                </p>
                <p className="text-[11px] text-slate-400 truncate mt-0.5">{src.subtitle}</p>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-emerald-400 shrink-0" />
            </a>
          ))}
        </div>

        {/* Primary Sub-Tabs & Search */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-2 border-t border-slate-800/80">
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-xl p-1">
            <button
              onClick={() => {
                setHubTab('streams');
                setPageLimit(36);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                hubTab === 'streams' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Tv className="w-3.5 h-3.5" />
              <span>Live Streams ({combinedStreams.length})</span>
            </button>
            <button
              onClick={() => {
                setHubTab('matches');
                setPageLimit(36);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                hubTab === 'matches' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Matches &amp; Watch Guide ({cricketHubData?.matches.length || 0})</span>
            </button>
            <button
              onClick={() => {
                setHubTab('highlights');
                setPageLimit(36);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                hubTab === 'highlights' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Film className="w-3.5 h-3.5" />
              <span>Highlights &amp; Replays ({cricketHubData?.replaysAndHighlights.length || 0})</span>
            </button>
            <button
              onClick={() => setHubTab('radio_news')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                hubTab === 'radio_news' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Radio className="w-3.5 h-3.5" />
              <span>Radio &amp; News</span>
            </button>
          </div>

          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => {
                setSearchQuery(e.target.value);
                setPageLimit(36);
              }}
              placeholder="Search matches, teams, streams..."
              className="w-full pl-9 pr-8 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {cricketHubError && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-between gap-3 text-xs text-rose-300">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{cricketHubError}</span>
          </div>
          <button
            onClick={() => void loadCricketHub(true)}
            className="px-3 py-1.5 rounded-lg bg-rose-600 text-white font-bold cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* TAB 1: LIVE CRICKET STREAMS */}
      {hubTab === 'streams' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {(
              [
                { id: 'all', label: `All Sources (${combinedStreams.length})` },
                { id: 'live', label: `Live Now (${combinedStreams.filter(c => c.isLive).length})` },
                { id: 'cricombo', label: 'Cricombo Live' },
                { id: 'cricketonair', label: 'Cricket On Air' },
                { id: 'tv', label: `24/7 Cricket TV (${curatedCricketTv.length})` },
              ] as const
            ).map(f => (
              <button
                key={f.id}
                onClick={() => {
                  setSourceFilter(f.id);
                  setPageLimit(36);
                }}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
                  sourceFilter === f.id
                    ? 'bg-emerald-500 text-slate-950 font-bold'
                    : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {isLoadingCricketHub && combinedStreams.length === 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-56 rounded-2xl bg-slate-900/70 border border-slate-800 animate-pulse" />
              ))}
            </div>
          ) : filteredStreams.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredStreams.slice(0, pageLimit).map((ch, idx) => {
                  const isCurrent = activeTV?.id === ch.id;
                  const isFav = isFavorite(ch.id);
                  const sourceTag = ch.id.startsWith('cricombo-')
                    ? 'Cricombo'
                    : ch.id.startsWith('coa-')
                    ? 'Cricket On Air'
                    : '24/7 Cricket TV';

                  return (
                    <div
                      key={`${ch.id}-${idx}`}
                      className={`group rounded-2xl bg-slate-900 border overflow-hidden flex flex-col justify-between transition-all hover:shadow-xl ${
                        isCurrent ? 'border-amber-500 shadow-lg shadow-amber-500/10' : 'border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div>
                        <div className="relative h-40 bg-slate-950 overflow-hidden">
                          <img
                            src={ch.logoUrl || FALLBACK_CRICKET_IMG}
                            alt={ch.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                            referrerPolicy="no-referrer"
                            onError={e => {
                              (e.target as HTMLImageElement).src = FALLBACK_CRICKET_IMG;
                            }}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-black/40" />

                          <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider flex items-center gap-1 ${
                                ch.isLive
                                  ? 'bg-red-600 text-white'
                                  : 'bg-slate-900/90 text-amber-400 border border-amber-500/40'
                              }`}
                            >
                              {ch.isLive && <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />}
                              <span>{ch.isLive ? 'LIVE' : 'SCHEDULED'}</span>
                            </span>
                            <span className="px-2 py-0.5 rounded bg-black/75 text-slate-200 text-[10px] font-semibold">
                              {sourceTag}
                            </span>
                          </div>

                          {ch.isGeoBlocked && (
                            <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded bg-amber-500/90 text-slate-950 text-[9px] font-black uppercase">
                              Region Rules
                            </span>
                          )}
                        </div>

                        <div className="p-4 space-y-1.5">
                          <h3 className="text-sm font-bold text-white group-hover:text-amber-400 transition-colors line-clamp-2 leading-snug">
                            {ch.name}
                          </h3>
                          <p className="text-[11px] font-semibold text-emerald-400 truncate">
                            {ch.broadcaster || 'Official Cricket Channel'}
                          </p>
                          <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                            {ch.description}
                          </p>
                        </div>
                      </div>

                      <div className="px-4 pb-4 pt-2 flex items-center gap-2 border-t border-slate-800/70">
                        <button
                          onClick={() => handlePlayStream(ch)}
                          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                            isCurrent
                              ? 'bg-amber-500 text-slate-950'
                              : 'bg-slate-800 hover:bg-amber-500 text-slate-100 hover:text-slate-950'
                          }`}
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>{isCurrent ? 'Streaming' : 'Watch Live'}</span>
                        </button>
                        <button
                          onClick={() => toggleFavorite(ch.id)}
                          title={isFav ? 'Remove Favorite' : 'Add to Favorites'}
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

              {filteredStreams.length > pageLimit && (
                <div className="flex justify-center pt-2">
                  <button
                    onClick={() => setPageLimit(prev => prev + 36)}
                    className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-amber-400 cursor-pointer"
                  >
                    Load More Streams ({filteredStreams.length - pageLimit} remaining)
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="p-10 text-center rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
              <Trophy className="w-8 h-8 text-slate-500 mx-auto" />
              <h3 className="text-sm font-bold text-white">No Cricket Streams Match Your Filter</h3>
              <p className="text-xs text-slate-400">
                Try switching back to All Sources or clearing your search query.
              </p>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: MATCHES & WHERE-TO-WATCH SCHEDULE */}
      {hubTab === 'matches' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {(['All', 'TEST', 'ODI', 'T20I', 'T20', 'FC'] as MatchFormatFilter[]).map(fmt => (
              <button
                key={fmt}
                onClick={() => setFormatFilter(fmt)}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
                  formatFilter === fmt
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
                }`}
              >
                {fmt === 'All' ? 'All Formats' : fmt}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMatches.slice(0, pageLimit).map(match => (
              <div
                key={match.id}
                className="rounded-2xl bg-slate-900 border border-slate-800 hover:border-emerald-500/40 p-4 flex flex-col justify-between gap-3 transition-colors"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px] font-black uppercase">
                      {match.format}
                    </span>
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-amber-400" />
                      {formatMatchDateTime(match.start)}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-white leading-snug">
                    {match.title}
                  </h3>

                  <p className="text-xs font-medium text-amber-400 line-clamp-1">
                    {match.tournamentName}
                    {match.round ? ` · ${match.round}` : ''}
                  </p>

                  <p className="text-[11px] text-slate-400 flex items-start gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                    <span className="line-clamp-1">{match.venue}</span>
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
                  <span className="text-[10px] font-mono text-slate-500">
                    {match.codes.join(' vs ')}
                  </span>
                  <a
                    href={match.watchUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-emerald-500 text-slate-200 hover:text-slate-950 text-[11px] font-bold flex items-center gap-1.5 transition-colors"
                  >
                    <span>Where to Watch</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: HIGHLIGHTS & FULL MATCH REPLAYS */}
      {hubTab === 'highlights' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredHighlights.slice(0, pageLimit).map((ch, idx) => {
            const isCurrent = activeTV?.id === ch.id;
            return (
              <div
                key={`${ch.id}-hl-${idx}`}
                className={`group rounded-2xl bg-slate-900 border overflow-hidden flex flex-col justify-between ${
                  isCurrent ? 'border-amber-500' : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="relative h-40 bg-slate-950 overflow-hidden">
                    <img
                      src={ch.logoUrl || FALLBACK_CRICKET_IMG}
                      alt={ch.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                      referrerPolicy="no-referrer"
                      onError={e => {
                        (e.target as HTMLImageElement).src = FALLBACK_CRICKET_IMG;
                      }}
                    />
                    <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded bg-black/80 text-amber-400 text-[10px] font-bold uppercase">
                      Official Replay / Highlights
                    </span>
                  </div>
                  <div className="p-4 space-y-1.5">
                    <h3 className="text-sm font-bold text-white line-clamp-2">{ch.name}</h3>
                    <p className="text-[11px] text-emerald-400 font-semibold truncate">
                      {ch.broadcaster}
                    </p>
                  </div>
                </div>
                <div className="px-4 pb-4 pt-2 border-t border-slate-800/70">
                  <button
                    onClick={() => handlePlayStream(ch)}
                    className={`w-full py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                      isCurrent
                        ? 'bg-amber-500 text-slate-950'
                        : 'bg-slate-800 hover:bg-amber-500 text-white hover:text-slate-950'
                    }`}
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>{isCurrent ? 'Playing Now' : 'Watch Highlights'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 4: LIVE CRICKET RADIO COMMENTARY & LATEST NEWS */}
      {hubTab === 'radio_news' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Cricket & Sports Radio Column */}
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Radio className="w-5 h-5 text-amber-400" />
                <h2 className="font-display text-lg font-bold text-white">
                  Cricket &amp; Sports Radio
                </h2>
              </div>
              <span className="text-[11px] font-mono text-emerald-400">
                {combinedCricketRadio.length} Live Stations
              </span>
            </div>

            <div className="space-y-2.5 max-h-[540px] overflow-y-auto pr-1">
              {combinedCricketRadio.map(station => {
                const isPlaying = activeRadio?.id === station.id && isRadioPlaying;
                return (
                  <div
                    key={station.id}
                    className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition-colors ${
                      isPlaying
                        ? 'bg-amber-500/10 border-amber-500/40'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0 overflow-hidden">
                        <img
                          src={station.logoUrl}
                          alt={station.name}
                          className="w-full h-full object-cover"
                          onError={e => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-white truncate">{station.name}</p>
                        <p className="text-[11px] text-slate-400 truncate">
                          {station.country} · {station.category}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => playRadioStation(station)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 shrink-0 cursor-pointer transition-colors ${
                        isPlaying
                          ? 'bg-amber-500 text-slate-950'
                          : 'bg-slate-800 hover:bg-amber-500 text-slate-100 hover:text-slate-950'
                      }`}
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>{isPlaying ? 'On Air' : 'Listen'}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Latest Cricket News Column */}
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Newspaper className="w-5 h-5 text-emerald-400" />
                <h2 className="font-display text-lg font-bold text-white">
                  Latest Cricket Headlines
                </h2>
              </div>
              <span className="text-[11px] font-mono text-slate-400">
                Updated via Cricket On Air
              </span>
            </div>

            <div className="space-y-2.5 max-h-[540px] overflow-y-auto pr-1">
              {(cricketHubData?.news || []).map((item, idx) => (
                <a
                  key={`${item.url}-${idx}`}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-emerald-500/40 flex items-start gap-3 transition-colors"
                >
                  {item.image && (
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-16 h-12 rounded-lg object-cover shrink-0 bg-slate-900"
                      loading="lazy"
                      referrerPolicy="no-referrer"
                    />
                  )}
                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="text-xs font-bold text-white group-hover:text-emerald-400 transition-colors line-clamp-2 leading-snug">
                      {item.title}
                    </p>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400">
                      <span className="font-semibold text-amber-400">{item.source}</span>
                      {item.published && <span>· {formatMatchDateTime(item.published)}</span>}
                    </div>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-emerald-400 shrink-0 mt-1" />
                </a>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
