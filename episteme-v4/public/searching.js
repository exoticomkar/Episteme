//  BINARY SEARCH
// ══════════════════════════════════════════════════════════
function runBinarySearch() {
  let N = 20, target = 37, arr = [], steps = [], stepIdx = 0;

  function makeArr(n) { return Array.from({ length: n }, (_, i) => Math.round(i * (100 / (n - 1)))); }
  function genSteps(arr, T) {
    let lo = 0, hi = arr.length - 1, st = [];
    st.push({ lo, hi, mid: -1, found: -1, arr, msg: `Searching for ${T} in sorted array of ${arr.length} elements` });
    while (lo <= hi) {
      const mid = Math.floor((lo + hi) / 2);
      st.push({ lo, hi, mid, found: -1, arr, line:6, msg: `lo=${lo} hi=${hi} mid=${mid} arr[mid]=${arr[mid]}` });
      if (arr[mid] === T) { st.push({ lo, hi, mid, found: mid, arr, line:8, msg: `✅ Found ${T} at index ${mid}!` }); return st; }
      if (arr[mid] < T) { lo = mid + 1; st.push({ lo, hi, mid, found: -1, arr, msg: `${arr[mid]} < ${T} → search right half [${lo}..${hi}]` }); }
      else { hi = mid - 1; st.push({ lo, hi, mid, found: -1, arr, msg: `${arr[mid]} > ${T} → search left half [${lo}..${hi}]` }); }
    }
    st.push({ lo, hi, mid: -1, found: -1, arr, msg: `❌ ${T} not found in array` });
    return st;
  }

  arr = makeArr(N);

  buildLeftPanel(`
    <div class="panel-section">
      <div class="panel-section-title">Parameters</div>
      ${makeSlider('bs_n','Array Size',10,30,N,1,'',v=>{N=v;arr=makeArr(N);steps=[];stepIdx=0;csStopEngine();})}
      <div style="margin-top:10px;">
        <div class="slider-label">Target Value</div>
        <div style="display:flex;gap:6px;margin-top:4px;">
          <input id="bs_target" type="number" min="0" max="100" value="${target}"
            style="flex:1;background:var(--bg3);border:1px solid var(--border);color:var(--text);padding:6px;border-radius:6px;font-family:'Space Mono',monospace;font-size:12px;">
        </div>
      </div>
      ${makeSlider('bs_spd','Speed',1,20,7,1,'',v=>{if(csAnimState)csAnimState.msPerStep=Math.max(80,800-v*34);})}
    </div>
    <div class="panel-section">
      <div class="panel-section-title">Controls</div>
      <button class="ctrl-btn primary" id="bs_start">▶ Search</button>
      <button class="ctrl-btn" id="bs_pause">⏸ Pause</button>
      <button class="ctrl-btn danger" id="bs_reset">↺ Reset</button>
    </div>
    <div class="panel-section">
      <div class="panel-section-title">Legend</div>
      <div style="font-family:'Space Mono',monospace;font-size:11px;color:var(--text2);line-height:2.2;">
        <span style="color:#00e5ff">■</span> Search range<br>
        <span style="color:#f59e0b">■</span> Mid pointer<br>
        <span style="color:#2ed573">■</span> Found
      </div>
    </div>
  `);
  const CODE = `<span class="cs-cm">// Binary Search — O(log n)</span>
<span class="cs-type">int</span> <span class="cs-fn">binarySearch</span>(<span class="cs-type">int</span> arr[],<span class="cs-type">int</span> n,<span class="cs-type">int</span> target){
  <span class="cs-type">int</span> lo=<span class="cs-num">0</span>, hi=n-<span class="cs-num">1</span>;
  <span class="cs-kw">while</span>(lo&lt;=hi){
    <span class="cs-type">int</span> mid=(lo+hi)/<span class="cs-num">2</span>;
    <span class="cs-cm">// Avoid overflow: mid=lo+(hi-lo)/2</span>
    <span class="cs-kw">if</span>(arr[mid]==target)
      <span class="cs-kw">return</span> mid; <span class="cs-cm">// Found!</span>
    <span class="cs-kw">else if</span>(arr[mid]&lt;target)
      lo=mid+<span class="cs-num">1</span>; <span class="cs-cm">// Right half</span>
    <span class="cs-kw">else</span>
      hi=mid-<span class="cs-num">1</span>; <span class="cs-cm">// Left half</span>
  }
  <span class="cs-kw">return</span> -<span class="cs-num">1</span>; <span class="cs-cm">// Not found</span>
}`;
  buildRightPanel(csRightPanel(CODE, 'O(log n)', 'O(1)', 'Binary search halves the search space each step. For n=1M: max 20 comparisons!'));

  function render() {
    const W = canvas.width, H = canvas.height;
    clearCanvas(); drawGrid(0.025);
    const step = steps[stepIdx] || { lo: 0, hi: arr.length - 1, mid: -1, found: -1, arr };
    const a = step.arr;
    const n = a.length;
    const cellW = Math.max(12, (W - 40) / n);
    const cellH = 40;
    const ox = (W - n * cellW) / 2;
    const oy = H / 2 - cellH / 2;

    // Range highlight
    if (step.lo <= step.hi) {
      ctx.fillStyle = 'rgba(0,229,255,0.06)';
      ctx.fillRect(ox + step.lo * cellW, oy - 10, (step.hi - step.lo + 1) * cellW, cellH + 20);
    }

    a.forEach((v, i) => {
      let bg = '#050a10', stroke = '#0f1e30', textC = '#2a4060';
      if (i >= step.lo && i <= step.hi) { bg = 'rgba(0,229,255,0.1)'; stroke = '#1e3a5a'; textC = '#3d6080'; }
      if (i === step.mid) { bg = 'rgba(245,158,11,0.3)'; stroke = '#f59e0b'; textC = '#f59e0b'; }
      if (i === step.found) { bg = 'rgba(46,213,115,0.35)'; stroke = '#2ed573'; textC = '#2ed573'; }
      ctx.fillStyle = bg; ctx.fillRect(ox + i * cellW + 1, oy, cellW - 2, cellH);
      ctx.strokeStyle = stroke; ctx.lineWidth = 1; ctx.strokeRect(ox + i * cellW + 1, oy, cellW - 2, cellH);
      ctx.fillStyle = textC; ctx.font = `bold ${Math.min(11, cellW * 0.4)}px "Space Mono",monospace`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(v, ox + i * cellW + cellW / 2, oy + cellH / 2);
      ctx.textBaseline = 'alphabetic';
      // Index
      ctx.fillStyle = '#1e3050'; ctx.font = '8px "Space Mono",monospace';
      ctx.fillText(i, ox + i * cellW + cellW / 2, oy + cellH + 12);
    });

    // lo, mid, hi arrows
    [['lo', step.lo, '#00e5ff'], ['mid', step.mid, '#f59e0b'], ['hi', step.hi, '#818cf8']].forEach(([label, idx, col]) => {
      if (idx < 0 || idx >= n) return;
      const x = ox + idx * cellW + cellW / 2;
      ctx.fillStyle = col; ctx.font = 'bold 10px "Space Mono",monospace'; ctx.textAlign = 'center';
      ctx.fillText(label, x, oy - 18);
      ctx.beginPath(); ctx.moveTo(x, oy - 14); ctx.lineTo(x - 5, oy - 6); ctx.lineTo(x + 5, oy - 6); ctx.closePath(); ctx.fill();
    });

    // Target display
    ctx.fillStyle = '#2a4060'; ctx.font = 'bold 12px "Space Mono",monospace'; ctx.textAlign = 'center';
    ctx.fillText(`Target: ${target}`, W / 2, H - 22);
    const prog = steps.length > 0 ? stepIdx / steps.length : 0;
    ctx.fillStyle = '#0a1520'; ctx.fillRect(0, H - 6, W, 6);
    ctx.fillStyle = '#38bdf8'; ctx.fillRect(0, H - 6, W * prog, 6);
    ctx.textAlign = 'start';
    if (step.msg) { csSetStep(step.msg); csHL(step.line||0); }
  }

  document.getElementById('bs_start').onclick = () => {
    target = parseInt(document.getElementById('bs_target').value) || 37;
    if (steps.length === 0) { steps = genSteps(arr, target); stepIdx = 0; }
    if (csAnimState) csAnimState.running = true;
  };
  document.getElementById('bs_pause').onclick = () => csStopEngine();
  document.getElementById('bs_reset').onclick = () => { steps = []; stepIdx = 0; csStopEngine(); csSetStep('Set a target and press ▶ Search.'); };

  csStartEngine(render);
  csAnimState.msPerStep = 400;
  csAnimState.onTick = () => { if (stepIdx < steps.length - 1) { stepIdx++; return false; } return true; };
}

