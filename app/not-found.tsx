import Link from 'next/link';

export default function NotFound() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '16px',
      textAlign: 'center',
      padding: '24px',
    }}>
      <div style={{ fontSize: '64px' }}>💎</div>
      <h1 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '28px', fontWeight: 800 }}>
        Página no encontrada
      </h1>
      <p style={{ color: 'rgba(240,240,255,0.6)', maxWidth: '320px' }}>
        Esta página no existe o no tenés acceso a ella.
      </p>
      <Link href="/dashboard" className="btn btn-primary">
        Volver al Dashboard
      </Link>
    </div>
  );
}
