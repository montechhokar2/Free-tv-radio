import React, { useState } from 'react';
import { Heart, History, Trash2, Tv, Radio, ArrowRight } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ChannelCard } from '../common/ChannelCard';
import { MediaType } from '../../types';

export const FavoritesSection: React.FC = () => {
  const { channels, user, clearHistory, setCurrentTab } = useApp();
  const [activeTab, setActiveTab] = useState<'favorites' | 'history'>('favorites');
  const [typeFilter, setTypeFilter] = useState<MediaType | 'all'>('all');

  const favoriteChannels = channels.filter(c => user.favorites.includes(c.id));
  const recentChannels = user.recentIds
    .map(id => channels.find(c => c.id === id))
    .filter(Boolean) as typeof channels;

  const currentList = activeTab === 'favorites' ? favoriteChannels : recentChannels;
  const filteredList = currentList.filter(c => typeFilter === 'all' || c.type === typeFilter);

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-2.5">
            {activeTab === 'favorites' ? (
              <Heart className="w-7 h-7 text-red-500 fill-red-500" />
            ) : (
              <History className="w-7 h-7 text-amber-400" />
            )}
            <span>{activeTab === 'favorites' ? 'Your Favorite Channels' : 'Recently Watched History'}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            {activeTab === 'favorites'
              ? 'Quick access to all your bookmarked live TV feeds and radio stations.'
              : 'Keep track of all the streams you recently tuned into.'}
          </p>
        </div>

        {/* Tab Switcher & Clear History */}
        <div className="flex items-center gap-2">
          <div className="p-1 bg-slate-900 border border-slate-800 rounded-xl flex items-center">
            <button
              onClick={() => setActiveTab('favorites')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === 'favorites' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Favorites ({favoriteChannels.length})
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === 'history' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              History ({recentChannels.length})
            </button>
          </div>

          {activeTab === 'history' && recentChannels.length > 0 && (
            <button
              onClick={clearHistory}
              title="Clear watch history"
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-rose-500/10 hover:border-rose-500/30 text-slate-400 hover:text-rose-400 text-xs transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Filter by Type */}
      <div className="flex items-center gap-2 text-xs">
        <span className="text-slate-400 font-medium">Filter by:</span>
        <button
          onClick={() => setTypeFilter('all')}
          className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
            typeFilter === 'all' ? 'bg-slate-800 text-amber-400 font-semibold' : 'text-slate-400 hover:text-white'
          }`}
        >
          All ({currentList.length})
        </button>
        <button
          onClick={() => setTypeFilter('tv')}
          className={`px-3 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
            typeFilter === 'tv' ? 'bg-slate-800 text-amber-400 font-semibold' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Tv className="w-3.5 h-3.5" />
          <span>TV ({currentList.filter(c => c.type === 'tv').length})</span>
        </button>
        <button
          onClick={() => setTypeFilter('radio')}
          className={`px-3 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
            typeFilter === 'radio' ? 'bg-slate-800 text-amber-400 font-semibold' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Radio className="w-3.5 h-3.5" />
          <span>Radio ({currentList.filter(c => c.type === 'radio').length})</span>
        </button>
      </div>

      {/* Grid */}
      {filteredList.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredList.map((channel, idx) => (
            <ChannelCard key={`${channel.id}-${idx}`} channel={channel} />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl p-12 text-center bg-slate-900/40 border border-slate-800 flex flex-col items-center justify-center">
          <Heart className="w-12 h-12 text-slate-600 mb-3" />
          <h3 className="text-base font-bold text-white mb-1">
            {activeTab === 'favorites' ? 'No Favorites Saved Yet' : 'No History Recorded'}
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mb-5 leading-relaxed">
            {activeTab === 'favorites'
              ? 'Click the heart icon on any TV channel or radio station card to save it here for fast one-tap access.'
              : 'Start watching live TV or listening to radio, and your recently played streams will appear here.'}
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setCurrentTab('tv')}
              className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md shadow-amber-500/20"
            >
              <span>Explore Live TV</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setCurrentTab('radio')}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <span>Explore Radio</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
