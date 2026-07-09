import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getCustomChoreosByGroup, addCustomChoreo, deleteCustomChoreo } from '@/lib/sheets';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const groupId = req.nextUrl.searchParams.get('groupId');
  if (!groupId) return NextResponse.json({ error: 'Falta groupId' }, { status: 400 });

  const choreos = await getCustomChoreosByGroup(groupId);
  return NextResponse.json({ choreos });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  try {
    const { groupId, teacherId, name, songs } = await req.json();
    console.log('[CustomChoreo] POST', { groupId, teacherId, name, songsCount: songs?.length });

    if (!groupId || !teacherId || !name || !songs?.length) {
      return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
    }

    const choreo = await addCustomChoreo({ groupId, teacherId, name, songs });
    console.log('[CustomChoreo] Saved:', choreo);
    return NextResponse.json({ success: true, choreo });
  } catch (err: any) {
    console.error('[CustomChoreo] POST error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: 'Falta id' }, { status: 400 });

  await deleteCustomChoreo(id);
  return NextResponse.json({ success: true });
}
