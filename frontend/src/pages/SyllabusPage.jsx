// SyllabusPage.jsx — Upload syllabus + AI analysis + topic tracker
import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { syllabusAPI } from '../api/syllabus.api';
import { subjectAPI } from '../api/subject.api';
import { LoadingScreen, LoadingSpinner } from '../components/ui/LoadingSpinner';
import Badge from '../components/ui/Badge';
import toast from 'react-hot-toast';

const SyllabusPage = () => {
  const { id: subjectId } = useParams();
  const navigate = useNavigate();

  const [subject,  setSubject]  = useState(null);
  const [syllabus, setSyllabus] = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [tab,      setTab]      = useState('pdf'); // pdf | image | text
  const [textInput, setTextInput] = useState('');
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [expandedUnits, setExpandedUnits] = useState({});
  const fileInputRef = useRef(null);

  const fetchData = async () => {
    try {
      const [subRes, sylRes] = await Promise.allSettled([
        subjectAPI.getById(subjectId),
        syllabusAPI.getBySubject(subjectId),
      ]);
      if (subRes.status === 'fulfilled') setSubject(subRes.value.data.data);
      if (sylRes.status === 'fulfilled') setSyllabus(sylRes.value.data.data);
    } catch { toast.error('Failed to load syllabus data.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [subjectId]);

  // Toggle unit expansion
  const toggleUnit = (idx) => setExpandedUnits(prev => ({ ...prev, [idx]: !prev[idx] }));

  // Upload file (PDF or image)
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    fd.append('subjectId', subjectId);
    try {
      await syllabusAPI.uploadFile(fd);
      toast.success('Syllabus uploaded! Now run AI analysis.');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Submit plain text
  const handleTextSubmit = async () => {
    if (!textInput.trim() || textInput.trim().length < 20) {
      return toast.error('Please enter more syllabus content (at least 20 characters).');
    }
    setUploading(true);
    try {
      await syllabusAPI.submitText({ subjectId, rawContent: textInput });
      toast.success('Syllabus text saved! Now run AI analysis.');
      setTextInput('');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save text.');
    } finally { setUploading(false); }
  };

  // Run AI analysis
  const handleAnalyze = async () => {
    if (!syllabus) return;
    setAnalyzing(true);
    try {
      await syllabusAPI.analyze(syllabus._id);
      toast.success('AI analysis complete! ✨');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Analysis failed. Try again.');
    } finally { setAnalyzing(false); }
  };

  // Mark topic complete / incomplete
  const handleTopicToggle = async (topicId, currentStatus) => {
    try {
      await syllabusAPI.markTopic(syllabus._id, topicId, !currentStatus);
      fetchData();
    } catch { toast.error('Failed to update topic.'); }
  };

  if (loading) return <LoadingScreen text="Loading syllabus..." />;

  const importanceColors = { critical: 'var(--danger)', high: 'var(--warning)', medium: 'var(--primary)', low: 'var(--success)' };

  return (
    <div className="page-container animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/subjects')}>← Back</button>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: subject?.color || '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#fff' }}>
            {subject?.name?.charAt(0)}
          </div>
          <div>
            <h1 style={{ fontSize: '1.5rem' }}>{subject?.name}</h1>
            {subject?.code && <p style={{ margin: 0 }}>{subject.code}</p>}
          </div>
        </div>

        {/* Nav for subject pages */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="btn btn-primary btn-sm" onClick={() => navigate(`/subjects/${subjectId}/syllabus`)}>📋 Syllabus</button>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/subjects/${subjectId}/planner`)}>🗺️ Planner</button>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/subjects/${subjectId}/cheatcode`)}>⚡ Cheat Code</button>
        </div>
      </div>

      {/* If no syllabus yet — show upload panel */}
      {!syllabus && (
        <div className="card">
          <h3 style={{ fontWeight: 700, marginBottom: 4 }}>📤 Upload Syllabus</h3>
          <p style={{ marginBottom: 24, fontSize: '0.9rem' }}>Choose how you want to add your syllabus:</p>

          {/* Tabs */}
          <div className="tabs" style={{ marginBottom: 24 }}>
            {['pdf', 'image', 'text'].map(t => (
              <button key={t} className={`tab-btn ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
                {t === 'pdf' ? '📄 PDF' : t === 'image' ? '🖼️ Image' : '✏️ Text'}
              </button>
            ))}
          </div>

          {/* PDF / Image upload */}
          {(tab === 'pdf' || tab === 'image') && (
            <div>
              <input ref={fileInputRef} type="file" accept={tab === 'pdf' ? '.pdf' : 'image/*'} onChange={handleFileUpload} style={{ display: 'none' }} id="syl-file-input" />
              <div
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: '2px dashed var(--border-strong)', borderRadius: 12,
                  padding: '48px', textAlign: 'center', cursor: 'pointer',
                  background: 'var(--bg-elevated)', transition: 'all 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--primary)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-strong)'}
              >
                {uploading ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                    <LoadingSpinner />
                    <p style={{ margin: 0 }}>Uploading...</p>
                  </div>
                ) : (
                  <>
                    <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>{tab === 'pdf' ? '📄' : '🖼️'}</div>
                    <div style={{ fontWeight: 700, marginBottom: 6 }}>
                      Click to upload {tab === 'pdf' ? 'PDF' : 'image'}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {tab === 'pdf' ? 'Supports .pdf files up to 10MB' : 'Supports JPG, PNG, WEBP up to 10MB'}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Text input */}
          {tab === 'text' && (
            <div>
              <textarea
                className="form-textarea"
                rows={10}
                placeholder="Paste your syllabus text here...&#10;&#10;Unit 1: Introduction&#10;1.1 Basic Concepts&#10;1.2 Historical Overview&#10;&#10;Unit 2: Core Algorithms&#10;..."
                value={textInput}
                onChange={e => setTextInput(e.target.value)}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{textInput.split(/\s+/).filter(Boolean).length} words</span>
                <button className="btn btn-primary" onClick={handleTextSubmit} disabled={uploading}>
                  {uploading ? '⏳ Saving...' : '💾 Save Syllabus'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Syllabus uploaded but not analyzed */}
      {syllabus && !syllabus.isAnalyzed && (
        <div className="card" style={{ marginBottom: 20, borderColor: 'rgba(99,102,241,0.3)', boxShadow: '0 0 30px var(--primary-glow)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <h3 style={{ fontWeight: 700, marginBottom: 4 }}>📋 Syllabus Uploaded</h3>
              <p style={{ margin: 0, fontSize: '0.9rem' }}>
                File: <strong>{syllabus.originalFileName || 'Text input'}</strong> · Type: {syllabus.inputType?.toUpperCase()}
              </p>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 4 }}>
                Ready for AI analysis. Click the button to extract units and topics.
              </p>
            </div>
            <button className="btn btn-primary btn-lg" onClick={handleAnalyze} disabled={analyzing}>
              {analyzing ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
                  Analyzing...
                </span>
              ) : '🤖 Run AI Analysis'}
            </button>
          </div>

          {/* Preview raw content */}
          {syllabus.rawContent && (
            <div style={{ marginTop: 16, background: 'var(--bg-base)', borderRadius: 8, padding: 16, maxHeight: 150, overflow: 'auto', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Content Preview</div>
              <pre style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', margin: 0, fontFamily: 'inherit', lineHeight: 1.6 }}>
                {syllabus.rawContent.substring(0, 400)}{syllabus.rawContent.length > 400 ? '...' : ''}
              </pre>
            </div>
          )}

          {/* Option to re-upload */}
          <div style={{ marginTop: 12 }}>
            <button className="btn btn-ghost btn-sm" onClick={() => { setSyllabus(null); }}>Re-upload syllabus</button>
          </div>
        </div>
      )}

      {/* Syllabus analyzed — show results */}
      {syllabus?.isAnalyzed && (
        <>
          {/* AI Analysis Summary */}
          <div className="card" style={{ marginBottom: 20, borderColor: 'rgba(16,185,129,0.3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <h3 style={{ fontWeight: 700 }}>🤖 AI Analysis Complete</h3>
                  <span className="badge badge-success">✓ Analyzed</span>
                </div>
                {syllabus.aiAnalysis?.summary && (
                  <p style={{ fontSize: '0.88rem', maxWidth: 600, lineHeight: 1.6, marginBottom: 12 }}>{syllabus.aiAnalysis.summary}</p>
                )}
                <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>Total Topics</div>
                    <div style={{ fontWeight: 800, fontSize: '1.3rem', color: 'var(--primary-light)' }}>{syllabus.totalTopics}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>Est. Hours</div>
                    <div style={{ fontWeight: 800, fontSize: '1.3rem', color: 'var(--warning)' }}>{syllabus.aiAnalysis?.totalEstimatedHours}h</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>Difficulty</div>
                    <div style={{ fontWeight: 800, fontSize: '1.3rem', color: 'var(--danger)' }}>{syllabus.aiAnalysis?.overallDifficulty}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>Units</div>
                    <div style={{ fontWeight: 800, fontSize: '1.3rem', color: 'var(--success)' }}>{syllabus.units?.length}</div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button className="btn btn-primary" onClick={() => navigate(`/subjects/${subjectId}/planner`)}>
                  🗺️ Generate Plan
                </button>
                <button className="btn btn-secondary" style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }} onClick={() => navigate(`/subjects/${subjectId}/cheatcode`)}>
                  ⚡ Cheat Code
                </button>
              </div>
            </div>

            {/* Priority topics */}
            {syllabus.aiAnalysis?.topPriorityTopics?.length > 0 && (
              <div style={{ marginTop: 16, padding: '14px', background: 'rgba(99,102,241,0.08)', borderRadius: 10, border: '1px solid rgba(99,102,241,0.2)' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--primary-light)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  🎯 Top Priority Topics
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {syllabus.aiAnalysis.topPriorityTopics.map((t, i) => (
                    <span key={i} style={{ background: 'var(--primary-glow)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 100, padding: '3px 12px', fontSize: '0.78rem', color: 'var(--primary-light)', fontWeight: 600 }}>
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Strategy */}
            {syllabus.aiAnalysis?.studyStrategy && (
              <div style={{ marginTop: 12, padding: '12px', background: 'var(--bg-base)', borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>📌 Study Strategy</div>
                <p style={{ fontSize: '0.85rem', margin: 0, lineHeight: 1.6 }}>{syllabus.aiAnalysis.studyStrategy}</p>
              </div>
            )}
          </div>

          {/* Units & Topics */}
          <div style={{ marginBottom: 32 }}>
            <h3 style={{ fontWeight: 700, marginBottom: 16 }}>📚 Units & Topics</h3>
            {syllabus.units?.map((unit, ui) => {
              const completedCount = unit.topics.filter(t => t.isCompleted).length;
              const progressPct = unit.topics.length > 0 ? Math.round((completedCount / unit.topics.length) * 100) : 0;
              const isOpen = expandedUnits[ui] !== false; // open by default

              return (
                <div key={ui} className="roadmap-day" style={{ marginBottom: 10 }}>
                  {/* Unit header */}
                  <div className="roadmap-day-header" onClick={() => toggleUnit(ui)}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1, minWidth: 0 }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                        background: `linear-gradient(135deg, ${subject?.color || '#6366f1'}, ${subject?.color || '#8b5cf6'}88)`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 800, color: '#fff', fontSize: '0.85rem',
                      }}>
                        {unit.unitNumber}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{unit.unitName}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {completedCount}/{unit.topics.length} topics · {progressPct}%
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 80, height: 4, background: 'var(--bg-base)', borderRadius: 100, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${progressPct}%`, background: 'var(--success)', borderRadius: 100 }} />
                      </div>
                      <span style={{ color: 'var(--text-muted)', fontSize: '1.2rem', transition: 'transform 0.2s', transform: isOpen ? 'rotate(180deg)' : 'none' }}>▾</span>
                    </div>
                  </div>

                  {/* Topics list */}
                  {isOpen && (
                    <div className="roadmap-day-body">
                      {unit.topics.map((topic) => (
                        <div
                          key={topic._id}
                          style={{
                            display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 0',
                            borderBottom: '1px solid var(--border-subtle)',
                            opacity: topic.isCompleted ? 0.55 : 1,
                          }}
                        >
                          {/* Checkbox */}
                          <div
                            onClick={() => handleTopicToggle(topic._id, topic.isCompleted)}
                            style={{
                              width: 20, height: 20, borderRadius: 5, flexShrink: 0, marginTop: 2,
                              border: `2px solid ${topic.isCompleted ? 'var(--success)' : importanceColors[topic.importance] || 'var(--border-strong)'}`,
                              background: topic.isCompleted ? 'var(--success)' : 'transparent',
                              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                              transition: 'all 0.15s',
                            }}
                          >
                            {topic.isCompleted && <span style={{ color: '#fff', fontSize: '0.7rem', fontWeight: 700 }}>✓</span>}
                          </div>

                          {/* Topic info */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 3 }}>
                              <span style={{
                                fontWeight: 600, fontSize: '0.88rem',
                                textDecoration: topic.isCompleted ? 'line-through' : 'none',
                              }}>{topic.name}</span>
                              <Badge type={topic.importance} label={topic.importance} />
                              <Badge
                                type={topic.difficulty === 'easy' ? 'success' : topic.difficulty === 'hard' ? 'danger' : 'warning'}
                                label={topic.difficulty}
                              />
                            </div>
                            {topic.summary && (
                              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '2px 0 0', lineHeight: 1.5 }}>{topic.summary}</p>
                            )}
                          </div>

                          {/* Stats */}
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>⏱ {topic.estimatedHours}h</span>
                            {topic.marksWeightage > 0 && (
                              <span style={{ fontSize: '0.72rem', color: 'var(--warning)', fontWeight: 600 }}>~{topic.marksWeightage} marks</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Re-analyze option */}
          <div style={{ textAlign: 'center', padding: '24px 0', borderTop: '1px solid var(--border-subtle)' }}>
            <p style={{ marginBottom: 12, fontSize: '0.85rem' }}>Want to update the syllabus?</p>
            <button className="btn btn-secondary btn-sm" onClick={handleAnalyze} disabled={analyzing}>
              {analyzing ? '⏳ Analyzing...' : '🔄 Re-run AI Analysis'}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default SyllabusPage;
