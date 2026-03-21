// netlify/functions/check-premium.js
// GET ?email=user@example.com → { email, premium: true/false }

const H = { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' };

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: H, body: '' };

  const email = (event.queryStringParameters?.email || '').toLowerCase().trim();
  if (!email) return { statusCode: 400, headers: H, body: JSON.stringify({ error: 'Email required' }) };

  try {
    const res = await fetch(`https://api.jsonbin.io/v3/b/${process.env.JSONBIN_BIN_ID}/latest`, {
      headers: { 'X-Master-Key': process.env.JSONBIN_MASTER_KEY, 'X-Bin-Meta': 'false' },
    });
    if (!res.ok) throw new Error('JSONBin ' + res.status);
    const db = await res.json();
    const user = (db.users || {})[email];
    return { statusCode: 200, headers: H, body: JSON.stringify({ email, premium: !!(user?.premium) }) };
  } catch (err) {
    console.error('check-premium:', err);
    return { statusCode: 200, headers: H, body: JSON.stringify({ email, premium: false }) };
  }
};
