//  BIT MANIPULATION — SUBSET BITMASK
// ══════════════════════════════════════════════════════════════════
function runSubsetBitmask() {
  const W=700,H=500;
  const ELEMS=['A','B','C','D'];
  let n=ELEMS.length, curMask=0, animIdx=0, playing=false;

  buildLeftPanel(`
    <div class="panel-section">
      <div class="panel-section-title">Controls</div>
      <button class="ctrl-btn primary" data-action="sb_play">▶ Animate All Subsets</button>
      <button class="ctrl-btn" data-action="sb_stop">⏸ Pause</button>
      <button class="ctrl-btn" data-action="sb_reset">↺ Reset</button>
    </div>
    <div class="panel-section">
      <div class="panel-section-title">Interact</div>
      <div style="font-family:'Space Mono',monospace;font-size:10px;color:var(--text3);line-height:1.8;padding:0 4px;">
        ◈ Click element blocks to toggle<br>◈ See binary rep live<br>◈ ${1<<n} total subsets
      </div>
    </div>`);

  buildRightPanel(csRightPanel(
    `<span class="cs-kw">for</span>(<span class="cs-type">int</span> mask=0; mask&lt;(1&lt;&lt;n); mask++) {\n  <span class="cs-kw">for</span>(<span class="cs-type">int</span> i=0;i&lt;n;i++) {\n    <span class="cs-kw">if</span>(mask >> i & 1)\n      cout &lt;&lt; elems[i] &lt;&lt; <span class="cs-str">" "</span>;\n  }\n  cout &lt;&lt; endl;\n}\n<span class="cs-cm">// Total: 2^n subsets</span>`,
    'O(2^n)', 'O(1)',
    'Click blocks to toggle elements. Animate shows all 2^n subsets.'
  ));

  // Click to toggle bits
  canvas.onclick=e=>{
    const r=canvas.getBoundingClientRect();
    const mx=(e.clientX-r.left)*(W/r.width);
    const bw=80, gap=20, totalW=n*(bw+gap)-gap;
    const sx=(W-totalW)/2;
    for(let i=0;i<n;i++){
      const bx=sx+i*(bw+gap);
      if(mx>=bx&&mx<=bx+bw){ curMask^=(1<<i); render(); }
    }
  };

  LAB['sb_play']=()=>{
    animIdx=0; playing=true;
    function step(){
      if(!playing||animIdx>=(1<<n)){ playing=false; return; }
      curMask=animIdx; animIdx++; render();
      const subset=[];
      for(let i=0;i<n;i++) if(curMask>>i&1) subset.push(ELEMS[i]);
      csHL(4); csSetStep(`Mask ${curMask.toString(2).padStart(n,'0')} = {${subset.join(',')||'∅'}} (${animIdx}/${1<<n})`);
      setTimeout(step, 400);
    }
    step();
  };
  LAB['sb_stop']=()=>{ playing=false; };
  LAB['sb_reset']=()=>{ curMask=0; playing=false; animIdx=0; render(); csSetStep('Mask reset to 0000 = empty set.'); };

  function render(){
    clearCanvas(); drawGrid(0.04);
    const bw=80, bh=80, gap=20;
    const totalW=n*(bw+gap)-gap;
    const sx=(W-totalW)/2, sy=H/2-40;

    // title
    ctx.save(); ctx.font='bold 14px "Nunito",sans-serif';
    ctx.fillStyle='var(--accent)';
    ctx.fillText(`Mask: ${curMask.toString(2).padStart(n,'0')} (${curMask})`, W/2-80, 36);
    ctx.restore();

    // element blocks
    for(let i=0;i<n;i++){
      const bx=sx+i*(bw+gap);
      const active=(curMask>>i)&1;
      ctx.save();
      ctx.fillStyle=active?'rgba(0,229,255,0.2)':'rgba(42,42,90,0.3)';
      ctx.strokeStyle=active?'#00e5ff':'#2a2a5a';
      ctx.lineWidth=active?2:1;
      ctx.beginPath(); ctx.roundRect(bx,sy,bw,bh,10);
      ctx.fill(); ctx.stroke();
      ctx.font=`bold 28px "Nunito",sans-serif`;
      ctx.fillStyle=active?'#00e5ff':'var(--text3)';
      ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(ELEMS[i],bx+bw/2,sy+bh/2);
      // bit label
      ctx.font='14px "Space Mono",monospace';
      ctx.fillStyle=active?'#00e5ff':'var(--text3)';
      ctx.fillText(active?'1':'0', bx+bw/2, sy+bh+20);
      ctx.fillText(`bit ${i}`, bx+bw/2, sy-14);
      ctx.restore();
    }

    // subset display
    const subset=[];
    for(let i=0;i<n;i++) if(curMask>>i&1) subset.push(ELEMS[i]);
    ctx.save(); ctx.font='bold 20px "Nunito",sans-serif';
    ctx.fillStyle='#b8ffb8'; ctx.textAlign='center';
    ctx.fillText(`Subset: { ${subset.join(', ')||'∅'} }`, W/2, sy+bh+60);

    // all subsets grid (small)
    ctx.font='9px "Space Mono",monospace'; ctx.fillStyle='var(--text3)'; ctx.textAlign='left';
    ctx.fillText('All subsets:', 20, H-80);
    for(let m=0;m<(1<<n);m++){
      const row=Math.floor(m/8), col=m%8;
      const bx=20+col*78, by=H-64+row*18;
      ctx.fillStyle=m===curMask?'#00e5ff':'var(--text3)';
      const s=[];
      for(let i=0;i<n;i++) if(m>>i&1) s.push(ELEMS[i]);
      ctx.fillText(`{${s.join('')||'∅'}}`, bx, by);
    }
    ctx.restore();
  }
  render();
  csSetStep(`Click element blocks to toggle bits. ${1<<n} total subsets. Press ▶ to animate.`);
}

