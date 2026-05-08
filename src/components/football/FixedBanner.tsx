'use client';

import { useEffect, useRef } from 'react';

interface FixedBannerProps {
  className?: string;
}

/**
 * Fixed Banner 320x50 — renders atOptions config + invoke script.
 */
export default function FixedBanner({ className = '' }: FixedBannerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendered = useRef(false);

  useEffect(() => {
    if (rendered.current || !containerRef.current) return;
    rendered.current = true;

    // Set atOptions config
    try {
      // @ts-expect-error atOptions global
      window.atOptions = {
        key: '042b7df9520d677e37df2c78659df248',
        format: 'iframe',
        height: 50,
        width: 320,
        params: {},
      };

      // Create invoke script
      const script = document.createElement('script');
      script.src = 'https://examinerashtrayquizmaster.com/042b7df9520d677e37df2c78659df248/invoke.js';
      script.async = true;
      containerRef.current.appendChild(script);
    } catch {
      // silent
    }
  }, []);

  return (
    <div ref={containerRef} className={`w-full flex justify-center ${className}`} />
  );
}
