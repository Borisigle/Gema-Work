import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { deleteFromCloudinary } from '@/lib/cloudinary';

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { url } = await req.json();
  if (!url) return NextResponse.json({ error: 'Falta url' }, { status: 400 });

  const deleted = await deleteFromCloudinary(url);
  return NextResponse.json({ success: deleted });
}
