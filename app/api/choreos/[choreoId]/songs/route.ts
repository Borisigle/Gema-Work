import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getDeletedSongs, deleteSong, getAddedSongsByChoreo, addSong, removeAddedSong } from '@/lib/sheets';

export async function GET(
  req: NextRequest,
  { params }: { params: { choreoId: string } }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const added = await getAddedSongsByChoreo(params.choreoId);
  const deleted = await getDeletedSongs();
  const deletedForChoreo = deleted.filter(d => d.choreoId === params.choreoId).map(d => d.songFile);

  return NextResponse.json({ added, deletedFiles: deletedForChoreo });
}

export async function POST(
  req: NextRequest,
  { params }: { params: { choreoId: string } }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  try {
    const { title, file } = await req.json();
    console.log('[Songs] POST', { choreoId: params.choreoId, title, file });
    if (!title || !file) return NextResponse.json({ error: 'Faltan title o file' }, { status: 400 });

    const song = await addSong({ choreoId: params.choreoId, title, file });
    console.log('[Songs] Saved:', song);
    return NextResponse.json({ success: true, song });
  } catch (err: any) {
    console.error('[Songs] POST error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { choreoId: string } }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  try {
    const { songFile, addedSongId } = await req.json();
    console.log('[Songs] DELETE', { choreoId: params.choreoId, songFile, addedSongId });

    if (addedSongId) {
      await removeAddedSong(addedSongId);
      return NextResponse.json({ success: true });
    }

    if (songFile) {
      await deleteSong(params.choreoId, songFile);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Falta songFile o addedSongId' }, { status: 400 });
  } catch (err: any) {
    console.error('[Songs] DELETE error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
