'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from './Navbar.module.css';
import { getTeacherById } from '@/lib/data';

interface NavbarProps {
  teacherName: string;
  teacherId: string;
}

export default function Navbar({ teacherName, teacherId }: NavbarProps) {
  const router = useRouter();

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  }

  // Get teacher color from data
  const teacher = getTeacherById(teacherId);
  const color = teacher?.color || '#8b5cf6';

  return (
    <nav className="navbar">
      <Link href="/dashboard" className="navbar-brand">
        <img src="/logo.png" alt="Gema Logo" className={styles.logoImg} />
        <span className={styles.brandText}>Gema Company Workflow</span>
      </Link>

      <div className="navbar-user">
        <div className={styles.avatar} style={{ '--teacher-color': color } as React.CSSProperties}>
          {teacherName.charAt(0).toUpperCase()}
        </div>
        <span className={styles.teacherName}>Profe {teacherName}</span>
        <button
          id="logout-btn"
          onClick={handleLogout}
          className={`btn btn-ghost btn-sm ${styles.logoutBtn}`}
          title="Cerrar sesión"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          <span className={styles.logoutText}>Salir</span>
        </button>
      </div>
    </nav>
  );
}
