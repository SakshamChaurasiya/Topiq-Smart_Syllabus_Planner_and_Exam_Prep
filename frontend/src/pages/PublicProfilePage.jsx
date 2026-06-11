import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { leaderboardAPI } from '../api/leaderboard.api';
import LevelBadge from '../components/gamification/LevelBadge';
import BadgeShelf from '../components/gamification/BadgeShelf';
import { LoadingScreen } from '../components/ui/LoadingSpinner';
import { getLevelTitle } from '../constants/xpSystem';
import { BADGES_FRONTEND } from '../constants/badges';
import { format } from 'date-fns';
import { Trophy, Flame, Zap, BookOpen, Calendar } from 'lucide-react';
import EmptyState from '../components/ui/EmptyState';

const PublicProfilePage = () => {
  const { username } = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setNotFound(false);
      try {
        const res = await leaderboardAPI.getPublicProfile(username);
        if (res.data && res.data.success) {
          setProfile(res.data.data);
        } else {
          setNotFound(true);
        }
      } catch (err) {
        console.error("[PublicProfilePage] fetch error:", err);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };

    if (username) {
      fetchProfile();
    }
  }, [username]);

  if (loading) {
    return <LoadingScreen text="Loading public profile..." />;
  }

  if (notFound || !profile) {
    return (
      <div className="page-container">
        <EmptyState 
          title="Profile not found"
          description="This profile is private or doesn't exist." 
        />
      </div>
    );
  }

  return (
    <div className="page-container animate-fade-in" style={{ maxWidth: 700, margin: '0 auto' }}>
      {/* Profile header card */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          {/* Avatar initial circle — same style as ProfilePage .profile-avatar */}
          <div className="profile-avatar" style={{ flexShrink: 0 }}>
            {profile.name?.charAt(0)?.toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 800, fontSize: '1.2rem' }}>{profile.name}</div>
            {profile.publicUsername && (
              <div style={{ fontSize: '0.82rem', color: 'var(--txt-3)', marginBottom: 4 }}>
                @{profile.publicUsername}
              </div>
            )}
            {profile.institution && (
              <div style={{ fontSize: '0.82rem', color: 'var(--txt-2)' }}>
                🏫 {profile.institution}
              </div>
            )}
          </div>
          <LevelBadge level={profile.level} size="md" />
        </div>
      </div>

      {/* Stat pills — reuse .stat-row and .stat-pill exactly as ProfilePage */}
      <div className="stat-row" style={{ marginBottom: 20 }}>
        <div className="stat-pill">
          <div className="stat-pill-value">{profile.totalXP?.toLocaleString()}</div>
          <div className="stat-pill-label">Total XP</div>
        </div>
        <div className="stat-pill">
          <div className="stat-pill-value">{profile.level}</div>
          <div className="stat-pill-label">Level</div>
        </div>
        <div className="stat-pill">
          <div className="stat-pill-value">{profile.streak}</div>
          <div className="stat-pill-label">Day Streak</div>
        </div>
        <div className="stat-pill">
          <div className="stat-pill-value">{profile.stats?.totalMissionsCompleted || 0}</div>
          <div className="stat-pill-label">Missions Done</div>
        </div>
      </div>

      {/* Badges */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header" style={{ paddingBottom: 12 }}>
          <div className="card-title">Badges Earned</div>
        </div>
        <BadgeShelf badges={profile.badges || []} />
      </div>

      {/* Member since */}
      <div style={{ fontSize: '0.75rem', color: 'var(--txt-3)', textAlign: 'center', marginTop: 12 }}>
        Topiq member since {profile.createdAt ? format(new Date(profile.createdAt), 'MMMM yyyy') : '—'}
      </div>
    </div>
  );
};

export default PublicProfilePage;
