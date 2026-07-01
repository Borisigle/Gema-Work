import { redirect, notFound } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { getGroupById, getTeacherById } from '@/lib/data';
import dynamic from 'next/dynamic';
import styles from './attendance.module.css';
import Link from 'next/link';

const AttendanceClient = dynamic(() => import('./AttendanceClient'), {
  loading: () => (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 20px' }}>
      <div className="spinner" style={{ width: 32, height: 32 }} />
    </div>
  ),
});

interface Props {
  params: { groupId: string };
}

export default async function AttendancePage({ params }: Props) {
  const session = await getSession();
  if (!session) redirect('/login');

  const group = getGroupById(params.groupId);
  if (!group || (group.teacherId !== session.teacherId && !session.isAdmin)) notFound();

  const teacher = session.isAdmin ? getTeacherById(group.teacherId) : getTeacherById(session.teacherId);
  const color = teacher?.color || '#8b5cf6';

  return (
    <div className={`container ${styles.page}`}>
      {/* Back button */}
      <Link href="/dashboard" className="backBtn">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/>
        </svg>
        Volver
      </Link>

      {/* Breadcrumb */}
      <div className="breadcrumb">
        <Link href="/dashboard">Dashboard</Link>
        <span className="breadcrumb-sep">›</span>
        <Link href={`/groups/${params.groupId}/attendance`}>{group.name}</Link>
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
        <div className={styles.headerActions}>
          <Link
            href={`/groups/${params.groupId}/students`}
            className={`btn btn-secondary ${styles.exportBtn}`}
            id={`students-btn-${params.groupId}`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            Alumnos
          </Link>
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
      </div>

      <AttendanceClient key={`att-${params.groupId}`} groupId={params.groupId} group={group} color={color} />
    </div>
  );
}