// ══════════════════════════════════════════════════════════════════
//  XOR TRICKS
// ══════════════════════════════════════════════════════════════════
function runXorTricks() {
  const W=700,H=500;
  let mode='single', arr=[3,5,3,2,2,7,7,5,9], highlight=-1;

  buildLeftPanel(`
    <div class="panel-section">
      <div class="panel-section-title">Problem</div>
      <button class="ctrl-btn primary" data-action="xr_single">Single Non-Dup</button>
      <button class="ctrl-btn" data-action="xr_missing">Missing Number</button>
      <button class="ctrl-btn" data-action="xr_swap">XOR Swap</button>
    </div>
    <div class="panel-section">
      <div class="panel-section-title">Step</div>
      <button class="ctrl-btn" data-action="xr_step">▶ Next Step</button>
      <button class="ctrl-btn" data-action="xr_reset">↺ Reset</button>
    </div>`);

  buildRightPanel(csRightPanel(
    `<span class="cs-cm">// Find single non-duplicate:</span>\n<span class="cs-type">int</span> <span class="cs-fn">singleNum</span>(vector&lt;int&gt;&v){\n  <span class="cs-type">int</span> res=0;\n  <span class="cs-kw">for</span>(<span class="cs-type">int</span> x:v) res^=x;\n  <span class="cs-kw">return</span> res; <span class="cs-cm">// x^x=0, x^0=x</span>\n}\n<span class="cs-cm">// XOR swap (no temp):</span>\n<span class="cs-cm">// a^=b; b^=a; a^=b;</span>`,
    'O(n)', 'O(1)',
    'Choose a problem then step through the XOR operation.'
  ));

  let stepIdx=0, xorAcc=0, steps=[];

  function buildSteps(){
    steps=[]; xorAcc=0;
    if(mode==='single'){
      arr=[3,5,3,2,2,7,7,5,9];
      arr.forEach(v=>{ xorAcc^=v; steps.push({acc:xorAcc,idx:steps.length,val:v}); });
    } else if(mode==='missing'){
      arr=[1,2,4,5,6]; // missing 3 from 1..6
      let acc=0;
      for(let i=1;i<=6;i++) acc^=i;
      arr.forEach(v=>{ acc^=v; steps.push({acc,idx:steps.length,val:v}); });
      steps.forEach(s=>s.acc=acc);
    } else {
      arr=[42,17];
      steps=[{a:42,b:17,phase:0},{a:42^17,b:17,phase:1},{a:42^17,b:(42^17)^17,phase:2},{a:(42^17)^((42^17)^17),b:(42^17)^17,phase:3}];
    }
    stepIdx=0; highlight=-1;
  }
  buildSteps();

  LAB['xr_single']=()=>{ mode='single'; buildSteps(); render(); csSetStep('Single non-duplicate: XOR all elements. Pairs cancel out → only unique remains.'); };
  LAB['xr_missing']=()=>{ mode='missing'; buildSteps(); render(); csSetStep('Missing number: XOR(1..n) ^ XOR(array) → the missing number.'); };
  LAB['xr_swap']=()=>{ mode='swap'; buildSteps(); render(); csSetStep('XOR swap: a^=b; b^=a; a^=b; — no temporary variable needed!'); };
  LAB['xr_reset']=()=>{ buildSteps(); render(); csSetStep('Reset. Press ▶ Next Step to walk through.'); };
  LAB['xr_step']=()=>{
    if(stepIdx>=steps.length){ csSetStep('All steps done! Press ↺ Reset to replay.'); return; }
    highlight=stepIdx;
    const s=steps[stepIdx]; stepIdx++;
    if(mode==='swap'){
      const labels=['Initial: a=42, b=17','Step 1: a ^= b → a='+s.a,'Step 2: b ^= a → b='+s.b,'Step 3: a ^= b → a='+s.a+' ✅ Swapped!'];
      csHL(3); csSetStep(labels[s.phase]||'Done');
    } else {
      const bin=s.acc.toString(2).padStart(8,'0');
      csHL(5); csSetStep(`XOR with ${s.val}: accumulator = ${s.acc} (${bin})`);
    }
    render();
  };

  function render(){
    clearCanvas(); drawGrid(0.04);
    ctx.save();
    ctx.font='bold 13px "Nunito",sans-serif';
    ctx.fillStyle='var(--accent)';

    if(mode==='swap'){
      const phase=highlight>=0?steps[highlight].phase:0;
      const vals=[[42,17],[42^17,17],[(42^17),(42^17)^17],[42^17^((42^17)^17),(42^17)^17]];
      const [av,bv]=phase<vals.length?vals[phase]:vals[0];
      ctx.fillText('XOR Swap (no temp variable)',20,40);
      // box A
      ctx.fillStyle='rgba(0,229,255,0.15)'; ctx.strokeStyle='#00e5ff'; ctx.lineWidth=2;
      ctx.beginPath(); ctx.roundRect(150,180,160,80,12); ctx.fill(); ctx.stroke();
      ctx.fillStyle='#00e5ff'; ctx.font='bold 28px "Orbitron",monospace';
      ctx.textAlign='center'; ctx.fillText(`a = ${av}`,230,230);
      // box B
      ctx.fillStyle='rgba(191,95,255,0.15)'; ctx.strokeStyle='#bf5fff';
      ctx.beginPath(); ctx.roundRect(400,180,160,80,12); ctx.fill(); ctx.stroke();
      ctx.fillStyle='#bf5fff';
      ctx.fillText(`b = ${bv}`,480,230);
      ctx.textAlign='left';
      // binary
      ctx.font='14px "Space Mono",monospace'; ctx.fillStyle='var(--text2)';
      ctx.fillText(`a = ${av.toString(2).padStart(8,'0')}`,150,310);
      ctx.fillText(`b = ${bv.toString(2).padStart(8,'0')}`,400,310);
      if(phase===3){
        ctx.fillStyle='#00ffa3'; ctx.font='bold 18px "Nunito",sans-serif';
        ctx.fillText('✅ Swapped without temp!',200,370);
      }
    } else {
      const title=mode==='single'?'Find Single Non-Duplicate':'Find Missing Number (1..6)';
      ctx.fillStyle='var(--accent)'; ctx.font='bold 13px "Nunito",sans-serif';
      ctx.fillText(title,20,38);
      const bw=60,bh=50,gap=8,sy=90;
      const totalW=arr.length*(bw+gap)-gap;
      const sx=(W-totalW)/2;
      arr.forEach((v,i)=>{
        const bx=sx+i*(bw+gap);
        const active=i===highlight;
        const done=i<highlight;
        ctx.fillStyle=active?'rgba(0,229,255,0.3)':done?'rgba(42,42,90,0.6)':'rgba(42,42,90,0.3)';
        ctx.strokeStyle=active?'#00e5ff':done?'#3a3a80':'#2a2a5a';
        ctx.lineWidth=active?2:1;
        ctx.beginPath(); ctx.roundRect(bx,sy,bw,bh,8); ctx.fill(); ctx.stroke();
        ctx.fillStyle=active?'#00e5ff':done?'var(--text3)':'var(--text2)';
        ctx.font='bold 18px "Orbitron",monospace';
        ctx.textAlign='center'; ctx.fillText(v,bx+bw/2,sy+bh/2+6);
        ctx.font='9px "Space Mono",monospace'; ctx.fillStyle='var(--text3)';
        ctx.fillText(`[${i}]`,bx+bw/2,sy+bh+14);
        ctx.restore(); ctx.save();
      });
      // XOR accumulator
      const curAcc=highlight>=0?steps[highlight].acc:0;
      ctx.textAlign='center'; ctx.font='bold 16px "Space Mono",monospace';
      ctx.fillStyle='#00ffa3';
      ctx.fillText(`XOR accumulator: ${curAcc} = ${curAcc.toString(2).padStart(8,'0')}`,W/2,H/2+20);
      if(highlight===arr.length-1||highlight===steps.length-1){
        ctx.fillStyle='#00e5ff'; ctx.font='bold 22px "Nunito",sans-serif';
        ctx.fillText(`✅ Answer: ${curAcc}`,W/2,H/2+60);
      }
    }
    ctx.restore();
  }
  render();
  csSetStep('Choose a problem above, then press ▶ Next Step to walk through the XOR trick.');
}

