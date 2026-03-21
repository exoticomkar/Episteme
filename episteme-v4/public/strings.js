//  KMP STRING MATCHING
// ══════════════════════════════════════════════════════════
function runKMP() {
  const TEXTS = ['AABAACAADAABAAABAA', 'ABCABCABCABDABC', 'ABABDABACDABABCABAB'];
  const PATTERNS = ['AABAA', 'ABCABD', 'ABABCABAB'];
  let pairIdx = 0, steps = [], stepIdx = 0;
  let text = TEXTS[0], pattern = PATTERNS[0];

  function genSteps(T, P) {
    const n = T.length, m = P.length;
    const lps = Array(m).fill(0), st = [];
    // Build LPS
    let len = 0, i = 1;
    while (i < m) {
      if (P[i] === P[len]) { lps[i++] = ++len; }
      else if (len) len = lps[len - 1];
      else lps[i++] = 0;
    }
    st.push({ phase: 'lps', lps: [...lps], i: -1, j: -1, matches: [], line:2, msg: `LPS table: [${lps}]` });
    // KMP search
    const matches = []; i = 0; let j = 0;
    while (i < n) {
      if (T[i] === P[j]) { i++; j++; st.push({ phase: 'match', lps, i, j, matches: [...matches], ti: i - 1, pi: j - 1, msg: `Match: T[${i-1}]='${T[i-1]}' == P[${j-1}]='${P[j-1]}'` }); }
      if (j === m) { matches.push(i - j); st.push({ phase: 'found', lps, i, j, matches: [...matches], start: i - j, line:9, msg: `✅ Pattern found at index ${i - j}!` }); j = lps[j - 1]; }
      else if (i < n && T[i] !== P[j]) {
        if (j) { st.push({ phase: 'mismatch', lps, i, j, matches: [...matches], ti: i, pi: j, msg: `Mismatch at T[${i}]='${T[i]}' P[${j}]='${P[j]}', skip j to ${lps[j-1]}` }); j = lps[j - 1]; }
        else { st.push({ phase: 'skip', lps, i, j, matches: [...matches], ti: i, pi: j, msg: `Mismatch, j=0, advance i` }); i++; }
      }
    }
    st.push({ phase: 'done', lps, i, j, matches, msg: `Done! Found ${matches.length} match(es) at positions: [${matches}]` });
    return st;
  }

  buildLeftPanel(`
    <div class="panel-section">
      <div class="panel-section-title">Examples</div>
      ${TEXTS.map((t,i)=>`<button class="ctrl-btn${i===0?' primary':''}" id="kmp_ex${i}" style="font-size:10px;">Ex ${i+1}: "${PATTERNS[i]}"</button>`).join('')}
    </div>
    <div class="panel-section">
      <div class="panel-section-title">Controls</div>
      ${makeSlider('kmp_spd','Speed',1,20,6,1,'',v=>{if(csAnimState)csAnimState.msPerStep=Math.max(80,800-v*34);})}
      <button class="ctrl-btn primary" id="kmp_start">▶ Start</button>
      <button class="ctrl-btn" id="kmp_pause">⏸ Pause</button>
      <button class="ctrl-btn danger" id="kmp_reset">↺ Reset</button>
    </div>
  `);
  TEXTS.forEach((t, i) => {
    const btn = document.getElementById('kmp_ex' + i);
    if (btn) btn.onclick = () => {
      document.querySelectorAll('[id^=kmp_ex]').forEach(b => b.classList.remove('primary'));
      btn.classList.add('primary');
      text = TEXTS[i]; pattern = PATTERNS[i]; steps = []; stepIdx = 0; csStopEngine();
      csHL(2); csSetStep(`Text: "${text.slice(0,20)}..." Pattern: "${pattern}"`);
    };
  });

  const CODE = `<span class="cs-cm">// KMP — O(n+m) time, O(m) space</span>
<span class="cs-kw">void</span> <span class="cs-fn">buildLPS</span>(<span class="cs-type">string</span> P, <span class="cs-type">int</span> lps[]){
  <span class="cs-type">int</span> len=<span class="cs-num">0</span>, i=<span class="cs-num">1</span>;
  <span class="cs-kw">while</span>(i&lt;P.<span class="cs-fn">size</span>()){
    <span class="cs-kw">if</span>(P[i]==P[len]) lps[i++]=++len;
    <span class="cs-kw">else if</span>(len) len=lps[len-<span class="cs-num">1</span>];
    <span class="cs-kw">else</span> lps[i++]=<span class="cs-num">0</span>;
  }
}
<span class="cs-kw">void</span> <span class="cs-fn">KMP</span>(<span class="cs-type">string</span> T, <span class="cs-type">string</span> P){
  <span class="cs-type">int</span> n=T.<span class="cs-fn">size</span>(), m=P.<span class="cs-fn">size</span>();
  <span class="cs-type">int</span> lps[m]; <span class="cs-fn">buildLPS</span>(P,lps);
  <span class="cs-type">int</span> i=<span class="cs-num">0</span>,j=<span class="cs-num">0</span>;
  <span class="cs-kw">while</span>(i&lt;n){
    <span class="cs-kw">if</span>(T[i]==P[j]){i++;j++;}
    <span class="cs-kw">if</span>(j==m){
      <span class="cs-fn">print</span>(i-j); j=lps[j-<span class="cs-num">1</span>];
    }<span class="cs-kw">else if</span>(i&lt;n&amp;&amp;T[i]!=P[j])
      j ? j=lps[j-<span class="cs-num">1</span>] : i++;
  }
}`;
  buildRightPanel(csRightPanel(CODE, 'O(n+m)', 'O(m)', 'KMP uses the LPS (Longest Proper Prefix Suffix) table to never re-examine matched characters.'));

  function render() {
    const W = canvas.width, H = canvas.height;
    clearCanvas(); drawGrid(0.02);
    const step = steps[stepIdx] || { phase: 'lps', lps: [], i: -1, j: -1, matches: [] };
    const cellW = Math.min(30, (W - 40) / Math.max(text.length, pattern.length + 2));
    const textY = H * 0.35, patY = H * 0.55, lpsY = H * 0.75;
    const ox = (W - text.length * cellW) / 2;

    // LPS Table (top)
    ctx.fillStyle = '#2a4060'; ctx.font = '10px "Space Mono",monospace'; ctx.textAlign = 'left';
    ctx.fillText('LPS:', 20, lpsY - 12);
    pattern.split('').forEach((ch, i) => {
      const x = 60 + i * cellW;
      ctx.fillStyle = '#0a1520'; ctx.fillRect(x, lpsY - 20, cellW - 2, 22);
      ctx.strokeStyle = '#1e3050'; ctx.lineWidth = 1; ctx.strokeRect(x, lpsY - 20, cellW - 2, 22);
      ctx.fillStyle = '#5a7aaa'; ctx.font = 'bold 11px "Space Mono",monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(ch, x + cellW / 2 - 1, lpsY - 9);
      if (step.lps && step.lps[i] !== undefined) {
        ctx.fillStyle = '#f59e0b'; ctx.font = '9px "Space Mono",monospace';
        ctx.fillText(step.lps[i], x + cellW / 2 - 1, lpsY + 6);
      }
      ctx.textBaseline = 'alphabetic';
    });

    // Text row
    ctx.fillStyle = '#2a4060'; ctx.font = '10px "Space Mono",monospace'; ctx.textAlign = 'left';
    ctx.fillText('Text:', 20, textY + 8);
    text.split('').forEach((ch, i) => {
      const x = 60 + i * cellW;
      let bg = '#050a10', stroke = '#0f1e30', textC = '#3d5470';
      const isMatch = step.matches && step.matches.some(m => i >= m && i < m + pattern.length);
      const isCurrent = step.ti === i;
      if (isMatch) { bg = 'rgba(46,213,115,0.2)'; stroke = '#2ed573'; textC = '#2ed573'; }
      if (isCurrent) { bg = step.phase === 'match' ? 'rgba(0,229,255,0.3)' : 'rgba(255,71,87,0.3)'; stroke = step.phase === 'match' ? '#00e5ff' : '#ff4757'; textC = stroke; }
      ctx.fillStyle = bg; ctx.fillRect(x, textY - 16, cellW - 2, 22);
      ctx.strokeStyle = stroke; ctx.lineWidth = 1; ctx.strokeRect(x, textY - 16, cellW - 2, 22);
      ctx.fillStyle = textC; ctx.font = 'bold 11px "Space Mono",monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(ch, x + cellW / 2 - 1, textY - 5); ctx.textBaseline = 'alphabetic';
    });

    // Pattern row (offset to align with current comparison)
    const patOffset = step.i !== undefined ? Math.max(0, step.i - step.j) : 0;
    ctx.fillStyle = '#2a4060'; ctx.font = '10px "Space Mono",monospace'; ctx.textAlign = 'left';
    ctx.fillText('Pat:', 20, patY + 8);
    pattern.split('').forEach((ch, i) => {
      const x = 60 + (patOffset + i) * cellW;
      if (x > W - 20) return;
      const isPi = step.pi === i;
      let bg = '#050a10', stroke = '#1e3a5a', textC = '#5a7aaa';
      if (isPi && step.phase === 'match') { bg = 'rgba(0,229,255,0.3)'; stroke = '#00e5ff'; textC = '#00e5ff'; }
      else if (isPi) { bg = 'rgba(255,71,87,0.3)'; stroke = '#ff4757'; textC = '#ff4757'; }
      ctx.fillStyle = bg; ctx.fillRect(x, patY - 16, cellW - 2, 22);
      ctx.strokeStyle = stroke; ctx.lineWidth = 1; ctx.strokeRect(x, patY - 16, cellW - 2, 22);
      ctx.fillStyle = textC; ctx.font = 'bold 11px "Space Mono",monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(ch, x + cellW / 2 - 1, patY - 5); ctx.textBaseline = 'alphabetic';
    });

    // Progress
    const prog = steps.length > 0 ? stepIdx / steps.length : 0;
    ctx.fillStyle = '#0a1520'; ctx.fillRect(0, H - 5, W, 5);
    ctx.fillStyle = '#818cf8'; ctx.fillRect(0, H - 5, W * prog, 5);
    ctx.textAlign = 'start';
    if (step.msg) { csSetStep(step.msg); csHL(step.line||0); }
  }

  document.getElementById('kmp_start').onclick = () => {
    if (steps.length === 0) { steps = genSteps(text, pattern); stepIdx = 0; }
    if (csAnimState) csAnimState.running = true;
  };
  document.getElementById('kmp_pause').onclick = () => csStopEngine();
  document.getElementById('kmp_reset').onclick = () => { steps = []; stepIdx = 0; csStopEngine(); csSetStep(`Pattern: "${pattern}" in Text. Press ▶ Start.`); };

  csStartEngine(render);
  csAnimState.msPerStep = 300;
  csAnimState.onTick = () => { if (stepIdx < steps.length - 1) { stepIdx++; return false; } return true; };
}

