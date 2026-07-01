import { redirect, notFound } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { getGroupById } from '@/lib/data';
import dynamic from 'next/dynamic';
import styles from './students.module.css';
import Link from 'next/link';

const StudentsClient = dynamic(() => import('./StudentsClient'), {
  loading: () => (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 20px' }}>
      <div className="spinner" style={{ width: 32, height: 32 }} />
    </div>
  ),
});

interface Props {
  params: { groupId: string };
}

export default async function StudentsPage({ params }: Props) {
  const session = await getSession();
  if (!session) redirect('/login');

  const group = getGroupById(params.groupId);
  if (!group || (group.teacherId !== session.teacherId && !session.isAdmin)) notFound();

  return (
    <div className={`container ${styles.page}`}>
      {/* Back button */}
      <Link href="/dashboard" className="backBtn">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/>
        </svg>
        Volver
      </Link>

      <div className="breadcrumb">
        <Link href="/dashboard">Dashboard</Link>
        <span className="breadcrumb-sep">›</span>
        <Link href={`/groups/${params.groupId}/students`}>{group.name}</Link>
        <span className="breadcrumb-sep">›</span>
        <span>Alumnos</span>
      </div>

      <div className={styles.header}>
        <h1 className={styles.title}>
          Alumnos – <span className="text-gradient">{group.name}</span>
        </h1>
        <p className={styles.subtitle}>
          Agregá alumnos nuevos o dá de baja a los que ya no asisten. El historial de asistencia de cada uno no se borra.
        </p>
      </div>

      <StudentsClient groupId={params.groupId} />
    </div>
  );
}
