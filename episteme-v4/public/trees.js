// ══════════════════════════════════════════════════════════
//  SHARED TREE DRAWING UTILITIES
// ══════════════════════════════════════════════════════════
function calcTreeLayout(root) {
  // Assigns x,y positions to each node using in-order traversal
  if (!root) return;
  const positions = new Map();
  let counter = 0;
  const H_GAP = 1; // horizontal spacing factor
  function assignX(node) {
    if (!node) return;
    assignX(node.left);
    positions.set(node, { x: counter++ });
    assignX(node.right);
  }
  function assignY(node, depth) {
    if (!node) return;
    const p = positions.get(node);
    p.y = depth;
    assignY(node.left, depth + 1);
    assignY(node.right, depth + 1);
  }
  assignX(root);
  assignY(root, 0);
  return positions;
}

function drawTree(root, positions, W, H, highlight, extra) {
  if (!root || !positions) return;
  clearCanvas(); drawGrid(0.02);
  const nodes = [...positions.entries()];
  const xs = nodes.map(([,p]) => p.x);
  const ys = nodes.map(([,p]) => p.y);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const maxY = Math.max(...ys);
  const padX = 40, padY = 50, R = 20;
  const scaleX = maxX === minX ? 1 : (W - padX * 2) / (maxX - minX);
  const scaleY = maxY === 0 ? 1 : (H - padY * 2 - 30) / maxY;

  function px(node) {
    const p = positions.get(node);
    return padX + (p.x - minX) * scaleX;
  }
  function py(node) {
    const p = positions.get(node);
    return padY + p.y * scaleY;
  }

  // Draw edges first
  function drawEdges(node) {
    if (!node) return;
    if (node.left) {
      ctx.strokeStyle = '#1e3a5a'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(px(node), py(node)); ctx.lineTo(px(node.left), py(node.left)); ctx.stroke();
    }
    if (node.right) {
      ctx.strokeStyle = '#1e3a5a'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(px(node), py(node)); ctx.lineTo(px(node.right), py(node.right)); ctx.stroke();
    }
    drawEdges(node.left);
    drawEdges(node.right);
  }
  drawEdges(root);

  // Draw nodes
  function drawNodes(node) {
    if (!node) return;
    const x = px(node), y = py(node);
    const hl = highlight && highlight(node);
    let fill = '#0a1825', stroke = '#1e3a5a', textC = '#3d5470';
    if (hl) {
      fill = hl.fill || 'rgba(0,229,255,0.25)';
      stroke = hl.stroke || '#00e5ff';
      textC = hl.text || '#00e5ff';
    }
    // Node color from extra (for AVL balance, RB color)
    if (extra && extra.nodeColor) {
      const nc = extra.nodeColor(node);
      if (nc) { fill = nc.fill; stroke = nc.stroke; textC = nc.text; }
    }
    ctx.shadowColor = stroke; ctx.shadowBlur = hl ? 16 : 0;
    ctx.fillStyle = fill; ctx.beginPath(); ctx.arc(x, y, R, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = stroke; ctx.lineWidth = hl ? 2.5 : 1.5;
    ctx.beginPath(); ctx.arc(x, y, R, 0, Math.PI * 2); ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.fillStyle = textC; ctx.font = 'bold 12px "Space Mono",monospace';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(node.val, x, y);
    // Height/balance label for AVL
    if (extra && extra.label) {
      const lb = extra.label(node);
      if (lb) {
        ctx.font = '9px "Space Mono",monospace'; ctx.fillStyle = '#3d5470';
        ctx.fillText(lb, x + R + 4, y - R * 0.5);
      }
    }
    ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'start';
    drawNodes(node.left);
    drawNodes(node.right);
  }
  drawNodes(root);
}

// ══════════════════════════════════════════════════════════
//  BST OPERATIONS
// ══════════════════════════════════════════════════════════
function runBSTOps() {
  let root = null, highlightNode = null, highlightType = '';
  const VALUES = [50, 30, 70, 20, 40, 60, 80];

  class BSTNode { constructor(v) { this.val = v; this.left = null; this.right = null; } }

  function insert(node, v) {
    if (!node) return new BSTNode(v);
    if (v < node.val) node.left = insert(node.left, v);
    else if (v > node.val) node.right = insert(node.right, v);
    return node;
  }
  function search(node, v) {
    if (!node) return null;
    if (node.val === v) return node;
    return v < node.val ? search(node.left, v) : search(node.right, v);
  }
  function minNode(node) { while (node.left) node = node.left; return node; }
  function deleteNode(node, v) {
    if (!node) return null;
    if (v < node.val) { node.left = deleteNode(node.left, v); }
    else if (v > node.val) { node.right = deleteNode(node.right, v); }
    else {
      if (!node.left) return node.right;
      if (!node.right) return node.left;
      const m = minNode(node.right);
      node.val = m.val;
      node.right = deleteNode(node.right, m.val);
    }
    return node;
  }

  // Initialize with default values
  VALUES.forEach(v => { root = insert(root, v); });

  buildLeftPanel(`
    <div class="panel-section">
      <div class="panel-section-title">Operations</div>
      <div style="display:flex;gap:6px;margin-bottom:8px;">
        <input id="bst_val" type="number" min="1" max="99" value="35"
          style="flex:1;background:var(--bg3);border:1px solid var(--border);color:var(--text);padding:6px;border-radius:6px;font-family:'Space Mono',monospace;font-size:12px;">
      </div>
      <button class="ctrl-btn primary" id="bst_ins">⬆ Insert</button>
      <button class="ctrl-btn" id="bst_srch">🔍 Search</button>
      <button class="ctrl-btn danger" id="bst_del">✖ Delete</button>
      <button class="ctrl-btn" id="bst_reset">↺ Reset Tree</button>
    </div>
    <div class="panel-section">
      <div class="panel-section-title">Legend</div>
      <div style="font-family:'Space Mono',monospace;font-size:11px;color:var(--text2);line-height:2.2;">
        <span style="color:#00e5ff">●</span> Comparing<br>
        <span style="color:#2ed573">●</span> Found / Inserted<br>
        <span style="color:#ff4757">●</span> Deleted node
      </div>
    </div>
  `);
  const CODE = `<span class="cs-cm">// BST Insert — O(h) time</span>
<span class="cs-type">Node*</span> <span class="cs-fn">insert</span>(<span class="cs-type">Node*</span> root, <span class="cs-type">int</span> v){
  <span class="cs-kw">if</span>(!root) <span class="cs-kw">return new</span> <span class="cs-fn">Node</span>(v);
  <span class="cs-kw">if</span>(v &lt; root-&gt;val)
    root-&gt;left = <span class="cs-fn">insert</span>(root-&gt;left, v);
  <span class="cs-kw">else if</span>(v &gt; root-&gt;val)
    root-&gt;right = <span class="cs-fn">insert</span>(root-&gt;right, v);
  <span class="cs-kw">return</span> root;
}
<span class="cs-cm">// BST Delete — O(h) time</span>
<span class="cs-type">Node*</span> <span class="cs-fn">deleteNode</span>(<span class="cs-type">Node*</span> root, <span class="cs-type">int</span> v){
  <span class="cs-kw">if</span>(!root) <span class="cs-kw">return</span> <span class="cs-kw">null</span>;
  <span class="cs-kw">if</span>(v &lt; root-&gt;val) root-&gt;left=<span class="cs-fn">deleteNode</span>(root-&gt;left,v);
  <span class="cs-kw">else if</span>(v &gt; root-&gt;val) root-&gt;right=<span class="cs-fn">deleteNode</span>(root-&gt;right,v);
  <span class="cs-kw">else</span> {
    <span class="cs-kw">if</span>(!root-&gt;left) <span class="cs-kw">return</span> root-&gt;right;
    <span class="cs-kw">if</span>(!root-&gt;right) <span class="cs-kw">return</span> root-&gt;left;
    <span class="cs-type">Node*</span> m=<span class="cs-fn">minNode</span>(root-&gt;right);
    root-&gt;val=m-&gt;val;
    root-&gt;right=<span class="cs-fn">deleteNode</span>(root-&gt;right,m-&gt;val);
  }
  <span class="cs-kw">return</span> root;
}`;
  buildRightPanel(csRightPanel(CODE, 'O(h)', 'O(n)', 'BST maintains left < root < right. h = height ≈ log n for balanced trees.'));

  function render() {
    const W = canvas.width, H = canvas.height;
    const pos = calcTreeLayout(root);
    drawTree(root, pos, W, H, (n) => {
      if (!highlightNode) return null;
      if (n === highlightNode) {
        if (highlightType === 'found') return { fill: 'rgba(46,213,115,0.35)', stroke: '#2ed573', text: '#2ed573' };
        if (highlightType === 'deleted') return { fill: 'rgba(255,71,87,0.35)', stroke: '#ff4757', text: '#ff4757' };
        return { fill: 'rgba(0,229,255,0.25)', stroke: '#00e5ff', text: '#00e5ff' };
      }
      return null;
    });
    if (!root) {
      ctx.fillStyle = '#2a4060'; ctx.font = '14px "Space Mono",monospace';
      ctx.textAlign = 'center'; ctx.fillText('Tree is empty. Insert values!', W / 2, H / 2);
      ctx.textAlign = 'start';
    }
  }

  function animSearch(v, type) {
    let node = root, steps = [];
    while (node) {
      steps.push(node);
      if (v === node.val) break;
      node = v < node.val ? node.left : node.right;
    }
    let i = 0;
    const ti = setInterval(() => {
      if (i < steps.length) {
        highlightNode = steps[i]; highlightType = i === steps.length - 1 ? type : 'cmp';
        csSetStep(i === steps.length - 1 ? `${type === 'found' ? '✅ Found' : '✖ Deleting'} ${v}` : `Comparing ${v} with ${steps[i].val} → go ${v < steps[i].val ? 'left' : 'right'}`);
        csHL(i === steps.length - 1 ? (type === 'found' ? 8 : 12) : (v < steps[i].val ? 4 : 6));
        i++;
      } else { clearInterval(ti); highlightNode = null; }
    }, 500);
  }

  document.getElementById('bst_ins').onclick = () => {
    const v = parseInt(document.getElementById('bst_val').value);
    if (isNaN(v)) return;
    root = insert(root, v); highlightNode = search(root, v); highlightType = 'found';
    csSetStep(`Inserted ${v} into BST`); csHL(3);
    setTimeout(() => { highlightNode = null; }, 1200);
  };
  document.getElementById('bst_srch').onclick = () => {
    const v = parseInt(document.getElementById('bst_val').value);
    if (isNaN(v)) return;
    const found = search(root, v);
    if (!found) { csHL(0); csSetStep(`${v} not found in tree`); return; }
    animSearch(v, 'found');
  };
  document.getElementById('bst_del').onclick = () => {
    const v = parseInt(document.getElementById('bst_val').value);
    if (isNaN(v) || !search(root, v)) { csSetStep(`${v} not in tree`); return; }
    animSearch(v, 'deleted');
    setTimeout(() => { root = deleteNode(root, v); highlightNode = null; csHL(11); csSetStep(`Deleted ${v} from BST`); }, steps_len_approx(root, v) * 500 + 600);
  };
  document.getElementById('bst_reset').onclick = () => {
    root = null; VALUES.forEach(v => { root = insert(root, v); });
    highlightNode = null; csSetStep('Tree reset to default [50,30,70,20,40,60,80]');
  };

  function steps_len_approx(node, v) {
    let d = 0, n = node;
    while (n && n.val !== v) { d++; n = v < n.val ? n.left : n.right; }
    return d;
  }

  csStartEngine(render);
  csSetStep('Enter a value and use Insert / Search / Delete.');
}

// ══════════════════════════════════════════════════════════
//  AVL TREE ROTATIONS
// ══════════════════════════════════════════════════════════
function runAVLTree() {
  let root = null, steps = [], stepIdx = 0;
  class AVLNode { constructor(v) { this.val = v; this.left = null; this.right = null; this.h = 1; } }

  function height(n) { return n ? n.h : 0; }
  function bf(n) { return n ? height(n.left) - height(n.right) : 0; }
  function updH(n) { if (n) n.h = 1 + Math.max(height(n.left), height(n.right)); }
  function rotR(y) { const x = y.left, T2 = x.right; x.right = y; y.left = T2; updH(y); updH(x); return x; }
  function rotL(x) { const y = x.right, T2 = y.left; y.left = x; x.right = T2; updH(x); updH(y); return y; }
  function avlInsert(node, v, st) {
    if (!node) { const n = new AVLNode(v); st.push({ type: 'insert', node: n, line:2, msg: `Inserted ${v}` }); return n; }
    st.push({ type: 'cmp', node, line:3, msg: `${v} ${v < node.val ? '<' : '>'} ${node.val}, go ${v < node.val ? 'left' : 'right'}` });
    if (v < node.val) node.left = avlInsert(node.left, v, st);
    else if (v > node.val) node.right = avlInsert(node.right, v, st);
    else return node;
    updH(node);
    const b = bf(node);
    if (b > 1 && v < node.left.val) { st.push({ type: 'rotR', node, line:9, msg: `LL case at ${node.val}: Right Rotation` }); return rotR(node); }
    if (b < -1 && v > node.right.val) { st.push({ type: 'rotL', node, line:11, msg: `RR case at ${node.val}: Left Rotation` }); return rotL(node); }
    if (b > 1 && v > node.left.val) { st.push({ type: 'rotLR', node, line:13, msg: `LR case at ${node.val}: Left-Right Rotation` }); node.left = rotL(node.left); return rotR(node); }
    if (b < -1 && v < node.right.val) { st.push({ type: 'rotRL', node, line:17, msg: `RL case at ${node.val}: Right-Left Rotation` }); node.right = rotR(node.right); return rotL(node); }
    return node;
  }

  const INSERTS = [30, 20, 40, 10, 25, 35, 50, 5, 15];
  function rebuild() {
    root = null; steps = []; stepIdx = 0;
    INSERTS.forEach(v => { root = avlInsert(root, v, steps); });
    stepIdx = 0; csStopEngine();
  }
  rebuild();

  buildLeftPanel(`
    <div class="panel-section">
      <div class="panel-section-title">Insert Sequence</div>
      <div style="font-family:'Space Mono',monospace;font-size:11px;color:var(--text2);background:var(--bg3);padding:8px;border-radius:6px;">[${INSERTS.join(', ')}]</div>
    </div>
    <div class="panel-section">
      <div class="panel-section-title">Controls</div>
      ${makeSlider('avl_spd','Speed',1,20,6,1,'',v=>{if(csAnimState)csAnimState.msPerStep=Math.max(80,1000-v*45);})}
      <button class="ctrl-btn primary" id="avl_start">▶ Animate</button>
      <button class="ctrl-btn" id="avl_pause">⏸ Pause</button>
      <button class="ctrl-btn danger" id="avl_reset">↺ Reset</button>
    </div>
    <div class="panel-section">
      <div class="panel-section-title">Rotations</div>
      <div style="font-family:'Space Mono',monospace;font-size:10px;color:var(--text2);line-height:2.2;">
        <span style="color:#f59e0b">⟳</span> LL → Right Rot.<br>
        <span style="color:#f59e0b">⟲</span> RR → Left Rot.<br>
        <span style="color:#ff6b9d">⟳⟲</span> LR → Left then Right<br>
        <span style="color:#ff6b9d">⟲⟳</span> RL → Right then Left
      </div>
    </div>
  `);
  const CODE = `<span class="cs-cm">// AVL Insert with rotations</span>
<span class="cs-type">Node*</span> <span class="cs-fn">insert</span>(<span class="cs-type">Node*</span> node, <span class="cs-type">int</span> v){
  <span class="cs-kw">if</span>(!node) <span class="cs-kw">return new</span> <span class="cs-fn">Node</span>(v);
  <span class="cs-kw">if</span>(v &lt; node-&gt;val) node-&gt;left=<span class="cs-fn">insert</span>(node-&gt;left,v);
  <span class="cs-kw">else</span> node-&gt;right=<span class="cs-fn">insert</span>(node-&gt;right,v);
  <span class="cs-fn">updateHeight</span>(node);
  <span class="cs-type">int</span> b=<span class="cs-fn">bf</span>(node);
  <span class="cs-cm">// LL case</span>
  <span class="cs-kw">if</span>(b&gt;<span class="cs-num">1</span> &amp;&amp; v&lt;node-&gt;left-&gt;val) <span class="cs-kw">return</span> <span class="cs-fn">rotR</span>(node);
  <span class="cs-cm">// RR case</span>
  <span class="cs-kw">if</span>(b&lt;-<span class="cs-num">1</span> &amp;&amp; v&gt;node-&gt;right-&gt;val) <span class="cs-kw">return</span> <span class="cs-fn">rotL</span>(node);
  <span class="cs-cm">// LR case</span>
  <span class="cs-kw">if</span>(b&gt;<span class="cs-num">1</span> &amp;&amp; v&gt;node-&gt;left-&gt;val){
    node-&gt;left=<span class="cs-fn">rotL</span>(node-&gt;left);
    <span class="cs-kw">return</span> <span class="cs-fn">rotR</span>(node);
  }
  <span class="cs-cm">// RL case</span>
  <span class="cs-kw">if</span>(b&lt;-<span class="cs-num">1</span> &amp;&amp; v&lt;node-&gt;right-&gt;val){
    node-&gt;right=<span class="cs-fn">rotR</span>(node-&gt;right);
    <span class="cs-kw">return</span> <span class="cs-fn">rotL</span>(node);
  }
  <span class="cs-kw">return</span> node;
}`;
  buildRightPanel(csRightPanel(CODE, 'O(log n)', 'O(n)', 'AVL trees maintain |balance factor| ≤ 1 at every node via rotations.'));

  function render() {
    const W = canvas.width, H = canvas.height;
    const step = steps[Math.min(stepIdx, steps.length - 1)];
    // Rebuild tree state up to stepIdx for display
    let dispRoot = null;
    for (let i = 0; i <= Math.min(stepIdx, steps.length - 1); i++) {
      if (steps[i].type === 'insert') { dispRoot = root; break; }
    }
    dispRoot = root; // always show full tree, highlight step node
    const pos = calcTreeLayout(dispRoot);
    drawTree(dispRoot, pos, W, H,
      (n) => {
        if (!step) return null;
        if (step.node === n) {
          if (step.type === 'insert') return { fill: 'rgba(46,213,115,0.35)', stroke: '#2ed573', text: '#2ed573' };
          if (step.type.startsWith('rot')) return { fill: 'rgba(245,158,11,0.35)', stroke: '#f59e0b', text: '#f59e0b' };
          return { fill: 'rgba(0,229,255,0.20)', stroke: '#00e5ff', text: '#00e5ff' };
        }
        return null;
      },
      { label: (n) => `h:${height(n)} b:${bf(n)}` }
    );
    if (step) { csSetStep(step.msg); csHL(step.line||0); }
  }

  document.getElementById('avl_start').onclick = () => { if (csAnimState) csAnimState.running = true; };
  document.getElementById('avl_pause').onclick = () => csStopEngine();
  document.getElementById('avl_reset').onclick = () => { rebuild(); csSetStep('AVL tree reset. Press ▶ Animate.'); };

  csStartEngine(render);
  csAnimState.msPerStep = 600;
  csAnimState.onTick = () => { if (stepIdx < steps.length - 1) { stepIdx++; return false; } return true; };
}

// ══════════════════════════════════════════════════════════
//  TREE TRAVERSALS
// ══════════════════════════════════════════════════════════
function runTreeTraversal() {
  let root = null, visitOrder = [], stepIdx = 0, travType = 'inorder';
  class TNode { constructor(v) { this.val = v; this.left = null; this.right = null; } }
  function ins(nd, v) { if (!nd) return new TNode(v); if (v < nd.val) nd.left = ins(nd.left, v); else nd.right = ins(nd.right, v); return nd; }

  const VALS = [50, 30, 70, 20, 40, 60, 80, 10, 35, 45];
  VALS.forEach(v => { root = ins(root, v); });

  function genTraversal(type) {
    const order = [];
    function inorder(n) { if (!n) return; inorder(n.left); order.push(n); inorder(n.right); }
    function preorder(n) { if (!n) return; order.push(n); preorder(n.left); preorder(n.right); }
    function postorder(n) { if (!n) return; postorder(n.left); postorder(n.right); order.push(n); }
    function levelorder(n) { if (!n) return; const q = [n]; while (q.length) { const nd = q.shift(); order.push(nd); if (nd.left) q.push(nd.left); if (nd.right) q.push(nd.right); } }
    if (type === 'inorder') inorder(root);
    else if (type === 'preorder') preorder(root);
    else if (type === 'postorder') postorder(root);
    else levelorder(root);
    return order;
  }

  buildLeftPanel(`
    <div class="panel-section">
      <div class="panel-section-title">Traversal Type</div>
      ${['inorder','preorder','postorder','levelorder'].map(t => `<button class="ctrl-btn${t==='inorder'?' primary':''}" id="tt_${t}">${t.charAt(0).toUpperCase()+t.slice(1)}</button>`).join('')}
    </div>
    <div class="panel-section">
      <div class="panel-section-title">Controls</div>
      ${makeSlider('tt_spd','Speed',1,20,6,1,'',v=>{if(csAnimState)csAnimState.msPerStep=Math.max(80,900-v*40);})}
      <button class="ctrl-btn primary" id="tt_start">▶ Animate</button>
      <button class="ctrl-btn" id="tt_pause">⏸ Pause</button>
      <button class="ctrl-btn danger" id="tt_reset">↺ Reset</button>
    </div>
  `);
  ['inorder','preorder','postorder','levelorder'].forEach(t => {
    const btn = document.getElementById('tt_' + t);
    if (btn) btn.onclick = () => {
      document.querySelectorAll('[id^=tt_]').forEach(b => b.classList.remove('primary'));
      btn.classList.add('primary');
      travType = t; visitOrder = []; stepIdx = 0; csStopEngine();
      csSetStep(`Selected ${t}. Press ▶ Animate.`);
    };
  });

  const CODE = `<span class="cs-cm">// Inorder: Left → Root → Right</span>
<span class="cs-kw">void</span> <span class="cs-fn">inorder</span>(<span class="cs-type">Node*</span> n){
  <span class="cs-kw">if</span>(!n) <span class="cs-kw">return</span>;
  <span class="cs-fn">inorder</span>(n-&gt;left);
  <span class="cs-fn">visit</span>(n);
  <span class="cs-fn">inorder</span>(n-&gt;right);
}
<span class="cs-cm">// Preorder: Root → Left → Right</span>
<span class="cs-kw">void</span> <span class="cs-fn">preorder</span>(<span class="cs-type">Node*</span> n){
  <span class="cs-kw">if</span>(!n) <span class="cs-kw">return</span>;
  <span class="cs-fn">visit</span>(n);
  <span class="cs-fn">preorder</span>(n-&gt;left);
  <span class="cs-fn">preorder</span>(n-&gt;right);
}
<span class="cs-cm">// Level Order (BFS)</span>
<span class="cs-kw">void</span> <span class="cs-fn">levelOrder</span>(<span class="cs-type">Node*</span> root){
  queue&lt;<span class="cs-type">Node*</span>&gt; q; q.<span class="cs-fn">push</span>(root);
  <span class="cs-kw">while</span>(!q.<span class="cs-fn">empty</span>()){
    <span class="cs-type">Node*</span> n=q.<span class="cs-fn">front</span>(); q.<span class="cs-fn">pop</span>();
    <span class="cs-fn">visit</span>(n);
    <span class="cs-kw">if</span>(n-&gt;left) q.<span class="cs-fn">push</span>(n-&gt;left);
    <span class="cs-kw">if</span>(n-&gt;right) q.<span class="cs-fn">push</span>(n-&gt;right);
  }
}`;
  buildRightPanel(csRightPanel(CODE, 'O(n)', 'O(h)', 'All traversals visit every node once. Inorder of BST = sorted order.'));

  const visited = new Set();
  function render() {
    const W = canvas.width, H = canvas.height;
    const pos = calcTreeLayout(root);
    drawTree(root, pos, W, H, (n) => {
      const idx = visitOrder.indexOf(n);
      if (idx === -1) return null;
      if (idx === stepIdx - 1) return { fill: 'rgba(0,229,255,0.4)', stroke: '#00e5ff', text: '#00e5ff' };
      if (idx < stepIdx) return { fill: 'rgba(46,213,115,0.25)', stroke: '#2ed573', text: '#2ed573' };
      return null;
    });
    // Show visit sequence so far
    const seq = visitOrder.slice(0, stepIdx).map(n => n.val).join(' → ');
    ctx.fillStyle = '#2a4060'; ctx.font = '11px "Space Mono",monospace'; ctx.textAlign = 'center';
    ctx.fillText(seq, W / 2, H - 18); ctx.textAlign = 'start';
    // Progress
    const prog = visitOrder.length > 0 ? stepIdx / visitOrder.length : 0;
    ctx.fillStyle = '#0a1520'; ctx.fillRect(0, H - 6, W, 6);
    ctx.fillStyle = '#a78bfa'; ctx.fillRect(0, H - 6, W * prog, 6);
  }

  document.getElementById('tt_start').onclick = () => {
    if (visitOrder.length === 0) { visitOrder = genTraversal(travType); stepIdx = 0; }
    if (csAnimState) csAnimState.running = true;
  };
  document.getElementById('tt_pause').onclick = () => csStopEngine();
  document.getElementById('tt_reset').onclick = () => { visitOrder = []; stepIdx = 0; csStopEngine(); csSetStep('Select traversal type and press ▶ Animate.'); };

  csStartEngine(render);
  csAnimState.msPerStep = 500;
  csAnimState.onTick = () => {
    if (!visitOrder.length) return true;
    if (stepIdx < visitOrder.length) {
      csHL(TRAV_LINES[travType]||3); csSetStep(`Visiting node ${visitOrder[stepIdx].val} (step ${stepIdx + 1}/${visitOrder.length})`);
      stepIdx++; return false;
    }
    return true;
  };
}

// ══════════════════════════════════════════════════════════
//  RED-BLACK TREE
// ══════════════════════════════════════════════════════════
function runRedBlackTree() {
  // Simplified RB tree (insert only, colors shown, no full rebalance animation)
  let nodes = [], steps = [], stepIdx = 0;
  // We simulate RB tree with a simple structure for visualization
  class RBNode { constructor(v, c) { this.val = v; this.color = c; this.left = null; this.right = null; this.parent = null; } }

  let root = null;
  const RED = 'RED', BLACK = 'BLACK';

  function rbInsert(v) {
    const n = new RBNode(v, RED);
    if (!root) { root = n; root.color = BLACK; steps.push({ snapshot: cloneRB(root), line:3, msg: `Insert ${v} as root → color BLACK` }); return; }
    let cur = root, par = null;
    while (cur) { par = cur; cur = v < cur.val ? cur.left : cur.right; }
    n.parent = par;
    if (v < par.val) par.left = n; else par.right = n;
    steps.push({ snapshot: cloneRB(root), highlight: v, line:8, msg: `Insert ${v} as RED node` });
    fixRB(n);
  }

  function cloneRB(node) {
    if (!node) return null;
    const n = new RBNode(node.val, node.color);
    n.left = cloneRB(node.left); n.right = cloneRB(node.right);
    if (n.left) n.left.parent = n; if (n.right) n.right.parent = n;
    return n;
  }

  function fixRB(n) {
    while (n !== root && n.parent && n.parent.color === RED) {
      const p = n.parent, g = p.parent;
      if (!g) break;
      if (p === g.left) {
        const u = g.right;
        if (u && u.color === RED) { // Case 1: uncle red
          p.color = BLACK; u.color = BLACK; g.color = RED;
          steps.push({ snapshot: cloneRB(root), line:9, msg: `Recolor: parent & uncle BLACK, grandparent RED` });
          n = g;
        } else {
          if (n === p.right) { rotateLeft(p); n = p; steps.push({ snapshot: cloneRB(root), line:12, msg: `LR case: left rotate parent` }); }
          n.parent.color = BLACK; g.color = RED; rotateRight(g);
          steps.push({ snapshot: cloneRB(root), line:13, msg: `LL case: right rotate grandparent, recolor` });
        }
      } else {
        const u = g.left;
        if (u && u.color === RED) {
          n.parent.color = BLACK; u.color = BLACK; g.color = RED;
          steps.push({ snapshot: cloneRB(root), line:9, msg: `Recolor: parent & uncle BLACK, grandparent RED` });
          n = g;
        } else {
          if (n === p.left) { rotateRight(p); n = p; steps.push({ snapshot: cloneRB(root), line:16, msg: `RL case: right rotate parent` }); }
          n.parent.color = BLACK; g.color = RED; rotateLeft(g);
          steps.push({ snapshot: cloneRB(root), line:17, msg: `RR case: left rotate grandparent, recolor` });
        }
      }
    }
    root.color = BLACK;
  }
  function rotateLeft(x) { const y = x.right; x.right = y.left; if (y.left) y.left.parent = x; y.parent = x.parent; if (!x.parent) root = y; else if (x === x.parent.left) x.parent.left = y; else x.parent.right = y; y.left = x; x.parent = y; }
  function rotateRight(y) { const x = y.left; y.left = x.right; if (x.right) x.right.parent = y; x.parent = y.parent; if (!y.parent) root = x; else if (y === y.parent.left) y.parent.left = x; else y.parent.right = x; x.right = y; y.parent = x; }

  const INSERTS = [10, 20, 30, 15, 25, 5, 35, 28];
  function rebuild() { root = null; steps = []; stepIdx = 0; INSERTS.forEach(v => rbInsert(v)); stepIdx = 0; csStopEngine(); }
  rebuild();

  buildLeftPanel(`
    <div class="panel-section">
      <div class="panel-section-title">Insert Sequence</div>
      <div style="font-family:'Space Mono',monospace;font-size:11px;color:var(--text2);background:var(--bg3);padding:8px;border-radius:6px;">[${INSERTS.join(', ')}]</div>
    </div>
    <div class="panel-section">
      <div class="panel-section-title">Controls</div>
      ${makeSlider('rb_spd','Speed',1,20,5,1,'',v=>{if(csAnimState)csAnimState.msPerStep=Math.max(100,1200-v*50);})}
      <button class="ctrl-btn primary" id="rb_start">▶ Animate</button>
      <button class="ctrl-btn" id="rb_pause">⏸ Pause</button>
      <button class="ctrl-btn danger" id="rb_reset">↺ Reset</button>
    </div>
    <div class="panel-section">
      <div class="panel-section-title">Properties</div>
      <div style="font-family:'Space Mono',monospace;font-size:10px;color:var(--text2);line-height:2.0;">
        <span style="color:#ff4757">●</span> RED node<br>
        <span style="color:#7a94b0">●</span> BLACK node<br>
        ∙ Root always BLACK<br>
        ∙ RED nodes have BLACK children<br>
        ∙ All paths: equal black nodes
      </div>
    </div>
  `);
  const CODE = `<span class="cs-cm">// RB Tree properties:</span>
<span class="cs-cm">// 1. Every node is RED or BLACK</span>
<span class="cs-cm">// 2. Root is BLACK</span>
<span class="cs-cm">// 3. RED node → BLACK children</span>
<span class="cs-cm">// 4. All paths to NULL have</span>
<span class="cs-cm">//    same number of BLACK nodes</span>
<span class="cs-cm">// Fix after insert (Case 1):</span>
<span class="cs-kw">if</span>(uncle-&gt;color == RED){
  parent-&gt;color   = BLACK;
  uncle-&gt;color    = BLACK;
  grandpa-&gt;color  = RED;
  n = grandpa; <span class="cs-cm">// recurse up</span>
}
<span class="cs-cm">// Fix (Case 2 — LL):</span>
<span class="cs-kw">else</span> {
  parent-&gt;color  = BLACK;
  grandpa-&gt;color = RED;
  <span class="cs-fn">rotateRight</span>(grandpa);
}`;
  buildRightPanel(csRightPanel(CODE, 'O(log n)', 'O(n)', 'Red-Black trees power C++ std::map and Linux kernel rbtree.'));

  function render() {
    const W = canvas.width, H = canvas.height;
    const step = steps[Math.min(stepIdx, steps.length - 1)];
    const dispRoot = step ? step.snapshot : root;
    const pos = calcTreeLayout(dispRoot);
    drawTree(dispRoot, pos, W, H, null, {
      nodeColor: (n) => {
        if (n.color === RED) return { fill: 'rgba(255,71,87,0.35)', stroke: '#ff4757', text: '#ff9090' };
        return { fill: 'rgba(40,60,90,0.7)', stroke: '#4a6080', text: '#8ab0c0' };
      }
    });
    if (step) { csSetStep(step.msg); csHL(step.line||0); }
  }

  document.getElementById('rb_start').onclick = () => { if (csAnimState) csAnimState.running = true; };
  document.getElementById('rb_pause').onclick = () => csStopEngine();
  document.getElementById('rb_reset').onclick = () => { rebuild(); csSetStep('RB tree reset. Press ▶ Animate.'); };

  csStartEngine(render);
  csAnimState.msPerStep = 700;
  csAnimState.onTick = () => { if (stepIdx < steps.length - 1) { stepIdx++; return false; } return true; };
}

