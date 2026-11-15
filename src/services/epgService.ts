import { Channel, EpgProgram } from '../types';
import { mapToStandardTVCategory } from './iptvOrgService';

export const DEFAULT_FREE_TV_PLAYLIST_URL =
  'https://raw.githubusercontent.com/Free-TV/IPTV/master/playlist.m3u8';

export interface PlaylistFetchResult {
  sourceUrl: string;
  epgUrls: string[];
  channels: Channel[];
  groups: string[];
  totalChannels: number;
  cachedAt: string;
}

export interface EpgFetchResult {
  programsByChannelId: Record<string, EpgProgram[]>;
  fetchedSources: string[];
  totalMatchedChannels: number;
  fetchedAt: string;
}

interface RawServerChannel {
  id: string;
  name: string;
  tvgId: string;
  tvgName: string;
  tvgLogo: string;
  tvgCountry: string;
  tvgChno: string;
  groupTitle: string;
  streamUrl: string;
  streamFormat: 'hls' | 'youtube' | 'mp4';
  isGeoBlocked: boolean;
  isYouTube: boolean;
  isTwitch: boolean;
}

const FALLBACK_TV_LOGO =
  'https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?w=160&auto=format&fit=crop&q=80';

function mapCountryLanguage(country: string): string {
  const c = country.toLowerCase();
  if (c.includes('india')) return 'Hindi';
  if (c.includes('france') || c.includes('belgium')) return 'French';
  if (c.includes('spain') || c.includes('argentina') || c.includes('mexico') || c.includes('chile') || c.includes('colombia')) return 'Spanish';
  if (c.includes('germany') || c.includes('austria') || c.includes('switzerland')) return 'German';
  if (c.includes('italy')) return 'Italian';
  if (c.includes('brazil') || c.includes('portugal')) return 'Portuguese';
  if (c.includes('japan')) return 'Japanese';
  if (c.includes('korea')) return 'Korean';
  if (c.includes('china') || c.includes('taiwan')) return 'Chinese';
  if (c.includes('arab') || c.includes('uae') || c.includes('qatar') || c.includes('egypt')) return 'Arabic';
  if (c.includes('russia')) return 'Russian';
  return 'English';
}

function serverChannelToAppChannel(raw: RawServerChannel): Channel {
  const countryName = raw.groupTitle || 'International';
  const category = mapToStandardTVCategory(raw.groupTitle, raw.name, countryName);

  return {
    id: raw.id,
    name: raw.name,
    type: 'tv',
    category,
    language: mapCountryLanguage(countryName),
    country: countryName,
    countryCode: raw.tvgCountry || undefined,
    streamUrl: raw.streamUrl,
    backupUrl: raw.streamFormat === 'hls' ? 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8' : undefined,
    streamFormat: raw.streamFormat,
    logoUrl: raw.tvgLogo || FALLBACK_TV_LOGO,
    description: `${raw.name} · Free-TV IPTV Network (${countryName})${raw.isGeoBlocked ? ' · May require local region IP' : ''}`,
    currentProgram: `Live Broadcast · ${raw.name}`,
    quality: [raw.streamFormat === 'youtube' ? 'HD' : '1080p', 'Auto'],
    broadcaster: raw.groupTitle || 'Free-TV IPTV',
    verifiedFta: true,
    isLive: true,
    tvgId: raw.tvgId || undefined,
    tvgChno: raw.tvgChno || undefined,
    groupTitle: raw.groupTitle || 'International',
    isGeoBlocked: raw.isGeoBlocked,
  };
}

