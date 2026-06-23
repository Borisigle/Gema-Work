'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Group } from '@/lib/data';
import { getDayNumber, getDayLabel } from '@/lib/data';
import styles from './attendance.module.css';

interface Student {
  id: string;
  groupId: string;
  name: string;
  active: boolean;
}

interface AttendanceRecord {
  studentId: string;
  studentName: string;
  present: boolean;
}

interface Props {
  groupId: string;
  group: Group;
  color: string;
}

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const DAY_NAMES = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa'];

export default function AttendanceClient({ groupId, group, color }: Props) {
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth()); // 0-indexed
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const [datesWithData, setDatesWithData] = useState<Set<string>>(new Set());
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<Record<string, boolean>>({});
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Days of week that this group has class (JS 0=Sun format)
  const classDayNumbers = new Set(group.days.map(getDayNumber));

  // Fetch which dates already have attendance data
  const fetchDatesWithData = useCallback(async () => {
    const res = await fetch(
      `/api/groups/${groupId}/attendance?year=${currentYear}&month=${currentMonth + 1}&dates=1`
    );
    if (res.ok) {
      const data = await res.json();
      setDatesWithData(new Set(data.dates || []));
    }
  }, [groupId, currentYear, currentMonth]);

  useEffect(() => {
    fetchDatesWithData();
  }, [fetchDatesWithData]);

  // Fetch students + attendance for selected date
  async function loadDayData(dateStr: string) {
    setLoadingStudents(true);
    setAttendance({});

    const [studentsRes, attendanceRes] = await Promise.all([
      fetch(`/api/groups/${groupId}/students`),
      fetch(`/api/groups/${groupId}/attendance?date=${dateStr}`),
    ]);

    const studentsData = await studentsRes.json();
    const attendanceData = await attendanceRes.json();

    const studentList: Student[] = studentsData.students || [];
    setStudents(studentList);

    // Map existing attendance records
    const attMap: Record<string, boolean> = {};
    if (attendanceData.records?.length > 0) {
      for (const rec of attendanceData.records as AttendanceRecord[]) {
        attMap[rec.studentId] = rec.present;
      }
    } else {
      // Default: all present
      for (const s of studentList) {
        attMap[s.id] = true;
      }
    }
    setAttendance(attMap);
    setLoadingStudents(false);
  }

  function handleDayClick(dateStr: string) {
    setSelectedDate(dateStr);
    setSaveSuccess(false);
    loadDayData(dateStr);
  }

  function toggleAttendance(studentId: string) {
    setAttendance(prev => ({ ...prev, [studentId]: !prev[studentId] }));
  }

  async function handleSave() {
    if (!selectedDate) return;
    setSaving(true);
    setSaveSuccess(false);

    const records = students.map(s => ({
      studentId: s.id,
      studentName: s.name,
      present: attendance[s.id] ?? true,
    }));

    const res = await fetch(`/api/groups/${groupId}/attendance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: selectedDate, records }),
    });

    setSaving(false);
    if (res.ok) {
      setSaveSuccess(true);
      setDatesWithData(prev => new Set([...prev, selectedDate]));
      setTimeout(() => setSaveSuccess(false), 3000);
    }
  }

  // ── Calendar generation ──────────────────────────────────────────────────
  function buildCalendar() {
    const firstDay = new Date(currentYear, currentMonth, 1).getDay(); // 0=Sun
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const cells: (number | null)[] = [];

    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    // Pad to complete last row
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }

  function formatDate(day: number) {
    return `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }

  function isClassDay(day: number) {
    const date = new Date(currentYear, currentMonth, day);
    return classDayNumbers.has(date.getDay());
  }

  function isToday(day: number) {
    return (
      day === today.getDate() &&
      currentMonth === today.getMonth() &&
      currentYear === today.getFullYear()
    );
  }

  function isFuture(day: number) {
    const date = new Date(currentYear, currentMonth, day);
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    return date > todayStart;
  }

  const calendar = buildCalendar();
  const presentCount = Object.values(attendance).filter(Boolean).length;
  const absentCount = students.length - presentCount;

  return (
    <div className={styles.clientRoot} style={{ '--color': color } as React.CSSProperties}>
      <div className={styles.layout}>
        {/* ── LEFT: Calendar ── */}
        <div className={`card ${styles.calendarCard}`}>
          {/* Month navigation */}
          <div className={styles.calendarHeader}>
            <button
              className={`btn btn-ghost btn-sm ${styles.navBtn}`}
              onClick={() => {
                if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1); }
                else setCurrentMonth(m => m - 1);
                setSelectedDate(null);
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M15 18l-6-6 6-6"/>
              </svg>
            </button>
            <span className={styles.monthTitle}>
              {MONTH_NAMES[currentMonth]} {currentYear}
            </span>
            <button
              className={`btn btn-ghost btn-sm ${styles.navBtn}`}
              onClick={() => {
                if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1); }
                else setCurrentMonth(m => m + 1);
                setSelectedDate(null);
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M9 18l6-6-6-6"/>
              </svg>
            </button>
          </div>

          {/* Class days legend */}
          <div className={styles.classLegend}>
            <span className={styles.legendLabel}>Días de clase:</span>
            {group.days.map(d => (
              <span key={d} className={styles.legendDay}>{getDayLabel(d)}</span>
            ))}
          </div>

          {/* Day-of-week headers */}
          <div className={styles.calGrid}>
            {DAY_NAMES.map(d => (
              <div key={d} className={styles.dayHeader}>{d}</div>
            ))}

            {calendar.map((day, i) => {
              if (!day) return <div key={`empty-${i}`} />;
              const dateStr = formatDate(day);
              const isClass = isClassDay(day);
              const hasData = datesWithData.has(dateStr);
              const isSelected = selectedDate === dateStr;
              const isPast = !isFuture(day);
              const future = isFuture(day);

              return (
                <button
                  key={day}
                  className={`
                    ${styles.dayCell}
                    ${isClass ? styles.classDay : styles.nonClassDay}
                    ${hasData ? styles.hasData : ''}
                    ${isSelected ? styles.selected : ''}
                    ${isToday(day) ? styles.today : ''}
                    ${future ? styles.future : ''}
                  `}
                  onClick={() => isClass && !future && handleDayClick(dateStr)}
                  disabled={!isClass || future}
                  title={isClass ? (future ? 'Fecha futura' : `Clase del ${getDayLabel(new Date(currentYear, currentMonth, day).getDay() as unknown as Parameters<typeof getDayLabel>[0])}`) : 'Sin clase'}
                >
                  {day}
                  {hasData && <span className={styles.dotIndicator} />}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className={styles.calLegend}>
            <div className={styles.legendItem}>
              <div className={`${styles.legendDot} ${styles.ldClass}`} />
              <span>Día de clase</span>
            </div>
            <div className={styles.legendItem}>
              <div className={`${styles.legendDot} ${styles.ldSaved}`} />
              <span>Guardado</span>
            </div>
            <div className={styles.legendItem}>
              <div className={`${styles.legendDot} ${styles.ldToday}`} />
              <span>Hoy</span>
            </div>
          </div>
        </div>

        {/* ── RIGHT: Attendance list ── */}
        <div className={styles.rightPanel}>
          {!selectedDate ? (
            <div className={`card ${styles.emptyState}`}>
              <div className={styles.emptyIcon}>📅</div>
              <h3>Seleccioná un día</h3>
              <p>Hacé click en un día de clase del calendario para ver y registrar la asistencia.</p>
            </div>
          ) : loadingStudents ? (
            <div className={`card ${styles.loadingState}`}>
              <div className="spinner" style={{ width: 32, height: 32 }} />
              <p>Cargando lista...</p>
            </div>
          ) : students.length === 0 ? (
            <div className={`card ${styles.emptyState}`}>
              <div className={styles.emptyIcon}>👥</div>
              <h3>Sin alumnos</h3>
              <p>Este grupo todavía no tiene alumnos cargados en la base de datos.</p>
            </div>
          ) : (
            <div className={`card ${styles.attendanceCard}`}>
              {/* Header */}
              <div className={styles.listHeader}>
                <div>
                  <h3 className={styles.listTitle}>
                    {new Date(selectedDate + 'T12:00:00').toLocaleDateString('es-AR', {
                      weekday: 'long', day: 'numeric', month: 'long'
                    })}
                  </h3>
                  <div className={styles.listStats}>
                    <span className="badge badge-success">✓ {presentCount} presentes</span>
                    {absentCount > 0 && (
                      <span className="badge badge-danger">✗ {absentCount} ausentes</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Student list */}
              <div className={styles.studentList}>
                {students.map((student, idx) => {
                  const present = attendance[student.id] ?? true;
                  return (
                    <button
                      key={student.id}
                      id={`student-${student.id}`}
                      className={`${styles.studentRow} ${present ? styles.present : styles.absent}`}
                      onClick={() => toggleAttendance(student.id)}
                    >
                      <div className={styles.studentNum}>{idx + 1}</div>
                      <div className={styles.studentName}>{student.name}</div>
                      <div className={`${styles.checkBox} ${present ? styles.checkPresent : styles.checkAbsent}`}>
                        {present ? (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                            <polyline points="20 6 9 17 4 12"/>
                          </svg>
                        ) : (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                            <line x1="18" y1="6" x2="6" y2="18"/>
                            <line x1="6" y1="6" x2="18" y2="18"/>
                          </svg>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Save button */}
              <div className={styles.listFooter}>
                {saveSuccess && (
                  <div className={styles.successMsg}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    ¡Asistencia guardada!
                  </div>
                )}
                <button
                  id={`save-attendance-${selectedDate}`}
                  className="btn btn-primary"
                  onClick={handleSave}
                  disabled={saving}
                  style={{ '--color': color } as React.CSSProperties}
                >
                  {saving ? (
                    <>
                      <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2, borderTopColor: 'white' }} />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                        <polyline points="17 21 17 13 7 13 7 21"/>
                        <polyline points="7 3 7 8 15 8"/>
                      </svg>
                      Guardar Asistencia
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
