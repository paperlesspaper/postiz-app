import Link from 'next/link';
import { ReactNode } from 'react';
import { Metadata } from 'next';
import { getT } from '@gitroom/react/translation/get.translation.service.backend';
import styles from '@gitroom/frontend/components/reels/reels.module.scss';

export const metadata: Metadata = {
  title: 'Postiz · Reels',
  robots: { index: false, follow: false },
};
export const dynamic = 'force-dynamic';

export default async function ReelLayout({
  children,
}: {
  children: ReactNode;
}) {
  const t = await getT();
  return (
    <main className={styles.shell}>
      <nav className={styles.nav}>
        <Link href="/reels">{t('reels_title', 'Reels to take with you')}</Link>
        <Link href="/launches">{t('reels_calendar', 'Back to calendar')}</Link>
      </nav>
      {children}
    </main>
  );
}
