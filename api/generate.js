export default async function handler(request, response) {
  // السماح بالموقع المنشور على GitHub Pages
  response.setHeader(
    'Access-Control-Allow-Origin',
    'https://douniamay.github.io'
  );

  response.setHeader(
    'Access-Control-Allow-Methods',
    'POST, OPTIONS'
  );

  response.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type'
  );

  // معالجة طلب CORS المبدئي
  if (request.method === 'OPTIONS') {
    return response.status(200).end();
  }

  // نسمح فقط بـ POST
  if (request.method !== 'POST') {
    return response.status(405).json({
      error: 'Method Not Allowed'
    });
  }

  try {
    const { prompt } = request.body || {};

    if (!prompt || typeof prompt !== 'string') {
      return response.status(400).json({
        error: 'لم يتم إرسال النص المطلوب'
      });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return response.status(500).json({
        error: 'مفتاح Gemini غير موجود في إعدادات الخادم'
      });
    }

    const geminiResponse = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.7-flash:generateContent',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt
                }
              ]
            }
          ]
        })
      }
    );

    const data = await geminiResponse.json();

    if (!geminiResponse.ok) {
      return response.status(geminiResponse.status).json({
        error:
          data?.error?.message ||
          'حدث خطأ أثناء الاتصال بـ Gemini'
      });
    }

    const text =
      data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      return response.status(500).json({
        error: 'لم يُرجع Gemini نصًا'
      });
    }

    return response.status(200).json({
      story: text.trim()
    });

  } catch (error) {
    console.error(error);

    return response.status(500).json({
      error: 'حدث خطأ في الخادم، يرجى المحاولة مرة أخرى'
    });
  }
}