export function parseRawM3uClientSide(rawText: string, sourceUrl: string): PlaylistFetchResult {
  const lines = rawText.split(/\r?\n/);
  const epgUrls: string[] = [];
  const channels: Channel[] = [];
  const groupSet = new Set<string>();

  for (let i = 0; i < Math.min(lines.length, 5); i++) {
    const line = lines[i].trim();
    if (line.startsWith('#EXTM3U')) {
      const m = line.match(/(?:x-tvg-url|url-tvg)="([^"]+)"/i);
      if (m && m[1]) {
        m[1]
          .split(',')
          .map(s => s.trim())
          .filter(s => s.startsWith('http') && !s.includes('ALL_SOURCES'))
          .forEach(s => epgUrls.push(s));
      }
      break;
    }
  }

  let currentMeta: RawServerChannel | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    if (line.startsWith('#EXTINF:')) {
      const tvgId = line.match(/tvg-id="([^"]*)"/i)?.[1]?.trim() || '';
      const tvgName = line.match(/tvg-name="([^"]*)"/i)?.[1]?.trim() || '';
      const tvgLogo = line.match(/tvg-logo="([^"]*)"/i)?.[1]?.trim() || '';
      const tvgCountry = line.match(/tvg-country="([^"]*)"/i)?.[1]?.trim() || '';
      const tvgChno = line.match(/tvg-chno="([^"]*)"/i)?.[1]?.trim() || '';
      const groupTitle = line.match(/group-title="([^"]*)"/i)?.[1]?.trim() || 'International';

      const commaIdx = line.lastIndexOf(',');
      const rawTitle = commaIdx !== -1 ? line.substring(commaIdx + 1).trim() : 'Live Channel';
      const isYouTube = rawTitle.includes('Ⓨ');
      const isGeoBlocked = rawTitle.includes('Ⓖ');
      const isTwitch = rawTitle.includes('Ⓣ');
      const cleanTitle = rawTitle.replace(/[ⓎⒼⓈⓉⓍ]/g, '').replace(/\s+/g, ' ').trim();

      groupSet.add(groupTitle);
      currentMeta = {
        id: `freetv-${channels.length + 1}-${(tvgId || cleanTitle).toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 18)}`,
        name: cleanTitle || tvgName || 'Live TV Channel',
        tvgId,
        tvgName: tvgName.replace(/[ⓎⒼⓈⓉⓍ]/g, '').trim(),
        tvgLogo,
        tvgCountry,
        tvgChno,
        groupTitle,
        streamUrl: '',
        streamFormat: 'hls',
        isGeoBlocked,
        isYouTube,
        isTwitch,
      };
    } else if ((line.startsWith('http://') || line.startsWith('https://')) && currentMeta) {
      let streamFormat: 'hls' | 'youtube' | 'mp4' = 'hls';
      if (line.includes('youtube.com') || line.includes('youtu.be') || currentMeta.isYouTube) {
        streamFormat = 'youtube';
      } else if (line.endsWith('.mp4')) {
        streamFormat = 'mp4';
      }
      currentMeta.streamUrl = line;
      currentMeta.streamFormat = streamFormat;
      if (!currentMeta.isTwitch) {
        channels.push(serverChannelToAppChannel(currentMeta));
      }
      currentMeta = null;
    }
  }

  return {
    sourceUrl,
    epgUrls,
    channels,
    groups: Array.from(groupSet).sort(),
    totalChannels: channels.length,
    cachedAt: new Date().toISOString(),
  };
}

export async function fetchIptvPlaylist(
  playlistUrl: string = DEFAULT_FREE_TV_PLAYLIST_URL
): Promise<PlaylistFetchResult> {
  try {
    const res = await fetch(`/api/iptv/playlist?url=${encodeURIComponent(playlistUrl)}`);
    if (res.ok) {
      const data = await res.json();
      const channels = (data.channels as RawServerChannel[])
        .filter(c => !c.isTwitch)
        .map(serverChannelToAppChannel);

      return {
        sourceUrl: data.sourceUrl,
        epgUrls: data.epgUrls || [],
        channels,
        groups: data.groups || [],
        totalChannels: channels.length,
        cachedAt: data.cachedAt || new Date().toISOString(),
      };
    }
  } catch {
    // Fallback to direct fetch
  }

  const directRes = await fetch(playlistUrl);
  if (!directRes.ok) {
    throw new Error(`Could not fetch playlist (${directRes.status})`);
  }
  const rawText = await directRes.text();
  return parseRawM3uClientSide(rawText, playlistUrl);
}

export async function fetchEpgForChannels(
  channels: Channel[],
  epgUrls: string[],
  playlistUrl: string = DEFAULT_FREE_TV_PLAYLIST_URL
): Promise<EpgFetchResult> {
  const tvgIds = Array.from(
    new Set(channels.map(c => c.tvgId).filter((id): id is string => Boolean(id)))
  );
  const channelNames = Array.from(
    new Set(channels.map(c => c.name).filter(Boolean))
  );
  const countryCodes = Array.from(
    new Set(
      channels
        .map(c => c.countryCode || c.country)
        .filter((cc): cc is string => Boolean(cc))
    )
  );

  const res = await fetch('/api/epg/fetch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      tvgIds,
      channelNames,
      countryCodes,
      epgUrls,
      playlistUrl,
    }),
  });

  if (!res.ok) {
    throw new Error(`EPG fetch failed (${res.status})`);
  }

  return res.json();
}

