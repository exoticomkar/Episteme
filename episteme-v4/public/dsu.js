//  UNION-FIND (DSU)
// ══════════════════════════════════════════════════════════
function runUnionFind() {
  let N = 8, parent = [], rank_ = [], steps = [], stepIdx = 0;
  const UNIONS = [[0,1],[2,3],[4,5],[6,7],[0,2],[4,6],[0,4]];

  function init(n) { parent = Array.from({ length: n }, (_, i) => i); rank_ = Array(n).fill(0); }
  function find(x) { if (parent[x] !== x) parent[x] = find(parent[x]); return parent[x]; }
  function union(x, y) { const px = find(x), py = find(y); if (px === py) return false; if (rank_[px] < rank_[py]) parent[px] = py; else if (rank_[px] > rank_[py]) parent[py] = px; else { parent[py] = px; rank_[px]++; } return true; }

  function genSteps() {
    init(N);
    const st = [];
    st.push({ parent: [...parent], rank: [...rank_], current: null, msg: `Init: ${N} elements, each in its own set. parent[i]=i` });
    UNIONS.forEach(([x, y]) => {
      const before = [...parent];
      const ok = union(x, y);
      const px = find(x), py_after = find(y);
      st.push({ parent: [...parent], rank: [...rank_], current: [x, y], union: ok, msg: ok ? `Union(${x},${y}): merged sets → root is ${find(x)}` : `Union(${x},${y}): already in same set!` });
    });
    st.push({ parent: [...parent], rank: [...rank_], current: null, msg: `✅ Final: ${new Set(Array.from({ length: N }, (_, i) => find(i))).size} disjoint sets` });
    return st;
  }

  steps = genSteps();

  buildLeftPanel(`
    <div class="panel-section">
      <div class="panel-section-title">Union Sequence</div>
      <div style="font-family:'Space Mono',monospace;font-size:11px;color:var(--text2);background:var(--bg3);padding:8px;border-radius:6px;line-height:2.0;">
        ${UNIONS.map(([x,y])=>`Union(${x}, ${y})`).join('<br>')}
      </div>
    </div>
    <div class="panel-section">
      <div class="panel-section-title">Controls</div>
      ${makeSlider('uf_spd','Speed',1,20,6,1,'',v=>{if(csAnimState)csAnimState.msPerStep=Math.max(150,1200-v*52);})}
      <button class="ctrl-btn primary" id="uf_start">▶ Animate</button>
      <button class="ctrl-btn" id="uf_pause">⏸ Pause</button>
      <button class="ctrl-btn danger" id="uf_reset">↺ Reset</button>
    </div>
    <div class="panel-section">
      <div class="panel-section-title">Concepts</div>
      <div style="font-family:'Space Mono',monospace;font-size:10px;color:var(--text2);line-height:1.9;">
        Path compression:<br>parent[x] = find(parent[x])<br><br>
        Union by rank:<br>attach shorter tree under taller
      </div>
    </div>
  `);
  const CODE = `<span class="cs-cm">// DSU with path compression + rank</span>
<span class="cs-type">int</span> parent[N], rank_[N];
<span class="cs-kw">void</span> <span class="cs-fn">init</span>(){ <span class="cs-kw">for</span>(<span class="cs-type">int</span> i=<span class="cs-num">0</span>;i&lt;N;i++) parent[i]=i; }

<span class="cs-type">int</span> <span class="cs-fn">find</span>(<span class="cs-type">int</span> x){
  <span class="cs-cm">// Path compression</span>
  <span class="cs-kw">if</span>(parent[x]!=x)
    parent[x]=<span class="cs-fn">find</span>(parent[x]);
  <span class="cs-kw">return</span> parent[x];
}

<span class="cs-kw">bool</span> <span class="cs-fn">unite</span>(<span class="cs-type">int</span> x, <span class="cs-type">int</span> y){
  <span class="cs-type">int</span> px=<span class="cs-fn">find</span>(x), py=<span class="cs-fn">find</span>(y);
  <span class="cs-kw">if</span>(px==py) <span class="cs-kw">return false</span>;
  <span class="cs-cm">// Union by rank</span>
  <span class="cs-kw">if</span>(rank_[px]&lt;rank_[py]) swap(px,py);
  parent[py]=px;
  <span class="cs-kw">if</span>(rank_[px]==rank_[py]) rank_[px]++;
  <span class="cs-kw">return true</span>;
}`;
  buildRightPanel(csRightPanel(CODE, 'O(α(n))≈O(1)', 'O(n)', 'α = inverse Ackermann function. Practically O(1) for all real inputs.'));

  // Group colors
  const GROUP_COLORS = ['#00e5ff','#f59e0b','#2ed573','#e879f9','#fb923c','#38bdf8','#ff4757','#a3e635'];

  function render() {
    const W = canvas.width, H = canvas.height;
    clearCanvas(); drawGrid(0.02);
    const step = steps[stepIdx] || steps[0];
    if (!step) return;
    const { parent: par, rank: rk, current } = step;

    // Find component roots and colors
    const roots = new Set(par);
    const rootColor = {};
    [...roots].forEach((r, i) => { rootColor[r] = GROUP_COLORS[i % GROUP_COLORS.length]; });

    // Draw nodes in a row
    const R = 26, spacing = (W - 60) / N;
    const nodeY = H * 0.45;
    const nodeX = Array.from({ length: N }, (_, i) => 30 + i * spacing + spacing / 2);

    // Draw parent arrows (above nodes)
    for (let i = 0; i < N; i++) {
      if (par[i] !== i) {
        const fromX = nodeX[i], toX = nodeX[par[i]];
        ctx.strokeStyle = rootColor[par[par[i] !== undefined ? par[i] : i]] || '#2a4060';
        ctx.lineWidth = 1.5; ctx.setLineDash([4, 3]);
        ctx.beginPath(); ctx.moveTo(fromX, nodeY - R - 4); ctx.lineTo(fromX, nodeY - R - 20); ctx.lineTo(toX, nodeY - R - 20); ctx.lineTo(toX, nodeY - R - 4); ctx.stroke();
        ctx.setLineDash([]);
        // Arrow head
        ctx.fillStyle = rootColor[par[par[i] !== undefined ? par[i] : i]] || '#2a4060';
        ctx.beginPath(); ctx.moveTo(toX, nodeY - R - 4); ctx.lineTo(toX - 4, nodeY - R - 12); ctx.lineTo(toX + 4, nodeY - R - 12); ctx.closePath(); ctx.fill();
      }
    }

    // Draw nodes
    for (let i = 0; i < N; i++) {
      const root = par[i];
      const col = rootColor[root] || '#2a4060';
      const isRoot = par[i] === i;
      const isCurrent = current && (current[0] === i || current[1] === i);
      ctx.shadowColor = isCurrent ? '#f59e0b' : col; ctx.shadowBlur = isCurrent ? 20 : 8;
      ctx.fillStyle = `${col}33`; ctx.beginPath(); ctx.arc(nodeX[i], nodeY, R, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = isCurrent ? '#f59e0b' : col; ctx.lineWidth = isCurrent ? 3 : 2;
      ctx.beginPath(); ctx.arc(nodeX[i], nodeY, R, 0, Math.PI * 2); ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.fillStyle = isCurrent ? '#f59e0b' : col; ctx.font = 'bold 13px "Space Mono",monospace';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(i, nodeX[i], nodeY);
      // Root crown
      if (isRoot) { ctx.font = '12px serif'; ctx.fillText('👑', nodeX[i], nodeY - R - 8); }
      // parent[i] label
      ctx.fillStyle = '#3d5470'; ctx.font = '9px "Space Mono",monospace';
      ctx.fillText(`p:${par[i]}`, nodeX[i], nodeY + R + 14);
      ctx.textBaseline = 'alphabetic';
    }

    // Color group legend
    [...roots].forEach((r, i) => {
      ctx.fillStyle = GROUP_COLORS[i % GROUP_COLORS.length]; ctx.fillRect(20 + i * 70, H - 40, 12, 12);
      ctx.fillStyle = GROUP_COLORS[i % GROUP_COLORS.length]; ctx.font = '9px "Space Mono",monospace';
      ctx.textAlign = 'left'; ctx.fillText(`Set ${r}`, 36 + i * 70, H - 30);
    });

    const prog = steps.length > 0 ? stepIdx / steps.length : 0;
    ctx.fillStyle = '#0a1520'; ctx.fillRect(0, H - 5, W, 5);
    ctx.fillStyle = '#f472b6'; ctx.fillRect(0, H - 5, W * prog, 5);
    ctx.textAlign = 'start';
    if (step.msg) { csSetStep(step.msg); csHL(step.line||0); }
  }

  document.getElementById('uf_start').onclick = () => { if (csAnimState) csAnimState.running = true; };
  document.getElementById('uf_pause').onclick = () => csStopEngine();
  document.getElementById('uf_reset').onclick = () => { steps = genSteps(); stepIdx = 0; csStopEngine(); csSetStep('Press ▶ Animate to watch Union-Find operations.'); };

  csStartEngine(render);
  csAnimState.msPerStep = 800;
  csAnimState.onTick = () => { if (stepIdx < steps.length - 1) { stepIdx++; return false; } return true; };
}

// ══════════════════════════════════════════════════════════
