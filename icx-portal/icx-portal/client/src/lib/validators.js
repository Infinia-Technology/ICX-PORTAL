export const isValidEmail = (email) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export const isValidPhone = (phone) =>
  /^[0-9\s+\-()]+$/.test(phone);

export const isValidUrl = (url) => {
  if (!url) return true;
  return /^https?:\/\/.+/.test(url);
};

export const isRequired = (value) => {
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'string') return value.trim().length > 0;
  return value !== null && value !== undefined;
};

export const maxLength = (value, max) => {
  if (!value) return true;
  return value.length <= max;
};
