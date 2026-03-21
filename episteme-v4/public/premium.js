// ═══════════════════════════════════════════════════════════════════
//  EPISTEME PREMIUM  —  premium.js  v4
//  • Login / Sign Up buttons in topbar
//  • Unified auth modal (login tab + signup/payment tab)
//  • Netlify Functions backend (/.netlify/functions/)
//  • JSONBin.io user database
//  • Razorpay test mode payment
//  • Premium gating on ML + Network Security branches
//  • iOS frosted-glass context navbar
// ═══════════════════════════════════════════════════════════════════

/* ─── Config ──────────────────────────────────────────────────── */
const EP = {
  API:              '/.netlify/functions',
  RZP_KEY:          'rzp_test_STUpKxAqiHjhie',   // public — safe in JS
  PREMIUM_BRANCHES: ['ml', 'netsec'],
  PREMIUM_TAGS:     ['ML', 'NetSec'],
  SESSION_KEY:      'ep_session_v4',
  SESSION_TTL:      7 * 24 * 60 * 60 * 1000,     // 7 days
};

/* ─── Session ─────────────────────────────────────────────────── */
const Session = {
  get() {
    try {
      const s = JSON.parse(localStorage.getItem(EP.SESSION_KEY) || 'null');
      if (!s) return null;
      if (Date.now() - s.ts > EP.SESSION_TTL) { this.clear(); return null; }
      return s;
    } catch { return null; }
  },
  set(email) {
    localStorage.setItem(EP.SESSION_KEY, JSON.stringify({
      email: email.toLowerCase().trim(), ts: Date.now()
    }));
  },
  clear()     { localStorage.removeItem(EP.SESSION_KEY); },
  email()     { return this.get()?.email || null; },
  isPremium() { return !!this.get(); },
};

