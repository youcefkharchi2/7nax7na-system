// Vercel Serverless Function for whitelist submission
export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  
  try {
    const { rp_name, rp_age, real_name, real_age, country, steam_link, story, user_id, user_avatar } = req.body;
    
    // Generate unique application ID
    const appId = Date.now().toString(36) + Math.random().toString(36).substr(2);
    
    // Send to Discord Bot API
    const botApiUrl = process.env.BOT_API_URL || 'http://51.75.118.17:20205/send-whitelist';
    
    await fetch(botApiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        appId,
        rp_name,
        rp_age,
        real_name,
        real_age,
        country,
        steam_link,
        story,
        user_id,
        user_avatar
      })
    });
    
    res.status(200).json({ 
      success: true, 
      message: 'تم إرسال الطلب بنجاح!',
      appId 
    });
    
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'حدث خطأ في السيرفر!' });
  }
}