export async function fetchSingleEpgSource(
  xmltvUrl: string
): Promise<{
  url: string;
  channelCount: number;
  channelDisplayNames: Record<string, string>;
  programsByChannelId: Record<string, EpgProgram[]>;
  fetchedAt: string;
}> {
  const res = await fetch(`/api/epg/source?url=${encodeURIComponent(xmltvUrl)}`);
  if (!res.ok) {
    throw new Error(`Failed to load XMLTV feed (${res.status})`);
  }
  return res.json();
}

export function findEpgProgramsForChannel(
  channel: Channel | null | undefined,
  epgMap: Record<string, EpgProgram[]>
): EpgProgram[] {
  if (!channel || !epgMap) return [];

  if (channel.tvgId && epgMap[channel.tvgId]) {
    return epgMap[channel.tvgId];
  }

  const keys = Object.keys(epgMap);
  if (keys.length === 0) return [];

  const normBase = (s: string) =>
    s
      .toLowerCase()
      .replace(/@(uhd|fhd|hd|sd|4k)$/i, '')
      .replace(/\.[a-z0-9]{2,4}$/i, '')
      .replace(/[^a-z0-9+]/g, '')
      .replace(/(uhd|fhd|hd|sd|4k)$/i, '');

  if (channel.tvgId) {
    const lowerTvg = channel.tvgId.toLowerCase();
    const matchedKey = keys.find(k => k.toLowerCase() === lowerTvg);
    if (matchedKey) return epgMap[matchedKey];

    const baseTvg = normBase(channel.tvgId);
    if (baseTvg.length >= 3) {
      const matchedBase = keys.find(k => normBase(k) === baseTvg);
      if (matchedBase) return epgMap[matchedBase];
    }
  }

  const normalizedName = normBase(channel.name);
  if (normalizedName.length >= 3) {
    const matchedByName = keys.find(k => {
      const cleanK = normBase(k);
      return cleanK === normalizedName || (cleanK.length >= 4 && normalizedName.length >= 4 && (cleanK.startsWith(normalizedName) || normalizedName.startsWith(cleanK)));
    });
    if (matchedByName) return epgMap[matchedByName];
  }

  return [];
}

export interface EpgScheduleSummary {
  currentProgram: EpgProgram | null;
  nextProgram: EpgProgram | null;
  upcomingPrograms: EpgProgram[];
  progressPercent: number;
  remainingMinutes: number;
}

export function getCurrentAndUpcoming(
  programs: EpgProgram[],
  nowMs: number = Date.now()
): EpgScheduleSummary {
  if (!programs || programs.length === 0) {
    return {
      currentProgram: null,
      nextProgram: null,
      upcomingPrograms: [],
      progressPercent: 0,
      remainingMinutes: 0,
    };
  }

  const currentIdx = programs.findIndex(p => p.startMs <= nowMs && p.stopMs > nowMs);
  const currentProgram: EpgProgram | null = currentIdx !== -1 ? programs[currentIdx] : null;
  const upcomingPrograms: EpgProgram[] =
    currentIdx !== -1
      ? programs.slice(currentIdx + 1, currentIdx + 12)
      : programs.filter(p => p.startMs > nowMs).slice(0, 12);

  const nextProgram = upcomingPrograms[0] || null;
  let progressPercent = 0;
  let remainingMinutes = 0;

  if (currentProgram) {
    const total = Math.max(currentProgram.stopMs - currentProgram.startMs, 1);
    const elapsed = Math.max(nowMs - currentProgram.startMs, 0);
    progressPercent = Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)));
    remainingMinutes = Math.max(0, Math.ceil((currentProgram.stopMs - nowMs) / 60000));
  }

  return {
    currentProgram,
    nextProgram,
    upcomingPrograms,
    progressPercent,
    remainingMinutes,
  };
}

export function formatEpgTime(msOrIso: number | string): string {
  const date = typeof msOrIso === 'number' ? new Date(msOrIso) : new Date(msOrIso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function formatEpgDuration(startMs: number, stopMs: number): string {
  const mins = Math.max(1, Math.round((stopMs - startMs) / 60000));
  if (mins >= 60) {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  }
  return `${mins}m`;
}
