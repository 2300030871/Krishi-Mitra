const TOKEN_KEY = 'agrimandi_token';
const USER_KEY = 'agrimandi_user';

export const getToken = () => localStorage.getItem(TOKEN_KEY) || '';

export const setSession = ({ token, user }) => {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const clearSession = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

export const setStoredUser = (user) => {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const getStoredUser = () => {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch (error) {
    return null;
  }
};
