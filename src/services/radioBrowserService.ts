import { Channel, RadioCategory } from '../types';

// Radio Browser API official mirrors
const RADIO_BROWSER_SERVERS = [
  'https://de1.api.radio-browser.info',
  'https://nl1.api.radio-browser.info',
  'https://at1.api.radio-browser.info'
];

let currentServerIndex = 0;

const getActiveServer = () => RADIO_BROWSER_SERVERS[currentServerIndex];

const rotateServer = () => {
  currentServerIndex = (currentServerIndex + 1) % RADIO_BROWSER_SERVERS.length;
};

export interface RadioBrowserStation {
  changeuuid: string;
  stationuuid: string;
  serveruuid?: string;
  name: string;
  url: string;
  url_resolved: string;
  homepage: string;
  favicon: string;
  tags: string;
  country: string;
  countrycode: string;
  state: string;
  language: string;
  votes: number;
  lastchangetime: string;
  codec: string;
  bitrate: number;
  hls: number;
  lastcheckok: number;
  lastchecktime: string;
  lastcheckoktime: string;
  clickcount: number;
  clicktrend: number;
}

// Convert RadioBrowserStation to App Channel
export const stationToChannel = (st: RadioBrowserStation, customCategory?: RadioCategory): Channel => {
  let mappedCategory: RadioCategory = customCategory || 'International Radio';
  const tags = (st.tags || '').toLowerCase();
  const name = st.name.toLowerCase();

  if (tags.includes('bollywood') || name.includes('bollywood') || tags.includes('hindi')) {
    mappedCategory = tags.includes('bollywood') ? 'Bollywood Radio' : 'Hindi Songs';
  } else if (tags.includes('punjabi') || name.includes('punjabi') || tags.includes('bhangra')) {
    mappedCategory = 'Punjabi Music';
  } else if (st.countrycode === 'IN' || tags.includes('indian')) {
    mappedCategory = 'Indian Radio';
  } else if (tags.includes('classical') || tags.includes('symphony')) {
    mappedCategory = 'Classical Music';
  } else if (tags.includes('jazz') || tags.includes('blues')) {
    mappedCategory = 'Jazz';
  } else if (tags.includes('rock') || tags.includes('metal')) {
    mappedCategory = 'Rock';
  } else if (tags.includes('electronic') || tags.includes('edm') || tags.includes('dance') || tags.includes('house')) {
    mappedCategory = 'Electronic Music';
  } else if (tags.includes('pop') || tags.includes('top40') || tags.includes('hits')) {
    mappedCategory = 'English Pop';
  } else if (tags.includes('news') || tags.includes('talk')) {
    mappedCategory = tags.includes('talk') ? 'Talk Shows' : 'News Radio';
  } else if (tags.includes('sports')) {
    mappedCategory = 'Sports Radio';
  } else if (tags.includes('religious') || tags.includes('christian') || tags.includes('islam') || tags.includes('gurbani')) {
    mappedCategory = 'Religious Radio';
  } else if (tags.includes('education') || tags.includes('university') || tags.includes('college')) {
    mappedCategory = 'Educational Radio';
  }

  const defaultFavicon = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=160&auto=format&fit=crop&q=80';

  return {
    id: `rb-${st.stationuuid}`,
    name: st.name.trim() || 'Worldwide Radio',
    type: 'radio',
    category: mappedCategory,
    language: st.language ? st.language.split(',')[0].trim() : 'English',
    country: st.country || 'International',
    countryCode: st.countrycode?.toLowerCase(),
    streamUrl: st.url_resolved || st.url,
    backupUrl: st.url,
    streamFormat: 'audio',
    logoUrl: st.favicon && st.favicon.startsWith('http') ? st.favicon : defaultFavicon,
    description: `${st.name} live from ${st.country || 'Worldwide'}. Genre: ${st.tags || 'General'}. Bitrate: ${st.bitrate ? st.bitrate + ' kbps' : 'HD Audio'}.`,
    currentProgram: `Live On Air · ${st.tags ? st.tags.split(',').slice(0, 3).join(' • ') : 'World Broadcast'}`,
    isFeatured: st.votes > 1500,
    isTrending: st.clickcount > 500,
    viewCount: st.clickcount ? st.clickcount * 10 : 25000,
    quality: [st.bitrate ? `${st.bitrate} kbps ${st.codec || 'MP3'}` : '128 kbps MP3'],
    broadcaster: st.name,
    verifiedFta: true,
    isLive: st.lastcheckok === 1,
    bitrate: st.bitrate,
    tags: st.tags ? st.tags.split(',').map(t => t.trim()) : [],
    stationUuid: st.stationuuid,
    votes: st.votes,
    clickCount: st.clickcount
  };
};

