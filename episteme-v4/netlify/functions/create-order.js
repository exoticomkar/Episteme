// netlify/functions/create-order.js
//
// ── REQUIRED ENV VARS (Netlify dashboard → Site config → Environment variables) ──
//   RZP_KEY_ID         = rzp_test_STUpKxAqiHjhie
//   RZP_KEY_SECRET     = sKSgVYAKd9UGCS3cvhNCgkxI
//   JSONBIN_BIN_ID     = YOUR_BIN_ID          ← from jsonbin.io
//   JSONBIN_MASTER_KEY = YOUR_MASTER_KEY      ← from jsonbin.io

const Razorpay = require('razorpay');

const H = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: H, body: '' };
  if (event.httpMethod !== 'POST')
    return { statusCode: 405, headers: H, body: JSON.stringify({ error: 'Method not allowed' }) };

  try {
    const { email } = JSON.parse(event.body || '{}');
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return { statusCode: 400, headers: H, body: JSON.stringify({ error: 'Valid email required' }) };

    const rzp = new Razorpay({ key_id: process.env.RZP_KEY_ID, key_secret: process.env.RZP_KEY_SECRET });
    const order = await rzp.orders.create({
      amount: 19900, currency: 'INR',
      receipt: 'ep_' + Date.now(),
      notes: { email, plan: 'lifetime_premium' },
    });

    return { statusCode: 200, headers: H, body: JSON.stringify({
      orderId: order.id, amount: order.amount,
      currency: order.currency, keyId: process.env.RZP_KEY_ID,
    })};
  } catch (err) {
    console.error('create-order:', err);
    return { statusCode: 500, headers: H, body: JSON.stringify({ error: err.message }) };
  }
};
