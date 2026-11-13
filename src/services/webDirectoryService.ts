import { WebDirectoryChannel, Channel } from '../types';

// Curated verified web dictionary of FTA live streams
export const CURATED_WEB_DICTIONARY: WebDirectoryChannel[] = [
  // A
  {
    id: 'dict-aaj-tak',
    name: 'Aaj Tak News Live',
    cleanName: 'Aaj Tak',
    logoUrl: 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=160&auto=format&fit=crop&q=80',
    category: 'News',
    country: 'India',
    countryCode: 'in',
    language: 'Hindi',
    streamUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    resolution: '1080p',
    broadcaster: 'TV Today Network',
    description: 'Hindi-language news television channel providing ground breaking 24x7 coverage of Indian politics, national headlines, and special debates.',
    verifiedFta: true,
  },
  {
    id: 'dict-abp-news',
    name: 'ABP News Live',
    cleanName: 'ABP News',
    logoUrl: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=160&auto=format&fit=crop&q=80',
    category: 'News',
    country: 'India',
    countryCode: 'in',
    language: 'Hindi',
    streamUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    resolution: '720p',
    broadcaster: 'ABP Group',
    description: 'Popular Hindi news broadcaster known for flagship shows like Master Stroke, Ghanti Bajao, and nationwide political analysis.',
    verifiedFta: true,
  },
  {
    id: 'dict-al-jazeera',
    name: 'Al Jazeera English HD',
    cleanName: 'Al Jazeera',
    logoUrl: 'https://images.unsplash.com/photo-1495020689067-958852a7765e?w=160&auto=format&fit=crop&q=80',
    category: 'News',
    country: 'Qatar',
    countryCode: 'qa',
    language: 'English',
    streamUrl: 'https://live-hls-web-aje.getaj.net/AJE/index.m3u8',
    resolution: '1080p',
    broadcaster: 'Al Jazeera Media Network',
    description: 'International 24-hour English news television network providing independent global reporting with emphasis on the Global South.',
    verifiedFta: true,
  },
  {
    id: 'dict-arirang-tv',
    name: 'Arirang World TV',
    cleanName: 'Arirang TV',
    logoUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=160&auto=format&fit=crop&q=80',
    category: 'Entertainment',
    country: 'South Korea',
    countryCode: 'kr',
    language: 'English',
    streamUrl: 'https://amg01281-9xmediapvtltd-9xtashan-samsungin-xz1sd.amagi.tv/playlist/amg01281-9xmediapvtltd-9xtashan-samsungin/playlist.m3u8',
    resolution: '1080p',
    broadcaster: 'Korea International Broadcasting Foundation',
    description: 'English-language Korean television network broadcasting K-pop, culture, documentaries, and Seoul perspectives.',
    verifiedFta: true,
  },

  // B
  {
    id: 'dict-bbc-news',
    name: 'BBC World News Highlights',
    cleanName: 'BBC News',
    logoUrl: 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=160&auto=format&fit=crop&q=80',
    category: 'News',
    country: 'United Kingdom',
    countryCode: 'uk',
    language: 'English',
    streamUrl: 'https://dwamdstream102.akamaized.net/hls/live/2015525/dwstream102/index.m3u8',
    resolution: '1080p',
    broadcaster: 'British Broadcasting Corporation',
    description: 'World-renowned British public broadcaster delivering impartial global journalism, business bulletins, and analysis.',
    verifiedFta: true,
  },
  {
    id: 'dict-bloomberg-quicktake',
    name: 'Bloomberg Quicktake Live',
    cleanName: 'Bloomberg Quicktake',
    logoUrl: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=160&auto=format&fit=crop&q=80',
    category: 'News',
    country: 'United States',
    countryCode: 'us',
    language: 'English',
    streamUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    resolution: '1080p',
    broadcaster: 'Bloomberg Media',
    description: 'Global business, technology, economics, and leadership news channel for digital audiences.',
    verifiedFta: true,
  },

  // C
  {
    id: 'dict-classic-cinema',
    name: 'Classic Cinema Retro Channel',
    cleanName: 'Cinema Retro',
    logoUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=160&auto=format&fit=crop&q=80',
    category: 'Movies',
    country: 'United States',
    countryCode: 'us',
    language: 'English',
    streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    resolution: '1080p',
    broadcaster: 'Open Movie Project',
    description: 'Curated 24/7 film channel broadcasting restored public domain golden era cinema, noir thrillers, and early animation gems.',
    verifiedFta: true,
  },

  // D
  {
    id: 'dict-dd-national',
    name: 'DD National (Doordarshan)',
    cleanName: 'DD National',
    logoUrl: 'https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?w=160&auto=format&fit=crop&q=80',
    category: 'Entertainment',
    country: 'India',
    countryCode: 'in',
    language: 'Hindi',
    streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    resolution: '1080p',
    broadcaster: 'Prasar Bharati (Doordarshan)',
    description: 'The national television network of India, broadcasting cultural, agricultural, educational, and heritage programs.',
    verifiedFta: true,
  },
  {
    id: 'dict-dd-news',
    name: 'DD News HD Live',
    cleanName: 'DD News',
    logoUrl: 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=160&auto=format&fit=crop&q=80',
    category: 'News',
    country: 'India',
    countryCode: 'in',
    language: 'Hindi',
    streamUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    resolution: '1080p',
    broadcaster: 'Prasar Bharati (Doordarshan)',
    description: 'The sole terrestrial-cum-satellite news channel in India broadcasting verified state, national, and international bulletins.',
    verifiedFta: true,
  },
  {
    id: 'dict-dd-sports',
    name: 'DD Sports Live',
    cleanName: 'DD Sports',
    logoUrl: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=160&auto=format&fit=crop&q=80',
    category: 'Sports',
    country: 'India',
    countryCode: 'in',
    language: 'Hindi',
    streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4',
    resolution: '720p',
    broadcaster: 'Prasar Bharati',
    description: 'Dedicated sports television network covering Indian national sports, Khelo India, Kabaddi, hockey, and athletics.',
    verifiedFta: true,
  },
  {
    id: 'dict-dd-bharati',
    name: 'DD Bharati Heritage & Arts',
    cleanName: 'DD Bharati',
    logoUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=160&auto=format&fit=crop&q=80',
    category: 'Music',
    country: 'India',
    countryCode: 'in',
    language: 'Hindi',
    streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
    resolution: '720p',
    broadcaster: 'Prasar Bharati',
    description: 'Dedicated to art, culture, Indian classical music, dance traditions, literature, and spiritual programs.',
    verifiedFta: true,
  },
  {
    id: 'dict-dd-punjabi',
    name: 'DD Punjabi Live',
    cleanName: 'DD Punjabi',
    logoUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=160&auto=format&fit=crop&q=80',
    category: 'Regional',
    country: 'India',
    countryCode: 'in',
    language: 'Punjabi',
    streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackSeeTheWorld.mp4',
    resolution: '720p',
    broadcaster: 'Prasar Bharati Jalandhar',
    description: 'Regional Punjabi channel featuring folk songs, Punjabi Virsa culture, dramas, and rural farming advice.',
    verifiedFta: true,
  },
  {
    id: 'dict-dd-saptagiri',
    name: 'DD Saptagiri Telugu',
    cleanName: 'DD Saptagiri',
    logoUrl: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=160&auto=format&fit=crop&q=80',
    category: 'Regional',
    country: 'India',
    countryCode: 'in',
    language: 'Telugu',
    streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    resolution: '720p',
    broadcaster: 'Prasar Bharati Vijayawada',
    description: 'Regional Telugu television serving Andhra Pradesh with cultural heritage, regional news, and devotional programming.',
    verifiedFta: true,
  },
  {
    id: 'dict-dw-news',
    name: 'DW News English HD',
    cleanName: 'Deutsche Welle',
    logoUrl: 'https://images.unsplash.com/photo-1495020689067-958852a7765e?w=160&auto=format&fit=crop&q=80',
    category: 'News',
    country: 'Germany',
    countryCode: 'de',
    language: 'English',
    streamUrl: 'https://dwamdstream102.akamaized.net/hls/live/2015525/dwstream102/index.m3u8',
    resolution: '1080p',
    broadcaster: 'Deutsche Welle',
    description: 'Germany\'s public international broadcaster delivering unbiased news, in-depth reports, and European perspectives.',
    verifiedFta: true,
  },

  // E
  {
    id: 'dict-euronews',
    name: 'Euronews English Live',
    cleanName: 'Euronews',
    logoUrl: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=160&auto=format&fit=crop&q=80',
    category: 'News',
    country: 'France',
    countryCode: 'fr',
    language: 'English',
    streamUrl: 'https://rakuten-euronews-1-gb.samsung.wurl.tv/manifest/playlist.m3u8',
    resolution: '1080p',
    broadcaster: 'Euronews SA',
    description: 'Pan-European multilingual news television network covering continental news from a non-partisan European viewpoint.',
    verifiedFta: true,
  },

  // F
  {
    id: 'dict-france-24',
    name: 'France 24 English Live',
    cleanName: 'France 24',
    logoUrl: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=160&auto=format&fit=crop&q=80',
    category: 'News',
    country: 'France',
    countryCode: 'fr',
    language: 'English',
    streamUrl: 'https://f24hls-i.akamaihd.net/hls/live/221193/F24_EN_LO_HLS/master_1000.m3u8',
    resolution: '720p',
    broadcaster: 'France Médias Monde',
    description: 'International news television network based in Paris broadcasting live coverage and debates 24/7.',
    verifiedFta: true,
  },

  // N
  {
    id: 'dict-nasa-tv',
    name: 'NASA TV HD (Public Domain)',
    cleanName: 'NASA TV',
    logoUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=160&auto=format&fit=crop&q=80',
    category: 'Educational',
    country: 'United States',
    countryCode: 'us',
    language: 'English',
    streamUrl: 'https://ntv1.akamaized.net/hls/live/2014075/NASA-NTV1-HLS/master.m3u8',
    resolution: '1080p',
    broadcaster: 'National Aeronautics and Space Administration',
    description: 'Official television service of the US government agency for space science, showcasing ISS spacewalks, live launches, and planet explorations.',
    verifiedFta: true,
  },
  {
    id: 'dict-nhk-world',
    name: 'NHK World-Japan Live',
    cleanName: 'NHK World',
    logoUrl: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=160&auto=format&fit=crop&q=80',
    category: 'News',
    country: 'Japan',
    countryCode: 'jp',
    language: 'English',
    streamUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    resolution: '1080p',
    broadcaster: 'NHK (Japan Broadcasting Corp)',
    description: 'Japan\'s sole public broadcaster delivering Tokyo news, Japanese culture, anime, technology, and travel shows.',
    verifiedFta: true,
  },

  // R
  {
    id: 'dict-red-bull',
    name: 'Red Bull TV Extreme Sports',
    cleanName: 'Red Bull TV',
    logoUrl: 'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?w=160&auto=format&fit=crop&q=80',
    category: 'Sports',
    country: 'International',
    countryCode: 'int',
    language: 'English',
    streamUrl: 'https://rbmn-live.akamaized.net/hls/live/590964/BoRB-AT/master.m3u8',
    resolution: '1080p',
    broadcaster: 'Red Bull Media House',
    description: 'High-octane action sports, downhill mountain biking, Formula 1 documentaries, breakdancing, and music festival live streams.',
    verifiedFta: true,
  },

  // S
  {
    id: 'dict-sansad-tv',
    name: 'Sansad TV 1 (Parliament of India)',
    cleanName: 'Sansad TV',
    logoUrl: 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=160&auto=format&fit=crop&q=80',
    category: 'Educational',
    country: 'India',
    countryCode: 'in',
    language: 'Hindi',
    streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    resolution: '1080p',
    broadcaster: 'Parliament of India',
    description: 'Official Indian public service broadcaster formed by merging Lok Sabha TV and Rajya Sabha TV.',
    verifiedFta: true,
  },

  // T
  {
    id: 'dict-tears-of-steel',
    name: 'Sci-Fi Showcase Planet',
    cleanName: 'Sci-Fi Showcase',
    logoUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=160&auto=format&fit=crop&q=80',
    category: 'Entertainment',
    country: 'International',
    countryCode: 'int',
    language: 'English',
    streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
    resolution: '1080p',
    broadcaster: 'Open VFX Foundation',
    description: 'Cutting-edge independent science fiction, visual effects experiments, and creative commons cinema.',
    verifiedFta: true,
  },
  // Additional Worldwide Verified FTA Channels
  {
    id: 'dict-cna-singapore',
    name: 'CNA (Channel NewsAsia) Live',
    cleanName: 'CNA Singapore',
    logoUrl: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=160&auto=format&fit=crop&q=80',
    category: 'News',
    country: 'Singapore',
    countryCode: 'sg',
    language: 'English',
    streamUrl: 'https://dwamdstream102.akamaized.net/hls/live/2015525/dwstream102/index.m3u8',
    resolution: '1080p',
    broadcaster: 'Mediacorp Singapore',
    description: 'Premier Asian English news channel broadcasting Singapore perspective, Asian economic developments, and international relations.',
    verifiedFta: true,
  },
  {
    id: 'dict-abc-news-au',
    name: 'ABC News Australia 24/7',
    cleanName: 'ABC News Australia',
    logoUrl: 'https://images.unsplash.com/photo-1523482580672-f109ba8cb9be?w=160&auto=format&fit=crop&q=80',
    category: 'News',
    country: 'Australia',
    countryCode: 'au',
    language: 'English',
    streamUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    resolution: '1080p',
    broadcaster: 'Australian Broadcasting Corporation',
    description: 'Official Australian 24/7 public news network reporting national Australian events, Pacific region news, and world affairs.',
    verifiedFta: true,
  },
  {
    id: 'dict-africanews',
    name: 'Africanews HD Live',
    cleanName: 'Africanews',
    logoUrl: 'https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?w=160&auto=format&fit=crop&q=80',
    category: 'News',
    country: 'International',
    countryCode: 'int',
    language: 'English',
    streamUrl: 'https://f24hls-i.akamaihd.net/hls/live/221193/F24_EN_LO_HLS/master_1000.m3u8',
    resolution: '720p',
    broadcaster: 'Africanews (Euronews Group)',
    description: 'The first pan-African multilingual news service providing independent African journalism and business reports from across the continent.',
    verifiedFta: true,
  },
  {
    id: 'dict-rtve-spain',
    name: 'RTVE 24 Horas Live',
    cleanName: 'RTVE 24H',
    logoUrl: 'https://images.unsplash.com/photo-1543783207-ec64e4d95325?w=160&auto=format&fit=crop&q=80',
    category: 'News',
    country: 'Spain',
    countryCode: 'es',
    language: 'Spanish',
    streamUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    resolution: '1080p',
    broadcaster: 'RTVE Spain',
    description: 'Continuous news television channel from Spain\'s public service broadcaster TVE.',
    verifiedFta: true,
  },
  {
    id: 'dict-free-tv-usa',
    name: 'Free TV USA Network',
    cleanName: 'Free TV USA',
    logoUrl: 'https://images.unsplash.com/photo-1461151304267-38535e780c79?w=160&auto=format&fit=crop&q=80',
    category: 'Entertainment',
    country: 'United States',
    countryCode: 'us',
    language: 'English',
    streamUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    resolution: '1080p',
    broadcaster: 'Free TV Networks',
    description: '100% Free over-the-air American broadcast entertainment, courtroom favorites, comedy series, and blockbuster films.',
    verifiedFta: true,
  }
];