// ══════════════════════════════════════════════════════════
//  RABIN-KARP
// ══════════════════════════════════════════════════════════
function runRabinKarp() {
  const TEXT = 'ABCABCABCABDABC';
  const PATTERN = 'ABC';
  let steps = [], stepIdx = 0;

  function genSteps(T, P) {
    const n = T.length, m = P.length, d = 26, q = 101;
    let h = 1, pHash = 0, tHash = 0;
    for (let i = 0; i < m - 1; i++) h = (h * d) % q;
    for (let i = 0; i < m; i++) { pHash = (d * pHash + P.charCodeAt(i) - 65) % q; tHash = (d * tHash + T.charCodeAt(i) - 65) % q; }
    const st = [];
    st.push({ i: 0, pHash, tHash, matches: [], checked: [], window: 0, msg: `Pattern hash = ${pHash}. Begin sliding window.` });
    const matches = [];
    for (let i = 0; i <= n - m; i++) {
      const match = pHash === tHash;
      st.push({ i, pHash, tHash, window: i, matches: [...matches], checked: [...Array(i).fill(true)], spurious: match && T.slice(i, i + m) !== P, msg: `Window [${i}..${i+m-1}] "${T.slice(i,i+m)}" — hash=${tHash} ${match ? (T.slice(i,i+m)===P?'✅ MATCH!':'⚠ Spurious hit, verify chars') : '≠ pattern hash, skip'}` });
      if (match && T.slice(i, i + m) === P) { matches.push(i); st.push({ i, pHash, tHash, window: i, matches: [...matches], found: i, msg: `✅ Pattern found at index ${i}!` }); }
      if (i < n - m) { tHash = (d * (tHash - (T.charCodeAt(i) - 65) * h) + (T.charCodeAt(i + m) - 65)) % q; if (tHash < 0) tHash += q; }
    }
    st.push({ i: n - m, pHash, tHash, matches, msg: `Done! Found ${matches.length} match(es) at: [${matches.join(', ')}]` });
    return st;
  }

  steps = genSteps(TEXT, PATTERN);

  buildLeftPanel(`
    <div class="panel-section">
      <div class="panel-section-title">Inputs</div>
      <div style="font-family:'Space Mono',monospace;font-size:11px;color:var(--text2);line-height:2.0;background:var(--bg3);padding:8px;border-radius:6px;">
        Text:<br><span style="color:var(--accent);">${TEXT}</span><br>
        Pattern:<br><span style="color:var(--accent3);">${PATTERN}</span>
      </div>
    </div>
    <div class="panel-section">
      <div class="panel-section-title">Controls</div>
      ${makeSlider('rk_spd','Speed',1,20,6,1,'',v=>{if(csAnimState)csAnimState.msPerStep=Math.max(100,900-v*38);})}
      <button class="ctrl-btn primary" id="rk_start">▶ Start</button>
      <button class="ctrl-btn" id="rk_pause">⏸ Pause</button>
      <button class="ctrl-btn danger" id="rk_reset">↺ Reset</button>
    </div>
  `);
  const CODE = `<span class="cs-cm">// Rabin-Karp — O(n+m) avg</span>
<span class="cs-kw">void</span> <span class="cs-fn">rabinKarp</span>(<span class="cs-type">string</span> T, <span class="cs-type">string</span> P){
  <span class="cs-type">int</span> n=T.<span class="cs-fn">size</span>(), m=P.<span class="cs-fn">size</span>();
  <span class="cs-type">int</span> d=<span class="cs-num">26</span>, q=<span class="cs-num">101</span>; <span class="cs-cm">// prime</span>
  <span class="cs-type">int</span> h=<span class="cs-num">1</span>, pH=<span class="cs-num">0</span>, tH=<span class="cs-num">0</span>;
  <span class="cs-kw">for</span>(<span class="cs-type">int</span> i=<span class="cs-num">0</span>;i&lt;m-<span class="cs-num">1</span>;i++) h=(h*d)%q;
  <span class="cs-kw">for</span>(<span class="cs-type">int</span> i=<span class="cs-num">0</span>;i&lt;m;i++){
    pH=(d*pH+P[i])%q;
    tH=(d*tH+T[i])%q;
  }
  <span class="cs-kw">for</span>(<span class="cs-type">int</span> i=<span class="cs-num">0</span>;i&lt;=n-m;i++){
    <span class="cs-kw">if</span>(pH==tH) <span class="cs-cm">// hash match</span>
      <span class="cs-kw">if</span>(T.<span class="cs-fn">substr</span>(i,m)==P) <span class="cs-fn">report</span>(i);
    <span class="cs-cm">// Roll the hash window</span>
    tH=(d*(tH-T[i]*h)+T[i+m])%q;
  }
}`;
  buildRightPanel(csRightPanel(CODE, 'O(n+m) avg', 'O(m)', 'Rolling hash: removes leftmost char, adds rightmost. O(1) per window shift.'));

  function render() {
    const W = canvas.width, H = canvas.height;
    clearCanvas(); drawGrid(0.02);
    const step = steps[stepIdx] || { i: 0, window: 0, matches: [], pHash: 0, tHash: 0 };
    const m = PATTERN.length, n = TEXT.length;
    const cellW = Math.min(36, (W - 40) / n);
    const ox = (W - n * cellW) / 2, textY = H * 0.35, patY = H * 0.55;

    // Text row
    TEXT.split('').forEach((ch, i) => {
      const inWindow = i >= step.window && i < step.window + m;
      const isMatch = step.matches && step.matches.some(mi => i >= mi && i < mi + m);
      const isCurrent = step.found === step.window && inWindow;
      let bg = '#050a10', stroke = '#0f1e30', textC = '#3d5470';
      if (isMatch) { bg = 'rgba(46,213,115,0.2)'; stroke = '#2ed573'; textC = '#2ed573'; }
      if (inWindow) { bg = isCurrent ? 'rgba(46,213,115,0.3)' : (step.spurious ? 'rgba(255,107,0,0.2)' : 'rgba(0,229,255,0.15)'); stroke = isCurrent ? '#2ed573' : '#00e5ff'; textC = stroke; }
      ctx.fillStyle = bg; ctx.fillRect(ox + i * cellW, textY - 18, cellW - 1, 24);
      ctx.strokeStyle = stroke; ctx.lineWidth = 1; ctx.strokeRect(ox + i * cellW, textY - 18, cellW - 1, 24);
      ctx.fillStyle = textC; ctx.font = `bold ${Math.min(12, cellW * 0.4)}px "Space Mono",monospace`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(ch, ox + i * cellW + cellW / 2, textY - 6);
      ctx.textBaseline = 'alphabetic';
    });

    // Pattern row (aligned to window)
    PATTERN.split('').forEach((ch, i) => {
      const x = ox + (step.window + i) * cellW;
      if (x > W - 10) return;
      ctx.fillStyle = 'rgba(245,158,11,0.2)'; ctx.fillRect(x, patY - 18, cellW - 1, 24);
      ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 1; ctx.strokeRect(x, patY - 18, cellW - 1, 24);
      ctx.fillStyle = '#f59e0b'; ctx.font = `bold ${Math.min(12, cellW * 0.4)}px "Space Mono",monospace`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(ch, x + cellW / 2, patY - 6); ctx.textBaseline = 'alphabetic';
    });

    // Hash display
    ctx.fillStyle = '#2a4060'; ctx.font = '11px "Space Mono",monospace'; ctx.textAlign = 'center';
    ctx.fillText(`Pattern hash: ${step.pHash}    Window hash: ${step.tHash}    ${step.pHash === step.tHash ? '⟵ Match!' : ''}`, W / 2, patY + 20);

    const prog = steps.length > 0 ? stepIdx / steps.length : 0;
    ctx.fillStyle = '#0a1520'; ctx.fillRect(0, H - 5, W, 5);
    ctx.fillStyle = '#c084fc'; ctx.fillRect(0, H - 5, W * prog, 5);
    ctx.textAlign = 'start';
    if (step.msg) { csSetStep(step.msg); csHL(step.line||0); }
  }

  document.getElementById('rk_start').onclick = () => { if (csAnimState) csAnimState.running = true; };
  document.getElementById('rk_pause').onclick = () => csStopEngine();
  document.getElementById('rk_reset').onclick = () => { steps = genSteps(TEXT, PATTERN); stepIdx = 0; csStopEngine(); csSetStep(`Rabin-Karp: find "${PATTERN}" in "${TEXT}". Press ▶ Start.`); };

  csStartEngine(render);
  csAnimState.msPerStep = 400;
  csAnimState.onTick = () => { if (stepIdx < steps.length - 1) { stepIdx++; return false; } return true; };
}

