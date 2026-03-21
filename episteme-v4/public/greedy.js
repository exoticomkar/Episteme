//  ACTIVITY SELECTION (GREEDY)
// ══════════════════════════════════════════════════════════
function runActivitySelection() {
  let steps = [], stepIdx = 0;
  const ACTIVITIES = [
    { id: 1, start: 1, end: 3 }, { id: 2, start: 0, end: 6 }, { id: 3, start: 5, end: 7 },
    { id: 4, start: 3, end: 9 }, { id: 5, start: 5, end: 9 }, { id: 6, start: 6, end: 10 },
    { id: 7, start: 8, end: 11 }, { id: 8, start: 8, end: 12 }, { id: 9, start: 2, end: 13 },
    { id: 10, start: 11, end: 14 },
  ];

  function genSteps(acts) {
    const sorted = [...acts].sort((a, b) => a.end - b.end);
    const selected = [], rejected = [], st = [];
    st.push({ sorted, selected: [], rejected: [], current: null, msg: `Sorted by finish time: [${sorted.map(a => `A${a.id}(${a.start}-${a.end})`).join(', ')}]` });
    let lastEnd = -Infinity;
    sorted.forEach(a => {
      st.push({ sorted, selected: [...selected], rejected: [...rejected], current: a, msg: `Check A${a.id}: start=${a.start} ≥ lastEnd=${lastEnd}? ${a.start >= lastEnd ? '✅ Select' : '❌ Reject'}` });
      if (a.start >= lastEnd) { selected.push(a); lastEnd = a.end; st.push({ sorted, selected: [...selected], rejected: [...rejected], current: a, accepted: true, msg: `Selected A${a.id}! lastEnd=${lastEnd}` }); }
      else { rejected.push(a); st.push({ sorted, selected: [...selected], rejected: [...rejected], current: a, accepted: false, msg: `Rejected A${a.id} (overlaps with selected)` }); }
    });
    st.push({ sorted, selected, rejected, current: null, msg: `✅ Max activities = ${selected.length}: [${selected.map(a => `A${a.id}`).join(', ')}]` });
    return st;
  }

  steps = genSteps(ACTIVITIES);

  buildLeftPanel(`
    <div class="panel-section">
      <div class="panel-section-title">Activities</div>
      <div style="font-family:'Space Mono',monospace;font-size:9px;color:var(--text2);line-height:1.8;background:var(--bg3);padding:8px;border-radius:6px;max-height:140px;overflow-y:auto;">
        ${ACTIVITIES.map(a => `A${a.id}: [${a.start}, ${a.end}]`).join('<br>')}
      </div>
    </div>
    <div class="panel-section">
      <div class="panel-section-title">Controls</div>
      ${makeSlider('as_spd','Speed',1,20,6,1,'',v=>{if(csAnimState)csAnimState.msPerStep=Math.max(100,1000-v*44);})}
      <button class="ctrl-btn primary" id="as_start">▶ Start</button>
      <button class="ctrl-btn" id="as_pause">⏸ Pause</button>
      <button class="ctrl-btn danger" id="as_reset">↺ Reset</button>
    </div>
  `);
  const CODE = `<span class="cs-cm">// Activity Selection — O(n log n)</span>
<span class="cs-kw">int</span> <span class="cs-fn">activitySelection</span>(vector&lt;Activity&gt;&amp; acts){
  <span class="cs-cm">// Sort by finish time</span>
  <span class="cs-fn">sort</span>(acts.<span class="cs-fn">begin</span>(), acts.<span class="cs-fn">end</span>(),
    [](<span class="cs-kw">auto</span>&amp; a, <span class="cs-kw">auto</span>&amp; b){
      <span class="cs-kw">return</span> a.end &lt; b.end;
    });
  <span class="cs-type">int</span> count=<span class="cs-num">1</span>, lastEnd=acts[<span class="cs-num">0</span>].end;
  <span class="cs-kw">for</span>(<span class="cs-type">int</span> i=<span class="cs-num">1</span>; i&lt;acts.<span class="cs-fn">size</span>(); i++){
    <span class="cs-cm">// Greedy: pick if starts after last ends</span>
    <span class="cs-kw">if</span>(acts[i].start &gt;= lastEnd){
      count++;
      lastEnd = acts[i].end;
    }
  }
  <span class="cs-kw">return</span> count;
}`;
  buildRightPanel(csRightPanel(CODE, 'O(n log n)', 'O(1)', 'Greedy choice: always pick the activity that ends earliest — provably optimal!'));

  function render() {
    const W = canvas.width, H = canvas.height;
    clearCanvas(); drawGrid(0.02);
    const step = steps[stepIdx] || steps[0];
    if (!step) return;
    const { sorted, selected, rejected, current } = step;
    const maxEnd = Math.max(...ACTIVITIES.map(a => a.end)) + 1;
    const timeScale = (W - 80) / maxEnd;
    const rowH = Math.min(26, (H - 90) / sorted.length);
    const ox = 50, oy = 30;

    // Time axis
    ctx.fillStyle = '#1e3050'; ctx.fillRect(ox, oy + sorted.length * rowH + 4, W - 80, 2);
    for (let t = 0; t <= maxEnd; t++) {
      ctx.fillStyle = '#2a4060'; ctx.font = '9px "Space Mono",monospace'; ctx.textAlign = 'center';
      ctx.fillText(t, ox + t * timeScale, oy + sorted.length * rowH + 18);
    }

    sorted.forEach((a, i) => {
      const isSelected = selected.includes(a);
      const isRejected = rejected.includes(a);
      const isCurrent = a === current;
      let col = '#1e3a5a';
      if (isSelected) col = '#2ed573';
      else if (isRejected) col = '#ff4757';
      else if (isCurrent) col = '#f59e0b';
      const bx = ox + a.start * timeScale, bw = (a.end - a.start) * timeScale;
      const by = oy + i * rowH;
      ctx.fillStyle = col + '55'; ctx.fillRect(bx, by + 2, bw, rowH - 4);
      ctx.strokeStyle = col; ctx.lineWidth = isCurrent ? 2.5 : 1.5; ctx.strokeRect(bx, by + 2, bw, rowH - 4);
      ctx.fillStyle = col; ctx.font = `bold ${Math.min(10, rowH * 0.4)}px "Space Mono",monospace`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(`A${a.id}`, bx + bw / 2, by + rowH / 2); ctx.textBaseline = 'alphabetic';
    });

    // Selected count
    ctx.fillStyle = '#2ed573'; ctx.font = 'bold 12px "Space Mono",monospace'; ctx.textAlign = 'center';
    ctx.fillText(`Selected: ${selected.length} activities`, W / 2, H - 22);
    const prog = steps.length > 0 ? stepIdx / steps.length : 0;
    ctx.fillStyle = '#0a1520'; ctx.fillRect(0, H - 6, W, 6);
    ctx.fillStyle = '#a3e635'; ctx.fillRect(0, H - 6, W * prog, 6);
    ctx.textAlign = 'start';
    if (step.msg) { csSetStep(step.msg); csHL(step.line||0); }
  }

  document.getElementById('as_start').onclick = () => { if (csAnimState) csAnimState.running = true; };
  document.getElementById('as_pause').onclick = () => csStopEngine();
  document.getElementById('as_reset').onclick = () => { steps = genSteps(ACTIVITIES); stepIdx = 0; csStopEngine(); csSetStep('Press ▶ Start to run greedy activity selection.'); };

  csStartEngine(render);
  csAnimState.msPerStep = 600;
  csAnimState.onTick = () => { if (stepIdx < steps.length - 1) { stepIdx++; return false; } return true; };
}

