// Keep login return destinations on the browser's current origin.
export function normalizeReturnUrl(
  value: string | null,
  origin: string
): string | undefined {
  if (!value || /[\\\u0000-\u0020\u007f]/.test(value) || value.startsWith('//'))
    return;
  try {
    const target = new URL(value, origin);
    const legacyReel =
      target.origin === 'http://localhost:4200' &&
      (target.pathname === '/reels' || target.pathname.startsWith('/reels/'));
    if (target.origin !== origin && !legacyReel) return;
    if (target.username || target.password || target.pathname.startsWith('//'))
      return;
    return target.pathname + target.search + target.hash;
  } catch {
    return;
  }
}
