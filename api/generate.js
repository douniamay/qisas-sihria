export default async function handler(req, res) {
  const { idea, prompt } = req.body || {};
  const userIdea = (idea || prompt || '').trim();

  if (!userIdea) {
    return res.status(400).json({ error: 'الرجاء إدخال فكرة القصة' });
  }

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `اكتب قصة سحرية قصيرة بالعربية عن: ${userIdea}` }] }]
      })
    });
    const data = await response.json();
    const story = data.candidates?.[0]?.content?.parts?.[0]?.text || 'خطأ';
    return res.status(200).json({ story });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
