// ══════════════════════════════════════════════════════════
//  N-QUEENS VISUALIZATION
// ══════════════════════════════════════════════════════════
function runNQueens() {
  let N=6, steps=[], stepIdx=0;

  function genSteps(N){
    const board=Array(N).fill(-1), steps=[];
    function isSafe(row,col){
      for(let r=0;r<row;r++) if(board[r]===col||Math.abs(board[r]-col)===Math.abs(r-row)) return false;
      return true;
    }
    function solve(row){
      if(row===N){steps.push({board:[...board],type:'solution',line:5,msg:`✅ Solution! Queens at columns: [${board}]`});return true;}
      for(let col=0;col<N;col++){
        steps.push({board:[...board],type:'try',line:3,row,col,msg:`Row ${row}: trying column ${col}`});
        if(isSafe(row,col)){
          board[row]=col;
          steps.push({board:[...board],type:'place',line:5,row,col,msg:`Placed queen at (row=${row}, col=${col}) — safe!`});
          if(solve(row+1)) return true;
          board[row]=-1;
          steps.push({board:[...board],type:'backtrack',line:7,row,col,msg:`Backtracking from row=${row}, col=${col} — conflict ahead`});
        }
      }
      return false;
    }
    solve(0); return steps;
  }

  buildLeftPanel(`
    <div class="panel-section">
      <div class="panel-section-title">Parameters</div>
      ${makeSlider('csq_n','Board Size N',4,8,N,1,'',v=>{N=v;steps=[];stepIdx=0;csStopEngine();})}
      ${makeSlider('csq_spd','Speed',1,20,8,1,'',v=>{if(csAnimState)csAnimState.msPerStep=Math.max(20,500-v*24);})}
    </div>
    <div class="panel-section">
      <div class="panel-section-title">Controls</div>
      <button class="ctrl-btn primary" id="csq_start">▶ Solve</button>
      <button class="ctrl-btn" id="csq_pause">⏸ Pause</button>
      <button class="ctrl-btn danger" id="csq_reset">↺ Reset</button>
    </div>
    <div class="panel-section">
      <div class="panel-section-title">Legend</div>
      <div style="font-family:'Space Mono',monospace;font-size:11px;color:var(--text2);line-height:2.2;">
        <span style="color:#f59e0b">■</span> Trying cell<br>
        <span style="color:#2ed573">■</span> Queen placed<br>
        <span style="color:#ff4757">■</span> Backtracking<br>
        <span style="color:#e879f9">♛</span> Confirmed queen
      </div>
    </div>
  `);
  const CODE=`<span class="cs-cm">// N-Queens — O(N!) backtracking</span>
<span class="cs-kw">bool</span> <span class="cs-fn">isSafe</span>(<span class="cs-type">int</span> board[],<span class="cs-type">int</span> row,<span class="cs-type">int</span> col,<span class="cs-type">int</span> N){
  <span class="cs-kw">for</span>(<span class="cs-type">int</span> r=<span class="cs-num">0</span>; r&lt;row; r++){
    <span class="cs-kw">if</span>(board[r]==col) <span class="cs-kw">return false</span>;
    <span class="cs-kw">if</span>(abs(board[r]-col)==abs(r-row))
      <span class="cs-kw">return false</span>;
  }
  <span class="cs-kw">return true</span>;
}
<span class="cs-kw">bool</span> <span class="cs-fn">solve</span>(<span class="cs-type">int</span> board[],<span class="cs-type">int</span> row,<span class="cs-type">int</span> N){
  <span class="cs-kw">if</span>(row==N) <span class="cs-kw">return true</span>;
  <span class="cs-kw">for</span>(<span class="cs-type">int</span> col=<span class="cs-num">0</span>; col&lt;N; col++){
    <span class="cs-kw">if</span>(<span class="cs-fn">isSafe</span>(board,row,col,N)){
      board[row]=col;
      <span class="cs-kw">if</span>(<span class="cs-fn">solve</span>(board,row+<span class="cs-num">1</span>,N)) <span class="cs-kw">return true</span>;
      board[row]=-<span class="cs-num">1</span>; <span class="cs-cm">// backtrack</span>
    }
  }
  <span class="cs-kw">return false</span>;
}`;
  buildRightPanel(csRightPanel(CODE,'O(N!)','O(N)','Press ▶ Solve to watch backtracking in action.'));

  function render(){
    const W=canvas.width, H=canvas.height;
    clearCanvas(); drawGrid(0.025);
    const pad=60, sz=Math.min(W-pad*2,H-pad*2), cell=sz/N;
    const ox=(W-sz)/2, oy=(H-sz)/2;

    const step=steps[stepIdx]||{board:Array(N).fill(-1),type:'empty'};

    // Draw board
    for(let r=0;r<N;r++) for(let c=0;c<N;c++){
      const isLight=(r+c)%2===0;
      let bg=isLight?'#0d1e30':'#0a1520';
      if(step.type==='try'&&r===step.row&&c===step.col) bg='rgba(245,158,11,0.45)';
      else if(step.type==='place'&&r===step.row&&c===step.col) bg='rgba(46,213,115,0.4)';
      else if(step.type==='backtrack'&&r===step.row&&c===step.col) bg='rgba(255,71,87,0.4)';
      else if(step.type==='solution') bg=isLight?'rgba(46,213,115,0.18)':'rgba(46,213,115,0.10)';

      ctx.fillStyle=bg; ctx.fillRect(ox+c*cell,oy+r*cell,cell,cell);
      // Cell border
      ctx.strokeStyle='#1e3a5a'; ctx.lineWidth=0.8;
      ctx.strokeRect(ox+c*cell,oy+r*cell,cell,cell);
    }

    // Draw attack diagonals / lines for current board state
    step.board.forEach((col,row)=>{
      if(col<0) return;
      // Highlight attacked columns and diagonals subtly
      for(let r2=row+1;r2<N;r2++){
        const cd=col, cr1=col-(r2-row), cr2=col+(r2-row);
        [cd,cr1,cr2].forEach(c2=>{
          if(c2>=0&&c2<N){
            ctx.fillStyle='rgba(255,71,87,0.06)';
            ctx.fillRect(ox+c2*cell,oy+r2*cell,cell,cell);
          }
        });
      }
    });

    // Draw queens
    step.board.forEach((col,row)=>{
      if(col<0) return;
      const qx=ox+col*cell+cell/2, qy=oy+row*cell+cell/2;
      const qs=cell*0.55;
      ctx.font=`${qs}px serif`; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.shadowColor='#e879f9'; ctx.shadowBlur=cell*0.4;
      ctx.fillStyle='#e879f9'; ctx.fillText('♛',qx,qy);
      ctx.shadowBlur=0; ctx.textBaseline='alphabetic'; ctx.textAlign='start';
    });

    // Board border
    ctx.strokeStyle=step.type==='solution'?'#2ed573':'#1e3a5a';
    ctx.lineWidth=step.type==='solution'?3:1.5;
    ctx.strokeRect(ox,oy,sz,sz);

    // Row/col labels
    ctx.fillStyle='#2a4060'; ctx.font=`${Math.min(12,cell*0.35)}px "Space Mono",monospace`;
    ctx.textAlign='center';
    for(let i=0;i<N;i++){
      ctx.fillText(i,ox+i*cell+cell/2,oy-8);
      ctx.fillText(i,ox-14,oy+i*cell+cell/2+4);
    }
    ctx.textAlign='start';

    // Progress bar
    const prog=steps.length>0?stepIdx/steps.length:0;
    ctx.fillStyle='#0a1520'; ctx.fillRect(0,H-5,W,5);
    ctx.fillStyle='#e879f9'; ctx.fillRect(0,H-5,W*prog,5);

    const s=steps[stepIdx];
    if(s&&s.msg) csSetStep(s.msg); csHL(s.line||0);
  }

  document.getElementById('csq_start').onclick=()=>{
    if(steps.length===0){steps=genSteps(N);stepIdx=0;}
    if(csAnimState) csAnimState.running=true;
  };
  document.getElementById('csq_pause').onclick=()=>csStopEngine();
  document.getElementById('csq_reset').onclick=()=>{csStopEngine();steps=[];stepIdx=0;csSetStep('Press ▶ Solve to start the N-Queens backtracking.');};

  csStartEngine(render);
  csAnimState.msPerStep=150;
  csAnimState.onTick=()=>{
    if(stepIdx<steps.length-1){stepIdx++;return false;}
    return true;
  };
}

