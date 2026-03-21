// ══════════════════════════════════════════════════════════════════
//  MACHINE LEARNING — SHARED HELPERS
// ══════════════════════════════════════════════════════════════════
function mlPoint(x,y,col,r=5){
  ctx.save();ctx.fillStyle=col;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();ctx.restore();
}
function mlLine(x1,y1,x2,y2,col,w=1.5,dash=[]){
  ctx.save();ctx.strokeStyle=col;ctx.lineWidth=w;ctx.setLineDash(dash);
  ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();ctx.restore();
}
function mlText(x,y,t,col,size=11,align='center',base='middle'){
  ctx.save();ctx.fillStyle=col;ctx.font=`${size}px "Nunito",sans-serif`;
  ctx.textAlign=align;ctx.textBaseline=base;ctx.fillText(t,x,y);ctx.restore();
}
function mlAxes(ox,oy,W,H,col='rgba(255,255,255,0.15)'){
  mlLine(ox,oy+H,ox+W,oy+H,col); mlLine(ox,oy,ox,oy+H,col);
}

// ══════════════════════════════════════════════════════════════════
//  LINEAR REGRESSION — GRADIENT DESCENT
// ══════════════════════════════════════════════════════════════════
function runLinearRegression(){
  const CW=700,CH=500;
  const OX=70,OY=30,AW=420,AH=350; // axes area
  let pts=[],w=0.3,b=50,lr=0.002,epoch=0,running=false,rafId=null,lossHist=[];

  function randPts(){
    pts=[];
    for(let i=0;i<25;i++){
      const x=Math.random()*AW;
      pts.push({x,y:0.6*x+60+((Math.random()-0.5)*80)});
    }
    w=0.3;b=50;epoch=0;lossHist=[];running=false;cancelAnimationFrame(rafId);render();
    csSetStep('Random data generated. Press ▶ Step or ⚡ Train to run gradient descent.');
  }

  function mse(){
    return pts.reduce((s,p)=>s+(p.y-(w*p.x+b))**2,0)/pts.length;
  }
  function step(){
    const n=pts.length;
    let dw=0,db=0;
    pts.forEach(p=>{const e=(w*p.x+b)-p.y;dw+=e*p.x;db+=e;});
    w-=lr*2/n*dw; b-=lr*2/n*db;
    epoch++;
    lossHist.push(mse());
    if(lossHist.length>80)lossHist.shift();
  }

  buildLeftPanel(`
    <div class="panel-section">
      <div class="panel-section-title">Data</div>
      <button class="ctrl-btn primary" data-action="lr_rand">🎲 Random Data</button>
    </div>
    <div class="panel-section">
      <div class="panel-section-title">Hyperparams</div>
      ${makeSlider('lr_lr','Learning Rate',1,20,4,1,'×10⁻³',v=>{lr=v/1000;})}
    </div>
    <div class="panel-section">
      <div class="panel-section-title">Train</div>
      <button class="ctrl-btn" data-action="lr_step">▶ 1 Epoch</button>
      <button class="ctrl-btn" data-action="lr_train">⚡ Train</button>
      <button class="ctrl-btn" data-action="lr_stop">⏹ Stop</button>
      <button class="ctrl-btn" data-action="lr_reset">↺ Reset</button>
    </div>`);
  buildRightPanel(csRightPanel(
    `<span class="cs-cm">// Gradient Descent</span>\nw=0.3; b=50; α=${lr};\n<span class="cs-kw">for</span> epoch:\n  dw=Σ(ŷ-y)·x·2/n\n  db=Σ(ŷ-y)·2/n\n  w -= α·dw\n  b -= α·db\n<span class="cs-cm">// ŷ = w·x + b</span>`,
    'O(n·epochs)','O(1)','Click canvas to add data points, then train.'
  ));

  canvas.onclick=e=>{
    const r=canvas.getBoundingClientRect();
    const cx=e.clientX-r.left,cy=e.clientY-r.top;
    if(cx>OX&&cx<OX+AW&&cy>OY&&cy<OY+AH){
      pts.push({x:cx-OX,y:OY+AH-cy});
      lossHist=[];render();
    }
  };

  LAB['lr_rand']=randPts;
  LAB['lr_step']=()=>{if(pts.length<2)return;step();render();csSetStep(`Epoch ${epoch} | MSE=${mse().toFixed(2)} | w=${w.toFixed(3)} b=${b.toFixed(2)}`);};
  LAB['lr_train']=()=>{
    running=true;
    function go(){if(!running||mse()<0.5)return;step();render();csSetStep(`Epoch ${epoch} | MSE=${mse().toFixed(2)}`);rafId=requestAnimationFrame(go);}
    go();
  };
  LAB['lr_stop']=()=>{running=false;cancelAnimationFrame(rafId);};
  LAB['lr_reset']=()=>{w=0.3;b=50;epoch=0;lossHist=[];running=false;cancelAnimationFrame(rafId);render();csSetStep('Reset.');};

  function render(){
    clearCanvas();drawGrid(0.04);
    // Axes
    mlAxes(OX,OY,AW,AH);
    mlText(OX+AW/2,OY+AH+20,'x feature','var(--text3)',10);
    mlText(OX-40,OY+AH/2,'y target','var(--text3)',10);
    // Data points
    pts.forEach(p=>mlPoint(OX+p.x,OY+AH-p.y,'#38bdf8',5));
    // Regression line
    if(pts.length>0){
      const x0=0,y0=w*x0+b;
      const x1=AW,y1=w*x1+b;
      mlLine(OX+x0,OY+AH-y0,OX+x1,OY+AH-y1,'#fbbf24',2);
      // Residuals
      pts.forEach(p=>{const py=w*p.x+b;mlLine(OX+p.x,OY+AH-p.y,OX+p.x,OY+AH-py,'rgba(248,113,113,0.4)',1,[3,3]);});
    }
    // Loss curve (mini panel)
    const LX=OX+AW+28,LY=OY,LW=140,LH=100;
    ctx.save();ctx.fillStyle='rgba(255,255,255,0.04)';ctx.beginPath();ctx.roundRect(LX,LY,LW,LH,8);ctx.fill();ctx.restore();
    mlText(LX+LW/2,LY+12,'Loss curve','var(--text3)',9);
    if(lossHist.length>1){
      const mx=Math.max(...lossHist)||1;
      ctx.save();ctx.strokeStyle='#f87171';ctx.lineWidth=1.5;ctx.beginPath();
      lossHist.forEach((v,i)=>{
        const px=LX+4+(i/(lossHist.length-1))*(LW-8);
        const py=LY+LH-4-(v/mx)*(LH-20);
        i===0?ctx.moveTo(px,py):ctx.lineTo(px,py);
      });ctx.stroke();ctx.restore();
    }
    // Stats
    const SX=LX,SY=LY+LH+12;
    mlText(SX+LW/2,SY,`Epoch: ${epoch}`,'var(--text2)',11);
    mlText(SX+LW/2,SY+18,`MSE: ${mse().toFixed(2)}`,'#f87171',11);
    mlText(SX+LW/2,SY+36,`w = ${w.toFixed(4)}`,'#fbbf24',11);
    mlText(SX+LW/2,SY+54,`b = ${b.toFixed(2)}`,'#fbbf24',11);
    // Title
    mlText(OX+AW/2,OY-14,'Linear Regression — Gradient Descent','#38bdf8',13);
  }
  randPts();
}

