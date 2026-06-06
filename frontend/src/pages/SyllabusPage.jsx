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
  const [pyqUploading, setPyqUploading] = useState(false);
  const pyqFileInputRef = useRef(null);

  // Flashcards state
  const [flashcardSet, setFlashcardSet] = useState(null);
  const [generatingCards, setGeneratingCards] = useState(false);
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const [cardFlipped, setCardFlipped] = useState(false);
  const [cardFilter, setCardFilter] = useState('all');
  const [sharingNotes, setSharingNotes] = useState(false);
  const [shareTitleInput, setShareTitleInput] = useState('');
  const [generatedShareLink, setGeneratedShareLink] = useState('');

  const fetchData = async () => {
    try {
      const [subRes, sylRes] = await Promise.allSettled([
        subjectAPI.getById(subjectId),
        syllabusAPI.getBySubject(subjectId),
      ]);
      if (subRes.status === 'fulfilled') setSubject(subRes.value.data.data);
      if (sylRes.status === 'fulfilled') {
        const syllabusData = sylRes.value.data.data;
        setSyllabus(syllabusData);
        if (syllabusData && syllabusData._id) {
          try {
            const fcRes = await syllabusAPI.getFlashcards(syllabusData._id);
            if (fcRes.data?.data) {
              setFlashcardSet(fcRes.data.data);
              if (fcRes.data.data.shareTitle) {
                setShareTitleInput(fcRes.data.data.shareTitle);
              }
              if (fcRes.data.data.shareToken && fcRes.data.data.isShareable) {
                const appUrl = window.location.origin;
                setGeneratedShareLink(`${appUrl}/shared/cheatnote/${fcRes.data.data.shareToken}`);
              }
            }
          } catch (err) {
            console.error('Failed to load flashcards:', err);
          }
        }
      }
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

  // Upload and analyze PYQ PDF
  const handlePyqUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPyqUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    try {
      await syllabusAPI.uploadPYQ(syllabus._id, fd);
      toast.success('Past Year Papers analyzed successfully! ✨');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'PYQ Upload and analysis failed.');
    } finally {
      setPyqUploading(false);
      if (pyqFileInputRef.current) pyqFileInputRef.current.value = '';
    }
  };

  const handleGenerateFlashcards = async () => {
    if (!syllabus?._id) return;
    setGeneratingCards(true);
    try {
      const res = await syllabusAPI.generateFlashcards(syllabus._id);
      setFlashcardSet(res.data.data);
      setActiveCardIndex(0);
      setCardFlipped(false);
      toast.success('AI Flashcards generated! 🧠');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate flashcards.');
    } finally {
      setGeneratingCards(false);
    }
  };

  const handleShareFlashcards = async (e) => {
    e.preventDefault();
    if (!flashcardSet?._id) return;
    setSharingNotes(true);
    try {
      const res = await syllabusAPI.shareFlashcards(flashcardSet._id, shareTitleInput);
      const appUrl = window.location.origin;
      const fullLink = `${appUrl}${res.data.data.shareUrl}`;
      setGeneratedShareLink(fullLink);
      toast.success('Share link generated!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate share link.');
    } finally {
      setSharingNotes(false);
    }
  };

  const handleCopyLink = () => {
    if (!generatedShareLink) return;
    navigator.clipboard.writeText(generatedShareLink);
    toast.success('Share link copied to clipboard! 📋');
  };

  // Reset index when filter changes
  useEffect(() => {
    setActiveCardIndex(0);
    setCardFlipped(false);
  }, [cardFilter]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!flashcardSet?.cards || flashcardSet.cards.length === 0) return;
      const activeEl = document.activeElement;
      if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA')) return;

      const filtered = flashcardSet.cards.filter(c => {
        if (cardFilter === 'all') return true;
        return c.importance === cardFilter;
      });
      if (filtered.length === 0) return;

      if (e.code === 'Space') {
        e.preventDefault();
        setCardFlipped(f => !f);
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        setCardFlipped(false);
        setActiveCardIndex(idx => (idx + 1) % filtered.length);
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        setCardFlipped(false);
        setActiveCardIndex(idx => (idx - 1 + filtered.length) % filtered.length);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [flashcardSet, cardFilter]);

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

            {/* AI-Suggested Focus Areas */}
            {syllabus.aiAnalysis?.aiSuggestedFocusAreas?.length > 0 && (
              <div style={{ marginTop: 16, padding: '16px', background: 'var(--bg-elevated)', borderRadius: 12, border: '1px solid var(--border)' }}>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: 4, color: 'var(--text-primary)' }}>
                  🎯 AI-Suggested Focus Areas
                </div>
                <p style={{ margin: '0 0 16px', fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  Based on topic weightage and importance tags from your syllabus. The AI has no access to past papers or your institution's exam history. Upload PYQs below to get evidence-based topic priorities.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
                  {/* Column A: AI Suggested */}
                  <div>
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--primary-light)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                      AI Suggested
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {syllabus.aiAnalysis.aiSuggestedFocusAreas.map((topic, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--surface2)', borderRadius: 8, border: '1px solid var(--border)', gap: 8 }}>
                          <span style={{ fontSize: '0.82rem', fontWeight: 500, color: 'var(--text-primary)' }}>{topic}</span>
                          <span className="badge badge-warning" style={{ textTransform: 'none', border: '1px solid var(--warning-border)', flexShrink: 0 }}>
                            AI guess
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Column B: From Your PYQs */}
                  {syllabus.pyqAnalysis && syllabus.pyqAnalysis.uploadedAt ? (
                    <div>
                      <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--success)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                        From Your PYQs (Evidence)
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {syllabus.pyqAnalysis.pyqSuggestedTopics && syllabus.pyqAnalysis.pyqSuggestedTopics.length > 0 ? (
                          syllabus.pyqAnalysis.pyqSuggestedTopics.map((topicObj, i) => (
                            <div key={i} style={{ display: 'flex', flexDirection: 'column', padding: '10px 12px', background: 'var(--surface2)', borderRadius: 8, border: '1px solid var(--border)', gap: 4 }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>{topicObj.topic}</span>
                                <span className="badge" style={{ textTransform: 'none', background: 'rgba(16,185,129,0.12)', color: 'var(--success)', border: '1px solid rgba(16,185,129,0.25)', flexShrink: 0, fontSize: '0.7rem', padding: '2px 6px', borderRadius: 4 }}>
                                  {topicObj.frequency}x
                                </span>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>
                                <span>Years: {topicObj.yearsAppeared.join(', ')}</span>
                                {topicObj.estimatedMarks > 0 && (
                                  <span style={{ color: 'var(--warning)', fontWeight: 600 }}>~{topicObj.estimatedMarks} marks</span>
                                )}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 80, padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: 8, border: '1px dashed var(--border-default)', textAlign: 'center' }}>
                            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>No PYQ topics extracted.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div style={{ opacity: 0.6 }}>
                      <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                        From Your PYQs
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 80, padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: 8, border: '1px dashed var(--border-strong)', textAlign: 'center' }}>
                        <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                          Upload past year papers in the Syllabus tab to populate this column.
                        </p>
                      </div>
                    </div>
                  )}
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

          {/* PYQ Evidence Engine Section */}
          <div className="card" style={{ marginBottom: 20, borderColor: syllabus.pyqAnalysis?.uploadedAt ? 'rgba(99,102,241,0.25)' : 'var(--border-subtle)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
              <div>
                <h3 style={{ fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                  📁 PYQ Analysis & Exam Alignment
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Upload past year papers to cross-reference AI-suggested syllabus topics with historical exam data.
                </p>
              </div>
              {syllabus.pyqAnalysis?.uploadedAt && (
                <button 
                  className="btn btn-secondary btn-sm"
                  onClick={() => pyqFileInputRef.current?.click()}
                  disabled={pyqUploading}
                >
                  {pyqUploading ? 'Analyzing...' : '🔄 Re-upload past papers'}
                </button>
              )}
            </div>

            <input 
              ref={pyqFileInputRef} 
              type="file" 
              accept=".pdf" 
              onChange={handlePyqUpload} 
              style={{ display: 'none' }} 
              id="pyq-file-input" 
            />

            {!syllabus.pyqAnalysis?.uploadedAt ? (
              <div
                onClick={() => !pyqUploading && pyqFileInputRef.current?.click()}
                style={{
                  border: '2px dashed var(--border-strong)', 
                  borderRadius: 12,
                  padding: '32px', 
                  textAlign: 'center', 
                  cursor: pyqUploading ? 'default' : 'pointer',
                  background: 'var(--bg-elevated)', 
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => {
                  if (!pyqUploading) e.currentTarget.style.borderColor = 'var(--primary)';
                }}
                onMouseLeave={e => {
                  if (!pyqUploading) e.currentTarget.style.borderColor = 'var(--border-strong)';
                }}
              >
                {pyqUploading ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                    <LoadingSpinner />
                    <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 600 }}>Analyzing Past Year Papers PDF...</p>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>Extracting topics, mapping frequencies, and matching with syllabus</p>
                  </div>
                ) : (
                  <>
                    <div style={{ fontSize: '2rem', marginBottom: 8 }}>📄</div>
                    <div style={{ fontWeight: 700, marginBottom: 4, fontSize: '0.9rem' }}>
                      Upload Previous Year Questions (PYQs) PDF
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      Supports exam paper PDFs up to 10MB
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: 16 }}>
                  Analysis complete! Last updated: <strong>{new Date(syllabus.pyqAnalysis.uploadedAt).toLocaleString()}</strong>. Below is the triple-alignment breakdown.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
                  
                  {/* Card 1: Overlap Topics */}
                  <div style={{ 
                    background: 'rgba(16,185,129,0.04)', 
                    border: '1px solid rgba(16,185,129,0.2)', 
                    borderRadius: 12, 
                    padding: 16 
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                      <span style={{ fontSize: '1.2rem' }}>🎯</span>
                      <div>
                        <h4 style={{ margin: 0, fontSize: '0.88rem', fontWeight: 700, color: 'var(--success)' }}>Overlap Topics</h4>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>High reliability (Both AI & PYQs)</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {syllabus.pyqAnalysis.overlapTopics && syllabus.pyqAnalysis.overlapTopics.length > 0 ? (
                        syllabus.pyqAnalysis.overlapTopics.map((topic, i) => (
                          <div key={i} style={{ fontSize: '0.8rem', padding: '6px 10px', background: 'rgba(255,255,255,0.03)', borderRadius: 6, border: '1px solid rgba(16,185,129,0.1)' }}>
                            {topic}
                          </div>
                        ))
                      ) : (
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontStyle: 'italic', padding: 8 }}>None detected.</div>
                      )}
                    </div>
                  </div>

                  {/* Card 2: PYQ-Only Topics */}
                  <div style={{ 
                    background: 'rgba(239,68,68,0.04)', 
                    border: '1px solid rgba(239,68,68,0.2)', 
                    borderRadius: 12, 
                    padding: 16 
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                      <span style={{ fontSize: '1.2rem' }}>⚠️</span>
                      <div>
                        <h4 style={{ margin: 0, fontSize: '0.88rem', fontWeight: 700, color: 'var(--danger)' }}>PYQ-Only (Potential Gaps)</h4>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Tested in exams but not in core syllabus</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {syllabus.pyqAnalysis.pyqOnlyTopics && syllabus.pyqAnalysis.pyqOnlyTopics.length > 0 ? (
                        syllabus.pyqAnalysis.pyqOnlyTopics.map((topic, i) => (
                          <div key={i} style={{ fontSize: '0.8rem', padding: '6px 10px', background: 'rgba(255,255,255,0.03)', borderRadius: 6, border: '1px solid rgba(239,68,68,0.1)' }}>
                            {topic}
                          </div>
                        ))
                      ) : (
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontStyle: 'italic', padding: 8 }}>None detected.</div>
                      )}
                    </div>
                  </div>

                  {/* Card 3: AI-Only Topics */}
                  <div style={{ 
                    background: 'rgba(99,102,241,0.04)', 
                    border: '1px solid rgba(99,102,241,0.2)', 
                    borderRadius: 12, 
                    padding: 16 
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                      <span style={{ fontSize: '1.2rem' }}>💡</span>
                      <div>
                        <h4 style={{ margin: 0, fontSize: '0.88rem', fontWeight: 700, color: 'var(--primary-light)' }}>AI-Only Topics</h4>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>In syllabus list but never seen in PYQs</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {syllabus.pyqAnalysis.aiOnlyTopics && syllabus.pyqAnalysis.aiOnlyTopics.length > 0 ? (
                        syllabus.pyqAnalysis.aiOnlyTopics.map((topic, i) => (
                          <div key={i} style={{ fontSize: '0.8rem', padding: '6px 10px', background: 'rgba(255,255,255,0.03)', borderRadius: 6, border: '1px solid rgba(99,102,241,0.1)' }}>
                            {topic}
                          </div>
                        ))
                      ) : (
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontStyle: 'italic', padding: 8 }}>None detected.</div>
                      )}
                    </div>
                  </div>

                </div>
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

          {/* Flashcards Section */}
          {syllabus?.isAnalyzed && (
            <div className="card" style={{ marginBottom: 24, position: 'relative' }}>
              <style>{`
                .flashcard-container {
                  perspective: 1000px;
                  width: 100%;
                  max-width: 480px;
                  height: 280px;
                  margin: 16px auto;
                  cursor: pointer;
                }
                .flashcard {
                  width: 100%;
                  height: 100%;
                  position: relative;
                  transform-style: preserve-3d;
                  transition: transform 0.4s ease;
                }
                .flashcard.flipped {
                  transform: rotateY(180deg);
                }
                .flashcard-front, .flashcard-back {
                  width: 100%;
                  height: 100%;
                  position: absolute;
                  backface-visibility: hidden;
                  border-radius: 12px;
                  padding: 24px;
                  display: flex;
                  flex-direction: column;
                  justify-content: center;
                  align-items: center;
                  box-shadow: 0 4px 24px rgba(0,0,0,0.15);
                  border: 1px solid var(--border-strong);
                  background: var(--bg-elevated);
                  overflow-y: auto;
                }
                .flashcard-back {
                  transform: rotateY(180deg);
                  background: rgba(99, 102, 241, 0.05);
                  border-color: rgba(99, 102, 241, 0.25);
                }
              `}</style>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <h3 style={{ fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                    🧠 AI Flashcards & Last-Minute Prep
                  </h3>
                  <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Study high-yield questions for critical and high importance topics.
                  </p>
                </div>
              </div>

              {!flashcardSet ? (
                <div style={{ textAlign: 'center', padding: '24px 0' }}>
                  <button
                    onClick={handleGenerateFlashcards}
                    disabled={generatingCards}
                    className="btn btn-primary"
                    style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '0 auto' }}
                  >
                    {generatingCards ? (
                      <>
                        <LoadingSpinner />
                        Generating flashcards with AI...
                      </>
                    ) : (
                      <>🧠 Generate Flashcards (Critical & High Topics)</>
                    )}
                  </button>
                </div>
              ) : (
                <div>
                  {/* Filters */}
                  <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                    {['all', 'critical', 'high'].map(filter => (
                      <button
                        key={filter}
                        onClick={() => setCardFilter(filter)}
                        className={`btn btn-sm ${cardFilter === filter ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ textTransform: 'capitalize' }}
                      >
                        {filter === 'all' ? 'All Cards' : `${filter} Priority`}
                      </button>
                    ))}
                  </div>

                  {(() => {
                    const filteredCards = flashcardSet?.cards?.filter(c => {
                      if (cardFilter === 'all') return true;
                      return c.importance === cardFilter;
                    }) || [];
                    
                    const currentCard = filteredCards[activeCardIndex];

                    if (filteredCards.length === 0) {
                      return (
                        <div style={{ textAlign: 'center', padding: '40px 0', border: '1px dashed var(--border-subtle)', borderRadius: 12 }}>
                          <p style={{ color: 'var(--text-muted)', margin: 0 }}>No cards found for this priority level.</p>
                        </div>
                      );
                    }

                    return (
                      <div>
                        {/* Deck Swiper */}
                        <div className="flashcard-container" onClick={() => setCardFlipped(!cardFlipped)}>
                          <div className={`flashcard ${cardFlipped ? 'flipped' : ''}`}>
                            {/* Front (Question) */}
                            <div className="flashcard-front">
                              <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
                                <Badge type={currentCard.importance} label={currentCard.importance.toUpperCase()} />
                                <Badge type={currentCard.difficulty === 'easy' ? 'success' : currentCard.difficulty === 'hard' ? 'danger' : 'warning'} label={currentCard.difficulty.toUpperCase()} />
                              </div>
                              <h4 style={{ fontWeight: 800, fontSize: '1.1rem', margin: 0, lineHeight: 1.5 }}>
                                {currentCard.front}
                              </h4>
                              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 24, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Click to Reveal Answer (or press Space)
                              </p>
                            </div>

                            {/* Back (Answer) */}
                            <div className="flashcard-back">
                              <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
                                <Badge type={currentCard.importance} label={currentCard.importance.toUpperCase()} />
                                <Badge type={currentCard.difficulty === 'easy' ? 'success' : currentCard.difficulty === 'hard' ? 'danger' : 'warning'} label={currentCard.difficulty.toUpperCase()} />
                              </div>
                              <p style={{ fontSize: '0.88rem', margin: 0, lineHeight: 1.6, fontWeight: 500, color: 'var(--text-primary)', whiteSpace: 'pre-wrap' }}>
                                {currentCard.back}
                              </p>
                              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 24, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Click to Flip Back (or press Space)
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Navigation controls */}
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 16, marginTop: 12 }}>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setCardFlipped(false);
                              setActiveCardIndex(idx => (idx - 1 + filteredCards.length) % filteredCards.length);
                            }}
                          >
                            ◀ Prev
                          </button>
                          <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>
                            Card {activeCardIndex + 1} of {filteredCards.length}
                          </span>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setCardFlipped(false);
                              setActiveCardIndex(idx => (idx + 1) % filteredCards.length);
                            }}
                          >
                            Next ▶
                          </button>
                        </div>

                        <div style={{ textAlign: 'center', marginTop: 8 }}>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            Tip: Use Arrow Keys (◀ / ▶) to navigate, Spacebar to flip.
                          </span>
                        </div>

                        {/* Share Notes Section */}
                        <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--border-subtle)' }}>
                          <h4 style={{ fontWeight: 700, marginBottom: 8, fontSize: '0.95rem' }}>
                            📢 Share as Last-Minute Cheat Note
                          </h4>
                          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 12 }}>
                            Publish these cards as a clean, public checklist to share with friends. No sign-up required.
                          </p>

                          <form onSubmit={handleShareFlashcards} style={{ display: 'flex', gap: 10, flexWrap: 'wrap', maxWidth: 600 }}>
                            <input
                              type="text"
                              required
                              placeholder="Note title (e.g. OS Exam — Last Minute Guide)"
                              className="form-input"
                              style={{ flex: 1, minWidth: 200, padding: '8px 12px', fontSize: '0.88rem' }}
                              value={shareTitleInput}
                              onChange={e => setShareTitleInput(e.target.value)}
                            />
                            <button
                              type="submit"
                              disabled={sharingNotes}
                              className="btn btn-primary"
                              style={{ padding: '8px 16px', fontSize: '0.88rem' }}
                            >
                              {sharingNotes ? 'Generating...' : 'Generate Share Link'}
                            </button>
                          </form>

                          {generatedShareLink && (
                            <div style={{ marginTop: 16, background: 'var(--bg-elevated)', borderRadius: 8, padding: 12, border: '1px solid var(--border-strong)' }}>
                              <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                                <input
                                  type="text"
                                  readOnly
                                  value={generatedShareLink}
                                  className="form-input"
                                  style={{ flex: 1, minWidth: 240, background: 'var(--bg-base)', padding: '6px 10px', fontSize: '0.82rem', fontFamily: 'monospace' }}
                                />
                                <button className="btn btn-secondary btn-sm" onClick={handleCopyLink}>
                                  📋 Copy Link
                                </button>
                              </div>
                              <p style={{ margin: '8px 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                Anyone with this link can view your cheat note — no login required.
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          )}

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
