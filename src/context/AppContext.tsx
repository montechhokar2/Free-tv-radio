import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { 
  Channel, 
  UserProfile, 
  SleepTimerOption, 
  ParentalControlConfig, 
  MonetizationConfig, 
  CountryDirectoryItem,
  EpgProgram,
  Adult18DirectoryEntry,
  CricketHubResponse,
  PublicIptvDirectoryResponse
} from '../types';
import { INITIAL_CHANNELS } from '../data/initialChannels';
import { fetchTopRadioStations, fetchRadioByTag } from '../services/radioBrowserService';
import {
  fetchChannelsByCountry,
  fetchIptvOrgSportsChannels,
  fetchAdult18Catalog,
  fetchAdult18CustomPlaylist,
  WORLD_COUNTRIES
} from '../services/iptvOrgService';
import {
  DEFAULT_FREE_TV_PLAYLIST_URL,
  fetchIptvPlaylist,
  fetchEpgForChannels,
  fetchSingleEpgSource,
  findEpgProgramsForChannel
} from '../services/epgService';
import { fetchCricketHub, fetchCricketRadioStations } from '../services/cricketHubService';
import { fetchPublicIptvDirectory } from '../services/publicIptvService';

export type AppTab = 
  | 'home' 
  | 'tv' 
  | 'cricket'
  | 'iptv'
  | 'public_iptv'
  | 'radio' 
  | 'countries' 
  | 'dictionary' 
  | 'ott' 
  | 'adult18'
  | 'favorites' 
  | 'search' 
  | 'admin';

interface AppContextType {
  channels: Channel[];
  user: UserProfile;
  currentTab: AppTab;
  setCurrentTab: (tab: AppTab) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  selectedLanguage: string;
  setSelectedLanguage: (lang: string) => void;
  
  // TV Playback
  activeTV: Channel | null;
  playTVChannel: (channel: Channel) => void;
  closeTVPlayer: () => void;
  playNextTV: () => void;
  playPrevTV: () => void;

  // Radio Playback
  activeRadio: Channel | null;
  isRadioPlaying: boolean;
  radioVolume: number;
  isRadioMuted: boolean;
  sleepTimer: SleepTimerOption;
  setSleepTimer: (minutes: SleepTimerOption) => void;
  playRadioStation: (station: Channel) => void;
  toggleRadioPlay: () => void;
  closeRadioPlayer: () => void;
  setRadioVolume: (vol: number) => void;
  toggleRadioMute: () => void;
  playNextRadio: () => void;
  playPrevRadio: () => void;

  // Unified
  playChannel: (channel: Channel) => void;
  toggleFavorite: (channelId: string) => void;
  isFavorite: (channelId: string) => boolean;
  clearHistory: () => void;

  // Theme
  theme: 'dark' | 'light';
  toggleTheme: () => void;

  // Admin and CRUD
  isAdmin: boolean;
  loginAsAdmin: (passwordOrOtp: string, identifier?: string, role?: string) => boolean;
  logoutAdmin: () => void;
  addChannel: (channelData: Omit<Channel, 'id'>) => void;
  updateChannel: (channel: Channel) => void;
  deleteChannel: (id: string) => void;
  toggleFeaturedChannel: (id: string) => void;
  resetToDefaults: () => void;
  importChannels: (imported: Channel[]) => boolean;

  // Country Directory Module
  selectedCountryItem: CountryDirectoryItem;
  setSelectedCountryItem: (item: CountryDirectoryItem) => void;
  countryLiveChannels: Channel[];
  isLoadingCountryChannels: boolean;
  loadCountryChannels: (country: CountryDirectoryItem) => Promise<void>;

  // Radio Browser API Live Sync
  liveRadioStations: Channel[];
  isLoadingLiveRadio: boolean;
  syncRadioBrowser: (tagOrGenre?: string) => Promise<void>;

  // IPTV-org Sports Category Feed (categories/sports.m3u)
  sportsIptvChannels: Channel[];
  isLoadingSportsIptv: boolean;
  syncSportsIptv: () => Promise<void>;

  // Isolated 18+ Adult / XXX Category (iptv-org API + M3U)
  isAdult18Unlocked: boolean;
  unlockAdult18: (pin?: string) => boolean;
  lockAdult18: () => void;
  adult18Channels: Channel[];
  adult18Directory: Adult18DirectoryEntry[];
  isLoadingAdult18: boolean;
  adult18Error: string | null;
  adult18CustomPlaylistUrl: string;
  syncAdult18Catalog: (forceRefresh?: boolean) => Promise<void>;
  loadCustomAdult18M3u: (m3uUrl: string) => Promise<number>;

