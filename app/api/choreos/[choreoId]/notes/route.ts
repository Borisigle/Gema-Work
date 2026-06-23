import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getNotes, saveNotes } from '@/lib/sheets';

export async function GET(
  req: NextRequest,
  { params }: { params: { choreoId: string } }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const notes = await getNotes(params.choreoId);
  return NextResponse.json({ notes });
}

export async function POST(
  req: NextRequest,
  { params }: { params: { choreoId: string } }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { content } = await req.json();
  await saveNotes(params.choreoId, content || '');
  return NextResponse.json({ success: true });
}
