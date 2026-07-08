'use client';

import { useState } from 'react';
import CloudinaryUpload from './CloudinaryUpload';

interface Props {
  groupId: string;
  teacherId: string;
  color: string;
  onCreated: () => void;
  onCancel: () => void;
}

export default function NewChoreoForm({ groupId, teacherId, color, onCreated, onCancel }: Props) {
  const [name, setName] = useState('');
  const [songs, setSongs] = useState<{ title: string; file: string }[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function handleUpload(url: string, fileName: string) {
    const title = name.trim() || fileName.replace(/\.[^.]+$/, '');
    setSongs(prev => [...prev, { title, file: url }]);
  }

  async function handleSave() {
    if (!name.trim()) {
      setError('Poné un nombre para la coreografía');
      return;
    }
    if (songs.length === 0) {
      setError('Subí al menos una canción');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/choreos/custom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupId, teacherId, name: name.trim(), songs }),
      });
      if (!res.ok) throw new Error('failed');
      onCreated();
    } catch {
      setError('No se pudo guardar. Probá de nuevo.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ padding: 20, border: '2px dashed var(--border)', borderRadius: 8, background: 'rgba(255,255,255,0.5)' }}>
      <h3 style={{ margin: '0 0 16px', fontFamily: 'var(--font-retro)', fontSize: 18 }}>
        Nueva coreografía
      </h3>

      <div style={{ marginBottom: 12 }}>
        <label style={{ display: 'block', fontSize: 13, color: 'var(--text-muted)', marginBottom: 4, fontFamily: 'var(--font-retro)' }}>
          Nombre
        </label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Ej: Venom"
          style={{
            width: '100%',
            padding: '8px 12px',
            border: '2px solid var(--border)',
            background: 'white',
            fontFamily: 'var(--font-retro)',
            fontSize: 16,
            boxSizing: 'border-box',
          }}
        />
      </div>

      <div style={{ marginBottom: 12 }}>
        <label style={{ display: 'block', fontSize: 13, color: 'var(--text-muted)', marginBottom: 4, fontFamily: 'var(--font-retro)' }}>
          Canción (MP3)
        </label>
        <CloudinaryUpload
          accept=".mp3,audio/*"
          onUpload={handleUpload}
          label={songs.length > 0 ? `+ Otra canción (${songs.length} subida${songs.length > 1 ? 's' : ''})` : 'Subir MP3'}
          className="btn btn-secondary"
        />
        {songs.length > 0 && (
          <div style={{ marginTop: 8, fontSize: 13, color: 'var(--text-muted)', fontFamily: 'var(--font-retro)' }}>
            {songs.map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <span>🎵 {s.title}</span>
                <button
                  onClick={() => setSongs(prev => prev.filter((_, j) => j !== i))}
                  style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: 14 }}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {error && (
        <p style={{ color: 'var(--danger)', fontSize: 14, fontFamily: 'var(--font-retro)', marginBottom: 12 }}>
          {error}
        </p>
      )}

      <div style={{ display: 'flex', gap: 8 }}>
        <button
          className="btn btn-primary"
          onClick={handleSave}
          disabled={saving}
          style={{ '--color': color } as React.CSSProperties}
        >
          {saving ? 'Guardando...' : 'Guardar coreo'}
        </button>
        <button className="btn btn-ghost" onClick={onCancel}>
          Cancelar
        </button>
      </div>
    </div>
  );
}