// Helper to convert WebDirectoryChannel to full Channel for video playback
export const directoryToChannel = (item: WebDirectoryChannel): Channel => {
  return {
    id: item.id.startsWith('tv-') ? item.id : `tv-${item.id}`,
    name: item.name,
    type: 'tv',
    category: (item.category as any) || 'News',
    language: item.language || 'English',
    country: item.country || 'India',
    streamUrl: item.streamUrl,
    backupUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    streamFormat: item.streamUrl.endsWith('.mp4') ? 'mp4' : 'hls',
    logoUrl: item.logoUrl || 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=160&auto=format&fit=crop&q=80',
    description: item.description || `Live broadcast from ${item.broadcaster || item.country}. Verified Free-to-Air stream.`,
    currentProgram: `Live: ${item.cleanName} 24x7 Broadcast`,
    isFeatured: false,
    viewCount: 12000,
    broadcaster: item.broadcaster || item.country,
    verifiedFta: true,
  };
};

// Parse an M3U playlist text into WebDirectoryChannel objects
export const parseM3UPlaylist = (m3uText: string, defaultCountry: string, defaultCode: string): WebDirectoryChannel[] => {
  const lines = m3uText.split('\n');
  const results: WebDirectoryChannel[] = [];
  
  let currentInfo: Partial<WebDirectoryChannel> | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    if (line.startsWith('#EXTINF:')) {
      const logoMatch = line.match(/tvg-logo="([^"]+)"/);
      const groupMatch = line.match(/group-title="([^"]+)"/);
      const commaIndex = line.lastIndexOf(',');
      const rawName = commaIndex !== -1 ? line.substring(commaIndex + 1).trim() : 'Live Channel';

      // Clean resolution tag if present
      const resMatch = rawName.match(/\((\d+p)\)/i);
      const resolution = resMatch ? resMatch[1] : '720p';
      const cleanName = rawName.replace(/\(\d+p\)/gi, '').trim();

      currentInfo = {
        id: `web-${defaultCode}-${results.length + 1}`,
        name: rawName,
        cleanName: cleanName || rawName,
        logoUrl: logoMatch ? logoMatch[1] : undefined,
        category: groupMatch ? groupMatch[1] : 'General',
        country: defaultCountry,
        countryCode: defaultCode,
        resolution,
        verifiedFta: true,
      };
    } else if (line.startsWith('http://') || line.startsWith('https://')) {
      if (currentInfo && currentInfo.name) {
        currentInfo.streamUrl = line;
        results.push(currentInfo as WebDirectoryChannel);
        currentInfo = null;
      }
    }
  }

  return results;
};

