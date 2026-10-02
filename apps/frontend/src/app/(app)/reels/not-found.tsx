import Link from 'next/link';
import { getT } from '@gitroom/react/translation/get.translation.service.backend';

export default async function ReelNotFound() {
  const t = await getT();
  return (
    <div>
      <h1>{t('reels_not_found', 'Reel draft unavailable')}</h1>
      <p>
        {t(
          'reels_not_found_help',
          'This draft may have been changed, scheduled or deleted. Check that you are signed in to the correct Postiz workspace.'
        )}
      </p>
      <Link href="/reels">{t('reels_title', 'Reels to take with you')}</Link>
    </div>
  );
}
