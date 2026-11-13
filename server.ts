import express, { Request, Response } from 'express';
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
      const isGeoBlocked = rawTitle.includes('Ⓖ');
      const isTwitch = rawTitle.includes('Ⓣ');

      const cleanTitle = rawTitle
        .replace(/[ⓎⒼⓈⓉⓍ]/g, '')
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
      server: { middlewareMode: true },
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

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Free TV & Radio Live server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
