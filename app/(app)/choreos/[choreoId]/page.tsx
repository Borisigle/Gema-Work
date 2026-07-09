import { redirect, notFound } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { GROUPS, getTeacherById } from '@/lib/data';
import { getChoreoNameOverride, getDeletedSongs, getAddedSongsByChoreo, getCustomChoreoById } from '@/lib/sheets';
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

  const teacherGroups = session.isAdmin ? GROUPS : GROUPS.filter(g => g.teacherId === session.teacherId);

  // Try hardcoded first
  let choreo = teacherGroups.flatMap(g => g.choreos).find(c => c.id === params.choreoId);
  let group = teacherGroups.find(g => g.choreos.some(c => c.id === params.choreoId));
  let isCustom = false;

  // If not found in hardcoded, try custom choreos from Sheets
  if (!choreo) {
    const customChoreo = await getCustomChoreoById(params.choreoId);
    if (customChoreo && (session.isAdmin || customChoreo.teacherId === session.teacherId)) {
      choreo = { id: customChoreo.id, name: customChoreo.name, songs: customChoreo.songs };
      group = teacherGroups.find(g => g.id === customChoreo.groupId);
      isCustom = true;
    }
  }

  if (!choreo || !group) notFound();

  const teacher = session.isAdmin ? getTeacherById(group.teacherId) : getTeacherById(session.teacherId);
  const color = teacher?.color || '#8b5cf6';

  const [nameOverride, deletedSongs, addedSongs] = await Promise.all([
    getChoreoNameOverride(choreo.id),
    getDeletedSongs(),
    getAddedSongsByChoreo(choreo.id),
  ]);
  const effectiveName = nameOverride || choreo.name;

  // Determine the current song
  const deletedFiles = deletedSongs.filter(d => d.choreoId === choreo.id).map(d => d.songFile);
  const hardcodedSong = choreo.songs.find(s => !deletedFiles.includes(s.file));
  const lastAdded = addedSongs.length > 0 ? addedSongs[addedSongs.length - 1] : null;

  const initialSong = lastAdded
    ? { title: lastAdded.title, file: lastAdded.file, addedSongId: lastAdded.id }
    : hardcodedSong
      ? { title: hardcodedSong.title, file: hardcodedSong.file }
      : choreo.songs.length > 0
        ? { title: choreo.songs[0].title, file: choreo.songs[0].file }
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
