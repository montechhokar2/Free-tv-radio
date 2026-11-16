import React, { useState, useMemo } from 'react';
import {
  ShieldAlert,
  Lock,
  Unlock,
  Play,
  RefreshCw,
  Search,
  Globe,
  ExternalLink,
  Link2,
  X,
  AlertCircle,
  Tv,
  Database
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { VideoPlayer } from '../player/VideoPlayer';
import { IPTV_ORG_XXX_PLAYLIST_URL, IPTV_ORG_API_ENDPOINTS } from '../../services/iptvOrgService';
import { Adult18DirectoryEntry, Channel } from '../../types';

const FALLBACK_ADULT_LOGO =
  'https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?w=160&auto=format&fit=crop&q=80';

export const Adult18Section: React.FC = () => {
  const {
    isAdult18Unlocked,
    unlockAdult18,
    lockAdult18,
    isParentalLocked,
    adult18Channels,
    adult18Directory,
    isLoadingAdult18,
    adult18Error,
    adult18CustomPlaylistUrl,
    syncAdult18Catalog,
    loadCustomAdult18M3u,
    activeTV,
    playTVChannel,
    closeTVPlayer,
    setCurrentTab,
    accountPermissions,
    setIsAuthModalOpen
  } = useApp();

  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [gateError, setGateError] = useState<string | null>(null);

  const [viewTab, setViewTab] = useState<'streams' | 'directory'>('streams');
  const [searchQuery, setSearchQuery] = useState('');
  const [countryFilter, setCountryFilter] = useState('All');
  const [customM3uInput, setCustomM3uInput] = useState(adult18CustomPlaylistUrl || '');
  const [customM3uStatus, setCustomM3uStatus] = useState<string | null>(null);
  const [pageLimit, setPageLimit] = useState(48);

  const handleUnlockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setGateError(null);

    if (!accountPermissions.canAccessAdult18) {
      setGateError('18+ Adult Vault access is currently disabled in your Account Permissions.');
      return;
    }

    if (!ageConfirmed) {
      setGateError('Please confirm that you are 18 years of age or older.');
      return;
    }

    const ok = unlockAdult18(pinInput);
    if (!ok) {
      setGateError('Invalid Parental Control PIN. (Default PIN: 0000)');
      return;
    }
    setPinInput('');
  };

  const handleLoadCustomM3u = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customM3uInput.trim()) return;
    setCustomM3uStatus(null);
    const count = await loadCustomAdult18M3u(customM3uInput.trim());
    if (count > 0) {
      setCustomM3uStatus(`Parsed and added ${count} channels from external M3U into this isolated 18+ section.`);
      setViewTab('streams');
    } else {
      setCustomM3uStatus('No valid #EXTINF stream URLs were found in that M3U file.');
    }
  };

  const availableCountries = useMemo(() => {
    const set = new Set<string>();
    adult18Directory.forEach(item => {
      if (item.country) set.add(item.country);
    });
    adult18Channels.forEach(ch => {
      if (ch.countryCode) set.add(ch.countryCode);
    });
    return ['All', ...Array.from(set).sort()];
  }, [adult18Directory, adult18Channels]);

  const filteredStreams = useMemo(() => {
    return adult18Channels.filter(ch => {
      if (countryFilter !== 'All' && ch.countryCode?.toUpperCase() !== countryFilter.toUpperCase() && ch.country.toUpperCase() !== countryFilter.toUpperCase()) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          ch.name.toLowerCase().includes(q) ||
          (ch.broadcaster || '').toLowerCase().includes(q) ||
          (ch.tvgId || '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [adult18Channels, countryFilter, searchQuery]);

  const filteredDirectory = useMemo(() => {
    return adult18Directory.filter(entry => {
      if (countryFilter !== 'All' && entry.country.toUpperCase() !== countryFilter.toUpperCase()) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          entry.name.toLowerCase().includes(q) ||
          entry.id.toLowerCase().includes(q) ||
          (entry.network || '').toLowerCase().includes(q) ||
          entry.owners.some(o => o.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [adult18Directory, countryFilter, searchQuery]);

  const playDirectoryEntry = (entry: Adult18DirectoryEntry) => {
    if (!entry.streamUrl) return;
    const ch: Channel = {
      id: `adult18-dir-${entry.id.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
      name: entry.name,
      type: 'tv',
      category: '18+ Adult',
      language: 'English',
      country: entry.country || 'International',
      countryCode: entry.country,
      streamUrl: entry.streamUrl,
      streamFormat: entry.streamFormat || 'hls',
      logoUrl: entry.logoUrl || FALLBACK_ADULT_LOGO,
      description: `18+ Adult / XXX Category · ${entry.network || entry.owners[0] || entry.name}`,
      currentProgram: `18+ Restricted Broadcast · ${entry.name}`,
      quality: entry.quality ? [entry.quality, 'Auto'] : ['Auto'],
      broadcaster: entry.network || entry.owners[0] || entry.name,
      verifiedFta: true,
      isLive: true,
      tvgId: entry.id,
      groupTitle: '18+ Adult',
      tags: ['18+', 'nsfw', 'xxx'],
    };
    playTVChannel(ch);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!isAdult18Unlocked) {
    return (
      <div className="max-w-xl mx-auto py-10 px-4">
        <div className="rounded-3xl bg-slate-900 border border-rose-500/30 p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <span className="inline-block px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-black uppercase tracking-wider">
                Restricted · 18+ Only
              </span>
              <h1 className="font-display text-2xl font-extrabold text-white mt-1">
                Separate 18+ Adult Category
              </h1>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-300 space-y-2 leading-relaxed">
            <p>
              This section is isolated from Home, Live TV, Search, and family playlists. It queries the{' '}
              <span className="font-mono text-rose-300">iptv-org/api</span> (<code className="text-slate-200">is_nsfw: true</code> /{' '}
              <code className="text-slate-200">xxx</code>) and supports external{' '}
              <span className="font-mono text-rose-300">#EXTM3U</span> playlists.
            </p>
            <p className="text-slate-400">
              You must confirm you are at least 18 years old{isParentalLocked ? ' and enter your Parental Control PIN' : ''} to view this directory.
            </p>
          </div>

          <form onSubmit={handleUnlockSubmit} className="space-y-4">
            <label className="min-h-[48px] flex items-start gap-3 p-3.5 rounded-2xl bg-slate-950 border border-slate-800 cursor-pointer hover:border-slate-700 transition-colors">
              <input
                type="checkbox"
                checked={ageConfirmed}
                onChange={e => setAgeConfirmed(e.target.checked)}
                className="mt-0.5 w-5 h-5 accent-rose-500 rounded cursor-pointer shrink-0"
              />
              <span className="text-xs text-slate-200 leading-snug">
                I confirm that I am <strong>18 years of age or older</strong> and wish to access the separate 18+ Adult / XXX IPTV category.
              </span>
            </label>

            {isParentalLocked && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-rose-400" />
                  <span>Parental Control PIN Required</span>
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={8}
                  value={pinInput}
                  onChange={e => setPinInput(e.target.value)}
                  placeholder="Enter Parental PIN (default: 0000)"
                  className="w-full min-h-[44px] px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-base sm:text-xs text-white focus:outline-none focus:border-rose-500"
                />
              </div>
            )}

            {gateError && (
              <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-xs text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{gateError}</span>
              </div>
            )}

            {!accountPermissions.canAccessAdult18 && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 flex flex-wrap items-center justify-between gap-3">
                <span>18+ access is turned off in your Account Permissions.</span>
                <button
                  type="button"
                  onClick={() => setIsAuthModalOpen(true)}
                  className="min-h-[40px] px-3 py-1.5 rounded-lg bg-amber-500 text-slate-950 font-bold text-xs shrink-0 cursor-pointer hover:bg-amber-400"
                >
                  Account Permissions
                </button>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                type="submit"
                className="flex-1 min-h-[44px] py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Unlock className="w-4 h-4" />
                <span>Enter 18+ Category</span>
              </button>
              <button
                type="button"
                onClick={() => setCurrentTab('home')}
                className="min-h-[44px] py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer"
              >
                Back to Home
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  const showActivePlayer = activeTV && activeTV.category === '18+ Adult';

  return (
    <div className="space-y-6 pb-24">
      {showActivePlayer && (
        <section className="rounded-3xl bg-slate-900 border border-rose-500/30 p-4 sm:p-5 shadow-2xl space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping shrink-0" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider truncate">
                18+ Player · {activeTV.name}
              </h2>
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

      {/* Header */}
      <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-rose-950/30 border border-rose-500/25 p-5 sm:p-6 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-black uppercase tracking-wider">
                18+ Isolated · IPTV-org API &amp; M3U
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-slate-950 text-slate-300 border border-slate-800 text-[10px] font-bold">
                {adult18Channels.length} Playable Streams · {adult18Directory.length} XXX Channels Indexed
              </span>
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-2.5">
              <ShieldAlert className="w-7 h-7 text-rose-400" />
              <span>18+ Adult / XXX IPTV Category</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-3xl">
              Powered by <span className="font-mono text-slate-300">iptv-org/api</span> (<code className="text-slate-300">is_nsfw</code> / <code className="text-slate-300">categories: ["xxx"]</code>). Note: per <span className="font-mono text-slate-300">iptv-org/iptv</span> playlist policy, public <code className="text-slate-300">categories/xxx.m3u</code> distributes 0 static links—live API streams and any custom M3U you load remain isolated here.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => void syncAdult18Catalog(true)}
              disabled={isLoadingAdult18}
              className="min-h-[44px] px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingAdult18 ? 'animate-spin' : ''}`} />
              <span>{isLoadingAdult18 ? 'Syncing API...' : 'Sync IPTV-org 18+ API'}</span>
            </button>

            <button
              onClick={lockAdult18}
              className="min-h-[44px] px-3.5 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-slate-200 flex items-center gap-1.5 cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5 text-rose-400" />
              <span>Lock 18+ Section</span>
            </button>
          </div>
        </div>

        {/* Custom 18+ M3U Loader & API Endpoints Summary */}
        <div className="pt-4 border-t border-slate-800/80 grid grid-cols-1 lg:grid-cols-2 gap-4 text-xs">
          <form onSubmit={handleLoadCustomM3u} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-bold text-white flex items-center gap-1.5">
                <Link2 className="w-3.5 h-3.5 text-rose-400" />
                <span>Load Custom 18+ M3U / M3U8 Playlist URL</span>
              </span>
              <button
                type="button"
                onClick={() => setCustomM3uInput(IPTV_ORG_XXX_PLAYLIST_URL)}
                className="text-[11px] text-rose-400 hover:underline cursor-pointer py-1"
              >
                Use iptv-org xxx.m3u
              </button>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="url"
                value={customM3uInput}
                onChange={e => setCustomM3uInput(e.target.value)}
                placeholder="Paste any external #EXTM3U / .m3u8 URL (isolated to 18+ tab)"
                className="flex-1 min-h-[44px] px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono text-base sm:text-xs focus:outline-none focus:border-rose-500"
              />
              <button
                type="submit"
                disabled={isLoadingAdult18}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold cursor-pointer disabled:opacity-50 shrink-0"
              >
                Load M3U
              </button>
            </div>
            {customM3uStatus && (
              <p className="text-[11px] text-emerald-400 font-medium">{customM3uStatus}</p>
            )}
          </form>

          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-[11px] text-slate-400">
            <div className="font-bold text-white flex items-center gap-1.5 text-xs">
              <Database className="w-3.5 h-3.5 text-rose-400" />
              <span>Connected IPTV-org API &amp; Playlist Spec</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 font-mono text-[10px]">
              <div className="truncate">Channels: {IPTV_ORG_API_ENDPOINTS.channels}</div>
              <div className="truncate">Streams: {IPTV_ORG_API_ENDPOINTS.streams}</div>
              <div className="truncate">Logos: {IPTV_ORG_API_ENDPOINTS.logos}</div>
              <div className="truncate">XXX M3U: {IPTV_ORG_XXX_PLAYLIST_URL}</div>
            </div>
          </div>
        </div>

        {/* Sub-tabs, Search & Country Filter */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-800/80">
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-1 w-full sm:w-fit overflow-x-auto scrollbar-none">
            <button
              onClick={() => {
                setViewTab('streams');
                setPageLimit(48);
              }}
              className={`flex-1 sm:flex-initial min-h-[40px] px-3.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                viewTab === 'streams' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Playable Streams ({filteredStreams.length})
            </button>
            <button
              onClick={() => {
                setViewTab('directory');
                setPageLimit(48);
              }}
              className={`flex-1 sm:flex-initial min-h-[40px] px-3.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                viewTab === 'directory' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              18+ API Directory ({filteredDirectory.length})
            </button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-2 flex-1 sm:justify-end">
            <div className="relative flex-1 sm:max-w-xs">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => {
                  setSearchQuery(e.target.value);
                  setPageLimit(48);
                }}
                placeholder="Search 18+ channels, network, ID..."
                className="w-full min-h-[44px] pl-9 pr-10 py-2 bg-slate-950 border border-slate-800 rounded-xl text-base sm:text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-rose-500"
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

            <select
              value={countryFilter}
              onChange={e => {
                setCountryFilter(e.target.value);
                setPageLimit(48);
              }}
              className="w-full sm:w-auto min-h-[44px] px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-base sm:text-xs text-white focus:outline-none focus:border-rose-500"
            >
              {availableCountries.map(c => (
                <option key={c} value={c}>
                  {c === 'All' ? 'All Countries' : c}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {adult18Error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{adult18Error}</span>
          </div>
          <button
            onClick={() => void syncAdult18Catalog(true)}
            className="px-3 py-1 rounded-lg bg-rose-600 text-white font-bold cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {isLoadingAdult18 && adult18Directory.length === 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-44 rounded-2xl bg-slate-900/70 border border-slate-800 animate-pulse" />
          ))}
        </div>
      ) : viewTab === 'streams' ? (
        filteredStreams.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredStreams.slice(0, pageLimit).map((ch, idx) => {
                const isCurrent = activeTV?.id === ch.id;
                return (
                  <div
                    key={`${ch.id}-${idx}`}
                    className={`rounded-2xl bg-slate-900 border p-4 flex flex-col justify-between gap-3 transition-all ${
                      isCurrent ? 'border-rose-500 shadow-lg shadow-rose-500/10' : 'border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="w-12 h-12 rounded-xl bg-slate-950 border border-slate-800 p-1.5 flex items-center justify-center overflow-hidden shrink-0">
                          <img
                            src={ch.logoUrl || FALLBACK_ADULT_LOGO}
                            alt={ch.name}
                            className="w-full h-full object-contain"
                            loading="lazy"
                            referrerPolicy="no-referrer"
                            onError={e => {
                              (e.target as HTMLImageElement).src = FALLBACK_ADULT_LOGO;
                            }}
                          />
                        </div>
                        <span className="px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-300 border border-rose-500/30 text-[9px] font-black uppercase">
                          18+ · {ch.streamFormat.toUpperCase()}
                        </span>
                      </div>

                      <div>
                        <h3 className="text-sm font-bold text-white line-clamp-1">{ch.name}</h3>
                        <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                          {ch.country} · {ch.broadcaster || '18+ Adult'}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        playTVChannel(ch);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className={`w-full min-h-[44px] py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                        isCurrent
                          ? 'bg-rose-600 text-white'
                          : 'bg-slate-800 hover:bg-rose-600 text-slate-200 hover:text-white'
                      }`}
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>{isCurrent ? 'Streaming' : 'Watch Live'}</span>
                    </button>
                  </div>
                );
              })}
            </div>

            {filteredStreams.length > pageLimit && (
              <div className="flex justify-center pt-2">
                <button
                  onClick={() => setPageLimit(prev => prev + 48)}
                  className="min-h-[44px] px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-rose-400 cursor-pointer"
                >
                  Load More Streams ({filteredStreams.length - pageLimit} remaining)
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="p-10 text-center rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <Tv className="w-8 h-8 text-slate-500 mx-auto" />
            <h3 className="text-sm font-bold text-white">No Playable 18+ Streams Match Filter</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Switch to the <strong>18+ API Directory ({adult18Directory.length})</strong> tab to browse all indexed NSFW channels or paste an external 18+ <code className="text-slate-200">.m3u</code> / <code className="text-slate-200">.m3u8</code> URL above.
            </p>
          </div>
        )
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredDirectory.slice(0, pageLimit).map(entry => (
              <div
                key={entry.id}
                className="rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 p-4 flex flex-col justify-between gap-3"
              >
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="w-11 h-11 rounded-xl bg-slate-950 border border-slate-800 p-1.5 flex items-center justify-center overflow-hidden shrink-0">
                      <img
                        src={entry.logoUrl || FALLBACK_ADULT_LOGO}
                        alt={entry.name}
                        className="w-full h-full object-contain"
                        loading="lazy"
                        referrerPolicy="no-referrer"
                        onError={e => {
                          (e.target as HTMLImageElement).src = FALLBACK_ADULT_LOGO;
                        }}
                      />
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-300 border border-rose-500/30 text-[9px] font-black uppercase">
                        18+ XXX
                      </span>
                      <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                        <Globe className="w-3 h-3" />
                        {entry.country}
                      </span>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-white line-clamp-1">{entry.name}</h3>
                    <p className="text-[10px] font-mono text-slate-500 truncate">{entry.id}</p>
                    {(entry.network || entry.owners.length > 0) && (
                      <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">
                        {entry.network || entry.owners[0]}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80">
                  {entry.streamUrl ? (
                    <button
                      onClick={() => playDirectoryEntry(entry)}
                      className="flex-1 min-h-[44px] py-2 px-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Watch Stream</span>
                    </button>
                  ) : (
                    <span className="flex-1 min-h-[44px] flex items-center justify-center py-2 px-2.5 rounded-xl bg-slate-950 border border-slate-800 text-[10px] text-slate-500 text-center">
                      Metadata Only
                    </span>
                  )}

                  {entry.website && (
                    <a
                      href={entry.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Official Broadcaster Website"
                      className="min-w-[44px] min-h-[44px] p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 flex items-center justify-center"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>

          {filteredDirectory.length > pageLimit && (
            <div className="flex justify-center pt-2">
              <button
                onClick={() => setPageLimit(prev => prev + 48)}
                className="min-h-[44px] px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-rose-400 cursor-pointer"
              >
                Load More 18+ Channels ({filteredDirectory.length - pageLimit} remaining)
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};
