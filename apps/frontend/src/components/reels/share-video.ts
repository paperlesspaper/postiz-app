// Keep preparation separate from navigator.share: iOS requires a fresh tap.
export const MAX_SHARE_BYTES = 200 * 1024 * 1024;

export async function prepareReelFile(
  url: string,
  name: string,
  signal: AbortSignal,
  onProgress: (bytes: number, total: number) => void
): Promise<File> {
  const response = await fetch(url, { signal, credentials: 'same-origin' });
  if (!response.ok || !response.body) throw new Error('download');
  const type = (response.headers.get('content-type') || '').split(';')[0];
  if (type !== 'video/mp4' && type !== 'application/octet-stream')
    throw new Error('format');
  const total = Number(response.headers.get('content-length')) || 0;
  if (total > MAX_SHARE_BYTES) {
    await response.body.cancel();
    throw new Error('size');
  }
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let bytes = 0;
  try {
    while (true) {
      const next = await reader.read();
      if (next.done) break;
      bytes += next.value.byteLength;
      if (bytes > MAX_SHARE_BYTES) throw new Error('size');
      chunks.push(next.value);
      onProgress(bytes, total);
    }
    if (!bytes) throw new Error('empty');
    return new File(chunks, name, { type: 'video/mp4' });
  } finally {
    await reader.cancel().catch(() => {});
    reader.releaseLock();
  }
}
