import React, { Suspense, lazy, useEffect, useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/layout/Navbar';
import { TabletSidebar } from './components/layout/TabletSidebar';
import { BottomNav } from './components/layout/BottomNav';
import { Footer } from './components/layout/Footer';
import { HomeScreen } from './components/home/HomeScreen';
import { RadioDockPlayer } from './components/player/RadioDockPlayer';
import { AuthModal } from './components/auth/AuthModal';
import { LegalModal } from './components/legal/LegalModal';
import { OfflineIndicator } from './components/common/PWAInstallButton';
import { getDeviceRuntimeProfile } from './services/devicePerformance';

const LiveTVSection = lazy(() =>
  import('./components/tv/LiveTVSection').then((m) => ({ default: m.LiveTVSection }))
);
const CricketHubSection = lazy(() =>
  import('./components/cricket/CricketHubSection').then((m) => ({ default: m.CricketHubSection }))
);
const IptvPlayerSection = lazy(() =>
  import('./components/iptv/IptvPlayerSection').then((m) => ({ default: m.IptvPlayerSection }))
);
const PublicIptvSourcesSection = lazy(() =>
  import('./components/iptv/PublicIptvSourcesSection').then((m) => ({ default: m.PublicIptvSourcesSection }))
);
const RadioSection = lazy(() =>
  import('./components/radio/RadioSection').then((m) => ({ default: m.RadioSection }))
);
const CountryDirectorySection = lazy(() =>
  import('./components/country/CountryDirectorySection').then((m) => ({ default: m.CountryDirectorySection }))
);
const WebDictionarySection = lazy(() =>
  import('./components/dictionary/WebDictionarySection').then((m) => ({ default: m.WebDictionarySection }))
);
const OttSection = lazy(() =>
  import('./components/ott/OttSection').then((m) => ({ default: m.OttSection }))
);
const Adult18Section = lazy(() =>
  import('./components/adult/Adult18Section').then((m) => ({ default: m.Adult18Section }))
);
const FavoritesSection = lazy(() =>
  import('./components/favorites/FavoritesSection').then((m) => ({ default: m.FavoritesSection }))
);
const SearchSection = lazy(() =>
  import('./components/search/SearchSection').then((m) => ({ default: m.SearchSection }))
);
const AdminDashboard = lazy(() =>
  import('./components/admin/AdminDashboard').then((m) => ({ default: m.AdminDashboard }))
);

const SectionLoader: React.FC = () => (
  <div className="space-y-4 py-6 animate-pulse" aria-busy="true" aria-label="Loading section">
    <div className="h-8 w-56 rounded-xl bg-slate-800/80" />
    <div className="h-4 w-80 max-w-full rounded-lg bg-slate-900" />
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
      <div className="h-48 rounded-2xl bg-slate-900/90 border border-slate-800/60" />
      <div className="h-48 rounded-2xl bg-slate-900/90 border border-slate-800/60" />
      <div className="h-48 rounded-2xl bg-slate-900/90 border border-slate-800/60 hidden lg:block" />
    </div>
  </div>
);

const MainContent: React.FC = () => {
  const { currentTab } = useApp();

  return (
    <main className="flex-1 min-w-0 max-w-[1600px] w-full mx-auto px-3 sm:px-5 lg:px-6 xl:px-8 pt-4 sm:pt-5 pb-28 md:pb-20">
      <Suspense fallback={<SectionLoader />}>
        {currentTab === 'home' && <HomeScreen />}
        {currentTab === 'tv' && <LiveTVSection />}
        {currentTab === 'cricket' && <CricketHubSection />}
        {currentTab === 'iptv' && <IptvPlayerSection />}
        {currentTab === 'public_iptv' && <PublicIptvSourcesSection />}
        {currentTab === 'radio' && <RadioSection />}
        {currentTab === 'countries' && <CountryDirectorySection />}
        {currentTab === 'dictionary' && <WebDictionarySection />}
        {currentTab === 'ott' && <OttSection />}
        {currentTab === 'adult18' && <Adult18Section />}
        {currentTab === 'favorites' && <FavoritesSection />}
        {currentTab === 'search' && <SearchSection />}
        {currentTab === 'admin' && <AdminDashboard />}
      </Suspense>
    </main>
  );
};

export default function App() {
  const [isTabletSidebarExpanded, setIsTabletSidebarExpanded] = useState(false);

  useEffect(() => {
    const profile = getDeviceRuntimeProfile();
    if (profile.shouldReduceAnimations) {
      document.documentElement.classList.add('reduce-motion');
    } else {
      document.documentElement.classList.remove('reduce-motion');
    }
  }, []);

  return (
    <AppProvider>
      <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 transition-colors overflow-x-clip">
        {/* Top Navigation */}
        <Navbar
          isTabletSidebarExpanded={isTabletSidebarExpanded}
          onToggleTabletSidebar={() => setIsTabletSidebarExpanded((prev) => !prev)}
        />

        {/* Responsive Shell: Tablet Side Rail + Main Content */}
        <div className="flex-1 flex min-w-0">
          <TabletSidebar
            expanded={isTabletSidebarExpanded}
            onToggleExpand={() => setIsTabletSidebarExpanded((prev) => !prev)}
          />
          <MainContent />
        </div>

        {/* Docked Floating Radio Player (Stays alive across all tab transitions) */}
        <RadioDockPlayer />

        {/* Global Modals */}
        <AuthModal />
        <LegalModal />

        {/* Footer */}
        <Footer />

        {/* Mobile Bottom Navigation Bar */}
        <BottomNav />

        {/* PWA Offline Mode Indicator */}
        <OfflineIndicator />
      </div>
    </AppProvider>
  );
}
