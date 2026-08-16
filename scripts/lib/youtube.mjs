/**
 * Extracts a YouTube video id from any of the URL shapes people actually paste.
 *
 * The 2022 site did `video_url.split("=")[1]`, which produced garbage for
 * youtu.be short links and for any URL with a trailing parameter — the embed
 * then silently failed. All five current project videos happen to use the
 * `watch?v=` form, but nothing stops a future admin entry from using another.
 *
 * Returns the 11-character id, or null if the URL isn't a recognisable YouTube link.
 */
const ID = /^[A-Za-z0-9_-]{11}$/;

export function youtubeId(rawUrl) {
  if (!rawUrl) return null;

  let url;
  try {
    url = new URL(String(rawUrl).trim());
  } catch {
    // Bare id pasted straight into the admin field.
    const bare = String(rawUrl).trim();
    return ID.test(bare) ? bare : null;
  }

  const host = url.hostname.replace(/^www\./, '');
  const segments = url.pathname.split('/').filter(Boolean);

  // youtu.be/<id>
  if (host === 'youtu.be') {
    return ID.test(segments[0] ?? '') ? segments[0] : null;
  }

  if (!/(^|\.)youtube(-nocookie)?\.com$/.test(host)) return null;

  // youtube.com/watch?v=<id>
  const v = url.searchParams.get('v');
  if (v && ID.test(v)) return v;

  // youtube.com/{embed,shorts,live,v}/<id>
  if (['embed', 'shorts', 'live', 'v'].includes(segments[0]) && ID.test(segments[1] ?? '')) {
    return segments[1];
  }

  return null;
}

/** Privacy-preserving embed URL for a given id. */
export function youtubeEmbedUrl(id) {
  return `https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1`;
}

/** Thumbnail URL, used as the click-to-load facade poster. */
export function youtubeThumbnail(id) {
  return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
}
