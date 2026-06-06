// LoadingSpinner.jsx
export const LoadingSpinner = ({ size = 'sm', text }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
    <div className={`spinner ${size === 'lg' ? 'spinner-lg' : ''}`} />
    {text && <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{text}</span>}
  </div>
);

export const LoadingScreen = ({ text = 'Loading...' }) => (
  <div className="loading-screen">
    <div className="spinner spinner-lg" />
    <p>{text}</p>
  </div>
);

export default LoadingSpinner;