/* ─── API ─────────────────────────────────────────────────────── */
async function epFetch(path, opts = {}) {
  const r = await fetch(EP.API + path, {
    headers: { 'Content-Type': 'application/json' },
    ...opts,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  const json = await r.json();
  if (!r.ok) throw new Error(json.error || json.detail || `HTTP ${r.status}`);
  return json;
}

const api = {
  createOrder:   (email)   => epFetch('/create-order',   { method: 'POST', body: { email } }),
  verifyPayment: (payload) => epFetch('/verify-payment',  { method: 'POST', body: payload }),
  checkPremium:  (email)   => fetch(`${EP.API}/check-premium?email=${encodeURIComponent(email)}`).then(r => r.json()),
};

/* ═══════════════════════════════════════════════════════════════
   STYLES
═══════════════════════════════════════════════════════════════ */
(function injectStyles() {
  const css = `

/* ════════════════════════════════════════════
   TOPBAR AUTH AREA
════════════════════════════════════════════ */
#auth-area {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}
#auth-logged-out {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* Log In button */
.tb-login-btn {
  height: 34px;
  padding: 0 16px;
  background: transparent;
  border: 1px solid rgba(255,255,255,0.16);
  border-radius: 8px;
  color: rgba(200,200,240,0.8);
  font-family: 'Space Mono', monospace;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.06em;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}
.tb-login-btn:hover {
  border-color: var(--accent);
  color: var(--accent);
  background: rgba(0,229,255,0.06);
}
body.light .tb-login-btn {
  border-color: rgba(91,79,207,0.3);
  color: rgba(60,50,120,0.7);
}
body.light .tb-login-btn:hover {
  border-color: #5b4fcf;
  color: #5b4fcf;
  background: rgba(91,79,207,0.06);
}

/* Sign Up button */
.tb-signup-btn {
  height: 34px;
  padding: 0 16px;
  background: linear-gradient(135deg, #f59e0b, #ef4444);
  border: none;
  border-radius: 8px;
  color: #fff;
  font-family: 'Orbitron', monospace;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.08em;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
  box-shadow: 0 0 16px rgba(245,158,11,0.25);
}
.tb-signup-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 20px rgba(245,158,11,0.4);
}
.tb-signup-btn:active { transform: translateY(0); }

/* Logged-in user pill */
.tb-user-pill {
  display: flex;
  align-items: center;
  gap: 7px;
  height: 34px;
  padding: 0 12px;
  background: rgba(245,158,11,0.08);
  border: 1px solid rgba(245,158,11,0.25);
  border-radius: 8px;
  cursor: default;
  position: relative;
}
.tb-user-dot {
  width: 6px; height: 6px;
  background: #34d399;
  border-radius: 50%;
  box-shadow: 0 0 6px #34d399;
  flex-shrink: 0;
  animation: epDotBlink 2s ease-in-out infinite;
}
@keyframes epDotBlink { 0%,100%{opacity:1} 50%{opacity:.3} }
.tb-user-pill span {
  font-family: 'Space Mono', monospace;
  font-size: 9px;
  color: rgba(245,158,11,0.9);
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.tb-user-arrow {
  background: none;
  border: none;
  color: rgba(245,158,11,0.6);
  font-size: 10px;
  cursor: pointer;
  padding: 0 0 0 2px;
  line-height: 1;
  transition: transform 0.2s;
}
.tb-user-pill.open .tb-user-arrow { transform: rotate(180deg); }

/* Dropdown */
.tb-user-dropdown {
  position: absolute;
  top: calc(100% + 10px);
  right: 0;
  width: 220px;
  background: rgba(14,14,28,0.97);
  border: 1px solid rgba(245,158,11,0.2);
  border-radius: 14px;
  padding: 14px;
  box-shadow: 0 16px 48px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04);
  display: none;
  flex-direction: column;
  gap: 8px;
  z-index: 9000;
  backdrop-filter: blur(20px);
  animation: epDdIn 0.22s cubic-bezier(0.34,1.4,0.64,1);
}
.tb-user-dropdown.open { display: flex; }
@keyframes epDdIn {
  from { opacity:0; transform:translateY(-6px) scale(0.97); }
  to   { opacity:1; transform:translateY(0) scale(1); }
}
.tb-dd-crown {
  font-family: 'Orbitron', monospace;
  font-size: 10px;
  font-weight: 700;
  color: #f59e0b;
  letter-spacing: 0.06em;
}
.tb-dd-email {
  font-family: 'Space Mono', monospace;
  font-size: 9px;
  color: rgba(255,255,255,0.45);
  word-break: break-all;
}
.tb-dd-hr {
  border: none;
  border-top: 1px solid rgba(255,255,255,0.06);
  margin: 2px 0;
}
.tb-dd-item {
  background: none;
  border: none;
  color: rgba(200,200,240,0.7);
  font-family: 'Space Mono', monospace;
  font-size: 9.5px;
  cursor: pointer;
  text-align: left;
  padding: 6px 8px;
  border-radius: 6px;
  transition: all 0.15s;
  letter-spacing: 0.04em;
}
.tb-dd-item:hover { background: rgba(255,255,255,0.06); color: #fff; }
.tb-dd-logout { color: rgba(248,113,113,0.7); }
.tb-dd-logout:hover { background: rgba(239,68,68,0.08); color: #f87171; }

/* ════════════════════════════════════════════
   UNIFIED AUTH MODAL
════════════════════════════════════════════ */
#ep-modal-bg {
  display: none;
  position: fixed; inset: 0; z-index: 99999;
  background: rgba(0,0,0,.75);
  backdrop-filter: blur(18px) saturate(1.6);
  -webkit-backdrop-filter: blur(18px) saturate(1.6);
  align-items: center;
  justify-content: center;
  padding: 16px;
}
#ep-modal-bg.open { display: flex; }

#ep-modal {
  background: linear-gradient(155deg, #0e0e26 0%, #111130 50%, #0b0b1e 100%);
  border: 1px solid rgba(255,255,255,0.09);
  border-radius: 24px;
  width: 100%;
  max-width: 460px;
  max-height: min(700px, calc(100dvh - 32px));
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow:
    0 0 0 1px rgba(255,255,255,0.04),
    0 32px 80px rgba(0,0,0,0.7);
  animation: epModalIn 0.3s cubic-bezier(0.34,1.4,0.64,1);
  position: relative;
}
@keyframes epModalIn {
  from { opacity:0; transform:scale(0.9) translateY(16px); }
  to   { opacity:1; transform:scale(1) translateY(0); }
}

/* Tab bar */
#ep-tabs {
  display: flex;
  flex-shrink: 0;
  background: rgba(0,0,0,0.3);
  border-bottom: 1px solid rgba(255,255,255,0.06);
}
.ep-tab {
  flex: 1;
  padding: 16px;
  background: none;
  border: none;
  color: rgba(180,180,220,0.5);
  font-family: 'Space Mono', monospace;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
}
.ep-tab::after {
  content: '';
  position: absolute;
  bottom: 0; left: 20%; right: 20%; height: 2px;
  background: var(--accent, #00e5ff);
  border-radius: 2px 2px 0 0;
  opacity: 0;
  transition: opacity 0.2s;
}
.ep-tab.active { color: #fff; }
.ep-tab.active::after { opacity: 1; }
.ep-tab:hover:not(.active) { color: rgba(200,200,240,0.8); }

/* Login tab — signup tab has orange accent */
#ep-tab-signup.active::after { background: #f59e0b; }
#ep-tab-signup.active { color: #f59e0b; }

/* Close button */
#ep-close {
  position: absolute; top: 12px; right: 14px; z-index: 2;
  width: 28px; height: 28px; border-radius: 50%;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.10);
  color: #7a94b0; font-size: 13px;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; transition: all 0.18s;
}
#ep-close:hover { background: rgba(255,255,255,0.14); color: #fff; }

/* Scrollable panel body */
.ep-panel {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 24px 28px 28px;
  display: none;
  flex-direction: column;
  gap: 16px;
  scrollbar-width: thin;
  scrollbar-color: rgba(255,255,255,0.1) transparent;
}
.ep-panel.active { display: flex; }
.ep-panel::-webkit-scrollbar { width: 4px; }
.ep-panel::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }

/* Section heading */
.ep-panel-head {
  margin-bottom: 4px;
}
.ep-panel-title {
  font-family: 'Orbitron', monospace;
  font-size: 16px; font-weight: 900;
  color: #fff; letter-spacing: 0.03em;
  margin-bottom: 5px;
}
.ep-panel-sub {
  font-family: 'Nunito', sans-serif;
  font-size: 13px;
  color: rgba(255,255,255,0.5);
  line-height: 1.5;
}

/* Label + Input */
.ep-field { display: flex; flex-direction: column; gap: 6px; }
.ep-label {
  font-family: 'Space Mono', monospace;
  font-size: 9px;
  color: #5a7090;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}
.ep-input {
  width: 100%;
  padding: 12px 15px;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.10);
  border-radius: 10px;
  color: #fff;
  font-family: 'Space Mono', monospace;
  font-size: 13px;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
  box-sizing: border-box;
}
.ep-input:focus {
  border-color: var(--input-focus-color, rgba(0,229,255,0.5));
  box-shadow: 0 0 0 3px var(--input-focus-shadow, rgba(0,229,255,0.08));
}
.ep-input::placeholder { color: #3a5070; }
#ep-login-panel .ep-input:focus {
  --input-focus-color: rgba(0,229,255,0.5);
  --input-focus-shadow: rgba(0,229,255,0.08);
}
#ep-signup-panel .ep-input:focus {
  --input-focus-color: rgba(245,158,11,0.5);
  --input-focus-shadow: rgba(245,158,11,0.08);
}

/* Feature list (signup panel) */
.ep-features {
  list-style: none; padding: 0; margin: 0;
  display: flex; flex-direction: column; gap: 8px;
}
.ep-feat {
  display: flex; align-items: flex-start; gap: 10px;
  font-family: 'Nunito', sans-serif; font-size: 13px;
  color: rgba(255,255,255,0.78); line-height: 1.45;
}
.ep-feat-icon {
  width: 20px; height: 20px; border-radius: 50%; flex-shrink: 0; margin-top: 1px;
  background: linear-gradient(135deg, #f59e0b, #ef4444);
  display: flex; align-items: center; justify-content: center;
  font-size: 9px;
  box-shadow: 0 0 8px rgba(245,158,11,0.35);
}

/* Price strip */
.ep-price {
  background: rgba(245,158,11,0.07);
  border: 1px solid rgba(245,158,11,0.18);
  border-radius: 12px;
  padding: 13px 16px;
  display: flex; align-items: center; justify-content: space-between;
  gap: 8px;
}
.ep-price-num {
  font-family: 'Orbitron', monospace;
  font-size: 24px; font-weight: 900; color: #f59e0b;
}
.ep-price-lbl {
  font-family: 'Space Mono', monospace;
  font-size: 8px; color: #5a7090;
  text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 3px;
}
.ep-price-sub { font-family: 'Nunito', sans-serif; font-size: 11px; color: #5a7090; }
.ep-rzp { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; flex-shrink: 0; }
.ep-rzp-name { font-family: 'Orbitron', monospace; font-size: 10px; color: #528ff5; font-weight: 700; }
.ep-test-pill {
  background: rgba(52,211,153,0.12);
  border: 1px solid rgba(52,211,153,0.28);
  color: #34d399;
  font-family: 'Space Mono', monospace; font-size: 8px;
  padding: 2px 7px; border-radius: 20px; letter-spacing: 0.08em;
}

/* Divider */
.ep-divider {
  display: flex; align-items: center; gap: 8px;
  font-family: 'Space Mono', monospace; font-size: 9px; color: #3a5070; letter-spacing: 0.08em;
}
.ep-divider::before, .ep-divider::after {
  content: ''; flex: 1; height: 1px; background: rgba(255,255,255,0.06);
}

/* Buttons */
.ep-btn {
  width: 100%; padding: 13px 18px;
  border: none; border-radius: 11px;
  font-family: 'Orbitron', monospace; font-size: 11px; font-weight: 700;
  color: #fff; letter-spacing: 0.08em; cursor: pointer;
  display: flex; align-items: center; justify-content: center; gap: 8px;
  transition: transform 0.18s, box-shadow 0.18s;
  flex-shrink: 0;
}
.ep-btn-cyan {
  background: linear-gradient(135deg, #00e5ff, #06b6d4);
  box-shadow: 0 4px 16px rgba(0,229,255,0.25);
}
.ep-btn-cyan:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0,229,255,0.4);
}
.ep-btn-gold {
  background: linear-gradient(135deg, #f59e0b, #ef4444);
  box-shadow: 0 4px 16px rgba(245,158,11,0.28);
}
.ep-btn-gold:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(245,158,11,0.45);
}
.ep-btn:active:not(:disabled) { transform: translateY(0); }
.ep-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.ep-spin {
  width: 14px; height: 14px; border-radius: 50%;
  border: 2px solid rgba(255,255,255,0.25);
  border-top-color: #fff;
  animation: epSpin 0.7s linear infinite;
  display: none; flex-shrink: 0;
}
.ep-btn.loading .ep-spin { display: block; }
.ep-btn.loading .ep-btxt { display: none; }
@keyframes epSpin { to { transform: rotate(360deg); } }

/* Status */
.ep-status {
  padding: 10px 13px; border-radius: 8px; display: none;
  font-family: 'Space Mono', monospace; font-size: 10px;
  text-align: center; line-height: 1.5; word-break: break-word;
}
.ep-status.err  { display:block; background:rgba(239,68,68,.10); border:1px solid rgba(239,68,68,.3); color:#f87171; }
.ep-status.ok   { display:block; background:rgba(52,211,153,.10); border:1px solid rgba(52,211,153,.3); color:#34d399; }
.ep-status.info { display:block; background:rgba(56,189,248,.10); border:1px solid rgba(56,189,248,.3); color:#38bdf8; }

/* Switch text */
.ep-switch { text-align:center; font-family:'Nunito',sans-serif; font-size:12px; color:#3a5070; }
.ep-switch-btn { color:var(--accent,#00e5ff); background:none; border:none; cursor:pointer; font-family:'Nunito',sans-serif; font-size:12px; text-decoration:underline; padding:0; }
.ep-switch-btn:hover { opacity:0.8; }
#ep-signup-panel .ep-switch-btn { color:#f59e0b; }

/* ════════════════════════════════════════════
   PREMIUM BRANCH BADGE
════════════════════════════════════════════ */
.ep-premium-badge {
  display: inline-flex; align-items: center; gap: 4px;
  background: linear-gradient(135deg, #f59e0b, #ef4444);
  color: #fff;
  font-family: 'Orbitron', monospace; font-size: 8px; font-weight: 700;
  letter-spacing: 0.12em; padding: 3px 9px; border-radius: 20px;
  box-shadow: 0 0 12px rgba(245,158,11,.45);
  animation: epBadgePulse 2.5s ease-in-out infinite;
  white-space: nowrap; flex-shrink: 0;
}
@keyframes epBadgePulse {
  0%,100% { box-shadow: 0 0 10px rgba(245,158,11,.4); }
  50%     { box-shadow: 0 0 22px rgba(245,158,11,.75), 0 0 40px rgba(239,68,68,.25); }
}
.branch-card.is-premium .branch-card-top {
  display: flex; justify-content: space-between; align-items: flex-start;
}
.branch-card.is-premium:not(.unlocked) {
  border-color: rgba(245,158,11,.2) !important;
  opacity: 0.88;
}

/* Locked exp cards */
.exp-list-card.is-locked { cursor: not-allowed !important; opacity: 0.5; position: relative; }
.exp-list-card.is-locked::after {
  content: '🔒 PREMIUM';
  position: absolute; top: 10px; right: 10px;
  background: linear-gradient(135deg,#f59e0b,#ef4444); color: #fff;
  font-family: 'Orbitron', monospace; font-size: 7px; font-weight: 700;
  padding: 3px 7px; border-radius: 20px; letter-spacing: 0.1em; z-index: 2;
}

/* Success toast */
@keyframes epToastIn { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }

/* ════════════════════════════════════════════
   iOS GLASS NAVBAR — full rewrite
════════════════════════════════════════════ */
#glass-navbar {
  position: fixed;
  top: 68px; left: 50%;
  transform: translateX(-50%) translateY(-5px) scale(0.96);
  z-index: 500;

  display: flex;
  align-items: center;
  gap: 2px;

  /* True iOS frosted glass */
  background: rgba(14, 14, 32, 0.54);
  backdrop-filter: blur(30px) saturate(1.9) brightness(1.1);
  -webkit-backdrop-filter: blur(30px) saturate(1.9) brightness(1.1);

  border: 1px solid rgba(255,255,255,0.13);
  border-bottom-color: rgba(255,255,255,0.05);
  border-radius: 50px;
  padding: 5px 7px;

  box-shadow:
    inset 0 1.5px 0 rgba(255,255,255,0.13),
    inset 0 0 0 0.5px rgba(255,255,255,0.05),
    0 14px 44px rgba(0,0,0,0.45),
    0 2px 10px rgba(0,0,0,0.25);

  /* Animate in/out */
  opacity: 0;
  pointer-events: none;
  transition:
    opacity 0.3s cubic-bezier(0.34,1.4,0.64,1),
    transform 0.3s cubic-bezier(0.34,1.4,0.64,1);

  white-space: nowrap;
  overflow: hidden;
}
#glass-navbar.visible {
  opacity: 1;
  pointer-events: auto;
  transform: translateX(-50%) translateY(0) scale(1);
}
/* Top shimmer line */
#glass-navbar::before {
  content: '';
  position: absolute;
  top: 0; left: 16px; right: 16px; height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
  pointer-events: none;
}

.gnav-item {
  display: flex; align-items: center; gap: 5px;
  padding: 7px 14px; border-radius: 40px;
  font-family: 'Space Mono', monospace; font-size: 9.5px; font-weight: 700;
  letter-spacing: 0.05em;
  color: rgba(200,200,240,0.55);
  cursor: pointer; border: none; background: transparent;
  transition: all 0.24s cubic-bezier(0.34,1.2,0.64,1);
  user-select: none; white-space: nowrap; overflow: hidden;
}
.gnav-item:hover { color: rgba(230,230,255,0.9); background: rgba(255,255,255,0.07); }
.gnav-item.active {
  color: #0d0d1a;
  background: var(--accent, #00e5ff);
  box-shadow: 0 0 20px rgba(0,229,255,0.4), 0 2px 6px rgba(0,0,0,0.25);
  transform: scale(1.03);
}
.gnav-sep {
  width: 1px; height: 13px; flex-shrink: 0;
  background: linear-gradient(180deg, transparent, rgba(255,255,255,0.13), transparent);
  transition: opacity 0.25s, width 0.25s, margin 0.25s;
}

/* Light mode */
body.light #glass-navbar {
  background: rgba(238,242,255,0.75);
  border-color: rgba(91,79,207,0.16);
  box-shadow:
    inset 0 1.5px 0 rgba(255,255,255,0.85),
    0 14px 44px rgba(91,79,207,0.08),
    0 2px 10px rgba(91,79,207,0.06);
}
body.light #glass-navbar::before {
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.75), transparent);
}
body.light .gnav-item { color: rgba(60,50,120,0.5); }
body.light .gnav-item:hover { color: #3b3170; background: rgba(91,79,207,0.07); }
body.light .gnav-item.active {
  color: #fff; background: #5b4fcf;
  box-shadow: 0 0 18px rgba(91,79,207,0.45), 0 2px 6px rgba(0,0,0,0.15);
}
body.light .gnav-sep {
  background: linear-gradient(180deg, transparent, rgba(91,79,207,0.18), transparent);
}
`;
  const el = document.createElement('style');
  el.textContent = css;
  document.head.appendChild(el);
})();

/* ═══════════════════════════════════════════════════════════════
   LOAD RAZORPAY SDK
═══════════════════════════════════════════════════════════════ */
(function() {
  const sc = document.createElement('script');
  sc.src = 'https://checkout.razorpay.com/v1/checkout.js';
  sc.async = true;
  document.head.appendChild(sc);
})();

/* ═══════════════════════════════════════════════════════════════
   BUILD AUTH MODAL
═══════════════════════════════════════════════════════════════ */
(function buildModal() {
  const el = document.createElement('div');
  el.id = 'ep-modal-bg';
  el.innerHTML = `
<div id="ep-modal">

  <!-- Tab bar -->
  <div id="ep-tabs">
    <button class="ep-tab active" id="ep-tab-login"  onclick="authSwitchTab('login')">Log In</button>
    <button class="ep-tab"        id="ep-tab-signup" onclick="authSwitchTab('signup')">Sign Up / Upgrade ✦</button>
  </div>

  <button id="ep-close" aria-label="Close">✕</button>

  <!-- ── LOGIN PANEL ────────────────────────────────────────── -->
  <div class="ep-panel active" id="ep-login-panel">
    <div class="ep-panel-head">
      <div class="ep-panel-title">Welcome back</div>
      <div class="ep-panel-sub">Enter your email to restore premium access.</div>
    </div>
    <div class="ep-field">
      <label class="ep-label" for="ep-login-email">Email address</label>
      <input class="ep-input" id="ep-login-email" type="email" placeholder="you@gmail.com" autocomplete="email" />
    </div>
    <button class="ep-btn ep-btn-cyan" id="ep-login-btn">
      <div class="ep-spin"></div>
      <span class="ep-btxt">→ Restore Access</span>
    </button>
    <div class="ep-status" id="ep-login-status"></div>
    <div class="ep-switch">
      New here? <button class="ep-switch-btn" onclick="authSwitchTab('signup')">Upgrade to Premium →</button>
    </div>
  </div>

  <!-- ── SIGNUP / PAYMENT PANEL ─────────────────────────────── -->
  <div class="ep-panel" id="ep-signup-panel">
    <div class="ep-panel-head">
      <div class="ep-panel-title">Unlock Premium</div>
    </div>

    <!-- Features -->
    <ul class="ep-features">
      <li class="ep-feat"><div class="ep-feat-icon">🤖</div><span><strong>Machine Learning</strong> — Gradient Descent, KNN, K-Means, Decision Tree, Perceptron</span></li>
      <li class="ep-feat"><div class="ep-feat-icon">🛡</div><span><strong>Network Security</strong> — DDoS, SQL Injection, Firewall, MITM, ZKP visualizations</span></li>
      <li class="ep-feat"><div class="ep-feat-icon">♾</div><span><strong>Lifetime Access</strong> — pay once, unlock forever including all future experiments</span></li>
      <li class="ep-feat"><div class="ep-feat-icon">⚡</div><span><strong>Instant Activation</strong> — branches unlock immediately after payment</span></li>
    </ul>

    <!-- Price -->
    <div class="ep-price">
      <div>
        <div class="ep-price-lbl">One-time · Lifetime</div>
        <div class="ep-price-num">₹199</div>
        <div class="ep-price-sub">No subscription · No expiry</div>
      </div>
      <div class="ep-rzp">
        <span style="font-size:8px;letter-spacing:.1em;color:#3a5070">SECURED BY</span>
        <span class="ep-rzp-name">RAZORPAY</span>
        <span class="ep-test-pill">● TEST MODE</span>
      </div>
    </div>

    <div class="ep-divider">YOUR DETAILS</div>

    <div class="ep-field">
      <label class="ep-label" for="ep-signup-email">Gmail / Email</label>
      <input class="ep-input" id="ep-signup-email" type="email" placeholder="you@gmail.com" autocomplete="email" />
    </div>

    <button class="ep-btn ep-btn-gold" id="ep-signup-btn">
      <div class="ep-spin"></div>
      <span class="ep-btxt">🔓 Unlock Premium — ₹199</span>
    </button>
    <div class="ep-status" id="ep-signup-status"></div>
    <div class="ep-switch">
      Already paid? <button class="ep-switch-btn" onclick="authSwitchTab('login')">← Log In to restore</button>
    </div>
  </div>

</div>`;
  document.body.appendChild(el);

  // Close on backdrop click
  el.addEventListener('click', e => { if (e.target === el) authClose(); });
  document.getElementById('ep-close').addEventListener('click', authClose);
})();

/* ═══════════════════════════════════════════════════════════════
   MODAL CONTROLLER
═══════════════════════════════════════════════════════════════ */
let _authCallback = null;

function authOpenLogin(cb) {
  _authCallback = cb || null;
  document.getElementById('ep-modal-bg').classList.add('open');
  authSwitchTab('login');
  setTimeout(() => document.getElementById('ep-login-email')?.focus(), 120);
}

function authOpenSignup(cb) {
  _authCallback = cb || null;
  document.getElementById('ep-modal-bg').classList.add('open');
  authSwitchTab('signup');
  setTimeout(() => document.getElementById('ep-signup-email')?.focus(), 120);
}

function authClose() {
  document.getElementById('ep-modal-bg').classList.remove('open');
}

function authSwitchTab(tab) {
  // Tab buttons
  document.getElementById('ep-tab-login').classList.toggle('active', tab === 'login');
  document.getElementById('ep-tab-signup').classList.toggle('active', tab === 'signup');
  // Panels
  document.getElementById('ep-login-panel').classList.toggle('active', tab === 'login');
  document.getElementById('ep-signup-panel').classList.toggle('active', tab === 'signup');
  // Reset statuses
  epStatus('ep-login-status', '', '');
  epStatus('ep-signup-status', '', '');
}

function epStatus(id, type, msg) {
  const el = document.getElementById(id);
  if (!el) return;
  el.className = 'ep-status' + (type ? ' ' + type : '');
  el.textContent = msg;
}

function epLoading(id, on) {
  const b = document.getElementById(id);
  if (!b) return;
  b.disabled = on;
  b.classList.toggle('loading', on);
}

/* ── Dropdown toggle ─────────────────────────────────────────── */
function authToggleDropdown() {
  const pill = document.getElementById('tb-user-pill');
  const dd   = document.getElementById('tb-user-dropdown');
  const isOpen = dd.classList.contains('open');
  dd.classList.toggle('open', !isOpen);
  pill.classList.toggle('open', !isOpen);
}
// Close dropdown on outside click
document.addEventListener('click', e => {
  const pill = document.getElementById('tb-user-pill');
  if (pill && !pill.contains(e.target)) {
    document.getElementById('tb-user-dropdown').classList.remove('open');
    pill.classList.remove('open');
  }
});

/* ── Log out ─────────────────────────────────────────────────── */
function authLogout() {
  Session.clear();
  updateAuthUI();
  refreshBranchCards();
  document.getElementById('tb-user-dropdown').classList.remove('open');
  document.getElementById('tb-user-pill').classList.remove('open');
}

/* ─── Update topbar auth UI based on session ──────────────────── */
function updateAuthUI() {
  const email = Session.email();
  const loggedIn  = document.getElementById('auth-logged-in');
  const loggedOut = document.getElementById('auth-logged-out');
  const userEmail = document.getElementById('tb-user-email');
  const ddEmail   = document.getElementById('tb-dd-email');

  if (email) {
    if (loggedIn)  loggedIn.style.display  = 'flex';
    if (loggedOut) loggedOut.style.display = 'none';
    if (userEmail) userEmail.textContent = email.length > 18 ? email.slice(0, 18) + '…' : email;
    if (ddEmail)   ddEmail.textContent   = email;
  } else {
    if (loggedIn)  loggedIn.style.display  = 'none';
    if (loggedOut) loggedOut.style.display = 'flex';
  }
}

/* ═══════════════════════════════════════════════════════════════
   LOGIN (RESTORE) FLOW
═══════════════════════════════════════════════════════════════ */
document.getElementById('ep-login-btn').addEventListener('click', async () => {
  const email = (document.getElementById('ep-login-email').value || '').trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    epStatus('ep-login-status', 'err', '⚠ Enter a valid email address.'); return;
  }

  epLoading('ep-login-btn', true);
  epStatus('ep-login-status', 'info', '🔍 Checking your account…');

  try {
    const r = await api.checkPremium(email);
    if (r.premium) {
      Session.set(email);
      onPremiumGranted(email, 'login');
    } else {
      epStatus('ep-login-status', 'err', '❌ No premium account found. Use Sign Up to purchase access.');
    }
  } catch (err) {
    epStatus('ep-login-status', 'err', '⚠ Server error: ' + err.message);
  } finally {
    epLoading('ep-login-btn', false);
  }
});

/* ═══════════════════════════════════════════════════════════════
   SIGNUP / PAYMENT FLOW
═══════════════════════════════════════════════════════════════ */
document.getElementById('ep-signup-btn').addEventListener('click', async () => {
  const email = (document.getElementById('ep-signup-email').value || '').trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    epStatus('ep-signup-status', 'err', '⚠ Enter a valid email address.'); return;
  }

  epLoading('ep-signup-btn', true);
  epStatus('ep-signup-status', 'info', '⏳ Preparing your order…');

  try {
    // Step 1: Check if already premium
    const existing = await api.checkPremium(email);
    if (existing.premium) {
      Session.set(email);
      onPremiumGranted(email, 'existing');
      return;
    }

    // Step 2: Create Razorpay order via Netlify function
    const order = await api.createOrder(email);

    epStatus('ep-signup-status', 'info', '💳 Opening Razorpay…');

    // Step 3: Open checkout
    const rzp = new window.Razorpay({
      key:         EP.RZP_KEY,
      amount:      order.amount,
      currency:    order.currency,
      name:        'Episteme DSA Lab',
      description: 'Premium — Lifetime Access',
      order_id:    order.orderId,
      prefill:     { email },
      theme:       { color: '#f59e0b' },
      modal: {
        ondismiss() {
          epStatus('ep-signup-status', 'info', 'Payment cancelled. Try again anytime.');
          epLoading('ep-signup-btn', false);
        },
      },
      handler: async (resp) => {
        epStatus('ep-signup-status', 'info', '✅ Payment received — verifying…');
        epLoading('ep-signup-btn', true);
        try {
          const v = await api.verifyPayment({
            razorpay_order_id:   resp.razorpay_order_id,
            razorpay_payment_id: resp.razorpay_payment_id,
            razorpay_signature:  resp.razorpay_signature,
            email,
          });
          if (v.success) {
            Session.set(email);
            onPremiumGranted(email, 'payment');
          } else {
            epStatus('ep-signup-status', 'err', '❌ Verification failed. Payment ID: ' + resp.razorpay_payment_id);
          }
        } catch (err) {
          epStatus('ep-signup-status', 'err', '⚠ Verification error: ' + err.message);
        } finally {
          epLoading('ep-signup-btn', false);
        }
      },
    });
    rzp.open();

  } catch (err) {
    epStatus('ep-signup-status', 'err', '❌ ' + err.message);
    console.error(err);
  } finally {
    epLoading('ep-signup-btn', false);
  }
});