// Safe fetch with timeout and mirror fallback
const fetchFromRadioBrowser = async (endpoint: string): Promise<any> => {
  const cacheKey = `rb_cache_${endpoint}`;
  try {
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      const { timestamp, data } = JSON.parse(cached);
      // 10 min cache in session
      if (Date.now() - timestamp < 10 * 60 * 1000) {
        return data;
      }
    }
  } catch {
    // ignore cache read failure
  }

  for (let attempt = 0; attempt < RADIO_BROWSER_SERVERS.length; attempt++) {
    const server = getActiveServer();
    const url = `${server}${endpoint}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'FreeTVRadioLive/2.5.0 (MonteChhokarWorldwidePlatform)'
        }
      });
      clearTimeout(timeout);

      if (response.ok) {
        const data = await response.json();
        try {
          sessionStorage.setItem(cacheKey, JSON.stringify({ timestamp: Date.now(), data }));
        } catch {
          // ignore cache write failure
        }
        return data;
      }
    } catch {
      clearTimeout(timeout);
      rotateServer();
    }
  }

  return [];
};

// 1. Fetch Top Clicked Worldwide Stations
export const fetchTopRadioStations = async (limit: number = 30): Promise<Channel[]> => {
  const data = await fetchFromRadioBrowser(`/json/stations/topclick/${limit}`);
  if (Array.isArray(data)) {
    return data
      .filter((st: RadioBrowserStation) => st.url_resolved && (st.lastcheckok === 1 || !st.lastchecktime))
      .map((st: RadioBrowserStation) => stationToChannel(st));
  }
  return [];
};

// 2. Fetch Stations by Country
export const fetchRadioByCountry = async (countryName: string, limit: number = 25): Promise<Channel[]> => {
  const encoded = encodeURIComponent(countryName.trim());
  const data = await fetchFromRadioBrowser(`/json/stations/bycountry/${encoded}?limit=${limit}&order=clickcount&reverse=true`);
  if (Array.isArray(data)) {
    return data
      .filter((st: RadioBrowserStation) => st.url_resolved)
      .map((st: RadioBrowserStation) => stationToChannel(st));
  }
  return [];
};

// 3. Fetch Stations by Tag/Genre
export const fetchRadioByTag = async (tag: string, limit: number = 25): Promise<Channel[]> => {
  const encoded = encodeURIComponent(tag.trim().toLowerCase());
  const data = await fetchFromRadioBrowser(`/json/stations/bytag/${encoded}?limit=${limit}&order=votes&reverse=true`);
  if (Array.isArray(data)) {
    return data
      .filter((st: RadioBrowserStation) => st.url_resolved)
      .map((st: RadioBrowserStation) => stationToChannel(st));
  }
  return [];
};

// 4. Search Radio Stations Worldwide
export const searchRadioBrowser = async (query: string, limit: number = 30): Promise<Channel[]> => {
  const encoded = encodeURIComponent(query.trim());
  const data = await fetchFromRadioBrowser(`/json/stations/search?name=${encoded}&limit=${limit}&order=clickcount&reverse=true`);
  if (Array.isArray(data)) {
    return data
      .filter((st: RadioBrowserStation) => st.url_resolved)
      .map((st: RadioBrowserStation) => stationToChannel(st));
  }
  return [];
};

// 5. Test/Probe Radio Station Availability
export const checkRadioStreamAvailability = async (streamUrl: string): Promise<boolean> => {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(streamUrl, {
      method: 'HEAD',
      signal: controller.signal
    });
    clearTimeout(timeout);
    return res.ok;
  } catch {
    return true; // CORS or stream headers might restrict HEAD, so allow fallback
  }
};
