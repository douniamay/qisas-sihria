export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'الرجاء إدخال فكرة القصة' });
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return res.status(response.status).json({ error: err.error?.message || 'خطأ من الخادم' });
    }

    const data = await response.json();
    const text = data.content.map(b => b.text || '').join('\n').trim();

    return res.status(200).json({ story: text });

  } catch (error) {
    return res.status(500).json({ error: 'حدث خطأ، يرجى المحاولة مرة أخرى' });
  }
}
