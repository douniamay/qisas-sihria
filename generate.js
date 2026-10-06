const { admin, getUser } = require('./_lib');

const LIMITS = { free: 5, paid_200: 200, gold: 2000 };
const LANGS = { ar: 'العربية الفصحى', en: 'English', fr: 'Français' };
const MAX_TOKENS = { children: 1500, cartoon: 4000, novel: 4000, cinema: 4000 };
const MODEL = process.env.AI_MODEL || 'claude-sonnet-5-5';

const clip = (v, n) => String(v ?? '').trim().slice(0, n);

function buildPrompt(tool, f) {
  const lang = LANGS[f.lang] || LANGS.ar;
  if (tool === 'children') {
    return `اكتب قصة للأطفال باللغة: ${lang}.
الفكرة: ${clip(f.idea, 500)}
الفئة العمرية: ${clip(f.age, 20)} سنوات
نوع القصة: ${clip(f.type, 40)}
الطول: ${clip(f.length, 40)}
${f.values ? 'القيمة التربوية: ' + clip(f.values, 100) : ''}
اجعل الأسلوب بسيطًا وممتعًا ومناسبًا للعمر، مع عنوان جميل ونهاية سعيدة وهادفة.`;
  }
  if (tool === 'cartoon') {
    return `اكتب سيناريو فيلم كرتوني باللغة: ${lang}.
الفكرة: ${clip(f.idea, 600)}
عمر الجمهور: ${clip(f.age, 40)}
المدة: ${clip(f.duration, 60)}
${f.genre ? 'النوع: ' + clip(f.genre, 100) : ''}
${f.chars ? 'الشخصيات: ' + clip(f.chars, 300) : ''}
قدّم السيناريو بمشاهد مرقمة، مع وصف المشهد والحوار.`;
  }
  if (tool === 'novel') {
    return `أنت روائي محترف. اكتب باللغة: ${lang}.
فكرة الرواية: ${clip(f.idea, 700)}
نوع الرواية: ${clip(f.genre, 40)}
المطلوب: ${clip(f.output, 80)}
${f.chars ? 'الشخصيات: ' + clip(f.chars, 300) : ''}
استخدم أسلوبًا أدبيًا متماسكًا.`;
  }
  if (tool === 'cinema') {
    return `أنت كاتب سيناريو سينمائي محترف. اكتب باللغة: ${lang}.
فكرة الفيلم: ${clip(f.idea, 700)}
النوع: ${clip(f.genre, 40)}
المطلوب: ${clip(f.output, 80)}
${f.chars ? 'الشخصيات: ' + clip(f.chars, 300) : ''}`;
  }
  return null;
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const user = await getUser(req);
  if (!user) return res.status(401).json({ error: 'يرجى تسجيل الدخول من جديد.' });

  const { tool, fields } = req.body || {};
  const prompt = fields && buildPrompt(tool, fields);
  if (!prompt || !clip(fields.idea, 10)) return res.status(400).json({ error: 'بيانات غير صالحة.' });

  // قراءة الحساب وتحديد العدّاد والحد
  const { data: profile, error: pErr } = await admin
    .from('profiles').select('plan, free_used, paid_used').eq('id', user.id).single();
  if (pErr || !profile) return res.status(500).json({ error: 'تعذّر قراءة الحساب.' });

  const plan = LIMITS[profile.plan] ? profile.plan : 'free';
  const col = plan === 'free' ? 'free_used' : 'paid_used';
  const used = Number(profile[col] || 0);
  if (used >= LIMITS[plan]) {
    return res.status(402).json({ error: 'انتهت توليداتك. اختر خطة للمتابعة.' });
  }

  // حجز توليدة قبل الاستدعاء (شرط التطابق يمنع الطلبات المتزامنة من تجاوز الحد)
  const { data: reserved } = await admin
    .from('profiles').update({ [col]: used + 1 }).eq('id', user.id).eq(col, used).select('id');
  if (!reserved?.length) return res.status(409).json({ error: 'حاول مرة أخرى.' });

  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: MAX_TOKENS[tool],
        system: 'أنت كاتب مبدع. أعد النص المطلوب فقط دون مقدمات أو تعليقات، وبدون رموز Markdown.',
        messages: [{ role: 'user', content: prompt }]
      })
    });
    const data = await r.json();
    if (!r.ok) throw new Error(data?.error?.message || 'AI error');
    const story = (data.content || []).filter(b => b.type === 'text').map(b => b.text).join('\n').trim();
    if (!story) throw new Error('empty');
    return res.status(200).json({ story });
  } catch (e) {
    console.error('generate failed:', e.message);
    // إعادة التوليدة المحجوزة عند الفشل
    await admin.from('profiles').update({ [col]: used }).eq('id', user.id);
    return res.status(502).json({ error: 'تعذّر توليد النص الآن، حاول بعد قليل.' });
  }
};
