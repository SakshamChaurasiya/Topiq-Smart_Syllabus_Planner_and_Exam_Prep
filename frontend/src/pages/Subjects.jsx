// Subjects.jsx — Subject management page
import { useState, useEffect } from 'react';
import { subjectAPI } from '../api/subject.api';
import SubjectCard from '../components/subjects/SubjectCard';
import SubjectForm from '../components/subjects/SubjectForm';
import Modal from '../components/ui/Modal';
import EmptyState from '../components/ui/EmptyState';
import { LoadingScreen } from '../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';
import { BookOpen, Plus, Pencil, Trash2, Archive, ChevronDown, ChevronUp } from 'lucide-react';
import { format } from 'date-fns';
import ExamReviewModal from '../components/subjects/ExamReviewModal';

const Subjects = () => {
  const [subjects, setSubjects] = useState([]);
  const [archivedSubjects, setArchivedSubjects] = useState([]);
  const [archivedExpanded, setArchivedExpanded] = useState(false);
  const [loading, setLoading]   = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [reviewTarget, setReviewTarget] = useState(null);
  const [saving, setSaving]     = useState(false);

  const fetchSubjects = async () => {
    try {
      const res = await subjectAPI.getAll();
      const data = res.data.data;
      // Handle both old array shape and new { active, archived } shape
      if (Array.isArray(data)) {
        setSubjects(data.filter(s => !s.isArchived));
        setArchivedSubjects(data.filter(s => s.isArchived));
      } else {
        setSubjects(data.active || []);
        setArchivedSubjects(data.archived || []);
      }
    } catch {
      toast.error('Failed to load subjects.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSubjects(); }, []);

  useEffect(() => {
    const handler = () => fetchSubjects();
    window.addEventListener('topiq:refetch-subjects', handler);
    return () => window.removeEventListener('topiq:refetch-subjects', handler);
  }, []);

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
                onReview={setReviewTarget}
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

      {archivedSubjects.length > 0 && (
        <div style={{ marginTop: 40 }}>
          <div className="divider" />
          <button
            onClick={() => setArchivedExpanded(e => !e)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--txt-3)', fontWeight: 700, fontSize: '0.85rem',
              padding: '8px 0', fontFamily: 'var(--font-body)',
              marginBottom: archivedExpanded ? 16 : 0,
            }}
          >
            <Archive size={15} strokeWidth={2} />
            Completed Exams ({archivedSubjects.length})
            {archivedExpanded
              ? <ChevronUp size={15} strokeWidth={2} />
              : <ChevronDown size={15} strokeWidth={2} />}
          </button>

          {archivedExpanded && (
            <div className="subjects-grid animate-fade-in">
              {archivedSubjects.map(sub => (
                <ArchivedSubjectCard
                  key={sub._id}
                  subject={sub}
                  onUnarchive={async () => {
                    try {
                      await subjectAPI.unarchive(sub._id);
                      toast.success(`"${sub.name}" moved back to active.`);
                      fetchSubjects();
                    } catch {
                      toast.error('Failed to unarchive.');
                    }
                  }}
                  onDelete={setDeleteTarget}
                />
              ))}
            </div>
          )}
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

      {/* ExamReviewModal */}
      <ExamReviewModal
        subject={reviewTarget}
        isOpen={!!reviewTarget}
        onClose={() => setReviewTarget(null)}
        onSubmit={(action) => {
          setReviewTarget(null);
          if (action === 'delete') {
            toast.success(`"${reviewTarget?.name}" deleted.`);
          } else if (action === 'archive') {
            toast.success(`"${reviewTarget?.name}" archived! 📦`);
          } else {
            toast.success('Exam review saved!');
          }
          fetchSubjects();
        }}
      />
    </div>
  );
};

const ArchivedSubjectCard = ({ subject, onUnarchive, onDelete }) => {
  const ratingEmoji = { terrible:'😰', hard:'😟', okay:'😐', good:'😊', crushed:'🎉' };
  const rating = subject.examReview?.rating;
  return (
    <div className="subject-card subject-card--archived">
      <div className="subject-card-accent"
        style={{ background: subject.color || '#6366f1', opacity: 0.4 }} />
      <div className="subject-card-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="subject-icon"
            style={{ background: subject.color || '#6366f1', opacity: 0.6 }}>
            {subject.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--txt-2)' }}>
              {subject.name}
            </div>
            {subject.code && (
              <div style={{ fontSize: '0.72rem', color: 'var(--txt-3)', fontWeight: 600 }}>
                {subject.code}
              </div>
            )}
          </div>
        </div>
        <span className="badge badge-muted" style={{ fontSize: '0.68rem' }}>
          📦 Archived
        </span>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        {rating && (
          <span className="badge badge-success">
            {ratingEmoji[rating]} {rating}
          </span>
        )}
        {subject.examDate && (
          <span className="badge badge-muted" style={{ fontSize: '0.7rem' }}>
            {format(new Date(subject.examDate), 'dd MMM yyyy')}
          </span>
        )}
        {subject.examReview?.topiqHelpfulness === 'yes' && (
          <span className="badge badge-info" style={{ fontSize: '0.68rem' }}>
            Topiq helped 👍
          </span>
        )}
      </div>

      {subject.examReview?.hardestTopic && (
        <div style={{ fontSize: '0.75rem', color: 'var(--txt-3)', marginBottom: 10 }}>
          Hardest topic: <strong>{subject.examReview.hardestTopic}</strong>
        </div>
      )}

      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}
        onClick={e => e.stopPropagation()}>
        <button className="btn btn-secondary btn-sm" onClick={onUnarchive}>
          🔁 Restore
        </button>
        <button className="btn btn-danger btn-sm btn-icon"
          onClick={() => onDelete(subject)}
          title="Delete permanently">
          <Trash2 size={13} strokeWidth={2} />
        </button>
      </div>
    </div>
  );
};

export default Subjects;