// ══════════════════════════════════════════════════════════════════
//  POWER OF TWO CHECK
// ══════════════════════════════════════════════════════════════════
function runPowerOfTwo() {
  const W=700,H=500;
  let inputN=16, animBit=-1;

  buildLeftPanel(`
    <div class="panel-section">
      <div class="panel-section-title">Input Number</div>
      ${makeSlider('pt_n','Value n',1,64,16,1,'',v=>{ inputN=v; updateDisplay(); })}
    </div>
    <div class="panel-section">
      <div class="panel-section-title">Explore</div>
      <button class="ctrl-btn primary" data-action="pt_check">✓ Check Power of 2</button>
      <button class="ctrl-btn" data-action="pt_next">➜ Next Power of 2</button>
      <button class="ctrl-btn" data-action="pt_prev">← Prev Power of 2</button>
    </div>`);

  buildRightPanel(csRightPanel(
    `<span class="cs-type">bool</span> <span class="cs-fn">isPow2</span>(<span class="cs-type">int</span> n) {\n  <span class="cs-kw">return</span> n>0 && (n&(n-1))==0;\n}\n<span class="cs-cm">// n   = 1000 (8)</span>\n<span class="cs-cm">// n-1 = 0111 (7)</span>\n<span class="cs-cm">// AND = 0000 ✓</span>\n\n<span class="cs-cm">// Clear lowest bit:</span>\n<span class="cs-cm">// n &= (n-1)</span>\n<span class="cs-cm">// Isolate lowest:</span>\n<span class="cs-cm">// n & (-n)</span>`,
    'O(1)', 'O(1)',
    'Adjust slider to pick n. See binary representation and power-of-2 test.'
  ));

  LAB['pt_check']=()=>{ updateDisplay(true); };
  LAB['pt_next']=()=>{
    let k=inputN+1; while(k<=64&&(k&(k-1))!==0) k++;
    if(k<=64){ inputN=k; document.getElementById('s_pt_n').value=k; updateDataVal('pt_n',k); updateDisplay(true); }
  };
  LAB['pt_prev']=()=>{
    let k=inputN-1; while(k>=1&&(k&(k-1))!==0) k--;
    if(k>=1){ inputN=k; document.getElementById('s_pt_n').value=k; updateDataVal('pt_n',k); updateDisplay(true); }
  };

  function updateDisplay(announce=false){
    const n=inputN, nm1=n-1, result=(n>0&&(n&nm1)===0);
    if(announce) csSetStep(`${n} ${result?'IS ✅':'is NOT ❌'} a power of 2. n & (n-1) = ${n} & ${nm1} = ${n&nm1}`);
    render(n,nm1,result);
  }

  function renderBits(n, y, color, lbl) {
    const bits=8, bw=44, bh=44, gap=6, sx=(W-bits*(bw+gap)+gap)/2;
    ctx.save();
    ctx.fillStyle='var(--text2)'; ctx.font='12px "Space Mono",monospace'; ctx.textAlign='left';
    ctx.fillText(lbl, sx-60, y+bh/2+4);
    for(let i=bits-1;i>=0;i--){
      const bx=sx+(bits-1-i)*(bw+gap);
      const bit=(n>>i)&1;
      ctx.fillStyle=bit?(color+'33'):'rgba(42,42,90,0.3)';
      ctx.strokeStyle=bit?color:'#2a2a5a'; ctx.lineWidth=bit?2:1;
      ctx.beginPath(); ctx.roundRect(bx,y,bw,bh,8); ctx.fill(); ctx.stroke();
      ctx.fillStyle=bit?color:'var(--text3)';
      ctx.font='bold 18px "Orbitron",monospace'; ctx.textAlign='center';
      ctx.fillText(bit?'1':'0', bx+bw/2, y+bh/2+6);
      ctx.fillStyle='var(--text3)'; ctx.font='8px "Space Mono",monospace';
      ctx.fillText(`2^${i}`, bx+bw/2, y+bh+12);
    }
    ctx.restore();
  }

  function render(n,nm1,result){
    clearCanvas(); drawGrid(0.04);
    ctx.save();
    ctx.font='bold 22px "Orbitron",monospace'; ctx.fillStyle='var(--accent)'; ctx.textAlign='center';
    ctx.fillText(`n = ${n}`, W/2, 44);

    renderBits(n, 70, '#00e5ff', `n=${n}`);

    // AND symbol
    ctx.fillStyle='var(--text2)'; ctx.font='bold 20px "Space Mono",monospace'; ctx.textAlign='center';
    ctx.fillText('& (AND)', W/2, 165);

    renderBits(nm1, 178, '#bf5fff', `n-1=${nm1}`);

    ctx.fillStyle='rgba(42,42,90,0.5)'; ctx.strokeStyle='#2a2a5a'; ctx.lineWidth=1;
    ctx.beginPath(); ctx.moveTo(80,278); ctx.lineTo(W-80,278); ctx.stroke();

    renderBits(n&nm1, 286, result?'#ff4757':'#00ffa3', `=`);

    // verdict
    ctx.font='bold 22px "Nunito",sans-serif';
    ctx.fillStyle=result?'#00ffa3':'#ff4757';
    ctx.fillText(result?`✅ ${n} is a power of 2  (${Math.log2(n)|0} = 2^${Math.round(Math.log2(n))})`:`❌ ${n} is NOT a power of 2`, W/2, H-24);
    ctx.restore();
  }
  updateDisplay();
  csSetStep('Adjust slider or press Check. n & (n-1) = 0 ↔ exactly one set bit = power of 2.');
}

