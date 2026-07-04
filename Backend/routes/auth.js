const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { isValidUsername, isValidPassword } = require('../utils/validators');

const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!isValidUsername(username)) {
      return res.status(400).json({
        message: 'Username must be 3-30 characters: letters, numbers, and special characters (! @ # $ % ^ & * ( ) _ - + = .) are allowed, no spaces.'
      });
    }
    if (!isValidPassword(password)) {
      return res.status(400).json({ message: 'Password must be at least 6 characters.' });
    }

    const trimmedUsername = username.trim();
    const usernameLower = trimmedUsername.toLowerCase();

    const exists = await User.findOne({ usernameLower });
    if (exists) {
      console.warn(`[register] Blocked — "${trimmedUsername}" collides with existing user "${exists.username}" (case-insensitive match).`);
      return res.status(409).json({ message: 'That username is already taken.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ username: trimmedUsername, usernameLower, passwordHash });

    const token = jwt.sign({ userId: user._id.toString(), username: user.username }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ token, username: user.username });
  } catch (err) {
    console.error('[register] error:', err.message);
    if (err.code === 11000) return res.status(409).json({ message: 'That username is already taken.' });
    res.status(500).json({ message: 'Server error during registration.' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const usernameLower = String(username || '').trim().toLowerCase();

    const user = await User.findOne({ usernameLower });
    if (!user) return res.status(401).json({ message: 'Invalid username or password.' });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ message: 'Invalid username or password.' });

    const token = jwt.sign({ userId: user._id.toString(), username: user.username }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, username: user.username });
  } catch (err) {
    console.error('[login] error:', err.message);
    res.status(500).json({ message: 'Server error during login.' });
  }
});

module.exports = router;
