// CheatCodePage.jsx — The main USP: exam survival cheat codes
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { plannerAPI } from '../api/planner.api';
import { subjectAPI } from '../api/subject.api';
import { syllabusAPI } from '../api/syllabus.api';
import { LoadingScreen } from '../components/ui/LoadingSpinner';
import Badge from '../components/ui/Badge';
import toast from 'react-hot-toast';

const MODES = [
  { days: 1,  label: '1 Day',    emoji: '🔴', color: '#ef4444', desc: 'Survival mode' },
  { days: 3,  label: '3 Days',   emoji: '🟠', color: '#f97316', desc: 'Crisis mode' },
  { days: 7,  label: '7 Days',   emoji: '🟡', color: '#f59e0b', desc: 'Rush mode' },
  { days: 15, label: '15 Days',  emoji: '🟢', color: '#10b981', desc: 'Prep mode' },
  { days: -1, label: 'Custom',   emoji: '⚙️', color: '#6366f1', desc: 'Choose days' },
];

const CheatCodePage = () => {
  const { id: subjectId } = useParams();
  const navigate = useNavigate();

  const [subject,  setSubject]  = useState(null);
  const [syllabus, setSyllabus] = useState(null);
  const [result,   setResult]   = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedMode, setSelectedMode] = useState(null);
  const [customDays, setCustomDays]     = useState(10);
  const [hoursPerDay, setHoursPerDay]   = useState(6);
  const [targetGoal, setTargetGoal]     = useState('pass');

  useEffect(() => {
    const fetch = async () => {
      try {
        const [subRes, sylRes] = await Promise.allSettled([
          subjectAPI.getById(subjectId),
          syllabusAPI.getBySubject(subjectId),
        ]);
        if (subRes.status  === 'fulfilled') setSubject(subRes.value.data.data);
        if (sylRes.status  === 'fulfilled') setSyllabus(sylRes.value.data.data);
      } catch {}
      finally { setLoading(false); }
    };
    fetch();
  }, [subjectId]);

  const activatCheatCode = async () => {
    if (!selectedMode) return toast.error('Select a mode first.');
    if (!syllabus?.isAnalyzed) return toast.error('Analyze syllabus first.');
    const days = selectedMode.days === -1 ? Number(customDays) : selectedMode.days;
    if (days < 1) return toast.error('Days must be at least 1.');
    setGenerating(true);
    try {
      const res = await plannerAPI.cheatCode({ subjectId, daysRemaining: days, targetGoal, availableHoursPerDay: hoursPerDay });
      setResult(res.data.data.cheatCode);
      toast.success(`⚡ Cheat Code activated — ${selectedMode.label} mode!`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate cheat code.');
    } finally { setGenerating(false); }
  };

  if (loading) return <LoadingScreen text="Loading..." />;

  const daysValue = selectedMode?.days === -1 ? customDays : selectedMode?.days;

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
            <h1 style={{ fontSize: '1.5rem' }}>{subject?.name} — ⚡ Cheat Code</h1>
            <p style={{ margin: 0, fontSize: '0.85rem' }}>Exam survival mode — maximize marks in minimum time</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/subjects/${subjectId}/syllabus`)}>📋 Syllabus</button>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/subjects/${subjectId}/planner`)}>🗺️ Planner</button>
          <button className="btn btn-primary btn-sm" style={{ background: 'linear-gradient(135deg,#ef4444,#f97316)' }} onClick={() => navigate(`/subjects/${subjectId}/cheatcode`)}>⚡ Cheat Code</button>
        </div>
      </div>

      {/* Syllabus required warning */}
      {(!syllabus || !syllabus.isAnalyzed) && (
        <div className="card" style={{ borderColor: 'rgba(245,158,11,0.4)', marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div style={{ fontWeight: 700, color: 'var(--warning)', marginBottom: 4 }}>⚠️ Syllabus Required</div>
              <p style={{ margin: 0, fontSize: '0.88rem' }}>Upload and analyze the syllabus first to enable cheat code.</p>
            </div>
            <button className="btn btn-primary" onClick={() => navigate(`/subjects/${subjectId}/syllabus`)}>📋 Upload Syllabus</button>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: result ? '1fr 1.6fr' : '1fr', gap: 24 }}>
        {/* Left: Mode selector + form */}
        <div>
          <div className="card">
            <h3 style={{ fontWeight: 800, marginBottom: 4, color: 'var(--danger)' }}>⚡ Activate Cheat Code</h3>
            <p style={{ fontSize: '0.85rem', marginBottom: 20 }}>How many days until your exam?</p>

            {/* Mode buttons */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 20 }}>
              {MODES.map(m => (
                <button
                  key={m.label} type="button"
                  onClick={() => setSelectedMode(m)}
                  style={{
                    background: selectedMode?.label === m.label ? `${m.color}20` : 'var(--bg-elevated)',
                    border: `2px solid ${selectedMode?.label === m.label ? m.color : 'var(--border-default)'}`,
                    borderRadius: 12, padding: '14px 8px', cursor: 'pointer',
                    textAlign: 'center', transition: 'all 0.15s',
                  }}
                >
                  <div style={{ fontSize: '1.4rem', marginBottom: 4 }}>{m.emoji}</div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 800, color: selectedMode?.label === m.label ? m.color : 'var(--text-primary)' }}>{m.label}</div>
                  <div style={{ fontSize: '0.67rem', color: 'var(--text-muted)', marginTop: 2 }}>{m.desc}</div>
                </button>
              ))}
            </div>

            {/* Custom days input */}
            {selectedMode?.days === -1 && (
              <div className="form-group">
                <label className="form-label">Days Remaining</label>
                <input
                  type="number" min={1} max={60}
                  className="form-input"
                  value={customDays}
                  onChange={e => setCustomDays(e.target.value)}
                />
              </div>
            )}

            {/* Hours slider */}
            <div className="form-group">
              <label className="form-label">Available Hours Per Day</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <input type="range" min={1} max={16} value={hoursPerDay} onChange={e => setHoursPerDay(e.target.value)}
                  style={{ flex: 1, accentColor: 'var(--danger)' }} />
                <span style={{ fontWeight: 800, color: 'var(--danger)', minWidth: 40, textAlign: 'right' }}>{hoursPerDay}h</span>
              </div>
            </div>

            {/* Target */}
            <div className="form-group">
              <label className="form-label">Target</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
                {[{ v: 'pass', l: '✅ Pass', c: '#10b981' }, { v: 'good', l: '🎯 Score', c: '#6366f1' }, { v: 'excellent', l: '🏆 Top', c: '#f59e0b' }].map(g => (
                  <button key={g.v} type="button" onClick={() => setTargetGoal(g.v)} style={{
                    background: targetGoal === g.v ? `${g.c}20` : 'var(--bg-elevated)',
                    border: `2px solid ${targetGoal === g.v ? g.c : 'var(--border-default)'}`,
                    borderRadius: 10, padding: '10px 6px', cursor: 'pointer', fontWeight: 700,
                    fontSize: '0.78rem', color: targetGoal === g.v ? g.c : 'var(--text-secondary)', transition: 'all 0.15s',
                  }}>{g.l}</button>
                ))}
              </div>
            </div>

            <button
              className="btn w-full"
              onClick={activatCheatCode}
              disabled={generating || !selectedMode || !syllabus?.isAnalyzed}
              style={{
                marginTop: 8,
                background: selectedMode ? `linear-gradient(135deg,${selectedMode.color},${selectedMode.color}aa)` : 'var(--bg-elevated)',
                color: selectedMode ? '#fff' : 'var(--text-muted)',
                border: 'none', fontSize: '1rem', padding: '14px',
                boxShadow: selectedMode ? `0 4px 24px ${selectedMode.color}40` : 'none',
                transition: 'all 0.2s',
              }}
            >
              {generating ? '⏳ AI is cooking...' : `⚡ Activate ${selectedMode?.label || 'Cheat Code'}`}
            </button>
          </div>
        </div>

        {/* Right: Result */}
        {result && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Header message */}
            <div className="card" style={{ borderColor: 'rgba(239,68,68,0.4)', background: 'rgba(239,68,68,0.06)' }}>
              <div style={{ fontSize: '1.3rem', fontWeight: 900, color: 'var(--danger)', marginBottom: 8 }}>
                ⚡ {result.mode?.toUpperCase()} Cheat Code Activated
              </div>
              <p style={{ margin: 0, lineHeight: 1.7, fontSize: '0.9rem' }}>{result.message}</p>
              {result.survivalStrategy && (
                <div style={{ marginTop: 12, padding: '12px', background: 'var(--bg-elevated)', borderRadius: 8, borderLeft: '3px solid var(--danger)' }}>
                  <p style={{ margin: 0, fontSize: '0.85rem', lineHeight: 1.6 }}>{result.survivalStrategy}</p>
                </div>
              )}
            </div>

            {/* Expected score */}
            {result.expectedScore && (
              <div className="card" style={{ borderColor: 'rgba(16,185,129,0.3)' }}>
                <div style={{ fontWeight: 700, marginBottom: 12 }}>📊 Expected Score Range</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
                  {[
                    { label: 'Minimum', val: result.expectedScore.minimum, color: 'var(--danger)' },
                    { label: 'Expected', val: result.expectedScore.expected, color: 'var(--primary-light)' },
                    { label: 'Best Case', val: result.expectedScore.maximum, color: 'var(--success)' },
                  ].map(s => (
                    <div key={s.label} style={{ textAlign: 'center', background: 'var(--bg-elevated)', borderRadius: 10, padding: '14px' }}>
                      <div style={{ fontSize: '1.6rem', fontWeight: 900, color: s.color }}>{s.val}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4, fontWeight: 600 }}>{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Must study NOW */}
            {result.mustStudyNow?.length > 0 && (
              <div className="card" style={{ borderColor: 'rgba(239,68,68,0.3)' }}>
                <div style={{ fontWeight: 800, color: 'var(--danger)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                  🔥 Must Study NOW
                  <span className="badge badge-danger">{result.mustStudyNow.length}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {result.mustStudyNow.map((item, i) => (
                    <div key={i} className="must-study-item">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                        <div>
                          <div style={{ fontWeight: 700, marginBottom: 4 }}>{item.topic}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>📂 {item.unit}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{item.reason}</div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
                          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--warning)' }}>~{item.estimatedMarks} marks</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>⏱ {item.studyTime}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Hourly schedule */}
            {result.hourlySchedule?.length > 0 && (
              <div className="card">
                <div style={{ fontWeight: 700, marginBottom: 12 }}>🕐 Today's Schedule</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {result.hourlySchedule.map((slot, i) => (
                    <div key={i} style={{ display: 'flex', gap: 14, padding: '10px', background: 'var(--bg-elevated)', borderRadius: 8, alignItems: 'center' }}>
                      <div style={{ fontWeight: 700, fontSize: '0.78rem', color: 'var(--primary-light)', minWidth: 120, flexShrink: 0 }}>{slot.timeSlot}</div>
                      <div style={{ width: 1, height: 30, background: 'var(--border-strong)', flexShrink: 0 }} />
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{slot.task}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{slot.topic}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Skip topics */}
            {result.skipTopics?.length > 0 && (
              <div className="card" style={{ opacity: 0.8 }}>
                <div style={{ fontWeight: 700, color: 'var(--text-muted)', marginBottom: 10 }}>🚫 Skip These (For Now)</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {result.skipTopics.map((item, i) => (
                    <div key={i} className="must-study-item skip-item">
                      <div style={{ fontWeight: 600, marginBottom: 3, fontSize: '0.88rem', textDecoration: 'line-through', color: 'var(--text-muted)' }}>{item.topic}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-disabled)' }}>{item.reason}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Last minute tips */}
            {result.lastMinuteTips?.length > 0 && (
              <div className="card" style={{ background: 'rgba(6,182,212,0.06)', borderColor: 'rgba(6,182,212,0.25)' }}>
                <div style={{ fontWeight: 700, color: 'var(--accent)', marginBottom: 10 }}>💡 Last Minute Tips</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {result.lastMinuteTips.map((tip, i) => (
                    <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                      <span style={{ color: 'var(--accent)', fontWeight: 700, flexShrink: 0 }}>{i + 1}.</span>
                      <span style={{ fontSize: '0.85rem', lineHeight: 1.5 }}>{tip}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CheatCodePage;
