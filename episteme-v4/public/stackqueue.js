// ══════════════════════════════════════════════════════════
//  STACK OPERATIONS
// ══════════════════════════════════════════════════════════
function runStackOps(){
  let stackArr=[], maxSize=8, pushAnim=null, popAnim=null;

  buildLeftPanel(`
    <div class="panel-section">
      <div class="panel-section-title">Operations</div>
      <button class="ctrl-btn primary" id="cst_push">⬆ Push Random</button>
      <button class="ctrl-btn" id="cst_pop">⬇ Pop</button>
      <button class="ctrl-btn danger" id="cst_clear">↺ Clear</button>
    </div>
    <div class="panel-section">
      <div class="panel-section-title">Stack Info</div>
      <div class="data-card">
        <div class="data-row"><span class="data-key">Size</span><span class="data-val" id="d_stsz">0 / ${maxSize}</span></div>
        <div class="data-row"><span class="data-key">Top</span><span class="data-val" id="d_sttop">empty</span></div>
        <div class="data-row"><span class="data-key">Status</span><span class="data-val" id="d_ststate">Ready</span></div>
      </div>
    </div>
    <div class="panel-section">
      <div class="panel-section-title">Concept</div>
      <div style="font-family:'Space Mono',monospace;font-size:11px;color:var(--text2);line-height:1.9;">
        LIFO = Last In, First Out<br>
        Push = add to TOP<br>
        Pop = remove from TOP<br>
        Peek = view TOP only
      </div>
    </div>
  `);
  const CODE=`<span class="cs-cm">// Stack — LIFO data structure</span>
<span class="cs-kw">template</span>&lt;<span class="cs-kw">typename</span> T&gt;
<span class="cs-kw">class</span> <span class="cs-type">Stack</span> {
  T arr[MAX]; <span class="cs-type">int</span> top=-<span class="cs-num">1</span>;
<span class="cs-kw">public</span>:
  <span class="cs-kw">void</span> <span class="cs-fn">push</span>(T val){
    <span class="cs-kw">if</span>(top==MAX-<span class="cs-num">1</span>)
      <span class="cs-kw">throw</span> <span class="cs-str">"Stack Overflow"</span>;
    arr[++top]=val;
  }
  T <span class="cs-fn">pop</span>(){
    <span class="cs-kw">if</span>(top==-<span class="cs-num">1</span>)
      <span class="cs-kw">throw</span> <span class="cs-str">"Stack Underflow"</span>;
    <span class="cs-kw">return</span> arr[top--];
  }
  T <span class="cs-fn">peek</span>(){ <span class="cs-kw">return</span> arr[top]; }
  <span class="cs-type">bool</span> <span class="cs-fn">isEmpty</span>(){ <span class="cs-kw">return</span> top==-<span class="cs-num">1</span>; }
};`;
  buildRightPanel(csRightPanel(CODE,'O(1) push/pop','O(n) space','Stack: last element in is the first one out (LIFO).'));

  function updateInfo(){
    updateDataVal('stsz',`${stackArr.length} / ${maxSize}`);
    updateDataVal('sttop',stackArr.length?stackArr[stackArr.length-1]:'empty');
  }

  document.getElementById('cst_push').onclick=()=>{
    if(stackArr.length>=maxSize){csSetStep('⚠ Stack Overflow! Stack is full.'); csHL(8);updateDataVal('ststate','Overflow!');return;}
    const val=Math.floor(Math.random()*99)+1;
    stackArr.push(val); updateInfo();
    pushAnim={val,t:0}; updateDataVal('ststate','Pushing...');
    csSetStep(`Push ${val} → stack top. Size: ${stackArr.length}`); csHL(9); csHL(9);
  };
  document.getElementById('cst_pop').onclick=()=>{
    if(!stackArr.length){csSetStep('⚠ Stack Underflow! Nothing to pop.'); csHL(13);updateDataVal('ststate','Underflow!');return;}
    const val=stackArr.pop(); updateInfo();
    popAnim={val,t:0}; updateDataVal('ststate','Popping...');
    csSetStep(`Pop ${val} ← removed from top. Size: ${stackArr.length}`); csHL(14); csHL(14);
  };
  document.getElementById('cst_clear').onclick=()=>{stackArr=[];pushAnim=null;popAnim=null;updateInfo();updateDataVal('ststate','Ready');csSetStep('Stack cleared.');};

  csStartEngine(()=>{
    const W=canvas.width, H=canvas.height;
    clearCanvas(); drawGrid(0.025);
    const cellW=130, cellH=44, gap=4, bx=(W-cellW)/2;
    const baseY=H-54;

    // Base plate
    ctx.fillStyle='#1e3050'; ctx.fillRect(bx-16,baseY+cellH,cellW+32,4);
    ctx.fillStyle='#0f1e30'; ctx.fillRect(bx-16,baseY+cellH+4,cellW+32,2);

    // Side walls
    ctx.fillStyle='rgba(30,48,80,0.4)';
    ctx.fillRect(bx-18,baseY-maxSize*(cellH+gap),6,maxSize*(cellH+gap)+cellH+4);
    ctx.fillRect(bx+cellW+12,baseY-maxSize*(cellH+gap),6,maxSize*(cellH+gap)+cellH+4);

    // Stack cells
    stackArr.forEach((val,i)=>{
      const y=baseY-i*(cellH+gap);
      const hue=200+i*18;
      const col=`hsl(${hue},70%,55%)`;
      const isTop=i===stackArr.length-1;

      // Shadow
      ctx.fillStyle='rgba(0,0,0,0.3)'; ctx.fillRect(bx+3,y+4,cellW,cellH);

      const grad=ctx.createLinearGradient(bx,y,bx,y+cellH);
      grad.addColorStop(0,col+'cc'); grad.addColorStop(1,col+'44');
      ctx.fillStyle=grad; ctx.fillRect(bx,y,cellW,cellH);
      ctx.strokeStyle=isTop?col:'rgba(255,255,255,0.15)';
      ctx.lineWidth=isTop?2:1;
      ctx.strokeRect(bx,y,cellW,cellH);

      ctx.fillStyle='#e8f0f8'; ctx.font='bold 15px "Space Mono",monospace';
      ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(val,bx+cellW/2,y+cellH/2);
      ctx.textBaseline='alphabetic';

      if(isTop){
        ctx.fillStyle=col; ctx.font='10px "Space Mono",monospace'; ctx.textAlign='left';
        ctx.fillText('← TOP',bx+cellW+14,y+cellH/2+4);
      }
    });

    // Push animation
    if(pushAnim){
      pushAnim.t=Math.min(1,pushAnim.t+0.06);
      const targetY=baseY-(stackArr.length-1)*(cellH+gap);
      const startY=-cellH;
      const y=startY+(targetY-startY)*pushAnim.t;
      ctx.globalAlpha=pushAnim.t;
      ctx.fillStyle='rgba(0,229,255,0.5)'; ctx.fillRect(bx,y,cellW,cellH);
      ctx.strokeStyle='#00e5ff'; ctx.lineWidth=2.5; ctx.strokeRect(bx,y,cellW,cellH);
      ctx.fillStyle='#00e5ff'; ctx.font='bold 15px "Space Mono",monospace';
      ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(pushAnim.val,bx+cellW/2,y+cellH/2);
      ctx.textBaseline='alphabetic'; ctx.globalAlpha=1;
      if(pushAnim.t>=1){pushAnim=null;updateDataVal('ststate','Ready');}
    }

    // Pop animation
    if(popAnim){
      popAnim.t=Math.min(1,popAnim.t+0.05);
      const startY=baseY-stackArr.length*(cellH+gap);
      const y=startY-popAnim.t*(H*0.35);
      ctx.globalAlpha=1-popAnim.t;
      ctx.fillStyle='rgba(255,71,87,0.5)'; ctx.fillRect(bx,y,cellW,cellH);
      ctx.strokeStyle='#ff4757'; ctx.lineWidth=2.5; ctx.strokeRect(bx,y,cellW,cellH);
      ctx.fillStyle='#ff4757'; ctx.font='bold 15px "Space Mono",monospace';
      ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(popAnim.val,bx+cellW/2,y+cellH/2);
      ctx.textBaseline='alphabetic'; ctx.globalAlpha=1;
      if(popAnim.t>=1){popAnim=null;updateDataVal('ststate','Ready');}
    }

    // Empty state
    if(!stackArr.length&&!pushAnim){
      ctx.fillStyle='#0f1e30'; ctx.fillRect(bx,baseY,cellW,cellH);
      ctx.strokeStyle='#1e3050'; ctx.lineWidth=1; ctx.strokeRect(bx,baseY,cellW,cellH);
      ctx.fillStyle='#2a4060'; ctx.font='12px "Space Mono",monospace';
      ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText('(empty)',bx+cellW/2,baseY+cellH/2);
      ctx.textBaseline='alphabetic';
    }

    // Labels
    ctx.fillStyle='#4a7090'; ctx.font='11px "Space Mono",monospace'; ctx.textAlign='center';
    ctx.fillText(`STACK  [LIFO]  ${stackArr.length}/${maxSize}`,W/2,H-22);

    // Capacity bar
    const capFill=stackArr.length/maxSize;
    ctx.fillStyle='#0a1520'; ctx.fillRect(bx,H-16,cellW,6);
    ctx.fillStyle=capFill>0.8?'#ff4757':'#00e5ff'; ctx.fillRect(bx,H-16,cellW*capFill,6);
    ctx.textAlign='start';
  });
  updateInfo();
}

