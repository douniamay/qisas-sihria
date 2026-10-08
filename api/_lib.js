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

  console.log(
    'AUTH HEADER:',
    header ? 'Bearer token received' : 'NO AUTHORIZATION HEADER'
  );

  const token = header.startsWith('Bearer ')
    ? header.slice(7).trim()
    : '';

  if (!token) {
    console.error('NO TOKEN');
    return null;
  }

  const { data, error } = await admin.auth.getUser(token);

  if (error) {
    console.error('SUPABASE AUTH ERROR:', error.message);
    console.error('SUPABASE AUTH STATUS:', error.status);
    return null;
  }

  if (!data?.user) {
    console.error('NO USER FROM SUPABASE');
    return null;
  }

  console.log('USER VERIFIED:', data.user.id);

  return data.user;
}
