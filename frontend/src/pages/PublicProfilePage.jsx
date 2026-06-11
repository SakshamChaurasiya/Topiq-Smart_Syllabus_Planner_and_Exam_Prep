import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { leaderboardAPI } from '../api/leaderboard.api';
import LevelBadge from '../components/gamification/LevelBadge';
import BadgeShelf from '../components/gamification/BadgeShelf';
import { LoadingScreen } from '../components/ui/LoadingSpinner';
import { getLevelTitle } from '../constants/xpSystem';
import { BADGES_FRONTEND } from '../constants/badges';
import { format, formatDistanceToNow } from 'date-fns';
import { feedAPI } from '../api/feed.api';
import { Trophy, Flame, Zap, BookOpen, Calendar } from 'lucide-react';
import EmptyState from '../components/ui/EmptyState';

const PublicProfilePage = () => {
  const { username } = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [publicPosts, setPublicPosts]         = useState([]);
  const [contributorScore, setContributorScore] = useState(0);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setNotFound(false);
      try {
        const res = await leaderboardAPI.getPublicProfile(username);
        if (res.data && res.data.success) {
          const profileData = res.data.data;
          setProfile(profileData);
          feedAPI.getUserPosts(profileData._id, { limit: 5 })
            .then(postRes => {
              setPublicPosts(postRes.data.data.posts || []);
              setContributorScore(postRes.data.data.contributorScore || 0);
            })
            .catch(() => {});
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

      {/* Contributor score */}
      {contributorScore > 0 && (
        <div style={{ display:'inline-flex', alignItems:'center', gap:8,
          background:'var(--surface)', border:'1px solid var(--border)',
          borderRadius:'var(--r-full)', padding:'6px 14px',
          fontSize:'0.78rem', fontWeight:700, marginBottom:20 }}>
          💎 Contributor Score:
          <span style={{ color:'var(--accent)', fontWeight:800 }}>
            {contributorScore}
          </span>
        </div>
      )}

      {/* Public posts section */}
      {publicPosts.length > 0 && (
        <div style={{ marginTop:8 }}>
          <h3 style={{ fontWeight:700, fontSize:'0.9rem',
            marginBottom:14 }}>Shared Resources</h3>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {publicPosts.map(post => (
              <div key={post._id} className="card"
                style={{ padding:'12px 16px' }}>
                <div style={{ display:'flex', justifyContent:'space-between',
                  alignItems:'flex-start', gap:8 }}>
                  <div style={{ fontWeight:700, fontSize:'0.85rem',
                    color:'var(--txt)' }}>{post.title}</div>
                  <span className="badge badge-muted"
                    style={{ fontSize:'0.62rem', flexShrink:0 }}>
                    {post.subjectTag}
                  </span>
                </div>
                {post.description && (
                  <div style={{ fontSize:'0.78rem', color:'var(--txt-2)',
                    marginTop:4, lineHeight:1.5 }}>{post.description}</div>
                )}
                <div style={{ fontSize:'0.7rem', color:'var(--txt-3)',
                  marginTop:6 }}>
                  ▲ {post.upvoteCount || 0} upvotes ·{' '}
                  {formatDistanceToNow(new Date(post.createdAt),
                    { addSuffix: true })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Member since */}
      <div style={{ fontSize: '0.75rem', color: 'var(--txt-3)', textAlign: 'center', marginTop: 12 }}>
        Topiq member since {profile.createdAt ? format(new Date(profile.createdAt), 'MMMM yyyy') : '—'}
      </div>
    </div>
  );
};

export default PublicProfilePage;
