// ══════════════════════════════════════════════════════════
//  GRAPH VISUALIZATION FRAMEWORK
// ══════════════════════════════════════════════════════════
function buildGraph(nodeCount) {
  const W=canvas.width, H=canvas.height;
  const cx=W/2, cy=H/2;
  const R=Math.min(W,H)*0.30;
  const nodes=Array.from({length:nodeCount},(_,i)=>({
    id:i, x:cx+Math.cos((i/nodeCount)*Math.PI*2-Math.PI/2)*R,
    y:cy+Math.sin((i/nodeCount)*Math.PI*2-Math.PI/2)*R,
    label:String.fromCharCode(65+i)
  }));
  if(nodeCount<=8){
    nodes.push({id:nodeCount,x:cx,y:cy,label:String.fromCharCode(65+nodeCount)});
  }
  const n=nodes.length, edges=[], adjList=Array.from({length:n},()=>[]);
  function addEdge(u,v,w){
    if(edges.find(e=>(e.u===u&&e.v===v)||(e.u===v&&e.v===u))) return;
    edges.push({u,v,w});adjList[u].push({v,w});adjList[v].push({v:u,w});
  }
  for(let i=0;i<nodeCount;i++) addEdge(i,(i+1)%nodeCount,1+Math.floor(Math.random()*8));
  for(let i=0;i<Math.floor(nodeCount/2);i++) addEdge(i,(i+Math.floor(nodeCount/2))%nodeCount,1+Math.floor(Math.random()*8));
  if(n>nodeCount){
    for(let i=0;i<Math.min(nodeCount,4);i++) addEdge(nodeCount,i,1+Math.floor(Math.random()*6));
  }
  return {nodes,edges,adj:adjList};
}

function drawGraph(g, state) {
  const W=canvas.width, H=canvas.height;
  clearCanvas(); drawGrid(0.025);
  const {nodes,edges}=g;
  const {visited,current,queue,path,dist}=state;

  // Draw edges
  edges.forEach(({u,v,w})=>{
    const isPathEdge=path&&path.has(`${Math.min(u,v)},${Math.max(u,v)}`);
    ctx.save();
    ctx.strokeStyle=isPathEdge?'#00e5ff':'#1e3050';
    ctx.lineWidth=isPathEdge?2.5:1.5;
    ctx.globalAlpha=isPathEdge?1:0.6;
    ctx.beginPath(); ctx.moveTo(nodes[u].x,nodes[u].y); ctx.lineTo(nodes[v].x,nodes[v].y); ctx.stroke();
    ctx.restore();
    // Weight
    const mx=(nodes[u].x+nodes[v].x)/2, my=(nodes[u].y+nodes[v].y)/2;
    ctx.fillStyle=isPathEdge?'#00e5ff':'#2a4060';
    ctx.font='10px "Space Mono",monospace'; ctx.textAlign='center';
    ctx.fillText(w,mx,my-5); ctx.textAlign='start';
  });

  // Draw nodes
  nodes.forEach((nd,i)=>{
    const r=22;
    let fillC='#0a1825', strokeC='#1e3050', textC='#3d5470';
    if(visited&&visited.has(i)){fillC='rgba(46,213,115,0.22)';strokeC='#2ed573';textC='#2ed573';}
    if(queue&&queue.has(i)){fillC='rgba(245,158,11,0.22)';strokeC='#f59e0b';textC='#f59e0b';}
    if(current===i){fillC='rgba(0,229,255,0.30)';strokeC='#00e5ff';textC='#00e5ff';ctx.shadowColor='#00e5ff';ctx.shadowBlur=20;}
    ctx.fillStyle=fillC; ctx.beginPath(); ctx.arc(nd.x,nd.y,r,0,Math.PI*2); ctx.fill();
    ctx.strokeStyle=strokeC; ctx.lineWidth=2;
    ctx.beginPath(); ctx.arc(nd.x,nd.y,r,0,Math.PI*2); ctx.stroke();
    ctx.shadowBlur=0;
    ctx.fillStyle=textC; ctx.font='bold 13px "Space Mono",monospace';
    ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(nd.label,nd.x,nd.y);
    // Dist label
    if(dist&&dist[i]!==undefined){
      ctx.font='10px "Space Mono",monospace';
      ctx.fillStyle=dist[i]===Infinity?'#2a4060':'#f59e0b';
      ctx.fillText(dist[i]===Infinity?'∞':dist[i],nd.x,nd.y+r+14);
    }
    ctx.textBaseline='alphabetic'; ctx.textAlign='start';
  });
}

