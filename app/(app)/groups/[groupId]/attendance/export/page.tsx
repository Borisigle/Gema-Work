'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './export.module.css';

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

interface ExportData {
  group: { id: string; name: string };
  teacher: { name: string };
  year: number;
  month: number;
  monthName: string;
  classDates: string[];
  students: {
    id: string;
    name: string;
    attended: number;
    absences: number;
    percentage: number;
    totalClasses: number;
    perfect: boolean;
    neverCame: boolean;
    attendanceByDate: Record<string, boolean>;
  }[];
}

export default function ExportPage() {
  const params = useParams();
  const groupId = params.groupId as string;
  const today = new Date();

  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [data, setData] = useState<ExportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  async function fetchData() {
    setLoading(true);
    setError('');
    setData(null);
    const res = await fetch(`/api/groups/${groupId}/attendance/export?year=${year}&month=${month}`);
    if (res.ok) {
      setData(await res.json());
    } else {
      setError('No se pudo cargar la información');
    }
    setLoading(false);
  }

  async function generatePDF() {
    if (!data) return;
    setGenerating(true);

    // Dynamic import of jsPDF to avoid SSR issues
    const { default: jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');

    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();

    // ── Header ──────────────────────────────────────────────────────────────
    // Background
    doc.setFillColor(10, 10, 15);
    doc.rect(0, 0, pageW, pageH, 'F');

    // Purple gradient header bar
    doc.setFillColor(139, 92, 246);
    doc.rect(0, 0, pageW, 28, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('Gema Company Workflow – Reporte de Asistencia', 14, 11);

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(`Grupo: ${data.group.name}  |  Profe: ${data.teacher.name}  |  ${data.monthName} ${data.year}`, 14, 21);

    // ── Summary boxes ────────────────────────────────────────────────────────
    const totalStudents = data.students.length;
    const perfectStudents = data.students.filter(s => s.perfect).length;
    const neverCame = data.students.filter(s => s.neverCame).length;
    const avgPercentage = totalStudents > 0
      ? Math.round(data.students.reduce((acc, s) => acc + s.percentage, 0) / totalStudents)
      : 0;

    const boxes = [
      { label: 'Total Alumnos', value: String(totalStudents), color: [139, 92, 246] },
      { label: 'Clases en el mes', value: String(data.classDates.length), color: [96, 165, 250] },
      { label: 'Asistencia perfecta', value: String(perfectStudents), color: [52, 211, 153] },
      { label: 'No vinieron', value: String(neverCame), color: [248, 113, 113] },
      { label: 'Promedio asistencia', value: `${avgPercentage}%`, color: [251, 191, 36] },
    ];

    const boxW = (pageW - 28) / boxes.length;
    boxes.forEach((box, i) => {
      const x = 14 + i * boxW;
      const [r, g, b] = box.color;
      doc.setFillColor(r, g, b);
      doc.setDrawColor(r, g, b);
      doc.roundedRect(x, 33, boxW - 4, 18, 2, 2, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.text(box.value, x + (boxW - 4) / 2, 43, { align: 'center' });
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(box.label, x + (boxW - 4) / 2, 48, { align: 'center' });
    });

    // ── Main table ───────────────────────────────────────────────────────────
    const dateHeaders = data.classDates.map(d => {
      const date = new Date(d + 'T12:00:00');
      return `${date.getDate()}/${date.getMonth() + 1}`;
    });

    const head = [['#', 'Alumno/a', ...dateHeaders, 'Asistidas', 'Faltas', '%']];
    const body = data.students.map((student, idx) => {
      const dateCells = data.classDates.map(d =>
        student.attendanceByDate[d] ? '✓' : '✗'
      );
      return [
        String(idx + 1),
        student.name,
        ...dateCells,
        String(student.attended),
        String(student.absences),
        `${student.percentage}%`,
      ];
    });

    autoTable(doc, {
      head,
      body,
      startY: 56,
      theme: 'grid',
      headStyles: {
        fillColor: [30, 30, 46],
        textColor: [200, 200, 255],
        fontStyle: 'bold',
        fontSize: 8,
        halign: 'center',
      },
      bodyStyles: {
        fillColor: [18, 18, 26],
        textColor: [220, 220, 240],
        fontSize: 8,
        halign: 'center',
      },
      columnStyles: {
        0: { cellWidth: 8 },
        1: { halign: 'left', cellWidth: 40 },
      },
      alternateRowStyles: {
        fillColor: [22, 22, 34],
      },
      didParseCell: (hookData) => {
        // Color present/absent cells
        if (hookData.row.index >= 0 && hookData.column.index >= 2) {
          const col = hookData.column.index;
          const lastCols = 3; // Asistidas, Faltas, %
          const dateColCount = data.classDates.length;
          if (col >= 2 && col < 2 + dateColCount) {
            if (hookData.cell.raw === '✓') {
              hookData.cell.styles.textColor = [52, 211, 153];
              hookData.cell.styles.fontStyle = 'bold';
            } else if (hookData.cell.raw === '✗') {
              hookData.cell.styles.textColor = [248, 113, 113];
            }
          }
          // Perfect attendance highlight
          if (col === 2 + dateColCount + 2) { // % column
            const pct = parseInt(String(hookData.cell.raw));
            if (pct === 100) hookData.cell.styles.textColor = [52, 211, 153];
            else if (pct === 0) hookData.cell.styles.textColor = [248, 113, 113];
          }
        }
      },
    });

    // ── Highlights section ───────────────────────────────────────────────────
    const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6;

    if (finalY < pageH - 20) {
      doc.setFillColor(26, 26, 38);
      doc.roundedRect(14, finalY, pageW - 28, 16, 2, 2, 'F');

      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');

      // Perfect attendance
      const perfectNames = data.students.filter(s => s.perfect).map(s => s.name).join(', ') || 'Ninguno';
      doc.setTextColor(52, 211, 153);
      doc.text('⭐ Asistencia perfecta:', 18, finalY + 6);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(200, 200, 220);
      doc.text(perfectNames, 68, finalY + 6);

      // Never came
      const neverNames = data.students.filter(s => s.neverCame).map(s => s.name).join(', ') || 'Ninguno';
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(248, 113, 113);
      doc.text('⚠ No asistieron en el mes:', 18, finalY + 12);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(200, 200, 220);
      doc.text(neverNames, 78, finalY + 12);
    }

    // ── Footer ───────────────────────────────────────────────────────────────
    doc.setFontSize(7);
    doc.setTextColor(100, 100, 120);
    doc.setFont('helvetica', 'normal');
    const now = new Date().toLocaleString('es-AR');
    doc.text(`Generado el ${now} · Gema Company Workflow`, pageW / 2, pageH - 4, { align: 'center' });

    doc.save(`asistencia-${data.group.name.toLowerCase().replace(/\s+/g, '-')}-${data.monthName}-${data.year}.pdf`);
    setGenerating(false);
  }

  return (
    <div className={`container ${styles.page}`}>
      <div className="breadcrumb">
        <Link href="/dashboard">Dashboard</Link>
        <span className="breadcrumb-sep">›</span>
        <Link href={`/groups/${groupId}/attendance`}>Asistencia</Link>
        <span className="breadcrumb-sep">›</span>
        <span>Exportar PDF</span>
      </div>

      <div className={styles.header}>
        <h1 className={styles.title}>
          Exportar Reporte <span className="text-gradient">Mensual</span>
        </h1>
        <p className={styles.subtitle}>Generá el PDF de asistencia para enviar al administrador</p>
      </div>

      {/* Controls */}
      <div className={`card ${styles.controls}`}>
        <div className={styles.selects}>
          <div className={styles.selectGroup}>
            <label className={styles.selectLabel}>Mes</label>
            <select
              className={`input ${styles.select}`}
              value={month}
              onChange={e => setMonth(parseInt(e.target.value))}
            >
              {MONTH_NAMES.map((name, i) => (
                <option key={i} value={i + 1}>{name}</option>
              ))}
            </select>
          </div>
          <div className={styles.selectGroup}>
            <label className={styles.selectLabel}>Año</label>
            <select
              className={`input ${styles.select}`}
              value={year}
              onChange={e => setYear(parseInt(e.target.value))}
            >
              {[2024, 2025, 2026, 2027].map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          <button
            id="fetch-report-btn"
            className="btn btn-primary"
            onClick={fetchData}
            disabled={loading}
          >
            {loading ? (
              <><div className="spinner" style={{ width: 16, height: 16, borderWidth: 2, borderTopColor: 'white' }} /> Cargando...</>
            ) : (
              <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg> Ver reporte</>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className={styles.errorMsg}>{error}</div>
      )}

      {/* Preview */}
      {data && (
        <div className={`card ${styles.preview} animate-fade-in`}>
          <div className={styles.previewHeader}>
            <div>
              <h2 className={styles.previewTitle}>{data.group.name} – {data.monthName} {data.year}</h2>
              <p className={styles.previewSub}>Profe {data.teacher.name} · {data.classDates.length} clases en el mes</p>
            </div>
            <button
              id="generate-pdf-btn"
              className="btn btn-primary"
              onClick={generatePDF}
              disabled={generating || data.students.length === 0}
            >
              {generating ? (
                <><div className="spinner" style={{ width: 16, height: 16, borderWidth: 2, borderTopColor: 'white' }} /> Generando PDF...</>
              ) : (
                <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> Descargar PDF</>
              )}
            </button>
          </div>

          {data.students.length === 0 ? (
            <p className={styles.noData}>No hay datos de asistencia para este mes.</p>
          ) : (
            <>
              {/* Summary stats */}
              <div className={styles.summaryGrid}>
                <div className={`${styles.summaryCard} ${styles.purple}`}>
                  <span className={styles.summaryNum}>{data.students.length}</span>
                  <span className={styles.summaryLabel}>Alumnos</span>
                </div>
                <div className={`${styles.summaryCard} ${styles.blue}`}>
                  <span className={styles.summaryNum}>{data.classDates.length}</span>
                  <span className={styles.summaryLabel}>Clases</span>
                </div>
                <div className={`${styles.summaryCard} ${styles.green}`}>
                  <span className={styles.summaryNum}>{data.students.filter(s => s.perfect).length}</span>
                  <span className={styles.summaryLabel}>Asistencia perfecta</span>
                </div>
                <div className={`${styles.summaryCard} ${styles.red}`}>
                  <span className={styles.summaryNum}>{data.students.filter(s => s.neverCame).length}</span>
                  <span className={styles.summaryLabel}>No vinieron</span>
                </div>
              </div>

              {/* Table preview */}
              <div className={styles.tableWrapper}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Alumno/a</th>
                      {data.classDates.map(d => {
                        const date = new Date(d + 'T12:00:00');
                        return <th key={d}>{date.getDate()}/{date.getMonth() + 1}</th>;
                      })}
                      <th>Asist.</th>
                      <th>Faltas</th>
                      <th>%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.students.map((student, idx) => (
                      <tr key={student.id} className={student.perfect ? styles.perfectRow : student.neverCame ? styles.neverRow : ''}>
                        <td>{idx + 1}</td>
                        <td className={styles.nameCell}>
                          {student.name}
                          {student.perfect && <span className={styles.star}>⭐</span>}
                        </td>
                        {data.classDates.map(d => (
                          <td key={d} className={student.attendanceByDate[d] ? styles.present : styles.absent}>
                            {student.attendanceByDate[d] ? '✓' : '✗'}
                          </td>
                        ))}
                        <td className={styles.numCell}>{student.attended}</td>
                        <td className={styles.numCell}>{student.absences}</td>
                        <td className={`${styles.numCell} ${styles.pctCell}`}
                            style={{ color: student.percentage === 100 ? 'var(--success)' : student.percentage === 0 ? 'var(--danger)' : 'var(--text-primary)' }}>
                          {student.percentage}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Highlights */}
              <div className={styles.highlights}>
                <div className={styles.highlight}>
                  <span className={styles.hlIcon}>⭐</span>
                  <div>
                    <span className={styles.hlLabel}>Asistencia perfecta:</span>
                    <span className={styles.hlNames}>
                      {data.students.filter(s => s.perfect).map(s => s.name).join(', ') || 'Ninguno'}
                    </span>
                  </div>
                </div>
                <div className={styles.highlight}>
                  <span className={styles.hlIcon}>⚠️</span>
                  <div>
                    <span className={styles.hlLabel}>No vinieron este mes:</span>
                    <span className={styles.hlNames}>
                      {data.students.filter(s => s.neverCame).map(s => s.name).join(', ') || 'Ninguno'}
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
