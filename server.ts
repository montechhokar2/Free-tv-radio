import express, { Request, Response } from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import zlib from 'zlib';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const DEFAULT_PLAYLIST_URL = 'https://raw.githubusercontent.com/Free-TV/IPTV/master/playlist.m3u8';

const MAX_COMPRESSED_EPG_BYTES = 18 * 1024 * 1024; // 18 MB safety cap to prevent OOM
const MAX_EPG_CACHE_ENTRIES = 12;

interface ParsedPlaylistChannel {
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

interface EpgProgram {
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

interface PlaylistCacheEntry {
  timestamp: number;
  sourceUrl: string;
  epgUrls: string[];
  channels: ParsedPlaylistChannel[];
  groups: string[];
}

interface EpgCacheEntry {
  timestamp: number;
  url: string;
  channelDisplayNames: Record<string, string>;
  programsByChannel: Record<string, EpgProgram[]>;
}

const playlistCache = new Map<string, PlaylistCacheEntry>();
const epgCache = new Map<string, EpgCacheEntry>();
const inFlightEpgFetches = new Map<string, Promise<EpgCacheEntry | null>>();

const PLAYLIST_TTL_MS = 15 * 60 * 1000;
const EPG_TTL_MS = 30 * 60 * 1000;

interface Adult18CachePayload {
  timestamp: number;
  category: { id: string; name: string; description: string };
  playlistUrl: string;
  apiEndpoints: {
    channels: string;
    streams: string;
    logos: string;
    categories: string;
  };
  playableChannels: Array<{
    id: string;
    name: string;
    tvgId: string;
    tvgLogo: string;
    tvgCountry: string;
    groupTitle: string;
    streamUrl: string;
    streamFormat: 'hls' | 'youtube' | 'mp4';
    quality: string[];
    broadcaster: string;
    website?: string | null;
  }>;
  directoryEntries: Array<{
    id: string;
    name: string;
    country: string;
    categories: string[];
    isNsfw: boolean;
    network?: string | null;
    owners: string[];
    website?: string | null;
    launched?: string | null;
    closed?: string | null;
    logoUrl?: string;
    streamUrl?: string;
    streamFormat?: 'hls' | 'youtube' | 'mp4';
    quality?: string | null;
    labels?: string[];
  }>;
}

let adult18Cache: Adult18CachePayload | null = null;
let inFlightAdult18Fetch: Promise<Adult18CachePayload> | null = null;

async function fetchJsonWithTimeout<T>(url: string, timeoutMs = 12000): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'FreeTVRadioLive/1.0 (+https://github.com/iptv-org/api)' },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

async function getOrFetchAdult18Catalog(): Promise<Adult18CachePayload> {
  if (adult18Cache && Date.now() - adult18Cache.timestamp < PLAYLIST_TTL_MS) {
    return adult18Cache;
  }
  if (inFlightAdult18Fetch) {
    return inFlightAdult18Fetch;
  }

  inFlightAdult18Fetch = (async () => {
    const API_CHANNELS = 'https://iptv-org.github.io/api/channels.json';
    const API_STREAMS = 'https://iptv-org.github.io/api/streams.json';
    const API_LOGOS = 'https://iptv-org.github.io/api/logos.json';
    const API_CATEGORIES = 'https://iptv-org.github.io/api/categories.json';
    const XXX_PLAYLIST = 'https://iptv-org.github.io/iptv/categories/xxx.m3u';

    type RawApiChannel = {
      id: string;
      name: string;
      network?: string | null;
      owners?: string[];
      country?: string;
      categories?: string[];
      is_nsfw?: boolean;
      launched?: string | null;
      closed?: string | null;
      website?: string | null;
    };
    type RawApiStream = {
      channel?: string | null;
      title?: string;
      url?: string;
      quality?: string | null;
      labels?: string[];
    };
    type RawApiLogo = {
      channel?: string;
      url?: string;
    };
    type RawApiCategory = {
      id: string;
      name: string;
      description: string;
    };

    const [channels, streams, logos, categories, xxxPlaylist] = await Promise.all([
      fetchJsonWithTimeout<RawApiChannel[]>(API_CHANNELS),
      fetchJsonWithTimeout<RawApiStream[]>(API_STREAMS),
      fetchJsonWithTimeout<RawApiLogo[]>(API_LOGOS),
      fetchJsonWithTimeout<RawApiCategory[]>(API_CATEGORIES).catch(() => [] as RawApiCategory[]),
      getOrFetchPlaylist(XXX_PLAYLIST).catch(() => null),
    ]);

    const xxxMeta = categories.find(c => c.id === 'xxx') || {
      id: 'xxx',
      name: 'XXX',
      description: 'Programming is adult oriented and x-rated',
    };

    const nsfwChannels = channels.filter(
      ch => Boolean(ch.is_nsfw) || (Array.isArray(ch.categories) && ch.categories.includes('xxx'))
    );
    const nsfwChannelMap = new Map<string, RawApiChannel>();
    for (const ch of nsfwChannels) {
      nsfwChannelMap.set(ch.id, ch);
    }

    const logoMap = new Map<string, string>();
    for (const logo of logos) {
      if (logo.channel && logo.url && !logoMap.has(logo.channel)) {
        logoMap.set(logo.channel, logo.url);
      }
    }

    const streamByChannelId = new Map<string, RawApiStream>();
    const playableChannels: Adult18CachePayload['playableChannels'] = [];
    const seenUrls = new Set<string>();

    for (const st of streams) {
      if (!st.channel || !st.url || !nsfwChannelMap.has(st.channel)) continue;
      if (seenUrls.has(st.url)) continue;
      seenUrls.add(st.url);

      if (!streamByChannelId.has(st.channel)) {
        streamByChannelId.set(st.channel, st);
      }

      const ch = nsfwChannelMap.get(st.channel)!;
      const urlLower = st.url.toLowerCase();
      const format: 'hls' | 'youtube' | 'mp4' =
        urlLower.includes('youtube.com') || urlLower.includes('youtu.be')
          ? 'youtube'
          : urlLower.endsWith('.mp4')
          ? 'mp4'
          : 'hls';

      playableChannels.push({
        id: `adult18-${ch.id.toLowerCase().replace(/[^a-z0-9]/g, '')}-${playableChannels.length + 1}`,
        name: st.title || ch.name,
        tvgId: ch.id,
        tvgLogo: logoMap.get(ch.id) || '',
        tvgCountry: ch.country || 'INT',
        groupTitle: '18+ Adult',
        streamUrl: st.url,
        streamFormat: format,
        quality: st.quality ? [st.quality, 'Auto'] : ['Auto'],
        broadcaster: ch.network || ch.owners?.[0] || ch.name,
        website: ch.website || null,
      });
    }

    if (xxxPlaylist && xxxPlaylist.channels.length > 0) {
      for (const m3uCh of xxxPlaylist.channels) {
        if (!m3uCh.streamUrl || seenUrls.has(m3uCh.streamUrl)) continue;
        seenUrls.add(m3uCh.streamUrl);
        playableChannels.push({
          id: `adult18-m3u-${playableChannels.length + 1}`,
          name: m3uCh.name,
          tvgId: m3uCh.tvgId,
          tvgLogo: m3uCh.tvgLogo,
          tvgCountry: m3uCh.tvgCountry || 'INT',
          groupTitle: '18+ Adult',
          streamUrl: m3uCh.streamUrl,
          streamFormat: m3uCh.streamFormat,
          quality: ['Auto'],
          broadcaster: m3uCh.groupTitle || 'IPTV-org XXX',
          website: null,
        });
      }
    }

    const directoryEntries: Adult18CachePayload['directoryEntries'] = nsfwChannels.map(ch => {
      const matchedStream = streamByChannelId.get(ch.id);
      const streamUrl = matchedStream?.url;
      let streamFormat: 'hls' | 'youtube' | 'mp4' | undefined;
      if (streamUrl) {
        streamFormat =
          streamUrl.includes('youtube.com') || streamUrl.includes('youtu.be')
            ? 'youtube'
            : streamUrl.endsWith('.mp4')
            ? 'mp4'
            : 'hls';
      }
      return {
        id: ch.id,
        name: ch.name,
        country: ch.country || 'INT',
        categories: Array.isArray(ch.categories) && ch.categories.length > 0 ? ch.categories : ['xxx'],
        isNsfw: Boolean(ch.is_nsfw),
        network: ch.network || null,
        owners: Array.isArray(ch.owners) ? ch.owners : [],
        website: ch.website || null,
        launched: ch.launched || null,
        closed: ch.closed || null,
        logoUrl: logoMap.get(ch.id),
        streamUrl,
        streamFormat,
        quality: matchedStream?.quality || null,
        labels: matchedStream?.labels || [],
      };
    });

    // Place entries with active streams first in directory listing
    directoryEntries.sort((a, b) => {
      const aHas = a.streamUrl ? 0 : 1;
      const bHas = b.streamUrl ? 0 : 1;
      if (aHas !== bHas) return aHas - bHas;
      return a.name.localeCompare(b.name);
    });

    const payload: Adult18CachePayload = {
      timestamp: Date.now(),
      category: xxxMeta,
      playlistUrl: XXX_PLAYLIST,
      apiEndpoints: {
        channels: API_CHANNELS,
        streams: API_STREAMS,
        logos: API_LOGOS,
        categories: API_CATEGORIES,
      },
      playableChannels,
      directoryEntries,
    };

    adult18Cache = payload;
    return payload;
  })();

  try {
    return await inFlightAdult18Fetch;
  } finally {
    inFlightAdult18Fetch = null;
  }
}

interface CricketHubCachePayload {
  timestamp: number;
  liveStreams: Array<Record<string, unknown>>;
  replaysAndHighlights: Array<Record<string, unknown>>;
  matches: Array<Record<string, unknown>>;
  news: Array<Record<string, unknown>>;
  sources: {
    cricomboCount: number;
    cricketOnAirStreamsCount: number;
    cricketOnAirReplaysCount: number;
    matchesCount: number;
    newsCount: number;
  };
}

let cricketHubCache: CricketHubCachePayload | null = null;
let inFlightCricketHubFetch: Promise<CricketHubCachePayload> | null = null;
const CRICKET_HUB_TTL_MS = 10 * 60 * 1000;

async function fetchTextWithTimeout(url: string, timeoutMs = 11000): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8',
      },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
    return await res.text();
  } finally {
    clearTimeout(timer);
  }
}

