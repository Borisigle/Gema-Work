import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getGroupById, getTeacherById, MONTH_NAMES_ES } from '@/lib/data';
import { getAttendanceForMonth, getStudentsByGroup } from '@/lib/sheets';

// We can't use jsPDF in Node edge/server easily, so we return raw JSON data
// and let the client generate the PDF. This route returns the data needed.
export async function GET(
  req: NextRequest,
  { params }: { params: { groupId: string } }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const group = getGroupById(params.groupId);
  if (!group || (group.teacherId !== session.teacherId && !session.isAdmin)) {
    return NextResponse.json({ error: 'Grupo no encontrado' }, { status: 404 });
  }

  const { searchParams } = new URL(req.url);
  const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()));
  const month = parseInt(searchParams.get('month') || String(new Date().getMonth() + 1));

  const [students, records] = await Promise.all([
    getStudentsByGroup(params.groupId),
    getAttendanceForMonth(params.groupId, year, month),
  ]);

  // Get unique class dates that occurred this month
  const classDates = [...new Set(records.map(r => r.date))].sort();

  // Build per-student summary
  const studentSummary = students.map(student => {
    const studentRecords = records.filter(r => r.studentId === student.id);
    const totalClasses = classDates.length;
    const attended = studentRecords.filter(r => r.present).length;
    const absences = totalClasses - attended;
    const percentage = totalClasses > 0 ? Math.round((attended / totalClasses) * 100) : 0;

    const attendanceByDate: Record<string, boolean> = {};
    for (const date of classDates) {
      const rec = studentRecords.find(r => r.date === date);
      attendanceByDate[date] = rec ? rec.present : false;
    }

    return {
      id: student.id,
      name: student.name,
      attended,
      absences,
      percentage,
      totalClasses,
      attendanceByDate,
      perfect: absences === 0 && totalClasses > 0,
      neverCame: attended === 0 && totalClasses > 0,
    };
  });

  return NextResponse.json({
    group: { id: group.id, name: group.name },
    teacher: { name: session.teacherName },
    year,
    month,
    monthName: MONTH_NAMES_ES[month - 1],
    classDates,
    students: studentSummary,
  });
}
