import { Channel, TVCategory, CountryDirectoryItem, Adult18CatalogResponse, Adult18DirectoryEntry } from '../types';

// IPTV-org base CDN endpoints & JSON API
const IPTV_ORG_BASE = 'https://iptv-org.github.io/iptv';
export const IPTV_ORG_API_BASE = 'https://iptv-org.github.io/api';
export const IPTV_ORG_SPORTS_PLAYLIST_URL = `${IPTV_ORG_BASE}/categories/sports.m3u`;
export const IPTV_ORG_XXX_PLAYLIST_URL = `${IPTV_ORG_BASE}/categories/xxx.m3u`;
export const IPTV_ORG_API_ENDPOINTS = {
  channels: `${IPTV_ORG_API_BASE}/channels.json`,
  streams: `${IPTV_ORG_API_BASE}/streams.json`,
  logos: `${IPTV_ORG_API_BASE}/logos.json`,
  categories: `${IPTV_ORG_API_BASE}/categories.json`,
  feeds: `${IPTV_ORG_API_BASE}/feeds.json`,
};

// The 22+ Target Countries required by the user
export const WORLD_COUNTRIES: CountryDirectoryItem[] = [
  { name: 'India', code: 'in', flag: '🇮🇳', region: 'South Asia', popularLanguage: 'Hindi, Tamil, Telugu, Punjabi' },
  { name: 'USA', code: 'us', flag: '🇺🇸', region: 'North America', popularLanguage: 'English, Spanish' },
  { name: 'UK', code: 'uk', flag: '🇬🇧', region: 'Europe', popularLanguage: 'English' },
  { name: 'Canada', code: 'ca', flag: '🇨🇦', region: 'North America', popularLanguage: 'English, French' },
  { name: 'Australia', code: 'au', flag: '🇦🇺', region: 'Oceania', popularLanguage: 'English' },
  { name: 'Germany', code: 'de', flag: '🇩🇪', region: 'Europe', popularLanguage: 'German' },
  { name: 'France', code: 'fr', flag: '🇫🇷', region: 'Europe', popularLanguage: 'French' },
  { name: 'Japan', code: 'jp', flag: '🇯🇵', region: 'East Asia', popularLanguage: 'Japanese' },
  { name: 'China', code: 'cn', flag: '🇨🇳', region: 'East Asia', popularLanguage: 'Mandarin' },
  { name: 'South Korea', code: 'kr', flag: '🇰🇷', region: 'East Asia', popularLanguage: 'Korean' },
  { name: 'UAE', code: 'ae', flag: '🇦🇪', region: 'Middle East', popularLanguage: 'Arabic, English' },
  { name: 'Saudi Arabia', code: 'sa', flag: '🇸🇦', region: 'Middle East', popularLanguage: 'Arabic' },
  { name: 'Pakistan', code: 'pk', flag: '🇵🇰', region: 'South Asia', popularLanguage: 'Urdu, Punjabi' },
  { name: 'Bangladesh', code: 'bd', flag: '🇧🇩', region: 'South Asia', popularLanguage: 'Bengali' },
  { name: 'Nepal', code: 'np', flag: '🇳🇵', region: 'South Asia', popularLanguage: 'Nepali' },
  { name: 'Sri Lanka', code: 'lk', flag: '🇱🇰', region: 'South Asia', popularLanguage: 'Sinhala, Tamil' },
  { name: 'Brazil', code: 'br', flag: '🇧🇷', region: 'South America', popularLanguage: 'Portuguese' },
  { name: 'South Africa', code: 'za', flag: '🇿🇦', region: 'Africa', popularLanguage: 'English, Zulu' },
  { name: 'Italy', code: 'it', flag: '🇮🇹', region: 'Europe', popularLanguage: 'Italian' },
  { name: 'Spain', code: 'es', flag: '🇪🇸', region: 'Europe', popularLanguage: 'Spanish' },
  { name: 'Russia', code: 'ru', flag: '🇷🇺', region: 'Eurasia', popularLanguage: 'Russian' },
  { name: 'Qatar', code: 'qa', flag: '🇶🇦', region: 'Middle East', popularLanguage: 'Arabic, English' },
  { name: 'Singapore', code: 'sg', flag: '🇸🇬', region: 'Southeast Asia', popularLanguage: 'English, Malay, Chinese' },
  { name: 'Other Countries', code: 'int', flag: '🌐', region: 'Worldwide', popularLanguage: 'Multilingual' },
];

