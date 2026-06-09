/**
 * AnalyticsPage.jsx
 * Main study analytics dashboard page.
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { analyticsAPI } from '../api/analytics.api';
import ActivityGrid from '../components/ui/ActivityGrid';
import WeeklyHistoryCard from '../components/ui/WeeklyHistoryCard';
import WeeklyReport from '../components/ui/WeeklyReport';
import { LoadingScreen } from '../components/ui/LoadingSpinner';
import { CalendarDays } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const AnalyticsPage = () => {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await analyticsAPI.get();
        if (res.data && res.data.success) {
          setAnalytics(res.data.data);
        } else {
          toast.error('Failed to load analytics');
        }
      } catch (err) {
        console.error('Error fetching analytics:', err);
        toast.error('Failed to load analytics');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (loading) {
    return <LoadingScreen text="Loading your analytics..." />;
  }

  if (!analytics) {
    return (
      <div className="page-container animate-fade-in" style={{ padding: '24px' }}>
        <div className="card" style={{ padding: '40px', textAlign: 'center', color: 'var(--txt-3)' }}>
          No analytics data available. Complete some missions to get started!
        </div>
      </div>
    );
  }

  // Calculate days until next Sunday
  const getDaysUntilSunday = () => {
    const today = new Date();
    const day = today.getDay();
    return day === 0 ? 0 : 7 - day;
  };

  const daysUntilSunday = getDaysUntilSunday();
  const todayIsSunday = daysUntilSunday === 0;
  const currentWeekReport = analytics.weeklyHistory[0] || {};
  const currentWeekHasMissions = currentWeekReport.missionsCompleted > 0;

  // Format best day date YYYY-MM-DD to MMM d
  const formatBestDayDate = (dateStr) => {
    if (!dateStr) return 'No data';
    const parts = dateStr.split('-');
    const d = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
    return format(d, 'MMM d');
  };

  // Map first week of history to WeeklyReport shape
  const mappedReport = {
    missionsCompleted: currentWeekReport.missionsCompleted || 0,
    missionsTotal: currentWeekReport.missionsTotal || 0,
    completionRate: currentWeekReport.completionRate || 0,
    hoursStudied: currentWeekReport.hoursStudied || 0,
    xpEarnedThisWeek: currentWeekReport.xpEarned || 0,
    weekLabel: currentWeekReport.weekLabel || '',
    currentStreak: user?.streak || 0,
    strongestSubject: analytics.subjectBreakdown[0]
      ? { name: analytics.subjectBreakdown[0].subjectName }
      : null,
    weakestSubject: (() => {
      const activeSubjects = analytics.subjectBreakdown.filter((s) => s.totalCompleted > 0);
      if (activeSubjects.length <= 1) return null;
      const sorted = [...activeSubjects].sort((a, b) => a.totalCompleted - b.totalCompleted);
      return { name: sorted[0].subjectName };
    })(),
  };

  const totalMissionsInPeriod = analytics.activityGrid.reduce((sum, item) => sum + (item.count || 0), 0);

  return (
    <div className="page-container animate-fade-in" style={{ paddingBottom: '40px' }}>
      {/* Section A — Page header */}
      <div className="page-header">
        <h1>Study Analytics</h1>
        <p>Track your study activity and weekly performance</p>
      </div>

      {/* Section B — Summary stat pills row */}
      <div className="stat-row">
        <div className="stat-pill">
          <div className="stat-pill-value">{analytics.dailyAverage.avgMissionsPerDay}</div>
          <div className="stat-pill-label">Missions/day</div>
        </div>
        <div className="stat-pill">
          <div className="stat-pill-value">{analytics.dailyAverage.avgMinutesPerDay}m</div>
          <div className="stat-pill-label">Avg time/day</div>
        </div>
        <div className="stat-pill">
          <div className="stat-pill-value">{analytics.dailyAverage.longestStreakInPeriod} days</div>
          <div className="stat-pill-label">Best streak</div>
        </div>
        <div className="stat-pill">
          <div className="stat-pill-value">{analytics.dailyAverage.bestDay.count}</div>
          <div className="stat-pill-label">
            Best day {analytics.dailyAverage.bestDay.date ? `(${formatBestDayDate(analytics.dailyAverage.bestDay.date)})` : ''}
          </div>
        </div>
      </div>

      {/* Section C — Activity Grid */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header" style={{ borderBottom: 'none', paddingBottom: 0 }}>
          <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            Activity — Last 12 Weeks
            <span style={{ fontSize: '0.75rem', color: 'var(--txt-3)', textTransform: 'none', fontWeight: 500, letterSpacing: 'normal' }}>
              ({totalMissionsInPeriod} mission{totalMissionsInPeriod !== 1 ? 's' : ''} completed)
            </span>
          </div>
        </div>
        <ActivityGrid activityData={analytics.activityGrid} />
      </div>

      {/* Weekly Report Availability Notice */}
      <div style={{ marginBottom: 12 }}>
        {todayIsSunday && currentWeekHasMissions ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', color: 'var(--txt-3)' }}>
            <span className="badge badge-success">Week report ready</span>
            <span style={{ fontWeight: 600 }}>{currentWeekReport.weekLabel}</span>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', color: 'var(--txt-3)' }}>
            <CalendarDays size={14} style={{ color: 'var(--txt-3)' }} />
            <span>Next weekly report in {daysUntilSunday} day{daysUntilSunday !== 1 ? 's' : ''}</span>
          </div>
        )}
      </div>

      {/* Section D — Weekly History */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header" style={{ borderBottom: 'none', paddingBottom: 0 }}>
          <div className="card-title">Weekly History</div>
          <span style={{ fontSize: '0.75rem', color: 'var(--txt-3)', fontWeight: 600 }}>Last 8 weeks</span>
        </div>
        <WeeklyHistoryCard weeklyHistory={analytics.weeklyHistory} />
      </div>

      {/* Section E — Weekly Report Spotlight */}
      <div style={{ marginBottom: 24 }}>
        <div className="card-title" style={{ marginBottom: 12, fontSize: '0.78rem', color: 'var(--txt-3)', fontWeight: 700 }}>
          This Week's Report
        </div>
        <WeeklyReport report={mappedReport} loading={false} />
      </div>

      {/* Section F — Subject Breakdown Table */}
      <div className="card">
        <div className="card-header" style={{ marginBottom: '8px' }}>
          <div className="card-title">Subject Breakdown</div>
        </div>
        
        {/* Table Header */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1fr 1fr 1fr',
            padding: '10px 16px',
            borderBottom: '1px solid var(--border)',
            fontSize: '0.72rem',
            color: 'var(--txt-3)',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          <div>Subject</div>
          <div>Completed</div>
          <div>Time</div>
          <div>Avg Confidence</div>
        </div>

        {/* Table Body */}
        {analytics.subjectBreakdown.length > 0 ? (
          analytics.subjectBreakdown.map((item, idx) => {
            const isEven = idx % 2 === 0;
            const isLast = idx === analytics.subjectBreakdown.length - 1;
            return (
              <div
                key={idx}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '2fr 1fr 1fr 1fr',
                  padding: '12px 16px',
                  background: isEven ? 'transparent' : 'var(--bg-2)',
                  borderBottom: isLast ? 'none' : '1px solid var(--border)',
                  alignItems: 'center',
                }}
              >
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--txt)' }}>
                  {item.subjectName}
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--txt-2)', fontWeight: 500 }}>
                  {item.totalCompleted} mission{item.totalCompleted !== 1 ? 's' : ''}
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--txt-2)', fontWeight: 500 }}>
                  {Math.round((item.totalMinutes / 60) * 10) / 10}h
                </div>
                <div>
                  {item.avgConfidence ? (
                    <span
                      className={`badge ${
                        item.avgConfidence === 'solid'
                          ? 'badge-success'
                          : item.avgConfidence === 'okay'
                          ? 'badge-warning'
                          : 'badge-danger'
                      }`}
                    >
                      {item.avgConfidence}
                    </span>
                  ) : (
                    <span style={{ color: 'var(--txt-3)' }}>—</span>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div style={{ padding: '24px', textAlign: 'center', color: 'var(--txt-3)', fontSize: '0.85rem' }}>
            No subjects found.
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalyticsPage;
