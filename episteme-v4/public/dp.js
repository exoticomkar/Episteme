// ══════════════════════════════════════════════════════════
//  FIBONACCI DP
// ══════════════════════════════════════════════════════════
function runFibDP(){
  let N=12, steps=[], stepIdx=0;

  function genSteps(n){
    const dp=Array(n+1).fill(-1), steps=[];
    dp[0]=0; dp[1]=1;
    steps.push({dp:[...dp],cur:-1,prev1:-1,prev2:-1,line:5,msg:'Base cases: dp[0]=0, dp[1]=1'});
    for(let i=2;i<=n;i++){
      dp[i]=dp[i-1]+dp[i-2];
      steps.push({dp:[...dp],cur:i,prev1:i-1,prev2:i-2,line:7,msg:`dp[${i}] = dp[${i-1}](${dp[i-1]}) + dp[${i-2}](${dp[i-2]}) = ${dp[i]}`});
    }
    steps.push({dp:[...dp],cur:-1,prev1:-1,prev2:-1,line:8,msg:`✅ fib(${n}) = ${dp[n]}`});
    return steps;
  }

  buildLeftPanel(`
    <div class="panel-section">
      <div class="panel-section-title">Parameters</div>
      ${makeSlider('cfb_n','N (fib index)',3,20,N,1,'',v=>{N=v;steps=[];stepIdx=0;csStopEngine();})}
      ${makeSlider('cfb_spd','Speed',1,20,6,1,'',v=>{if(csAnimState)csAnimState.msPerStep=Math.max(80,800-v*35);})}
    </div>
    <div class="panel-section">
      <div class="panel-section-title">Controls</div>
      <button class="ctrl-btn primary" id="cfb_start">▶ Animate</button>
      <button class="ctrl-btn" id="cfb_pause">⏸ Pause</button>
      <button class="ctrl-btn danger" id="cfb_reset">↺ Reset</button>
    </div>
    <div class="panel-section">
      <div class="panel-section-title">Recurrence</div>
      <div class="formula-box">dp[i] = dp[i-1] + dp[i-2]<br>dp[0]=0, dp[1]=1</div>
    </div>
  `);
  const CODE=`<span class="cs-cm">// Fibonacci DP (Tabulation) O(n)</span>
<span class="cs-type">int</span> <span class="cs-fn">fibDP</span>(<span class="cs-type">int</span> n){
  <span class="cs-kw">if</span>(n&lt;=<span class="cs-num">1</span>) <span class="cs-kw">return</span> n;
  <span class="cs-type">int</span> dp[n+<span class="cs-num">1</span>];
  dp[<span class="cs-num">0</span>]=<span class="cs-num">0</span>; dp[<span class="cs-num">1</span>]=<span class="cs-num">1</span>;
  <span class="cs-kw">for</span>(<span class="cs-type">int</span> i=<span class="cs-num">2</span>;i&lt;=n;i++)
    dp[i]=dp[i-<span class="cs-num">1</span>]+dp[i-<span class="cs-num">2</span>];
  <span class="cs-kw">return</span> dp[n];
}
<span class="cs-cm">// Space-optimised O(1):</span>
<span class="cs-type">int</span> <span class="cs-fn">fibOpt</span>(<span class="cs-type">int</span> n){
  <span class="cs-type">int</span> a=<span class="cs-num">0</span>, b=<span class="cs-num">1</span>;
  <span class="cs-kw">for</span>(<span class="cs-type">int</span> i=<span class="cs-num">2</span>;i&lt;=n;i++){
    <span class="cs-type">int</span> c=a+b; a=b; b=c;
  }
  <span class="cs-kw">return</span> b;
}`;
  buildRightPanel(csRightPanel(CODE,'O(n)','O(n)','Press ▶ Animate to watch the DP table fill up cell by cell.'));

  function render(){
    const W=canvas.width, H=canvas.height;
    clearCanvas(); drawGrid(0.025);
    const step=steps[stepIdx]||{dp:Array(N+1).fill(-1),cur:-1,prev1:-1,prev2:-1};
    const dp=step.dp; const n=dp.length-1;
    const cellW=Math.min(58,(W-60)/(n+1)), cellH=52;
    const totalW=(n+1)*cellW, ox=(W-totalW)/2, oy=H*0.38-cellH/2;

    // Title
    ctx.fillStyle='#2a4060'; ctx.font='11px "Space Mono",monospace'; ctx.textAlign='center';
    ctx.fillText('Fibonacci DP Table (Tabulation)',W/2,oy-28);

    // Index labels
    for(let i=0;i<=n;i++){
      ctx.fillStyle='#2a4060'; ctx.font='10px "Space Mono",monospace'; ctx.textAlign='center';
      ctx.fillText(`[${i}]`,ox+i*cellW+cellW/2,oy-10);
    }

    // Draw cells
    for(let i=0;i<=n;i++){
      const cx=ox+i*cellW, cy=oy;
      const filled=dp[i]>=0;
      let bg='#050a10', border='#0f1e30', textC='#2a4060';
      if(filled){bg='rgba(0,229,255,0.10)';border='#1e3a5a';textC='#7a9ab5';}
      if(i===step.cur){bg='rgba(46,213,115,0.28)';border='#2ed573';textC='#2ed573';}
      else if(i===step.prev1||i===step.prev2){bg='rgba(245,158,11,0.22)';border='#f59e0b';textC='#f59e0b';}

      ctx.fillStyle=bg; ctx.fillRect(cx+1,cy+1,cellW-2,cellH-2);
      ctx.strokeStyle=border; ctx.lineWidth=i===step.cur?2.5:1.5;
      ctx.strokeRect(cx+1,cy+1,cellW-2,cellH-2);
      ctx.fillStyle=textC; ctx.font=`bold ${Math.min(14,cellW*0.28)}px "Space Mono",monospace`;
      ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(dp[i]>=0?dp[i]:'?',cx+cellW/2,cy+cellH/2);
      ctx.textBaseline='alphabetic';
    }

    // Dependency arrow: prev1 and prev2 → cur
    if(step.cur>=2){
      [step.prev1,step.prev2].forEach(p=>{
        const x1=ox+p*cellW+cellW/2, y1=oy+cellH+4;
        const x2=ox+step.cur*cellW+cellW/2;
        ctx.strokeStyle='rgba(245,158,11,0.55)'; ctx.lineWidth=1.5;
        ctx.setLineDash([4,3]);
        ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x1,y1+18); ctx.lineTo(x2,y1+18); ctx.lineTo(x2,y1+4); ctx.stroke();
        ctx.setLineDash([]);
      });
    }

    // Fibonacci sequence visual (bar chart below)
    const validVals=dp.filter(v=>v>0);
    if(validVals.length>1){
      const maxFib=Math.max(...validVals)||1;
      const barZoneY=oy+cellH+60, barZoneH=H-barZoneY-40;
      ctx.fillStyle='#0a1520'; ctx.font='10px "Space Mono",monospace'; ctx.textAlign='center';
      ctx.fillText('Fibonacci sequence growth',W/2,barZoneY-8);
      for(let i=0;i<=n;i++){
        if(dp[i]<0) continue;
        const bh=Math.max(3,(dp[i]/maxFib)*barZoneH);
        const bx=ox+i*cellW+2, bw=cellW-4;
        const by=barZoneY+barZoneH-bh;
        const isActive=(i===step.cur);
        ctx.fillStyle=isActive?'rgba(46,213,115,0.5)':'rgba(0,229,255,0.12)';
        ctx.fillRect(bx,by,bw,bh);
        ctx.strokeStyle=isActive?'#2ed573':'#1e3a5a'; ctx.lineWidth=1;
        ctx.strokeRect(bx,by,bw,bh);
      }
    }

    // Result display
    if(dp[n]>=0){
      ctx.fillStyle='rgba(46,213,115,0.15)'; ctx.fillRect(W/2-100,H-36,200,28);
      ctx.strokeStyle='#2ed573'; ctx.lineWidth=1.5; ctx.strokeRect(W/2-100,H-36,200,28);
      ctx.fillStyle='#2ed573'; ctx.font='bold 13px "Space Mono",monospace'; ctx.textAlign='center';
      ctx.fillText(`fib(${n}) = ${dp[n]}`,W/2,H-17);
    }
    ctx.textAlign='start';
    if(step.msg) csSetStep(step.msg); csHL(step.line||0);
  }

  document.getElementById('cfb_start').onclick=()=>{
    if(steps.length===0){steps=genSteps(N);stepIdx=0;}
    if(csAnimState) csAnimState.running=true;
  };
  document.getElementById('cfb_pause').onclick=()=>csStopEngine();
  document.getElementById('cfb_reset').onclick=()=>{csStopEngine();steps=[];stepIdx=0;csSetStep('Press ▶ Animate to fill the DP table.');};

  csStartEngine(render);
  csAnimState.msPerStep=500;
  csAnimState.onTick=()=>{
    if(stepIdx<steps.length-1){stepIdx++;return false;}
    return true;
  };
}

