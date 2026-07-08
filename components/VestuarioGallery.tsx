'use client';

import { useState, useEffect } from 'react';
import CloudinaryUpload from './CloudinaryUpload';
import styles from './VestuarioGallery.module.css';

interface Photo {
  id: string;
  choreoId: string;
  url: string;
  label: string;
  createdAt: string;
}

interface Props {
  choreoId: string;
}

export default function VestuarioGallery({ choreoId }: Props) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [label, setLabel] = useState('');
  const [lightbox, setLightbox] = useState<Photo | null>(null);

  useEffect(() => {
    fetch(`/api/choreos/${choreoId}/vestuario`)
      .then(r => r.json())
      .then(data => {
        setPhotos(data.photos || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [choreoId]);

  function handleUpload(url: string) {
    fetch(`/api/choreos/${choreoId}/vestuario`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, label: label.trim() || 'Vestuario' }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.photo) {
          setPhotos(prev => [...prev, data.photo]);
          setLabel('');
        }
      });
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Borrar esta foto?')) return;
    const photo = photos.find(p => p.id === id);
    await fetch(`/api/choreos/${choreoId}/vestuario`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, url: photo?.url }),
    });
    setPhotos(prev => prev.filter(p => p.id !== id));
    if (lightbox?.id === id) setLightbox(null);
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
        <div className="spinner" style={{ width: 24, height: 24 }} />
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      {/* Upload */}
      <div className={styles.uploadRow}>
        <input
          type="text"
          value={label}
          onChange={e => setLabel(e.target.value)}
          placeholder="Etiqueta (ej: Vestido rosa)"
          className={styles.labelInput}
        />
        <CloudinaryUpload
          accept="image/*"
          onUpload={handleUpload}
          label="Subir foto"
          className="btn btn-secondary"
        />
      </div>

      {/* Grid */}
      {photos.length === 0 ? (
        <div className={styles.empty}>
          <p>Todavía no hay fotos de vestuario.</p>
          <p>Subí fotos desde tu galería para tenerlas como referencia.</p>
        </div>
      ) : (
        <div className={styles.grid}>
          {photos.map(photo => (
            <div
              key={photo.id}
              className={styles.item}
              onClick={() => setLightbox(photo)}
            >
              <img src={photo.url} alt={photo.label} className={styles.img} loading="lazy" />
              <div className={styles.overlay}>
                <span className={styles.photoLabel}>{photo.label}</span>
                <button
                  className={styles.deleteBtn}
                  onClick={e => { e.stopPropagation(); handleDelete(photo.id); }}
                  title="Borrar"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div className={styles.lightbox} onClick={() => setLightbox(null)}>
          <div className={styles.lightboxContent} onClick={e => e.stopPropagation()}>
            <button className={styles.lightboxClose} onClick={() => setLightbox(null)}>✕</button>
            <img src={lightbox.url} alt={lightbox.label} className={styles.lightboxImg} />
            <div className={styles.lightboxLabel}>{lightbox.label}</div>
            <button
              className={styles.lightboxDelete}
              onClick={() => handleDelete(lightbox.id)}
            >
              Borrar foto
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
