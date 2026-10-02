import {
  prepareReelFile,
  MAX_SHARE_BYTES,
} from '../../apps/frontend/src/components/reels/share-video';

const originalFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = originalFetch;
});

it('preserves the complete file, reports progress and sets the MP4 MIME type', async () => {
  const source = new Uint8Array([0, 1, 2, 3, 4, 5]);
  globalThis.fetch = jest
    .fn()
    .mockResolvedValue(
      new Response(source, {
        headers: { 'content-type': 'video/mp4', 'content-length': '6' },
      })
    );
  const progress = jest.fn();
  const file = await prepareReelFile(
    '/uploads/reel.mp4',
    'reel.mp4',
    new AbortController().signal,
    progress
  );
  expect(Array.from(new Uint8Array(await file.arrayBuffer()))).toEqual(
    Array.from(source)
  );
  expect(file.type).toBe('video/mp4');
  expect(progress).toHaveBeenLastCalledWith(6, 6);
});

it.each([
  [404, 'video/mp4', '4', 'oops'],
  [200, 'text/html', '4', 'oops'],
  [200, 'video/mp4', '0', ''],
  [200, 'video/mp4', String(MAX_SHARE_BYTES + 1), 'large'],
])(
  'rejects invalid media response %s %s',
  async (status, type, length, body) => {
    globalThis.fetch = jest
      .fn()
      .mockResolvedValue(
        new Response(body as string, {
          status: status as number,
          headers: {
            'content-type': type as string,
            'content-length': length as string,
          },
        })
      );
    await expect(
      prepareReelFile(
        '/uploads/reel.mp4',
        'reel.mp4',
        new AbortController().signal,
        jest.fn()
      )
    ).rejects.toThrow();
  }
);
