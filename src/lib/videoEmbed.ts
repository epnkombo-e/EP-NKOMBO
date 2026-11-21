export type VideoSourceSpec =
  | { kind: 'iframe'; src: string; provider: 'YouTube' | 'Vimeo' }
  | { kind: 'video'; src: string }
  | { kind: 'link'; src: string };

/**
 * Safely parses a video URL (YouTube, Vimeo, or direct MP4/WebM/OGG) for
 * embedding in school posts. Rejects unsafe schemes such as javascript:.
 */
export function parseVideoSource(rawUrl?: string | null): VideoSourceSpec | null {
  if (!rawUrl) return null;
  const trimmed = rawUrl.trim();
  if (!trimmed) return null;

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return null;
  }

  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    return null;
  }

  const host = parsed.hostname.replace(/^www\./, '').toLowerCase();

  // YouTube (youtube.com, m.youtube.com, youtu.be, youtube-nocookie.com)
  if (host === 'youtu.be') {
    const id = parsed.pathname.split('/').filter(Boolean)[0];
    if (id && /^[a-zA-Z0-9_-]{6,20}$/.test(id)) {
      return {
        kind: 'iframe',
        src: `https://www.youtube-nocookie.com/embed/${id}`,
        provider: 'YouTube',
      };
    }
  }

  if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'youtube-nocookie.com') {
    const vParam = parsed.searchParams.get('v');
    if (vParam && /^[a-zA-Z0-9_-]{6,20}$/.test(vParam)) {
      return {
        kind: 'iframe',
        src: `https://www.youtube-nocookie.com/embed/${vParam}`,
        provider: 'YouTube',
      };
    }
    const parts = parsed.pathname.split('/').filter(Boolean);
    if ((parts[0] === 'embed' || parts[0] === 'shorts' || parts[0] === 'live') && parts[1]) {
      const id = parts[1];
      if (/^[a-zA-Z0-9_-]{6,20}$/.test(id)) {
        return {
          kind: 'iframe',
          src: `https://www.youtube-nocookie.com/embed/${id}`,
          provider: 'YouTube',
        };
      }
    }
  }

  // Vimeo
  if (host === 'vimeo.com' || host === 'player.vimeo.com') {
    const parts = parsed.pathname.split('/').filter(Boolean);
    const numericId = [...parts].reverse().find((seg) => /^\d{5,15}$/.test(seg));
    if (numericId) {
      return {
        kind: 'iframe',
        src: `https://player.vimeo.com/video/${numericId}`,
        provider: 'Vimeo',
      };
    }
  }

  // Direct HTML5 video files
  const lowerPath = parsed.pathname.toLowerCase();
  if (lowerPath.endsWith('.mp4') || lowerPath.endsWith('.webm') || lowerPath.endsWith('.mov') || lowerPath.endsWith('.ogg')) {
    return { kind: 'video', src: parsed.toString() };
  }

  return { kind: 'link', src: parsed.toString() };
}

const SAFE_IMAGE_DATA_URI_RE =
  /^data:image\/(jpeg|jpg|png|webp|gif);base64,[A-Za-z0-9+/=]+$/i;

export function isSafeMediaUrl(rawUrl?: string | null): boolean {
  if (!rawUrl) return false;
  const trimmed = rawUrl.trim();
  if (!trimmed) return false;
  if (trimmed.startsWith('/')) return true;
  if (SAFE_IMAGE_DATA_URI_RE.test(trimmed)) return true;
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}
