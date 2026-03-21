// ══════════════════════════════════════════════════════════
//  SORTING VISUALIZATION FRAMEWORK
// ══════════════════════════════════════════════════════════
const SORT_REGISTRY = {
  'bubble-sort': {
    label:'Bubble Sort', timeC:'O(n²)', spaceC:'O(1)',
    desc:'Compare adjacent elements and swap if out of order. Largest value bubbles to end each pass.',
    code:`<span class="cs-cm">// Bubble Sort — O(n²) time, O(1) space</span>
<span class="cs-kw">void</span> <span class="cs-fn">bubbleSort</span>(<span class="cs-type">int</span> arr[], <span class="cs-type">int</span> n) {
  <span class="cs-kw">for</span> (<span class="cs-type">int</span> i = <span class="cs-num">0</span>; i &lt; n-<span class="cs-num">1</span>; i++) {
    <span class="cs-type">bool</span> swapped = <span class="cs-kw">false</span>;
    <span class="cs-kw">for</span> (<span class="cs-type">int</span> j = <span class="cs-num">0</span>; j &lt; n-i-<span class="cs-num">1</span>; j++) {
      <span class="cs-cm">// Compare adjacent elements</span>
      <span class="cs-kw">if</span> (arr[j] &gt; arr[j+<span class="cs-num">1</span>]) {
        <span class="cs-fn">swap</span>(arr[j], arr[j+<span class="cs-num">1</span>]);
        swapped = <span class="cs-kw">true</span>;
      }
    }
    <span class="cs-cm">// Early exit if no swap occurred</span>
    <span class="cs-kw">if</span> (!swapped) <span class="cs-kw">break</span>;
  }
}`,
    genSteps(arr) {
      const a=[...arr], steps=[], n=a.length;
      const sorted=new Set();
      for(let i=0;i<n-1;i++){
        let swapped=false;
        for(let j=0;j<n-i-1;j++){
          steps.push({type:'cmp',line:7,i:j,j:j+1,arr:[...a],sorted:new Set(sorted),msg:`Pass ${i+1}: comparing arr[${j}]=${a[j]} with arr[${j+1}]=${a[j+1]}`});
          if(a[j]>a[j+1]){
            [a[j],a[j+1]]=[a[j+1],a[j]];
            steps.push({type:'swap',line:8,i:j,j:j+1,arr:[...a],sorted:new Set(sorted),msg:`Swapping! ${a[j+1]} > ${a[j]}, moved right`});
            swapped=true;
          }
        }
        sorted.add(n-1-i);
        if(!swapped) break;
      }
      for(let k=0;k<n;k++) sorted.add(k);
      steps.push({type:'done',arr:[...a],sorted:new Set(sorted),msg:'✅ Array fully sorted!'});
      return steps;
    }
  },
  'selection-sort': {
    label:'Selection Sort', timeC:'O(n²)', spaceC:'O(1)',
    desc:'Find the minimum element in the unsorted portion and place it at the front.',
    code:`<span class="cs-cm">// Selection Sort — O(n²) time, O(1) space</span>
<span class="cs-kw">void</span> <span class="cs-fn">selectionSort</span>(<span class="cs-type">int</span> arr[], <span class="cs-type">int</span> n) {
  <span class="cs-kw">for</span> (<span class="cs-type">int</span> i = <span class="cs-num">0</span>; i &lt; n-<span class="cs-num">1</span>; i++) {
    <span class="cs-type">int</span> minIdx = i;
    <span class="cs-cm">// Find minimum in unsorted part</span>
    <span class="cs-kw">for</span> (<span class="cs-type">int</span> j = i+<span class="cs-num">1</span>; j &lt; n; j++) {
      <span class="cs-kw">if</span> (arr[j] &lt; arr[minIdx])
        minIdx = j;
    }
    <span class="cs-cm">// Swap min element to correct position</span>
    <span class="cs-fn">swap</span>(arr[minIdx], arr[i]);
  }
}`,
    genSteps(arr) {
      const a=[...arr],steps=[],n=a.length,sorted=new Set();
      for(let i=0;i<n-1;i++){
        let minIdx=i;
        for(let j=i+1;j<n;j++){
          steps.push({type:'cmp',line:9,i:minIdx,j:j,arr:[...a],sorted:new Set(sorted),highlight:i,msg:`Round ${i+1}: arr[${j}]=${a[j]} vs current min arr[${minIdx}]=${a[minIdx]}`});
          if(a[j]<a[minIdx]) minIdx=j;
        }
        if(minIdx!==i){
          [a[minIdx],a[i]]=[a[i],a[minIdx]];
          steps.push({type:'swap',line:14,i:minIdx,j:i,arr:[...a],sorted:new Set(sorted),highlight:i,msg:`Placing min ${a[i]} at position ${i}`});
        }
        sorted.add(i);
      }
      for(let k=0;k<n;k++) sorted.add(k);
      steps.push({type:'done',arr:[...a],sorted:new Set(sorted),msg:'✅ Array fully sorted!'});
      return steps;
    }
  },
  'insertion-sort': {
    label:'Insertion Sort', timeC:'O(n²)', spaceC:'O(1)',
    desc:'Pick each element and insert it into its correct position in the already-sorted left portion.',
    code:`<span class="cs-cm">// Insertion Sort — O(n²) time, O(1) space</span>
<span class="cs-kw">void</span> <span class="cs-fn">insertionSort</span>(<span class="cs-type">int</span> arr[], <span class="cs-type">int</span> n) {
  <span class="cs-kw">for</span> (<span class="cs-type">int</span> i = <span class="cs-num">1</span>; i &lt; n; i++) {
    <span class="cs-type">int</span> key = arr[i];
    <span class="cs-type">int</span> j = i - <span class="cs-num">1</span>;
    <span class="cs-cm">// Shift elements greater than key</span>
    <span class="cs-kw">while</span> (j &gt;= <span class="cs-num">0</span> &amp;&amp; arr[j] &gt; key) {
      arr[j+<span class="cs-num">1</span>] = arr[j];
      j--;
    }
    arr[j+<span class="cs-num">1</span>] = key; <span class="cs-cm">// Insert key here</span>
  }
}`,
    genSteps(arr) {
      const a=[...arr],steps=[],n=a.length,sorted=new Set([0]);
      for(let i=1;i<n;i++){
        const key=a[i]; let j=i-1;
        steps.push({type:'pick',line:3,i:i,j:-1,arr:[...a],sorted:new Set(sorted),msg:`Picking key=${key} at index ${i} to insert`});
        while(j>=0&&a[j]>key){
          a[j+1]=a[j];
          steps.push({type:'shift',line:8,i:j,j:j+1,arr:[...a],sorted:new Set(sorted),msg:`Shifting ${a[j]} right to make room`});
          j--;
        }
        a[j+1]=key; sorted.add(i);
        steps.push({type:'insert',line:10,i:j+1,j:-1,arr:[...a],sorted:new Set(sorted),msg:`Inserted key=${key} at position ${j+1}`});
      }
      for(let k=0;k<n;k++) sorted.add(k);
      steps.push({type:'done',arr:[...a],sorted:new Set(sorted),msg:'✅ Array fully sorted!'});
      return steps;
    }
  },
  'merge-sort': {
    label:'Merge Sort', timeC:'O(n log n)', spaceC:'O(n)',
    desc:'Divide array in half recursively, then merge the sorted halves back together.',
    code:`<span class="cs-cm">// Merge Sort — O(n log n), O(n) space</span>
<span class="cs-kw">void</span> <span class="cs-fn">merge</span>(<span class="cs-type">int</span> arr[], <span class="cs-type">int</span> l, <span class="cs-type">int</span> m, <span class="cs-type">int</span> r) {
  <span class="cs-type">int</span> n1=m-l+<span class="cs-num">1</span>, n2=r-m;
  <span class="cs-type">int</span> L[n1], R[n2];
  <span class="cs-kw">for</span>(<span class="cs-type">int</span> i=<span class="cs-num">0</span>;i&lt;n1;i++) L[i]=arr[l+i];
  <span class="cs-kw">for</span>(<span class="cs-type">int</span> j=<span class="cs-num">0</span>;j&lt;n2;j++) R[j]=arr[m+<span class="cs-num">1</span>+j];
  <span class="cs-type">int</span> i=<span class="cs-num">0</span>,j=<span class="cs-num">0</span>,k=l;
  <span class="cs-kw">while</span>(i&lt;n1 &amp;&amp; j&lt;n2)
    arr[k++]=L[i]&lt;=R[j] ? L[i++] : R[j++];
  <span class="cs-kw">while</span>(i&lt;n1) arr[k++]=L[i++];
  <span class="cs-kw">while</span>(j&lt;n2) arr[k++]=R[j++];
}
<span class="cs-kw">void</span> <span class="cs-fn">mergeSort</span>(<span class="cs-type">int</span> arr[],<span class="cs-type">int</span> l,<span class="cs-type">int</span> r){
  <span class="cs-kw">if</span>(l&lt;r){ <span class="cs-type">int</span> m=(l+r)/<span class="cs-num">2</span>;
    <span class="cs-fn">mergeSort</span>(arr,l,m); <span class="cs-fn">mergeSort</span>(arr,m+<span class="cs-num">1</span>,r);
    <span class="cs-fn">merge</span>(arr,l,m,r); }
}`,
    genSteps(arr) {
      const a=[...arr],steps=[],n=a.length,sorted=new Set();
      function doMerge(arr,l,m,r){
        const L=arr.slice(l,m+1),R=arr.slice(m+1,r+1);
        let i=0,j=0,k=l;
        while(i<L.length&&j<R.length){
          steps.push({type:'cmp',line:9,i:l+i,j:m+1+j,arr:[...arr],sorted:new Set(sorted),range:[l,r],msg:`Merging [${l}..${m}] & [${m+1}..${r}]: ${L[i]} vs ${R[j]}`});
          arr[k++]=L[i]<=R[j]?L[i++]:R[j++];
          steps.push({type:'place',line:9,arr:[...arr],sorted:new Set(sorted),range:[l,r],msg:`Placed ${arr[k-1]} into merged array`});
        }
        while(i<L.length){arr[k++]=L[i++];steps.push({type:'place',line:10,arr:[...arr],sorted:new Set(sorted),range:[l,r],msg:`Appended remaining left: ${arr[k-1]}`});}
        while(j<R.length){arr[k++]=R[j++];steps.push({type:'place',line:11,arr:[...arr],sorted:new Set(sorted),range:[l,r],msg:`Appended remaining right: ${arr[k-1]}`});}
      }
      function ms(arr,l,r){
        if(l>=r){sorted.add(l);return;}
        const m=Math.floor((l+r)/2);
        steps.push({type:'divide',line:16,arr:[...arr],sorted:new Set(sorted),range:[l,r],msg:`Dividing [${l}..${r}] → [${l}..${m}] and [${m+1}..${r}]`});
        ms(arr,l,m); ms(arr,m+1,r);
        doMerge(arr,l,m,r);
      }
      ms(a,0,n-1);
      for(let k=0;k<n;k++) sorted.add(k);
      steps.push({type:'done',arr:[...a],sorted:new Set(sorted),msg:'✅ Merge sort complete!'});
      return steps;
    }
  },
  'quick-sort': {
    label:'Quick Sort', timeC:'O(n log n) avg', spaceC:'O(log n)',
    desc:'Pick a pivot, partition array around it, then recursively sort both halves.',
    code:`<span class="cs-cm">// Quick Sort — O(n log n) avg, O(log n) space</span>
<span class="cs-type">int</span> <span class="cs-fn">partition</span>(<span class="cs-type">int</span> arr[],<span class="cs-type">int</span> low,<span class="cs-type">int</span> high){
  <span class="cs-type">int</span> pivot=arr[high];
  <span class="cs-type">int</span> i=low-<span class="cs-num">1</span>;
  <span class="cs-kw">for</span>(<span class="cs-type">int</span> j=low;j&lt;high;j++){
    <span class="cs-kw">if</span>(arr[j]&lt;=pivot){
      i++;
      <span class="cs-fn">swap</span>(arr[i],arr[j]);
    }
  }
  <span class="cs-fn">swap</span>(arr[i+<span class="cs-num">1</span>],arr[high]);
  <span class="cs-kw">return</span> i+<span class="cs-num">1</span>; <span class="cs-cm">// pivot final position</span>
}
<span class="cs-kw">void</span> <span class="cs-fn">quickSort</span>(<span class="cs-type">int</span> arr[],<span class="cs-type">int</span> low,<span class="cs-type">int</span> high){
  <span class="cs-kw">if</span>(low&lt;high){
    <span class="cs-type">int</span> pi=<span class="cs-fn">partition</span>(arr,low,high);
    <span class="cs-fn">quickSort</span>(arr,low,pi-<span class="cs-num">1</span>);
    <span class="cs-fn">quickSort</span>(arr,pi+<span class="cs-num">1</span>,high);
  }
}`,
    genSteps(arr) {
      const a=[...arr],steps=[],n=a.length,sorted=new Set();
      function partition(arr,low,high){
        const pivot=arr[high]; let i=low-1;
        steps.push({type:'pivot',line:3,i:high,arr:[...arr],sorted:new Set(sorted),range:[low,high],msg:`Pivot = ${pivot} (index ${high}), partitioning [${low}..${high}]`});
        for(let j=low;j<high;j++){
          steps.push({type:'cmp',line:6,i:j,j:high,arr:[...arr],sorted:new Set(sorted),range:[low,high],msg:`Comparing arr[${j}]=${arr[j]} ≤ pivot ${pivot}?`});
          if(arr[j]<=pivot){i++;[arr[i],arr[j]]=[arr[j],arr[i]];if(i!==j)steps.push({type:'swap',line:8,i:i,j:j,arr:[...arr],sorted:new Set(sorted),range:[low,high],msg:`Yes! Swapping ${arr[j]}↔${arr[i]}`});}
        }
        [arr[i+1],arr[high]]=[arr[high],arr[i+1]];
        steps.push({type:'place',line:11,i:i+1,arr:[...arr],sorted:new Set(sorted),range:[low,high],msg:`Pivot ${pivot} placed at its final position ${i+1}`});
        return i+1;
      }
      function qs(arr,low,high){
        if(low>=high){if(low===high)sorted.add(low);return;}
        const pi=partition(arr,low,high); sorted.add(pi);
        qs(arr,low,pi-1); qs(arr,pi+1,high);
      }
      qs(a,0,n-1);
      for(let k=0;k<n;k++) sorted.add(k);
      steps.push({type:'done',arr:[...a],sorted:new Set(sorted),msg:'✅ Quick sort complete!'});
      return steps;
    }
  },
  'heap-sort': {
    label:'Heap Sort', timeC:'O(n log n)', spaceC:'O(1)',
    desc:'Build a max-heap, then repeatedly extract the maximum to sort in-place.',
    code:`<span class="cs-cm">// Heap Sort — O(n log n), O(1) extra space</span>
<span class="cs-kw">void</span> <span class="cs-fn">heapify</span>(<span class="cs-type">int</span> arr[],<span class="cs-type">int</span> n,<span class="cs-type">int</span> i){
  <span class="cs-type">int</span> largest=i;
  <span class="cs-type">int</span> l=<span class="cs-num">2</span>*i+<span class="cs-num">1</span>, r=<span class="cs-num">2</span>*i+<span class="cs-num">2</span>;
  <span class="cs-kw">if</span>(l&lt;n &amp;&amp; arr[l]&gt;arr[largest]) largest=l;
  <span class="cs-kw">if</span>(r&lt;n &amp;&amp; arr[r]&gt;arr[largest]) largest=r;
  <span class="cs-kw">if</span>(largest!=i){
    <span class="cs-fn">swap</span>(arr[i],arr[largest]);
    <span class="cs-fn">heapify</span>(arr,n,largest);
  }
}
<span class="cs-kw">void</span> <span class="cs-fn">heapSort</span>(<span class="cs-type">int</span> arr[],<span class="cs-type">int</span> n){
  <span class="cs-cm">// Build max-heap</span>
  <span class="cs-kw">for</span>(<span class="cs-type">int</span> i=n/<span class="cs-num">2</span>-<span class="cs-num">1</span>;i&gt;=<span class="cs-num">0</span>;i--)
    <span class="cs-fn">heapify</span>(arr,n,i);
  <span class="cs-cm">// Extract max repeatedly</span>
  <span class="cs-kw">for</span>(<span class="cs-type">int</span> i=n-<span class="cs-num">1</span>;i&gt;<span class="cs-num">0</span>;i--){
    <span class="cs-fn">swap</span>(arr[<span class="cs-num">0</span>],arr[i]);
    <span class="cs-fn">heapify</span>(arr,i,<span class="cs-num">0</span>);
  }
}`,
    genSteps(arr) {
      const a=[...arr],steps=[],n=a.length,sorted=new Set();
      function heapify(arr,sz,i){
        let largest=i,l=2*i+1,r=2*i+2;
        steps.push({type:'cmp',line:5,i:i,j:l<sz?l:-1,arr:[...arr],sorted:new Set(sorted),heap:sz,msg:`Heapify at ${i}: l=${l<sz?arr[l]:'—'} r=${r<sz?arr[r]:'—'}, largest?`});
        if(l<sz&&arr[l]>arr[largest])largest=l;
        if(r<sz&&arr[r]>arr[largest])largest=r;
        if(largest!==i){[arr[i],arr[largest]]=[arr[largest],arr[i]];steps.push({type:'swap',line:8,i:i,j:largest,arr:[...arr],sorted:new Set(sorted),heap:sz,msg:`Swapping ${arr[largest]}↔${arr[i]} to maintain heap`});heapify(arr,sz,largest);}
      }
      for(let i=Math.floor(n/2)-1;i>=0;i--) heapify(a,n,i);
      steps.push({type:'built',line:14,arr:[...a],sorted:new Set(sorted),msg:'Max-heap built! Starting extraction phase.'});
      for(let i=n-1;i>0;i--){
        [a[0],a[i]]=[a[i],a[0]]; sorted.add(i);
        steps.push({type:'extract',line:18,i:0,j:i,arr:[...a],sorted:new Set(sorted),heap:i,msg:`Extracted max ${a[i]}, placed at index ${i}. Heap size now ${i}`});
        heapify(a,i,0);
      }
      sorted.add(0);
      steps.push({type:'done',arr:[...a],sorted:new Set(sorted),msg:'✅ Heap sort complete!'});
      return steps;
    }
  }
};

