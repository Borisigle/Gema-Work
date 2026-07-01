import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getSession } from '@/lib/auth';
import { getGroupsByTeacher, getTeacherById, getDayLabel } from '@/lib/data';
import styles from './dashboard.module.css';

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const teacher = getTeacherById(session.teacherId);
  const groups = getGroupsByTeacher(session.teacherId, session.isAdmin);
  const color = teacher?.color || '#8b5cf6';

  const dayIcons: Record<string, string> = {
    lunes: '🟣',
    martes: '🔵',
    miercoles: '🟢',
    jueves: '🟡',
    viernes: '🟠',
    sabado: '🔴',
    domingo: '⚪',
  };

  return (
    <div className={`container ${styles.dashboard}`}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.greeting}>
          <div className={styles.greetingBadge} style={{ '--color': color } as React.CSSProperties}>
            💎 {session.isAdmin ? 'Panel General' : 'Panel Principal'}
          </div>
          <h1 className={styles.title}>
            Hola, <span className="text-gradient">{session.isAdmin ? session.teacherName : `Profe ${session.teacherName}`}</span>
          </h1>
          <p className={styles.subtitle}>
            {groups.length} {groups.length === 1 ? 'grupo' : 'grupos'} {session.isAdmin ? 'en total · Todas las profes' : 'activos'} · Elegí un grupo para empezar
          </p>
        </div>
      </div>

      {/* Groups Grid */}
      <div className={`${styles.groupsGrid} stagger`}>
        {groups.map((group) => {
          const groupTeacher = session.isAdmin ? getTeacherById(group.teacherId) : teacher;
          const groupColor = groupTeacher?.color || '#8b5cf6';

          return (
            <div key={group.id} className={`${styles.groupCard} card animate-fade-in`}>
              {/* Card Header */}
              <div className={styles.cardHeader} style={{ '--color': groupColor } as React.CSSProperties}>
                <div className={styles.groupIcon}>
                  💎
                </div>
                <div className={styles.groupInfo}>
                  <h2 className={styles.groupName}>{group.name}</h2>
                  {session.isAdmin && (
                    <span className={styles.teacherTag}>{groupTeacher?.name || group.teacherId}</span>
                  )}
                  <div className={styles.days}>
                    {group.days.map(day => (
                      <span key={day} className={styles.dayBadge}>
                        {dayIcons[day]} {getDayLabel(day)}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Card Body */}
              <div className={styles.cardBody}>
                <div className={styles.stats}>
                  <div className={styles.stat}>
                    <span className={styles.statNum}>{group.choreos.length}</span>
                    <span className={styles.statLabel}>Coreos</span>
                  </div>
                  <div className={styles.statDivider} />
                  <div className={styles.stat}>
                    <span className={styles.statNum}>{group.days.length}</span>
                    <span className={styles.statLabel}>{group.days.length === 1 ? 'Día' : 'Días'}/sem</span>
                  </div>
                </div>

                {/* Actions */}
                <div className={styles.actions}>
                  <Link
                    href={`/groups/${group.id}/attendance`}
                    className={`btn btn-primary ${styles.actionBtn}`}
                    style={{ '--color': groupColor } as React.CSSProperties}
                    id={`attendance-${group.id}`}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 11l3 3L22 4"/>
                      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
                    </svg>
                    Asistencia
                  </Link>
                  <Link
                    href={`/groups/${group.id}/choreos`}
                    className={`btn btn-secondary ${styles.actionBtn}`}
                    id={`choreos-${group.id}`}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/>
                      <polygon points="10 8 16 12 10 16 10 8"/>
                    </svg>
                    Coreos
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
