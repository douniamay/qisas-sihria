export default async function handler(req, res) {
  if (req.method!== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { idea, prompt } = req.body;
    const userIdea = idea || prompt;

    if (!userIdea) {
      return res.status(400).json({ error: 'ما كتبتيش الفكرة' });
    }

    const geminiKey = process.env.GEMINI_API_KEY;
    if (!geminiKey) {
      return res.status(500).json({ error: 'GEMINI_API_KEY ناقص في Vercel' });
    }

    // نداء Gemini
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `اكتبي قصة سحرية للأطفال بالعربية من هادي الفكرة: ${userIdea}. خليها 3 فقرات، مشوقة ونهاية سعيدة.`
            }]
          }]
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error(data);
      return res.status(500).json({ error: data.error?.message || 'خطأ Gemini' });
    }

    const story = data.candidates?.[0]?.content?.parts?.[0]?.text || 'ما قدرتش نولد القصة';

    return res.status(200).json({ story });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
}