function extractYoutubeId(urlOrId: string): string | null {
  if (!urlOrId) return null;
  if (/^[A-Za-z0-9_-]{11}$/.test(urlOrId)) return urlOrId;
  const m = urlOrId.match(/(?:youtube\.com\/(?:embed\/|watch\?v=|live\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/i);
  return m ? m[1] : null;
}

function parseCricomboLiveStreams(html: string): Array<Record<string, unknown>> {
  const results: Array<Record<string, unknown>> = [];
  const seenYt = new Set<string>();
  const ldRegex = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match: RegExpExecArray | null;

  const collectVideoObjects = (node: unknown) => {
    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node)) {
      node.forEach(collectVideoObjects);
      return;
    }
    const obj = node as Record<string, unknown>;
    if (obj['@type'] === 'VideoObject') {
      const embedUrl = String(obj.embedUrl || obj.contentUrl || '');
      const ytId = extractYoutubeId(embedUrl);
      if (ytId && !seenYt.has(ytId)) {
        seenYt.add(ytId);
        const pub = (obj.publication as Record<string, unknown> | undefined) || {};
        const thumbArr = Array.isArray(obj.thumbnailUrl) ? obj.thumbnailUrl : [obj.thumbnailUrl];
        const rawTitle = decodeXmlEntities(String(obj.name || 'Live Cricket Stream'));
        const rawDesc = decodeXmlEntities(String(obj.description || 'Official live cricket stream via Cricombo.'));
        const channelMatch = rawDesc.match(/official live stream by ([^.]+)/i);
        const broadcaster = channelMatch ? channelMatch[1].trim() : 'Cricombo Official';
        const isLive = Boolean(pub.isLiveBroadcast);

        results.push({
          id: `cricombo-${ytId}`,
          youtubeId: ytId,
          name: rawTitle,
          type: 'tv',
          category: 'Cricket',
          language: 'English',
          country: 'International',
          streamUrl: `https://www.youtube.com/watch?v=${ytId}`,
          streamFormat: 'youtube',
          logoUrl: String(thumbArr[0] || `https://i.ytimg.com/vi/${ytId}/hqdefault.jpg`),
          description: `${rawDesc}${obj.url ? ` · Source: ${obj.url}` : ''}`,
          currentProgram: isLive
            ? `LIVE · ${broadcaster}`
            : `Cricket Replay · ${broadcaster}`,
          quality: ['HD', 'Auto'],
          broadcaster,
          verifiedFta: true,
          isLive,
          tags: ['cricombo', 'cricket', isLive ? 'live' : 'replay'],
          sourcePlatform: 'Cricombo',
          externalUrl: String(obj.url || 'https://cricombo.com/live-streams'),
          startDate: pub.startDate ? String(pub.startDate) : (obj.uploadDate ? String(obj.uploadDate) : undefined),
        });
      }
    }
    if (Array.isArray(obj.hasPart)) collectVideoObjects(obj.hasPart);
    if (Array.isArray(obj['@graph'])) collectVideoObjects(obj['@graph']);
  };

  while ((match = ldRegex.exec(html)) !== null) {
    try {
      const parsed = JSON.parse(match[1]);
      collectVideoObjects(parsed);
    } catch {
      // ignore malformed JSON-LD block
    }
  }

  return results;
}

