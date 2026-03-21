// ══════════════════════════════════════════════════════════
//  TOPOLOGICAL SORT (Kahn's algorithm)
// ══════════════════════════════════════════════════════════
function runTopoSort() {
  let steps = [], stepIdx = 0;

  // Fixed DAG for visualization
  const NODES = ['A','B','C','D','E','F','G'];
  const EDGES = [['A','C'],['A','D'],['B','D'],['B','E'],['C','F'],['D','F'],['D','G'],['E','G']];

  function genSteps() {
    const n = NODES.length;
    const inDeg = Object.fromEntries(NODES.map(nd => [nd, 0]));
    const adj = Object.fromEntries(NODES.map(nd => [nd, []]));
    EDGES.forEach(([u, v]) => { adj[u].push(v); inDeg[v]++; });
    const queue = NODES.filter(nd => inDeg[nd] === 0);
    const result = [], visited = new Set(), st = [];
    st.push({ queue: [...queue], result: [], visited: new Set(), line:6, msg: `Init: nodes with in-degree 0: [${queue.join(',')}]` });
    while (queue.length) {
      const u = queue.shift(); result.push(u); visited.add(u);
      st.push({ queue: [...queue], result: [...result], visited: new Set(visited), current: u, line:9, msg: `Process ${u} → result: [${result.join('→')}]` });
      adj[u].forEach(v => {
        inDeg[v]--;
        if (inDeg[v] === 0) { queue.push(v); st.push({ queue: [...queue], result: [...result], visited: new Set(visited), current: u, processing: v, line:11, msg: `${v}'s in-degree = 0, add to queue` }); }
      });
    }
    st.push({ queue: [], result, visited: new Set(visited), line:13, msg: `✅ Topological order: ${result.join(' → ')}` });
    return st;
  }

  buildLeftPanel(`
    <div class="panel-section">
      <div class="panel-section-title">DAG Structure</div>
      <div style="font-family:'Space Mono',monospace;font-size:10px;color:var(--text2);line-height:1.8;background:var(--bg3);padding:8px;border-radius:6px;">
        ${EDGES.map(([u,v])=>`${u} → ${v}`).join('<br>')}
      </div>
    </div>
    <div class="panel-section">
      <div class="panel-section-title">Controls</div>
      ${makeSlider('ts_spd','Speed',1,20,6,1,'',v=>{if(csAnimState)csAnimState.msPerStep=Math.max(100,1000-v*44);})}
      <button class="ctrl-btn primary" id="ts_start">▶ Start</button>
      <button class="ctrl-btn" id="ts_pause">⏸ Pause</button>
      <button class="ctrl-btn danger" id="ts_reset">↺ Reset</button>
    </div>
    <div class="panel-section">
      <div class="panel-section-title">Legend</div>
      <div style="font-family:'Space Mono',monospace;font-size:11px;color:var(--text2);line-height:2.2;">
        <span style="color:#00e5ff">●</span> Processing<br>
        <span style="color:#f59e0b">●</span> In queue<br>
        <span style="color:#2ed573">●</span> Done
      </div>
    </div>
  `);
  const CODE = `<span class="cs-cm">// Kahn's Topological Sort O(V+E)</span>
vector&lt;<span class="cs-type">int</span>&gt; <span class="cs-fn">topoSort</span>(vector&lt;vector&lt;<span class="cs-type">int</span>&gt;&gt;&amp; adj, <span class="cs-type">int</span> V){
  vector&lt;<span class="cs-type">int</span>&gt; inDeg(V, <span class="cs-num">0</span>), result;
  <span class="cs-kw">for</span>(<span class="cs-kw">auto</span>&amp; e: adj) <span class="cs-kw">for</span>(<span class="cs-type">int</span> v: e) inDeg[v]++;
  queue&lt;<span class="cs-type">int</span>&gt; q;
  <span class="cs-kw">for</span>(<span class="cs-type">int</span> i=<span class="cs-num">0</span>; i&lt;V; i++) <span class="cs-kw">if</span>(!inDeg[i]) q.<span class="cs-fn">push</span>(i);
  <span class="cs-kw">while</span>(!q.<span class="cs-fn">empty</span>()){
    <span class="cs-type">int</span> u=q.<span class="cs-fn">front</span>(); q.<span class="cs-fn">pop</span>();
    result.<span class="cs-fn">push_back</span>(u);
    <span class="cs-kw">for</span>(<span class="cs-type">int</span> v: adj[u])
      <span class="cs-kw">if</span>(--inDeg[v]==<span class="cs-num">0</span>) q.<span class="cs-fn">push</span>(v);
  }
  <span class="cs-kw">return</span> result;
}`;
  buildRightPanel(csRightPanel(CODE, 'O(V+E)', 'O(V)', "Kahn's BFS-based topological sort detects cycles when result.size() < V."));

  function render() {
    const W = canvas.width, H = canvas.height;
    clearCanvas(); drawGrid(0.02);
    const step = steps[stepIdx] || { queue: [], result: [], visited: new Set() };
    const n = NODES.length;
    // Layered layout
    const layers = [['A','B'],['C','D','E'],['F','G']];
    const nodePos = {};
    layers.forEach((layer, li) => {
      layer.forEach((nd, ni) => {
        nodePos[nd] = { x: W * (li + 1) / (layers.length + 1), y: H * (ni + 1) / (layer.length + 1) };
      });
    });
    const R = 22;
    // Edges
    EDGES.forEach(([u, v]) => {
      const p1 = nodePos[u], p2 = nodePos[v];
      ctx.strokeStyle = '#1e3050'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();
      // Arrow
      const ang = Math.atan2(p2.y - p1.y, p2.x - p1.x);
      const ax = p2.x - Math.cos(ang) * (R + 4), ay = p2.y - Math.sin(ang) * (R + 4);
      ctx.fillStyle = '#1e3050'; ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.lineTo(ax - 8 * Math.cos(ang - 0.4), ay - 8 * Math.sin(ang - 0.4));
      ctx.lineTo(ax - 8 * Math.cos(ang + 0.4), ay - 8 * Math.sin(ang + 0.4));
      ctx.closePath(); ctx.fill();
    });
    // Nodes
    NODES.forEach(nd => {
      const { x, y } = nodePos[nd];
      let fill = '#0a1825', stroke = '#1e3050', textC = '#3d5470';
      if (step.visited && step.visited.has(nd)) { fill = 'rgba(46,213,115,0.25)'; stroke = '#2ed573'; textC = '#2ed573'; }
      if (step.queue && step.queue.includes(nd)) { fill = 'rgba(245,158,11,0.25)'; stroke = '#f59e0b'; textC = '#f59e0b'; }
      if (step.current === nd) { fill = 'rgba(0,229,255,0.35)'; stroke = '#00e5ff'; textC = '#00e5ff'; ctx.shadowColor = '#00e5ff'; ctx.shadowBlur = 20; }
      ctx.fillStyle = fill; ctx.beginPath(); ctx.arc(x, y, R, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = stroke; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, R, 0, Math.PI * 2); ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.fillStyle = textC; ctx.font = 'bold 13px "Space Mono",monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(nd, x, y); ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'start';
    });
    // Result row
    if (step.result && step.result.length) {
      ctx.fillStyle = '#1a3050'; ctx.fillRect(W / 2 - 180, H - 36, 360, 26);
      ctx.strokeStyle = '#2ed573'; ctx.lineWidth = 1; ctx.strokeRect(W / 2 - 180, H - 36, 360, 26);
      ctx.fillStyle = '#2ed573'; ctx.font = '11px "Space Mono",monospace'; ctx.textAlign = 'center';
      ctx.fillText('Order: ' + step.result.join(' → '), W / 2, H - 17); ctx.textAlign = 'start';
    }
    if (step.msg) { csSetStep(step.msg); csHL(step.line||0); }
  }

  document.getElementById('ts_start').onclick = () => {
    if (steps.length === 0) { steps = genSteps(); stepIdx = 0; }
    if (csAnimState) csAnimState.running = true;
  };
  document.getElementById('ts_pause').onclick = () => csStopEngine();
  document.getElementById('ts_reset').onclick = () => { steps = []; stepIdx = 0; csStopEngine(); csSetStep("Press ▶ Start Kahn's topological sort."); };

  csStartEngine(render);
  csAnimState.msPerStep = 600;
  csAnimState.onTick = () => { if (stepIdx < steps.length - 1) { stepIdx++; return false; } return true; };
}

