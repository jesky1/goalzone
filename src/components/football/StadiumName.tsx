'use client'

import { MapPin, ExternalLink } from 'lucide-react'
import { motion } from 'framer-motion'

interface StadiumNameProps {
  /** Stadium name (e.g. "Emirates Stadium") */
  name: string
  /** City name for more accurate Google Maps search (optional) */
  city?: string
  /** Additional text size class — defaults to text-[11px] to match match info */
  className?: string
}

/**
 * StadiumName — clickable stadium label that opens Google Maps in a new tab.
 *
 * Props
 * - name   : stadium name  (required)
 * - city   : helps Google Maps pinpoint the right venue (optional)
 * - className : extra tailwind classes
 */
export default function StadiumName({ name, city, className = '' }: StadiumNameProps) {
  // Build a Google Maps search query from stadium name + city
  const query = city ? `${name}, ${city}` : name
  const mapsUrl = `https://www.google.com/maps/search/${encodeURIComponent(query)}`

  return (
    <motion.a
      href={mapsUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-1 group/stadium cursor-pointer transition-colors hover:text-neon ${className}`}
      title={`Lihat ${name} di Google Maps`}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
    >
      {/* Location pin icon */}
      <MapPin className="w-3 h-3 shrink-0 text-gray-400 dark:text-gray-500 group-hover/stadium:text-neon transition-colors" />

      {/* Stadium name */}
      <span className="underline underline-offset-2 decoration-dotted decoration-gray-400 dark:decoration-gray-500 group-hover/stadium:decoration-neon transition-colors">
        {name}
      </span>

      {/* External-link arrow — only visible on hover */}
      <ExternalLink className="w-2.5 h-2.5 shrink-0 text-gray-400 dark:text-gray-500 opacity-0 group-hover/stadium:opacity-100 group-hover/stadium:text-neon transition-all" />
    </motion.a>
  )
}
