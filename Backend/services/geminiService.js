// Wraps calls to the Google AI Studio (Gemini) REST API.
const axios = require('axios');

const MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
const geminiUrl = () =>
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;

async function callGemini(systemInstruction, contents) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not set. Add it to backend/.env — see README.md.');
  }
  const body = {
    systemInstruction: { parts: [{ text: systemInstruction }] },
    contents,
    generationConfig: { temperature: 0.7, maxOutputTokens: 800 }
  };
  const { data } = await axios.post(geminiUrl(), body, {
    headers: { 'Content-Type': 'application/json' }
  });
  const text = data?.candidates?.[0]?.content?.parts?.map(p => p.text).join('\n') || '';
  return text.trim();
}

// Gemini's "contents" array alternates role: 'user' | 'model'
function historyToContents(history) {
  return history.map(h => ({ role: h.role, parts: [{ text: h.text }] }));
}

async function getInterviewQuestion({ resumeText, history }) {
  const system = `You are a professional, friendly job interviewer conducting a mock interview.
Use the candidate's resume below to ask relevant, specific questions about their experience, skills, and projects.
Begin with a short, warm introduction and ask the candidate to introduce themselves.
After that, ask ONE question at a time, wait for their answer, then ask a natural, in-depth follow-up
question based on what they said and on the resume. Vary question types: background, technical skills,
projects, behavioral ("tell me about a time..."), and role fit.
Keep each message short (2-5 sentences) and conversational, never robotic or listy.

Resume:
"""
${resumeText}
"""`;

  const contents = historyToContents(history);
  if (contents.length === 0) {
    contents.push({
      role: 'user',
      parts: [{ text: 'Please start the interview with a brief greeting and ask me to introduce myself.' }]
    });
  }
  return callGemini(system, contents);
}

async function getPracticeResponse({ topic, history }) {
  const system = `You are a friendly English-speaking coach having a spoken conversation practice session
with a learner on the topic: "${topic}".
Keep the conversation natural and encouraging, ask follow-up questions, and encourage the learner to speak
more and elaborate. Keep each message short (2-4 sentences).
Do NOT correct grammar mid-conversation — that will be handled separately in an end-of-session report.`;

  const contents = historyToContents(history);
  if (contents.length === 0) {
    contents.push({
      role: 'user',
      parts: [{ text: `Please start our conversation about "${topic}" with a friendly opening question.` }]
    });
  }
  return callGemini(system, contents);
}

async function generateReport({ transcript, mode }) {
  const transcriptText = transcript
    .map(t => `${t.role === 'user' ? 'Candidate' : 'AI'}: ${t.text}`)
    .join('\n');

  const system = `You are an expert English communication and ${mode === 'interview' ? 'interview' : 'spoken English'} coach.
Analyse the following conversation transcript. Respond ONLY with valid JSON (no markdown fences, no extra text),
in exactly this shape:
{
  "overallSummary": "2-4 sentence summary of how they did",
  "strengths": ["short strength 1", "short strength 2"],
  "mistakes": [
    { "original": "exact/paraphrased thing the candidate said", "issue": "what's wrong with it (grammar, clarity, filler words, structure, etc.)", "correction": "corrected / improved version" }
  ],
  "improvements": ["short actionable tip 1", "short actionable tip 2"],
  "score": <integer from 1 to 10>
}
List up to 8 of the most useful mistakes only. Focus on grammar, vocabulary, clarity, filler words, and structure.`;

  const contents = [{ role: 'user', parts: [{ text: `Transcript:\n${transcriptText}` }] }];
  const raw = await callGemini(system, contents);
  const cleaned = raw.replace(/```json/gi, '').replace(/```/g, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch (e) {
    return {
      overallSummary: raw || 'The report could not be parsed as structured data. Raw AI output is shown here.',
      strengths: [],
      mistakes: [],
      improvements: [],
      score: null
    };
  }
}

module.exports = { getInterviewQuestion, getPracticeResponse, generateReport };