const COUNTRY_CODE_MAP: Record<string, { name: string; language: string }> = {
  in: { name: 'India', language: 'Hindi' },
  us: { name: 'USA', language: 'English' },
  uk: { name: 'UK', language: 'English' },
  gb: { name: 'UK', language: 'English' },
  ca: { name: 'Canada', language: 'English' },
  au: { name: 'Australia', language: 'English' },
  de: { name: 'Germany', language: 'German' },
  fr: { name: 'France', language: 'French' },
  jp: { name: 'Japan', language: 'Japanese' },
  cn: { name: 'China', language: 'Chinese' },
  kr: { name: 'South Korea', language: 'Korean' },
  ae: { name: 'UAE', language: 'Arabic' },
  sa: { name: 'Saudi Arabia', language: 'Arabic' },
  pk: { name: 'Pakistan', language: 'Urdu' },
  bd: { name: 'Bangladesh', language: 'Bengali' },
  np: { name: 'Nepal', language: 'Nepali' },
  lk: { name: 'Sri Lanka', language: 'Sinhala' },
  br: { name: 'Brazil', language: 'Portuguese' },
  za: { name: 'South Africa', language: 'English' },
  it: { name: 'Italy', language: 'Italian' },
  es: { name: 'Spain', language: 'Spanish' },
  ru: { name: 'Russia', language: 'Russian' },
  qa: { name: 'Qatar', language: 'Arabic' },
  sg: { name: 'Singapore', language: 'English' },
  tr: { name: 'Turkey', language: 'Turkish' },
  il: { name: 'Israel', language: 'Hebrew' },
  mx: { name: 'Mexico', language: 'Spanish' },
  ar: { name: 'Argentina', language: 'Spanish' },
  pt: { name: 'Portugal', language: 'Portuguese' },
  nl: { name: 'Netherlands', language: 'Dutch' },
  pl: { name: 'Poland', language: 'Polish' },
  at: { name: 'Austria', language: 'German' },
  ch: { name: 'Switzerland', language: 'German' },
};

// Helper to map M3U category / group-title / channel name to standard 20 TV categories
export const mapToStandardTVCategory = (groupTitle: string, channelName: string, country: string): TVCategory => {
  const g = (groupTitle || '').toLowerCase();
  const n = (channelName || '').toLowerCase();
  const c = (country || '').toLowerCase();

  // News breakdowns
  if (g.includes('news') || n.includes('news') || n.includes('samachar') || n.includes('khabar')) {
    if (c === 'india' || c === 'in') return 'India News';
    if (c === 'usa' || c === 'united states' || c === 'us') return 'USA News';
    if (c === 'uk' || c === 'united kingdom' || c === 'gb') return 'UK News';
    return 'World News';
  }

  // Sports breakdowns
  if (g.includes('cricket') || n.includes('cricket')) return 'Cricket';
  if (g.includes('football') || n.includes('soccer') || n.includes('football') || n.includes('liga')) return 'Football';
  if (g.includes('sport') || n.includes('sport') || n.includes('espn') || n.includes('golf') || n.includes('tennis') || n.includes('racing') || n.includes('moto') || n.includes('fight') || n.includes('wrestling')) return 'Sports';

  // Movies & Cinema
  if (g.includes('bollywood') || n.includes('bollywood') || (n.includes('cinema') && (c === 'india' || c === 'in'))) return 'Bollywood';
  if (g.includes('hollywood') || n.includes('hollywood') || g.includes('movie') || g.includes('film') || n.includes('cinema')) return 'Movies';

  // Music
  if (g.includes('music') || n.includes('music') || n.includes('hits') || n.includes('songs')) return 'Music';

  // Kids
  if (g.includes('kids') || g.includes('animation') || n.includes('cartoon') || n.includes('kids') || n.includes('junior')) return 'Kids & Cartoons';

  // Documentary & Educational
  if (g.includes('documentary') || n.includes('docu') || n.includes('history') || n.includes('geo')) return 'Documentary';
  if (g.includes('educational') || n.includes('science') || n.includes('nasa') || n.includes('edu') || n.includes('learn')) return 'Educational';

  // Religious
  if (g.includes('religious') || g.includes('spiritual') || n.includes('gurbani') || n.includes('satsang') || n.includes('islam') || n.includes('church') || n.includes('bhakti')) return 'Religious';

  // Business
  if (g.includes('business') || g.includes('finance') || n.includes('bloomberg') || n.includes('cnbc') || n.includes('market')) return 'Business';

  // Lifestyle & Shopping
  if (g.includes('lifestyle') || n.includes('cooking') || n.includes('food') || n.includes('travel')) return 'Lifestyle';
  if (g.includes('shop') || n.includes('qvc') || n.includes('hsn') || n.includes('tvc')) return 'Shopping';

  // Regional TV
  if (g.includes('regional') || g.includes('local') || n.includes('punjabi') || n.includes('tamil') || n.includes('telugu') || n.includes('bhojpuri') || n.includes('marathi')) return 'Regional TV';

  // Adult / 18+
  if (g === 'xxx' || g.includes('adult') || g.includes('18+') || g.includes('nsfw')) return '18+ Adult';

  // Default to Entertainment
  return 'Entertainment';
};

