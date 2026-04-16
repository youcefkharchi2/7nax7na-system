// Vercel Serverless Function for checking whitelist status
export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  
  try {
    const { userId } = req.query;
    
    // Return default status - in production, check your database
    res.status(200).json({
      status: 'not_submitted',
      userId
    });
    
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'حدث خطأ!' });
  }
}
