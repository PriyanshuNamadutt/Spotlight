const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

module.exports = function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided.' });
  }
  const token = header.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Tokens issued before the MongoDB migration carry a UUID-style userId, which
    // isn't a valid MongoDB ObjectId and would crash every query. Reject those
    // explicitly so the frontend knows to send the user back to login.
    if (!mongoose.isValidObjectId(decoded.userId)) {
      return res.status(401).json({ message: 'Your session is out of date. Please log out and log in again.' });
    }

    req.userId = decoded.userId;
    req.username = decoded.username;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired session. Please log in again.' });
  }
};