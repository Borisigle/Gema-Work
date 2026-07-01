import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getAllStudentsByGroup, addStudent, setStudentActive } from '@/lib/sheets';

export async function GET(
  req: NextRequest,
  { params }: { params: { groupId: string } }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const students = await getAllStudentsByGroup(params.groupId);
  return NextResponse.json({ students });
}

export async function POST(
  req: NextRequest,
  { params }: { params: { groupId: string } }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { name } = await req.json();
  const trimmed = (name || '').trim();
  if (!trimmed) {
    return NextResponse.json({ error: 'El nombre no puede estar vacío' }, { status: 400 });
  }

  const student = await addStudent(params.groupId, trimmed);
  return NextResponse.json({ success: true, student });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { groupId: string } }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { studentId, active } = await req.json();
  if (!studentId || typeof active !== 'boolean') {
    return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
  }

  await setStudentActive(studentId, active);
  return NextResponse.json({ success: true });
}