// ══════════════════════════════════════════════════════════
//  QUEUE OPERATIONS
// ══════════════════════════════════════════════════════════
function runQueueOps(){
  let queueArr=[], maxSize=7, enqAnim=null, deqAnim=null;

  buildLeftPanel(`
    <div class="panel-section">
      <div class="panel-section-title">Operations</div>
      <button class="ctrl-btn primary" id="cq_enq">➕ Enqueue</button>
      <button class="ctrl-btn" id="cq_deq">➖ Dequeue</button>
      <button class="ctrl-btn danger" id="cq_clear">↺ Clear</button>
    </div>
    <div class="panel-section">
      <div class="panel-section-title">Queue Info</div>
      <div class="data-card">
        <div class="data-row"><span class="data-key">Size</span><span class="data-val" id="d_qsz">0 / ${maxSize}</span></div>
        <div class="data-row"><span class="data-key">Front</span><span class="data-val" id="d_qfront">empty</span></div>
        <div class="data-row"><span class="data-key">Rear</span><span class="data-val" id="d_qrear">empty</span></div>
      </div>
    </div>
    <div class="panel-section">
      <div class="panel-section-title">Concept</div>
      <div style="font-family:'Space Mono',monospace;font-size:11px;color:var(--text2);line-height:1.9;">
        FIFO = First In, First Out<br>
        Enqueue = add to REAR<br>
        Dequeue = remove from FRONT<br>
        Like a real-world queue line
      </div>
    </div>
  `);
  const CODE=`<span class="cs-cm">// Queue — FIFO data structure</span>
<span class="cs-kw">template</span>&lt;<span class="cs-kw">typename</span> T&gt;
<span class="cs-kw">class</span> <span class="cs-type">Queue</span> {
  T arr[MAX]; <span class="cs-type">int</span> front=<span class="cs-num">0</span>, rear=<span class="cs-num">0</span>;
<span class="cs-kw">public</span>:
  <span class="cs-kw">void</span> <span class="cs-fn">enqueue</span>(T val){
    <span class="cs-kw">if</span>(rear==MAX)
      <span class="cs-kw">throw</span> <span class="cs-str">"Queue Full"</span>;
    arr[rear++]=val;
  }
  T <span class="cs-fn">dequeue</span>(){
    <span class="cs-kw">if</span>(front==rear)
      <span class="cs-kw">throw</span> <span class="cs-str">"Queue Empty"</span>;
    <span class="cs-kw">return</span> arr[front++];
  }
  T <span class="cs-fn">peek</span>(){ <span class="cs-kw">return</span> arr[front]; }
  <span class="cs-type">bool</span> <span class="cs-fn">isEmpty</span>(){ <span class="cs-kw">return</span> front==rear; }
};`;
  buildRightPanel(csRightPanel(CODE,'O(1) enq/deq','O(n) space','Queue: first element in is the first one out (FIFO).'));

  function updateInfo(){
    updateDataVal('qsz',`${queueArr.length} / ${maxSize}`);
    updateDataVal('qfront',queueArr.length?queueArr[0]:'empty');
    updateDataVal('qrear',queueArr.length?queueArr[queueArr.length-1]:'empty');
  }

  document.getElementById('cq_enq').onclick=()=>{
    if(queueArr.length>=maxSize){csSetStep('⚠ Queue is full!'); csHL(8);return;}
    const val=Math.floor(Math.random()*99)+1;
    enqAnim={val,t:0}; queueArr.push(val); updateInfo();
    csSetStep(`Enqueue ${val} → rear of queue. Size: ${queueArr.length}`); csHL(9); csHL(9);
  };
  document.getElementById('cq_deq').onclick=()=>{
    if(!queueArr.length){csSetStep('⚠ Queue is empty!'); csHL(13);return;}
    const val=queueArr.shift(); updateInfo();
    deqAnim={val,t:0};
    csSetStep(`Dequeue ${val} ← removed from front. Size: ${queueArr.length}`); csHL(14); csHL(14);
  };
  document.getElementById('cq_clear').onclick=()=>{queueArr=[];enqAnim=null;deqAnim=null;updateInfo();csSetStep('Queue cleared.');};

  csStartEngine(()=>{
    const W=canvas.width, H=canvas.height;
    clearCanvas(); drawGrid(0.025);
    const cellW=72, cellH=52, gap=5;
    const totalW=maxSize*(cellW+gap)-gap;
    const ox=(W-totalW)/2, oy=H/2-cellH/2-10;

    // Rail background
    ctx.fillStyle='rgba(10,25,40,0.6)';
    ctx.fillRect(ox-8,oy-2,totalW+16,cellH+4);
    ctx.strokeStyle='#1e3050'; ctx.lineWidth=1;
    ctx.strokeRect(ox-8,oy-2,totalW+16,cellH+4);

    // Empty slots
    for(let i=0;i<maxSize;i++){
      ctx.strokeStyle='#0f1e30'; ctx.lineWidth=1;
      ctx.strokeRect(ox+i*(cellW+gap),oy,cellW,cellH);
    }

    // Queue items
    queueArr.forEach((val,i)=>{
      const isDeqAnim=(deqAnim&&i===0);
      const isEnqAnim=(enqAnim&&i===queueArr.length-1);
      let alpha=1;
      if(isDeqAnim) alpha=1-deqAnim.t;
      if(isEnqAnim) alpha=enqAnim.t;

      const hue=195+i*20;
      const col=`hsl(${hue},72%,56%)`;
      const cx=ox+i*(cellW+gap), cy=oy;

      // Enqueue: slide in from right
      let drawX=cx;
      if(isEnqAnim) drawX=cx+(1-enqAnim.t)*(cellW+gap)*2;

      ctx.globalAlpha=alpha;
      const grad=ctx.createLinearGradient(drawX,cy,drawX,cy+cellH);
      grad.addColorStop(0,col+'dd'); grad.addColorStop(1,col+'44');
      ctx.fillStyle=grad; ctx.fillRect(drawX,cy,cellW,cellH);
      ctx.strokeStyle=col; ctx.lineWidth=1.5; ctx.strokeRect(drawX,cy,cellW,cellH);
      ctx.fillStyle='#e8f0f8'; ctx.font='bold 14px "Space Mono",monospace';
      ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(val,drawX+cellW/2,cy+cellH/2);
      ctx.textBaseline='alphabetic'; ctx.globalAlpha=1;
    });

    // Dequeue animation (item flying out left)
    if(deqAnim){
      deqAnim.t=Math.min(1,deqAnim.t+0.05);
      const col='#ff4757';
      const dx=ox-deqAnim.t*(cellW+80);
      ctx.globalAlpha=1-deqAnim.t;
      ctx.fillStyle='rgba(255,71,87,0.4)'; ctx.fillRect(dx,oy,cellW,cellH);
      ctx.strokeStyle=col; ctx.lineWidth=2.5; ctx.strokeRect(dx,oy,cellW,cellH);
      ctx.fillStyle=col; ctx.font='bold 14px "Space Mono",monospace';
      ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(deqAnim.val,dx+cellW/2,oy+cellH/2);
      ctx.textBaseline='alphabetic'; ctx.globalAlpha=1;
      if(deqAnim.t>=1) deqAnim=null;
    }

    // Enqueue animation update
    if(enqAnim){
      enqAnim.t=Math.min(1,enqAnim.t+0.06);
      if(enqAnim.t>=1) enqAnim=null;
    }

    // FRONT / REAR arrows with labels
    if(queueArr.length){
      const fx=ox, ry=oy+cellH+(queueArr.length-1)*(cellW+gap);
      // FRONT arrow (pointing down from top)
      ctx.fillStyle='#00e5ff'; ctx.font='bold 10px "Space Mono",monospace'; ctx.textAlign='center';
      ctx.fillText('FRONT',ox+cellW/2,oy-14);
      ctx.fillStyle='#00e5ff';
      arrow(ox+cellW/2,oy-10,ox+cellW/2,oy-2,'#00e5ff',2);

      // REAR arrow (pointing up from bottom)
      const rIdx=queueArr.length-1;
      ctx.fillStyle='#f59e0b'; ctx.fillText('REAR',ox+rIdx*(cellW+gap)+cellW/2,oy+cellH+22);
      arrow(ox+rIdx*(cellW+gap)+cellW/2,oy+cellH+18,ox+rIdx*(cellW+gap)+cellW/2,oy+cellH+2,'#f59e0b',2);
    }

    // IN/OUT flow arrows
    ctx.fillStyle='#2a4060'; ctx.font='10px "Space Mono",monospace'; ctx.textAlign='center';
    ctx.fillText('← OUT (dequeue)',ox-60,oy+cellH/2+4);
    ctx.fillText('IN (enqueue) →',ox+totalW+62,oy+cellH/2+4);
    arrow(ox-10,oy+cellH/2,ox-65,oy+cellH/2,'#ff4757',2);
    arrow(ox+totalW+10,oy+cellH/2,ox+totalW+65,oy+cellH/2,'#2ed573',2);

    // Label
    ctx.fillStyle='#4a7090'; ctx.font='11px "Space Mono",monospace'; ctx.textAlign='center';
    ctx.fillText(`QUEUE  [FIFO]  ${queueArr.length}/${maxSize}`,W/2,H-22);

    const capFill=queueArr.length/maxSize;
    ctx.fillStyle='#0a1520'; ctx.fillRect(ox,H-16,totalW,6);
    ctx.fillStyle=capFill>0.85?'#ff4757':'#38bdf8'; ctx.fillRect(ox,H-16,totalW*capFill,6);
    ctx.textAlign='start';
  });
  updateInfo();
}


