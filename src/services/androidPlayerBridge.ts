export interface Media3PlaybackOptions {
  url: string;
  title?: string;
  subtitle?: string;
}

interface Media3CapacitorPlugin {
  play(options: Media3PlaybackOptions): Promise<{ launched: boolean; player?: string }>;
  openInVlc(options: { url: string; title?: string }): Promise<{ launched: boolean; target?: string }>;
}

interface CapacitorWindow extends Window {
  Capacitor?: {
    isNativePlatform?: () => boolean;
    getPlatform?: () => string;
    Plugins?: {
      Media3Player?: Media3CapacitorPlugin;
    };
  };
}

export function isAndroidNativeApp(): boolean {
  if (typeof window === 'undefined') return false;
  const cap = (window as CapacitorWindow).Capacitor;
  if (!cap) return false;
  try {
    const isNative = Boolean(cap.isNativePlatform?.());
    const platform = cap.getPlatform?.();
    return isNative && (!platform || platform === 'android');
  } catch {
    return false;
  }
}

export function hasMedia3Plugin(): boolean {
  if (typeof window === 'undefined') return false;
  const cap = (window as CapacitorWindow).Capacitor;
  return Boolean(cap?.Plugins?.Media3Player?.play);
}

export async function launchMedia3ExoPlayer(options: Media3PlaybackOptions): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  const plugin = (window as CapacitorWindow).Capacitor?.Plugins?.Media3Player;
  if (!plugin?.play) return false;

  try {
    const res = await plugin.play({
      url: options.url,
      title: options.title || 'Live Broadcast',
      subtitle: options.subtitle || 'AndroidX Media3 ExoPlayer',
    });
    return Boolean(res?.launched ?? true);
  } catch {
    return false;
  }
}

export async function openStreamInVlc(url: string, title?: string): Promise<'native' | 'intent' | 'vlc-scheme'> {
  if (typeof window === 'undefined') return 'vlc-scheme';
  const plugin = (window as CapacitorWindow).Capacitor?.Plugins?.Media3Player;

  if (plugin?.openInVlc) {
    try {
      await plugin.openInVlc({ url, title: title || 'Live Stream' });
      return 'native';
    } catch {
      // Fall through to web intent fallback
    }
  }

  const isAndroid = /android/i.test(navigator.userAgent || '');
  if (isAndroid && (url.startsWith('https://') || url.startsWith('http://'))) {
    const scheme = url.startsWith('https://') ? 'https' : 'http';
    const stripped = url.replace(/^https?:\/\//, '');
    const encodedTitle = encodeURIComponent(title || 'Live Stream');
    window.location.href = `intent://${stripped}#Intent;scheme=${scheme};package=org.videolan.vlc;type=video/*;S.title=${encodedTitle};end`;
    return 'intent';
  }

  const link = document.createElement('a');
  link.href = `vlc://${url}`;
  link.rel = 'noreferrer noopener';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  return 'vlc-scheme';
}
