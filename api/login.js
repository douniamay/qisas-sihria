const { createClient } = require('@supabase/supabase-js');
const { admin } = require('./_lib');

const BAD = 'اسم المستخدم أو كلمة المرور غير صحيحة.';

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const username = String(req.body?.username || '').trim().toLowerCase().slice(0, 40);
  const password = String(req.body?.password || '');
  if (!username || !password) return res.status(400).json({ error: BAD });

  // إيجاد البريد المرتبط باسم المستخدم (يتطلب عمود username في جدول profiles)
  const { data: p } = await admin
    .from('profiles').select('email').eq('username', username).maybeSingle();
  if (!p?.email) return res.status(401).json({ error: BAD });

  const anon = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
  const { data, error } = await anon.auth.signInWithPassword({ email: p.email, password });
  if (error || !data?.session) {
    const msg = /not confirmed/i.test(error?.message || '')
      ? 'يجب تأكيد بريدك الإلكتروني أولاً.'
      : BAD;
    return res.status(401).json({ error: msg });
  }

  return res.status(200).json({
    session: {
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token
    }
  });
};
