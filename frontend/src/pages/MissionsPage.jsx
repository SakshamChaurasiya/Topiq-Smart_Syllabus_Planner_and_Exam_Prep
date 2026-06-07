// MissionsPage.jsx — Today's missions + all missions tracker
import { useState, useEffect } from 'react';
import { missionAPI } from '../api/mission.api';
import { LoadingScreen } from '../components/ui/LoadingSpinner';
import Badge from '../components/ui/Badge';
import EmptyState from '../components/ui/EmptyState';
import { useNavigate } from 'react-router-dom';
import { format, isPast } from 'date-fns';
import toast from 'react-hot-toast';
import { BookOpen, RefreshCw, FileText, Edit3, Target, Calendar, Check, SkipForward, ArrowRight, ClipboardList } from 'lucide-react';

const typeIcon = {
  study:    <BookOpen size={14} />,
  revision: <RefreshCw size={14} />,
  practice: <FileText size={14} />,
  summary:  <Edit3 size={14} />,
  quiz:     <Target size={14} />,
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

  const { stats: todayStats, grouped } = data || {};

  return (
    <div className="page-container animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <h1>Missions</h1>
        <p>Complete daily missions to stay on track and earn XP</p>
      </div>

      {/* Stats row */}
      {stats && (
        <div className="stat-row">
          <div className="stat-pill">
            <div className="stat-pill-value">{stats.total}</div>
            <div className="stat-pill-label">Total</div>
          </div>
          <div className="stat-pill">
            <div className="stat-pill-value" style={{ color: 'var(--success)' }}>{stats.completed}</div>
            <div className="stat-pill-label">Completed</div>
          </div>
          <div className="stat-pill">
            <div className="stat-pill-value" style={{ color: 'var(--warning)' }}>{stats.pending}</div>
            <div className="stat-pill-label">Pending</div>
          </div>
          <div className="stat-pill">
            <div className="stat-pill-value" style={{ color: 'var(--accent)' }}>{stats.completionRate}%</div>
            <div className="stat-pill-label">Rate</div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: 24 }}>
        <button className={`tab-btn ${activeTab === 'today' ? 'active' : ''}`} onClick={() => setActiveTab('today')}>
          Today's Missions
          {todayStats?.pending > 0 && (
            <span style={{ marginLeft: 8, background: 'rgba(255,255,255,0.15)', borderRadius: 100, padding: '1px 8px', fontSize: '0.72rem', fontWeight: 700 }}>
              {todayStats.pending}
            </span>
          )}
        </button>
        <button className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`} onClick={() => setActiveTab('all')}>
          All Missions
        </button>
      </div>

      {/* ── TODAY'S TAB ── */}
      {activeTab === 'today' && (
        <div>
          {/* Completion banner */}
          {todayStats?.total > 0 && (
            <div className="card" style={{ marginBottom: 20, padding: '16px 20px' }}>
              <div className="flex justify-between items-center" style={{ marginBottom: 10 }}>
                <div>
                  <span style={{ fontWeight: 700 }}>{format(new Date(), 'EEEE, dd MMMM')}</span>
                  <span style={{ marginLeft: 12, fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    {todayStats.completed}/{todayStats.total} done
                  </span>
                </div>
                <span style={{ fontWeight: 900, fontSize: '1.3rem', color: todayStats.completionRate >= 80 ? 'var(--success)' : 'var(--accent)' }}>
                  {todayStats.completionRate}%
                </span>
              </div>
              <div className="progress-bar" style={{ height: 7 }}>
                <div className="progress-bar-fill" style={{
                  width: `${todayStats.completionRate}%`,
                  background: todayStats.completionRate === 100 ? 'var(--success)' : 'var(--accent)',
                }} />
              </div>
              {todayStats.completionRate === 100 && (
                <div style={{ textAlign: 'center', marginTop: 10, color: 'var(--success)', fontWeight: 700, fontSize: '0.9rem' }}>
                  All missions done today! Amazing work!
                </div>
              )}
            </div>
          )}

          {/* No missions */}
          {!grouped?.length ? (
            <EmptyState
              icon={<Target size={40} className="error-page-icon" />}
              title="No missions today"
              description="Generate a study plan for a subject to get daily missions."
              action={<button className="btn btn-primary" onClick={() => navigate('/subjects')}>Go to Subjects <ArrowRight size={14} style={{ marginLeft: 4 }} /></button>}
            />
          ) : (
            /* Missions grouped by subject */
            grouped.map((group) => (
              <div key={group.subject?._id} className="card mission-subject-card">
                {/* Subject header */}
                <div className="mission-subject-header">
                  <div className="mission-subject-avatar" style={{ background: group.subject?.color || 'var(--accent)' }}>
                    {group.subject?.name?.charAt(0)}
                  </div>
                  <span className="mission-subject-title">{group.subject?.name || 'Unknown Subject'}</span>
                  <span className="badge badge-primary mission-subject-badge">
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
            <EmptyState icon={<ClipboardList size={40} className="error-page-icon" />} title="No missions yet" description="Generate a study plan to create missions." />
          ) : (
            <div className="card">
              {allMissions.map((mission, i) => (
                <div key={mission._id}>
                  <MissionItem mission={mission} onUpdate={updateStatus} isUpdating={updatingId === mission._id} showDate />
                  {i < allMissions.length - 1 && <div style={{ height: 1, background: 'var(--border)', margin: '4px 0' }} />}
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
    <div className={`mission-item-container${isCompleted ? ' done' : ''}${isSkipped ? ' skipped' : ''}`}>
      {/* Checkbox */}
      <button
        onClick={() => !isCompleted && !isUpdating && onUpdate(mission._id, 'completed')}
        className={`mission-item-checkbox${isCompleted ? ' checked' : ''}`}
        disabled={isCompleted || isUpdating}
        aria-label={isCompleted ? 'Mission completed' : 'Mark mission as completed'}
      >
        {isCompleted && <Check size={12} strokeWidth={3} />}
        {isUpdating && <div className="spinner" style={{ width: 10, height: 10, borderWidth: 1.5 }} />}
      </button>

      {/* Info */}
      <div className="mission-item-info">
        <div className="mission-item-header">
          <span className="mission-item-icon">{typeIcon[mission.type] || <Target size={14} />}</span>
          <span className={`mission-item-title${isCompleted || isSkipped ? ' strike' : ''}`}>
            {mission.title}
          </span>
          <Badge type={mission.priority} label={mission.priority} />
        </div>
        {mission.description && (
          <p className="mission-item-desc">{mission.description}</p>
        )}
        <div className="mission-item-meta">
          {mission.topicName && (
            <span className="mission-item-meta-item">
              <BookOpen size={12} /> {mission.topicName}
            </span>
          )}
          <span className="mission-item-meta-item">
            <RefreshCw size={12} /> {mission.estimatedMinutes} min
          </span>
          <span className="mission-item-meta-item">
            ⭐ {mission.xpReward} XP
          </span>
          {showDate && mission.dueDate && (
            <span 
              className="mission-item-meta-item"
              style={{ color: isPast(new Date(mission.dueDate)) && !isCompleted ? 'var(--danger)' : 'var(--txt-3)' }}
            >
              <Calendar size={12} /> {format(new Date(mission.dueDate), 'dd MMM')}
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      {!isCompleted && !isSkipped && (
        <div className="mission-item-actions">
          <button
            className="btn btn-success btn-sm"
            onClick={() => onUpdate(mission._id, 'completed')}
            disabled={isUpdating}
            title="Mark complete"
          >
            <Check size={14} />
          </button>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => onUpdate(mission._id, 'skipped')}
            disabled={isUpdating}
            title="Skip"
          >
            <SkipForward size={14} />
          </button>
        </div>
      )}
      {isCompleted && (
        <span className="mission-done-text">Done</span>
      )}
      {isSkipped && (
        <span className="mission-skipped-text">Skipped</span>
      )}
    </div>
  );
};

export default MissionsPage;
