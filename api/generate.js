export default async function handler(req,res){
 if(req.method!=='POST') return res.status(405).json({error:'Method not allowed'});
 const body = req.body || {};
 const ideaText = (body.fields?.idea || body.idea || '').toString().trim();
 if(!ideaText) return res.status(400).json({error:'الرجاء إدخال فكرة القصة'});
 try{
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,{
   method:'POST',
   headers:{'Content-Type':'application/json'},
   body:JSON.stringify({contents:[{parts:[{text:`اكتب قصة اطفال: ${ideaText} التفاصيل: ${JSON.stringify(body.fields)}`}]}]})
  });
  const data = await r.json();
  const story = data.candidates?.[0]?.content?.parts?.[0]?.text || 'خطأ في التوليد';
  return res.status(200).json({story});
 }catch(e){ return res.status(500).json({error:e.message}); }
}
