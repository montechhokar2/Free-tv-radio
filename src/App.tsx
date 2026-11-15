import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/layout/Navbar';
import { BottomNav } from './components/layout/BottomNav';
import { Footer } from './components/layout/Footer';
import { HomeScreen } from './components/home/HomeScreen';
import { LiveTVSection } from './components/tv/LiveTVSection';
import { CricketHubSection } from './components/cricket/CricketHubSection';
import { IptvPlayerSection } from './components/iptv/IptvPlayerSection';
import { PublicIptvSourcesSection } from './components/iptv/PublicIptvSourcesSection';
import { RadioSection } from './components/radio/RadioSection';
import { FavoritesSection } from './components/favorites/FavoritesSection';
import { SearchSection } from './components/search/SearchSection';
import { WebDictionarySection } from './components/dictionary/WebDictionarySection';
import { CountryDirectorySection } from './components/country/CountryDirectorySection';
import { OttSection } from './components/ott/OttSection';
import { Adult18Section } from './components/adult/Adult18Section';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { RadioDockPlayer } from './components/player/RadioDockPlayer';
import { AuthModal } from './components/auth/AuthModal';
import { LegalModal } from './components/legal/LegalModal';
import { OfflineIndicator } from './components/common/PWAInstallButton';

const MainContent: React.FC = () => {
  const { currentTab } = useApp();

  return (
    <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-24 md:pb-16">
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
    </main>
  );
};

export default function App() {
  return (
    <AppProvider>
      <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 transition-colors">
        {/* Top Navigation */}
        <Navbar />

        {/* Dynamic Route/Tab Content */}
        <MainContent />

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
