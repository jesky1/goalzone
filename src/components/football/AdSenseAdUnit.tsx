'use client';

import { useEffect, useRef } from 'react';

interface AdSenseAdUnitProps {
  className?: string;
  adSlot: string;
  adFormat?: 'auto' | 'rectangle' | 'horizontal' | 'vertical' | 'fluid';
  fullWidthResponsive?: boolean;
}

/**
 * AdSense Ad Unit — renders <ins class="adsbygoogle"> + push script.
 * adsbygoogle.js is already loaded in <head> via layout.tsx.
 */
export default function AdSenseAdUnit({
  className = '',
  adSlot,
  adFormat = 'auto',
  fullWidthResponsive = true,
}: AdSenseAdUnitProps) {
  const insRef = useRef<HTMLModElement>(null);
  const pushed = useRef(false);

  useEffect(() => {
    if (pushed.current || !insRef.current) return;
    try {
      // @ts-expect-error adsbygoogle global
      const adsbygoogle = window.adsbygoogle || [];
      adsbygoogle.push({});
      pushed.current = true;
    } catch {
      // silent — ad blocker or network issue
    }
  }, []);

  return (
    <div className={`w-full flex justify-center ${className}`}>
      <ins
        ref={insRef}
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client="ca-pub-7385025232651253"
        data-ad-slot={adSlot}
        data-ad-format={adFormat}
        data-full-width-responsive={fullWidthResponsive ? 'true' : undefined}
      />
    </div>
  );
}
