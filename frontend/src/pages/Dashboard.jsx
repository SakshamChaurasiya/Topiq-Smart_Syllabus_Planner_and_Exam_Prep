// Dashboard.jsx — 2025 redesign: flat surfaces, stat pills, no inline hover
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { dashboardAPI } from '../api/dashboard.api';
import { missionAPI } from '../api/mission.api';
import { LoadingScreen } from '../components/ui/LoadingSpinner';
import EmptyState from '../components/ui/EmptyState';
import ProgressRing from '../components/ui/ProgressRing';
import Badge from '../components/ui/Badge';
import XPProgressBar from '../components/gamification/XPProgressBar';
import StreakBadge from '../components/gamification/StreakBadge';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import {
  BookOpen, Target, CalendarDays, Bell, Map,
  Check, RefreshCcw, FileText, Plus, Rocket,
  AlertTriangle, Zap, Lightbulb, ArrowRight,
  BookMarked, ChevronRight,
} from 'lucide-react';

/* Readiness message — logic unchanged */
const getReadinessMsg = (pct) => {
  if (pct >= 90) return { msg: 'Exam Ready — keep the momentum.', color: 'var(--success)' };
  if (pct >= 70) return { msg: 'Great progress! Keep pushing forward.', color: 'var(--info)' };
  if (pct >= 50) return { msg: "Halfway there — don't stop now.", color: 'var(--warning)' };
  if (pct >= 30) return { msg: 'Getting started — every topic counts!', color: 'var(--accent)' };
  return { msg: 'Your AI plan is ready. Begin today.', color: 'var(--txt-2)' };
};

const getMissionsMsg = (done, total) => {
  if (!total) return null;
  if (done === total) return 'All missions done today!';
  if (done === 0) return `${total} missions waiting — start strong!`;
  const left = total - done;
  return `${left} mission${left > 1 ? 's' : ''} left today`;
};

