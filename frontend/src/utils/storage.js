/** localStorage helpers with JSON serialization */

export const storage = {
  get: (key, fallback = null) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : fallback;
    } catch {
      return fallback;
    }
  },

  set: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn('Storage.set failed:', e);
    }
  },

  remove: (key) => {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.warn('Storage.remove failed:', e);
    }
  },

  clear: () => {
    try {
      localStorage.clear();
    } catch (e) {
      console.warn('Storage.clear failed:', e);
    }
  },
};

// Named SSP keys
export const SSP_KEYS = {
  TOKEN: 'ssp_token',
  USER:  'ssp_user',
  THEME: 'ssp_theme',
  XP:    'ssp_xp',
};