// ══════════════════════════════════════════════════════════
//  HUFFMAN CODING
// ══════════════════════════════════════════════════════════
function runHuffmanCoding() {
  const TEXT = 'ABRACADABRA';
  let steps = [], stepIdx = 0;

  class HNode { constructor(ch, freq, l, r) { this.ch = ch; this.freq = freq; this.left = l || null; this.right = r || null; } }

  function buildHuffman(text) {
    const freq = {};
    for (const c of text) freq[c] = (freq[c] || 0) + 1;
    let pq = Object.entries(freq).map(([ch, f]) => new HNode(ch, f));
    const st = [], snapshots = [];
    function snapshot(msg) { st.push({ nodes: pq.map(n => ({ ...n })), msg }); }
    snapshot(`Character frequencies: ${Object.entries(freq).map(([c, f]) => `${c}:${f}`).join(', ')}`);
    pq.sort((a, b) => a.freq - b.freq);
    while (pq.length > 1) {
      pq.sort((a, b) => a.freq - b.freq);
      const l = pq.shift(), r = pq.shift();
      const parent = new HNode(null, l.freq + r.freq, l, r);
      pq.push(parent);
      st.push({ tree: parent, pq: [...pq], left: l, right: r, msg: `Merge ${l.ch || '?'}(${l.freq}) + ${r.ch || '?'}(${r.freq}) = internal(${parent.freq})` });
    }
    const root = pq[0];
    const codes = {};
    function buildCodes(node, code) { if (!node) return; if (node.ch) codes[node.ch] = code; buildCodes(node.left, code + '0'); buildCodes(node.right, code + '1'); }
    buildCodes(root, '');
    st.push({ tree: root, pq: [], codes, msg: `✅ Huffman codes: ${Object.entries(codes).map(([c, code]) => `${c}:${code}`).join(', ')}` });
    return { steps: st, root, codes };
  }

  let { steps: st, root: hroot, codes } = buildHuffman(TEXT);
  steps = st;

  buildLeftPanel(`
    <div class="panel-section">
      <div class="panel-section-title">Input Text</div>
      <div style="font-family:'Space Mono',monospace;font-size:18px;color:var(--accent);background:var(--bg3);padding:12px;border-radius:8px;text-align:center;letter-spacing:4px;">${TEXT}</div>
    </div>
    <div class="panel-section">
      <div class="panel-section-title">Controls</div>
      ${makeSlider('huf_spd','Speed',1,20,6,1,'',v=>{if(csAnimState)csAnimState.msPerStep=Math.max(150,1500-v*65);})}
      <button class="ctrl-btn primary" id="huf_start">▶ Animate</button>
      <button class="ctrl-btn" id="huf_pause">⏸ Pause</button>
      <button class="ctrl-btn danger" id="huf_reset">↺ Reset</button>
    </div>
  `);
  const CODE = `<span class="cs-cm">// Huffman Coding — O(n log n)</span>
<span class="cs-kw">struct</span> <span class="cs-type">HNode</span> {
  <span class="cs-type">char</span> ch; <span class="cs-type">int</span> freq;
  <span class="cs-type">HNode</span> *left, *right;
};
<span class="cs-type">HNode*</span> <span class="cs-fn">buildTree</span>(map&lt;<span class="cs-type">char</span>,<span class="cs-type">int</span>&gt;&amp; freq){
  priority_queue&lt;<span class="cs-type">HNode*</span>,...,<span class="cs-fn">greater</span>&gt; pq;
  <span class="cs-kw">for</span>(<span class="cs-kw">auto</span>&amp;[c,f]:freq)
    pq.<span class="cs-fn">push</span>(<span class="cs-kw">new</span> <span class="cs-type">HNode</span>(c,f,<span class="cs-kw">null</span>,<span class="cs-kw">null</span>));
  <span class="cs-kw">while</span>(pq.<span class="cs-fn">size</span>()&gt;<span class="cs-num">1</span>){
    <span class="cs-kw">auto</span> l=pq.<span class="cs-fn">top</span>(); pq.<span class="cs-fn">pop</span>();
    <span class="cs-kw">auto</span> r=pq.<span class="cs-fn">top</span>(); pq.<span class="cs-fn">pop</span>();
    pq.<span class="cs-fn">push</span>(<span class="cs-kw">new</span> <span class="cs-type">HNode</span>(<span class="cs-str">'#'</span>,l-&gt;freq+r-&gt;freq,l,r));
  }
  <span class="cs-kw">return</span> pq.<span class="cs-fn">top</span>();
}`;
  buildRightPanel(csRightPanel(CODE, 'O(n log n)', 'O(n)', 'Huffman assigns shorter codes to frequent characters. Used in ZIP, JPEG, MP3.'));

  function render() {
    const W = canvas.width, H = canvas.height;
    clearCanvas(); drawGrid(0.02);
    const step = steps[stepIdx] || steps[0];
    if (!step) return;

    if (step.tree) {
      // Draw the current tree state
      const pos = calcTreeLayout(step.tree);
      drawTree(step.tree, pos, W, H * 0.7, null, {
        nodeColor: (n) => {
          if (n === step.left) return { fill: 'rgba(0,229,255,0.3)', stroke: '#00e5ff', text: '#00e5ff' };
          if (n === step.right) return { fill: 'rgba(245,158,11,0.3)', stroke: '#f59e0b', text: '#f59e0b' };
          return null;
        },
        label: (n) => n.ch ? `${n.ch}(${n.freq})` : `${n.freq}`
      });
    }

    // Draw codes table if available
    if (step.codes) {
      const entries = Object.entries(step.codes);
      const colW = 80, startX = (W - entries.length * colW) / 2;
      const by = H * 0.75;
      ctx.fillStyle = '#2a4060'; ctx.font = '11px "Space Mono",monospace'; ctx.textAlign = 'center';
      ctx.fillText('Huffman Codes:', W / 2, by - 12);
      entries.forEach(([ch, code], i) => {
        const x = startX + i * colW;
        ctx.fillStyle = '#0a1825'; ctx.fillRect(x, by, colW - 4, 44);
        ctx.strokeStyle = '#fb7185'; ctx.lineWidth = 1; ctx.strokeRect(x, by, colW - 4, 44);
        ctx.fillStyle = '#fb7185'; ctx.font = 'bold 14px "Space Mono",monospace';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(ch, x + colW / 2 - 2, by + 13);
        ctx.fillStyle = '#f59e0b'; ctx.font = '11px "Space Mono",monospace';
        ctx.fillText(code, x + colW / 2 - 2, by + 31);
        ctx.textBaseline = 'alphabetic';
      });
    }

    const prog = steps.length > 0 ? stepIdx / steps.length : 0;
    ctx.fillStyle = '#0a1520'; ctx.fillRect(0, H - 5, W, 5);
    ctx.fillStyle = '#fb7185'; ctx.fillRect(0, H - 5, W * prog, 5);
    ctx.textAlign = 'start';
    if (step.msg) { csSetStep(step.msg); csHL(step.line||0); }
  }

  document.getElementById('huf_start').onclick = () => { if (csAnimState) csAnimState.running = true; };
  document.getElementById('huf_pause').onclick = () => csStopEngine();
  document.getElementById('huf_reset').onclick = () => { const r = buildHuffman(TEXT); steps = r.steps; hroot = r.root; codes = r.codes; stepIdx = 0; csStopEngine(); csSetStep('Press ▶ Animate to build the Huffman tree.'); };

  csStartEngine(render);
  csAnimState.msPerStep = 900;
  csAnimState.onTick = () => { if (stepIdx < steps.length - 1) { stepIdx++; return false; } return true; };
}

// ══════════════════════════════════════════════════════════