// Parse an M3U stream list into standard Channels
export const parseM3UToChannels = (
  m3uContent: string,
  defaultCountry: string,
  defaultCode: string,
  forceCategory?: TVCategory
): Channel[] => {
  const lines = m3uContent.split(/\r?\n/);
  const channels: Channel[] = [];
  const seenUrls = new Set<string>();
  let currentMeta: Partial<Channel> | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    if (line.startsWith('#EXTINF:')) {
      const tvgIdRaw = line.match(/tvg-id="([^"]*)"/i)?.[1]?.trim() || '';
      const logoMatch = line.match(/tvg-logo="([^"]+)"/i);
      const groupMatch = line.match(/group-title="([^"]+)"/i);
      const commaIdx = line.lastIndexOf(',');
      const rawName = commaIdx !== -1 ? line.substring(commaIdx + 1).trim() : 'Live Channel';

      const isGeoBlocked = /\[geo-blocked\]/i.test(rawName);
      const resMatch = rawName.match(/\((\d+p)\)/i);
      const resolution = resMatch ? resMatch[1] : '720p';
      const cleanName = rawName
        .replace(/\(\d+p\)/gi, '')
        .replace(/\[.*?\]/g, '')
        .replace(/\s+/g, ' ')
        .trim();

      // Infer country code from iptv-org tvg-id (e.g. "ACCDigitalNetwork.us@SD" -> "us")
      const cleanTvgId = tvgIdRaw.replace(/@(SD|HD|FHD|UHD|4K)$/i, '');
      const idCountryMatch = cleanTvgId.match(/\.([a-z]{2})$/i);
      const inferredCode = idCountryMatch ? idCountryMatch[1].toLowerCase() : defaultCode.toLowerCase();
      const countryMeta = COUNTRY_CODE_MAP[inferredCode];
      const resolvedCountry = countryMeta ? countryMeta.name : defaultCountry;
      const resolvedLang = countryMeta ? countryMeta.language : (defaultCountry === 'India' ? 'Hindi' : 'English');

      const groupTitle = groupMatch ? groupMatch[1] : 'General';
      const mappedCat = forceCategory || mapToStandardTVCategory(groupTitle, cleanName, resolvedCountry);
      const slug = (cleanTvgId || cleanName).toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 18) || 'ch';

      currentMeta = {
        id: `iptv-${inferredCode}-${slug}-${channels.length + 1}`,
        name: cleanName || rawName,
        type: 'tv',
        category: mappedCat,
        country: resolvedCountry,
        countryCode: inferredCode.toUpperCase(),
        language: resolvedLang,
        logoUrl: logoMatch ? logoMatch[1] : 'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?w=160&auto=format&fit=crop&q=80',
        description: `IPTV-org ${groupTitle} broadcast (${resolvedCountry}) · Resolution: ${resolution}${isGeoBlocked ? ' · Geo-restricted' : ''}`,
        currentProgram: `Live: ${cleanName || rawName}`,
        quality: [resolution, 'Auto'],
        broadcaster: cleanName || rawName,
        verifiedFta: true,
        streamFormat: 'hls',
        isLive: true,
        tvgId: cleanTvgId || undefined,
        groupTitle,
        isGeoBlocked,
        viewCount: 15000 + ((channels.length * 937) % 35000),
      };
    } else if (line.startsWith('http://') || line.startsWith('https://')) {
      if (currentMeta && currentMeta.name && !seenUrls.has(line)) {
        seenUrls.add(line);
        let format: 'hls' | 'youtube' | 'mp4' = 'hls';
        if (line.includes('youtube.com') || line.includes('youtu.be')) {
          format = 'youtube';
        } else if (line.endsWith('.mp4')) {
          format = 'mp4';
        }
        currentMeta.streamUrl = line;
        currentMeta.streamFormat = format;
        currentMeta.backupUrl = 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8';
        channels.push(currentMeta as Channel);
        currentMeta = null;
      }
    }
  }

  return channels;
};

