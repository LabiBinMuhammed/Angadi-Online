import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({ loyalty: { starsCount: 0, scratchCardsUnlocked: 0, totalCreditEarned: 0 } })
}

export async function POST() {
  return NextResponse.json({ success: false })
}
