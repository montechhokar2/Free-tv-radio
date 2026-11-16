import React, { useState, useEffect, useMemo } from 'react';
import {
  Globe,
  Trophy,
  Tv,
  BookOpen,
  Play,
  Heart,
  RefreshCw,
  Search,
  ExternalLink,
  X,
  CheckCircle2,
  XCircle,
  Filter,
  AlertCircle,
  Link2,
  Code2,
  ShieldCheck
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { VideoPlayer } from '../player/VideoPlayer';
import {
  PUBLIC_IPTV_SOURCE_CARDS,
  fetchPublicPlaylistChannels
} from '../../services/publicIptvService';
import { Channel } from '../../types';

type SourceTabId = 'football_cricket' | 'iptv_org' | 'free_public' | 'playlist_docs';

const FALLBACK_TV_LOGO =
  'https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?w=160&auto=format&fit=crop&q=80';

export const PublicIptvSourcesSection: React.FC = () => {
  const {
    publicIptvDirectory,
    isLoadingPublicIptv,
    publicIptvError,
    loadPublicIptvDirectory,
    activeTV,
    playTVChannel,
    closeTVPlayer,
    toggleFavorite,
    isFavorite,
    publicIptvActiveStreams,
    setPublicIptvActiveStreams,
  } = useApp();

  const [activeSourceTab, setActiveSourceTab] = useState<SourceTabId>('football_cricket');
  const [searchQuery, setSearchQuery] = useState('');
  const [httpsOnly, setHttpsOnly] = useState(false);
  const [pageLimit, setPageLimit] = useState(48);

  // Football & Cricket specific sub-state
  const [fcPlaylistMode, setFcPlaylistMode] = useState<'index' | 'worldcup'>('index');
  const [fcCustomChannels, setFcCustomChannels] = useState<Channel[] | null>(null);
  const [fcLoadingPlaylist, setFcLoadingPlaylist] = useState(false);
  const [fcRegionFilter, setFcRegionFilter] = useState('All');
  const [fcOnlyIptvRows, setFcOnlyIptvRows] = useState(false);

  // Free Public IPTV specific sub-state
  const [freePresetId, setFreePresetId] = useState('all');
  const [freePresetChannels, setFreePresetChannels] = useState<Channel[] | null>(null);
  const [freeLoading, setFreeLoading] = useState(false);

  // IPTV-org Database specific sub-state
  const [iptvOrgActiveUrl, setIptvOrgActiveUrl] = useState<string>(
    'https://iptv-org.github.io/iptv/categories/sports.m3u'
  );
  const [iptvOrgActiveLabel, setIptvOrgActiveLabel] = useState<string>('Sports');
  const [iptvOrgChannels, setIptvOrgChannels] = useState<Channel[]>([]);
  const [iptvOrgGroups, setIptvOrgGroups] = useState<string[]>([]);
  const [iptvOrgSelectedGroup, setIptvOrgSelectedGroup] = useState<string>('All');
  const [iptvOrgLoading, setIptvOrgLoading] = useState<boolean>(false);
  const [iptvOrgError, setIptvOrgError] = useState<string | null>(null);

  // Docs & Custom M3U Tester sub-state
  const [customTesterUrl, setCustomTesterUrl] = useState('');
  const [customTesterChannels, setCustomTesterChannels] = useState<Channel[]>([]);
  const [customTesterLoading, setCustomTesterLoading] = useState(false);
  const [customTesterError, setCustomTesterError] = useState<string | null>(null);

  useEffect(() => {
    if (!publicIptvDirectory && !isLoadingPublicIptv) {
      void loadPublicIptvDirectory();
    }
  }, [publicIptvDirectory, isLoadingPublicIptv, loadPublicIptvDirectory]);

  const loadIptvOrgFeed = async (url: string, label: string) => {
    setIptvOrgLoading(true);
    setIptvOrgError(null);
    setIptvOrgActiveUrl(url);
    setIptvOrgActiveLabel(label);
    setIptvOrgSelectedGroup('All');
    setPageLimit(48);
    try {
      const res = await fetchPublicPlaylistChannels(url, 'iptvorg-dir', `IPTV-org (${label})`);
      setIptvOrgChannels(res.channels);
      setIptvOrgGroups(res.groups);
    } catch (err) {
      setIptvOrgError((err as Error).message || 'Failed to load IPTV-org playlist.');
    } finally {
      setIptvOrgLoading(false);
    }
  };

  useEffect(() => {
    if (activeSourceTab === 'iptv_org' && iptvOrgChannels.length === 0 && !iptvOrgLoading) {
      void loadIptvOrgFeed(iptvOrgActiveUrl, iptvOrgActiveLabel);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSourceTab]);

  const handleSelectFcPlaylist = async (mode: 'index' | 'worldcup') => {
    setFcPlaylistMode(mode);
    setPageLimit(48);
    if (mode === 'index') {
      setFcCustomChannels(null);
      return;
    }
    const targetUrl =
      publicIptvDirectory?.footballCricket.worldCupPlaylistUrl ||
      'https://raw.githubusercontent.com/subash9860/iptv-football-cricket/main/worldcup-2026.m3u';
    setFcLoadingPlaylist(true);
    try {
      const res = await fetchPublicPlaylistChannels(targetUrl, 'fc-wc', 'World Cup 2026 IPTV');
      setFcCustomChannels(res.channels);
    } catch {
      setFcCustomChannels(null);
    } finally {
      setFcLoadingPlaylist(false);
    }
  };

  const handleSelectFreePreset = async (presetId: string, url: string, label: string) => {
    setFreePresetId(presetId);
    setPageLimit(48);
    if (presetId === 'all') {
      setFreePresetChannels(null);
      return;
    }
    setFreeLoading(true);
    try {
      const res = await fetchPublicPlaylistChannels(url, `freecast-${presetId}`, `Free Public IPTV (${label})`);
      setFreePresetChannels(res.channels);
    } catch {
      setFreePresetChannels([]);
    } finally {
      setFreeLoading(false);
    }
  };

  const handleCustomTesterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTesterUrl.trim()) return;
    setCustomTesterLoading(true);
    setCustomTesterError(null);
    try {
      const res = await fetchPublicPlaylistChannels(customTesterUrl.trim(), 'custom-m3u', 'Custom M3U');
      setCustomTesterChannels(res.channels);
    } catch (err) {
      setCustomTesterError((err as Error).message || 'Could not parse M3U URL.');
    } finally {
      setCustomTesterLoading(false);
    }
  };

  const fcStreams = useMemo(() => {
    const base =
      fcPlaylistMode === 'worldcup' && fcCustomChannels
        ? fcCustomChannels
        : publicIptvDirectory?.footballCricket.channels || [];
    return base.filter(ch => {
      if (httpsOnly && !ch.streamUrl.startsWith('https://')) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          ch.name.toLowerCase().includes(q) ||
          (ch.groupTitle || '').toLowerCase().includes(q) ||
          ch.country.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [fcPlaylistMode, fcCustomChannels, publicIptvDirectory, httpsOnly, searchQuery]);

  const fcRegions = useMemo(() => {
    const rows = publicIptvDirectory?.footballCricket.directoryRows || [];
    return ['All', ...Array.from(new Set(rows.map(r => r.region)))];
  }, [publicIptvDirectory]);

  const filteredDirectoryRows = useMemo(() => {
    const rows = publicIptvDirectory?.footballCricket.directoryRows || [];
    return rows.filter(row => {
      if (fcRegionFilter !== 'All' && row.region !== fcRegionFilter) return false;
      if (fcOnlyIptvRows && !row.hasPublicIptv) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          row.country.toLowerCase().includes(q) ||
          row.tvChannels.toLowerCase().includes(q) ||
          row.ottPlatforms.toLowerCase().includes(q) ||
          row.iptvStatus.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [publicIptvDirectory, fcRegionFilter, fcOnlyIptvRows, searchQuery]);

  const freeStreams = useMemo(() => {
    const base =
      freePresetId === 'all' || !freePresetChannels
        ? publicIptvDirectory?.freePublicIptv.channels || []
        : freePresetChannels;
    return base.filter(ch => {
      if (httpsOnly && !ch.streamUrl.startsWith('https://')) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          ch.name.toLowerCase().includes(q) ||
          (ch.groupTitle || '').toLowerCase().includes(q) ||
          ch.country.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [freePresetId, freePresetChannels, publicIptvDirectory, httpsOnly, searchQuery]);

  const filteredIptvOrgStreams = useMemo(() => {
    return iptvOrgChannels.filter(ch => {
      if (iptvOrgSelectedGroup !== 'All' && (ch.groupTitle || ch.country) !== iptvOrgSelectedGroup) {
        return false;
      }
      if (httpsOnly && !ch.streamUrl.startsWith('https://')) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          ch.name.toLowerCase().includes(q) ||
          (ch.tvgId || '').toLowerCase().includes(q) ||
          (ch.groupTitle || '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [iptvOrgChannels, iptvOrgSelectedGroup, httpsOnly, searchQuery]);

  const handlePlayStream = (ch: Channel, list: Channel[]) => {
    setPublicIptvActiveStreams(list);
    playTVChannel(ch);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const showActivePlayer = Boolean(
    activeTV &&
      (publicIptvActiveStreams.some(s => s.id === activeTV.id) ||
        activeTV.tags?.includes('public-iptv'))
  );

  const renderChannelGrid = (list: Channel[]) => {
    const visible = list.slice(0, pageLimit);
    if (visible.length === 0) {
      return (
        <div className="p-10 text-center rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
          <Tv className="w-8 h-8 text-slate-500 mx-auto" />
          <h3 className="text-sm font-bold text-white">No Channels Match Your Filter</h3>
          <p className="text-xs text-slate-400">
            Try clearing the search query or turning off the HTTPS-only filter.
          </p>
        </div>
      );
    }

    return (
      <>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {visible.map((ch, idx) => {
            const isCurrent = activeTV?.id === ch.id;
            const isFav = isFavorite(ch.id);
            const isHttps = ch.streamUrl.startsWith('https://');

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
                        src={ch.logoUrl || FALLBACK_TV_LOGO}
                        alt={ch.name}
                        className="w-full h-full object-contain"
                        loading="lazy"
                        referrerPolicy="no-referrer"
                        onError={e => {
                          (e.target as HTMLImageElement).src = FALLBACK_TV_LOGO;
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
                        {ch.streamFormat === 'youtube' ? 'YouTube' : 'HLS'}
                      </span>
                      <span
                        className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${
                          isHttps
                            ? 'bg-sky-500/10 text-sky-400'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {isHttps ? 'HTTPS' : 'HTTP'}
                      </span>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-white group-hover:text-amber-400 transition-colors line-clamp-1">
                      {ch.name}
                    </h3>
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">
                      {ch.groupTitle || ch.broadcaster || ch.country}
                    </p>
                    {ch.tvgId && (
                      <p className="text-[10px] font-mono text-slate-500 truncate mt-0.5">
                        {ch.tvgId}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80">
                  <button
                    onClick={() => handlePlayStream(ch, list)}
                    className={`flex-1 min-h-[44px] py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      isCurrent
                        ? 'bg-amber-500 text-slate-950'
                        : 'bg-slate-800 hover:bg-amber-500 text-slate-200 hover:text-slate-950'
                    }`}
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>{isCurrent ? 'Streaming' : 'Watch Live'}</span>
                  </button>
                  <button
                    onClick={() => toggleFavorite(ch.id)}
                    title={isFav ? 'Remove Favorite' : 'Add to Favorites'}
                    className={`min-w-[44px] min-h-[44px] p-2 rounded-xl border transition-colors cursor-pointer flex items-center justify-center ${
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

        {list.length > pageLimit && (
          <div className="flex justify-center pt-3">
            <button
              onClick={() => setPageLimit(prev => prev + 48)}
              className="min-h-[44px] px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-amber-400 cursor-pointer"
            >
              Load More Channels ({list.length - pageLimit} remaining)
            </button>
          </div>
        )}
      </>
    );
  };

  return (
    <div className="space-y-6 pb-24">
      {/* ACTIVE PLAYER */}
      {showActivePlayer && activeTV && (
        <section className="rounded-2xl bg-slate-900 border border-amber-500/30 p-4 sm:p-5 shadow-2xl space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping shrink-0" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider truncate">
                Open IPTV Live · {activeTV.name}
              </h2>
              {activeTV.broadcaster && (
                <span className="hidden sm:inline-block px-2 py-0.5 rounded bg-slate-800 text-[10px] font-semibold text-amber-400 border border-slate-700">
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

      {/* HEADER + 4 CURATED GITHUB REPOSITORY CARDS */}
      <div className="rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-sky-950/30 border border-slate-800 p-5 sm:p-6 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold">
              <span className="px-2 py-0.5 rounded bg-sky-500/15 text-sky-400 border border-sky-500/30 uppercase tracking-wider">
                Separate Public IPTV Directory
              </span>
              <span className="px-2 py-0.5 rounded bg-slate-950 text-slate-300 border border-slate-800">
                4 Open-Source Repositories &amp; Docs
              </span>
            </div>
            <h1 className="font-display text-fluid-title font-extrabold text-white flex items-center gap-2.5">
              <Globe className="w-6 h-6 sm:w-7 sm:h-7 text-sky-400 shrink-0" />
              <span>Open IPTV &amp; Broadcaster Directory</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-3xl">
              Dedicated category for Football &amp; Cricket broadcasters, Worldwide IPTV-org channel database, Free Public IPTV playlists, and official M3U Playlist documentation.
            </p>
          </div>

          <button
            onClick={() => void loadPublicIptvDirectory(true)}
            disabled={isLoadingPublicIptv}
            className="self-start lg:self-auto min-h-[44px] px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-2 shadow-md shadow-amber-500/20 transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingPublicIptv ? 'animate-spin' : ''}`} />
            <span>{isLoadingPublicIptv ? 'Syncing Repositories...' : 'Refresh All Sources'}</span>
          </button>
        </div>

        {/* 4 Source Selector Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {PUBLIC_IPTV_SOURCE_CARDS.map(card => {
            const isSelected = activeSourceTab === card.id;
            return (
              <div
                key={card.id}
                onClick={() => {
                  setActiveSourceTab(card.id);
                  setPageLimit(48);
                }}
                role="button"
                tabIndex={0}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    setActiveSourceTab(card.id);
                    setPageLimit(48);
                  }
                }}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                  isSelected
                    ? 'bg-sky-500/15 border-sky-400/60 shadow-lg shadow-sky-500/10'
                    : 'bg-slate-950/90 hover:bg-slate-950 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-sky-400">
                    {card.badge}
                  </span>
                  <a
                    href={card.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={e => e.stopPropagation()}
                    title={`Open ${card.title} on GitHub`}
                    className="text-slate-400 hover:text-white p-0.5"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
                <div>
                  <h2 className="text-xs font-bold text-white flex items-center gap-1.5">
                    {card.id === 'football_cricket' && <Trophy className="w-3.5 h-3.5 text-amber-400" />}
                    {card.id === 'iptv_org' && <Globe className="w-3.5 h-3.5 text-sky-400" />}
                    {card.id === 'free_public' && <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />}
                    {card.id === 'playlist_docs' && <BookOpen className="w-3.5 h-3.5 text-purple-400" />}
                    <span>{card.title}</span>
                  </h2>
                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{card.description}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Search + HTTPS filter toolbar */}
        {activeSourceTab !== 'playlist_docs' && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-800/80">
            <div className="relative flex-1 sm:max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => {
                  setSearchQuery(e.target.value);
                  setPageLimit(48);
                }}
                placeholder="Filter channels, broadcasters, or countries..."
                className="w-full min-h-[44px] pl-9 pr-10 py-2 bg-slate-950 border border-slate-800 rounded-xl text-base sm:text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-500"
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

            <button
              onClick={() => setHttpsOnly(prev => !prev)}
              className={`min-h-[44px] px-3.5 py-2 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer w-full sm:w-auto ${
                httpsOnly
                  ? 'bg-sky-500/20 border-sky-500/40 text-sky-300'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              <span>HTTPS Streams Only</span>
            </button>
          </div>
        )}
      </div>

      {publicIptvError && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-between gap-3 text-xs text-rose-300">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{publicIptvError}</span>
          </div>
          <button
            onClick={() => void loadPublicIptvDirectory(true)}
            className="px-3 py-1.5 rounded-lg bg-rose-600 text-white font-bold cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* TAB 1: IPTV FOOTBALL & CRICKET */}
      {activeSourceTab === 'football_cricket' && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <button
                onClick={() => void handleSelectFcPlaylist('index')}
                className={`min-h-[44px] px-3.5 py-2 rounded-xl font-bold cursor-pointer transition-colors ${
                  fcPlaylistMode === 'index'
                    ? 'bg-amber-500 text-slate-950'
                    : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
                }`}
              >
                Sports Index Playlist (index.m3u · {publicIptvDirectory?.footballCricket.channels.length || 0})
              </button>
              <button
                onClick={() => void handleSelectFcPlaylist('worldcup')}
                className={`min-h-[44px] px-3.5 py-2 rounded-xl font-bold cursor-pointer transition-colors ${
                  fcPlaylistMode === 'worldcup'
                    ? 'bg-amber-500 text-slate-950'
                    : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
                }`}
              >
                World Cup 2026 Playlist (worldcup-2026.m3u)
              </button>
            </div>
            <span className="text-[11px] font-mono text-slate-400">
              {fcStreams.length} playable broadcaster streams
            </span>
          </div>

          {fcLoadingPlaylist || (isLoadingPublicIptv && !publicIptvDirectory) ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-44 rounded-2xl bg-slate-900/70 border border-slate-800 animate-pulse" />
              ))}
            </div>
          ) : (
            renderChannelGrid(fcStreams)
          )}

          {/* Country Broadcaster & OTT Directory Table from README.md */}
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 sm:p-5 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-lg font-bold text-white">
                  Official Country Broadcaster &amp; IPTV Availability Directory
                </h2>
                <p className="text-xs text-slate-400">
                  Parsed live from <span className="font-mono text-slate-300">subash9860/iptv-football-cricket</span> README broadcaster registry.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:flex sm:flex-wrap items-center gap-2 text-xs">
                <select
                  value={fcRegionFilter}
                  onChange={e => setFcRegionFilter(e.target.value)}
                  className="w-full sm:w-auto min-h-[44px] px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-base sm:text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  {fcRegions.map(r => (
                    <option key={r} value={r}>
                      {r === 'All' ? 'All Regions' : r}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => setFcOnlyIptvRows(prev => !prev)}
                  className={`w-full sm:w-auto min-h-[44px] px-3.5 py-2 rounded-xl border font-semibold cursor-pointer ${
                    fcOnlyIptvRows
                      ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  Free IPTV Available Only
                </button>
              </div>
            </div>

            {/* Mobile Card List (avoids wide table scrolling on phones) */}
            <div className="md:hidden space-y-2.5">
              {filteredDirectoryRows.map((row, idx) => (
                <div
                  key={`${row.country}-card-${idx}`}
                  className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-bold text-white text-sm">{row.country}</div>
                      <div className="text-[11px] text-slate-400">{row.region} · {row.broadcastType}</div>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold shrink-0 ${
                        row.hasPublicIptv
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                      }`}
                    >
                      {row.hasPublicIptv ? (
                        <CheckCircle2 className="w-3 h-3 shrink-0" />
                      ) : (
                        <XCircle className="w-3 h-3 shrink-0" />
                      )}
                      <span>{row.iptvStatus}</span>
                    </span>
                  </div>
                  <div className="grid grid-cols-1 gap-1 text-[11px] pt-1 border-t border-slate-800/80">
                    <div>
                      <span className="text-slate-500 font-semibold">TV: </span>
                      <span className="text-slate-200">{row.tvChannels}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 font-semibold">OTT: </span>
                      <span className="text-slate-400">{row.ottPlatforms}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Tablet & Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
                    <th className="py-2.5 pr-4">Country / Region</th>
                    <th className="py-2.5 pr-4">TV Channel(s)</th>
                    <th className="py-2.5 pr-4">OTT / Streaming</th>
                    <th className="py-2.5 pr-4">Type</th>
                    <th className="py-2.5">Public IPTV?</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70">
                  {filteredDirectoryRows.map((row, idx) => (
                    <tr key={`${row.country}-${idx}`} className="hover:bg-slate-800/30">
                      <td className="py-2.5 pr-4 font-bold text-white whitespace-nowrap">
                        <div>{row.country}</div>
                        <div className="text-[10px] font-normal text-slate-500">{row.region}</div>
                      </td>
                      <td className="py-2.5 pr-4 text-slate-200">{row.tvChannels}</td>
                      <td className="py-2.5 pr-4 text-slate-400">{row.ottPlatforms}</td>
                      <td className="py-2.5 pr-4">
                        <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-[10px] text-slate-300 whitespace-nowrap">
                          {row.broadcastType}
                        </span>
                      </td>
                      <td className="py-2.5">
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] font-semibold ${
                            row.hasPublicIptv ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {row.hasPublicIptv ? (
                            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                          ) : (
                            <XCircle className="w-3.5 h-3.5 shrink-0" />
                          )}
                          <span>{row.iptvStatus}</span>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: FREE PUBLIC IPTV (freecasthub/public-iptv) */}
      {activeSourceTab === 'free_public' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="space-y-1">
              <p className="font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Verified Public Broadcaster Playlists (freecasthub/public-iptv)</span>
              </p>
              <p className="text-slate-300 text-[11px]">
                Curated legal, publicly available FTA streams across News, Sports, Weather, and Education.
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(publicIptvDirectory?.freePublicIptv.presets || []).map(preset => (
                <button
                  key={preset.id}
                  onClick={() => void handleSelectFreePreset(preset.id, preset.url, preset.label)}
                  className={`min-h-[40px] px-3 py-1.5 rounded-xl font-bold cursor-pointer transition-colors ${
                    freePresetId === preset.id
                      ? 'bg-emerald-500 text-slate-950'
                      : 'bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {freeLoading || (isLoadingPublicIptv && !publicIptvDirectory) ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-44 rounded-2xl bg-slate-900/70 border border-slate-800 animate-pulse" />
              ))}
            </div>
          ) : (
            renderChannelGrid(freeStreams)
          )}
        </div>
      )}

      {/* TAB 3: IPTV-ORG WORLDWIDE DATABASE */}
      {activeSourceTab === 'iptv_org' && (
        <div className="space-y-5">
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 sm:p-5 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-base font-bold text-white">
                  IPTV-org Public Playlists ({iptvOrgActiveLabel} · {filteredIptvOrgStreams.length.toLocaleString()} streams)
                </h2>
                <p className="text-[11px] font-mono text-sky-400 break-all mt-0.5">
                  {iptvOrgActiveUrl}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <button
                  onClick={() =>
                    void loadIptvOrgFeed(
                      publicIptvDirectory?.iptvOrgDatabase.masterPlaylistUrl ||
                        'https://iptv-org.github.io/iptv/index.m3u',
                      'Worldwide Master'
                    )
                  }
                  className={`min-h-[44px] px-3.5 py-2 rounded-xl font-bold cursor-pointer ${
                    iptvOrgActiveUrl.endsWith('/index.m3u')
                      ? 'bg-sky-500 text-slate-950'
                      : 'bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800'
                  }`}
                >
                  Load Full index.m3u
                </button>
                <button
                  onClick={() =>
                    void loadIptvOrgFeed(
                      publicIptvDirectory?.iptvOrgDatabase.categoryMasterUrl ||
                        'https://iptv-org.github.io/iptv/index.category.m3u',
                      'By Category'
                    )
                  }
                  className={`min-h-[44px] px-3.5 py-2 rounded-xl font-bold cursor-pointer ${
                    iptvOrgActiveUrl.endsWith('/index.category.m3u')
                      ? 'bg-sky-500 text-slate-950'
                      : 'bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800'
                  }`}
                >
                  Load index.category.m3u
                </button>
                {iptvOrgGroups.length > 1 && (
                  <select
                    value={iptvOrgSelectedGroup}
                    onChange={e => {
                      setIptvOrgSelectedGroup(e.target.value);
                      setPageLimit(48);
                    }}
                    className="w-full sm:w-auto min-h-[44px] px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-base sm:text-xs text-white focus:outline-none focus:border-sky-500"
                  >
                    <option value="All">All Groups ({iptvOrgChannels.length})</option>
                    {iptvOrgGroups.map(g => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            {/* Category Selector Chips from PLAYLISTS.md */}
            {(publicIptvDirectory?.iptvOrgDatabase.categories || []).length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-800/80">
                {(publicIptvDirectory?.iptvOrgDatabase.categories || []).map(cat => {
                  const isActive = iptvOrgActiveUrl === cat.playlistUrl;
                  return (
                    <button
                      key={cat.playlistUrl}
                      onClick={() => void loadIptvOrgFeed(cat.playlistUrl, cat.name)}
                      className={`min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                        isActive
                          ? 'bg-amber-500 text-slate-950 font-bold'
                          : 'bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800'
                      }`}
                    >
                      {cat.name} <span className="opacity-70">({cat.channelCount})</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {iptvOrgError && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300">
              {iptvOrgError}
            </div>
          )}

          {iptvOrgLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-44 rounded-2xl bg-slate-900/70 border border-slate-800 animate-pulse" />
              ))}
            </div>
          ) : (
            renderChannelGrid(filteredIptvOrgStreams)
          )}
        </div>
      )}

      {/* TAB 4: IPTV PLAYLIST DOCS (docs/playlists.md) & M3U TESTER */}
      {activeSourceTab === 'playlist_docs' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 space-y-4">
              <div className="flex items-center justify-between gap-2">
                <h2 className="font-display text-lg font-bold text-white flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-purple-400" />
                  <span>{publicIptvDirectory?.playlistDocs.title || 'IPTV Playlist Docs'}</span>
                </h2>
                <a
                  href="https://github.com/iptv-org/iptv/blob/master/docs/playlists.md"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-sky-400 hover:underline flex items-center gap-1"
                >
                  <span>GitHub Docs</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {publicIptvDirectory?.playlistDocs.summary}
              </p>

              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400">
                  M3U Formatting &amp; Validation Rules
                </h3>
                <ul className="space-y-1.5 text-xs text-slate-300">
                  {(publicIptvDirectory?.playlistDocs.internalRules || []).map((rule, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{rule}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 space-y-4">
              <h3 className="font-display text-base font-bold text-white flex items-center gap-2">
                <Code2 className="w-4 h-4 text-sky-400" />
                <span>Internal vs Public M3U Structure</span>
              </h3>

              <div className="space-y-2">
                <p className="text-[11px] font-bold text-slate-400 uppercase">
                  Internal Playlist Example (Moderation / streams/)
                </p>
                <pre className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-emerald-300 overflow-x-auto">
                  {publicIptvDirectory?.playlistDocs.internalExample}
                </pre>
              </div>

              <div className="space-y-2">
                <p className="text-[11px] font-bold text-slate-400 uppercase">
                  Public Playlist Example (Generated Daily with Logos, EPG &amp; Groups)
                </p>
                <pre className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-sky-300 overflow-x-auto">
                  {publicIptvDirectory?.playlistDocs.publicExample}
                </pre>
              </div>
            </div>
          </div>

          {/* Interactive M3U Parser / Tester */}
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 space-y-4">
            <div className="space-y-1">
              <h3 className="font-display text-base font-bold text-white flex items-center gap-2">
                <Link2 className="w-4 h-4 text-amber-400" />
                <span>Test &amp; Stream Any Public .m3u / .m3u8 URL</span>
              </h3>
              <p className="text-xs text-slate-400">
                Paste any category or country M3U link from IPTV-org, Free Public IPTV, or IPTV Football &amp; Cricket to parse and play immediately.
              </p>
            </div>

            <form onSubmit={handleCustomTesterSubmit} className="flex flex-col sm:flex-row gap-2.5">
              <input
                type="url"
                value={customTesterUrl}
                onChange={e => setCustomTesterUrl(e.target.value)}
                placeholder="https://iptv-org.github.io/iptv/categories/news.m3u"
                className="flex-1 min-h-[44px] px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-base sm:text-xs text-white font-mono focus:outline-none focus:border-amber-500"
              />
              <button
                type="submit"
                disabled={customTesterLoading}
                className="min-h-[44px] px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold cursor-pointer disabled:opacity-50 shrink-0"
              >
                {customTesterLoading ? 'Parsing M3U...' : 'Parse & Load Streams'}
              </button>
            </form>

            {customTesterError && (
              <p className="text-xs text-rose-400">{customTesterError}</p>
            )}

            {customTesterChannels.length > 0 && (
              <div className="pt-2 space-y-3">
                <p className="text-xs font-semibold text-emerald-400">
                  Parsed {customTesterChannels.length} channels from custom M3U playlist:
                </p>
                {renderChannelGrid(customTesterChannels)}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
