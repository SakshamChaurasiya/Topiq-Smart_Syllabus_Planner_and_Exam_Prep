// PlannerPage.jsx — Smart study plan generator + day-by-day roadmap
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { plannerAPI } from '../api/planner.api';
import { subjectAPI } from '../api/subject.api';
import { syllabusAPI } from '../api/syllabus.api';
import { LoadingScreen } from '../components/ui/LoadingSpinner';
import Badge from '../components/ui/Badge';
import EmptyState from '../components/ui/EmptyState';
import { format, isPast } from 'date-fns';
import toast from 'react-hot-toast';
import {
  ArrowLeft, CalendarDays, AlertTriangle, Target, Zap, Lightbulb,
  Clock, Download, ChevronRight, Check, Sparkles, RefreshCw, BookOpen
} from 'lucide-react';

const goalOptions = [
  { value: 'pass',      label: 'Pass Mode',    desc: 'Score 40%+',  color: 'var(--success)' },
  { value: 'good',      label: 'Score Mode',   desc: 'Score 65%+',  color: 'var(--accent)' },
  { value: 'excellent', label: 'Topper Mode',  desc: 'Score 85%+',  color: 'var(--warning)' },
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
  const [exporting, setExporting] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [rescheduling, setRescheduling] = useState(false);

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

  const handleExportICS = async () => {
    if (!plan?._id) return;
    setExporting(true);
    try {
      const res = await plannerAPI.exportICS(plan._id);
      const blob = new Blob([res.data], { type: 'text/calendar;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      const contentDisposition = res.headers['content-disposition'];
      let filename = `${subject?.name || 'subject'}-study-plan.ics`;
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="?([^"]+)"?/);
        if (match && match[1]) filename = match[1];
      }
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Calendar file downloaded! Import it into your calendar app.');
    } catch (err) {
      console.error('Failed to export calendar:', err);
      toast.error('Failed to export calendar. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const handleReschedule = async () => {
    if (!plan?._id) return;
    setRescheduling(true);
    const todayMidnight = new Date(); todayMidnight.setHours(0,0,0,0);
    const missedDaysCount = plan.dailyPlans.filter(d => new Date(d.date) < todayMidnight && !d.isCompleted).length;
    try {
      await plannerAPI.reschedule(plan._id);
      toast.success(`Topics from ${missedDaysCount} missed days redistributed across your remaining schedule.`);
      setBannerDismissed(true);
      fetchData();
    } catch (err) {
      console.error('Failed to reschedule:', err);
      const errMsg = err.response?.data?.message || '';
      if (errMsg.includes('No remaining days') || err.response?.status === 400) {
        toast.error('No remaining days to reschedule into. Try Crisis Mode instead.');
      } else {
        toast.error(errMsg || 'Failed to reschedule missed days. Please try again.');
      }
    } finally {
      setRescheduling(false);
    }
  };

  if (loading) return <LoadingScreen text="Loading planner..." />;

  const today = new Date(); today.setHours(0,0,0,0);
  const importanceColor = { critical: 'var(--danger)', high: 'var(--warning)', medium: 'var(--accent)', low: 'var(--success)' };

  const missedDays = plan?.dailyPlans?.filter(d => new Date(d.date) < today && !d.isCompleted) || [];
  const showMissedBanner = plan && missedDays.length > 0 && !bannerDismissed;

  return (
    <div className="page-container animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div className="planner-header-flex">
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/subjects')}>
            <ArrowLeft size={16} style={{ marginRight: 4 }} /> Back
          </button>
          <div className="planner-subject-avatar" style={{ background: subject?.color || 'var(--accent)' }}>
            {subject?.name?.charAt(0)}
          </div>
          <div>
            <h1 style={{ fontSize: '1.5rem' }}>{subject?.name} — Smart Planner</h1>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap" style={{ marginTop: 12 }}>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/subjects/${subjectId}/syllabus`)}>Syllabus</button>
          <button className="btn btn-primary btn-sm" onClick={() => navigate(`/subjects/${subjectId}/planner`)}>Planner</button>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/subjects/${subjectId}/cheatcode`)}>Cheat Code</button>
        </div>
      </div>

      {/* Syllabus not analyzed warning */}
      {(!syllabus || !syllabus.isAnalyzed) && (
        <div className="card" style={{ borderColor: 'var(--warning-border)', marginBottom: 24 }}>
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="error-page-icon" size={24} style={{ color: 'var(--warning)', marginTop: 2 }} />
              <div>
                <div style={{ fontWeight: 700, color: 'var(--warning)', marginBottom: 4 }}>Syllabus Required</div>
                <p style={{ margin: 0, fontSize: '0.88rem' }}>
                  {!syllabus ? 'No syllabus uploaded yet.' : 'Syllabus uploaded but not analyzed yet.'}
                  {' '}You must upload and analyze a syllabus before generating a plan.
                </p>
              </div>
            </div>
            <button className="btn btn-primary" onClick={() => navigate(`/subjects/${subjectId}/syllabus`)}>
              Go to Syllabus
            </button>
          </div>
        </div>
      )}

      {/* Plan generator form */}
      <div className={`planner-grid${plan ? ' has-plan' : ''}`}>
        <div className="card">
          <h3 style={{ fontWeight: 700, marginBottom: 4 }}>Generate Study Plan</h3>
          <p style={{ fontSize: '0.85rem', marginBottom: 20, color: 'var(--txt-3)' }}>Customize and generate your AI-powered plan.</p>

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
              <div className="range-slider-container">
                <input
                  type="range" min={1} max={12} step={0.5}
                  value={form.availableHoursPerDay}
                  onChange={e => setForm(f => ({ ...f, availableHoursPerDay: e.target.value }))}
                  className="range-slider"
                />
                <span className="range-slider-value">
                  {form.availableHoursPerDay}h
                </span>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Target Goal</label>
              <div className="goal-grid">
                {goalOptions.map(g => {
                  const isActive = form.targetGoal === g.value;
                  return (
                    <button
                      key={g.value} type="button"
                      onClick={() => setForm(f => ({ ...f, targetGoal: g.value }))}
                      className={`goal-btn goal-${g.value}${isActive ? ' active' : ''}`}
                    >
                      <span className="goal-btn-label">
                        {g.label.split(' ')[0]}
                      </span>
                      <div style={{ fontSize: '0.7rem', fontWeight: 600, color: isActive ? 'inherit' : 'var(--txt-3)', marginTop: 4 }}>
                        {g.desc}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary w-full"
              disabled={generating || !syllabus?.isAnalyzed}
              style={{ marginTop: 8 }}
            >
              {generating ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
                  Building plan...
                </span>
              ) : plan ? 'Regenerate Plan' : 'Generate AI Plan'}
            </button>
          </form>
        </div>

        {/* Active plan display */}
        {plan && (
          <div>
            {/* Plan summary */}
            <div className="card" style={{ marginBottom: 20 }}>
              <div className="flex justify-between items-start flex-wrap gap-4" style={{ marginBottom: 14 }}>
                <div style={{ flex: 1, minWidth: 240 }}>
                  <div className="flex items-center gap-3" style={{ marginBottom: 8 }}>
                    <h3 style={{ fontWeight: 800, margin: 0 }}>Your Study Roadmap</h3>
                    <Badge type={plan.mode === 'normal' ? 'primary' : 'danger'} label={plan.mode.toUpperCase()} />
                  </div>
                  <p style={{ margin: 0, fontSize: '0.88rem', lineHeight: 1.6, color: 'var(--txt-2)' }}>{plan.planSummary}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 900, fontSize: '2rem', color: 'var(--accent)' }}>{plan.completionPercentage}%</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--txt-3)' }}>complete</div>
                </div>
              </div>
              <div className="progress-bar" style={{ height: 8 }}>
                <div className="progress-bar-fill" style={{ width: `${plan.completionPercentage}%`, background: 'var(--accent)' }} />
              </div>

              {/* Stats row */}
              <div className="flex gap-5" style={{ marginTop: 14, flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--txt-3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Days</div>
                  <div style={{ fontWeight: 800, color: 'var(--txt)' }}>{plan.daysRemaining}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--txt-3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Hours/Day</div>
                  <div style={{ fontWeight: 800, color: 'var(--txt)' }}>{plan.availableHoursPerDay}h</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--txt-3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Goal</div>
                  <div style={{ fontWeight: 800, color: 'var(--txt)' }}>{plan.targetGoal}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--txt-3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Exam</div>
                  <div style={{ fontWeight: 800, color: 'var(--txt)' }}>{format(new Date(plan.examDate), 'dd MMM')}</div>
                </div>
              </div>

              {/* Export to Calendar section */}
              <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                <button
                  onClick={handleExportICS}
                  disabled={exporting}
                  className="btn btn-secondary btn-sm"
                >
                  {exporting ? (
                    <span className="flex items-center gap-2">
                      <div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />
                      Exporting...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Download size={14} /> Export to Calendar
                    </span>
                  )}
                </button>
                <p style={{ margin: '8px 0 0', fontSize: '0.75rem', color: 'var(--txt-3)', lineHeight: 1.4 }}>
                  Downloads an .ics file. Import into Google Calendar, Apple Calendar, or Outlook. Times are set to 9 AM — adjust after import to fit your schedule.
                </p>
              </div>
            </div>

            {/* Priority topics */}
            {plan.priorityTopics?.length > 0 && (
              <div className="card" style={{ marginBottom: 16, background: 'var(--success-bg)', borderColor: 'var(--success-border)' }}>
                <div className="flex items-center gap-2" style={{ fontWeight: 700, marginBottom: 10, color: 'var(--success)' }}>
                  <Target size={16} /> Priority Topics
                </div>
                <div className="flex flex-wrap gap-2">
                  {plan.priorityTopics.map((t, i) => (
                    <span key={i} className="badge badge-success">{t}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Must study topics */}
            {plan.mustStudyTopics?.length > 0 && (
              <div className="card" style={{ marginBottom: 16, background: 'var(--danger-bg)', borderColor: 'var(--danger-border)' }}>
                <div className="flex items-center gap-2" style={{ fontWeight: 700, color: 'var(--danger)', marginBottom: 10 }}>
                  <Zap size={16} /> Must Study
                </div>
                <div className="flex flex-wrap gap-2">
                  {plan.mustStudyTopics.map((t, i) => (
                    <span key={i} className="badge badge-danger">{t}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Survival strategy */}
            {plan.survivalStrategy && (
              <div className="card" style={{ marginBottom: 16, background: 'var(--info-bg)', borderColor: 'var(--info-border)' }}>
                <div className="flex items-center gap-2" style={{ fontWeight: 700, color: 'var(--info)', marginBottom: 6 }}>
                  <Lightbulb size={16} /> Study Strategy
                </div>
                <p style={{ margin: 0, fontSize: '0.88rem', lineHeight: 1.6, color: 'var(--txt-2)' }}>{plan.survivalStrategy}</p>
              </div>
            )}

            {/* Missed Days Reschedule Banner */}
            {showMissedBanner && (
              <div className="card" style={{ marginBottom: 20, borderColor: 'var(--warning-border)', display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div className="flex items-center gap-3">
                  <AlertTriangle size={20} className="error-page-icon" style={{ color: 'var(--warning)', margin: 0 }} />
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontSize: '0.88rem', fontWeight: 600, color: 'var(--warning)' }}>
                      You have {missedDays.length} missed study day(s).
                    </p>
                    <p style={{ margin: '2px 0 0', fontSize: '0.85rem', color: 'var(--txt-2)' }}>
                      Reschedule those topics across your remaining days?
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleReschedule}
                    disabled={rescheduling}
                    className="btn btn-primary btn-sm"
                    style={{ background: 'var(--warning)', borderColor: 'var(--warning)', color: '#000', fontWeight: 700 }}
                  >
                    {rescheduling ? 'Rescheduling...' : 'Reschedule Now'}
                  </button>
                  <button
                    onClick={() => setBannerDismissed(true)}
                    disabled={rescheduling}
                    className="btn btn-secondary btn-sm"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            )}

            {/* Daily roadmap */}
            {plan.dailyPlans?.length > 0 && (
              <div>
                <h4 className="flex items-center gap-2" style={{ fontWeight: 700, marginBottom: 12 }}>
                  <CalendarDays size={18} /> Day-by-Day Roadmap
                </h4>
                {plan.dailyPlans.map((day, di) => {
                  const dayDate = new Date(day.date); dayDate.setHours(0,0,0,0);
                  const isToday = dayDate.getTime() === today.getTime();
                  const isPast = dayDate < today;
                  const isOpen = expandedDay === di || isToday;

                  return (
                    <div key={di} className={`roadmap-day ${isToday ? 'today' : ''} ${day.isCompleted ? 'completed' : ''}`}>
                      <div className="roadmap-day-header" onClick={() => setExpandedDay(isOpen ? null : di)}>
                        <div className="flex items-center gap-3">
                          <div className="roadmap-day-avatar">
                            {day.isCompleted ? <Check size={14} strokeWidth={3} /> : di + 1}
                          </div>
                          <div>
                            <div className="roadmap-day-title-row">
                              {day.dayLabel || `Day ${di + 1}`}
                              {isToday && <span className="badge badge-primary">TODAY</span>}
                              {day.isCompleted && <span className="badge badge-success">Done</span>}
                              {day.rescheduled && (
                                <span className="badge badge-warning">
                                  Includes missed topics
                                </span>
                              )}
                            </div>
                            <div className="roadmap-day-subtitle">
                              {format(new Date(day.date), 'EEE, dd MMM')} · {day.plannedHours}h · {day.topics?.length} topics
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {!day.isCompleted && !isPast && (
                            <button
                              className="btn btn-success btn-sm"
                              onClick={(e) => { e.stopPropagation(); markDayComplete(di); }}
                            >
                              <Check size={14} />
                            </button>
                          )}
                          <ChevronRight size={16} style={{ color: 'var(--txt-3)', transition: 'transform 0.2s', transform: isOpen ? 'rotate(90deg)' : 'none' }} />
                        </div>
                      </div>

                      {isOpen && (
                        <div className="roadmap-day-body">
                          {day.studyTip && (
                            <div className="roadmap-day-tip">
                              <Lightbulb size={14} />
                              <span>{day.studyTip}</span>
                            </div>
                          )}
                          {day.topics?.map((t, ti) => (
                            <div key={ti} className="roadmap-topic-row">
                              <div className="roadmap-topic-indicator" style={{ background: importanceColor[t.importance] || 'var(--primary)' }} />
                              <div className="roadmap-topic-info">
                                <div className="roadmap-topic-title">{t.topicName}</div>
                                <div className="roadmap-topic-sub">{t.unitName}</div>
                              </div>
                              <div className="roadmap-topic-meta">
                                <Badge type={t.importance} label={t.importance} />
                                <span className="roadmap-topic-hours">
                                  <Clock size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 2 }} /> {t.estimatedHours}h
                                </span>
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
              icon={<CalendarDays size={40} className="error-page-icon" />}
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