async function getOrFetchCricketHub(forceRefresh = false): Promise<CricketHubCachePayload> {
  if (!forceRefresh && cricketHubCache && Date.now() - cricketHubCache.timestamp < CRICKET_HUB_TTL_MS) {
    return cricketHubCache;
  }
  if (!forceRefresh && inFlightCricketHubFetch) {
    return inFlightCricketHubFetch;
  }

  inFlightCricketHubFetch = (async () => {
    const [
      cricomboHtml,
      coaStreamsJson,
      coaFeaturedJson,
      coaMatchesJson,
      coaNewsJson,
      coaFreeHtml,
    ] = await Promise.all([
      fetchTextWithTimeout('https://cricombo.com/live-streams', 11000).catch(() => ''),
      fetchJsonWithTimeout<{
        streams?: Array<Record<string, unknown>>;
        replays?: Array<Record<string, unknown>>;
      }>('https://cricketonair.com/data/live_streams.json', 10000).catch(() => ({ streams: [], replays: [] })),
      fetchJsonWithTimeout<{
        videos?: Array<Record<string, unknown>>;
      }>('https://cricketonair.com/data/featured.json', 10000).catch(() => ({ videos: [] })),
      fetchJsonWithTimeout<{
        matches?: Array<Record<string, unknown>>;
      }>('https://cricketonair.com/data/matches.json', 10000).catch(() => ({ matches: [] })),
      fetchJsonWithTimeout<{
        articles?: Array<Record<string, unknown>>;
        items?: Array<Record<string, unknown>>;
      } | Array<Record<string, unknown>>>('https://cricketonair.com/data/news.json', 10000).catch(() => []),
      fetchTextWithTimeout('https://cricketonair.com/free-live-cricket', 9000).catch(() => ''),
    ]);

    const cricomboStreams = cricomboHtml ? parseCricomboLiveStreams(cricomboHtml) : [];

    const liveStreams: Array<Record<string, unknown>> = [];
    const replaysAndHighlights: Array<Record<string, unknown>> = [];
    const seenStreamYtIds = new Set<string>();
    const seenReplayYtIds = new Set<string>();

    // 1. Add Cricombo live streams first (live broadcasts to liveStreams, replays to replaysAndHighlights)
    for (const item of cricomboStreams) {
      const ytId = String(item.youtubeId || '');
      if (item.isLive) {
        if (!seenStreamYtIds.has(ytId)) {
          seenStreamYtIds.add(ytId);
          liveStreams.push(item);
        }
      } else if (!seenReplayYtIds.has(ytId)) {
        seenReplayYtIds.add(ytId);
        replaysAndHighlights.push(item);
      }
    }

    // 2. Add Cricket On Air live & upcoming streams
    let coaStreamsCount = 0;
    const rawCoaStreams = Array.isArray(coaStreamsJson?.streams) ? coaStreamsJson.streams : [];
    for (const s of rawCoaStreams) {
      const ytId = extractYoutubeId(String(s.video || ''));
      if (!ytId) continue;
      coaStreamsCount++;
      if (seenStreamYtIds.has(ytId)) continue;
      seenStreamYtIds.add(ytId);
      const state = String(s.state || 'live').toLowerCase();
      const isLive = state === 'live' || (!s.ended && Boolean(s.started));
      const broadcaster = String(s.channel || 'Cricket On Air Official');
      const blockedList = Array.isArray(s.blocked) ? (s.blocked as string[]) : [];
      liveStreams.push({
        id: `coa-live-${ytId}`,
        youtubeId: ytId,
        name: decodeXmlEntities(String(s.title || 'Live Cricket Broadcast')),
        type: 'tv',
        category: 'Cricket',
        language: 'English',
        country: broadcaster,
        streamUrl: `https://www.youtube.com/watch?v=${ytId}`,
        streamFormat: 'youtube',
        logoUrl: `https://i.ytimg.com/vi/${ytId}/hqdefault.jpg`,
        description: `Official free cricket stream by ${broadcaster} (${s.handle || 'YouTube'})${
          blockedList.length > 0 ? ` · Geo-restricted in ${blockedList.length} territories` : ''
        }`,
        currentProgram: state === 'upcoming'
          ? `Upcoming · ${s.scheduled ? new Date(String(s.scheduled)).toUTCString().slice(0, 22) : broadcaster}`
          : `LIVE · ${broadcaster}`,
        quality: ['HD', 'Auto'],
        broadcaster,
        verifiedFta: true,
        isLive,
        isGeoBlocked: blockedList.length > 0,
        tags: ['cricketonair', 'cricket', state],
        sourcePlatform: 'Cricket On Air',
        externalUrl: String(s.channelUrl || 'https://cricketonair.com/free-live-cricket'),
        startDate: s.scheduled ? String(s.scheduled) : (s.started ? String(s.started) : undefined),
      });
    }

    // 3. Add Cricket On Air replays & featured official highlights
    let coaReplaysCount = 0;
    const rawCoaReplays = Array.isArray(coaStreamsJson?.replays) ? coaStreamsJson.replays : [];
    for (const r of rawCoaReplays) {
      const ytId = extractYoutubeId(String(r.video || ''));
      if (!ytId) continue;
      coaReplaysCount++;
      if (seenReplayYtIds.has(ytId) || seenStreamYtIds.has(ytId)) continue;
      seenReplayYtIds.add(ytId);
      const broadcaster = String(r.channel || 'Official Cricket Board');
      replaysAndHighlights.push({
        id: `coa-replay-${ytId}`,
        youtubeId: ytId,
        name: decodeXmlEntities(String(r.title || 'Cricket Match Replay')),
        type: 'tv',
        category: 'Cricket',
        language: 'English',
        country: broadcaster,
        streamUrl: `https://www.youtube.com/watch?v=${ytId}`,
        streamFormat: 'youtube',
        logoUrl: `https://i.ytimg.com/vi/${ytId}/hqdefault.jpg`,
        description: `Official match replay by ${broadcaster} via Cricket On Air`,
        currentProgram: `Match Replay · ${broadcaster}`,
        quality: ['HD', 'Auto'],
        broadcaster,
        verifiedFta: true,
        isLive: false,
        tags: ['cricketonair', 'replay', 'cricket'],
        sourcePlatform: 'Cricket On Air',
        externalUrl: String(r.channelUrl || 'https://cricketonair.com/free-live-cricket'),
        startDate: r.started ? String(r.started) : undefined,
      });
    }

    const rawCoaFeatured = Array.isArray(coaFeaturedJson?.videos) ? coaFeaturedJson.videos : [];
    for (const v of rawCoaFeatured) {
      const ytId = extractYoutubeId(String(v.video || ''));
      if (!ytId) continue;
      coaReplaysCount++;
      if (seenReplayYtIds.has(ytId) || seenStreamYtIds.has(ytId)) continue;
      seenReplayYtIds.add(ytId);
      const broadcaster = String(v.channel || 'Official Broadcaster').trim();
      replaysAndHighlights.push({
        id: `coa-feat-${ytId}`,
        youtubeId: ytId,
        name: decodeXmlEntities(String(v.title || 'Featured Cricket Highlights')),
        type: 'tv',
        category: 'Cricket',
        language: 'English',
        country: 'International',
        streamUrl: `https://www.youtube.com/watch?v=${ytId}`,
        streamFormat: 'youtube',
        logoUrl: `https://i.ytimg.com/vi/${ytId}/hqdefault.jpg`,
        description: `Featured official highlights by ${broadcaster} via Cricket On Air`,
        currentProgram: `Official Highlights · ${broadcaster}`,
        quality: ['HD', 'Auto'],
        broadcaster,
        verifiedFta: true,
        isLive: false,
        tags: ['cricketonair', 'highlights', 'cricket'],
        sourcePlatform: 'Cricket On Air',
        externalUrl: String(v.channelUrl || 'https://cricketonair.com/free-live-cricket'),
        startDate: v.published ? String(v.published) : undefined,
      });
    }

    // Also parse featured tiles from free-live-cricket HTML if featured.json returned empty
    if (rawCoaFeatured.length === 0 && coaFreeHtml) {
      const tileRegex = /<article[^>]*class="[^"]*fs-tile[^"]*"[^>]*>[\s\S]*?data-src="([^"]+)"[\s\S]*?<h3>([\s\S]*?)<\/h3>[\s\S]*?<p[^>]*>([\s\S]*?)<\/p>/gi;
      let tm: RegExpExecArray | null;
      while ((tm = tileRegex.exec(coaFreeHtml)) !== null) {
        const ytId = extractYoutubeId(tm[1]);
        if (!ytId || seenReplayYtIds.has(ytId)) continue;
        seenReplayYtIds.add(ytId);
        coaReplaysCount++;
        const title = decodeXmlEntities(tm[2].replace(/<[^>]+>/g, ''));
        const meta = decodeXmlEntities(tm[3].replace(/<[^>]+>/g, ''));
        replaysAndHighlights.push({
          id: `coa-tile-${ytId}`,
          youtubeId: ytId,
          name: title,
          type: 'tv',
          category: 'Cricket',
          language: 'English',
          country: 'International',
          streamUrl: `https://www.youtube.com/watch?v=${ytId}`,
          streamFormat: 'youtube',
          logoUrl: `https://i.ytimg.com/vi/${ytId}/hqdefault.jpg`,
          description: `${meta} · Free Live Cricket Official Channel`,
          currentProgram: meta,
          quality: ['HD', 'Auto'],
          broadcaster: meta.split('·')[0]?.trim() || 'Official Channel',
          verifiedFta: true,
          isLive: false,
          tags: ['cricketonair', 'highlights', 'cricket'],
          sourcePlatform: 'Cricket On Air',
          externalUrl: 'https://cricketonair.com/free-live-cricket',
        });
      }
    }

    // 4. Parse upcoming/current cricket matches
    const rawMatches = Array.isArray(coaMatchesJson?.matches) ? coaMatchesJson.matches : [];
    const matches = rawMatches.slice(0, 80).map(m => {
      const tournament = (m.tournament as Record<string, unknown> | undefined) || {};
      const slug = String(m.slug || m.id || '');
      const teamA = String(m.a || 'TBA');
      const teamB = String(m.b || 'TBA');
      return {
        id: String(m.id || slug),
        title: `${teamA} vs ${teamB}`,
        teamA,
        teamB,
        codes: Array.isArray(m.codes) ? (m.codes as string[]) : [],
        format: String(m.format || 'Match'),
        round: String(m.round || ''),
        start: String(m.start || ''),
        venue: String(m.venue || 'TBA'),
        tournamentName: String(tournament.name || m.series || 'Cricket Fixture'),
        slug,
        watchUrl: slug ? `https://cricketonair.com/match/${slug}/` : 'https://cricketonair.com/',
      };
    });

    // 5. Parse latest cricket news
    const rawNewsArr = Array.isArray(coaNewsJson)
      ? coaNewsJson
      : Array.isArray((coaNewsJson as Record<string, unknown>)?.articles)
      ? ((coaNewsJson as Record<string, unknown>).articles as Array<Record<string, unknown>>)
      : Array.isArray((coaNewsJson as Record<string, unknown>)?.items)
      ? ((coaNewsJson as Record<string, unknown>).items as Array<Record<string, unknown>>)
      : [];

    const news = rawNewsArr.slice(0, 30).map(n => ({
      title: decodeXmlEntities(String(n.title || '')),
      url: String(n.url || 'https://cricketonair.com/'),
      source: String(n.source || 'Cricket News'),
      image: n.image ? String(n.image) : undefined,
      published: String(n.published || ''),
    })).filter(n => n.title);

    const payload: CricketHubCachePayload = {
      timestamp: Date.now(),
      liveStreams,
      replaysAndHighlights: replaysAndHighlights.slice(0, 60),
      matches,
      news,
      sources: {
        cricomboCount: cricomboStreams.length,
        cricketOnAirStreamsCount: coaStreamsCount,
        cricketOnAirReplaysCount: coaReplaysCount,
        matchesCount: matches.length,
        newsCount: news.length,
      },
    };

    cricketHubCache = payload;
    return payload;
  })();

  try {
    return await inFlightCricketHubFetch;
  } finally {
    inFlightCricketHubFetch = null;
  }
}

