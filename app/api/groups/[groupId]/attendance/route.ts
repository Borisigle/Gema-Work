import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import {
  getAttendanceForDay,
  saveAttendanceForDay,
  getAttendanceForMonth,
  getDatesWithAttendance,
} from '@/lib/sheets';

// GET /api/groups/[groupId]/attendance?date=YYYY-MM-DD
// GET /api/groups/[groupId]/attendance?year=YYYY&month=MM
// GET /api/groups/[groupId]/attendance?year=YYYY&month=MM&dates=1
export async function GET(
  req: NextRequest,
  { params }: { params: { groupId: string } }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const date = searchParams.get('date');
  const year = searchParams.get('year');
  const month = searchParams.get('month');
  const datesOnly = searchParams.get('dates');

  if (date) {
    const records = await getAttendanceForDay(params.groupId, date);
    return NextResponse.json({ records });
  }

  if (year && month) {
    if (datesOnly) {
      const dates = await getDatesWithAttendance(
        params.groupId,
        parseInt(year),
        parseInt(month)
      );
      return NextResponse.json({ dates });
    }
    const records = await getAttendanceForMonth(
      params.groupId,
      parseInt(year),
      parseInt(month)
    );
    return NextResponse.json({ records });
  }

  return NextResponse.json({ error: 'Parámetros inválidos' }, { status: 400 });
}

// POST /api/groups/[groupId]/attendance
// Body: { date: string, records: { studentId, studentName, present }[] }
export async function POST(
  req: NextRequest,
  { params }: { params: { groupId: string } }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const body = await req.json();
  const { date, records } = body;

  if (!date || !records) {
    return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
  }

  await saveAttendanceForDay(params.groupId, date, records);
  return NextResponse.json({ success: true });
}