const Dashboard = () => {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchDashboard = async () => {
    try {
      const res = await dashboardAPI.get();
      setData(res.data.data);
    } catch {
      toast.error('Failed to load dashboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDashboard(); }, []);

  const completeMission = async (id) => {
    try {
      await missionAPI.updateStatus(id, 'completed');
      toast.success('Mission complete! Keep going!');
      fetchDashboard();
    } catch { toast.error('Failed to update.'); }
  };

  if (loading) return <LoadingScreen text="Loading dashboard..." />;

  const {
    user: dashboardUser = {},
    overview = {},
    todayStats = {},
    todayMissions = [],
    upcomingExams = [],
    weakSubjects = [],
    activePlans = [],
    subjects = [],
  } = data || {};

  const avgProgress = overview.avgProgress || 0;
  const readiness = getReadinessMsg(avgProgress);
  const missionMsg = getMissionsMsg(todayStats.completed || 0, todayStats.total || 0);

  const hour = new Date().getHours();
  const greeting =
    hour < 5  ? 'Good night' :
    hour < 12 ? 'Good morning' :
    hour < 17 ? 'Good afternoon' :
                'Good evening';
  const firstName = dashboardUser?.name?.split(' ')[0] || 'Student';

  return (
    <div className="page-container animate-fade-in">

      {/* ── PAGE HEADER ── */}
      <div className="dash-header">
        <h1 className="dash-greeting">{greeting}, {firstName}</h1>
        <span className="dash-date">
          {format(new Date(), 'EEEE, dd MMM yyyy')}
        </span>
      </div>

      {/* ── STAT PILLS ── */}
      <div className="stat-row">
        <div className="stat-pill">
          <div className="stat-pill-value">{overview.totalSubjects || 0}</div>
          <div className="stat-pill-label">Subjects</div>
        </div>
        <div className="stat-pill">
          <div className="stat-pill-value">
            {todayStats.completed || 0}/{todayStats.total || 0}
          </div>
          <div className="stat-pill-label">Missions Today</div>
        </div>
        <div className="stat-pill">
          <div className="stat-pill-value">{avgProgress}%</div>
          <div className="stat-pill-label">Avg Progress</div>
        </div>
        <div className="stat-pill">
          <div className="stat-pill-value">{upcomingExams.length || 0}</div>
          <div className="stat-pill-label">Upcoming Exams</div>
        </div>
      </div>

      {/* ── GAMIFICATION BAR ── */}
      <div className="dash-gami-bar">
        <XPProgressBar
          currentXP={dashboardUser.xp || 0}
          targetXP={dashboardUser.targetXP || 250}
          level={dashboardUser.level || 1}
        />
        <StreakBadge streak={dashboardUser.streak || 0} />
      </div>

      {/* ── TODAY'S PROGRESS ── */}
      {(todayStats.total || 0) > 0 && (
        <div className="card dash-progress-card">
          <div className="dash-progress-header">
            <div>
              <div className="dash-progress-label">
                {format(new Date(), 'EEEE')} — Today's Progress
              </div>
              <div className="dash-progress-sub">
                {todayStats.completed}/{todayStats.total} missions completed
                {missionMsg && ` · ${missionMsg}`}
              </div>
            </div>
            <div className={`dash-progress-pct${todayStats.completionRate === 100 ? ' done' : ''}`}>
              {todayStats.completionRate || 0}%
            </div>
          </div>
          <div className="progress-bar">
            <div
              className="progress-bar-fill"
              style={{
                width: `${todayStats.completionRate || 0}%`,
                background: todayStats.completionRate === 100 ? 'var(--success)' : 'var(--accent)',
              }}
            />
          </div>
          {todayStats.completionRate === 100 && (
            <div className="dash-progress-done-msg">
              Outstanding! All missions completed for today.
            </div>
          )}
        </div>
      )}

      {/* ── MAIN GRID: Missions + Right sidebar ── */}
      <div className="dashboard-grid">

        {/* Left: Today's Missions */}
        <div>
          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Target size={14} strokeWidth={2} style={{ color: 'var(--warning)' }} />
                  Today's Missions
                </div>
                {missionMsg && (
                  <div style={{ fontSize: '0.72rem', color: 'var(--txt-3)', marginTop: 2 }}>
                    {missionMsg}
                  </div>
                )}
              </div>
              <button className="btn btn-secondary btn-sm" onClick={() => navigate('/missions')}>
                View All
              </button>
            </div>

            {!todayMissions?.length ? (
              <EmptyState
                icon={<Target size={36} strokeWidth={1} color="var(--txt-3)" />}
                title="No missions yet today"
                description="Generate a study plan for any subject to activate daily missions."
                action={
                  <button className="btn btn-primary btn-sm" onClick={() => navigate('/subjects')}>
                    <BookOpen size={14} strokeWidth={2} /> Set Up Subjects
                  </button>
                }
              />
            ) : (
              <div>
                {todayMissions.map((mission, idx) => (
                  <div
                    key={mission._id}
                    className={`mission-card animate-slide-up${mission.status === 'completed' ? ' completed' : ''}`}
                    style={{ animationDelay: `${idx * 0.04}s` }}
                  >
                    {/* Checkbox */}
                    <div
                      className={`mission-checkbox${mission.status === 'completed' ? ' checked' : ''}`}
                      onClick={() => mission.status !== 'completed' && completeMission(mission._id)}
                      style={{ cursor: mission.status === 'completed' ? 'default' : 'pointer' }}
                    >
                      {mission.status === 'completed' && (
                        <Check size={11} strokeWidth={3} style={{ color: '#fff' }} />
                      )}
                    </div>

                    {/* Body */}
                    <div className="mission-body">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
                        <span className="mission-title">{mission.title}</span>
                        <Badge type={mission.priority} label={mission.priority} />
                      </div>
                      <div className="mission-meta">
                        {mission.subjectId?.name && (
                          <span>
                            <BookOpen size={10} strokeWidth={2} style={{ display: 'inline', verticalAlign: 'middle' }} />{' '}
                            {mission.subjectId.name}
                          </span>
                        )}
                        <span>{mission.estimatedMinutes} min</span>
                        <span>{mission.xpReward} XP</span>
                      </div>
                    </div>

                    {/* Type icon */}
                    <div className="mission-type-icon">
                      {mission.type === 'study'
                        ? <BookMarked size={15} strokeWidth={1.75} />
                        : mission.type === 'revision'
                        ? <RefreshCcw size={15} strokeWidth={1.75} />
                        : <FileText size={15} strokeWidth={1.75} />}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Exam Countdown */}
          <div className="card">
            <div className="card-header">
              <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <CalendarDays size={14} strokeWidth={2} style={{ color: 'var(--info)' }} />
                Exam Countdown
              </div>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => navigate('/subjects')}
              >
                + Add
              </button>
            </div>
            {!upcomingExams?.length ? (
              <p style={{ fontSize: '0.82rem', color: 'var(--txt-3)', lineHeight: 1.55, margin: 0 }}>
                Set exam dates on your subjects to see the countdown here.
              </p>
            ) : (
              <div>
                {upcomingExams.slice(0, 4).map(exam => (
                  <div
                    key={exam.subjectId}
                    className={`exam-row${exam.daysLeft <= 3 ? ' urgent' : exam.daysLeft <= 7 ? ' warning' : ''}`}
                    onClick={() => navigate(`/subjects/${exam.subjectId}/cheatcode`)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div className="exam-dot" style={{ background: exam.color || 'var(--accent)' }} />
                      <div>
                        <div className="exam-name">{exam.name}</div>
                        <div className="exam-date">{format(new Date(exam.examDate), 'dd MMM yyyy')}</div>
                      </div>
                    </div>
                    <div
                      className="exam-days"
                      style={{
                        color: exam.daysLeft <= 3 ? 'var(--danger)'
                          : exam.daysLeft <= 7 ? 'var(--warning)'
                          : 'var(--txt-2)',
                      }}
                    >
                      {exam.daysLeft}d
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Revision Radar — weak subjects */}
          {weakSubjects?.length > 0 && (
            <div className="card" style={{ borderColor: 'var(--danger-border)' }}>
              <div className="card-header">
                <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--danger)' }}>
                  <AlertTriangle size={14} strokeWidth={2} />
                  Revision Radar
                </div>
                <span className="badge badge-danger">{weakSubjects.length} low</span>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--txt-3)', marginBottom: 10, lineHeight: 1.5 }}>
                These subjects need attention before your exams.
              </p>
              {weakSubjects.map(sub => (
                <div
                  key={sub.id}
                  className="weak-subject-row"
                  onClick={() => navigate(`/subjects/${sub.id}/cheatcode`)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: sub.color || 'var(--danger)', flexShrink: 0 }} />
                    <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--txt)' }}>{sub.name}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{ fontSize: '0.78rem', color: 'var(--danger)', fontWeight: 700 }}>{sub.progress}%</span>
                    <span style={{ fontSize: '0.68rem', color: 'var(--accent)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3 }}>
                      <Zap size={10} strokeWidth={2.5} /> Cheat Code
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Active Plans */}
          {activePlans?.length > 0 && (
            <div className="card">
              <div className="card-header">
                <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Map size={14} strokeWidth={2} style={{ color: 'var(--info)' }} />
                  Active Plans
                </div>
              </div>
              {activePlans.slice(0, 3).map(plan => (
                <div
                  key={plan._id}
                  style={{ marginBottom: 12, cursor: 'pointer' }}
                  onClick={() => navigate(`/subjects/${plan.subjectId?._id}/planner`)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--txt)' }}>
                      {plan.subjectId?.name}
                    </span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--txt-3)' }}>
                      {plan.daysRemaining}d left
                    </span>
                  </div>
                  <div className="progress-bar" style={{ height: 4 }}>
                    <div
                      className="progress-bar-fill"
                      style={{ width: `${plan.completionPercentage}%` }}
                    />
                  </div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--txt-3)', marginTop: 3 }}>
                    {plan.completionPercentage}% complete
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Smart Recommendations */}
          <div className="card">
            <div className="card-header">
              <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Lightbulb size={14} strokeWidth={2} style={{ color: 'var(--warning)' }} />
                Recommendations
              </div>
            </div>
            <div>
              {[
                !subjects.length && {
                  Icon: BookOpen, text: 'Add your subjects to get started',
                  action: () => navigate('/subjects'), color: 'var(--accent)',
                },
                subjects.some(s => !s.hasSyllabus) && {
                  Icon: BookOpen, text: 'Upload syllabuses for AI analysis',
                  action: () => navigate('/subjects'), color: 'var(--info)',
                },
                !activePlans?.length && subjects.length > 0 && {
                  Icon: Map, text: 'Generate your first study plan',
                  action: () => navigate('/subjects'), color: 'var(--warning)',
                },
                weakSubjects?.length > 0 && {
                  Icon: Zap, text: 'Activate Cheat Code for weak subjects',
                  action: () => navigate(`/subjects/${weakSubjects[0]?.id}/cheatcode`),
                  color: 'var(--danger)',
                },
                {
                  Icon: Target, text: "Complete today's missions to build streak",
                  action: () => navigate('/missions'), color: 'var(--success)',
                },
              ].filter(Boolean).slice(0, 3).map((rec, i) => rec && (
                <button key={i} onClick={rec.action} className="rec-btn">
                  <rec.Icon size={15} strokeWidth={1.75} style={{ color: rec.color, flexShrink: 0 }} />
                  <span className="rec-btn-text">{rec.text}</span>
                  <ChevronRight size={13} strokeWidth={2} style={{ color: 'var(--txt-3)', flexShrink: 0 }} />
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* ── SUBJECTS GRID ── */}
      {subjects?.length > 0 && (
        <div style={{ marginTop: 28 }}>
          <hr className="dash-section-divider" />
          <div className="dash-subjects-header">
            <div className="dash-subjects-title">
              <BookOpen size={15} strokeWidth={2} style={{ color: 'var(--accent)' }} />
              Your Subjects
            </div>
            <button className="btn btn-secondary btn-sm" onClick={() => navigate('/subjects')}>
              Manage All
            </button>
          </div>
          <div className="subject-mini-grid">
            {subjects.map((sub, i) => {
              const prog = sub.progress || 0;
              const col = prog >= 70 ? 'var(--success)' : prog >= 40 ? 'var(--warning)' : 'var(--accent)';
              return (
                <div
                  key={sub._id}
                  className="subject-mini-card animate-slide-up"
                  style={{ animationDelay: `${i * 0.04}s` }}
                  onClick={() => navigate(`/subjects/${sub._id}/syllabus`)}
                >
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 10 }}>
                    <div
                      className="subject-mini-icon"
                      style={{ background: sub.color || 'var(--accent)' }}
                    >
                      {sub.name.charAt(0)}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div className="subject-mini-name">{sub.name}</div>
                      {sub.code && <div className="subject-mini-code">{sub.code}</div>}
                    </div>
                  </div>
                  <div className="subject-mini-progress-row">
                    <span style={{ fontSize: '0.68rem', color: 'var(--txt-3)' }}>
                      {sub.completedTopics}/{sub.totalTopics} topics
                    </span>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: col }}>
                      {prog}%
                    </span>
                  </div>
                  <div className="progress-bar" style={{ height: 3 }}>
                    <div className="progress-bar-fill" style={{ width: `${prog}%`, background: col }} />
                  </div>
                </div>
              );
            })}
          </div>
          {/* + Add Subject text button (replaces dashed card) */}
          <button className="add-subject-btn" onClick={() => navigate('/subjects')}>
            <Plus size={14} strokeWidth={2} /> Add Subject
          </button>
        </div>
      )}

      {/* Empty state — no subjects */}
      {!subjects?.length && !loading && (
        <div className="card dash-empty-card">
          <Rocket size={40} strokeWidth={1.25} style={{ color: 'var(--accent)', marginBottom: 16 }} />
          <h2 style={{ fontWeight: 800, marginBottom: 8, letterSpacing: '-0.03em', fontSize: '1.15rem' }}>
            Start your study journey
          </h2>
          <p style={{ marginBottom: 24, fontSize: '0.88rem', color: 'var(--txt-2)', lineHeight: 1.6 }}>
            Add a subject → upload your syllabus → let AI build your personalized roadmap.
          </p>
          <button className="btn btn-primary btn-md" onClick={() => navigate('/subjects')}>
            <BookOpen size={15} strokeWidth={2} /> Add Your First Subject
          </button>
        </div>
      )}

    </div>
  );
};

export default Dashboard;
