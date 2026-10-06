// api/login.js — تسجيل الدخول باسم المستخدم (يبحث عن البريد في الخادم دون كشفه للمتصفح)
import { createClient } from '@supabase/supabase-js';

const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
});

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { username, password } = req.body || {};
  const u = String(username || '').toLowerCase().trim();
  if (!/^[a-z0-9_.]{3,20}$/.test(u) || !password) {
    return res.status(400).json({ error: 'اسم المستخدم أو كلمة المرور غير صحيحة.' });
  }
  const generic = { error: 'اسم المستخدم أو كلمة المرور غير صحيحة.' };
  const { data: p } = await sb.from('profiles').select('email').ilike('username', u).maybeSingle();
  if (!p?.email) return res.status(401).json(generic);

  const { data, error } = await sb.auth.signInWithPassword({ email: p.email, password: String(password) });
  if (error || !data?.session) {
    if (error?.message?.includes('Email not confirmed')) {
      return res.status(401).json({ error: 'يجب تأكيد بريدك الإلكتروني أولاً.' });
    }
    return res.status(401).json(generic);
  }
  return res.status(200).json({
    session: { access_token: data.session.access_token, refresh_token: data.session.refresh_token }
  });
}
