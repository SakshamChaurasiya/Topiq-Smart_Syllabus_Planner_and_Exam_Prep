// ProfilePage.jsx — View & update user profile
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../api/auth.api';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const goalOptions = [
  { value: 'pass',      label: '✅ Pass Mode',    desc: 'Focus on clearing exams (40%+)',   color: '#10b981' },
  { value: 'good',      label: '🎯 Score Mode',   desc: 'Aim for good scores (65%+)',        color: '#6366f1' },
  { value: 'excellent', label: '🏆 Topper Mode',  desc: 'Go for excellence (85%+)',          color: '#f59e0b' },
];

const ProfilePage = () => {
  const { user, updateUser, logout } = useAuth();

  const [form, setForm]     = useState({ name: user?.name || '', targetGoal: user?.targetGoal || 'good' });
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Name cannot be empty.');
    setSaving(true);
    try {
      const res = await authAPI.updateProfile({ name: form.name.trim(), targetGoal: form.targetGoal });
      updateUser(res.data.data);
      toast.success('Profile updated! ✅');
      setEditing(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed.');
    } finally {
      setSaving(false);
    }
  };

  const currentGoal = goalOptions.find(g => g.value === user?.targetGoal);

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header">
        <h1>👤 Profile</h1>
        <p>Manage your account and study preferences</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, maxWidth: 900 }}>
        {/* Left: Profile card */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Avatar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            <div style={{
              width: 80, height: 80, borderRadius: 20,
              background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '2rem', fontWeight: 900, color: '#fff', flexShrink: 0,
              boxShadow: '0 0 30px var(--primary-glow)',
            }}>
              {user?.name?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '1.2rem', marginBottom: 4 }}>{user?.name}</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 6 }}>{user?.email}</div>
              <div
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  background: `${currentGoal?.color}20`,
                  border: `1px solid ${currentGoal?.color}50`,
                  borderRadius: 100, padding: '3px 12px',
                  fontSize: '0.75rem', fontWeight: 700,
                  color: currentGoal?.color,
                }}
              >
                {currentGoal?.label}
              </div>
            </div>
          </div>

          {/* Info grid */}
          <div style={{ display: 'grid', gap: 12 }}>
            {[
              { label: 'Email', value: user?.email, icon: '📧' },
              { label: 'Member Since', value: user?.createdAt ? format(new Date(user.createdAt), 'dd MMMM yyyy') : '—', icon: '📅' },
              { label: 'Study Goal', value: currentGoal?.label, icon: '🎯' },
              { label: 'Level', value: `Level ${user?.level || 1}`, icon: '⭐' },
              { label: 'Experience', value: `${user?.xp || 0} / ${user?.targetXP || 250} XP`, icon: '⚡' },
              { label: 'Current Streak', value: `${user?.streak || 0} Day(s)`, icon: '🔥' },
            ].map(info => (
              <div key={info.label} style={{ display: 'flex', gap: 12, padding: '12px', background: 'var(--bg-elevated)', borderRadius: 10, border: '1px solid var(--border-subtle)' }}>
                <span style={{ fontSize: '1.1rem' }}>{info.icon}</span>
                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 2 }}>{info.label}</div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 600 }}>{info.value}</div>
                </div>
              </div>
            ))}
          </div>

          {!editing && (
            <button className="btn btn-primary" onClick={() => setEditing(true)}>
              ✏️ Edit Profile
            </button>
          )}
        </div>

        {/* Right: Edit form (shown when editing) */}
        {editing ? (
          <div className="card">
            <h3 style={{ fontWeight: 700, marginBottom: 20 }}>✏️ Update Profile</h3>
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
                <label className="form-label">Study Goal</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {goalOptions.map(g => (
                    <button
                      key={g.value} type="button"
                      onClick={() => set('targetGoal', g.value)}
                      style={{
                        display: 'flex', alignItems: 'flex-start', gap: 12,
                        background: form.targetGoal === g.value ? `${g.color}15` : 'var(--bg-elevated)',
                        border: `2px solid ${form.targetGoal === g.value ? g.color : 'var(--border-default)'}`,
                        borderRadius: 12, padding: '14px 16px', cursor: 'pointer',
                        textAlign: 'left', transition: 'all 0.15s',
                      }}
                    >
                      <div style={{ fontSize: '1.2rem', flexShrink: 0 }}>{g.label.split(' ')[0]}</div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.88rem', color: form.targetGoal === g.value ? g.color : 'var(--text-primary)', marginBottom: 2 }}>
                          {g.label}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{g.desc}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setEditing(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving} style={{ flex: 1 }}>
                  {saving ? '⏳ Saving...' : '✅ Save Changes'}
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* Right panel — tips when not editing */
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="card" style={{ background: 'rgba(99,102,241,0.06)', borderColor: 'rgba(99,102,241,0.2)' }}>
              <div style={{ fontWeight: 700, marginBottom: 12, color: 'var(--primary-light)' }}>🎯 Your Study Mode</div>
              <div style={{ fontWeight: 800, fontSize: '1.3rem', color: currentGoal?.color, marginBottom: 6 }}>
                {currentGoal?.label}
              </div>
              <p style={{ fontSize: '0.85rem', margin: 0, lineHeight: 1.6 }}>{currentGoal?.desc}</p>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '10px 0 0', lineHeight: 1.5 }}>
                Your study mode affects how AI prioritizes topics and generates plans. Change it anytime.
              </p>
            </div>

            <div className="card" style={{ background: 'rgba(239,68,68,0.05)', borderColor: 'rgba(239,68,68,0.2)' }}>
              <div style={{ fontWeight: 700, marginBottom: 10, color: 'var(--danger)' }}>🚪 Logout</div>
              <p style={{ fontSize: '0.85rem', margin: '0 0 16px', lineHeight: 1.5 }}>
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
