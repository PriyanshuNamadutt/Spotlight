// Username: letters, numbers, and common special characters allowed. 3-30 chars, no spaces.
function isValidUsername(username) {
  return typeof username === 'string' && /^[A-Za-z0-9!@#$%^&*()_\-+=.]{3,30}$/.test(username);
}

// Password: at least 6 characters, any characters allowed (letters, numbers, special chars).
function isValidPassword(password) {
  return typeof password === 'string' && password.length >= 6;
}

// Escapes regex special characters so a raw username can be safely used inside a RegExp
// (needed for case-insensitive username lookups in MongoDB).
function escapeRegex(str) {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

module.exports = { isValidUsername, isValidPassword, escapeRegex };