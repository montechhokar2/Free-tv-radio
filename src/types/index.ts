export type MediaType = 'tv' | 'radio';

export type StreamFormat = 'hls' | 'mp4' | 'audio' | 'youtube' | 'dash';

export type TVCategory = 
  | 'World News'
  | 'India News'
  | 'USA News'
  | 'UK News'
  | 'Sports'
  | 'Cricket'
  | 'Soccer'
  | 'Football'
  | 'WWE & Wrestling'
  | 'Entertainment'
  | 'Movies'
  | 'Music'
  | 'Bollywood'
  | 'Hollywood'
  | 'Kids & Cartoons'
  | 'Documentary'
  | 'Educational'
  | 'Religious'
  | 'Business'
  | 'Lifestyle'
  | 'Shopping'
  | 'Regional TV'
  | 'YouTube Live'
  | 'OTT Feeds';

// 16 Standardized Radio Categories
export type RadioCategory =
  | 'International Radio'
  | 'Indian Radio'
  | 'Bollywood Radio'
  | 'Hollywood Music'
  | 'English Pop'
  | 'Hindi Songs'
  | 'Punjabi Music'
  | 'Classical Music'
  | 'Jazz'
  | 'Rock'
  | 'Electronic Music'
  | 'Religious Radio'
  | 'News Radio'
  | 'Sports Radio'
  | 'Talk Shows'
  | 'Educational Radio';

export type ChannelCategory = TVCategory | RadioCategory | string;

export interface Channel {
  id: string;
  name: string;
  type: MediaType;
  category: ChannelCategory;
  language: string;
  country: string;
  countryCode?: string;
  streamUrl: string;
  backupUrl?: string;
  streamFormat: StreamFormat;
  logoUrl: string;
  description: string;
  currentProgram?: string;
  isFeatured?: boolean;
  isTrending?: boolean;
  viewCount?: number;
  quality?: string[]; // e.g. ['1080p', '720p', 'Auto']
  broadcaster?: string;
  verifiedFta: boolean; // Verified Free-to-Air / legal public stream
  isLive?: boolean;
  bitrate?: number;
  tags?: string[];
  stationUuid?: string; // For Radio Browser API stations
  votes?: number;
  clickCount?: number;
  tvgId?: string; // XMLTV EPG channel ID from M3U8 playlist
  tvgChno?: string;
  groupTitle?: string;
  isGeoBlocked?: boolean;
  epgUrl?: string;
}

export interface EpgProgram {
  id: string;
  channelId: string;
  title: string;
  subTitle?: string;
  description?: string;
  category?: string;
  start: string;
  stop: string;
  startMs: number;
  stopMs: number;
  icon?: string;
}

export interface ParentalControlConfig {
  enabled: boolean;
  pin: string;
  restrictedCategories: string[];
  isLocked: boolean;
}

export interface MonetizationConfig {
  adsEnabled: boolean;
  isPremium: boolean;
  adNetwork: 'admob' | 'adsense' | 'all';
  bannerAds: boolean;
  nativeCards: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user' | 'guest';
  avatar?: string;
  favorites: string[];
  watchlist: string[];
  recentIds: string[];
  preferredLanguage: string;
  parentalControl: ParentalControlConfig;
  monetization: MonetizationConfig;
}

export interface WebDirectoryChannel {
  id: string;
  name: string;
  cleanName: string;
  logoUrl?: string;
  category: string;
  country: string;
  countryCode?: string;
  language?: string;
  streamUrl: string;
  resolution?: string;
  broadcaster?: string;
  description?: string;
  verifiedFta: boolean;
}

export interface CountryDirectoryItem {
  name: string;
  code: string;
  flag: string;
  region: string;
  popularLanguage: string;
  featuredCount?: number;
}

export interface LanguageCategory {
  id: string;
  name: string;
  nativeName: string;
  flag: string;
  description: string;
}

export interface OttPlatform {
  id: string;
  name: string;
  tagline: string;
  category: 'Free & AVOD' | 'National FTA' | 'Freemium' | 'Regional OTT' | 'Global OTT';
  logoUrl: string;
  description: string;
  websiteUrl: string;
  freeTier: boolean;
  featuredContent: string[];
  languages: string[];
  origin: string;
}

export interface RadioPlatform {
  id: string;
  name: string;
  tagline: string;
  coverage: string;
  stationCount: string;
  websiteUrl: string;
  logoUrl: string;
  description: string;
  features: string[];
  primaryGenre: string;
  hasWebPlayer: boolean;
}

export type SleepTimerOption = 0 | 15 | 30 | 45 | 60 | 90;