/* ─── Called on success ───────────────────────────────────────── */
function onPremiumGranted(email, source) {
  const statusId = source === 'login' ? 'ep-login-status' : 'ep-signup-status';
  epStatus(statusId, 'ok', `✅ Premium active for ${email}!`);

  updateAuthUI();
  refreshBranchCards();

  setTimeout(() => {
    authClose();
    showToast(email);
    if (_authCallback) { _authCallback(); _authCallback = null; }
  }, 1400);
}

function showToast(email) {
  const t = document.createElement('div');
  t.style.cssText = `
    position:fixed; bottom:24px; right:24px; z-index:99999;
    background:linear-gradient(135deg,#0c180c,#142010);
    border:1px solid rgba(52,211,153,.4); border-radius:14px;
    padding:13px 18px; display:flex; align-items:center; gap:11px;
    box-shadow:0 8px 32px rgba(0,0,0,.5),0 0 24px rgba(52,211,153,.1);
    animation:epToastIn .35s cubic-bezier(.34,1.56,.64,1);
    max-width:300px; font-family:'Nunito',sans-serif;
  `;
  t.innerHTML = `
    <div style="font-size:22px">🎉</div>
    <div>
      <div style="font-family:'Orbitron',monospace;font-size:10px;font-weight:700;color:#34d399;margin-bottom:2px">PREMIUM UNLOCKED</div>
      <div style="font-size:12px;color:rgba(255,255,255,.65)">${email}</div>
    </div>`;
  document.body.appendChild(t);
  setTimeout(() => { t.style.transition='opacity .3s'; t.style.opacity='0'; setTimeout(()=>t.remove(),350); }, 4000);
}

