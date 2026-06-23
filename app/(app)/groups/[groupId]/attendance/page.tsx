import { redirect, notFound } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { getGroupById, getTeacherById } from '@/lib/data';
import AttendanceClient from './AttendanceClient';
import styles from './attendance.module.css';
import Link from 'next/link';

interface Props {
  params: { groupId: string };
}

export default async function AttendancePage({ params }: Props) {
  const session = await getSession();
  if (!session) redirect('/login');

  const group = getGroupById(params.groupId);
  if (!group || group.teacherId !== session.teacherId) notFound();

  const teacher = getTeacherById(session.teacherId);
  const color = teacher?.color || '#8b5cf6';

  return (
    <div className={`container ${styles.page}`}>
      {/* Breadcrumb */}
      <div className="breadcrumb">
        <Link href="/dashboard">Dashboard</Link>
        <span className="breadcrumb-sep">›</span>
        <span>{group.name}</span>
        <span className="breadcrumb-sep">›</span>
        <span>Asistencia</span>
      </div>

      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>
            Asistencia – <span className="text-gradient">{group.name}</span>
          </h1>
          <p className={styles.subtitle}>
            Seleccioná un día del calendario para ver o registrar la asistencia
          </p>
        </div>
        <Link
          href={`/groups/${params.groupId}/attendance/export`}
          className={`btn btn-secondary ${styles.exportBtn}`}
          id={`export-btn-${params.groupId}`}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          Exportar PDF
        </Link>
      </div>

      <AttendanceClient groupId={params.groupId} group={group} color={color} />
    </div>
  );
}
