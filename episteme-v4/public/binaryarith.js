
// ══════════════════════════════════════════════════════════════════
//  BINARY ARITHMETIC — SHARED UTILITIES
// ══════════════════════════════════════════════════════════════════

function padBin(n, bits) {
  const mask = (1 << bits) - 1;
  return ((n & mask) >>> 0).toString(2).padStart(bits, '0');
}

function baHighlight(x, y, w, h, color) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath(); ctx.roundRect(x, y, w, h, 4);
  ctx.fill(); ctx.restore();
}

// Draw one logic gate at centre (gx, gy). Returns output x so wires can continue.
function drawGate(gx, gy, type, inputs, output) {
  const bw = 50, bh = 34;
  const bx = gx - bw / 2, by = gy - bh / 2;
  const oc = output ? '#00ffa3' : '#334';
  const ic = (v) => v ? '#00e5ff' : '#334';

  ctx.save();
  ctx.strokeStyle = '#00e5ff'; ctx.lineWidth = 1.8;
  ctx.fillStyle = 'rgba(0,229,255,0.07)';

  // Body
  ctx.beginPath();
  if (type === 'AND') {
    ctx.moveTo(bx, by); ctx.lineTo(bx + bw / 2, by);
    ctx.arc(bx + bw / 2, gy, bh / 2, -Math.PI / 2, Math.PI / 2);
    ctx.lineTo(bx, by + bh); ctx.closePath();
  } else { // OR / XOR
    ctx.moveTo(bx, by);
    ctx.quadraticCurveTo(bx + bw * 0.6, by, bx + bw, gy);
    ctx.quadraticCurveTo(bx + bw * 0.6, by + bh, bx, by + bh);
    ctx.quadraticCurveTo(bx + bw * 0.3, gy, bx, by);
  }
  ctx.fill(); ctx.stroke();

  if (type === 'XOR') {
    ctx.beginPath();
    ctx.moveTo(bx - 8, by + bh);
    ctx.quadraticCurveTo(bx + bw * 0.3 - 8, gy, bx - 8, by);
    ctx.stroke();
  }

  // Label
  ctx.fillStyle = '#00e5ff'; ctx.font = 'bold 9px "Space Mono",monospace';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(type, gx, gy);

  // Input wires
  const nin = inputs.length;
  const sp = bh / (nin + 1);
  inputs.forEach((v, i) => {
    const wy = by + sp * (i + 1);
    ctx.beginPath(); ctx.strokeStyle = ic(v); ctx.lineWidth = 1.8;
    ctx.moveTo(bx - 32, wy); ctx.lineTo(bx, wy); ctx.stroke();
    ctx.fillStyle = ic(v); ctx.font = '9px "Space Mono",monospace';
    ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    ctx.fillText(v ? '1' : '0', bx - 34, wy);
  });

  // Output wire
  ctx.beginPath(); ctx.strokeStyle = oc; ctx.lineWidth = 1.8;
  ctx.moveTo(bx + bw, gy); ctx.lineTo(bx + bw + 32, gy); ctx.stroke();
  ctx.fillStyle = oc; ctx.font = '9px "Space Mono",monospace';
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.fillText(output ? '1' : '0', bx + bw + 34, gy);

  ctx.restore();
  return bx + bw + 32; // right end of output wire
}

// Draw a single wire segment
function baWire(x1, y1, x2, y2, val) {
  ctx.save(); ctx.strokeStyle = val ? '#00e5ff' : '#334'; ctx.lineWidth = 1.8;
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); ctx.restore();
}

function baLabel(x, y, text, color, align) {
  ctx.save(); ctx.fillStyle = color || 'var(--text2)';
  ctx.font = '11px "Space Mono",monospace';
  ctx.textAlign = align || 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y); ctx.restore();
}

// ══════════════════════════════════════════════════════════════════
//  1A. BINARY ADDITION — TABULAR METHOD
// ══════════════════════════════════════════════════════════════════
function runBinaryAddition() {
  const W = 700, H = 500, BITS = 8;
  let valA = 45, valB = 27, activeRow = -1;

  // Build ALL rows up front; they are always drawn. activeRow just controls highlight.
  function allRows(a, b) {
    let carry = 0;
    const rows = [];
    for (let i = BITS - 1; i >= 0; i--) {
      const bA = (a >> i) & 1, bB = (b >> i) & 1;
      const s = bA + bB + carry;
      rows.push({ bit: i, bA, bB, cin: carry, sum: s & 1, cout: s >> 1 });
      carry = s >> 1;
    }
    return rows;
  }

  function reset() { activeRow = -1; render(); csSetStep('Press ▶ Next Bit or ⚡ Auto.'); }

  buildLeftPanel(`
    <div class="panel-section">
      <div class="panel-section-title">Operands</div>
      ${makeSlider('bat_a','Value A',0,127,45,1,'',v=>{ valA=v; activeRow=-1; render(); })}
      ${makeSlider('bat_b','Value B',0,127,27,1,'',v=>{ valB=v; activeRow=-1; render(); })}
    </div>
    <div class="panel-section">
      <div class="panel-section-title">Animate</div>
      <button class="ctrl-btn primary" data-action="bat_step">▶ Next Bit</button>
      <button class="ctrl-btn" data-action="bat_auto">⚡ Auto</button>
      <button class="ctrl-btn" data-action="bat_reset">↺ Reset</button>
    </div>`);
  buildRightPanel(csRightPanel(
    `<span class="cs-cm">// Full Adder per bit</span>\n<span class="cs-kw">for</span>(i=n-1;i&gt;=0;i--) {\n  s=A[i]^B[i]^cin;\n  cout=(A[i]&B[i])|\n   ((A[i]^B[i])&cin);\n  cin=cout;\n}`,
    'O(n)', 'O(1)', 'Each row shows one bit of the addition. Cin comes from the previous Cout.'
  ));

  LAB['bat_step'] = () => {
    const rows = allRows(valA, valB);
    if (activeRow < BITS - 1) activeRow++;
    else { csSetStep('✅ All bits processed!'); return; }
    const r = rows[activeRow];
    csSetStep(`Bit ${r.bit}: A=${r.bA} B=${r.bB} Cin=${r.cin} → Sum=${r.sum} Cout=${r.cout}`);
    render();
  };
  LAB['bat_auto'] = () => {
    activeRow = -1; render();
    function go() {
      if (activeRow >= BITS - 1) { csSetStep('✅ Addition complete!'); return; }
      activeRow++;
      const r = allRows(valA, valB)[activeRow];
      csSetStep(`Bit ${r.bit}: Sum=${r.sum} Cout=${r.cout}`);
      render(); setTimeout(go, 650);
    }
    go();
  };
  LAB['bat_reset'] = reset;

  function render() {
    clearCanvas(); drawGrid(0.04);
    const rows = allRows(valA, valB);
    const total = valA + valB;
    const ox = 60, oy = 52, cw = 56, rh = 34;
    const cols = ['Bit','A','B','Cin','Sum','Cout'];

    ctx.save(); ctx.font = 'bold 14px "Nunito",sans-serif';
    ctx.fillStyle = '#34d399'; ctx.textAlign = 'center';
    ctx.fillText(`${valA}  +  ${valB}  =  ${total}    (${padBin(valA,BITS)} + ${padBin(valB,BITS)})`, W/2, 28);
    ctx.restore();

    // Header row
    cols.forEach((c, ci) => {
      baHighlight(ox + ci*cw, oy, cw-2, rh-2, 'rgba(52,211,153,0.18)');
      ctx.save(); ctx.font='bold 11px "Space Mono",monospace'; ctx.fillStyle='#34d399';
      ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(c, ox+ci*cw+cw/2-1, oy+rh/2-1); ctx.restore();
    });

    // ALL data rows — always visible
    rows.forEach((r, ri) => {
      const ry = oy + (ri+1)*rh;
      const isActive = ri === activeRow;
      const isDone   = activeRow >= 0 && ri < activeRow;
      if (isActive) baHighlight(ox, ry, cols.length*cw-2, rh-2, 'rgba(52,211,153,0.25)');
      else if (isDone) baHighlight(ox, ry, cols.length*cw-2, rh-2, 'rgba(52,211,153,0.07)');

      const vals = [r.bit, r.bA, r.bB, r.cin, r.sum, r.cout];
      vals.forEach((v, ci) => {
        ctx.save(); ctx.font=(isActive?'bold ':'')+`12px "Space Mono",monospace`;
        ctx.fillStyle = isActive ? '#34d399' : isDone ? '#22d3ee' : 'var(--text2)';
        ctx.textAlign='center'; ctx.textBaseline='middle';
        ctx.fillText(String(v), ox+ci*cw+cw/2-1, ry+rh/2-1); ctx.restore();
      });

      // Carry arrow from cout → next row's cin
      if (r.cout && ri < rows.length - 1) {
        ctx.save(); ctx.strokeStyle='rgba(251,191,36,0.55)'; ctx.lineWidth=1.4; ctx.setLineDash([3,3]);
        const cx5 = ox + 5*cw + cw/2, cx3 = ox + 3*cw + cw/2;
        ctx.beginPath(); ctx.moveTo(cx5, ry+rh-3); ctx.lineTo(cx3, ry+rh+3); ctx.stroke(); ctx.restore();
      }
    });

    // Result row
    const ry = oy + (rows.length+1)*rh;
    baHighlight(ox, ry, cols.length*cw-2, rh-2, 'rgba(251,191,36,0.18)');
    ctx.save(); ctx.font='bold 12px "Space Mono",monospace'; ctx.fillStyle='#fbbf24';
    ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText('Result', ox+cw/2-1, ry+rh/2-1);
    ctx.fillText(padBin(total, BITS), ox+2.5*cw, ry+rh/2-1);
    if (total >= (1<<BITS)) { ctx.fillStyle='#ff4757'; ctx.fillText('OVERFLOW!', ox+5*cw, ry+rh/2-1); }
    ctx.restore();

    ctx.save(); ctx.font='10px "Space Mono",monospace'; ctx.fillStyle='var(--text3)';
    ctx.textAlign='left'; ctx.fillText('Sum=A⊕B⊕Cin  |  Cout=(A·B)+(Cin·(A⊕B))', ox, H-16); ctx.restore();
  }
  reset();
}

