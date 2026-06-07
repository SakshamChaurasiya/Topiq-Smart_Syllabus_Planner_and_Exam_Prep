// ProfilePage.jsx — View & update user profile
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../api/auth.api';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { User, Edit3, Mail, MapPin, Calendar, Target, Award, Zap, Flame, LogOut } from 'lucide-react';

const goalOptions = [
  { value: 'pass',      label: 'Pass Mode',    desc: 'Focus on clearing exams (40%+)',   colorClass: 'goal-pass' },
  { value: 'good',      label: 'Score Mode',   desc: 'Aim for good scores (65%+)',        colorClass: 'goal-good' },
  { value: 'excellent', label: 'Topper Mode',  desc: 'Go for excellence (85%+)',          colorClass: 'goal-excellent' },
];

const ProfilePage = () => {
  const { user, updateUser, logout } = useAuth();

  const [form, setForm]     = useState({
    name: user?.name || '',
    targetGoal: user?.targetGoal || 'good',
    institution: user?.institution || ''
  });
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || '',
        targetGoal: user.targetGoal || 'good',
        institution: user.institution || ''
      });
    }
  }, [user, editing]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Name cannot be empty.');
    setSaving(true);
    try {
      const res = await authAPI.updateProfile({
        name: form.name.trim(),
        targetGoal: form.targetGoal,
        institution: form.institution.trim()
      });
      updateUser(res.data.data);
      toast.success('Profile updated!');
      setEditing(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed.');
    } finally {
      setSaving(false);
    }
  };

  const currentGoal = goalOptions.find(g => g.value === user?.targetGoal) || goalOptions[1];

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header">
        <h1>Profile</h1>
        <p>Manage your account and study preferences</p>
      </div>

      <div className="profile-grid">
        {/* Left: Profile card */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Avatar */}
          <div className="profile-avatar-wrap">
            <div className="profile-avatar">
              {user?.name?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '1.2rem', marginBottom: 4 }}>{user?.name}</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--txt-2)', marginBottom: 6 }}>{user?.email}</div>
              <div className={`profile-badge-goal ${currentGoal.colorClass}`}>
                {currentGoal.label}
              </div>
            </div>
          </div>

          {/* Info grid */}
          <div className="profile-info-list">
            {[
              { label: 'Email', value: user?.email, icon: <Mail size={14} /> },
              { label: 'College / University', value: user?.institution || 'Not specified', icon: <MapPin size={14} /> },
              { label: 'Member Since', value: user?.createdAt ? format(new Date(user.createdAt), 'dd MMMM yyyy') : '—', icon: <Calendar size={14} /> },
              { label: 'Study Goal', value: currentGoal.label, icon: <Target size={14} /> },
              { label: 'Level', value: `Level ${user?.level || 1}`, icon: <Award size={14} /> },
              { label: 'Experience', value: `${user?.xp || 0} / ${user?.targetXP || 250} XP`, icon: <Zap size={14} /> },
              { label: 'Current Streak', value: `${user?.streak || 0} Day(s)`, icon: <Flame size={14} /> },
            ].map(info => (
              <div key={info.label} className="profile-info-item">
                <span className="profile-info-icon-wrapper">{info.icon}</span>
                <div>
                  <div className="profile-info-label">{info.label}</div>
                  <div className="profile-info-value">{info.value}</div>
                </div>
              </div>
            ))}
          </div>

          {!editing && (
            <button className="btn btn-primary" onClick={() => setEditing(true)}>
              <Edit3 size={14} style={{ marginRight: 6 }} /> Edit Profile
            </button>
          )}
        </div>

        {/* Right: Edit form (shown when editing) */}
        {editing ? (
          <div className="card">
            <h3 style={{ fontWeight: 700, marginBottom: 20 }}>Update Profile</h3>
            <form onSubmit={handleSave}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  className="form-input"
                  value={form.name}
                  onChange={e => set('name', e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label className="form-label">College / University</label>
                <input
                  className="form-input"
                  value={form.institution}
                  onChange={e => set('institution', e.target.value)}
                  placeholder="e.g. Stanford University"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Study Goal</label>
                <div className="goal-grid">
                  {goalOptions.map(g => {
                    const isActive = form.targetGoal === g.value;
                    return (
                      <button
                        key={g.value} type="button"
                        onClick={() => set('targetGoal', g.value)}
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

              <div className="flex gap-2" style={{ marginTop: 16 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setEditing(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving} style={{ flex: 1 }}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* Right panel — tips when not editing */
          <div className="flex flex-col gap-4">
            <div className="card" style={{ background: 'rgba(108, 71, 255, 0.04)', borderColor: 'rgba(108, 71, 255, 0.15)' }}>
              <div style={{ fontWeight: 700, marginBottom: 12, color: 'var(--accent-2)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Target size={16} /> Your Study Goal
              </div>
              <div style={{ fontWeight: 800, fontSize: '1.3rem', color: 'var(--txt)', marginBottom: 6 }}>
                {currentGoal.label}
              </div>
              <p style={{ fontSize: '0.85rem', margin: 0, lineHeight: 1.6, color: 'var(--txt-2)' }}>{currentGoal.desc}</p>
              <p style={{ fontSize: '0.8rem', color: 'var(--txt-3)', margin: '10px 0 0', lineHeight: 1.5 }}>
                Your study mode affects how AI prioritizes topics and generates plans. Change it anytime.
              </p>
            </div>

            <div className="card" style={{ background: 'var(--danger-bg)', borderColor: 'var(--danger-border)' }}>
              <div style={{ fontWeight: 700, marginBottom: 10, color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <LogOut size={16} /> Logout
              </div>
              <p style={{ fontSize: '0.85rem', margin: '0 0 16px', lineHeight: 1.5, color: 'var(--txt-2)' }}>
                You will be signed out and redirected to the home page.
              </p>
              <button
                className="btn btn-danger"
                onClick={() => {
                  logout();
                  window.location.href = '/';
                }}
              >
                Sign Out
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
