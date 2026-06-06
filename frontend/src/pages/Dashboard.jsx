// Dashboard.jsx — Premium, motivating, engagement-focused dashboard
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

/* Motivational messages keyed to readiness % */
const getReadinessMsg = (pct) => {
  if (pct >= 90) return { msg: '🏆 Exam Ready! You\'re crushing it.', color: 'var(--success)' };
  if (pct >= 70) return { msg: '🚀 Great progress! Keep the momentum.', color: '#06b6d4' };
  if (pct >= 50) return { msg: '🔥 You\'re halfway there — push forward!', color: 'var(--warning)' };
  if (pct >= 30) return { msg: '⚡ Getting started — every topic counts!', color: 'var(--primary-light)' };
  return { msg: '📚 Time to begin — your AI plan is ready.', color: 'var(--text-secondary)' };
};

const getMissionsMsg = (done, total) => {
  if (!total) return null;
  if (done === total) return '🏆 All missions done today! Amazing!';
  if (done === 0) return `🎯 ${total} missions waiting — start strong!`;
  const left = total - done;
  return `🎯 Only ${left} mission${left > 1 ? 's' : ''} left today — you\'re almost there!`;
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
      toast.success('✅ Mission complete! Keep going!');
      fetchDashboard();
    } catch { toast.error('Failed to update.'); }
  };

  if (loading) return <LoadingScreen text="Loading your study command center..." />;

  const { overview = {}, todayStats = {}, todayMissions = [], upcomingExams = [], weakSubjects = [], activePlans = [], subjects = [] } = data || {};

  const avgProgress = overview.avgProgress || 0;
  const readiness = getReadinessMsg(avgProgress);
  const missionMsg = getMissionsMsg(todayStats.completed || 0, todayStats.total || 0);

  return (
    <div className="page-container animate-fade-in">

      {/* ── READINESS HERO ── */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(6,182,212,0.06))',
        border: '1px solid rgba(99,102,241,0.2)',
        borderRadius: 'var(--r-xl)', padding: '28px 32px',
        marginBottom: 32, position: 'relative', overflow: 'hidden',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 24,
      }}>
        {/* Decorative glow */}
        <div style={{ position: 'absolute', right: -60, top: -60, width: 220, height: 220, background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', zIndex: 1, flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--primary-light)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
            ⚡ Smart Syllabus Planner — Your Study Command Center
          </div>
          <h1 style={{ fontSize: 'clamp(1.4rem,3vw,1.9rem)', fontWeight: 900, letterSpacing: '-0.04em', marginBottom: 6, color: 'var(--text-primary)' }}>
            {avgProgress > 0
              ? `You're ${avgProgress}% Exam Ready`
              : 'Welcome! Let\'s start your study journey'}
          </h1>
          <p style={{ margin: 0, fontSize: '0.9rem', color: readiness.color, fontWeight: 600 }}>
            {readiness.msg}
          </p>
          {missionMsg && (
            <p style={{ margin: '6px 0 0', fontSize: '0.83rem', color: 'var(--text-muted)' }}>{missionMsg}</p>
          )}
        </div>

        {/* Readiness ring */}
        {avgProgress > 0 && (
          <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', flexShrink: 0 }}>
            <ProgressRing
              percent={avgProgress}
              size={90}
              stroke={7}
              color={avgProgress >= 70 ? 'var(--success)' : avgProgress >= 40 ? 'var(--warning)' : 'var(--primary)'}
            />
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Avg Progress</div>
          </div>
        )}
      </div>

      {/* ── GAMIFICATION BAR ── */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 32, flexWrap: 'wrap' }}>
        <XPProgressBar currentXP={2450} targetXP={3000} level={12} />
        <StreakBadge streak={7} />
      </div>

      {/* ── STAT CARDS ── */}
      <div className="stats-grid" style={{ marginBottom: 32 }}>
        {[
          {
            icon: '📚', label: 'Subjects',
            value: overview.totalSubjects || 0,
            color: 'var(--primary-light)', bg: 'rgba(99,102,241,0.1)',
            sub: 'enrolled',
          },
          {
            icon: '🎯', label: 'Missions Today',
            value: `${todayStats.completed || 0}/${todayStats.total || 0}`,
            color: todayStats.completionRate >= 80 ? 'var(--success)' : 'var(--warning)',
            bg: 'rgba(245,158,11,0.1)',
            sub: `${todayStats.completionRate || 0}% done`,
          },
          {
            icon: '📅', label: 'Upcoming Exams',
            value: upcomingExams.length || 0,
            color: upcomingExams.some(e => e.daysLeft <= 3) ? 'var(--danger)' : 'var(--accent-cyan)',
            bg: 'rgba(6,182,212,0.1)',
            sub: upcomingExams[0] ? `Next: ${upcomingExams[0].name}` : 'No exams set',
          },
          {
            icon: '🔔', label: 'Notifications',
            value: overview.unreadNotifications || 0,
            color: 'var(--secondary-light)', bg: 'rgba(139,92,246,0.1)',
            sub: 'unread alerts',
          },
        ].map((s, i) => (
          <div key={s.label} className="stat-card animate-slide-up" style={{ animationDelay: `${i * 0.06}s` }}>
            <div className="stat-icon" style={{ background: s.bg }}>
              <span style={{ fontSize: '1.1rem' }}>{s.icon}</span>
            </div>
            <div>
              <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
              <div className="stat-label">{s.label}</div>
              {s.sub && <div style={{ fontSize: '0.68rem', color: 'var(--text-disabled)', marginTop: 3 }}>{s.sub}</div>}
            </div>
          </div>
        ))}
      </div>

      {/* ── TODAY'S PROGRESS BAR ── */}
      {(todayStats.total || 0) > 0 && (
        <div className="card" style={{ marginBottom: 24, padding: '18px 22px', background: todayStats.completionRate === 100 ? 'rgba(16,185,129,0.06)' : 'var(--bg-card)', borderColor: todayStats.completionRate === 100 ? 'rgba(16,185,129,0.3)' : 'var(--border-subtle)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div>
              <div style={{ fontWeight: 700, marginBottom: 2, fontSize: '0.95rem' }}>
                {todayStats.completionRate === 100 ? '🏆 All Missions Complete!' : `📅 ${format(new Date(), 'EEEE, dd MMM')} — Today's Progress`}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                {todayStats.completed}/{todayStats.total} missions completed
              </div>
            </div>
            <div style={{
              fontWeight: 900, fontSize: '1.5rem',
              color: todayStats.completionRate === 100 ? 'var(--success)' : 'var(--primary-light)',
              letterSpacing: '-0.04em',
            }}>
              {todayStats.completionRate || 0}%
            </div>
          </div>
          <div className="progress-bar" style={{ height: 8 }}>
            <div className="progress-bar-fill" style={{
              width: `${todayStats.completionRate || 0}%`,
              background: todayStats.completionRate === 100 ? 'var(--success)' : 'var(--brand-gradient)',
            }} />
          </div>
          {todayStats.completionRate === 100 && (
            <div style={{ textAlign: 'center', marginTop: 10, fontSize: '0.88rem', color: 'var(--success)', fontWeight: 700 }} className="animate-celebrate">
              🎉 Outstanding! You finished all your missions for today!
            </div>
          )}
        </div>
      )}

      {/* ── MAIN GRID: Missions + Sidebar ── */}
      <div className="dashboard-grid">

        {/* Left: Today's Missions */}
        <div>
          <div className="card-glow">
            <div className="card-header">
              <div>
                <div className="card-title">🎯 Today's Missions</div>
                {missionMsg && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>{missionMsg}</div>}
              </div>
              <button className="btn btn-secondary btn-sm" onClick={() => navigate('/missions')}>View All</button>
            </div>

            {!todayMissions?.length ? (
              <EmptyState
                icon="🎯"
                title="No missions yet today"
                description="Generate a study plan for any subject to activate daily missions and start your execution streak."
                action={
                  <button className="btn btn-primary" onClick={() => navigate('/subjects')}>
                    📚 Set Up Subjects →
                  </button>
                }
              />
            ) : (
              <div>
                {todayMissions.map((mission, idx) => (
                  <div key={mission._id} className="mission-card animate-slide-up" style={{ animationDelay: `${idx * 0.04}s` }}>
                    <div
                      className={`mission-checkbox ${mission.status === 'completed' ? 'checked' : ''}`}
                      onClick={() => mission.status !== 'completed' && completeMission(mission._id)}
                      style={{ cursor: mission.status === 'completed' ? 'default' : 'pointer' }}
                    >
                      {mission.status === 'completed' && <span style={{ color: '#fff', fontSize: '0.75rem', fontWeight: 700 }}>✓</span>}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3, flexWrap: 'wrap' }}>
                        <span style={{
                          fontWeight: 600, fontSize: '0.875rem',
                          textDecoration: mission.status === 'completed' ? 'line-through' : 'none',
                          color: mission.status === 'completed' ? 'var(--text-muted)' : 'var(--text-primary)',
                        }}>
                          {mission.title}
                        </span>
                        <Badge type={mission.priority} label={mission.priority} />
                      </div>
                      <div style={{ display: 'flex', gap: 12, fontSize: '0.72rem', color: 'var(--text-disabled)', flexWrap: 'wrap' }}>
                        {mission.subjectId?.name && <span>📚 {mission.subjectId.name}</span>}
                        <span>⏱ {mission.estimatedMinutes} min</span>
                        <span>⭐ {mission.xpReward} XP</span>
                      </div>
                    </div>

                    <div style={{ fontSize: '1rem' }}>
                      {mission.type === 'study' ? '📖' : mission.type === 'revision' ? '🔄' : '📝'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

          {/* Upcoming Exams */}
          <div className="card-glow">
            <div className="card-header">
              <div className="card-title">📅 Exam Countdown</div>
              <button className="btn btn-ghost btn-sm" onClick={() => navigate('/subjects')} style={{ fontSize: '0.72rem' }}>+ Add</button>
            </div>
            {!upcomingExams?.length ? (
              <p style={{ fontSize: '0.83rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                Set exam dates on your subjects to see the countdown here.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {upcomingExams.slice(0, 4).map(exam => (
                  <div key={exam.subjectId} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    background: 'var(--bg-elevated)', borderRadius: 10, padding: '10px 12px',
                    border: `1px solid ${exam.daysLeft <= 3 ? 'rgba(239,68,68,0.3)' : exam.daysLeft <= 7 ? 'rgba(245,158,11,0.2)' : 'var(--border-subtle)'}`,
                    transition: 'all 0.15s', cursor: 'pointer',
                  }}
                    onClick={() => navigate(`/subjects/${exam.subjectId}/cheatcode`)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: exam.color || '#6366f1', flexShrink: 0 }} />
                      <div>
                        <div style={{ fontSize: '0.83rem', fontWeight: 600, color: 'var(--text-primary)' }}>{exam.name}</div>
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{format(new Date(exam.examDate), 'dd MMM yyyy')}</div>
                      </div>
                    </div>
                    <div style={{
                      fontWeight: 800, fontSize: '0.9rem', minWidth: 36, textAlign: 'center',
                      color: exam.daysLeft <= 3 ? 'var(--danger)' : exam.daysLeft <= 7 ? 'var(--warning)' : 'var(--text-secondary)',
                    }}>
                      {exam.daysLeft}d
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ⚠️ Weak Subjects — Revision Alert */}
          {weakSubjects?.length > 0 && (
            <div className="card-glow" style={{ borderColor: 'rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.03)' }}>
              <div className="card-header">
                <div className="card-title" style={{ color: 'var(--danger)' }}>⚠️ Revision Radar</div>
                <span className="badge badge-danger">{weakSubjects.length} low</span>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 10, margin: '0 0 10px' }}>
                These subjects need attention before your exams.
              </p>
              {weakSubjects.map(sub => (
                <div key={sub.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border-subtle)', cursor: 'pointer' }}
                  onClick={() => navigate(`/subjects/${sub.id}/cheatcode`)}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: sub.color || 'var(--danger)', flexShrink: 0 }} />
                    <span style={{ fontSize: '0.83rem', fontWeight: 600 }}>{sub.name}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{ fontSize: '0.78rem', color: 'var(--danger)', fontWeight: 800 }}>{sub.progress}%</span>
                    <span style={{ fontSize: '0.68rem', color: 'var(--primary-light)', fontWeight: 600 }}>⚡ Cheat Code</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Active Plans */}
          {activePlans?.length > 0 && (
            <div className="card-glow">
              <div className="card-header">
                <div className="card-title">🗺️ Active Plans</div>
              </div>
              {activePlans.slice(0, 3).map(plan => (
                <div key={plan._id} style={{ marginBottom: 10, cursor: 'pointer' }} onClick={() => navigate(`/subjects/${plan.subjectId?._id}/planner`)}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                    <span style={{ fontSize: '0.83rem', fontWeight: 600 }}>{plan.subjectId?.name}</span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{plan.daysRemaining}d left</span>
                  </div>
                  <div className="progress-bar" style={{ height: 5 }}>
                    <div className="progress-bar-fill" style={{ width: `${plan.completionPercentage}%` }} />
                  </div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 3 }}>
                    {plan.completionPercentage}% complete
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Smart Recommendations */}
          <div className="card-glow" style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.06), rgba(6,182,212,0.04))' }}>
            <div className="card-header">
              <div className="card-title">💡 Smart Recommendations</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                !subjects.length && { icon: '📚', text: 'Add your subjects to get started', action: () => navigate('/subjects'), color: 'var(--primary-light)' },
                subjects.some(s => !s.hasSyllabus) && { icon: '📤', text: 'Upload syllabuses for AI analysis', action: () => navigate('/subjects'), color: 'var(--accent-cyan)' },
                !activePlans?.length && subjects.length > 0 && { icon: '🗺️', text: 'Generate your first study plan', action: () => navigate('/subjects'), color: 'var(--warning)' },
                weakSubjects?.length > 0 && { icon: '⚡', text: 'Activate Cheat Code for weak subjects', action: () => navigate(`/subjects/${weakSubjects[0]?.id}/cheatcode`), color: 'var(--danger)' },
                { icon: '🎯', text: 'Complete today\'s missions to build streak', action: () => navigate('/missions'), color: 'var(--success)' },
              ].filter(Boolean).slice(0, 3).map((rec, i) => rec && (
                <button key={i} onClick={rec.action} style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
                  background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)',
                  borderRadius: 10, cursor: 'pointer', textAlign: 'left',
                  width: '100%', transition: 'all 0.15s', fontFamily: 'var(--font-family)',
                }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-strong)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-subtle)'}
                >
                  <span style={{ fontSize: '1rem', flexShrink: 0 }}>{rec.icon}</span>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: rec.color, lineHeight: 1.3 }}>{rec.text}</span>
                  <span style={{ marginLeft: 'auto', color: 'var(--text-disabled)', fontSize: '0.75rem', flexShrink: 0 }}>→</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── SUBJECTS GRID (condensed) ── */}
      {subjects?.length > 0 && (
        <div style={{ marginTop: 28 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h3 style={{ fontWeight: 800, fontSize: '1rem', letterSpacing: '-0.02em' }}>📚 Your Subjects</h3>
            <button className="btn btn-secondary btn-sm" onClick={() => navigate('/subjects')}>Manage All</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(185px, 1fr))', gap: 10 }}>
            {subjects.map((sub, i) => {
              const prog = sub.progress || 0;
              const col = prog >= 70 ? 'var(--success)' : prog >= 40 ? 'var(--warning)' : 'var(--primary-light)';
              return (
                <div key={sub._id} className="card animate-slide-up"
                  style={{ padding: '14px', cursor: 'pointer', animationDelay: `${i * 0.04}s` }}
                  onClick={() => navigate(`/subjects/${sub._id}/syllabus`)}
                >
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 10 }}>
                    <div style={{ width: 34, height: 34, borderRadius: 9, background: sub.color || '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, color: '#fff', fontSize: '0.9rem', flexShrink: 0 }}>
                      {sub.name.charAt(0)}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: '0.82rem', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', letterSpacing: '-0.01em' }}>{sub.name}</div>
                      {sub.code && <div style={{ fontSize: '0.67rem', color: 'var(--text-muted)' }}>{sub.code}</div>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{sub.completedTopics}/{sub.totalTopics} topics</span>
                    <span style={{ fontSize: '0.72rem', fontWeight: 800, color: col }}>{prog}%</span>
                  </div>
                  <div className="progress-bar" style={{ height: 4 }}>
                    <div className="progress-bar-fill" style={{ width: `${prog}%`, background: col }} />
                  </div>
                </div>
              );
            })}
            {/* Add subject card */}
            <div
              style={{ border: '2px dashed var(--border-default)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 6, cursor: 'pointer', padding: 14, minHeight: 100, transition: 'all 0.15s' }}
              onClick={() => navigate('/subjects')}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.background = 'rgba(99,102,241,0.05)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-default)'; e.currentTarget.style.background = 'transparent'; }}
            >
              <span style={{ fontSize: '1.3rem' }}>➕</span>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>Add Subject</span>
            </div>
          </div>
        </div>
      )}

      {/* Empty state — no subjects at all */}
      {!subjects?.length && !loading && (
        <div className="card-glow" style={{ marginTop: 28, textAlign: 'center', padding: '48px' }}>
          <div style={{ fontSize: '3rem', marginBottom: 16 }}>🚀</div>
          <h2 style={{ fontWeight: 800, marginBottom: 8, letterSpacing: '-0.03em' }}>Start your study journey</h2>
          <p style={{ marginBottom: 24, fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            Add a subject → upload your syllabus → let AI build your personalized roadmap and daily missions.
          </p>
          <button className="btn-cta" onClick={() => navigate('/subjects')}>
            📚 Add Your First Subject
          </button>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
