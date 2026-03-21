// ══════════════════════════════════════════════════════════════════
//  NETWORK SECURITY — DDoS ATTACK
// ══════════════════════════════════════════════════════════════════
function runDDoSAttack() {
  const CW=700, CH=500;
  canvas.width=CW; canvas.height=CH;

  let numBots=20, attackRate=3, running=false, timer=null;
  let serverHealth=100, serverCrashed=false;
  let packets=[], tick=0;
  const SERVER={x:350,y:240};

  // Generate bot positions in a circle
  function makeBots(n){
    const bots=[];
    for(let i=0;i<n;i++){
      const angle=(i/n)*Math.PI*2;
      const r=160+Math.random()*40;
      bots.push({x:SERVER.x+Math.cos(angle)*r, y:SERVER.y+Math.sin(angle)*r, id:i});
    }
    return bots;
  }
  let bots=makeBots(numBots);

  function reset(){
    serverHealth=100; serverCrashed=false; packets=[]; tick=0;
    bots=makeBots(numBots);
    if(timer){clearInterval(timer);timer=null;running=false;}
    document.getElementById('ddos_start').textContent='▶ Launch Attack';
    render();
  }

  function spawnPackets(){
    if(serverCrashed) return;
    const count=Math.ceil(attackRate*numBots/10);
    for(let i=0;i<count;i++){
      const bot=bots[Math.floor(Math.random()*bots.length)];
      packets.push({x:bot.x,y:bot.y,tx:SERVER.x+(Math.random()-0.5)*20,ty:SERVER.y+(Math.random()-0.5)*20,
        vx:0,vy:0,life:1,id:tick++});
    }
    // Move toward server
    packets.forEach(p=>{
      const dx=p.tx-p.x, dy=p.ty-p.y, d=Math.sqrt(dx*dx+dy*dy);
      if(d<6){p.life=0;if(!serverCrashed){serverHealth=Math.max(0,serverHealth-0.4*attackRate);}}
      else{p.x+=dx/d*6;p.y+=dy/d*6;}
    });
    packets=packets.filter(p=>p.life>0);
    if(serverHealth<=0&&!serverCrashed){serverCrashed=true;clearInterval(timer);timer=null;running=false;
      document.getElementById('ddos_start').textContent='▶ Launch Attack';}
    render();
  }

  function drawNode(x,y,r,color,label,glow,icon){
    ctx.save();
    if(glow){ctx.shadowColor=color;ctx.shadowBlur=glow;}
    ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);
    ctx.fillStyle=color;ctx.fill();
    ctx.strokeStyle='rgba(255,255,255,0.15)';ctx.lineWidth=1.5;ctx.stroke();
    ctx.shadowBlur=0;
    if(icon){ctx.font=`${r*0.9}px sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(icon,x,y);}
    if(label){ctx.font='10px "Space Mono",monospace';ctx.fillStyle='#c0d0e0';ctx.textAlign='center';ctx.textBaseline='top';ctx.fillText(label,x,y+r+5);}
    ctx.restore();
  }

  function render(){
    clearCanvas(); drawGrid(0.05);
    const isLight=document.body.classList.contains('light');

    // Title
    ctx.save();ctx.textAlign='center';
    ctx.font='bold 13px "Orbitron",monospace';ctx.fillStyle='#f43f5e';
    ctx.fillText('DDoS ATTACK SIMULATION',CW/2,24);ctx.restore();

    // Draw connection lines from bots to server (faint)
    bots.forEach(b=>{
      ctx.save();ctx.strokeStyle='rgba(244,63,94,0.08)';ctx.lineWidth=1;ctx.setLineDash([4,6]);
      ctx.beginPath();ctx.moveTo(b.x,b.y);ctx.lineTo(SERVER.x,SERVER.y);ctx.stroke();
      ctx.setLineDash([]);ctx.restore();
    });

    // Draw bots
    bots.forEach((b,i)=>{
      drawNode(b.x,b.y,14,'#f43f5e',i===0?'BOT':'',running?12:0,'💀');
    });

    // Draw packets
    packets.forEach(p=>{
      ctx.save();ctx.beginPath();ctx.arc(p.x,p.y,4,0,Math.PI*2);
      ctx.fillStyle='rgba(244,63,94,0.9)';ctx.shadowColor='#f43f5e';ctx.shadowBlur=8;
      ctx.fill();ctx.restore();
    });

    // Health bar
    const hpColor=serverHealth>60?'#34d399':serverHealth>30?'#fbbf24':'#f43f5e';
    const barW=120,barH=10,bx=SERVER.x-barW/2,by=SERVER.y-52;
    ctx.fillStyle='#1a1a38';ctx.fillRect(bx,by,barW,barH);
    ctx.fillStyle=hpColor;ctx.fillRect(bx,by,barW*(serverHealth/100),barH);
    ctx.strokeStyle='#2a2a5a';ctx.lineWidth=1;ctx.strokeRect(bx,by,barW,barH);
    ctx.font='9px "Space Mono",monospace';ctx.textAlign='center';ctx.fillStyle=hpColor;
    ctx.fillText(`SERVER HP: ${Math.ceil(serverHealth)}%`,SERVER.x,by-5);

    // Server node
    const sColor=serverCrashed?'#1a1a38':serverHealth>60?'#1e40af':serverHealth>30?'#92400e':'#7f1d1d';
    const sGlow=serverCrashed?0:serverHealth>60?20:30;
    const sBorderColor=serverCrashed?'#444':'#60a5fa';
    ctx.save();
    ctx.shadowColor=serverCrashed?'transparent':'#60a5fa';ctx.shadowBlur=sGlow;
    ctx.beginPath();ctx.roundRect(SERVER.x-32,SERVER.y-32,64,64,10);
    ctx.fillStyle=sColor;ctx.fill();
    ctx.strokeStyle=sBorderColor;ctx.lineWidth=2;ctx.stroke();
    ctx.shadowBlur=0;
    ctx.font='26px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillText(serverCrashed?'💥':'🖥',SERVER.x,SERVER.y);
    ctx.font='10px "Space Mono",monospace';ctx.fillStyle=serverCrashed?'#f43f5e':'#93c5fd';
    ctx.textBaseline='top';ctx.fillText(serverCrashed?'CRASHED':'SERVER',SERVER.x,SERVER.y+36);
    ctx.restore();

    if(serverCrashed){
      ctx.save();ctx.textAlign='center';ctx.font='bold 20px "Orbitron",monospace';
      ctx.fillStyle='#f43f5e';ctx.shadowColor='#f43f5e';ctx.shadowBlur=20;
      ctx.fillText('⚠ SERVER OVERLOADED',CW/2,CH-50);
      ctx.font='11px "Space Mono",monospace';ctx.fillStyle='#9090c0';ctx.shadowBlur=0;
      ctx.fillText('All legitimate traffic blocked. Reset to try defences.',CW/2,CH-28);
      ctx.restore();
    }

    // Stats
    ctx.save();ctx.textAlign='left';ctx.font='10px "Space Mono",monospace';ctx.fillStyle='#5060a0';
    ctx.fillText(`BOTS: ${numBots}  |  PACKETS IN FLIGHT: ${packets.length}  |  RATE: ${attackRate}x`,18,CH-10);
    ctx.restore();
  }

  buildLeftPanel(`
    <div class="panel-section-title">&gt; ATTACK PARAMS</div>
    ${makeSlider('ddos_bots','Botnet Size',5,60,numBots,1,'bots',v=>{numBots=v;reset();})}
    ${makeSlider('ddos_rate','Attack Rate',1,10,attackRate,1,'x',v=>{attackRate=v;})}
    <div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap;">
      <button class="ctrl-btn primary" id="ddos_start">▶ Launch Attack</button>
      <button class="ctrl-btn" id="ddos_reset">↺ Reset</button>
    </div>
    <div class="step-box" style="margin-top:14px;" id="ddos_info">Configure botnet and press ▶ Launch Attack</div>
    <div class="panel-section" style="margin-top:16px;">
      <div class="panel-section-title">DEFENCE INFO</div>
      <div style="font-family:'Share Tech Mono',monospace;font-size:11px;color:var(--text2);line-height:1.7;">
        Real defences: rate-limiting, anycast scrubbing, SYN cookies, BGP blackholing. None shown here — watch the raw attack.
      </div>
    </div>
  `);

  buildRightPanel(csRightPanel(
    `<span class="cs-cm">// DDoS — simplified model</span>
<span class="cs-cm">// N bots each fire R packets/tick</span>
<span class="cs-kw">while</span> (server.health &gt; <span class="cs-num">0</span>) {
  bots.<span class="cs-fn">forEach</span>(bot =&gt; {
    <span class="cs-kw">for</span> (<span class="cs-type">int</span> i=<span class="cs-num">0</span>; i&lt;rate; i++)
      server.<span class="cs-fn">receive</span>(bot.<span class="cs-fn">packet</span>());
  });
  server.health -= bots.length * rate;
}`,
    'O(bots × rate)','O(packets)',
    'Botnet floods the server. Each round, every bot fires packets toward the server IP. When connections/bandwidth are exhausted, the server crashes.'
  ));

  document.getElementById('ddos_start').onclick=()=>{
    if(running){clearInterval(timer);running=false;document.getElementById('ddos_start').textContent='▶ Launch Attack';return;}
    if(serverCrashed){reset();return;}
    running=true;document.getElementById('ddos_start').textContent='⏸ Pause';
    timer=setInterval(spawnPackets,80);
  };
  document.getElementById('ddos_reset').onclick=reset;

  bots=makeBots(numBots);
  render();
}

// ══════════════════════════════════════════════════════════════════
//  NETWORK SECURITY — SQL INJECTION
// ══════════════════════════════════════════════════════════════════
function runSQLInjection() {
  const CW=700, CH=500;
  canvas.width=CW; canvas.height=CH;

  let input = "alice";
  let animState = 'idle'; // idle | querying | success | injected | blocked
  let animT = 0, animTimer = null;

  const SAFE_INPUTS = ['alice','bob','carol','admin'];
  const INJECT_INPUTS = ["' OR '1'='1", "' OR 1=1 --", "'; DROP TABLE users;--", "' UNION SELECT * FROM secrets--"];
  let currentInjectIdx = 0;

  function builtQuery(inp){
    return `SELECT * FROM users WHERE name='${inp}'`;
  }
  function isMalicious(inp){
    return /['"]|--|;|\bOR\b|\bUNION\b/i.test(inp);
  }

  function render(){
    clearCanvas(); drawGrid(0.05);
    const W=CW, H=CH;
    const accent='#fb923c';

    ctx.save(); ctx.textAlign='center';
    ctx.font='bold 13px "Orbitron",monospace'; ctx.fillStyle=accent;
    ctx.fillText('SQL INJECTION — QUERY VISUALIZER', W/2, 24); ctx.restore();

    // === WEB FORM (top) ===
    const formX=120, formY=55, formW=460, formH=80;
    ctx.save();
    ctx.strokeStyle='rgba(251,146,60,0.4)'; ctx.lineWidth=1.5;
    ctx.fillStyle='rgba(251,146,60,0.05)';
    ctx.beginPath(); ctx.roundRect(formX,formY,formW,formH,10); ctx.fill(); ctx.stroke();
    ctx.font='10px "Space Mono",monospace'; ctx.fillStyle='#9090c0'; ctx.textAlign='left';
    ctx.fillText('🌐  WEB FORM', formX+14, formY+18);
    // Input field
    const fieldX=formX+14, fieldY=formY+28, fieldW=320, fieldH=30;
    ctx.fillStyle='#0a0a1a'; ctx.beginPath(); ctx.roundRect(fieldX,fieldY,fieldW,fieldH,6); ctx.fill();
    ctx.strokeStyle=isMalicious(input)?'#f43f5e':'rgba(251,146,60,0.5)'; ctx.lineWidth=1;
    ctx.stroke();
    ctx.font='12px "Space Mono",monospace';
    ctx.fillStyle=isMalicious(input)?'#f43f5e':'#e8e8ff';
    ctx.fillText(input.length>36?input.slice(0,36)+'…':input, fieldX+10, fieldY+20);
    // Submit button
    const btnX=fieldX+fieldW+12, btnY=fieldY, btnW=80;
    ctx.fillStyle=animState==='querying'?'rgba(251,146,60,0.3)':'rgba(251,146,60,0.15)';
    ctx.beginPath(); ctx.roundRect(btnX,btnY,btnW,fieldH,6); ctx.fill();
    ctx.strokeStyle=accent; ctx.lineWidth=1; ctx.stroke();
    ctx.font='10px "Space Mono",monospace'; ctx.fillStyle=accent; ctx.textAlign='center';
    ctx.fillText('SUBMIT', btnX+btnW/2, btnY+19);
    ctx.restore();

    // === QUERY BOX (middle) ===
    const qY=165, qH=68;
    const mal=isMalicious(input);
    const qColor=mal?'#f43f5e':'#34d399';
    ctx.save();
    ctx.strokeStyle=mal?'rgba(244,63,94,0.5)':'rgba(52,211,153,0.4)';
    ctx.fillStyle=mal?'rgba(244,63,94,0.05)':'rgba(52,211,153,0.05)';
    ctx.beginPath(); ctx.roundRect(120,qY,460,qH,10); ctx.fill(); ctx.stroke();
    ctx.font='10px "Space Mono",monospace'; ctx.fillStyle='#9090c0'; ctx.textAlign='left';
    ctx.fillText('📋  GENERATED SQL QUERY', 134, qY+16);
    // Color-code the query
    const query = builtQuery(input);
    ctx.font='11px "Space Mono",monospace'; ctx.textAlign='left';
    const parts = query.split(input);
    const before = parts[0];
    const inputPart = input;
    const after = (parts[1]||'');
    let qx=134, qy=qY+38;
    ctx.fillStyle='#93c5fd'; ctx.fillText(before, qx, qy); qx+=ctx.measureText(before).width;
    ctx.fillStyle=mal?'#f43f5e':'#fbbf24'; ctx.fillText(inputPart.length>45?inputPart.slice(0,45)+'…':inputPart, qx, qy);
    qx+=ctx.measureText(inputPart.length>45?inputPart.slice(0,45)+'…':inputPart).width;
    ctx.fillStyle='#93c5fd'; ctx.fillText(after, qx, qy);
    ctx.restore();

    // === ARROW downward ===
    const arrowY1=qY+qH+4, arrowY2=arrowY1+38;
    ctx.save();
    const arrowColor = animState==='querying'?accent:(mal?'#f43f5e':'#34d399');
    ctx.strokeStyle=arrowColor; ctx.lineWidth=2;
    if(animState==='querying'){ctx.shadowColor=arrowColor;ctx.shadowBlur=12;}
    ctx.beginPath(); ctx.moveTo(CW/2,arrowY1); ctx.lineTo(CW/2,arrowY2); ctx.stroke();
    ctx.fillStyle=arrowColor; ctx.beginPath();
    ctx.moveTo(CW/2,arrowY2+8); ctx.lineTo(CW/2-7,arrowY2); ctx.lineTo(CW/2+7,arrowY2); ctx.closePath(); ctx.fill();
    ctx.shadowBlur=0; ctx.restore();

    // === DATABASE / LOCK (bottom) ===
    const dbY=arrowY2+12, dbH=120;
    let dbState='locked';
    if(animState==='success') dbState='open';
    if(animState==='injected') dbState='breached';
    if(animState==='blocked') dbState='blocked';
    const dbColor=dbState==='breached'?'#f43f5e':dbState==='open'?'#34d399':dbState==='blocked'?'#fbbf24':'#2563eb';
    ctx.save();
    ctx.strokeStyle=dbColor+'99'; ctx.lineWidth=2;
    ctx.fillStyle=dbColor+'11';
    ctx.beginPath(); ctx.roundRect(120,dbY,460,dbH,12); ctx.fill(); ctx.stroke();
    if(dbState==='breached'||dbState==='open'){ctx.shadowColor=dbColor;ctx.shadowBlur=18;}
    ctx.font='36px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(dbState==='breached'?'💀':dbState==='open'?'🔓':dbState==='blocked'?'🚫':'🔒', CW/2, dbY+42);
    ctx.shadowBlur=0;
    ctx.font='11px "Space Mono",monospace'; ctx.fillStyle=dbColor; ctx.textBaseline='alphabetic';
    const dbMsg = {
      locked:'DATABASE — Waiting for query…',
      open:`✓ AUTH SUCCESS — Welcome, ${input}!`,
      breached:'⚠ INJECTION BYPASSED AUTH — ALL ROWS RETURNED',
      blocked:'🚫 WAF BLOCKED — Malicious pattern detected'
    }[dbState];
    ctx.fillText(dbMsg, CW/2, dbY+78);

    if(dbState==='breached'){
      ctx.font='9px "Space Mono",monospace'; ctx.fillStyle='#f43f5e88';
      ctx.fillText("Returned: [alice,bob,carol,admin,root,…all users]", CW/2, dbY+96);
    }
    ctx.restore();

    // Status bar
    ctx.save(); ctx.textAlign='left';
    ctx.font='10px "Space Mono",monospace'; ctx.fillStyle='#5060a0';
    ctx.fillText(`STATUS: ${animState.toUpperCase()}  |  INPUT: "${input.slice(0,40)}"  |  MALICIOUS: ${mal?'YES ⚠':'NO ✓'}`, 18, CH-10);
    ctx.restore();
  }

  function runQuery(){
    animState='querying'; render();
    setTimeout(()=>{
      const mal=isMalicious(input);
      if(mal){
        // Check if WAF is on
        const wafOn=document.getElementById('sqli_waf')&&document.getElementById('sqli_waf').checked;
        animState=wafOn?'blocked':'injected';
      } else {
        animState=SAFE_INPUTS.includes(input)?'success':'idle';
      }
      render();
      setTimeout(()=>{animState='idle';render();},2800);
    },700);
  }

  buildLeftPanel(`
    <div class="panel-section-title">&gt; SQL INJECTION LAB</div>
    <div class="param-group">
      <div class="param-label">Input Field</div>
      <input type="text" id="sqli_input" value="alice"
        style="width:100%;padding:7px 10px;background:var(--bg3);color:var(--text);border:1px solid var(--border);border-radius:6px;font-family:'Space Mono',monospace;font-size:12px;">
    </div>
    <div style="display:flex;gap:6px;margin-top:8px;flex-wrap:wrap;">
      <button class="ctrl-btn primary" id="sqli_submit" style="flex:1;">▶ Submit Query</button>
    </div>
    <div class="panel-section" style="margin-top:12px;">
      <div class="panel-section-title">PRESET PAYLOADS</div>
      <div style="display:flex;flex-direction:column;gap:5px;">
        <button class="ctrl-btn" onclick="document.getElementById('sqli_input').value='alice';document.getElementById('sqli_input').dispatchEvent(new Event('input'))">✓ alice (safe)</button>
        <button class="ctrl-btn" style="color:#f43f5e;border-color:#f43f5e33;" onclick="document.getElementById('sqli_input').value=&quot;' OR '1'='1&quot;;document.getElementById('sqli_input').dispatchEvent(new Event('input'))">💉 ' OR '1'='1</button>
        <button class="ctrl-btn" style="color:#f43f5e;border-color:#f43f5e33;" onclick="document.getElementById('sqli_input').value=&quot;' OR 1=1 --&quot;;document.getElementById('sqli_input').dispatchEvent(new Event('input'))">💉 ' OR 1=1 --</button>
        <button class="ctrl-btn" style="color:#f43f5e;border-color:#f43f5e33;" onclick="document.getElementById('sqli_input').value=&quot;'; DROP TABLE users;--&quot;;document.getElementById('sqli_input').dispatchEvent(new Event('input'))">💉 DROP TABLE</button>
      </div>
    </div>
    <div class="param-group" style="margin-top:12px;">
      <label style="display:flex;align-items:center;gap:8px;font-family:'Space Mono',monospace;font-size:11px;color:var(--text2);cursor:pointer;">
        <input type="checkbox" id="sqli_waf" style="accent-color:#fb923c;"> Enable WAF (blocks SQLi)
      </label>
    </div>
  `);

  buildRightPanel(csRightPanel(
    `<span class="cs-cm">// VULNERABLE code:</span>
query = <span class="cs-str">"SELECT * FROM users"</span>
      + <span class="cs-str">" WHERE name='"</span>
      + userInput + <span class="cs-str">"'"</span>;  <span class="cs-cm">// ← DANGEROUS</span>

<span class="cs-cm">// SAFE — prepared statement:</span>
stmt = db.<span class="cs-fn">prepare</span>(
  <span class="cs-str">"SELECT * FROM users WHERE name=?"</span>
);
stmt.<span class="cs-fn">bind</span>(userInput); <span class="cs-cm">// safe</span>`,
    'O(query length)', 'O(1)',
    "SQL injection occurs when user input is concatenated directly into a query. Use prepared statements — the DB engine treats input as data, never as SQL syntax."
  ));

  document.getElementById('sqli_input').oninput=function(){input=this.value;render();};
  document.getElementById('sqli_submit').onclick=runQuery;

  render();
}