// ══════════════════════════════════════════════════════════
//  SUDOKU SOLVER
// ══════════════════════════════════════════════════════════
function runSudokuSolver() {
  let steps=[], stepIdx=0;
  const PUZZLE=[
    [5,3,0,0,7,0,0,0,0],[6,0,0,1,9,5,0,0,0],[0,9,8,0,0,0,0,6,0],
    [8,0,0,0,6,0,0,0,3],[4,0,0,8,0,3,0,0,1],[7,0,0,0,2,0,0,0,6],
    [0,6,0,0,0,0,2,8,0],[0,0,0,4,1,9,0,0,5],[0,0,0,0,8,0,0,7,9]
  ];

  function genSteps(puzzle){
    const b=puzzle.map(r=>[...r]), steps=[];
    function isValid(b,r,c,num){
      for(let x=0;x<9;x++) if(b[r][x]===num||b[x][c]===num) return false;
      const br=Math.floor(r/3)*3, bc=Math.floor(c/3)*3;
      for(let i=0;i<3;i++) for(let j=0;j<3;j++) if(b[br+i][bc+j]===num) return false;
      return true;
    }
    function solve(b){
      for(let r=0;r<9;r++) for(let c=0;c<9;c++){
        if(b[r][c]===0){
          for(let n=1;n<=9;n++){
            if(isValid(b,r,c,n)){
              b[r][c]=n;
              steps.push({board:b.map(row=>[...row]),type:'place',line:6,r,c,n,msg:`Placed ${n} at (row ${r}, col ${c})`});
              if(solve(b)) return true;
              b[r][c]=0;
              steps.push({board:b.map(row=>[...row]),type:'backtrack',line:8,r,c,msg:`Backtrack from (row ${r}, col ${c}) — no valid number fits`});
            }
          }
          return false;
        }
      }
      steps.push({board:b.map(row=>[...row]),type:'done',line:10,r:-1,c:-1,msg:'✅ Sudoku Solved!'});
      return true;
    }
    solve(b); return steps;
  }

  buildLeftPanel(`
    <div class="panel-section">
      <div class="panel-section-title">Controls</div>
      ${makeSlider('css_spd','Speed',1,20,8,1,'',v=>{if(csAnimState)csAnimState.msPerStep=Math.max(10,350-v*16);})}
      <button class="ctrl-btn primary" id="css_start">▶ Solve</button>
      <button class="ctrl-btn" id="css_pause">⏸ Pause</button>
      <button class="ctrl-btn danger" id="css_reset">↺ Reset</button>
    </div>
    <div class="panel-section">
      <div class="panel-section-title">Legend</div>
      <div style="font-family:'Space Mono',monospace;font-size:11px;color:var(--text2);line-height:2.2;">
        <span style="color:#60a5fa">■</span> Given clue<br>
        <span style="color:#2ed573">■</span> Placed by solver<br>
        <span style="color:#ff4757">■</span> Backtracking here
      </div>
    </div>
  `);
  const CODE=`<span class="cs-cm">// Sudoku — recursive backtracking</span>
<span class="cs-kw">bool</span> <span class="cs-fn">solve</span>(<span class="cs-type">int</span> b[][<span class="cs-num">9</span>]){
  <span class="cs-kw">for</span>(<span class="cs-type">int</span> r=<span class="cs-num">0</span>;r&lt;<span class="cs-num">9</span>;r++)
    <span class="cs-kw">for</span>(<span class="cs-type">int</span> c=<span class="cs-num">0</span>;c&lt;<span class="cs-num">9</span>;c++){
      <span class="cs-kw">if</span>(b[r][c]!=<span class="cs-num">0</span>) <span class="cs-kw">continue</span>;
      <span class="cs-kw">for</span>(<span class="cs-type">int</span> n=<span class="cs-num">1</span>;n&lt;=<span class="cs-num">9</span>;n++){
        <span class="cs-kw">if</span>(<span class="cs-fn">isValid</span>(b,r,c,n)){
          b[r][c]=n;
          <span class="cs-kw">if</span>(<span class="cs-fn">solve</span>(b)) <span class="cs-kw">return true</span>;
          b[r][c]=<span class="cs-num">0</span>; <span class="cs-cm">// backtrack</span>
        }
      }
      <span class="cs-kw">return false</span>;
    }
  <span class="cs-kw">return true</span>;
}`;
  buildRightPanel(csRightPanel(CODE,'O(9^81)','O(1)','Press ▶ Solve to watch recursive backtracking fill the grid.'));

  function renderBoard(b,activeR,activeC,activeType){
    const W=canvas.width, H=canvas.height;
    clearCanvas(); drawGrid(0.02);
    const sz=Math.min(W,H)-50, cell=sz/9, ox=(W-sz)/2, oy=(H-sz)/2;

    for(let r=0;r<9;r++) for(let c=0;c<9;c++){
      const isOrig=PUZZLE[r][c]!==0;
      const isActive=(r===activeR&&c===activeC);
      const bx=ox+c*cell, by=oy+r*cell;
      let bg=isOrig?'#0d1e32':'#060b12';
      if(isActive){
        if(activeType==='place')    bg='rgba(46,213,115,0.35)';
        else if(activeType==='backtrack') bg='rgba(255,71,87,0.35)';
        else bg='rgba(245,158,11,0.3)';
      }
      ctx.fillStyle=bg; ctx.fillRect(bx+0.5,by+0.5,cell-1,cell-1);
    }

    // Draw thin grid lines
    ctx.strokeStyle='#1a2e48'; ctx.lineWidth=0.5;
    for(let r=0;r<9;r++) for(let c=0;c<9;c++){
      ctx.strokeRect(ox+c*cell,oy+r*cell,cell,cell);
    }
    // Bold 3x3 box borders
    ctx.strokeStyle='#3a5a7a'; ctx.lineWidth=2;
    for(let i=0;i<=3;i++){
      const x=ox+i*cell*3, y=oy+i*cell*3;
      ctx.beginPath(); ctx.moveTo(ox,y); ctx.lineTo(ox+sz,y); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x,oy); ctx.lineTo(x,oy+sz); ctx.stroke();
    }

    // Numbers
    for(let r=0;r<9;r++) for(let c=0;c<9;c++){
      if(b[r][c]===0) continue;
      const isOrig=PUZZLE[r][c]!==0;
      const isActive=(r===activeR&&c===activeC);
      const bx=ox+c*cell, by=oy+r*cell;
      ctx.font=`bold ${cell*0.55}px "Space Mono",monospace`;
      ctx.textAlign='center'; ctx.textBaseline='middle';
      if(isOrig) ctx.fillStyle='#60a5fa';
      else if(isActive&&activeType==='backtrack') ctx.fillStyle='#ff4757';
      else if(isActive) ctx.fillStyle='#2ed573';
      else ctx.fillStyle='#7a9ab5';
      ctx.fillText(b[r][c], bx+cell/2, by+cell/2);
    }
    ctx.textBaseline='alphabetic'; ctx.textAlign='start';
  }

  function render(){
    const step=steps[stepIdx]||{board:PUZZLE.map(r=>[...r]),type:'',r:-1,c:-1};
    renderBoard(step.board, step.r, step.c, step.type);
    if(step.msg) csSetStep(step.msg); csHL(step.line||0);
  }

  document.getElementById('css_start').onclick=()=>{
    if(steps.length===0){steps=genSteps(PUZZLE);stepIdx=0;}
    if(csAnimState) csAnimState.running=true;
  };
  document.getElementById('css_pause').onclick=()=>csStopEngine();
  document.getElementById('css_reset').onclick=()=>{csStopEngine();steps=[];stepIdx=0;csSetStep('Press ▶ Solve to watch recursive backtracking.');};

  csStartEngine(render);
  csAnimState.msPerStep=60;
  csAnimState.onTick=()=>{
    if(stepIdx<steps.length-1){stepIdx++;return false;}
    return true;
  };
}

