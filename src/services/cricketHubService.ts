import { Channel, CricketHubResponse } from '../types';
import { searchRadioBrowser, fetchRadioByTag } from './radioBrowserService';

export const CRICKET_SOURCE_LINKS = [
  {
    id: 'cricombo-home',
    label: 'Cricombo',
    subtitle: 'Live scores, match schedules & predictions',
    url: 'https://cricombo.com/',
  },
  {
    id: 'cricombo-live',
    label: 'Cricombo Live Streams',
    subtitle: 'Official YouTube live cricket streams',
    url: 'https://cricombo.com/live-streams',
  },
  {
    id: 'cricketonair-home',
    label: 'Cricket On Air',
    subtitle: 'Where to watch cricket by country',
    url: 'https://cricketonair.com/',
  },
  {
    id: 'cricketonair-free',
    label: 'Free Live Cricket',
    subtitle: 'Official free cricket broadcasts & highlights',
    url: 'https://cricketonair.com/free-live-cricket',
  },
] as const;

const CACHE_KEY = 'ftr_cricket_hub_v1';
const CACHE_TTL_MS = 5 * 60 * 1000;

export async function fetchCricketHub(forceRefresh = false): Promise<CricketHubResponse> {
  if (!forceRefresh) {
    try {
      const cached = sessionStorage.getItem(CACHE_KEY);
      if (cached) {
        const { timestamp, data } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_TTL_MS && data?.liveStreams) {
          return data as CricketHubResponse;
        }
      }
    } catch {
      // ignore storage errors
    }
  }

  const res = await fetch(`/api/cricket/hub${forceRefresh ? '?refresh=1' : ''}`);
  if (!res.ok) {
    throw new Error(`Cricket Hub API error (${res.status})`);
  }

  const data = (await res.json()) as CricketHubResponse;
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ timestamp: Date.now(), data }));
  } catch {
    // ignore storage quota errors
  }

  return data;
}

export async function fetchCricketRadioStations(): Promise<Channel[]> {
  try {
    const [cricketSearch, cricketTag, sportsTag] = await Promise.all([
      searchRadioBrowser('cricket', 16).catch(() => [] as Channel[]),
      fetchRadioByTag('cricket', 16).catch(() => [] as Channel[]),
      fetchRadioByTag('sports', 16).catch(() => [] as Channel[]),
    ]);

    const seen = new Set<string>();
    const combined: Channel[] = [];

    for (const st of [...cricketSearch, ...cricketTag, ...sportsTag]) {
      if (!st.streamUrl || seen.has(st.streamUrl)) continue;
      seen.add(st.streamUrl);
      combined.push(st);
    }

    return combined.slice(0, 24);
  } catch {
    return [];
  }
}
