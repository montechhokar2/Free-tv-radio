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
  Globe
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

  // Volume sync
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = radioVolume;
    audio.muted = isRadioMuted;
  }, [radioVolume, isRadioMuted]);

  // Event handlers
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onWaiting = () => setIsBuffering(true);
    const onPlaying = () => {
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
    audio.addEventListener('playing', onPlaying);
    audio.addEventListener('error', onError);

    return () => {
      audio.removeEventListener('waiting', onWaiting);
      audio.removeEventListener('playing', onPlaying);
      audio.removeEventListener('error', onError);
    };
  }, [activeRadio]);

  if (!activeRadio) return null;

  const retryPlayback = () => {
    const audio = audioRef.current;
    if (!audio) return;
    setStreamError(false);
    setIsBuffering(true);
    audio.src = activeRadio.backupUrl || activeRadio.streamUrl;
    audio.load();
    audio.play().catch(() => setStreamError(true));
  };

  const timerOptions: SleepTimerOption[] = [0, 15, 30, 45, 60, 90];

  return (
    <>
      <audio ref={audioRef} preload="auto" playsInline />

      {/* Floating Docked Bar */}
      <aside aria-label="Live Radio Player" className="fixed bottom-16 md:bottom-4 left-2 right-2 md:left-6 md:right-6 lg:left-auto lg:right-8 lg:w-[500px] z-40 bg-slate-900/95 dark:bg-slate-900/95 border border-amber-500/30 rounded-2xl p-2.5 sm:p-3 shadow-2xl backdrop-blur-xl transition-all duration-300">
        <div className="flex items-center gap-3">
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
                className="p-2 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs flex items-center gap-1 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span className="hidden sm:inline">Retry</span>
              </button>
            ) : (
              <>
                <button
                  onClick={playPrevRadio}
                  title="Previous station"
                  className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <SkipBack className="w-4 h-4" />
                </button>
                <button
                  onClick={toggleRadioPlay}
                  title={isRadioPlaying ? 'Pause' : 'Play'}
                  className="w-9 h-9 rounded-full bg-amber-500 hover:bg-amber-400 text-black flex items-center justify-center transition-transform active:scale-95 shadow-md shadow-amber-500/20 cursor-pointer"
                >
                  {isRadioPlaying ? <Pause className="w-4 h-4 fill-black" /> : <Play className="w-4 h-4 fill-black ml-0.5" />}
                </button>
                <button
                  onClick={playNextRadio}
                  title="Next station"
                  className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <SkipForward className="w-4 h-4" />
                </button>
              </>
            )}

            {/* Favorite button */}
            <button
              onClick={() => toggleFavorite(activeRadio.id)}
              title={isFavorite(activeRadio.id) ? 'Remove Favorite' : 'Add to Favorites'}
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 transition-colors cursor-pointer"
            >
              <Heart className={`w-4 h-4 ${isFavorite(activeRadio.id) ? 'fill-red-500 text-red-500' : ''}`} />
            </button>

            {/* Expand / Close */}
            <button
              onClick={() => setIsExpanded(true)}
              title="Expand Details"
              className="hidden sm:block p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
            <button
              onClick={closeRadioPlayer}
              title="Close Radio"
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Expanded Radio Sheet Modal */}
      {isExpanded && (
        <div 
          role="dialog"
          aria-modal="true"
          aria-labelledby="expanded-radio-title"
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in"
        >
          <div className="w-full sm:max-w-md bg-slate-900 border border-slate-800 sm:rounded-3xl rounded-t-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-amber-400" />
                <span id="expanded-radio-title" className="text-xs font-bold tracking-wider text-slate-300 uppercase">Live Radio Broadcast</span>
              </div>
              <button 
                onClick={() => setIsExpanded(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 flex flex-col items-center text-center">
              <div className="relative w-48 h-48 rounded-2xl overflow-hidden bg-slate-800 shadow-xl border border-slate-700 mb-6 group">
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
