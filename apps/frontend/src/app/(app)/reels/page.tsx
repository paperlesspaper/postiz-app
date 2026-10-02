import Link from 'next/link';
import { internalFetch } from '@gitroom/helpers/utils/internal.fetch';
import { ReelDraft } from '@gitroom/helpers/utils/reel-handoff';
import { getT } from '@gitroom/react/translation/get.translation.service.backend';
import { redirect } from 'next/navigation';
import styles from '@gitroom/frontend/components/reels/reels.module.scss';

export default async function ReelsPage() {
  const t = await getT();
  const response = await internalFetch('/posts/reel-drafts');
  if (response.status === 401) redirect('/auth/logout');
  if (!response.ok) throw new Error('Could not load reel drafts');
  const drafts: ReelDraft[] = await response.json();
  return (
    <>
      <h1>{t('reels_title', 'Reels to take with you')}</h1>
      <p className={styles.muted}>
        {t(
          'reels_list_help',
          'Your saved Instagram drafts with one MP4 video. Open a draft on your iPhone to take the video and caption into Instagram. You publish it yourself.'
        )}
      </p>
      {!drafts.length && (
        <div className={styles.card}>
          <h2>{t('reels_empty', 'No Reel drafts yet')}</h2>
          <p>
            {t(
              'reels_empty_help',
              'In the calendar, create an Instagram post with one MP4 video and choose “Save as Draft”. It will appear here. Scheduled and published posts are not shown.'
            )}
          </p>
          <Link href="/launches" className={styles.primary}>
            {t('reels_calendar', 'Back to calendar')}
          </Link>
        </div>
      )}
      <div className={styles.grid}>
        {drafts.map((draft) => (
          <article key={draft.id} className={styles.card}>
            <div className={styles.badge}>
              {t('reels_draft', 'Postiz draft')}
            </div>
            <h2>{draft.account}</h2>
            {draft.profile && (
              <p className={styles.muted}>@{draft.profile.replace(/^@/, '')}</p>
            )}
            <p className={styles.excerpt}>
              {draft.content || t('reels_no_caption', 'No caption')}
            </p>
            <Link
              href={`/reels/${encodeURIComponent(draft.id)}`}
              className={styles.primary}
            >
              {t('reels_open', 'Open Reel')}
            </Link>
          </article>
        ))}
      </div>
    </>
  );
}