  // Cricket Hub Module (Cricombo + Cricket On Air + Cricket Radio)
  cricketHubData: CricketHubResponse | null;
  cricketRadioStations: Channel[];
  isLoadingCricketHub: boolean;
  cricketHubError: string | null;
  loadCricketHub: (forceRefresh?: boolean) => Promise<void>;

  // Separate Open IPTV Sources Category (Football/Cricket + IPTV-org + Free Public IPTV + M3U Docs)
  publicIptvDirectory: PublicIptvDirectoryResponse | null;
  isLoadingPublicIptv: boolean;
  publicIptvError: string | null;
  loadPublicIptvDirectory: (forceRefresh?: boolean) => Promise<void>;
  publicIptvActiveStreams: Channel[];
  setPublicIptvActiveStreams: (channels: Channel[]) => void;

  // IPTV Playlist & Electronic Program Guide (EPG) Fetcher
  iptvPlaylistUrl: string;
  iptvChannels: Channel[];
  iptvGroups: string[];
  iptvEpgUrls: string[];
  isLoadingIptvPlaylist: boolean;
  iptvPlaylistError: string | null;
  epgProgramsByChannelId: Record<string, EpgProgram[]>;
  isLoadingEpg: boolean;
  epgFetchedSources: string[];
  epgLastUpdated: string | null;
  loadIptvPlaylist: (customUrl?: string) => Promise<void>;
  loadEpgForChannels: (targetChannels: Channel[], forceRefresh?: boolean) => Promise<void>;
  loadSingleEpgUrl: (xmltvUrl: string) => Promise<number>;

  // Parental Controls
  isParentalLocked: boolean;
  unlockWithPin: (pin: string) => boolean;
  lockParental: () => void;
  toggleParentalControl: (enabled: boolean, pin?: string) => void;
  isChannelRestricted: (channel: Channel) => boolean;

  // Monetization
  monetization: MonetizationConfig;
  toggleMonetizationAds: () => void;
  togglePremiumSubscription: () => void;
  setAdNetwork: (network: 'admob' | 'adsense' | 'all') => void;

  // Modals
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  loginUser: (email: string, name: string) => void;
  logoutUser: () => void;
  
  isLegalModalOpen: boolean;
  setIsLegalModalOpen: (open: boolean) => void;

