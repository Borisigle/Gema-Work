import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { getSession } from '@/lib/auth';
import { getGroupById, getTeacherById } from '@/lib/data';
import styles from './choreos.module.css';

interface Props {
  params: { groupId: string };
}

export default async function ChoreosPage({ params }: Props) {
  const session = await getSession();
  if (!session) redirect('/login');

  const group = getGroupById(params.groupId);
  if (!group || group.teacherId !== session.teacherId) notFound();

  const teacher = getTeacherById(session.teacherId);
  const color = teacher?.color || '#8b5cf6';

  return (
    <div className={`container ${styles.page}`}>
      <div className="breadcrumb">
        <Link href="/dashboard">Dashboard</Link>
        <span className="breadcrumb-sep">›</span>
        <span>{group.name}</span>
        <span className="breadcrumb-sep">›</span>
        <span>Coreos</span>
      </div>

      <div className={styles.header}>
        <h1 className={styles.title}>
          Coreos – <span className="text-gradient">{group.name}</span>
        </h1>
        <p className={styles.subtitle}>
          {group.choreos.length} coreografía{group.choreos.length !== 1 ? 's' : ''} disponible{group.choreos.length !== 1 ? 's' : ''}
        </p>
      </div>

      {group.choreos.length === 0 ? (
        <div className={`card ${styles.empty}`}>
          <div className={styles.emptyIcon}>💎</div>
          <h3>Sin coreografías</h3>
          <p>Este grupo todavía no tiene coreografías cargadas.</p>
        </div>
      ) : (
        <div className={`${styles.choreoGrid} stagger`}>
          {group.choreos.map((choreo, idx) => (
            <Link
              key={choreo.id}
              href={`/choreos/${choreo.id}?groupId=${params.groupId}`}
              className={`${styles.choreoCard} card animate-fade-in`}
              id={`choreo-${choreo.id}`}
              style={{ '--color': color } as React.CSSProperties}
            >
              <div className={styles.cardNum}>
                <span>{String(idx + 1).padStart(2, '0')}</span>
              </div>

              <div className={styles.cardContent}>
                <h2 className={styles.choreoName}>{choreo.name}</h2>
                <div className={styles.songCount}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 18V5l12-2v13"/>
                    <circle cx="6" cy="18" r="3"/>
                    <circle cx="18" cy="16" r="3"/>
                  </svg>
                  {choreo.songs.length} {choreo.songs.length === 1 ? 'canción' : 'canciones'}
                </div>
                <div className={styles.songList}>
                  {choreo.songs.slice(0, 3).map((s, i) => (
                    <span key={i} className={styles.songTag}>💎 {s.title}</span>
                  ))}
                  {choreo.songs.length > 3 && (
                    <span className={styles.songTag}>+{choreo.songs.length - 3} más</span>
                  )}
                </div>
              </div>

              <div className={styles.cardArrow}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
