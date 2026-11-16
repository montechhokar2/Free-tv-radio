import React, { useState, useMemo } from 'react';
import { 
  Play, 
  Tv, 
  Radio, 
  Sparkles, 
  TrendingUp, 
  ShieldCheck, 
  ChevronRight, 
  History, 
  BookOpen, 
  Layers, 
  Flame, 
  ExternalLink, 
  Music,
  Globe,
  Activity,
  Heart,
  Volume2,
  Compass,
  Trophy,
  Swords,
  Globe2,
  ListVideo,
  CalendarClock
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { CURATED_WEB_DICTIONARY, directoryToChannel } from '../../services/webDirectoryService';
import { OTT_PLATFORMS } from '../../data/ottPlatforms';
import { Channel } from '../../types';
import { WORLD_COUNTRIES } from '../../services/iptvOrgService';
import { RadioPlatformsHub } from '../radio/RadioPlatformsHub';

export const HomeScreen: React.FC = () => {
  const { 
    channels, 
    user, 
    playChannel, 
    playTVChannel,
    playRadioStation,
    setCurrentTab, 
    setSelectedCategory,
    activeTV, 
    activeRadio,
    isRadioPlaying,
    toggleFavorite,
    isFavorite,
    selectedCountryItem,
    setSelectedCountryItem,
    monetization,
    iptvChannels,
    sportsIptvChannels,
    cricketHubData
  } = useApp();

  // Top Featured Broadcasts from the Web TV Dictionary
  const featuredDictionaryStreams = CURATED_WEB_DICTIONARY.slice(0, 6);
  const [featuredIndex, setFeaturedIndex] = useState(0);
  const currentFeatured = featuredDictionaryStreams[featuredIndex] || featuredDictionaryStreams[0];

  // 1. Continue Watching
  const continueWatchingChannels = useMemo(() => {
    return user.recentIds
      .map(id => channels.find(c => c.id === id))
      .filter(Boolean)
      .slice(0, 8) as Channel[];
  }, [user.recentIds, channels]);

  // 2. Trending Live TV
  const trendingTVChannels = useMemo(() => {
    return channels.filter(c => c.type === 'tv' && (c.isTrending || (c.viewCount && c.viewCount > 40000))).slice(0, 10);
  }, [channels]);

  // 3. Popular News Channels
  const popularNewsChannels = useMemo(() => {
    return channels.filter(c => c.type === 'tv' && (c.category.toLowerCase().includes('news') || c.category === 'World News' || c.category === 'India News')).slice(0, 10);
  }, [channels]);

  // 4. International TV
  const internationalChannels = useMemo(() => {
    return channels.filter(c => c.type === 'tv' && c.country !== 'India').slice(0, 10);
  }, [channels]);

  // 5. Indian TV Channels
  const indianTVChannels = useMemo(() => {
    return channels.filter(c => c.type === 'tv' && c.country === 'India').slice(0, 10);
  }, [channels]);

  // 6. Sports Live
  const sportsChannels = useMemo(() => {
    return channels.filter(c => c.type === 'tv' && (c.category === 'Sports' || c.category === 'Cricket' || c.category === 'Soccer' || c.category === 'Football' || c.category === 'WWE & Wrestling')).slice(0, 10);
  }, [channels]);

  // Dedicated Cricket Live Channels (Curated 24/7 + Cricombo & Cricket On Air Live Streams)
  const cricketChannels = useMemo(() => {
    const base = channels.filter(c => c.type === 'tv' && c.category === 'Cricket');
    const hubLive = cricketHubData?.liveStreams || [];
    const seen = new Set(hubLive.map(c => c.streamUrl));
    return [...hubLive, ...base.filter(c => !seen.has(c.streamUrl))].slice(0, 12);
  }, [channels, cricketHubData]);

  // Dedicated Soccer / Football Live Channels
  const soccerChannels = useMemo(() => {
    return channels.filter(c => c.type === 'tv' && (c.category === 'Soccer' || c.category === 'Football')).slice(0, 8);
  }, [channels]);

  // Dedicated WWE & Combat Wrestling Channels
  const wweChannels = useMemo(() => {
    return channels.filter(c => c.type === 'tv' && c.category === 'WWE & Wrestling').slice(0, 8);
  }, [channels]);

  // 7. Music TV
  const musicTVChannels = useMemo(() => {
    return channels.filter(c => c.type === 'tv' && (c.category === 'Music' || c.category === 'Bollywood')).slice(0, 8);
  }, [channels]);

  // 8. Popular Radio Stations
  const popularRadioStations = useMemo(() => {
    return channels.filter(c => c.type === 'radio' && (c.isFeatured || c.isTrending)).slice(0, 10);
  }, [channels]);

  // 9. Recently Played
  const recentlyPlayedStations = useMemo(() => {
    return user.recentIds
      .map(id => channels.find(c => c.id === id && c.type === 'radio'))
      .filter(Boolean)
      .slice(0, 6) as Channel[];
  }, [user.recentIds, channels]);

  // 10. Recommended Channels (Personalized based on favorites or general top rated)
  const recommendedChannels = useMemo(() => {
    return channels.filter(c => c.isFeatured && !user.recentIds.includes(c.id)).slice(0, 10);
  }, [channels, user.recentIds]);

  const handlePlayFeatured = () => {
    const channel = directoryToChannel(currentFeatured);
    playTVChannel(channel);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Reusable Horizontal Scrolling Channel Card Row Component
  const ChannelHorizontalRow: React.FC<{
    title: string;
    subtitle?: string;
    icon: React.ComponentType<{ className?: string }>;
    channels: Channel[];
    badgeText?: string;
    onViewAll?: () => void;
  }> = ({ title, subtitle, icon: Icon, channels: rowChannels, badgeText, onViewAll }) => {
    if (rowChannels.length === 0) return null;

    return (
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
              <Icon className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display text-base sm:text-lg font-bold text-white tracking-tight">
                  {title}
                </h2>
                {badgeText && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 text-[10px] font-bold border border-amber-500/20">
                    {badgeText}
                  </span>
                )}
              </div>
              {subtitle && <p className="text-[11px] text-slate-400">{subtitle}</p>}
            </div>
          </div>

          {onViewAll && (
            <button
              onClick={onViewAll}
              className="min-h-[44px] px-2 text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 cursor-pointer transition-colors shrink-0"
            >
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Horizontal Scrolling Cards */}
        <div className="flex items-stretch gap-3 sm:gap-3.5 overflow-x-auto pb-3 scrollbar-none scroll-smooth snap-x snap-mandatory">
          {rowChannels.map((channel, idx) => {
            const isPlayingThis = (channel.type === 'tv' && activeTV?.id === channel.id) || 
                                  (channel.type === 'radio' && activeRadio?.id === channel.id && isRadioPlaying);
            const isFav = isFavorite(channel.id);

            return (
              <div
                key={`${channel.id}-${idx}`}
                className="group snap-start w-44 sm:w-56 md:w-60 rounded-2xl bg-slate-900 border border-slate-800 hover:border-amber-500/50 p-3 sm:p-3.5 flex flex-col justify-between shrink-0 transition-all hover:shadow-xl hover:shadow-amber-500/5"
              >
                <div>
                  {/* Top Bar: Logo, Quality/Type Badge, Fav */}
                  <div className="flex items-start justify-between gap-2 mb-2.5">
                    <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-slate-950 border border-slate-800 p-1.5 flex items-center justify-center overflow-hidden shrink-0 group-hover:scale-105 transition-transform">
                      <img
                        src={channel.logoUrl}
                        alt={channel.name}
                        className="w-full h-full object-contain"
                        loading="lazy"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      <span className="px-1.5 py-0.2 rounded bg-red-600/20 text-red-400 border border-red-500/30 text-[9px] font-black uppercase tracking-wider flex items-center gap-1">
                        <span className="w-1 h-1 rounded-full bg-red-500 animate-ping" />
                        LIVE
                      </span>
                      <span className="px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 text-[9px] font-mono">
                        {channel.quality?.[0] || (channel.type === 'tv' ? '1080p' : '128k')}
                      </span>
                    </div>
                  </div>

                  {/* Channel Name & Category */}
                  <h3 className="text-xs sm:text-sm font-bold text-white group-hover:text-amber-400 transition-colors line-clamp-1">
                    {channel.name}
                  </h3>

                  <div className="flex items-center gap-1.5 mt-1 text-[10px] text-slate-400">
                    <span className="text-amber-400 font-semibold truncate max-w-[90px]">{channel.category}</span>
                    <span>•</span>
                    <span className="truncate">{channel.country}</span>
                  </div>

                  <p className="text-[10px] text-slate-400 line-clamp-1 mt-1">
                    {channel.description}
                  </p>
                </div>

                {/* Bottom Controls */}
                <div className="flex items-center justify-between gap-1.5 pt-2.5 mt-2 border-t border-slate-800/80">
                  <button
                    onClick={() => playChannel(channel)}
                    className={`flex-1 min-h-[40px] py-1.5 px-2.5 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      isPlayingThis
                        ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                        : 'bg-slate-800 hover:bg-amber-500 text-slate-200 hover:text-slate-950'
                    }`}
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>{isPlayingThis ? 'Playing' : 'Play'}</span>
                  </button>

                  <button
                    onClick={() => toggleFavorite(channel.id)}
                    title={isFav ? 'Remove favorite' : 'Add favorite'}
                    aria-label={isFav ? 'Remove favorite' : 'Add favorite'}
                    className={`min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl border transition-colors cursor-pointer ${
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
      </section>
    );
  };

  return (
    <div className="space-y-8 sm:space-y-10 pb-8">
      {/* Hero Showcase Section: Web TV Dictionary Featured Broadcast */}
      <section className="relative rounded-2xl sm:rounded-3xl overflow-hidden bg-slate-900 border border-slate-800 shadow-2xl">
        <div className="relative min-h-[300px] sm:min-h-[380px] lg:min-h-[420px] flex items-center">
          <img 
            src="/src/assets/images/hero_tv_streaming_1794217850644.jpg" 
            alt="Web TV Dictionary Featured Broadcast" 
            className="absolute inset-0 w-full h-full object-cover filter brightness-[0.32] contrast-105"
            referrerPolicy="no-referrer"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/70 to-transparent" />

          <div className="relative z-10 w-full max-w-3xl px-4 sm:px-8 lg:px-10 py-6 sm:py-10 flex flex-col items-start">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="px-2.5 py-0.5 rounded bg-red-600 text-white text-[11px] font-black tracking-widest uppercase flex items-center gap-1.5 shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                FEATURED BROADCAST
              </span>
              <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-bold uppercase flex items-center gap-1">
                <BookOpen className="w-3 h-3" />
                WORLDWIDE FREE TV
              </span>
              <span className="text-xs text-slate-300 font-medium">
                {currentFeatured.country} · {currentFeatured.language} · {currentFeatured.category}
              </span>
            </div>

            <h1 className="font-display text-fluid-hero font-extrabold text-white tracking-tight mb-2 text-balance">
              {currentFeatured.name}
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 line-clamp-2 leading-relaxed mb-4 sm:mb-5 max-w-2xl">
              {currentFeatured.description}
            </p>

            {/* Quick Switch Featured Channels */}
            <div className="w-full flex items-center gap-2 overflow-x-auto pb-2 mb-3 scrollbar-none">
              <span className="text-xs text-slate-400 font-semibold shrink-0">Featured:</span>
              {featuredDictionaryStreams.map((stream, idx) => (
                <button
                  key={stream.id}
                  onClick={() => setFeaturedIndex(idx)}
                  className={`min-h-[38px] px-3 py-1 rounded-xl text-xs font-medium whitespace-nowrap shrink-0 transition-all cursor-pointer flex items-center gap-1.5 ${
                    featuredIndex === idx
                      ? 'bg-white text-slate-950 font-bold shadow-md'
                      : 'bg-black/40 hover:bg-black/60 text-slate-300 border border-white/10'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                  <span>{stream.cleanName}</span>
                </button>
              ))}
            </div>

            <div className="w-full flex flex-wrap items-center gap-2.5 sm:gap-3">
              <button
                onClick={handlePlayFeatured}
                className="w-full sm:w-auto min-h-[44px] px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm flex items-center justify-center gap-2.5 shadow-lg shadow-amber-500/25 transition-all transform active:scale-95 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-slate-950" />
                <span>Watch Featured Broadcast</span>
              </button>

              <button
                onClick={() => setCurrentTab('iptv')}
                className="min-h-[44px] px-4 py-2.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 font-bold text-xs sm:text-sm flex items-center gap-2 border border-amber-500/40 backdrop-blur-sm transition-colors cursor-pointer"
              >
                <ListVideo className="w-4 h-4 text-amber-400" />
                <span>IPTV &amp; EPG</span>
              </button>

              <button
                onClick={() => setCurrentTab('cricket')}
                className="min-h-[44px] px-4 py-2.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 font-bold text-xs sm:text-sm flex items-center gap-2 border border-emerald-500/40 backdrop-blur-sm transition-colors cursor-pointer"
              >
                <Trophy className="w-4 h-4 text-emerald-400" />
                <span>Cricket Hub</span>
              </button>

              <button
                onClick={() => setCurrentTab('countries')}
                className="min-h-[44px] px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-white font-medium text-xs sm:text-sm flex items-center gap-2 border border-slate-700 backdrop-blur-sm transition-colors cursor-pointer"
              >
                <Globe className="w-4 h-4 text-amber-400" />
                <span>Countries</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Optional Non-Intrusive Monetization Display (AdMob / AdSense banner placeholder) */}
      {monetization.adsEnabled && !monetization.isPremium && (
        <div className="p-3 rounded-2xl bg-slate-900/40 border border-dashed border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
          <div className="flex items-center gap-2 min-w-0">
            <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] font-mono font-bold text-amber-400 shrink-0">
              {monetization.adNetwork.toUpperCase()}
            </span>
            <span className="truncate">Support Free-To-Air Streaming · Uninterrupted Playback Guarantee</span>
          </div>
          <button 
            onClick={() => setCurrentTab('admin')} 
            className="text-[11px] text-amber-400 hover:underline py-1 shrink-0 cursor-pointer"
          >
            Ad Settings
          </button>
        </div>
      )}

      {/* Free-TV IPTV Playlist & Live EPG Spotlight */}
      {iptvChannels.length > 0 && (
        <ChannelHorizontalRow
          title="Free-TV IPTV Playlist & EPG"
          subtitle={`${iptvChannels.length.toLocaleString()} live channels with real-time Electronic Program Guide`}
          icon={CalendarClock}
          channels={iptvChannels.slice(0, 12)}
          badgeText="M3U8 + EPG"
          onViewAll={() => setCurrentTab('iptv')}
        />
      )}

      {/* ALL 10 MANDATORY SECTIONS: */}

      {/* 1. Continue Watching */}
      {continueWatchingChannels.length > 0 && (
        <ChannelHorizontalRow
          title="Continue Watching"
          subtitle="Pick up where you left off"
          icon={History}
          channels={continueWatchingChannels}
          badgeText="Recent"
          onViewAll={() => setCurrentTab('favorites')}
        />
      )}

      {/* 2. Trending Live TV */}
      <ChannelHorizontalRow
        title="Trending Live TV"
        subtitle="Most watched live streams right now"
        icon={TrendingUp}
        channels={trendingTVChannels}
        badgeText="Popular"
        onViewAll={() => setCurrentTab('tv')}
      />

      {/* 3. Popular News Channels */}
      <ChannelHorizontalRow
        title="Popular News Channels"
        subtitle="24/7 National & International verified news coverage"
        icon={Activity}
        channels={popularNewsChannels}
        badgeText="World & National"
        onViewAll={() => {
          setSelectedCategory('World News');
          setCurrentTab('tv');
        }}
      />

      {/* 4. International TV */}
      <ChannelHorizontalRow
        title="International TV"
        subtitle="Official broadcasts from Europe, Americas, Asia, and Pacific"
        icon={Globe}
        channels={internationalChannels}
        badgeText="Global Feeds"
        onViewAll={() => setCurrentTab('countries')}
      />

      {/* 5. Indian TV Channels */}
      <ChannelHorizontalRow
        title="Indian TV Channels"
        subtitle="Doordarshan, Prasar Bharati, Hindi News & regional heritage"
        icon={Tv}
        channels={indianTVChannels}
        badgeText="India FTA"
        onViewAll={() => {
          setSelectedCategory('India News');
          setCurrentTab('tv');
        }}
      />

      {/* Live Cricket Streaming Section */}
      {cricketChannels.length > 0 && (
        <ChannelHorizontalRow
          title="Live Cricket Streaming (Cricket Hub)"
          subtitle="Cricombo live matches, Cricket On Air official streams, DD Sports, and ICC World Cricket TV"
          icon={Trophy}
          channels={cricketChannels}
          badgeText="Cricket Hub"
          onViewAll={() => setCurrentTab('cricket')}
        />
      )}

      {/* World Soccer & Football Live Section */}
      {soccerChannels.length > 0 && (
        <ChannelHorizontalRow
          title="World Soccer & Football Live"
          subtitle="FIFA+ official channel, Real Madrid TV 24/7, beIN SPORTS XTRA, and UEFA.tv"
          icon={Sparkles}
          channels={soccerChannels}
          badgeText="Soccer 24/7"
          onViewAll={() => {
            setSelectedCategory('Soccer');
            setCurrentTab('tv');
          }}
        />
      )}

      {/* WWE & Professional Wrestling Section */}
      {wweChannels.length > 0 && (
        <ChannelHorizontalRow
          title="WWE & Professional Wrestling 24/7"
          subtitle="WWE Network Free Showcase, IMPACT Wrestling 24/7, Lucha Libre AAA, and Fight Network"
          icon={Swords}
          channels={wweChannels}
          badgeText="WWE & Combat"
          onViewAll={() => {
            setSelectedCategory('WWE & Wrestling');
            setCurrentTab('tv');
          }}
        />
      )}

      {/* 6. Multisport & Extreme Action */}
      <ChannelHorizontalRow
        title="Multisport & Action Sports"
        subtitle="Action sports, extreme mountain biking, Red Bull TV, and Olympic highlights"
        icon={Sparkles}
        channels={sportsChannels}
        badgeText="Live Action"
        onViewAll={() => {
          setSelectedCategory('Sports');
          setCurrentTab('tv');
        }}
      />

      {/* 6b. Live Worldwide Sports M3U (IPTV-org categories/sports.m3u) */}
      {sportsIptvChannels.length > 0 && (
        <ChannelHorizontalRow
          title="Worldwide Live Sports TV (IPTV-org)"
          subtitle={`${sportsIptvChannels.length}+ live sports broadcasts from the official IPTV-org sports feed`}
          icon={Trophy}
          channels={sportsIptvChannels.slice(0, 14)}
          badgeText="Sports M3U"
          onViewAll={() => {
            setSelectedCategory('Sports');
            setCurrentTab('tv');
          }}
        />
      )}

      {/* 7. Music TV */}
      <ChannelHorizontalRow
        title="Music TV"
        subtitle="24/7 non-stop music videos, Bollywood, EDM festivals & retro pop"
        icon={Music}
        channels={musicTVChannels}
        badgeText="24/7 Beats"
        onViewAll={() => {
          setSelectedCategory('Music');
          setCurrentTab('tv');
        }}
      />

      {/* 8. Popular Radio Stations */}
      <ChannelHorizontalRow
        title="Popular Radio Stations"
        subtitle="FM stations & high-fidelity internet radio from Radio Browser API"
        icon={Radio}
        channels={popularRadioStations}
        badgeText="Live Audio"
        onViewAll={() => setCurrentTab('radio')}
      />

      {/* Worldwide Radio Directory Platforms (Radio Garden, Radio Browser, TuneIn, Roam, Online Radio FM, Air Drift, Airtune) */}
      <RadioPlatformsHub />

      {/* 9. Recently Played Radio */}
      {recentlyPlayedStations.length > 0 && (
        <ChannelHorizontalRow
          title="Recently Played"
          subtitle="Your recent radio stations"
          icon={Volume2}
          channels={recentlyPlayedStations}
          onViewAll={() => setCurrentTab('radio')}
        />
      )}

      {/* 10. Recommended Channels */}
      <ChannelHorizontalRow
        title="Recommended Channels"
        subtitle="Curated for your entertainment lineup"
        icon={Compass}
        channels={recommendedChannels}
        badgeText="Editor's Pick"
        onViewAll={() => setCurrentTab('tv')}
      />

      {/* Trust & Transparency Feature Strip */}
      <section className="rounded-2xl p-6 bg-slate-900/50 border border-slate-800 text-center sm:text-left">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">100% Free &amp; Legal</h3>
              <p className="text-xs text-slate-400 mt-1">
                Only verified public service broadcasters and authorized Free-to-Air feeds. No piracy, no unauthorized IPTV playlists.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
              <Tv className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Universal HLS Player</h3>
              <p className="text-xs text-slate-400 mt-1">
                Smooth streaming on mobile phones, tablets, and desktop with Fullscreen, Picture-in-Picture, and adaptive bitrate.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
              <Radio className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Docked Background Audio</h3>
              <p className="text-xs text-slate-400 mt-1">
                Listen to Hindi, Punjabi, Tamil, Telugu, and international radio stations continuously while exploring other pages.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
