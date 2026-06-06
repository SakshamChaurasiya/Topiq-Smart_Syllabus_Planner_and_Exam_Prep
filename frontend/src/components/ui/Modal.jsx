// Modal.jsx — Reusable modal dialog
const Modal = ({ isOpen, onClose, title, children, footer, size = 'md' }) => {
  if (!isOpen) return null;

  const maxWidths = { sm: 400, md: 520, lg: 680, xl: 860 };

  return (
    <div
      className="modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal-box" style={{ maxWidth: maxWidths[size] }}>
        <div className="modal-header">
          <h3 className="modal-title">{title}</h3>
          <button
            onClick={onClose}
            style={{
              background: 'var(--bg-elevated)', border: '1px solid var(--border-default)',
              color: 'var(--text-secondary)', borderRadius: 8, width: 32, height: 32,
              cursor: 'pointer', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >✕</button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
};

export default Modal;
