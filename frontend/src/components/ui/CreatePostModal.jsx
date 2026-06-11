import { useState, useEffect } from 'react';
import Modal from './Modal';
import { feedAPI } from '../../api/feed.api';
import toast from 'react-hot-toast';

const POST_TYPES = [
  { value: 'note',            label: '📝 Note',       desc: 'Class notes or summaries' },
  { value: 'summary',         label: '📋 Summary',    desc: 'Topic or chapter summary' },
  { value: 'resource',        label: '🔗 Resource',   desc: 'Link to useful material' },
  { value: 'flashcard-share', label: '✨ Flashcards', desc: 'Share a flashcard set' },
];

const CreatePostModal = ({ isOpen, onClose, onSuccess, userSubjects = [] }) => {
  const [type, setType]               = useState('note');
  const [subjectTag, setSubjectTag]   = useState('');
  const [title, setTitle]             = useState('');
  const [description, setDescription] = useState('');
  const [resourceUrl, setResourceUrl] = useState('');
  const [isWorldwide, setIsWorldwide] = useState(false);
  const [file, setFile]               = useState(null);   // File object
  const [filePreview, setFilePreview] = useState(null);   // preview URL string
  const [selectedFlashcardSet, setSelectedFlashcardSet] = useState('');
  const [submitting, setSubmitting]   = useState(false);
  const [errors, setErrors]           = useState({});

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    if (f.size > 10 * 1024 * 1024) {
      setErrors(prev => ({ ...prev, file: 'File must be under 10MB.' }));
      return;
    }
    setFile(f);
    setErrors(prev => ({ ...prev, file: null }));
    if (f.type.startsWith('image/')) {
      setFilePreview(URL.createObjectURL(f));
    } else {
      setFilePreview(null); // PDF — no preview
    }
  };

  // Cleanup object URL on unmount
  useEffect(() => {
    return () => { if (filePreview) URL.revokeObjectURL(filePreview); };
  }, [filePreview]);

  const validate = () => {
    const errs = {};
    if (!subjectTag.trim()) errs.subjectTag = 'Subject is required.';
    if (!title.trim()) errs.title = 'Title is required.';
    if (title.trim().length > 100) errs.title = 'Title must be 100 characters or less.';
    if (description.length > 500) errs.description = 'Description must be 500 characters or less.';
    if (type === 'resource') {
      if (!resourceUrl.trim()) errs.resourceUrl = 'URL is required for resource posts.';
      else if (!resourceUrl.startsWith('http://') && !resourceUrl.startsWith('https://')) {
        errs.resourceUrl = 'URL must start with http:// or https://';
      }
    }
    if (type === 'flashcard-share' && !selectedFlashcardSet.trim()) {
      errs.flashcardSet = 'Please select a flashcard set.';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      let data;
      let hasFile = false;

      if (file) {
        // Use FormData for file uploads
        data = new FormData();
        data.append('type', type);
        data.append('subjectTag', subjectTag.trim());
        data.append('title', title.trim());
        data.append('description', description.trim());
        data.append('isWorldwide', isWorldwide.toString());
        if (resourceUrl) data.append('resourceUrl', resourceUrl.trim());
        if (selectedFlashcardSet) data.append('flashcardSetId', selectedFlashcardSet.trim());
        data.append('attachment', file); // field name must be 'attachment'
        hasFile = true;
      } else {
        // Plain JSON
        data = {
          type,
          subjectTag: subjectTag.trim(),
          title: title.trim(),
          description: description.trim(),
          isWorldwide,
          resourceUrl: resourceUrl.trim() || undefined,
          flashcardSetId: selectedFlashcardSet.trim() || undefined,
        };
      }

      const res = await feedAPI.createPost(data, hasFile);
      onSuccess(res.data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create post.');
    } finally {
      setSubmitting(false);
    }
  };

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setType('note'); setSubjectTag(''); setTitle('');
      setDescription(''); setResourceUrl(''); setIsWorldwide(false);
      setFile(null); setFilePreview(null);
      setSelectedFlashcardSet(''); setErrors({});
    }
  }, [isOpen]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Share a Resource"
      size="md"
      footer={
        <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
          <button className="btn btn-secondary btn-sm"
            onClick={onClose} disabled={submitting}>Cancel</button>
          <button className="btn btn-primary btn-sm"
            onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Sharing...' : 'Share'}
          </button>
        </div>
      }
    >
      {/* Post type selector */}
      <div className="form-group">
        <label className="form-label">Type</label>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
          {POST_TYPES.map(t => (
            <button key={t.value} type="button"
              onClick={() => { setType(t.value); setErrors({}); }}
              style={{
                padding:'10px 12px', borderRadius:'var(--r-md)', cursor:'pointer',
                border: type === t.value
                  ? '2px solid var(--accent)'
                  : '1px solid var(--border-2)',
                background: type === t.value
                  ? 'rgba(108,71,255,0.08)'
                  : 'var(--surface)',
                textAlign:'left', fontFamily:'var(--font-body)',
              }}>
              <div style={{ fontWeight:700, fontSize:'0.82rem',
                color: type === t.value ? 'var(--accent)' : 'var(--txt)' }}>
                {t.label}
              </div>
              <div style={{ fontSize:'0.68rem', color:'var(--txt-3)',
                marginTop:2 }}>{t.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Subject tag */}
      <div className="form-group">
        <label className="form-label">Subject</label>
        <input className="form-input"
          placeholder="e.g. Operating Systems"
          value={subjectTag}
          onChange={e => setSubjectTag(e.target.value)}
          list="subject-suggestions"
        />
        {/* datalist for autocomplete from userSubjects prop */}
        <datalist id="subject-suggestions">
          {userSubjects.map(s => <option key={s} value={s} />)}
        </datalist>
        {errors.subjectTag && (
          <div className="form-error">{errors.subjectTag}</div>
        )}
      </div>

      {/* Title */}
      <div className="form-group">
        <label className="form-label">
          Title
          <span style={{ color:'var(--txt-3)', fontWeight:400,
            marginLeft:6 }}>{title.length}/100</span>
        </label>
        <input className="form-input"
          placeholder="Give your post a clear title"
          value={title}
          maxLength={100}
          onChange={e => setTitle(e.target.value)}
        />
        {errors.title && <div className="form-error">{errors.title}</div>}
      </div>

      {/* Description */}
      <div className="form-group">
        <label className="form-label">
          Description (optional)
          <span style={{ color:'var(--txt-3)', fontWeight:400,
            marginLeft:6 }}>{description.length}/500</span>
        </label>
        <textarea className="form-input form-textarea"
          placeholder="Add more context..."
          value={description}
          maxLength={500}
          rows={3}
          onChange={e => setDescription(e.target.value)}
        />
        {errors.description && (
          <div className="form-error">{errors.description}</div>
        )}
      </div>

      {/* Resource URL — only for type=resource */}
      {type === 'resource' && (
        <div className="form-group">
          <label className="form-label">Resource URL</label>
          <input className="form-input"
            placeholder="https://..."
            value={resourceUrl}
            onChange={e => setResourceUrl(e.target.value)}
          />
          {errors.resourceUrl && (
            <div className="form-error">{errors.resourceUrl}</div>
          )}
        </div>
      )}

      {/* Flashcard set selector — only for type=flashcard-share */}
      {type === 'flashcard-share' && (
        <div className="form-group">
          <label className="form-label">Flashcard Set ID</label>
          <input className="form-input"
            placeholder="Enter the 24-character flashcard set ID"
            value={selectedFlashcardSet}
            onChange={e => setSelectedFlashcardSet(e.target.value)}
          />
          {errors.flashcardSet && (
            <div className="form-error">{errors.flashcardSet}</div>
          )}
        </div>
      )}

      {/* File attachment — for note/summary types */}
      {(type === 'note' || type === 'summary') && (
        <div className="form-group">
          <label className="form-label">Attachment (optional — PDF or image)</label>
          <input type="file" accept=".pdf,.jpg,.jpeg,.png,.webp"
            onChange={handleFileChange}
            style={{ display:'block', fontSize:'0.82rem',
              color:'var(--txt-2)' }}
          />
          {errors.file && <div className="form-error">{errors.file}</div>}
          {filePreview && (
            <img src={filePreview} alt="preview"
              style={{ maxHeight:120, marginTop:8, borderRadius:'var(--r)',
                objectFit:'cover' }} />
          )}
          {file && !filePreview && (
            <div style={{ fontSize:'0.75rem', color:'var(--txt-3)',
              marginTop:6 }}>📄 {file.name}</div>
          )}
        </div>
      )}

      {/* Worldwide toggle */}
      <div style={{ display:'flex', alignItems:'center', gap:10,
        padding:'12px 0', borderTop:'1px solid var(--border)',
        marginTop:8 }}>
        <input type="checkbox" id="worldwide-toggle"
          checked={isWorldwide}
          onChange={e => setIsWorldwide(e.target.checked)}
          style={{ width:16, height:16, cursor:'pointer' }}
        />
        <label htmlFor="worldwide-toggle"
          style={{ fontSize:'0.83rem', color:'var(--txt-2)',
            cursor:'pointer', userSelect:'none' }}>
          Share worldwide (visible to all students, not just your college)
        </label>
      </div>
    </Modal>
  );
};

export default CreatePostModal;
