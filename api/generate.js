export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS, GET');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(200).json({ message: "API is working" });
  }

  try {
    const body = req.body || {};
    const prompt = body.prompt || "قصة اطفال";

    return res.status(200).json({ 
      success: true, 
      story: "قصة عن: " + prompt 
    });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
