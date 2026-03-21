// ══════════════════════════════════════════════════════════════════
//  CRYPTOGRAPHY — RSA ENCRYPTION
// ══════════════════════════════════════════════════════════════════
function runRSA() {
  const CW=700, CH=500;
  const PRIME_PAIRS=[[11,17],[7,19],[13,23],[11,13],[17,19]];
  let pp=PRIME_PAIRS[0], p=pp[0], q=pp[1], M=7;
  let steps=[], stepIdx=0, timer=null, running=false;

  function gcd(a,b){while(b){let t=b;b=a%b;a=t;}return a;}
  function modpow(base,exp,mod){let r=1n;base=BigInt(base)%BigInt(mod);exp=BigInt(exp);mod=BigInt(mod);while(exp>0n){if(exp%2n===1n)r=r*base%mod;exp/=2n;base=base*base%mod;}return Number(r);}
  function extGcd(a,b){if(a===0)return[b,0,1];let[g,x,y]=extGcd(b%a,a);return[g,y-Math.floor(b/a)*x,x];}
  function modInverse(a,m){let[g,x]=extGcd(((a%m)+m)%m,m);return g!==1?-1:((x%m)+m)%m;}
  function rrect(c,x,y,w,h,r){c.beginPath();c.moveTo(x+r,y);c.lineTo(x+w-r,y);c.quadraticCurveTo(x+w,y,x+w,y+r);c.lineTo(x+w,y+h-r);c.quadraticCurveTo(x+w,y+h,x+w-r,y+h);c.lineTo(x+r,y+h);c.quadraticCurveTo(x,y+h,x,y+h-r);c.lineTo(x,y+r);c.quadraticCurveTo(x,y,x+r,y);c.closePath();}

  function buildSteps(){
    steps=[];
    const n=p*q, phi=(p-1)*(q-1);
    let e=3; while(e<phi&&gcd(e,phi)!==1) e+=2;
    const d=modInverse(e,phi), C=modpow(M,e,n), M2=modpow(C,d,n);
    steps.push({phase:'keys',p,q,n,phi,e,d,M,C,M2,msg:`Step 1: Choose primes p=${p}, q=${q}`,line:2});
    steps.push({phase:'n',  p,q,n,phi,e,d,M,C,M2,msg:`Step 2: n = ${p}×${q} = ${n}`,line:3});
    steps.push({phase:'phi',p,q,n,phi,e,d,M,C,M2,msg:`Step 3: φ(n) = (${p-1})(${q-1}) = ${phi}`,line:4});
    steps.push({phase:'e',  p,q,n,phi,e,d,M,C,M2,msg:`Step 4: Public e=${e} (coprime to φ(n))`,line:5});
    steps.push({phase:'d',  p,q,n,phi,e,d,M,C,M2,msg:`Step 5: Private d = e⁻¹ mod φ(n) = ${d}`,line:6});
    steps.push({phase:'enc',p,q,n,phi,e,d,M,C,M2,msg:`Step 6: Encrypt C = ${M}^${e} mod ${n} = ${C}`,line:9});
    steps.push({phase:'dec',p,q,n,phi,e,d,M,C,M2,msg:`Step 7: Decrypt M = ${C}^${d} mod ${n} = ${M2} ✓`,line:10});
    stepIdx=0;
  }

  const CODE=`<span class="cs-cm">// RSA Key Generation & Encryption</span>
<span class="cs-kw">void</span> <span class="cs-fn">RSA</span>(<span class="cs-type">int</span> p, <span class="cs-type">int</span> q, <span class="cs-type">int</span> M) {
  <span class="cs-type">long long</span> n   = p * q;              <span class="cs-cm">// modulus</span>
  <span class="cs-type">long long</span> phi = (p-<span class="cs-num">1</span>) * (q-<span class="cs-num">1</span>);  <span class="cs-cm">// totient</span>
  <span class="cs-type">long long</span> e   = pickCoprime(phi);  <span class="cs-cm">// public exp</span>
  <span class="cs-type">long long</span> d   = modInverse(e,phi); <span class="cs-cm">// private key</span>
  <span class="cs-cm">// Public(e,n)  Private(d,n)</span>
  <span class="cs-cm">// Encrypt:</span>
  <span class="cs-type">long long</span> C  = modPow(M,e,n);    <span class="cs-cm">// Mᵉ mod n</span>
  <span class="cs-type">long long</span> M2 = modPow(C,d,n);    <span class="cs-cm">// Cᵈ mod n</span>
}`;

  buildRightPanel(csRightPanel(CODE,'O(log² n)','O(log n)',
    'Watch RSA key generation step by step, then see plaintext transformed to ciphertext via modular exponentiation.'));

  const pairNames=PRIME_PAIRS.map(([a,b])=>`p=${a}, q=${b}`);
  buildLeftPanel(`
    <div class="panel-section-title">&gt; RSA PARAMS</div>
    <div class="param-group">
      <div class="param-label">Prime Pair</div>
      <select id="rsa_pair" style="font-family:'Space Mono',monospace;font-size:11px;background:var(--bg3);color:var(--text);border:1px solid var(--border);border-radius:6px;padding:4px 8px;width:100%;margin-top:4px;">
        ${pairNames.map((n,i)=>`<option value="${i}">${n}</option>`).join('')}
      </select>
    </div>
    <div class="param-group" style="margin-top:10px;">
      <div class="param-label"><span>Plaintext M</span><span class="param-value" id="rsa_m_val">7</span></div>
      <input type="range" id="rsa_m" class="param-slider" min="2" max="20" value="7">
    </div>
    <div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap;">
      <button class="ctrl-btn primary" id="rsa_start">▶ Start</button>
      <button class="ctrl-btn" id="rsa_step">⏭ Step</button>
      <button class="ctrl-btn" id="rsa_reset">↺ Reset</button>
    </div>
    <div class="step-box" id="rsa_step_info" style="margin-top:14px;">Choose params and press ▶ Start</div>
  `);

  document.getElementById('rsa_m').oninput=function(){M=parseInt(this.value);document.getElementById('rsa_m_val').textContent=M;buildSteps();renderRSA();};
  document.getElementById('rsa_pair').onchange=function(){pp=PRIME_PAIRS[parseInt(this.value)];p=pp[0];q=pp[1];buildSteps();renderRSA();};

  function csSetStepRSA(msg){const el=document.getElementById('rsa_step_info');if(el)el.textContent=msg;}

  function renderRSA(){
    const W=700,H=500;
    clearCanvas();
    const step=steps[stepIdx]||steps[steps.length-1];
    if(!step){csSetStepRSA('Press ▶ Start');return;}
    csHL(step.line||0);csSetStepRSA(step.msg||'');
    const cx=W/2,ph=step.phase,{n,phi,e,d,C,M2}=step;
    const amber='#f59e0b',cyan='#00e5ff',green='#00ffa3',purple='#bf5fff',red='#ff4757';
    ctx.textAlign='center';
    ctx.font='bold 14px "Orbitron",monospace';ctx.fillStyle=amber;ctx.fillText('RSA ENCRYPTION',cx,30);

    const boxW=118,boxH=44,gap=14;
    const row1y=55,row2y=55+boxH+gap;
    function drawBox(x,y,label,val,color,glow){
      ctx.save();if(glow){ctx.shadowColor=color;ctx.shadowBlur=18;}
      ctx.fillStyle=`${color}22`;ctx.strokeStyle=color;ctx.lineWidth=1.5;
      rrect(ctx,x-boxW/2,y,boxW,boxH,8);ctx.fill();ctx.stroke();ctx.shadowBlur=0;
      ctx.fillStyle=color;ctx.font='9px "Space Mono",monospace';ctx.textAlign='center';ctx.fillText(label,x,y+14);
      ctx.fillStyle='#e8e8ff';ctx.font='bold 15px "Orbitron",monospace';ctx.fillText(val!==undefined?val:'?',x,y+34);
      ctx.restore();
    }
    drawBox(cx-230,row1y,'PRIME p',step.p,amber,ph==='keys');
    drawBox(cx-100,row1y,'PRIME q',step.q,amber,ph==='keys');
    drawBox(cx+40, row1y,'n = p×q',ph==='keys'?'?':n,cyan,ph==='n');
    drawBox(cx+180,row1y,'φ(n)',['keys','n'].includes(ph)?'?':phi,purple,ph==='phi');
    drawBox(cx-100,row2y,'PUBLIC e',['keys','n','phi'].includes(ph)?'?':e,green,ph==='e');
    drawBox(cx+40, row2y,'PRIVATE d',['keys','n','phi','e'].includes(ph)?'?':d,red,ph==='d');

    // Encryption flow
    const fy=270;
    const fx1=60,fx2=W-60;
    ctx.strokeStyle='#2a2a5a';ctx.lineWidth=2;
    ctx.beginPath();ctx.moveTo(fx1,fy+22);ctx.lineTo(fx2,fy+22);ctx.stroke();
    function flowBox(x,label,val,color,lit){
      ctx.save();if(lit){ctx.shadowColor=color;ctx.shadowBlur=16;}
      ctx.fillStyle=lit?`${color}28`:'rgba(20,20,50,0.8)';
      ctx.strokeStyle=lit?color:'#2a2a5a';ctx.lineWidth=lit?2:1;
      rrect(ctx,x-48,fy,96,44,8);ctx.fill();ctx.stroke();ctx.shadowBlur=0;
      ctx.fillStyle=lit?color:'#5050a0';ctx.font='8px "Space Mono",monospace';ctx.textAlign='center';ctx.fillText(label,x,fy+13);
      ctx.fillStyle=lit?'#fff':'#3d5470';ctx.font='bold 14px "Orbitron",monospace';ctx.fillText(val!==undefined?val:'—',x,fy+34);
      ctx.restore();
    }
    function flowLabel(x1,x2,label,color){
      if(!label)return;ctx.fillStyle=color;ctx.font='8px "Space Mono",monospace';ctx.textAlign='center';ctx.fillText(label,(x1+x2)/2,fy-6);
    }
    flowBox(120,'PLAINTEXT',step.M,green,['enc','dec'].includes(ph));
    flowLabel(120,260,ph==='enc'?`M^${e} mod ${n}`:'',amber);
    flowBox(270,'ENCRYPT','',amber,ph==='enc');
    flowLabel(270,430,'','');
    flowBox(420,'CIPHERTEXT',['enc','dec'].includes(ph)?C:undefined,red,['enc','dec'].includes(ph));
    flowLabel(420,570,ph==='dec'?`C^${d} mod ${n}`:'',cyan);
    flowBox(570,'DECRYPT','',cyan,ph==='dec');
    flowLabel(570,W-60,'','');
    flowBox(W-60,'OUTPUT',ph==='dec'?M2:undefined,green,ph==='dec');

    if(['enc','dec'].includes(ph)){
      ctx.fillStyle=green+'cc';ctx.font='8px "Space Mono",monospace';ctx.textAlign='center';ctx.fillText(`Public(${e},${n})`,270,fy+56);
      ctx.fillStyle=red+'cc';ctx.fillText(`Private(${d},${n})`,570,fy+56);
    }
    if(ph==='dec'&&M2===step.M){
      ctx.save();ctx.shadowColor=green;ctx.shadowBlur=20;
      ctx.font='bold 15px "Nunito",sans-serif';ctx.fillStyle=green;ctx.textAlign='center';
      ctx.fillText(`✓ Decryption verified! M = ${M2}`,cx,H-20);ctx.restore();
    }
    ctx.textAlign='start';
  }

  buildSteps();renderRSA();

  document.getElementById('rsa_start').onclick=()=>{
    if(running){clearInterval(timer);running=false;document.getElementById('rsa_start').textContent='▶ Start';return;}
    if(stepIdx>=steps.length)stepIdx=0;
    running=true;document.getElementById('rsa_start').textContent='⏸ Pause';
    timer=setInterval(()=>{if(stepIdx<steps.length){renderRSA();stepIdx++;}else{clearInterval(timer);running=false;document.getElementById('rsa_start').textContent='▶ Start';}},900);
  };
  document.getElementById('rsa_step').onclick=()=>{if(stepIdx<steps.length){renderRSA();stepIdx++;}};
  document.getElementById('rsa_reset').onclick=()=>{clearInterval(timer);running=false;document.getElementById('rsa_start').textContent='▶ Start';stepIdx=0;buildSteps();renderRSA();};
}

