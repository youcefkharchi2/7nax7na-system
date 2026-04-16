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
    
    // Send to Discord via webhook
    const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
    if (webhookUrl) {
      const embed = {
        title: '📩 طلب وايت ليست جديد',
        color: 0x27F5A3,
        description: `**مقدم الطلب:** <@${user_id}>`,
        fields: [
          { name: '👤 RP Name', value: rp_name, inline: true },
          { name: '🎂 RP Age', value: rp_age, inline: true },
          { name: '📝 Real Name', value: real_name, inline: true },
          { name: '🔢 Real Age', value: real_age, inline: true },
          { name: '🌍 Country', value: country, inline: true },
          { name: '🔗 Steam', value: steam_link, inline: false },
          { name: '📖 Story', value: story.substring(0, 1000), inline: false }
        ],
        footer: { text: `ID: ${appId}` },
        timestamp: new Date().toISOString()
      };
      
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: `📩 تقديم جديد على الوايت ليست!\n<@${user_id}>`,
          embeds: [embed]
        })
      });
    }
    
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