interface PublicIptvDirectoryCachePayload {
  timestamp: number;
  footballCricket: {
    repoUrl: string;
    playlistUrl: string;
    worldCupPlaylistUrl: string;
    channels: ParsedPlaylistChannel[];
    directoryRows: Array<{
      region: string;
      country: string;
      tvChannels: string;
      ottPlatforms: string;
      broadcastType: string;
      iptvStatus: string;
      hasPublicIptv: boolean;
    }>;
  };
  freePublicIptv: {
    repoUrl: string;
    presets: Array<{ id: string; label: string; url: string }>;
    channels: ParsedPlaylistChannel[];
  };
  iptvOrgDatabase: {
    repoUrl: string;
    masterPlaylistUrl: string;
    categoryMasterUrl: string;
    categories: Array<{ name: string; channelCount: number; playlistUrl: string }>;
  };
  playlistDocs: {
    docUrl: string;
    title: string;
    summary: string;
    internalRules: string[];
    internalExample: string;
    publicExample: string;
    rawExcerpt: string;
  };
}

let publicIptvDirectoryCache: PublicIptvDirectoryCachePayload | null = null;
let inFlightPublicIptvDirectoryFetch: Promise<PublicIptvDirectoryCachePayload> | null = null;

function stripMarkdownBold(text: string): string {
  return text.replace(/\*\*(.*?)\*\*/g, '$1').replace(/`([^`]*)`/g, '$1').trim();
}

function parseFootballCricketReadme(markdown: string) {
  const rows: PublicIptvDirectoryCachePayload['footballCricket']['directoryRows'] = [];
  if (!markdown) return rows;

  let currentRegion = 'Global Broadcasters';
  const lines = markdown.split(/\r?\n/);

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (line.startsWith('### ')) {
      currentRegion = line.replace(/^###\s+/, '').trim();
      continue;
    }
    if (!line.startsWith('|')) continue;
    if (line.includes('| Country') || line.includes('|---')) continue;

    const cells = line
      .split('|')
      .slice(1, -1)
      .map(c => stripMarkdownBold(c));

    if (cells.length >= 5) {
      const [country, tvChannels, ottPlatforms, broadcastType, iptvStatus] = cells;
      if (!country || country.toLowerCase().includes('country')) continue;
      rows.push({
        region: currentRegion,
        country,
        tvChannels,
        ottPlatforms,
        broadcastType,
        iptvStatus,
        hasPublicIptv: iptvStatus.includes('✅'),
      });
    }
  }

  return rows;
}

function parseIptvOrgPlaylistsMarkdown(markdown: string) {
  const categories: Array<{ name: string; channelCount: number; playlistUrl: string }> = [];
  if (!markdown) return categories;

  const rowRegex =
    /<tr>\s*<td>([^<]+)<\/td>\s*<td[^>]*>(\d+)<\/td>\s*<td[^>]*><code>(https:\/\/iptv-org\.github\.io\/iptv\/categories\/[^<]+\.m3u)<\/code><\/td>\s*<\/tr>/gi;
  let match: RegExpExecArray | null;
  const seen = new Set<string>();

  while ((match = rowRegex.exec(markdown)) !== null) {
    const name = decodeXmlEntities(match[1].trim());
    const channelCount = Number(match[2]) || 0;
    const playlistUrl = match[3].trim();
    if (!seen.has(playlistUrl)) {
      seen.add(playlistUrl);
      categories.push({ name, channelCount, playlistUrl });
    }
  }

  return categories;
}

function parsePlaylistDocsMarkdown(markdown: string) {
  const rules: string[] = [];
  const lines = (markdown || '').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('- ')) {
      const cleaned = trimmed
        .slice(2)
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
        .replace(/`/g, '')
        .trim();
      if (cleaned) rules.push(cleaned);
    }
  }

  const codeBlocks: string[] = [];
  const blockRegex = /```[\s\S]*?\n([\s\S]*?)```/g;
  let bMatch: RegExpExecArray | null;
  while ((bMatch = blockRegex.exec(markdown || '')) !== null) {
    const content = bMatch[1].trim();
    if (content) codeBlocks.push(content);
  }

  const internalExample =
    codeBlocks.find(b => b.includes('#EXTM3U') && !b.includes('group-title=')) ||
    '#EXTM3U\n#EXTINF:-1 tvg-id="ExampleTV.us@SD",Example TV (720p)\nhttps://example.com/playlist.m3u8';

  const publicExample =
    codeBlocks.find(b => b.includes('group-title=')) ||
    '#EXTM3U x-tvg-url="https://example.com/guide.xml"\n#EXTINF:-1 tvg-id="ExampleTV.us@SD" tvg-logo="https://example.com/logo.png" group-title="Movies",Example TV (720p)\nhttps://example.com/playlist.m3u8';

  return {
    docUrl: 'https://github.com/iptv-org/iptv/blob/master/docs/playlists.md',
    title: 'IPTV-org Playlist Organization & M3U Format',
    summary:
      'Defines Internal moderation playlists (streams/) and daily generated Public playlists (index.m3u, category/country feeds) using UTF-8 CRLF #EXTM3U and #EXTINF metadata.',
    internalRules:
      rules.length > 0
        ? rules
        : [
            'All files must have the .m3u extension',
            'The playlist must begin with the header #EXTM3U',
            'Each link must comply with the Stream Description Scheme',
            'Lines must end with CRLF',
            'The file encoding must be UTF-8 without BOM',
          ],
    internalExample,
    publicExample,
    rawExcerpt: (markdown || '').slice(0, 2800),
  };
}

