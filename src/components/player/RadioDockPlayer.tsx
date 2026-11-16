import React, { useEffect, useRef, useState } from 'react';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Volume2, 
  VolumeX, 
  Heart, 
  Radio, 
  Moon, 
  X, 
  Maximize2, 
  RotateCcw,
  ShieldCheck,
  Globe,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SleepTimerOption } from '../../types';

export const RadioDockPlayer: React.FC = () => {
  const { 
    activeRadio, 
    isRadioPlaying, 
    toggleRadioPlay, 
    closeRadioPlayer, 
    radioVolume, 
    setRadioVolume, 
    isRadioMuted, 
    toggleRadioMute, 
    playNextRadio, 
    playPrevRadio,
    toggleFavorite,
    isFavorite,
    sleepTimer,
    setSleepTimer
  } = useApp();

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isBuffering, setIsBuffering] = useState(false);
  const [streamError, setStreamError] = useState(false);
  const [showSleepMenu, setShowSleepMenu] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  // Sync Audio src & play/pause
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !activeRadio) return;

    setStreamError(false);
    setIsBuffering(true);

    audio.src = activeRadio.streamUrl;
    audio.load();

    if (isRadioPlaying) {
      audio.play().catch(() => {
        // Autoplay may need user gesture
      });
    }
  }, [activeRadio]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isRadioPlaying) {
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  }, [isRadioPlaying]);

  // Cleanup audio element on unmount
  useEffect(() => {
    return () => {
      const audio = audioRef.current;
      if (audio) {
        try {
          audio.pause();
          audio.removeAttribute('src');
          audio.load();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  // Volume sync
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = radioVolume;
    audio.muted = isRadioMuted;
  }, [radioVolume, isRadioMuted]);

  // Event handlers + network stall recovery
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    let stallTimer: ReturnType<typeof setTimeout> | null = null;

    const onWaiting = () => setIsBuffering(true);
    const onStalled = () => {
      setIsBuffering(true);
      if (stallTimer) clearTimeout(stallTimer);
      stallTimer = setTimeout(() => {
        if (activeRadio && isRadioPlaying && navigator.onLine) {
          audio.src = activeRadio.backupUrl || activeRadio.streamUrl;
          audio.load();
          audio.play().catch(() => {});
        }
      }, 6500);
    };
    const onPlaying = () => {
      if (stallTimer) {
        clearTimeout(stallTimer);
        stallTimer = null;
      }
      setIsBuffering(false);
      setStreamError(false);
    };
    const onError = () => {
      setIsBuffering(false);
      // Try backup if available
      if (activeRadio?.backupUrl && audio.src !== activeRadio.backupUrl) {
        audio.src = activeRadio.backupUrl;
        audio.load();
        audio.play().catch(() => setStreamError(true));
      } else {
        setStreamError(true);
      }
    };

    audio.addEventListener('waiting', onWaiting);
    audio.addEventListener('stalled', onStalled);
    audio.addEventListener('playing', onPlaying);
    audio.addEventListener('error', onError);

    return () => {
      if (stallTimer) clearTimeout(stallTimer);
      audio.removeEventListener('waiting', onWaiting);
      audio.removeEventListener('stalled', onStalled);
      audio.removeEventListener('playing', onPlaying);
      audio.removeEventListener('error', onError);
    };
  }, [activeRadio, isRadioPlaying]);

  // Register Android/Chrome Media Session notification & lock-screen controls
  useEffect(() => {
    if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;
    const ms = navigator.mediaSession;

    if (!activeRadio) {
      ms.playbackState = 'none';
      return;
    }

    try {
      if (typeof MediaMetadata !== 'undefined') {
        ms.metadata = new MediaMetadata({
          title: activeRadio.name,
          artist: activeRadio.currentProgram || `${activeRadio.category} · ${activeRadio.language}`,
          album: `${activeRadio.country} · Free TV & Radio Live`,
          artwork: activeRadio.logoUrl
            ? [{ src: activeRadio.logoUrl, sizes: '256x256', type: 'image/png' }]
            : [],
        });
      }
      ms.playbackState = isRadioPlaying ? 'playing' : 'paused';
      ms.setActionHandler('play', () => {
        if (!isRadioPlaying) toggleRadioPlay();
      });
      ms.setActionHandler('pause', () => {
        if (isRadioPlaying) toggleRadioPlay();
      });
      ms.setActionHandler('previoustrack', () => playPrevRadio());
      ms.setActionHandler('nexttrack', () => playNextRadio());
      ms.setActionHandler('stop', () => closeRadioPlayer());
    } catch {
      // MediaSession not supported in some restricted WebViews
    }

    return () => {
      try {
        ms.setActionHandler('play', null);
        ms.setActionHandler('pause', null);
        ms.setActionHandler('previoustrack', null);
        ms.setActionHandler('nexttrack', null);
        ms.setActionHandler('stop', null);
      } catch {
        // ignore
      }
    };
  }, [activeRadio, isRadioPlaying, toggleRadioPlay, playPrevRadio, playNextRadio, closeRadioPlayer]);

  const retryPlayback = () => {
    const audio = audioRef.current;
    if (!audio || !activeRadio) return;
    setStreamError(false);
    setIsBuffering(true);
    audio.src = activeRadio.backupUrl || activeRadio.streamUrl;
    audio.load();
    audio.play().catch(() => setStreamError(true));
  };

  useEffect(() => {
    const onOnline = () => {
      if (activeRadio && streamError && isRadioPlaying) {
        retryPlayback();
      }
    };
    window.addEventListener('online', onOnline);
    return () => window.removeEventListener('online', onOnline);
  }, [activeRadio, streamError, isRadioPlaying]);

  if (!activeRadio) return null;

  const timerOptions: SleepTimerOption[] = [0, 15, 30, 45, 60, 90];

  return (
    <>
      <audio ref={audioRef} preload="auto" playsInline />

      {/* Floating Docked Bar (Full Dock vs Compact Mini-Player) */}
      {isMinimized ? (
        <aside
          aria-label="Compact Mini Radio Player"
          className="fixed bottom-[calc(4.25rem+env(safe-area-inset-bottom))] md:bottom-4 right-2 sm:right-6 z-40 bg-slate-900/95 border border-amber-500/35 rounded-full py-1.5 pl-2 pr-2 shadow-2xl backdrop-blur-xl transition-all duration-300 max-w-[calc(100vw-1rem)]"
        >
          <div className="flex items-center gap-2">
            {/* Compact Artwork */}
            <div
              onClick={() => setIsExpanded(true)}
              title="Open Radio Details"
              className="relative w-8 h-8 rounded-full bg-slate-800 border border-slate-700 overflow-hidden shrink-0 cursor-pointer"
            >
              {activeRadio.logoUrl ? (
                <img
                  src={activeRadio.logoUrl}
                  alt={activeRadio.name}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-amber-500/10 text-amber-400">
                  <Radio className="w-4 h-4" />
                </div>
              )}
              {isBuffering && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <div className="w-3 h-3 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>

            {/* Compact Station Label */}
            <button
              type="button"
              onClick={() => setIsMinimized(false)}
              title="Restore full radio dock"
              className="flex items-center gap-1.5 min-w-0 max-w-[130px] sm:max-w-[170px] text-left cursor-pointer"
            >
              {isRadioPlaying && !isBuffering && !streamError && (
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse shrink-0" />
              )}
              <span className="text-xs font-bold text-white truncate hover:text-amber-400 transition-colors">
                {activeRadio.name}
              </span>
            </button>

            {/* Play / Pause or Retry */}
            {streamError ? (
              <button
                onClick={retryPlayback}
                title="Retry stream"
                aria-label="Retry stream"
                className="w-7 h-7 rounded-full bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 flex items-center justify-center transition-colors cursor-pointer shrink-0"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={toggleRadioPlay}
                title={isRadioPlaying ? 'Pause' : 'Play'}
                aria-label={isRadioPlaying ? 'Pause radio' : 'Play radio'}
                className="w-7 h-7 rounded-full bg-amber-500 hover:bg-amber-400 text-black flex items-center justify-center transition-transform active:scale-95 shadow-md shadow-amber-500/20 cursor-pointer shrink-0"
              >
                {isRadioPlaying ? (
                  <Pause className="w-3.5 h-3.5 fill-black" />
                ) : (
                  <Play className="w-3.5 h-3.5 fill-black ml-0.5" />
                )}
              </button>
            )}

            {/* Expand back to Dock View */}
            <button
              onClick={() => setIsMinimized(false)}
              title="Expand to dock player"
              aria-label="Expand to dock player"
              className="p-1 rounded-full text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
            >
              <ChevronUp className="w-4 h-4" />
            </button>

            {/* Close */}
            <button
              onClick={closeRadioPlayer}
              title="Close Radio"
              aria-label="Close radio player"
              className="p-1 rounded-full text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </aside>
      ) : (
        <aside aria-label="Live Radio Player" className="fixed bottom-[calc(4.25rem+env(safe-area-inset-bottom))] md:bottom-4 left-2 right-2 md:left-6 md:right-6 lg:left-auto lg:right-8 lg:w-[500px] z-40 bg-slate-900/95 dark:bg-slate-900/95 border border-amber-500/30 rounded-2xl p-2 sm:p-3 shadow-2xl backdrop-blur-xl transition-all duration-300">
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Station Artwork with Pulsing Equalizer Badge */}
            <div 
              onClick={() => setIsExpanded(true)}
              className="relative w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 overflow-hidden shrink-0 cursor-pointer group"
            >
              {activeRadio.logoUrl ? (
                <img 
                  src={activeRadio.logoUrl} 
                  alt={activeRadio.name} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform" 
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-amber-500/10 text-amber-400">
                  <Radio className="w-6 h-6" />
                </div>
              )}
              {/* Animated Equalizer Waves */}
              {isRadioPlaying && !isBuffering && (
                <div className="absolute inset-0 bg-black/40 flex items-end justify-center gap-0.5 pb-1">
                  <span className="w-1 bg-amber-400 rounded-full animate-pulse h-3" />
                  <span className="w-1 bg-amber-400 rounded-full animate-bounce h-5" style={{ animationDelay: '150ms' }} />
                  <span className="w-1 bg-amber-400 rounded-full animate-pulse h-2" style={{ animationDelay: '300ms' }} />
                  <span className="w-1 bg-amber-400 rounded-full animate-bounce h-4" style={{ animationDelay: '450ms' }} />
                </div>
              )}
              {isBuffering && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>

            {/* Station Info */}
            <div 
              onClick={() => setIsExpanded(true)}
              className="min-w-0 flex-1 cursor-pointer"
            >
              <div className="flex items-center gap-1.5">
                <span className="text-xs sm:text-sm font-bold text-white truncate hover:text-amber-400 transition-colors">
                  {activeRadio.name}
                </span>
                <span className="px-1.5 py-0.2 bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[9px] font-semibold rounded">
                  FM
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate">
                {streamError ? (
                  <span className="text-rose-400 flex items-center gap-1">
                    Stream interrupted · Click retry
                  </span>
                ) : (
                  activeRadio.currentProgram || `${activeRadio.language} · ${activeRadio.category}`
                )}
              </p>
            </div>

            {/* Quick Play Controls */}
            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              {streamError ? (
                <button
                  onClick={retryPlayback}
                  title="Retry stream"
                  aria-label="Retry radio stream"
                  className="min-w-[44px] min-h-[44px] sm:px-3 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs flex items-center justify-center gap-1 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span className="hidden sm:inline">Retry</span>
                </button>
              ) : (
                <>
                  <button
                    onClick={playPrevRadio}
                    title="Previous station"
                    aria-label="Previous radio station"
                    className="hidden sm:flex min-w-[40px] min-h-[40px] rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 items-center justify-center transition-colors cursor-pointer"
                  >
                    <SkipBack className="w-4 h-4" />
                  </button>
                  <button
                    onClick={toggleRadioPlay}
                    title={isRadioPlaying ? 'Pause' : 'Play'}
                    aria-label={isRadioPlaying ? 'Pause radio' : 'Play radio'}
                    className="w-11 h-11 rounded-full bg-amber-500 hover:bg-amber-400 text-black flex items-center justify-center transition-transform active:scale-95 shadow-md shadow-amber-500/20 cursor-pointer"
                  >
                    {isRadioPlaying ? <Pause className="w-4 h-4 fill-black" /> : <Play className="w-4 h-4 fill-black ml-0.5" />}
                  </button>
                  <button
                    onClick={playNextRadio}
                    title="Next station"
                    aria-label="Next radio station"
                    className="hidden sm:flex min-w-[40px] min-h-[40px] rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 items-center justify-center transition-colors cursor-pointer"
                  >
                    <SkipForward className="w-4 h-4" />
                  </button>
                </>
              )}

              {/* Favorite button */}
              <button
                onClick={() => toggleFavorite(activeRadio.id)}
                title={isFavorite(activeRadio.id) ? 'Remove Favorite' : 'Add to Favorites'}
                aria-label={isFavorite(activeRadio.id) ? 'Remove Favorite' : 'Add to Favorites'}
                className="min-w-[40px] min-h-[40px] rounded-lg text-slate-400 hover:text-red-400 flex items-center justify-center transition-colors cursor-pointer"
              >
                <Heart className={`w-4 h-4 ${isFavorite(activeRadio.id) ? 'fill-red-500 text-red-500' : ''}`} />
              </button>

              {/* Collapse to Mini-Player */}
              <button
                onClick={() => setIsMinimized(true)}
                title="Collapse to mini-player"
                aria-label="Collapse to mini-player"
                className="min-w-[40px] min-h-[40px] rounded-lg text-slate-400 hover:text-amber-400 hover:bg-slate-800 flex items-center justify-center transition-colors cursor-pointer"
              >
                <ChevronDown className="w-4 h-4" />
              </button>

              {/* Expand / Close */}
              <button
                onClick={() => setIsExpanded(true)}
                title="Expand Details"
                aria-label="Expand Radio Details"
                className="hidden sm:flex min-w-[40px] min-h-[40px] rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 items-center justify-center transition-colors cursor-pointer"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
              <button
                onClick={closeRadioPlayer}
                title="Close Radio"
                aria-label="Close Radio"
                className="min-w-[40px] min-h-[40px] rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </aside>
      )}

      {/* Expanded Radio Sheet Modal */}
      {isExpanded && (
        <div 
          role="dialog"
          aria-modal="true"
          aria-labelledby="expanded-radio-title"
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in"
        >
          <div className="w-full sm:max-w-md bg-slate-900 border border-slate-800 sm:rounded-3xl rounded-t-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90dvh] pb-[env(safe-area-inset-bottom)]">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-amber-400" />
                <span id="expanded-radio-title" className="text-xs font-bold tracking-wider text-slate-300 uppercase">Live Radio Broadcast</span>
              </div>
              <button 
                onClick={() => setIsExpanded(false)}
                aria-label="Close radio sheet"
                className="min-w-[44px] min-h-[44px] rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 sm:p-6 flex flex-col items-center text-center overflow-y-auto">
              <div className="relative w-36 h-36 sm:w-48 sm:h-48 rounded-2xl overflow-hidden bg-slate-800 shadow-xl border border-slate-700 mb-5 group shrink-0">
                {activeRadio.logoUrl ? (
                  <img src={activeRadio.logoUrl} alt={activeRadio.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-amber-500/10 text-amber-400">
                    <Radio className="w-16 h-16" />
                  </div>
                )}
                {isRadioPlaying && (
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                    <div className="flex items-end gap-1.5 h-12">
                      <span className="w-2 bg-amber-400 rounded-full animate-bounce h-8" />
                      <span className="w-2 bg-amber-400 rounded-full animate-pulse h-12" />
                      <span className="w-2 bg-amber-400 rounded-full animate-bounce h-6" style={{ animationDelay: '200ms' }} />
                      <span className="w-2 bg-amber-400 rounded-full animate-pulse h-10" style={{ animationDelay: '400ms' }} />
                    </div>
                  </div>
                )}
              </div>

              <h2 className="text-xl font-bold text-white mb-1">{activeRadio.name}</h2>
              <p className="text-sm text-amber-400 font-medium mb-2">{activeRadio.currentProgram || '24x7 Continuous Broadcast'}</p>
              
              <div className="flex items-center gap-2 text-xs text-slate-400 mb-4">
                <span>{activeRadio.category}</span>
                <span>·</span>
                <span>{activeRadio.language}</span>
                <span>·</span>
                <span className="flex items-center gap-1">
                  <Globe className="w-3 h-3" />
                  {activeRadio.country}
                </span>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed max-w-sm mb-6">
                {activeRadio.description}
              </p>

              {/* Volume Slider */}
              <div className="w-full max-w-xs flex items-center gap-3 mb-6">
                <button onClick={toggleRadioMute} className="text-slate-400 hover:text-white transition-colors">
                  {isRadioMuted || radioVolume === 0 ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={isRadioMuted ? 0 : radioVolume}
                  onChange={e => {
                    setRadioVolume(parseFloat(e.target.value));
                    if (isRadioMuted) toggleRadioMute();
                  }}
                  className="w-full h-1.5 bg-slate-700 accent-amber-500 rounded-lg cursor-pointer"
                />
                <span className="text-xs text-slate-400 tabular-nums w-8">
                  {Math.round((isRadioMuted ? 0 : radioVolume) * 100)}%
                </span>
              </div>

              {/* Playback Transport Buttons */}
              <div className="flex items-center gap-6 mb-6">
                <button
                  onClick={playPrevRadio}
                  className="w-12 h-12 rounded-full bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center transition-transform active:scale-95 cursor-pointer"
                >
                  <SkipBack className="w-5 h-5" />
                </button>
                <button
                  onClick={toggleRadioPlay}
                  className="w-16 h-16 rounded-full bg-amber-500 hover:bg-amber-400 text-black flex items-center justify-center transition-transform active:scale-95 shadow-xl shadow-amber-500/25 cursor-pointer"
                >
                  {isRadioPlaying ? <Pause className="w-7 h-7 fill-black" /> : <Play className="w-7 h-7 fill-black ml-1" />}
                </button>
                <button
                  onClick={playNextRadio}
                  className="w-12 h-12 rounded-full bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center transition-transform active:scale-95 cursor-pointer"
                >
                  <SkipForward className="w-5 h-5" />
                </button>
              </div>

              {/* Footer Tools: Sleep Timer & Verification */}
              <div className="w-full flex items-center justify-between pt-4 border-t border-slate-800 text-xs">
                {/* Sleep Timer */}
                <div className="relative">
                  <button
                    onClick={() => setShowSleepMenu(prev => !prev)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                  >
                    <Moon className="w-3.5 h-3.5 text-amber-400" />
                    <span>{sleepTimer > 0 ? `Sleep: ${sleepTimer}m` : 'Sleep Timer'}</span>
                  </button>

                  {showSleepMenu && (
                    <div className="absolute bottom-10 left-0 bg-slate-800 border border-slate-700 rounded-xl p-1 shadow-xl z-20 w-32">
                      {timerOptions.map(min => (
                        <button
                          key={min}
                          onClick={() => {
                            setSleepTimer(min);
                            setShowSleepMenu(false);
                          }}
                          className={`w-full text-left px-3 py-1.5 text-xs rounded-md transition-colors ${
                            sleepTimer === min ? 'bg-amber-500 text-black font-semibold' : 'text-slate-300 hover:bg-slate-700'
                          }`}
                        >
                          {min === 0 ? 'Off' : `${min} Minutes`}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Legal Badge */}
                <div className="flex items-center gap-1.5 text-emerald-400">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Free-to-Air Public Stream</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