// Fetch Live Channels for any Country from IPTV-org
export const fetchChannelsByCountry = async (countryCode: string, countryName: string): Promise<Channel[]> => {
  const cacheKey = `iptv_country_${countryCode.toLowerCase()}`;
  try {
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      const { timestamp, data } = JSON.parse(cached);
      if (Date.now() - timestamp < 15 * 60 * 1000 && Array.isArray(data) && data.length > 0) {
        return data;
      }
    }
  } catch {
    // ignore
  }

  try {
    const targetCode = countryCode.toLowerCase() === 'uk' ? 'uk' : countryCode.toLowerCase();
    const url = `${IPTV_ORG_BASE}/countries/${targetCode}.m3u`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (res.ok) {
      const text = await res.text();
      const parsed = parseM3UToChannels(text, countryName, countryCode);
      if (parsed.length > 0) {
        const sorted = [...parsed].sort((a, b) => {
          const aHttps = a.streamUrl.startsWith('https://') ? 0 : 1;
          const bHttps = b.streamUrl.startsWith('https://') ? 0 : 1;
          return aHttps - bHttps;
        });
        const limited = sorted.slice(0, 80);
        try {
          sessionStorage.setItem(cacheKey, JSON.stringify({ timestamp: Date.now(), data: limited }));
        } catch {
          // ignore
        }
        return limited;
      }
    }
  } catch (err) {
    console.warn(`Could not load live IPTV for ${countryName}:`, err);
  }

  return [];
};

// Fetch Category Channels from IPTV-org (e.g. sports, news, music, movies, kids, documentary)
export const fetchChannelsByCategory = async (categorySlug: string, limit: number = 300): Promise<Channel[]> => {
  const slug = categorySlug.toLowerCase();
  const cacheKey = `iptv_cat_v3_${slug}_${limit}`;
  try {
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      const { timestamp, data } = JSON.parse(cached);
      if (Date.now() - timestamp < 15 * 60 * 1000 && Array.isArray(data) && data.length > 0) {
        return data;
      }
    }
  } catch {
    // ignore
  }

  try {
    const url = `${IPTV_ORG_BASE}/categories/${slug}.m3u`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (res.ok) {
      const text = await res.text();
      const parsed = parseM3UToChannels(
        text,
        'International',
        'int',
        slug === 'sports' ? 'Sports' : undefined
      );
      if (parsed.length > 0) {
        // Prioritize HTTPS streams first for smooth browser playback
        const sorted = [...parsed].sort((a, b) => {
          const aHttps = a.streamUrl.startsWith('https://') ? 0 : 1;
          const bHttps = b.streamUrl.startsWith('https://') ? 0 : 1;
          return aHttps - bHttps;
        });
        const limited = sorted.slice(0, limit);
        try {
          sessionStorage.setItem(cacheKey, JSON.stringify({ timestamp: Date.now(), data: limited }));
        } catch {
          // ignore
        }
        return limited;
      }
    }
  } catch (err) {
    console.warn(`Could not load category ${categorySlug}:`, err);
  }

  return [];
};

// Convenience wrapper for https://iptv-org.github.io/iptv/categories/sports.m3u
export const fetchIptvOrgSportsChannels = async (): Promise<Channel[]> => {
  return fetchChannelsByCategory('sports', 600);
};

const ADULT18_FALLBACK_LOGO =
  'https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?w=160&auto=format&fit=crop&q=80';

function mapRawAdultChannelToAppChannel(raw: {
  id: string;
  name: string;
  tvgId?: string;
  tvgLogo?: string;
  tvgCountry?: string;
  streamUrl: string;
  streamFormat?: 'hls' | 'youtube' | 'mp4';
  quality?: string[];
  broadcaster?: string;
  website?: string | null;
}): Channel {
  const code = (raw.tvgCountry || 'INT').toLowerCase();
  const countryMeta = COUNTRY_CODE_MAP[code];
  const resolvedCountry = countryMeta ? countryMeta.name : (raw.tvgCountry || 'International');
  const resolvedLang = countryMeta ? countryMeta.language : 'English';

  return {
    id: raw.id,
    name: raw.name,
    type: 'tv',
    category: '18+ Adult',
    language: resolvedLang,
    country: resolvedCountry,
    countryCode: code.toUpperCase(),
    streamUrl: raw.streamUrl,
    streamFormat: raw.streamFormat || 'hls',
    logoUrl: raw.tvgLogo || ADULT18_FALLBACK_LOGO,
    description: `18+ Adult / XXX Category · ${raw.broadcaster || raw.name}${raw.website ? ` (${raw.website})` : ''}`,
    currentProgram: `18+ Restricted Broadcast · ${raw.name}`,
    quality: raw.quality || ['Auto'],
    broadcaster: raw.broadcaster || raw.name,
    verifiedFta: true,
    isLive: true,
    tvgId: raw.tvgId || undefined,
    groupTitle: '18+ Adult',
    tags: ['18+', 'nsfw', 'xxx'],
  };
}