// ══════════════════════════════════════════════════════════
//  KRUSKAL'S MST
// ══════════════════════════════════════════════════════════
function runKruskal() {
  let steps = [], stepIdx = 0, nodeCount = 7;
  function genSteps(nc) {
    const W = canvas.width, H = canvas.height;
    const R_layout = Math.min(W, H) * 0.30, cx = W / 2, cy = H / 2;
    const nodes = Array.from({ length: nc }, (_, i) => ({ id: i, label: String.fromCharCode(65 + i), x: cx + Math.cos((i / nc) * Math.PI * 2 - Math.PI / 2) * R_layout, y: cy + Math.sin((i / nc) * Math.PI * 2 - Math.PI / 2) * R_layout }));
    const edges = [];
    for (let i = 0; i < nc; i++) { edges.push({ u: i, v: (i + 1) % nc, w: 1 + Math.floor(Math.random() * 9) }); }
    for (let i = 0; i < Math.floor(nc / 2); i++) { edges.push({ u: i, v: (i + Math.floor(nc / 2)) % nc, w: 1 + Math.floor(Math.random() * 9) }); }
    edges.sort((a, b) => a.w - b.w);
    const parent = Array.from({ length: nc }, (_, i) => i), rank = Array(nc).fill(0);
    function find(x) { if (parent[x] !== x) parent[x] = find(parent[x]); return parent[x]; }
    function union(x, y) { const px = find(x), py = find(y); if (px === py) return false; if (rank[px] < rank[py]) parent[px] = py; else if (rank[px] > rank[py]) parent[py] = px; else { parent[py] = px; rank[px]++; } return true; }
    const mst = new Set(), rejected = new Set(), st = [];
    st.push({ nodes, edges, mst: new Set(), rejected: new Set(), current: null, line:3, msg: `Sorted ${edges.length} edges by weight. Starting Kruskal's...` });
    edges.forEach(e => {
      const ok = union(e.u, e.v);
      if (ok) { mst.add(e); st.push({ nodes, edges, mst: new Set(mst), rejected: new Set(rejected), current: e, accepted: true, line:7, msg: `Add edge ${nodes[e.u].label}-${nodes[e.v].label} (w=${e.w}) ✅ — no cycle` }); }
      else { rejected.add(e); st.push({ nodes, edges, mst: new Set(mst), rejected: new Set(rejected), current: e, accepted: false, line:6, msg: `Skip edge ${nodes[e.u].label}-${nodes[e.v].label} (w=${e.w}) ❌ — would form cycle` }); }
    });
    const totalW = [...mst].reduce((s, e) => s + e.w, 0);
    st.push({ nodes, edges, mst: new Set(mst), rejected: new Set(rejected), current: null, line:9, msg: `✅ MST complete! Total weight = ${totalW}` });
    return { steps: st, nodes };
  }
  let { steps: st, nodes: gNodes } = genSteps(nodeCount);
  steps = st;

  buildLeftPanel(`
    <div class="panel-section">
      <div class="panel-section-title">Parameters</div>
      ${makeSlider('kr_n','Nodes',4,10,nodeCount,1,'',v=>{nodeCount=v;const r=genSteps(v);steps=r.steps;gNodes=r.nodes;stepIdx=0;csStopEngine();})}
      ${makeSlider('kr_spd','Speed',1,20,6,1,'',v=>{if(csAnimState)csAnimState.msPerStep=Math.max(100,1200-v*52);})}
    </div>
    <div class="panel-section">
      <div class="panel-section-title">Controls</div>
      <button class="ctrl-btn primary" id="kr_start">▶ Start</button>
      <button class="ctrl-btn" id="kr_pause">⏸ Pause</button>
      <button class="ctrl-btn danger" id="kr_reset">↺ New Graph</button>
    </div>
    <div class="panel-section">
      <div class="panel-section-title">Legend</div>
      <div style="font-family:'Space Mono',monospace;font-size:11px;color:var(--text2);line-height:2.2;">
        <span style="color:#2ed573">─</span> MST edge added<br>
        <span style="color:#ff4757">─</span> Rejected (cycle)<br>
        <span style="color:#f59e0b">─</span> Currently checking
      </div>
    </div>
  `);
  const CODE = `<span class="cs-cm">// Kruskal's MST — O(E log E)</span>
<span class="cs-kw">void</span> <span class="cs-fn">kruskal</span>(<span class="cs-type">int</span> V, vector&lt;Edge&gt;&amp; edges){
  <span class="cs-fn">sort</span>(edges.<span class="cs-fn">begin</span>(), edges.<span class="cs-fn">end</span>());
  DSU dsu(V);
  vector&lt;Edge&gt; mst;
  <span class="cs-kw">for</span>(<span class="cs-kw">auto</span>&amp; e: edges){
    <span class="cs-cm">// Add if no cycle (different sets)</span>
    <span class="cs-kw">if</span>(dsu.<span class="cs-fn">union</span>(e.u, e.v))
      mst.<span class="cs-fn">push_back</span>(e);
    <span class="cs-kw">if</span>(mst.<span class="cs-fn">size</span>()==V-<span class="cs-num">1</span>) <span class="cs-kw">break</span>;
  }
}`;
  buildRightPanel(csRightPanel(CODE, 'O(E log E)', 'O(V)', "Kruskal's greedily picks cheapest edges using Union-Find to detect cycles."));

  function render() {
    const W = canvas.width, H = canvas.height;
    const step = steps[stepIdx] || steps[0];
    if (!step) return;
    clearCanvas(); drawGrid(0.02);
    const { nodes, edges, mst, rejected, current } = step;
    const R = 22;
    edges.forEach(e => {
      let col = '#1e3050', lw = 1.2, alpha = 0.3;
      if (mst.has(e)) { col = '#2ed573'; lw = 2.5; alpha = 1; }
      if (rejected.has(e)) { col = '#ff4757'; lw = 1.5; alpha = 0.5; }
      if (e === current) { col = '#f59e0b'; lw = 3; alpha = 1; }
      ctx.save(); ctx.globalAlpha = alpha;
      ctx.strokeStyle = col; ctx.lineWidth = lw;
      ctx.beginPath(); ctx.moveTo(nodes[e.u].x, nodes[e.u].y); ctx.lineTo(nodes[e.v].x, nodes[e.v].y); ctx.stroke();
      ctx.globalAlpha = 1;
      const mx = (nodes[e.u].x + nodes[e.v].x) / 2, my = (nodes[e.u].y + nodes[e.v].y) / 2;
      ctx.fillStyle = e === current ? '#f59e0b' : (mst.has(e) ? '#2ed573' : '#2a4060');
      ctx.font = '10px "Space Mono",monospace'; ctx.textAlign = 'center'; ctx.fillText(e.w, mx, my - 5);
      ctx.restore();
    });
    nodes.forEach((nd, i) => {
      ctx.fillStyle = '#0a1825'; ctx.beginPath(); ctx.arc(nd.x, nd.y, R, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#1e3a5a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(nd.x, nd.y, R, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = '#5a7aaa'; ctx.font = 'bold 13px "Space Mono",monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(nd.label, nd.x, nd.y); ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'start';
    });
    if (step.msg) { csSetStep(step.msg); csHL(step.line||0); }
  }

  document.getElementById('kr_start').onclick = () => { if (csAnimState) csAnimState.running = true; };
  document.getElementById('kr_pause').onclick = () => csStopEngine();
  document.getElementById('kr_reset').onclick = () => { const r = genSteps(nodeCount); steps = r.steps; gNodes = r.nodes; stepIdx = 0; csStopEngine(); csSetStep("New graph. Press ▶ Start Kruskal's."); };

  csStartEngine(render);
  csAnimState.msPerStep = 700;
  csAnimState.onTick = () => { if (stepIdx < steps.length - 1) { stepIdx++; return false; } return true; };
}

// ══════════════════════════════════════════════════════════
//  PRIM'S MST
// ══════════════════════════════════════════════════════════
function runPrim() {
  let steps = [], stepIdx = 0, nodeCount = 7;

  function genSteps(nc) {
    const W = canvas.width, H = canvas.height;
    const R_layout = Math.min(W, H) * 0.30, cx = W / 2, cy = H / 2;
    const nodes = Array.from({ length: nc }, (_, i) => ({ id: i, label: String.fromCharCode(65 + i), x: cx + Math.cos((i / nc) * Math.PI * 2 - Math.PI / 2) * R_layout, y: cy + Math.sin((i / nc) * Math.PI * 2 - Math.PI / 2) * R_layout }));
    const adj = Array.from({ length: nc }, () => []);
    for (let i = 0; i < nc; i++) { const w = 1 + Math.floor(Math.random() * 9); adj[i].push({ v: (i + 1) % nc, w }); adj[(i + 1) % nc].push({ v: i, w }); }
    for (let i = 0; i < Math.floor(nc / 2); i++) { const v = (i + Math.floor(nc / 2)) % nc, w = 1 + Math.floor(Math.random() * 9); adj[i].push({ v, w }); adj[v].push({ v: i, w }); }
    const inMST = new Set([0]), mstEdges = new Set(), st = [];
    st.push({ nodes, adj, inMST: new Set([0]), mstEdges: new Set(), candidate: null, msg: `Start from node A. Frontier = all A's edges.` });
    while (inMST.size < nc) {
      let best = null;
      for (const u of inMST) { for (const { v, w } of adj[u]) { if (!inMST.has(v)) { if (!best || w < best.w) best = { u, v, w }; } } }
      if (!best) break;
      inMST.add(best.v); mstEdges.add(`${Math.min(best.u, best.v)},${Math.max(best.u, best.v)}`);
      st.push({ nodes, adj, inMST: new Set(inMST), mstEdges: new Set(mstEdges), candidate: best, line:11, msg: `Add cheapest crossing edge: ${nodes[best.u].label}-${nodes[best.v].label} (w=${best.w})` });
    }
    const totalW = [...mstEdges].reduce((s, k) => {
      const [u, v] = k.split(',').map(Number);
      const e = adj[u].find(x => x.v === v);
      return s + (e ? e.w : 0);
    }, 0);
    st.push({ nodes, adj, inMST: new Set(inMST), mstEdges: new Set(mstEdges), candidate: null, line:13, msg: `✅ Prim's MST complete! Total weight = ${totalW}` });
    return { steps: st, nodes };
  }

  let { steps: st, nodes: gNodes } = genSteps(nodeCount);
  steps = st;

  buildLeftPanel(`
    <div class="panel-section">
      <div class="panel-section-title">Parameters</div>
      ${makeSlider('pr_n','Nodes',4,10,nodeCount,1,'',v=>{nodeCount=v;const r=genSteps(v);steps=r.steps;gNodes=r.nodes;stepIdx=0;csStopEngine();})}
      ${makeSlider('pr_spd','Speed',1,20,6,1,'',v=>{if(csAnimState)csAnimState.msPerStep=Math.max(120,1200-v*52);})}
    </div>
    <div class="panel-section">
      <div class="panel-section-title">Controls</div>
      <button class="ctrl-btn primary" id="pr_start">▶ Start</button>
      <button class="ctrl-btn" id="pr_pause">⏸ Pause</button>
      <button class="ctrl-btn danger" id="pr_reset">↺ New Graph</button>
    </div>
    <div class="panel-section">
      <div class="panel-section-title">Legend</div>
      <div style="font-family:'Space Mono',monospace;font-size:11px;color:var(--text2);line-height:2.2;">
        <span style="color:#2ed573">●</span> In MST<br>
        <span style="color:#2ed573">─</span> MST edge<br>
        <span style="color:#f59e0b">─</span> Best crossing edge
      </div>
    </div>
  `);
  const CODE = `<span class="cs-cm">// Prim's MST — O((V+E)log V)</span>
<span class="cs-kw">void</span> <span class="cs-fn">prim</span>(vector&lt;pair&lt;<span class="cs-type">int</span>,<span class="cs-type">int</span>&gt;&gt; adj[], <span class="cs-type">int</span> V){
  priority_queue&lt;pair&lt;<span class="cs-type">int</span>,<span class="cs-type">int</span>&gt;,
    vector&lt;...&gt;, greater&lt;&gt;&gt; pq;
  vector&lt;<span class="cs-type">int</span>&gt; key(V, INT_MAX);
  vector&lt;<span class="cs-type">bool</span>&gt; inMST(V, <span class="cs-kw">false</span>);
  key[<span class="cs-num">0</span>]=<span class="cs-num">0</span>; pq.<span class="cs-fn">push</span>({<span class="cs-num">0</span>,<span class="cs-num">0</span>});
  <span class="cs-kw">while</span>(!pq.<span class="cs-fn">empty</span>()){
    <span class="cs-type">int</span> u=pq.<span class="cs-fn">top</span>().second; pq.<span class="cs-fn">pop</span>();
    inMST[u]=<span class="cs-kw">true</span>;
    <span class="cs-kw">for</span>(<span class="cs-kw">auto</span> [v,w]: adj[u])
      <span class="cs-kw">if</span>(!inMST[v] &amp;&amp; w&lt;key[v])
        { key[v]=w; pq.<span class="cs-fn">push</span>({w,v}); }
  }
}`;
  buildRightPanel(csRightPanel(CODE, 'O((V+E)log V)', 'O(V)', "Prim's grows the MST outward like a spreading wave from the source node."));

  function render() {
    const W = canvas.width, H = canvas.height;
    const step = steps[stepIdx] || steps[0];
    if (!step) return;
    clearCanvas(); drawGrid(0.02);
    const { nodes, adj, inMST, mstEdges, candidate } = step;
    const R = 22;
    for (let u = 0; u < nodes.length; u++) {
      for (const { v, w } of adj[u]) {
        if (u >= v) continue;
        const key = `${Math.min(u, v)},${Math.max(u, v)}`;
        const isMST = mstEdges.has(key);
        const isCand = candidate && ((candidate.u === u && candidate.v === v) || (candidate.u === v && candidate.v === u));
        ctx.strokeStyle = isMST ? '#2ed573' : isCand ? '#f59e0b' : '#1e3050';
        ctx.lineWidth = isMST || isCand ? 2.5 : 1.2;
        ctx.globalAlpha = isMST || isCand ? 1 : 0.35;
        ctx.beginPath(); ctx.moveTo(nodes[u].x, nodes[u].y); ctx.lineTo(nodes[v].x, nodes[v].y); ctx.stroke();
        ctx.globalAlpha = 1;
        const mx = (nodes[u].x + nodes[v].x) / 2, my = (nodes[u].y + nodes[v].y) / 2;
        ctx.fillStyle = isMST ? '#2ed573' : isCand ? '#f59e0b' : '#2a4060';
        ctx.font = '10px "Space Mono",monospace'; ctx.textAlign = 'center'; ctx.fillText(w, mx, my - 5);
      }
    }
    nodes.forEach((nd, i) => {
      const inSet = inMST.has(i);
      ctx.fillStyle = inSet ? 'rgba(46,213,115,0.25)' : '#0a1825';
      ctx.beginPath(); ctx.arc(nd.x, nd.y, R, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = inSet ? '#2ed573' : '#1e3a5a'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(nd.x, nd.y, R, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = inSet ? '#2ed573' : '#5a7aaa'; ctx.font = 'bold 13px "Space Mono",monospace';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(nd.label, nd.x, nd.y); ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'start';
    });
    if (step.msg) { csSetStep(step.msg); csHL(step.line||0); }
  }

  document.getElementById('pr_start').onclick = () => { if (csAnimState) csAnimState.running = true; };
  document.getElementById('pr_pause').onclick = () => csStopEngine();
  document.getElementById('pr_reset').onclick = () => { const r = genSteps(nodeCount); steps = r.steps; gNodes = r.nodes; stepIdx = 0; csStopEngine(); csSetStep("New graph. Press ▶ Start Prim's."); };

  csStartEngine(render);
  csAnimState.msPerStep = 700;
  csAnimState.onTick = () => { if (stepIdx < steps.length - 1) { stepIdx++; return false; } return true; };
}

// ══════════════════════════════════════════════════════════
//  BELLMAN-FORD
// ══════════════════════════════════════════════════════════
function runBellmanFord() {
  let steps = [], stepIdx = 0, nodeCount = 6;

  function genSteps(nc) {
    const W = canvas.width, H = canvas.height;
    const R_layout = Math.min(W, H) * 0.28, cx = W / 2, cy = H / 2;
    const nodes = Array.from({ length: nc }, (_, i) => ({ id: i, label: String.fromCharCode(65 + i), x: cx + Math.cos((i / nc) * Math.PI * 2 - Math.PI / 2) * R_layout, y: cy + Math.sin((i / nc) * Math.PI * 2 - Math.PI / 2) * R_layout }));
    const edges = [];
    for (let i = 0; i < nc; i++) edges.push({ u: i, v: (i + 1) % nc, w: 1 + Math.floor(Math.random() * 8) });
    for (let i = 0; i < Math.floor(nc / 2); i++) edges.push({ u: i, v: (i + Math.floor(nc / 2)) % nc, w: 1 + Math.floor(Math.random() * 8) });
    const dist = Array(nc).fill(Infinity); dist[0] = 0;
    const relaxed = new Set(), st = [];
    st.push({ nodes, edges, dist: [...dist], relaxed: new Set(), current: null, line:3, msg: `Init: dist[A]=0, all others=∞. Running ${nc - 1} relaxation passes.` });
    for (let pass = 1; pass < nc; pass++) {
      let changed = false;
      for (const e of edges) {
        if (dist[e.u] !== Infinity && dist[e.u] + e.w < dist[e.v]) {
          dist[e.v] = dist[e.u] + e.w; changed = true; relaxed.add(e);
          st.push({ nodes, edges, dist: [...dist], relaxed: new Set(relaxed), current: e, line:7, msg: `Pass ${pass}: relax ${nodes[e.u].label}→${nodes[e.v].label} (w=${e.w}): dist[${nodes[e.v].label}]=${dist[e.v]}` });
        }
      }
      if (!changed) { st.push({ nodes, edges, dist: [...dist], relaxed: new Set(relaxed), current: null, line:8, msg: `Pass ${pass}: no changes — converged early!` }); break; }
    }
    st.push({ nodes, edges, dist: [...dist], relaxed: new Set(relaxed), current: null, line:9, msg: `✅ Bellman-Ford done! Shortest paths from A computed.` });
    return { steps: st };
  }

  let { steps: st } = genSteps(nodeCount);
  steps = st;

  buildLeftPanel(`
    <div class="panel-section">
      <div class="panel-section-title">Parameters</div>
      ${makeSlider('bf_n','Nodes',4,9,nodeCount,1,'',v=>{nodeCount=v;const r=genSteps(v);steps=r.steps;stepIdx=0;csStopEngine();})}
      ${makeSlider('bf_spd','Speed',1,20,6,1,'',v=>{if(csAnimState)csAnimState.msPerStep=Math.max(80,1000-v*44);})}
    </div>
    <div class="panel-section">
      <div class="panel-section-title">Controls</div>
      <button class="ctrl-btn primary" id="bfrd_start">▶ Start</button>
      <button class="ctrl-btn" id="bfrd_pause">⏸ Pause</button>
      <button class="ctrl-btn danger" id="bfrd_reset">↺ New Graph</button>
    </div>
    <div class="panel-section">
      <div class="panel-section-title">Legend</div>
      <div style="font-family:'Space Mono',monospace;font-size:11px;color:var(--text2);line-height:2.2;">
        <span style="color:#f59e0b">─</span> Current edge being relaxed<br>
        <span style="color:#2ed573">─</span> Relaxed (improved dist)<br>
        Numbers = shortest dist from A
      </div>
    </div>
  `);
  const CODE = `<span class="cs-cm">// Bellman-Ford — O(V*E)</span>
<span class="cs-kw">void</span> <span class="cs-fn">bellmanFord</span>(<span class="cs-type">int</span> src, <span class="cs-type">int</span> V){
  vector&lt;<span class="cs-type">int</span>&gt; dist(V, INT_MAX);
  dist[src]=<span class="cs-num">0</span>;
  <span class="cs-cm">// Relax V-1 times</span>
  <span class="cs-kw">for</span>(<span class="cs-type">int</span> i=<span class="cs-num">1</span>;i&lt;V;i++)
    <span class="cs-kw">for</span>(<span class="cs-kw">auto</span>&amp; e: edges)
      <span class="cs-kw">if</span>(dist[e.u]+e.w&lt;dist[e.v])
        dist[e.v]=dist[e.u]+e.w;
  <span class="cs-cm">// Check for negative cycle</span>
  <span class="cs-kw">for</span>(<span class="cs-kw">auto</span>&amp; e: edges)
    <span class="cs-kw">if</span>(dist[e.u]+e.w&lt;dist[e.v])
      <span class="cs-fn">print</span>(<span class="cs-str">"Negative cycle!"</span>);
}`;
  buildRightPanel(csRightPanel(CODE, 'O(V·E)', 'O(V)', 'Unlike Dijkstra, Bellman-Ford handles negative edge weights and detects negative cycles.'));

  function render() {
    const W = canvas.width, H = canvas.height;
    const step = steps[stepIdx] || steps[0];
    if (!step) return;
    clearCanvas(); drawGrid(0.02);
    const { nodes, edges, dist, relaxed, current } = step;
    const R = 22;
    edges.forEach(e => {
      const isRelaxed = relaxed.has(e);
      const isCurrent = e === current;
      ctx.strokeStyle = isCurrent ? '#f59e0b' : isRelaxed ? '#2ed573' : '#1e3050';
      ctx.lineWidth = isCurrent ? 3 : isRelaxed ? 2 : 1.2;
      ctx.globalAlpha = isCurrent || isRelaxed ? 1 : 0.4;
      ctx.beginPath(); ctx.moveTo(nodes[e.u].x, nodes[e.u].y); ctx.lineTo(nodes[e.v].x, nodes[e.v].y); ctx.stroke();
      ctx.globalAlpha = 1;
      const ang = Math.atan2(nodes[e.v].y - nodes[e.u].y, nodes[e.v].x - nodes[e.u].x);
      const ax = nodes[e.v].x - Math.cos(ang) * (R + 6), ay = nodes[e.v].y - Math.sin(ang) * (R + 6);
      ctx.fillStyle = isCurrent ? '#f59e0b' : '#2a4060'; ctx.beginPath();
      ctx.moveTo(ax, ay); ctx.lineTo(ax - 8 * Math.cos(ang - 0.4), ay - 8 * Math.sin(ang - 0.4));
      ctx.lineTo(ax - 8 * Math.cos(ang + 0.4), ay - 8 * Math.sin(ang + 0.4)); ctx.closePath(); ctx.fill();
      const mx = (nodes[e.u].x + nodes[e.v].x) / 2, my = (nodes[e.u].y + nodes[e.v].y) / 2;
      ctx.fillStyle = '#2a4060'; ctx.font = '10px "Space Mono",monospace'; ctx.textAlign = 'center'; ctx.fillText(e.w, mx, my - 6);
    });
    nodes.forEach((nd, i) => {
      const isCur = current && (current.u === i || current.v === i);
      ctx.fillStyle = isCur ? 'rgba(0,229,255,0.25)' : '#0a1825';
      ctx.beginPath(); ctx.arc(nd.x, nd.y, R, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = isCur ? '#00e5ff' : '#1e3a5a'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(nd.x, nd.y, R, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = isCur ? '#00e5ff' : '#5a7aaa'; ctx.font = 'bold 11px "Space Mono",monospace';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(nd.label, nd.x, nd.y);
      // Distance label
      ctx.font = '10px "Space Mono",monospace';
      ctx.fillStyle = dist[i] === Infinity ? '#2a4060' : '#f59e0b';
      ctx.fillText(dist[i] === Infinity ? '∞' : dist[i], nd.x, nd.y + R + 14);
      ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'start';
    });
    if (step.msg) { csSetStep(step.msg); csHL(step.line||0); }
  }

  document.getElementById('bfrd_start').onclick = () => { if (csAnimState) csAnimState.running = true; };
  document.getElementById('bfrd_pause').onclick = () => csStopEngine();
  document.getElementById('bfrd_reset').onclick = () => { const r = genSteps(nodeCount); steps = r.steps; stepIdx = 0; csStopEngine(); csSetStep('New graph. Press ▶ Start Bellman-Ford.'); };

  csStartEngine(render);
  csAnimState.msPerStep = 500;
  csAnimState.onTick = () => { if (stepIdx < steps.length - 1) { stepIdx++; return false; } return true; };
}

// ══════════════════════════════════════════════════════════
