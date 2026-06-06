// ── App-wide Constants ──

export const MOTIVATIONAL_MESSAGES = [
  "🔥 You're on fire! Keep going!",
  "🚀 Study Smarter, Score Better",
  "🎯 One Mission at a Time",
  "⚡ Complete More, Stress Less",
  "💪 Every topic you master brings you closer to success!",
  "🌟 Consistency beats intensity — you've got this!",
  "🏆 Champions are made in the hours no one sees.",
  "📚 Today's effort is tomorrow's exam confidence.",
  "⚡ Your future self is counting on you right now.",
  "🎯 Focused sessions > marathon cramming. Keep it up!",
];

export const XP_PER_MISSION = {
  easy:   35,
  medium: 60,
  hard:   80,
  critical: 100,
};

export const LEVELS = [
  { level: 1,  title: 'Beginner',    minXP: 0    },
  { level: 2,  title: 'Student',     minXP: 200  },
  { level: 3,  title: 'Learner',     minXP: 500  },
  { level: 4,  title: 'Explorer',    minXP: 900  },
  { level: 5,  title: 'Achiever',    minXP: 1400 },
  { level: 6,  title: 'Expert',      minXP: 2000 },
  { level: 7,  title: 'Scholar',     minXP: 2700 },
  { level: 8,  title: 'Ace',         minXP: 3500 },
  { level: 9,  title: 'Champion',    minXP: 4500 },
  { level: 10, title: 'Master',      minXP: 6000 },
  { level: 11, title: 'Legend',      minXP: 8000 },
  { level: 12, title: 'Grandmaster', minXP: 10000 },
];

export const BADGES = [
  { id: 'first_mission',   icon: '🎯', name: 'First Strike',    desc: 'Completed your first mission',          rarity: 'common'  },
  { id: 'streak_3',        icon: '🔥', name: 'On a Roll',       desc: '3-day streak maintained',               rarity: 'common'  },
  { id: 'streak_7',        icon: '🔥', name: 'Week Streak',     desc: '7 consecutive days of studying',        rarity: 'rare'    },
  { id: 'streak_30',       icon: '🌟', name: 'Month Master',    desc: '30-day streak — unbelievable!',         rarity: 'epic'    },
  { id: 'missions_10',     icon: '🎯', name: 'Mission Pro',     desc: '10 missions completed',                 rarity: 'common'  },
  { id: 'missions_50',     icon: '🚀', name: 'Mission Elite',   desc: '50 missions completed',                 rarity: 'rare'    },
  { id: 'missions_100',    icon: '💎', name: 'Mission Legend',  desc: '100 missions completed',                rarity: 'epic'    },
  { id: 'first_syllabus',  icon: '📤', name: 'Uploader',        desc: 'Uploaded your first syllabus',          rarity: 'common'  },
  { id: 'all_subjects',    icon: '📚', name: 'Full Stack',      desc: 'Added syllabus to all subjects',        rarity: 'rare'    },
  { id: 'readiness_50',    icon: '📈', name: 'Halfway Hero',    desc: 'Reached 50% overall readiness',         rarity: 'common'  },
  { id: 'readiness_80',    icon: '🏆', name: 'Exam Ready',      desc: 'Reached 80% overall readiness',         rarity: 'rare'    },
  { id: 'readiness_100',   icon: '👑', name: 'Perfect Score',   desc: 'Achieved 100% readiness — wow!',        rarity: 'legendary'},
  { id: 'cheatcode_gen',   icon: '⚡', name: 'Code Breaker',    desc: 'Generated first AI cheat code',         rarity: 'common'  },
  { id: 'level_5',         icon: '⭐', name: 'Level 5',         desc: 'Reached Level 5 — Achiever!',           rarity: 'rare'    },
  { id: 'level_10',        icon: '🌠', name: 'Level 10',        desc: 'Reached Level 10 — Master!',            rarity: 'legendary'},
];

export const DIFFICULTY_COLORS = {
  easy:     { bg: 'rgba(0,212,170,0.1)',    text: '#00D4AA',   border: 'rgba(0,212,170,0.3)' },
  medium:   { bg: 'rgba(108,71,255,0.1)',   text: '#9c7fff',   border: 'rgba(108,71,255,0.3)' },
  hard:     { bg: 'rgba(255,179,71,0.1)',   text: '#FFB347',   border: 'rgba(255,179,71,0.3)' },
  critical: { bg: 'rgba(255,107,107,0.1)',  text: '#FF6B6B',   border: 'rgba(255,107,107,0.3)' },
};

export const SUBJECT_COLORS = [
  '#6C47FF', '#FF6B6B', '#00D4AA', '#FFB347',
  '#3B82F6', '#EC4899', '#8B5CF6', '#10B981',
  '#F59E0B', '#EF4444', '#06B6D4', '#6366F1',
];

export const EXAM_TYPES = [
  'JEE Main', 'JEE Advanced', 'NEET', 'GATE',
  'CAT', 'UPSC', 'SSC CGL', 'IBPS', 'CLAT',
  'Class 10 Boards', 'Class 12 Boards',
  'University Exam', 'Other',
];

export const STUDY_HOURS_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8];

export const RARITY_COLORS = {
  common:    { bg: 'rgba(160,160,180,0.1)', text: '#A0A0B4', border: 'rgba(160,160,180,0.2)' },
  rare:      { bg: 'rgba(108,71,255,0.1)',  text: '#9c7fff', border: 'rgba(108,71,255,0.3)'  },
  epic:      { bg: 'rgba(236,72,153,0.1)',  text: '#EC4899', border: 'rgba(236,72,153,0.3)'  },
  legendary: { bg: 'rgba(255,179,71,0.12)', text: '#FFB347', border: 'rgba(255,179,71,0.4)'  },
};

export const REVISION_INTERVALS = [1, 3, 7, 14, 30]; // days — spaced repetition

export const APP_NAME = import.meta.env.VITE_APP_NAME || 'Smart Syllabus Planner';