// ══════════════════════════════════════════════════════════════════
//  1B. BINARY ADDITION — LOGIC GATES
// ══════════════════════════════════════════════════════════════════
function runBinaryAdditionGates() {
  const W = 700, H = 500, BITS = 8;
  let valA = 45, valB = 27, bitIdx = 0;

  function getRow(a, b, bit) {
    let carry = 0;
    for (let i = BITS-1; i > bit; i--) {
      const s = ((a>>i)&1)+((b>>i)&1)+carry; carry = s>>1;
    }
    const bA=(a>>bit)&1, bB=(b>>bit)&1, cin=carry;
    const s=bA+bB+cin;
    return { bA, bB, cin, sum:s&1, cout:s>>1, xor1:bA^bB };
  }

  function reset() { bitIdx = BITS-1; render(); }

  buildLeftPanel(`
    <div class="panel-section">
      <div class="panel-section-title">Operands</div>
      ${makeSlider('bag_a','Value A',0,127,45,1,'',v=>{ valA=v; render(); })}
      ${makeSlider('bag_b','Value B',0,127,27,1,'',v=>{ valB=v; render(); })}
    </div>
    <div class="panel-section">
      <div class="panel-section-title">Bit Position</div>
      <button class="ctrl-btn primary" data-action="bag_prev">◀ Prev Bit</button>
      <button class="ctrl-btn" data-action="bag_next">▶ Next Bit</button>
      <button class="ctrl-btn" data-action="bag_auto">⚡ Auto All</button>
    </div>`);
  buildRightPanel(csRightPanel(
    `<span class="cs-cm">// Full Adder gates</span>\nXOR1 = A ^ B\nXOR2 = XOR1 ^ Cin\n<span class="cs-cm">// Sum = XOR2</span>\nAND1 = A & B\nAND2 = XOR1 & Cin\n<span class="cs-cm">// Cout = AND1|AND2</span>`,
    'O(n)', 'O(n)', 'Each bit uses 2 XOR + 2 AND + 1 OR. Navigate bits to see live wire values.'
  ));

  LAB['bag_prev'] = () => { if(bitIdx<BITS-1) bitIdx++; render(); csSetStep(`Showing bit ${bitIdx}`); };
  LAB['bag_next'] = () => { if(bitIdx>0) bitIdx--; render(); csSetStep(`Showing bit ${bitIdx}`); };
  LAB['bag_auto'] = () => {
    bitIdx = BITS-1;
    function go() {
      render(); csSetStep(`Bit ${bitIdx}`);
      if (bitIdx > 0) { bitIdx--; setTimeout(go, 800); }
      else csSetStep('✅ All bits shown!');
    }
    go();
  };

  function render() {
    clearCanvas(); drawGrid(0.04);
    const { bA, bB, cin, sum, cout, xor1 } = getRow(valA, valB, bitIdx);
    const and1 = bA & bB, and2 = xor1 & cin;

    // ── colours ──
    const cA   = bA   ? '#00ffa3' : '#445';
    const cB   = bB   ? '#00ffa3' : '#445';
    const cCin = cin  ? '#fbbf24' : '#445';
    const cX1  = xor1 ? '#00e5ff' : '#445';
    const cA1  = and1 ? '#00e5ff' : '#445';
    const cA2  = and2 ? '#00e5ff' : '#445';
    const cSum = sum  ? '#00ffa3' : '#445';
    const cOut = cout ? '#fbbf24' : '#445';

    // ── canvas helpers ──
    function hline(x1,x2,y,col){ ctx.save();ctx.strokeStyle=col;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x1,y);ctx.lineTo(x2,y);ctx.stroke();ctx.restore(); }
    function vline(x,y1,y2,col){ ctx.save();ctx.strokeStyle=col;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x,y1);ctx.lineTo(x,y2);ctx.stroke();ctx.restore(); }
    function jdot(x,y,col){ ctx.save();ctx.fillStyle=col;ctx.beginPath();ctx.arc(x,y,4,0,Math.PI*2);ctx.fill();ctx.restore(); }
    function glabel(x,y,text,col,align){
      ctx.save();ctx.font='10px "Space Mono",monospace';ctx.fillStyle=col||'#7070a0';
      ctx.textAlign=align||'center';ctx.textBaseline='middle';ctx.fillText(text,x,y);ctx.restore();
    }

    // ── Title ──
    ctx.save(); ctx.font='bold 13px "Nunito",sans-serif'; ctx.fillStyle='#6ee7b7'; ctx.textAlign='center';
    ctx.fillText(`Full Adder — Bit \${bitIdx}  |  A=\${bA}  B=\${bB}  Cin=\${cin}  →  Sum=\${sum}  Cout=\${cout}`, W/2, 22); ctx.restore();

    // ── Layout constants (matching reference image structure) ──
    // Input rail x
    const xRail = 55;
    // Gate centres
    const xG1 = 200;   // XOR1, AND1  (first column)
    const xG2 = 390;   // XOR2, AND2  (second column)
    const xG3 = 560;   // OR           (third column — Cout)
    // Row y-centres
    const yR1 = 160;   // top row:    XOR1
    const yR2 = 255;   // upper-mid:  AND1
    const yR3 = 335;   // lower-mid:  XOR2 / AND2
    const yR4 = 415;   // bottom:     OR

    // Gate half-width (matches drawGate bw=50 → extends ±25 from centre x)
    const GW = 25; // half-width used for wire attachment

    // ── Input stubs on the left rail ──
    // A  enters at yR1-9 and yR2-9 (top inputs of XOR1 and AND1)
    // B  enters at yR1+9 and yR2+9
    // Cin enters at yR3+9 and yR4-9 (bottom inputs of XOR2/AND2 and OR)

    // A rail: vertical line from yR1-top to yR2-top, then horizontal to gates
    const yA = yR1 - 10;
    const yB = yR1 + 10;
    const yCin = 455;

    // Draw input labels
    glabel(xRail-4, yA,   `A = \${bA}`,   cA,   'right');
    glabel(xRail-4, yB,   `B = \${bB}`,   cB,   'right');
    glabel(xRail-4, yCin, `Cin=\${cin}`, cCin, 'right');

    // ── Horizontal input wires to Gate column 1 ──
    hline(xRail, xG1-GW, yA,   cA);    // A → XOR1 top input
    hline(xRail, xG1-GW, yB,   cB);    // B → XOR1 bottom input

    // ── A and B also tap down to AND1 ──
    // Junction on A wire at x=xRail+16 going down to AND1 top
    const xTapA = xRail + 16;
    const xTapB = xRail + 28;
    jdot(xTapA, yA, cA);
    vline(xTapA, yA, yR2-10, cA);
    hline(xTapA, xG1-GW, yR2-10, cA);   // A → AND1 top input

    jdot(xTapB, yB, cB);
    vline(xTapB, yB, yR2+10, cB);
    hline(xTapB, xG1-GW, yR2+10, cB);   // B → AND1 bottom input

    // ── Draw Gate column 1 ──
    drawGate(xG1, yR1, 'XOR', [bA, bB], xor1);   // XOR1
    drawGate(xG1, yR2, 'AND', [bA, bB], and1);   // AND1

    // ── XOR1 output → XOR2 top input + AND2 top input ──
    const xXOR1out = xG1 + GW;
    // short stub right
    hline(xXOR1out, xXOR1out+30, yR1, cX1);
    // junction: splits to XOR2 (yR3-10) and AND2 (yR3-10 but different x)
    const xXOR1mid = xXOR1out + 30;
    jdot(xXOR1mid, yR1, cX1);
    // go down to yR3-10
    vline(xXOR1mid, yR1, yR3-10, cX1);
    hline(xXOR1mid, xG2-GW, yR3-10, cX1);       // → XOR2 top input
    // also tap to AND2 top input (same y but AND2 is also at yR3, just different gate)
    // AND2 is at xG2 too, slightly below XOR2
    hline(xXOR1mid, xG2-GW, yR4-10, cX1);       // → AND2 top (OR row-1)
    // need another junction to split them
    jdot(xXOR1mid, yR3-10, cX1);
    vline(xXOR1mid, yR3-10, yR4-10, cX1);

    // ── Cin horizontal wire from left, goes to XOR2 bottom + AND2 bottom ──
    hline(xRail, xRail+20, yCin, cCin);
    const xCinTap = xRail + 20;
    jdot(xCinTap, yCin, cCin);
    // Go up to XOR2 bottom (yR3+10)
    vline(xCinTap, yR3+10, yCin, cCin);
    hline(xCinTap, xG2-GW, yR3+10, cCin);       // → XOR2 bottom input
    // Go up slightly to AND2 bottom (yR4+10)
    hline(xCinTap, xG2-GW, yR4+10, cCin);       // → AND2 bottom input  
    jdot(xCinTap, yR3+10, cCin);
    vline(xCinTap, yR3+10, yR4+10, cCin);
    jdot(xCinTap, yR4+10, cCin);

    // ── Draw Gate column 2 ──
    drawGate(xG2, yR3, 'XOR', [xor1, cin], sum);  // XOR2 → Sum
    drawGate(xG2, yR4, 'AND', [xor1, cin], and2); // AND2

    // ── AND1 output → OR top input ──
    const xAND1out = xG1 + GW;
    hline(xAND1out, xAND1out+20, yR2, cA1);
    const xAND1mid = xAND1out + 20;
    jdot(xAND1mid, yR2, cA1);
    // run right past xG2, then into OR top
    const xORroute = xG2 + GW + 30;
    hline(xAND1mid, xORroute, yR2, cA1);
    vline(xORroute, yR2, yR4-10-(yR4-yR2)*0, cA1);
    // just go directly: AND1 output runs right to OR top input routing
    // Simpler: AND1 → right stub → run down at xORroute to OR top
    // already drew above; now from xORroute go down to yR4-10
    vline(xORroute, yR2, yR4-10, cA1);
    hline(xORroute, xG3-GW, yR4-10, cA1);        // → OR top input

    // ── AND2 output → OR bottom input ──
    const xAND2out = xG2 + GW;
    hline(xAND2out, xG3-GW, yR4+10, cA2);   // AND2 out straight to OR bottom

    // Wait — OR gate top/bottom inputs: place OR at yR4 so:
    // top input at yR4-10, bottom input at yR4+10 -- both already wired

    // ── Draw OR gate ──
    drawGate(xG3, yR4, 'OR', [and1, and2], cout);

    // ── XOR2 → SUM output label ──
    const xXOR2out = xG2 + GW;
    hline(xXOR2out, xXOR2out+60, yR3, cSum);
    glabel(xXOR2out+68, yR3, `S = \${sum}`, cSum, 'left');
    // Tick mark on wire
    ctx.save();ctx.strokeStyle=cSum;ctx.lineWidth=1.5;
    ctx.beginPath();ctx.moveTo(xXOR2out+14,yR3-5);ctx.lineTo(xXOR2out+14,yR3+5);ctx.stroke();ctx.restore();

    // ── OR → COUT output ──
    const xORout = xG3 + GW;
    hline(xORout, xORout+50, yR4, cOut);
    glabel(xORout+58, yR4, `Cout = \${cout}`, cOut, 'left');
    ctx.save();ctx.strokeStyle=cOut;ctx.lineWidth=1.5;
    ctx.beginPath();ctx.moveTo(xORout+14,yR4-5);ctx.lineTo(xORout+14,yR4+5);ctx.stroke();ctx.restore();

    // ── Gate labels ──
    glabel(xG1, yR1-28, 'XOR', '#6ee7b7');
    glabel(xG1, yR2-28, 'AND', '#6ee7b7');
    glabel(xG2, yR3-28, 'XOR', '#6ee7b7');
    glabel(xG2, yR4-28, 'AND', '#6ee7b7');
    glabel(xG3, yR4-28, 'OR',  '#fbbf24');

    // ── Bit navigator strip ──
    ctx.save(); ctx.font='9px "Space Mono",monospace';
    for (let b=BITS-1; b>=0; b--) {
      const bx = 22 + (BITS-1-b)*84;
      const r2=getRow(valA,valB,b);
      ctx.fillStyle = b===bitIdx?'#6ee7b7':'rgba(52,211,153,0.2)';
      ctx.beginPath(); ctx.roundRect(bx,6,72,16,3); ctx.fill();
      ctx.fillStyle = b===bitIdx?'#0d0d1a':'var(--text2)';
      ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(`b\${b}: S=\${r2.sum} C=\${r2.cout}`, bx+36, 14);
    }
    ctx.restore();
  }
  reset();
  csSetStep('Full-adder gate circuit. Use ◀▶ to navigate bits or ⚡ Auto.');
}

