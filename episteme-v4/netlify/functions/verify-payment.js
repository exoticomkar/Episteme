// netlify/functions/verify-payment.js
// Verifies Razorpay HMAC-SHA256 signature, writes email to JSONBin

const crypto = require('crypto');

const H = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type', 'Content-Type': 'application/json' };

async function readDB() {
  const res = await fetch(`https://api.jsonbin.io/v3/b/${process.env.JSONBIN_BIN_ID}/latest`, {
    headers: { 'X-Master-Key': process.env.JSONBIN_MASTER_KEY, 'X-Bin-Meta': 'false' },
  });
  if (!res.ok) throw new Error('JSONBin read ' + res.status);
  return res.json();
}

async function writeDB(data) {
  const res = await fetch(`https://api.jsonbin.io/v3/b/${process.env.JSONBIN_BIN_ID}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'X-Master-Key': process.env.JSONBIN_MASTER_KEY },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('JSONBin write ' + res.status);
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: H, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers: H, body: JSON.stringify({ error: 'Method not allowed' }) };

  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, email } = JSON.parse(event.body || '{}');
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !email)
      return { statusCode: 400, headers: H, body: JSON.stringify({ error: 'Missing fields' }) };

    // HMAC verification — forging this without the secret key is cryptographically impossible
    const expected = crypto.createHmac('sha256', process.env.RZP_KEY_SECRET)
      .update(razorpay_order_id + '|' + razorpay_payment_id)
      .digest('hex');

    if (expected !== razorpay_signature) {
      console.warn('Sig mismatch:', email);
      return { statusCode: 400, headers: H, body: JSON.stringify({ error: 'Signature verification failed' }) };
    }

    // Valid → write to JSONBin
    const db = await readDB();
    const users = db.users || {};
    users[email.toLowerCase()] = {
      email: email.toLowerCase(),
      premium: true,
      paymentId: razorpay_payment_id,
      activatedAt: new Date().toISOString(),
    };
    await writeDB({ users });

    console.log('✅ Premium:', email, razorpay_payment_id);
    return { statusCode: 200, headers: H, body: JSON.stringify({ success: true, email }) };

  } catch (err) {
    console.error('verify-payment:', err);
    return { statusCode: 500, headers: H, body: JSON.stringify({ error: err.message }) };
  }
};
