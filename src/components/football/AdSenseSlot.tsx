'use client';

interface AdSenseSlotProps {
  slot?: string;
  format?: 'auto' | 'rectangle' | 'horizontal' | 'vertical';
  className?: string;
}

export default function AdSenseSlot({ slot, format = 'auto', className = '' }: AdSenseSlotProps) {
  // Only render if ADSENSE_CLIENT_ID is set
  if (!process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID) {
    return null;
  }

  return (
    <div className={`ad-container relative rounded-xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-md p-3 my-4 ${className}`}>
      <span className="absolute -top-2 left-3 text-[9px] uppercase tracking-widest text-gray-400 dark:text-gray-600 bg-deep-800 px-2 font-medium select-none">
        Advertisement
      </span>
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  );
}
