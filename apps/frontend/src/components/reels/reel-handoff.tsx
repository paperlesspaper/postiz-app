'use client';

import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { ReelDraft } from '@gitroom/helpers/utils/reel-handoff';
import { useT } from '@gitroom/react/translation/get.transation.service.client';
import { prepareReelFile } from './share-video';
import styles from './reels.module.scss';

export function ReelHandoff({ draft }: { draft: ReelDraft }) {
  const t = useT();
  const [file, setFile] = useState<File>();
  const [downloadUrl, setDownloadUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [progress, setProgress] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [link, setLink] = useState('');
  const [qr, setQr] = useState('');
  const controller = useRef<AbortController | undefined>(undefined);
  const caption = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const url = window.location.origin + window.location.pathname;
    setLink(url);
    let active = true;
    QRCode.toDataURL(url, { width: 220, margin: 3 })
      .then((image) => {
        if (active) setQr(image);
      })
      .catch(() => {});
    return () => {
      active = false;
      controller.current?.abort();
    };
  }, []);

  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setDownloadUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  async function copy(value: string, isCaption = false) {
    try {
      await navigator.clipboard.writeText(value);
      setStatus(t('reels_copied', 'Copied.'));
      setError('');
    } catch {
      if (isCaption) {
        caption.current?.focus();
        caption.current?.select();
      }
      setError(
        t('reels_copy_failed', 'Please select the text and copy it manually.')
      );
    }
  }

  async function prepare() {
    setLoading(true);
    setError('');
    setStatus('');
    controller.current = new AbortController();
    try {
      setFile(
        await prepareReelFile(
          draft.video,
          `reel-${draft.id}.mp4`,
          controller.current.signal,
          (bytes, total) => {
            setProgress(
              total
                ? `${Math.round((bytes / total) * 100)}%`
                : `${Math.round(bytes / 1024 / 1024)} MB`
            );
          }
        )
      );
    } catch (e) {
      if ((e as Error).name !== 'AbortError') {
        setError(
          t(
            'reels_prepare_failed',
            'The video could not be prepared for sharing. Open the original video below and save it from there.'
          )
        );
      }
    } finally {
      setLoading(false);
      setProgress('');
    }
  }

  async function share() {
    if (!file || sharing) return;
    setError('');
    setStatus('');
    setSharing(true);
    try {
      // No awaited download or clipboard operation before this call.
      // Instagram often ignores shared text, so caption copying is separate.
      await navigator.share({ files: [file] });
      setStatus(
        t(
          'reels_shared',
          'Sharing finished. Continue in Instagram; this does not confirm publication.'
        )
      );
    } catch (e) {
      if ((e as Error).name !== 'AbortError') {
        setError(
          t(
            'reels_share_failed',
            'Sharing did not work. Download or open the video and save it to Photos.'
          )
        );
      }
    } finally {
      setSharing(false);
    }
  }

  const canShare =
    !!file &&
    typeof navigator !== 'undefined' &&
    !!navigator.canShare?.({ files: [file] });
  return (
    <div className={styles.detail}>
      <div className={styles.preview}>
        <video
          src={draft.video}
          poster={draft.cover}
          controls
          playsInline
          preload="metadata"
          aria-label={t('reels_video', 'Reel video')}
        />
        {draft.cover && (
          <a
            href={draft.cover}
            target="_blank"
            rel="noreferrer"
            className={styles.secondary}
          >
            {t('reels_cover', 'Open cover image')}
          </a>
        )}
      </div>
      <div className={styles.steps}>
        <div className={styles.badge}>{t('reels_draft', 'Postiz draft')}</div>
        <h1>{t('reels_handoff', 'Post this Reel yourself')}</h1>
        <p>
          {draft.account}
          {draft.profile ? ` · @${draft.profile.replace(/^@/, '')}` : ''}
        </p>
        <p className={styles.muted}>
          {t(
            'reels_intro',
            'Copy the caption, save the video to your iPhone and finish your Reel in Instagram. You choose when to post. Nothing is published here.'
          )}
        </p>
        <section>
          <h2>{t('reels_step_caption', '1. Copy the caption')}</h2>
          <textarea
            ref={caption}
            value={draft.content}
            readOnly
            rows={5}
            aria-label={t('reels_caption', 'Post caption')}
          />
          <button
            className={styles.secondary}
            onClick={() => copy(draft.content, true)}
          >
            {t('reels_copy_caption', 'Copy caption')}
          </button>
        </section>
        <section>
          <h2>{t('reels_step_video', '2. Take the video with you')}</h2>
          {!file && (
            <button
              className={styles.primary}
              onClick={prepare}
              disabled={loading}
            >
              {loading
                ? `${t('reels_loading', 'Loading video…')} ${progress}`
                : t('reels_prepare', 'Prepare video for sharing')}
            </button>
          )}
          {loading && (
            <button
              className={styles.secondary}
              onClick={() => controller.current?.abort()}
            >
              {t('reels_cancel', 'Cancel')}
            </button>
          )}
          {canShare && (
            <button
              className={styles.primary}
              onClick={share}
              disabled={sharing}
            >
              {t('reels_share', 'Share or save video')}
            </button>
          )}
          {downloadUrl && (
            <a
              className={styles.secondary}
              href={downloadUrl}
              download={`reel-${draft.id}.mp4`}
            >
              {t('reels_download', 'Download video')}
            </a>
          )}
          <a
            className={styles.textLink}
            href={draft.video}
            target="_blank"
            rel="noreferrer"
          >
            {t('reels_original', 'Open original video')}
          </a>
          <p className={styles.muted}>
            {t(
              'reels_save_help',
              'On iPhone, choose “Save Video” in the share sheet. If Instagram is offered, you can also try sharing directly. Otherwise create a Reel in Instagram from Photos.'
            )}
          </p>
        </section>
        <section>
          <h2>{t('reels_step_instagram', '3. Finish in Instagram')}</h2>
          <p>
            {t(
              'reels_finish_help',
              'Select the right Instagram account, add subtitles, music or stickers, and paste your caption. You can then save a draft in Instagram or publish it yourself.'
            )}
          </p>
          <a
            className={styles.secondary}
            href="https://www.instagram.com/"
            target="_blank"
            rel="noreferrer"
          >
            {t('reels_open_instagram', 'Open Instagram')}
          </a>
          <p className={styles.muted}>
            {t(
              'reels_draft_help',
              'Your Postiz draft remains unchanged. Sharing does not create or sync an Instagram draft.'
            )}
          </p>
        </section>
        <p role="status" aria-live="polite">
          {status}
        </p>
        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}
        <details className={styles.transfer} open>
          <summary>
            {t('reels_phone_link', 'Open this draft on your iPhone')}
          </summary>
          <p className={styles.muted}>
            {t(
              'reels_link_help',
              'Open this link in Safari on your iPhone and sign in to the same Postiz workspace.'
            )}
          </p>
          {qr && (
            <img
              src={qr}
              width={220}
              height={220}
              alt={t('reels_qr', 'Scan to open this draft on your phone')}
              className={styles.qr}
            />
          )}
          <input
            value={link}
            readOnly
            aria-label={t('reels_link', 'Draft link')}
            onFocus={(event) => event.target.select()}
          />
          <button className={styles.secondary} onClick={() => copy(link)}>
            {t('reels_copy_link', 'Copy link')}
          </button>
        </details>
      </div>
    </div>
  );
}