// ══════════════════════════════════════════════════════════
//  RAT IN A MAZE
// ══════════════════════════════════════════════════════════
function runRatMaze() {
  let MN=7, steps=[], stepIdx=0;

  function genMaze(n){
    const maze=Array.from({length:n},()=>Array(n).fill(1));
    const walls=[[0,2],[1,1],[1,3],[2,3],[3,0],[3,2],[4,1],[4,3],[5,2],[2,5],[3,5],[4,5]];
    walls.forEach(([r,c])=>{if(r<n&&c<n)maze[r][c]=0;});
    return maze;
  }
  let maze=genMaze(MN);

  function genSteps(maze,n){
    const visited=Array.from({length:n},()=>Array(n).fill(false)), path=[], steps=[];
    function dfs(r,c){
      if(r<0||r>=n||c<0||c>=n||!maze[r][c]||visited[r][c]){
        steps.push({type:'blocked',line:7,path:[...path],visited:visited.map(row=>[...row]),cur:[r,c],msg:`Dead end at (${r},${c}) — blocked or visited`});
        return false;
      }
      visited[r][c]=true; path.push([r,c]);
      steps.push({type:'visit',line:4,path:[...path],visited:visited.map(row=>[...row]),cur:[r,c],msg:`Exploring (${r},${c}) — open cell!`});
      if(r===n-1&&c===n-1){steps.push({type:'goal',path:[...path],visited:visited.map(row=>[...row]),cur:[r,c],msg:'🎉 Reached the goal (bottom-right)!'});return true;}
      if(dfs(r,c+1)||dfs(r+1,c)||dfs(r,c-1)||dfs(r-1,c)) return true;
      path.pop();
      steps.push({type:'backtrack',path:[...path],visited:visited.map(row=>[...row]),cur:[r,c],msg:`Backtracking from (${r},${c}) — no valid path ahead`});
      return false;
    }
    dfs(0,0); return steps;
  }

  buildLeftPanel(`
    <div class="panel-section">
      <div class="panel-section-title">Parameters</div>
      ${makeSlider('crm_n','Maze Size',4,10,MN,1,'',v=>{MN=v;maze=genMaze(MN);steps=[];stepIdx=0;csStopEngine();})}
      ${makeSlider('crm_spd','Speed',1,20,8,1,'',v=>{if(csAnimState)csAnimState.msPerStep=Math.max(30,450-v*20);})}
    </div>
    <div class="panel-section">
      <div class="panel-section-title">Controls</div>
      <button class="ctrl-btn primary" id="crm_start">▶ Solve</button>
      <button class="ctrl-btn" id="crm_pause">⏸ Pause</button>
      <button class="ctrl-btn danger" id="crm_reset">↺ New Maze</button>
    </div>
    <div class="panel-section">
      <div class="panel-section-title">Legend</div>
      <div style="font-family:'Space Mono',monospace;font-size:11px;color:var(--text2);line-height:2.2;">
        <span style="color:#1e3a5a">■</span> Open path<br>
        <span style="color:#333">■</span> Wall (blocked)<br>
        <span style="color:#00e5ff">■</span> Current path<br>
        <span style="color:#f59e0b">■</span> Visited (backtracked)<br>
        🐭 Rat &nbsp;&nbsp; 🏁 Goal
      </div>
    </div>
  `);
  const CODE=`<span class="cs-cm">// Rat in Maze — backtracking</span>
<span class="cs-kw">bool</span> <span class="cs-fn">solveMaze</span>(<span class="cs-type">int</span> maze[][N],<span class="cs-type">int</span> r,<span class="cs-type">int</span> c,<span class="cs-type">int</span> sol[][N]){
  <span class="cs-kw">if</span>(r==N-<span class="cs-num">1</span> &amp;&amp; c==N-<span class="cs-num">1</span>){
    sol[r][c]=<span class="cs-num">1</span>; <span class="cs-kw">return true</span>;
  }
  <span class="cs-kw">if</span>(maze[r][c]==<span class="cs-num">0</span>) <span class="cs-kw">return false</span>;
  sol[r][c]=<span class="cs-num">1</span>; <span class="cs-cm">// Mark path</span>
  <span class="cs-cm">// Try right, down, left, up</span>
  <span class="cs-kw">if</span>(<span class="cs-fn">solveMaze</span>(maze,r,c+<span class="cs-num">1</span>,sol)) <span class="cs-kw">return true</span>;
  <span class="cs-kw">if</span>(<span class="cs-fn">solveMaze</span>(maze,r+<span class="cs-num">1</span>,c,sol)) <span class="cs-kw">return true</span>;
  <span class="cs-kw">if</span>(<span class="cs-fn">solveMaze</span>(maze,r,c-<span class="cs-num">1</span>,sol)) <span class="cs-kw">return true</span>;
  <span class="cs-kw">if</span>(<span class="cs-fn">solveMaze</span>(maze,r-<span class="cs-num">1</span>,c,sol)) <span class="cs-kw">return true</span>;
  sol[r][c]=<span class="cs-num">0</span>; <span class="cs-kw">return false</span>; <span class="cs-cm">// Backtrack</span>
}`;
  buildRightPanel(csRightPanel(CODE,'O(4^(N²))','O(N²)','Rat starts at top-left and finds a path to bottom-right.'));

  function render(){
    const W=canvas.width, H=canvas.height;
    clearCanvas(); drawGrid(0.02);
    const pad=40, sz=Math.min(W-pad*2,H-pad*2), cell=sz/MN;
    const ox=(W-sz)/2, oy=(H-sz)/2;
    const step=steps[stepIdx]||{type:'',path:[],visited:[],cur:[0,0]};
    const pathSet=new Set((step.path||[]).map(([r,c])=>`${r},${c}`));
    const visitSet=new Set();
    if(step.visited) for(let r=0;r<MN;r++) for(let c=0;c<MN;c++) if(step.visited[r]&&step.visited[r][c]) visitSet.add(`${r},${c}`);

    for(let r=0;r<MN;r++) for(let c=0;c<MN;c++){
      const k=`${r},${c}`;
      const isWall=maze[r][c]===0;
      const isPath=pathSet.has(k);
      const isVisited=visitSet.has(k)&&!isPath;
      let bg='#0a1825';
      if(isWall) bg='#04080f';
      else if(isPath) bg='rgba(0,229,255,0.22)';
      else if(isVisited) bg='rgba(245,158,11,0.12)';

      ctx.fillStyle=bg; ctx.fillRect(ox+c*cell+1,oy+r*cell+1,cell-2,cell-2);

      if(isWall){
        // Wall texture
        ctx.fillStyle='#0c1520';
        for(let ti=0;ti<3;ti++){
          const tw=cell*0.3, th=cell*0.14;
          ctx.fillRect(ox+c*cell+ti*tw+2,oy+r*cell+cell*0.3,tw-2,th);
          ctx.fillRect(ox+c*cell+(ti+0.5)*tw+2,oy+r*cell+cell*0.6,tw-2,th);
        }
        ctx.fillStyle='#0f1e2e';
        ctx.fillRect(ox+c*cell,oy+r*cell,cell,cell);
      }
      ctx.strokeStyle=isWall?'#0a1015':'#192840'; ctx.lineWidth=0.5;
      ctx.strokeRect(ox+c*cell,oy+r*cell,cell,cell);
    }

    // Path line
    if(step.path&&step.path.length>1){
      ctx.beginPath(); ctx.strokeStyle='rgba(0,229,255,0.7)'; ctx.lineWidth=Math.max(2,cell*0.18);
      step.path.forEach(([r,c],i)=>{
        const x=ox+c*cell+cell/2, y=oy+r*cell+cell/2;
        i===0?ctx.moveTo(x,y):ctx.lineTo(x,y);
      });
      ctx.stroke();
    }

    // Rat (current position)
    const cur=step.cur||[0,0];
    if(cur[0]>=0&&cur[0]<MN&&cur[1]>=0&&cur[1]<MN){
      ctx.font=`${cell*0.65}px serif`; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText('🐭',ox+cur[1]*cell+cell/2,oy+cur[0]*cell+cell/2);
    }

    // Goal flag
    ctx.font=`${cell*0.65}px serif`; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText('🏁',ox+(MN-1)*cell+cell/2,oy+(MN-1)*cell+cell/2);

    // Start label
    ctx.font=`${Math.min(11,cell*0.4)}px "Space Mono",monospace`;
    ctx.fillStyle='#3d5470'; ctx.textAlign='center';
    ctx.fillText('START',ox+cell/2,oy-8);

    ctx.textBaseline='alphabetic'; ctx.textAlign='start';

    const prog=steps.length>0?stepIdx/steps.length:0;
    ctx.fillStyle='#0a1520'; ctx.fillRect(0,H-5,W,5);
    ctx.fillStyle='#fb923c'; ctx.fillRect(0,H-5,W*prog,5);

    if(step.msg) csSetStep(step.msg); csHL(step.line||0);
  }

  document.getElementById('crm_start').onclick=()=>{
    if(steps.length===0){steps=genSteps(maze,MN);stepIdx=0;}
    if(csAnimState) csAnimState.running=true;
  };
  document.getElementById('crm_pause').onclick=()=>csStopEngine();
  document.getElementById('crm_reset').onclick=()=>{csStopEngine();maze=genMaze(MN);steps=[];stepIdx=0;csSetStep('New maze generated. Press ▶ Solve.');};

  csStartEngine(render);
  csAnimState.msPerStep=80;
  csAnimState.onTick=()=>{
    if(stepIdx<steps.length-1){stepIdx++;return false;}
    return true;
  };
}

