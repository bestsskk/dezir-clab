import { NextResponse } from 'next/server';
import { invalidateSession, getCurrentUser } from '@/lib/session';

export async function POST() {
  try {
    await invalidateSession();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json({ error: 'Failed to logout' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
    }
    return NextResponse.json({ authenticated: true, user });
  } catch (error) {
    console.error('Auth me error:', error);
    return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
  }
}
