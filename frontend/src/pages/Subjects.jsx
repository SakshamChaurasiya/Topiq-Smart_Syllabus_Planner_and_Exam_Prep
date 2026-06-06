// Subjects.jsx — Subject management page
import { useState, useEffect } from 'react';
import { subjectAPI } from '../api/subject.api';
import SubjectCard from '../components/subjects/SubjectCard';
import SubjectForm from '../components/subjects/SubjectForm';
import Modal from '../components/ui/Modal';
import EmptyState from '../components/ui/EmptyState';
import { LoadingScreen } from '../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

const Subjects = () => {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saving, setSaving]     = useState(false);

  const fetchSubjects = async () => {
    try {
      const res = await subjectAPI.getAll();
      setSubjects(res.data.data || []);
    } catch {
      toast.error('Failed to load subjects.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSubjects(); }, []);

  const openAdd  = () => { setEditTarget(null); setModalOpen(true); };
  const openEdit = (sub) => { setEditTarget(sub); setModalOpen(true); };

  const handleSave = async (form) => {
    setSaving(true);
    try {
      if (editTarget) {
        await subjectAPI.update(editTarget._id, form);
        toast.success('Subject updated! ✅');
      } else {
        await subjectAPI.create(form);
        toast.success('Subject added! 📚');
      }
      setModalOpen(false);
      fetchSubjects();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await subjectAPI.delete(deleteTarget._id);
      toast.success(`"${deleteTarget.name}" deleted.`);
      setDeleteTarget(null);
      fetchSubjects();
    } catch {
      toast.error('Failed to delete subject.');
    }
  };

  if (loading) return <LoadingScreen text="Loading subjects..." />;

  return (
    <div className="page-container animate-fade-in">
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>My Subjects</h1>
          <p>{subjects.length} subject{subjects.length !== 1 ? 's' : ''} — upload a syllabus to start AI analysis</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          ➕ Add Subject
        </button>
      </div>

      {/* Subjects grid or empty state */}
      {!subjects.length ? (
        <EmptyState
          icon="📚"
          title="No subjects yet"
          description="Add your first subject, then upload the syllabus to get started."
          action={<button className="btn btn-primary" onClick={openAdd}>➕ Add Your First Subject</button>}
        />
      ) : (
        <div className="subjects-grid">
          {subjects.map(sub => (
            <SubjectCard
              key={sub._id}
              subject={sub}
              onEdit={openEdit}
              onDelete={setDeleteTarget}
            />
          ))}

          {/* Add button card */}
          <div
            onClick={openAdd}
            style={{
              background: 'var(--bg-card)', border: '2px dashed var(--border-default)',
              borderRadius: 'var(--radius-lg)', padding: '24px',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              gap: 12, cursor: 'pointer', minHeight: 200,
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.background = 'var(--primary-glow)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-default)'; e.currentTarget.style.background = 'var(--bg-card)'; }}
          >
            <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>➕</div>
            <div style={{ fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Add Subject</div>
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editTarget ? '✏️ Edit Subject' : '➕ Add New Subject'}
      >
        <SubjectForm
          initial={editTarget}
          onSubmit={handleSave}
          onCancel={() => setModalOpen(false)}
          loading={saving}
        />
      </Modal>

      {/* Delete confirmation Modal */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="🗑️ Delete Subject"
        size="sm"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setDeleteTarget(null)}>Cancel</button>
            <button className="btn btn-danger" onClick={handleDelete}>Delete Permanently</button>
          </>
        }
      >
        <p>Are you sure you want to delete <strong style={{ color: 'var(--text-primary)' }}>{deleteTarget?.name}</strong>?</p>
        <p style={{ marginTop: 8, fontSize: '0.85rem' }}>
          This will also delete its syllabus, study plan, and all missions.
        </p>
      </Modal>
    </div>
  );
};

export default Subjects;