// ══════════════════════════════════════════════════════════
//  TRIE DATA STRUCTURE
// ══════════════════════════════════════════════════════════
function runTrie() {
  const WORDS = ['APPLE', 'APP', 'APE', 'BAN', 'BAND', 'BAND', 'CAT', 'CAR', 'CARD'];
  let trieRoot = { ch: '', children: {}, isEnd: false }, insertedWords = [], highlightPath = [], highlightWord = '';

  function insertTrie(root, word) {
    let node = root;
    for (const ch of word) { if (!node.children[ch]) node.children[ch] = { ch, children: {}, isEnd: false }; node = node.children[ch]; }
    node.isEnd = true;
  }

  function searchTrie(root, word) {
    let node = root, path = [root];
    for (const ch of word) { if (!node.children[ch]) return null; node = node.children[ch]; path.push(node); }
    return path;
  }

  buildLeftPanel(`
    <div class="panel-section">
      <div class="panel-section-title">Words</div>
      <div style="display:flex;flex-wrap:wrap;gap:4px;">
        ${WORDS.filter((w,i,a)=>a.indexOf(w)===i).map(w=>`<button class="ctrl-btn" style="padding:4px 8px;font-size:10px;" id="trie_w_${w}">${w}</button>`).join('')}
      </div>
    </div>
    <div class="panel-section">
      <div class="panel-section-title">Search</div>
      <input id="trie_search" type="text" placeholder="Search word..." maxlength="8"
        style="width:100%;background:var(--bg3);border:1px solid var(--border);color:var(--text);padding:6px;border-radius:6px;font-family:'Space Mono',monospace;font-size:12px;margin-bottom:6px;">
      <button class="ctrl-btn" id="trie_dosearch">🔍 Search</button>
    </div>
    <div class="panel-section">
      <div class="panel-section-title">Actions</div>
      <button class="ctrl-btn danger" id="trie_reset">↺ Clear Trie</button>
    </div>
  `);
  const CODE = `<span class="cs-cm">// Trie — O(m) insert & search</span>
<span class="cs-kw">struct</span> <span class="cs-type">TrieNode</span> {
  <span class="cs-type">TrieNode*</span> children[<span class="cs-num">26</span>]={};
  <span class="cs-type">bool</span> isEnd=<span class="cs-kw">false</span>;
};
<span class="cs-kw">void</span> <span class="cs-fn">insert</span>(<span class="cs-type">TrieNode*</span> root, <span class="cs-type">string</span> word){
  <span class="cs-type">TrieNode*</span> n=root;
  <span class="cs-kw">for</span>(<span class="cs-type">char</span> c: word){
    <span class="cs-type">int</span> i=c-<span class="cs-str">'A'</span>;
    <span class="cs-kw">if</span>(!n-&gt;children[i])
      n-&gt;children[i]=<span class="cs-kw">new</span> <span class="cs-type">TrieNode</span>();
    n=n-&gt;children[i];
  }
  n-&gt;isEnd=<span class="cs-kw">true</span>;
}
<span class="cs-kw">bool</span> <span class="cs-fn">search</span>(<span class="cs-type">TrieNode*</span> root, <span class="cs-type">string</span> word){
  <span class="cs-type">TrieNode*</span> n=root;
  <span class="cs-kw">for</span>(<span class="cs-type">char</span> c: word){
    <span class="cs-kw">if</span>(!n-&gt;children[c-<span class="cs-str">'A'</span>]) <span class="cs-kw">return false</span>;
    n=n-&gt;children[c-<span class="cs-str">'A'</span>];
  }
  <span class="cs-kw">return</span> n-&gt;isEnd;
}`;
  buildRightPanel(csRightPanel(CODE, 'O(m) per op', 'O(ALPHABET×n)', 'Trie stores strings by shared prefixes. m = length of word. Powers autocomplete.'));

  // Insert words button handlers
  WORDS.filter((w,i,a)=>a.indexOf(w)===i).forEach(word => {
    const btn = document.getElementById('trie_w_' + word);
    if (btn) btn.onclick = () => {
      insertTrie(trieRoot, word);
      if (!insertedWords.includes(word)) insertedWords.push(word);
      btn.classList.add('primary');
      highlightPath = searchTrie(trieRoot, word) || [];
      highlightWord = word;
      csSetStep(`Inserted "${word}" into trie. Words: [${insertedWords.join(', ')}]`); csHL(6); csHL(6);
      setTimeout(() => { highlightPath = []; highlightWord = ''; }, 1500);
    };
  });
  document.getElementById('trie_dosearch').onclick = () => {
    const w = document.getElementById('trie_search').value.toUpperCase();
    const path = searchTrie(trieRoot, w);
    if (path) { highlightPath = path; highlightWord = w; csSetStep(`"${w}" found in trie! ✅`); csHL(10); csHL(10); setTimeout(() => { highlightPath = []; }, 2000); }
    else { csHL(10); csSetStep(`"${w}" NOT found in trie ❌`); }
  };
  document.getElementById('trie_reset').onclick = () => {
    trieRoot = { ch: '', children: {}, isEnd: false }; insertedWords = []; highlightPath = []; highlightWord = '';
    WORDS.filter((w,i,a)=>a.indexOf(w)===i).forEach(w => { const b = document.getElementById('trie_w_' + w); if(b) b.classList.remove('primary'); });
    csSetStep('Trie cleared. Click words to insert them.');
  };

  // Draw trie
  function drawTrieNode(node, x, y, level, xBound, parentX, parentY) {
    const R = 16;
    if (parentX !== null) {
      const isHL = highlightPath.includes(node);
      ctx.strokeStyle = isHL ? '#6ee7b7' : '#1e3050'; ctx.lineWidth = isHL ? 2 : 1;
      ctx.beginPath(); ctx.moveTo(parentX, parentY); ctx.lineTo(x, y); ctx.stroke();
    }
    const isHL = highlightPath.includes(node);
    ctx.fillStyle = node.isEnd ? 'rgba(110,231,183,0.3)' : (isHL ? 'rgba(110,231,183,0.2)' : '#0a1825');
    ctx.strokeStyle = node.isEnd ? '#6ee7b7' : (isHL ? '#6ee7b7' : '#1e3a5a');
    ctx.lineWidth = isHL ? 2.5 : 1.5;
    ctx.shadowColor = isHL ? '#6ee7b7' : 'transparent'; ctx.shadowBlur = isHL ? 12 : 0;
    ctx.beginPath(); ctx.arc(x, y, R, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x, y, R, 0, Math.PI * 2); ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.fillStyle = isHL ? '#6ee7b7' : (node.ch ? '#5a7aaa' : '#2a4060');
    ctx.font = `bold ${node.isEnd ? 11 : 10}px "Space Mono",monospace`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(node.ch || '∅', x, y);
    if (node.isEnd) { ctx.font = '8px serif'; ctx.fillText('●', x + R - 4, y - R + 4); }
    ctx.textBaseline = 'alphabetic';
    const children = Object.entries(node.children);
    if (!children.length) return;
    const spread = xBound / Math.max(children.length, 1);
    const startX = x - (xBound - spread) / 2;
    children.forEach(([ch, child], i) => { drawTrieNode(child, startX + i * spread, y + 60, level + 1, spread * 0.9, x, y); });
  }

  csStartEngine(() => {
    const W = canvas.width, H = canvas.height;
    clearCanvas(); drawGrid(0.02);
    drawTrieNode(trieRoot, W / 2, 40, 0, W - 20, null, null);
    if (insertedWords.length === 0) {
      ctx.fillStyle = '#2a4060'; ctx.font = '13px "Space Mono",monospace'; ctx.textAlign = 'center';
      ctx.fillText('Click word buttons to insert into the trie!', W / 2, H / 2); ctx.textAlign = 'start';
    }
  });
  csSetStep('Click word buttons to insert them into the trie.');
}


// ══════════════════════════════════════════════════════
