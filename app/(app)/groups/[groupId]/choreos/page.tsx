import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { getSession } from '@/lib/auth';
import { getGroupById, getTeacherById } from '@/lib/data';
import { getAllChoreoNameOverrides } from '@/lib/sheets';
import styles from './choreos.module.css';
import ChoreosListClient from './ChoreosListClient';

interface Props {
  params: { groupId: string };
}

export default async function ChoreosPage({ params }: Props) {
  const session = await getSession();
  if (!session) redirect('/login');

  const group = getGroupById(params.groupId);
  if (!group || (group.teacherId !== session.teacherId && !session.isAdmin)) notFound();

  const teacher = session.isAdmin ? getTeacherById(group.teacherId) : getTeacherById(session.teacherId);
  const color = teacher?.color || '#8b5cf6';

  // Los nombres pueden haber sido editados por el profe; los overrides pisan al default hardcodeado
  const nameOverrides = await getAllChoreoNameOverrides();

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
        <Link href={`/groups/${params.groupId}/choreos`}>{group.name}</Link>
        <span className="breadcrumb-sep">›</span>
        <span>Coreos</span>
      </div>

      <div className={styles.header}>
        <h1 className={styles.title}>
          Coreos – <span className="text-gradient">{group.name}</span>
        </h1>
      </div>

      <ChoreosListClient
        groupId={params.groupId}
        teacherId={group.teacherId}
        color={color}
        hardcodedChoreos={group.choreos.map(c => ({
          id: c.id,
          name: c.name,
          songs: c.songs.map(s => ({ title: s.title, file: s.file })),
        }))}
        nameOverrides={nameOverrides}
      />
    </div>
  );
}
