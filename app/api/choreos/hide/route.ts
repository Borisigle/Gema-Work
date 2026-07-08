import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { hideChoreo, unhideChoreo, getHiddenChoreos } from '@/lib/sheets';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const hidden = await getHiddenChoreos();
  return NextResponse.json({ hidden });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { choreoId } = await req.json();
  if (!choreoId) return NextResponse.json({ error: 'Falta choreoId' }, { status: 400 });

  await hideChoreo(choreoId);
  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { choreoId } = await req.json();
  if (!choreoId) return NextResponse.json({ error: 'Falta choreoId' }, { status: 400 });

  await unhideChoreo(choreoId);
  return NextResponse.json({ success: true });
}
