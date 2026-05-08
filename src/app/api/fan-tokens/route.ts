import { NextResponse } from 'next/server'

export const revalidate = 30

// CoinGecko IDs for Socios.com fan tokens
const TOKEN_IDS = [
  'paris-saint-germain-fan-token',
  'manchester-city-fan-token',
  'barcelona-fan-token',
  'juventus-fan-token',
  'atletico-madrid-fan-token',
  'ac-milan-fan-token',
  'napoli-fan-token',
  'porto-fan-token',
  'as-roma-fan-token',
  'argentine-football-association-fan-token',
  'og-fan-token',
  'trabzonspor-fan-token',
]

const TOKEN_META: Record<string, { symbol: string; team: string; league: string; logo: string; color: string }> = {
  'paris-saint-germain-fan-token': { symbol: 'PSG', team: 'Paris Saint-Germain', league: 'Ligue 1', logo: '🔵', color: '#004170' },
  'manchester-city-fan-token': { symbol: 'CITY', team: 'Manchester City', league: 'Premier League', logo: '🩵', color: '#6CABDD' },
  'barcelona-fan-token': { symbol: 'BAR', team: 'FC Barcelona', league: 'La Liga', logo: '🔴', color: '#A50044' },
  'juventus-fan-token': { symbol: 'JUV', team: 'Juventus', league: 'Serie A', logo: '⚪', color: '#000000' },
  'atletico-madrid-fan-token': { symbol: 'ATM', team: 'Atletico Madrid', league: 'La Liga', logo: '🔴', color: '#CB3524' },
  'ac-milan-fan-token': { symbol: 'ACM', team: 'AC Milan', league: 'Serie A', logo: '🔴', color: '#FB090B' },
  'napoli-fan-token': { symbol: 'NAP', team: 'SSC Napoli', league: 'Serie A', logo: '🔵', color: '#12A0D7' },
  'porto-fan-token': { symbol: 'POR', team: 'FC Porto', league: 'Primeira Liga', logo: '🔵', color: '#003893' },
  'as-roma-fan-token': { symbol: 'ASR', team: 'AS Roma', league: 'Serie A', logo: '🟡', color: '#8E1F2F' },
  'argentine-football-association-fan-token': { symbol: 'ARG', team: 'Argentina National', league: 'International', logo: '🩵', color: '#75AADB' },
  'og-fan-token': { symbol: 'OG', team: 'OG (Esports)', league: 'Esports', logo: '⚫', color: '#1C1C1C' },
  'trabzonspor-fan-token': { symbol: 'TRZ', team: 'Trabzonspor', league: 'Super Lig', logo: '🟣', color: '#7B0029' },
}

interface CoinGeckoMarket {
  id: string
  symbol: string
  name: string
  image: string
  current_price: number
  price_change_24h: number
  price_change_percentage_24h: number
  total_volume: number
  market_cap: number
  sparkline_in_7d?: { price: number[] }
}

export async function GET() {
  try {
    const ids = TOKEN_IDS.join(',')
    const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${ids}&order=market_cap_desc&sparkline=true&price_change_percentage=24h`

    const response = await fetch(url, {
      next: { revalidate: 30 },
    })

    if (!response.ok) {
      throw new Error(`CoinGecko error: ${response.status}`)
    }

    const markets: CoinGeckoMarket[] = await response.json()

    const tokens = markets.map((m) => {
      const meta = TOKEN_META[m.id] || { symbol: m.symbol.toUpperCase(), team: m.name, league: '', logo: '🪙', color: '#666' }

      return {
        symbol: meta.symbol,
        name: m.name,
        team: meta.team,
        league: meta.league,
        price: m.current_price,
        change24h: m.price_change_24h,
        changePercent24h: m.price_change_percentage_24h,
        volume24h: m.total_volume,
        marketCap: m.market_cap,
        logo: meta.logo,
        color: meta.color,
        image: m.image,
        sparkline: m.sparkline_in_7d?.price || [],
        updatedAt: new Date().toISOString(),
      }
    })

    // Add any tokens not returned by CoinGecko (delisted/new)
    const returnedIds = new Set(markets.map(m => m.id))
    const missingTokens = TOKEN_IDS.filter(id => !returnedIds.has(id)).map(id => {
      const meta = TOKEN_META[id]
      return {
        symbol: meta.symbol,
        name: `${meta.team} Fan Token`,
        team: meta.team,
        league: meta.league,
        price: 0,
        change24h: 0,
        changePercent24h: 0,
        volume24h: 0,
        marketCap: 0,
        logo: meta.logo,
        color: meta.color,
        image: '',
        sparkline: [],
        updatedAt: new Date().toISOString(),
      }
    })

    const allTokens = [...tokens, ...missingTokens].sort((a, b) => b.marketCap - a.marketCap)

    const totalMarketCap = allTokens.reduce((sum, t) => sum + t.marketCap, 0)
    const gainers = allTokens.filter(t => t.changePercent24h > 0).length
    const losers = allTokens.filter(t => t.changePercent24h < 0).length
    const topGainer = allTokens.reduce((prev, curr) =>
      curr.changePercent24h > prev.changePercent24h ? curr : prev
    )

    return NextResponse.json({
      tokens: allTokens,
      summary: {
        totalMarketCap,
        totalTokens: allTokens.length,
        gainers,
        losers,
        topGainer: {
          symbol: topGainer.symbol,
          team: topGainer.team,
          changePercent24h: topGainer.changePercent24h,
        },
      },
      source: 'coingecko',
    })
  } catch (error) {
    console.error('Error fetching fan tokens from CoinGecko:', error)
    // Fallback ke mock data
    return NextResponse.json({
      tokens: getMockTokens(),
      summary: getMockSummary(),
      source: 'mock',
      error: 'CoinGecko API unavailable, showing fallback data',
    })
  }
}

function getMockTokens() {
  return TOKEN_IDS.map(id => {
    const meta = TOKEN_META[id]
    return {
      symbol: meta.symbol,
      name: `${meta.team} Fan Token`,
      team: meta.team,
      league: meta.league,
      price: Math.round((1 + Math.random() * 5) * 1000) / 1000,
      change24h: Math.round((Math.random() - 0.5) * 0.5 * 1000) / 1000,
      changePercent24h: Math.round((Math.random() - 0.5) * 10 * 100) / 100,
      volume24h: Math.floor(Math.random() * 5000000) + 100000,
      marketCap: Math.floor(Math.random() * 50000000) + 5000000,
      logo: meta.logo,
      color: meta.color,
      image: '',
      sparkline: Array.from({ length: 168 }, () => 1 + (Math.random() - 0.5) * 0.3),
      updatedAt: new Date().toISOString(),
    }
  }).sort((a, b) => b.marketCap - a.marketCap)
}

function getMockSummary() {
  return {
    totalMarketCap: 250000000,
    totalTokens: 12,
    gainers: 7,
    losers: 5,
    topGainer: { symbol: 'PSG', team: 'Paris Saint-Germain', changePercent24h: 5.88 },
  }
}
