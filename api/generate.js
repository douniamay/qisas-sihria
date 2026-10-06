
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const prompt = req.body?.prompt || req.query?.prompt || "قصة عن الصداقة";
  
  const story = "عنوان القصة: " + prompt + "\n\nكان يا ما كان في قديم الزمان، كان هناك بطل يحب المغامرات. قرر هذا البطل أن يخوض مغامرة حول " + prompt + ". واجه الكثير من التحديات والصعاب، لكنه بشجاعته وذكائه تغلب عليها جميعا. وفي النهاية تعلم درسا مهما وهو أن الصداقة والمحبة هما أهم شيء في الحياة.\n\nالعبرة: كن شجاعا وطيبا وساعد الآخرين.\n\nانتهت.";

  return res.status(200).json({
    success: true,
    story: story,
    scenario: story,
    script: story
  });