// ══════════════════════════════════════════════════════════════════
//  NETWORK SECURITY — FIREWALL PACKET FILTERING
// ══════════════════════════════════════════════════════════════════
function runFirewallFilter() {
  const CW=700, CH=500;
  canvas.width=CW; canvas.height=CH;

  let running=false, animTimer=null, tick=0;
  let packets=[], destroyed=[], passed=0, blocked=0;
  let allowHTTPS=true, allowSSH=false, blockSMTP=true;

  const FIREWALL_X=370;
  const PORT_COLORS={443:'#34d399',80:'#fbbf24',22:'#60a5fa',25:'#f43f5e',4444:'#f43f5e',1337:'#f43f5e'};
  const PORT_LABELS={443:'HTTPS',80:'HTTP',22:'SSH',25:'SMTP',4444:'BACKDOOR',1337:'MALWARE'};

  function isAllowed(port){
    if(port===443&&allowHTTPS) return true;
    if(port===80) return true;
    if(port===22&&allowSSH) return true;
    if(port===25&&blockSMTP) return false;
    if(port===4444||port===1337) return false;
    return port!==25;
  }

  function randomPacket(){
    const ports=[443,80,22,25,4444,1337];
    const weights=[40,20,15,10,10,5];
    let r=Math.random()*100,cumul=0,port=443;
    for(let i=0;i<ports.length;i++){cumul+=weights[i];if(r<cumul){port=ports[i];break;}}
    const y=80+Math.random()*(CH-160);
    return {x:40,y,vy:(Math.random()-0.5)*0.3,port,allowed:isAllowed(port),
      state:'moving',deflectVx:0,deflectVy:0,alpha:1,sparkles:[]};
  }

  function update(){
    tick++;
    if(tick%18===0) packets.push(randomPacket());

    packets.forEach(p=>{
      if(p.state==='moving'){
        p.x+=4;p.y+=p.vy;
        if(p.x>=FIREWALL_X-8){
          if(p.allowed){p.state='passed';}
          else{
            p.state='deflect';
            p.deflectVx=-3-Math.random()*2;
            p.deflectVy=(Math.random()-0.5)*5;
            // Spawn sparkles
            for(let i=0;i<8;i++) p.sparkles.push({
              x:p.x,y:p.y,vx:(Math.random()-0.5)*5,vy:(Math.random()-0.5)*5,
              life:1,color:PORT_COLORS[p.port]||'#f43f5e'});
          }
        }
      } else if(p.state==='deflect'){
        p.x+=p.deflectVx;p.y+=p.deflectVy;p.alpha-=0.04;
        p.sparkles.forEach(s=>{s.x+=s.vx;s.y+=s.vy;s.life-=0.08;});
        p.sparkles=p.sparkles.filter(s=>s.life>0);
        if(p.alpha<=0){p.state='dead';blocked++;}
      } else if(p.state==='passed'){
        p.x+=4;
        if(p.x>CW+20){p.state='dead';passed++;}
      }
    });
    packets=packets.filter(p=>p.state!=='dead');
    render();
  }

  function render(){
    clearCanvas(); drawGrid(0.05);

    // Title
    ctx.save(); ctx.textAlign='center';
    ctx.font='bold 13px "Orbitron",monospace'; ctx.fillStyle='#f97316';
    ctx.fillText('FIREWALL PACKET FILTERING', CW/2, 24); ctx.restore();

    // Internet side label
    ctx.save(); ctx.font='10px "Space Mono",monospace'; ctx.fillStyle='#5060a0';
    ctx.fillText('INTERNET', 18, 48);
    ctx.fillText('(untrusted)', 18, 62);
    ctx.fillText('INTRANET', FIREWALL_X+50, 48);
    ctx.fillText('(trusted)', FIREWALL_X+50, 62);
    ctx.restore();

    // Firewall wall
    const fwGrad=ctx.createLinearGradient(FIREWALL_X-10,0,FIREWALL_X+10,0);
    fwGrad.addColorStop(0,'rgba(249,115,22,0)');
    fwGrad.addColorStop(0.4,'rgba(249,115,22,0.6)');
    fwGrad.addColorStop(0.6,'rgba(249,115,22,0.6)');
    fwGrad.addColorStop(1,'rgba(249,115,22,0)');
    ctx.save();
    ctx.fillStyle=fwGrad;
    ctx.fillRect(FIREWALL_X-10,60,20,CH-80);
    ctx.strokeStyle='#f97316'; ctx.lineWidth=2.5;
    ctx.shadowColor='#f97316'; ctx.shadowBlur=16;
    ctx.beginPath(); ctx.moveTo(FIREWALL_X,60); ctx.lineTo(FIREWALL_X,CH-40); ctx.stroke();
    ctx.shadowBlur=0;
    ctx.font='10px "Space Mono",monospace'; ctx.textAlign='center'; ctx.fillStyle='#f97316';
    ctx.fillText('🔥 FIREWALL', FIREWALL_X, 52);
    ctx.restore();

    // Draw packets
    packets.forEach(p=>{
      const color=PORT_COLORS[p.port]||'#9090c0';
      ctx.save(); ctx.globalAlpha=p.alpha;
      ctx.beginPath(); ctx.arc(p.x,p.y,9,0,Math.PI*2);
      ctx.fillStyle=color; ctx.shadowColor=color; ctx.shadowBlur=10; ctx.fill();
      ctx.font='7px "Space Mono",monospace'; ctx.fillStyle='#000'; ctx.textAlign='center';
      ctx.textBaseline='middle'; ctx.shadowBlur=0;
      ctx.fillText(PORT_LABELS[p.port]?.slice(0,4)||p.port, p.x, p.y);
      ctx.globalAlpha=1; ctx.restore();
      // Sparkles
      p.sparkles.forEach(s=>{
        ctx.save(); ctx.globalAlpha=s.life;
        ctx.beginPath(); ctx.arc(s.x,s.y,2,0,Math.PI*2);
        ctx.fillStyle=s.color; ctx.fill(); ctx.restore();
      });
    });

    // Rules panel (top right)
    ctx.save();
    ctx.fillStyle='rgba(10,10,26,0.85)'; ctx.strokeStyle='#2a2a5a'; ctx.lineWidth=1;
    ctx.beginPath(); ctx.roundRect(FIREWALL_X+30,70,190,130,8); ctx.fill(); ctx.stroke();
    ctx.font='9px "Space Mono",monospace'; ctx.textAlign='left';
    ctx.fillStyle='#f97316'; ctx.fillText('📋 ACTIVE RULES', FIREWALL_X+44, 88);
    const rules=[
      {label:'443 HTTPS',allow:allowHTTPS},
      {label:'80 HTTP',allow:true},
      {label:'22 SSH',allow:allowSSH},
      {label:'25 SMTP',allow:!blockSMTP},
      {label:'4444/1337',allow:false},
    ];
    rules.forEach((r,i)=>{
      ctx.fillStyle=r.allow?'#34d399':'#f43f5e';
      ctx.fillText(`${r.allow?'✓ ALLOW':'✗ DENY '} ${r.label}`, FIREWALL_X+44, 108+i*18);
    });
    ctx.restore();

    // Stats
    ctx.save(); ctx.textAlign='left';
    ctx.font='10px "Space Mono",monospace';
    ctx.fillStyle='#34d399'; ctx.fillText(`✓ PASSED: ${passed}`, 18, CH-30);
    ctx.fillStyle='#f43f5e'; ctx.fillText(`✗ BLOCKED: ${blocked}`, 18, CH-15);
    ctx.restore();
  }

  buildLeftPanel(`
    <div class="panel-section-title">&gt; FIREWALL RULES</div>
    <div style="display:flex;flex-direction:column;gap:8px;margin-top:6px;">
      <label style="display:flex;align-items:center;gap:8px;font-family:'Space Mono',monospace;font-size:11px;color:var(--text2);cursor:pointer;">
        <input type="checkbox" id="fw_https" checked style="accent-color:#34d399;"> Allow 443 (HTTPS)
      </label>
      <label style="display:flex;align-items:center;gap:8px;font-family:'Space Mono',monospace;font-size:11px;color:var(--text2);cursor:pointer;">
        <input type="checkbox" id="fw_ssh" style="accent-color:#60a5fa;"> Allow 22 (SSH)
      </label>
      <label style="display:flex;align-items:center;gap:8px;font-family:'Space Mono',monospace;font-size:11px;color:var(--text2);cursor:pointer;">
        <input type="checkbox" id="fw_smtp" checked style="accent-color:#f43f5e;"> Block 25 (SMTP)
      </label>
    </div>
    <div style="display:flex;gap:8px;margin-top:14px;flex-wrap:wrap;">
      <button class="ctrl-btn primary" id="fw_start">▶ Start Flow</button>
      <button class="ctrl-btn" id="fw_reset">↺ Reset</button>
    </div>
    <div class="step-box" style="margin-top:14px;">Port 443/80 = safe. Port 4444/1337 = malicious. Toggle SSH/SMTP above.</div>
    <div class="panel-section" style="margin-top:14px;">
      <div class="panel-section-title">LEGEND</div>
      <div style="font-family:'Space Mono',monospace;font-size:10px;line-height:1.8;color:var(--text2);">
        <span style="color:#34d399;">■</span> HTTPS (443)<br>
        <span style="color:#fbbf24;">■</span> HTTP (80)<br>
        <span style="color:#60a5fa;">■</span> SSH (22)<br>
        <span style="color:#f43f5e;">■</span> SMTP/Malware
      </div>
    </div>
  `);

  buildRightPanel(csRightPanel(
    `<span class="cs-cm">// Stateless packet filter</span>
<span class="cs-kw">for</span> (<span class="cs-kw">auto</span>&amp; pkt : incoming) {
  <span class="cs-kw">if</span> (rules.<span class="cs-fn">match</span>(pkt.dstPort))
    forward(pkt);          <span class="cs-cm">// ✓ allow</span>
  <span class="cs-kw">else</span>
    <span class="cs-fn">drop</span>(pkt);             <span class="cs-cm">// ✗ block</span>
}
<span class="cs-cm">// Default-deny: block all,</span>
<span class="cs-cm">// then whitelist required ports</span>`,
    'O(rules) per packet','O(sessions) stateful',
    "Packets arrive from untrusted internet on the left. The firewall inspects each packet's port and protocol against its ruleset. Toggle rules above to see what passes."
  ));

  function applyRules(){
    allowHTTPS=document.getElementById('fw_https').checked;
    allowSSH=document.getElementById('fw_ssh').checked;
    blockSMTP=document.getElementById('fw_smtp').checked;
    packets.forEach(p=>p.allowed=isAllowed(p.port));
  }
  document.getElementById('fw_https').onchange=applyRules;
  document.getElementById('fw_ssh').onchange=applyRules;
  document.getElementById('fw_smtp').onchange=applyRules;

  document.getElementById('fw_start').onclick=()=>{
    if(running){clearInterval(animTimer);running=false;document.getElementById('fw_start').textContent='▶ Start Flow';return;}
    running=true;document.getElementById('fw_start').textContent='⏸ Pause';
    animTimer=setInterval(update,40);
  };
  document.getElementById('fw_reset').onclick=()=>{
    clearInterval(animTimer);running=false;packets=[];passed=0;blocked=0;tick=0;
    document.getElementById('fw_start').textContent='▶ Start Flow';render();
  };

  render();
}

