// Badge.jsx — Priority / status badges
const priorityMap = {
  critical: 'badge-critical',
  high:     'badge-high',
  medium:   'badge-medium',
  low:      'badge-low',
  success:  'badge-success',
  warning:  'badge-warning',
  danger:   'badge-danger',
  info:     'badge-info',
  primary:  'badge-primary',
};

const Badge = ({ type = 'medium', label, dot = false }) => (
  <span className={`badge ${priorityMap[type] || 'badge-medium'}`}>
    {dot && <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor', display: 'inline-block' }} />}
    {label}
  </span>
);

export default Badge;