function genBFSSteps(g){
  const {nodes,adj}=g, n=nodes.length, steps=[];
  const visited=new Set(), queue=[0], path=new Set();
  visited.add(0);
  steps.push({visited:new Set([0]),queue:new Set([0]),current:0,path:new Set(),line:6,msg:`BFS Start: enqueue node A`});
  while(queue.length){
    const u=queue.shift();
    steps.push({visited:new Set(visited),queue:new Set(queue),current:u,path:new Set(path),line:9,msg:`Dequeue ${nodes[u].label} — exploring its neighbors`});
    adj[u].forEach(({v})=>{
      if(!visited.has(v)){
        visited.add(v); queue.push(v);
        path.add(`${Math.min(u,v)},${Math.max(u,v)}`);
        steps.push({visited:new Set(visited),queue:new Set(queue),current:u,path:new Set(path),line:13,msg:`Discovered ${nodes[v].label} from ${nodes[u].label}. Queue: [${[...queue].map(x=>nodes[x].label)}]`});
      }
    });
  }
  steps.push({visited:new Set(visited),queue:new Set(),current:-1,path:new Set(path),line:7,msg:'✅ BFS complete! All reachable nodes visited level by level.'});
  return steps;
}

function genDFSSteps(g){
  const {nodes,adj}=g, n=nodes.length, steps=[];
  const visited=new Set(), path=new Set();
  steps.push({visited:new Set(),queue:new Set([0]),current:-1,path:new Set(),line:3,msg:`DFS Start: push A onto implicit stack`});
  function dfs(u){
    if(visited.has(u)) return;
    visited.add(u);
    steps.push({visited:new Set(visited),queue:new Set(),current:u,path:new Set(path),line:4,msg:`Visit ${nodes[u].label} — going deeper (depth ${visited.size})`});
    adj[u].forEach(({v})=>{
      if(!visited.has(v)){
        path.add(`${Math.min(u,v)},${Math.max(u,v)}`);
        dfs(v);
      }
    });
    steps.push({visited:new Set(visited),queue:new Set(),current:u,path:new Set(path),line:7,msg:`Backtrack from ${nodes[u].label} — all neighbors visited`});
  }
  dfs(0);
  steps.push({visited:new Set(visited),queue:new Set(),current:-1,path:new Set(path),line:3,msg:'✅ DFS complete!'});
  return steps;
}

function genDijkstraSteps(g){
  const {nodes,adj}=g, n=nodes.length, steps=[];
  const dist=Array(n).fill(Infinity), visited=new Set(), path=new Set();
  dist[0]=0;
  steps.push({visited:new Set(),queue:new Set([0]),current:-1,path:new Set(),dist:[...dist],line:5,msg:`Init: dist[A]=0, all others=∞. Start relaxing.`});
  for(let iter=0;iter<n;iter++){
    let u=-1;
    for(let i=0;i<n;i++) if(!visited.has(i)&&(u===-1||dist[i]<dist[u])) u=i;
    if(u===-1||dist[u]===Infinity) break;
    visited.add(u);
    steps.push({visited:new Set(visited),queue:new Set(),current:u,path:new Set(path),dist:[...dist],line:8,msg:`Pick nearest: ${nodes[u].label} with dist=${dist[u]}`});
    adj[u].forEach(({v,w})=>{
      if(dist[u]+w<dist[v]){
        dist[v]=dist[u]+w;
        path.add(`${Math.min(u,v)},${Math.max(u,v)}`);
        steps.push({visited:new Set(visited),queue:new Set(),current:u,path:new Set(path),dist:[...dist],line:12,msg:`Relax ${nodes[u].label}→${nodes[v].label}: new dist[${nodes[v].label}]=${dist[v]}`});
      }
    });
  }
  steps.push({visited:new Set(visited),queue:new Set(),current:-1,path:new Set(path),dist:[...dist],line:7,msg:'✅ Dijkstra complete! All shortest paths found.'});
  return steps;
}

