'use client';

import dynamic from 'next/dynamic';

// Dynamic import avoids Radix UI hydration mismatch
// (auto-generated aria-controls IDs differ SSR vs client)
const Navbar = dynamic(() => import('@/components/football/Navbar'), {
  ssr: false,
});

export default function NavbarDynamic() {
  return <Navbar />;
}
