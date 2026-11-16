import React, { useState } from 'react';
import {
  Home,
  Tv,
  Radio,
  ListVideo,
  LayoutGrid,
  Trophy,
  Globe,
  MapPin,
  BookOpen,
  MonitorPlay,
  Heart,
  Search,
  ShieldAlert,
  Shield,
  Scale,
  User,
  X,
} from 'lucide-react';
import { useApp, AppTab } from '../../context/AppContext';

interface PrimaryNavItem {
  id: AppTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface DrawerSectionItem {
  id: AppTab;
  label: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  accentClass?: string;
  badge?: number;
}

export const BottomNav: React.FC = () => {
  const { currentTab, setCurrentTab, user, setIsAuthModalOpen, setIsLegalModalOpen } = useApp();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const primaryItems: PrimaryNavItem[] = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'tv', label: 'Live TV', icon: Tv },
    { id: 'iptv', label: 'IPTV', icon: ListVideo },
    { id: 'radio', label: 'Radio', icon: Radio },
  ];

  const isDrawerTabActive = ![...primaryItems.map((i) => i.id)].includes(currentTab);

  const allSections: DrawerSectionItem[] = [
    { id: 'cricket', label: 'Cricket Hub', subtitle: 'Matches & audio', icon: Trophy, accentClass: 'text-emerald-400' },
    { id: 'public_iptv', label: 'Open IPTV', subtitle: 'Public playlists', icon: Globe, accentClass: 'text-sky-400' },
    { id: 'countries', label: 'Countries', subtitle: 'Browse by nation', icon: MapPin, accentClass: 'text-amber-400' },
    { id: 'dictionary', label: 'Web Dictionary', subtitle: 'All directories', icon: BookOpen, accentClass: 'text-indigo-400' },
    { id: 'ott', label: 'OTT & YouTube', subtitle: 'Free platforms', icon: MonitorPlay, accentClass: 'text-purple-400' },
    { id: 'favorites', label: 'Favorites', subtitle: 'Saved streams', icon: Heart, accentClass: 'text-rose-400', badge: user.favorites.length },
    { id: 'search', label: 'Search All', subtitle: 'TV & Radio finder', icon: Search, accentClass: 'text-amber-400' },
    { id: 'adult18', label: '18+ Vault', subtitle: 'Age-gated zone', icon: ShieldAlert, accentClass: 'text-rose-400' },
    { id: 'admin', label: 'Admin Console', subtitle: 'Catalog & tools', icon: Shield, accentClass: 'text-slate-300' },
  ];

  const handleSelectTab = (tab: AppTab) => {
    setCurrentTab(tab);
    setIsDrawerOpen(false);
  };

  return (
    <>
      {/* Slide-Up Mobile More Sections Drawer */}
      {isDrawerOpen && (
        <div
          className="md:hidden fixed inset-0 z-50 flex items-end bg-black/75 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={() => setIsDrawerOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="All Sections Menu"
        >
          <div
            className="w-full bg-slate-950 border-t border-slate-800 rounded-t-3xl shadow-2xl max-h-[82dvh] overflow-y-auto px-4 pt-3 pb-[calc(1.5rem+env(safe-area-inset-bottom))]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drag Indicator & Header */}
            <div className="w-10 h-1 bg-slate-700 rounded-full mx-auto mb-3" />
            <div className="flex items-center justify-between gap-3 pb-3 mb-3 border-b border-slate-800/80">
              <div>
                <h2 className="font-display text-base font-bold text-white">All Sections</h2>
                <p className="text-xs text-slate-400">One-tap access across Free TV &amp; Radio Live</p>
              </div>
              <button
                onClick={() => setIsDrawerOpen(false)}
                aria-label="Close sections menu"
                className="min-w-[44px] min-h-[44px] rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Section Tiles Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mb-4">
              {allSections.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelectTab(item.id)}
                    className={`min-h-[56px] p-3 rounded-2xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                      isActive
                        ? 'bg-amber-500/15 border-amber-500/50 text-white'
                        : 'bg-slate-900/90 border-slate-800 hover:border-slate-700 text-slate-200'
                    }`}
                  >
                    <div className="relative w-9 h-9 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center shrink-0">
                      <Icon className={`w-4.5 h-4.5 ${isActive ? 'text-amber-400' : item.accentClass || 'text-slate-300'}`} />
                      {item.badge !== undefined && item.badge > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 min-w-4 h-4 px-1 bg-amber-500 text-slate-950 text-[9px] font-black rounded-full flex items-center justify-center">
                          {item.badge > 99 ? '99+' : item.badge}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold truncate">{item.label}</div>
                      <div className="text-[11px] text-slate-400 truncate">{item.subtitle}</div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Quick Account & Legal Row */}
            <div className="grid grid-cols-2 gap-2.5 pt-3 border-t border-slate-800/80">
              <button
                onClick={() => {
                  setIsDrawerOpen(false);
                  setIsAuthModalOpen(true);
                }}
                className="min-h-[48px] px-3.5 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
              >
                <User className="w-4 h-4 shrink-0" />
                <span className="truncate">
                  {user.role === 'guest' ? 'Account & Permissions' : `${user.name.split(' ')[0]} • Permissions`}
                </span>
              </button>
              <button
                onClick={() => {
                  setIsDrawerOpen(false);
                  setIsLegalModalOpen(true);
                }}
                className="min-h-[48px] px-3.5 py-2.5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer"
              >
                <Scale className="w-4 h-4 shrink-0 text-slate-400" />
                <span>Privacy &amp; DMCA</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fixed 5-Tab Bottom Navigation Bar */}
      <nav
        aria-label="Mobile Navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-slate-950/95 border-t border-slate-800/80 backdrop-blur-lg pb-[env(safe-area-inset-bottom)]"
      >
        <div className="grid grid-cols-5 h-16 items-center px-1">
          {primaryItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelectTab(item.id)}
                aria-current={isActive ? 'page' : undefined}
                className="relative flex flex-col items-center justify-center h-full min-h-[48px] min-w-[44px] text-center group cursor-pointer focus:outline-none"
              >
                <Icon
                  className={`w-5 h-5 transition-transform duration-200 ${
                    isActive ? 'text-amber-400 scale-110' : 'text-slate-400 group-hover:text-slate-200'
                  }`}
                />
                <span
                  className={`text-[11px] font-medium tracking-tight mt-1 transition-colors ${
                    isActive ? 'text-amber-400 font-semibold' : 'text-slate-400 group-hover:text-slate-300'
                  }`}
                >
                  {item.label}
                </span>
                {isActive && <span className="absolute bottom-1 w-1.5 h-1 bg-amber-400 rounded-full" />}
              </button>
            );
          })}

          {/* 5th Tab: More Menu (opens drawer with all remaining 9 sections) */}
          <button
            onClick={() => setIsDrawerOpen((prev) => !prev)}
            aria-expanded={isDrawerOpen}
            aria-label="Open all sections menu"
            className="relative flex flex-col items-center justify-center h-full min-h-[48px] min-w-[44px] text-center group cursor-pointer focus:outline-none"
          >
            <div className="relative">
              <LayoutGrid
                className={`w-5 h-5 transition-transform duration-200 ${
                  isDrawerOpen || isDrawerTabActive
                    ? 'text-amber-400 scale-110'
                    : 'text-slate-400 group-hover:text-slate-200'
                }`}
              />
              {user.favorites.length > 0 && (
                <span className="absolute -top-1.5 -right-2 min-w-4 h-4 px-1 bg-amber-500 text-slate-950 text-[9px] font-black rounded-full flex items-center justify-center">
                  {user.favorites.length > 99 ? '99+' : user.favorites.length}
                </span>
              )}
            </div>
            <span
              className={`text-[11px] font-medium tracking-tight mt-1 transition-colors ${
                isDrawerOpen || isDrawerTabActive
                  ? 'text-amber-400 font-semibold'
                  : 'text-slate-400 group-hover:text-slate-300'
              }`}
            >
              More
            </span>
            {isDrawerTabActive && <span className="absolute bottom-1 w-1.5 h-1 bg-amber-400 rounded-full" />}
          </button>
        </div>
      </nav>
    </>
  );
};
