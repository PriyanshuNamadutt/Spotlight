const express = require('express');
const mongoose = require('mongoose');
const auth = require('../middleware/auth');
const Session = require('../models/Session');

const router = express.Router();

// List all of the logged-in user's past sessions (both interview & practice)
router.get('/', auth, async (req, res) => {
  try {
    const sessions = await Session.find({ userId: req.userId }).sort({ startedAt: -1 });
    const mapped = sessions.map(s => ({
      id: s._id.toString(),
      type: s.type,
      topic: s.topic || null,
      startedAt: s.startedAt,
      endedAt: s.endedAt,
      score: s.report?.score ?? null,
      questionsCount: s.transcript.filter(t => t.role === 'model').length
    }));
    res.json({ sessions: mapped });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to load history.' });
  }
});

// Full transcript + report for one session
router.get('/:id', auth, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ message: 'Session not found.' });
    }
    const session = await Session.findOne({ _id: req.params.id, userId: req.userId });
    if (!session) return res.status(404).json({ message: 'Session not found.' });

    res.json({
      session: {
        id: session._id.toString(),
        type: session.type,
        topic: session.topic || null,
        transcript: session.transcript,
        report: session.report || null,
        startedAt: session.startedAt,
        endedAt: session.endedAt
      }
    });
  } catch (err) {
    console.error(err);
    res.status(404).json({ message: 'Session not found.' });
  }
});

module.exports = router;