async function getOrFetchPublicIptvDirectory(forceRefresh = false): Promise<PublicIptvDirectoryCachePayload> {
  if (!forceRefresh && publicIptvDirectoryCache && Date.now() - publicIptvDirectoryCache.timestamp < PLAYLIST_TTL_MS) {
    return publicIptvDirectoryCache;
  }
  if (!forceRefresh && inFlightPublicIptvDirectoryFetch) {
    return inFlightPublicIptvDirectoryFetch;
  }

  const FC_INDEX_URL = 'https://raw.githubusercontent.com/subash9860/iptv-football-cricket/main/index.m3u';
  const FC_WC_URL = 'https://raw.githubusercontent.com/subash9860/iptv-football-cricket/main/worldcup-2026.m3u';
  const FC_README_URL = 'https://raw.githubusercontent.com/subash9860/iptv-football-cricket/main/README.md';
  const FREE_ALL_URL = 'https://raw.githubusercontent.com/freecasthub/public-iptv/main/playlist.m3u';
  const IPTV_ORG_PLAYLISTS_MD = 'https://raw.githubusercontent.com/iptv-org/iptv/master/PLAYLISTS.md';
  const IPTV_ORG_DOCS_MD = 'https://raw.githubusercontent.com/iptv-org/iptv/master/docs/playlists.md';

  inFlightPublicIptvDirectoryFetch = (async () => {
    const [fcPlaylist, fcReadme, freePlaylist, iptvOrgPlaylistsMd, iptvOrgDocsMd] = await Promise.all([
      getOrFetchPlaylist(FC_INDEX_URL).catch(() => null),
      fetchTextWithTimeout(FC_README_URL, 10000).catch(() => ''),
      getOrFetchPlaylist(FREE_ALL_URL).catch(() => null),
      fetchTextWithTimeout(IPTV_ORG_PLAYLISTS_MD, 11000).catch(() => ''),
      fetchTextWithTimeout(IPTV_ORG_DOCS_MD, 10000).catch(() => ''),
    ]);

    const directoryRows = parseFootballCricketReadme(fcReadme);
    const categories = parseIptvOrgPlaylistsMarkdown(iptvOrgPlaylistsMd);
    const playlistDocs = parsePlaylistDocsMarkdown(iptvOrgDocsMd);

    const payload: PublicIptvDirectoryCachePayload = {
      timestamp: Date.now(),
      footballCricket: {
        repoUrl: 'https://github.com/subash9860/iptv-football-cricket',
        playlistUrl: FC_INDEX_URL,
        worldCupPlaylistUrl: FC_WC_URL,
        channels: fcPlaylist?.channels || [],
        directoryRows,
      },
      freePublicIptv: {
        repoUrl: 'https://github.com/freecasthub/public-iptv',
        presets: [
          { id: 'all', label: 'All Public Broadcasters', url: FREE_ALL_URL },
          { id: 'news', label: 'News', url: 'https://raw.githubusercontent.com/freecasthub/public-iptv/main/news.m3u' },
          { id: 'sports', label: 'Sports', url: 'https://raw.githubusercontent.com/freecasthub/public-iptv/main/sports.m3u' },
          { id: 'weather', label: 'Weather', url: 'https://raw.githubusercontent.com/freecasthub/public-iptv/main/weather.m3u' },
          { id: 'education', label: 'Education', url: 'https://raw.githubusercontent.com/freecasthub/public-iptv/main/education.m3u' },
        ],
        channels: freePlaylist?.channels || [],
      },
      iptvOrgDatabase: {
        repoUrl: 'https://github.com/iptv-org/iptv',
        masterPlaylistUrl: 'https://iptv-org.github.io/iptv/index.m3u',
        categoryMasterUrl: 'https://iptv-org.github.io/iptv/index.category.m3u',
        categories,
      },
      playlistDocs,
    };

    publicIptvDirectoryCache = payload;
    return payload;
  })();

  try {
    return await inFlightPublicIptvDirectoryFetch;
  } finally {
    inFlightPublicIptvDirectoryFetch = null;
  }
}

function decodeXmlEntities(str: string): string {
  if (!str) return '';
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(Number(dec)))
    .trim();
}

function parseXmltvDate(raw: string): number {
  if (!raw) return 0;
  const clean = raw.trim();
  const match = clean.match(/^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})(?:\s*([+-]\d{2}):?(\d{2}))?/);
  if (!match) {
    const parsed = Date.parse(clean);
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  const [, year, month, day, hour, min, sec, tzSignHour, tzMin] = match;
  let utcMs = Date.UTC(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(min),
    Number(sec)
  );

  if (tzSignHour && tzMin) {
    const sign = tzSignHour.startsWith('-') ? -1 : 1;
    const offsetHours = Math.abs(Number(tzSignHour));
    const offsetMinutes = Number(tzMin);
    const totalOffsetMs = sign * (offsetHours * 60 + offsetMinutes) * 60 * 1000;
    utcMs -= totalOffsetMs;
  }
  return utcMs;
}

