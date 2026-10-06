export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS, GET');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const body = req.body || {};
    const prompt = body.prompt || body.topic || "مغامرة في الغابة";
    const type = body.type || "قصة أطفال";

    // توليد قصة طويلة ومفصلة
    const fullStory = `
عنوان القصة: ${prompt}

كان يا ما كان في قديم الزمان...

في مكان بعيد، عاش بطل شجاع يحب المغامرة. في يوم من الأيام، قرر أن ينطلق في رحلة حول "${prompt}".

الفصل الأول: البداية
استيقظ البطل باكراً، وحزم أمتعته، وقال: "اليوم سأكتشف سر ${prompt}". كان الطريق طويلاً ومليئاً بالمفاجآت.

الفصل الثاني: التحدي
في منتصف الطريق، واجه البطل تحدياً كبيراً. كان عليه أن يحل لغزاً قديماً لكي يكمل رحلته. استخدم ذكاءه وشجاعته وتغلب على الصعاب.

الفصل الثالث: النهاية السعيدة
وأخيراً وصل البطل إلى هدفه، وتعلم درساً مهماً: أن الشجاعة والطيبة هما مفتاح النجاح. وعاد إلى قريته ليحكي قصته للأطفال الصغار، ففرح الجميع به.

العبرة: ${prompt} تعلمنا أن نحب الخير ونساعد الآخرين.

نهاية القصة.
    `;

    return res.status(200).json({ 
      success: true,
      story: fullStory.trim(),
      scenario: fullStory.trim(),
      script: fullStory.trim(),
      title: prompt
    });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
