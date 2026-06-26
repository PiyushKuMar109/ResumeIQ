export const extractData = (response) => {
  const payload = response?.data;
  if (payload?.data !== undefined) return payload.data;
  if (payload?.results !== undefined) return payload.results;
  return payload;
};

export const getErrorMessage = (error, fallback = 'Something went wrong') => {
  const data = error?.response?.data;
  if (!data) return error?.message || fallback;
  if (typeof data === 'string') return data;
  if (data.message) return data.message;
  if (data.detail) return data.detail;
  if (data.errors) {
    const firstKey = Object.keys(data.errors)[0];
    const val = data.errors[firstKey];
    return Array.isArray(val) ? val[0] : String(val);
  }
  const firstKey = Object.keys(data)[0];
  const val = data[firstKey];
  if (Array.isArray(val)) return val[0];
  return fallback;
};

export const getStoredUser = () => {
  try {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const getUserDisplayName = (user) => {
  if (!user) return 'User';
  if (user.full_name) return user.full_name;
  if (user.first_name) return `${user.first_name} ${user.last_name || ''}`.trim();
  return user.email?.split('@')[0] || 'User';
};

export const getUserInitials = (user) => {
  const name = getUserDisplayName(user);
  const parts = name.split(' ').filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return name.slice(0, 2).toUpperCase();
};