// ══════════════════════════════════════════════════════════
//  LCS — LONGEST COMMON SUBSEQUENCE
// ══════════════════════════════════════════════════════════
function runLCS(){
  const PAIRS=[['ABCBDAB','BDCAB'],['AGGTAB','GXTXAYB'],['ABCDE','ACE']];
  let pairIdx=0, steps=[], stepIdx=0;
  let s1=PAIRS[0][0], s2=PAIRS[0][1];

  function genSteps(a,b){
    const m=a.length, n=b.length;
    const dp=Array.from({length:m+1},()=>Array(n+1).fill(0));
    const steps=[{dp:dp.map(r=>[...r]),r:-1,c:-1,match:false,msg:`Starting LCS for "${a}" and "${b}"`}];
    for(let i=1;i<=m;i++) for(let j=1;j<=n;j++){
      if(a[i-1]===b[j-1]){
        dp[i][j]=dp[i-1][j-1]+1;
        steps.push({dp:dp.map(r=>[...r]),r:i,c:j,match:true,line:8,msg:`Match! '${a[i-1]}'=='${b[j-1]}' → dp[${i}][${j}]=dp[${i-1}][${j-1}]+1=${dp[i][j]}`});
      } else {
        dp[i][j]=Math.max(dp[i-1][j],dp[i][j-1]);
        steps.push({dp:dp.map(r=>[...r]),r:i,c:j,match:false,line:10,msg:`No match: '${a[i-1]}'≠'${b[j-1]}' → max(${dp[i-1][j]},${dp[i][j-1]})=${dp[i][j]}`});
      }
    }
    steps.push({dp:dp.map(r=>[...r]),r:-1,c:-1,match:false,line:11,msg:`✅ LCS length = ${dp[m][n]}`});
    return steps;
  }

  buildLeftPanel(`
    <div class="panel-section">
      <div class="panel-section-title">String Pair</div>
      ${PAIRS.map((p,i)=>`<button class="ctrl-btn${i===0?' primary':''}" id="clcs_p${i}">${p[0]} / ${p[1]}</button>`).join('')}
    </div>
    <div class="panel-section">
      <div class="panel-section-title">Controls</div>
      ${makeSlider('clcs_spd','Speed',1,20,7,1,'',v=>{if(csAnimState)csAnimState.msPerStep=Math.max(30,600-v*26);})}
      <button class="ctrl-btn primary" id="clcs_start">▶ Animate</button>
      <button class="ctrl-btn" id="clcs_pause">⏸ Pause</button>
      <button class="ctrl-btn danger" id="clcs_reset">↺ Reset</button>
    </div>
  `);
  PAIRS.forEach((_,i)=>{
    const btn=document.getElementById('clcs_p'+i);
    if(btn) btn.onclick=()=>{
      document.querySelectorAll('[id^=clcs_p]').forEach(b=>b.classList.remove('primary'));
      btn.classList.add('primary');
      [s1,s2]=PAIRS[i]; steps=[]; stepIdx=0; csStopEngine();
      csSetStep(`Selected: "${s1}" vs "${s2}"`);
    };
  });

  const CODE=`<span class="cs-cm">// LCS — O(m*n) time and space</span>
<span class="cs-type">int</span> <span class="cs-fn">lcs</span>(<span class="cs-type">string</span> a, <span class="cs-type">string</span> b){
  <span class="cs-type">int</span> m=a.<span class="cs-fn">size</span>(), n=b.<span class="cs-fn">size</span>();
  <span class="cs-type">int</span> dp[m+<span class="cs-num">1</span>][n+<span class="cs-num">1</span>]={};
  <span class="cs-kw">for</span>(<span class="cs-type">int</span> i=<span class="cs-num">1</span>;i&lt;=m;i++)
    <span class="cs-kw">for</span>(<span class="cs-type">int</span> j=<span class="cs-num">1</span>;j&lt;=n;j++)
      <span class="cs-kw">if</span>(a[i-<span class="cs-num">1</span>]==b[j-<span class="cs-num">1</span>])
        dp[i][j]=dp[i-<span class="cs-num">1</span>][j-<span class="cs-num">1</span>]+<span class="cs-num">1</span>;
      <span class="cs-kw">else</span>
        dp[i][j]=max(dp[i-<span class="cs-num">1</span>][j], dp[i][j-<span class="cs-num">1</span>]);
  <span class="cs-kw">return</span> dp[m][n];
}`;
  buildRightPanel(csRightPanel(CODE,'O(m×n)','O(m×n)','Press ▶ Animate to watch the LCS table fill.'));

  function render(){
    const W=canvas.width, H=canvas.height;
    clearCanvas(); drawGrid(0.02);
    const m=s1.length, n=s2.length;
    const step=steps[stepIdx]||{dp:Array.from({length:m+1},()=>Array(n+1).fill(0)),r:-1,c:-1,match:false};
    const dp=step.dp;
    const maxCell=Math.min(42,Math.min((W-80)/(n+2),(H-80)/(m+2)));
    const ox=44, oy=40;

    // String header labels
    ctx.font='bold 13px "Space Mono",monospace'; ctx.textAlign='center';
    for(let j=0;j<=n;j++){
      ctx.fillStyle=j===0?'#2a4060':'#4a7aaa';
      ctx.fillText(j===0?'ε':s2[j-1],ox+(j+1)*maxCell+maxCell/2,oy-8);
    }
    for(let i=0;i<=m;i++){
      ctx.fillStyle=i===0?'#2a4060':'#4a7aaa';
      ctx.fillText(i===0?'ε':s1[i-1],ox+maxCell/2,oy+(i+1)*maxCell+maxCell/2+4);
    }

    // Cells
    for(let i=0;i<=m;i++) for(let j=0;j<=n;j++){
      const cx=ox+(j+1)*maxCell, cy=oy+(i+1)*maxCell;
      let bg='#050a10', border='#0f1e30', textC='#2a4060';
      if(dp[i][j]>0){bg='rgba(0,229,255,0.08)';border='#1a3050';textC='#5a7aaa';}
      if(i===step.r&&j===step.c){
        bg=step.match?'rgba(46,213,115,0.30)':'rgba(245,158,11,0.22)';
        border=step.match?'#2ed573':'#f59e0b'; textC=step.match?'#2ed573':'#f59e0b';
      }
      // Highlight row and col
      if((i===step.r||j===step.c)&&!(i===step.r&&j===step.c)){bg='rgba(255,255,255,0.02)';}
      ctx.fillStyle=bg; ctx.fillRect(cx+1,cy+1,maxCell-2,maxCell-2);
      ctx.strokeStyle=border; ctx.lineWidth=(i===step.r&&j===step.c)?2:0.8;
      ctx.strokeRect(cx+1,cy+1,maxCell-2,maxCell-2);
      ctx.fillStyle=textC; ctx.font=`bold ${Math.min(13,maxCell*0.35)}px "Space Mono",monospace`;
      ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(dp[i][j],cx+maxCell/2,cy+maxCell/2);
      ctx.textBaseline='alphabetic';
    }

    // Match indicator
    if(step.r>0&&step.c>0){
      ctx.strokeStyle=step.match?'rgba(46,213,115,0.4)':'rgba(245,158,11,0.25)';
      ctx.lineWidth=1.5; ctx.setLineDash([3,3]);
      ctx.strokeRect(ox+(step.c+1)*maxCell,oy,maxCell,oy+(step.r+1)*maxCell);
      ctx.strokeRect(ox,oy+(step.r+1)*maxCell,W,maxCell);
      ctx.setLineDash([]);
    }

    // Progress bar
    const prog=steps.length>0?stepIdx/steps.length:0;
    ctx.fillStyle='#0a1520'; ctx.fillRect(0,H-5,W,5);
    ctx.fillStyle='#818cf8'; ctx.fillRect(0,H-5,W*prog,5);
    ctx.textAlign='start';
    if(step.msg) csSetStep(step.msg); csHL(step.line||0);
  }

  document.getElementById('clcs_start').onclick=()=>{
    if(steps.length===0){steps=genSteps(s1,s2);stepIdx=0;}
    if(csAnimState) csAnimState.running=true;
  };
  document.getElementById('clcs_pause').onclick=()=>csStopEngine();
  document.getElementById('clcs_reset').onclick=()=>{csStopEngine();steps=[];stepIdx=0;csSetStep(`LCS of "${s1}" vs "${s2}". Press ▶ Animate.`);};

  csStartEngine(render);
  csAnimState.msPerStep=200;
  csAnimState.onTick=()=>{
    if(stepIdx<steps.length-1){stepIdx++;return false;}
    return true;
  };
}

