const { admin, getUser } = require('./_lib');

const LIMITS = {
  free: 5,
  paid_200: 200,
  gold: 2000
};

const LANGS = {
  ar: 'العربية الفصحى',
  en: 'English',
  fr: 'Français'
};

const MAX_TOKENS = {
  children: 4096,
  cartoon: 8192,
  novel: 8192,
  cinema: 8192
};

const MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

function clip(value, max) {
  return String(value ?? '').trim().slice(0, max);
}

function buildPrompt(tool, fields) {
  const lang = LANGS[fields.lang] || LANGS.ar;

  if (tool === 'children') {
    return `اكتب قصة للأطفال باللغة: ${lang}.

الفكرة:
${clip(fields.idea, 500)}

الفئة العمرية:
${clip(fields.age, 20)} سنوات

نوع القصة:
${clip(fields.type, 40)}

الطول:
${clip(fields.length, 40)}

${fields.values ? `القيمة التربوية:
${clip(fields.values, 100)}` : ''}

اجعل القصة ممتعة وبسيطة ومناسبة للعمر، مع عنوان جميل ونهاية سعيدة وهادفة.`;
  }

  if (tool === 'cartoon') {
    return `اكتب سيناريو فيلم كرتوني باللغة: ${lang}.

الفكرة:
${clip(fields.idea, 600)}

عمر الجمهور:
${clip(fields.age, 40)}

المدة:
${clip(fields.duration, 60)}

${fields.genre ? `النوع:
${clip(fields.genre, 100)}` : ''}

${fields.chars ? `الشخصيات:
${clip(fields.chars, 300)}` : ''}

قدّم السيناريو في مشاهد مرقمة، مع وصف واضح للمشهد والحوار.`;
  }

  if (tool === 'novel') {
    return `أنت روائي محترف.

اكتب باللغة: ${lang}.

فكرة الرواية:
${clip(fields.idea, 700)}

نوع الرواية:
${clip(fields.genre, 40)}

المطلوب:
${clip(fields.output, 80)}

${fields.chars ? `الشخصيات:
${clip(fields.chars, 300)}` : ''}

استخدم أسلوبًا أدبيًا متماسكًا وممتعًا.`;
  }

  if (tool === 'cinema') {
    return `أنت كاتب سيناريو سينمائي محترف.

اكتب باللغة: ${lang}.

فكرة الفيلم:
${clip(fields.idea, 700)}

النوع:
${clip(fields.genre, 40)}

المطلوب:
${clip(fields.output, 80)}

${fields.chars ? `الشخصيات:
${clip(fields.chars, 300)}` : ''}

اكتب سيناريو سينمائي واضحًا ومنظمًا.`;
  }

  return null;
}

module.exports = async (req, res) => {
  try {
    // يجب أن يكون الطلب POST
    if (req.method !== 'POST') {
      return res.status(405).json({
        error: 'Method not allowed'
      });
    }

    // التحقق من المستخدم
    const user = await getUser(req);

    if (!user) {
      return res.status(401).json({
        error: 'يرجى تسجيل الدخول من جديد.'
      });
    }

    // التأكد من وجود البيانات
    const { tool, fields } = req.body || {};

    if (!tool || !fields) {
      return res.status(400).json({
        error: 'بيانات التوليد غير مكتملة.'
      });
    }

    // التحقق من الأداة
    if (!MAX_TOKENS[tool]) {
      return res.status(400).json({
        error: 'نوع التوليد غير صالح.'
      });
    }

    // بناء الطلب
    const prompt = buildPrompt(tool, fields);

    if (!prompt || !clip(fields.idea, 10)) {
      return res.status(400).json({
        error: 'يرجى إدخال فكرة القصة.'
      });
    }

    // التأكد من وجود مفتاح Gemini
    if (!process.env.GEMINI_API_KEY) {
      console.error('GEMINI_API_KEY is missing');

      return res.status(500).json({
        error: 'إعداد خدمة الذكاء الاصطناعي غير مكتمل.'
      });
    }

    // قراءة حساب المستخدم
    const {
      data: profile,
      error: profileError
    } = await admin
      .from('profiles')
      .select('plan, free_used, paid_used')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Profile read error:', profileError);

      return res.status(500).json({
        error: 'تعذّر قراءة حساب المستخدم.'
      });
    }

    if (!profile) {
      return res.status(404).json({
        error: 'لم يتم العثور على حساب المستخدم.'
      });
    }

    // تحديد الخطة
    const plan = LIMITS[profile.plan]
      ? profile.plan
      : 'free';

    const column = plan === 'free'
      ? 'free_used'
      : 'paid_used';

    const used = Number(profile[column] || 0);
    const limit = LIMITS[plan];

    // التأكد من عدم تجاوز الحد
    if (used >= limit) {
      return res.status(402).json({
        error: 'انتهت التوليدات المتاحة. اختر خطة للمتابعة.'
      });
    }

    // حجز التوليدة
    const {
      data: reserved,
      error: reserveError
    } = await admin
      .from('profiles')
      .update({
        [column]: used + 1
      })
      .eq('id', user.id)
      .eq(column, used)
      .select('id');

    if (reserveError) {
      console.error('Reserve error:', reserveError);

      return res.status(500).json({
        error: 'تعذّر تحديث عداد التوليد.'
      });
    }

    if (!reserved || reserved.length === 0) {
      return res.status(409).json({
        error: 'حدث تعارض في عداد التوليد. حاول مرة أخرى.'
      });
    }

    try {
      // الاتصال بـ Gemini
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': process.env.GEMINI_API_KEY
          },
          body: JSON.stringify({
            systemInstruction: {
              parts: [
                {
                  text:
                    'أنت كاتب مبدع ومحترف. أعد النص المطلوب فقط دون مقدمات أو تعليقات خارج النص، وبدون Markdown.'
                }
              ]
            },

            contents: [
              {
                role: 'user',
                parts: [
                  {
                    text: prompt
                  }
                ]
              }
            ],

            generationConfig: {
              maxOutputTokens: MAX_TOKENS[tool],
              temperature: 0.9
            }
          })
        }
      );

      const data = await response.json();

      // Gemini أعاد خطأ
      if (!response.ok) {
        console.error(
          'Gemini API error:',
          JSON.stringify(data)
        );

        throw new Error(
          data?.error?.message ||
          `Gemini HTTP ${response.status}`
        );
      }

      // استخراج النص
      const story = (
        data?.candidates?.[0]?.content?.parts || []
      )
        .map(part => part.text || '')
        .join('')
        .trim();

      if (!story) {
        console.error(
          'Gemini returned no text:',
          JSON.stringify(data)
        );

        throw new Error('لم يتم إرجاع نص من Gemini.');
      }

      // نجاح
      return res.status(200).json({
        story
      });

   } catch (error) {
  console.error('GENERATE FUNCTION ERROR:', error);

  return res.status(500).json({
    error: 'SERVER ERROR: ' + (error?.message || String(error))
  });
}
