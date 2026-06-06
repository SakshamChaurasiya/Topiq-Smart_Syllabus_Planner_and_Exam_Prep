// SubjectForm.jsx — Add / Edit subject modal form
import { useState, useEffect } from 'react';

const COLORS = ['#6366f1','#8b5cf6','#06b6d4','#10b981','#f59e0b','#ef4444','#ec4899','#14b8a6'];

const SubjectForm = ({ initial = null, onSubmit, onCancel, loading }) => {
  const [form, setForm] = useState({
    name: '', code: '', examDate: '', difficulty: 'medium', color: '#6366f1', priority: 'medium', notes: '',
  });

  useEffect(() => {
    if (initial) {
      setForm({
        name: initial.name || '',
        code: initial.code || '',
        examDate: initial.examDate ? initial.examDate.split('T')[0] : '',
        difficulty: initial.difficulty || 'medium',
        color: initial.color || '#6366f1',
        priority: initial.priority || 'medium',
        notes: initial.notes || '',
      });
    }
  }, [initial]);

  const set = (field, val) => setForm(f => ({ ...f, [field]: val }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-group">
        <label className="form-label">Subject Name *</label>
        <input
          className="form-input"
          placeholder="e.g. Data Structures and Algorithms"
          value={form.name}
          onChange={e => set('name', e.target.value)}
          required
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div className="form-group">
          <label className="form-label">Subject Code</label>
          <input
            className="form-input"
            placeholder="e.g. DSA"
            value={form.code}
            onChange={e => set('code', e.target.value)}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Exam Date</label>
          <input
            type="date"
            className="form-input"
            value={form.examDate}
            min={new Date().toISOString().split('T')[0]}
            onChange={e => set('examDate', e.target.value)}
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div className="form-group">
          <label className="form-label">Difficulty</label>
          <select className="form-select" value={form.difficulty} onChange={e => set('difficulty', e.target.value)}>
            <option value="easy">😊 Easy</option>
            <option value="medium">⚡ Medium</option>
            <option value="hard">🔥 Hard</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Priority</label>
          <select className="form-select" value={form.priority} onChange={e => set('priority', e.target.value)}>
            <option value="low">🟢 Low</option>
            <option value="medium">🔵 Medium</option>
            <option value="high">🟡 High</option>
            <option value="critical">🔴 Critical</option>
          </select>
        </div>
      </div>

      {/* Color picker */}
      <div className="form-group">
        <label className="form-label">Color</label>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {COLORS.map(c => (
            <button
              key={c} type="button"
              onClick={() => set('color', c)}
              style={{
                width: 30, height: 30, borderRadius: 8, background: c, border: 'none', cursor: 'pointer',
                outline: form.color === c ? `3px solid #fff` : 'none',
                outlineOffset: 2,
                transform: form.color === c ? 'scale(1.15)' : 'scale(1)',
                transition: 'all 0.15s',
              }}
            />
          ))}
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Notes (optional)</label>
        <textarea
          className="form-textarea"
          rows={2}
          placeholder="Any notes about this subject..."
          value={form.notes}
          onChange={e => set('notes', e.target.value)}
        />
      </div>

      <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8 }}>
        <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? '⏳ Saving...' : initial ? '✅ Update Subject' : '➕ Add Subject'}
        </button>
      </div>
    </form>
  );
};

export default SubjectForm;
