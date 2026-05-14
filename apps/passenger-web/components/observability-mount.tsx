'use client';

import * as React from 'react';
import { reportWebVitals } from '@wasalni/pwa/web-vitals';

/**
 * Mount this once near the root of the client tree to start streaming
 * web-vitals to /api/metrics. Renders nothing.
 */
export function ObservabilityMount(): null {
  React.useEffect(() => {
    void reportWebVitals('passenger-web');
  }, []);
  return null;
}
