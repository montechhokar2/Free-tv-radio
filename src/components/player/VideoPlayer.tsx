import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import Hls from 'hls.js';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize, 
  Minimize, 
  PictureInPicture2, 
  RotateCcw, 
  ChevronLeft, 
  ChevronRight, 
  X, 
  Tv, 
  Sliders, 
  Heart,
  Share2,
  AlertCircle,
  ExternalLink,
  List,
  Sun,
  Maximize2,
  Smartphone
} from 'lucide-react';
import { Channel } from '../../types';
import { useApp } from '../../context/AppContext';
import {
  findEpgProgramsForChannel,
  getCurrentAndUpcoming,
  formatEpgTime
} from '../../services/epgService';
import { getDeviceRuntimeProfile } from '../../services/devicePerformance';
import {
  hasMedia3Plugin,
  launchMedia3ExoPlayer,
  openStreamInVlc
} from '../../services/androidPlayerBridge';

interface VideoPlayerProps {
  channel: Channel;
  onClose: () => void;
}

const BRIGHTNESS_LEVELS = [
  { value: 50, label: '50%', className: 'brightness-50' },
  { value: 75, label: '75%', className: 'brightness-75' },
  { value: 90, label: '90%', className: 'brightness-90' },
  { value: 100, label: '100%', className: 'brightness-100' },
  { value: 110, label: '110%', className: 'brightness-110' },
  { value: 125, label: '125%', className: 'brightness-125' },
] as const;

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ channel, onClose }) => {
  const {
    playNextTV,
    playPrevTV,
    toggleFavorite,
    isFavorite,
    channels,
    iptvChannels,
    epgProgramsByChannelId,
    playTVChannel
  } = useApp();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const runtimeProfile = useMemo(() => getDeviceRuntimeProfile(), []);
  const nativeMedia3Available = useMemo(() => hasMedia3Plugin(), []);

  const [isPlaying, setIsPlaying] = useState(true);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [brightnessLevel, setBrightnessLevel] = useState<number>(100);
  const [aspectMode, setAspectMode] = useState<'contain' | 'cover'>('contain');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPiPActive, setIsPiPActive] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [qualityLevels, setQualityLevels] = useState<{ id: number; name: string }[]>([]);
  const [currentQuality, setCurrentQuality] = useState<number>(-1); // -1 = Auto
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [showBrightnessMenu, setShowBrightnessMenu] = useState(false);
  const [showChannelDrawer, setShowChannelDrawer] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isBuffering, setIsBuffering] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showUnmuteToast, setShowUnmuteToast] = useState(false);

  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stallTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const networkRetryRef = useRef<number>(0);
  const lastTouchShowRef = useRef<number>(0);

  const scheduleHideControls = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 3500);
  }, [isPlaying]);

  // Auto-hide controls after inactivity
  const handleMouseMove = () => {
    scheduleHideControls();
  };

  const handleTouchStart = () => {
    if (!showControls) {
      lastTouchShowRef.current = Date.now();
    }
    scheduleHideControls();
  };

  // Helper to extract or construct clean YouTube embed URL
  const getEmbedUrl = (url: string) => {
    try {
      if (url.includes('/embed/')) {
        return url.includes('?') ? `${url}&autoplay=1` : `${url}?autoplay=1`;
      }
      if (url.includes('youtube.com/watch')) {
        const urlObj = new URL(url);
        const v = urlObj.searchParams.get('v');
        if (v) return `https://www.youtube-nocookie.com/embed/${v}?autoplay=1&enablejsapi=1&playsinline=1`;
      }
      if (url.includes('youtu.be/')) {
        const id = url.split('youtu.be/')[1]?.split('?')[0];
        if (id) return `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&enablejsapi=1&playsinline=1`;
      }
      if (url.includes('youtube.com/live/')) {
        const id = url.split('youtube.com/live/')[1]?.split('?')[0];
        if (id) return `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&enablejsapi=1&playsinline=1`;
      }
    } catch {
      // fallback to original
    }
    return url;
  };

  const isYouTube = channel.streamFormat === 'youtube' || 
    channel.streamUrl.includes('youtube.com') || 
    channel.streamUrl.includes('youtu.be');

  // Guaranteed smooth autoplay with fallback for browser audio policy
  const playVideoWithFallback = useCallback((video: HTMLVideoElement) => {
    video.play()
      .then(() => {
        setIsPlaying(true);
        setIsBuffering(false);
      })
      .catch(() => {
        // Browser prevented unmuted autoplay: fallback to muted playback for zero-stall start
        if (!video.muted) {
          video.muted = true;
          setIsMuted(true);
          video.play()
            .then(() => {
              setIsPlaying(true);
              setIsBuffering(false);
              setShowUnmuteToast(true);
            })
            .catch(() => {
              setIsPlaying(false);
              setIsBuffering(false);
            });
        } else {
          setIsPlaying(false);
          setIsBuffering(false);
        }
      });
  }, []);

  // Load and initialize stream with tablet RAM-aware smooth buffering
  const setupStream = useCallback((streamToPlay: string) => {
    if (isYouTube) {
      setIsBuffering(false);
      setHasError(false);
      return;
    }

    const video = videoRef.current;
    if (!video) return;

    setHasError(false);
    setErrorMessage('');
    setIsBuffering(true);

    // Destroy existing Hls instance
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    const isHlsUrl = streamToPlay.includes('.m3u8') || channel.streamFormat === 'hls';

    if (isHlsUrl && Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false,
        backBufferLength: runtimeProfile.isLowMemory ? 30 : 90,
        maxBufferLength: runtimeProfile.hlsMaxBufferLength,
        maxMaxBufferLength: runtimeProfile.hlsMaxMaxBufferLength,
        maxBufferSize: runtimeProfile.hlsMaxBufferSize,
        liveSyncDurationCount: 3,
        liveMaxLatencyDurationCount: 10,
        fragLoadingTimeOut: 20000,
        manifestLoadingTimeOut: 15000,
        levelLoadingTimeOut: 15000,
        fragLoadingMaxRetry: 4,
        manifestLoadingMaxRetry: 4,
        levelLoadingMaxRetry: 4,
      });

      hlsRef.current = hls;
      hls.loadSource(streamToPlay);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
        setIsBuffering(false);
        const levels = data.levels.map((lvl, index) => ({
          id: index,
          name: `${lvl.height ? lvl.height + 'p' : 'Level ' + index} (${Math.round(lvl.bitrate / 1000)}k)`,
        }));
        setQualityLevels(levels);
        playVideoWithFallback(video);
      });

      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              if (networkRetryRef.current < 2) {
                networkRetryRef.current += 1;
                setIsBuffering(true);
                setTimeout(() => {
                  hlsRef.current?.startLoad();
                }, 1000 * networkRetryRef.current);
                return;
              }
              if (channel.backupUrl && streamToPlay !== channel.backupUrl) {
                networkRetryRef.current = 0;
                hls.destroy();
                setupStream(channel.backupUrl);
                return;
              }
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls.recoverMediaError();
              break;
            default:
              if (channel.backupUrl && streamToPlay !== channel.backupUrl) {
                hls.destroy();
                setupStream(channel.backupUrl);
              } else {
                hls.destroy();
                setHasError(true);
                setErrorMessage('Live broadcast is temporarily unavailable from upstream server.');
              }
              break;
          }
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = streamToPlay;
      video.addEventListener('loadedmetadata', () => {
        setIsBuffering(false);
        playVideoWithFallback(video);
      }, { once: true });
      video.addEventListener('error', () => {
        if (channel.backupUrl && streamToPlay !== channel.backupUrl) {
          setupStream(channel.backupUrl);
        } else {
          setHasError(true);
          setErrorMessage('Unable to load direct broadcast stream.');
        }
      }, { once: true });
    } else {
      video.src = streamToPlay;
      video.load();
      playVideoWithFallback(video);
    }
  }, [channel, isYouTube, playVideoWithFallback, runtimeProfile]);

  useEffect(() => {
    networkRetryRef.current = 0;
    const videoEl = videoRef.current;
    setupStream(channel.streamUrl);

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      if (videoEl) {
        try {
          videoEl.pause();
          videoEl.removeAttribute('src');
          videoEl.load();
        } catch {
          // ignore cleanup failure
        }
      }
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
      if (stallTimeoutRef.current) {
        clearTimeout(stallTimeoutRef.current);
      }
    };
  }, [channel, setupStream]);

  // Automatic stream recovery when device comes back online
  useEffect(() => {
    const handleOnline = () => {
      if (hasError || isBuffering) {
        networkRetryRef.current = 0;
        setupStream(channel.streamUrl);
      }
    };
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [hasError, isBuffering, channel.streamUrl, setupStream]);

  // Keep fullscreen state & Android screen orientation synced
  useEffect(() => {
    const handleFullscreenChange = () => {
      const active = Boolean(document.fullscreenElement);
      setIsFullscreen(active);
      if (!active) {
        try {
          (screen.orientation as { unlock?: () => void } | undefined)?.unlock?.();
        } catch {
          // orientation unlock unsupported
        }
      }
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Video event listeners
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onWaiting = () => {
      setIsBuffering(true);
      if (stallTimeoutRef.current) clearTimeout(stallTimeoutRef.current);
      stallTimeoutRef.current = setTimeout(() => {
        // Automatically attempt buffer recovery if stalled for over 6 seconds
        if (hlsRef.current) {
          hlsRef.current.recoverMediaError();
        } else if (channel.backupUrl) {
          setupStream(channel.backupUrl);
        }
      }, 6000);
    };
    const onPlaying = () => {
      setIsBuffering(false);
      if (stallTimeoutRef.current) {
        clearTimeout(stallTimeoutRef.current);
        stallTimeoutRef.current = null;
      }
    };
    const onError = () => {
      setIsBuffering(false);
      if (channel.backupUrl) {
        setupStream(channel.backupUrl);
      } else {
        setHasError(true);
        setErrorMessage('Broadcast feed disconnected. Please retry or pick another channel.');
      }
    };

    video.addEventListener('play', onPlay);
    video.addEventListener('pause', onPause);
    video.addEventListener('waiting', onWaiting);
    video.addEventListener('playing', onPlaying);
    video.addEventListener('error', onError);

    return () => {
      if (stallTimeoutRef.current) {
        clearTimeout(stallTimeoutRef.current);
      }
      video.removeEventListener('play', onPlay);
      video.removeEventListener('pause', onPause);
      video.removeEventListener('waiting', onWaiting);
      video.removeEventListener('playing', onPlaying);
      video.removeEventListener('error', onError);
    };
  }, [channel, setupStream]);

  // Sync volume
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = volume;
      videoRef.current.muted = isMuted;
    }
  }, [volume, isMuted]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play();
    } else {
      video.pause();
    }
    scheduleHideControls();
  };

  const handleVideoSurfaceClick = () => {
    // On touch devices, first tap reveals controls without immediately pausing
    if (Date.now() - lastTouchShowRef.current < 350) {
      return;
    }
    togglePlay();
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current
        .requestFullscreen()
        .then(() => {
          setIsFullscreen(true);
          try {
            const orientation = screen.orientation as { lock?: (mode: string) => Promise<void> } | undefined;
            orientation?.lock?.('landscape')?.catch(() => {});
          } catch {
            // orientation lock unsupported
          }
        })
        .catch(() => {});
    } else {
      document
        .exitFullscreen()
        .then(() => {
          setIsFullscreen(false);
          try {
            (screen.orientation as { unlock?: () => void } | undefined)?.unlock?.();
          } catch {
            // ignore
          }
        })
        .catch(() => {});
    }
  };

  const togglePiP = async () => {
    if (!videoRef.current) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
        setIsPiPActive(false);
      } else if (document.pictureInPictureEnabled) {
        await videoRef.current.requestPictureInPicture();
        setIsPiPActive(true);
      }
    } catch {
      // PiP not supported or disallowed
    }
  };

  const setQuality = (lvlIndex: number) => {
    if (hlsRef.current) {
      hlsRef.current.currentLevel = lvlIndex;
      setCurrentQuality(lvlIndex);
    }
    setShowQualityMenu(false);
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const handleOpenVlc = () => {
    if (videoRef.current && !videoRef.current.paused) {
      videoRef.current.pause();
    }
    void openStreamInVlc(channel.streamUrl, channel.name || 'Live Stream');
  };

  const handleLaunchMedia3 = () => {
    if (videoRef.current && !videoRef.current.paused) {
      videoRef.current.pause();
    }
    const subtitle = epgSummary.currentProgram?.title || `${channel.category} · ${channel.language}`;
    void launchMedia3ExoPlayer({
      url: channel.streamUrl,
      title: channel.name || 'Live Broadcast',
      subtitle,
    });
  };

  const activeBrightnessClass =
    BRIGHTNESS_LEVELS.find(item => item.value === brightnessLevel)?.className || 'brightness-100';

  const isIptvChannel = iptvChannels.some(c => c.id === channel.id);
  const otherTVChannels = isIptvChannel
    ? iptvChannels
        .filter(c => c.id !== channel.id && (!channel.groupTitle || c.groupTitle === channel.groupTitle))
        .slice(0, 40)
    : channels.filter(c => c.type === 'tv' && c.id !== channel.id);

  const epgPrograms = findEpgProgramsForChannel(channel, epgProgramsByChannelId);
  const epgSummary = getCurrentAndUpcoming(epgPrograms);

  return (
    <div 
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onTouchStart={handleTouchStart}
      className="relative w-full aspect-video bg-black rounded-xl sm:rounded-2xl overflow-hidden shadow-2xl border border-slate-800 group select-none"
    >
      {/* Video or YouTube Iframe */}
      {isYouTube ? (
        <iframe
          src={getEmbedUrl(channel.streamUrl)}
          title={channel.name}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="w-full h-full border-0"
        />
      ) : (
        <video
          ref={videoRef}
          playsInline
          autoPlay
          className={`w-full h-full cursor-pointer transition-[filter] duration-150 ${
            aspectMode === 'cover' ? 'object-cover' : 'object-contain'
          } ${activeBrightnessClass}`}
          onClick={handleVideoSurfaceClick}
        />
      )}

      {/* Buffering Spinner */}
      {isBuffering && !hasError && !isYouTube && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px] pointer-events-none z-10 p-3">
          <div className="flex flex-col items-center gap-2 sm:gap-3 text-center">
            <div className="w-9 h-9 sm:w-12 sm:h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-[11px] sm:text-xs font-medium text-slate-200 tracking-wider">CONNECTING LIVE BROADCAST...</span>
          </div>
        </div>
      )}

      {/* Error Fallback Overlay */}
      {hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/92 text-center p-4 sm:p-6 z-20 overflow-y-auto">
          <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-2 sm:mb-3 text-rose-400 shrink-0">
            <AlertCircle className="w-5 h-5 sm:w-7 sm:h-7" />
          </div>
          <h3 className="text-sm sm:text-lg font-semibold text-white mb-1">Live Stream Unavailable</h3>
          <p className="text-xs sm:text-sm text-slate-400 max-w-md mb-3 sm:mb-5 leading-relaxed">{errorMessage}</p>
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
            <button
              onClick={() => setupStream(channel.backupUrl || channel.streamUrl)}
              className="min-h-[44px] px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black text-xs font-semibold rounded-xl flex items-center gap-2 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Retry Stream
            </button>
            {channel.backupUrl && (
              <button
                onClick={() => setupStream(channel.backupUrl!)}
                className="min-h-[44px] px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium rounded-xl transition-colors cursor-pointer"
              >
                Try Backup Feed
              </button>
            )}
            {nativeMedia3Available && (
              <button
                onClick={handleLaunchMedia3}
                className="min-h-[44px] px-4 py-2 bg-emerald-500/20 border border-emerald-500/40 hover:bg-emerald-500/30 text-emerald-300 text-xs font-semibold rounded-xl flex items-center gap-2 transition-colors cursor-pointer"
              >
                <Smartphone className="w-3.5 h-3.5" />
                Play in Media3
              </button>
            )}
            <button
              onClick={handleOpenVlc}
              className="min-h-[44px] px-4 py-2 bg-orange-500/15 border border-orange-500/40 hover:bg-orange-500/25 text-orange-300 text-xs font-semibold rounded-xl flex items-center gap-2 transition-colors cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Open in VLC
            </button>
            <a
              href={channel.streamUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="min-h-[44px] px-4 py-2 bg-slate-900 border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-medium rounded-xl flex items-center gap-2 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Direct Feed
            </a>
          </div>
        </div>
      )}

      {/* Top Header Overlay */}
      <div 
        className={`absolute top-0 left-0 right-0 p-2 sm:p-4 bg-gradient-to-b from-black/85 via-black/45 to-transparent transition-opacity duration-300 z-10 flex items-center justify-between gap-2 ${
          showControls || isYouTube ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg overflow-hidden bg-slate-800 shrink-0 border border-slate-700 flex items-center justify-center">
            {channel.logoUrl ? (
              <img 
                src={channel.logoUrl} 
                alt={channel.name} 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            ) : (
              <Tv className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="text-white font-bold text-xs sm:text-base truncate">{channel.name}</span>
              <span className="px-1.5 py-0.5 bg-red-600 text-white text-[9px] sm:text-[10px] font-black tracking-widest uppercase rounded shrink-0">
                LIVE
              </span>
              <span className="hidden md:inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-[9px] font-bold shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Smooth Play</span>
              </span>
              {isYouTube && (
                <span className="hidden sm:inline-block px-1.5 py-0.5 bg-red-600/30 border border-red-500/40 text-red-300 text-[10px] font-semibold tracking-wide rounded shrink-0">
                  YouTube
                </span>
              )}
            </div>
            <p className="hidden sm:block text-xs text-slate-300 truncate max-w-xs md:max-w-md">
              {epgSummary.currentProgram
                ? `Now (${formatEpgTime(epgSummary.currentProgram.startMs)}): ${epgSummary.currentProgram.title}${
                    epgSummary.nextProgram ? ` · Next: ${epgSummary.nextProgram.title}` : ''
                  }`
                : `${channel.currentProgram || channel.category} · ${channel.language}`}
            </p>
          </div>
        </div>

        {/* Top actions */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* Quick Channel Drawer inside top bar */}
          <button
            onClick={() => setShowChannelDrawer(prev => !prev)}
            title="Channel Guide"
            aria-label="Channel Guide"
            className={`min-w-[40px] min-h-[40px] sm:min-w-[44px] sm:min-h-[44px] px-2 sm:px-3 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-white/10 ${
              showChannelDrawer ? 'bg-amber-500 text-black font-semibold' : 'bg-black/45 hover:bg-black/65 text-white'
            }`}
          >
            <List className="w-4 h-4" />
            <span className="hidden sm:inline">Guide</span>
          </button>

          {/* Native AndroidX Media3 Player (when inside APK) */}
          {!isYouTube && nativeMedia3Available && (
            <button
              onClick={handleLaunchMedia3}
              title="Open in AndroidX Media3 Player"
              aria-label="Open in AndroidX Media3 Player"
              className="min-w-[40px] min-h-[40px] sm:min-h-[44px] px-2 sm:px-2.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/35 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Smartphone className="w-4 h-4" />
              <span className="hidden md:inline">Media3 HD</span>
            </button>
          )}

          {/* Open in VLC Android / External Player */}
          {!isYouTube && (
            <button
              onClick={handleOpenVlc}
              title="Open Stream in VLC"
              aria-label="Open Stream in VLC"
              className="min-w-[40px] min-h-[40px] sm:min-h-[44px] px-2 sm:px-2.5 rounded-lg bg-orange-500/20 hover:bg-orange-500/35 border border-orange-500/40 text-orange-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <ExternalLink className="w-4 h-4" />
              <span className="hidden md:inline">VLC</span>
            </button>
          )}

          {isYouTube && (
            <a
              href={channel.streamUrl}
              target="_blank"
              rel="noreferrer noopener"
              title="Open stream in YouTube"
              aria-label="Open stream in YouTube"
              className="min-w-[40px] min-h-[40px] sm:min-w-[44px] sm:min-h-[44px] rounded-lg bg-black/45 hover:bg-black/65 border border-white/10 text-white flex items-center justify-center transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          )}

          <button
            onClick={() => toggleFavorite(channel.id)}
            title={isFavorite(channel.id) ? 'Remove Favorite' : 'Add to Favorites'}
            aria-label={isFavorite(channel.id) ? 'Remove Favorite' : 'Add to Favorites'}
            className="min-w-[40px] min-h-[40px] sm:min-w-[44px] sm:min-h-[44px] rounded-lg bg-black/45 hover:bg-black/65 border border-white/10 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <Heart className={`w-4 h-4 ${isFavorite(channel.id) ? 'fill-red-500 text-red-500' : ''}`} />
          </button>
          <button
            onClick={handleShare}
            title="Share Channel"
            aria-label="Share Channel"
            className="hidden sm:flex min-w-[44px] min-h-[44px] rounded-lg bg-black/45 hover:bg-black/65 border border-white/10 text-white items-center justify-center transition-colors cursor-pointer"
          >
            <Share2 className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            title="Close Player"
            aria-label="Close Player"
            className="min-w-[40px] min-h-[40px] sm:min-w-[44px] sm:min-h-[44px] rounded-lg bg-black/45 hover:bg-rose-600/80 border border-white/10 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Share Toast */}
      {copiedLink && (
        <div className="absolute top-14 sm:top-16 right-3 sm:right-4 px-3 py-1.5 bg-amber-500 text-black text-xs font-semibold rounded shadow-lg z-30 animate-fade-in">
          Channel link copied!
        </div>
      )}

      {/* Autoplay Unmute Notification */}
      {showUnmuteToast && (
        <button
          onClick={() => {
            if (videoRef.current) {
              videoRef.current.muted = false;
              setIsMuted(false);
              setVolume(1);
            }
            setShowUnmuteToast(false);
          }}
          className="absolute top-14 sm:top-16 left-3 sm:left-4 min-h-[40px] px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-lg shadow-xl z-30 flex items-center gap-2 animate-bounce cursor-pointer"
        >
          <Volume2 className="w-3.5 h-3.5 fill-slate-950" />
          <span>Tap to Unmute Audio</span>
        </button>
      )}

      {/* Bottom Controls Bar (for native HLS / MP4 streams) */}
      {!isYouTube && (
        <div 
          className={`absolute bottom-0 left-0 right-0 p-2 sm:p-4 bg-gradient-to-t from-black/95 via-black/60 to-transparent transition-opacity duration-300 z-10 flex flex-col gap-2 ${
            showControls ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            {/* Left Controls: Prev, Play/Pause, Next, Volume */}
            <div className="flex items-center gap-1 sm:gap-2.5 min-w-0">
              <button
                onClick={playPrevTV}
                title="Previous Channel"
                aria-label="Previous Channel"
                className="min-w-[40px] min-h-[40px] sm:min-w-[44px] sm:min-h-[44px] rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-transform active:scale-95 cursor-pointer"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={togglePlay}
                title={isPlaying ? 'Pause' : 'Play'}
                aria-label={isPlaying ? 'Pause video' : 'Play video'}
                className="w-11 h-11 rounded-full bg-amber-500 hover:bg-amber-400 text-black flex items-center justify-center transition-transform active:scale-95 shadow-md shadow-amber-500/20 cursor-pointer shrink-0"
              >
                {isPlaying ? <Pause className="w-5 h-5 fill-black" /> : <Play className="w-5 h-5 fill-black ml-0.5" />}
              </button>
              <button
                onClick={playNextTV}
                title="Next Channel"
                aria-label="Next Channel"
                className="min-w-[40px] min-h-[40px] sm:min-w-[44px] sm:min-h-[44px] rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-transform active:scale-95 cursor-pointer"
              >
                <ChevronRight className="w-5 h-5" />
              </button>

              {/* Mobile Quick Mute Toggle */}
              <button
                onClick={() => setIsMuted(prev => !prev)}
                title={isMuted || volume === 0 ? 'Unmute' : 'Mute'}
                aria-label={isMuted || volume === 0 ? 'Unmute' : 'Mute'}
                className="sm:hidden min-w-[40px] min-h-[40px] rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                {isMuted || volume === 0 ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
              </button>

              {/* Desktop / Tablet Volume Slider */}
              <div className="hidden sm:flex items-center gap-2 ml-1 group/vol">
                <button
                  onClick={() => setIsMuted(prev => !prev)}
                  aria-label={isMuted || volume === 0 ? 'Unmute' : 'Mute'}
                  className="min-w-[40px] min-h-[40px] flex items-center justify-center text-white hover:text-amber-400 transition-colors cursor-pointer"
                >
                  {isMuted || volume === 0 ? <VolumeX className="w-5 h-5 text-rose-400" /> : <Volume2 className="w-5 h-5" />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  aria-label="Volume"
                  value={isMuted ? 0 : volume}
                  onChange={e => {
                    setVolume(parseFloat(e.target.value));
                    if (isMuted) setIsMuted(false);
                  }}
                  className="w-20 h-1.5 bg-slate-700 accent-amber-500 rounded-lg cursor-pointer"
                />
              </div>
            </div>

            {/* Right Controls: Brightness, Aspect Fit, Channel Drawer, Quality, PiP, Fullscreen */}
            <div className="flex items-center gap-1 sm:gap-1.5 relative shrink-0">
              {/* Screen Brightness Control */}
              <div className="relative">
                <button
                  onClick={() => {
                    setShowBrightnessMenu(prev => !prev);
                    setShowQualityMenu(false);
                  }}
                  title={`Screen Brightness (${brightnessLevel}%)`}
                  aria-label={`Screen Brightness ${brightnessLevel} percent`}
                  className={`min-w-[40px] min-h-[40px] sm:min-h-[44px] px-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1 transition-colors cursor-pointer ${
                    brightnessLevel !== 100
                      ? 'bg-amber-500/20 border border-amber-500/40 text-amber-300'
                      : 'bg-white/10 hover:bg-white/20 text-white'
                  }`}
                >
                  <Sun className="w-4 h-4" />
                  <span className="hidden md:inline tabular-nums">{brightnessLevel}%</span>
                </button>
                {showBrightnessMenu && (
                  <div className="absolute bottom-12 right-0 w-36 bg-slate-900 border border-slate-700 rounded-xl shadow-xl overflow-hidden p-1.5 z-30 space-y-1">
                    <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Brightness
                    </div>
                    {BRIGHTNESS_LEVELS.map(level => (
                      <button
                        key={level.value}
                        onClick={() => {
                          setBrightnessLevel(level.value);
                          setShowBrightnessMenu(false);
                        }}
                        className={`w-full min-h-[36px] text-left px-2.5 py-1 text-xs rounded-md transition-colors cursor-pointer flex items-center justify-between ${
                          brightnessLevel === level.value
                            ? 'bg-amber-500/20 text-amber-400 font-semibold'
                            : 'text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <span>{level.label}</span>
                        {level.value === 100 && <span className="text-[10px] text-slate-400">Default</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Aspect Fit / Zoom Toggle (prevents video stretching) */}
              <button
                onClick={() => setAspectMode(prev => (prev === 'contain' ? 'cover' : 'contain'))}
                title={aspectMode === 'contain' ? '16:9 Fit (Original Aspect)' : 'Fill Screen'}
                aria-label={aspectMode === 'contain' ? 'Switch to Fill aspect' : 'Switch to Original Fit aspect'}
                className={`min-h-[40px] sm:min-h-[44px] px-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1 transition-colors cursor-pointer ${
                  aspectMode === 'cover'
                    ? 'bg-amber-500/20 border border-amber-500/40 text-amber-300'
                    : 'bg-white/10 hover:bg-white/20 text-white'
                }`}
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span className="hidden lg:inline">{aspectMode === 'contain' ? 'Fit' : 'Fill'}</span>
              </button>

              {/* Quick Channel Guide Trigger */}
              <button
                onClick={() => setShowChannelDrawer(prev => !prev)}
                title="Channel Guide"
                aria-label="Channel Guide"
                className={`hidden md:flex min-h-[44px] px-2.5 rounded-lg text-xs font-medium items-center gap-1.5 transition-colors cursor-pointer ${
                  showChannelDrawer ? 'bg-amber-500 text-black font-semibold' : 'bg-white/10 hover:bg-white/20 text-white'
                }`}
              >
                <List className="w-4 h-4" />
                <span>Channels</span>
              </button>

              {/* Quality Selector */}
              {qualityLevels.length > 0 && (
                <div className="relative">
                  <button
                    onClick={() => {
                      setShowQualityMenu(prev => !prev);
                      setShowBrightnessMenu(false);
                    }}
                    title="Stream Quality"
                    aria-label="Stream Quality"
                    className="min-h-[40px] sm:min-h-[44px] px-2 sm:px-2.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span className="hidden xs:inline">{currentQuality === -1 ? 'Auto' : qualityLevels[currentQuality]?.name.split(' ')[0] || 'HD'}</span>
                  </button>
                  {showQualityMenu && (
                    <div className="absolute bottom-12 right-0 w-40 bg-slate-900 border border-slate-700 rounded-xl shadow-xl overflow-hidden p-1 z-30 max-h-48 overflow-y-auto">
                      <button
                        onClick={() => setQuality(-1)}
                        className={`w-full min-h-[40px] text-left px-3 py-1.5 text-xs rounded-md transition-colors cursor-pointer ${
                          currentQuality === -1 ? 'bg-amber-500/20 text-amber-400 font-semibold' : 'text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        Auto (Adaptive)
                      </button>
                      {qualityLevels.map(lvl => (
                        <button
                          key={lvl.id}
                          onClick={() => setQuality(lvl.id)}
                          className={`w-full min-h-[40px] text-left px-3 py-1.5 text-xs rounded-md transition-colors cursor-pointer ${
                            currentQuality === lvl.id ? 'bg-amber-500/20 text-amber-400 font-semibold' : 'text-slate-300 hover:bg-slate-800'
                          }`}
                        >
                          {lvl.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Picture in Picture */}
              <button
                onClick={togglePiP}
                title="Picture in Picture"
                aria-label="Picture in Picture"
                className={`min-w-[40px] min-h-[40px] sm:min-w-[44px] sm:min-h-[44px] rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer ${
                  isPiPActive ? 'text-amber-400 bg-white/20' : ''
                }`}
              >
                <PictureInPicture2 className="w-4 h-4" />
              </button>

              {/* Fullscreen */}
              <button
                onClick={toggleFullscreen}
                title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                aria-label={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                className="min-w-[40px] min-h-[40px] sm:min-w-[44px] sm:min-h-[44px] rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Channel Guide Drawer inside player */}
      {showChannelDrawer && (
        <div className="absolute inset-x-2 top-12 bottom-14 sm:inset-x-auto sm:top-16 sm:right-4 sm:bottom-16 sm:w-72 bg-slate-950/95 border border-slate-800 rounded-xl p-3 z-30 backdrop-blur-md flex flex-col shadow-2xl animate-fade-in">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Quick Channel Guide</span>
            <button 
              onClick={() => setShowChannelDrawer(false)}
              aria-label="Close channel guide"
              className="min-w-[36px] min-h-[36px] flex items-center justify-center text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
            {otherTVChannels.map(ch => (
              <button
                key={ch.id}
                onClick={() => {
                  playTVChannel(ch);
                  setShowChannelDrawer(false);
                }}
                className="w-full min-h-[44px] flex items-center gap-2.5 p-2 rounded-lg hover:bg-slate-800/80 text-left transition-colors cursor-pointer group"
              >
                <div className="w-8 h-8 rounded bg-slate-800 overflow-hidden shrink-0 flex items-center justify-center border border-slate-700">
                  {ch.logoUrl ? (
                    <img src={ch.logoUrl} alt={ch.name} loading="lazy" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <Tv className="w-4 h-4 text-slate-400" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-medium text-white truncate group-hover:text-amber-400">
                    {ch.name}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">
                    {ch.language} · {ch.category}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