/* ═══════════════════════════════════════════════════════════════
   BRANCH CARD GATING
═══════════════════════════════════════════════════════════════ */
function refreshBranchCards() {
  const premium = Session.isPremium();
  document.querySelectorAll('.branch-card').forEach(card => {
    const id = (card.getAttribute('data-href') || '').replace('.html', '');
    if (!EP.PREMIUM_BRANCHES.includes(id)) return;

    card.classList.add('is-premium');
    card.querySelectorAll('.ep-premium-badge').forEach(b => b.remove());

    if (premium) {
      card.classList.add('unlocked');
    } else {
      card.classList.remove('unlocked');
      const top = card.querySelector('.branch-card-top');
      if (top) {
        const badge = document.createElement('div');
        badge.className = 'ep-premium-badge';
        badge.textContent = '★ PREMIUM';
        top.appendChild(badge);
      }
    }
  });
}

/* Lock experiment cards inside premium branches */
const _lockObs = new MutationObserver(() => {
  if (!window.activeBranch) return;
  if (!EP.PREMIUM_BRANCHES.includes(window.activeBranch.id)) return;
  if (Session.isPremium()) return;

  document.querySelectorAll('.exp-list-card:not(.is-locked)').forEach(card => {
    card.classList.add('is-locked');
    const clone = card.cloneNode(true);
    clone.classList.add('is-locked');
    clone.addEventListener('click', e => { e.stopPropagation(); authOpenSignup(); });
    card.parentNode.replaceChild(clone, card);
  });
  document.querySelectorAll('.exp-list-detail-btn').forEach(btn => {
    const c = btn.cloneNode(true);
    c.addEventListener('click', e => { e.stopPropagation(); authOpenSignup(); });
    btn.parentNode.replaceChild(c, btn);
  });
});
_lockObs.observe(document.body, { childList: true, subtree: true });

