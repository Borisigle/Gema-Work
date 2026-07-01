import { redirect, notFound } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { GROUPS, getTeacherById } from '@/lib/data';
import { getChoreoNameOverride } from '@/lib/sheets';
import { getSongsForChoreo } from '@/lib/songs';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import styles from './choreo.module.css';

const ChoreoClient = dynamic(() => import('./ChoreoClient'), {
  loading: () => (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 20px' }}>
      <div className="spinner" style={{ width: 32, height: 32 }} />
    </div>
  ),
});

interface Props {
  params: { choreoId: string };
  searchParams: { groupId?: string };
}

export default async function ChoreoPage({ params, searchParams }: Props) {
  const session = await getSession();
  if (!session) redirect('/login');

  // Find the choreo across all groups (todos si es admin, solo los propios si no)
  const teacherGroups = session.isAdmin ? GROUPS : GROUPS.filter(g => g.teacherId === session.teacherId);
  const choreo = teacherGroups.flatMap(g => g.choreos).find(c => c.id === params.choreoId);

  if (!choreo) notFound();

  const group = teacherGroups.find(g => g.choreos.some(c => c.id === params.choreoId));
  if (!group) notFound();

  const teacher = session.isAdmin ? getTeacherById(group.teacherId) : getTeacherById(session.teacherId);
  const color = teacher?.color || '#8b5cf6';

  // El nombre puede haber sido editado por el profe; si hay override guardado, pisa al default hardcodeado
  const nameOverride = await getChoreoNameOverride(choreo.id);
  const effectiveName = nameOverride || choreo.name;

  // Las canciones reales se leen de /public/audio/<profe>/<grupo>/<coreoId>/.
  // Si esa carpeta todavía no tiene mp3 cargados, se usa el placeholder hardcodeado
  // de lib/data.ts (para no mostrar la pantalla vacía mientras se cargan los temas).
  const realSongs = getSongsForChoreo(group.teacherId, group.id, choreo.id);
  const effectiveSongs = realSongs.length > 0 ? realSongs : choreo.songs;

  return (
    <div className={`container ${styles.page}`}>
      {/* Back button */}
      <Link href={`/groups/${group.id}/choreos`} className="backBtn">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/>
        </svg>
        Volver a Coreos
      </Link>

      <div className="breadcrumb">
        <Link href="/dashboard">Dashboard</Link>
        <span className="breadcrumb-sep">›</span>
        <Link href={`/groups/${group.id}/choreos`}>{group.name}</Link>
        <span className="breadcrumb-sep">›</span>
        <span>{effectiveName}</span>
      </div>

      <ChoreoClient
        choreo={{ ...choreo, name: effectiveName, songs: effectiveSongs }}
        groupId={group.id}
        color={color}
        groupName={group.name}
      />
    </div>
  );
}
