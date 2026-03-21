//  COMPUTATIONAL GEOMETRY — SHARED HELPERS
// ══════════════════════════════════════════════════════════════════
function cross2D(O, A, B) {
  return (A[0]-O[0])*(B[1]-O[1]) - (A[1]-O[1])*(B[0]-O[0]);
}
function dist2D(a,b) {
  const dx=a[0]-b[0], dy=a[1]-b[1]; return Math.sqrt(dx*dx+dy*dy);
}
function drawPoint(x,y,r,color,label) {
  ctx.save(); ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2);
  ctx.fillStyle=color; ctx.fill();
  if(label){ ctx.fillStyle='#e8e8ff'; ctx.font='11px "Space Mono",monospace';
    ctx.fillText(label,x+r+3,y+4); }
  ctx.restore();
}
function drawLine(x1,y1,x2,y2,color,width=1.5,dash=[]) {
  ctx.save(); ctx.strokeStyle=color; ctx.lineWidth=width;
  ctx.setLineDash(dash); ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
  ctx.restore();
}

// ══════════════════════════════════════════════════════════════════
//  CONVEX HULL (Graham Scan) — draggable points, animated hull
// ══════════════════════════════════════════════════════════════════
function runConvexHull() {
  const W=700,H=500;
  let pts=[], hull=[], hullStep=0, running=false, dragging=-1;
  // random initial points
  function randomPts(n=16) {
    pts=[];
    for(let i=0;i<n;i++) pts.push([60+Math.random()*(W-120), 60+Math.random()*(H-120)]);
    hull=[]; hullStep=0; running=false;
  }
  randomPts();

  function grahamHullSteps(pts) {
    if(pts.length<3) return [pts.slice()];
    const sorted=[...pts];
    let base=sorted.reduce((a,b)=>a[1]>b[1]||(a[1]===b[1]&&a[0]>b[0])?b:a);
    sorted.sort((a,b)=>{
      const ca=Math.atan2(a[1]-base[1],a[0]-base[0]);
      const cb=Math.atan2(b[1]-base[1],b[0]-base[0]);
      return ca-cb;
    });
    const steps=[]; const stack=[sorted[0],sorted[1]];
    steps.push({stack:[...stack],processing:2});
    for(let i=2;i<sorted.length;i++){
      while(stack.length>=2 && cross2D(stack[stack.length-2],stack[stack.length-1],sorted[i])<=0) stack.pop();
      stack.push(sorted[i]);
      steps.push({stack:[...stack],processing:i,current:sorted[i]});
    }
    // close hull
    stack.push(stack[0]);
    steps.push({stack:[...stack],processing:-1,done:true});
    return steps;
  }

  buildLeftPanel(`
    <div class="panel-section">
      <div class="panel-section-title">Controls</div>
      <button class="ctrl-btn primary" data-action="ch_run">▶ Run Graham Scan</button>
      <button class="ctrl-btn" data-action="ch_random">🔀 New Points</button>
      <button class="ctrl-btn" data-action="ch_reset">↺ Reset</button>
    </div>
    <div class="panel-section">
      <div class="panel-section-title">Interact</div>
      <div style="font-family:'Space Mono',monospace;font-size:10px;color:var(--text3);line-height:1.8;padding:0 4px;">
        ◈ Drag points freely<br>◈ Click canvas to add<br>◈ Click point to delete
      </div>
    </div>`);

  buildRightPanel(csRightPanel(
    `<span class="cs-kw">int</span> <span class="cs-fn">cross</span>(P O, P A, P B) {\n  <span class="cs-kw">return</span> (A.x-O.x)*(B.y-O.y)-(A.y-O.y)*(B.x-O.x);\n}\nvector&lt;P&gt; <span class="cs-fn">convexHull</span>(vector&lt;P&gt; pts) {\n  sort(pts.begin(),pts.end());\n  <span class="cs-kw">int</span> n=pts.size(), k=0;\n  vector&lt;P&gt; H(2*n);\n  <span class="cs-kw">for</span>(<span class="cs-type">int</span> i=0;i&lt;n;i++) {\n    <span class="cs-kw">while</span>(k>=2&&cross(H[k-2],H[k-1],pts[i])<=0) k--;\n    H[k++]=pts[i];\n  }\n  <span class="cs-kw">return</span> H;\n}`,
    'O(n log n)', 'O(n)',
    'Drag points or add/remove. Press ▶ to animate Graham Scan.'
  ));

  LAB['ch_run']=()=>{
    if(pts.length<3){csSetStep('Need at least 3 points!');return;}
    running=true; hull=[];
    const steps=grahamHullSteps(pts);
    let si=0;
    function animate(){
      if(si>=steps.length){running=false;return;}
      hull=steps[si].stack; si++;
      const done=steps[si-1].done;
      csSetStep(done?`✅ Convex hull complete! ${hull.length-1} hull points.`:`Building hull... stack size: ${hull.length}`); csHL(done?8:7);
      render();
      if(!done) setTimeout(animate,350);
    }
    animate();
  };
  LAB['ch_random']=()=>{ randomPts(); render(); csSetStep('New random points. Press ▶ to run.'); };
  LAB['ch_reset']=()=>{ hull=[]; render(); csSetStep('Hull cleared.'); };

  // Drag + click
  canvas.onmousedown=e=>{
    const r=canvas.getBoundingClientRect();
    const mx=(e.clientX-r.left)*(W/r.width), my=(e.clientY-r.top)*(H/r.height);
    for(let i=0;i<pts.length;i++){
      if(dist2D([mx,my],pts[i])<12){ dragging=i; return; }
    }
    pts.push([mx,my]); hull=[]; render();
  };
  canvas.onmousemove=e=>{
    if(dragging<0) return;
    const r=canvas.getBoundingClientRect();
    pts[dragging]=[(e.clientX-r.left)*(W/r.width),(e.clientY-r.top)*(H/r.height)];
    hull=[]; render();
  };
  canvas.onmouseup=()=>{ dragging=-1; };

  function render(){
    clearCanvas(); drawGrid(0.06);
    // draw hull fill
    if(hull.length>2){
      ctx.save(); ctx.beginPath();
      ctx.moveTo(hull[0][0],hull[0][1]);
      hull.forEach(p=>ctx.lineTo(p[0],p[1]));
      ctx.closePath();
      ctx.fillStyle='rgba(34,211,238,0.08)'; ctx.fill();
      ctx.strokeStyle='#22d3ee'; ctx.lineWidth=2; ctx.stroke();
      ctx.restore();
    }
    // draw all points
    pts.forEach((p,i)=>{
      const onHull=hull.some(h=>h[0]===p[0]&&h[1]===p[1]);
      drawPoint(p[0],p[1],onHull?8:5, onHull?'#22d3ee':'var(--text3)');
    });
  }
  render();
  csSetStep('Drag points or click to add. Press ▶ Run Graham Scan.');
}

