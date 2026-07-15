'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { Choreo } from '@/lib/data';
import VestuarioGallery from '@/components/VestuarioGallery';
import CloudinaryUpload from '@/components/CloudinaryUpload';
import styles from './choreo.module.css';

interface Props {
  choreo: Choreo;
  groupId: string;
  color: string;
  groupName: string;
  initialSong: { title: string; file: string; addedSongId?: string } | null;
}

const SPEED_OPTIONS = [0.5, 0.75, 1, 1.25, 1.5, 2];

export default function ChoreoClient({ choreo, groupId, color, groupName, initialSong }: Props) {
  const [activeTab, setActiveTab] = useState<'player' | 'notes' | 'sections' | 'vestuario'>('player');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [speed, setSpeed] = useState(1);
  const [notes, setNotes] = useState('');
  const [notesStatus, setNotesStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [audioError, setAudioError] = useState(false);
  const [loopSong, setLoopSong] = useState(false);

  // Current song — initialized from server, no client fetch needed
  const [currentSong, setCurrentSong] = useState(initialSong);

  // Remix name editing (inline, no prompt)
  const [isEditingSongName, setIsEditingSongName] = useState(false);
  const [songNameInput, setSongNameInput] = useState('');
  const [songNameStatus, setSongNameStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  // Nombre editable de la coreografía
  const [choreoName, setChoreoName] = useState(choreo.name);
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(choreo.name);
  const [nameStatus, setNameStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  // Secciones de práctica (loop sections)
  interface LoopSection {
    id: string;
    choreoId: string;
    songFile: string;
    label: string;
    startSec: number;
    endSec: number;
  }
  const [sections, setSections] = useState<LoopSection[]>([]);
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const [isAddingSection, setIsAddingSection] = useState(false);
  const [sectionLabel, setSectionLabel] = useState('');
  const [startMin, setStartMin] = useState('0');
  const [startSec, setStartSec] = useState('00');
  const [endMin, setEndMin] = useState('0');
  const [endSec, setEndSec] = useState('00');
  const [sectionError, setSectionError] = useState('');
  const [savingSection, setSavingSection] = useState(false);
  const activeSectionRef = useRef<LoopSection | null>(null);

  const audioRef = useRef<HTMLAudioElement>(null);
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const dragRatioRef = useRef(0);

  const songFile = currentSong?.file || choreo.songs[0]?.file || '';

  // Load notes on mount
  useEffect(() => {
    fetch(`/api/choreos/${choreo.id}/notes`)
      .then(r => r.json())
      .then(data => {
        if (data.notes?.content) setNotes(data.notes.content);
      })
      .catch(() => {});
  }, [choreo.id]);

  // Load practice sections on mount
  useEffect(() => {
    fetch(`/api/choreos/${choreo.id}/sections`)
      .then(r => r.json())
      .then(data => setSections(data.sections || []))
      .catch(() => {});
  }, [choreo.id]);

  // Audio event listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !songFile) return;

    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      const section = activeSectionRef.current;
      if (section && audio.currentTime >= section.endSec) {
        audio.pause();
        audio.currentTime = section.endSec;
        setIsPlaying(false);
      }
    };
    const onDurationChange = () => setDuration(audio.duration);
    const onEnded = () => {
      if (loopSong) {
        audio.currentTime = 0;
        audio.play().catch(() => {});
      } else {
        setIsPlaying(false);
        setCurrentTime(0);
      }
    };
    const onError = () => setAudioError(true);
    const onCanPlay = () => setAudioError(false);

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('durationchange', onDurationChange);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('error', onError);
    audio.addEventListener('canplay', onCanPlay);

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('durationchange', onDurationChange);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('error', onError);
      audio.removeEventListener('canplay', onCanPlay);
    };
  }, [songFile, loopSong]);

  // Handle song change
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    exitSectionMode();
    setCurrentTime(0);
    setDuration(0);
    setAudioError(false);
    audio.load();
    if (isPlaying) audio.play().catch(() => {});
  }, [songFile]);

  // Sync volume & speed
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = volume;
    audio.playbackRate = speed;
  }, [volume, speed]);

  function togglePlay() {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      const section = activeSectionRef.current;
      if (section && audio.currentTime >= section.endSec - 0.15) {
        audio.currentTime = section.startSec;
      }
      audio.play().then(() => setIsPlaying(true)).catch(() => setAudioError(true));
    }
  }

  function seekFromEvent(clientX: number) {
    const audio = audioRef.current;
    const bar = progressRef.current;
    if (!audio || !bar || !duration) return;
    const rect = bar.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    audio.currentTime = ratio * duration;
  }

  function seek(e: React.MouseEvent<HTMLDivElement>) {
    exitSectionMode();
    seekFromEvent(e.clientX);
  }

  function handleDragStart(e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault();
    isDraggingRef.current = true;
    exitSectionMode();
    const bar = progressRef.current;
    if (!bar) return;

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const rect = bar.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    dragRatioRef.current = ratio;

    // Update DOM directly during drag (no state updates)
    const fill = bar.querySelector('div:first-child') as HTMLElement;
    const thumb = bar.querySelector('div:last-child') as HTMLElement;
    if (fill) fill.style.width = `${ratio * 100}%`;
    if (thumb) thumb.style.left = `${ratio * 100}%`;

    function handleMove(ev: MouseEvent | TouchEvent) {
      if (!isDraggingRef.current) return;
      const cx = 'touches' in ev ? ev.touches[0].clientX : ev.clientX;
      const r = Math.max(0, Math.min(1, (cx - rect.left) / rect.width));
      dragRatioRef.current = r;
      if (fill) fill.style.width = `${r * 100}%`;
      if (thumb) thumb.style.left = `${r * 100}%`;
    }

    function handleEnd() {
      isDraggingRef.current = false;
      const audio = audioRef.current;
      if (audio && duration) {
        audio.currentTime = dragRatioRef.current * duration;
      }
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleEnd);
      document.removeEventListener('touchmove', handleMove);
      document.removeEventListener('touchend', handleEnd);
    }

    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleEnd);
    document.addEventListener('touchmove', handleMove, { passive: true });
    document.addEventListener('touchend', handleEnd);
  }

  function formatTime(s: number) {
    if (!isFinite(s)) return '0:00';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  }

  // Parsea "0:30" o "30" a segundos. Devuelve null si el formato es invalido.
  function parseMmSs(value: string): number | null {
    const trimmed = value.trim();
    if (!trimmed) return null;
    if (trimmed.includes(':')) {
      const [mStr, sStr] = trimmed.split(':');
      const m = parseInt(mStr, 10);
      const s = parseInt(sStr, 10);
      if (isNaN(m) || isNaN(s) || s < 0 || s > 59) return null;
      return m * 60 + s;
    }
    const onlySec = parseFloat(trimmed);
    return isNaN(onlySec) ? null : onlySec;
  }

  const sectionsForCurrentSong = sections.filter(s => s.songFile === songFile);

  function playSection(section: { id: string; startSec: number; endSec: number }) {
    const audio = audioRef.current;
    if (!audio) return;
    activeSectionRef.current = sections.find(s => s.id === section.id) || null;
    setActiveSectionId(section.id);
    setActiveTab('player');
    audio.currentTime = section.startSec;
    audio.play().then(() => setIsPlaying(true)).catch(() => setAudioError(true));
  }

  function exitSectionMode() {
    activeSectionRef.current = null;
    setActiveSectionId(null);
  }

  function openAddSection() {
    setIsAddingSection(true);
    setSectionLabel('');
    const m = Math.floor(currentTime / 60);
    const s = Math.floor(currentTime % 60);
    setStartMin(String(m));
    setStartSec(s.toString().padStart(2, '0'));
    setEndMin('0');
    setEndSec('00');
    setSectionError('');
  }

  function cancelAddSection() {
    setIsAddingSection(false);
    setSectionError('');
  }

  async function saveSection() {
    const sMin = parseInt(startMin, 10);
    const sSec = parseInt(startSec, 10);
    const eMin = parseInt(endMin, 10);
    const eSec = parseInt(endSec, 10);

    if (isNaN(sMin) || isNaN(sSec) || isNaN(eMin) || isNaN(eSec) ||
        sSec < 0 || sSec > 59 || eSec < 0 || eSec > 59) {
      setSectionError('Ingresá minutos y segundos válidos');
      return;
    }

    const startSecTotal = sMin * 60 + sSec;
    const endSecTotal = eMin * 60 + eSec;

    if (endSecTotal <= startSecTotal) {
      setSectionError('El final tiene que ser mayor al inicio');
      return;
    }

    setSavingSection(true);
    setSectionError('');
    try {
      const res = await fetch(`/api/choreos/${choreo.id}/sections`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          songFile: songFile,
          label: sectionLabel.trim() || 'Sección',
          startSec: startSecTotal,
          endSec: endSecTotal,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'No se pudo guardar');
      }
      const data = await res.json();
      setSections(prev => [...prev, data.section]);
      setIsAddingSection(false);
    } catch (err: any) {
      setSectionError(err.message || 'No se pudo guardar la sección');
    } finally {
      setSavingSection(false);
    }
  }

  async function removeSection(sectionId: string) {
    const ok = window.confirm('¿Borrar esta sección?');
    if (!ok) return;

    if (activeSectionId === sectionId) exitSectionMode();
    setSections(prev => prev.filter(s => s.id !== sectionId));

    try {
      await fetch(`/api/choreos/${choreo.id}/sections`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sectionId }),
      });
    } catch {
      // si falla, no hacemos rollback visual para no confundir; el profe puede reintentar
    }
  }

  // Auto-save notes with debounce
  function handleNotesChange(val: string) {
    setNotes(val);
    setNotesStatus('idle');
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      setNotesStatus('saving');
      await fetch(`/api/choreos/${choreo.id}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: val }),
      });
      setNotesStatus('saved');
      setTimeout(() => setNotesStatus('idle'), 2000);
    }, 1500);
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  function startEditingName() {
    setNameInput(choreoName);
    setIsEditingName(true);
    setNameStatus('idle');
  }

  function cancelEditingName() {
    setIsEditingName(false);
    setNameInput(choreoName);
  }

  async function saveName() {
    const trimmed = nameInput.trim();
    if (!trimmed) return;

    setNameStatus('saving');
    try {
      const res = await fetch(`/api/choreos/${choreo.id}/name`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmed }),
      });
      if (!res.ok) throw new Error('save failed');
      setChoreoName(trimmed);
      setIsEditingName(false);
      setNameStatus('saved');
      setTimeout(() => setNameStatus('idle'), 2000);
    } catch {
      setNameStatus('error');
    }
  }

  async function handleDeleteSong() {
    if (!currentSong) return;
    const isCustom = !!currentSong.addedSongId;
    const msg = isCustom
      ? `¿Borrar el remix "${currentSong.title}"?`
      : `¿Ocultar el remix "${currentSong.title}"? Ya no aparecerá en esta coreo.`;
    if (!confirm(msg)) return;

    try {
      if (currentSong.file.startsWith('http')) {
        await fetch('/api/choreos/cloudinary-delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: currentSong.file }),
        });
      }

      const res = await fetch(`/api/choreos/${choreo.id}/songs`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(isCustom
          ? { addedSongId: currentSong.addedSongId }
          : { songFile: currentSong.file }
        ),
      });

      if (!res.ok) {
        console.error('Delete failed:', await res.text());
        return;
      }

      setCurrentSong(null);
    } catch (err) {
      console.error('Error deleting song:', err);
    }
  }

  // Pending upload URL (waiting for name)
  const [pendingUploadUrl, setPendingUploadUrl] = useState<string | null>(null);

  function handleAddSong(url: string) {
    // Show inline name editor instead of prompt()
    setPendingUploadUrl(url);
    setSongNameInput('');
    setIsEditingSongName(true);
    setSongNameStatus('idle');
  }

  async function saveSongName() {
    const title = songNameInput.trim();
    if (!title || !pendingUploadUrl) return;

    setSongNameStatus('saving');
    try {
      const res = await fetch(`/api/choreos/${choreo.id}/songs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, file: pendingUploadUrl }),
      });
      const data = await res.json();
      if (data.song) {
        setCurrentSong({ title: data.song.title, file: data.song.file, addedSongId: data.song.id });
        setSongNameStatus('saved');
        setTimeout(() => {
          setIsEditingSongName(false);
          setPendingUploadUrl(null);
          setSongNameStatus('idle');
        }, 1000);
      }
    } catch (err) {
      console.error('[Song] Save error:', err);
      setSongNameStatus('idle');
    }
  }

  function cancelSongName() {
    setIsEditingSongName(false);
    setPendingUploadUrl(null);
    setSongNameStatus('idle');
  }

  function handleSongNameKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') saveSongName();
    if (e.key === 'Escape') cancelSongName();
  }

  function handleNameKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') saveName();
    if (e.key === 'Escape') cancelEditingName();
  }

  return (
    <div className={styles.choreoLayout} style={{ '--color': color } as React.CSSProperties}>
      {/* Header: breadcrumb + nombre editable */}
      <div className={styles.header}>
        {isEditingName ? (
          <div className={styles.nameEditRow}>
            <input
              id="choreo-name-input"
              className={styles.nameInput}
              value={nameInput}
              onChange={e => setNameInput(e.target.value)}
              onKeyDown={handleNameKeyDown}
              autoFocus
              maxLength={60}
            />
            <button
              id="save-choreo-name-btn"
              className="btn btn-primary btn-sm"
              onClick={saveName}
              disabled={nameStatus === 'saving' || !nameInput.trim()}
            >
              {nameStatus === 'saving' ? '...' : 'Guardar'}
            </button>
            <button className="btn btn-ghost btn-sm" onClick={cancelEditingName}>
              Cancelar
            </button>
          </div>
        ) : (
          <div className={styles.nameRow}>
            <h1 className={styles.title}>
              <span className="text-gradient">{choreoName}</span>
            </h1>
            <button
              id="edit-choreo-name-btn"
              className={`btn btn-ghost btn-sm ${styles.editNameBtn}`}
              onClick={startEditingName}
              title="Editar nombre"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </button>
            {nameStatus === 'saved' && <span className={styles.nameSavedMsg}>✓ Guardado</span>}
            {nameStatus === 'error' && <span className={styles.nameErrorMsg}>Error al guardar</span>}
          </div>
        )}
        <p className={styles.subtitle}>
          {groupName}
        </p>
      </div>

      {/* Hidden audio element */}
      {songFile && (
        <audio ref={audioRef} preload="metadata">
          <source src={songFile.startsWith('http') ? songFile : `/audio/${songFile}`} />
        </audio>
      )}

      {/* Tabs */}
      <div className={styles.tabs}>
        <button
          id="tab-player"
          className={`${styles.tab} ${activeTab === 'player' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('player')}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <polygon points="10 8 16 12 10 16 10 8"/>
          </svg>
          Reproductor
        </button>
        <button
          id="tab-notes"
          className={`${styles.tab} ${activeTab === 'notes' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('notes')}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
            <line x1="10" y1="9" x2="8" y2="9"/>
          </svg>
          Notas
        </button>
        <button
          id="tab-sections"
          className={`${styles.tab} ${activeTab === 'sections' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('sections')}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="11" width="3" height="6"/>
            <rect x="10.5" y="7" width="3" height="10"/>
            <rect x="18" y="3" width="3" height="14"/>
          </svg>
          Secciones{sectionsForCurrentSong.length > 0 ? ` (${sectionsForCurrentSong.length})` : ''}
        </button>
        <button
          id="tab-vestuario"
          className={`${styles.tab} ${activeTab === 'vestuario' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('vestuario')}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
            <circle cx="8.5" cy="8.5" r="1.5"/>
            <polyline points="21 15 16 10 5 21"/>
          </svg>
          Vestuario
        </button>
      </div>

      {/* Player tab */}
      {activeTab === 'player' && (
        <div className={`card ${styles.playerCard} animate-fade-in`}>
          {currentSong ? (
            <>
              {/* Compact now playing */}
              <div className={styles.nowPlaying}>
                <div className={styles.albumArtSmall}>
                  <div className={`${styles.disc} ${isPlaying ? styles.spinning : ''}`}>💎</div>
                </div>
                <div className={styles.songInfo}>
                  <h2 className={styles.songTitle}>{currentSong.title}</h2>
                  <p className={styles.choreoNameSmall}>{choreoName}</p>
                  {activeSectionId && (
                    <div className={styles.activeSectionBadge}>
                      🔁 {sections.find(s => s.id === activeSectionId)?.label}
                      <button onClick={exitSectionMode} title="Salir de la sección">✕</button>
                    </div>
                  )}
                  {audioError && (
                    <p className={styles.audioError}>
                      ⚠️ Audio no encontrado: <code>{currentSong.file.startsWith('http') ? currentSong.file : `/public/audio/${currentSong.file}`}</code>
                    </p>
                  )}
                </div>
                <button className={styles.songDeleteBtn} onClick={handleDeleteSong} title="Borrar remix">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3 6 5 6 21 6"/>
                    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                    <path d="M10 11v6"/><path d="M14 11v6"/>
                  </svg>
                </button>
              </div>

              {/* Progress bar */}
              <div className={styles.progressSection}>
                <span className={styles.timeLabel}>{formatTime(currentTime)}</span>
                <div
                  ref={progressRef}
                  className={styles.progressBar}
                  onClick={seek}
                  onMouseDown={handleDragStart}
                  onTouchStart={handleDragStart}
                  role="slider"
                  aria-label="Progreso de reproducción"
                >
                  <div className={styles.progressFill} style={{ width: `${progress}%` }} />
                  {duration > 0 && sectionsForCurrentSong.map(s => (
                    <div
                      key={s.id}
                      className={styles.sectionMarker}
                      style={{
                        left: `${(s.startSec / duration) * 100}%`,
                        width: `${((s.endSec - s.startSec) / duration) * 100}%`,
                      }}
                      title={s.label}
                    />
                  ))}
                  <div className={styles.progressThumb} style={{ left: `${progress}%` }} />
                </div>
                <span className={styles.timeLabel}>{formatTime(duration)}</span>
              </div>

              {/* Controls + Speed + Volume */}
              <div className={styles.playerControls}>
                <div className={styles.transportBtns}>
                  <button className={styles.playBtnSmall} onClick={togglePlay} title={isPlaying ? 'Pausar' : 'Reproducir'}>
                    {isPlaying ? (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>
                      </svg>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <polygon points="5 3 19 12 5 21 5 3"/>
                      </svg>
                    )}
                  </button>
                  <button
                    className={`${styles.loopBtn} ${loopSong ? styles.loopActive : ''}`}
                    onClick={() => setLoopSong(l => !l)}
                    title={loopSong ? 'Desactivar loop' : 'Loop la canción'}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="17 1 21 5 17 9"/>
                      <path d="M3 11V9a4 4 0 0 1 4-4h14"/>
                      <polyline points="7 23 3 19 7 15"/>
                      <path d="M21 13v2a4 4 0 0 1-4 4H3"/>
                    </svg>
                  </button>
                </div>

                <div className={styles.speedBtns}>
                  {SPEED_OPTIONS.map(s => (
                    <button
                      key={s}
                      className={`${styles.speedBtn} ${speed === s ? styles.speedActive : ''}`}
                      onClick={() => setSpeed(s)}
                    >
                      {s}x
                    </button>
                  ))}
                </div>

                <div className={styles.volumeGroup}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                    <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
                  </svg>
                  <input type="range" min="0" max="1" step="0.05" value={volume} onChange={e => setVolume(parseFloat(e.target.value))} className={styles.volumeSlider} />
                </div>
              </div>

              {/* Quick sections */}
              {sectionsForCurrentSong.length > 0 && (
                <div className={styles.quickSections}>
                  <span className={styles.quickSectionsLabel}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="11" width="3" height="6"/><rect x="10.5" y="7" width="3" height="10"/><rect x="18" y="3" width="3" height="14"/>
                    </svg>
                    Secciones
                  </span>
                  <div className={styles.quickSectionBtns}>
                    {sectionsForCurrentSong.map(s => (
                      <button
                        key={s.id}
                        className={`${styles.quickSectionBtn} ${activeSectionId === s.id ? styles.quickSectionActive : ''}`}
                        onClick={() => playSection(s)}
                      >
                        <span className={styles.quickSectionName}>{s.label}</span>
                        <span className={styles.quickSectionTime}>{formatTime(s.startSec)}–{formatTime(s.endSec)}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Replace remix button */}
              {!isEditingSongName && (
                <div className={styles.addSongRow}>
                  <CloudinaryUpload
                    accept="audio/*"
                    onUpload={handleAddSong}
                    label="Reemplazar remix"
                    className="btn btn-secondary btn-sm"
                  />
                </div>
              )}
            </>
          ) : (
            /* No song state */
            <div className={styles.sinRemix}>
              {!isEditingSongName ? (
                <>
                  <p>Sin remix cargado</p>
                  <CloudinaryUpload
                    accept="audio/*"
                    onUpload={handleAddSong}
                    label="+ Agregar remix"
                    className="btn btn-secondary btn-sm"
                  />
                </>
              ) : (
                <p>Subiendo archivo...</p>
              )}
            </div>
          )}

          {/* Inline song name editor */}
          {isEditingSongName && (
            <div className={styles.addSongRow}>
              <input
                id="song-name-input"
                className={styles.songNameInput}
                value={songNameInput}
                onChange={e => setSongNameInput(e.target.value)}
                onKeyDown={handleSongNameKeyDown}
                placeholder="Nombre del remix"
                autoFocus
                maxLength={60}
              />
              <button
                className="btn btn-primary btn-sm"
                onClick={saveSongName}
                disabled={songNameStatus === 'saving' || !songNameInput.trim()}
              >
                {songNameStatus === 'saving' ? '...' : 'Guardar'}
              </button>
              <button className="btn btn-ghost btn-sm" onClick={cancelSongName}>
                Cancelar
              </button>
              {songNameStatus === 'saved' && <span className={styles.nameSavedMsg}>✓</span>}
            </div>
          )}
        </div>
      )}

      {/* Notes tab */}
      {activeTab === 'notes' && (
        <div className={`card ${styles.notesCard} animate-fade-in`}>
          <div className={styles.notesHeader}>
            <div>
              <h3 className={styles.notesTitle}>Notas y Observaciones</h3>
              <p className={styles.notesSub}>Las notas se guardan automáticamente</p>
            </div>
            <div className={styles.saveStatus}>
              {notesStatus === 'saving' && (
                <span className={styles.statusSaving}>
                  <div className="spinner" style={{ width: 12, height: 12, borderWidth: 1.5 }} />
                  Guardando...
                </span>
              )}
              {notesStatus === 'saved' && (
                <span className={styles.statusSaved}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  Guardado
                </span>
              )}
            </div>
          </div>

          <textarea
            id="choreo-notes"
            className={styles.notesArea}
            value={notes}
            onChange={e => handleNotesChange(e.target.value)}
            placeholder="Escribí acá tus notas, ideas, observaciones sobre esta coreografía...

Ejemplo:
- El puente del minuto 1:30 está sin terminar
- Revisar formación en la intro
- Música a 0.75x para practicar los pasos difíciles"
          />
        </div>
      )}

      {/* Sections tab */}
      {activeTab === 'sections' && (
        <div className={`card ${styles.sectionsCard} animate-fade-in`}>
          <div className={styles.sectionsCardHeader}>
            <div>
              <h3 className={styles.notesTitle}>Secciones de práctica</h3>
              <p className={styles.notesSub}>
                Marcá un fragmento de "{currentSong?.title}" para repasarlo en loop manual
              </p>
            </div>
            {!isAddingSection && (
              <button id="add-section-btn" className="btn btn-primary btn-sm" onClick={openAddSection}>
                + Nueva sección
              </button>
            )}
          </div>

          {isAddingSection && (
            <div className={styles.addSectionForm}>
              <input
                id="section-label-input"
                className={styles.sectionInput}
                placeholder="Nombre (ej: Estribillo)"
                value={sectionLabel}
                onChange={e => setSectionLabel(e.target.value)}
                maxLength={30}
                autoFocus
              />
              <div className={styles.sectionTimeGroup}>
                <span className={styles.timeLabel}>Inicio</span>
                <input
                  id="section-start-min"
                  className={styles.timeInput}
                  type="number"
                  min="0"
                  max="99"
                  value={startMin}
                  onChange={e => {
                    const v = e.target.value.replace(/\D/g, '').slice(0, 2);
                    setStartMin(v);
                    if (v.length === 2) document.getElementById('section-start-sec')?.focus();
                  }}
                />
                <span className={styles.timeColon}>:</span>
                <input
                  id="section-start-sec"
                  className={styles.timeInput}
                  type="number"
                  min="0"
                  max="59"
                  value={startSec}
                  onChange={e => {
                    const v = e.target.value.replace(/\D/g, '').slice(0, 2);
                    setStartSec(v);
                    if (v.length === 2) document.getElementById('section-end-min')?.focus();
                  }}
                />
              </div>
              <div className={styles.sectionTimeGroup}>
                <span className={styles.timeLabel}>Fin</span>
                <input
                  id="section-end-min"
                  className={styles.timeInput}
                  type="number"
                  min="0"
                  max="99"
                  value={endMin}
                  onChange={e => {
                    const v = e.target.value.replace(/\D/g, '').slice(0, 2);
                    setEndMin(v);
                    if (v.length === 2) document.getElementById('section-end-sec')?.focus();
                  }}
                />
                <span className={styles.timeColon}>:</span>
                <input
                  id="section-end-sec"
                  className={styles.timeInput}
                  type="number"
                  min="0"
                  max="59"
                  value={endSec}
                  onChange={e => {
                    const v = e.target.value.replace(/\D/g, '').slice(0, 2);
                    setEndSec(v);
                  }}
                />
              </div>
              <div className={styles.sectionFormActions}>
                <button
                  id="save-section-btn"
                  className="btn btn-primary btn-sm"
                  onClick={saveSection}
                  disabled={savingSection}
                >
                  {savingSection ? 'Guardando...' : 'Guardar sección'}
                </button>
                <button className="btn btn-ghost btn-sm" onClick={cancelAddSection}>
                  Cancelar
                </button>
              </div>
              {sectionError && <p className={styles.sectionError}>{sectionError}</p>}
            </div>
          )}

          {sectionsForCurrentSong.length === 0 && !isAddingSection ? (
            <div className={styles.sectionsEmpty}>
              <p>Todavía no hay secciones guardadas para este tema.</p>
              <p className={styles.sectionsEmptySub}>
                Usá "+ Nueva sección" para marcar, por ejemplo, el estribillo o un paso puntual.
              </p>
            </div>
          ) : (
            <div className={styles.sectionsList}>
              {sectionsForCurrentSong.map(s => (
                <div
                  key={s.id}
                  className={`${styles.sectionListItem} ${activeSectionId === s.id ? styles.sectionListItemActive : ''}`}
                >
                  <div className={styles.sectionListInfo}>
                    <span className={styles.sectionListLabel}>{s.label}</span>
                    <span className={styles.sectionListTime}>
                      {formatTime(s.startSec)} – {formatTime(s.endSec)}
                    </span>
                  </div>
                  <div className={styles.sectionListActions}>
                    <button
                      id={`section-btn-${s.id}`}
                      className="btn btn-secondary btn-sm"
                      onClick={() => playSection(s)}
                    >
                      {activeSectionId === s.id ? '▶ Repetir' : '▶ Practicar'}
                    </button>
                    <button
                      id={`section-delete-${s.id}`}
                      className={styles.sectionListDelete}
                      onClick={() => removeSection(s.id)}
                      title="Borrar sección"
                      aria-label="Borrar sección"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6"/>
                        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                        <path d="M10 11v6"/>
                        <path d="M14 11v6"/>
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Vestuario tab */}
      {activeTab === 'vestuario' && (
        <div className={`card ${styles.playerCard} animate-fade-in`}>
          <VestuarioGallery choreoId={choreo.id} />
        </div>
      )}
    </div>
  );
}
