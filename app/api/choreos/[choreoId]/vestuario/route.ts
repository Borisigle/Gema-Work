import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getVestuarioByChoreo, addVestuarioPhoto, deleteVestuarioPhoto } from '@/lib/sheets';
import { deleteFromCloudinary } from '@/lib/cloudinary';

export async function GET(
  req: NextRequest,
  { params }: { params: { choreoId: string } }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const photos = await getVestuarioByChoreo(params.choreoId);
  return NextResponse.json({ photos });
}

export async function POST(
  req: NextRequest,
  { params }: { params: { choreoId: string } }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  try {
    const { url, label } = await req.json();
    console.log('[Vestuario] POST', { choreoId: params.choreoId, url, label });

    if (!url) {
      return NextResponse.json({ error: 'Falta url' }, { status: 400 });
    }

    const photo = await addVestuarioPhoto({
      choreoId: params.choreoId,
      url,
      label: label || '',
    });
    console.log('[Vestuario] Saved:', photo);
    return NextResponse.json({ success: true, photo });
  } catch (err: any) {
    console.error('[Vestuario] POST error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { choreoId: string } }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { id, url } = await req.json();
  if (!id) return NextResponse.json({ error: 'Falta id' }, { status: 400 });

  // Delete from Cloudinary if URL is external
  if (url && url.startsWith('http')) {
    await deleteFromCloudinary(url);
  }

  await deleteVestuarioPhoto(id);
  return NextResponse.json({ success: true });
}
