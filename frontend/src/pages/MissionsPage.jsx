// MissionsPage.jsx — Today's missions + all missions tracker
import { useState, useEffect } from 'react';
import { missionAPI } from '../api/mission.api';
import { LoadingScreen } from '../components/ui/LoadingSpinner';
import Badge from '../components/ui/Badge';
import EmptyState from '../components/ui/EmptyState';
import { useNavigate } from 'react-router-dom';
import { format, isToday, isPast } from 'date-fns';
import toast from 'react-hot-toast';

const typeIcon = { study: '📖', revision: '🔄', practice: '📝', summary: '✍️', quiz: '🎯' };
const statusColor = {
  pending:     'var(--text-muted)',
  'in-progress': 'var(--warning)',
  completed:   'var(--success)',
  skipped:     'var(--danger)',
};

const MissionsPage = () => {
  const navigate = useNavigate();
  const [data,    setData]    = useState(null);
  const [stats,   setStats]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('today'); // today | all
  const [allMissions, setAllMissions] = useState([]);
  const [allLoading, setAllLoading]   = useState(false);
  const [updatingId, setUpdatingId]   = useState(null);

  // Fetch today's missions
  const fetchToday = async () => {
    try {
      const [todayRes, statsRes] = await Promise.all([
        missionAPI.getToday(),
        missionAPI.getStats(),
      ]);
      setData(todayRes.data.data);
      setStats(statsRes.data.data);
    } catch {
      toast.error('Failed to load missions.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch all missions when tab switches
  const fetchAll = async () => {
    setAllLoading(true);
    try {
      const res = await missionAPI.getAll();
      setAllMissions(res.data.data || []);
    } catch {
      toast.error('Failed to load all missions.');
    } finally {
      setAllLoading(false);
    }
  };

  useEffect(() => { fetchToday(); }, []);

  useEffect(() => {
    if (activeTab === 'all') fetchAll();
  }, [activeTab]);

  const updateStatus = async (id, status) => {
    setUpdatingId(id);
    try {
      const res = await missionAPI.updateStatus(id, status);
      const xp = res.data.data?.xpEarned;
      if (status === 'completed') toast.success(`✅ Mission done!${xp ? ` +${xp} XP` : ''}`);
      else if (status === 'skipped') toast(`⏭ Mission skipped.`, { icon: '⚠️' });
      else toast.success('Status updated.');
      fetchToday();
      if (activeTab === 'all') fetchAll();
    } catch {
      toast.error('Failed to update mission.');
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) return <LoadingScreen text="Loading missions..." />;

  const { stats: todayStats, grouped, missions: todayMissions } = data || {};

  return (
    <div className="page-container animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <h1>🎯 Missions</h1>
        <p>Complete daily missions to stay on track and earn XP</p>
      </div>

      {/* Stats row */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
          {[
            { label: 'Total',     value: stats.total,      color: 'var(--primary-light)', bg: 'var(--primary-glow)' },
            { label: 'Completed', value: stats.completed,  color: 'var(--success)',       bg: 'rgba(16,185,129,0.1)' },
            { label: 'Pending',   value: stats.pending,    color: 'var(--warning)',        bg: 'rgba(245,158,11,0.1)' },
            { label: 'Rate',      value: `${stats.completionRate}%`, color: 'var(--accent)', bg: 'rgba(6,182,212,0.1)' },
          ].map(s => (
            <div key={s.label} className="stat-card" style={{ background: s.bg, border: 'none' }}>
              <div style={{ fontSize: '1.6rem', fontWeight: 900, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: 24 }}>
        <button className={`tab-btn ${activeTab === 'today' ? 'active' : ''}`} onClick={() => setActiveTab('today')}>
          📅 Today's Missions
          {todayStats?.pending > 0 && (
            <span style={{ marginLeft: 8, background: 'rgba(255,255,255,0.25)', borderRadius: 100, padding: '1px 8px', fontSize: '0.72rem', fontWeight: 700 }}>
              {todayStats.pending}
            </span>
          )}
        </button>
        <button className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`} onClick={() => setActiveTab('all')}>
          📋 All Missions
        </button>
      </div>

      {/* ── TODAY'S TAB ── */}
      {activeTab === 'today' && (
        <div>
          {/* Completion banner */}
          {todayStats?.total > 0 && (
            <div className="card" style={{ marginBottom: 20, padding: '16px 20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <div>
                  <span style={{ fontWeight: 700 }}>{format(new Date(), 'EEEE, dd MMMM')}</span>
                  <span style={{ marginLeft: 12, fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    {todayStats.completed}/{todayStats.total} done
                  </span>
                </div>
                <span style={{ fontWeight: 900, fontSize: '1.3rem', color: todayStats.completionRate >= 80 ? 'var(--success)' : 'var(--primary-light)' }}>
                  {todayStats.completionRate}%
                </span>
              </div>
              <div className="progress-bar" style={{ height: 7 }}>
                <div className="progress-bar-fill" style={{
                  width: `${todayStats.completionRate}%`,
                  background: todayStats.completionRate === 100 ? 'var(--success)' : 'linear-gradient(90deg, var(--primary), var(--secondary))',
                }} />
              </div>
              {todayStats.completionRate === 100 && (
                <div style={{ textAlign: 'center', marginTop: 10, color: 'var(--success)', fontWeight: 700, fontSize: '0.9rem' }}>
                  🎉 All missions done today! Amazing work!
                </div>
              )}
            </div>
          )}

          {/* No missions */}
          {!grouped?.length ? (
            <EmptyState
              icon="🎯"
              title="No missions today"
              description="Generate a study plan for a subject to get daily missions."
              action={<button className="btn btn-primary" onClick={() => navigate('/subjects')}>Go to Subjects →</button>}
            />
          ) : (
            /* Missions grouped by subject */
            grouped.map((group) => (
              <div key={group.subject?._id} className="card" style={{ marginBottom: 16 }}>
                {/* Subject header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid var(--border-subtle)' }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                    background: group.subject?.color || '#6366f1',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 800, color: '#fff', fontSize: '0.85rem',
                  }}>
                    {group.subject?.name?.charAt(0)}
                  </div>
                  <span style={{ fontWeight: 700 }}>{group.subject?.name || 'Unknown Subject'}</span>
                  <span className="badge badge-primary" style={{ marginLeft: 'auto' }}>
                    {group.missions.filter(m => m.status === 'completed').length}/{group.missions.length}
                  </span>
                </div>

                {/* Mission cards */}
                {group.missions.map(mission => (
                  <MissionItem
                    key={mission._id}
                    mission={mission}
                    onUpdate={updateStatus}
                    isUpdating={updatingId === mission._id}
                  />
                ))}
              </div>
            ))
          )}
        </div>
      )}

      {/* ── ALL MISSIONS TAB ── */}
      {activeTab === 'all' && (
        <div>
          {allLoading ? (
            <LoadingScreen text="Loading all missions..." />
          ) : !allMissions.length ? (
            <EmptyState icon="📋" title="No missions yet" description="Generate a study plan to create missions." />
          ) : (
            <div className="card">
              {allMissions.map((mission, i) => (
                <div key={mission._id}>
                  <MissionItem mission={mission} onUpdate={updateStatus} isUpdating={updatingId === mission._id} showDate />
                  {i < allMissions.length - 1 && <div style={{ height: 1, background: 'var(--border-subtle)', margin: '4px 0' }} />}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/* ── Single Mission Item Component ── */
const MissionItem = ({ mission, onUpdate, isUpdating, showDate = false }) => {
  const isCompleted = mission.status === 'completed';
  const isSkipped   = mission.status === 'skipped';

  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 12,
      padding: '10px 0', opacity: isCompleted || isSkipped ? 0.55 : 1,
      transition: 'opacity 0.2s',
    }}>
      {/* Checkbox */}
      <div
        onClick={() => !isCompleted && !isUpdating && onUpdate(mission._id, 'completed')}
        style={{
          width: 22, height: 22, borderRadius: 6, flexShrink: 0, marginTop: 2,
          border: `2px solid ${isCompleted ? 'var(--success)' : 'var(--border-strong)'}`,
          background: isCompleted ? 'var(--success)' : 'transparent',
          cursor: isCompleted ? 'default' : 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.15s',
        }}
      >
        {isCompleted && <span style={{ color: '#fff', fontSize: '0.72rem', fontWeight: 700 }}>✓</span>}
        {isUpdating && <div className="spinner" style={{ width: 10, height: 10, borderWidth: 1.5 }} />}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 3 }}>
          <span style={{ fontSize: '0.9rem' }}>{typeIcon[mission.type] || '📌'}</span>
          <span style={{
            fontWeight: 600, fontSize: '0.88rem',
            textDecoration: isCompleted || isSkipped ? 'line-through' : 'none',
            color: isCompleted || isSkipped ? 'var(--text-muted)' : 'var(--text-primary)',
          }}>
            {mission.title}
          </span>
          <Badge type={mission.priority} label={mission.priority} />
        </div>
        {mission.description && (
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '2px 0 4px', lineHeight: 1.5 }}>{mission.description}</p>
        )}
        <div style={{ display: 'flex', gap: 12, fontSize: '0.73rem', color: 'var(--text-disabled)', flexWrap: 'wrap' }}>
          {mission.topicName && <span>📌 {mission.topicName}</span>}
          <span>⏱ {mission.estimatedMinutes} min</span>
          <span>⭐ {mission.xpReward} XP</span>
          {showDate && mission.dueDate && (
            <span style={{ color: isPast(new Date(mission.dueDate)) && !isCompleted ? 'var(--danger)' : 'var(--text-disabled)' }}>
              📅 {format(new Date(mission.dueDate), 'dd MMM')}
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      {!isCompleted && !isSkipped && (
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          <button
            className="btn btn-success btn-sm"
            onClick={() => onUpdate(mission._id, 'completed')}
            disabled={isUpdating}
            title="Mark complete"
          >✓</button>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => onUpdate(mission._id, 'skipped')}
            disabled={isUpdating}
            title="Skip"
            style={{ color: 'var(--text-muted)' }}
          >⏭</button>
        </div>
      )}
      {isCompleted && (
        <span style={{ fontSize: '0.78rem', color: 'var(--success)', fontWeight: 600, flexShrink: 0, marginTop: 4 }}>Done ✓</span>
      )}
      {isSkipped && (
        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, flexShrink: 0, marginTop: 4 }}>Skipped</span>
      )}
    </div>
  );
};

export default MissionsPage;
