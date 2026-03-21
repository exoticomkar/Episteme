// netlify/functions/send-feedback.js
//
// ── ENV VAR NEEDED (add in Netlify → Site config → Environment variables) ──
//   TELEGRAM_BOT_TOKEN  = <your bot token>    ← placeholder, add when ready
//   TELEGRAM_CHAT_ID    = <your chat ID>       ← placeholder, add when ready
//
// The Telegram credentials NEVER appear in any public file.
// If you don't have a Telegram bot yet, this function returns ok:true
// (feedback silently succeeds) until you add the env vars.

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
    const { name, email, branch, source, rating, review, feature, timestamp } =
      JSON.parse(event.body || '{}');

    if (!name || !review)
      return { statusCode: 400, headers: H, body: JSON.stringify({ error: 'Name and review required' }) };

    // ── Placeholder: Telegram credentials come from env vars ──────────────
    const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const CHAT_ID   = process.env.TELEGRAM_CHAT_ID;

    // If env vars not yet set, silently succeed (feedback won't be delivered)
    if (!BOT_TOKEN || !CHAT_ID) {
      console.log('Feedback received (Telegram not configured):', { name, email, review });
      return { statusCode: 200, headers: H, body: JSON.stringify({ ok: true }) };
    }

    const stars = rating > 0 ? '⭐'.repeat(Number(rating)) : '(no rating)';
    const msg = [
      '🎓 *New Episteme Feedback*',
      `👤 *Name:* ${name}`,
      email   ? `📧 *Email:* ${email}`   : '',
      branch  ? `🌿 *Branch:* ${branch}` : '',
      source  ? `🔍 *Source:* ${source}` : '',
      `${stars} *Rating:* ${rating}/5`,
      `💬 *Review:*\n${review}`,
      feature ? `✨ *Request:* ${feature}` : '',
      `🕐 ${new Date().toLocaleString()}`,
    ].filter(Boolean).join('\n');

    const res = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: CHAT_ID, text: msg, parse_mode: 'Markdown' }),
      }
    );
    const data = await res.json();

    if (data.ok) {
      return { statusCode: 200, headers: H, body: JSON.stringify({ ok: true }) };
    } else {
      throw new Error(data.description || 'Telegram error');
    }

  } catch (err) {
    console.error('send-feedback:', err);
    return { statusCode: 500, headers: H, body: JSON.stringify({ error: err.message }) };
  }
};
