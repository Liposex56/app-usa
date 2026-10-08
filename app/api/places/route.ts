import { NextResponse, type NextRequest } from 'next/server';

import { searchPlaces } from '@/lib/places';

export const runtime = 'nodejs';

/** GET /api/places?q=696 broad — address suggestions for the autocomplete field. */
export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q') ?? '';
  const suggestions = await searchPlaces(q);
  return NextResponse.json({ suggestions });
}
