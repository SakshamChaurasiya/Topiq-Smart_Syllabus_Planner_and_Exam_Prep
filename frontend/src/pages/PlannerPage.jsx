// PlannerPage.jsx — Smart study plan generator + day-by-day roadmap
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { plannerAPI } from '../api/planner.api';
import { subjectAPI } from '../api/subject.api';
import { syllabusAPI } from '../api/syllabus.api';
import { LoadingScreen, LoadingSpinner } from '../components/ui/LoadingSpinner';
import Badge from '../components/ui/Badge';
import EmptyState from '../components/ui/EmptyState';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const goalOptions = [
  { value: 'pass',      label: '✅ Pass',    desc: 'Score 40%+',  color: '#10b981' },
  { value: 'good',      label: '🎯 Score',   desc: 'Score 65%+',  color: '#6366f1' },
  { value: 'excellent', label: '🏆 Topper',  desc: 'Score 85%+',  color: '#f59e0b' },
];

const PlannerPage = () => {
  const { id: subjectId } = useParams();
  const navigate = useNavigate();

  const [subject,  setSubject]  = useState(null);
  const [syllabus, setSyllabus] = useState(null);
  const [plan,     setPlan]     = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [generating, setGenerating] = useState(false);
  const [expandedDay, setExpandedDay] = useState(null);

  const [form, setForm] = useState({
    examDate: '',
    availableHoursPerDay: 4,
    targetGoal: 'good',
  });

  const fetchData = async () => {
    try {
      const [subRes, sylRes, planRes] = await Promise.allSettled([
        subjectAPI.getById(subjectId),
        syllabusAPI.getBySubject(subjectId),
        plannerAPI.getPlan(subjectId),
      ]);
      if (subRes.status  === 'fulfilled') setSubject(subRes.value.data.data);
      if (sylRes.status  === 'fulfilled') setSyllabus(sylRes.value.data.data);
      if (planRes.status === 'fulfilled') setPlan(planRes.value.data.data);
      // Pre-fill exam date if on subject
      if (subRes.status === 'fulfilled' && subRes.value.data.data?.examDate) {
        setForm(f => ({ ...f, examDate: subRes.value.data.data.examDate.split('T')[0] }));
      }
    } catch { }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [subjectId]);

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!form.examDate) return toast.error('Please select an exam date.');
    if (!syllabus?.isAnalyzed) return toast.error('Syllabus must be analyzed first. Go to Syllabus tab.');
    setGenerating(true);
    try {
      const res = await plannerAPI.generate({
        subjectId,
        examDate: form.examDate,
        availableHoursPerDay: Number(form.availableHoursPerDay),
        targetGoal: form.targetGoal,
      });
      toast.success(`Study plan generated! ${res.data.data.missionsCreated} missions created. 🎯`);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Plan generation failed.');
    } finally { setGenerating(false); }
  };

  const markDayComplete = async (dayIndex) => {
    try {
      await plannerAPI.markDayComplete(plan._id, dayIndex);
      toast.success('Day marked complete! 🎉');
      fetchData();
    } catch { toast.error('Failed to update day.'); }
  };

  if (loading) return <LoadingScreen text="Loading planner..." />;

  const today = new Date(); today.setHours(0,0,0,0);
  const importanceColor = { critical: 'var(--danger)', high: 'var(--warning)', medium: 'var(--primary)', low: 'var(--success)' };

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
            <h1 style={{ fontSize: '1.5rem' }}>{subject?.name} — Smart Planner</h1>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/subjects/${subjectId}/syllabus`)}>📋 Syllabus</button>
          <button className="btn btn-primary btn-sm" onClick={() => navigate(`/subjects/${subjectId}/planner`)}>🗺️ Planner</button>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/subjects/${subjectId}/cheatcode`)}>⚡ Cheat Code</button>
        </div>
      </div>

      {/* Syllabus not analyzed warning */}
      {(!syllabus || !syllabus.isAnalyzed) && (
        <div className="card" style={{ borderColor: 'rgba(245,158,11,0.4)', marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div style={{ fontWeight: 700, color: 'var(--warning)', marginBottom: 4 }}>⚠️ Syllabus Required</div>
              <p style={{ margin: 0, fontSize: '0.88rem' }}>
                {!syllabus ? 'No syllabus uploaded yet.' : 'Syllabus uploaded but not analyzed yet.'}
                {' '}You must upload and analyze a syllabus before generating a plan.
              </p>
            </div>
            <button className="btn btn-primary" onClick={() => navigate(`/subjects/${subjectId}/syllabus`)}>
              📋 Go to Syllabus
            </button>
          </div>
        </div>
      )}

      {/* Plan generator form */}
      <div style={{ display: 'grid', gridTemplateColumns: plan ? '1fr 2fr' : '1fr', gap: 24 }}>
        <div className="card">
          <h3 style={{ fontWeight: 700, marginBottom: 4 }}>🗺️ Generate Study Plan</h3>
          <p style={{ fontSize: '0.85rem', marginBottom: 20 }}>Customize and generate your AI-powered plan.</p>

          <form onSubmit={handleGenerate}>
            <div className="form-group">
              <label className="form-label">Exam Date *</label>
              <input
                type="date"
                className="form-input"
                value={form.examDate}
                min={new Date().toISOString().split('T')[0]}
                onChange={e => setForm(f => ({ ...f, examDate: e.target.value }))}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Study Hours Per Day</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <input
                  type="range" min={1} max={12} step={0.5}
                  value={form.availableHoursPerDay}
                  onChange={e => setForm(f => ({ ...f, availableHoursPerDay: e.target.value }))}
                  style={{ flex: 1, accentColor: 'var(--primary)' }}
                />
                <span style={{ fontWeight: 800, color: 'var(--primary-light)', minWidth: 40, textAlign: 'right' }}>
                  {form.availableHoursPerDay}h
                </span>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Target Goal</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
                {goalOptions.map(g => (
                  <button
                    key={g.value} type="button"
                    onClick={() => setForm(f => ({ ...f, targetGoal: g.value }))}
                    style={{
                      background: form.targetGoal === g.value ? `${g.color}20` : 'var(--bg-elevated)',
                      border: `2px solid ${form.targetGoal === g.value ? g.color : 'var(--border-default)'}`,
                      borderRadius: 10, padding: '10px 6px', cursor: 'pointer', textAlign: 'center', transition: 'all 0.15s',
                    }}
                  >
                    <div style={{ fontSize: '1rem', marginBottom: 3 }}>{g.label.split(' ')[0]}</div>
                    <div style={{ fontSize: '0.7rem', fontWeight: 700, color: form.targetGoal === g.value ? g.color : 'var(--text-muted)' }}>
                      {g.desc}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary w-full"
              disabled={generating || !syllabus?.isAnalyzed}
              style={{ marginTop: 8 }}
            >
              {generating ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
                  AI is building your plan...
                </span>
              ) : plan ? '🔄 Regenerate Plan' : '🤖 Generate AI Plan'}
            </button>
          </form>
        </div>

        {/* Active plan display */}
        {plan && (
          <div>
            {/* Plan summary */}
            <div className="card" style={{ marginBottom: 20, borderColor: 'rgba(99,102,241,0.3)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 14 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <h3 style={{ fontWeight: 800, margin: 0 }}>Your Study Roadmap</h3>
                    <Badge type={plan.mode === 'normal' ? 'primary' : 'danger'} label={plan.mode.toUpperCase()} />
                  </div>
                  <p style={{ margin: 0, fontSize: '0.88rem', lineHeight: 1.6 }}>{plan.planSummary}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 900, fontSize: '2rem', color: 'var(--primary-light)' }}>{plan.completionPercentage}%</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>complete</div>
                </div>
              </div>
              <div className="progress-bar" style={{ height: 8 }}>
                <div className="progress-bar-fill" style={{ width: `${plan.completionPercentage}%` }} />
              </div>

              {/* Stats row */}
              <div style={{ display: 'flex', gap: 24, marginTop: 14, flexWrap: 'wrap' }}>
                <div><div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Days</div>
                  <div style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{plan.daysRemaining}</div></div>
                <div><div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Hours/Day</div>
                  <div style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{plan.availableHoursPerDay}h</div></div>
                <div><div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Goal</div>
                  <div style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{plan.targetGoal}</div></div>
                <div><div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Exam</div>
                  <div style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{format(new Date(plan.examDate), 'dd MMM')}</div></div>
              </div>
            </div>

            {/* Priority topics */}
            {plan.priorityTopics?.length > 0 && (
              <div className="card" style={{ marginBottom: 16, background: 'rgba(99,102,241,0.06)', borderColor: 'rgba(99,102,241,0.2)' }}>
                <div style={{ fontWeight: 700, marginBottom: 10 }}>🎯 Priority Topics</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {plan.priorityTopics.map((t, i) => (
                    <span key={i} style={{ background: 'var(--primary-glow)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 100, padding: '4px 14px', fontSize: '0.8rem', color: 'var(--primary-light)', fontWeight: 600 }}>{t}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Must study topics */}
            {plan.mustStudyTopics?.length > 0 && (
              <div className="card" style={{ marginBottom: 16, background: 'rgba(239,68,68,0.06)', borderColor: 'rgba(239,68,68,0.25)' }}>
                <div style={{ fontWeight: 700, color: 'var(--danger)', marginBottom: 10 }}>⚡ Must Study</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {plan.mustStudyTopics.map((t, i) => (
                    <span key={i} style={{ background: 'var(--danger-bg)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 100, padding: '4px 14px', fontSize: '0.8rem', color: 'var(--danger)', fontWeight: 600 }}>{t}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Survival strategy */}
            {plan.survivalStrategy && (
              <div className="card" style={{ marginBottom: 16, background: 'rgba(245,158,11,0.06)', borderColor: 'rgba(245,158,11,0.25)' }}>
                <div style={{ fontWeight: 700, color: 'var(--warning)', marginBottom: 6 }}>💡 Study Strategy</div>
                <p style={{ margin: 0, fontSize: '0.88rem', lineHeight: 1.6 }}>{plan.survivalStrategy}</p>
              </div>
            )}

            {/* Daily roadmap */}
            {plan.dailyPlans?.length > 0 && (
              <div>
                <h4 style={{ fontWeight: 700, marginBottom: 12 }}>📅 Day-by-Day Roadmap</h4>
                {plan.dailyPlans.map((day, di) => {
                  const dayDate = new Date(day.date); dayDate.setHours(0,0,0,0);
                  const isToday = dayDate.getTime() === today.getTime();
                  const isPast = dayDate < today;
                  const isOpen = expandedDay === di || isToday;

                  return (
                    <div key={di} className={`roadmap-day ${isToday ? 'today' : ''} ${day.isCompleted ? 'completed' : ''}`}>
                      <div className="roadmap-day-header" onClick={() => setExpandedDay(isOpen ? null : di)}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{
                            width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                            background: day.isCompleted ? 'var(--success)' : isToday ? 'var(--primary)' : 'var(--bg-base)',
                            border: `2px solid ${day.isCompleted ? 'var(--success)' : isToday ? 'var(--primary)' : 'var(--border-strong)'}`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontWeight: 800, fontSize: '0.8rem', color: (day.isCompleted || isToday) ? '#fff' : 'var(--text-muted)',
                          }}>
                            {day.isCompleted ? '✓' : di + 1}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                              {day.dayLabel || `Day ${di + 1}`}
                              {isToday && <span className="badge badge-primary">TODAY</span>}
                              {day.isCompleted && <span className="badge badge-success">Done ✓</span>}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              {format(new Date(day.date), 'EEE, dd MMM')} · {day.plannedHours}h · {day.topics?.length} topics
                            </div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          {!day.isCompleted && !isPast && (
                            <button
                              className="btn btn-success btn-sm"
                              onClick={(e) => { e.stopPropagation(); markDayComplete(di); }}
                            >Mark Done</button>
                          )}
                          <span style={{ color: 'var(--text-muted)', fontSize: '1.2rem', transition: 'transform 0.2s', transform: isOpen ? 'rotate(180deg)' : 'none' }}>▾</span>
                        </div>
                      </div>

                      {isOpen && (
                        <div className="roadmap-day-body">
                          {day.studyTip && (
                            <div style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 8, padding: '10px 14px', marginBottom: 12 }}>
                              <span style={{ fontSize: '0.8rem', color: 'var(--primary-light)' }}>💡 {day.studyTip}</span>
                            </div>
                          )}
                          {day.topics?.map((t, ti) => (
                            <div key={ti} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                              <div style={{ width: 8, height: 8, borderRadius: '50%', background: importanceColor[t.importance] || 'var(--primary)', flexShrink: 0 }} />
                              <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{t.topicName}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t.unitName}</div>
                              </div>
                              <div style={{ display: 'flex', gap: 8 }}>
                                <Badge type={t.importance} label={t.importance} />
                                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>⏱ {t.estimatedHours}h</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* No plan yet — empty state */}
        {!plan && syllabus?.isAnalyzed && (
          <div className="card">
            <EmptyState
              icon="🗺️"
              title="No study plan yet"
              description="Fill the form and generate your personalized AI study plan."
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default PlannerPage;