function parseM3uPlaylist(rawText: string, sourceUrl: string): PlaylistCacheEntry {
  const lines = rawText.split(/\r?\n/);
  const epgUrls: string[] = [];
  const channels: ParsedPlaylistChannel[] = [];
  const groupSet = new Set<string>();

  for (let i = 0; i < Math.min(lines.length, 5); i++) {
    const headerLine = lines[i].trim();
    if (headerLine.startsWith('#EXTM3U')) {
      const tvgMatch = headerLine.match(/(?:x-tvg-url|url-tvg)="([^"]+)"/i);
      if (tvgMatch && tvgMatch[1]) {
        tvgMatch[1]
          .split(',')
          .map(u => u.trim())
          .filter(u => (u.startsWith('http://') || u.startsWith('https://')) && !u.includes('ALL_SOURCES'))
          .forEach(u => epgUrls.push(u));
      }
      break;
    }
  }

  let currentMeta: Partial<ParsedPlaylistChannel> | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    if (line.startsWith('#EXTINF:')) {
      const tvgIdMatch = line.match(/tvg-id="([^"]*)"/i);
      const tvgNameMatch = line.match(/tvg-name="([^"]*)"/i);
      const tvgLogoMatch = line.match(/tvg-logo="([^"]*)"/i);
      const tvgCountryMatch = line.match(/tvg-country="([^"]*)"/i);
      const tvgChnoMatch = line.match(/tvg-chno="([^"]*)"/i);
      const groupMatch = line.match(/group-title="([^"]*)"/i);

      const commaIdx = line.lastIndexOf(',');
      const rawTitle = commaIdx !== -1 ? line.substring(commaIdx + 1).trim() : 'Live Channel';

      const isYouTube = rawTitle.includes('Ⓨ');
      const isGeoBlocked = rawTitle.includes('Ⓖ') || /\[geo-blocked\]/i.test(rawTitle);
      const isTwitch = rawTitle.includes('Ⓣ');

      const cleanTitle = rawTitle
        .replace(/[ⓎⒼⓈⓉⓍ]/g, '')
        .replace(/\[.*?\]/g, '')
        .replace(/\(\d+p\)/gi, '')
        .replace(/\s+/g, ' ')
        .trim();

      const groupTitle = (groupMatch?.[1] || 'International').trim();
      groupSet.add(groupTitle);

      const tvgId = (tvgIdMatch?.[1] || '').trim();
      const tvgName = (tvgNameMatch?.[1] || cleanTitle).replace(/[ⓎⒼⓈⓉⓍ]/g, '').trim();

      currentMeta = {
        id: `freetv-${channels.length + 1}-${(tvgId || cleanTitle).toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 18)}`,
        name: cleanTitle || tvgName || 'Live TV Channel',
        tvgId,
        tvgName: tvgName || cleanTitle,
        tvgLogo: (tvgLogoMatch?.[1] || '').trim(),
        tvgCountry: (tvgCountryMatch?.[1] || '').trim(),
        tvgChno: (tvgChnoMatch?.[1] || '').trim(),
        groupTitle,
        isGeoBlocked,
        isYouTube,
        isTwitch,
      };
    } else if ((line.startsWith('http://') || line.startsWith('https://')) && currentMeta) {
      const streamUrl = line;
      let streamFormat: 'hls' | 'youtube' | 'mp4' = 'hls';
      if (
        streamUrl.includes('youtube.com') ||
        streamUrl.includes('youtu.be') ||
        currentMeta.isYouTube
      ) {
        streamFormat = 'youtube';
      } else if (streamUrl.endsWith('.mp4')) {
        streamFormat = 'mp4';
      }

      channels.push({
        ...(currentMeta as Omit<ParsedPlaylistChannel, 'streamUrl' | 'streamFormat'>),
        streamUrl,
        streamFormat,
      });
      currentMeta = null;
    }
  }

  return {
    timestamp: Date.now(),
    sourceUrl,
    epgUrls,
    channels,
    groups: Array.from(groupSet).sort(),
  };
}

function parseXmltvDocument(xmlText: string, sourceUrl: string): EpgCacheEntry {
  const channelDisplayNames: Record<string, string> = {};
  const programsByChannel: Record<string, EpgProgram[]> = {};

  const now = Date.now();
  const windowStart = now - 6 * 60 * 60 * 1000;
  const windowEnd = now + 36 * 60 * 60 * 1000;

  // Fast indexOf scanner for <channel ...>...</channel>
  let cursor = 0;
  while (true) {
    const startIdx = xmlText.indexOf('<channel', cursor);
    if (startIdx === -1) break;
    const endIdx = xmlText.indexOf('</channel>', startIdx);
    if (endIdx === -1) break;
    const block = xmlText.slice(startIdx, endIdx + 10);
    cursor = endIdx + 10;

    const idMatch = block.match(/id="([^"]+)"/i);
    const dnMatch = block.match(/<display-name[^>]*>([\s\S]*?)<\/display-name>/i);
    if (idMatch && dnMatch) {
      channelDisplayNames[decodeXmlEntities(idMatch[1])] = decodeXmlEntities(dnMatch[1]);
    }
  }

  // Fast indexOf scanner for <programme ...>...</programme>
  cursor = 0;
  let idx = 0;
  while (true) {
    const startIdx = xmlText.indexOf('<programme', cursor);
    if (startIdx === -1) break;
    const openEndIdx = xmlText.indexOf('>', startIdx);
    const endIdx = xmlText.indexOf('</programme>', startIdx);
    if (openEndIdx === -1 || endIdx === -1) break;

    const attrs = xmlText.slice(startIdx + 10, openEndIdx);
    const inner = xmlText.slice(openEndIdx + 1, endIdx);
    cursor = endIdx + 12;

    const startMatch = attrs.match(/start="([^"]+)"/i);
    const stopMatch = attrs.match(/stop="([^"]+)"/i);
    const chanMatch = attrs.match(/channel="([^"]+)"/i);
    if (!startMatch || !chanMatch) continue;

    const startMs = parseXmltvDate(startMatch[1]);
    const stopMs = stopMatch ? parseXmltvDate(stopMatch[1]) : startMs + 30 * 60 * 1000;
    if (!startMs || stopMs < windowStart || startMs > windowEnd) {
      continue;
    }

    const channelId = decodeXmlEntities(chanMatch[1]);
    const titleMatch = inner.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const subTitleMatch = inner.match(/<sub-title[^>]*>([\s\S]*?)<\/sub-title>/i);
    const descMatch = inner.match(/<desc[^>]*>([\s\S]*?)<\/desc>/i);
    const catMatch = inner.match(/<category[^>]*>([\s\S]*?)<\/category>/i);
    const iconMatch = inner.match(/<icon\s+src="([^"]+)"/i);

    if (!programsByChannel[channelId]) {
      programsByChannel[channelId] = [];
    }

    programsByChannel[channelId].push({
      id: `${channelId}-${startMs}-${idx++}`,
      channelId,
      title: titleMatch ? decodeXmlEntities(titleMatch[1]) : 'Scheduled Broadcast',
      subTitle: subTitleMatch ? decodeXmlEntities(subTitleMatch[1]) : undefined,
      description: descMatch ? decodeXmlEntities(descMatch[1]) : undefined,
      category: catMatch ? decodeXmlEntities(catMatch[1]) : undefined,
      start: new Date(startMs).toISOString(),
      stop: new Date(stopMs).toISOString(),
      startMs,
      stopMs,
      icon: iconMatch ? decodeXmlEntities(iconMatch[1]) : undefined,
    });
  }

  for (const chId of Object.keys(programsByChannel)) {
    programsByChannel[chId].sort((a, b) => a.startMs - b.startMs);
  }

  return {
    timestamp: Date.now(),
    url: sourceUrl,
    channelDisplayNames,
    programsByChannel,
  };
}

function setEpgCacheWithLimit(url: string, entry: EpgCacheEntry) {
  if (epgCache.size >= MAX_EPG_CACHE_ENTRIES) {
    const oldestKey = epgCache.keys().next().value;
    if (oldestKey) epgCache.delete(oldestKey);
  }
  epgCache.set(url, entry);
}