// ══════════════════════════════════════════════════════════════════
//  LINE SEGMENT INTERSECTION
// ══════════════════════════════════════════════════════════════════
function runLineIntersection() {
  const W=700,H=500;
  // pairs of segments: [x1,y1,x2,y2]
  let segs=[[100,200,400,120],[200,80,280,420],[350,150,600,350],[80,350,500,280]];
  let draggingPt=null; // {si, which} si=seg index, which=0/1

  function orientation(ax,ay,bx,by,cx,cy){
    const v=(by-ay)*(cx-bx)-(bx-ax)*(cy-by);
    return v===0?0:v>0?1:-1;
  }
  function onSegment(ax,ay,bx,by,px,py){
    return Math.min(ax,bx)<=px&&px<=Math.max(ax,bx)&&Math.min(ay,by)<=py&&py<=Math.max(ay,by);
  }
  function intersects(s1,s2){
    const[ax,ay,bx,by]=s1, [cx,cy,dx,dy]=s2;
    const o1=orientation(ax,ay,bx,by,cx,cy), o2=orientation(ax,ay,bx,by,dx,dy);
    const o3=orientation(cx,cy,dx,dy,ax,ay), o4=orientation(cx,cy,dx,dy,bx,by);
    if(o1!==o2&&o3!==o4) return true;
    if(o1===0&&onSegment(ax,ay,bx,by,cx,cy)) return true;
    if(o2===0&&onSegment(ax,ay,bx,by,dx,dy)) return true;
    if(o3===0&&onSegment(cx,cy,dx,dy,ax,ay)) return true;
    if(o4===0&&onSegment(cx,cy,dx,dy,bx,by)) return true;
    return false;
  }
  function findIntersectionPoint(s1,s2){
    const[ax,ay,bx,by]=s1, [cx,cy,dx,dy]=s2;
    const d=(ax-bx)*(cy-dy)-(ay-by)*(cx-dx);
    if(Math.abs(d)<1e-10) return null;
    const t=((ax-cx)*(cy-dy)-(ay-cy)*(cx-dx))/d;
    return [ax+t*(bx-ax), ay+t*(by-ay)];
  }

  buildLeftPanel(`
    <div class="panel-section">
      <div class="panel-section-title">Controls</div>
      <button class="ctrl-btn primary" data-action="li_check">🔍 Check All</button>
      <button class="ctrl-btn" data-action="li_random">🔀 New Segments</button>
    </div>
    <div class="panel-section">
      <div class="panel-section-title">Interact</div>
      <div style="font-family:'Space Mono',monospace;font-size:10px;color:var(--text3);line-height:1.8;padding:0 4px;">
        ◈ Drag endpoints to<br>&nbsp;&nbsp;reposition segments<br>◈ Intersections shown in red
      </div>
    </div>`);

  buildRightPanel(csRightPanel(
    `<span class="cs-kw">int</span> <span class="cs-fn">orient</span>(P a,P b,P c){\n  <span class="cs-type">auto</span> v=(b-a).cross(c-b);\n  <span class="cs-kw">return</span> v==0?0:v>0?1:-1;\n}\n<span class="cs-type">bool</span> <span class="cs-fn">intersect</span>(Seg s1,Seg s2){\n  <span class="cs-kw">auto</span>[a,b]=s1; <span class="cs-kw">auto</span>[c,d]=s2;\n  <span class="cs-kw">return</span> orient(a,b,c)!=orient(a,b,d)\n    &&orient(c,d,a)!=orient(c,d,b);\n}`,
    'O(1) per pair', 'O(1)',
    'Drag segment endpoints. Intersections glow red.'
  ));

  canvas.onmousedown=e=>{
    const r=canvas.getBoundingClientRect();
    const mx=(e.clientX-r.left)*(W/r.width), my=(e.clientY-r.top)*(H/r.height);
    for(let si=0;si<segs.length;si++){
      const [x1,y1,x2,y2]=segs[si];
      if(Math.hypot(mx-x1,my-y1)<12){ draggingPt={si,which:0}; return; }
      if(Math.hypot(mx-x2,my-y2)<12){ draggingPt={si,which:1}; return; }
    }
  };
  canvas.onmousemove=e=>{
    if(!draggingPt) return;
    const r=canvas.getBoundingClientRect();
    const mx=(e.clientX-r.left)*(W/r.width), my=(e.clientY-r.top)*(H/r.height);
    const {si,which}=draggingPt;
    if(which===0){ segs[si][0]=mx; segs[si][1]=my; }
    else         { segs[si][2]=mx; segs[si][3]=my; }
    render();
  };
  canvas.onmouseup=()=>{ draggingPt=null; };

  LAB['li_check']=()=>{
    let cnt=0;
    for(let i=0;i<segs.length;i++) for(let j=i+1;j<segs.length;j++) if(intersects(segs[i],segs[j])) cnt++;
    csHL(6); csSetStep(`Found ${cnt} intersection${cnt!==1?'s':''} among ${segs.length} segments.`);
    render();
  };
  LAB['li_random']=()=>{
    segs=Array.from({length:4},()=>[60+Math.random()*(W-120),60+Math.random()*(H-120),60+Math.random()*(W-120),60+Math.random()*(H-120)]);
    render();
  };

  const COLORS=['#22d3ee','#a78bfa','#fb923c','#34d399'];
  function render(){
    clearCanvas(); drawGrid(0.06);
    const pairs=[]; // intersecting pairs
    for(let i=0;i<segs.length;i++) for(let j=i+1;j<segs.length;j++)
      if(intersects(segs[i],segs[j])) pairs.push([i,j]);

    const hitting=new Set(pairs.flatMap(([a,b])=>[a,b]));
    segs.forEach(([x1,y1,x2,y2],i)=>{
      const col=hitting.has(i)?'#ff4757':COLORS[i%COLORS.length];
      drawLine(x1,y1,x2,y2,col,hitting.has(i)?3:2);
      drawPoint(x1,y1,7,col); drawPoint(x2,y2,7,col);
    });
    // draw intersection points
    pairs.forEach(([a,b])=>{
      const pt=findIntersectionPoint(segs[a],segs[b]);
      if(pt){ ctx.save(); ctx.beginPath(); ctx.arc(pt[0],pt[1],8,0,Math.PI*2);
        ctx.strokeStyle='#ff4757'; ctx.lineWidth=2.5; ctx.stroke();
        ctx.fillStyle='rgba(255,71,87,0.25)'; ctx.fill(); ctx.restore(); }
    });
    // labels
    segs.forEach(([x1,y1,x2,y2],i)=>{
      label(`S${i+1}`,x1-18,y1+4,COLORS[i%COLORS.length],12);
    });
  }
  render();
  csSetStep('Drag segment endpoints. Intersecting segments glow red with ○ markers.');
}

