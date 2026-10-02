'use client';

import { useSearchParams } from 'next/navigation';
import { FC, useCallback, useEffect } from 'react';
import { normalizeReturnUrl } from '@gitroom/helpers/utils/return-url';
const ReturnUrlComponent: FC = () => {
  const params = useSearchParams();
  const url = params.get('returnUrl');
  useEffect(() => {
    if (url !== null) {
      const target = normalizeReturnUrl(url, window.location.origin);
      if (target) localStorage.setItem('returnUrl', target);
      else localStorage.removeItem('returnUrl');
    }
  }, [url]);
  return null;
};
export const useReturnUrl = () => {
  return {
    getAndClear: useCallback(() => {
      const data = localStorage.getItem('returnUrl');
      localStorage.removeItem('returnUrl');
      return normalizeReturnUrl(data, window.location.origin);
    }, []),
  };
};
export default ReturnUrlComponent;
