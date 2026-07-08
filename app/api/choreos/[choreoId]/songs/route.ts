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

  const { title, file } = await req.json();
  if (!title || !file) return NextResponse.json({ error: 'Faltan title o file' }, { status: 400 });

  const song = await addSong({ choreoId: params.choreoId, title, file });
  return NextResponse.json({ success: true, song });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { choreoId: string } }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { songFile, addedSongId } = await req.json();

  if (addedSongId) {
    // Remove an added (custom) song
    await removeAddedSong(addedSongId);
    return NextResponse.json({ success: true });
  }

  if (songFile) {
    // Hide a hardcoded song
    await deleteSong(params.choreoId, songFile);
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: 'Falta songFile o addedSongId' }, { status: 400 });
}
