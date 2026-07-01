export default function Loading() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '32px 24px' }}>
      <div style={{ height: 24, width: 200, background: '#e8d8e0', borderRadius: 0 }} />
      <div style={{ height: 14, width: 320, background: '#e8d8e0', borderRadius: 0 }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16, marginTop: 16 }}>
        {[1, 2, 3].map(i => (
          <div key={i} style={{ height: 180, background: '#f0e4ea', borderRadius: 0, border: '2px solid #d8c0cc' }} />
        ))}
      </div>
    </div>
  );
}