// ══════════════════════════════════════════════════════════════════
//  CRYPTOGRAPHY — DIFFIE-HELLMAN KEY EXCHANGE
// ══════════════════════════════════════════════════════════════════
function runDiffieHellman(){
  const CW=700,CH=500;
  let g=5,p=23,a=6,b=15;
  let steps=[],stepIdx=0,timer=null,running=false;
  function modpow(base,exp,mod){let r=1n;base=BigInt(base)%BigInt(mod);exp=BigInt(exp);mod=BigInt(mod);while(exp>0n){if(exp%2n===1n)r=r*base%mod;exp/=2n;base=base*base%mod;}return Number(r);}
  const pubH=200;
  function privH(x){return(x*17+40)%360;}
  function mixH(h1,h2){return(h1+h2)/2;}

  const CODE=`<span class="cs-cm">// Diffie-Hellman Key Exchange</span>
<span class="cs-cm">// Public: prime p=${23}, generator g=${5}</span>
<span class="cs-type">int</span> A = modpow(g, a, p); <span class="cs-cm">// Alice → Bob</span>
<span class="cs-type">int</span> B = modpow(g, b, p); <span class="cs-cm">// Bob → Alice</span>
<span class="cs-cm">// Both compute shared secret:</span>
<span class="cs-type">int</span> Ka = modpow(B, a, p);<span class="cs-cm">// Bᵃ mod p</span>
<span class="cs-type">int</span> Kb = modpow(A, b, p);<span class="cs-cm">// Aᵇ mod p</span>
<span class="cs-cm">// Ka == Kb == g^(ab) mod p ✓</span>`;

  buildRightPanel(csRightPanel(CODE,'O(log² p)','O(log p)',
    'Alice and Bob mix their private color with the public color, exchange mixtures, then add their private color — arriving at the same shared secret.'));

  buildLeftPanel(`
    <div class="panel-section-title">&gt; DH PARAMS</div>
    <div class="param-group">
      <div class="param-label">Public prime p
        <select id="dh_p" style="font-family:'Space Mono',monospace;font-size:11px;background:var(--bg3);color:var(--text);border:1px solid var(--border);border-radius:6px;padding:3px 6px;margin-left:6px;">
          ${[23,29,31,37].map(v=>`<option value="${v}"${v===23?' selected':''}>${v}</option>`).join('')}
        </select>
      </div>
    </div>
    <div class="param-group" style="margin-top:8px;">
      <div class="param-label"><span>Generator g</span><span class="param-value" id="dh_g_val">5</span></div>
      <input type="range" id="dh_g" class="param-slider" min="2" max="10" value="5">
    </div>
    <div class="param-group">
      <div class="param-label"><span>Alice secret a</span><span class="param-value" id="dh_a_val">6</span></div>
      <input type="range" id="dh_a" class="param-slider" min="2" max="15" value="6">
    </div>
    <div class="param-group">
      <div class="param-label"><span>Bob secret b</span><span class="param-value" id="dh_b_val">15</span></div>
      <input type="range" id="dh_b" class="param-slider" min="2" max="15" value="15">
    </div>
    <div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap;">
      <button class="ctrl-btn primary" id="dh_start">▶ Animate</button>
      <button class="ctrl-btn" id="dh_reset">↺ Reset</button>
    </div>
    <div class="step-box" id="dh_step_info" style="margin-top:14px;">Set params and press ▶ Animate</div>
  `);

  function csSetStepDH(msg){const el=document.getElementById('dh_step_info');if(el)el.textContent=msg;}

  function buildSteps(){
    steps=[];
    const A=modpow(g,a,p),B=modpow(g,b,p),Ka=modpow(B,a,p),Kb=modpow(A,b,p);
    steps.push({phase:'public',  g,p,a,b,A,B,Ka,Kb,msg:`Public: g=${g}, p=${p}`,line:2});
    steps.push({phase:'aliceA',  g,p,a,b,A,B,Ka,Kb,msg:`Alice: A = ${g}^${a} mod ${p} = ${A}`,line:3});
    steps.push({phase:'bobB',    g,p,a,b,A,B,Ka,Kb,msg:`Bob: B = ${g}^${b} mod ${p} = ${B}`,line:4});
    steps.push({phase:'exchange',g,p,a,b,A,B,Ka,Kb,msg:`A=${A} → Bob. B=${B} → Alice. Eve sees only A,B,g,p!`,line:5});
    steps.push({phase:'aliceK',  g,p,a,b,A,B,Ka,Kb,msg:`Alice: Ka = ${B}^${a} mod ${p} = ${Ka}`,line:6});
    steps.push({phase:'bobK',    g,p,a,b,A,B,Ka,Kb,msg:`Bob: Kb = ${A}^${b} mod ${p} = ${Kb}`,line:7});
    steps.push({phase:'match',   g,p,a,b,A,B,Ka,Kb,msg:`✓ Ka = Kb = ${Ka} — Shared secret established!`,line:8});
    stepIdx=0;
  }

  function drawBucket(x,y,hue,label,sublabel,lit,size){
    size=size||52;
    ctx.save();if(lit){ctx.shadowColor=`hsl(${hue},80%,60%)`;ctx.shadowBlur=22;}
    ctx.fillStyle=`hsl(${hue},72%,42%)`;ctx.strokeStyle=lit?`hsl(${hue},90%,70%)`:'#2a2a5a';ctx.lineWidth=lit?2.5:1.5;
    ctx.beginPath();ctx.arc(x,y,size/2,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.shadowBlur=0;
    ctx.fillStyle='#fff';ctx.font=`bold ${size>48?10:9}px "Space Mono",monospace`;ctx.textAlign='center';ctx.fillText(label,x,y+4);
    if(sublabel){ctx.fillStyle='rgba(255,255,255,0.72)';ctx.font='8px "Space Mono",monospace';ctx.fillText(sublabel,x,y+size/2+14);}
    ctx.restore();
  }
  function drawArrow(x1,y1,x2,y2,color,label){
    ctx.save();ctx.strokeStyle=color;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();
    const ang=Math.atan2(y2-y1,x2-x1),al=10;
    ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(x2,y2);ctx.lineTo(x2-al*Math.cos(ang-0.4),y2-al*Math.sin(ang-0.4));ctx.lineTo(x2-al*Math.cos(ang+0.4),y2-al*Math.sin(ang+0.4));ctx.closePath();ctx.fill();
    if(label){ctx.fillStyle=color;ctx.font='9px "Space Mono",monospace';ctx.textAlign='center';ctx.fillText(label,(x1+x2)/2,(y1+y2)/2-8);}
    ctx.restore();
  }

  function renderDH(){
    const W=700,H=500;
    const s=steps[stepIdx]||steps[steps.length-1];
    if(!s)return;
    clearCanvas();csHL(s.line||0);csSetStepDH(s.msg||'');
    const cx=W/2,ph=s.phase,{g:sg,p:sp,a:sa,b:sb,A:sA,B:sB,Ka:sKa,Kb:sKb}=s;
    const pAH=privH(sa),pBH=privH(sb);
    const mAH=mixH(pubH,pAH),mBH=mixH(pubH,pBH);
    const shH=(mAH+sa*5)%360;

    ctx.textAlign='center';
    ctx.font='bold 13px "Orbitron",monospace';ctx.fillStyle='#10b981';ctx.fillText('DIFFIE-HELLMAN KEY EXCHANGE',cx,26);

    const alX=130,bobX=570,pubY=90,midY=230,shareY=380;

    // Public
    drawBucket(cx,pubY,pubH,`g=${sg}`,`p=${sp}`,ph==='public',58);
    ctx.fillStyle='#10b98199';ctx.font='9px "Space Mono",monospace';ctx.fillText('PUBLIC (Eve sees this)',cx,pubY+46);

    // Privates
    drawBucket(alX,155,pAH,`a=${sa}`,'Alice',ph==='aliceA',44);
    drawBucket(bobX,155,pBH,`b=${sb}`,'Bob',ph==='bobB',44);

    // A,B computed values
    const showA=!['public'].includes(ph);
    const showB=!['public','aliceA'].includes(ph);
    if(showA) drawBucket(alX,midY,mAH,`A=${sA}`,`g^${sa}`,ph==='aliceA'||ph==='exchange',44);
    if(showB) drawBucket(bobX,midY,mBH,`B=${sB}`,`g^${sb}`,ph==='bobB'||ph==='exchange',44);

    // Arrows
    if(['public','aliceA','bobB'].includes(ph)){
      ctx.setLineDash([5,4]);
      drawArrow(cx-28,pubY+28,alX+22,155-22,`hsl(${pubH},60%,55%)`,'g,p');
      drawArrow(cx+28,pubY+28,bobX-22,155-22,`hsl(${pubH},60%,55%)`,'');
      ctx.setLineDash([]);
    }
    if(['exchange','aliceK','bobK','match'].includes(ph)){
      drawArrow(alX+24,midY,bobX-24,midY,`hsl(${mAH},80%,60%)`,`A=${sA}`);
      drawArrow(bobX-24,midY+16,alX+24,midY+16,`hsl(${mBH},80%,60%)`,`B=${sB}`);
    }

    // Shared secrets
    if(['aliceK','bobK','match'].includes(ph)) drawBucket(alX,shareY,shH,`K=${sKa}`,'Alice K',ph!=='exchange',46);
    if(['bobK','match'].includes(ph)) drawBucket(bobX,shareY,shH,`K=${sKb}`,'Bob K',true,46);

    if(ph==='match'){
      ctx.save();ctx.shadowColor='#10b981';ctx.shadowBlur=20;
      ctx.font='bold 14px "Nunito",sans-serif';ctx.fillStyle='#10b981';
      ctx.fillText(`✓ SHARED SECRET = ${sKa}`,cx,H-26);ctx.restore();
      ctx.strokeStyle='#10b98166';ctx.lineWidth=2;ctx.setLineDash([8,4]);
      ctx.beginPath();ctx.moveTo(alX+26,shareY);ctx.lineTo(bobX-26,shareY);ctx.stroke();ctx.setLineDash([]);
    }
    ctx.fillStyle='#ff475744';ctx.font='9px "Space Mono",monospace';
    ctx.fillText('🔍 Eve sees: g, p, A, B only — cannot recover a, b',cx,H-8);
    ctx.textAlign='start';
  }

  buildSteps();renderDH();
  document.getElementById('dh_g').oninput=function(){g=parseInt(this.value);document.getElementById('dh_g_val').textContent=g;buildSteps();renderDH();};
  document.getElementById('dh_a').oninput=function(){a=parseInt(this.value);document.getElementById('dh_a_val').textContent=a;buildSteps();renderDH();};
  document.getElementById('dh_b').oninput=function(){b=parseInt(this.value);document.getElementById('dh_b_val').textContent=b;buildSteps();renderDH();};
  document.getElementById('dh_p').onchange=function(){p=parseInt(this.value);buildSteps();renderDH();};
  document.getElementById('dh_start').onclick=()=>{
    if(running){clearInterval(timer);running=false;document.getElementById('dh_start').textContent='▶ Animate';return;}
    stepIdx=0;running=true;document.getElementById('dh_start').textContent='⏸ Pause';
    timer=setInterval(()=>{renderDH();if(stepIdx<steps.length-1)stepIdx++;else{clearInterval(timer);running=false;document.getElementById('dh_start').textContent='▶ Animate';}},1100);
  };
  document.getElementById('dh_reset').onclick=()=>{clearInterval(timer);running=false;document.getElementById('dh_start').textContent='▶ Animate';stepIdx=0;buildSteps();renderDH();};
}

// ══════════════════════════════════════════════════════════════════
//  CRYPTOGRAPHY — AES SubBytes / ShiftRows
// ══════════════════════════════════════════════════════════════════
function runAESRound(){
  const SBOX=[0x63,0x7c,0x77,0x7b,0xf2,0x6b,0x6f,0xc5,0x30,0x01,0x67,0x2b,0xfe,0xd7,0xab,0x76,
    0xca,0x82,0xc9,0x7d,0xfa,0x59,0x47,0xf0,0xad,0xd4,0xa2,0xaf,0x9c,0xa4,0x72,0xc0,
    0xb7,0xfd,0x93,0x26,0x36,0x3f,0xf7,0xcc,0x34,0xa5,0xe5,0xf1,0x71,0xd8,0x31,0x15,
    0x04,0xc7,0x23,0xc3,0x18,0x96,0x05,0x9a,0x07,0x12,0x80,0xe2,0xeb,0x27,0xb2,0x75,
    0x09,0x83,0x2c,0x1a,0x1b,0x6e,0x5a,0xa0,0x52,0x3b,0xd6,0xb3,0x29,0xe3,0x2f,0x84,
    0x53,0xd1,0x00,0xed,0x20,0xfc,0xb1,0x5b,0x6a,0xcb,0xbe,0x39,0x4a,0x4c,0x58,0xcf,
    0xd0,0xef,0xaa,0xfb,0x43,0x4d,0x33,0x85,0x45,0xf9,0x02,0x7f,0x50,0x3c,0x9f,0xa8,
    0x51,0xa3,0x40,0x8f,0x92,0x9d,0x38,0xf5,0xbc,0xb6,0xda,0x21,0x10,0xff,0xf3,0xd2,
    0xcd,0x0c,0x13,0xec,0x5f,0x97,0x44,0x17,0xc4,0xa7,0x7e,0x3d,0x64,0x5d,0x19,0x73,
    0x60,0x81,0x4f,0xdc,0x22,0x2a,0x90,0x88,0x46,0xee,0xb8,0x14,0xde,0x5e,0x0b,0xdb,
    0xe0,0x32,0x3a,0x0a,0x49,0x06,0x24,0x5c,0xc2,0xd3,0xac,0x62,0x91,0x95,0xe4,0x79,
    0xe7,0xc8,0x37,0x6d,0x8d,0xd5,0x4e,0xa9,0x6c,0x56,0xf4,0xea,0x65,0x7a,0xae,0x08,
    0xba,0x78,0x25,0x2e,0x1c,0xa6,0xb4,0xc6,0xe8,0xdd,0x74,0x1f,0x4b,0xbd,0x8b,0x8a,
    0x70,0x3e,0xb5,0x66,0x48,0x03,0xf6,0x0e,0x61,0x35,0x57,0xb9,0x86,0xc1,0x1d,0x9e,
    0xe1,0xd9,0xab,0x9c,0xc0,0xa5,0xf2,0xd0,0xa1,0xe9,0x03,0x2e,0xb3,0x8b,0x44,0x72,
    0x40,0x06,0x9b,0x64,0x20,0xb1,0xfb,0x1a,0xc6,0xf3,0x4d,0x83,0x2c,0x1a,0xa4,0x84];

  function randState(){return Array.from({length:4},()=>Array.from({length:4},()=>Math.floor(Math.random()*256)));}
  function doSubBytes(st){return st.map(row=>row.map(b=>SBOX[b]!==undefined?SBOX[b]:((b*73+17)%256)));}
  function doShiftRows(st){return st.map((row,i)=>[...row.slice(i),...row.slice(0,i)]);}
  function rrect(c,x,y,w,h,r){c.beginPath();c.moveTo(x+r,y);c.lineTo(x+w-r,y);c.quadraticCurveTo(x+w,y,x+w,y+r);c.lineTo(x+w,y+h-r);c.quadraticCurveTo(x+w,y+h,x+w-r,y+h);c.lineTo(x+r,y+h);c.quadraticCurveTo(x,y+h,x,y+h-r);c.lineTo(x,y+r);c.quadraticCurveTo(x,y,x+r,y);c.closePath();}

  let origState=randState(),curState=origState.map(r=>[...r]);
  let subDone=false,shiftDone=false,highlightCell=null,timer=null,curAnimRow=-1;

  const CODE=`<span class="cs-cm">// AES SubBytes + ShiftRows</span>
<span class="cs-kw">void</span> <span class="cs-fn">SubBytes</span>(<span class="cs-type">byte</span> s[<span class="cs-num">4</span>][<span class="cs-num">4</span>]) {
  <span class="cs-kw">for</span>(<span class="cs-type">int</span> i=<span class="cs-num">0</span>;i&lt;<span class="cs-num">4</span>;i++)
    <span class="cs-kw">for</span>(<span class="cs-type">int</span> j=<span class="cs-num">0</span>;j&lt;<span class="cs-num">4</span>;j++)
      s[i][j]=SBOX[s[i][j]]; <span class="cs-cm">// GF(2⁸) inv</span>
}
<span class="cs-kw">void</span> <span class="cs-fn">ShiftRows</span>(<span class="cs-type">byte</span> s[<span class="cs-num">4</span>][<span class="cs-num">4</span>]) {
  <span class="cs-kw">for</span>(<span class="cs-type">int</span> i=<span class="cs-num">1</span>;i&lt;<span class="cs-num">4</span>;i++) <span class="cs-cm">// row i shifts ←i</span>
    <span class="cs-fn">rotateLeft</span>(s[i], i);
}`;

  buildRightPanel(csRightPanel(CODE,'O(16) per round','O(1)',
    'AES SubBytes replaces each byte via the S-Box (GF(2⁸) inverse). ShiftRows cyclically shifts row i left by i positions.'));

  buildLeftPanel(`
    <div class="panel-section-title">&gt; AES STATE</div>
    <div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap;">
      <button class="ctrl-btn primary" id="aes_subbytes">① SubBytes</button>
      <button class="ctrl-btn" id="aes_shiftrows">② ShiftRows</button>
      <button class="ctrl-btn" id="aes_reset">↺ New State</button>
    </div>
    <div class="param-group" style="margin-top:12px;">
      <div class="param-label"><span>Speed</span></div>
      <input type="range" id="aes_speed" class="param-slider" min="100" max="800" value="350">
    </div>
    <div class="step-box" id="aes_step_info" style="margin-top:14px;">Press ① SubBytes to start</div>
  `);

  function csSetStepAES(msg){const el=document.getElementById('aes_step_info');if(el)el.textContent=msg;}

  function byteColor(b){const h=(b/255)*200+100;return `hsl(${h|0},78%,58%)`;}

  function renderAES(){
    const W=700,H=500;
    clearCanvas();
    const cs=58,pad=6,tw=4*(cs+pad)-pad,th=4*(cs+pad)-pad;
    const lx=W/2-tw-36,rx=W/2+36,ty=(H-th)/2-14;

    ctx.textAlign='center';
    ctx.fillStyle='#06b6d4';ctx.font='10px "Space Mono",monospace';
    ctx.fillText(subDone?'AFTER SubBytes':'ORIGINAL STATE',lx+tw/2,ty-18);
    ctx.fillStyle='#bf5fff';
    ctx.fillText(shiftDone?'AFTER ShiftRows':(subDone?'AFTER SubBytes':'RESULT'),rx+tw/2,ty-18);

    function drawGrid(gx,gy,state,isRight){
      for(let r=0;r<4;r++){
        for(let c=0;c<4;c++){
          const x=gx+c*(cs+pad),y=gy+r*(cs+pad),val=state[r][c];
          const isHL=highlightCell&&highlightCell[0]===r&&highlightCell[1]===c;
          const isShR=curAnimRow===r&&isRight;
          const col=byteColor(val);
          ctx.save();
          if(isHL||isShR){ctx.shadowColor=col;ctx.shadowBlur=18;}
          ctx.fillStyle=isHL||isShR?`${col}44`:'rgba(13,13,40,0.85)';
          ctx.strokeStyle=isHL||isShR?col:'#2a2a5a';ctx.lineWidth=isHL||isShR?2:1;
          rrect(ctx,x,y,cs,cs,8);ctx.fill();ctx.stroke();ctx.shadowBlur=0;
          ctx.fillStyle=isHL||isShR?'#fff':col;ctx.font='bold 12px "Space Mono",monospace';ctx.textAlign='center';
          ctx.fillText('0x'+val.toString(16).padStart(2,'0').toUpperCase(),x+cs/2,y+cs/2+5);
          ctx.restore();
        }
      }
    }

    // Arrow
    ctx.fillStyle='#3a3a80';ctx.font='20px sans-serif';ctx.textAlign='center';ctx.fillText('⟶',W/2,ty+th/2+8);

    drawGrid(lx,ty,curState,false);
    let rState=subDone?doSubBytes(origState):curState.map(r=>[...r]);
    if(shiftDone)rState=doShiftRows(doSubBytes(origState));
    drawGrid(rx,ty,rState,true);

    if(highlightCell&&!subDone){
      const [r,c]=highlightCell,bv=curState[r][c];
      const sv=SBOX[bv]!==undefined?SBOX[bv]:((bv*73+17)%256);
      ctx.fillStyle='#f59e0b';ctx.font='10px "Space Mono",monospace';ctx.textAlign='center';
      ctx.fillText(`S-Box[0x${bv.toString(16).padStart(2,'0').toUpperCase()}] → 0x${sv.toString(16).padStart(2,'0').toUpperCase()}`,W/2,ty+th+36);
    }
    ctx.textAlign='start';
  }

  renderAES();

  document.getElementById('aes_subbytes').onclick=()=>{
    if(subDone){csSetStepAES('SubBytes done. Try ② ShiftRows next.');return;}
    clearInterval(timer);curAnimRow=-1;csHL(3);
    let r=0,c=0;
    timer=setInterval(()=>{
      highlightCell=[r,c];
      const bv=curState[r][c],sv=SBOX[bv]!==undefined?SBOX[bv]:((bv*73+17)%256);
      csSetStepAES(`SubBytes[${r}][${c}]: 0x${bv.toString(16).padStart(2,'0').toUpperCase()} → 0x${sv.toString(16).padStart(2,'0').toUpperCase()}`);
      renderAES();c++;if(c===4){c=0;r++;}
      if(r===4){clearInterval(timer);highlightCell=null;curState=doSubBytes(origState);subDone=true;csSetStepAES('SubBytes complete! Now press ② ShiftRows.');csHL(5);renderAES();}
    },parseInt(document.getElementById('aes_speed').value)||350);
  };

  document.getElementById('aes_shiftrows').onclick=()=>{
    if(!subDone){csSetStepAES('Run ① SubBytes first!');return;}
    if(shiftDone){csSetStepAES('ShiftRows done. Press ↺ for new state.');return;}
    clearInterval(timer);csHL(9);let r=1;
    timer=setInterval(()=>{
      curAnimRow=r;csSetStepAES(`ShiftRows: row ${r} shifted left by ${r}`);renderAES();r++;
      if(r===4){clearInterval(timer);curAnimRow=-1;shiftDone=true;curState=doShiftRows(curState);csSetStepAES('ShiftRows complete! AES diffusion applied. ✓');csHL(0);renderAES();}
    },650);
  };

  document.getElementById('aes_reset').onclick=()=>{
    clearInterval(timer);origState=randState();curState=origState.map(r=>[...r]);
    subDone=false;shiftDone=false;highlightCell=null;curAnimRow=-1;csHL(0);
    csSetStepAES('New state generated. Press ① SubBytes.');renderAES();
  };
}

// ══════════════════════════════════════════════════════════════════
//  CRYPTOGRAPHY — CAESAR & VIGENÈRE CIPHER
// ══════════════════════════════════════════════════════════════════
function runCaesarVigenere(){
  const CW=700,CH=500;
  let mode='caesar',shift=3,keyword='KEY',plaintext='HELLO';
  let animAngle=0,animIdx=-1;

  const CODE=`<span class="cs-cm">// Caesar: C=(P+k) mod 26</span>
<span class="cs-kw">char</span> <span class="cs-fn">caesarEnc</span>(<span class="cs-type">char</span> c,<span class="cs-type">int</span> k) {
  <span class="cs-kw">if</span>(!isalpha(c)) <span class="cs-kw">return</span> c;
  <span class="cs-kw">return</span> (c-<span class="cs-num">'A'</span>+k)%<span class="cs-num">26</span>+<span class="cs-num">'A'</span>;
}
<span class="cs-cm">// Vigenère: Cᵢ=(Pᵢ+K[i%L]) mod 26</span>
<span class="cs-fn">string</span> <span class="cs-fn">vigenereEnc</span>(string p,string key) {
  <span class="cs-type">int</span> L=key.<span class="cs-fn">size</span>();
  <span class="cs-kw">for</span>(<span class="cs-type">int</span> i=<span class="cs-num">0</span>;i&lt;p.<span class="cs-fn">size</span>();i++)
    p[i]=((p[i]-<span class="cs-num">'A'</span>+key[i%L]-<span class="cs-num">'A'</span>)%<span class="cs-num">26</span>)+<span class="cs-num">'A'</span>;
  <span class="cs-kw">return</span> p;
}`;

  buildRightPanel(csRightPanel(CODE,'O(n)','O(1)',
    'Rotate the inner ring by the shift amount to encode. Caesar uses a constant rotation; Vigenère rotates differently per character based on the keyword.'));

  buildLeftPanel(`
    <div class="panel-section-title">&gt; CIPHER PARAMS</div>
    <div style="display:flex;gap:6px;margin-bottom:10px;">
      <button class="ctrl-btn primary" id="cv_caesar">Caesar</button>
      <button class="ctrl-btn" id="cv_vigenere">Vigenère</button>
    </div>
    <div class="param-group" id="cv_shift_wrap">
      <div class="param-label"><span>Caesar Shift</span><span class="param-value" id="cv_shift_lbl">3</span></div>
      <input type="range" id="cv_shift" class="param-slider" min="1" max="25" value="3">
    </div>
    <div class="param-group" id="cv_kw_wrap" style="display:none;">
      <div class="param-label">Keyword</div>
      <input type="text" id="cv_keyword" value="KEY" maxlength="8" style="font-family:'Space Mono',monospace;font-size:12px;background:var(--bg3);color:var(--accent);border:1px solid var(--border);border-radius:6px;padding:4px 8px;width:100%;box-sizing:border-box;margin-top:4px;">
    </div>
    <div class="param-group">
      <div class="param-label">Plaintext (A-Z)</div>
      <input type="text" id="cv_plain" value="HELLO" maxlength="8" style="font-family:'Space Mono',monospace;font-size:12px;background:var(--bg3);color:var(--text);border:1px solid var(--border);border-radius:6px;padding:4px 8px;width:100%;box-sizing:border-box;text-transform:uppercase;margin-top:4px;">
    </div>
    <div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap;">
      <button class="ctrl-btn primary" id="cv_animate">▶ Animate</button>
      <button class="ctrl-btn" id="cv_reset">↺ Reset</button>
    </div>
    <div class="step-box" id="cv_step_info" style="margin-top:14px;">Set params and press ▶ Animate</div>
  `);

  function csSetStepCV(msg){const el=document.getElementById('cv_step_info');if(el)el.textContent=msg;}

  function cipher(pt){
    const p=pt.toUpperCase().replace(/[^A-Z]/g,'');
    if(mode==='caesar') return p.split('').map(c=>String.fromCharCode(((c.charCodeAt(0)-65+shift)%26)+65)).join('');
    const k=keyword.toUpperCase().replace(/[^A-Z]/g,'')||'A';
    return p.split('').map((c,i)=>String.fromCharCode(((c.charCodeAt(0)-65+(k.charCodeAt(i%k.length)-65))%26)+65)).join('');
  }

  function rrectCV(c,x,y,w,h,r){c.beginPath();c.moveTo(x+r,y);c.lineTo(x+w-r,y);c.quadraticCurveTo(x+w,y,x+w,y+r);c.lineTo(x+w,y+h-r);c.quadraticCurveTo(x+w,y+h,x+w-r,y+h);c.lineTo(x+r,y+h);c.quadraticCurveTo(x,y+h,x,y+h-r);c.lineTo(x,y+r);c.quadraticCurveTo(x,y,x+r,y);c.closePath();}

  function drawRing(angle){
    const W=700,H=500,cx=230,cy=H/2+10;
    clearCanvas();
    const OR=150,IR=92,LOR=174,LIR=72;
    const alpha=Array.from({length:26},(_,i)=>String.fromCharCode(65+i));

    // Outer ring border circles
    ctx.strokeStyle='#3a3a80';ctx.lineWidth=2;
    ctx.beginPath();ctx.arc(cx,cy,OR,0,Math.PI*2);ctx.stroke();
    ctx.beginPath();ctx.arc(cx,cy,OR-24,0,Math.PI*2);ctx.stroke();
    // Inner ring border circles
    ctx.strokeStyle='#1a1a5a';ctx.lineWidth=1.5;
    ctx.beginPath();ctx.arc(cx,cy,IR,0,Math.PI*2);ctx.stroke();
    ctx.beginPath();ctx.arc(cx,cy,IR-24,0,Math.PI*2);ctx.stroke();

    // Outer letters (plaintext, fixed)
    for(let i=0;i<26;i++){
      const a=(i/26)*Math.PI*2-Math.PI/2;
      ctx.strokeStyle='#1a1a40';ctx.lineWidth=1;
      ctx.beginPath();ctx.moveTo(cx+(OR-3)*Math.cos(a),cy+(OR-3)*Math.sin(a));ctx.lineTo(cx+(OR-23)*Math.cos(a),cy+(OR-23)*Math.sin(a));ctx.stroke();
      ctx.save();ctx.translate(cx+LOR*Math.cos(a),cy+LOR*Math.sin(a));ctx.rotate(a+Math.PI/2);
      ctx.font='bold 11px "Space Mono",monospace';ctx.textAlign='center';ctx.fillStyle='#7a94b0';ctx.fillText(alpha[i],0,4);ctx.restore();
    }

    // Inner letters (cipher, rotated)
    for(let i=0;i<26;i++){
      const a=(i/26)*Math.PI*2-Math.PI/2+angle;
      ctx.save();ctx.translate(cx+LIR*Math.cos(a),cy+LIR*Math.sin(a));ctx.rotate(a+Math.PI/2);
      ctx.font='bold 11px "Space Mono",monospace';ctx.textAlign='center';ctx.fillStyle='#8b5cf6';ctx.fillText(alpha[i],0,4);ctx.restore();
    }

    // Hub
    ctx.save();ctx.shadowColor='#8b5cf6';ctx.shadowBlur=16;
    ctx.fillStyle='#10082a';ctx.strokeStyle='#8b5cf6';ctx.lineWidth=2;
    ctx.beginPath();ctx.arc(cx,cy,28,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.shadowBlur=0;
    ctx.fillStyle='#8b5cf6';ctx.font='bold 10px "Orbitron",monospace';ctx.textAlign='center';
    ctx.fillText(mode==='caesar'?`+${shift}`:'VIG',cx,cy+4);ctx.restore();

    // Pointer
    ctx.fillStyle='#f59e0b';
    ctx.beginPath();ctx.moveTo(cx,cy-OR-8);ctx.lineTo(cx-6,cy-OR+6);ctx.lineTo(cx+6,cy-OR+6);ctx.closePath();ctx.fill();

    // Table panel (right side)
    const pt=plaintext.toUpperCase().replace(/[^A-Z]/g,'').slice(0,8);
    const ct=cipher(pt);
    const tx=cx+OR+44,ty=42,tw2=260,th2=H-62;
    ctx.fillStyle='rgba(14,10,40,0.92)';rrectCV(ctx,tx,ty,tw2,th2,12);ctx.fill();
    ctx.strokeStyle='#2a2a5a';ctx.lineWidth=1;rrectCV(ctx,tx,ty,tw2,th2,12);ctx.stroke();
    ctx.fillStyle='#8b5cf6';ctx.font='bold 10px "Orbitron",monospace';ctx.textAlign='left';
    ctx.fillText(mode==='caesar'?'CAESAR CIPHER':'VIGENÈRE CIPHER',tx+14,ty+20);
    ctx.fillStyle='#3a3a80';ctx.fillRect(tx+14,ty+26,tw2-28,1);
    ctx.fillStyle='#4a4a70';ctx.font='9px "Space Mono",monospace';
    ctx.fillText('PLAIN  KEY  →  CIPHER',tx+14,ty+40);

    for(let i=0;i<pt.length;i++){
      const ky=mode==='vigenere'?(keyword.toUpperCase().replace(/[^A-Z]/g,'')||'A')[i%Math.max(1,(keyword.toUpperCase().replace(/[^A-Z]/g,'')||'A').length)]:'';
      const ry=ty+52+i*40;
      const isA=animIdx===i;
      if(isA){
        ctx.save();ctx.shadowColor='#8b5cf6';ctx.shadowBlur=8;
        ctx.fillStyle='rgba(139,92,246,0.18)';rrectCV(ctx,tx+8,ry-14,tw2-16,34,6);ctx.fill();ctx.restore();
      }
      ctx.fillStyle=isA?'#fff':'#7a94b0';ctx.font=`bold 14px "Space Mono",monospace`;ctx.textAlign='left';
      ctx.fillText(pt[i],tx+18,ry+6);
      const sV=mode==='caesar'?shift:((keyword.toUpperCase().replace(/[^A-Z]/g,'')||'A').charCodeAt(i%Math.max(1,(keyword.toUpperCase().replace(/[^A-Z]/g,'')||'A').length))-65);
      if(mode==='vigenere'){ctx.fillStyle='#fdcb6e';ctx.font='12px "Space Mono",monospace';ctx.fillText(`+${ky}`,tx+42,ry+6);}
      ctx.fillStyle='#5050a0';ctx.font='11px "Space Mono",monospace';ctx.fillText('→',tx+(mode==='vigenere'?74:40),ry+6);
      ctx.fillStyle=isA?'#8b5cf6':'#00e5ff';ctx.font='bold 14px "Space Mono",monospace';
      ctx.fillText(ct[i],tx+(mode==='vigenere'?96:62),ry+6);
      ctx.fillStyle='#3d5470';ctx.font='8px "Space Mono",monospace';
      ctx.fillText(`(${pt.charCodeAt(i)-65}+${sV})%26`,tx+136,ry+6);
    }
    ctx.textAlign='start';
  }

  drawRing(0);

  document.getElementById('cv_caesar').onclick=()=>{
    mode='caesar';
    document.getElementById('cv_caesar').classList.add('primary');document.getElementById('cv_vigenere').classList.remove('primary');
    document.getElementById('cv_shift_wrap').style.display='';document.getElementById('cv_kw_wrap').style.display='none';
    csHL(2);animIdx=-1;drawRing(animAngle);csSetStepCV('Caesar mode active');
  };
  document.getElementById('cv_vigenere').onclick=()=>{
    mode='vigenere';
    document.getElementById('cv_vigenere').classList.add('primary');document.getElementById('cv_caesar').classList.remove('primary');
    document.getElementById('cv_shift_wrap').style.display='none';document.getElementById('cv_kw_wrap').style.display='';
    csHL(7);animIdx=-1;drawRing(animAngle);csSetStepCV('Vigenère mode active');
  };
  document.getElementById('cv_shift').oninput=function(){shift=parseInt(this.value);document.getElementById('cv_shift_lbl').textContent=shift;animAngle=(shift/26)*Math.PI*2;drawRing(animAngle);csSetStepCV(`Shift = ${shift}`);};
  document.getElementById('cv_keyword').oninput=function(){keyword=this.value.toUpperCase();drawRing(animAngle);};
  document.getElementById('cv_plain').oninput=function(){plaintext=this.value.toUpperCase();animIdx=-1;drawRing(animAngle);};

  let cvTimer=null;
  document.getElementById('cv_animate').onclick=()=>{
    const pt=plaintext.toUpperCase().replace(/[^A-Z]/g,'').slice(0,8);
    if(!pt.length){csSetStepCV('Enter plaintext first!');return;}
    clearInterval(cvTimer);animIdx=-1;let idx=0;
    cvTimer=setInterval(()=>{
      animIdx=idx;
      const sV=mode==='caesar'?shift:((keyword.toUpperCase().replace(/[^A-Z]/g,'')||'A').charCodeAt(idx%Math.max(1,(keyword.toUpperCase().replace(/[^A-Z]/g,'')||'A').length))-65);
      const tA=(sV/26)*Math.PI*2;
      let t=0;const startA=animAngle;
      const spin=setInterval(()=>{t++;animAngle=startA+(tA-startA)*(t/14);drawRing(animAngle);if(t>=14){clearInterval(spin);animAngle=tA;}},22);
      csHL(mode==='caesar'?4:10);csSetStepCV(`'${pt[idx]}' + ${sV} → '${cipher(pt)[idx]}'`);
      idx++;if(idx>pt.length){clearInterval(cvTimer);animIdx=-1;csSetStepCV(`Done: ${pt} → ${cipher(pt)}`);}
    },750);
  };
  document.getElementById('cv_reset').onclick=()=>{clearInterval(cvTimer);animIdx=-1;animAngle=0;csHL(0);csSetStepCV('Reset.');drawRing(0);};
}

// ══════════════════════════════════════════════════════════════════
//  CRYPTOGRAPHY — SHA-256 HASHING
// ══════════════════════════════════════════════════════════════════
function runSHA256(){
  const CW=700,CH=500;
  let inputText='hello';
  let steps=[],stepIdx=0,timerSHA=null,runningSHA=false;

  const H0=[0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19];
  function rotr32(x,n){return((x>>>n)|(x<<(32-n)))>>>0;}

  function sha256Sim(msg){
    const mb=Array.from(msg).map(c=>c.charCodeAt(0));
    const bitLen=mb.length*8;mb.push(0x80);
    while(mb.length%64!==56)mb.push(0);
    for(let i=7;i>=0;i--)mb.push((bitLen/Math.pow(2,i*8))&0xff);
    const W=[];
    for(let i=0;i<16;i++)W.push(((mb[i*4]||0)<<24)|((mb[i*4+1]||0)<<16)|((mb[i*4+2]||0)<<8)|(mb[i*4+3]||0));
    for(let i=16;i<20;i++){const s0=rotr32(W[i-15],7)^rotr32(W[i-15],18)^(W[i-15]>>>3),s1=rotr32(W[i-2],17)^rotr32(W[i-2],19)^(W[i-2]>>>10);W.push((W[i-16]+s0+W[i-7]+s1)>>>0);}
    return{W,mb:mb.slice(0,16)};
  }

  function buildSteps(){
    steps=[];const txt=inputText||'hello';const{W,mb}=sha256Sim(txt);
    steps.push({phase:'input', text:txt, msg:`Input: "${txt}" = ${txt.length*8} bits`,line:1});
    steps.push({phase:'pad',   mb, msg:`Padding: append 0x80, zeros, 64-bit length → ${Math.ceil((txt.length+9)/64)*64} bytes`,line:2});
    steps.push({phase:'block', W:W.slice(0,8), msg:`Parse block: W[0]=0x${W[0]?.toString(16).padStart(8,'0').toUpperCase()}`,line:3});
    steps.push({phase:'sched', W:W.slice(0,16), msg:'Schedule: extend W[0..15] with σ₀,σ₁ rotations',line:6});
    steps.push({phase:'round0',msg:`Round 0: T₁=h+Σ₁(e)+Ch+K[0]+W[0], T₂=Σ₀(a)+Maj`,line:8});
    steps.push({phase:'round8',msg:'Round 8: mixing continues... bitwise rotations and XOR',line:9});
    steps.push({phase:'add',   msg:'Compression: add 8 working words back to H₀–H₇',line:11});
    steps.push({phase:'hash',  text:txt, msg:`Hash complete! SHA-256("${txt}") = 256-bit output ✓`,line:1});
    stepIdx=0;
  }

  const CODE=`<span class="cs-cm">// SHA-256 compression</span>
<span class="cs-kw">void</span> <span class="cs-fn">sha256</span>(uint32 W[],uint32 H[]) {
  <span class="cs-cm">// Padding + parse 16 words</span>
  <span class="cs-cm">// Schedule:</span>
  <span class="cs-kw">for</span>(<span class="cs-type">int</span> i=<span class="cs-num">16</span>;i&lt;<span class="cs-num">64</span>;i++)
    W[i]=W[i-<span class="cs-num">16</span>]+σ₀(W[i-<span class="cs-num">15</span>])+W[i-<span class="cs-num">7</span>]+σ₁(W[i-<span class="cs-num">2</span>]);
  <span class="cs-kw">for</span>(<span class="cs-type">int</span> i=<span class="cs-num">0</span>;i&lt;<span class="cs-num">64</span>;i++) {
    T1=h+Σ₁(e)+Ch(e,f,g)+K[i]+W[i];
    T2=Σ₀(a)+Maj(a,b,c);
  }
  <span class="cs-kw">for</span>(<span class="cs-type">int</span> j=<span class="cs-num">0</span>;j&lt;<span class="cs-num">8</span>;j++) H[j]+=state[j];
}`;

  buildRightPanel(csRightPanel(CODE,'O(n)','O(1)',
    'SHA-256 pads to 512-bit blocks, runs 64 rounds of bitwise rotations (σ,Σ), Ch, and Maj functions. 1-bit input change → ~128 output bits flip.'));

  buildLeftPanel(`
    <div class="panel-section-title">&gt; SHA-256 INPUT</div>
    <div class="param-group">
      <div class="param-label">Input Text</div>
      <input type="text" id="sha_input" value="hello" style="font-family:'Space Mono',monospace;font-size:11px;background:var(--bg3);color:var(--text);border:1px solid var(--border);border-radius:6px;padding:4px 8px;width:100%;box-sizing:border-box;margin-top:4px;">
    </div>
    <div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap;">
      <button class="ctrl-btn primary" id="sha_start">▶ Hash</button>
      <button class="ctrl-btn" id="sha_step">⏭ Step</button>
      <button class="ctrl-btn" id="sha_reset">↺ Reset</button>
    </div>
    <div class="step-box" id="sha_step_info" style="margin-top:14px;">Enter text and press ▶ Hash</div>
    <div style="margin-top:8px;font-family:'Space Mono',monospace;font-size:8px;color:var(--text3);word-break:break-all;" id="sha_hash_out"></div>
  `);

  function csSetStepSHA(msg){const el=document.getElementById('sha_step_info');if(el)el.textContent=msg;}
  async function realSHA(m){try{const b=new TextEncoder().encode(m),h=await crypto.subtle.digest('SHA-256',b);return Array.from(new Uint8Array(h)).map(x=>x.toString(16).padStart(2,'0')).join('');}catch(e){return 'unavailable';}}

  function rrectSH(c,x,y,w,h,r){c.beginPath();c.moveTo(x+r,y);c.lineTo(x+w-r,y);c.quadraticCurveTo(x+w,y,x+w,y+r);c.lineTo(x+w,y+h-r);c.quadraticCurveTo(x+w,y+h,x+w-r,y+h);c.lineTo(x+r,y+h);c.quadraticCurveTo(x,y+h,x,y+h-r);c.lineTo(x,y+r);c.quadraticCurveTo(x,y,x+r,y);c.closePath();}

  function renderSHA(){
    const W=700,H=500,cx=W/2;
    clearCanvas();
    const step=steps[stepIdx]||steps[steps.length-1];
    if(!step){csSetStepSHA('Press ▶ Hash');return;}
    csHL(step.line||0);csSetStepSHA(step.msg||'');
    const ph=step.phase;
    const red='#ef4444',orange='#f59e0b',cyan='#00e5ff',green='#00ffa3',purple='#bf5fff';

    ctx.textAlign='center';
    ctx.font='bold 13px "Orbitron",monospace';ctx.fillStyle=red;ctx.fillText('SHA-256 HASHING',cx,28);

    // Pipeline bar
    const stages=[
      {l:'INPUT',  c:orange,  a:ph==='input'},
      {l:'PAD',    c:'#fdcb6e',a:ph==='pad'},
      {l:'PARSE',  c:cyan,    a:ph==='block'},
      {l:'SCHED',  c:purple,  a:ph==='sched'},
      {l:'ROUNDS', c:green,   a:ph==='round0'||ph==='round8'},
      {l:'ADD',    c:'#10b981',a:ph==='add'},
      {l:'HASH',   c:red,     a:ph==='hash'},
    ];
    const sw=74,sy=48,sg=6,stot=stages.length*(sw+sg)-sg,sx0=(W-stot)/2;
    stages.forEach((st,i)=>{
      const bx=sx0+i*(sw+sg);
      ctx.save();if(st.a){ctx.shadowColor=st.c;ctx.shadowBlur=12;}
      ctx.fillStyle=st.a?`${st.c}28`:'rgba(14,14,40,0.6)';ctx.strokeStyle=st.a?st.c:'#2a2a5a';ctx.lineWidth=st.a?2:1;
      ctx.fillRect(bx,sy,sw,22);ctx.strokeRect(bx,sy,sw,22);ctx.shadowBlur=0;
      ctx.fillStyle=st.a?st.c:'#3d5470';ctx.font=`${st.a?'bold ':''}9px "Space Mono",monospace`;ctx.textAlign='center';ctx.fillText(st.l,bx+sw/2,sy+14);
      if(i<stages.length-1){ctx.fillStyle='#2a2a5a';ctx.fillText('▸',bx+sw+sg/2+1,sy+14);}
      ctx.restore();
    });

    const my=92;

    if(ph==='input'){
      const txt=step.text||'hello';
      ctx.fillStyle=orange;ctx.font='bold 20px "Space Mono",monospace';ctx.fillText(`"${txt}"`,cx,my+34);
      ctx.fillStyle='#5050a0';ctx.font='11px "Space Mono",monospace';ctx.fillText(`${txt.length} chars × 8 bits = ${txt.length*8} bits`,cx,my+58);
      const chars=txt.slice(0,8);
      const bx0=cx-chars.length*34;
      chars.split('').forEach((c,i)=>{
        const bx=bx0+i*68;
        ctx.fillStyle='rgba(245,158,11,0.14)';ctx.strokeStyle='#f59e0b55';ctx.lineWidth=1;
        ctx.fillRect(bx,my+70,62,48);ctx.strokeRect(bx,my+70,62,48);
        ctx.fillStyle=orange;ctx.font='bold 16px "Space Mono",monospace';ctx.fillText(c,bx+31,my+94);
        ctx.fillStyle='#7a94b0';ctx.font='9px "Space Mono",monospace';ctx.fillText('0x'+c.charCodeAt(0).toString(16).toUpperCase(),bx+31,my+110);
      });
    }
    else if(ph==='pad'){
      const mb=step.mb||[];
      ctx.fillStyle='#5050a0';ctx.font='10px "Space Mono",monospace';ctx.fillText('Padded block (first 16 bytes):',cx,my+18);
      mb.slice(0,16).forEach((b,i)=>{
        const col=i<(inputText.length)?orange:i===inputText.length?'#ff4757':'#2a2a5a';
        const bx=W/2-8*34+i*34,by=my+28;
        ctx.fillStyle=`${col}1a`;ctx.strokeStyle=col+'66';ctx.lineWidth=1;
        ctx.fillRect(bx,by,32,28);ctx.strokeRect(bx,by,32,28);
        ctx.fillStyle=col;ctx.font='9px "Space Mono",monospace';ctx.textAlign='center';
        ctx.fillText('0x'+b.toString(16).padStart(2,'0').toUpperCase(),bx+16,by+17);
      });
      ctx.fillStyle='#ff4757';ctx.font='9px "Space Mono",monospace';
      ctx.fillText('▲ 0x80 padding byte',W/2-(8-Math.min(inputText.length,7))*34,my+72);
    }
    else if(ph==='block'||ph==='sched'){
      const wA=step.W||[];
      ctx.fillStyle='#5050a0';ctx.font='10px "Space Mono",monospace';
      ctx.fillText(ph==='block'?'W[0..7]: first 8 message words':'Message schedule W[0..15]',cx,my+18);
      wA.slice(0,8).forEach((w,i)=>{
        const bx=W/2-4*80+i*80,by=my+30,hue=(i*30+140)%360;
        ctx.fillStyle=`hsl(${hue},55%,18%)`;ctx.strokeStyle=`hsl(${hue},75%,50%)`;ctx.lineWidth=1;
        ctx.fillRect(bx,by,76,42);ctx.strokeRect(bx,by,76,42);
        ctx.fillStyle=`hsl(${hue},80%,68%)`;ctx.font='8px "Space Mono",monospace';ctx.textAlign='center';ctx.fillText(`W[${i}]`,bx+38,by+14);
        ctx.fillStyle='#e8e8ff';ctx.font='9px "Space Mono",monospace';ctx.fillText('0x'+w.toString(16).padStart(8,'0').slice(0,6).toUpperCase(),bx+38,by+30);
      });
      if(ph==='sched'&&wA.length>8){
        wA.slice(8,16).forEach((w,i)=>{
          const bx=W/2-4*80+i*80,by=my+86,hue=((i+8)*30+140)%360;
          ctx.fillStyle=`hsl(${hue},55%,18%)`;ctx.strokeStyle=`hsl(${hue},75%,50%)`;ctx.lineWidth=1;
          ctx.fillRect(bx,by,76,42);ctx.strokeRect(bx,by,76,42);
          ctx.fillStyle=`hsl(${hue},80%,68%)`;ctx.font='8px "Space Mono",monospace';ctx.textAlign='center';ctx.fillText(`W[${i+8}]`,bx+38,by+14);
          ctx.fillStyle='#e8e8ff';ctx.font='9px "Space Mono",monospace';ctx.fillText('0x'+w.toString(16).padStart(8,'0').slice(0,6).toUpperCase(),bx+38,by+30);
        });
        ctx.fillStyle=purple;ctx.font='9px "Space Mono",monospace';ctx.fillText('σ₀(x)=ROTR⁷⊕ROTR¹⁸⊕SHR³  |  σ₁(x)=ROTR¹⁷⊕ROTR¹⁹⊕SHR¹⁰',cx,my+148);
      }
    }
    else if(ph==='round0'||ph==='round8'){
      const labels=['a','b','c','d','e','f','g','h'];
      ctx.fillStyle='#5050a0';ctx.font='10px "Space Mono",monospace';ctx.fillText('State words H₀–H₇ (fractional parts of square roots of primes)',cx,my+18);
      H0.forEach((v,i)=>{
        const bx=W/2-4*78+i*78,by=my+30,hue=(i*35+100)%360;
        ctx.fillStyle=`hsl(${hue},55%,18%)`;ctx.strokeStyle=`hsl(${hue},75%,54%)`;ctx.lineWidth=1.5;
        ctx.fillRect(bx,by,74,46);ctx.strokeRect(bx,by,74,46);
        ctx.fillStyle=`hsl(${hue},80%,70%)`;ctx.font='bold 14px "Space Mono",monospace';ctx.textAlign='center';ctx.fillText(labels[i],bx+37,by+22);
        ctx.fillStyle='#7a94b0';ctx.font='8px "Space Mono",monospace';ctx.fillText('0x'+v.toString(16).slice(0,6),bx+37,by+38);
      });
      const mY=my+98;
      ctx.strokeStyle='#bf5fff88';ctx.lineWidth=2;
      ctx.beginPath();ctx.moveTo(W/2-280,mY);ctx.bezierCurveTo(W/2-280,mY+36,W/2+280,mY+36,W/2+280,mY);ctx.stroke();
      ctx.fillStyle=purple;ctx.font='10px "Space Mono",monospace';
      ctx.fillText(`T₁ = h + Σ₁(e) + Ch(e,f,g) + K[${ph==='round0'?0:8}] + W[${ph==='round0'?0:8}]`,cx,mY+26);
      ctx.fillText('T₂ = Σ₀(a) + Maj(a,b,c) → rotate all words',cx,mY+42);
      ctx.fillStyle=green;ctx.font='9px "Space Mono",monospace';
      ctx.fillText('Σ₀=ROTR²⊕ROTR¹³⊕ROTR²²  |  Σ₁=ROTR⁶⊕ROTR¹¹⊕ROTR²⁵',cx,mY+58);
    }
    else if(ph==='add'){
      ctx.fillStyle='#10b981';ctx.font='11px "Space Mono",monospace';ctx.fillText('Add compressed state words back to initial H₀–H₇',cx,my+24);
      H0.forEach((v,i)=>{
        const bx=W/2-4*78+i*78,by=my+38,hue=(i*35+100)%360;
        ctx.fillStyle=`hsl(${hue},55%,16%)`;ctx.strokeStyle='#10b98166';ctx.lineWidth=1.5;
        ctx.fillRect(bx,by,74,44);ctx.strokeRect(bx,by,74,44);
        ctx.fillStyle='#10b981';ctx.font='9px "Space Mono",monospace';ctx.textAlign='center';ctx.fillText(`H${i}+state`,bx+37,by+20);
        ctx.fillStyle='#7a94b0';ctx.font='8px "Space Mono",monospace';ctx.fillText('↓ XOR',bx+37,by+34);
      });
      ctx.fillStyle='#5050a0';ctx.font='10px "Space Mono",monospace';ctx.fillText('→ Concat 8×32-bit = 256-bit digest',cx,my+106);
    }
    else if(ph==='hash'){
      ctx.fillStyle=red;ctx.font='11px "Space Mono",monospace';ctx.fillText(`"${step.text}" →`,cx,my+24);
      const hexStr='a9993e364706816aba3e25717850c26c9cd0d89d0056f6';
      const cw2=15,tot=hexStr.length*cw2,hY=my+42;
      hexStr.split('').forEach((c,i)=>{const h=(i*9+i*i*2)%360;ctx.fillStyle=`hsl(${h},75%,58%)`;ctx.font='bold 12px "Space Mono",monospace';ctx.textAlign='center';ctx.fillText(c,W/2-tot/2+i*cw2+7,hY+16);});
      ctx.strokeStyle='#ef444466';ctx.lineWidth=1;ctx.strokeRect(W/2-tot/2-4,hY,tot+8,24);
      ctx.fillStyle='#5050a0';ctx.font='9px "Space Mono",monospace';ctx.fillText('(SHA-256 of "abc" shown for illustration)',cx,hY+40);
      ctx.fillStyle=red+'99';ctx.font='9px "Space Mono",monospace';ctx.fillText('⚠ Change 1 bit of input → ~128 bits flip (avalanche)',cx,hY+56);
      const bY=hY+70;
      for(let i=0;i<64;i++){ctx.fillStyle=Math.random()>0.5?red+'88':'#1a1a38';ctx.fillRect(W/2-256+i*8,bY,7,14);}
      ctx.fillStyle='#5050a0';ctx.font='9px "Space Mono",monospace';ctx.fillText('256 output bits (visual)',cx,bY+28);
    }
    ctx.textAlign='start';
  }

  buildSteps();renderSHA();
  realSHA(inputText).then(h=>{const el=document.getElementById('sha_hash_out');if(el)el.textContent='SHA-256: '+h;});

  document.getElementById('sha_input').oninput=function(){
    inputText=this.value||'hello';buildSteps();renderSHA();
    realSHA(inputText).then(h=>{const el=document.getElementById('sha_hash_out');if(el)el.textContent='SHA-256: '+h;});
  };
  document.getElementById('sha_start').onclick=()=>{
    if(runningSHA){clearInterval(timerSHA);runningSHA=false;document.getElementById('sha_start').textContent='▶ Hash';return;}
    stepIdx=0;runningSHA=true;document.getElementById('sha_start').textContent='⏸ Pause';
    timerSHA=setInterval(()=>{renderSHA();if(stepIdx<steps.length-1)stepIdx++;else{clearInterval(timerSHA);runningSHA=false;document.getElementById('sha_start').textContent='▶ Hash';}},1000);
  };
  document.getElementById('sha_step').onclick=()=>{if(stepIdx<steps.length){renderSHA();stepIdx++;}};
  document.getElementById('sha_reset').onclick=()=>{clearInterval(timerSHA);runningSHA=false;document.getElementById('sha_start').textContent='▶ Hash';stepIdx=0;buildSteps();renderSHA();};
}

// ══════════════════════════════════════════════════════════════════


// ══════════════════════════════════════════════════════════
//  CRYPTOGRAPHY QUIZ LAUNCHERS
// ══════════════════════════════════════════════════════════
function launchRSAQuiz(){
  const PAIRS=[[11,17],[7,19],[13,23],[11,13]];
  const [p,q]=PAIRS[Math.floor(Math.random()*PAIRS.length)];
  const n=p*q,phi=(p-1)*(q-1);
  function gcd(a,b){while(b){let t=b;b=a%b;a=t;}return a;}
  function extGcd(a,b){if(a===0)return[b,0,1];let[g,x,y]=extGcd(b%a,a);return[g,y-Math.floor(b/a)*x,x];}
  function modInv(a,m){let[g,x]=extGcd(((a%m)+m)%m,m);return g===1?((x%m)+m)%m:-1;}
  let e=3;while(e<phi&&gcd(e,phi)!==1)e+=2;
  const d=modInv(e,phi);
  function modpow(b,ex,m){let r=1n;b=BigInt(b)%BigInt(m);ex=BigInt(ex);m=BigInt(m);while(ex>0n){if(ex%2n===1n)r=r*b%m;ex/=2n;b=b*b%m;}return Number(r);}
  const M=5,C=modpow(M,e,n);
  function shuf(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
  const qs=[
    {q:`p=${p}, q=${q} → n = p×q = ?`,a:n,ch:shuf([n,p*p,q*q,n+1].map(Number))},
    {q:`n=${n} → φ(n) = (p-1)(q-1) = ?`,a:phi,ch:shuf([phi,phi+1,phi-1,n-p].map(Number))},
    {q:`e=${e}. Private d = e⁻¹ mod φ(${phi}) = ?`,a:d,ch:shuf([d,(d+3)%phi||1,(d+7)%phi||2,(d*2)%phi||3].map(Number))},
    {q:`M=${M}: C = ${M}^${e} mod ${n} = ?`,a:C,ch:shuf([C,(C+2)%n||1,(C+5)%n||4,(C*2)%n||7].map(Number))},
  ];
  const ov=createQuizOverlay('RSA Quiz','#f59e0b');
  let score=0,qIdx=0;
  function showQ(){
    if(qIdx>=qs.length){showQuizResult(ov,score,qs.length,'RSA','#f59e0b');return;}
    const q=qs[qIdx],body=ov.querySelector('.quiz-body');
    body.innerHTML=`<div style="font-size:13px;color:#f59e0b;margin-bottom:18px;line-height:1.6;">${q.q}</div><div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">${q.ch.slice(0,4).map(c=>`<button class="quiz-choice" data-val="${c}" style="background:rgba(245,158,11,0.08);border:1px solid rgba(245,158,11,0.3);border-radius:10px;padding:12px;color:#e8e8ff;font-family:'Space Mono',monospace;font-size:13px;cursor:pointer;">${c}</button>`).join('')}</div>`;
    body.querySelectorAll('.quiz-choice').forEach(btn=>{btn.onclick=()=>{const v=parseInt(btn.dataset.val);if(v===q.a)score++;btn.style.background=v===q.a?'rgba(0,255,163,0.2)':'rgba(255,71,87,0.2)';btn.style.borderColor=v===q.a?'#00ffa3':'#ff4757';body.querySelectorAll('.quiz-choice').forEach(b=>{b.disabled=true;if(parseInt(b.dataset.val)===q.a)b.style.borderColor='#00ffa3';});setTimeout(()=>{qIdx++;showQ();},900);};});
  }
  showQ();
}

function launchDHQuiz(){
  function modpow(b,ex,m){let r=1n;b=BigInt(b)%BigInt(m);ex=BigInt(ex);m=BigInt(m);while(ex>0n){if(ex%2n===1n)r=r*b%m;ex/=2n;b=b*b%m;}return Number(r);}
  const g=5,p=23,a=6,b=15,A=modpow(g,a,p),B=modpow(g,b,p),K=modpow(B,a,p);
  function shuf(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
  const qs=[
    {q:`g=${g}, p=${p}, a=${a}. Alice's A = g^a mod p = ?`,a:A,ch:shuf([A,(A+3)%p||1,(A+7)%p||4,(A*2)%p||5])},
    {q:`b=${b}. Bob's B = g^b mod p = ?`,a:B,ch:shuf([B,(B+2)%p||2,(B+5)%p||3,(B*2)%p||8])},
    {q:`Alice gets B=${B}. Shared K = B^a mod p = ?`,a:K,ch:shuf([K,(K+3)%p||1,(K+6)%p||2,(K+9)%p||3])},
  ];
  const ov=createQuizOverlay('Diffie-Hellman Quiz','#10b981');
  let score=0,qIdx=0;
  function showQ(){
    if(qIdx>=qs.length){showQuizResult(ov,score,qs.length,'Diffie-Hellman','#10b981');return;}
    const q=qs[qIdx],body=ov.querySelector('.quiz-body');
    body.innerHTML=`<div style="font-size:13px;color:#10b981;margin-bottom:18px;line-height:1.6;">${q.q}</div><div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">${q.ch.slice(0,4).map(c=>`<button class="quiz-choice" data-val="${c}" style="background:rgba(16,185,129,0.08);border:1px solid rgba(16,185,129,0.3);border-radius:10px;padding:12px;color:#e8e8ff;font-family:'Space Mono',monospace;font-size:13px;cursor:pointer;">${c}</button>`).join('')}</div>`;
    body.querySelectorAll('.quiz-choice').forEach(btn=>{btn.onclick=()=>{const v=parseInt(btn.dataset.val);if(v===q.a)score++;btn.style.background=v===q.a?'rgba(0,255,163,0.2)':'rgba(255,71,87,0.2)';btn.style.borderColor=v===q.a?'#00ffa3':'#ff4757';body.querySelectorAll('.quiz-choice').forEach(b=>{b.disabled=true;if(parseInt(b.dataset.val)===q.a)b.style.borderColor='#00ffa3';});setTimeout(()=>{qIdx++;showQ();},900);};});
  }
  showQ();
}

function launchAESQuiz(){
  function shuf(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
  const qs=[
    {q:'S-Box[0x00] = ? (first entry of AES S-Box)',a:'0x63',ch:['0x63','0x7c','0x00','0xff']},
    {q:'ShiftRows: row 2 (0-indexed) shifts left by how many?',a:'2',ch:['0','1','2','3']},
    {q:'ShiftRows: row 0 shifts left by how many?',a:'0',ch:['0','1','2','3']},
    {q:'AES-128 runs how many total rounds?',a:'10',ch:['8','10','12','14']},
  ];
  qs.forEach(q=>q.ch=shuf(q.ch));
  const ov=createQuizOverlay('AES Quiz','#06b6d4');
  let score=0,qIdx=0;
  function showQ(){
    if(qIdx>=qs.length){showQuizResult(ov,score,qs.length,'AES','#06b6d4');return;}
    const q=qs[qIdx],body=ov.querySelector('.quiz-body');
    body.innerHTML=`<div style="font-size:13px;color:#06b6d4;margin-bottom:18px;line-height:1.6;">${q.q}</div><div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">${q.ch.map(c=>`<button class="quiz-choice" data-val="${c}" style="background:rgba(6,182,212,0.08);border:1px solid rgba(6,182,212,0.3);border-radius:10px;padding:12px;color:#e8e8ff;font-family:'Space Mono',monospace;font-size:13px;cursor:pointer;">${c}</button>`).join('')}</div>`;
    body.querySelectorAll('.quiz-choice').forEach(btn=>{btn.onclick=()=>{const v=btn.dataset.val;if(v===q.a)score++;btn.style.background=v===q.a?'rgba(0,255,163,0.2)':'rgba(255,71,87,0.2)';btn.style.borderColor=v===q.a?'#00ffa3':'#ff4757';body.querySelectorAll('.quiz-choice').forEach(b=>{b.disabled=true;if(b.dataset.val===q.a)b.style.borderColor='#00ffa3';});setTimeout(()=>{qIdx++;showQ();},900);};});
  }
  showQ();
}

function launchCaesarQuiz(){
  function shuf(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
  const qs=[
    {q:"Caesar k=3: 'A' → ?",a:'D',ch:['C','D','E','F']},
    {q:"Caesar k=3: 'Z' → ? (wraps)",a:'C',ch:['A','B','C','D']},
    {q:"Vigenère key='KEY'(K=10). 'A'→?",a:'K',ch:shuf(['E','K','Y','Z'])},
    {q:'Caesar shift=13 is known as?',a:'ROT13',ch:['ROT13','ROT26','BASE64','XOR']},
  ];
  const ov=createQuizOverlay('Caesar & Vigenère Quiz','#8b5cf6');
  let score=0,qIdx=0;
  function showQ(){
    if(qIdx>=qs.length){showQuizResult(ov,score,qs.length,'Caesar & Vigenère','#8b5cf6');return;}
    const q=qs[qIdx],body=ov.querySelector('.quiz-body');
    body.innerHTML=`<div style="font-size:13px;color:#8b5cf6;margin-bottom:18px;line-height:1.6;">${q.q}</div><div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">${q.ch.map(c=>`<button class="quiz-choice" data-val="${c}" style="background:rgba(139,92,246,0.08);border:1px solid rgba(139,92,246,0.3);border-radius:10px;padding:12px;color:#e8e8ff;font-family:'Space Mono',monospace;font-size:13px;cursor:pointer;">${c}</button>`).join('')}</div>`;
    body.querySelectorAll('.quiz-choice').forEach(btn=>{btn.onclick=()=>{const v=btn.dataset.val;if(v===q.a)score++;btn.style.background=v===q.a?'rgba(0,255,163,0.2)':'rgba(255,71,87,0.2)';btn.style.borderColor=v===q.a?'#00ffa3':'#ff4757';body.querySelectorAll('.quiz-choice').forEach(b=>{b.disabled=true;if(b.dataset.val===q.a)b.style.borderColor='#00ffa3';});setTimeout(()=>{qIdx++;showQ();},900);};});
  }
  showQ();
}

function launchSHAQuiz(){
  function shuf(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
  const qs=[
    {q:'SHA-256 processes input in blocks of how many bits?',a:'512',ch:shuf(['128','256','512','1024'])},
    {q:'SHA-256 output is always how many bits?',a:'256',ch:shuf(['128','256','512','64'])},
    {q:'Rounds per 512-bit block in SHA-256?',a:'64',ch:shuf(['32','48','64','128'])},
    {q:'1-bit input change → ~50% output bits flip. This is called?',a:'Avalanche',ch:shuf(['Diffusion','Avalanche','Confusion','Padding'])},
  ];
  const ov=createQuizOverlay('SHA-256 Quiz','#ef4444');
  let score=0,qIdx=0;
  function showQ(){
    if(qIdx>=qs.length){showQuizResult(ov,score,qs.length,'SHA-256','#ef4444');return;}
    const q=qs[qIdx],body=ov.querySelector('.quiz-body');
    body.innerHTML=`<div style="font-size:13px;color:#ef4444;margin-bottom:18px;line-height:1.6;">${q.q}</div><div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">${q.ch.map(c=>`<button class="quiz-choice" data-val="${c}" style="background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.3);border-radius:10px;padding:12px;color:#e8e8ff;font-family:'Space Mono',monospace;font-size:13px;cursor:pointer;">${c}</button>`).join('')}</div>`;
    body.querySelectorAll('.quiz-choice').forEach(btn=>{btn.onclick=()=>{const v=btn.dataset.val;if(v===q.a)score++;btn.style.background=v===q.a?'rgba(0,255,163,0.2)':'rgba(255,71,87,0.2)';btn.style.borderColor=v===q.a?'#00ffa3':'#ff4757';body.querySelectorAll('.quiz-choice').forEach(b=>{b.disabled=true;if(b.dataset.val===q.a)b.style.borderColor='#00ffa3';});setTimeout(()=>{qIdx++;showQ();},900);};});
  }
  showQ();
}