// ══════════════════════════════════════════════════════════════════
//  2A. BINARY SUBTRACTION — TABULAR METHOD
// ══════════════════════════════════════════════════════════════════
function runBinarySubtraction() {
  const W=700, H=500, BITS=8;
  let valA=53, valB=27, phase=0;
  const PHASES=['','1s complement: flip all bits of B','2s complement: add 1','Add A + 2sComp(B)','Final result'];

  function reset() { phase=0; render(); csSetStep('Press ▶ Next Phase to step through 2s complement subtraction.'); }

  buildLeftPanel(`
    <div class="panel-section">
      <div class="panel-section-title">Operands</div>
      ${makeSlider('bst_a','Value A',0,127,53,1,'',v=>{ valA=v; phase=0; render(); })}
      ${makeSlider('bst_b','Value B',0,127,27,1,'',v=>{ valB=v; phase=0; render(); })}
    </div>
    <div class="panel-section">
      <div class="panel-section-title">Phases</div>
      <button class="ctrl-btn primary" data-action="bst_step">▶ Next Phase</button>
      <button class="ctrl-btn" data-action="bst_auto">⚡ Auto</button>
      <button class="ctrl-btn" data-action="bst_reset">↺ Reset</button>
    </div>`);
  buildRightPanel(csRightPanel(
    `<span class="cs-cm">// A − B = A + (~B+1)</span>\nonesB = ~B & mask;\ntwosB = onesB + 1;\nresult = A + twosB;\n<span class="cs-cm">// discard carry-out</span>`,
    'O(n)', 'O(n)', 'All rows stay visible. Current phase is highlighted in gold.'
  ));

  LAB['bst_step'] = () => { if(phase<4) phase++; render(); csSetStep(PHASES[phase]||'Done'); };
  LAB['bst_auto'] = () => {
    phase=0; render();
    function go() { if(phase>=4){csSetStep('✅ Subtraction complete!');return;} phase++; render(); csSetStep(PHASES[phase]||''); setTimeout(go,900); }
    setTimeout(go,500);
  };
  LAB['bst_reset'] = reset;

  function render() {
    clearCanvas(); drawGrid(0.04);
    const mask=(1<<BITS)-1;
    const onesB=(~valB)&mask, twosB=(onesB+1)&mask;
    const raw=valA+twosB, result=raw&mask, carryOut=(raw>>BITS)&1;

    ctx.save(); ctx.font='bold 14px "Nunito",sans-serif'; ctx.fillStyle='#f87171'; ctx.textAlign='center';
    ctx.fillText(`${valA}  −  ${valB}  =  ${valA-valB}`, W/2, 28); ctx.restore();

    const rows=[
      {label:'A',          bin:padBin(valA,BITS),  dec:valA,  note:'',           color:'#34d399', phase:0},
      {label:'B',          bin:padBin(valB,BITS),  dec:valB,  note:'',           color:'#f87171', phase:0},
      {label:"1's comp B", bin:padBin(onesB,BITS), dec:onesB, note:'← flip all', color:'#fbbf24', phase:1},
      {label:"2's comp B", bin:padBin(twosB,BITS), dec:twosB, note:'← +1',       color:'#a78bfa', phase:2},
      {label:'A + 2sB',    bin:padBin(raw,BITS+1), dec:raw,   note:`carry=${carryOut}`, color:'#00e5ff', phase:3},
      {label:'Result',     bin:padBin(result,BITS),dec:valA-valB,note:`= ${valA-valB}`, color:'#00ffa3', phase:4},
    ];

    const ox=40, oy=50, rh=58, labelW=112, bitW=28;
    // Bit position header
    ctx.save(); ctx.font='9px "Space Mono",monospace'; ctx.fillStyle='var(--text3)'; ctx.textAlign='center';
    for(let b=0;b<BITS;b++) ctx.fillText(`b${BITS-1-b}`, ox+labelW+b*bitW+bitW/2, oy+10);
    ctx.restore();

    rows.forEach((row,ri)=>{
      const ry=oy+20+ri*rh;
      const isActive=ri===phase||(phase>=4&&ri===5);
      const isVisible=row.phase<=phase;

      if(!isVisible) {
        // Draw placeholder row (greyed out)
        ctx.save(); ctx.font='italic 11px "Space Mono",monospace'; ctx.fillStyle='rgba(255,255,255,0.1)';
        ctx.textAlign='left'; ctx.textBaseline='middle';
        ctx.fillText(row.label, ox+8, ry+rh/2); ctx.restore();
        return;
      }

      if(isActive) baHighlight(ox, ry, labelW+BITS*bitW+120, rh-4, 'rgba(255,255,255,0.08)');

      // Label
      ctx.save(); ctx.font=(isActive?'bold ':'')+`12px "Space Mono",monospace`;
      ctx.fillStyle=row.color; ctx.textAlign='left'; ctx.textBaseline='middle';
      ctx.fillText(row.label, ox+6, ry+rh/2); ctx.restore();

      // Bits — each bit as a coloured box
      for(let b=0;b<Math.min(row.bin.length,BITS);b++){
        const bx=ox+labelW+b*bitW, by2=ry+8;
        const bit=row.bin[b]==='1';
        baHighlight(bx+1,by2, bitW-4,rh-18, bit?`rgba(${hexToRgb(row.color)},0.2)`:'rgba(255,255,255,0.03)');
        ctx.save(); ctx.font=(isActive?'bold ':'')+`12px "Space Mono",monospace`;
        ctx.fillStyle=bit?row.color:'var(--text3)';
        ctx.textAlign='center'; ctx.textBaseline='middle';
        ctx.fillText(row.bin[b]||'?', bx+bitW/2, by2+(rh-18)/2); ctx.restore();
      }

      // Decimal + note
      ctx.save(); ctx.font='11px "Space Mono",monospace'; ctx.fillStyle=row.color;
      ctx.textAlign='left'; ctx.textBaseline='middle';
      ctx.fillText(`= ${row.dec}  ${row.note}`, ox+labelW+BITS*bitW+8, ry+rh/2); ctx.restore();
    });
  }
  reset();
}

