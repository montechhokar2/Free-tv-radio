import React from 'react';
import {
  Home,
  Tv,
  Trophy,
  ListVideo,
  Globe,
  Radio,
  MapPin,
  BookOpen,
  MonitorPlay,
  ShieldAlert,
  Heart,
  Search,
  Shield,
  Scale,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { useApp, AppTab } from '../../context/AppContext';

interface TabletSidebarProps {
  expanded: boolean;
  onToggleExpand: () => void;
}

interface SidebarNavItem {
  id: AppTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  accentClass?: string;
  badge?: number;
}

export const TabletSidebar: React.FC<TabletSidebarProps> = ({ expanded, onToggleExpand }) => {
  const { currentTab, setCurrentTab, user, setIsLegalModalOpen } = useApp();

  const coreItems: SidebarNavItem[] = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'tv', label: 'Live TV', icon: Tv },
    { id: 'cricket', label: 'Cricket Hub', icon: Trophy, accentClass: 'text-emerald-400' },
    { id: 'iptv', label: 'IPTV & EPG', icon: ListVideo },
    { id: 'public_iptv', label: 'Open IPTV', icon: Globe, accentClass: 'text-sky-400' },
    { id: 'radio', label: 'Live Radio', icon: Radio },
  ];

  const discoveryItems: SidebarNavItem[] = [
    { id: 'countries', label: 'Countries', icon: MapPin },
    { id: 'dictionary', label: 'Web Dictionary', icon: BookOpen },
    { id: 'ott', label: 'OTT & YouTube', icon: MonitorPlay },
    { id: 'favorites', label: 'Favorites', icon: Heart, badge: user.favorites.length },
    { id: 'search', label: 'Search', icon: Search },
  ];

  const systemItems: SidebarNavItem[] = [
    { id: 'adult18', label: '18+ Vault', icon: ShieldAlert, accentClass: 'text-rose-400' },
    { id: 'admin', label: 'Admin Console', icon: Shield },
  ];

  const renderGroup = (title: string, items: SidebarNavItem[]) => (
    <div className="space-y-1">
      {expanded && (
        <div className="px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
          {title}
        </div>
      )}
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = currentTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => setCurrentTab(item.id)}
            title={item.label}
            aria-label={item.label}
            aria-current={isActive ? 'page' : undefined}
            className={`w-full min-h-[44px] flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all cursor-pointer ${
              expanded ? 'justify-start' : 'justify-center'
            } ${
              isActive
                ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30 font-semibold shadow-sm'
                : 'text-slate-300 hover:bg-slate-900 hover:text-white border border-transparent'
            }`}
          >
            <div className="relative shrink-0">
              <Icon
                className={`w-5 h-5 ${
                  isActive ? 'text-amber-400' : item.accentClass || 'text-slate-400'
                }`}
              />
              {!expanded && item.badge !== undefined && item.badge > 0 && (
                <span className="absolute -top-1.5 -right-2 min-w-4 h-4 px-1 bg-amber-500 text-slate-950 text-[9px] font-black rounded-full flex items-center justify-center">
                  {item.badge > 99 ? '99+' : item.badge}
                </span>
              )}
            </div>
            {expanded && (
              <span className="truncate flex-1 text-left">{item.label}</span>
            )}
            {expanded && item.badge !== undefined && item.badge > 0 && (
              <span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-400 text-[10px] font-bold rounded-full shrink-0">
                {item.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );

  return (
    <aside
      aria-label="Tablet Side Navigation"
      className={`hidden md:flex xl:hidden flex-col shrink-0 bg-slate-950/95 border-r border-slate-800/80 transition-all duration-200 sticky top-16 h-[calc(100dvh-4rem)] z-20 ${
        expanded ? 'w-60' : 'w-[72px]'
      }`}
    >
      <div className="flex items-center justify-between px-3 py-3 border-b border-slate-800/60">
        {expanded && (
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 pl-1">
            Sections
          </span>
        )}
        <button
          onClick={onToggleExpand}
          aria-label={expanded ? 'Collapse side navigation' : 'Expand side navigation'}
          title={expanded ? 'Collapse navigation' : 'Expand navigation'}
          className={`min-w-[44px] min-h-[44px] rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-amber-400 flex items-center justify-center transition-colors cursor-pointer ${
            expanded ? '' : 'mx-auto'
          }`}
        >
          {expanded ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-4 scrollbar-none">
        {renderGroup('Watch & Listen', coreItems)}
        <div className="border-t border-slate-800/60 pt-2">
          {renderGroup('Explore', discoveryItems)}
        </div>
        <div className="border-t border-slate-800/60 pt-2">
          {renderGroup('Controls', systemItems)}
        </div>
      </div>

      <div className="p-2 border-t border-slate-800/60">
        <button
          onClick={() => setIsLegalModalOpen(true)}
          title="Privacy, DMCA & Legal"
          aria-label="Privacy, DMCA and Legal"
          className={`w-full min-h-[44px] flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-medium text-slate-400 hover:bg-slate-900 hover:text-slate-200 transition-colors cursor-pointer ${
            expanded ? 'justify-start' : 'justify-center'
          }`}
        >
          <Scale className="w-4 h-4 shrink-0" />
          {expanded && <span className="truncate">Privacy &amp; Legal</span>}
        </button>
      </div>
    </aside>
  );
};
