// ============================================================
// GOALZONE Article Generator — Step 3: AI Image Artist
// ============================================================
// Generates cinematic match highlight images
// Uses z-ai-web-dev-sdk (backend only)
// ============================================================

import ZAI from 'z-ai-web-dev-sdk'
import type { MatchDetail } from './fetcher.js'

// ============================================================
// Types
// ============================================================

export interface ImageResult {
  success: boolean
  base64?: string
  buffer?: Buffer
  prompt: string
  error?: string
}

// ============================================================
// Build Image Prompt
// ============================================================

function buildImagePrompt(match: MatchDetail): string {
  // Determine key narrative
  const winner = match.homeWinner
    ? match.homeTeam
    : match.awayWinner
    ? match.awayTeam
    : null

  // Find last goalscorer
  const allScorers = [...match.homeScorers, ...match.awayScorers]
    .sort((a, b) => b.minute - a.minute)

  const lastScorer = allScorers[0]
  const winnerTeam = winner || (allScorers.length > 0 ? allScorers[allScorers.length - 1].player : match.homeTeam)

  const stadium = match.venue || 'stadion sepak bola besar'
  const isDraw = match.isDraw

  if (isDraw) {
    return `Dramatic football match scene at ${stadium}, ${match.homeTeam} vs ${match.awayTeam}. Intense atmosphere with packed stadium under floodlights, two rival football teams competing fiercely on a lush green pitch. Cinematic sports photography, ultra-realistic 8K, high-detail, dramatic lighting, golden hour atmosphere, professional sports photography style. No text, no logos, no watermark.`
  }

  // Winning celebration scene
  const scorerName = lastScorer
    ? `${lastScorer.player} dari ${lastScorer.team === 'home' ? match.homeTeam : match.awayTeam}`
    : `pemain ${winnerTeam}`

  return `Epic football celebration moment at ${stadium}. ${scorerName} scoring the winning goal, pure elation and joy, teammates rushing to celebrate under brilliant stadium floodlights. Packed crowd roaring in the background, confetti-like atmosphere. ${match.homeTeam} vs ${match.awayTeam} final score ${match.homeScore}-${match.awayScore}. Cinematic sports photography, ultra-realistic 8K, high-detail, dramatic lighting with golden rim light, professional sports photography style, shallow depth of field. No text, no logos, no watermark.`
}

// ============================================================
// Generate Match Image
// ============================================================

export async function generateMatchImage(match: MatchDetail): Promise<ImageResult> {
  const prompt = buildImagePrompt(match)

  try {
    const zai = await ZAI.create()

    // Use landscape size for article cover (1344x768)
    const response = await zai.images.generations.create({
      prompt,
      size: '1344x768',
    })

    const base64 = response.data?.[0]?.base64

    if (!base64) {
      throw new Error('No image data returned from API')
    }

    const buffer = Buffer.from(base64, 'base64')

    return {
      success: true,
      base64,
      buffer,
      prompt,
    }
  } catch (err: any) {
    console.error(`   Image generation failed: ${err.message}`)
    return {
      success: false,
      prompt,
      error: err.message,
    }
  }
}

// ============================================================
// Upload Image to Supabase Storage
// ============================================================

import { config } from './config.js'
import { createClient } from '@supabase/supabase-js'

export async function uploadImageToSupabase(
  buffer: Buffer,
  slug: string
): Promise<{ url: string; path: string }> {
  const supabase = createClient(
    config.supabaseUrl,
    config.supabaseServiceKey,
    { auth: { persistSession: false, autoRefreshToken: false } }
  )

  // Generate storage path
  const timestamp = Date.now()
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')

  const fileName = `${timestamp}-${slug}.png`
  const filePath = `articles/${year}/${month}/${fileName}`

  // Upload buffer to Supabase Storage
  const { data, error } = await supabase.storage
    .from('news-images')
    .upload(filePath, buffer, {
      contentType: 'image/png',
      cacheControl: '31536000', // 1 year
      upsert: false,
    })

  if (error) {
    throw new Error(`Storage upload failed: ${error.message}`)
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from('news-images')
    .getPublicUrl(data.path)

  return {
    url: urlData.publicUrl,
    path: data.path,
  }
}
