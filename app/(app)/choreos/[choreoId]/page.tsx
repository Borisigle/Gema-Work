import { redirect, notFound } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { GROUPS, getTeacherById } from '@/lib/data';
import { getChoreoNameOverride, getDeletedSongs, getAddedSongsByChoreo } from '@/lib/sheets';
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

  const [nameOverride, deletedSongs, addedSongs] = await Promise.all([
    getChoreoNameOverride(choreo.id),
    getDeletedSongs(),
    getAddedSongsByChoreo(choreo.id),
  ]);
  const effectiveName = nameOverride || choreo.name;

  // Determine the current song: last added song wins, otherwise first non-deleted hardcoded song
  const deletedFiles = deletedSongs.filter(d => d.choreoId === choreo.id).map(d => d.songFile);
  const hardcodedSong = choreo.songs.find(s => !deletedFiles.includes(s.file));
  const lastAdded = addedSongs.length > 0 ? addedSongs[addedSongs.length - 1] : null;

  const initialSong = lastAdded
    ? { title: lastAdded.title, file: lastAdded.file, addedSongId: lastAdded.id }
    : hardcodedSong
      ? { title: hardcodedSong.title, file: hardcodedSong.file }
      : null;

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
        choreo={{ ...choreo, name: effectiveName, songs: choreo.songs }}
        groupId={group.id}
        color={color}
        groupName={group.name}
        initialSong={initialSong}
      />
    </div>
  );
}
