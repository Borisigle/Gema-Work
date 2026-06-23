'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { Choreo } from '@/lib/data';
import styles from './choreo.module.css';

interface Props {
  choreo: Choreo;
  groupId: string;
  color: string;
}

const SPEED_OPTIONS = [0.5, 0.75, 1, 1.25, 1.5, 2];

export default function ChoreoClient({ choreo, groupId, color }: Props) {
  const [activeTab, setActiveTab] = useState<'player' | 'notes'>('player');
  const [currentSongIdx, setCurrentSongIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [speed, setSpeed] = useState(1);
  const [notes, setNotes] = useState('');
  const [notesStatus, setNotesStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [audioError, setAudioError] = useState(false);

  const audioRef = useRef<HTMLAudioElement>(null);
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  const currentSong = choreo.songs[currentSongIdx];

  // Load notes on mount
  useEffect(() => {
    fetch(`/api/choreos/${choreo.id}/notes`)
      .then(r => r.json())
      .then(data => {
        if (data.notes?.content) setNotes(data.notes.content);
      })
      .catch(() => {});
  }, [choreo.id]);

  // Audio event listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onDurationChange = () => setDuration(audio.duration);
    const onEnded = () => {
      if (currentSongIdx < choreo.songs.length - 1) {
        setCurrentSongIdx(i => i + 1);
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
  }, [currentSongIdx, choreo.songs.length]);

  // Handle song change
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    setCurrentTime(0);
    setDuration(0);
    setAudioError(false);
    audio.load();
    if (isPlaying) audio.play().catch(() => {});
  }, [currentSongIdx]);

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
      audio.play().then(() => setIsPlaying(true)).catch(() => setAudioError(true));
    }
  }

  function seek(e: React.MouseEvent<HTMLDivElement>) {
    const audio = audioRef.current;
    const bar = progressRef.current;
    if (!audio || !bar || !duration) return;
    const rect = bar.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    audio.currentTime = ratio * duration;
  }

  function prevSong() {
    if (currentSongIdx > 0) setCurrentSongIdx(i => i - 1);
  }

  function nextSong() {
    if (currentSongIdx < choreo.songs.length - 1) setCurrentSongIdx(i => i + 1);
  }

  function formatTime(s: number) {
    if (!isFinite(s)) return '0:00';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
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

  return (
    <div className={styles.choreoLayout} style={{ '--color': color } as React.CSSProperties}>
      {/* Hidden audio element */}
      <audio ref={audioRef} preload="metadata">
        <source src={`/audio/${currentSong.file}`} />
      </audio>

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
      </div>

      {/* Player tab */}
      {activeTab === 'player' && (
        <div className={`card ${styles.playerCard} animate-fade-in`}>
          {/* Now playing info */}
          <div className={styles.nowPlaying}>
            <div className={styles.albumArt}>
              <div className={`${styles.disc} ${isPlaying ? styles.spinning : ''}`}>
                💎
              </div>
            </div>
            <div className={styles.songInfo}>
              <div className={styles.songBadge}>
                {currentSongIdx + 1} / {choreo.songs.length}
              </div>
              <h2 className={styles.songTitle}>{currentSong.title}</h2>
              <p className={styles.choreoNameSmall}>{choreo.name}</p>
              {audioError && (
                <p className={styles.audioError}>
                  ⚠️ Archivo de audio no encontrado. Subí el MP3 a <code>/public/audio/{currentSong.file}</code>
                </p>
              )}
            </div>
          </div>

          {/* Progress bar */}
          <div className={styles.progressSection}>
            <span className={styles.timeLabel}>{formatTime(currentTime)}</span>
            <div
              ref={progressRef}
              className={styles.progressBar}
              onClick={seek}
              role="slider"
              aria-label="Progreso de reproducción"
            >
              <div className={styles.progressFill} style={{ width: `${progress}%` }} />
              <div className={styles.progressThumb} style={{ left: `${progress}%` }} />
            </div>
            <span className={styles.timeLabel}>{formatTime(duration)}</span>
          </div>

          {/* Controls */}
          <div className={styles.controls}>
            <button
              id="prev-song-btn"
              className={`btn btn-ghost ${styles.controlBtn}`}
              onClick={prevSong}
              disabled={currentSongIdx === 0}
              title="Anterior"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="19 20 9 12 19 4 19 20"/><line x1="5" y1="19" x2="5" y2="5" strokeWidth="2" stroke="currentColor" fill="none"/>
              </svg>
            </button>

            <button
              id="play-pause-btn"
              className={styles.playBtn}
              onClick={togglePlay}
              title={isPlaying ? 'Pausar' : 'Reproducir'}
            >
              {isPlaying ? (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>
                </svg>
              ) : (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="5 3 19 12 5 21 5 3"/>
                </svg>
              )}
            </button>

            <button
              id="next-song-btn"
              className={`btn btn-ghost ${styles.controlBtn}`}
              onClick={nextSong}
              disabled={currentSongIdx === choreo.songs.length - 1}
              title="Siguiente"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5 4 15 12 5 20 5 4"/><line x1="19" y1="5" x2="19" y2="19" strokeWidth="2" stroke="currentColor" fill="none"/>
              </svg>
            </button>
          </div>

          {/* Speed & Volume */}
          <div className={styles.extras}>
            {/* Playback speed */}
            <div className={styles.extraGroup}>
              <span className={styles.extraLabel}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                </svg>
                Velocidad
              </span>
              <div className={styles.speedBtns}>
                {SPEED_OPTIONS.map(s => (
                  <button
                    key={s}
                    id={`speed-${s}x`}
                    className={`${styles.speedBtn} ${speed === s ? styles.speedActive : ''}`}
                    onClick={() => setSpeed(s)}
                  >
                    {s}x
                  </button>
                ))}
              </div>
            </div>

            {/* Volume */}
            <div className={styles.extraGroup}>
              <span className={styles.extraLabel}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                  <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
                </svg>
                Volumen
              </span>
              <input
                id="volume-slider"
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={volume}
                onChange={e => setVolume(parseFloat(e.target.value))}
                className={styles.volumeSlider}
              />
              <span className={styles.volumeVal}>{Math.round(volume * 100)}%</span>
            </div>
          </div>

          {/* Song list */}
          {choreo.songs.length > 1 && (
            <div className={styles.songList}>
              <h3 className={styles.songListTitle}>Canciones</h3>
              {choreo.songs.map((song, idx) => (
                <button
                  key={idx}
                  id={`song-item-${idx}`}
                  className={`${styles.songItem} ${currentSongIdx === idx ? styles.songActive : ''}`}
                  onClick={() => { setCurrentSongIdx(idx); setIsPlaying(false); }}
                >
                  <span className={styles.songItemNum}>{idx + 1}</span>
                  <span className={styles.songItemName}>{song.title}</span>
                  {currentSongIdx === idx && isPlaying && (
                    <span className={styles.playingIndicator}>
                      <span /><span /><span />
                    </span>
                  )}
                </button>
              ))}
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
    </div>
  );
}