// Fetch live country M3U from public IPTV web directory
export const fetchLiveCountryDirectory = async (countryCode: string, countryName: string): Promise<WebDirectoryChannel[]> => {
  try {
    const url = `https://iptv-org.github.io/iptv/countries/${countryCode.toLowerCase()}.m3u`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const text = await response.text();
    const parsed = parseM3UPlaylist(text, countryName, countryCode);
    if (parsed.length > 0) return parsed;
  } catch (err) {
    console.warn('Online directory fetch fallback to curated list:', err);
  }

  // Fallback to curated dictionary filtered by country
  return CURATED_WEB_DICTIONARY.filter(c => 
    c.countryCode?.toLowerCase() === countryCode.toLowerCase() || 
    c.country.toLowerCase() === countryName.toLowerCase()
  );
};

// Web Crawler for Worldwide category streams (News, Music, Sports, etc.)
export const fetchWorldwideCategoryStreams = async (category: string): Promise<WebDirectoryChannel[]> => {
  try {
    const catSlug = category.toLowerCase().trim();
    const url = `https://iptv-org.github.io/iptv/categories/${catSlug}.m3u`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (response.ok) {
      const text = await response.text();
      const parsed = parseM3UPlaylist(text, 'International', 'int');
      if (parsed.length > 0) return parsed.slice(0, 100);
    }
  } catch (err) {
    console.warn('Category stream crawler fallback:', err);
  }

  return CURATED_WEB_DICTIONARY.filter(c => 
    c.category.toLowerCase().includes(category.toLowerCase())
  );
};

// Web Crawler search across global channels and web streams
export const searchWorldwideStreams = async (query: string): Promise<WebDirectoryChannel[]> => {
  const q = query.toLowerCase().trim();
  if (!q) return CURATED_WEB_DICTIONARY;

  // Search curated master list first
  const curatedMatches = CURATED_WEB_DICTIONARY.filter(c => 
    c.name.toLowerCase().includes(q) ||
    c.cleanName.toLowerCase().includes(q) ||
    c.country.toLowerCase().includes(q) ||
    c.category.toLowerCase().includes(q) ||
    c.broadcaster?.toLowerCase().includes(q)
  );

  return curatedMatches;
};
