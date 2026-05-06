import { NextResponse } from 'next/server'

export const revalidate = 30

interface FanToken {
  symbol: string
  name: string
  team: string
  league: string
  price: number
  change24h: number
  changePercent24h: number
  volume24h: number
  marketCap: number
  logo: string
  color: string
}

const fanTokens: FanToken[] = [
  {
    symbol: 'PSG',
    name: 'Paris Saint-Germain Fan Token',
    team: 'Paris Saint-Germain',
    league: 'Ligue 1',
    price: 2.847,
    change24h: 0.124,
    changePercent24h: 4.56,
    volume24h: 1284560,
    marketCap: 28470000,
    logo: '🔵',
    color: '#004170',
  },
  {
    symbol: 'CITY',
    name: 'Manchester City Fan Token',
    team: 'Manchester City',
    league: 'Premier League',
    price: 3.215,
    change24h: -0.089,
    changePercent24h: -2.69,
    volume24h: 2156800,
    marketCap: 32150000,
    logo: '🩵',
    color: '#6CABDD',
  },
  {
    symbol: 'BAR',
    name: 'FC Barcelona Fan Token',
    team: 'FC Barcelona',
    league: 'La Liga',
    price: 1.932,
    change24h: 0.056,
    changePercent24h: 2.98,
    volume24h: 3542100,
    marketCap: 19320000,
    logo: '🔴',
    color: '#A50044',
  },
  {
    symbol: 'JUV',
    name: 'Juventus Fan Token',
    team: 'Juventus',
    league: 'Serie A',
    price: 4.128,
    change24h: -0.234,
    changePercent24h: -5.36,
    volume24h: 892340,
    marketCap: 41280000,
    logo: '⚪',
    color: '#000000',
  },
  {
    symbol: 'ATM',
    name: 'Atletico Madrid Fan Token',
    team: 'Atletico Madrid',
    league: 'La Liga',
    price: 1.456,
    change24h: 0.078,
    changePercent24h: 5.66,
    volume24h: 678900,
    marketCap: 14560000,
    logo: '🔴',
    color: '#CB3524',
  },
  {
    symbol: 'ACM',
    name: 'AC Milan Fan Token',
    team: 'AC Milan',
    league: 'Serie A',
    price: 0.987,
    change24h: 0.012,
    changePercent24h: 1.23,
    volume24h: 543200,
    marketCap: 9870000,
    logo: '🔴',
    color: '#FB090B',
  },
  {
    symbol: 'NAP',
    name: 'SSC Napoli Fan Token',
    team: 'SSC Napoli',
    league: 'Serie A',
    price: 1.678,
    change24h: -0.045,
    changePercent24h: -2.61,
    volume24h: 432100,
    marketCap: 16780000,
    logo: '🔵',
    color: '#12A0D7',
  },
  {
    symbol: 'POR',
    name: 'FC Porto Fan Token',
    team: 'FC Porto',
    league: 'Primeira Liga',
    price: 0.834,
    change24h: 0.023,
    changePercent24h: 2.84,
    volume24h: 234500,
    marketCap: 8340000,
    logo: '🔵',
    color: '#003893',
  },
  {
    symbol: 'ASR',
    name: 'AS Roma Fan Token',
    team: 'AS Roma',
    league: 'Serie A',
    price: 1.124,
    change24h: -0.032,
    changePercent24h: -2.76,
    volume24h: 345600,
    marketCap: 11240000,
    logo: '🟡',
    color: '#8E1F2F',
  },
  {
    symbol: 'ARG',
    name: 'Argentine FA Fan Token',
    team: 'Argentina National',
    league: 'International',
    price: 3.567,
    change24h: 0.198,
    changePercent24h: 5.88,
    volume24h: 4567800,
    marketCap: 35670000,
    logo: '🩵',
    color: '#75AADB',
  },
  {
    symbol: 'OG',
    name: 'OG Fan Token',
    team: 'OG (Esports)',
    league: 'Esports',
    price: 5.432,
    change24h: 0.321,
    changePercent24h: 6.28,
    volume24h: 1876500,
    marketCap: 54320000,
    logo: '⚫',
    color: '#1C1C1C',
  },
  {
    symbol: 'TRZ',
    name: 'Trabzonspor Fan Token',
    team: 'Trabzonspor',
    league: 'Super Lig',
    price: 0.412,
    change24h: -0.018,
    changePercent24h: -4.19,
    volume24h: 123400,
    marketCap: 4120000,
    logo: '🟣',
    color: '#7B0029',
  },
]

export async function GET() {
  try {
    // Add slight random fluctuation to simulate live prices
    const liveTokens = fanTokens.map((token) => {
      const fluctuation = 1 + (Math.random() - 0.5) * 0.004 // +/- 0.2%
      const newPrice = token.price * fluctuation
      const priceChange = newPrice - token.price + token.change24h
      const newPercent = token.changePercent24h + (Math.random() - 0.5) * 0.1

      return {
        ...token,
        price: Math.round(newPrice * 1000) / 1000,
        change24h: Math.round(priceChange * 1000) / 1000,
        changePercent24h: Math.round(newPercent * 100) / 100,
        volume24h: token.volume24h + Math.floor(Math.random() * 10000),
        updatedAt: new Date().toISOString(),
      }
    })

    // Sort by market cap descending
    liveTokens.sort((a, b) => b.marketCap - a.marketCap)

    // Calculate summary stats
    const totalMarketCap = liveTokens.reduce((sum, t) => sum + t.marketCap, 0)
    const gainers = liveTokens.filter((t) => t.changePercent24h > 0).length
    const losers = liveTokens.filter((t) => t.changePercent24h < 0).length
    const topGainer = liveTokens.reduce((prev, curr) =>
      curr.changePercent24h > prev.changePercent24h ? curr : prev
    )

    return NextResponse.json({
      tokens: liveTokens,
      summary: {
        totalMarketCap,
        totalTokens: liveTokens.length,
        gainers,
        losers,
        topGainer: {
          symbol: topGainer.symbol,
          team: topGainer.team,
          changePercent24h: topGainer.changePercent24h,
        },
      },
    })
  } catch (error) {
    console.error('Error fetching fan tokens:', error)
    return NextResponse.json(
      { error: 'Failed to fetch fan tokens' },
      { status: 500 }
    )
  }
}
