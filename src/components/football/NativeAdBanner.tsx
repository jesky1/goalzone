'use client';

interface NativeAdBannerProps {
  className?: string;
  slotId?: string;
}

/**
 * Native Banner Ad — renders the ad container div.
 * The invoke.js script is loaded once in layout.tsx.
 * Place multiple instances anywhere in the page body.
 */
export default function NativeAdBanner({ className = '', slotId }: NativeAdBannerProps) {
  const containerId = slotId || 'container-9dcad91cc102d4dd03f2699b87d5a189';

  return (
    <div className={`w-full flex justify-center ${className}`}>
      <div id={containerId} className="w-full max-w-4xl min-h-[90px]" />
    </div>
  );
}