// ══════════════════════════════════════════════════════════════════
//  NETWORK SECURITY — MAN-IN-THE-MIDDLE (MITM)
// ══════════════════════════════════════════════════════════════════
function runMITMAttack() {
  const CW=700, CH=500;
  canvas.width=CW; canvas.height=CH;

  let phase='idle'; // idle | user-to-mitm | mitm-tamper | mitm-to-server | server-reply | done
  let animTimer=null, t=0;
  let hackerVisible=false, tlsEnabled=false;
  let packetColor='#34d399', interceptedColor='#f43f5e';
  let packetX=0,packetY=0,packetTarget={x:0,y:0};
  let packetC='#34d399', showTamper=false, tamperFlash=0;
  let messages=[];

  const USER={x:100,y:CH/2};
  const SERVER={x:600,y:CH/2};
  const HACKER={x:350,y:CH/2-110};

  function addMsg(msg,color){messages.push({t:Date.now(),text:msg,color:color||'#9090c0'});if(messages.length>5)messages.shift();}

  function drawActor(x,y,icon,label,color,glow){
    ctx.save();
    if(glow){ctx.shadowColor=color||'#60a5fa';ctx.shadowBlur=glow;}
    ctx.font='34px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(icon,x,y);
    ctx.shadowBlur=0;
    ctx.font='10px "Space Mono",monospace';ctx.fillStyle=color||'#9090c0';ctx.textBaseline='top';
    ctx.fillText(label,x,y+22);ctx.restore();
  }
  function drawPacket(x,y,color,label){
    ctx.save();ctx.beginPath();ctx.arc(x,y,13,0,Math.PI*2);
    ctx.fillStyle=color;ctx.shadowColor=color;ctx.shadowBlur=14;ctx.fill();
    ctx.font='8px "Space Mono",monospace';ctx.fillStyle='#000';ctx.textAlign='center';ctx.textBaseline='middle';ctx.shadowBlur=0;
    ctx.fillText(label||'PKT',x,y);ctx.restore();
  }

  function lerp2(a,b,t){return{x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t};}

  function runAnimation(){
    if(animTimer)clearInterval(animTimer);
    phase='user-to-mitm'; t=0;
    hackerVisible=true; packetC='#34d399'; showTamper=false;
    addMsg('📤 User sends packet to Server…','#34d399');
    animTimer=setInterval(()=>{
      t+=0.04;
      if(t>=1){
        t=0;
        if(phase==='user-to-mitm'){
          phase='mitm-tamper'; showTamper=true; tamperFlash=0;
          addMsg('⚠ HACKER intercepts & reads packet!','#f43f5e');
        } else if(phase==='mitm-tamper'){
          showTamper=false; packetC='#f43f5e'; phase='mitm-to-server';
          addMsg('✗ Packet TAMPERED — colour changed!','#f43f5e');
        } else if(phase==='mitm-to-server'){
          phase='server-reply';
          addMsg('📨 Tampered packet delivered to Server.','#fb923c');
        } else if(phase==='server-reply'){
          phase='done';
          addMsg(tlsEnabled?'🔒 TLS: Server cert mismatch detected! Attack failed.':'✗ Server accepts tampered packet — compromise complete!',
            tlsEnabled?'#34d399':'#f43f5e');
          setTimeout(()=>{phase='idle';clearInterval(animTimer);animTimer=null;},2000);
          return;
        }
      }
      render();
    },30);
  }

  function render(){
    clearCanvas();drawGrid(0.05);

    ctx.save();ctx.textAlign='center';
    ctx.font='bold 13px "Orbitron",monospace';ctx.fillStyle='#a78bfa';
    ctx.fillText('MAN-IN-THE-MIDDLE (MITM) ATTACK',CW/2,24);ctx.restore();

    // Connection line (dashed = insecure, solid = TLS)
    ctx.save();
    if(tlsEnabled){
      ctx.strokeStyle='#34d39966';ctx.lineWidth=2;ctx.setLineDash([]);
    } else {
      ctx.strokeStyle='rgba(167,139,250,0.25)';ctx.lineWidth=1.5;ctx.setLineDash([6,5]);
    }
    ctx.beginPath();ctx.moveTo(USER.x+28,USER.y);ctx.lineTo(SERVER.x-28,SERVER.y);ctx.stroke();
    ctx.setLineDash([]);ctx.restore();

    if(tlsEnabled){
      ctx.save();ctx.textAlign='center';ctx.font='9px "Space Mono",monospace';ctx.fillStyle='#34d39988';
      ctx.fillText('🔒 TLS ENCRYPTED',CW/2,USER.y-14);ctx.restore();
    }

    // Hacker intercept lines
    if(hackerVisible){
      ctx.save();ctx.strokeStyle='rgba(244,63,94,0.35)';ctx.lineWidth=1.5;ctx.setLineDash([4,4]);
      ctx.beginPath();ctx.moveTo(USER.x+20,USER.y-12);ctx.lineTo(HACKER.x-18,HACKER.y+18);ctx.stroke();
      ctx.beginPath();ctx.moveTo(HACKER.x+18,HACKER.y+18);ctx.lineTo(SERVER.x-20,SERVER.y-12);ctx.stroke();
      ctx.setLineDash([]);ctx.restore();
    }

    // Actors
    drawActor(USER.x,USER.y,'👤','USER','#93c5fd',phase!=='idle'?12:0);
    drawActor(SERVER.x,SERVER.y,'🖥','SERVER','#86efac',phase==='server-reply'||phase==='done'?12:0);
    if(hackerVisible){
      drawActor(HACKER.x,HACKER.y,'🕵','HACKER',tlsEnabled?'#5a4070':'#f43f5e',showTamper?20:6);
    }

    // Animated packet
    if(phase==='user-to-mitm'){
      const pos=lerp2({x:USER.x+28,y:USER.y},{x:HACKER.x-18,y:HACKER.y+18},t);
      drawPacket(pos.x,pos.y,'#34d399','ORIG');
    } else if(phase==='mitm-tamper'){
      tamperFlash++;
      drawPacket(HACKER.x,HACKER.y,tamperFlash%6<3?'#34d399':'#f43f5e','...');
      ctx.save();ctx.textAlign='center';ctx.font='bold 12px "Space Mono",monospace';
      ctx.fillStyle=tamperFlash%4<2?'#f43f5e':'#fbbf24';
      ctx.shadowColor='#f43f5e';ctx.shadowBlur=16;
      ctx.fillText('READING & ALTERING',HACKER.x,HACKER.y-42);ctx.restore();
    } else if(phase==='mitm-to-server'){
      const pos=lerp2({x:HACKER.x+18,y:HACKER.y+18},{x:SERVER.x-20,y:SERVER.y},t);
      drawPacket(pos.x,pos.y,tlsEnabled?'#f43f5e':'#f43f5e',tlsEnabled?'ERR':'FAKE');
    } else if(phase==='server-reply'||phase==='done'){
      const finalColor=tlsEnabled?'#f43f5e66':'#f43f5e';
      drawPacket(SERVER.x-20,SERVER.y,finalColor,tlsEnabled?'REJ':'COMP');
      ctx.save();ctx.textAlign='center';ctx.font='bold 12px "Space Mono",monospace';
      ctx.fillStyle=tlsEnabled?'#34d399':'#f43f5e';ctx.shadowColor=ctx.fillStyle;ctx.shadowBlur=12;
      ctx.fillText(tlsEnabled?'🔒 TLS CERT MISMATCH — REJECTED':'✗ SERVER COMPROMISED',CW/2,CH-80);ctx.restore();
    }

    // Message log
    ctx.save();
    const logX=18,logY=CH-15-messages.length*16;
    messages.forEach((m,i)=>{
      const age=(Date.now()-m.t)/3000;
      ctx.globalAlpha=Math.max(0,1-age*0.7);
      ctx.font='10px "Space Mono",monospace';ctx.fillStyle=m.color;ctx.textAlign='left';
      ctx.fillText(m.text,logX,logY+i*16);
    });
    ctx.globalAlpha=1;ctx.restore();
  }

  buildLeftPanel(`
    <div class="panel-section-title">&gt; MITM CONTROLS</div>
    <div style="margin-top:8px;display:flex;flex-direction:column;gap:8px;">
      <button class="ctrl-btn primary" id="mitm_attack">▶ Simulate Attack</button>
    </div>
    <div class="param-group" style="margin-top:14px;">
      <label style="display:flex;align-items:center;gap:8px;font-family:'Space Mono',monospace;font-size:11px;color:var(--text2);cursor:pointer;">
        <input type="checkbox" id="mitm_tls" style="accent-color:#34d399;"> Enable TLS (HTTPS)
      </label>
    </div>
    <div class="step-box" style="margin-top:14px;">Without TLS, the Hacker reads and modifies the packet. With TLS, the cert mismatch is detected.</div>
    <div class="panel-section" style="margin-top:14px;">
      <div class="panel-section-title">VECTORS</div>
      <div style="font-family:'Space Mono',monospace;font-size:10px;line-height:1.8;color:var(--text2);">
        • ARP spoofing (LAN)<br>
        • Rogue Wi-Fi AP<br>
        • DNS spoofing<br>
        • SSL stripping
      </div>
    </div>
  `);

  buildRightPanel(csRightPanel(
    `<span class="cs-cm">// Without TLS:</span>
attacker.<span class="cs-fn">interceptARP</span>(victim);
<span class="cs-kw">while</span>(connected) {
  pkt = attacker.<span class="cs-fn">readPacket</span>();
  pkt.<span class="cs-fn">modify</span>(payload);  <span class="cs-cm">// tamper</span>
  victim.<span class="cs-fn">forward</span>(pkt);
}
<span class="cs-cm">// With TLS: cert pinning</span>
<span class="cs-cm">// detects impersonation → abort</span>`,
    'O(packets forwarded)','O(1) per flow',
    "Without TLS, a MITM proxy silently reads and modifies every packet. TLS with proper certificate validation defeats active MITM — cert mismatch is detected immediately."
  ));

  document.getElementById('mitm_attack').onclick=()=>{
    if(animTimer){clearInterval(animTimer);animTimer=null;phase='idle';hackerVisible=false;messages=[];render();
      document.getElementById('mitm_attack').textContent='▶ Simulate Attack';return;}
    tlsEnabled=document.getElementById('mitm_tls').checked;
    document.getElementById('mitm_attack').textContent='⏹ Stop';
    runAnimation();
  };
  document.getElementById('mitm_tls').onchange=function(){
    tlsEnabled=this.checked;
    if(phase==='idle')render();
  };

  render();
}