//  TOWER OF HANOI
// ══════════════════════════════════════════════════════════
function runTowerOfHanoi() {
  let N = 4, moves = [], moveIdx = 0;
  const PNAMES = ['A', 'B', 'C'];

  function genMoves(n) {
    const mv = [];
    function hanoi(n, src, aux, dst) {
      if (n === 0) return;
      hanoi(n - 1, src, dst, aux);
      mv.push({ disk: n, from: src, to: dst, msg: `Move disk ${n} from peg ${PNAMES[src]} to peg ${PNAMES[dst]}` });
      hanoi(n - 1, aux, src, dst);
    }
    hanoi(n, 0, 1, 2);
    return mv;
  }

  // Peg state
  function initPegs(n) { return [Array.from({ length: n }, (_, i) => n - i), [], []]; }
  let pegs = initPegs(N);

  buildLeftPanel(`
    <div class="panel-section">
      <div class="panel-section-title">Parameters</div>
      ${makeSlider('hoi_n','Disks',2,7,N,1,'',v=>{N=v;pegs=initPegs(N);moves=genMoves(N);moveIdx=0;csStopEngine();})}
      ${makeSlider('hoi_spd','Speed',1,20,7,1,'',v=>{if(csAnimState)csAnimState.msPerStep=Math.max(50,900-v*40);})}
    </div>
    <div class="panel-section">
      <div class="panel-section-title">Controls</div>
      <button class="ctrl-btn primary" id="hoi_start">▶ Animate</button>
      <button class="ctrl-btn" id="hoi_pause">⏸ Pause</button>
      <button class="ctrl-btn danger" id="hoi_reset">↺ Reset</button>
    </div>
    <div class="panel-section">
      <div class="panel-section-title">Info</div>
      <div class="data-card">
        <div class="data-row"><span class="data-key">Disks</span><span class="data-val" id="d_hoiN">${N}</span></div>
        <div class="data-row"><span class="data-key">Total moves</span><span class="data-val" id="d_hoiM">${Math.pow(2,N)-1}</span></div>
        <div class="data-row"><span class="data-key">Progress</span><span class="data-val" id="d_hoiP">0/${Math.pow(2,N)-1}</span></div>
      </div>
    </div>
  `);
  const CODE = `<span class="cs-cm">// Tower of Hanoi — O(2^n) moves</span>
<span class="cs-kw">void</span> <span class="cs-fn">hanoi</span>(<span class="cs-type">int</span> n, <span class="cs-type">char</span> src,
             <span class="cs-type">char</span> aux, <span class="cs-type">char</span> dst){
  <span class="cs-kw">if</span>(n==<span class="cs-num">0</span>) <span class="cs-kw">return</span>;
  <span class="cs-cm">// Move top n-1 disks to aux</span>
  <span class="cs-fn">hanoi</span>(n-<span class="cs-num">1</span>, src, dst, aux);
  <span class="cs-cm">// Move disk n to destination</span>
  <span class="cs-fn">move</span>(src, dst);
  <span class="cs-cm">// Move n-1 from aux to dst</span>
  <span class="cs-fn">hanoi</span>(n-<span class="cs-num">1</span>, aux, src, dst);
}
<span class="cs-cm">// Total moves = 2^n - 1</span>
<span class="cs-cm">// For n=64: ~1.8×10^19 moves!</span>`;
  buildRightPanel(csRightPanel(CODE, 'O(2ⁿ)', 'O(n)', `Tower of Hanoi: ${N} disks require exactly 2ⁿ-1 moves. The optimal recursive structure is unavoidable.`));

  moves = genMoves(N);

  // Disk colors
  const COLORS = ['#ff6b9d', '#f59e0b', '#2ed573', '#00e5ff', '#a78bfa', '#fb923c', '#f87171'];

  function applyMove(pegsState, mv) {
    const disk = pegsState[mv.from].pop();
    pegsState[mv.to].push(disk);
  }

  function render() {
    const W = canvas.width, H = canvas.height;
    clearCanvas(); drawGrid(0.02);
    const pegW = W / 3, pegH = H - 80, baseY = H - 50;
    const maxDiskW = pegW * 0.85, minDiskW = 24, diskH = Math.min(28, (pegH - 30) / (N + 1));

    // Draw pegs
    PNAMES.forEach((name, i) => {
      const px = pegW * i + pegW / 2;
      ctx.fillStyle = '#1e3a5a'; ctx.fillRect(px - 5, baseY - pegH + 20, 10, pegH - 20);
      ctx.fillStyle = '#2a5070'; ctx.fillRect(pegW * i + 10, baseY - 8, pegW - 20, 8);
      ctx.fillStyle = '#3d5470'; ctx.font = '14px "Space Mono",monospace'; ctx.textAlign = 'center';
      ctx.fillText(`Peg ${name}`, px, baseY + 18);
    });

    // Draw disks
    pegs.forEach((stack, pi) => {
      const px = pegW * pi + pegW / 2;
      stack.forEach((disk, di) => {
        const dw = minDiskW + (disk / N) * (maxDiskW - minDiskW);
        const dy = baseY - diskH - di * (diskH + 2);
        const col = COLORS[(disk - 1) % COLORS.length];
        const grad = ctx.createLinearGradient(px - dw / 2, dy, px - dw / 2, dy + diskH);
        grad.addColorStop(0, col + 'ee'); grad.addColorStop(1, col + '66');
        ctx.fillStyle = grad;
        if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(px - dw / 2, dy, dw, diskH, 4); ctx.fill(); }
        else ctx.fillRect(px - dw / 2, dy, dw, diskH);
        ctx.strokeStyle = col; ctx.lineWidth = 1.5;
        if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(px - dw / 2, dy, dw, diskH, 4); ctx.stroke(); }
        else ctx.strokeRect(px - dw / 2, dy, dw, diskH);
        ctx.fillStyle = '#fff8'; ctx.font = `bold ${Math.min(12, diskH * 0.5)}px "Space Mono",monospace`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(disk, px, dy + diskH / 2);
        ctx.textBaseline = 'alphabetic';
      });
    });

    // Progress
    const prog = moves.length > 0 ? moveIdx / moves.length : 0;
    ctx.fillStyle = '#0a1520'; ctx.fillRect(0, H - 5, W, 5);
    ctx.fillStyle = '#e879f9'; ctx.fillRect(0, H - 5, W * prog, 5);
    updateDataVal('hoiP', `${moveIdx}/${moves.length}`);
    ctx.textAlign = 'start';
  }

  document.getElementById('hoi_start').onclick = () => { if (csAnimState) csAnimState.running = true; };
  document.getElementById('hoi_pause').onclick = () => csStopEngine();
  document.getElementById('hoi_reset').onclick = () => {
    pegs = initPegs(N); moves = genMoves(N); moveIdx = 0; csStopEngine();
    updateDataVal('hoiN', N); updateDataVal('hoiM', Math.pow(2, N) - 1);
    csSetStep(`Reset. ${N} disks = ${Math.pow(2, N) - 1} moves total.`);
  };

  csStartEngine(render);
  csAnimState.msPerStep = 300;
  csAnimState.onTick = () => {
    if (moveIdx < moves.length) {
      const mv = moves[moveIdx];
      applyMove(pegs, mv); csSetStep(mv.msg); csHL(mv.line||5); moveIdx++;
      return false;
    }
    csSetStep(`✅ All ${N} disks moved to peg C in ${moves.length} moves!`); return true;
  };
}