// ══════════════════════════════════════════════════════════════════
//  CLOSEST PAIR OF POINTS
// ══════════════════════════════════════════════════════════════════
function runClosestPair() {
  const W=700,H=500;
  let pts=[], best=null, stripPts=[], divX=0;

  function randomPts(n=20){
    pts=Array.from({length:n},()=>[40+Math.random()*(W-80),40+Math.random()*(H-80)]);
    best=null; stripPts=[]; divX=0;
  }
  randomPts();

  function bruteClosest(ps){
    let best=Infinity, pair=null;
    for(let i=0;i<ps.length;i++) for(let j=i+1;j<ps.length;j++){
      const d=dist2D(ps[i],ps[j]);
      if(d<best){ best=d; pair=[ps[i],ps[j]]; }
    }
    return {d:best,pair};
  }
  function closestPair(ps){
    if(ps.length<=3) return bruteClosest(ps);
    const sorted=[...ps].sort((a,b)=>a[0]-b[0]);
    const mid=Math.floor(sorted.length/2);
    const midX=sorted[mid][0];
    const L=sorted.slice(0,mid), R=sorted.slice(mid);
    const left=closestPair(L), right=closestPair(R);
    const d=Math.min(left.d,right.d);
    const strip=sorted.filter(p=>Math.abs(p[0]-midX)<d);
    strip.sort((a,b)=>a[1]-b[1]);
    let res=d<left.d?{d,pair:right.pair}:left;
    for(let i=0;i<strip.length;i++)
      for(let j=i+1;j<strip.length&&(strip[j][1]-strip[i][1])<d;j++){
        const sd=dist2D(strip[i],strip[j]);
        if(sd<res.d){ res={d:sd,pair:[strip[i],strip[j]]}; }
      }
    return res;
  }

  buildLeftPanel(`
    <div class="panel-section">
      <div class="panel-section-title">Controls</div>
      <button class="ctrl-btn primary" data-action="cp_run">▶ Find Closest Pair</button>
      <button class="ctrl-btn" data-action="cp_random">🔀 New Points</button>
    </div>
    <div class="panel-section">
      <div class="panel-section-title">Interact</div>
      <div style="font-family:'Space Mono',monospace;font-size:10px;color:var(--text3);line-height:1.8;padding:0 4px;">
        ◈ Click canvas to add points<br>◈ Closest pair glows cyan
      </div>
    </div>`);

  buildRightPanel(csRightPanel(
    `<span class="cs-kw">double</span> <span class="cs-fn">closestPair</span>(pts, l, r) {\n  <span class="cs-kw">if</span>(r-l&lt;=3) <span class="cs-kw">return</span> <span class="cs-fn">brute</span>(pts,l,r);\n  <span class="cs-type">int</span> m=(l+r)/2;\n  <span class="cs-type">double</span> d=<span class="cs-fn">min</span>(\n    <span class="cs-fn">closestPair</span>(pts,l,m),\n    <span class="cs-fn">closestPair</span>(pts,m,r));\n  <span class="cs-cm">// check strip of width 2d</span>\n  <span class="cs-kw">return</span> <span class="cs-fn">stripCheck</span>(pts,m,d);\n}`,
    'O(n log n)', 'O(n)',
    'Add points then press ▶ Find Closest Pair.'
  ));

  LAB['cp_run']=()=>{
    if(pts.length<2){csSetStep('Need at least 2 points!');return;}
    const sorted=[...pts].sort((a,b)=>a[0]-b[0]);
    const mid=Math.floor(sorted.length/2);
    divX=sorted[mid][0];
    best=closestPair(pts);
    const d=Math.min(...pts.map((_,i)=>pts.slice(i+1).map(q=>dist2D(pts[i],q))).flat().filter(x=>x>0));
    stripPts=pts.filter(p=>Math.abs(p[0]-divX)<best.d);
    csHL(8); csSetStep(`✅ Closest pair distance: ${best.d.toFixed(2)}px — found in O(n log n)`);
    render();
  };
  LAB['cp_random']=()=>{ randomPts(); render(); csSetStep('New points generated. Press ▶ to find closest pair.'); };

  canvas.onclick=e=>{
    const r=canvas.getBoundingClientRect();
    pts.push([(e.clientX-r.left)*(W/r.width),(e.clientY-r.top)*(H/r.height)]);
    best=null; render();
  };

  function render(){
    clearCanvas(); drawGrid(0.06);
    if(best){
      // dividing line
      drawLine(divX,0,divX,H,'rgba(245,158,11,0.3)',1,[6,4]);
      // strip shading
      ctx.save(); ctx.fillStyle='rgba(34,211,238,0.04)';
      ctx.fillRect(divX-best.d,0,best.d*2,H); ctx.restore();
      // closest pair line
      drawLine(best.pair[0][0],best.pair[0][1],best.pair[1][0],best.pair[1][1],'#22d3ee',2.5);
      // circle around pair
      const mx=(best.pair[0][0]+best.pair[1][0])/2, my=(best.pair[0][1]+best.pair[1][1])/2;
      ctx.save(); ctx.beginPath(); ctx.arc(mx,my,best.d/2+6,0,Math.PI*2);
      ctx.strokeStyle='rgba(34,211,238,0.35)'; ctx.lineWidth=1.5; ctx.setLineDash([4,4]); ctx.stroke();
      ctx.restore();
    }
    pts.forEach((p,i)=>{
      const inBest=best&&best.pair.includes(p);
      drawPoint(p[0],p[1],inBest?8:5,inBest?'#22d3ee':'var(--text3)');
    });
  }
  render();
  csSetStep('Add points (click) or press 🔀 for random points, then ▶ Find Closest Pair.');
}