// ══════════════════════════════════════════════════════════════════
//  NETWORK SECURITY — ZERO-KNOWLEDGE PROOF (ALI BABA CAVE)
// ══════════════════════════════════════════════════════════════════
function runZKPCave() {
  const CW=700, CH=500;
  canvas.width=CW; canvas.height=CH;

  let round=0, totalRounds=10, successes=0, phase='start';
  // Prover secretly knows the password (knows path A always works)
  let proverKnows=true;
  let proverEntered=null;   // 'A' or 'B'
  let verifierCalls=null;   // 'A' or 'B'
  let animTimer=null, animT=0, animPhase=0;
  // probability that unknowing prover survives so far
  let unknowingSuccessProb=1;

  function reset(){
    round=0;successes=0;unknowingSuccessProb=1;phase='start';
    if(animTimer){clearInterval(animTimer);animTimer=null;}
    render();
  }

  function nextRound(){
    if(round>=totalRounds){phase='verdict';render();return;}
    round++;
    // Prover enters a path
    if(proverKnows){
      // Smart: enter the path Verifier WON'T ask for (they can traverse via secret)
      // For animation, enter random, but can always exit correctly
      proverEntered=Math.random()<0.5?'A':'B';
    } else {
      proverEntered=Math.random()<0.5?'A':'B'; // Random guess, may fail
    }
    verifierCalls=Math.random()<0.5?'A':'B';

    const succeeded=proverKnows || (proverEntered===verifierCalls);
    if(succeeded) successes++;
    else { phase='caught'; render(); return; }
    if(!proverKnows) unknowingSuccessProb*=0.5;

    phase='reveal';
    render();
  }

  // Cave geometry
  const CAVE_CX=350, CAVE_CY=220;
  const ENTRANCE_X=200, ENTRANCE_Y=320;

  function drawCave(){
    // Outer cave shape
    ctx.save();
    // Main cave body
    ctx.beginPath();
    ctx.arc(CAVE_CX,CAVE_CY,150,0,Math.PI*2);
    ctx.fillStyle='rgba(30,20,50,0.7)';ctx.fill();
    ctx.strokeStyle='rgba(52,211,153,0.2)';ctx.lineWidth=2;ctx.stroke();

    // Door / magic gate in middle
    ctx.beginPath();ctx.arc(CAVE_CX,CAVE_CY,22,0,Math.PI*2);
    ctx.fillStyle='#1a0a2e';ctx.fill();
    ctx.strokeStyle='#a78bfa';ctx.lineWidth=2;ctx.shadowColor='#a78bfa';ctx.shadowBlur=14;ctx.stroke();
    ctx.shadowBlur=0;
    ctx.font='18px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillText('🔑',CAVE_CX,CAVE_CY);

    // Path A (left branch)
    ctx.strokeStyle='rgba(96,165,250,0.5)';ctx.lineWidth=8;ctx.lineCap='round';
    ctx.beginPath();ctx.moveTo(ENTRANCE_X,ENTRANCE_Y);
    ctx.bezierCurveTo(ENTRANCE_X+30,CAVE_CY+20,CAVE_CX-90,CAVE_CY+30,CAVE_CX-22,CAVE_CY);
    ctx.stroke();

    // Path B (right branch)
    ctx.strokeStyle='rgba(251,146,60,0.5)';
    ctx.beginPath();ctx.moveTo(ENTRANCE_X,ENTRANCE_Y);
    ctx.bezierCurveTo(ENTRANCE_X+30,CAVE_CY-20,CAVE_CX-60,CAVE_CY-40,CAVE_CX-22,CAVE_CY);
    ctx.stroke();

    // Path labels
    ctx.font='bold 12px "Orbitron",monospace';ctx.fillStyle='#60a5fa';ctx.textAlign='center';
    ctx.fillText('PATH A',ENTRANCE_X+50,CAVE_CY+50);
    ctx.fillStyle='#fb923c';ctx.fillText('PATH B',ENTRANCE_X+50,CAVE_CY-40);

    // Exit (right side)
    ctx.strokeStyle='rgba(52,211,153,0.4)';ctx.lineWidth=8;
    ctx.beginPath();ctx.moveTo(CAVE_CX+22,CAVE_CY);ctx.lineTo(CAVE_CX+150,CAVE_CY);ctx.stroke();
    ctx.font='10px "Space Mono",monospace';ctx.fillStyle='#34d39988';
    ctx.textAlign='center';ctx.fillText('EXIT',CAVE_CX+150,CAVE_CY-14);

    ctx.restore();
  }

  function render(){
    clearCanvas();drawGrid(0.05);
    const W=CW,H=CH;

    ctx.save();ctx.textAlign='center';
    ctx.font='bold 13px "Orbitron",monospace';ctx.fillStyle='#34d399';
    ctx.fillText('ZERO-KNOWLEDGE PROOF — ALI BABA CAVE',W/2,24);ctx.restore();

    drawCave();

    // Verifier (outside, watching)
    ctx.save();
    ctx.font='28px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillText('🧑',ENTRANCE_X-70,ENTRANCE_Y+10);
    ctx.font='9px "Space Mono",monospace';ctx.fillStyle='#9090c0';ctx.textBaseline='top';
    ctx.fillText('VERIFIER',ENTRANCE_X-70,ENTRANCE_Y+28);ctx.restore();

    // Prover position
    let proverX=ENTRANCE_X+10, proverY=ENTRANCE_Y-10;
    if(phase==='reveal'||phase==='caught'){
      proverX=CAVE_CX+140; proverY=CAVE_CY-14;
    } else if(phase==='verdict'){
      proverX=ENTRANCE_X+10; proverY=ENTRANCE_Y-10;
    }
    ctx.save();
    ctx.font='26px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillText(proverKnows?'🧙':'🤷',proverX,proverY);
    ctx.font='9px "Space Mono",monospace';ctx.fillStyle='#34d399';ctx.textBaseline='top';
    ctx.fillText('PROVER',proverX,proverY+16);ctx.restore();

    // Info overlay
    const infoX=460,infoY=60,infoW=220,infoH=200;
    ctx.save();
    ctx.fillStyle='rgba(10,10,26,0.88)';ctx.strokeStyle='#2a2a5a';ctx.lineWidth=1;
    ctx.beginPath();ctx.roundRect(infoX,infoY,infoW,infoH,10);ctx.fill();ctx.stroke();
    ctx.font='10px "Orbitron",monospace';ctx.fillStyle='#34d399';ctx.textAlign='left';
    ctx.fillText('ROUND LOG',infoX+14,infoY+18);
    ctx.font='11px "Space Mono",monospace';
    ctx.fillStyle='#9090c0';ctx.fillText(`Round: ${round} / ${totalRounds}`,infoX+14,infoY+40);
    ctx.fillStyle='#34d399';ctx.fillText(`Successes: ${successes}`,infoX+14,infoY+58);
    ctx.fillStyle='#60a5fa';ctx.fillText(`Prover: knows=${proverKnows}`,infoX+14,infoY+76);
    if(verifierCalls) {
      ctx.fillStyle='#fbbf24';ctx.fillText(`Verifier called: ${verifierCalls}`,infoX+14,infoY+94);
      ctx.fillStyle=proverEntered===verifierCalls||proverKnows?'#34d399':'#f43f5e';
      ctx.fillText(`Prover exited: ${verifierCalls} ✓`,infoX+14,infoY+112);
    }
    const p=1-Math.pow(0.5,successes);
    const pct=Math.round(p*1000)/10;
    ctx.fillStyle='#a78bfa';ctx.fillText(`Conviction: ${pct}%`,infoX+14,infoY+132);
    ctx.fillStyle='#5060a0';ctx.font='9px "Space Mono",monospace';
    ctx.fillText(`Cheat prob: 1/${Math.pow(2,round).toFixed(0)}`,infoX+14,infoY+152);
    ctx.restore();

    // Phase messages
    let msg='', msgColor='#9090c0';
    if(phase==='start'){msg='Press ▶ Next Round to begin';msgColor='#9090c0';}
    else if(phase==='reveal'){
      msg=`Round ${round}: Verifier called "${verifierCalls}" — Prover exits "${verifierCalls}" ✓`;
      msgColor='#34d399';
    } else if(phase==='caught'){
      msg=`CAUGHT! Prover entered "${proverEntered}" but Verifier called "${verifierCalls}"`;
      msgColor='#f43f5e';
    } else if(phase==='verdict'){
      if(proverKnows){
        msg=`✓ PROOF COMPLETE — ${totalRounds}/${totalRounds} rounds passed. Prover knows the secret!`;
        msgColor='#34d399';
      } else {
        msg=`?? All ${totalRounds} rounds passed by luck — impossible to be sure without knowing!`;
        msgColor='#fbbf24';
      }
    }
    ctx.save();ctx.textAlign='center';ctx.font='11px "Space Mono",monospace';ctx.fillStyle=msgColor;
    ctx.shadowColor=msgColor;ctx.shadowBlur=msg?8:0;
    ctx.fillText(msg,W/2,H-20);ctx.restore();
  }

  buildLeftPanel(`
    <div class="panel-section-title">&gt; ZKP CONTROLS</div>
    <div style="margin-top:6px;display:flex;flex-direction:column;gap:8px;">
      <button class="ctrl-btn primary" id="zkp_next">▶ Next Round</button>
      <button class="ctrl-btn" id="zkp_auto">⚡ Auto Run (10 rounds)</button>
      <button class="ctrl-btn" id="zkp_reset">↺ Reset</button>
    </div>
    <div class="param-group" style="margin-top:14px;">
      <label style="display:flex;align-items:center;gap:8px;font-family:'Space Mono',monospace;font-size:11px;color:var(--text2);cursor:pointer;">
        <input type="checkbox" id="zkp_knows" checked style="accent-color:#34d399;"> Prover knows secret
      </label>
    </div>
    ${makeSlider('zkp_rounds','Total Rounds',3,20,10,1,'',v=>{totalRounds=v;reset();})}
    <div class="step-box" style="margin-top:12px;">Each round: Prover enters cave, Verifier calls a path, Prover must exit correctly. Without the secret, only 50% per round.</div>
    <div class="panel-section" style="margin-top:12px;">
      <div class="panel-section-title">CONVICTION</div>
      <div style="font-family:'Space Mono',monospace;font-size:10px;line-height:1.8;color:var(--text2);">
        After 10 rounds:<br>
        P(cheat) = 1/2¹⁰ = 0.098%<br>
        After 30 rounds: &lt;1 in a billion
      </div>
    </div>
  `);

  buildRightPanel(csRightPanel(
    `<span class="cs-cm">// ZKP — Ali Baba Cave Protocol</span>
<span class="cs-kw">for</span> (round = <span class="cs-num">1</span>; round &lt;= n; round++) {
  <span class="cs-cm">// Prover enters random fork</span>
  path = prover.<span class="cs-fn">enterCave</span>();

  <span class="cs-cm">// Verifier calls a side</span>
  call = verifier.<span class="cs-fn">callSide</span>();

  <span class="cs-cm">// Prover exits called side</span>
  <span class="cs-kw">if</span> (!prover.<span class="cs-fn">exitSide</span>(call))
    <span class="cs-kw">return</span> FAIL; <span class="cs-cm">// caught lying</span>
}
<span class="cs-cm">// P(cheat) = (1/2)^n</span>`,
    'O(rounds)', 'O(1)',
    "Each round, the Prover must exit the side the Verifier calls. Without the secret (password), success is 50/50 per round — cheating becomes astronomically unlikely over many rounds."
  ));

  document.getElementById('zkp_knows').onchange=function(){proverKnows=this.checked;reset();};
  document.getElementById('zkp_next').onclick=()=>{
    if(phase==='verdict'||phase==='caught'){reset();return;}
    nextRound();
  };
  document.getElementById('zkp_auto').onclick=()=>{
    reset();
    let r=0;
    const iv=setInterval(()=>{
      if(r>=totalRounds||phase==='caught'){clearInterval(iv);return;}
      nextRound();r++;
    },600);
  };
  document.getElementById('zkp_reset').onclick=reset;

  render();
}