async function fetchAndCacheEpgUrl(url: string): Promise<EpgCacheEntry | null> {
  if (url.includes('ALL_SOURCES')) {
    return null;
  }

  const cached = epgCache.get(url);
  if (cached && Date.now() - cached.timestamp < EPG_TTL_MS) {
    return cached;
  }

  const existingPromise = inFlightEpgFetches.get(url);
  if (existingPromise) {
    return existingPromise;
  }

  const fetchPromise = (async (): Promise<EpgCacheEntry | null> => {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 16000);
      const res = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'FreeTVRadioLive/1.0 (+https://github.com/Free-TV/IPTV)',
        },
      });
      clearTimeout(timeout);

      if (!res.ok) {
        return null;
      }

      const contentLenHeader = res.headers.get('content-length');
      if (contentLenHeader && Number(contentLenHeader) > MAX_COMPRESSED_EPG_BYTES) {
        console.warn(`Skipping oversized EPG feed (${contentLenHeader} bytes): ${url}`);
        return null;
      }

      const arrayBuf = await res.arrayBuffer();
      if (arrayBuf.byteLength > MAX_COMPRESSED_EPG_BYTES) {
        return null;
      }

      const buf = Buffer.from(arrayBuf);
      let xmlText = '';
      if (url.endsWith('.gz') || (buf[0] === 0x1f && buf[1] === 0x8b)) {
        xmlText = zlib.gunzipSync(buf).toString('utf-8');
      } else {
        xmlText = buf.toString('utf-8');
      }

      const parsed = parseXmltvDocument(xmlText, url);
      setEpgCacheWithLimit(url, parsed);
      return parsed;
    } catch (err) {
      console.warn(`EPG fetch failed for ${url}:`, (err as Error).message);
      return null;
    } finally {
      inFlightEpgFetches.delete(url);
    }
  })();

  inFlightEpgFetches.set(url, fetchPromise);
  return fetchPromise;
}

function selectRelevantEpgUrls(
  tvgIds: string[],
  countryCodes: string[],
  availableEpgUrls: string[]
): string[] {
  const prioritySelected = new Set<string>();
  const secondarySelected = new Set<string>();

  const addMatching = (token: string, isPriority: boolean) => {
    const upper = token.toUpperCase().replace(/[^A-Z0-9_]/g, '');
    if (upper.length < 2) return;
    const target = isPriority ? prioritySelected : secondarySelected;
    for (const url of availableEpgUrls) {
      if (url.includes('ALL_SOURCES')) continue;
      const fileName = (url.split('/').pop() || '').toUpperCase();
      if (
        fileName === `EPG_RIPPER_${upper}1.XML.GZ` ||
        fileName === `EPG_RIPPER_${upper}2.XML.GZ` ||
        fileName === `EPG_RIPPER_${upper}3.XML.GZ` ||
        fileName === `EPG_RIPPER_${upper}4.XML.GZ` ||
        fileName.startsWith(`EPG_RIPPER_${upper}_`) ||
        fileName.startsWith(`${upper}.`) ||
        (upper.length >= 4 && fileName.includes(upper))
      ) {
        target.add(url);
      }
    }
  };

  for (const ccRaw of countryCodes) {
    if (!ccRaw) continue;
    let cc = ccRaw.toUpperCase().trim();
    if (cc === 'GB') cc = 'UK';
    if (cc === 'UNITED STATES' || cc === 'USA') cc = 'US';
    if (cc === 'UNITED KINGDOM' || cc === 'UK') cc = 'UK';
    if (cc === 'INDIA') cc = 'IN';
    if (cc === 'CANADA') cc = 'CA';
    if (cc === 'AUSTRALIA') cc = 'AU';
    if (cc === 'GERMANY') cc = 'DE';
    if (cc === 'FRANCE') cc = 'FR';
    if (cc === 'SPAIN') cc = 'ES';
    if (cc === 'ITALY') cc = 'IT';
    if (cc === 'BRAZIL') cc = 'BR';
    if (cc === 'JAPAN' || cc.includes('JAPAN')) cc = 'JP';
    addMatching(cc, true);
  }

  for (const id of tvgIds) {
    const lower = id.toLowerCase();
    if (lower.includes('aljazeera')) addMatching('ALJAZEERA', true);
    if (lower.includes('bein')) addMatching('BEIN', false);
    if (lower.includes('rakuten')) addMatching('RAKUTEN', false);
    if (lower.includes('plex')) addMatching('PLEX', false);
    if (lower.includes('deluxemusic')) addMatching('DELUXEMUSIC', false);
    if (lower.includes('tbn')) addMatching('TBNPLUS', false);
    if (lower.includes('rally')) addMatching('RALLY_TV', false);

    const parts = id.split('.');
    const suffix = parts[parts.length - 1];
    if (suffix && suffix.length >= 2 && suffix.length <= 3) {
      let cc = suffix.toUpperCase();
      if (cc === 'GB') cc = 'UK';
      addMatching(cc, false);
    }
  }

  const combined = Array.from(new Set([...prioritySelected, ...secondarySelected]));

  if (combined.length === 0) {
    const uk1 = availableEpgUrls.find(u => u.includes('UK1.xml'));
    if (uk1) combined.push(uk1);
    const aljazeera = availableEpgUrls.find(u => u.includes('ALJAZEERA'));
    if (aljazeera) combined.push(aljazeera);
    const in1 = availableEpgUrls.find(u => u.includes('IN1.xml'));
    if (in1) combined.push(in1);
  }

  return combined.slice(0, 3);
}

