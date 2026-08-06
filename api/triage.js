// Vercel serverless function (not client-side code): this is the only place
// the Gemini API key is ever read, so it never reaches the browser.
// Deploy target: Vercel, Node runtime. Requires GEMINI_API_KEY set as an
// environment variable in the Vercel project settings (not in .env, which is
// client-bundled by Vite and would leak the key).
//
// Provider note: this originally called the Claude API directly. Switched to
// Google's Gemini API (gemini-2.5-flash) because it has a genuine no-card
// free tier, and the assignment brief explicitly allows "Claude API... or
// another LLM you prefer." The JSON contract this function returns
// (title/priority/reasoning) is unchanged, so nothing else in the app,
// including useTriage.ts and its tests, needed to change.

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { rawInput } = req.body ?? {};
  if (!rawInput || typeof rawInput !== 'string' || !rawInput.trim()) {
    return res.status(400).json({ error: 'rawInput is required' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('GEMINI_API_KEY is not set');
    return res.status(500).json({ error: 'AI triage is not configured' });
  }

  const prompt = `You are triaging one messy backlog entry for a frontend developer. Given the raw input below, respond with ONLY a JSON object (no prose, no markdown fences) with exactly these fields:
- "title": a clear, actionable version of the task, under 80 characters
- "priority": one of "low", "normal", "urgent", based on the language and urgency implied
- "reasoning": one sentence explaining the priority choice

Raw input: "${rawInput.trim()}"`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: "application/json" },
        }),
      },
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error('Gemini API error:', response.status, errText);
      return res.status(502).json({ error: 'AI triage request failed' });
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      console.error('Gemini response missing expected text field:', JSON.stringify(data));
      return res.status(502).json({ error: 'AI triage returned no text' });
    }

    let parsed;
    try {
      parsed = JSON.parse(text.trim());
    } catch (parseErr) {
      console.error('Failed to parse Gemini response as JSON:', text);
      return res.status(502).json({ error: 'AI triage returned an unreadable response' });
    }

    const { title, priority, reasoning } = parsed;
    const validPriorities = ['low', 'normal', 'urgent'];
    if (!title || !validPriorities.includes(priority) || !reasoning) {
      console.error('Gemini response missing expected fields:', parsed);
      return res.status(502).json({ error: 'AI triage returned an incomplete suggestion' });
    }

    return res.status(200).json({ title, priority, reasoning });
  } catch (err) {
    console.error('Unexpected error calling Gemini API:', err);
    return res.status(500).json({ error: 'AI triage failed unexpectedly' });
  }
}
