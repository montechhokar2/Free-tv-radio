import React from 'react';
import { Tv, Trophy, Globe, Shield, ShieldAlert, Sun, Moon, User, Search, Menu } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { PWAInstallButton } from '../common/PWAInstallButton';

interface NavbarProps {
  onToggleTabletSidebar?: () => void;
  isTabletSidebarExpanded?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  onToggleTabletSidebar,
  isTabletSidebarExpanded = false,
}) => {
  const {
    currentTab,
    setCurrentTab,
    theme,
    toggleTheme,
    user,
    setIsAuthModalOpen,
  } = useApp();

  return (
    <header className="sticky top-0 z-30 bg-slate-950/90 dark:bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 transition-colors pt-[env(safe-area-inset-top)]">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-4">
        {/* Zone 1: Brand Wordmark & Tablet Sidebar Toggle */}
        <div className="flex items-center gap-2 min-w-0">
          {onToggleTabletSidebar && (
            <button
              onClick={onToggleTabletSidebar}
              aria-label={isTabletSidebarExpanded ? 'Collapse tablet menu' : 'Expand tablet menu'}
              className="hidden md:flex xl:hidden min-w-[44px] min-h-[44px] rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-amber-400 items-center justify-center transition-colors cursor-pointer shrink-0"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          <button
            onClick={() => setCurrentTab('home')}
            className="flex items-center gap-2 sm:gap-2.5 text-left min-w-0 group cursor-pointer focus:outline-none min-h-[44px]"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-600 via-amber-500 to-yellow-400 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform shrink-0">
              <Tv className="w-5 h-5 text-slate-950" />
            </div>
            <span className="font-display text-sm sm:text-lg font-bold tracking-tight text-white group-hover:text-amber-400 transition-colors truncate">
              Free TV &amp; Radio Live
            </span>
          </button>
        </div>

        {/* Zone 2: Desktop (xl+) single-line navigation */}
        <nav aria-label="Primary Navigation" className="hidden xl:flex items-center gap-3 text-sm font-medium overflow-x-auto scrollbar-none">
          <button
            onClick={() => setCurrentTab('home')}
            className={`whitespace-nowrap shrink-0 transition-colors cursor-pointer py-1 ${
              currentTab === 'home'
                ? 'text-amber-400 font-semibold border-b-2 border-amber-400'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            Home
          </button>
          <button
            onClick={() => setCurrentTab('tv')}
            className={`whitespace-nowrap shrink-0 transition-colors cursor-pointer py-1 ${
              currentTab === 'tv'
                ? 'text-amber-400 font-semibold border-b-2 border-amber-400'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            Live TV
          </button>
          <button
            onClick={() => setCurrentTab('cricket')}
            className={`whitespace-nowrap shrink-0 transition-colors cursor-pointer py-1 flex items-center gap-1 ${
              currentTab === 'cricket'
                ? 'text-emerald-400 font-semibold border-b-2 border-emerald-400'
                : 'text-emerald-300/90 hover:text-emerald-300'
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>Cricket Hub</span>
          </button>
          <button
            onClick={() => setCurrentTab('iptv')}
            className={`whitespace-nowrap shrink-0 transition-colors cursor-pointer py-1 ${
              currentTab === 'iptv'
                ? 'text-amber-400 font-semibold border-b-2 border-amber-400'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            IPTV &amp; EPG
          </button>
          <button
            onClick={() => setCurrentTab('public_iptv')}
            className={`whitespace-nowrap shrink-0 transition-colors cursor-pointer py-1 flex items-center gap-1 ${
              currentTab === 'public_iptv'
                ? 'text-sky-400 font-semibold border-b-2 border-sky-400'
                : 'text-sky-300/90 hover:text-sky-300'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Open IPTV</span>
          </button>
          <button
            onClick={() => setCurrentTab('radio')}
            className={`whitespace-nowrap shrink-0 transition-colors cursor-pointer py-1 ${
              currentTab === 'radio'
                ? 'text-amber-400 font-semibold border-b-2 border-amber-400'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            Radio
          </button>
          <button
            onClick={() => setCurrentTab('countries')}
            className={`whitespace-nowrap shrink-0 transition-colors cursor-pointer py-1 ${
              currentTab === 'countries'
                ? 'text-amber-400 font-semibold border-b-2 border-amber-400'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            Countries
          </button>
          <button
            onClick={() => setCurrentTab('dictionary')}
            className={`whitespace-nowrap shrink-0 transition-colors cursor-pointer py-1 ${
              currentTab === 'dictionary'
                ? 'text-amber-400 font-semibold border-b-2 border-amber-400'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            Dictionary
          </button>
          <button
            onClick={() => setCurrentTab('ott')}
            className={`whitespace-nowrap shrink-0 transition-colors cursor-pointer py-1 ${
              currentTab === 'ott'
                ? 'text-amber-400 font-semibold border-b-2 border-amber-400'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            OTT &amp; YouTube
          </button>
          <button
            onClick={() => setCurrentTab('adult18')}
            className={`whitespace-nowrap shrink-0 transition-colors cursor-pointer py-1 flex items-center gap-1 ${
              currentTab === 'adult18'
                ? 'text-rose-400 font-semibold border-b-2 border-rose-400'
                : 'text-rose-300/80 hover:text-rose-300'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>18+</span>
          </button>
          <button
            onClick={() => setCurrentTab('favorites')}
            className={`whitespace-nowrap shrink-0 transition-colors cursor-pointer py-1 flex items-center gap-1.5 ${
              currentTab === 'favorites'
                ? 'text-amber-400 font-semibold border-b-2 border-amber-400'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <span>Favorites</span>
            {user.favorites.length > 0 && (
              <span className="px-1.5 py-0.2 bg-amber-500/20 text-amber-400 text-[10px] font-bold rounded-full">
                {user.favorites.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setCurrentTab('search')}
            className={`whitespace-nowrap shrink-0 transition-colors cursor-pointer py-1 flex items-center gap-1 ${
              currentTab === 'search'
                ? 'text-amber-400 font-semibold border-b-2 border-amber-400'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>Search</span>
          </button>
          <button
            onClick={() => setCurrentTab('admin')}
            className={`whitespace-nowrap shrink-0 transition-colors cursor-pointer py-1 flex items-center gap-1 ${
              currentTab === 'admin'
                ? 'text-amber-400 font-semibold border-b-2 border-amber-400'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Admin</span>
          </button>
        </nav>

        {/* Zone 3: Quick actions (44px+ touch targets) */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Quick Search button on mobile & tablet */}
          <button
            onClick={() => setCurrentTab('search')}
            aria-label="Search channels and radio"
            title="Search Channels & Radio"
            className={`xl:hidden min-w-[44px] min-h-[44px] rounded-xl border flex items-center justify-center transition-colors cursor-pointer ${
              currentTab === 'search'
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-amber-400'
            }`}
          >
            <Search className="w-4 h-4" />
          </button>

          <PWAInstallButton />

          {/* Quick theme toggle */}
          <button
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            className="min-w-[44px] min-h-[44px] rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-amber-400 flex items-center justify-center transition-colors cursor-pointer"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* User profile / Login button */}
          <button
            onClick={() => setIsAuthModalOpen(true)}
            aria-label="Account and Permissions"
            className="flex items-center justify-center gap-2 min-w-[44px] min-h-[44px] px-2.5 sm:px-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-semibold shadow-md shadow-amber-500/10 transition-all cursor-pointer whitespace-nowrap shrink-0"
          >
            <User className="w-4 h-4" />
            <span className="hidden sm:inline">
              {user.role === 'guest' ? 'Sign In' : user.name.split(' ')[0]}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};
