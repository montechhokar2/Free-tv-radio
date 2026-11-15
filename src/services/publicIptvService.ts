import { Channel, PublicIptvDirectoryResponse } from '../types';
import { mapToStandardTVCategory } from './iptvOrgService';
import { fetchIptvPlaylist } from './epgService';

export const PUBLIC_IPTV_SOURCE_CARDS = [
  {
    id: 'football_cricket',
    title: 'IPTV Football & Cricket',
    description: 'Cricket & World Cup broadcaster directory and live M3U playlists',
    url: 'https://github.com/subash9860/iptv-football-cricket',
    badge: 'Broadcaster List + M3U',
  },
  {
    id: 'iptv_org',
    title: 'IPTV-org Database',
    description: 'Worldwide public IPTV channel database & category feeds',
    url: 'https://github.com/iptv-org/iptv/blob/master/README.md',
    badge: '10,000+ Global Streams',
  },
  {
    id: 'free_public',
    title: 'Free Public IPTV',
    description: 'Verified public broadcaster playlists (News, Sports, Weather, Edu)',
    url: 'https://github.com/freecasthub/public-iptv',
    badge: 'Verified Public FTA',
  },
  {
    id: 'playlist_docs',
    title: 'IPTV Playlist Docs',
    description: 'Official M3U playlist organization, tags & #EXTM3U format rules',
    url: 'https://github.com/iptv-org/iptv/blob/master/docs/playlists.md',
    badge: 'M3U Schema & Docs',
  },
] as const;

interface RawDirectoryPlaylistChannel {
  id: string;
  name: string;
  tvgId?: string;
  tvgName?: string;
  tvgLogo?: string;
  tvgCountry?: string;
  tvgChno?: string;
  groupTitle?: string;
  streamUrl: string;
  streamFormat?: 'hls' | 'youtube' | 'mp4';
  isGeoBlocked?: boolean;
  isTwitch?: boolean;
}

const FALLBACK_TV_LOGO =
  'https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?w=160&auto=format&fit=crop&q=80';

function mapRawChannelToAppChannel(
  raw: RawDirectoryPlaylistChannel,
  sourcePrefix: string,
  sourceLabel: string
): Channel {
  const groupTitle = raw.groupTitle || 'Public IPTV';
  const category = mapToStandardTVCategory(groupTitle, raw.name, raw.tvgCountry || groupTitle);
  const country = raw.tvgCountry || groupTitle || 'International';

  return {
    id: `${sourcePrefix}-${raw.id}`,
    name: raw.name,
    type: 'tv',
    category,
    language: 'Multilingual',
    country,
    countryCode: raw.tvgCountry || undefined,
    streamUrl: raw.streamUrl,
    streamFormat: raw.streamFormat || 'hls',
    logoUrl: raw.tvgLogo || FALLBACK_TV_LOGO,
    description: `${raw.name} · ${sourceLabel} (${groupTitle})${raw.isGeoBlocked ? ' · Region rules apply' : ''}`,
    currentProgram: `Live Stream · ${sourceLabel}`,
    quality: ['HD', 'Auto'],
    broadcaster: groupTitle || sourceLabel,
    verifiedFta: true,
    isLive: true,
    tvgId: raw.tvgId || undefined,
    tvgChno: raw.tvgChno || undefined,
    groupTitle,
    isGeoBlocked: Boolean(raw.isGeoBlocked),
    tags: [sourcePrefix, 'public-iptv'],
  };
}

export async function fetchPublicIptvDirectory(
  forceRefresh = false
): Promise<PublicIptvDirectoryResponse> {
  const url = forceRefresh ? '/api/iptv/public-directory?refresh=1' : '/api/iptv/public-directory';
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to load Public IPTV Directory (${res.status})`);
  }
  const data = await res.json();

  const fcRaw = (data.footballCricket?.channels || []) as RawDirectoryPlaylistChannel[];
  const freeRaw = (data.freePublicIptv?.channels || []) as RawDirectoryPlaylistChannel[];

  return {
    footballCricket: {
      repoUrl: data.footballCricket?.repoUrl || 'https://github.com/subash9860/iptv-football-cricket',
      playlistUrl:
        data.footballCricket?.playlistUrl ||
        'https://raw.githubusercontent.com/subash9860/iptv-football-cricket/main/index.m3u',
      worldCupPlaylistUrl:
        data.footballCricket?.worldCupPlaylistUrl ||
        'https://raw.githubusercontent.com/subash9860/iptv-football-cricket/main/worldcup-2026.m3u',
      channels: fcRaw
        .filter(c => !c.isTwitch && Boolean(c.streamUrl))
        .map(c => mapRawChannelToAppChannel(c, 'fc-iptv', 'IPTV Football & Cricket')),
      directoryRows: data.footballCricket?.directoryRows || [],
    },
    freePublicIptv: {
      repoUrl: data.freePublicIptv?.repoUrl || 'https://github.com/freecasthub/public-iptv',
      presets: data.freePublicIptv?.presets || [],
      channels: freeRaw
        .filter(c => !c.isTwitch && Boolean(c.streamUrl))
        .map(c => mapRawChannelToAppChannel(c, 'freecast', 'Free Public IPTV')),
    },
    iptvOrgDatabase: {
      repoUrl: data.iptvOrgDatabase?.repoUrl || 'https://github.com/iptv-org/iptv',
      masterPlaylistUrl:
        data.iptvOrgDatabase?.masterPlaylistUrl || 'https://iptv-org.github.io/iptv/index.m3u',
      categoryMasterUrl:
        data.iptvOrgDatabase?.categoryMasterUrl || 'https://iptv-org.github.io/iptv/index.category.m3u',
      categories: data.iptvOrgDatabase?.categories || [],
    },
    playlistDocs: data.playlistDocs,
    fetchedAt: data.fetchedAt || new Date().toISOString(),
  };
}

export async function fetchPublicPlaylistChannels(
  playlistUrl: string,
  sourcePrefix = 'public-m3u',
  sourceLabel = 'Public IPTV'
): Promise<{ channels: Channel[]; groups: string[]; sourceUrl: string }> {
  const result = await fetchIptvPlaylist(playlistUrl);
  const channels = result.channels.map(ch => ({
    ...ch,
    id: `${sourcePrefix}-${ch.id}`,
    broadcaster: ch.groupTitle || sourceLabel,
    tags: [sourcePrefix, 'public-iptv'],
  }));
  return {
    channels,
    groups: result.groups,
    sourceUrl: result.sourceUrl,
  };
}
