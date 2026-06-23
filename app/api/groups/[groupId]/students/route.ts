import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getStudentsByGroup } from '@/lib/sheets';

export async function GET(
  req: NextRequest,
  { params }: { params: { groupId: string } }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const students = await getStudentsByGroup(params.groupId);
  return NextResponse.json({ students });
}
