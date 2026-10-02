'use client';
import { useT } from '@gitroom/react/translation/get.transation.service.client';
import styles from '@gitroom/frontend/components/reels/reels.module.scss';

export default function ReelError({ reset }: { reset: () => void }) {
  const t = useT();
  return (
    <div role="alert">
      <h1>{t('reels_load_error', 'Could not load Reel drafts')}</h1>
      <button className={styles.primary} onClick={reset}>
        {t('reels_retry', 'Try again')}
      </button>
    </div>
  );
}
