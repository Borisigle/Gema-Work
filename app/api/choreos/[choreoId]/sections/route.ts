import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getLoopSections, addLoopSection, deleteLoopSection } from '@/lib/sheets';

export async function GET(
  req: NextRequest,
  { params }: { params: { choreoId: string } }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const sections = await getLoopSections(params.choreoId);
  return NextResponse.json({ sections });
}

export async function POST(
  req: NextRequest,
  { params }: { params: { choreoId: string } }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { songFile, label, startSec, endSec } = await req.json();

  if (!songFile || typeof startSec !== 'number' || typeof endSec !== 'number') {
    return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
  }
  if (endSec <= startSec) {
    return NextResponse.json({ error: 'El final tiene que ser mayor al inicio' }, { status: 400 });
  }

  const trimmedLabel = (label || '').trim() || 'Sección';
  const section = await addLoopSection(params.choreoId, songFile, trimmedLabel, startSec, endSec);
  return NextResponse.json({ success: true, section });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { choreoId: string } }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { sectionId } = await req.json();
  if (!sectionId) return NextResponse.json({ error: 'Falta sectionId' }, { status: 400 });

  await deleteLoopSection(sectionId);
  return NextResponse.json({ success: true });
}