// Fetch isolated 18+ / NSFW catalog from iptv-org API + playlists
export const fetchAdult18Catalog = async (forceRefresh = false): Promise<Adult18CatalogResponse> => {
  const cacheKey = 'iptv_adult18_catalog_v1';
  if (!forceRefresh) {
    try {
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        const { timestamp, data } = JSON.parse(cached);
        if (Date.now() - timestamp < 15 * 60 * 1000 && data?.directoryEntries) {
          return data as Adult18CatalogResponse;
        }
      }
    } catch {
      // ignore cache errors
    }
  }

  try {
    const res = await fetch('/api/iptv/adult18');
    if (res.ok) {
      const data = await res.json();
      const playableChannels = Array.isArray(data.playableChannels)
        ? data.playableChannels.map(mapRawAdultChannelToAppChannel)
        : [];
      const payload: Adult18CatalogResponse = {
        category: data.category || { id: 'xxx', name: 'XXX', description: 'Programming is adult oriented and x-rated' },
        playlistUrl: data.playlistUrl || IPTV_ORG_XXX_PLAYLIST_URL,
        apiEndpoints: data.apiEndpoints || {
          channels: IPTV_ORG_API_ENDPOINTS.channels,
          streams: IPTV_ORG_API_ENDPOINTS.streams,
          logos: IPTV_ORG_API_ENDPOINTS.logos,
          categories: IPTV_ORG_API_ENDPOINTS.categories,
        },
        playableChannels,
        directoryEntries: (data.directoryEntries || []) as Adult18DirectoryEntry[],
        totalDirectoryCount: data.totalDirectoryCount || (data.directoryEntries?.length ?? 0),
        totalPlayableCount: playableChannels.length,
        cachedAt: data.cachedAt || new Date().toISOString(),
      };
      try {
        sessionStorage.setItem(cacheKey, JSON.stringify({ timestamp: Date.now(), data: payload }));
      } catch {
        // ignore quota errors
      }
      return payload;
    }
  } catch {
    // fallback directly to iptv-org JSON API in browser
  }

  const [channelsRes, streamsRes, logosRes] = await Promise.all([
    fetch(IPTV_ORG_API_ENDPOINTS.channels),
    fetch(IPTV_ORG_API_ENDPOINTS.streams),
    fetch(IPTV_ORG_API_ENDPOINTS.logos),
  ]);

  if (!channelsRes.ok || !streamsRes.ok) {
    throw new Error('Unable to fetch IPTV-org 18+ API catalog');
  }

  const [rawChannels, rawStreams, rawLogos] = await Promise.all([
    channelsRes.json(),
    streamsRes.json(),
    logosRes.ok ? logosRes.json() : Promise.resolve([]),
  ]);

  const nsfwChannels = (rawChannels as Array<Record<string, unknown>>).filter(
    c => Boolean(c.is_nsfw) || (Array.isArray(c.categories) && (c.categories as string[]).includes('xxx'))
  );
  const channelMap = new Map<string, Record<string, unknown>>();
  nsfwChannels.forEach(c => channelMap.set(String(c.id), c));

  const logoMap = new Map<string, string>();
  (rawLogos as Array<{ channel?: string; url?: string }>).forEach(l => {
    if (l.channel && l.url && !logoMap.has(l.channel)) logoMap.set(l.channel, l.url);
  });

  const streamByChannel = new Map<string, { url: string; quality?: string | null; labels?: string[] }>();
  const playableChannels: Channel[] = [];
  const seenUrls = new Set<string>();

  (rawStreams as Array<{ channel?: string; title?: string; url?: string; quality?: string | null; labels?: string[] }>).forEach(s => {
    if (!s.channel || !s.url || !channelMap.has(s.channel) || seenUrls.has(s.url)) return;
    seenUrls.add(s.url);
    if (!streamByChannel.has(s.channel)) {
      streamByChannel.set(s.channel, { url: s.url, quality: s.quality, labels: s.labels });
    }
    const ch = channelMap.get(s.channel)!;
    playableChannels.push(
      mapRawAdultChannelToAppChannel({
        id: `adult18-${String(ch.id).toLowerCase().replace(/[^a-z0-9]/g, '')}-${playableChannels.length + 1}`,
        name: s.title || String(ch.name),
        tvgId: String(ch.id),
        tvgLogo: logoMap.get(String(ch.id)) || '',
        tvgCountry: String(ch.country || 'INT'),
        streamUrl: s.url,
        streamFormat: s.url.endsWith('.mp4') ? 'mp4' : 'hls',
        quality: s.quality ? [s.quality, 'Auto'] : ['Auto'],
        broadcaster: String(ch.network || ch.name),
        website: (ch.website as string | null) || null,
      })
    );
  });

  const directoryEntries: Adult18DirectoryEntry[] = nsfwChannels.map(ch => {
    const id = String(ch.id);
    const matched = streamByChannel.get(id);
    return {
      id,
      name: String(ch.name),
      country: String(ch.country || 'INT'),
      categories: Array.isArray(ch.categories) ? (ch.categories as string[]) : ['xxx'],
      isNsfw: Boolean(ch.is_nsfw),
      network: (ch.network as string | null) || null,
      owners: Array.isArray(ch.owners) ? (ch.owners as string[]) : [],
      website: (ch.website as string | null) || null,
      launched: (ch.launched as string | null) || null,
      closed: (ch.closed as string | null) || null,
      logoUrl: logoMap.get(id),
      streamUrl: matched?.url,
      streamFormat: matched?.url ? (matched.url.endsWith('.mp4') ? 'mp4' : 'hls') : undefined,
      quality: matched?.quality || null,
      labels: matched?.labels || [],
    };
  });

  directoryEntries.sort((a, b) => (a.streamUrl ? 0 : 1) - (b.streamUrl ? 0 : 1) || a.name.localeCompare(b.name));

  return {
    category: { id: 'xxx', name: 'XXX', description: 'Programming is adult oriented and x-rated' },
    playlistUrl: IPTV_ORG_XXX_PLAYLIST_URL,
    apiEndpoints: {
      channels: IPTV_ORG_API_ENDPOINTS.channels,
      streams: IPTV_ORG_API_ENDPOINTS.streams,
      logos: IPTV_ORG_API_ENDPOINTS.logos,
      categories: IPTV_ORG_API_ENDPOINTS.categories,
    },
    playableChannels,
    directoryEntries,
    totalDirectoryCount: directoryEntries.length,
    totalPlayableCount: playableChannels.length,
    cachedAt: new Date().toISOString(),
  };
};

