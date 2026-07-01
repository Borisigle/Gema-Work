'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import styles from './login.module.css';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Error al iniciar sesion');
        setLoading(false);
        return;
      }

      router.push('/dashboard');
      router.refresh();
    } catch {
      setError('Error de conexion. Intenta de nuevo.');
      setLoading(false);
    }
  }

  return (
    <div className={styles.loginPage}>
      <div className={styles.sticker1}>✿</div>
      <div className={styles.sticker2}>♡</div>
      <div className={styles.sticker3}>⭐</div>
      <div className={styles.sticker4}>❀</div>

      <div className={`window ${styles.loginCard} animate-scale-in`}>
        <div className="window-titlebar">
          <div className="window-titlebar-text">♡ gema_company.exe ♡</div>
          <div className="window-titlebar-dots">
            <button className="window-dot window-dot-yellow" />
            <button className="window-dot window-dot-green" />
            <button className="window-dot window-dot-pink" />
          </div>
        </div>

        <div className="window-body">
          <div className={styles.logo}>
            <img src="/logo.png" alt="Gema Logo" className={styles.logoImg} />
            <span className={styles.logoText}>GEMA COMPANY</span>
          </div>

          <div className={styles.loginHeader}>
            <h1 className={styles.title}>Bienvenida/o</h1>
            <p className={styles.subtitle}>Ingresa con tu usuario y contraseña</p>
          </div>

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="username">Usuario</label>
              <div className={styles.inputWrapper}>
                <span className={styles.inputIcon}>👤</span>
                <input
                  id="username"
                  type="text"
                  className={`input ${styles.input}`}
                  placeholder="ej: cami"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  autoComplete="username"
                  required
                />
              </div>
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="password">Contraseña</label>
              <div className={styles.inputWrapper}>
                <span className={styles.inputIcon}>🔒</span>
                <input
                  id="password"
                  type="password"
                  className={`input ${styles.input}`}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
              </div>
            </div>

            {error && (
              <div className={styles.errorMsg}>
                <span>⚠️</span> {error}
              </div>
            )}

            <button
              id="login-btn"
              type="submit"
              className={`btn btn-primary btn-lg ${styles.submitBtn}`}
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
                  Ingresando...
                </>
              ) : (
                <>
                  Ingresar ✨
                </>
              )}
            </button>
          </form>

          <p className={styles.footer}>
            Si olvidaste tu contraseña, contacta al administrador.
          </p>
        </div>
      </div>
    </div>
  );
}
