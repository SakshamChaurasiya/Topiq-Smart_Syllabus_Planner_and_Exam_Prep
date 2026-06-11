import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { leaderboardAPI } from '../api/leaderboard.api';
import { LoadingScreen } from '../components/ui/LoadingSpinner';
import EmptyState from '../components/ui/EmptyState';
import LevelBadge from '../components/gamification/LevelBadge';
import { getLevelTitle } from '../constants/xpSystem';
import { Trophy, Flame, Zap, Users, Building2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const LeaderboardRow = ({ entry, isMe, onUsernameClick }) => {
  const avatarInitial = entry.name?.charAt(0)?.toUpperCase() || '?';
  
  let rankClass = "leaderboard-rank";
  if (entry.rank === 1) rankClass += " gold";
  else if (entry.rank === 2) rankClass += " silver";
  else if (entry.rank === 3) rankClass += " bronze";

  return (
    <div className={`leaderboard-row ${isMe ? 'is-me' : ''}`}>
      <div className={rankClass}>
        {entry.rank}
      </div>
      <div className="leaderboard-avatar">
        {avatarInitial}
      </div>
      <div className="leaderboard-info" style={{ flex: 1, minWidth: 0 }}>
        {entry.publicUsername && entry.isPublicProfile ? (
          <div 
            className="leaderboard-name clickable"
            onClick={() => onUsernameClick(entry.publicUsername)}
          >
            {entry.name}
          </div>
        ) : (
          <div className="leaderboard-name">{entry.name}</div>
        )}
        {entry.institution && (
          <div className="leaderboard-institution">{entry.institution}</div>
        )}
      </div>
      <div className="leaderboard-meta">
        <LevelBadge level={entry.level} size="sm" />
        {entry.streak > 0 && (
          <div className="leaderboard-streak" title={`${entry.streak} day streak`}>
            🔥 {entry.streak}
          </div>
        )}
        <div className="leaderboard-xp">
          {entry.missionsThisWeek !== undefined 
            ? `${entry.missionsThisWeek} mission${entry.missionsThisWeek !== 1 ? 's' : ''} (${entry.xpThisWeek?.toLocaleString()} XP)` 
            : `${entry.totalXP?.toLocaleString()} XP`
          }
        </div>
      </div>
    </div>
  );
};

const LeaderboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('global');
  const [leaderboard, setLeaderboard] = useState([]);
  const [myRank, setMyRank] = useState(null);
  const [loading, setLoading] = useState(true);
  const [institution, setInstitution] = useState('');

  // Pre-fill college/university name from user profile
  useEffect(() => {
    if (user?.institution) {
      setInstitution(user.institution);
    }
  }, [user]);

  const fetchLeaderboard = async (tabName) => {
    setLoading(true);
    try {
      let res;
      if (tabName === 'global') {
        res = await leaderboardAPI.getGlobal();
      } else if (tabName === 'college') {
        if (!institution.trim()) {
          setLeaderboard([]);
          setMyRank(null);
          setLoading(false);
          return;
        }
        res = await leaderboardAPI.getCollege(institution.trim());
      } else if (tabName === 'weekly') {
        res = await leaderboardAPI.getWeekly();
      }

      if (res && res.data && res.data.success) {
        setLeaderboard(res.data.data.leaderboard || []);
        setMyRank(res.data.data.myRank || null);
      }
    } catch (err) {
      console.error("[LeaderboardPage] fetch error:", err);
      toast.error(err.response?.data?.message || 'Failed to load leaderboard data.');
      setLeaderboard([]);
      setMyRank(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard(activeTab);
  }, [activeTab]);

  const handleUsernameClick = (username) => {
    navigate(`/u/${username}`);
  };

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header">
        <h1>Leaderboard</h1>
        <p>See how you rank against other students</p>
      </div>

      {/* My Rank pill — shown when myRank is not null */}
      {myRank && (
        <div className="card" style={{ marginBottom: 20, padding: '14px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Trophy size={18} style={{ color: 'var(--warning)' }} />
            <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>
              Your Rank: #{myRank}
            </span>
            <span style={{ fontSize: '0.8rem', color: 'var(--txt-3)' }}>
              on {activeTab} leaderboard
            </span>
          </div>
        </div>
      )}

      {/* Tabs — reuse existing .tabs and .tab-btn classes */}
      <div className="tabs" style={{ marginBottom: 20 }}>
        <button 
          className={`tab-btn ${activeTab === 'global' ? 'active' : ''}`}
          onClick={() => setActiveTab('global')}
        >
          🌍 Global
        </button>
        <button 
          className={`tab-btn ${activeTab === 'college' ? 'active' : ''}`}
          onClick={() => setActiveTab('college')}
        >
          🏫 My College
        </button>
        <button 
          className={`tab-btn ${activeTab === 'weekly' ? 'active' : ''}`}
          onClick={() => setActiveTab('weekly')}
        >
          ⚡ This Week
        </button>
      </div>

      {/* College filter input — shown only on college tab */}
      {activeTab === 'college' && (
        <div style={{ marginBottom: 16, display: 'flex', gap: 8 }}>
          <input
            className="form-input"
            value={institution}
            onChange={e => setInstitution(e.target.value)}
            placeholder="Enter college/university name"
            style={{ flex: 1 }}
          />
          <button 
            className="btn btn-primary btn-sm"
            onClick={() => fetchLeaderboard('college')}
          >
            Search
          </button>
        </div>
      )}

      {loading ? (
        <LoadingScreen text="Loading leaderboard..." />
      ) : (
        leaderboard.length === 0 ? (
          <EmptyState 
            title="No data yet"
            description="Be the first to rank here — complete missions to earn XP." 
          />
        ) : (
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            {leaderboard.map((entry) => (
              <LeaderboardRow
                key={entry.userId}
                entry={entry}
                isMe={entry.userId?.toString() === user?._id?.toString()}
                onUsernameClick={handleUsernameClick}
              />
            ))}
          </div>
        )
      )}
    </div>
  );
};

export default LeaderboardPage;
