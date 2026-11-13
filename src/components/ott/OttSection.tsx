import React, { useState } from 'react';
import { 
  Tv, 
  ExternalLink, 
  Play, 
  Sparkles, 
  Layers, 
  Globe2, 
  CheckCircle2, 
  Search,
  Radio,
  Flame
} from 'lucide-react';
import { OTT_PLATFORMS } from '../../data/ottPlatforms';
import { useApp } from '../../context/AppContext';
import { OttPlatform, Channel } from '../../types';

export const OttSection: React.FC = () => {
  const { channels, playTVChannel } = useApp();
  const [selectedFilter, setSelectedFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Extract YouTube live channels
  const youtubeLiveChannels = channels.filter(c => 
    c.category === 'YouTube Live' || 
    c.streamFormat === 'youtube' || 
    c.streamUrl.includes('youtube.com')
  );

  // Extract JioTV and Colito live channels
  const jioAndColitoChannels = channels.filter(c => 
    c.name.toLowerCase().includes('jio') ||
    c.name.toLowerCase().includes('colito') ||
    c.broadcaster?.toLowerCase().includes('jio') ||
    c.broadcaster?.toLowerCase().includes('coolita') ||
    c.broadcaster?.toLowerCase().includes('colito')
  );

  const categories = ['All', 'Free & AVOD', 'Freemium', 'Regional OTT', 'Global OTT'];

  const filteredPlatforms = OTT_PLATFORMS.filter(platform => {
    const matchesFilter = selectedFilter === 'All' || platform.category === selectedFilter;
    const matchesSearch = 
      platform.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      platform.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      platform.featuredContent.some(c => c.toLowerCase().includes(searchQuery.toLowerCase())) ||
      platform.languages.some(l => l.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Header Banner */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-red-950/60 via-slate-900 to-amber-950/40 border border-slate-800 p-6 md:p-8">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-semibold uppercase tracking-wider mb-3">
            <Flame className="w-3.5 h-3.5 fill-red-400" />
            <span>OTT Platforms &amp; YouTube Live Hub</span>
          </div>
          <h1 className="font-display text-2xl md:text-4xl font-extrabold text-white tracking-tight mb-2">
            Watch Free Shows, Sports &amp; Live YouTube Broadcasts
          </h1>
          <p className="text-sm md:text-base text-slate-300 leading-relaxed mb-6">
            Explore 100% legal free-tier streaming services, broadcaster hubs, and official YouTube 24x7 live news networks. No hidden subscriptions for free feeds.
          </p>

          {/* Quick stats banner */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
              <span className="block text-xl font-bold text-amber-400">10+</span>
              <span className="text-[11px] text-slate-400 uppercase tracking-wider">Top OTT Portals</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
              <span className="block text-xl font-bold text-red-400">100% Free</span>
              <span className="text-[11px] text-slate-400 uppercase tracking-wider">AVOD Feeds</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
              <span className="block text-xl font-bold text-emerald-400">{youtubeLiveChannels.length} Live</span>
              <span className="text-[11px] text-slate-400 uppercase tracking-wider">YouTube Streams</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
              <span className="block text-xl font-bold text-sky-400">12+</span>
              <span className="text-[11px] text-slate-400 uppercase tracking-wider">Languages</span>
            </div>
          </div>
        </div>
      </div>

      {/* JioTV & Colito TV Live Streaming Showcase */}
      {jioAndColitoChannels.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
                <Flame className="w-4 h-4 fill-blue-400" />
              </div>
              <div>
                <h2 className="text-lg md:text-xl font-bold text-white tracking-tight flex items-center gap-2">
                  <span>JioTV &amp; Colito FAST Streaming</span>
                  <span className="px-2 py-0.5 rounded bg-blue-600 text-white text-[10px] font-black tracking-widest uppercase">
                    INTEGRATED
                  </span>
                </h2>
                <p className="text-xs text-slate-400">
                  India’s premier 1000+ channel network &amp; global FAST linear TV feeds ready for instant in-app playback
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <a
                href="https://www.jiotv.com"
                target="_blank"
                rel="noreferrer noopener"
                className="hidden sm:inline-flex items-center gap-1 text-xs font-semibold text-blue-400 hover:text-blue-300"
              >
                <span>JioTV Web</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              <a
                href="https://www.coolitaos.com"
                target="_blank"
                rel="noreferrer noopener"
                className="hidden sm:inline-flex items-center gap-1 text-xs font-semibold text-amber-400 hover:text-amber-300 ml-2"
              >
                <span>Colito OS</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {jioAndColitoChannels.map(channel => (
              <div
                key={channel.id}
                onClick={() => playTVChannel(channel)}
                className="group relative bg-slate-900/90 hover:bg-slate-800/90 border border-slate-800 hover:border-blue-500/50 rounded-xl p-4 transition-all duration-200 cursor-pointer shadow-lg hover:shadow-blue-500/10 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-2 py-0.5 rounded bg-blue-600/20 border border-blue-500/30 text-blue-400 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping" />
                      {channel.name.includes('Colito') ? 'Colito FAST' : 'JioTV Network'}
                    </span>
                    <span className="text-[11px] font-medium text-slate-400">
                      {channel.language}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-800 shrink-0 border border-slate-700 flex items-center justify-center">
                      <img 
                        src={channel.logoUrl} 
                        alt={channel.name} 
                        className="w-full h-full object-cover" 
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-white group-hover:text-amber-400 transition-colors truncate">
                        {channel.name}
                      </h3>
                      <p className="text-[11px] text-slate-400 truncate">
                        {channel.broadcaster}
                      </p>
                    </div>
                  </div>

                  <p className="text-xs text-slate-400 line-clamp-2 mb-3">
                    {channel.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 font-mono">
                    {channel.quality?.[0] || '1080p HD'}
                  </span>
                  <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-400 group-hover:text-blue-300">
                    <Play className="w-3.5 h-3.5 fill-blue-400" />
                    <span>Watch in App</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Official YouTube Live Broadcasts Shelf */}
      {youtubeLiveChannels.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-red-600/20 text-red-500 border border-red-500/30 flex items-center justify-center">
                <Play className="w-4 h-4 fill-red-500" />
              </div>
              <div>
                <h2 className="text-lg md:text-xl font-bold text-white tracking-tight flex items-center gap-2">
                  <span>YouTube 24x7 Live Feeds</span>
                  <span className="px-2 py-0.5 rounded bg-red-600 text-white text-[10px] font-black tracking-widest uppercase">
                    LIVE
                  </span>
                </h2>
                <p className="text-xs text-slate-400">
                  Official broadcaster feeds streaming free on YouTube — play instantly inside our player
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {youtubeLiveChannels.map((ytChannel: Channel) => (
              <div
                key={ytChannel.id}
                onClick={() => playTVChannel(ytChannel)}
                className="group relative bg-slate-900/90 hover:bg-slate-800/90 border border-slate-800 hover:border-red-500/50 rounded-xl p-4 transition-all duration-200 cursor-pointer shadow-lg hover:shadow-red-500/10 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-2 py-0.5 rounded bg-red-600/20 border border-red-500/30 text-red-400 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                      Live Stream
                    </span>
                    <span className="text-[11px] font-medium text-slate-400">
                      {ytChannel.language}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-800 shrink-0 border border-slate-700 flex items-center justify-center">
                      {ytChannel.logoUrl ? (
                        <img 
                          src={ytChannel.logoUrl} 
                          alt={ytChannel.name} 
                          className="w-full h-full object-cover" 
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <Tv className="w-5 h-5 text-red-400" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-white group-hover:text-amber-400 transition-colors truncate">
                        {ytChannel.name}
                      </h3>
                      <p className="text-[11px] text-slate-400 truncate">
                        {ytChannel.broadcaster}
                      </p>
                    </div>
                  </div>

                  <p className="text-xs text-slate-400 line-clamp-2 mb-3">
                    {ytChannel.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 font-mono">
                    {ytChannel.quality?.[0] || '1080p HD'}
                  </span>
                  <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-400 group-hover:text-red-300">
                    <Play className="w-3.5 h-3.5 fill-red-400" />
                    <span>Watch in App</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-4 border-t border-slate-800/80">
        <div className="flex flex-wrap items-center gap-2">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedFilter(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                selectedFilter === cat
                  ? 'bg-amber-500 text-black font-semibold shadow-md shadow-amber-500/20'
                  : 'bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search platform, show or language..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-amber-500/60 transition-colors"
          />
        </div>
      </div>

      {/* OTT Platforms Grid */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-amber-400" />
            <h2 className="text-xl font-bold text-white tracking-tight">
              Featured OTT Networks &amp; Broadcaster Portals
            </h2>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            Showing {filteredPlatforms.length} of {OTT_PLATFORMS.length}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredPlatforms.map((platform: OttPlatform) => (
            <div
              key={platform.id}
              className="bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 flex flex-col justify-between transition-all duration-200 shadow-xl"
            >
              <div>
                {/* Header row */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 overflow-hidden shrink-0 flex items-center justify-center">
                      <img 
                        src={platform.logoUrl} 
                        alt={platform.name}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white tracking-tight">
                        {platform.name}
                      </h3>
                      <span className="text-[11px] text-slate-400">
                        {platform.category} · {platform.origin}
                      </span>
                    </div>
                  </div>

                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase border ${
                    platform.freeTier
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                  }`}>
                    {platform.freeTier ? 'Free AVOD' : 'Subscription'}
                  </span>
                </div>

                <p className="text-xs text-amber-400/90 font-medium mb-2 italic">
                  &ldquo;{platform.tagline}&rdquo;
                </p>

                <p className="text-xs text-slate-300 leading-relaxed mb-4">
                  {platform.description}
                </p>

                {/* Popular content chips */}
                <div className="space-y-1.5 mb-4">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Featured Free Shows &amp; Channels
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {platform.featuredContent.map((content, idx) => (
                      <span 
                        key={idx}
                        className="px-2 py-0.5 bg-slate-800 text-slate-300 text-[11px] rounded-md border border-slate-700/60"
                      >
                        {content}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Languages */}
                <div className="mb-4">
                  <div className="flex flex-wrap items-center gap-1">
                    <Globe2 className="w-3 h-3 text-slate-400 shrink-0" />
                    <span className="text-[11px] text-slate-400 truncate">
                      {platform.languages.join(', ')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Official Portal</span>
                </div>
                <a
                  href={platform.websiteUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md shadow-amber-500/10 transition-all cursor-pointer"
                >
                  <span>Launch Platform</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Compliance / Guidance Note */}
      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-slate-400 text-xs leading-relaxed flex items-start gap-3">
        <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-slate-200">Legal Free Streaming &amp; AVOD Notice:</span> Free TV &amp; Radio Live provides direct links to official publisher websites and legal public broadcast feeds. Broadcasters operate free ad-supported streaming tiers (AVOD) and FTA channels compliant with Indian and international broadcast guidelines. No subscription bypass or unauthorized scraping is used.
        </div>
      </div>
    </div>
  );
};
