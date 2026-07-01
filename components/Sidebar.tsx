'use client';

import Link from 'next/link';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { GROUPS, getTeacherById } from '@/lib/data';
import type { Group } from '@/lib/data';
import styles from './Sidebar.module.css';

interface SidebarProps {
  teacherName: string;
  teacherId: string;
  isAdmin?: boolean;
}

export default function Sidebar({ teacherName, teacherId, isAdmin }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const teacher = getTeacherById(teacherId);
  const groups: Group[] = isAdmin
    ? GROUPS
    : GROUPS.filter(g => teacher?.groupIds.includes(g.id));

  // Extract current groupId from pathname or search params
  const groupMatch = pathname.match(/\/groups\/([^/]+)/);
  const searchGroupId = searchParams.get('groupId');
  const currentGroupId = groupMatch?.[1] || searchGroupId || null;
  const currentGroup = currentGroupId ? groups.find(g => g.id === currentGroupId) : null;

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  }

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(href + '/');
  }

  return (
    <>
      {/* Desktop sidebar */}
      <aside className={styles.sidebar}>
        <Link href="/dashboard" className={styles.brand}>
          <img src="/logo.png" alt="Gema" className={styles.brandImg} />
          <span className={styles.brandText}>GEMA<br/>COMPANY</span>
        </Link>

        <nav className={styles.nav}>
          <div className={styles.sectionLabel}>Menu</div>
          <Link
            href="/dashboard"
            className={`${styles.item} ${isActive('/dashboard') ? styles.active : ''}`}
          >
            <span className={styles.itemIcon}>🏠</span>
            <span>Inicio</span>
          </Link>

          <div className={styles.sectionLabel}>Grupos</div>
          {groups.map((group: Group) => {
            const groupActive = pathname.includes(`/groups/${group.id}`);
            return (
              <div key={group.id} className={styles.groupBlock}>
                <Link
                  href={`/groups/${group.id}/attendance`}
                  className={`${styles.item} ${groupActive ? styles.active : ''}`}
                >
                  <span className={styles.itemIcon}>📋</span>
                  <span>{group.name}</span>
                </Link>
                {groupActive && (
                  <div className={styles.subItems}>
                    <Link
                      href={`/groups/${group.id}/students`}
                      className={`${styles.subItem} ${pathname.includes('/students') ? styles.subActive : ''}`}
                    >
                      Alumnas
                    </Link>
                    <Link
                      href={`/groups/${group.id}/choreos`}
                      className={`${styles.subItem} ${pathname.includes('/choreos') ? styles.subActive : ''}`}
                    >
                      Coreografias
                    </Link>
                    <Link
                      href={`/groups/${group.id}/attendance`}
                      className={`${styles.subItem} ${pathname.includes('/attendance') && !pathname.includes('/export') ? styles.subActive : ''}`}
                    >
                      Asistencia
                    </Link>
                    <Link
                      href={`/groups/${group.id}/attendance/export`}
                      className={`${styles.subItem} ${pathname.includes('/export') ? styles.subActive : ''}`}
                    >
                      Exportar PDF
                    </Link>
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <div className={styles.user}>
          <div className={styles.avatar} style={{ background: `linear-gradient(135deg, ${teacher?.color || '#ff80c0'}, ${teacher?.color || '#c080ff'})` } as React.CSSProperties}>
            {teacherName.charAt(0).toUpperCase()}
          </div>
          <div className={styles.userInfo}>
            <div className={styles.userName}>{teacherName}</div>
            <div className={styles.userRole}>{isAdmin ? 'Admin' : 'Profe'}</div>
          </div>
          <button
            onClick={handleLogout}
            className={styles.logout}
            title="Cerrar sesion"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </button>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav className={styles.mobileNav}>
        <Link
          href="/dashboard"
          className={`${styles.mobileItem} ${isActive('/dashboard') && !currentGroupId ? styles.mobileActive : ''}`}
        >
          <span className={styles.mobileIcon}>🏠</span>
          <span className={styles.mobileLabel}>Inicio</span>
        </Link>

        {currentGroup ? (
          <>
            <Link
              href={`/groups/${currentGroup.id}/attendance`}
              className={`${styles.mobileItem} ${pathname.includes('/attendance') && !pathname.includes('/export') ? styles.mobileActive : ''}`}
            >
              <span className={styles.mobileIcon}>📋</span>
              <span className={styles.mobileLabel}>Asistencia</span>
            </Link>
            <Link
              href={`/groups/${currentGroup.id}/students`}
              className={`${styles.mobileItem} ${pathname.includes('/students') ? styles.mobileActive : ''}`}
            >
              <span className={styles.mobileIcon}>👥</span>
              <span className={styles.mobileLabel}>Alumnas</span>
            </Link>
            <Link
              href={`/groups/${currentGroup.id}/choreos`}
              className={`${styles.mobileItem} ${pathname.includes('/choreos') ? styles.mobileActive : ''}`}
            >
              <span className={styles.mobileIcon}>🎵</span>
              <span className={styles.mobileLabel}>Coreos</span>
            </Link>
          </>
        ) : (
          <>
            {groups.slice(0, 3).map(group => (
              <Link
                key={group.id}
                href={`/groups/${group.id}/attendance`}
                className={styles.mobileItem}
              >
                <span className={styles.mobileIcon}>📋</span>
                <span className={styles.mobileLabel}>{group.name.split(' ')[0]}</span>
              </Link>
            ))}
          </>
        )}

        <button onClick={handleLogout} className={styles.mobileItem}>
          <span className={styles.mobileIcon}>🚪</span>
          <span className={styles.mobileLabel}>Salir</span>
        </button>
      </nav>
    </>
  );
}
