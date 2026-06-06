// EmptyState.jsx
const EmptyState = ({ icon = '📭', title, description, action }) => (
  <div className="empty-state">
    <div className="empty-state-icon">{icon}</div>
    <h3>{title}</h3>
    {description && <p>{description}</p>}
    {action && <div style={{ marginTop: 8 }}>{action}</div>}
  </div>
);

export default EmptyState;