// ══════════════════════════════════════════════════════════
//  INTERPOLATION SEARCH
// ══════════════════════════════════════════════════════════
function runInterpolationSearch() {
  let N = 20, target = 60, arr = [], steps = [], stepIdx = 0;
  function makeArr(n) { return Array.from({ length: n }, (_, i) => Math.round(i * (100 / (n - 1)))); }
  function genSteps(arr, T) {
    let lo = 0, hi = arr.length - 1, st = [];
    st.push({ lo, hi, mid: -1, found: -1, arr, msg: `Interpolation Search for ${T}` });
    let iter = 0;
    while (lo <= hi && T >= arr[lo] && T <= arr[hi]) {
      iter++;
      if (lo === hi) { if (arr[lo] === T) st.push({ lo, hi, mid: lo, found: lo, arr, msg: `✅ Found ${T} at index ${lo}` }); else st.push({ lo, hi, mid: lo, found: -1, arr, msg: `❌ Not found` }); return st; }
      const pos = lo + Math.floor(((T - arr[lo]) / (arr[hi] - arr[lo])) * (hi - lo));
      st.push({ lo, hi, mid: pos, found: -1, arr, msg: `Iter ${iter}: probe=lo+((T-arr[lo])/(arr[hi]-arr[lo]))*(hi-lo)=${pos}, arr[${pos}]=${arr[pos]}` });
      if (arr[pos] === T) { st.push({ lo, hi, mid: pos, found: pos, arr, msg: `✅ Found ${T} at index ${pos}!` }); return st; }
      if (arr[pos] < T) { lo = pos + 1; st.push({ lo, hi, mid: pos, found: -1, arr, msg: `${arr[pos]} < ${T}, move lo to ${lo}` }); }
      else { hi = pos - 1; st.push({ lo, hi, mid: pos, found: -1, arr, msg: `${arr[pos]} > ${T}, move hi to ${hi}` }); }
    }
    st.push({ lo, hi, mid: -1, found: -1, arr, msg: `❌ ${T} not found` });
    return st;
  }
  arr = makeArr(N);

  buildLeftPanel(`
    <div class="panel-section">
      <div class="panel-section-title">Parameters</div>
      ${makeSlider('is_n','Array Size',10,30,N,1,'',v=>{N=v;arr=makeArr(N);steps=[];stepIdx=0;csStopEngine();})}
      <div style="margin-top:10px;"><div class="slider-label">Target Value</div>
      <input id="is_target" type="number" min="0" max="100" value="${target}"
        style="width:100%;margin-top:4px;background:var(--bg3);border:1px solid var(--border);color:var(--text);padding:6px;border-radius:6px;font-family:'Space Mono',monospace;font-size:12px;"></div>
      ${makeSlider('is_spd','Speed',1,20,7,1,'',v=>{if(csAnimState)csAnimState.msPerStep=Math.max(80,800-v*34);})}
    </div>
    <div class="panel-section">
      <div class="panel-section-title">Controls</div>
      <button class="ctrl-btn primary" id="is_start">▶ Search</button>
      <button class="ctrl-btn" id="is_pause">⏸ Pause</button>
      <button class="ctrl-btn danger" id="is_reset">↺ Reset</button>
    </div>
  `);
  const CODE = `<span class="cs-cm">// Interpolation Search — O(log log n)</span>
<span class="cs-cm">// for uniform data; O(n) worst case</span>
<span class="cs-type">int</span> <span class="cs-fn">interpolationSearch</span>(<span class="cs-type">int</span> arr[],<span class="cs-type">int</span> n,<span class="cs-type">int</span> T){
  <span class="cs-type">int</span> lo=<span class="cs-num">0</span>, hi=n-<span class="cs-num">1</span>;
  <span class="cs-kw">while</span>(lo&lt;=hi &amp;&amp; T&gt;=arr[lo] &amp;&amp; T&lt;=arr[hi]){
    <span class="cs-kw">if</span>(lo==hi){
      <span class="cs-kw">return</span> arr[lo]==T ? lo : -<span class="cs-num">1</span>;
    }
    <span class="cs-cm">// Estimate position by value</span>
    <span class="cs-type">int</span> pos=lo+
      ((T-arr[lo])*(hi-lo))/
      (arr[hi]-arr[lo]);
    <span class="cs-kw">if</span>(arr[pos]==T) <span class="cs-kw">return</span> pos;
    <span class="cs-kw">if</span>(arr[pos]&lt;T) lo=pos+<span class="cs-num">1</span>;
    <span class="cs-kw">else</span>            hi=pos-<span class="cs-num">1</span>;
  }
  <span class="cs-kw">return</span> -<span class="cs-num">1</span>;
}`;
  buildRightPanel(csRightPanel(CODE, 'O(log log n)', 'O(1)', 'Interpolation search estimates position from value. Beats binary search on uniform data.'));

  function render() {
    const W = canvas.width, H = canvas.height;
    clearCanvas(); drawGrid(0.025);
    const step = steps[stepIdx] || { lo: 0, hi: arr.length - 1, mid: -1, found: -1, arr };
    const a = step.arr, n = a.length;
    const cellW = Math.max(12, (W - 40) / n), cellH = 40, ox = (W - n * cellW) / 2, oy = H / 2 - cellH / 2;

    if (step.lo <= step.hi) { ctx.fillStyle = 'rgba(0,229,255,0.05)'; ctx.fillRect(ox + step.lo * cellW, oy - 10, (step.hi - step.lo + 1) * cellW, cellH + 20); }
    a.forEach((v, i) => {
      let bg = '#050a10', stroke = '#0f1e30', textC = '#2a4060';
      if (i >= step.lo && i <= step.hi) { bg = 'rgba(0,229,255,0.08)'; stroke = '#1e3a5a'; textC = '#3d6080'; }
      if (i === step.mid) { bg = 'rgba(245,158,11,0.3)'; stroke = '#f59e0b'; textC = '#f59e0b'; }
      if (i === step.found) { bg = 'rgba(46,213,115,0.35)'; stroke = '#2ed573'; textC = '#2ed573'; }
      ctx.fillStyle = bg; ctx.fillRect(ox + i * cellW + 1, oy, cellW - 2, cellH);
      ctx.strokeStyle = stroke; ctx.lineWidth = 1; ctx.strokeRect(ox + i * cellW + 1, oy, cellW - 2, cellH);
      ctx.fillStyle = textC; ctx.font = `bold ${Math.min(11, cellW * 0.4)}px "Space Mono",monospace`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(v, ox + i * cellW + cellW / 2, oy + cellH / 2);
      ctx.textBaseline = 'alphabetic';
    });
    // Formula display
    if (step.mid >= 0) {
      ctx.fillStyle = '#2a4060'; ctx.font = '10px "Space Mono",monospace'; ctx.textAlign = 'center';
      ctx.fillText(`probe = lo + (T-arr[lo])/(arr[hi]-arr[lo]) × (hi-lo) = ${step.mid}`, W / 2, oy - 20);
    }
    [['lo', step.lo, '#00e5ff'], ['probe', step.mid, '#f59e0b'], ['hi', step.hi, '#818cf8']].forEach(([label, idx, col]) => {
      if (idx < 0 || idx >= n) return;
      const x = ox + idx * cellW + cellW / 2;
      ctx.fillStyle = col; ctx.font = 'bold 9px "Space Mono",monospace'; ctx.textAlign = 'center';
      ctx.fillText(label, x, oy + cellH + 14);
    });
    ctx.fillStyle = '#67e8f9'; ctx.font = 'bold 12px "Space Mono",monospace'; ctx.textAlign = 'center';
    ctx.fillText(`Target: ${target}`, W / 2, H - 22);
    const prog = steps.length > 0 ? stepIdx / steps.length : 0;
    ctx.fillStyle = '#0a1520'; ctx.fillRect(0, H - 6, W, 6);
    ctx.fillStyle = '#67e8f9'; ctx.fillRect(0, H - 6, W * prog, 6);
    ctx.textAlign = 'start';
    if (step.msg) { csSetStep(step.msg); csHL(step.line||0); }
  }

  document.getElementById('is_start').onclick = () => {
    target = parseInt(document.getElementById('is_target').value) || 60;
    if (steps.length === 0) { steps = genSteps(arr, target); stepIdx = 0; }
    if (csAnimState) csAnimState.running = true;
  };
  document.getElementById('is_pause').onclick = () => csStopEngine();
  document.getElementById('is_reset').onclick = () => { steps = []; stepIdx = 0; csStopEngine(); csSetStep('Set a target and press ▶ Search.'); };

  csStartEngine(render);
  csAnimState.msPerStep = 400;
  csAnimState.onTick = () => { if (stepIdx < steps.length - 1) { stepIdx++; return false; } return true; };
}

// ══════════════════════════════════════════════════════════
