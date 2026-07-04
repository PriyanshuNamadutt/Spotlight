const express = require('express');
const mongoose = require('mongoose');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');
const Session = require('../models/Session');
const { extractResumeText } = require('../services/resumeParser');
const { getInterviewQuestion, generateReport } = require('../services/geminiService');

const router = express.Router();

// Start a new interview round: upload resume, AI greets & asks for introduction
router.post('/start', auth, upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'Resume file is required (PDF, DOCX, or TXT).' });

    const resumeText = await extractResumeText(req.file.path, req.file.mimetype);
    const aiText = await getInterviewQuestion({ resumeText, history: [] });

    const session = await Session.create({
      userId: req.userId,
      type: 'interview',
      resumeText,
      transcript: [{ role: 'model', text: aiText, timestamp: new Date() }],
      startedAt: new Date()
    });

    res.status(201).json({ sessionId: session._id.toString(), message: aiText });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message || 'Failed to start interview round.' });
  }
});

// Send candidate's answer, get the next AI question
router.post('/answer', auth, async (req, res) => {
  try {
    const { sessionId, answer } = req.body;
    if (!sessionId || !answer) return res.status(400).json({ message: 'sessionId and answer are required.' });
    if (!mongoose.isValidObjectId(sessionId)) return res.status(404).json({ message: 'Session not found.' });

    const session = await Session.findOne({ _id: sessionId, userId: req.userId });
    if (!session) return res.status(404).json({ message: 'Session not found.' });

    session.transcript.push({ role: 'user', text: answer, timestamp: new Date() });

    const history = session.transcript.map(t => ({ role: t.role, text: t.text }));
    const aiText = await getInterviewQuestion({ resumeText: session.resumeText, history });
    session.transcript.push({ role: 'model', text: aiText, timestamp: new Date() });

    await session.save();
    res.json({ message: aiText });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message || 'Failed to process answer.' });
  }
});

// End the round: generate mistakes / corrections / improvements report
router.post('/end', auth, async (req, res) => {
  try {
    const { sessionId } = req.body;
    if (!mongoose.isValidObjectId(sessionId)) return res.status(404).json({ message: 'Session not found.' });
    const session = await Session.findOne({ _id: sessionId, userId: req.userId });
    if (!session) return res.status(404).json({ message: 'Session not found.' });

    const report = await generateReport({ transcript: session.transcript, mode: 'interview' });
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