// ══════════════════════════════════════════════════════════════════
//  BITWISE SIEVE OF ERATOSTHENES
// ══════════════════════════════════════════════════════════════════
function runBitwiseSieve() {
  const W=700,H=500;
  let N=80, primes=[], composite=[], animStep=0, sieveP=2, running=false;

  function buildSieve(n){
    const sieve=new Uint8Array(n+1);
    primes=[2];
    for(let i=4;i<=n;i+=2) sieve[i]=1;
    for(let p=3;p*p<=n;p+=2){
      if(!sieve[p]) for(let m=p*p;m<=n;m+=2*p) sieve[m]=1;
    }
    for(let i=3;i<=n;i+=2) if(!sieve[i]) primes.push(i);
    composite=sieve;
    return primes;
  }

  buildLeftPanel(`
    <div class="panel-section">
      <div class="panel-section-title">Parameters</div>
      ${makeSlider('bs_n','Sieve up to N',20,120,80,1,'',v=>{ N=v; primes=buildSieve(N); render(); csSetStep(`Sieve built: ${primes.length} primes up to ${N}.`); })}
    </div>
    <div class="panel-section">
      <div class="panel-section-title">Controls</div>
      <button class="ctrl-btn primary" data-action="bs_run">▶ Animate Sieve</button>
      <button class="ctrl-btn" data-action="bs_instant">⚡ Instant</button>
      <button class="ctrl-btn" data-action="bs_reset">↺ Reset</button>
    </div>`);

  buildRightPanel(csRightPanel(
    `<span class="cs-cm">// Bitwise sieve (8× less memory)</span>\n<span class="cs-type">bitset</span>&lt;MAXN&gt; composite;\n<span class="cs-kw">void</span> <span class="cs-fn">sieve</span>(<span class="cs-type">int</span> n) {\n  composite[0]=composite[1]=1;\n  <span class="cs-kw">for</span>(<span class="cs-type">int</span> i=4;i&lt;=n;i+=2)\n    composite[i]=1;\n  <span class="cs-kw">for</span>(<span class="cs-type">int</span> p=3;p*p&lt;=n;p+=2)\n    <span class="cs-kw">if</span>(!composite[p])\n      <span class="cs-kw">for</span>(<span class="cs-type">int</span> m=p*p;m&lt;=n;m+=2*p)\n        composite[m]=1;\n}`,
    'O(N log log N)', 'O(N/8) bytes',
    'Watch numbers get marked composite as the sieve runs.'
  ));

  let animComposite=new Uint8Array(N+1), animP=2, animPhase='evens';

  LAB['bs_run']=()=>{
    animComposite=new Uint8Array(N+1); animP=2; animPhase='evens'; running=true;
    let evIdx=4;
    function step(){
      if(!running) return;
      if(animPhase==='evens'){
        if(evIdx<=N){ animComposite[evIdx]=1; evIdx+=2; csSetStep(`Marking even: ${evIdx-2} composite`); renderAnim(); setTimeout(step,60); }
        else{ animPhase='odd'; animP=3; step(); }
        return;
      }
      if(animP*animP>N){ running=false; csSetStep(`✅ Sieve complete! ${primes.length} primes ≤ ${N}`); renderAnim(); return; }
      if(animComposite[animP]){ animP+=2; step(); return; }
      let mIdx=animP*animP;
      function markNext(){
        if(mIdx>N){ animP+=2; setTimeout(step,100); return; }
        animComposite[mIdx]=1; mIdx+=2*animP;
        csSetStep(`p=${animP}: marking multiples... ${mIdx-2*animP}`);
        renderAnim(); setTimeout(markNext,80);
      }
      csSetStep(`Sieving with prime p=${animP}`);
      markNext();
    }
    step();
  };
  LAB['bs_instant']=()=>{ running=false; primes=buildSieve(N); animComposite=composite.slice(); renderAnim(); csSetStep(`✅ Done. ${primes.length} primes up to ${N}. Memory: ${Math.ceil((N+1)/8)} bytes (vs ${N+1} bytes).`); };
  LAB['bs_reset']=()=>{ running=false; animComposite=new Uint8Array(N+1); render(); csSetStep('Sieve cleared. Press ▶ Animate or ⚡ Instant.'); };

  function renderGrid(comp){
    const cols=Math.ceil(Math.sqrt(N)), rows=Math.ceil(N/cols);
    const bw=Math.min(52,Math.floor((W-60)/cols)), bh=Math.min(38,Math.floor((H-80)/rows));
    const sx=Math.floor((W-cols*bw)/2), sy=60;
    ctx.save();
    for(let num=2;num<=N;num++){
      const idx=num-2;
      const row=Math.floor(idx/cols), col=idx%cols;
      const bx=sx+col*bw, by=sy+row*bh;
      const isPrime=!comp[num]&&num>=2;
      const isComp=comp[num];
      ctx.fillStyle=isPrime?'rgba(0,229,255,0.2)':isComp?'rgba(255,71,87,0.1)':'rgba(42,42,90,0.15)';
      ctx.strokeStyle=isPrime?'#00e5ff':isComp?'#ff4757':'#2a2a5a';
      ctx.lineWidth=isPrime?2:0.5;
      ctx.beginPath(); ctx.roundRect(bx+1,by+1,bw-2,bh-2,4); ctx.fill(); ctx.stroke();
      ctx.fillStyle=isPrime?'#00e5ff':isComp?'rgba(255,71,87,0.5)':'var(--text3)';
      ctx.font=`${isPrime?'bold ':''}`+`${bw>40?'11':'9'}px "Space Mono",monospace`;
      ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(num, bx+bw/2, by+bh/2);
    }
    // legend
    ctx.fillStyle='#00e5ff'; ctx.font='10px "Space Mono",monospace'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.fillText(`◈ Prime (${primes.length})`, 16, H-36);
    ctx.fillStyle='rgba(255,71,87,0.7)';
    ctx.fillText('◈ Composite', 130, H-36);
    ctx.restore();
  }

  function renderAnim(){ clearCanvas(); drawGrid(0.03); renderGrid(animComposite); }
  function render(){ primes=buildSieve(N); clearCanvas(); drawGrid(0.03); renderGrid(composite); }
  render();
  csSetStep(`Sieve ready for N=${N}. Press ▶ Animate to watch numbers get marked.`);
}