// ══════════════════════════════════════════════════════════════════
//  POLYGON AREA (Shoelace Formula)
// ══════════════════════════════════════════════════════════════════
function runPolygonArea() {
  const W=700,H=500;
  let verts=[], dragging=-1;
  // default pentagon
  const cx=W/2, cy=H/2, R=160;
  for(let i=0;i<6;i++) verts.push([cx+R*Math.cos(-Math.PI/2+i*Math.PI*2/6), cy+R*Math.sin(-Math.PI/2+i*Math.PI*2/6)]);

  function shoelace(vs){
    let sum=0;
    for(let i=0;i<vs.length;i++){
      const j=(i+1)%vs.length;
      sum+=vs[i][0]*vs[j][1]-vs[j][0]*vs[i][1];
    }
    return Math.abs(sum)/2;
  }

  buildLeftPanel(`
    <div class="panel-section">
      <div class="panel-section-title">Controls</div>
      <button class="ctrl-btn primary" data-action="pa_calc">📐 Calculate Area</button>
      <button class="ctrl-btn" data-action="pa_clear">↺ Reset</button>
    </div>
    <div class="panel-section">
      <div class="panel-section-title">Interact</div>
      <div style="font-family:'Space Mono',monospace;font-size:10px;color:var(--text3);line-height:1.8;padding:0 4px;">
        ◈ Drag vertices to reshape<br>◈ Click canvas to add vertex<br>◈ Area updates live
      </div>
    </div>`);

  buildRightPanel(csRightPanel(
    `<span class="cs-kw">double</span> <span class="cs-fn">polygonArea</span>(vector&lt;P&gt; v) {\n  <span class="cs-type">double</span> area = 0;\n  <span class="cs-type">int</span> n = v.size();\n  <span class="cs-kw">for</span>(<span class="cs-type">int</span> i=0;i&lt;n;i++) {\n    <span class="cs-type">int</span> j=(i+1)%n;\n    area += v[i].x*v[j].y;\n    area -= v[j].x*v[i].y;\n  }\n  <span class="cs-kw">return</span> abs(area)/2.0;\n}`,
    'O(n)', 'O(1)',
    'Drag vertices to reshape polygon. Area shown live.'
  ));

  canvas.onmousedown=e=>{
    const r=canvas.getBoundingClientRect();
    const mx=(e.clientX-r.left)*(W/r.width), my=(e.clientY-r.top)*(H/r.height);
    for(let i=0;i<verts.length;i++){
      if(Math.hypot(mx-verts[i][0],my-verts[i][1])<12){ dragging=i; return; }
    }
    verts.push([mx,my]); render();
  };
  canvas.onmousemove=e=>{
    if(dragging<0) return;
    const r=canvas.getBoundingClientRect();
    verts[dragging]=[(e.clientX-r.left)*(W/r.width),(e.clientY-r.top)*(H/r.height)];
    render(); showArea();
  };
  canvas.onmouseup=()=>{ dragging=-1; };

  LAB['pa_calc']=()=>{ showArea(); };
  LAB['pa_clear']=()=>{ verts=[]; render(); csSetStep('Click to add polygon vertices.'); };

  function showArea(){
    if(verts.length<3){csSetStep('Need at least 3 vertices!');return;}
    const a=shoelace(verts);
    csHL(5); csSetStep(`Area = ½|Σ(xᵢyᵢ₊₁ - xᵢ₊₁yᵢ)| = ${a.toFixed(1)} px²`);
  }

  function render(){
    clearCanvas(); drawGrid(0.06);
    if(verts.length>=3){
      ctx.save(); ctx.beginPath();
      ctx.moveTo(verts[0][0],verts[0][1]);
      verts.forEach(v=>ctx.lineTo(v[0],v[1]));
      ctx.closePath();
      ctx.fillStyle='rgba(6,182,212,0.1)'; ctx.fill();
      ctx.strokeStyle='#06b6d4'; ctx.lineWidth=2; ctx.stroke();
      ctx.restore();
      // shoelace arrows
      verts.forEach((v,i)=>{
        const j=(i+1)%verts.length;
        const mx=(v[0]+verts[j][0])/2, my=(v[1]+verts[j][1])/2;
        label(`x${i}y${j}-x${j}y${i}`,mx+4,my-6,'rgba(6,182,212,0.5)',8);
      });
    } else if(verts.length===2){
      drawLine(verts[0][0],verts[0][1],verts[1][0],verts[1][1],'#06b6d4',2);
    }
    verts.forEach((v,i)=>{
      drawPoint(v[0],v[1],8,'#06b6d4',`V${i}`);
    });
    if(verts.length>=3){
      const a=shoelace(verts);
      ctx.save(); ctx.font='bold 16px "Nunito",sans-serif';
      ctx.fillStyle='#22d3ee';
      ctx.fillText(`Area = ${a.toFixed(1)} px²`, 20, 32);
      ctx.restore();
    }
  }
  render();
  csSetStep('Drag vertices or click to add. Press 📐 Calculate Area for the Shoelace result.');
}

// ══════════════════════════════════════════════════════════════════