// ══════════════════════════════════════════════════════════════════
//  NETWORK SECURITY — QUIZ (shared for all 5 experiments)
// ══════════════════════════════════════════════════════════════════
function launchNetSecQuiz() {
  const QUIZZES = {
    'ddos-attack': {
      title:'DDoS Quiz', accent:'#f43f5e',
      questions:[
        {q:'A DDoS attack differs from a DoS attack because it uses:', opts:['A faster computer','Many distributed source IPs','UDP instead of TCP','A single high-bandwidth pipe'], ans:1,
          explain:'DDoS = Distributed DoS: traffic comes from thousands of compromised machines (a botnet), making source-IP blocking ineffective.'},
        {q:'Which technique prevents the server wasting memory on half-open TCP connections?', opts:['Rate limiting','BGP blackholing','SYN cookies','Anycast diffusion'], ans:2,
          explain:'SYN cookies avoid allocating server state until the three-way handshake completes, defeating SYN-flood resource exhaustion.'},
        {q:'The 2016 Mirai botnet primarily compromised:', opts:['Windows PCs','Cloud servers','IoT devices (cameras, routers)','Mobile phones'], ans:2,
          explain:'Mirai exploited default credentials on IoT devices — 600,000 cameras and routers — generating 1.1 Tbps of attack traffic.'},
        {q:'BGP blackholing as a DDoS mitigation works by:', opts:['Slowing down attack packets','Null-routing the target IP at ISP level','Encrypting traffic','Adding CAPTCHAs'], ans:1,
          explain:'BGP blackholing tells upstream ISPs to drop all traffic destined for the target IP, stopping the flood before it reaches the victim.'},
        {q:'Which approach provides the most scalable DDoS absorption?', opts:['A bigger server','Anycast scrubbing centres','IP whitelisting','CAPTCHA challenges'], ans:1,
          explain:'Anycast routes attack traffic to the nearest scrubbing centre in a globally distributed network, spreading load across many PoPs.'},
      ]
    },
    'sql-injection': {
      title:'SQL Injection Quiz', accent:'#fb923c',
      questions:[
        {q:"What does the payload \" ' OR '1'='1 \" exploit?", opts:['Buffer overflow','String concatenation into SQL query','Cross-site scripting','Integer overflow'], ans:1,
          explain:"The single quote closes the string literal; OR '1'='1' makes the WHERE clause always true, returning all database rows."},
        {q:'The correct primary fix for SQL injection is:', opts:['Input length limits','Escaping quotes only','Prepared statements (parameterised queries)','Using a WAF'], ans:2,
          explain:"Prepared statements separate query structure from data — the DB engine never interprets user input as SQL syntax, regardless of its content."},
        {q:'Blind SQL injection works by:', opts:['Injecting visible output into the page','Observing true/false differences in timing or content','Dumping the full database in one request','Crashing the database server'], ans:1,
          explain:"Blind SQLi asks yes/no questions via boolean conditions or time delays, inferring data one bit at a time even when no output is visible."},
        {q:'OWASP has ranked SQL injection as:', opts:['A minor vulnerability','#1 web security risk for 10+ years','Impossible in modern frameworks','Only relevant to old databases'], ans:1,
          explain:'SQLi tops the OWASP Top 10 consistently because it is trivially introduced by string concatenation and leads directly to full database compromise.'},
        {q:'Second-order SQL injection differs because:', opts:['It targets a secondary database','The payload is stored first, then fires when retrieved later','It uses two separate SQL statements','It only works on MySQL'], ans:1,
          explain:'Second-order SQLi stores a clean-looking payload that later executes in a different code path — bypassing input validation that only runs on insertion.'},
      ]
    },
    'firewall-filter': {
      title:'Firewall Quiz', accent:'#f97316',
      questions:[
        {q:'A stateful firewall differs from a stateless filter by:', opts:['Inspecting packet contents','Tracking TCP session state (SYN/established)','Blocking all UDP','Running at layer 7'], ans:1,
          explain:"A stateful firewall tracks the TCP three-way handshake and only permits packets belonging to established sessions, blocking unsolicited inbound SYNs."},
        {q:'The correct default firewall posture is:', opts:['Allow all, block known bad','Block all, then whitelist required services','Allow inbound, block outbound','Allow all internal traffic'], ans:1,
          explain:'Default-deny blocks everything then explicitly permits only required services (e.g. port 443 inbound). This limits attack surface to exactly intended flows.'},
        {q:'A Next-Generation Firewall (NGFW) adds:', opts:['Faster packet forwarding','Layer-7 deep packet inspection','More port numbers','Faster NAT'], ans:1,
          explain:'NGFWs recognise application protocols regardless of port number (e.g. Tor tunnelled on port 443), enabling application-aware policy enforcement.'},
        {q:'Firewall rules are evaluated:', opts:['In random order','Bottom to top','Top to bottom, first match wins','By packet size priority'], ans:2,
          explain:'Rules are processed top-to-bottom and the first matching rule applies. Rule order is critical — a broad ALLOW above a specific DENY makes the DENY unreachable.'},
        {q:'Port 443 is used by:', opts:['HTTP','FTP','HTTPS (TLS)','SSH'], ans:2,
          explain:'Port 443 is the standard port for HTTPS — HTTP over TLS. Port 80=HTTP, 22=SSH, 21=FTP.'},
      ]
    },
    'mitm-attack': {
      title:'MITM Quiz', accent:'#a78bfa',
      questions:[
        {q:'ARP spoofing enables MITM on a LAN by:', opts:['Flooding the switch','Sending fake ARP replies mapping victim IPs to attacker MAC','Cracking WPA2','Injecting DNS responses'], ans:1,
          explain:'ARP spoofing sends gratuitous ARP replies poisoning the victim\'s ARP cache, causing their packets to be sent to the attacker\'s MAC address instead.'},
        {q:'SSL stripping works by:', opts:['Cracking TLS encryption','Downgrading HTTPS to HTTP transparently','Forging TLS certificates','Blocking port 443'], ans:1,
          explain:'SSL stripping intercepts the initial HTTP request before redirect to HTTPS, serving the victim an HTTP version while maintaining a separate HTTPS session with the server.'},
        {q:'HSTS (HTTP Strict Transport Security) defeats SSL stripping because:', opts:['It encrypts ARP packets','Browsers refuse to load the site over HTTP once HSTS is set','It adds CAPTCHAs','It blocks unknown certificates'], ans:1,
          explain:'HSTS instructs the browser to always use HTTPS for the domain. Even if the attacker intercepts the first request, the browser refuses to downgrade to HTTP.'},
        {q:'Mutual TLS (mTLS) requires:', opts:['Both client and server to present certificates','Only the server certificate','A shared password','A certificate authority to be online'], ans:0,
          explain:'mTLS authenticates both ends of the connection — both client and server present certificates. This defeats impersonation attacks on both sides.'},
        {q:'Certificate pinning prevents MITM by:', opts:['Blocking all certificates','Accepting only the expected certificate public key','Requiring multi-factor auth','Using SHA-256 exclusively'], ans:1,
          explain:"Certificate pinning rejects any certificate that doesn't match the expected public key, even a validly-signed certificate from a trusted CA — defeating a CA compromise attack."},
      ]
    },
    'zkp-cave': {
      title:'Zero-Knowledge Proof Quiz', accent:'#34d399',
      questions:[
        {q:'In the Ali Baba cave, after 30 rounds, the probability a cheating prover succeeds is:', opts:['50%','About 1 in a billion (1/2³⁰)','0% — impossible','25%'], ans:1,
          explain:'Each round independently has 50% chance of catching a cheating prover. After 30 rounds: (1/2)³⁰ ≈ 10⁻⁹ — less than 1 in a billion.'},
        {q:'The "zero-knowledge" property means:', opts:['The prover reveals nothing at all','The transcript reveals no information about the secret','The verifier learns nothing','The proof takes zero time'], ans:1,
          explain:'Zero-knowledge means the interaction transcript is indistinguishable from one simulated without the secret — the verifier gains zero additional knowledge about the secret itself.'},
        {q:'zk-SNARKs are used in Zcash to:', opts:['Speed up transactions','Prove transaction validity without revealing amounts or addresses','Replace mining','Store the blockchain'], ans:1,
          explain:'Zcash uses zk-SNARKs to prove that a shielded transaction is valid (inputs balance outputs, no double-spend) without revealing sender, receiver, or amount.'},
        {q:'Completeness in a ZKP means:', opts:['The proof is short','If the prover knows the secret, the verifier always accepts','The verifier always rejects unknown provers','The proof is non-interactive'], ans:1,
          explain:"Completeness: an honest prover who knows the secret can always convince the verifier. This pairs with soundness (can't cheat) and zero-knowledge (secret not leaked)."},
        {q:'Which property makes ZKP proofs non-interactive in practice?', opts:['Schnorr signatures','Fiat-Shamir heuristic (replacing verifier challenge with hash)','Blind signatures','Certificate pinning'], ans:1,
          explain:'The Fiat-Shamir heuristic replaces the verifier\'s random challenge with a hash of the transcript, converting interactive protocols to non-interactive proofs usable in blockchains.'},
      ]
    },
  };

  const quiz=QUIZZES[currentExp];
  if(!quiz) return;

  const {title,accent}=quiz;
  const questions=[...quiz.questions].sort(()=>Math.random()-0.5).slice(0,5);
  let qIdx=0, score=0, answered=false;

  const ov=createQuizOverlay(title,accent);
  const body=document.getElementById('quiz-body');

  function renderQ(){
    if(qIdx>=questions.length){
      body.innerHTML=`
        <div class="quiz-instructions" style="text-align:center;padding:28px;">
          <div style="font-size:36px;margin-bottom:12px;">${score>=4?'🏆':score>=3?'✅':'📖'}</div>
          <div style="font-size:20px;font-weight:700;color:${accent};">SCORE: ${score} / ${questions.length}</div>
          <div style="margin-top:10px;color:#9090c0;">${score>=4?'Excellent! You know your network security!':score>=3?'Good work — review the failed questions.':'Keep studying — network security is critical!'}</div>
        </div>
        <div class="quiz-btn-row">
          <button class="quiz-btn primary" onclick="closeQuiz()">✕ Close</button>
        </div>`;
      return;
    }
    const q=questions[qIdx];
    answered=false;
    body.innerHTML=`
      <div class="quiz-stats">
        <div class="quiz-stat">Question<span>${qIdx+1}/${questions.length}</span></div>
        <div class="quiz-stat">Score<span>${score}</span></div>
        <div class="quiz-stat">Topic<span style="font-size:11px;">${title.replace(' Quiz','')}</span></div>
      </div>
      <div class="quiz-instructions"><b>${q.q}</b></div>
      <div id="opts" style="display:flex;flex-direction:column;gap:8px;">
        ${q.opts.map((o,i)=>`<button class="quiz-btn" id="opt_${i}" onclick="nsqChoose(${i})">${String.fromCharCode(65+i)}. ${o}</button>`).join('')}
      </div>
      <div class="quiz-feedback" id="nsq_fb" style="display:none;"></div>`;

    window.nsqChoose=(i)=>{
      if(answered) return;
      answered=true;
      const correct=i===q.ans;
      if(correct) score++;
      document.querySelectorAll('[id^="opt_"]').forEach((btn,j)=>{
        if(j===q.ans){btn.style.background=accent;btn.style.color='#0d0d1a';btn.style.borderColor=accent;}
        else if(j===i&&!correct){btn.style.background='rgba(244,63,94,0.2)';btn.style.borderColor='#f43f5e';btn.style.color='#f43f5e';}
        btn.style.cursor='default';
      });
      const fb=document.getElementById('nsq_fb');
      fb.style.display='block';
      fb.style.color=correct?accent:'#f43f5e';
      fb.textContent=(correct?'✓ Correct! ':'✗ Wrong. ')+q.explain;
      setTimeout(()=>{qIdx++;renderQ();},2200);
    };
  }

  renderQ();
  quizOverlay=ov;
}

window.closeQuiz=function(){if(quizOverlay){quizOverlay.remove();quizOverlay=null;}};