// ══════════════════════════════════════════════════════════════════
//  K-NEAREST NEIGHBORS
// ══════════════════════════════════════════════════════════════════
function runKNN(){
  const CW=700,CH=500;
  const OX=60,OY=30,AW=430,AH=400;
  let K=3,pts=[],queryPt=null,mode='add0';
  const COLORS=['#38bdf8','#f472b6','#86efac'];
  const CLS=['Class A','Class B','Class C'];

  function classify(qx,qy,k){
    const dists=pts.map(p=>({...p,d:Math.hypot(p.x-qx,p.y-qy)}));
    dists.sort((a,b)=>a.d-b.d);
    const knn=dists.slice(0,k);
    const votes=[0,0,0];
    knn.forEach(p=>votes[p.c]++);
    return{cls:votes.indexOf(Math.max(...votes)),neighbors:knn};
  }

  buildLeftPanel(`
    <div class="panel-section">
      <div class="panel-section-title">Add Points</div>
      <button class="ctrl-btn primary" data-action="knn_c0">✚ Class A</button>
      <button class="ctrl-btn" data-action="knn_c1">✚ Class B</button>
      <button class="ctrl-btn" data-action="knn_c2">✚ Class C</button>
      <button class="ctrl-btn" data-action="knn_query">🎯 Set Query</button>
      <button class="ctrl-btn" data-action="knn_rand">🎲 Random</button>
      <button class="ctrl-btn" data-action="knn_clear">🗑 Clear</button>
    </div>
    <div class="panel-section">
      <div class="panel-section-title">Hyperparams</div>
      ${makeSlider('knn_k','K (Neighbors)',1,9,3,2,'',v=>{K=v;render();})}
    </div>`);
  buildRightPanel(csRightPanel(
    `<span class="cs-cm">// KNN Classification</span>\n<span class="cs-kw">for</span> each point p:\n  d = dist(query, p)\ndists.sort()\nknn = dists.slice(0,K)\nvotes = count classes\n<span class="cs-kw">return</span> majority(votes)`,
    'O(n) per query','O(n)','Click canvas to place points in the selected class, then set a query point.'
  ));

  LAB['knn_c0']=()=>mode='add0';LAB['knn_c1']=()=>mode='add1';LAB['knn_c2']=()=>mode='add2';
  LAB['knn_query']=()=>mode='query';
  LAB['knn_rand']=()=>{
    pts=[];
    [[120,120,0],[160,180,0],[100,200,0],[200,130,0],
     [300,300,1],[340,260,1],[280,320,1],[360,340,1],
     [200,350,2],[160,380,2],[240,400,2],[180,330,2]].forEach(([x,y,c])=>pts.push({x,y,c}));
    queryPt={x:220,y:230};render();
  };
  LAB['knn_clear']=()=>{pts=[];queryPt=null;render();};

  canvas.onclick=e=>{
    const r=canvas.getBoundingClientRect();
    const cx=e.clientX-r.left-OX,cy=e.clientY-r.top-OY;
    if(cx<0||cx>AW||cy<0||cy>AH)return;
    if(mode==='query'){queryPt={x:cx,y:cy};}
    else pts.push({x:cx,y:cy,c:+mode.replace('add','')});
    render();
  };

  function render(){
    clearCanvas();drawGrid(0.04);
    mlAxes(OX,OY,AW,AH);
    mlText(OX+AW/2,OY-14,'K-Nearest Neighbors Classification','#f472b6',13);

    // Draw decision boundary grid (fast pixel-ish approach)
    if(pts.length>=K){
      const step=12;
      for(let gx=0;gx<=AW;gx+=step){
        for(let gy=0;gy<=AH;gy+=step){
          const{cls}=classify(gx,gy,K);
          ctx.save();ctx.globalAlpha=0.12;ctx.fillStyle=COLORS[cls];
          ctx.fillRect(OX+gx-step/2,OY+gy-step/2,step,step);ctx.restore();
        }
      }
    }
    // Draw points
    pts.forEach(p=>{
      ctx.save();ctx.fillStyle=COLORS[p.c];ctx.strokeStyle='#0d0d1a';ctx.lineWidth=1.5;
      ctx.beginPath();ctx.arc(OX+p.x,OY+p.y,7,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.restore();
    });
    // Query point + KNN
    if(queryPt&&pts.length>=K){
      const{cls,neighbors}=classify(queryPt.x,queryPt.y,K);
      // Draw radius circle to Kth neighbor
      const kd=neighbors[K-1].d;
      ctx.save();ctx.strokeStyle='rgba(255,255,255,0.2)';ctx.lineWidth=1;ctx.setLineDash([4,4]);
      ctx.beginPath();ctx.arc(OX+queryPt.x,OY+queryPt.y,kd,0,Math.PI*2);ctx.stroke();ctx.restore();
      // Lines to neighbors
      neighbors.forEach(n=>{mlLine(OX+queryPt.x,OY+queryPt.y,OX+n.x,OY+n.y,'rgba(255,255,255,0.35)',1,[3,3]);});
      // Query dot
      ctx.save();ctx.fillStyle=COLORS[cls];ctx.strokeStyle='#fff';ctx.lineWidth=2.5;
      ctx.beginPath();ctx.arc(OX+queryPt.x,OY+queryPt.y,10,0,Math.PI*2);ctx.fill();ctx.stroke();
      ctx.fillStyle='#0d0d1a';ctx.font='bold 11px "Nunito"';ctx.textAlign='center';ctx.textBaseline='middle';
      ctx.fillText('?',OX+queryPt.x,OY+queryPt.y);ctx.restore();
      csSetStep(`Query → ${CLS[cls]} (K=${K}, Kth-dist=${neighbors[K-1].d.toFixed(1)})`);
    }
    // Legend
    const LX=OX+AW+16,LY=OY;
    CLS.forEach((n,i)=>{
      ctx.save();ctx.fillStyle=COLORS[i];ctx.beginPath();ctx.arc(LX+10,LY+20+i*26,7,0,Math.PI*2);ctx.fill();ctx.restore();
      mlText(LX+22,LY+20+i*26,n,'var(--text2)',11,'left');
    });
    mlText(LX+60,LY+100,`K = ${K}`,'#fbbf24',14,'center');
    mlText(LX+60,LY+118,`n = ${pts.length}`,'var(--text3)',11,'center');
    // Mode indicator
    const modeNames={'add0':'Adding Class A','add1':'Adding Class B','add2':'Adding Class C','query':'Setting Query'};
    mlText(OX+AW/2,OY+AH+18,`Mode: ${modeNames[mode]}`,'var(--text3)',10);
  }
  render();
  csSetStep('Select a class and click the canvas to add points. Then set a query point.');
}

// ══════════════════════════════════════════════════════════════════
//  K-MEANS CLUSTERING
// ══════════════════════════════════════════════════════════════════
function runKMeans(){
  const CW=700,CH=500;
  const OX=50,OY=30,AW=440,AH=400;
  let K=3,pts=[],centroids=[],assignment=[],iteration=0,converged=false;
  const COLS=['#38bdf8','#f472b6','#86efac','#fbbf24','#c084fc'];

  function randData(){
    pts=[];centroids=[];assignment=[];iteration=0;converged=false;
    for(let i=0;i<60;i++){
      const cx=Math.random()*AW*0.8+AW*0.1,cy=Math.random()*AH*0.8+AH*0.1;
      pts.push({x:cx+(Math.random()-0.5)*60,y:cy+(Math.random()-0.5)*60});
    }
    initCentroids();render();csSetStep('Random data. Press ▶ Step to iterate.');
  }
  function initCentroids(){
    centroids=[];
    // k-means++ init
    const pool=[...pts];
    centroids.push({...pool[Math.floor(Math.random()*pool.length)]});
    for(let i=1;i<K;i++){
      const w=pool.map(p=>Math.min(...centroids.map(c=>Math.hypot(p.x-c.x,p.y-c.y)))**2);
      const sum=w.reduce((a,b)=>a+b,0);
      let r=Math.random()*sum,idx=0;
      for(;idx<w.length-1&&(r-=w[idx])>0;idx++);
      centroids.push({...pool[idx]});
    }
    assignStep();
  }
  function assignStep(){
    assignment=pts.map(p=>centroids.map((c,i)=>({i,d:Math.hypot(p.x-c.x,p.y-c.y)})).sort((a,b)=>a.d-b.d)[0].i);
  }
  function updateStep(){
    const prevC=centroids.map(c=>({...c}));
    centroids=centroids.map((_,k)=>{
      const kpts=pts.filter((_,i)=>assignment[i]===k);
      if(!kpts.length)return _;
      return{x:kpts.reduce((s,p)=>s+p.x,0)/kpts.length,y:kpts.reduce((s,p)=>s+p.y,0)/kpts.length};
    });
    converged=centroids.every((c,i)=>Math.hypot(c.x-prevC[i].x,c.y-prevC[i].y)<0.5);
    assignStep();
    iteration++;
  }

  buildLeftPanel(`
    <div class="panel-section">
      <div class="panel-section-title">Data</div>
      <button class="ctrl-btn primary" data-action="km_rand">🎲 Random Data</button>
    </div>
    <div class="panel-section">
      <div class="panel-section-title">Hyperparams</div>
      ${makeSlider('km_k','K (Clusters)',2,5,3,1,'',v=>{K=v;randData();})}
    </div>
    <div class="panel-section">
      <div class="panel-section-title">Animate</div>
      <button class="ctrl-btn" data-action="km_step">▶ 1 Iteration</button>
      <button class="ctrl-btn" data-action="km_auto">⚡ Auto</button>
      <button class="ctrl-btn" data-action="km_reset">↺ Re-init</button>
    </div>`);
  buildRightPanel(csRightPanel(
    `<span class="cs-cm">// K-Means EM loop</span>\n<span class="cs-kw">while</span>(!converged):\n  <span class="cs-cm">// E-step</span>\n  <span class="cs-kw">for</span> p <span class="cs-kw">in</span> points:\n    assign(p, nearest_c)\n  <span class="cs-cm">// M-step</span>\n  <span class="cs-kw">for</span> c <span class="cs-kw">in</span> centroids:\n    c = mean(cluster_c)`,
    'O(k·n·iters)','O(k+n)','Watch centroids move each iteration until convergence.'
  ));

  LAB['km_rand']=randData;
  LAB['km_step']=()=>{if(converged){csSetStep('✅ Converged!');return;}updateStep();render();csSetStep(`Iteration ${iteration}${converged?' — ✅ Converged!':''}`);}
  LAB['km_auto']=()=>{
    function go(){if(converged){csSetStep('✅ Converged!');return;}updateStep();render();csSetStep(`Iter ${iteration}`);setTimeout(go,600);}
    go();
  };
  LAB['km_reset']=()=>{iteration=0;converged=false;initCentroids();render();csSetStep('Re-initialized centroids.');};

  function render(){
    clearCanvas();drawGrid(0.04);
    mlText(OX+AW/2,OY-14,'K-Means Clustering','#fb923c',13);
    mlAxes(OX,OY,AW,AH);
    // Points coloured by assignment
    pts.forEach((p,i)=>{
      const col=assignment.length?COLS[assignment[i]%COLS.length]:'rgba(255,255,255,0.3)';
      mlPoint(OX+p.x,OY+p.y,col,5);
    });
    // Centroids
    centroids.forEach((c,i)=>{
      ctx.save();ctx.fillStyle=COLS[i%COLS.length];ctx.strokeStyle='#fff';ctx.lineWidth=2;
      // Star shape
      ctx.beginPath();
      for(let s=0;s<5;s++){
        const a=s*Math.PI*2/5-Math.PI/2;
        const b=a+Math.PI/5;
        const r=13,r2=6;
        s===0?ctx.moveTo(OX+c.x+Math.cos(a)*r,OY+c.y+Math.sin(a)*r):ctx.lineTo(OX+c.x+Math.cos(a)*r,OY+c.y+Math.sin(a)*r);
        ctx.lineTo(OX+c.x+Math.cos(b)*r2,OY+c.y+Math.sin(b)*r2);
      }
      ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();
      mlText(OX+c.x,OY+c.y-20,`C${i+1}`,COLS[i%COLS.length],10);
    });
    // Stats panel
    const SX=OX+AW+16,SY=OY;
    mlText(SX+60,SY+14,'Iteration','var(--text3)',10,'center');
    mlText(SX+60,SY+30,String(iteration),'#fb923c',22,'center');
    mlText(SX+60,SY+58,converged?'✅ Converged':'Running...','var(--text2)',10,'center');
    centroids.forEach((c,i)=>{
      const cnt=pts.filter((_,pi)=>assignment[pi]===i).length;
      ctx.save();ctx.fillStyle=COLS[i%COLS.length];ctx.beginPath();ctx.arc(SX+10,SY+90+i*22,6,0,Math.PI*2);ctx.fill();ctx.restore();
      mlText(SX+18,SY+90+i*22,`C${i+1}: ${cnt} pts`,'var(--text2)',10,'left');
    });
  }
  randData();
}

// ══════════════════════════════════════════════════════════════════
//  DECISION TREE
// ══════════════════════════════════════════════════════════════════
function runDecisionTree(){
  const CW=700,CH=500;
  const OX=20,OY=20,AW=320,AH=320;
  let pts=[],tree=null,maxDepth=3,step=0,buildSteps=[];
  const COLS=['#38bdf8','#f472b6'];

  function randData(){
    pts=[];
    for(let i=0;i<40;i++){
      const c=i<20?0:1;
      pts.push({x:Math.random()*AW,y:Math.random()*AH,c});
    }
    tree=null;step=0;buildSteps=[];render();
    csSetStep('Random data placed. Press ▶ Build to grow the tree.');
  }

  function entropy(subset){
    if(!subset.length)return 0;
    const n=subset.length;
    const p=subset.filter(p=>p.c===0).length/n;
    if(p===0||p===1)return 0;
    return -p*Math.log2(p)-(1-p)*Math.log2(1-p);
  }

  function bestSplit(subset){
    let bestGain=-1,bestAxis=0,bestVal=0;
    ['x','y'].forEach((axis,ai)=>{
      const vals=[...new Set(subset.map(p=>p[axis]))].sort((a,b)=>a-b);
      for(let i=0;i<vals.length-1;i++){
        const mid=(vals[i]+vals[i+1])/2;
        const L=subset.filter(p=>p[axis]<=mid);
        const R=subset.filter(p=>p[axis]>mid);
        const gain=entropy(subset)-(L.length/subset.length)*entropy(L)-(R.length/subset.length)*entropy(R);
        if(gain>bestGain){bestGain=gain;bestAxis=ai;bestVal=mid;}
      }
    });
    return{axis:bestAxis?'y':'x',val:bestVal,gain:bestGain};
  }

  function buildTree(subset,depth,region){
    if(!subset.length)return{leaf:true,cls:0,count:0,region};
    const cls=subset.filter(p=>p.c===0).length>subset.length/2?0:1;
    if(depth>=maxDepth||entropy(subset)<0.05)return{leaf:true,cls,count:subset.length,region};
    const{axis,val,gain}=bestSplit(subset);
    if(gain<0.01)return{leaf:true,cls,count:subset.length,region};
    const L=subset.filter(p=>p[axis]<=val);
    const R=subset.filter(p=>p[axis]>val);
    const Lr={...region},Rr={...region};
    if(axis==='x'){Lr.x1=region.x0;Lr.x2=val;Rr.x1=val;Rr.x2=region.x2;}
    else{Lr.y1=region.y0;Lr.y2=val;Rr.y1=val;Rr.y2=region.y2;}
    buildSteps.push({axis,val,region:{...region},depth,gain,left:L.length,right:R.length});
    return{leaf:false,axis,val,gain,count:subset.length,region,
      left:buildTree(L,depth+1,{x0:region.x0,x2:axis==='x'?val:region.x2,y0:region.y0,y2:axis==='y'?val:region.y2}),
      right:buildTree(R,depth+1,{x0:axis==='x'?val:region.x0,x2:region.x2,y0:axis==='y'?val:region.y0,y2:region.y2})};
  }

  function collectLeaves(node,leaves=[]){
    if(!node)return leaves;
    if(node.leaf){leaves.push(node);return leaves;}
    collectLeaves(node.left,leaves);collectLeaves(node.right,leaves);
    return leaves;
  }

  function drawTreeDiagram(node,x,y,dx,lineY,parentX,parentY){
    if(!node||!node.count)return;
    const col=node.leaf?COLS[node.cls]:'var(--text3)';
    if(parentX!==null)mlLine(parentX,parentY,x,y,'rgba(255,255,255,0.2)',1);
    ctx.save();ctx.fillStyle=node.leaf?`rgba(${node.cls?'244,114,182':'56,189,248'},0.2)`:'rgba(255,255,255,0.07)';
    ctx.strokeStyle=col;ctx.lineWidth=1.5;ctx.beginPath();ctx.roundRect(x-40,y-18,80,36,8);ctx.fill();ctx.stroke();ctx.restore();
    if(node.leaf){
      mlText(x,y-5,`Cls ${node.cls===0?'A':'B'}`,COLS[node.cls],9);
      mlText(x,y+7,`n=${node.count}`,'var(--text3)',8);
    } else {
      mlText(x,y-5,`${node.axis}≤${node.val.toFixed(0)}`,'var(--text)',9);
      mlText(x,y+7,`IG=${node.gain.toFixed(2)}`,'var(--text3)',8);
      if(node.left)drawTreeDiagram(node.left,x-dx,y+55,dx*0.55,lineY,x,y+18);
      if(node.right)drawTreeDiagram(node.right,x+dx,y+55,dx*0.55,lineY,x,y+18);
    }
  }

  buildLeftPanel(`
    <div class="panel-section">
      <div class="panel-section-title">Data</div>
      <button class="ctrl-btn primary" data-action="dt_rand">🎲 Random Data</button>
    </div>
    <div class="panel-section">
      <div class="panel-section-title">Params</div>
      ${makeSlider('dt_depth','Max Depth',1,5,3,1,'',v=>{maxDepth=v;tree=null;step=0;buildSteps=[];render();})}
    </div>
    <div class="panel-section">
      <div class="panel-section-title">Build</div>
      <button class="ctrl-btn" data-action="dt_build">▶ Build Tree</button>
      <button class="ctrl-btn" data-action="dt_step">▶ Step Split</button>
      <button class="ctrl-btn" data-action="dt_reset">↺ Reset</button>
    </div>`);
  buildRightPanel(csRightPanel(
    `<span class="cs-cm">// Info Gain split</span>\nH = entropy(S)\n<span class="cs-kw">for</span> each feature/val:\n  IG = H - Σ|Sv|/|S|·H(Sv)\nbest = argmax(IG)\nif IG > 0:\n  split(best)\n  recurse(L, R)`,
    'O(n·d·log n)','O(n)','Left: feature space splits. Right: tree structure. Press ▶ Build Tree or ▶ Step Split.'
  ));

  LAB['dt_rand']=randData;
  LAB['dt_build']=()=>{buildSteps=[];tree=buildTree(pts,0,{x0:0,x2:AW,y0:0,y2:AH});step=buildSteps.length;render();csSetStep(`Tree built: ${collectLeaves(tree).length} leaves, depth ≤ ${maxDepth}`);};
  LAB['dt_step']=()=>{
    if(!buildSteps.length){buildSteps=[];tree=buildTree(pts,0,{x0:0,x2:AW,y0:0,y2:AH});step=0;}
    if(step<buildSteps.length){step++;render();const s=buildSteps[step-1];csSetStep(`Split on ${s.axis}≤${s.val.toFixed(1)}, IG=${s.gain.toFixed(3)}, L=${s.left} R=${s.right}`);}
    else csSetStep('Tree complete.');
  };
  LAB['dt_reset']=()=>{tree=null;step=0;buildSteps=[];render();csSetStep('Reset.');};

  canvas.onclick=e=>{
    const r=canvas.getBoundingClientRect();
    const cx=e.clientX-r.left-OX,cy=e.clientY-r.top-OY;
    if(cx>=0&&cx<=AW&&cy>=0&&cy<=AH){pts.push({x:cx,y:cy,c:pts.length%2});tree=null;step=0;buildSteps=[];render();}
  };

  function render(){
    clearCanvas();drawGrid(0.04);
    mlText(OX+AW/2,OY-8,'Feature Space','var(--text3)',10);
    // Draw regions
    if(tree){
      collectLeaves(tree).forEach(leaf=>{
        if(!leaf.region)return;
        const{x0=0,x2=AW,y0=0,y2=AH}=leaf.region;
        ctx.save();ctx.fillStyle=`rgba(${leaf.cls?'244,114,182':'56,189,248'},0.1)`;
        ctx.fillRect(OX+x0,OY+y0,x2-x0,y2-y0);ctx.restore();
      });
    }
    // Draw step splits
    const stepsToShow=buildSteps.slice(0,step);
    stepsToShow.forEach((s,i)=>{
      const isLast=i===step-1;
      const col=isLast?'#fbbf24':'rgba(255,255,255,0.2)';
      const lw=isLast?2:1;
      const{region,axis,val}=s;
      if(axis==='x')mlLine(OX+val,OY+(region.y0||0),OX+val,OY+(region.y2||AH),col,lw);
      else mlLine(OX+(region.x0||0),OY+val,OX+(region.x2||AW),OY+val,col,lw);
    });
    // Border
    ctx.save();ctx.strokeStyle='var(--border)';ctx.lineWidth=1;ctx.strokeRect(OX,OY,AW,AH);ctx.restore();
    // Points
    pts.forEach(p=>{
      ctx.save();ctx.fillStyle=COLS[p.c];ctx.strokeStyle='#0d0d1a';ctx.lineWidth=1;
      ctx.beginPath();ctx.arc(OX+p.x,OY+p.y,5,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.restore();
    });
    // Tree diagram
    if(tree)drawTreeDiagram(tree,CW-170,50,70,0,null,null);
    mlText(CW-170,30,'Decision Tree','var(--text3)',10);
  }
  randData();
}

// ══════════════════════════════════════════════════════════════════
//  PERCEPTRON
// ══════════════════════════════════════════════════════════════════
function runPerceptron(){
  const CW=700,CH=500;
  const OX=50,OY=20,AW=400,AH=420;
  let pts=[],w1=Math.random()-0.5,w2=Math.random()-0.5,bias=0;
  let lr=0.1,epoch=0,errors=0,errorHist=[],running=false,rafId=null;

  function predict(x,y){return (w1*x+w2*y+bias)>=0?1:-1;}
  function normalize(x,y){return{nx:(x/AW)*2-1,ny:(y/AH)*2-1};}

  function trainStep(){
    errors=0;
    pts.forEach(p=>{
      const{nx,ny}=normalize(p.x,p.y);
      const pred=predict(nx,ny);
      if(pred!==p.c){
        w1+=lr*p.c*nx; w2+=lr*p.c*ny; bias+=lr*p.c;
        errors++;
      }
    });
    epoch++;
    errorHist.push(errors);
    if(errorHist.length>60)errorHist.shift();
  }

  function lineY(x){
    // w1*nx+w2*ny+bias=0 → ny=(-w1*nx-bias)/w2
    // Convert back to canvas coords
    const nx=(x/AW)*2-1;
    if(Math.abs(w2)<0.001)return null;
    const ny=(-w1*nx-bias)/w2;
    return(ny+1)/2*AH;
  }

  function randData(){
    pts=[];w1=Math.random()-0.5;w2=Math.random()-0.5;bias=0;epoch=0;errors=0;errorHist=[];
    // Two linearly separable clusters
    for(let i=0;i<20;i++)pts.push({x:20+Math.random()*160,y:20+Math.random()*160,c:1});
    for(let i=0;i<20;i++)pts.push({x:220+Math.random()*160,y:260+Math.random()*160,c:-1});
    render();csSetStep('Two linearly separable classes. Press ⚡ Train or ▶ Epoch.');
  }

  buildLeftPanel(`
    <div class="panel-section">
      <div class="panel-section-title">Data</div>
      <button class="ctrl-btn primary" data-action="perc_rand">🎲 Separable</button>
      <button class="ctrl-btn" data-action="perc_hard">⚡ Hard Case</button>
      <button class="ctrl-btn" data-action="perc_c1">✚ Class +1</button>
      <button class="ctrl-btn" data-action="perc_cm">✚ Class -1</button>
    </div>
    <div class="panel-section">
      <div class="panel-section-title">Hyperparams</div>
      ${makeSlider('perc_lr','Learning Rate',1,20,2,1,'×10⁻¹',v=>{lr=v/10;})}
    </div>
    <div class="panel-section">
      <div class="panel-section-title">Train</div>
      <button class="ctrl-btn" data-action="perc_step">▶ 1 Epoch</button>
      <button class="ctrl-btn" data-action="perc_train">⚡ Train</button>
      <button class="ctrl-btn" data-action="perc_stop">⏹ Stop</button>
    </div>`);
  buildRightPanel(csRightPanel(
    `<span class="cs-cm">// Perceptron Rule</span>\nŷ = sign(w·x + b)\n<span class="cs-kw">for</span> each (x,y):\n  <span class="cs-kw">if</span> ŷ ≠ y:\n    w += α·y·x\n    b += α·y\n<span class="cs-cm">// Converges if</span>\n<span class="cs-cm">// linearly separable</span>`,
    'O(n·epochs)','O(d)','Watch the decision boundary rotate until all points are classified.'
  ));

  let addMode=null;
  LAB['perc_rand']=randData;
  LAB['perc_hard']=()=>{
    pts=[];w1=Math.random()-0.5;w2=Math.random()-0.5;bias=0;epoch=0;errors=0;errorHist=[];
    for(let i=0;i<18;i++){const a=Math.random()*Math.PI*2,r=30+Math.random()*50;pts.push({x:AW/2+Math.cos(a)*r,y:AH/2+Math.sin(a)*r,c:1});}
    for(let i=0;i<18;i++){const a=Math.random()*Math.PI*2,r=120+Math.random()*50;pts.push({x:AW/2+Math.cos(a)*r,y:AH/2+Math.sin(a)*r,c:-1});}
    render();csSetStep('Near-separable data. Perceptron will struggle with non-linearly separable sets.');
  };
  LAB['perc_c1']=()=>addMode=1;LAB['perc_cm']=()=>addMode=-1;
  LAB['perc_step']=()=>{if(!pts.length)return;trainStep();render();csSetStep(`Epoch ${epoch} | Errors: ${errors}/${pts.length}${errors===0?' ✅ Converged!':''}`)};
  LAB['perc_train']=()=>{
    running=true;
    function go(){
      if(!running||errors===0&&epoch>0)return;
      trainStep();render();csSetStep(`Epoch ${epoch} | Errors: ${errors}`);
      if(errors===0){csSetStep(`✅ Converged in ${epoch} epochs!`);return;}
      rafId=setTimeout(go,80);
    }
    go();
  };
  LAB['perc_stop']=()=>{running=false;clearTimeout(rafId);};

  canvas.onclick=e=>{
    if(!addMode)return;
    const r=canvas.getBoundingClientRect();
    pts.push({x:e.clientX-r.left-OX,y:e.clientY-r.top-OY,c:addMode});
    render();
  };

  function render(){
    clearCanvas();drawGrid(0.04);
    // Shaded half-planes
    if(pts.length>0){
      const y0=lineY(0),y1=lineY(AW);
      if(y0!==null&&y1!==null){
        ctx.save();
        ctx.beginPath();ctx.moveTo(OX,OY+y0);ctx.lineTo(OX+AW,OY+y1);ctx.lineTo(OX+AW,OY);ctx.lineTo(OX,OY);ctx.closePath();
        ctx.fillStyle='rgba(56,189,248,0.07)';ctx.fill();
        ctx.beginPath();ctx.moveTo(OX,OY+y0);ctx.lineTo(OX+AW,OY+y1);ctx.lineTo(OX+AW,OY+AH);ctx.lineTo(OX,OY+AH);ctx.closePath();
        ctx.fillStyle='rgba(244,114,182,0.07)';ctx.fill();
        ctx.restore();
        // Decision boundary line
        mlLine(OX,OY+y0,OX+AW,OY+y1,'#fbbf24',2);
        // Normal vector
        const len=60,nx=w1,ny=w2,mag=Math.hypot(nx,ny)||1;
        const mx=OX+AW/2,my=OY+AH/2;
        mlLine(mx,my,mx+nx/mag*len,my+ny/mag*len,'rgba(251,191,36,0.5)',1.5,[4,4]);
        ctx.save();ctx.fillStyle='#fbbf24';ctx.beginPath();ctx.arc(mx+nx/mag*len,my+ny/mag*len,4,0,Math.PI*2);ctx.fill();ctx.restore();
      }
    }
    // Points
    pts.forEach(p=>{
      const col=p.c===1?'#38bdf8':'#f472b6';
      const wrong=pts.length>0&&predict(normalize(p.x,p.y).nx,normalize(p.x,p.y).ny)!==p.c;
      ctx.save();ctx.fillStyle=col;ctx.strokeStyle=wrong?'#ff4757':'#0d0d1a';ctx.lineWidth=wrong?2.5:1.5;
      ctx.beginPath();
      if(p.c===1){ctx.arc(OX+p.x,OY+p.y,7,0,Math.PI*2);}
      else{const s=7;ctx.rect(OX+p.x-s,OY+p.y-s,s*2,s*2);}
      ctx.fill();ctx.stroke();ctx.restore();
    });
    // Axes
    ctx.save();ctx.strokeStyle='rgba(255,255,255,0.12)';ctx.lineWidth=1;ctx.strokeRect(OX,OY,AW,AH);ctx.restore();
    // Stats panel
    const SX=OX+AW+20,SY=OY;
    mlText(SX+80,SY+16,'Perceptron','var(--text3)',10,'center');
    mlText(SX+80,SY+36,`Epoch: ${epoch}`,'var(--text2)',12,'center');
    mlText(SX+80,SY+54,`Errors: ${errors}/${pts.length}`,'#f87171',12,'center');
    mlText(SX+80,SY+72,`w₁=${w1.toFixed(3)}`,'#fbbf24',10,'center');
    mlText(SX+80,SY+88,`w₂=${w2.toFixed(3)}`,'#fbbf24',10,'center');
    mlText(SX+80,SY+104,`b=${bias.toFixed(3)}`,'#fbbf24',10,'center');
    // Error history
    if(errorHist.length>1){
      const EX=SX,EY=SY+120,EW=160,EH=80;
      ctx.save();ctx.fillStyle='rgba(255,255,255,0.04)';ctx.beginPath();ctx.roundRect(EX,EY,EW,EH,6);ctx.fill();ctx.restore();
      mlText(EX+EW/2,EY+10,'Errors/epoch','var(--text3)',8);
      const mx=Math.max(...errorHist)||1;
      ctx.save();ctx.strokeStyle='#f87171';ctx.lineWidth=1.5;ctx.beginPath();
      errorHist.forEach((v,i)=>{const px=EX+4+(i/(errorHist.length-1))*(EW-8),py=EY+EH-4-(v/mx)*(EH-20);i===0?ctx.moveTo(px,py):ctx.lineTo(px,py);});
      ctx.stroke();ctx.restore();
    }
    // Legend
    mlText(SX+80,SY+220,'● Class +1 (circle)','#38bdf8',9,'center');
    mlText(SX+80,SY+238,'■ Class -1 (square)','#f472b6',9,'center');
    mlText(SX+80,SY+256,'— Decision boundary','#fbbf24',9,'center');
    mlText(SX+80,SY+274,'✕ Misclassified','#ff4757',9,'center');
    mlText(OX+AW/2,OY-10,'Perceptron — Linear Separability','#c084fc',13,'center');
  }
  randData();
}

// ── Crypto implementations injected below ──

