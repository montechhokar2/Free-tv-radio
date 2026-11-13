import React from 'react';
import { Home, Tv, Radio, Heart, Globe, ListVideo } from 'lucide-react';
import { useApp, AppTab } from '../../context/AppContext';

interface NavItem {
  id: AppTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

export const BottomNav: React.FC = () => {
  const { currentTab, setCurrentTab, user } = useApp();

  const navItems: NavItem[] = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'tv', label: 'Live TV', icon: Tv },
    { id: 'iptv', label: 'IPTV/EPG', icon: ListVideo },
    { id: 'countries', label: 'Countries', icon: Globe },
    { id: 'radio', label: 'Radio', icon: Radio },
    { id: 'favorites', label: 'Saved', icon: Heart, badge: user.favorites.length },
  ];

  return (
    <nav 
      aria-label="Mobile Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-slate-950/95 border-t border-slate-800/80 backdrop-blur-lg pb-[env(safe-area-inset-bottom)]"
    >
      <div className="grid grid-cols-6 h-16 items-center px-1">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              className="relative flex flex-col items-center justify-center h-full min-h-[44px] min-w-[44px] text-center group cursor-pointer focus:outline-none"
            >
              <div className="relative">
                <Icon 
                  className={`w-5 h-5 transition-transform duration-200 ${
                    isActive ? 'text-amber-400 scale-110' : 'text-slate-400 group-hover:text-slate-200'
                  }`} 
                />
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -top-1.5 -right-2 min-w-4 h-4 px-1 bg-amber-500 text-slate-950 text-[9px] font-black rounded-full flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
              </div>
              <span 
                className={`text-[10px] font-medium tracking-tight mt-1 transition-colors ${
                  isActive ? 'text-amber-400 font-semibold' : 'text-slate-400 group-hover:text-slate-300'
                }`}
              >
                {item.label}
              </span>
              {isActive && (
                <span className="absolute bottom-1 w-1 h-1 bg-amber-400 rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
