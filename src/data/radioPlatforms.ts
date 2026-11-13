import { RadioPlatform } from '../types';

export const WORLD_RADIO_PLATFORMS: RadioPlatform[] = [
  {
    id: 'radio-garden',
    name: 'Radio Garden',
    tagline: 'Explore live radio by rotating the globe',
    coverage: 'Worldwide (Interactive 3D Globe)',
    stationCount: '40,000+ Stations',
    websiteUrl: 'https://radio.garden',
    logoUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=160&auto=format&fit=crop&q=80',
    description: 'Listen to thousands of live radio stations worldwide by spinning a 3D digital globe. Zoom into any city or town on Earth and tune into local broadcasters instantly.',
    features: ['3D Earth Navigation', 'City-by-City Tuning', 'Global FM/AM Feeds', 'Zero Sign-in Required'],
    primaryGenre: 'Worldwide Geolocation',
    hasWebPlayer: true
  },
  {
    id: 'radio-browser',
    name: 'Radio Browser',
    tagline: 'Community-driven open radio station database',
    coverage: 'Open Radio Station Database',
    stationCount: '35,000+ Open Stations',
    websiteUrl: 'https://www.radio-browser.info',
    logoUrl: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=160&auto=format&fit=crop&q=80',
    description: 'The premier open-source radio directory powered by community contributions. Direct Icecast, Shoutcast, and HLS stream links with transparent bitrates.',
    features: ['Open Community API', 'Direct Stream URLs', 'Lossless & High Bitrate', 'Voted Top Stations'],
    primaryGenre: 'Open Source Catalog',
    hasWebPlayer: true
  },
  {
    id: 'tunein',
    name: 'TuneIn Radio',
    tagline: 'Premier international live audio & news',
    coverage: 'Global FM/AM, News & Talk',
    stationCount: '100,000+ Stations',
    websiteUrl: 'https://tunein.com',
    logoUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=160&auto=format&fit=crop&q=80',
    description: 'The world’s most comprehensive live audio platform. Stream international sports commentary, breaking news (CNN, BBC, NPR), live concerts, and premier talk radio.',
    features: ['Live Sports Coverage', 'Breaking World News', 'Podcasts & Talk', 'Premier AM/FM Networks'],
    primaryGenre: 'Live Sports & News',
    hasWebPlayer: true
  },
  {
    id: 'roam-radio',
    name: 'Roam Radio',
    tagline: 'Massive directory of 67,000+ listed stations',
    coverage: '67,000+ Listed Stations',
    stationCount: '67,000+ Stations',
    websiteUrl: 'https://roamradios.com',
    logoUrl: 'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=160&auto=format&fit=crop&q=80',
    description: 'An immense library cataloging over 67,000 radio stations across every continent. Filter by country, dialect, genre, and station frequency with instant streaming.',
    features: ['67,000+ Verified Feeds', 'Country-wise Explorer', 'Language Filters', 'Low-Bandwidth Modes'],
    primaryGenre: 'Global Deep Catalog',
    hasWebPlayer: true
  },
  {
    id: 'online-radio-fm',
    name: 'Online Radio FM',
    tagline: 'Crystal clear digital broadcasts from 190+ countries',
    coverage: '58,000+ Listed Stations',
    stationCount: '58,000+ Stations',
    websiteUrl: 'https://onlineradiofm.com',
    logoUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=160&auto=format&fit=crop&q=80',
    description: 'Comprehensive digital FM listening platform indexing over 58,000 live streams. Enjoy uninterrupted commercial and public radio stations worldwide.',
    features: ['58,000+ FM Streams', '190+ Countries', 'Genre Classifications', 'Top Regional Charts'],
    primaryGenre: 'Digital FM Radio',
    hasWebPlayer: true
  },
  {
    id: 'air-drift',
    name: 'Air Drift',
    tagline: 'Ambient world radio with 59,000+ live stations',
    coverage: '59,000+ Listed Stations',
    stationCount: '59,000+ Stations',
    websiteUrl: 'https://airdrift.stream',
    logoUrl: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=160&auto=format&fit=crop&q=80',
    description: 'Modern ambient audio experience combining live radio with calming visual backdrops. Drift across 59,000+ worldwide streams from serene lo-fi to active city talk.',
    features: ['59,000+ Live Stations', 'Drift Audio Engine', 'Visual Atmospheric Modes', 'Global Music Discovery'],
    primaryGenre: 'Ambient & Global Drift',
    hasWebPlayer: true
  },
  {
    id: 'airtune',
    name: 'Airtune',
    tagline: 'High-fidelity international radio streaming app',
    coverage: 'International Radio Discovery',
    stationCount: '45,000+ Stations',
    websiteUrl: 'https://airtune.app',
    logoUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=160&auto=format&fit=crop&q=80',
    description: 'Next-generation web radio discovery interface with curated stations, pristine audio quality, and seamless cross-platform playback for international radio fans.',
    features: ['Curated Station Picks', 'Modern Minimalist Player', 'Fast Station Switching', 'Global Favorites'],
    primaryGenre: 'International Curated',
    hasWebPlayer: true
  }
];
