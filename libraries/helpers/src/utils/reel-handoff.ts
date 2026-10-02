export interface ReelDraft {
  id: string;
  content: string;
  video: string;
  cover?: string;
  account: string;
  profile: string;
}

export interface ReelDraftRecord {
  id: string;
  state: string;
  content: string;
  image: string | null;
  settings: string | null;
  integration: {
    providerIdentifier: string;
    name: string;
    profile: string | null;
  };
}

// Never turn persisted media into executable URLs or protocol-relative links.
export function safeReelMediaUrl(value: unknown): string | undefined {
  if (typeof value !== 'string' || /[\\\s]/.test(value)) return;
  if (value.startsWith('/uploads/')) return value;
  try {
    const url = new URL(value);
    if (url.protocol === 'https:' && !url.username && !url.password)
      return url.href;
  } catch {}
}

export function toReelDraft(post: ReelDraftRecord): ReelDraft | undefined {
  if (
    post.state !== 'DRAFT' ||
    !['instagram', 'instagram-standalone'].includes(
      post.integration.providerIdentifier
    )
  )
    return;
  try {
    const media = JSON.parse(post.image || '[]');
    const settings = JSON.parse(post.settings || '{}');
    if (
      !Array.isArray(media) ||
      media.length !== 1 ||
      settings?.post_type === 'story'
    )
      return;
    const video = safeReelMediaUrl(media[0]?.path);
    if (
      !video ||
      !/\.mp4$/i.test(new URL(video, 'https://postiz.local').pathname)
    )
      return;
    return {
      id: post.id,
      content: post.content,
      video,
      cover: safeReelMediaUrl(media[0]?.thumbnail),
      account: post.integration.name,
      profile: post.integration.profile || '',
    };
  } catch {
    return;
  }
}