async function getOrFetchPlaylist(playlistUrl: string): Promise<PlaylistCacheEntry> {
  const cached = playlistCache.get(playlistUrl);
  if (cached && Date.now() - cached.timestamp < PLAYLIST_TTL_MS) {
    return cached;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  const res = await fetch(playlistUrl, {
    signal: controller.signal,
    headers: {
      'User-Agent': 'FreeTVRadioLive/1.0',
    },
  });
  clearTimeout(timeout);

  if (!res.ok) {
    throw new Error(`Failed to fetch playlist (${res.status})`);
  }

  const rawText = await res.text();
  const parsed = parseM3uPlaylist(rawText, playlistUrl);
  playlistCache.set(playlistUrl, parsed);
  return parsed;
}

async function startServer() {
  const app = express();
  const httpServer = http.createServer(app);
  app.use(express.json({ limit: '2mb' }));

  // 1. IPTV Playlist Fetch & Parse Endpoint
  app.get('/api/iptv/playlist', async (req: Request, res: Response) => {
    try {
      const requestedUrl = typeof req.query.url === 'string' && req.query.url.trim()
        ? req.query.url.trim()
        : DEFAULT_PLAYLIST_URL;

      if (!requestedUrl.startsWith('http://') && !requestedUrl.startsWith('https://')) {
        res.status(400).json({ error: 'Playlist URL must start with http:// or https://' });
        return;
      }

      const data = await getOrFetchPlaylist(requestedUrl);
      res.json({
        sourceUrl: data.sourceUrl,
        epgUrls: data.epgUrls,
        totalChannels: data.channels.length,
        groups: data.groups,
        channels: data.channels,
        cachedAt: new Date(data.timestamp).toISOString(),
      });
    } catch (err) {
      res.status(502).json({
        error: 'Unable to fetch IPTV M3U8 playlist',
        details: (err as Error).message,
      });
    }
  });

  // 1b. Separate 18+ / NSFW (XXX) Category Endpoint via iptv-org API + playlists
  app.get('/api/iptv/adult18', async (_req: Request, res: Response) => {
    try {
      const data = await getOrFetchAdult18Catalog();
      res.json({
        category: data.category,
        playlistUrl: data.playlistUrl,
        apiEndpoints: data.apiEndpoints,
        playableChannels: data.playableChannels,
        directoryEntries: data.directoryEntries,
        totalDirectoryCount: data.directoryEntries.length,
        totalPlayableCount: data.playableChannels.length,
        cachedAt: new Date(data.timestamp).toISOString(),
      });
    } catch (err) {
      res.status(502).json({
        error: 'Unable to load iptv-org 18+ / NSFW catalog',
        details: (err as Error).message,
      });
    }
  });

  // 1c. Cricket Hub Aggregator Endpoint (Cricombo + Cricket On Air)
  app.get('/api/cricket/hub', async (req: Request, res: Response) => {
    try {
      const forceRefresh = req.query.refresh === '1' || req.query.refresh === 'true';
      const data = await getOrFetchCricketHub(forceRefresh);
      res.json({
        liveStreams: data.liveStreams,
        replaysAndHighlights: data.replaysAndHighlights,
        matches: data.matches,
        news: data.news,
        sources: data.sources,
        fetchedAt: new Date(data.timestamp).toISOString(),
      });
    } catch (err) {
      res.status(502).json({
        error: 'Unable to fetch Cricket Hub feeds',
        details: (err as Error).message,
      });
    }
  });

  // 1d. Separate Public IPTV Repositories & Broadcaster Directory Endpoint
  app.get('/api/iptv/public-directory', async (req: Request, res: Response) => {
    try {
      const forceRefresh = req.query.refresh === '1' || req.query.refresh === 'true';
      const data = await getOrFetchPublicIptvDirectory(forceRefresh);
      res.json({
        footballCricket: data.footballCricket,
        freePublicIptv: data.freePublicIptv,
        iptvOrgDatabase: data.iptvOrgDatabase,
        playlistDocs: data.playlistDocs,
        fetchedAt: new Date(data.timestamp).toISOString(),
      });
    } catch (err) {
      res.status(502).json({
        error: 'Unable to fetch Public IPTV directory sources',
        details: (err as Error).message,
      });
    }
  });

  // 2. Electronic Program Guide (EPG) Fetcher Endpoint linked to IPTV Playlist
  app.post('/api/epg/fetch', async (req: Request, res: Response) => {
    try {
      const {
        tvgIds = [],
        channelNames = [],
        countryCodes = [],
        epgUrls = [],
        playlistUrl = DEFAULT_PLAYLIST_URL,
      } = req.body || {};

      let availableEpgUrls: string[] = Array.isArray(epgUrls) ? epgUrls : [];

      if (availableEpgUrls.length === 0) {
        try {
          const playlist = await getOrFetchPlaylist(playlistUrl);
          availableEpgUrls = playlist.epgUrls;
        } catch {
          availableEpgUrls = [
            'https://epgshare01.online/epgshare01/epg_ripper_UK1.xml.gz',
            'https://epgshare01.online/epgshare01/epg_ripper_IN1.xml.gz',
            'https://epgshare01.online/epgshare01/epg_ripper_ALJAZEERA1.xml.gz',
          ];
        }
      }

      const targetUrls = selectRelevantEpgUrls(
        Array.isArray(tvgIds) ? tvgIds : [],
        Array.isArray(countryCodes) ? countryCodes : [],
        availableEpgUrls
      );

      const results = await Promise.all(targetUrls.map(url => fetchAndCacheEpgUrl(url)));

      const programsByChannelId: Record<string, EpgProgram[]> = {};
      const fetchedSources: string[] = [];

      const normalizeBase = (s: string) =>
        s
          .toLowerCase()
          .replace(/@(uhd|fhd|hd|sd|4k)$/i, '')
          .replace(/\.[a-z0-9]{2,4}$/i, '')
          .replace(/[^a-z0-9+]/g, '')
          .replace(/(uhd|fhd|hd|sd|4k)$/i, '');

      const wantedIdsLower = new Map<string, string>();
      const wantedBaseIds = new Map<string, string>();
      if (Array.isArray(tvgIds)) {
        for (const id of tvgIds) {
          if (id) {
            const rawId = String(id);
            wantedIdsLower.set(rawId.toLowerCase(), rawId);
            const base = normalizeBase(rawId);
            if (base.length >= 3) wantedBaseIds.set(base, rawId);
          }
        }
      }

      const wantedNamesLower = new Map<string, string>();
      if (Array.isArray(channelNames)) {
        for (const n of channelNames) {
          if (n) {
            const norm = normalizeBase(String(n));
            if (norm.length >= 3) wantedNamesLower.set(norm, String(n));
          }
        }
      }

      const findPrefixMatch = (candidate: string, map: Map<string, string>): string | undefined => {
        if (!candidate || candidate.includes('+1')) return undefined;
        for (const [wantedKey, orig] of map.entries()) {
          if (wantedKey.length >= 5 && candidate.startsWith(wantedKey)) {
            return orig;
          }
        }
        return undefined;
      };

      for (const entry of results) {
        if (!entry) continue;
        fetchedSources.push(entry.url);

        for (const [epgChannelId, progs] of Object.entries(entry.programsByChannel)) {
          const lowerId = epgChannelId.toLowerCase();
          const strippedId = normalizeBase(epgChannelId);
          const displayNameNorm = normalizeBase(entry.channelDisplayNames[epgChannelId] || '');

          const matchedOriginalId =
            wantedIdsLower.get(lowerId) ||
            wantedBaseIds.get(strippedId) ||
            (displayNameNorm ? wantedBaseIds.get(displayNameNorm) : undefined) ||
            findPrefixMatch(strippedId, wantedBaseIds);

          const shouldInclude =
            wantedIdsLower.size === 0 ||
            Boolean(matchedOriginalId) ||
            wantedNamesLower.has(strippedId) ||
            (displayNameNorm && wantedNamesLower.has(displayNameNorm)) ||
            Boolean(findPrefixMatch(strippedId, wantedNamesLower));

          if (shouldInclude) {
            if (matchedOriginalId && !programsByChannelId[matchedOriginalId]) {
              programsByChannelId[matchedOriginalId] = progs;
            }
            if (!programsByChannelId[epgChannelId]) {
              programsByChannelId[epgChannelId] = progs;
            }
          }
        }
      }

      res.json({
        programsByChannelId,
        fetchedSources,
        totalMatchedChannels: Object.keys(programsByChannelId).length,
        fetchedAt: new Date().toISOString(),
      });
    } catch (err) {
      res.status(500).json({
        error: 'Failed to fetch EPG schedules',
        details: (err as Error).message,
      });
    }
  });

  // 3. Direct Single XMLTV Source Endpoint
  app.get('/api/epg/source', async (req: Request, res: Response) => {
    const url = typeof req.query.url === 'string' ? req.query.url.trim() : '';
    if (!url || (!url.startsWith('http://') && !url.startsWith('https://'))) {
      res.status(400).json({ error: 'Valid http(s) XMLTV URL required' });
      return;
    }

    const entry = await fetchAndCacheEpgUrl(url);
    if (!entry) {
      res.status(502).json({ error: 'Could not download or parse XMLTV feed (or file exceeded 18MB limit)' });
      return;
    }

    res.json({
      url: entry.url,
      channelCount: Object.keys(entry.programsByChannel).length,
      channelDisplayNames: entry.channelDisplayNames,
      programsByChannelId: entry.programsByChannel,
      fetchedAt: new Date(entry.timestamp).toISOString(),
    });
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        ws: { server: httpServer },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Free TV & Radio Live server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
