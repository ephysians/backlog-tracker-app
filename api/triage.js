// Vercel serverless function (not client-side code): this is the only place
// the Claude API key is ever read, so it never reaches the browser.
// Deploy target: Vercel, Node runtime. Requires ANTHROPIC_API_KEY set as an
// environment variable in the Vercel project settings (not in .env, which is
// client-bundled by Vite and would leak the key).

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { rawInput } = req.body ?? {};
  if (!rawInput || typeof rawInput !== 'string' || !rawInput.trim()) {
    return res.status(400).json({ error: 'rawInput is required' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    // Fail loudly in logs, but return a generic message to the client,
    // don't leak whether a key exists or not.
    console.error('ANTHROPIC_API_KEY is not set');
    return res.status(500).json({ error: 'AI triage is not configured' });
  }

  const prompt = `You are triaging one messy backlog entry for a frontend developer. Given the raw input below, respond with ONLY a JSON object (no prose, no markdown fences) with exactly these fields:
- "title": a clear, actionable version of the task, under 80 characters
- "priority": one of "low", "normal", "urgent", based on the language and urgency implied
- "reasoning": one sentence explaining the priority choice

Raw input: "${rawInput.trim()}"`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 200,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Claude API error:', response.status, errText);
      return res.status(502).json({ error: 'AI triage request failed' });
    }

    const data = await response.json();
    const textBlock = data.content?.find((block) => block.type === 'text');
    if (!textBlock) {
      return res.status(502).json({ error: 'AI triage returned no text' });
    }

    let parsed;
    try {
      parsed = JSON.parse(textBlock.text.trim());
    } catch (parseErr) {
      console.error('Failed to parse Claude response as JSON:', textBlock.text);
      return res.status(502).json({ error: 'AI triage returned an unreadable response' });
    }

    const { title, priority, reasoning } = parsed;
    const validPriorities = ['low', 'normal', 'urgent'];
    if (!title || !validPriorities.includes(priority) || !reasoning) {
      console.error('Claude response missing expected fields:', parsed);
      return res.status(502).json({ error: 'AI triage returned an incomplete suggestion' });
    }

    return res.status(200).json({ title, priority, reasoning });
  } catch (err) {
    console.error('Unexpected error calling Claude API:', err);
    return res.status(500).json({ error: 'AI triage failed unexpectedly' });
  }
}
