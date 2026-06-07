// Subjects.jsx — Subject management page
import { useState, useEffect } from 'react';
import { subjectAPI } from '../api/subject.api';
import SubjectCard from '../components/subjects/SubjectCard';
import SubjectForm from '../components/subjects/SubjectForm';
import Modal from '../components/ui/Modal';
import EmptyState from '../components/ui/EmptyState';
import { LoadingScreen } from '../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';
import { BookOpen, Plus, Pencil, Trash2 } from 'lucide-react';

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
        <button className="btn btn-primary" onClick={openAdd} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Plus size={16} strokeWidth={2.5} /> Add Subject
        </button>
      </div>

      {/* Subjects grid or empty state */}
      {!subjects.length ? (
        <EmptyState
          icon={<BookOpen size={42} strokeWidth={1} color="var(--text-disabled)" />}
          title="No subjects yet"
          description="Add your first subject, then upload the syllabus to get started."
          action={<button className="btn btn-primary" onClick={openAdd} style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Plus size={15} strokeWidth={2.5} /> Add Your First Subject</button>}
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

          {/* Add subject button card */}
          <button
            className="subjects-add-card"
            onClick={openAdd}
          >
            <div className="subjects-add-card-icon">
              <Plus size={22} strokeWidth={1.75} />
            </div>
            <span className="subjects-add-card-label">Add Subject</span>
          </button>

        </div>
      )}

      {/* Add / Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editTarget
          ? <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}><Pencil size={16} /> Edit Subject</span>
          : <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}><Plus size={16} /> Add New Subject</span>}
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
        title={<span style={{ display: 'flex', alignItems: 'center', gap: 7, color: 'var(--danger)' }}><Trash2 size={16} /> Delete Subject</span>}
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
