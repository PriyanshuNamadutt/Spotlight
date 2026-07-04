const express = require('express');
const mongoose = require('mongoose');
const auth = require('../middleware/auth');
const Session = require('../models/Session');
const { getPracticeResponse, generateReport } = require('../services/geminiService');

const router = express.Router();

// Start a new English-practice conversation on a topic
router.post('/start', auth, async (req, res) => {
  try {
    const { topic } = req.body;
    if (!topic || !topic.trim()) return res.status(400).json({ message: 'Topic is required.' });

    const aiText = await getPracticeResponse({ topic: topic.trim(), history: [] });

    const session = await Session.create({
      userId: req.userId,
      type: 'practice',
      topic: topic.trim(),
      transcript: [{ role: 'model', text: aiText, timestamp: new Date() }],
      startedAt: new Date()
    });

    res.status(201).json({ sessionId: session._id.toString(), message: aiText });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message || 'Failed to start practice session.' });
  }
});

router.post('/message', auth, async (req, res) => {
  try {
    const { sessionId, message } = req.body;
    if (!sessionId || !message) return res.status(400).json({ message: 'sessionId and message are required.' });
    if (!mongoose.isValidObjectId(sessionId)) return res.status(404).json({ message: 'Session not found.' });

    const session = await Session.findOne({ _id: sessionId, userId: req.userId });
    if (!session) return res.status(404).json({ message: 'Session not found.' });

    session.transcript.push({ role: 'user', text: message, timestamp: new Date() });
    const history = session.transcript.map(t => ({ role: t.role, text: t.text }));
    const aiText = await getPracticeResponse({ topic: session.topic, history });
    session.transcript.push({ role: 'model', text: aiText, timestamp: new Date() });

    await session.save();
    res.json({ message: aiText });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message || 'Failed to process message.' });
  }
});

router.post('/end', auth, async (req, res) => {
  try {
    const { sessionId } = req.body;
    if (!mongoose.isValidObjectId(sessionId)) return res.status(404).json({ message: 'Session not found.' });
    const session = await Session.findOne({ _id: sessionId, userId: req.userId });
    if (!session) return res.status(404).json({ message: 'Session not found.' });

    const report = await generateReport({ transcript: session.transcript, mode: 'practice' });
    session.report = report;
    session.endedAt = new Date();
    await session.save();

    res.json({ report });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message || 'Failed to generate report.' });
  }
});

module.exports = router;