function runSortViz(algoId) {
  const algo = SORT_REGISTRY[algoId];
  if (!algo) return;

  let N = 28, inputType = 'random';
  let arr = [], steps = [], stepIdx = 0;

  function makeArray() {
    if (inputType==='random') arr=Array.from({length:N},()=>5+Math.floor(Math.random()*95));
    else if (inputType==='sorted') arr=Array.from({length:N},(_,i)=>5+Math.floor(i/(N-1)*95));
    else arr=Array.from({length:N},(_,i)=>100-Math.floor(i/(N-1)*95));
    steps=algo.genSteps([...arr]); stepIdx=0;
  }
  makeArray();

  buildLeftPanel(`
    <div class="panel-section">
      <div class="panel-section-title">Parameters</div>
      ${makeSlider('cs_n','Array Size',8,50,N,1,'',v=>{N=v;makeArray();csStopEngine();})}
      ${makeSlider('cs_spd','Speed',1,20,5,1,'',v=>{if(csAnimState)csAnimState.msPerStep=Math.max(10,220-v*10);})}
    </div>
    <div class="panel-section">
      <div class="panel-section-title">Input Type</div>
      <div style="display:flex;flex-direction:column;gap:6px;">
        ${['random','sorted','reverse'].map(t=>`<button class="ctrl-btn${t==='random'?' primary':''}" id="cs_inp_${t}">${t.charAt(0).toUpperCase()+t.slice(1)}</button>`).join('')}
      </div>
    </div>
    <div class="panel-section">
      <div class="panel-section-title">Controls</div>
      <button class="ctrl-btn primary" id="cs_start">▶ Start</button>
      <button class="ctrl-btn" id="cs_pause">⏸ Pause</button>
      <button class="ctrl-btn danger" id="cs_reset">↺ Reset</button>
    </div>
  `);
  buildRightPanel(csRightPanel(algo.code, algo.timeC, algo.spaceC, algo.desc));

  ['random','sorted','reverse'].forEach(t=>{
    const btn=document.getElementById('cs_inp_'+t);
    if(btn) btn.onclick=()=>{
      document.querySelectorAll('[id^=cs_inp_]').forEach(b=>b.classList.remove('primary'));
      btn.classList.add('primary');
      inputType=t; makeArray(); csStopEngine();
    };
  });

  function render() {
    const W=canvas.width, H=canvas.height;
    clearCanvas(); drawGrid(0.025);
    const step = steps[stepIdx] || {arr:arr, sorted:new Set(), msg:''};
    const a = step.arr || arr;
    const n = a.length;
    const maxV = Math.max(...a) || 1;
    const gap = (W-40)/n;
    const barW = Math.max(2, gap-1);
    const maxH = H-70;

    // Range highlight
    if(step.range){
      const[rl,rr]=step.range;
      ctx.fillStyle='rgba(0,229,255,0.04)';
      ctx.fillRect(20+rl*gap,20,(rr-rl+1)*gap,maxH+20);
      ctx.strokeStyle='rgba(0,229,255,0.12)'; ctx.lineWidth=1;
      ctx.strokeRect(20+rl*gap,20,(rr-rl+1)*gap,maxH+20);
    }

    a.forEach((v,i)=>{
      const bh=Math.max(4,(v/maxV)*maxH);
      const bx=20+i*gap, by=H-32-bh;
      let color='#1e3a5a';
      if(step.sorted&&step.sorted.has(i)) color='#7c3aed';
      else if((step.type==='cmp')&&(i===step.i||i===step.j)) color='#f59e0b';
      else if((step.type==='swap'||step.type==='extract')&&(i===step.i||i===step.j)) color='#ff4757';
      else if(step.type==='pivot'&&i===step.i) color='#ff6b9d';
      else if((step.type==='pick'||step.type==='place')&&i===step.i) color='#00e5ff';
      else if(step.type==='insert'&&i===step.i) color='#2ed573';
      else if(step.heap!==undefined&&i<step.heap) color='#06b6d4';

      const grad=ctx.createLinearGradient(bx,by,bx,by+bh);
      grad.addColorStop(0,color); grad.addColorStop(1,color+'55');
      ctx.fillStyle=grad;
      if(ctx.roundRect){ctx.beginPath();ctx.roundRect(bx,by,barW,bh,2);ctx.fill();}
      else{ctx.fillRect(bx,by,barW,bh);}

      if(color!=='#1e3a5a'){ctx.shadowColor=color;ctx.shadowBlur=10;ctx.fillStyle=color;if(ctx.roundRect){ctx.beginPath();ctx.roundRect(bx,by,barW,bh,2);ctx.fill();}else ctx.fillRect(bx,by,barW,bh);ctx.shadowBlur=0;}

      if(n<=22){
        ctx.fillStyle=color==='#1e3a5a'?'#2a4060':color;
        ctx.font=`${Math.min(9,Math.floor(barW*0.7))}px "Space Mono",monospace`;
        ctx.textAlign='center'; ctx.fillText(v,bx+barW/2,by-3); ctx.textAlign='start';
      }
    });

    // Legend
    const leg=[['#7c3aed','Sorted'],['#f59e0b','Comparing'],['#ff4757','Swapping'],['#ff6b9d','Pivot'],['#00e5ff','Key']];
    leg.forEach(([c,t],li)=>{
      ctx.fillStyle=c+'cc'; ctx.fillRect(16+li*82,H-22,10,9);
      ctx.fillStyle='#5a7a9a'; ctx.font='9px "Space Mono",monospace';
      ctx.fillText(t,30+li*82,H-14);
    });

    // Step counter
    const prog=steps.length>0?stepIdx/steps.length:0;
    ctx.fillStyle='#0a1520'; ctx.fillRect(0,H-5,W,5);
    ctx.fillStyle='#00e5ff'; ctx.fillRect(0,H-5,W*prog,5);
    ctx.fillStyle='#3d5470'; ctx.font='10px "Space Mono",monospace';
    ctx.fillText(`Step ${stepIdx}/${steps.length}`,W-100,H-8);

    if(step.msg) csSetStep(step.msg); csHL(step.line||0);
  }

  document.getElementById('cs_start').onclick=()=>{
    if(!csAnimState) return;
    if(stepIdx>=steps.length) makeArray();
    csAnimState.running=true;
  };
  document.getElementById('cs_pause').onclick=()=>csStopEngine();
  document.getElementById('cs_reset').onclick=()=>{csStopEngine();makeArray();};

  csStartEngine(render);
  csAnimState.msPerStep=120;
  csAnimState.onTick=()=>{
    if(stepIdx<steps.length){stepIdx++;return false;}
    csSetStep('✅ Sorting complete! Press Reset to try again.');
    return true;
  };
}

