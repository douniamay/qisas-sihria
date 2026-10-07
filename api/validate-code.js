const { admin, getUser } = require('./_lib');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const user = await getUser(req);
  if (!user) return res.status(401).json({ valid: false });

  const code = String(req.body?.code || '').trim().toUpperCase().slice(0, 64);
  if (!code) return res.status(200).json({ valid: false });

  const { data: row } = await admin
    .from('activation_codes').select('code, plan').eq('code', code).eq('used', false).maybeSingle();
  if (!row) return res.status(200).json({ valid: false });

  // استهلاك الكود مرة واحدة فقط
  const { data: claimed } = await admin
    .from('activation_codes')
    .update({ used: true, used_by: user.id, used_at: new Date().toISOString() })
    .eq('code', code).eq('used', false).select('code');
  if (!claimed?.length) return res.status(200).json({ valid: false });

  const { error } = await admin
    .from('profiles').update({ plan: row.plan, paid_used: 0 }).eq('id', user.id);
  if (error) return res.status(500).json({ valid: false });

  return res.status(200).json({ valid: true });
};