// ══════════════════════════════════════════════════════════
//  PERMUTATION GENERATOR
// ══════════════════════════════════════════════════════════
function runPermutations() {
  let N = 3, arr = [], steps = [], stepIdx = 0;

  function genSteps(arr) {
    const st = [], a = [...arr], perms = [];
    function swap(a, i, j) { [a[i], a[j]] = [a[j], a[i]]; }
    function permute(a, l, r) {
      if (l === r) { perms.push([...a]); st.push({ arr: [...a], perms: perms.map(p => [...p]), swapping: [-1,-1], depth: l, msg: `Permutation: [${a.join(',')}]` }); return; }
      for (let i = l; i <= r; i++) {
        st.push({ arr: [...a], perms: perms.map(p => [...p]), swapping: [l, i], depth: l, msg: `Swap arr[${l}] and arr[${i}]: ${a[l]}↔${a[i]}` });
        swap(a, l, i);
        permute(a, l + 1, r);
        swap(a, l, i);
        if (i !== l) st.push({ arr: [...a], perms: perms.map(p => [...p]), swapping: [l, i], depth: l, msg: `Restore: swap back arr[${l}] and arr[${i}]` });
      }
    }
    permute(a, 0, a.length - 1);
    return st;
  }

  arr = Array.from({ length: N }, (_, i) => i + 1);

  buildLeftPanel(`
    <div class="panel-section">
      <div class="panel-section-title">Parameters</div>
      ${makeSlider('perm_n','Array Size n',2,5,N,1,'',v=>{N=v;arr=Array.from({length:N},(_,i)=>i+1);steps=[];stepIdx=0;csStopEngine();csSetStep(`n=${N} gives ${Array.from({length:N},(_,i)=>i+1).reduce((a,b)=>a*b,1)} permutations.`);})}
      ${makeSlider('perm_spd','Speed',1,20,7,1,'',v=>{if(csAnimState)csAnimState.msPerStep=Math.max(60,700-v*30);})}
    </div>
    <div class="panel-section">
      <div class="panel-section-title">Controls</div>
      <button class="ctrl-btn primary" id="perm_start">▶ Generate</button>
      <button class="ctrl-btn" id="perm_pause">⏸ Pause</button>
      <button class="ctrl-btn danger" id="perm_reset">↺ Reset</button>
    </div>
    <div class="panel-section">
      <div class="panel-section-title">Factorial</div>
      <div style="font-family:'Space Mono',monospace;font-size:11px;color:var(--text2);line-height:2.0;">
        n=2: 2 perms<br>n=3: 6 perms<br>n=4: 24 perms<br>n=5: 120 perms
      </div>
    </div>
  `);
  const CODE = `<span class="cs-cm">// Permutations — O(n!) time</span>
<span class="cs-kw">void</span> <span class="cs-fn">permute</span>(<span class="cs-type">int</span> arr[], <span class="cs-type">int</span> l, <span class="cs-type">int</span> r){
  <span class="cs-kw">if</span>(l==r){
    <span class="cs-fn">printArr</span>(arr); <span class="cs-cm">// found one</span>
    <span class="cs-kw">return</span>;
  }
  <span class="cs-kw">for</span>(<span class="cs-type">int</span> i=l; i&lt;=r; i++){
    <span class="cs-cm">// Place arr[i] at position l</span>
    <span class="cs-fn">swap</span>(arr[l], arr[i]);
    <span class="cs-cm">// Recurse on remaining</span>
    <span class="cs-fn">permute</span>(arr, l+<span class="cs-num">1</span>, r);
    <span class="cs-cm">// Restore (backtrack)</span>
    <span class="cs-fn">swap</span>(arr[l], arr[i]);
  }
}`;
  buildRightPanel(csRightPanel(CODE, 'O(n!)', 'O(n)', 'Generates all n! permutations by fixing each element at each position recursively.'));

  function render() {
    const W = canvas.width, H = canvas.height;
    clearCanvas(); drawGrid(0.025);
    const step = steps[stepIdx] || { arr, perms: [], swapping: [-1,-1] };
    const n = step.arr.length;
    const cellW = 60, cellH = 50, ox = (W - n * cellW) / 2, oy = H * 0.25;

    // Current array
    ctx.fillStyle = '#2a4060'; ctx.font = '11px "Space Mono",monospace'; ctx.textAlign = 'center';
    ctx.fillText('Current Array:', W / 2, oy - 14);
    step.arr.forEach((v, i) => {
      const isSwap = step.swapping && (step.swapping[0] === i || step.swapping[1] === i);
      ctx.fillStyle = isSwap ? 'rgba(245,158,11,0.35)' : 'rgba(0,229,255,0.1)';
      ctx.fillRect(ox + i * cellW + 2, oy, cellW - 4, cellH);
      ctx.strokeStyle = isSwap ? '#f59e0b' : '#1e3a5a'; ctx.lineWidth = isSwap ? 2.5 : 1;
      ctx.strokeRect(ox + i * cellW + 2, oy, cellW - 4, cellH);
      ctx.fillStyle = isSwap ? '#f59e0b' : '#00e5ff'; ctx.font = 'bold 20px "Space Mono",monospace';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(v, ox + i * cellW + cellW / 2, oy + cellH / 2);
      ctx.textBaseline = 'alphabetic';
    });

    // Permutations found so far
    const perms = step.perms || [];
    const permsPerRow = Math.floor((W - 40) / (n * 22 + 20));
    ctx.fillStyle = '#2a4060'; ctx.font = '11px "Space Mono",monospace'; ctx.textAlign = 'center';
    ctx.fillText(`Permutations found: ${perms.length}`, W / 2, oy + cellH + 30);
    perms.slice(-15).forEach((p, i) => {
      const row = Math.floor(i / permsPerRow), col = i % permsPerRow;
      const px = 20 + col * ((W - 40) / permsPerRow);
      const py = oy + cellH + 50 + row * 22;
      ctx.fillStyle = i === perms.length - 1 ? '#2ed573' : '#3d5470'; ctx.font = `${n <= 3 ? 11 : 9}px "Space Mono",monospace`;
      ctx.textAlign = 'left'; ctx.fillText(`[${p.join(',')}]`, px, py);
    });

    const prog = steps.length > 0 ? stepIdx / steps.length : 0;
    ctx.fillStyle = '#0a1520'; ctx.fillRect(0, H - 5, W, 5);
    ctx.fillStyle = '#e879f9'; ctx.fillRect(0, H - 5, W * prog, 5);
    ctx.textAlign = 'start';
    if (step.msg) { csSetStep(step.msg); csHL(step.line||0); }
  }

  document.getElementById('perm_start').onclick = () => {
    if (steps.length === 0) { steps = genSteps(arr); stepIdx = 0; }
    if (csAnimState) csAnimState.running = true;
  };
  document.getElementById('perm_pause').onclick = () => csStopEngine();
  document.getElementById('perm_reset').onclick = () => { steps = []; stepIdx = 0; csStopEngine(); csSetStep(`n=${N} → ${Array.from({length:N},(_,i)=>i+1).reduce((a,b)=>a*b,1)} permutations. Press ▶ Generate.`); };

  csStartEngine(render);
  csAnimState.msPerStep = 250;
  csAnimState.onTick = () => { if (stepIdx < steps.length - 1) { stepIdx++; return false; } return true; };
}

// ══════════════════════════════════════════════════════════
