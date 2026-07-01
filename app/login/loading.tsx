export default function LoginLoading() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <div className="spinner" style={{ width: 40, height: 40 }} />
        <div style={{ height: 14, width: 160, background: '#e8d8e0', borderRadius: 0 }} />
      </div>
    </div>
  );
}
