import React from 'react';
import { render, act } from '@testing-library/react';
import { normalizeReturnUrl } from '../../libraries/helpers/src/utils/return-url';
import ReturnUrlComponent, {
  useReturnUrl,
} from '../../apps/frontend/src/app/(app)/auth/return.url.component';

let mockReturnUrl: string | null;
jest.mock('next/navigation', () => ({
  useSearchParams: () =>
    new URLSearchParams(
      mockReturnUrl === null ? '' : { returnUrl: mockReturnUrl }
    ),
}));

const origin = 'https://postiz.paperlesspaper.de';
const reel = '/reels/cmur9w1w30000p87y85ukqq4h';

it.each([reel, origin + reel, 'http://localhost:4200' + reel])(
  'keeps the Reel destination on the public origin: %s',
  (url) => {
    expect(normalizeReturnUrl(url, origin)).toBe(reel);
  }
);

it('preserves the query and fragment of a same-origin return URL', () => {
  expect(
    normalizeReturnUrl(origin + '/p/123?view=comments#latest', origin)
  ).toBe('/p/123?view=comments#latest');
});

it.each([
  '//evil.example/reels/1',
  'https://evil.example/reels/1',
  'https://postiz.paperlesspaper.de//evil.example/reels/1',
  '/\\evil.example',
  'javascript:alert(1)',
  '/\nevil.example',
  'http://localhost:4200/admin',
  'https://user:pass@postiz.paperlesspaper.de/reels/1',
])('rejects an unsafe return destination: %s', (url) => {
  expect(normalizeReturnUrl(url, origin)).toBeUndefined();
});

it('stores a relative Reel destination and consumes it after login', () => {
  mockReturnUrl = reel;
  let consume: () => string | undefined;
  function Reader() {
    consume = useReturnUrl().getAndClear;
    return null;
  }
  render(
    <>
      <ReturnUrlComponent />
      <Reader />
    </>
  );
  expect(localStorage.getItem('returnUrl')).toBe(reel);
  let target: string | undefined;
  act(() => {
    target = consume();
  });
  expect(target).toBe(reel);
  expect(localStorage.getItem('returnUrl')).toBeNull();
});

it('repairs a localhost destination saved before the fix', () => {
  localStorage.setItem('returnUrl', 'http://localhost:4200' + reel);
  let consume: () => string | undefined;
  function Reader() {
    consume = useReturnUrl().getAndClear;
    return null;
  }
  render(<Reader />);
  expect(consume()).toBe(reel);
  expect(localStorage.getItem('returnUrl')).toBeNull();
});