// Parse a custom external 18+ M3U/M3U8 playlist isolated to the 18+ section
export const fetchAdult18CustomPlaylist = async (playlistUrl: string): Promise<Channel[]> => {
  const trimmed = playlistUrl.trim();
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    throw new Error('Playlist URL must start with http:// or https://');
  }

  try {
    const res = await fetch(`/api/iptv/playlist?url=${encodeURIComponent(trimmed)}`);
    if (res.ok) {
      const data = await res.json();
      const rawChannels = Array.isArray(data.channels) ? data.channels : [];
      return rawChannels.map((raw: {
        id: string;
        name: string;
        tvgId?: string;
        tvgLogo?: string;
        tvgCountry?: string;
        streamUrl: string;
        streamFormat?: 'hls' | 'youtube' | 'mp4';
        groupTitle?: string;
      }, idx: number) =>
        mapRawAdultChannelToAppChannel({
          id: `adult18-m3u-${idx + 1}-${(raw.tvgId || raw.name).toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 14)}`,
          name: raw.name,
          tvgId: raw.tvgId,
          tvgLogo: raw.tvgLogo,
          tvgCountry: raw.tvgCountry || 'INT',
          streamUrl: raw.streamUrl,
          streamFormat: raw.streamFormat || 'hls',
          broadcaster: raw.groupTitle || 'Custom 18+ M3U',
        })
      );
    }
  } catch {
    // Fallback to direct client fetch
  }

  const directRes = await fetch(trimmed);
  if (!directRes.ok) {
    throw new Error(`Could not fetch M3U playlist (${directRes.status})`);
  }
  const text = await directRes.text();
  return parseM3UToChannels(text, 'International', 'int', '18+ Adult');
};

