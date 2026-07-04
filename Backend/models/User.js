const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true },
  // Lowercased, trimmed mirror of `username`, used for case-insensitive uniqueness
  // checks and lookups. We deliberately do NOT make this field unique at the DB
  // level (only indexed) so it can never conflict with older documents that
  // predate this field — uniqueness is enforced in application code instead.
  usernameLower: { type: String, required: true, index: true },
  passwordHash: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

userSchema.pre('validate', function (next) {
  if (this.username) this.usernameLower = this.username.trim().toLowerCase();
  next();
});

module.exports = mongoose.model('User', userSchema);
