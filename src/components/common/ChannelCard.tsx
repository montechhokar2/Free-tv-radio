import React from 'react';
import { Play, Heart, Tv, Radio, ShieldCheck } from 'lucide-react';
import { Channel } from '../../types';
import { useApp } from '../../context/AppContext';

interface ChannelCardProps {
  channel: Channel;
  compact?: boolean;
}

export const ChannelCard: React.FC<ChannelCardProps> = ({ channel, compact = false }) => {
  const { playChannel, isFavorite, toggleFavorite, activeTV, activeRadio } = useApp();

  const isCurrentTV = activeTV?.id === channel.id;
  const isCurrentRadio = activeRadio?.id === channel.id;
  const isCurrent = isCurrentTV || isCurrentRadio;
  const isFav = isFavorite(channel.id);

  if (compact) {
    return (
      <div 
        onClick={() => playChannel(channel)}
        className={`group relative flex items-center gap-3 p-2.5 rounded-xl border transition-all duration-200 cursor-pointer ${
          isCurrent 
            ? 'bg-amber-500/10 border-amber-500/40 text-amber-300' 
            : 'bg-slate-900/60 hover:bg-slate-800/80 border-slate-800/80 hover:border-slate-700'
        }`}
      >
        <div className="relative w-11 h-11 rounded-lg overflow-hidden bg-slate-800 shrink-0 border border-slate-700 flex items-center justify-center">
          {channel.logoUrl ? (
            <img 
              src={channel.logoUrl} 
              alt={channel.name} 
              loading="lazy"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
              referrerPolicy="no-referrer"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          ) : (
            channel.type === 'tv' ? <Tv className="w-5 h-5 text-amber-400" /> : <Radio className="w-5 h-5 text-amber-400" />
          )}
          {isCurrent && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h4 className="text-xs font-bold text-white truncate group-hover:text-amber-400 transition-colors">
              {channel.name}
            </h4>
            <span className="text-[10px] text-amber-400 font-semibold uppercase">
              {channel.type === 'tv' ? 'LIVE' : 'FM'}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <span>{channel.language}</span>
            <span aria-hidden="true">·</span>
            <span>{channel.category}</span>
          </div>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleFavorite(channel.id);
          }}
          aria-label={isFav ? 'Remove Favorite' : 'Add to Favorites'}
          className="min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-400 hover:text-red-400 transition-colors cursor-pointer"
          title={isFav ? 'Remove Favorite' : 'Add to Favorites'}
        >
          <Heart className={`w-4 h-4 ${isFav ? 'fill-red-500 text-red-500' : ''}`} />
        </button>
      </div>
    );
  }

  return (
    <div 
      onClick={() => playChannel(channel)}
      className={`group relative rounded-2xl overflow-hidden border transition-all duration-200 cursor-pointer flex flex-col ${
        isCurrent 
          ? 'bg-slate-900 border-amber-500/60 shadow-lg shadow-amber-500/10' 
          : 'bg-slate-900/80 hover:bg-slate-850 border-slate-800 hover:border-slate-700 shadow-sm'
      }`}
    >
      {/* Thumbnail / Header Banner */}
      <div className="relative aspect-video w-full bg-slate-950 overflow-hidden flex items-center justify-center">
        {channel.logoUrl ? (
          <img 
            src={channel.logoUrl} 
            alt={channel.name} 
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 filter brightness-95 group-hover:brightness-105"
            referrerPolicy="no-referrer"
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-slate-900">
            {channel.type === 'tv' ? <Tv className="w-12 h-12 text-slate-600" /> : <Radio className="w-12 h-12 text-slate-600" />}
          </div>
        )}

        {/* Gradient Scrim for Contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />

        {/* Live / Type Badge */}
        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
          <span className={`px-2 py-0.5 text-[10px] font-black tracking-wider uppercase rounded ${
            channel.type === 'tv' ? 'bg-red-600 text-white' : 'bg-amber-500 text-black'
          }`}>
            {channel.type === 'tv' ? 'LIVE TV' : 'RADIO FM'}
          </span>
          {channel.verifiedFta && (
            <span className="hidden sm:flex items-center gap-1 px-1.5 py-0.5 bg-black/60 backdrop-blur-sm text-emerald-400 text-[10px] rounded border border-emerald-500/20">
              <ShieldCheck className="w-3 h-3" />
              FTA
            </span>
          )}
        </div>

        {/* Favorite Icon Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleFavorite(channel.id);
          }}
          aria-label={isFav ? 'Remove Favorite' : 'Add to Favorites'}
          className="absolute top-1.5 right-1.5 min-w-[44px] min-h-[44px] rounded-full bg-black/55 hover:bg-black/75 backdrop-blur-sm text-white flex items-center justify-center transition-colors cursor-pointer"
          title={isFav ? 'Remove Favorite' : 'Add to Favorites'}
        >
          <Heart className={`w-4 h-4 ${isFav ? 'fill-red-500 text-red-500' : ''}`} />
        </button>

        {/* Play Overlay Button on Hover */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
          <div className="w-12 h-12 rounded-full bg-amber-500 text-black flex items-center justify-center shadow-lg shadow-amber-500/30 transform group-hover:scale-110 transition-transform">
            <Play className="w-6 h-6 fill-black ml-0.5" />
          </div>
        </div>

        {/* Current Active Indicator */}
        {isCurrent && (
          <div className="absolute bottom-2 left-3 flex items-center gap-1.5 text-xs font-semibold text-amber-400 bg-black/70 px-2 py-0.5 rounded backdrop-blur-sm">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span>NOW PLAYING</span>
          </div>
        )}
      </div>

      {/* Card Body */}
      <div className="p-3.5 flex flex-col flex-1">
        <h3 className="font-display font-bold text-sm text-white group-hover:text-amber-400 transition-colors truncate mb-1">
          {channel.name}
        </h3>

        <p className="text-xs text-slate-400 line-clamp-1 mb-2.5">
          {channel.currentProgram || channel.description}
        </p>

        {/* Zero-Pill Unboxed Metadata with Typographic Dot Separators */}
        <div className="mt-auto pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5 truncate">
            <span>{channel.category}</span>
            <span aria-hidden="true">·</span>
            <span>{channel.language}</span>
          </div>
          <span className="shrink-0 text-slate-400">{channel.country}</span>
        </div>
      </div>
    </div>
  );
};
