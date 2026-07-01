'use client';

import { useState, useEffect } from 'react';
import styles from './students.module.css';

interface Student {
  id: string;
  groupId: string;
  name: string;
  active: boolean;
  createdAt?: string;
}

interface Props {
  groupId: string;
}

export default function StudentsClient({ groupId }: Props) {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [adding, setAdding] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    loadStudents();
  }, [groupId]);

  async function loadStudents() {
    setLoading(true);
    const res = await fetch(`/api/groups/${groupId}/students`);
    const data = await res.json();
    setStudents(data.students || []);
    setLoading(false);
  }

  async function handleAdd() {
    const trimmed = newName.trim();
    if (!trimmed) return;

    setAdding(true);
    setError('');
    try {
      const res = await fetch(`/api/groups/${groupId}/students`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmed }),
      });
      if (!res.ok) throw new Error('failed');
      const data = await res.json();
      setStudents(prev => [...prev, data.student]);
      setNewName('');
    } catch {
      setError('No se pudo agregar el alumno. Probá de nuevo.');
    } finally {
      setAdding(false);
    }
  }

  async function toggleActive(student: Student) {
    const nextActive = !student.active;

    if (nextActive === false) {
      const ok = window.confirm(
        `¿Dar de baja a ${student.name}? No va a aparecer más en la lista de asistencia, pero su historial pasado se mantiene intacto.`
      );
      if (!ok) return;
    }

    setPendingId(student.id);
    setError('');
    try {
      const res = await fetch(`/api/groups/${groupId}/students`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: student.id, active: nextActive }),
      });
      if (!res.ok) throw new Error('failed');
      setStudents(prev =>
        prev.map(s => (s.id === student.id ? { ...s, active: nextActive } : s))
      );
    } catch {
      setError('No se pudo actualizar el alumno. Probá de nuevo.');
    } finally {
      setPendingId(null);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') handleAdd();
  }

  const activeStudents = students.filter(s => s.active);
  const inactiveStudents = students.filter(s => !s.active);

  return (
    <div>
      {/* Agregar alumno */}
      <div className={`card ${styles.addCard}`}>
        <input
          id="new-student-input"
          className={styles.addInput}
          placeholder="Nombre del alumno nuevo"
          value={newName}
          onChange={e => setNewName(e.target.value)}
          onKeyDown={handleKeyDown}
          maxLength={60}
        />
        <button
          id="add-student-btn"
          className="btn btn-primary"
          onClick={handleAdd}
          disabled={adding || !newName.trim()}
        >
          {adding ? 'Agregando...' : '+ Agregar alumno'}
        </button>
      </div>

      {error && <p className={styles.errorMsg}>{error}</p>}

      {loading ? (
        <div className={styles.loadingState}>Cargando alumnos...</div>
      ) : students.length === 0 ? (
        <div className={`card ${styles.emptyState}`}>
          <div className={styles.emptyIcon}>👥</div>
          <h3>Sin alumnos todavía</h3>
          <p>Agregá el primero usando el formulario de arriba.</p>
        </div>
      ) : (
        <>
          <div className={styles.sectionLabel}>
            Activos ({activeStudents.length})
          </div>
          <div className={`card ${styles.listCard}`}>
            {activeStudents.length === 0 ? (
              <p className={styles.emptyInline}>No hay alumnos activos en este grupo.</p>
            ) : (
              activeStudents.map((student, idx) => (
                <div key={student.id} id={`student-row-${student.id}`} className={styles.studentRow}>
                  <div className={styles.studentNum}>{idx + 1}</div>
                  <div className={styles.studentName}>{student.name}</div>
                  <button
                    id={`deactivate-btn-${student.id}`}
                    className="btn btn-secondary btn-sm"
                    onClick={() => toggleActive(student)}
                    disabled={pendingId === student.id}
                  >
                    {pendingId === student.id ? '...' : 'Dar de baja'}
                  </button>
                </div>
              ))
            )}
          </div>

          {inactiveStudents.length > 0 && (
            <>
              <div className={styles.sectionLabel}>
                Dados de baja ({inactiveStudents.length})
              </div>
              <div className={`card ${styles.listCard} ${styles.inactiveCard}`}>
                {inactiveStudents.map((student) => (
                  <div key={student.id} id={`student-row-${student.id}`} className={`${styles.studentRow} ${styles.inactiveRow}`}>
                    <div className={styles.studentName}>{student.name}</div>
                    <button
                      id={`reactivate-btn-${student.id}`}
                      className="btn btn-ghost btn-sm"
                      onClick={() => toggleActive(student)}
                      disabled={pendingId === student.id}
                    >
                      {pendingId === student.id ? '...' : 'Reactivar'}
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
