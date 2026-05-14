'use client';

import * as React from 'react';
import { reportWebVitals } from '@wasalni/pwa/web-vitals';

export function ObservabilityMount(): null {
  React.useEffect(() => {
    void reportWebVitals('driver-web');
  }, []);
  return null;
}