function hexToRgb(hex){
  // handle named colours by returning a fallback
  const m=hex.match(/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
  return m?`${parseInt(m[1],16)},${parseInt(m[2],16)},${parseInt(m[3],16)}`:'100,200,200';
}

// ══════════════════════════════════════════════════════════════════
//  2B. BINARY SUBTRACTION — LOGIC GATES
// ══════════════════════════════════════════════════════════════════
function runBinarySubtractionGates() {
  const W=700, H=500, BITS=8;
  let valA=53, valB=27, bitIdx=BITS-1;

  function reset(){ bitIdx=BITS-1; render(); }

  buildLeftPanel(`
    <div class="panel-section">
      <div class="panel-section-title">Operands</div>
      ${makeSlider('bsg_a','Value A',0,127,53,1,'',v=>{ valA=v; render(); })}
      ${makeSlider('bsg_b','Value B',0,127,27,1,'',v=>{ valB=v; render(); })}
    </div>
    <div class="panel-section">
      <div class="panel-section-title">Bit Position</div>
      <button class="ctrl-btn primary" data-action="bsg_prev">◀ Prev Bit</button>
      <button class="ctrl-btn" data-action="bsg_next">▶ Next Bit</button>
      <button class="ctrl-btn" data-action="bsg_auto">⚡ Auto All</button>
    </div>`);
  buildRightPanel(csRightPanel(
    `<span class="cs-cm">// Add/Sub circuit</span>\n<span class="cs-cm">// Sub=1 → subtract</span>\nBinv = B ^ Sub;\n<span class="cs-cm">// Cin0 = Sub (adds 1)</span>\nS = A ^ Binv ^ Cin;\nCout=(A&Binv)|\n  (Cin&(A^Binv));`,
    'O(n)', 'O(n)', 'XOR gates invert B when Sub=1. Cin0=1 completes the 2s complement.'
  ));

  LAB['bsg_prev']=()=>{ if(bitIdx<BITS-1)bitIdx++; render(); csSetStep(`Bit ${bitIdx}`); };
  LAB['bsg_next']=()=>{ if(bitIdx>0)bitIdx--; render(); csSetStep(`Bit ${bitIdx}`); };
  LAB['bsg_auto']=()=>{
    bitIdx=BITS-1;
    function go(){ render(); csSetStep(`Bit ${bitIdx}`); if(bitIdx>0){bitIdx--;setTimeout(go,800);} else csSetStep('✅ Done!'); }
    go();
  };

  function getSubBit(a,b,bit){
    // A-B via 2s comp: compute carry chain
    const mask=(1<<BITS)-1;
    const twosB=((~b)&mask)+1;
    let cin=1; // because Sub=1 feeds Cin of LSB
    const binv=(~b)&mask;
    for(let i=BITS-1;i>bit;i--){
      const bA=(a>>i)&1, bBinv=(binv>>i)&1;
      const s=bA+bBinv+cin; cin=s>>1;
    }
    const bA=(a>>bit)&1, bBinv=(binv>>bit)&1;
    const s=bA+bBinv+cin;
    return{bA,bBinv,cin,sum:s&1,cout:s>>1,xor1:bA^bBinv};
  }

  function render(){
    clearCanvas(); drawGrid(0.04);
    const{bA,bBinv,cin,sum,cout,xor1}=getSubBit(valA,valB,bitIdx);
    const bBorig=(valB>>bitIdx)&1;
    const and1=bA&bBinv, and2=xor1&cin;
    const result=valA-valB;

    ctx.save(); ctx.font='bold 14px "Nunito",sans-serif'; ctx.fillStyle='#fca5a5'; ctx.textAlign='center';
    ctx.fillText(`Subtractor — Bit ${bitIdx}   A=${bA}  B=${bBorig}  Sub=1  B̄=${bBinv}  Cin=${cin}`, W/2, 28); ctx.restore();

    // Show B → XOR(Sub) → B̄ inverter first
    baLabel(30, 130, `B=${bBorig}`, bBorig?'#00ffa3':'#5555aa', 'left');
    baLabel(30, 162, `Sub=1`, '#f87171', 'left');
    baWire(75,130, 100,130, bBorig);
    baWire(75,162, 100,154, 1);
    drawGate(140,146,'XOR',[bBorig,1],bBinv);
    baLabel(196,146,`B̄=${bBinv}`, bBinv?'#00ffa3':'#5555aa','left');

    // Now the full adder portion (same as addition but with B̄)
    const GY_TOP=220, GY_BOT=370;
    const GX=[200,370,270,380,530];

    baLabel(38,GY_TOP-10,`A=${bA}`, bA?'#00ffa3':'#5555aa','left');
    baLabel(38,GY_TOP+10,`B̄=${bBinv}`, bBinv?'#00ffa3':'#5555aa','left');
    baLabel(38,GY_BOT,   `Cin=${cin}`, cin?'#fbbf24':'#5555aa','left');

    baWire(80,GY_TOP-10, GX[0]-25,GY_TOP-9, bA);
    baWire(80,GY_TOP+10, GX[0]-25,GY_TOP+9, bBinv);
    baWire(80,GY_TOP-10, GX[2]-25,GY_BOT-9, bA);
    baWire(80,GY_TOP+10, GX[2]-25,GY_BOT+9, bBinv);
    baWire(GX[0]+25,GY_TOP, GX[1]-25,GY_TOP-9, xor1);
    baWire(GX[0]+25,GY_TOP, GX[3]-25,GY_BOT-9, xor1);
    baWire(80,GY_BOT, GX[1]-25,GY_TOP+9, cin);
    baWire(80,GY_BOT, GX[3]-25,GY_BOT+9, cin);
    baWire(GX[2]+25,GY_BOT, GX[4]-25,GY_BOT-9, and1);
    baWire(GX[3]+25,GY_BOT, GX[4]-25,GY_BOT+9, and2);

    drawGate(GX[0],GY_TOP,'XOR',[bA,bBinv],xor1);
    drawGate(GX[1],GY_TOP,'XOR',[xor1,cin],sum);
    drawGate(GX[2],GY_BOT,'AND',[bA,bBinv],and1);
    drawGate(GX[3],GY_BOT,'AND',[xor1,cin],and2);
    drawGate(GX[4],GY_BOT,'OR',[and1,and2],cout);

    baLabel(GX[1]+58,GY_TOP,`SUM=${sum}`,sum?'#00ffa3':'#5555aa','left');
    baLabel(GX[4]+58,GY_BOT,`COUT=${cout}`,cout?'#fbbf24':'#5555aa','left');

    ctx.save(); ctx.font='10px "Space Mono",monospace'; ctx.fillStyle='var(--text3)'; ctx.textAlign='center';
    ctx.fillText(`${valA} − ${valB} = ${result}   |   XOR bank inverts B, Cin0=Sub=1 completes 2s complement`, W/2, H-14);
    ctx.restore();
  }
  reset();
  csSetStep('Add/Sub gate circuit. Sub=1 inverts B via XOR bank and sets Cin0=1.');
}

// ══════════════════════════════════════════════════════════════════
//  3A. BOOTH'S MULTIPLICATION — TABULAR METHOD
// ══════════════════════════════════════════════════════════════════
function runBinaryMultiplication() {
  const W=700, H=500, BITS=5;
  let M=5, Q=6, stepIdx=-1, boothSteps=[];

  function runBooth(m,q,n){
    const mask=(1<<n)-1;
    let A=0, Qr=q&mask, Q1=0;
    const rows=[];
    rows.push({step:0,A:0,Q:Qr,Q1,op:'Initial',q0:Qr&1,desc:`Start: A=0`});
    for(let i=0;i<n;i++){
      const q0=Qr&1;
      let op='Shift only';
      if(q0===1&&Q1===0){ A=(A-m); op='A = A − M'; }
      else if(q0===0&&Q1===1){ A=(A+m); op='A = A + M'; }
      // Arith right shift [A,Q,Q1]
      const newQ1=Qr&1;
      const newQr=((Qr>>1)|((A&1)<<(n-1)))&mask;
      const signA=(A>>(n-1))&1;
      A=((A>>1)|(signA<<(n-1)));
      Q1=newQ1; Qr=newQr&mask;
      rows.push({step:i+1,A:A&mask,Q:Qr,Q1,op,q0,desc:`→ Shift [A,Q,Q-1]`});
    }
    rows.push({step:n+1,A:A&mask,Q:Qr,Q1,op:'Done',done:true,product:m*q,desc:`Product=[A|Q]=${m*q}`});
    return rows;
  }

  function reset(){ boothSteps=runBooth(M,Q,BITS); stepIdx=-1; render(); csSetStep(`${M}×${Q}=${M*Q}. Press ▶ Next Step.`); }

  buildLeftPanel(`
    <div class="panel-section">
      <div class="panel-section-title">Operands</div>
      ${makeSlider('bmt_m','M (Multiplicand)',-15,15,5,1,'',v=>{ M=v; reset(); })}
      ${makeSlider('bmt_q','Q (Multiplier)',-15,15,6,1,'',v=>{ Q=v; reset(); })}
    </div>
    <div class="panel-section">
      <div class="panel-section-title">Animate</div>
      <button class="ctrl-btn primary" data-action="bmt_step">▶ Next Step</button>
      <button class="ctrl-btn" data-action="bmt_auto">⚡ Auto</button>
      <button class="ctrl-btn" data-action="bmt_reset">↺ Reset</button>
    </div>`);
  buildRightPanel(csRightPanel(
    `<span class="cs-cm">// Booth's: n steps</span>\n<span class="cs-kw">for</span>(i=0;i&lt;n;i++){\n  <span class="cs-kw">if</span>(Q0==1&&Q1==0) A-=M;\n  <span class="cs-kw">else if</span>(Q0==0&&Q1==1) A+=M;\n  arith_right_shift(A,Q,Q1);\n}\n<span class="cs-cm">// product=[A|Q]</span>`,
    'O(n)', 'O(n)', 'All rows shown at once. Active row highlighted. Q0,Q-1 pair determines each operation.'
  ));

  LAB['bmt_step']=()=>{
    if(stepIdx<boothSteps.length-1) stepIdx++;
    const s=boothSteps[stepIdx];
    csSetStep(`Step ${s.step}: ${s.op} — ${s.desc}`); render();
  };
  LAB['bmt_auto']=()=>{
    stepIdx=-1; render();
    function go(){ if(stepIdx>=boothSteps.length-1)return; stepIdx++; render(); csSetStep(boothSteps[stepIdx].op); if(!boothSteps[stepIdx].done)setTimeout(go,700); }
    go();
  };
  LAB['bmt_reset']=reset;

  function render(){
    clearCanvas(); drawGrid(0.04);
    const mask=(1<<BITS)-1;

    ctx.save(); ctx.font='bold 14px "Nunito",sans-serif'; ctx.fillStyle='#fbbf24'; ctx.textAlign='center';
    ctx.fillText(`Booth's: ${M} × ${Q} = ${M*Q}   |   M=${padBin(M&mask,BITS)}  Q=${padBin(Q&mask,BITS)}`, W/2,28); ctx.restore();
    ctx.save(); ctx.font='10px "Space Mono",monospace'; ctx.fillStyle='var(--text3)'; ctx.textAlign='left';
    ctx.fillText('Q0,Q-1: 01→Add M   10→Sub M   00/11→Shift only', 40, 50); ctx.restore();

    const ox=20,oy=62,rh=32;
    const cols=['Step','Q0,Q-1','Operation','A (Accum)','Q (Mult)','Q-1'];
    const cws=[44,60,152,120,120,44];
    let hx=ox;
    cols.forEach((c,ci)=>{
      baHighlight(hx,oy,cws[ci]-2,rh-2,'rgba(251,191,36,0.15)');
      ctx.save(); ctx.font='bold 10px "Space Mono",monospace'; ctx.fillStyle='#fbbf24';
      ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(c, hx+cws[ci]/2-1, oy+rh/2-1); hx+=cws[ci]; ctx.restore();
    });

    // ALL rows always drawn
    boothSteps.forEach((s,ri)=>{
      const ry=oy+(ri+1)*rh;
      const isActive=ri===stepIdx;
      const isDone=stepIdx>=0&&ri<stepIdx;

      if(isActive) baHighlight(ox,ry,cws.reduce((a,b)=>a+b)-2,rh-2,'rgba(251,191,36,0.22)');
      else if(isDone) baHighlight(ox,ry,cws.reduce((a,b)=>a+b)-2,rh-2,'rgba(251,191,36,0.06)');

      const q0=(ri===0)?s.Q&1:boothSteps[ri-1].Q&1;
      const q1=(ri===0)?0:boothSteps[ri-1].Q1;
      const vals=[
        ri===0?'Init':String(s.step),
        ri===0?'—':`${q0},${q1}`,
        s.op,
        padBin(s.A,BITS),
        padBin(s.Q,BITS),
        String(s.Q1)
      ];
      let cx2=ox;
      vals.forEach((v,ci)=>{
        ctx.save(); ctx.font=(isActive?'bold ':'')+`10px "Space Mono",monospace`;
        let col=isActive?'#fbbf24':isDone?'#d4a017':'var(--text2)';
        if(ci===2){
          if(v.includes('Add'))col='#34d399';
          else if(v.includes('Sub'))col='#f87171';
          else if(v==='Done')col='#00ffa3';
        }
        ctx.fillStyle=col; ctx.textAlign='center'; ctx.textBaseline='middle';
        ctx.fillText(v, cx2+cws[ci]/2-1, ry+rh/2-1); cx2+=cws[ci]; ctx.restore();
      });
      if(s.done&&ri===stepIdx){
        ctx.save(); ctx.font='bold 12px "Nunito",sans-serif'; ctx.fillStyle='#00ffa3'; ctx.textAlign='center';
        ctx.fillText(`✅  Product = ${s.product}  =  ${padBin(s.A,BITS)}${padBin(s.Q,BITS)}`, W/2, oy+(boothSteps.length+2)*rh);
        ctx.restore();
      }
    });
  }
  reset();
}

// ══════════════════════════════════════════════════════════════════
//  3B. BOOTH'S MULTIPLICATION — LOGIC GATES / DATAPATH
// ══════════════════════════════════════════════════════════════════
function runBinaryMultiplicationGates() {
  const W=700, H=500, BITS=5;
  let M=5, Q=6, stepIdx=0, boothSteps=[];

  function runBooth(m,q,n){
    const mask=(1<<n)-1;
    let A=0,Qr=q&mask,Q1=0;
    const rows=[];
    rows.push({step:0,A:0,Q:Qr,Q1,op:'Initial',addSub:0,doAdd:false,doSub:false});
    for(let i=0;i<n;i++){
      const q0=Qr&1;
      let doAdd=false,doSub=false;
      if(q0===1&&Q1===0){A=(A-m);doSub=true;}
      else if(q0===0&&Q1===1){A=(A+m);doAdd=true;}
      const newQ1=Qr&1;
      const newQr=((Qr>>1)|((A&1)<<(n-1)))&mask;
      const signA=(A>>(n-1))&1;
      A=((A>>1)|(signA<<(n-1)));
      Q1=newQ1; Qr=newQr&mask;
      rows.push({step:i+1,A:A&mask,Q:Qr,Q1,op:doSub?'Sub M':doAdd?'Add M':'Shift',doAdd,doSub});
    }
    rows.push({step:n+1,A:A&mask,Q:Qr,Q1,op:'Done',done:true,product:m*q});
    return rows;
  }

  function reset(){ boothSteps=runBooth(M,Q,BITS); stepIdx=0; render(); }

  buildLeftPanel(`
    <div class="panel-section">
      <div class="panel-section-title">Operands</div>
      ${makeSlider('bmg_m','M',-15,15,5,1,'',v=>{ M=v; reset(); })}
      ${makeSlider('bmg_q','Q',-15,15,6,1,'',v=>{ Q=v; reset(); })}
    </div>
    <div class="panel-section">
      <div class="panel-section-title">Cycle</div>
      <button class="ctrl-btn primary" data-action="bmg_prev">◀ Prev</button>
      <button class="ctrl-btn" data-action="bmg_next">▶ Next</button>
      <button class="ctrl-btn" data-action="bmg_auto">⚡ Auto</button>
    </div>`);
  buildRightPanel(csRightPanel(
    `<span class="cs-cm">// Hardware datapath</span>\n<span class="cs-cm">// Registers: A, Q, Q-1</span>\n<span class="cs-cm">// Adder/subtractor on A</span>\n<span class="cs-cm">// Comparator: Q0,Q-1</span>\n<span class="cs-cm">// Shift: arith right</span>\n<span class="cs-cm">// [A | Q | Q-1] >> 1</span>`,
    'O(n) cycles', 'O(n)', 'Gate-level datapath view. Shows register states, adder/sub signal, and shift direction.'
  ));

  LAB['bmg_prev']=()=>{ if(stepIdx>0)stepIdx--; render(); csSetStep(`Cycle ${stepIdx}`); };
  LAB['bmg_next']=()=>{ if(stepIdx<boothSteps.length-1)stepIdx++; render(); csSetStep(boothSteps[stepIdx].op); };
  LAB['bmg_auto']=()=>{
    stepIdx=0; render();
    function go(){ render(); csSetStep(boothSteps[stepIdx].op); if(stepIdx<boothSteps.length-1){stepIdx++;setTimeout(go,750);} }
    go();
  };

  function render(){
    clearCanvas(); drawGrid(0.04);
    const s=boothSteps[Math.min(stepIdx,boothSteps.length-1)];
    const prev=boothSteps[Math.max(stepIdx-1,0)];
    const mask=(1<<BITS)-1;

    ctx.save(); ctx.font='bold 14px "Nunito",sans-serif'; ctx.fillStyle='#fde68a'; ctx.textAlign='center';
    ctx.fillText(`Booth Datapath — Cycle ${s.step} / ${BITS}   |   ${M}×${Q}=${M*Q}`, W/2,28); ctx.restore();

    // ── Register display boxes ──
    function drawReg(label,val,bits,rx,ry,rw,rh,color){
      ctx.save();
      baHighlight(rx,ry,rw,rh,`rgba(${hexToRgb(color)},0.12)`);
      ctx.strokeStyle=color; ctx.lineWidth=1.5;
      ctx.beginPath(); ctx.roundRect(rx,ry,rw,rh,6); ctx.stroke();
      ctx.font='bold 10px "Space Mono",monospace'; ctx.fillStyle=color;
      ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(label, rx+rw/2, ry-10);
      const bw=rw/bits;
      const binStr=padBin(val,bits);
      for(let b=0;b<bits;b++){
        const bit=binStr[b]==='1';
        if(bit){baHighlight(rx+b*bw+1,ry+2,bw-2,rh-4,`rgba(${hexToRgb(color)},0.3)`);}
        ctx.fillStyle=bit?color:'var(--text3)'; ctx.font='bold 12px "Space Mono",monospace';
        ctx.textAlign='center'; ctx.textBaseline='middle';
        ctx.fillText(binStr[b],rx+b*bw+bw/2,ry+rh/2);
      }
      ctx.restore();
    }

    // Registers: A | Q | Q-1
    drawReg('A (Accumulator)', s.A, BITS, 60,  70, 160, 44, '#fbbf24');
    drawReg('Q (Multiplier)',   s.Q, BITS, 260, 70, 160, 44, '#a78bfa');
    drawReg('Q-1',              s.Q1,1,   460, 70, 44,  44, '#f87171');

    // M register
    drawReg('M (Multiplicand)',M&mask,BITS,560,70,130,44,'#34d399');

    // Adder / Subtractor block
    const addActive=s.doAdd, subActive=s.doSub;
    const addSubColor=addActive?'#34d399':subActive?'#f87171':'#5050a0';
    const addSubLabel=addActive?'A = A+M':subActive?'A = A−M':'No-op';
    baHighlight(180,160,200,50, addActive?'rgba(52,211,153,0.15)':subActive?'rgba(248,113,113,0.15)':'rgba(80,80,160,0.1)');
    ctx.save(); ctx.strokeStyle=addSubColor; ctx.lineWidth=1.5;
    ctx.beginPath(); ctx.roundRect(180,160,200,50,8); ctx.stroke();
    ctx.font='bold 12px "Nunito",sans-serif'; ctx.fillStyle=addSubColor;
    ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(addSubLabel, 280, 185); ctx.restore();

    // Comparator block (Q0, Q-1)
    const q0=prev.Q&1, q1_=prev.Q1;
    const cmpResult=q0===0&&q1_===1?'ADD':q0===1&&q1_===0?'SUB':'SHIFT';
    const cmpCol=cmpResult==='ADD'?'#34d399':cmpResult==='SUB'?'#f87171':'#5050a0';
    baHighlight(450,160,200,50,'rgba(80,80,160,0.1)');
    ctx.save(); ctx.strokeStyle='#a78bfa'; ctx.lineWidth=1.5;
    ctx.beginPath(); ctx.roundRect(450,160,200,50,8); ctx.stroke();
    ctx.font='bold 10px "Space Mono",monospace'; ctx.fillStyle='#a78bfa';
    ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(`Q0=${q0}  Q-1=${q1_}  →`, 520, 178);
    ctx.fillStyle=cmpCol; ctx.font='bold 13px "Nunito",sans-serif';
    ctx.fillText(cmpResult, 564, 196); ctx.restore();

    // Shift register visual
    baHighlight(60,250,480,60,'rgba(255,255,255,0.04)');
    ctx.save(); ctx.strokeStyle='#5050a0'; ctx.lineWidth=1;
    ctx.beginPath(); ctx.roundRect(60,250,480,60,8); ctx.stroke();
    ctx.font='bold 10px "Space Mono",monospace'; ctx.fillStyle='var(--text3)';
    ctx.textAlign='left'; ctx.textBaseline='top'; ctx.fillText('Arithmetic Right Shift  [A | Q | Q-1] → → →', 70, 257); ctx.restore();

    const shiftBits=padBin(s.A,BITS)+padBin(s.Q,BITS)+String(s.Q1);
    for(let b=0;b<BITS*2+1;b++){
      const bx=68+b*22, by2=272;
      const bit=shiftBits[b]==='1';
      if(bit)baHighlight(bx,by2,18,28,'rgba(251,191,36,0.2)');
      ctx.save(); ctx.font='bold 12px "Space Mono",monospace';
      ctx.fillStyle=bit?'#fbbf24':'var(--text3)';
      ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(shiftBits[b],bx+9,by2+14); ctx.restore();
    }
    // Shift arrow
    ctx.save(); ctx.strokeStyle='rgba(251,191,36,0.4)'; ctx.lineWidth=2;
    ctx.beginPath(); ctx.moveTo(56,280); ctx.lineTo(68,280); ctx.stroke(); ctx.restore();

    // Step info
    ctx.save(); ctx.font='12px "Nunito",sans-serif'; ctx.fillStyle='var(--text2)'; ctx.textAlign='center';
    ctx.fillText(`Cycle ${s.step}: ${s.op}  |  ${s.done?'Product='+s.product:'A='+s.A+' Q='+s.Q+' Q-1='+s.Q1}`, W/2, H-20);
    ctx.restore();
  }
  reset();
  csSetStep('Gate-level datapath. Watch A, Q, Q-1 registers and adder/sub signal each cycle.');
}

// ══════════════════════════════════════════════════════════════════
//  4A. BINARY DIVISION — TABULAR METHOD
// ══════════════════════════════════════════════════════════════════
function runBinaryDivision() {
  const W=700, H=500, BITS=5;
  let DIVIDEND=26, DIVISOR=5, stepIdx=-1, divSteps=[];

  function restoring(dividend,divisor,n){
    const mask=(1<<n)-1;
    let A=0, Q=dividend&mask;
    const rows=[];
    rows.push({step:0,A:0,Q,op:'Initial',qbit:'-',restore:false});
    for(let i=0;i<n;i++){
      const shiftedA=((A<<1)|((Q>>(n-1))&1))&mask;
      const shiftedQ=(Q<<1)&mask;
      A=shiftedA; Q=shiftedQ;
      const Asub=(A-divisor);
      let qbit,restore=false,op;
      if(A>=divisor){ A=Asub&mask; qbit=1; op=`Shift→A=${shiftedA},Sub→A=${A&mask},Q0=1`; }
      else { restore=true; qbit=0; op=`Shift→A=${shiftedA},Sub<0 restore,Q0=0`; }
      Q=(Q|qbit)&mask;
      rows.push({step:i+1,A:A&mask,Q,op,qbit,restore});
    }
    rows.push({step:n+1,A:A&mask,Q,op:'Done',qbit:'-',done:true,quotient:Q,remainder:A&mask});
    return rows;
  }

  function reset(){ divSteps=restoring(DIVIDEND,DIVISOR,BITS); stepIdx=-1; render(); csSetStep(`${DIVIDEND}÷${DIVISOR}=${Math.floor(DIVIDEND/DIVISOR)} R${DIVIDEND%DIVISOR}. Press ▶.`); }

  buildLeftPanel(`
    <div class="panel-section">
      <div class="panel-section-title">Operands</div>
      ${makeSlider('bdt_d','Dividend',1,31,26,1,'',v=>{ DIVIDEND=v; reset(); })}
      ${makeSlider('bdt_v','Divisor',1,15,5,1,'',v=>{ DIVISOR=v; reset(); })}
    </div>
    <div class="panel-section">
      <div class="panel-section-title">Animate</div>
      <button class="ctrl-btn primary" data-action="bdt_step">▶ Next Step</button>
      <button class="ctrl-btn" data-action="bdt_auto">⚡ Auto</button>
      <button class="ctrl-btn" data-action="bdt_reset">↺ Reset</button>
    </div>`);
  buildRightPanel(csRightPanel(
    `<span class="cs-cm">// Restoring Division</span>\n<span class="cs-kw">for</span>(i=0;i&lt;n;i++){\n  left_shift(A,Q);\n  A=A-M;\n  <span class="cs-kw">if</span>(A&lt;0){\n    A+=M; <span class="cs-cm">//restore</span>\n    Q[0]=0;\n  }<span class="cs-kw">else</span> Q[0]=1;\n}\n<span class="cs-cm">// Q=quot, A=rem</span>`,
    'O(n)', 'O(n)', 'All rows shown at all times. Highlighted row = current step.'
  ));

  LAB['bdt_step']=()=>{
    if(stepIdx<divSteps.length-1) stepIdx++;
    const s=divSteps[stepIdx]; csSetStep(`Step ${s.step}: ${s.op}`); render();
  };
  LAB['bdt_auto']=()=>{
    stepIdx=-1; render();
    function go(){ if(stepIdx>=divSteps.length-1)return; stepIdx++; render(); csSetStep(divSteps[stepIdx].op); if(!divSteps[stepIdx].done)setTimeout(go,700); }
    go();
  };
  LAB['bdt_reset']=reset;

  function render(){
    clearCanvas(); drawGrid(0.04);
    ctx.save(); ctx.font='bold 14px "Nunito",sans-serif'; ctx.fillStyle='#a78bfa'; ctx.textAlign='center';
    ctx.fillText(`Restoring Division: ${DIVIDEND} ÷ ${DIVISOR} = ${Math.floor(DIVIDEND/DIVISOR)} remainder ${DIVIDEND%DIVISOR}`, W/2,28); ctx.restore();
    ctx.save(); ctx.font='10px "Space Mono",monospace'; ctx.fillStyle='var(--text3)'; ctx.textAlign='left';
    ctx.fillText('Each step: left-shift [A,Q] → A−M → if A<0: restore A, Q0=0; else Q0=1', 30, 50); ctx.restore();

    const ox=20,oy=62,rh=32;
    const cols=['Step','A (Partial Rem)','Q (Quotient)','Q0','Restore?','Operation'];
    const cws=[40,130,110,40,60,310];
    let hx=ox;
    cols.forEach((c,ci)=>{
      baHighlight(hx,oy,cws[ci]-2,rh-2,'rgba(167,139,250,0.15)');
      ctx.save(); ctx.font='bold 9px "Space Mono",monospace'; ctx.fillStyle='#a78bfa';
      ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(c, hx+cws[ci]/2-1, oy+rh/2-1); hx+=cws[ci]; ctx.restore();
    });

    divSteps.forEach((s,ri)=>{
      const ry=oy+(ri+1)*rh;
      const isActive=ri===stepIdx, isDone=stepIdx>=0&&ri<stepIdx;
      if(isActive) baHighlight(ox,ry,cws.reduce((a,b)=>a+b)-2,rh-2,'rgba(167,139,250,0.22)');
      else if(isDone) baHighlight(ox,ry,cws.reduce((a,b)=>a+b)-2,rh-2,'rgba(167,139,250,0.06)');

      const vals=[
        ri===0?'Init':String(s.step),
        padBin(s.A,BITS),
        padBin(s.Q,BITS),
        String(s.qbit),
        s.restore?'Yes':'No',
        s.op.length>42?s.op.slice(0,42)+'…':s.op
      ];
      let cx2=ox;
      vals.forEach((v,ci)=>{
        ctx.save(); ctx.font=(isActive?'bold ':'')+`9px "Space Mono",monospace`;
        let col=isActive?'#a78bfa':isDone?'#8b6fd4':'var(--text2)';
        if(ci===3) col=v==='1'?'#34d399':v==='0'?'#f87171':'var(--text3)';
        if(ci===4) col=v==='Yes'?'#fbbf24':'var(--text3)';
        ctx.fillStyle=col; ctx.textAlign='center'; ctx.textBaseline='middle';
        ctx.fillText(v, cx2+cws[ci]/2-1, ry+rh/2-1); cx2+=cws[ci]; ctx.restore();
      });

      if(s.done&&ri===stepIdx){
        ctx.save(); ctx.font='bold 13px "Nunito",sans-serif'; ctx.fillStyle='#00ffa3'; ctx.textAlign='center';
        ctx.fillText(`✅  Quotient=${s.quotient}  Remainder=${s.remainder}   (${DIVIDEND}÷${DIVISOR}=${Math.floor(DIVIDEND/DIVISOR)} R${DIVIDEND%DIVISOR})`, W/2, oy+(divSteps.length+2)*rh);
        ctx.restore();
      }
    });
  }
  reset();
}

// ══════════════════════════════════════════════════════════════════
//  4B. BINARY DIVISION — LOGIC GATES / DATAPATH
// ══════════════════════════════════════════════════════════════════
function runBinaryDivisionGates() {
  const W=700, H=500, BITS=5;
  let DIVIDEND=26, DIVISOR=5, stepIdx=0, divSteps=[];

  function restoring(dividend,divisor,n){
    const mask=(1<<n)-1;
    let A=0,Q=dividend&mask;
    const rows=[];
    rows.push({step:0,A:0,Q,op:'Initial',qbit:'-',restore:false,preA:0,postSub:0});
    for(let i=0;i<n;i++){
      const preA=((A<<1)|((Q>>(n-1))&1))&mask;
      Q=(Q<<1)&mask; A=preA;
      const postSub=A-divisor;
      let qbit,restore=false;
      if(A>=divisor){ A=postSub&mask; qbit=1; restore=false; }
      else { qbit=0; restore=true; }
      Q=(Q|qbit)&mask;
      rows.push({step:i+1,A:A&mask,Q,op:restore?'Restore':'Keep',qbit,restore,preA,postSub:postSub&mask,shifted:true});
    }
    rows.push({step:n+1,A:A&mask,Q,op:'Done',done:true,quotient:Q,remainder:A&mask,qbit:'-',restore:false,preA:0,postSub:0});
    return rows;
  }

  function reset(){ divSteps=restoring(DIVIDEND,DIVISOR,BITS); stepIdx=0; render(); }

  buildLeftPanel(`
    <div class="panel-section">
      <div class="panel-section-title">Operands</div>
      ${makeSlider('bdg_d','Dividend',1,31,26,1,'',v=>{ DIVIDEND=v; reset(); })}
      ${makeSlider('bdg_v','Divisor',1,15,5,1,'',v=>{ DIVISOR=v; reset(); })}
    </div>
    <div class="panel-section">
      <div class="panel-section-title">Cycle</div>
      <button class="ctrl-btn primary" data-action="bdg_prev">◀ Prev</button>
      <button class="ctrl-btn" data-action="bdg_next">▶ Next</button>
      <button class="ctrl-btn" data-action="bdg_auto">⚡ Auto</button>
    </div>`);
  buildRightPanel(csRightPanel(
    `<span class="cs-cm">// Divider datapath</span>\n<span class="cs-cm">// Shift reg: [A|Q]</span>\n<span class="cs-cm">// Subtractor: A−M</span>\n<span class="cs-cm">// Sign detector: MSB</span>\n<span class="cs-cm">// MUX: restore or keep</span>\n<span class="cs-cm">// Q[0] ← quotient bit</span>`,
    'O(n) cycles','O(n)','Datapath: shift register, subtractor, sign detector, MUX for restore.'
  ));

  LAB['bdg_prev']=()=>{ if(stepIdx>0)stepIdx--; render(); csSetStep(`Cycle ${stepIdx}`); };
  LAB['bdg_next']=()=>{ if(stepIdx<divSteps.length-1)stepIdx++; render(); csSetStep(divSteps[stepIdx].op); };
  LAB['bdg_auto']=()=>{
    stepIdx=0; render();
    function go(){ render(); csSetStep(divSteps[stepIdx].op); if(stepIdx<divSteps.length-1){stepIdx++;setTimeout(go,800);} }
    go();
  };

  function drawRegBox(label,val,bits,rx,ry,rw,rh,color){
    baHighlight(rx,ry,rw,rh,`rgba(${hexToRgb(color)},0.1)`);
    ctx.save(); ctx.strokeStyle=color; ctx.lineWidth=1.5;
    ctx.beginPath(); ctx.roundRect(rx,ry,rw,rh,6); ctx.stroke();
    ctx.font='bold 9px "Space Mono",monospace'; ctx.fillStyle=color;
    ctx.textAlign='center'; ctx.textBaseline='bottom'; ctx.fillText(label,rx+rw/2,ry-3);
    const bw=rw/bits, binStr=padBin(val,bits);
    for(let b=0;b<bits;b++){
      const bit=binStr[b]==='1';
      if(bit)baHighlight(rx+b*bw+1,ry+3,bw-2,rh-6,`rgba(${hexToRgb(color)},0.28)`);
      ctx.fillStyle=bit?color:'var(--text3)'; ctx.font='bold 12px "Space Mono",monospace';
      ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(binStr[b],rx+b*bw+bw/2,ry+rh/2);
    }
    ctx.restore();
  }

  function render(){
    clearCanvas(); drawGrid(0.04);
    const s=divSteps[Math.min(stepIdx,divSteps.length-1)];
    ctx.save(); ctx.font='bold 14px "Nunito",sans-serif'; ctx.fillStyle='#c4b5fd'; ctx.textAlign='center';
    ctx.fillText(`Division Datapath — Cycle ${s.step} / ${BITS}   |   ${DIVIDEND}÷${DIVISOR}=${Math.floor(DIVIDEND/DIVISOR)} R${DIVIDEND%DIVISOR}`, W/2,28); ctx.restore();

    // Register boxes
    drawRegBox('A (Partial Rem)', s.A, BITS, 30, 65, 155, 42, '#a78bfa');
    drawRegBox('Q (Quotient)',    s.Q, BITS, 210,65, 155, 42, '#c4b5fd');
    drawRegBox('M (Divisor)',  DIVISOR,BITS, 490,65, 155, 42, '#34d399');

    // Subtractor block
    const subOut=s.preA-DIVISOR;
    const subNeg=subOut<0;
    const subColor=subNeg?'#f87171':'#34d399';
    baHighlight(200,145,200,52, subNeg?'rgba(248,113,113,0.1)':'rgba(52,211,153,0.1)');
    ctx.save(); ctx.strokeStyle=subColor; ctx.lineWidth=1.5;
    ctx.beginPath(); ctx.roundRect(200,145,200,52,8); ctx.stroke();
    ctx.font='bold 11px "Nunito",sans-serif'; ctx.fillStyle=subColor; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(`Subtractor: A − M = ${s.preA} − ${DIVISOR} = ${subOut}`, 300,171); ctx.restore();

    // Sign detector
    const signColor=subNeg?'#f87171':'#34d399';
    baHighlight(220,225,160,42,'rgba(80,80,160,0.1)');
    ctx.save(); ctx.strokeStyle='#a78bfa'; ctx.lineWidth=1.3;
    ctx.beginPath(); ctx.roundRect(220,225,160,42,8); ctx.stroke();
    ctx.font='bold 11px "Nunito",sans-serif'; ctx.fillStyle=signColor; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(subNeg?'Sign=1 (neg) → Restore':'Sign=0 (pos) → Keep', 300,246); ctx.restore();

    // MUX block
    const muxColor=s.restore?'#fbbf24':'#34d399';
    baHighlight(220,295,160,42, s.restore?'rgba(251,191,36,0.12)':'rgba(52,211,153,0.12)');
    ctx.save(); ctx.strokeStyle=muxColor; ctx.lineWidth=1.5;
    ctx.beginPath(); ctx.roundRect(220,295,160,42,8); ctx.stroke();
    ctx.font='bold 12px "Nunito",sans-serif'; ctx.fillStyle=muxColor; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(s.restore?'MUX → Restore A':'MUX → Keep A−M', 300,316); ctx.restore();

    // Q0 output
    const q0color=s.qbit===1?'#34d399':s.qbit===0?'#f87171':'var(--text3)';
    baHighlight(220,365,160,36,'rgba(80,80,160,0.08)');
    ctx.save(); ctx.strokeStyle=q0color; ctx.lineWidth=1.3;
    ctx.beginPath(); ctx.roundRect(220,365,160,36,8); ctx.stroke();
    ctx.font='bold 12px "Space Mono",monospace'; ctx.fillStyle=q0color; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(`Q[0] ← ${s.qbit}`, 300,383); ctx.restore();

    // Wires
    baWire(300,107,300,145, true); // A → subtractor
    baWire(490,86,410,162, true);  // M → subtractor
    baWire(300,197,300,225, subNeg);
    baWire(300,267,300,295, subNeg);
    baWire(300,337,300,365, true);

    // Shift arrows
    ctx.save(); ctx.fillStyle='rgba(167,139,250,0.4)'; ctx.font='11px "Nunito",sans-serif';
    ctx.textAlign='center'; ctx.fillText('◀ Left Shift [A|Q] each cycle', W/2, H-20); ctx.restore();

    if(s.done){
      ctx.save(); ctx.font='bold 13px "Nunito",sans-serif'; ctx.fillStyle='#00ffa3'; ctx.textAlign='center';
      ctx.fillText(`✅  Quotient=${s.quotient}   Remainder=${s.remainder}`, W/2, H-36); ctx.restore();
    }
  }
  reset();
  csSetStep('Datapath view: watch the subtractor, sign detector, and MUX each cycle.');
}

