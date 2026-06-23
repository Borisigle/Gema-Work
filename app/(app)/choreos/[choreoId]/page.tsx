import { redirect, notFound } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { GROUPS, getTeacherById } from '@/lib/data';
import ChoreoClient from './ChoreoClient';
import Link from 'next/link';
import styles from './choreo.module.css';

interface Props {
  params: { choreoId: string };
  searchParams: { groupId?: string };
}

export default async function ChoreoPage({ params, searchParams }: Props) {
  const session = await getSession();
  if (!session) redirect('/login');

  // Find the choreo across all groups of this teacher
  const teacherGroups = GROUPS.filter(g => g.teacherId === session.teacherId);
  const choreo = teacherGroups.flatMap(g => g.choreos).find(c => c.id === params.choreoId);

  if (!choreo) notFound();

  const group = teacherGroups.find(g => g.choreos.some(c => c.id === params.choreoId));
  if (!group) notFound();

  const teacher = getTeacherById(session.teacherId);
  const color = teacher?.color || '#8b5cf6';

  return (
    <div className={`container ${styles.page}`}>
      <div className="breadcrumb">
        <Link href="/dashboard">Dashboard</Link>
        <span className="breadcrumb-sep">›</span>
        <Link href={`/groups/${group.id}/choreos`}>{group.name}</Link>
        <span className="breadcrumb-sep">›</span>
        <span>{choreo.name}</span>
      </div>

      <div className={styles.header}>
        <h1 className={styles.title}>
          <span className="text-gradient">{choreo.name}</span>
        </h1>
        <p className={styles.subtitle}>
          {group.name} · {choreo.songs.length} {choreo.songs.length === 1 ? 'canción' : 'canciones'}
        </p>
      </div>

      <ChoreoClient choreo={choreo} groupId={group.id} color={color} />
    </div>
  );
}
