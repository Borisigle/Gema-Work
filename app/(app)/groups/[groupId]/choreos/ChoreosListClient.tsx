'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import NewChoreoForm from '@/components/NewChoreoForm';
import styles from './choreos.module.css';

interface CustomChoreo {
  id: string;
  groupId: string;
  teacherId: string;
  name: string;
  songs: { title: string; file: string }[];
}

interface HardcodedChoreo {
  id: string;
  name: string;
  songs: { title: string; file: string }[];
}

interface Props {
  groupId: string;
  teacherId: string;
  color: string;
  hardcodedChoreos: HardcodedChoreo[];
  nameOverrides: Record<string, string>;
}

export default function ChoreosListClient({ groupId, teacherId, color, hardcodedChoreos, nameOverrides }: Props) {
  const [customChoreos, setCustomChoreos] = useState<CustomChoreo[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [locallyHidden, setLocallyHidden] = useState<string[]>([]);

  function fetchCustom() {
    fetch(`/api/choreos/custom?groupId=${groupId}`)
      .then(r => r.json())
      .then(data => {
        setCustomChoreos(data.choreos || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }

  useEffect(() => {
    fetchCustom();
  }, [groupId]);

  const visibleHardcoded = hardcodedChoreos.filter(c => !locallyHidden.includes(c.id));
  const total = visibleHardcoded.length + customChoreos.length;

  async function handleDelete(id: string, name: string, songs: { file: string }[], isCustom: boolean) {
    if (!confirm(`¿Borrar la coreo "${name}"?`)) return;

    // Delete MP3s from Cloudinary
    for (const song of songs) {
      if (song.file.startsWith('http')) {
        await fetch('/api/choreos/cloudinary-delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: song.file }),
        });
      }
    }

    if (isCustom) {
      // Delete from custom choreos
      await fetch('/api/choreos/custom', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      setCustomChoreos(prev => prev.filter(c => c.id !== id));
    } else {
      // Hide hardcoded choreo
      await fetch('/api/choreos/hide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ choreoId: id }),
      });
      setLocallyHidden(prev => [...prev, id]);
    }
  }

  return (
    <>
      <div className={styles.headerRow}>
        <div>
          <p className={styles.subtitle}>
            {total} coreografía{total !== 1 ? 's' : ''} disponible{total !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => setShowForm(!showForm)}
          style={{ '--color': color } as React.CSSProperties}
        >
          {showForm ? 'Cancelar' : '+ Nueva coreo'}
        </button>
      </div>

      {showForm && (
        <NewChoreoForm
          groupId={groupId}
          teacherId={teacherId}
          color={color}
          onCreated={() => { setShowForm(false); fetchCustom(); }}
          onCancel={() => setShowForm(false)}
        />
      )}

      {total === 0 && !showForm ? (
        <div className={`card ${styles.empty}`}>
          <div className={styles.emptyIcon}>💎</div>
          <h3>Sin coreografías</h3>
          <p>Creá una coreo nueva con el botón de arriba.</p>
        </div>
      ) : (
        <div className={`${styles.choreoGrid} stagger`} style={{ marginTop: 16 }}>
          {/* Hardcoded choreos */}
          {visibleHardcoded.map((choreo, idx) => (
            <div key={choreo.id} className={`${styles.choreoCard} card animate-fade-in`} style={{ '--color': color } as React.CSSProperties}>
              <Link
                href={`/choreos/${choreo.id}?groupId=${groupId}`}
                className={styles.choreoCardLink}
              >
                <div className={styles.cardNum}>
                  <span>{String(idx + 1).padStart(2, '0')}</span>
                </div>
                <div className={styles.cardContent}>
                  <h2 className={styles.choreoName}>{nameOverrides[choreo.id] || choreo.name}</h2>
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
                  </div>
                </div>
                <div className={styles.cardArrow}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </div>
              </Link>
              <button
                className={styles.deleteChoreoBtn}
                onClick={() => handleDelete(choreo.id, nameOverrides[choreo.id] || choreo.name, choreo.songs, false)}
                title="Borrar coreo"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                  <path d="M10 11v6"/><path d="M14 11v6"/>
                </svg>
              </button>
            </div>
          ))}

          {/* Custom choreos */}
          {customChoreos.map((choreo, idx) => (
            <div key={choreo.id} className={`${styles.choreoCard} card animate-fade-in`} style={{ '--color': color } as React.CSSProperties}>
              <Link
                href={`/choreos/${choreo.id}?groupId=${groupId}`}
                className={styles.choreoCardLink}
              >
                <div className={styles.cardNum}>
                  <span>{String(hardcodedChoreos.length + idx + 1).padStart(2, '0')}</span>
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
                    {choreo.songs.map((s, i) => (
                      <span key={i} className={styles.songTag}>🎵 {s.title}</span>
                    ))}
                  </div>
                </div>
                <div className={styles.cardArrow}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </div>
              </Link>
              <button
                className={styles.deleteChoreoBtn}
                onClick={() => handleDelete(choreo.id, choreo.name, choreo.songs, true)}
                title="Borrar coreo"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                  <path d="M10 11v6"/><path d="M14 11v6"/>
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
