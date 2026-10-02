import React from 'react';
import {
  fireEvent,
  render,
  screen,
  waitFor,
  cleanup,
} from '@testing-library/react';
import { ReelHandoff } from '../../apps/frontend/src/components/reels/reel-handoff';
import { prepareReelFile } from '../../apps/frontend/src/components/reels/share-video';
import {
  toReelDraft,
  safeReelMediaUrl,
  ReelDraftRecord,
} from '../../libraries/helpers/src/utils/reel-handoff';

jest.mock('@gitroom/react/translation/get.transation.service.client', () => ({
  useT: () => (_: string, value: string) => value,
}));
jest.mock('../../apps/frontend/src/components/reels/share-video', () => ({
  prepareReelFile: jest.fn(),
}));
jest.mock('qrcode', () => ({
  toDataURL: jest.fn().mockResolvedValue('data:image/png;base64,AA=='),
}));
const record: ReelDraftRecord = {
  id: 'draft-1',
  state: 'DRAFT',
  content: 'OpenPaper & Dresden\n#OpenSource',
  image: JSON.stringify([
    {
      path: 'https://postiz.example/uploads/reel.mp4?version=1',
      thumbnail: 'https://postiz.example/cover.jpg',
    },
  ]),
  settings: JSON.stringify({ post_type: 'post' }),
  integration: {
    providerIdentifier: 'instagram-standalone',
    name: 'paperlesspaper',
    profile: 'paperless.paper',
  },
};

describe('eligible Reel drafts', () => {
  it('exports only the selected public display fields', () => {
    const draft = toReelDraft({
      ...record,
      secret: 'never-export',
      integration: { ...record.integration, token: 'secret' },
    } as any);
    expect(draft).toEqual({
      id: record.id,
      content: record.content,
      video: 'https://postiz.example/uploads/reel.mp4?version=1',
      cover: 'https://postiz.example/cover.jpg',
      account: 'paperlesspaper',
      profile: 'paperless.paper',
    });
  });
  it.each(['QUEUE', 'PUBLISHED', 'ERROR'])(
    'excludes %s posts to prevent duplicate publication',
    (state) => expect(toReelDraft({ ...record, state })).toBeUndefined()
  );
  it.each([
    '{bad',
    'null',
    '{}',
    '[]',
    '[{"path":"https://postiz.example/photo.jpg"}]',
    '[{},{}]',
  ])('rejects unsuitable media: %s', (image) =>
    expect(toReelDraft({ ...record, image })).toBeUndefined()
  );
  it('excludes stories and other platforms', () => {
    expect(
      toReelDraft({ ...record, settings: '{"post_type":"story"}' })
    ).toBeUndefined();
    expect(
      toReelDraft({
        ...record,
        integration: { ...record.integration, providerIdentifier: 'tiktok' },
      })
    ).toBeUndefined();
  });
  it.each([
    'javascript:alert(1)',
    '//evil.example/video.mp4',
    '/\\evil.example/file.mp4',
    'https://user:secret@example.com/a.mp4',
    'data:video/mp4;base64,eA==',
  ])('rejects unsafe media URL %s', (url) =>
    expect(safeReelMediaUrl(url)).toBeUndefined()
  );
});

describe('iPhone handoff', () => {
  const share = jest.fn();
  const writeText = jest.fn();
  beforeEach(() => {
    jest.clearAllMocks();
    Object.defineProperty(navigator, 'share', {
      value: share,
      configurable: true,
    });
    Object.defineProperty(navigator, 'canShare', {
      value: () => true,
      configurable: true,
    });
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    });
    URL.createObjectURL = jest.fn(() => 'blob:reel');
    URL.revokeObjectURL = jest.fn();
    (prepareReelFile as jest.Mock).mockResolvedValue(
      new File(['video'], 'reel.mp4', { type: 'video/mp4' })
    );
    share.mockResolvedValue(undefined);
    writeText.mockResolvedValue(undefined);
  });
  afterEach(cleanup);
  it('prepares first, then shares only on a fresh click and never auto-publishes', async () => {
    render(<ReelHandoff draft={toReelDraft(record)!} />);
    fireEvent.click(screen.getByText('Prepare video for sharing'));
    await screen.findByText('Share or save video');
    expect(share).not.toHaveBeenCalled();
    fireEvent.click(screen.getByText('Share or save video'));
    expect(share).toHaveBeenCalledTimes(1);
    expect(Object.keys(share.mock.calls[0][0])).toEqual(['files']);
    await screen.findByText(/does not confirm publication/);
    expect(
      screen.getByText(/Your Postiz draft remains unchanged/)
    ).toBeTruthy();
  });
  it('copies the complete caption separately, with line breaks', async () => {
    render(<ReelHandoff draft={toReelDraft(record)!} />);
    fireEvent.click(screen.getByText('Copy caption'));
    await screen.findByText('Copied.');
    expect(writeText).toHaveBeenCalledWith(record.content);
  });
  it('keeps downloads available when file sharing is unsupported', async () => {
    Object.defineProperty(navigator, 'canShare', {
      value: undefined,
      configurable: true,
    });
    render(<ReelHandoff draft={toReelDraft(record)!} />);
    fireEvent.click(screen.getByText('Prepare video for sharing'));
    await screen.findByText('Download video');
    expect(screen.queryByText('Share or save video')).toBeNull();
    expect(screen.getByText('Open original video')).toBeTruthy();
  });
  it('does not report success when the share sheet is cancelled', async () => {
    share.mockRejectedValue(new DOMException('Cancelled', 'AbortError'));
    render(<ReelHandoff draft={toReelDraft(record)!} />);
    fireEvent.click(screen.getByText('Prepare video for sharing'));
    await screen.findByText('Share or save video');
    fireEvent.click(screen.getByText('Share or save video'));
    await waitFor(() =>
      expect(
        (screen.getByText('Share or save video') as HTMLButtonElement).disabled
      ).toBe(false)
    );
    expect(screen.queryByText(/Sharing finished/)).toBeNull();
    expect(screen.queryByRole('alert')).toBeNull();
  });
  it('offers a fallback after network failure', async () => {
    (prepareReelFile as jest.Mock).mockRejectedValue(new Error('download'));
    render(<ReelHandoff draft={toReelDraft(record)!} />);
    fireEvent.click(screen.getByText('Prepare video for sharing'));
    await screen.findByRole('alert');
    expect(screen.getByText('Open original video')).toBeTruthy();
    expect(share).not.toHaveBeenCalled();
  });
});