/* Patch openBranch + openExperiment */
function patchAppFunctions() {
  if (typeof window.openBranch === 'function' && !window.openBranch._ep) {
    const orig = window.openBranch;
    window.openBranch = function(branch) {
      if (EP.PREMIUM_BRANCHES.includes(branch.id) && !Session.isPremium()) {
        authOpenSignup(() => orig.call(window, branch)); return;
      }
      orig.call(window, branch);
    };
    window.openBranch._ep = true;
  }
  if (typeof window.openExperiment === 'function' && !window.openExperiment._ep) {
    const orig = window.openExperiment;
    window.openExperiment = function(id) {
      const exp = (window.EXPERIMENTS || []).find(e => e.id === id);
      if (exp && EP.PREMIUM_TAGS.includes(exp.tag) && !Session.isPremium()) {
        authOpenSignup(() => orig.call(window, id)); return;
      }
      orig.call(window, id);
    };
    window.openExperiment._ep = true;
  }
}

/* ═══════════════════════════════════════════════════════════════
   iOS GLASS NAVBAR — complete smooth implementation
═══════════════════════════════════════════════════════════════ */
(function patchNavbar() {
  const navbar = document.getElementById('glass-navbar');
  if (!navbar) return;

  // Rebuild navbar HTML cleanly
  navbar.innerHTML = `
    <button class="gnav-item" id="gnav-menu" onclick="glassNavGoHome()">
      <span style="font-size:11px">⌂</span><span>Menu</span>
    </button>
    <div class="gnav-sep" id="gnav-s1"></div>
    <button class="gnav-item" id="gnav-branch" onclick="glassNavGoBranch()">
      <span style="font-size:11px" id="gnav-branch-icon">◈</span>
      <span id="gnav-branch-name">Branch</span>
    </button>
    <div class="gnav-sep" id="gnav-s2"></div>
    <button class="gnav-item" id="gnav-exp" onclick="glassNavGoExp()">
      <span style="font-size:11px">🔬</span>
      <span id="gnav-exp-name">Experiment</span>
    </button>`;

  // Initially collapse branch + exp crumbs
  function initHide(id, isSep) {
    const el = document.getElementById(id);
    if (!el) return;
    const tr = 'all 0.28s cubic-bezier(0.34,1.2,0.64,1)';
    el.style.transition = tr;
    if (isSep) {
      el.style.opacity = '0'; el.style.width = '0'; el.style.margin = '0';
    } else {
      el.style.maxWidth = '0'; el.style.opacity = '0';
      el.style.overflow = 'hidden'; el.style.padding = '0';
    }
  }
  initHide('gnav-s1', true);
  initHide('gnav-branch', false);
  initHide('gnav-s2', true);
  initHide('gnav-exp', false);

  function showEl(id, visible, isSep) {
    const el = document.getElementById(id);
    if (!el) return;
    if (isSep) {
      el.style.opacity = visible ? '1' : '0';
      el.style.width   = visible ? '1px' : '0';
      el.style.margin  = visible ? '0 1px' : '0';
    } else {
      el.style.maxWidth = visible ? '200px' : '0';
      el.style.opacity  = visible ? '1' : '0';
      el.style.padding  = visible ? '' : '0';
      el.style.overflow = visible ? '' : 'hidden';
    }
  }

  function setActive(id) {
    ['gnav-menu','gnav-branch','gnav-exp'].forEach(i => {
      document.getElementById(i)?.classList.toggle('active', i === id);
    });
  }

  function updateNav() {
    const expList   = document.getElementById('exp-list-view');
    const theory    = document.getElementById('theory-screen');
    const expScreen = document.getElementById('exp-screen');

    const inBranch  = expList?.classList.contains('active');
    const inTheory  = theory?.style.display !== 'none' && theory?.style.display !== '';
    const inExp     = expScreen?.classList.contains('active');
    const inAnywhere = inBranch || inTheory || inExp;

    if (!inAnywhere) { navbar.classList.remove('visible'); return; }
    navbar.classList.add('visible');

    // Branch crumb
    const hasBranch = !!window.activeBranch;
    if (hasBranch) {
      const name = window.activeBranch.name;
      const bi   = document.getElementById('gnav-branch-icon');
      const bn   = document.getElementById('gnav-branch-name');
      if (bi) bi.textContent = window.activeBranch.icon || '◈';
      if (bn) bn.textContent = name.length > 14 ? name.slice(0, 13) + '…' : name;
    }
    showEl('gnav-s1',     hasBranch, true);
    showEl('gnav-branch', hasBranch, false);

    // Exp crumb
    const hasExp = (inTheory || inExp) && !!window.currentExp;
    if (hasExp) {
      const exp = (window.EXPERIMENTS || []).find(e => e.id === window.currentExp);
      const en  = document.getElementById('gnav-exp-name');
      if (en && exp) en.textContent = exp.title.length > 15 ? exp.title.slice(0,14)+'…' : exp.title;
    }
    showEl('gnav-s2',  hasExp, true);
    showEl('gnav-exp', hasExp, false);

    // Active
    if (inExp || inTheory)  setActive('gnav-exp');
    else if (inBranch)      setActive('gnav-branch');
    else                    setActive('gnav-menu');
  }

  const obs = new MutationObserver(updateNav);
  ['home-screen','exp-list-view','exp-screen','theory-screen'].forEach(id => {
    const el = document.getElementById(id);
    if (el) obs.observe(el, { attributes: true, attributeFilter: ['style','class'] });
  });

  window._glassNavUpdate = updateNav;
  updateNav();
})();

/* ═══════════════════════════════════════════════════════════════
   INIT
═══════════════════════════════════════════════════════════════ */
(async function init() {
  // Wait for page load
  await new Promise(r => document.readyState === 'complete' ? r() : window.addEventListener('load', r));

  setTimeout(async () => {
    patchAppFunctions();

    const session = Session.get();

    // Update topbar buttons immediately from local session
    updateAuthUI();

    if (session) {
      // Silently validate with server
      try {
        const r = await api.checkPremium(session.email);
        if (r.premium) {
          // Session valid
          updateAuthUI();
          refreshBranchCards();
        } else {
          // Server says no — clear stale session
          Session.clear();
          updateAuthUI();
          refreshBranchCards();
        }
      } catch {
        // Server unreachable — trust local session
        refreshBranchCards();
      }
    } else {
      refreshBranchCards();
    }
  }, 300);
})();

/* Public debugging API */
window.EpistemePremium = {
  openLogin:    () => authOpenLogin(),
  openSignup:   () => authOpenSignup(),
  logout:       () => authLogout(),
  clearSession: () => { Session.clear(); updateAuthUI(); refreshBranchCards(); },
  isActive:     () => Session.isPremium(),
  getEmail:     () => Session.email(),
};
