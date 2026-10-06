export default async function handler(req, res) {
  // السماح لكل المواقع
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // نقبل GET و POST في زوج
  let prompt = "قصة عن الصداقة";
  
  if (req.method === 'POST') {
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      prompt = body?.prompt || body?.topic || prompt;
    } catch(e) {}
  } else if (req.method === 'GET') {
    prompt = req.query?.prompt || req.query?.topic || prompt;
  }

  const story = `عنوان القصة: ${prompt}

كان يا ما كان...

في يوم من الأيام، قرر بطلنا أن يعيش مغامرة حول "${prompt}". انطلق في الصباح الباكر، واجه الكثير من التحديات، تعلم دروساً كثيرة، وساعد أصدقاءه في الطريق.

وفي النهاية، عاد البطل إلى بيته وهو سعيد، وقد تعلم أن "${prompt}" تعلمنا أن نكون شجعاناً وطيبين.

العبرة: الصداقة والشجاعة هما أجمل ما في الحياة.

انتهت.`;

  return res.status(200).json({
    success: true,
    story: story,
    scenario: story,
    script: story,
    title: prompt
  });
}
