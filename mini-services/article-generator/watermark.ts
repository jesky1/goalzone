// ============================================================
// GOALZONE Article Generator — Watermark Module
// ============================================================
// Composites GOALZONE logo onto generated images using sharp.
// Logo placement: bottom-right corner, semi-transparent.
// Falls back to text watermark if logo file is missing.
// ============================================================

import sharp from 'sharp'
import { resolve } from 'path'
import { readFileSync } from 'fs'

// ============================================================
// Watermark Config
// ============================================================

export interface WatermarkOptions {
  /** Position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left' */
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
  /** Logo width as fraction of image width (0.05 – 0.25). Default: 0.10 */
  logoScale?: number
  /** Opacity (0.0 – 1.0). Default: 0.55 */
  opacity?: number
  /** Padding from edge in pixels. Default: 28 */
  padding?: number
}

// ============================================================
// Position → sharp Gravity mapping
// ============================================================

const GRAVITY_MAP: Record<string, sharp.Gravity> = {
  'bottom-right': 'southeast',
  'bottom-left': 'southwest',
  'top-right': 'northeast',
  'top-left': 'northwest',
}

// ============================================================
// Cached logo SVG buffer
// ============================================================

let _logoSvg: string | null = null

function loadLogoSvg(): string {
  if (_logoSvg) return _logoSvg

  try {
    const logoPath = resolve(import.meta.dirname, '../../public/logo.svg')
    _logoSvg = readFileSync(logoPath, 'utf-8')
  } catch {
    _logoSvg = null
  }

  return _logoSvg || ''
}

// ============================================================
// Build an SVG overlay with the logo rendered at a given size
// ============================================================

function buildOverlaySvg(
  logoWidth: number,
  logoHeight: number,
  padding: number,
  opacity: number
): Buffer {
  const svgW = logoWidth + padding
  const svgH = logoHeight + padding
  const logoSvg = loadLogoSvg()

  // If we have the GOALZONE logo SVG, embed it via <image>
  if (logoSvg) {
    return Buffer.from(
      `<svg width="${svgW}" height="${svgH}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <defs>
    <filter id="wm-shadow">
      <feDropShadow dx="0" dy="1" stdDeviation="2" flood-color="#000" flood-opacity="0.4"/>
    </filter>
  </defs>
  <g opacity="${opacity}" filter="url(#wm-shadow)">
    <image href="data:image/svg+xml;base64,${Buffer.from(logoSvg).toString('base64')}"
           x="0" y="0" width="${logoWidth}" height="${logoHeight}" />
  </g>
</svg>`
    )
  }

  // Fallback: text-based GOALZONE watermark badge
  return Buffer.from(
    `<svg width="${svgW}" height="${svgH}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="wm-bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="rgba(0,0,0,0.55)"/>
      <stop offset="100%" stop-color="rgba(0,0,0,0.35)"/>
    </linearGradient>
    <filter id="wm-shadow">
      <feDropShadow dx="0" dy="1" stdDeviation="2" flood-color="#000" flood-opacity="0.5"/>
    </filter>
  </defs>
  <g filter="url(#wm-shadow)">
    <rect x="4" y="4" width="${logoWidth - 8}" height="${logoHeight - 8}" rx="8" ry="8" fill="url(#wm-bg)"/>
    <text x="${logoWidth / 2}" y="${logoHeight / 2 + 6}"
          font-family="Arial, Helvetica, sans-serif" font-weight="900"
          font-size="${Math.round(logoHeight * 0.38)}"
          fill="white" text-anchor="middle" dominant-baseline="middle"
          opacity="${opacity}">GOALZONE</text>
  </g>
</svg>`
  )
}

// ============================================================
// Main: Apply Watermark
// ============================================================

/**
 * Stamps the GOALZONE logo (or fallback text) onto an image buffer.
 *
 * @param imageBuffer  Raw image buffer (PNG / JPEG)
 * @param options      Positioning & appearance options
 * @returns            New PNG buffer with the watermark composited
 */
export async function applyWatermark(
  imageBuffer: Buffer,
  options: WatermarkOptions = {}
): Promise<Buffer> {
  const {
    position = 'bottom-right',
    logoScale = 0.10,
    opacity = 0.55,
    padding = 28,
  } = options

  // 1. Read original dimensions
  const pipeline = sharp(imageBuffer)
  const { width = 1344, height = 768 } = await pipeline.metadata()

  // 2. Calculate logo size (keep aspect ratio)
  const logoWidth = Math.round(width * logoScale)
  const logoHeight = logoWidth  // GOALZONE logo is square

  // 3. Build the SVG overlay
  const overlaySvg = buildOverlaySvg(logoWidth, logoHeight, padding, opacity)
  const gravity = GRAVITY_MAP[position] || GRAVITY_MAP['bottom-right']

  // 4. Composite
  const watermarked = await pipeline
    .composite([
      {
        input: overlaySvg,
        gravity,
        blend: 'over' as const,
      },
    ])
    .png({ compressionLevel: 9 })
    .toBuffer()

  return watermarked
}
