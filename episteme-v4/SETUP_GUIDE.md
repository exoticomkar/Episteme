# Episteme Premium — Setup Guide

## What you need (all free)

1. **Netlify account** — netlify.com (free)
2. **JSONBin account** — jsonbin.io (free) — this is your user database
3. Your Razorpay test credentials (already in the code)

---

## Step 1 — JSONBin setup (2 minutes)

1. Go to **https://jsonbin.io** and create a free account
2. Click **"Create Bin"**
3. Paste this as initial content and click Create:
   ```json
   { "users": {} }
   ```
4. From the URL, copy your **Bin ID** (looks like `64f3a1b2e369973a2fe3b123`)
5. Go to **Account → API Keys** → copy your **Master Key** (starts with `$2a$...`)

---

## Step 2 — Deploy to Netlify (1 minute)

**Easiest method — drag and drop:**
1. Go to **https://app.netlify.com**
2. Click **"Add new site"** → **"Deploy manually"**
3. Drag the entire `episteme-v4` folder onto the upload area
4. Wait ~30 seconds → your site is live at a URL like `https://amazing-name.netlify.app`

---

## Step 3 — Add environment variables

In Netlify: **Your site → Site configuration → Environment variables → Add a variable**

Add these 4 variables:

| Key                   | Value                                    |
|-----------------------|------------------------------------------|
| `RZP_KEY_ID`          | `rzp_test_STUpKxAqiHjhie`               |
| `RZP_KEY_SECRET`      | `sKSgVYAKd9UGCS3cvhNCgkxI`             |
| `JSONBIN_BIN_ID`      | *(your Bin ID from Step 1)*              |
| `JSONBIN_MASTER_KEY`  | *(your Master Key from Step 1)*          |

After adding all 4: click **"Trigger deploy"** → **"Deploy site"** to rebuild.

---

## Step 4 — Test

Open your Netlify URL. You should see:
- **"Log In"** and **"Sign Up ✦"** buttons in the top-right of the navbar
- ML and Network Security branches show a **★ PREMIUM** badge
- Clicking them opens the modal

Test payment card:
```
Card number:  4111 1111 1111 1111
Expiry:       Any future date (e.g. 12/26)
CVV:          Any 3 digits
OTP:          1234
```

After payment, the branches unlock and you're logged in.

---

## Going live with real payments

1. In Razorpay dashboard → switch to **Live mode** → copy Live API keys
2. In Netlify Environment variables → update `RZP_KEY_ID` and `RZP_KEY_SECRET`
3. In `public/premium.js` line 9 → update `RZP_KEY` to your live key ID
4. Remove `<span class="ep-test-pill">● TEST MODE</span>` from the modal in `premium.js`
5. Redeploy → done ✅

---

## Project structure

```
episteme-v4/
├── netlify.toml                  ← Tells Netlify: publish=public, functions=netlify/functions
├── package.json                  ← Declares razorpay npm package for functions
├── netlify/
│   └── functions/
│       ├── create-order.js       ← POST: creates Razorpay order (secret key lives here)
│       ├── verify-payment.js     ← POST: verifies HMAC + writes email to JSONBin
│       └── check-premium.js      ← GET:  checks if email is in JSONBin
└── public/                       ← Your website (all .html, .js, .css files)
    ├── index.html                ← Has Login + Sign Up buttons in topbar
    ├── premium.js                ← Frontend auth system (no secrets here)
    └── ...
```

---

## How it's secured

- **Razorpay secret key** → lives only in Netlify env vars. Never sent to browser.
- **HMAC-SHA256 verification** → payment signatures are cryptographically verified server-side. Impossible to fake without the secret key.
- **JSONBin master key** → lives only in Netlify env vars. Browser can only read premium status, not write it.
- **localStorage session** → re-validated with server every 7 days automatically.
