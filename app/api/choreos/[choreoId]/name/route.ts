import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getChoreoNameOverride, saveChoreoName } from '@/lib/sheets';

export async function GET(
  req: NextRequest,
  { params }: { params: { choreoId: string } }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const name = await getChoreoNameOverride(params.choreoId);
  return NextResponse.json({ name });
}

export async function POST(
  req: NextRequest,
  { params }: { params: { choreoId: string } }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { name } = await req.json();
  const trimmed = (name || '').trim();

  if (!trimmed) {
    return NextResponse.json({ error: 'El nombre no puede estar vacío' }, { status: 400 });
  }

  await saveChoreoName(params.choreoId, trimmed);
  return NextResponse.json({ success: true, name: trimmed });
}