function runGraphAlgo(algoId){
  let nodeCount=7, g=buildGraph(nodeCount), steps=[], stepIdx=0;

  const ALGOS={
    'bfs':{label:'BFS',timeC:'O(V+E)',spaceC:'O(V)',gen:genBFSSteps,
      code:`<span class="cs-cm">// BFS — O(V+E) time, O(V) space</span>
<span class="cs-kw">void</span> <span class="cs-fn">bfs</span>(<span class="cs-type">int</span> src, vector&lt;vector&lt;<span class="cs-type">int</span>&gt;&gt;&amp; adj, <span class="cs-type">int</span> n){
  vector&lt;<span class="cs-type">bool</span>&gt; visited(n, <span class="cs-kw">false</span>);
  queue&lt;<span class="cs-type">int</span>&gt; q;
  visited[src]=<span class="cs-kw">true</span>; q.<span class="cs-fn">push</span>(src);
  <span class="cs-kw">while</span>(!q.<span class="cs-fn">empty</span>()){
    <span class="cs-type">int</span> u=q.<span class="cs-fn">front</span>(); q.<span class="cs-fn">pop</span>();
    <span class="cs-fn">process</span>(u);
    <span class="cs-kw">for</span>(<span class="cs-type">int</span> v : adj[u])
      <span class="cs-kw">if</span>(!visited[v]){
        visited[v]=<span class="cs-kw">true</span>; q.<span class="cs-fn">push</span>(v);
      }
  }
}`},
    'dfs':{label:'DFS',timeC:'O(V+E)',spaceC:'O(V)',gen:genDFSSteps,
      code:`<span class="cs-cm">// DFS — O(V+E) time, O(V) space</span>
<span class="cs-kw">void</span> <span class="cs-fn">dfs</span>(<span class="cs-type">int</span> u, vector&lt;vector&lt;<span class="cs-type">int</span>&gt;&gt;&amp; adj,
         vector&lt;<span class="cs-type">bool</span>&gt;&amp; visited){
  visited[u]=<span class="cs-kw">true</span>;
  <span class="cs-fn">process</span>(u);
  <span class="cs-kw">for</span>(<span class="cs-type">int</span> v : adj[u])
    <span class="cs-kw">if</span>(!visited[v])
      <span class="cs-fn">dfs</span>(v, adj, visited);
}`},
    'dijkstra':{label:"Dijkstra's",timeC:'O((V+E)logV)',spaceC:'O(V)',gen:genDijkstraSteps,
      code:`<span class="cs-cm">// Dijkstra — O((V+E)log V)</span>
<span class="cs-kw">void</span> <span class="cs-fn">dijkstra</span>(vector&lt;pair&lt;<span class="cs-type">int</span>,<span class="cs-type">int</span>&gt;&gt; adj[],<span class="cs-type">int</span> src,<span class="cs-type">int</span> V){
  vector&lt;<span class="cs-type">int</span>&gt; dist(V, INT_MAX);
  priority_queue&lt;pair&lt;<span class="cs-type">int</span>,<span class="cs-type">int</span>&gt;,
    vector&lt;pair&lt;<span class="cs-type">int</span>,<span class="cs-type">int</span>&gt;&gt;, greater&lt;&gt;&gt; pq;
  dist[src]=<span class="cs-num">0</span>; pq.<span class="cs-fn">push</span>({<span class="cs-num">0</span>,src});
  <span class="cs-kw">while</span>(!pq.<span class="cs-fn">empty</span>()){
    <span class="cs-kw">auto</span> [d,u]=pq.<span class="cs-fn">top</span>(); pq.<span class="cs-fn">pop</span>();
    <span class="cs-kw">if</span>(d&gt;dist[u]) <span class="cs-kw">continue</span>;
    <span class="cs-kw">for</span>(<span class="cs-kw">auto</span> [v,w]: adj[u])
      <span class="cs-kw">if</span>(dist[u]+w&lt;dist[v]){
        dist[v]=dist[u]+w;
        pq.<span class="cs-fn">push</span>({dist[v],v});
      }
  }
}`}
  };
  const algo=ALGOS[algoId];

  buildLeftPanel(`
    <div class="panel-section">
      <div class="panel-section-title">Graph Setup</div>
      ${makeSlider('cg_n','Nodes',4,12,nodeCount,1,'',v=>{nodeCount=v;g=buildGraph(nodeCount);steps=[];stepIdx=0;csStopEngine();})}
      ${makeSlider('cg_spd','Speed',1,20,6,1,'',v=>{if(csAnimState)csAnimState.msPerStep=Math.max(60,700-v*30);})}
    </div>
    <div class="panel-section">
      <div class="panel-section-title">Controls</div>
      <button class="ctrl-btn primary" id="cg_start">▶ Start</button>
      <button class="ctrl-btn" id="cg_pause">⏸ Pause</button>
      <button class="ctrl-btn danger" id="cg_reset">↺ New Graph</button>
    </div>
    <div class="panel-section">
      <div class="panel-section-title">Legend</div>
      <div style="font-family:'Space Mono',monospace;font-size:11px;color:var(--text2);line-height:2.2;">
        <span style="color:#00e5ff">●</span> Current node<br>
        <span style="color:#f59e0b">●</span> In queue/frontier<br>
        <span style="color:#2ed573">●</span> Visited<br>
        <span style="color:#00e5ff">—</span> Traversal edge
      </div>
    </div>
  `);
  buildRightPanel(csRightPanel(algo.code,algo.timeC,algo.spaceC,`Press ▶ Start to run ${algo.label} from node A.`));

  function render(){
    const step=steps[stepIdx]||{visited:new Set(),current:-1,queue:new Set(),path:new Set(),dist:undefined};
    drawGraph(g,step);
    if(step.msg) csSetStep(step.msg); csHL(step.line||0);
  }

  document.getElementById('cg_start').onclick=()=>{
    if(steps.length===0){steps=algo.gen(g);stepIdx=0;}
    if(csAnimState) csAnimState.running=true;
  };
  document.getElementById('cg_pause').onclick=()=>csStopEngine();
  document.getElementById('cg_reset').onclick=()=>{csStopEngine();g=buildGraph(nodeCount);steps=[];stepIdx=0;csSetStep(`New graph. Press ▶ Start to run ${algo.label}.`);};

  csStartEngine(render);
  csAnimState.msPerStep=300;
  csAnimState.onTick=()=>{
    if(stepIdx<steps.length-1){stepIdx++;return false;}
    return true;
  };
}

