const mongoose = require('mongoose');

const transcriptEntrySchema = new mongoose.Schema({
  role: { type: String, enum: ['user', 'model'], required: true },
  text: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
}, { _id: false });

const mistakeSchema = new mongoose.Schema({
  original: String,
  issue: String,
  correction: String
}, { _id: false });

const reportSchema = new mongoose.Schema({
  overallSummary: String,
  strengths: [String],
  mistakes: [mistakeSchema],
  improvements: [String],
  score: Number
}, { _id: false });

const sessionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type: { type: String, enum: ['interview', 'practice'], required: true },
  resumeText: String,   // interview sessions only
  topic: String,        // practice sessions only
  transcript: [transcriptEntrySchema],
  report: reportSchema,
  startedAt: { type: Date, default: Date.now },
  endedAt: Date
});

module.exports = mongoose.model('Session', sessionSchema);