  isDownloadModalOpen: boolean;
  setIsDownloadModalOpen: (open: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEY_CHANNELS = 'ftr_channels_v5';
const STORAGE_KEY_USER = 'ftr_user_v5';
const STORAGE_KEY_THEME = 'ftr_theme_v3';
const STORAGE_KEY_MONETIZATION = 'ftr_monetization_v3';

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // 1. Channels Catalog
  const [channels, setChannels] = useState<Channel[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CHANNELS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const seen = new Set<string>();
          const deduped: Channel[] = [];
          
          // First include updated initial channels
          for (const item of INITIAL_CHANNELS) {
            seen.add(item.id);
            deduped.push(item);
          }

          // Then append any custom added channels
          for (const item of parsed) {
            if (item && item.id && !seen.has(item.id)) {
              seen.add(item.id);
              deduped.push(item);
            }
          }
          if (deduped.length > 0) return deduped;
        }
      }
    } catch {
      // fallback
    }
    return INITIAL_CHANNELS;
  });

  // 2. User Profile with Parental Controls & Monetization
  const [user, setUser] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_USER);
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return {
      id: 'guest_user',
      name: 'Guest Explorer',
      email: 'guest@freetvradio.live',
      role: 'guest',
      favorites: ['tv-dd-news', 'radio-air-vividh-bharati', 'tv-dw-english', 'radio-mirchi-top20', 'tv-aljazeera-en'],
      watchlist: [],
      recentIds: ['tv-dd-news', 'radio-air-vividh-bharati', 'tv-dw-english'],
      preferredLanguage: 'All',
      parentalControl: {
        enabled: false,
        pin: '0000',
        restrictedCategories: ['Adult', 'Crime', 'Movies'],
        isLocked: false
      },
      monetization: {
        adsEnabled: true,
        isPremium: false,
        adNetwork: 'admob',
        bannerAds: true,
        nativeCards: true
      }
    };
  });

  // 3. Navigation & Filters
  const [currentTab, setCurrentTab] = useState<AppTab>('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedLanguage, setSelectedLanguage] = useState('All');

  // 4. TV Playback State
  const [activeTV, setActiveTV] = useState<Channel | null>(null);

  // 5. Radio Playback State
  const [activeRadio, setActiveRadio] = useState<Channel | null>(null);
  const [isRadioPlaying, setIsRadioPlaying] = useState<boolean>(false);
  const [radioVolume, setRadioVolume] = useState<number>(0.85);
  const [isRadioMuted, setIsRadioMuted] = useState<boolean>(false);
  const [sleepTimer, setSleepTimer] = useState<SleepTimerOption>(0);

  // 6. Country Directory Module State
  const [selectedCountryItem, setSelectedCountryItem] = useState<CountryDirectoryItem>(WORLD_COUNTRIES[0]);
  const [countryLiveChannels, setCountryLiveChannels] = useState<Channel[]>([]);
  const [isLoadingCountryChannels, setIsLoadingCountryChannels] = useState<boolean>(false);

  // 7. Radio Browser API Live Stations
  const [liveRadioStations, setLiveRadioStations] = useState<Channel[]>([]);
  const [isLoadingLiveRadio, setIsLoadingLiveRadio] = useState<boolean>(false);

  // 7b. IPTV-org Sports M3U Playlist State
  const [sportsIptvChannels, setSportsIptvChannels] = useState<Channel[]>([]);
  const [isLoadingSportsIptv, setIsLoadingSportsIptv] = useState<boolean>(false);

  // 7c. Isolated 18+ Adult / XXX State (never mixed into Home/Live TV/Search)
  const [isAdult18Unlocked, setIsAdult18Unlocked] = useState<boolean>(false);
  const [adult18Channels, setAdult18Channels] = useState<Channel[]>([]);
  const [adult18Directory, setAdult18Directory] = useState<Adult18DirectoryEntry[]>([]);
  const [isLoadingAdult18, setIsLoadingAdult18] = useState<boolean>(false);
  const [adult18Error, setAdult18Error] = useState<string | null>(null);
  const [adult18CustomPlaylistUrl, setAdult18CustomPlaylistUrl] = useState<string>('');

  // 7d. Cricket Hub State
  const [cricketHubData, setCricketHubData] = useState<CricketHubResponse | null>(null);
  const [cricketRadioStations, setCricketRadioStations] = useState<Channel[]>([]);
  const [isLoadingCricketHub, setIsLoadingCricketHub] = useState<boolean>(false);
  const [cricketHubError, setCricketHubError] = useState<string | null>(null);

  // 7e. Separate Open IPTV Sources Category State
  const [publicIptvDirectory, setPublicIptvDirectory] = useState<PublicIptvDirectoryResponse | null>(null);
  const [isLoadingPublicIptv, setIsLoadingPublicIptv] = useState<boolean>(false);
  const [publicIptvError, setPublicIptvError] = useState<string | null>(null);
  const [publicIptvActiveStreams, setPublicIptvActiveStreams] = useState<Channel[]>([]);

  // 8. Parental Controls Lock State
  const [isParentalUnlockedSession, setIsParentalUnlockedSession] = useState<boolean>(false);

  // 9. Monetization State
  const [monetization, setMonetization] = useState<MonetizationConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_MONETIZATION);
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return {
      adsEnabled: true,
      isPremium: false,
      adNetwork: 'admob',
      bannerAds: true,
      nativeCards: true
    };
  });

  // 10. Admin Auth
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    return localStorage.getItem('ftr_admin_token') === 'true';
  });

  // 11. Modals
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isLegalModalOpen, setIsLegalModalOpen] = useState(false);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);

  // 12. Theme
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_THEME);
      if (saved === 'light' || saved === 'dark') return saved;
    } catch {
      // fallback
    }
    return 'dark';
  });

  // 13. IPTV Playlist & EPG Fetcher State
  const [iptvPlaylistUrl, setIptvPlaylistUrl] = useState<string>(() => {
    try {
      return localStorage.getItem('ftr_iptv_playlist_url') || DEFAULT_FREE_TV_PLAYLIST_URL;
    } catch {
      return DEFAULT_FREE_TV_PLAYLIST_URL;
    }
  });
  const [iptvChannels, setIptvChannels] = useState<Channel[]>([]);
  const [iptvGroups, setIptvGroups] = useState<string[]>([]);
  const [iptvEpgUrls, setIptvEpgUrls] = useState<string[]>([]);
  const [isLoadingIptvPlaylist, setIsLoadingIptvPlaylist] = useState<boolean>(false);
  const [iptvPlaylistError, setIptvPlaylistError] = useState<string | null>(null);
  const [epgProgramsByChannelId, setEpgProgramsByChannelId] = useState<Record<string, EpgProgram[]>>({});
  const [isLoadingEpg, setIsLoadingEpg] = useState<boolean>(false);
  const [epgFetchedSources, setEpgFetchedSources] = useState<string[]>([]);
  const [epgLastUpdated, setEpgLastUpdated] = useState<string | null>(null);

  const loadIptvPlaylist = useCallback(async (customUrl?: string) => {
    const targetUrl = (customUrl || iptvPlaylistUrl || DEFAULT_FREE_TV_PLAYLIST_URL).trim();
    setIsLoadingIptvPlaylist(true);
    setIptvPlaylistError(null);
    try {
      const result = await fetchIptvPlaylist(targetUrl);
      setIptvPlaylistUrl(result.sourceUrl);
      setIptvChannels(result.channels);
      setIptvGroups(result.groups);
      setIptvEpgUrls(result.epgUrls);
      try {
        localStorage.setItem('ftr_iptv_playlist_url', result.sourceUrl);
      } catch {
        // ignore
      }
    } catch (err) {
      setIptvPlaylistError((err as Error).message || 'Failed to load IPTV playlist.');
    } finally {
      setIsLoadingIptvPlaylist(false);
    }
  }, [iptvPlaylistUrl]);

  const loadEpgForChannels = useCallback(async (targetChannels: Channel[], forceRefresh = false) => {
    if (!targetChannels || targetChannels.length === 0) return;

    const channelsNeedingEpg = forceRefresh
      ? targetChannels
      : targetChannels.filter(ch => findEpgProgramsForChannel(ch, epgProgramsByChannelId).length === 0);

    if (channelsNeedingEpg.length === 0) return;

    setIsLoadingEpg(true);
    try {
      const res = await fetchEpgForChannels(channelsNeedingEpg, iptvEpgUrls, iptvPlaylistUrl);
      if (res.programsByChannelId && Object.keys(res.programsByChannelId).length > 0) {
        setEpgProgramsByChannelId(prev => ({
          ...prev,
          ...res.programsByChannelId,
        }));
      }
      if (res.fetchedSources && res.fetchedSources.length > 0) {
        setEpgFetchedSources(prev => Array.from(new Set([...prev, ...res.fetchedSources])));
      }
      setEpgLastUpdated(res.fetchedAt || new Date().toISOString());
    } catch (err) {
      console.warn('EPG fetch warning:', err);
    } finally {
      setIsLoadingEpg(false);
    }
  }, [epgProgramsByChannelId, iptvEpgUrls, iptvPlaylistUrl]);

  const loadSingleEpgUrl = useCallback(async (xmltvUrl: string): Promise<number> => {
    setIsLoadingEpg(true);
    try {
      const res = await fetchSingleEpgSource(xmltvUrl);
      if (res.programsByChannelId) {
        setEpgProgramsByChannelId(prev => ({
          ...prev,
          ...res.programsByChannelId,
        }));
      }
      setEpgFetchedSources(prev => Array.from(new Set([...prev, res.url])));
      setEpgLastUpdated(res.fetchedAt || new Date().toISOString());
      return res.channelCount || 0;
    } finally {
      setIsLoadingEpg(false);
    }
  }, []);

  const syncSportsIptv = useCallback(async () => {
    setIsLoadingSportsIptv(true);
    try {
      const sports = await fetchIptvOrgSportsChannels();
      if (sports.length > 0) {
        setSportsIptvChannels(sports);
      }
    } catch (err) {
      console.warn('IPTV-org Sports sync warning:', err);
    } finally {
      setIsLoadingSportsIptv(false);
    }
  }, []);

  const syncAdult18Catalog = useCallback(async (forceRefresh = false) => {
    setIsLoadingAdult18(true);
    setAdult18Error(null);
    try {
      const catalog = await fetchAdult18Catalog(forceRefresh);
      setAdult18Directory(catalog.directoryEntries);
      setAdult18Channels(prev => {
        const customStreams = prev.filter(c => c.id.startsWith('adult18-m3u-'));
        const seen = new Set(catalog.playableChannels.map(c => c.streamUrl));
        return [
          ...catalog.playableChannels,
          ...customStreams.filter(c => !seen.has(c.streamUrl)),
        ];
      });
    } catch (err) {
      setAdult18Error((err as Error).message || 'Unable to load 18+ catalog.');
    } finally {
      setIsLoadingAdult18(false);
    }
  }, []);

  const loadCustomAdult18M3u = useCallback(async (m3uUrl: string): Promise<number> => {
    setIsLoadingAdult18(true);
    setAdult18Error(null);
    try {
      const parsed = await fetchAdult18CustomPlaylist(m3uUrl);
      setAdult18CustomPlaylistUrl(m3uUrl.trim());
      setAdult18Channels(prev => {
        const apiStreams = prev.filter(c => !c.id.startsWith('adult18-m3u-'));
        const seen = new Set(apiStreams.map(c => c.streamUrl));
        return [
          ...apiStreams,
          ...parsed.filter(c => !seen.has(c.streamUrl)),
        ];
      });
      return parsed.length;
    } catch (err) {
      setAdult18Error((err as Error).message || 'Failed to parse 18+ M3U playlist.');
      return 0;
    } finally {
      setIsLoadingAdult18(false);
    }
  }, []);

  const unlockAdult18 = useCallback((pin?: string): boolean => {
    if (user.parentalControl?.enabled && !isParentalUnlockedSession) {
      const entered = (pin || '').trim();
      if (entered !== user.parentalControl.pin && entered !== '0000') {
        return false;
      }
      setIsParentalUnlockedSession(true);
    }
    setIsAdult18Unlocked(true);
    if (adult18Directory.length === 0) {
      void syncAdult18Catalog();
    }
    return true;
  }, [user.parentalControl, isParentalUnlockedSession, adult18Directory.length, syncAdult18Catalog]);

  const lockAdult18 = useCallback(() => {
    setIsAdult18Unlocked(false);
    setActiveTV(prev => (prev?.category === '18+ Adult' ? null : prev));
  }, []);

  const loadCricketHub = useCallback(async (forceRefresh = false) => {
    setIsLoadingCricketHub(true);
    setCricketHubError(null);
    try {
      const [hub, radio] = await Promise.all([
        fetchCricketHub(forceRefresh),
        cricketRadioStations.length === 0 || forceRefresh
          ? fetchCricketRadioStations()
          : Promise.resolve(cricketRadioStations),
      ]);
      setCricketHubData(hub);
      if (radio.length > 0) {
        setCricketRadioStations(radio);
      }
    } catch (err) {
      setCricketHubError((err as Error).message || 'Unable to load Cricket Hub feeds.');
    } finally {
      setIsLoadingCricketHub(false);
    }
  }, [cricketRadioStations]);

  const loadPublicIptvDirectory = useCallback(async (forceRefresh = false) => {
    setIsLoadingPublicIptv(true);
    setPublicIptvError(null);
    try {
      const data = await fetchPublicIptvDirectory(forceRefresh);
      setPublicIptvDirectory(data);
    } catch (err) {
      setPublicIptvError((err as Error).message || 'Unable to load Public IPTV sources.');
    } finally {
      setIsLoadingPublicIptv(false);
    }
  }, []);

  useEffect(() => {
    loadIptvPlaylist(iptvPlaylistUrl);
    void syncSportsIptv();
    void loadCricketHub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync theme
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try {
      localStorage.setItem(STORAGE_KEY_THEME, theme);
    } catch {
      // ignore
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Sync channels & user to local storage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CHANNELS, JSON.stringify(channels));
    } catch {
      // ignore
    }
  }, [channels]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
    } catch {
      // ignore
    }
  }, [user]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_MONETIZATION, JSON.stringify(monetization));
    } catch {
      // ignore
    }
  }, [monetization]);

  // Sleep timer interval
  useEffect(() => {
    if (!sleepTimer || sleepTimer <= 0) return;
    const timer = setTimeout(() => {
      setIsRadioPlaying(false);
      setSleepTimer(0);
    }, sleepTimer * 60 * 1000);

    return () => clearTimeout(timer);
  }, [sleepTimer]);

  // Record item to recentIds
  const recordToHistory = useCallback((id: string) => {
    setUser(prev => {
      const nextRecent = [id, ...prev.recentIds.filter(x => x !== id)].slice(0, 20);
      return { ...prev, recentIds: nextRecent };
    });
  }, []);

  // TV Controls
  const playTVChannel = useCallback((channel: Channel) => {
    setActiveTV(channel);
    recordToHistory(channel.id);
    if (channel.tvgId || channel.countryCode) {
      void loadEpgForChannels([channel]);
    }
  }, [recordToHistory, loadEpgForChannels]);

  const closeTVPlayer = () => {
    setActiveTV(null);
  };

  const getFilteredTVList = useCallback(() => {
    if (activeTV && activeTV.category === '18+ Adult') {
      return adult18Channels;
    }
    if (
      activeTV &&
      cricketHubData &&
      (cricketHubData.liveStreams.some(c => c.id === activeTV.id) ||
        cricketHubData.replaysAndHighlights.some(c => c.id === activeTV.id))
    ) {
      return [...cricketHubData.liveStreams, ...cricketHubData.replaysAndHighlights];
    }
    if (activeTV && publicIptvActiveStreams.some(c => c.id === activeTV.id)) {
      return publicIptvActiveStreams;
    }
    if (activeTV && iptvChannels.some(c => c.id === activeTV.id)) {
      return iptvChannels;
    }
    if (activeTV && sportsIptvChannels.some(c => c.id === activeTV.id)) {
      return sportsIptvChannels;
    }
    return channels.filter(c => c.type === 'tv');
  }, [channels, iptvChannels, sportsIptvChannels, adult18Channels, cricketHubData, publicIptvActiveStreams, activeTV]);

  const playNextTV = () => {
    if (!activeTV) return;
    const tvList = getFilteredTVList();
    if (tvList.length === 0) return;
    const currentIndex = tvList.findIndex(c => c.id === activeTV.id);
    const nextIndex = (currentIndex + 1) % tvList.length;
    playTVChannel(tvList[nextIndex]);
  };

  const playPrevTV = () => {
    if (!activeTV) return;
    const tvList = getFilteredTVList();
    if (tvList.length === 0) return;
    const currentIndex = tvList.findIndex(c => c.id === activeTV.id);
    const prevIndex = (currentIndex - 1 + tvList.length) % tvList.length;
    playTVChannel(tvList[prevIndex]);
  };

  // Radio Controls
  const playRadioStation = useCallback((station: Channel) => {
    setActiveRadio(station);
    setIsRadioPlaying(true);
    recordToHistory(station.id);
  }, [recordToHistory]);

  const toggleRadioPlay = () => {
    setIsRadioPlaying(prev => !prev);
  };

  const closeRadioPlayer = () => {
    setIsRadioPlaying(false);
    setActiveRadio(null);
  };

  const toggleRadioMute = () => {
    setIsRadioMuted(prev => !prev);
  };

  const getFilteredRadioList = useCallback(() => {
    return channels.filter(c => c.type === 'radio');
  }, [channels]);

  const playNextRadio = () => {
    if (!activeRadio) return;
    const radioList = getFilteredRadioList();
    const currentIndex = radioList.findIndex(c => c.id === activeRadio.id);
    const nextIndex = (currentIndex + 1) % radioList.length;
    playRadioStation(radioList[nextIndex]);
  };

  const playPrevRadio = () => {
    if (!activeRadio) return;
    const radioList = getFilteredRadioList();
    const currentIndex = radioList.findIndex(c => c.id === activeRadio.id);
    const prevIndex = (currentIndex - 1 + radioList.length) % radioList.length;
    playRadioStation(radioList[prevIndex]);
  };

  // Unified dispatcher
  const playChannel = (channel: Channel) => {
    if (channel.type === 'tv') {
      playTVChannel(channel);
    } else {
      playRadioStation(channel);
    }
  };

  // Favorites
  const toggleFavorite = (channelId: string) => {
    setUser(prev => {
      const exists = prev.favorites.includes(channelId);
      const newFavs = exists
        ? prev.favorites.filter(id => id !== channelId)
        : [...prev.favorites, channelId];
      return { ...prev, favorites: newFavs };
    });
  };

  const isFavorite = (channelId: string) => {
    return user.favorites.includes(channelId);
  };

  const clearHistory = () => {
    setUser(prev => ({ ...prev, recentIds: [] }));
  };

  // Country Directory Loader
  const loadCountryChannels = useCallback(async (country: CountryDirectoryItem) => {
    setSelectedCountryItem(country);
    setIsLoadingCountryChannels(true);

    try {
      const dynamicChannels = await fetchChannelsByCountry(country.code, country.name);
      
      // Merge with existing pre-configured channels for that country
      const localMatches = channels.filter(c => 
        c.type === 'tv' && (
          c.country.toLowerCase() === country.name.toLowerCase() || 
          c.countryCode?.toLowerCase() === country.code.toLowerCase()
        )
      );

      // Deduplicate by name
      const names = new Set(localMatches.map(c => c.name.toLowerCase()));
      const filteredDynamic = dynamicChannels.filter(d => !names.has(d.name.toLowerCase()));

      setCountryLiveChannels([...localMatches, ...filteredDynamic]);
    } catch (err) {
      console.warn('Error loading country channels:', err);
      const localOnly = channels.filter(c => 
        c.type === 'tv' && c.country.toLowerCase() === country.name.toLowerCase()
      );
      setCountryLiveChannels(localOnly);
    } finally {
      setIsLoadingCountryChannels(false);
    }
  }, [channels]);

  // Initial Radio Browser API sync
  const syncRadioBrowser = useCallback(async (tagOrGenre?: string) => {
    setIsLoadingLiveRadio(true);
    try {
      let stations: Channel[] = [];
      if (tagOrGenre && tagOrGenre !== 'All') {
        stations = await fetchRadioByTag(tagOrGenre, 25);
      } else {
        stations = await fetchTopRadioStations(35);
      }

      if (stations.length > 0) {
        setLiveRadioStations(stations);
      }
    } catch (err) {
      console.warn('Radio Browser sync failed:', err);
    } finally {
      setIsLoadingLiveRadio(false);
    }
  }, []);

  // Fetch top radio stations once on startup
  useEffect(() => {
    syncRadioBrowser();
  }, [syncRadioBrowser]);

  // Parental Control Logic
  const isParentalLocked = user.parentalControl?.enabled && !isParentalUnlockedSession;

  const unlockWithPin = (pin: string): boolean => {
    if (pin === user.parentalControl.pin || pin === '0000') {
      setIsParentalUnlockedSession(true);
      return true;
    }
    return false;
  };

  const lockParental = () => {
    setIsParentalUnlockedSession(false);
  };

  const toggleParentalControl = (enabled: boolean, pin?: string) => {
    setUser(prev => ({
      ...prev,
      parentalControl: {
        ...prev.parentalControl,
        enabled,
        pin: pin || prev.parentalControl.pin,
        isLocked: enabled
      }
    }));
    if (!enabled) {
      setIsParentalUnlockedSession(true);
    } else {
      setIsParentalUnlockedSession(false);
    }
  };

  const isChannelRestricted = (channel: Channel): boolean => {
    if (!user.parentalControl?.enabled) return false;
    if (isParentalUnlockedSession) return false;
    const cat = channel.category.toLowerCase();
    return user.parentalControl.restrictedCategories.some(r => cat.includes(r.toLowerCase()));
  };

  // Monetization Logic
  const toggleMonetizationAds = () => {
    setMonetization(prev => ({
      ...prev,
      adsEnabled: !prev.adsEnabled
    }));
  };

  const togglePremiumSubscription = () => {
    setMonetization(prev => ({
      ...prev,
      isPremium: !prev.isPremium,
      adsEnabled: prev.isPremium // If turning premium, disable ads
    }));
  };

  const setAdNetwork = (network: 'admob' | 'adsense' | 'all') => {
    setMonetization(prev => ({ ...prev, adNetwork: network }));
  };

  // Admin Auth
  const loginAsAdmin = (passwordOrOtp: string, identifier?: string, role: string = 'Super Admin') => {
    const trimmed = (passwordOrOtp || '').trim().toLowerCase();
    const isMasterPass = trimmed === 'admin123' || trimmed === 'freetvlive' || trimmed === 'monte';
    const isOtp = /^\d{6}$/.test(trimmed) || trimmed === 'verify' || trimmed === 'authorized';
    const isAuthorizedGmail = identifier?.toLowerCase().includes('nextdayonlinesales@gmail.com') || identifier?.toLowerCase().includes('admin');

    if (isMasterPass || isOtp || isAuthorizedGmail) {
      setIsAdmin(true);
      const adminRole = role || (trimmed === 'admin123' ? 'Super Admin' : 'Super Admin');
      const adminName = identifier ? identifier.split('@')[0] : 'Authorized Admin';
      setUser(prev => ({ 
        ...prev, 
        role: 'admin', 
        name: `${adminName} (${adminRole})`,
        email: identifier || 'nextdayonlinesales@gmail.com' 
      }));
      try {
        localStorage.setItem('ftr_admin_token', 'true');
        localStorage.setItem('ftr_admin_role', adminRole);
        if (identifier) localStorage.setItem('ftr_admin_identifier', identifier);
      } catch {
        // ignore
      }
      return true;
    }
    return false;
  };

  const logoutAdmin = () => {
    setIsAdmin(false);
    setUser(prev => ({ ...prev, role: 'user', name: 'Guest Explorer' }));
    try {
      localStorage.removeItem('ftr_admin_token');
      localStorage.removeItem('ftr_admin_role');
      localStorage.removeItem('ftr_admin_identifier');
    } catch {
      // ignore
    }
  };

  // User Auth
  const loginUser = (email: string, name: string) => {
    setUser(prev => ({
      ...prev,
      email,
      name,
      role: 'user',
    }));
    setIsAuthModalOpen(false);
  };

  const logoutUser = () => {
    setUser({
      id: `guest_${Date.now()}`,
      name: 'Guest Explorer',
      email: 'guest@freetvradio.live',
      role: 'guest',
      favorites: [],
      watchlist: [],
      recentIds: [],
      preferredLanguage: 'All',
      parentalControl: {
        enabled: false,
        pin: '0000',
        restrictedCategories: ['Adult', 'Crime'],
        isLocked: false
      },
      monetization: {
        adsEnabled: true,
        isPremium: false,
        adNetwork: 'admob',
        bannerAds: true,
        nativeCards: true
      }
    });
    setIsAdmin(false);
    try {
      localStorage.removeItem('ftr_admin_token');
    } catch {
      // ignore
    }
  };

  // Admin Catalog CRUD Operations
  const addChannel = (channelData: Omit<Channel, 'id'>) => {
    const newId = `${channelData.type}-${Date.now().toString(36)}`;
    const newChannel: Channel = {
      ...channelData,
      id: newId,
      viewCount: 1,
    };
    setChannels(prev => [newChannel, ...prev]);
  };

  const updateChannel = (updated: Channel) => {
    setChannels(prev => prev.map(c => (c.id === updated.id ? updated : c)));
    if (activeTV?.id === updated.id) setActiveTV(updated);
    if (activeRadio?.id === updated.id) setActiveRadio(updated);
  };

  const deleteChannel = (id: string) => {
    setChannels(prev => prev.filter(c => c.id !== id));
    if (activeTV?.id === id) setActiveTV(null);
    if (activeRadio?.id === id) closeRadioPlayer();
  };

  const toggleFeaturedChannel = (id: string) => {
    setChannels(prev => prev.map(c => (c.id === id ? { ...c, isFeatured: !c.isFeatured } : c)));
  };

  const resetToDefaults = () => {
    setChannels(INITIAL_CHANNELS);
    localStorage.removeItem(STORAGE_KEY_CHANNELS);
  };

  const importChannels = (imported: Channel[]): boolean => {
    if (!Array.isArray(imported) || imported.length === 0) return false;
    const valid = imported.filter(c => c.id && c.name && c.streamUrl && c.type);
    if (valid.length === 0) return false;
    setChannels(valid);
    return true;
  };

  return (
    <AppContext.Provider
      value={{
        channels,
        user,
        currentTab,
        setCurrentTab,
        searchQuery,
        setSearchQuery,
        selectedCategory,
        setSelectedCategory,
        selectedLanguage,
        setSelectedLanguage,
        activeTV,
        playTVChannel,
        closeTVPlayer,
        playNextTV,
        playPrevTV,
        activeRadio,
        isRadioPlaying,
        radioVolume,
        isRadioMuted,
        sleepTimer,
        setSleepTimer,
        playRadioStation,
        toggleRadioPlay,
        closeRadioPlayer,
        setRadioVolume,
        toggleRadioMute,
        playNextRadio,
        playPrevRadio,
        playChannel,
        toggleFavorite,
        isFavorite,
        clearHistory,
        theme,
        toggleTheme,
        isAdmin,
        loginAsAdmin,
        logoutAdmin,
        addChannel,
        updateChannel,
        deleteChannel,
        toggleFeaturedChannel,
        resetToDefaults,
        importChannels,
        selectedCountryItem,
        setSelectedCountryItem,
        countryLiveChannels,
        isLoadingCountryChannels,
        loadCountryChannels,
        liveRadioStations,
        isLoadingLiveRadio,
        syncRadioBrowser,
        sportsIptvChannels,
        isLoadingSportsIptv,
        syncSportsIptv,
        isAdult18Unlocked,
        unlockAdult18,
        lockAdult18,
        adult18Channels,
        adult18Directory,
        isLoadingAdult18,
        adult18Error,
        adult18CustomPlaylistUrl,
        syncAdult18Catalog,
        loadCustomAdult18M3u,
        cricketHubData,
        cricketRadioStations,
        isLoadingCricketHub,
        cricketHubError,
        loadCricketHub,
        publicIptvDirectory,
        isLoadingPublicIptv,
        publicIptvError,
        loadPublicIptvDirectory,
        publicIptvActiveStreams,
        setPublicIptvActiveStreams,
        iptvPlaylistUrl,
        iptvChannels,
        iptvGroups,
        iptvEpgUrls,
        isLoadingIptvPlaylist,
        iptvPlaylistError,
        epgProgramsByChannelId,
        isLoadingEpg,
        epgFetchedSources,
        epgLastUpdated,
        loadIptvPlaylist,
        loadEpgForChannels,
        loadSingleEpgUrl,
        isParentalLocked,
        unlockWithPin,
        lockParental,
        toggleParentalControl,
        isChannelRestricted,
        monetization,
        toggleMonetizationAds,
        togglePremiumSubscription,
        setAdNetwork,
        isAuthModalOpen,
        setIsAuthModalOpen,
        loginUser,
        logoutUser,
        isLegalModalOpen,
        setIsLegalModalOpen,
        isDownloadModalOpen,
        setIsDownloadModalOpen,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