// ══════════════════════════════════════════════════════════
//  0/1 KNAPSACK DP
// ══════════════════════════════════════════════════════════
function runKnapsack(){
  const items=[{w:2,v:6,n:'📦A'},{w:2,v:10,n:'📦B'},{w:3,v:12,n:'📦C'},{w:5,v:13,n:'📦D'},{w:4,v:8,n:'📦E'}];
  let W_cap=8, steps=[], stepIdx=0;

  function genSteps(items,W){
    const n=items.length;
    const dp=Array.from({length:n+1},()=>Array(W+1).fill(0));
    const steps=[{dp:dp.map(r=>[...r]),r:-1,c:-1,include:false,msg:'Initialize Knapsack DP table with zeros.'}];
    for(let i=1;i<=n;i++){
      const {w,v}=items[i-1];
      for(let j=0;j<=W;j++){
        if(j<w){
          dp[i][j]=dp[i-1][j];
          steps.push({dp:dp.map(r=>[...r]),r:i,c:j,include:false,line:8,msg:`Item ${i}(w=${w}): capacity ${j} < weight ${w} → skip → dp[${i}][${j}]=${dp[i][j]}`});
        } else {
          const incl=dp[i-1][j-w]+v, excl=dp[i-1][j];
          dp[i][j]=Math.max(incl,excl);
          steps.push({dp:dp.map(r=>[...r]),r:i,c:j,include:incl>excl,line:10,msg:`Item ${i}(w=${w},v=${v}): include(${incl}) vs skip(${excl}) → ${dp[i][j]}`});
        }
      }
    }
    steps.push({dp:dp.map(r=>[...r]),r:-1,c:-1,include:false,line:11,msg:`✅ Max value = ${dp[n][W]}`});
    return steps;
  }

  buildLeftPanel(`
    <div class="panel-section">
      <div class="panel-section-title">Items</div>
      <div style="font-family:'Space Mono',monospace;font-size:10px;color:var(--text2);line-height:2.0;background:var(--bg3);padding:10px;border-radius:8px;border:1px solid var(--border)">
        ${items.map((it,i)=>`<span style="color:var(--accent3)">${it.n}</span> w=${it.w} v=${it.v}`).join('<br>')}
      </div>
    </div>
    <div class="panel-section">
      <div class="panel-section-title">Parameters</div>
      ${makeSlider('ckp_w','Capacity W',4,15,W_cap,1,'',v=>{W_cap=v;steps=[];stepIdx=0;csStopEngine();})}
      ${makeSlider('ckp_spd','Speed',1,20,7,1,'',v=>{if(csAnimState)csAnimState.msPerStep=Math.max(20,600-v*26);})}
    </div>
    <div class="panel-section">
      <div class="panel-section-title">Controls</div>
      <button class="ctrl-btn primary" id="ckp_start">▶ Animate</button>
      <button class="ctrl-btn" id="ckp_pause">⏸ Pause</button>
      <button class="ctrl-btn danger" id="ckp_reset">↺ Reset</button>
    </div>
  `);
  const CODE=`<span class="cs-cm">// 0/1 Knapsack — O(n*W)</span>
<span class="cs-type">int</span> <span class="cs-fn">knapsack</span>(<span class="cs-type">int</span> W, <span class="cs-type">int</span> wt[], <span class="cs-type">int</span> val[], <span class="cs-type">int</span> n){
  <span class="cs-type">int</span> dp[n+<span class="cs-num">1</span>][W+<span class="cs-num">1</span>]={};
  <span class="cs-kw">for</span>(<span class="cs-type">int</span> i=<span class="cs-num">1</span>;i&lt;=n;i++)
    <span class="cs-kw">for</span>(<span class="cs-type">int</span> j=<span class="cs-num">0</span>;j&lt;=W;j++){
      <span class="cs-cm">// Start by excluding item i</span>
      dp[i][j]=dp[i-<span class="cs-num">1</span>][j];
      <span class="cs-cm">// Include if it fits and improves</span>
      <span class="cs-kw">if</span>(wt[i-<span class="cs-num">1</span>]&lt;=j)
        dp[i][j]=max(dp[i][j],
          dp[i-<span class="cs-num">1</span>][j-wt[i-<span class="cs-num">1</span>]]+val[i-<span class="cs-num">1</span>]);
    }
  <span class="cs-kw">return</span> dp[n][W];
}`;
  buildRightPanel(csRightPanel(CODE,'O(n×W)','O(n×W)','Press ▶ Animate to watch the DP table fill.'));

  function render(){
    const W=canvas.width, H=canvas.height;
    clearCanvas(); drawGrid(0.02);
    const n=items.length;
    const step=steps[stepIdx]||{dp:Array.from({length:n+1},()=>Array(W_cap+1).fill(0)),r:-1,c:-1,include:false};
    const dp=step.dp, Wc=W_cap;
    const cellW=Math.min(40,(W-70)/(Wc+2)), cellH=Math.min(34,(H-80)/(n+2));
    const ox=46, oy=36;

    // Headers
    ctx.font='bold 11px "Space Mono",monospace'; ctx.textAlign='center';
    ctx.fillStyle='#2a5070'; ctx.fillText('W→',ox+cellW*0.5,oy-6);
    for(let j=0;j<=Wc;j++){ctx.fillStyle='#3a6090'; ctx.fillText(j,ox+(j+1)*cellW+cellW/2,oy-6);}
    for(let i=0;i<=n;i++){
      ctx.fillStyle=i===0?'#2a4060':'#4a7aaa';
      ctx.fillText(i===0?'∅':items[i-1].n.slice(-1),ox+cellW/2,oy+(i+1)*cellH+cellH/2+4);
    }

    // Cells
    for(let i=0;i<=n;i++) for(let j=0;j<=Wc;j++){
      const cx=ox+(j+1)*cellW, cy=oy+(i+1)*cellH;
      let bg='#050a10', border='#0f1e30', textC='#1e3050';
      if(dp[i][j]>0){bg='rgba(129,140,248,0.12)';border='#1e2a50';textC='#6070a0';}
      if(i===step.r&&j===step.c){
        bg=step.include?'rgba(46,213,115,0.30)':'rgba(245,158,11,0.22)';
        border=step.include?'#2ed573':'#f59e0b'; textC=step.include?'#2ed573':'#f59e0b';
      }
      ctx.fillStyle=bg; ctx.fillRect(cx+1,cy+1,cellW-2,cellH-2);
      ctx.strokeStyle=border; ctx.lineWidth=(i===step.r&&j===step.c)?2:0.7;
      ctx.strokeRect(cx+1,cy+1,cellW-2,cellH-2);
      ctx.fillStyle=textC; ctx.font=`bold ${Math.min(11,cellW*0.30)}px "Space Mono",monospace`;
      ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(dp[i][j],cx+cellW/2,cy+cellH/2);
      ctx.textBaseline='alphabetic';
    }

    // Max value result box
    if(dp[n]&&dp[n][Wc]>0){
      ctx.fillStyle='rgba(46,213,115,0.15)'; ctx.fillRect(W/2-90,H-34,180,24);
      ctx.strokeStyle='#2ed573'; ctx.lineWidth=1.5; ctx.strokeRect(W/2-90,H-34,180,24);
      ctx.fillStyle='#2ed573'; ctx.font='bold 12px "Space Mono",monospace'; ctx.textAlign='center';
      ctx.fillText(`Max Value = ${dp[n][Wc]}  (Capacity ${Wc})`,W/2,H-16);
    }

    const prog=steps.length>0?stepIdx/steps.length:0;
    ctx.fillStyle='#0a1520'; ctx.fillRect(0,H-5,W,5);
    ctx.fillStyle='#a3e635'; ctx.fillRect(0,H-5,W*prog,5);
    ctx.textAlign='start';
    if(step.msg) csSetStep(step.msg); csHL(step.line||0);
  }

  document.getElementById('ckp_start').onclick=()=>{
    if(steps.length===0){steps=genSteps(items,W_cap);stepIdx=0;}
    if(csAnimState) csAnimState.running=true;
  };
  document.getElementById('ckp_pause').onclick=()=>csStopEngine();
  document.getElementById('ckp_reset').onclick=()=>{csStopEngine();steps=[];stepIdx=0;csSetStep('Press ▶ Animate to fill the Knapsack DP table.');};

  csStartEngine(render);
  csAnimState.msPerStep=200;
  csAnimState.onTick=()=>{
    if(stepIdx<steps.length-1){stepIdx++;return false;}
    return true;
  };
}

