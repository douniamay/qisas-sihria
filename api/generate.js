const { createClient } = require('@supabase/supabase-js');

// عميل بصلاحيات كاملة: يُستعمل في الخادم فقط (المفتاح السري من متغيرات Vercel)
const admin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

// يتحقق من توكن المستخدم القادم من المتصفح ويعيد المستخدم أو null
async function getUser(req) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) return null;
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data?.user) return null;
  return data.user;
}

module.exports = { admin, getUser };
