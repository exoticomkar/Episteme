// ══════════════════════════════════════════════════════
//  VIEW TRANSITION ENGINE  (instant — no ripple animation)
// ══════════════════════════════════════════════════════
const rippleEl = document.getElementById('view-ripple');
let ripplePending = null;

function viewTransition(originX, originY, enterFn, exitFn) {
  // Instant swap — no circle/ripple animation
  if (exitFn) exitFn();
  enterFn();
  window.scrollTo({ top: 0, behavior: 'instant' });
}

// Track last click position (kept for API compatibility)
let lastClickX = window.innerWidth  / 2;
let lastClickY = window.innerHeight / 2;
document.addEventListener('click', e => { lastClickX = e.clientX; lastClickY = e.clientY; }, true);

// ══════════════════════════════════════════════════════
//  CODE LINE HIGHLIGHT ENGINE
// ══════════════════════════════════════════════════════

// Wraps raw code HTML (with syntax spans but no line wrappers) into
// per-line <span data-line="N"> elements for live step highlighting.
function wrapCodeLines(codeHtml) {
  // Split on newlines while preserving the spans
  const lines = codeHtml.split('\n');
  return lines.map((l, i) =>
    `<span class="cs-code-line" data-line="${i + 1}">${l}</span>`
  ).join('\n');
}

// Call from step engine to highlight a line number.
// Pass null/0 to clear all highlights.
let _lastHLLine = null;
function csHL(lineNum) {
  if (lineNum === _lastHLLine) return;
  _lastHLLine = lineNum;
  const block = document.querySelector('.cs-code-block');
  if (!block) return;
  // Remove old active + pulse
  block.querySelectorAll('.cs-code-line.code-active').forEach(el => {
    el.classList.remove('code-active', 'code-active-pulse');
  });
  if (!lineNum) return;
  const target = block.querySelector(`[data-line="${lineNum}"]`);
  if (!target) return;
  target.classList.add('code-active', 'code-active-pulse');
  // Scroll the code block to keep the highlighted line visible
  const blockRect  = block.getBoundingClientRect();
  const targetRect = target.getBoundingClientRect();
  const relTop = targetRect.top - blockRect.top;
  if (relTop < 0 || relTop > blockRect.height - 20) {
    target.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }
}

// ══════════════════════════════════════════════════════
//  EXPERIMENT REGISTRY
// ══════════════════════════════════════════════════════

const EXPERIMENTS = [
  { id:'bubble-sort',    title:'Bubble Sort',         icon:'🫧', tag:'Sorting',
    desc:'Adjacent element swaps bubble the largest value to the end each pass. Classic O(n²) with early-exit optimization.',
    accentColor:'#00e5ff', accentBg:'rgba(0,229,255,0.08)', accentBorder:'rgba(0,229,255,0.2)', glowColor:'rgba(0,229,255,0.06)' },
  { id:'selection-sort', title:'Selection Sort',      icon:'🎯', tag:'Sorting',
    desc:'Repeatedly selects the minimum element from the unsorted portion and places it at the front.',
    accentColor:'#22d3ee', accentBg:'rgba(34,211,238,0.08)', accentBorder:'rgba(34,211,238,0.2)', glowColor:'rgba(34,211,238,0.06)' },
  { id:'insertion-sort', title:'Insertion Sort',      icon:'🃏', tag:'Sorting',
    desc:'Builds sorted array one element at a time by inserting each into its correct position.',
    accentColor:'#34d399', accentBg:'rgba(52,211,153,0.08)', accentBorder:'rgba(52,211,153,0.2)', glowColor:'rgba(52,211,153,0.06)' },
  { id:'merge-sort',     title:'Merge Sort',          icon:'🧩', tag:'Sorting',
    desc:'Divide-and-conquer: split array in half, recursively sort, merge. Guaranteed O(n log n).',
    accentColor:'#a78bfa', accentBg:'rgba(167,139,250,0.08)', accentBorder:'rgba(167,139,250,0.2)', glowColor:'rgba(167,139,250,0.06)' },
  { id:'quick-sort',     title:'Quick Sort',          icon:'⚡', tag:'Sorting',
    desc:'Partition around pivot element then recursively sort sub-arrays. Average O(n log n) in-place.',
    accentColor:'#f59e0b', accentBg:'rgba(245,158,11,0.08)', accentBorder:'rgba(245,158,11,0.2)', glowColor:'rgba(245,158,11,0.06)' },
  { id:'heap-sort',      title:'Heap Sort',           icon:'🔺', tag:'Sorting',
    desc:'Build a max-heap then repeatedly extract the maximum. Guaranteed O(n log n) with O(1) extra space.',
    accentColor:'#ff6b9d', accentBg:'rgba(255,107,157,0.08)', accentBorder:'rgba(255,107,157,0.2)', glowColor:'rgba(255,107,157,0.06)' },
  { id:'n-queens',       title:'N-Queens Problem',    icon:'♛',  tag:'Recursion',
    desc:'Place N queens on NxN chessboard so no two queens attack each other. Visualize backtracking.',
    accentColor:'#e879f9', accentBg:'rgba(232,121,249,0.08)', accentBorder:'rgba(232,121,249,0.2)', glowColor:'rgba(232,121,249,0.06)' },
  { id:'sudoku-solver',  title:'Sudoku Solver',       icon:'🔢', tag:'Recursion',
    desc:'Recursive backtracking Sudoku solver. Watch each cell being tried and backtracked live.',
    accentColor:'#c084fc', accentBg:'rgba(192,132,252,0.08)', accentBorder:'rgba(192,132,252,0.2)', glowColor:'rgba(192,132,252,0.06)' },
  { id:'rat-in-maze',    title:'Rat in a Maze',       icon:'🐭', tag:'Recursion',
    desc:'Find all paths from source to destination in a grid maze using recursive backtracking.',
    accentColor:'#fb923c', accentBg:'rgba(251,146,60,0.08)', accentBorder:'rgba(251,146,60,0.2)', glowColor:'rgba(251,146,60,0.06)' },
  { id:'bfs',            title:'Breadth First Search',icon:'🌊', tag:'Graph',
    desc:'Explore graph level by level using a queue. Find shortest path in unweighted graphs.',
    accentColor:'#06b6d4', accentBg:'rgba(6,182,212,0.08)', accentBorder:'rgba(6,182,212,0.2)', glowColor:'rgba(6,182,212,0.06)' },
  { id:'dfs',            title:'Depth First Search',  icon:'🌲', tag:'Graph',
    desc:'Explore as deep as possible before backtracking using a stack. Detect cycles, find paths.',
    accentColor:'#4ade80', accentBg:'rgba(74,222,128,0.08)', accentBorder:'rgba(74,222,128,0.2)', glowColor:'rgba(74,222,128,0.06)' },
  { id:'dijkstra',       title:"Dijkstra's Shortest Path", icon:'🗺', tag:'Graph',
    desc:"Greedy shortest path algorithm. Uses a priority queue to find minimum distances from source.",
    accentColor:'#fbbf24', accentBg:'rgba(251,191,36,0.08)', accentBorder:'rgba(251,191,36,0.2)', glowColor:'rgba(251,191,36,0.06)' },
  { id:'fibonacci-dp',   title:'Fibonacci using DP',  icon:'🐚', tag:'DP',
    desc:'Memoization vs tabulation. Watch the DP table fill up avoiding redundant recursive calls.',
    accentColor:'#f87171', accentBg:'rgba(248,113,113,0.08)', accentBorder:'rgba(248,113,113,0.2)', glowColor:'rgba(248,113,113,0.06)' },
  { id:'lcs',            title:'Longest Common Subsequence', icon:'📏', tag:'DP',
    desc:'Find the longest subsequence common to two strings. Animate the 2D DP table filling.',
    accentColor:'#818cf8', accentBg:'rgba(129,140,248,0.08)', accentBorder:'rgba(129,140,248,0.2)', glowColor:'rgba(129,140,248,0.06)' },
  { id:'knapsack',       title:'0/1 Knapsack Problem', icon:'🎒', tag:'DP',
    desc:'Maximize value subject to weight capacity. Animate the DP table and traceback the solution.',
    accentColor:'#a3e635', accentBg:'rgba(163,230,53,0.08)', accentBorder:'rgba(163,230,53,0.2)', glowColor:'rgba(163,230,53,0.06)' },
  { id:'stack-ops',      title:'Stack Operations',    icon:'📚', tag:'Stack/Queue',
    desc:'Visualize Push and Pop operations with LIFO (Last In First Out) animated stack display.',
    accentColor:'#fb7185', accentBg:'rgba(251,113,133,0.08)', accentBorder:'rgba(251,113,133,0.2)', glowColor:'rgba(251,113,133,0.06)' },
  { id:'queue-ops',      title:'Queue Operations',    icon:'🚶', tag:'Stack/Queue',
    desc:'Visualize Enqueue and Dequeue with FIFO (First In First Out) animated queue display.',
    accentColor:'#38bdf8', accentBg:'rgba(56,189,248,0.08)', accentBorder:'rgba(56,189,248,0.2)', glowColor:'rgba(56,189,248,0.06)' },
  { id:'bst-ops',        title:'Binary Search Tree',       icon:'🌳', tag:'Trees',
    desc:'Visualize BST insert, delete, and search operations with animated node placement.',
    accentColor:'#34d399', accentBg:'rgba(52,211,153,0.08)', accentBorder:'rgba(52,211,153,0.2)', glowColor:'rgba(52,211,153,0.06)' },
  { id:'avl-tree',       title:'AVL Tree Rotations',       icon:'⚖', tag:'Trees',
    desc:'Watch LL, RR, LR, RL rotations rebalance the tree after every insertion.',
    accentColor:'#22d3ee', accentBg:'rgba(34,211,238,0.08)', accentBorder:'rgba(34,211,238,0.2)', glowColor:'rgba(34,211,238,0.06)' },
  { id:'tree-traversal', title:'Tree Traversals',          icon:'🚶', tag:'Trees',
    desc:'Animate Inorder, Preorder, Postorder, and Level-Order traversals on the same tree.',
    accentColor:'#a78bfa', accentBg:'rgba(167,139,250,0.08)', accentBorder:'rgba(167,139,250,0.2)', glowColor:'rgba(167,139,250,0.06)' },
  { id:'topo-sort',      title:'Topological Sort',         icon:'📋', tag:'AdvGraph',
    desc:'Order nodes of a DAG so every directed edge goes left-to-right.',
    accentColor:'#fb923c', accentBg:'rgba(251,146,60,0.08)', accentBorder:'rgba(251,146,60,0.2)', glowColor:'rgba(251,146,60,0.06)' },
  { id:'kruskal',        title:"Kruskal's MST",            icon:'🌉', tag:'AdvGraph',
    desc:'Greedily add lowest-weight edges using Union-Find to build a minimum spanning tree.',
    accentColor:'#fbbf24', accentBg:'rgba(251,191,36,0.08)', accentBorder:'rgba(251,191,36,0.2)', glowColor:'rgba(251,191,36,0.06)' },
  { id:'prim',           title:"Prim's MST",               icon:'🌐', tag:'AdvGraph',
    desc:'Grow MST from a seed node by always picking the cheapest edge crossing the frontier.',
    accentColor:'#4ade80', accentBg:'rgba(74,222,128,0.08)', accentBorder:'rgba(74,222,128,0.2)', glowColor:'rgba(74,222,128,0.06)' },
  { id:'bellman-ford',   title:'Bellman-Ford',             icon:'🛡', tag:'AdvGraph',
    desc:'Relax all edges V-1 times to find shortest paths even with negative weights.',
    accentColor:'#f87171', accentBg:'rgba(248,113,113,0.08)', accentBorder:'rgba(248,113,113,0.2)', glowColor:'rgba(248,113,113,0.06)' },
  { id:'kmp',            title:'KMP String Matching',      icon:'🔍', tag:'Strings',
    desc:'Knuth-Morris-Pratt uses a failure function to skip redundant comparisons.',
    accentColor:'#818cf8', accentBg:'rgba(129,140,248,0.08)', accentBorder:'rgba(129,140,248,0.2)', glowColor:'rgba(129,140,248,0.06)' },
  { id:'rabin-karp',     title:'Rabin-Karp Hashing',       icon:'#️⃣', tag:'Strings',
    desc:'Rolling hash window slides over the text comparing hash values for fast matching.',
    accentColor:'#c084fc', accentBg:'rgba(192,132,252,0.08)', accentBorder:'rgba(192,132,252,0.2)', glowColor:'rgba(192,132,252,0.06)' },
  { id:'trie',           title:'Trie / Prefix Tree',       icon:'🌿', tag:'Strings',
    desc:'Insert words and visualize the prefix tree structure with shared path compression.',
    accentColor:'#6ee7b7', accentBg:'rgba(110,231,183,0.08)', accentBorder:'rgba(110,231,183,0.2)', glowColor:'rgba(110,231,183,0.06)' },
  { id:'binary-search',  title:'Binary Search',            icon:'🎯', tag:'Searching',
    desc:'Repeatedly halve the search space on a sorted array to find the target in O(log n).',
    accentColor:'#38bdf8', accentBg:'rgba(56,189,248,0.08)', accentBorder:'rgba(56,189,248,0.2)', glowColor:'rgba(56,189,248,0.06)' },
  { id:'interpolation-search', title:'Interpolation Search', icon:'📡', tag:'Searching',
    desc:'Estimates probe position using value distribution for O(log log n) on uniform data.',
    accentColor:'#67e8f9', accentBg:'rgba(103,232,249,0.08)', accentBorder:'rgba(103,232,249,0.2)', glowColor:'rgba(103,232,249,0.06)' },
  { id:'tower-of-hanoi', title:'Tower of Hanoi',           icon:'🗼', tag:'Recursion',
    desc:'Watch the minimal disk-move solution unfold with animated peg-to-peg transfers.',
    accentColor:'#f59e0b', accentBg:'rgba(245,158,11,0.08)', accentBorder:'rgba(245,158,11,0.2)', glowColor:'rgba(245,158,11,0.06)' },
  { id:'permutations',   title:'Permutation Generator',    icon:'🔀', tag:'Recursion',
    desc:'Recursively swap elements to generate all permutations of an array.',
    accentColor:'#e879f9', accentBg:'rgba(232,121,249,0.08)', accentBorder:'rgba(232,121,249,0.2)', glowColor:'rgba(232,121,249,0.06)' },
  { id:'activity-selection', title:'Activity Selection',   icon:'📅', tag:'Greedy',
    desc:'Greedily pick max non-overlapping activities sorted by finish time.',
    accentColor:'#a3e635', accentBg:'rgba(163,230,53,0.08)', accentBorder:'rgba(163,230,53,0.2)', glowColor:'rgba(163,230,53,0.06)' },
  { id:'huffman-coding', title:'Huffman Coding',           icon:'📨', tag:'Greedy',
    desc:'Build a variable-length prefix code tree by merging lowest-frequency nodes.',
    accentColor:'#fb7185', accentBg:'rgba(251,113,133,0.08)', accentBorder:'rgba(251,113,133,0.2)', glowColor:'rgba(251,113,133,0.06)' },
  { id:'union-find',     title:'Union-Find (DSU)',         icon:'🔗', tag:'DisjointSet',
    desc:'Union by rank + path compression: near-O(1) amortized operations on disjoint sets.',
    accentColor:'#f472b6', accentBg:'rgba(244,114,182,0.08)', accentBorder:'rgba(244,114,182,0.2)', glowColor:'rgba(244,114,182,0.06)' },
  { id:'red-black-tree', title:'Red-Black Tree',           icon:'🔴', tag:'Trees',
    desc:'Self-balancing BST with color properties. Watch recoloring and rotations maintain balance.',
    accentColor:'#ff4757', accentBg:'rgba(255,71,87,0.08)', accentBorder:'rgba(255,71,87,0.2)', glowColor:'rgba(255,71,87,0.06)' },
  // ── Computational Geometry ──
  { id:'convex-hull',        title:'Convex Hull (Graham Scan)', icon:'🔷', tag:'CompGeom',
    desc:'Find the smallest convex polygon enclosing all points. Graham scan sorts by angle and uses a stack to build the hull in O(n log n).',
    accentColor:'#22d3ee', accentBg:'rgba(34,211,238,0.08)', accentBorder:'rgba(34,211,238,0.2)', glowColor:'rgba(34,211,238,0.06)' },
  { id:'line-intersection',  title:'Line Segment Intersection', icon:'✂️', tag:'CompGeom',
    desc:'Detect whether two line segments intersect using cross-product orientation tests. Bentley-Ottmann sweepline for multiple segments.',
    accentColor:'#67e8f9', accentBg:'rgba(103,232,249,0.08)', accentBorder:'rgba(103,232,249,0.2)', glowColor:'rgba(103,232,249,0.06)' },
  { id:'closest-pair',       title:'Closest Pair of Points',    icon:'📍', tag:'CompGeom',
    desc:'Find two closest points in a plane. Divide-and-conquer beats brute O(n²) with O(n log n) by splitting and merging strip regions.',
    accentColor:'#a5f3fc', accentBg:'rgba(165,243,252,0.08)', accentBorder:'rgba(165,243,252,0.2)', glowColor:'rgba(165,243,252,0.06)' },
  { id:'polygon-area',       title:'Polygon Area (Shoelace)',   icon:'📐', tag:'CompGeom',
    desc:'Compute the signed area of any polygon using the shoelace formula: half the absolute sum of cross products of consecutive vertices.',
    accentColor:'#06b6d4', accentBg:'rgba(6,182,212,0.08)', accentBorder:'rgba(6,182,212,0.2)', glowColor:'rgba(6,182,212,0.06)' },
  // ── Bit Manipulation ──
  { id:'subset-bitmask',     title:'Subset Generation (Bitmask)', icon:'🎭', tag:'BitManip',
    desc:'Enumerate all 2^n subsets of a set using bitmasks. Each integer 0..2^n-1 represents a unique subset via its binary representation.',
    accentColor:'#f0abfc', accentBg:'rgba(240,171,252,0.08)', accentBorder:'rgba(240,171,252,0.2)', glowColor:'rgba(240,171,252,0.06)' },
  { id:'xor-tricks',         title:'XOR Trick Problems',         icon:'⊕',  tag:'BitManip',
    desc:'XOR is its own inverse. Find the single non-duplicate in an array, swap without temp variable, and detect missing numbers with XOR.',
    accentColor:'#e879f9', accentBg:'rgba(232,121,249,0.08)', accentBorder:'rgba(232,121,249,0.2)', glowColor:'rgba(232,121,249,0.06)' },
  { id:'power-of-two',       title:'Power of Two Check',         icon:'2️⃣', tag:'BitManip',
    desc:'A number n is a power of 2 iff n > 0 and (n & (n-1)) == 0. Visualize how this bit trick works and explore related bit patterns.',
    accentColor:'#d946ef', accentBg:'rgba(217,70,239,0.08)', accentBorder:'rgba(217,70,239,0.2)', glowColor:'rgba(217,70,239,0.06)' },
  { id:'bitwise-sieve',      title:'Bitwise Sieve of Eratosthenes', icon:'🔢', tag:'BitManip',
    desc:'Space-optimized prime sieve using bit arrays. Each bit represents one number — 8× memory reduction over boolean arrays. O(n log log n).',
    accentColor:'#c026d3', accentBg:'rgba(192,38,211,0.08)', accentBorder:'rgba(192,38,211,0.2)', glowColor:'rgba(192,38,211,0.06)' },
  // ── Binary Arithmetic ──
  { id:'binary-addition',      title:'Binary Addition',              icon:'➕', tag:'BinaryArith',
    desc:'Add two binary numbers bit-by-bit with carry propagation. Visualized as a full-adder logic gate circuit and a step-by-step addition table.',
    accentColor:'#34d399', accentBg:'rgba(52,211,153,0.08)', accentBorder:'rgba(52,211,153,0.2)', glowColor:'rgba(52,211,153,0.06)' },
  { id:'binary-subtraction',   title:'Binary Subtraction (2s Comp)',  icon:'➖', tag:'BinaryArith',
    desc:'Subtract using 2s complement method. See 1s complement, add 1, then add — visualized with borrow table and logic gates.',
    accentColor:'#f87171', accentBg:'rgba(248,113,113,0.08)', accentBorder:'rgba(248,113,113,0.2)', glowColor:'rgba(248,113,113,0.06)' },
  { id:'binary-multiplication', title:"Booth's Multiplication",        icon:'✖️', tag:'BinaryArith',
    desc:"Booth's algorithm multiplies signed binary numbers. Step through the register table: Q, Q-1, A, M — with arithmetic/logic shifts and logic gates.",
    accentColor:'#fbbf24', accentBg:'rgba(251,191,36,0.08)', accentBorder:'rgba(251,191,36,0.2)', glowColor:'rgba(251,191,36,0.06)' },
  { id:'binary-division',      title:'Binary Division (Restoring)',   icon:'➗', tag:'BinaryArith',
    desc:'Restoring division algorithm: shift-and-subtract each step, restore if remainder goes negative. Full table and datapath visualization.',
    accentColor:'#a78bfa', accentBg:'rgba(167,139,250,0.08)', accentBorder:'rgba(167,139,250,0.2)', glowColor:'rgba(167,139,250,0.06)' },
  // ── Binary Arithmetic — Gate Versions ──
  { id:'binary-addition-gates',    title:'Addition — Logic Gates',        icon:'🔌', tag:'BinaryArith',
    desc:'Full-adder gate circuit: XOR, AND, OR gates with live wire values. Step through each bit to see how Sum and Carry propagate through the silicon.',
    accentColor:'#6ee7b7', accentBg:'rgba(110,231,183,0.08)', accentBorder:'rgba(110,231,183,0.2)', glowColor:'rgba(110,231,183,0.06)' },
  { id:'binary-subtraction-gates', title:'Subtraction — Logic Gates',     icon:'🔌', tag:'BinaryArith',
    desc:"2s complement via XOR inverters + a ripple-carry adder. See how a single circuit performs both addition and subtraction.",
    accentColor:'#fca5a5', accentBg:'rgba(252,165,165,0.08)', accentBorder:'rgba(252,165,165,0.2)', glowColor:'rgba(252,165,165,0.06)' },
  { id:'binary-multiplication-gates', title:"Booth's — Gate Datapath",    icon:'🔌', tag:'BinaryArith',
    desc:"Booth's multiplier gate-level datapath: adder/subtractor, shift register, Q0/Q-1 comparator. Watch signals flow each iteration.",
    accentColor:'#fde68a', accentBg:'rgba(253,230,138,0.08)', accentBorder:'rgba(253,230,138,0.2)', glowColor:'rgba(253,230,138,0.06)' },
  { id:'binary-division-gates',    title:'Division — Gate Datapath',      icon:'🔌', tag:'BinaryArith',
    desc:'Restoring divider datapath: shift register, subtractor, sign-detector, quotient MUX. Each clock cycle animated in gate-level detail.',
    accentColor:'#c4b5fd', accentBg:'rgba(196,181,253,0.08)', accentBorder:'rgba(196,181,253,0.2)', glowColor:'rgba(196,181,253,0.06)' },
  // ── Machine Learning ──
  { id:'linear-regression',  title:'Linear Regression',         icon:'📈', tag:'ML',
    desc:'Gradient descent on MSE loss — watch weights update live as the regression line converges to fit your data points.',
    accentColor:'#38bdf8', accentBg:'rgba(56,189,248,0.08)', accentBorder:'rgba(56,189,248,0.2)', glowColor:'rgba(56,189,248,0.06)' },
  { id:'knn',                title:'K-Nearest Neighbors',       icon:'🎯', tag:'ML',
    desc:'Click to place points, pick K, and watch decision boundaries morph as KNN classifies the feature space by majority vote.',
    accentColor:'#f472b6', accentBg:'rgba(244,114,182,0.08)', accentBorder:'rgba(244,114,182,0.2)', glowColor:'rgba(244,114,182,0.06)' },
  { id:'kmeans',             title:'K-Means Clustering',        icon:'⭕', tag:'ML',
    desc:'Place points or use random data, then animate centroid movement and cluster reassignment until convergence.',
    accentColor:'#fb923c', accentBg:'rgba(251,146,60,0.08)', accentBorder:'rgba(251,146,60,0.2)', glowColor:'rgba(251,146,60,0.06)' },
  { id:'decision-tree',      title:'Decision Tree',             icon:'🌳', tag:'ML',
    desc:'Binary split visualization — watch information gain drive recursive partitioning of your feature space into decision regions.',
    accentColor:'#86efac', accentBg:'rgba(134,239,172,0.08)', accentBorder:'rgba(134,239,172,0.2)', glowColor:'rgba(134,239,172,0.06)' },
  { id:'perceptron',         title:'Perceptron',                icon:'🧠', tag:'ML',
    desc:'Single-layer perceptron: place two-class points, watch weight vectors adjust each epoch until linear separation is found.',
    accentColor:'#c084fc', accentBg:'rgba(192,132,252,0.08)', accentBorder:'rgba(192,132,252,0.2)', glowColor:'rgba(192,132,252,0.06)' },
  // ── Network Security ──
  { id:'ddos-attack',        title:'DDoS Attack',               icon:'💀', tag:'NetSec',
    desc:'Watch a botnet of zombie nodes flood a central server with requests until it overloads and crashes. Adjust botnet size and attack rate.',
    accentColor:'#f43f5e', accentBg:'rgba(244,63,94,0.08)', accentBorder:'rgba(244,63,94,0.2)', glowColor:'rgba(244,63,94,0.06)' },
  { id:'sql-injection',      title:'SQL Injection',             icon:'💉', tag:'NetSec',
    desc:'Type a benign or malicious SQL string into a web form and watch the query get parsed — a crafted OR 1=1 bypasses the database lock entirely.',
    accentColor:'#fb923c', accentBg:'rgba(251,146,60,0.08)', accentBorder:'rgba(251,146,60,0.2)', glowColor:'rgba(251,146,60,0.06)' },
  { id:'firewall-filter',    title:'Firewall Packet Filtering', icon:'🔥', tag:'NetSec',
    desc:'Packets stream toward the firewall wall. Green (safe) packets pass through; red (malicious) packets are deflected and destroyed. Toggle rules live.',
    accentColor:'#f97316', accentBg:'rgba(249,115,22,0.08)', accentBorder:'rgba(249,115,22,0.2)', glowColor:'rgba(249,115,22,0.06)' },
  { id:'mitm-attack',        title:'Man-in-the-Middle (MITM)',  icon:'🕵', tag:'NetSec',
    desc:'A Hacker node inserts itself between User and Server, intercepts the packet, changes its colour, and forwards a tampered copy — undetected without verification.',
    accentColor:'#a78bfa', accentBg:'rgba(167,139,250,0.08)', accentBorder:'rgba(167,139,250,0.2)', glowColor:'rgba(167,139,250,0.06)' },
  { id:'zkp-cave',           title:'Zero-Knowledge Proof (Cave)', icon:'🕳️', tag:'NetSec',
    desc:'Ali Baba cave protocol: Prover enters a random fork; Verifier calls a side; Prover exits correctly — round after round, without ever revealing which path they know.',
    accentColor:'#34d399', accentBg:'rgba(52,211,153,0.08)', accentBorder:'rgba(52,211,153,0.2)', glowColor:'rgba(52,211,153,0.06)' },
  // ── Cryptography ──
  { id:'rsa',                title:'RSA Encryption',            icon:'🔐', tag:'Crypto',
    desc:'Visualize RSA key generation (p, q → n, e, d) and watch a plaintext number transform into ciphertext via modular exponentiation.',
    accentColor:'#f59e0b', accentBg:'rgba(245,158,11,0.08)', accentBorder:'rgba(245,158,11,0.2)', glowColor:'rgba(245,158,11,0.06)' },
  { id:'diffie-hellman',     title:'Diffie-Hellman',            icon:'🎨', tag:'Crypto',
    desc:'Color-mixing metaphor: Alice and Bob blend private colors with a public one, exchange them, and independently arrive at the same shared secret.',
    accentColor:'#10b981', accentBg:'rgba(16,185,129,0.08)', accentBorder:'rgba(16,185,129,0.2)', glowColor:'rgba(16,185,129,0.06)' },
  { id:'aes-round',          title:'AES SubBytes/ShiftRows',    icon:'🔲', tag:'Crypto',
    desc:'Animate a 4×4 byte matrix through AES SubBytes (S-Box substitution) and ShiftRows (cyclic row rotation) transformations.',
    accentColor:'#06b6d4', accentBg:'rgba(6,182,212,0.08)', accentBorder:'rgba(6,182,212,0.2)', glowColor:'rgba(6,182,212,0.06)' },
  { id:'caesar-vigenere',    title:'Caesar & Vigenère Cipher',  icon:'🔡', tag:'Crypto',
    desc:'Rotating alphabet ring shows Caesar\'s uniform shift and Vigenère\'s polyalphabetic substitution — encode and decode plaintext interactively.',
    accentColor:'#8b5cf6', accentBg:'rgba(139,92,246,0.08)', accentBorder:'rgba(139,92,246,0.2)', glowColor:'rgba(139,92,246,0.06)' },
  { id:'sha256',             title:'SHA-256 Hashing',           icon:'#️⃣', tag:'Crypto',
    desc:'Watch text split into 512-bit blocks, undergo 64 rounds of bitwise mixing (σ, Σ, Ch, Maj functions), and compress into a 256-bit hex digest.',
    accentColor:'#ef4444', accentBg:'rgba(239,68,68,0.08)', accentBorder:'rgba(239,68,68,0.2)', glowColor:'rgba(239,68,68,0.06)' }
]
// ══════════════════════════════════════════════════════
//  BRANCHES DEFINITION
// ══════════════════════════════════════════════════════
const BRANCHES = [
  {
    id: 'sorting',
    name: 'Sorting Algorithms',
    icon: '📊',
    color: '#00e5ff',
    glow: 'rgba(0,229,255,0.12)',
    bg: 'rgba(0,229,255,0.06)',
    border: 'rgba(0,229,255,0.2)',
    desc: 'Visualize how classic sorting algorithms rearrange elements — bubble, selection, insertion, merge, quick, and heap sort with bar animations.',
    tags: ['Sorting'],
    isCS: true,
  },
  {
    id: 'recursion',
    name: 'Recursion & Backtracking',
    icon: '🔄',
    color: '#e879f9',
    glow: 'rgba(232,121,249,0.12)',
    bg: 'rgba(232,121,249,0.06)',
    border: 'rgba(232,121,249,0.2)',
    desc: 'Watch recursive algorithms explore, backtrack, and find solutions — N-Queens, Sudoku solver, and Rat in a Maze with step-by-step animation.',
    tags: ['Recursion'],
    isCS: true,
  },
  {
    id: 'graph',
    name: 'Graph Algorithms',
    icon: '🕸',
    color: '#06b6d4',
    glow: 'rgba(6,182,212,0.12)',
    bg: 'rgba(6,182,212,0.06)',
    border: 'rgba(6,182,212,0.2)',
    desc: 'Explore BFS, DFS, and Dijkstra on animated graph visualizations. Watch traversal order, discovered nodes, and shortest path distances update live.',
    tags: ['Graph'],
    isCS: true,
  },
  {
    id: 'dp',
    name: 'Dynamic Programming',
    icon: '📐',
    color: '#f87171',
    glow: 'rgba(248,113,113,0.12)',
    bg: 'rgba(248,113,113,0.06)',
    border: 'rgba(248,113,113,0.2)',
    desc: 'Animate DP table construction for Fibonacci, LCS, and 0/1 Knapsack. See how subproblem solutions build towards the final answer.',
    tags: ['DP'],
    isCS: true,
  },
  {
    id: 'stack-queue',
    name: 'Stack & Queue',
    icon: '🗂',
    color: '#38bdf8',
    glow: 'rgba(56,189,248,0.12)',
    bg: 'rgba(56,189,248,0.06)',
    border: 'rgba(56,189,248,0.2)',
    desc: 'Interactive push/pop and enqueue/dequeue animations. See LIFO and FIFO data structures in action with visual element flow.',
    tags: ['Stack/Queue'],
    isCS: true,
  },
  {
    id: 'trees',
    name: 'Tree Structures',
    icon: '🌳',
    color: '#34d399',
    glow: 'rgba(52,211,153,0.12)',
    bg: 'rgba(52,211,153,0.06)',
    border: 'rgba(52,211,153,0.2)',
    desc: 'BST, AVL, Red-Black trees and all four traversals — visualize how self-balancing trees maintain O(log n) operations.',
    tags: ['Trees'],
    isCS: true,
  },
  {
    id: 'adv-graph',
    name: 'Advanced Graphs',
    icon: '🕸',
    color: '#fb923c',
    glow: 'rgba(251,146,60,0.12)',
    bg: 'rgba(251,146,60,0.06)',
    border: 'rgba(251,146,60,0.2)',
    desc: 'Topological sort, MST algorithms (Kruskal & Prim), and Bellman-Ford — the powerhouse graph algorithms used in every real-world system.',
    tags: ['AdvGraph'],
    isCS: true,
  },
  {
    id: 'strings',
    name: 'String Algorithms',
    icon: '🔤',
    color: '#818cf8',
    glow: 'rgba(129,140,248,0.12)',
    bg: 'rgba(129,140,248,0.06)',
    border: 'rgba(129,140,248,0.2)',
    desc: 'KMP pattern matching, Rabin-Karp rolling hash, and Trie prefix trees — the algorithms behind search engines, DNA analysis, and autocomplete.',
    tags: ['Strings'],
    isCS: true,
  },
  {
    id: 'searching',
    name: 'Searching',
    icon: '🔍',
    color: '#38bdf8',
    glow: 'rgba(56,189,248,0.12)',
    bg: 'rgba(56,189,248,0.06)',
    border: 'rgba(56,189,248,0.2)',
    desc: 'Binary search and interpolation search — divide and conquer the sorted array to find targets in O(log n) and beyond.',
    tags: ['Searching'],
    isCS: true,
  },
  {
    id: 'greedy',
    name: 'Greedy Algorithms',
    icon: '🏆',
    color: '#a3e635',
    glow: 'rgba(163,230,53,0.12)',
    bg: 'rgba(163,230,53,0.06)',
    border: 'rgba(163,230,53,0.2)',
    desc: 'Activity selection and Huffman coding — greedy algorithms that make locally optimal choices to achieve globally optimal results.',
    tags: ['Greedy'],
    isCS: true,
  },
  {
    id: 'dsu',
    name: 'Disjoint Sets',
    icon: '🔗',
    color: '#f472b6',
    glow: 'rgba(244,114,182,0.12)',
    bg: 'rgba(244,114,182,0.06)',
    border: 'rgba(244,114,182,0.2)',
    desc: "Union-Find with path compression and union by rank — near-constant time set operations that power Kruskal's MST and network connectivity.",
    tags: ['DisjointSet'],
    isCS: true,
  },
  {
    id: 'bit-manip',
    name: 'Bit Manipulation',
    icon: '⚡',
    color: '#e879f9',
    glow: 'rgba(232,121,249,0.12)',
    bg: 'rgba(232,121,249,0.06)',
    border: 'rgba(232,121,249,0.2)',
    desc: 'Bitmask subset generation, XOR tricks, power-of-two checks, and the bitwise sieve — manipulate bits directly for blazing performance and memory savings.',
    tags: ['BitManip'],
    isCS: true,
  },
  {
    id: 'comp-geom',
    name: 'Computational Geometry',
    icon: '📐',
    color: '#22d3ee',
    glow: 'rgba(34,211,238,0.12)',
    bg: 'rgba(34,211,238,0.06)',
    border: 'rgba(34,211,238,0.2)',
    desc: 'Convex hull, line intersection, closest pair of points, and polygon area — geometric algorithms that power CAD, robotics, computer graphics, and GIS systems.',
    tags: ['CompGeom'],
    isCS: true,
  },
  {
    id: 'binary-arith',
    name: 'Binary Arithmetic',
    icon: '🔢',
    color: '#34d399',
    glow: 'rgba(52,211,153,0.12)',
    bg: 'rgba(52,211,153,0.06)',
    border: 'rgba(52,211,153,0.2)',
    desc: "8 experiments: addition, subtraction, Booth multiplication and restoring division — each shown twice: once as an animated step table, and once as a live logic gate circuit.",
    tags: ['BinaryArith'],
    isCS: true,
  },
  {
    id: 'ml',
    name: 'Machine Learning',
    icon: '🤖',
    color: '#38bdf8',
    glow: 'rgba(56,189,248,0.12)',
    bg: 'rgba(56,189,248,0.06)',
    border: 'rgba(56,189,248,0.2)',
    desc: 'Gradient descent, KNN boundaries, K-Means centroids, decision trees, and the perceptron — five foundational ML algorithms animated from scratch.',
    tags: ['ML'],
    isCS: true,
  },
  {
    id: 'crypto',
    name: 'Cryptography',
    icon: '🔐',
    color: '#f59e0b',
    glow: 'rgba(245,158,11,0.12)',
    bg: 'rgba(245,158,11,0.06)',
    border: 'rgba(245,158,11,0.2)',
    desc: 'RSA key generation, Diffie-Hellman color mixing, AES byte substitution, Caesar & Vigenère cipher rings, and SHA-256 bitwise hashing — the algorithms that secure the internet.',
    tags: ['Crypto'],
    isCS: true,
  },
  {
    id: 'netsec',
    name: 'Network Security',
    icon: '🛡',
    color: '#f43f5e',
    glow: 'rgba(244,63,94,0.12)',
    bg: 'rgba(244,63,94,0.06)',
    border: 'rgba(244,63,94,0.2)',
    desc: 'DDoS botnet floods, SQL injection bypasses, firewall packet filtering, man-in-the-middle interception, and zero-knowledge proofs — watch attacks happen and defences hold, live on the canvas.',
    tags: ['NetSec'],
    isCS: true,
  }
]
// ══════════════════════════════════════════════════════
//  BRANCH PARAGRAPHS (long text for typing effect)
// ══════════════════════════════════════════════════════
const BRANCH_BLURBS = {

  'sorting':     { heading: 'Algorithms That <em>Order</em> the World', tagline: 'Visual Step-by-Step Sorting', tags: ['Bubble Sort', 'Merge Sort', 'Quick Sort', 'Heap Sort'], text: "Sorting is one of the most fundamental problems in computer science. Every database query, search result, and ranked leaderboard depends on efficient sorting. Bubble sort teaches the core principle of comparison and swap. Merge sort introduces the elegant divide-and-conquer paradigm. Quick sort dominates real-world usage with its cache-friendly in-place partitioning. Heap sort guarantees O(n log n) using the heap data structure. Understanding these algorithms builds the intuition for analyzing any algorithm's performance." },
  'recursion':   { heading: 'The Art of <em>Backtracking</em>', tagline: 'Explore, Backtrack, Solve', tags: ['N-Queens', 'Sudoku', 'Rat in Maze', 'Backtracking'], text: "Backtracking is the systematic method of trying each possible option, detecting dead ends, and undoing choices to try alternatives. The N-Queens problem elegantly demonstrates constraint satisfaction — placing queens row by row while checking column and diagonal conflicts. Sudoku solving extends this to a 9×9 constraint grid. Rat in a Maze models pathfinding problems from robot navigation to game AI. These problems form the backbone of combinatorial optimization, compiler design, and artificial intelligence planning algorithms." },
  'graph':       { heading: 'Traversing the <em>Connected</em> World', tagline: 'BFS, DFS & Shortest Paths', tags: ['BFS', 'DFS', 'Dijkstra', 'Graph Traversal'], text: "Graph algorithms power the internet, social networks, GPS navigation, and compiler dependency resolution. Breadth-First Search explores nodes level-by-level, guaranteeing shortest paths in unweighted graphs — the core of web crawlers and peer-to-peer networks. Depth-First Search dives deep before backtracking, enabling topological sorting, cycle detection, and maze generation. Dijkstra's algorithm greedily expands the nearest unvisited node, computing minimum distances — the foundation of every GPS routing system ever built." },
  'dp':          { heading: 'Building Solutions from <em>Subproblems</em>', tagline: 'Memoization & Tabulation', tags: ['Fibonacci', 'LCS', 'Knapsack', 'DP Table'], text: "Dynamic programming transforms exponential brute-force into polynomial-time elegance by storing and reusing solutions to overlapping subproblems. Fibonacci illustrates memoization — the dramatic speedup from caching recursive calls. Longest Common Subsequence powers diff tools, gene sequence alignment, and plagiarism detection. The 0/1 Knapsack problem models resource allocation in finance, logistics, and compiler register allocation. Mastering DP means recognizing optimal substructure and overlapping subproblems — two skills that solve a vast class of optimization problems." },
  'stack-queue': { heading: 'The Backbone of <em>Data Flow</em>', tagline: 'LIFO, FIFO & Beyond', tags: ['Stack', 'Queue', 'Push/Pop', 'Enqueue/Dequeue'], text: "Stacks and queues are deceptively simple yet power some of the most critical algorithms in computing. Stacks enable function call management, expression evaluation, undo/redo in editors, and DFS traversal. Queues enable BFS graph traversal, CPU scheduling, network packet buffering, and asynchronous message passing. Every time you call a function in any programming language, a stack frame is pushed. Every HTTP request you make enters a queue. Understanding these structures transforms how you think about data flow and algorithm design." },

  'trees':      { heading: 'Balanced <em>Trees</em> in Action', tagline: 'BST, AVL & Traversals', tags: ['BST', 'AVL', 'Red-Black', 'Traversals'], text: 'Tree data structures are the backbone of databases, file systems, and compilers. A Binary Search Tree offers O(log n) search on average, but degrades to O(n) when unbalanced. AVL trees enforce strict height balance through rotations, guaranteeing O(log n) always. Red-Black trees relax balance slightly for faster insertions, powering C++ std::map and Java TreeMap. Understanding the four traversals — inorder, preorder, postorder, and level-order — unlocks serialization, expression parsing, and hierarchical data processing.' },
  'adv-graph':  { heading: 'Graphs at <em>Scale</em>', tagline: 'MST, DAG & Negative Weights', tags: ['Topological Sort', 'Kruskal', 'Prim', 'Bellman-Ford'], text: "Advanced graph algorithms solve the world's most complex routing, scheduling, and network problems. Topological sort orders tasks with dependencies — it powers build systems like Make and package managers like npm. Kruskal's MST greedily builds a minimum spanning tree using Union-Find to avoid cycles — used in network cable planning and cluster analysis. Prim's algorithm grows the MST from a seed node like a spreading wave. Bellman-Ford handles negative edge weights and detects negative cycles — critical for currency arbitrage detection and network routing protocols." },
  'strings':    { heading: 'Patterns in <em>Text</em>', tagline: 'KMP, Hashing & Tries', tags: ['KMP', 'Rabin-Karp', 'Trie', 'Prefix Table'], text: 'String algorithms are at the heart of search engines, bioinformatics, compilers, and data compression. KMP (Knuth-Morris-Pratt) never re-examines characters, achieving true O(n+m) matching using a precomputed failure function. Rabin-Karp uses polynomial rolling hashes to find multiple patterns simultaneously — the basis of plagiarism detection and substring search. Tries store strings by their common prefixes, enabling O(m) lookup and powering every autocomplete system from IDEs to search bars.' },
  'searching':  { heading: 'Finding in <em>O(log n)</em>', tagline: 'Divide & Conquer Search', tags: ['Binary Search', 'Interpolation', 'Sorted Arrays', 'Search Space'], text: 'Efficient searching transforms intractable brute-force into elegant logarithmic solutions. Binary search is deceptively simple yet powers every sorted data lookup — from finding a word in a dictionary to git bisect finding a buggy commit. The challenge lies in getting boundary conditions right, a skill that separates good engineers from great ones. Interpolation search improves on binary search for uniformly distributed data by estimating the probe position from the value being sought, achieving O(log log n) in the ideal case.' },
  'greedy':     { heading: 'Local Choices, <em>Global Optimum</em>', tagline: 'Activity Selection & Huffman', tags: ['Activity Selection', 'Huffman', 'Greedy Choice', 'Optimal Substructure'], text: "Greedy algorithms make the locally optimal choice at each step and — when the problem has the greedy choice property — arrive at a globally optimal solution without backtracking. The activity selection problem elegantly proves that always picking the earliest-finishing compatible activity maximizes count. Huffman coding assigns shorter bit patterns to more frequent characters, achieving near-optimal data compression. These ideas underpin JPEG, MP3, ZIP compression, and Dijkstra's algorithm itself." },

  'comp-geom':  { heading: 'Algorithms in <em>Space & Shape</em>', tagline: 'Geometry Meets Code', tags: ['Convex Hull', 'Intersection', 'Closest Pair', 'Shoelace'], text: 'Computational geometry sits at the intersection of mathematics, algorithms, and real-world engineering. Convex hull algorithms wrap the outermost points of a cloud — used in collision detection and robotics workspace planning. Line segment intersection detection powers EDA tools, map overlays, and physics engines. The closest pair of points problem showcases divide-and-conquer elegance for 2D data. The shoelace formula computes polygon areas with remarkable simplicity — a staple of competitive programming and GIS computation.' },
  'ml': { heading: 'Machines that <em>Learn</em>', tagline: 'Gradient Descent to Neural Nets', tags: ['Regression', 'KNN', 'K-Means', 'Decision Tree', 'Perceptron'], text: 'Machine learning is the art of finding patterns in data without being explicitly programmed. Linear regression minimises a cost function via gradient descent — the engine behind virtually every ML optimiser. KNN makes predictions by majority vote among the k closest training examples, with no training phase. K-Means iteratively assigns points to their nearest centroid and recomputes centroids until convergence. Decision trees recursively split data by the feature that maximises information gain. The perceptron — the ancestor of all neural networks — updates its weight vector each time it misclassifies a point, converging to a separating hyperplane if one exists.' },
  'binary-arith': { heading: 'Arithmetic at the <em>Bit Level</em>', tagline: 'Logic Gates & Register Tables', tags: ['Addition', 'Subtraction', "Booth's Algo", 'Division'], text: "Every number your CPU processes is ultimately manipulated as bits through logic gates. Binary addition uses half-adders and full-adders with carry propagation. Subtraction uses the elegant 2s complement trick — flip all bits, add 1, then add — avoiding the need for a separate subtraction circuit. Booth's algorithm handles signed multiplication efficiently by encoding runs of 1s, reducing the number of partial products. Restoring division mirrors long division in binary, shifting and subtracting at each step. Visualizing these operations with both register tables and gate diagrams bridges the gap between software algorithms and computer architecture." },
  'bit-manip':  { heading: 'The Power of <em>Binary</em> Thinking', tagline: 'Bits, Tricks & Speed', tags: ['Bitmask', 'XOR', 'Power of 2', 'Sieve'], text: 'Bit manipulation is the art of exploiting binary representation to write code that is blazingly fast and memory-efficient. Bitmask-based subset enumeration iterates over all 2^n subsets of n elements — indispensable in DP over subsets, competitive programming, and combinatorics. XOR-based tricks exploit the self-inverse property to solve finding missing numbers, single non-duplicates, and swapping without temporaries in O(1). The bitwise sieve of Eratosthenes stores one prime flag per bit, achieving 8× memory reduction. These low-level techniques separate good competitive programmers from great systems engineers.' },
  'dsu':        { heading: 'Union by <em>Rank</em> & Path Compression', tagline: 'Disjoint Set Union', tags: ['Union-Find', 'Path Compression', 'Union by Rank', 'Inverse Ackermann'], text: "Disjoint Set Union (DSU / Union-Find) is one of the most elegant data structures in computer science. It maintains a partition of elements into disjoint sets, supporting two operations: find (which set does this element belong to?) and union (merge two sets). Path compression flattens the tree during find operations, and union by rank keeps trees shallow. Together they yield nearly O(1) amortized cost — formally O(α(n)) where α is the inverse Ackermann function, which is at most 4 for any practical input size. DSU powers Kruskal's MST, dynamic connectivity, and network union algorithms." },
  'crypto':     { heading: 'Secrets the <em>Internet</em> Runs On', tagline: 'RSA · DH · AES · SHA-256', tags: ['RSA', 'Diffie-Hellman', 'AES', 'SHA-256'], text: "Cryptography is the mathematical backbone of every HTTPS connection, encrypted message, and digital signature on the internet. RSA uses the hardness of factoring large primes — a 2048-bit key would take billions of years to crack by brute force. Diffie-Hellman solved the key-exchange problem: two parties can agree on a shared secret over a public channel without ever sending it. AES (Advanced Encryption Standard) processes data in 4×4 byte matrices through layered substitutions and permutations. SHA-256 is a one-way compression function — a single bit change in the input avalanches into a completely different 256-bit hash. Together these primitives form TLS, which secures virtually all modern internet traffic." },
  'netsec':     { heading: 'Attacks, Defences & <em>Trust</em>', tagline: 'DDoS · SQLi · Firewall · MITM · ZKP', tags: ['DDoS', 'SQL Injection', 'Firewall', 'MITM', 'ZKP'], text: "Network security is the ongoing war between attackers and defenders playing out on every router, server, and web form on the internet. DDoS floods overwhelm a server with traffic from thousands of compromised bots — the same weapon that knocked GitHub offline for 10 minutes in 2018. SQL injection exploits the blurry line between data and code in database queries — still the #1 web vulnerability two decades after discovery. Firewalls enforce policy by inspecting each packet's header and allowing only whitelisted flows. Man-in-the-middle attacks silently proxy a connection, reading or modifying data before forwarding it. Zero-knowledge proofs let a prover convince a verifier they know a secret without revealing a single bit of the secret itself — the mathematical magic behind modern privacy-preserving authentication." },
};

// ══════════════════════════════════════════════════════
//  UTILITIES
// ══════════════════════════════════════════════════════
let activeBranch = null;
const typingTimers = [];

function clearTyping() {
  typingTimers.forEach(id => clearTimeout(id));
  typingTimers.length = 0;
}

function typeText(el, text, speed) {
  el.innerHTML = '';
  let i = 0;
  const cursor = document.createElement('span');
  cursor.className = 'cursor';
  el.appendChild(cursor);
  function tick() {
    if (i < text.length) {
      el.insertBefore(document.createTextNode(text[i]), cursor);
      i++;
      typingTimers.push(setTimeout(tick, speed + Math.random() * 10));
    } else {
      cursor.remove();
    }
  }
  tick();
}

function getBranchExperiments(branch) {
  return EXPERIMENTS.filter(e => branch.tags.includes(e.tag));
}

// ══════════════════════════════════════════════════════
//  CAMERA-ROLL SCROLL ENGINE
//  Works on both .branch-pair rows and .exp-list-row rows
// ══════════════════════════════════════════════════════
let scrollRAF = null;

function lerp(a, b, t) { return a + (b - a) * t; }

// Per-element spring state
const springMap = new WeakMap();

function getSpring(el) {
  if (!springMap.has(el)) {
    springMap.set(el, { scale: 1.0, velScale: 0 });
  }
  return springMap.get(el);
}

function updateCameraRoll(rows) {
  if (!rows.length) return;
  const vMid = window.innerHeight / 2;

  rows.forEach(row => {
    const rect = row.getBoundingClientRect();
    const elMid = rect.top + rect.height / 2;
    const dist = Math.abs(elMid - vMid);
    const norm = Math.min(dist / (window.innerHeight * 0.65), 1);

    // Only scale — never touch opacity (IntersectionObserver owns card visibility)
    const targetScale = lerp(1.03, 0.93, norm);

    const s = getSpring(row);
    const stiffness = 0.10, damping = 0.75;
    s.velScale = s.velScale * damping + (targetScale - s.scale) * stiffness;
    s.scale   += s.velScale;

    row.style.transform = `scale(${s.scale.toFixed(4)})`;
  });
}

function startScrollEngine() {
  stopScrollEngine();
  function loop() {
    // Branch pairs
    const bPairs = [...document.querySelectorAll('#branch-rows .branch-pair')];
    if (bPairs.length) updateCameraRoll(bPairs);

    // Exp rows (only when visible)
    const expRows = [...document.querySelectorAll('#exp-list-rows .exp-list-row')];
    if (expRows.length) updateCameraRoll(expRows);

    scrollRAF = requestAnimationFrame(loop);
  }
  scrollRAF = requestAnimationFrame(loop);
}

function stopScrollEngine() {
  if (scrollRAF) { cancelAnimationFrame(scrollRAF); scrollRAF = null; }
}

// ══════════════════════════════════════════════════════
//  BUILD BRANCH VIEW
// ══════════════════════════════════════════════════════
function buildBranchView() {
  clearTyping();
  const container = document.getElementById('branch-rows');
  container.innerHTML = '';

  BRANCHES.forEach((branch, bi) => {
    if (bi === 0) {
      const divider = document.createElement('div');
      divider.className = 'cs-section-divider';
      divider.innerHTML = '<div class="cs-section-divider-line"></div><div class="cs-section-divider-text"> </div><div class="cs-section-divider-line"></div>';
      container.appendChild(divider);
    }

    const isOdd = bi % 2 !== 0;
    const exps  = getBranchExperiments(branch);
    const blurb = BRANCH_BLURBS[branch.id] || {};
    const delay = (bi * 0.07).toFixed(2) + 's';

    // Wrapper
    const pair = document.createElement('div');
    pair.className = 'branch-pair ' + (isOdd ? 'odd' : 'even');
    pair.style.cssText = `
      --branch-accent:${branch.color};
      --branch-glow:${branch.glow};
      --branch-bg:${branch.bg};
      --branch-border:${branch.border};
    `;

    // Card
    const card = document.createElement('div');
    card.className = 'branch-card branch-card-ready';
    card.style.animationDelay = delay;
    card.innerHTML = `
      <div class="branch-card-top">
        <div class="branch-icon">${branch.icon}</div>
        <div class="branch-num-badge">${String(bi+1).padStart(2,'0')} / ${String(BRANCHES.length).padStart(2,'0')}</div>
      </div>
      <div>
        <div class="branch-name">${branch.name}</div>
        <div class="branch-short">${branch.desc}</div>
      </div>
      <div class="branch-card-footer">
        <div class="branch-exp-count"><span>${exps.length}</span> experiments</div>
        <div class="branch-cta">Explore <span class="arrow">→</span></div>
      </div>`;
    card.addEventListener('click', () => openBranch(branch));
    // Deep-link: right-click → open branch in new tab
    card.style.cursor = 'pointer';
    card.setAttribute('role', 'link');
    card.setAttribute('data-href', branch.id + '.html');

    // Blurb
    const blurbEl = document.createElement('div');
    blurbEl.className = 'branch-blurb branch-blurb-ready';
    blurbEl.style.cssText = `--branch-accent:${branch.color}; animation-delay:${delay};`;
    blurbEl.innerHTML = `
      <div class="blurb-eyebrow">${blurb.tagline || branch.name}</div>
      <div class="blurb-heading">${blurb.heading || branch.name}</div>
      <div class="blurb-text" id="blurb-text-${bi}"></div>
      <div class="blurb-tags">${(blurb.tags||[]).map(t=>`<span class="blurb-tag">${t}</span>`).join('')}</div>`;

    pair.appendChild(card);
    pair.appendChild(blurbEl);
    container.appendChild(pair);

    // Typing effect (staggered, no IO needed)
    const textEl = document.getElementById('blurb-text-' + bi);
    if (textEl && blurb.text) {
      typingTimers.push(setTimeout(() => typeText(textEl, blurb.text, 13), 600 + bi * 100));
    }
  });

  startScrollEngine();
}
// ══════════════════════════════════════════════════════
//  OPEN BRANCH → EXP LIST VIEW
// ══════════════════════════════════════════════════════
function openBranch(branch) {
  activeBranch = branch;
  clearTyping();
  const exps = getBranchExperiments(branch);

  const header = document.getElementById('exp-list-header');
  header.style.setProperty('--branch-glow', branch.glow);
  header.innerHTML = `
    <button class="exp-list-back" id="exp-list-back-btn">← Branches</button>
    <div class="exp-list-branch-icon">${branch.icon}</div>
    <div class="exp-list-branch-info">
      <div class="exp-list-branch-name" style="color:${branch.color}">${branch.name}</div>
      <div class="exp-list-branch-tagline">${(BRANCH_BLURBS[branch.id]||{}).tagline||''}</div>
    </div>
    <div class="exp-list-count">${exps.length} experiments</div>`;
  document.getElementById('exp-list-back-btn').addEventListener('click', closeBranch);

  const container = document.getElementById('exp-list-rows');
  container.innerHTML = '';

  exps.forEach((exp, i) => {
    const isOdd = i % 2 !== 0;
    const delay = (i * 0.06).toFixed(2) + 's';
    const row = document.createElement('div');
    row.className = `exp-list-row ${isOdd ? 'odd' : 'even'}`;
    row.style.cssText = `
      --card-accent:${exp.accentColor};
      --card-bg:${exp.accentBg};
      --card-border:${exp.accentBorder};
      --card-glow:${exp.glowColor};
    `;

    const card = document.createElement('div');
    card.className = 'exp-list-card exp-list-card-ready';
    card.style.animationDelay = delay;
    card.innerHTML = `
      <div class="card-number">${String(i+1).padStart(2,'0')}</div>
      <div class="card-icon">${exp.icon}</div>
      <div class="card-tag">${exp.tag}</div>
      <div class="card-title">${exp.title}</div>
      <div class="card-desc">${exp.desc}</div>`;
    card.addEventListener('click', () => openExperiment(exp.id));

    const detail = document.createElement('div');
    detail.className = 'exp-list-detail exp-list-detail-ready';
    detail.style.animationDelay = delay;
    detail.innerHTML = `
      <div class="exp-list-detail-eyebrow">EXP ${String(i+1).padStart(2,'0')} · ${exp.tag}</div>
      <div class="exp-list-detail-title">${exp.title}</div>
      <div class="exp-list-detail-desc">${exp.desc}</div>
      <button class="exp-list-detail-btn">▶ Launch Experiment</button>`;
    detail.querySelector('.exp-list-detail-btn').addEventListener('click', () => openExperiment(exp.id));

    row.appendChild(card);
    row.appendChild(detail);
    container.appendChild(row);
  });

  window.scrollTo({ top: 0, behavior: 'instant' });
  viewTransition(lastClickX, lastClickY,
    () => {
      document.getElementById('branch-view').style.display = 'none';
      document.getElementById('episteme-footer').style.display = 'none';
      document.getElementById('exp-list-view').classList.add('active');
      setTimeout(startScrollEngine, 100);
    }
  );
}

function closeBranch() {
  clearTyping();
  viewTransition(lastClickX, lastClickY,
    () => {
      document.getElementById('exp-list-view').classList.remove('active');
      document.getElementById('branch-view').style.display = '';
      activeBranch = null;
      document.getElementById('episteme-footer').style.display = '';
      setTimeout(startScrollEngine, 100);
    }
  );
}

// Init
buildBranchView();

// If a specific branch page, auto-open that branch immediately (no home screen flash)
if (window.__EPISTEME_BRANCH__) {
  const _autoBranch = BRANCHES.find(b => b.id === window.__EPISTEME_BRANCH__);
  if (_autoBranch) {
    // Use requestAnimationFrame to let the DOM settle from buildBranchView
    requestAnimationFrame(() => openBranch(_autoBranch));
  }
}




// ══════════════════════════════════════════════════════
//  THEME TOGGLE  (light / dark mode)
// ══════════════════════════════════════════════════════
(function() {
  const ICON_DARK = '☀';   // shown when in dark mode  → click to go light
  const ICON_LIGHT = '☽';  // shown when in light mode → click to go dark

  function applyTheme(isLight) {
    document.body.classList.toggle('light', isLight);
    const ic = document.getElementById('theme-icon');
    if (ic) ic.textContent = isLight ? ICON_LIGHT : ICON_DARK;
    try { localStorage.setItem('episteme-theme', isLight ? 'light' : 'dark'); } catch(e) {}
  }

  // Restore saved preference
  let saved = 'dark';
  try { saved = localStorage.getItem('episteme-theme') || 'dark'; } catch(e) {}
  applyTheme(saved === 'light');

  document.getElementById('theme-toggle').addEventListener('click', () => {
    const isNowLight = !document.body.classList.contains('light');
    applyTheme(isNowLight);
    // Spin the icon
    const btn = document.getElementById('theme-toggle');
    btn.style.transition = 'transform 0.4s cubic-bezier(0.34,1.56,0.64,1), border-color 0.2s, background 0.2s';
    btn.style.transform = 'rotate(360deg) scale(1.15)';
    setTimeout(() => {
      btn.style.transform = '';
      btn.style.transition = '';
    }, 420);
  });
})();


// ══════════════════════════════════════════════════════
//  MATRIX RAIN BACKGROUND (home screen only)
// ══════════════════════════════════════════════════════
(function initMatrix() {
  const canvas = document.createElement('canvas');
  canvas.id = 'matrix-bg';
  canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:0;opacity:0.13;';
  document.body.insertBefore(canvas, document.body.firstChild);
  const ctx = canvas.getContext('2d');

  function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
  resize();
  window.addEventListener('resize', resize);

  const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789<>[]{}()!@#$%^&*;:./\\|~-_=+?'.split('');
  const FONT_SIZE = 13;
  let cols, drops;
  function initDrops() {
    cols = Math.floor(canvas.width / FONT_SIZE);
    drops = Array(cols).fill(1).map(() => Math.random() * -canvas.height / FONT_SIZE);
  }
  initDrops();
  window.addEventListener('resize', initDrops);

  function drawMatrix() {
    // Only run when home screen is visible
    const homeVisible = document.getElementById('home-screen').style.display !== 'none';
    if (!homeVisible) { requestAnimationFrame(drawMatrix); return; }

    ctx.fillStyle = 'rgba(13,13,26,0.05)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'var(--accent)';
    ctx.font = FONT_SIZE + 'px "Space Mono", monospace';

    for (let i = 0; i < drops.length; i++) {
      const ch = CHARS[Math.floor(Math.random() * CHARS.length)];
      const x = i * FONT_SIZE, y = drops[i] * FONT_SIZE;
      // Bright head
      ctx.fillStyle = drops[i] > 0 && Math.random() > 0.95 ? 'var(--text)' : 'var(--accent)';
      ctx.fillText(ch, x, y);
      if (y > canvas.height && Math.random() > 0.975) drops[i] = 0;
      drops[i] += 0.4 + Math.random() * 0.3;
    }
    requestAnimationFrame(drawMatrix);
  }
  drawMatrix();
})();

// ══════════════════════════════════════════════════════
//  NAVIGATION
// ══════════════════════════════════════════════════════
let animFrame = null;
let currentExp = null;

function goHome() {
  const ox = lastClickX, oy = lastClickY;
  viewTransition(ox, oy, () => {
    csKillEngine();
    if (animFrame) cancelAnimationFrame(animFrame);
    animFrame = null;
    document.getElementById('home-screen').style.display = '';
    document.getElementById('episteme-footer').style.display = '';
    document.getElementById('exp-screen').classList.remove('active');
    const ts = document.getElementById('theory-screen');
    if (ts) ts.style.display = 'none';
    document.getElementById('back-btn').classList.remove('show');
    document.getElementById('exp-title-bar').classList.remove('show');
    document.getElementById('left-panel').innerHTML = '';
    document.getElementById('right-panel').innerHTML = '';
    // Restore branch/exp-list view state
    if (activeBranch) {
      document.getElementById('branch-view').style.display = 'none';
      document.getElementById('exp-list-view').classList.add('active');
    } else {
      document.getElementById('branch-view').style.display = '';
      document.getElementById('exp-list-view').classList.remove('active');
    }
  });
}

function openExperiment(id) {
  const exp = EXPERIMENTS.find(e => e.id === id);
  if (!exp) return;
  currentExp = id;
  // Show theory screen first
  openTheory(exp, id);
}

function openTheory(exp, expId) {
  const ox = lastClickX, oy = lastClickY;
  function _buildTheory() {
    // Hide everything else
    document.getElementById('home-screen').style.display = 'none';
    document.getElementById('exp-screen').classList.remove('active');
    const ts = document.getElementById('theory-screen');
    ts.style.display = '';

    document.getElementById('back-btn').classList.add('show');
    document.getElementById('back-btn').textContent = activeBranch ? `← ${activeBranch.name}` : '← Home';
    document.getElementById('exp-title-bar').textContent = exp.title;
    document.getElementById('exp-title-bar').classList.add('show');

    // Breadcrumb
    document.getElementById('theory-breadcrumb').textContent =
      `> ${activeBranch ? activeBranch.name : 'CS Lab'} / ${exp.title}`;

    // Header
    const th = THEORY_DB[exp.id] || {};
    document.getElementById('theory-header').innerHTML = `
      <div class="theory-hero-tag">${exp.tag}</div>
      <div class="theory-title">${exp.icon || ''} ${exp.title}</div>
      <div class="theory-subtitle">${exp.desc || ''}</div>
      ${th.timeC ? `<div class="theory-complexity-strip" style="margin-top:20px;">
        <div class="tcs-item"><div class="tcs-label">Time Complexity</div><div class="tcs-val">${th.timeC}</div></div>
        <div class="tcs-item" style="border-left:1px solid #2a2a5a;"><div class="tcs-label">Space Complexity</div><div class="tcs-val">${th.spaceC}</div></div>
        ${th.io ? Object.entries(th.io).slice(0,2).map(([k,v])=>`<div class="tcs-item" style="border-left:1px solid #2a2a5a;"><div class="tcs-label">${k}</div><div class="tcs-val" style="font-size:11px;">${v}</div></div>`).join('') : ''}
      </div>` : ''}
    `;

    // Theory body
    const body = document.getElementById('theory-body');
    body.innerHTML = '';

    if (th.paras && th.paras.length) {
      th.paras.forEach(p => {
        const card = document.createElement('div');
        card.className = 'theory-para-card';
        card.innerHTML = `<div class="theory-para-label">${p.label}</div><div class="theory-para-text">${p.text}</div>`;
        body.appendChild(card);
      });
    } else {
      const card = document.createElement('div');
      card.className = 'theory-para-card';
      card.innerHTML = `<div class="theory-para-label">01 // OVERVIEW</div><div class="theory-para-text">${exp.desc}</div>`;
      body.appendChild(card);
    }

    if (th.bullets && th.bullets.length) {
      const card = document.createElement('div');
      card.className = 'theory-para-card';
      card.innerHTML = `<div class="theory-para-label">KEY POINTS</div><ul class="theory-bullets">${th.bullets.map(b=>`<li class="theory-bullet">${b}</li>`).join('')}</ul>`;
      body.appendChild(card);
    }

    // Launch button
    document.getElementById('theory-launch-btn').onclick = () => launchVisualizer(exp, expId);
  }
  viewTransition(ox, oy, _buildTheory);
}

function launchVisualizer(exp, expId) {
  const ox = lastClickX, oy = lastClickY;
  viewTransition(ox, oy, () => {
    document.getElementById('theory-screen').style.display = 'none';
    document.getElementById('exp-screen').classList.add('active');
    document.getElementById('episteme-footer').style.display = 'none';
    switchExpTab('visual');
    csKillEngine();
    if (animFrame) cancelAnimationFrame(animFrame);
    canvas.onmousedown = null; canvas.onmousemove = null;
    canvas.onmouseup = null; canvas.onclick = null;
    EXPERIMENT_RUNNERS[expId]?.();
  });
}

document.getElementById('back-btn').addEventListener('click', goHome);

// Global lab state object for panel button callbacks
const LAB = {};

// ══════════════════════════════════════════════════════════
//  CS ANIMATION ENGINE — token-based rAF loop (shared by all branches)
// ══════════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════
//  CS ANIMATION ENGINE — token-based rAF loop
// ══════════════════════════════════════════════════════════
let csAnimState = null;
let _csToken = 0;

function csStartEngine(renderFn) {
  _csToken++;
  const myToken = _csToken;
  csAnimState = {
    running: true,
    msPerStep: 120,
    onTick: null,
    _lastTime: 0,
    _acc: 0,
  };
  const state = csAnimState;
  function loop(ts) {
    if (myToken !== _csToken) return;   // stale token → abort
    requestAnimationFrame(loop);
    if (!state.running) return;
    const dt = ts - state._lastTime;
    state._lastTime = ts;
    state._acc += dt;
    if (state._acc >= state.msPerStep) {
      state._acc = 0;
      renderFn();
      if (state.onTick) {
        const done = state.onTick();
        if (done) { state.running = false; }
      }
    } else {
      renderFn();
    }
  }
  requestAnimationFrame(loop);
}

function csStopEngine() {
  if (csAnimState) csAnimState.running = false;
}

function csKillEngine() {
  _csToken++;          // invalidate any live loop
  csAnimState = null;
}

function csSetStep(msg) {
  const el = document.getElementById('cs-step');
  if (el) el.textContent = msg;
}

function csRightPanel(codeHtml, timeC, spaceC, desc, extraInfo) {
  _lastHLLine = null; // reset highlighter for new experiment
  const wrappedCode = wrapCodeLines(codeHtml);
  const playgroundBranches = ['bubble-sort','selection-sort','insertion-sort','merge-sort','quick-sort','heap-sort',
                        'n-queens','rat-in-maze','sudoku-solver',
                        'bfs','dfs','dijkstra',
                        'fibonacci-dp','lcs','knapsack',
                        'stack-ops','queue-ops',
                        'bst-ops','avl-tree','tree-traversal','red-black-tree',
                        'topo-sort','kruskal','prim','bellman-ford',
                        'kmp','rabin-karp','trie',
                        'binary-search','interpolation-search',
                        'activity-selection','huffman-coding',
                        'union-find',
                        'convex-hull','line-intersection','closest-pair','polygon-area',
                        'subset-bitmask','xor-tricks','power-of-two','bitwise-sieve',
                        'binary-addition','binary-subtraction','binary-multiplication','binary-division',
                        'binary-addition-gates','binary-subtraction-gates','binary-multiplication-gates','binary-division-gates',
                        'rsa','diffie-hellman','aes-round','caesar-vigenere','sha256',
                        'ddos-attack','sql-injection','firewall-filter','mitm-attack','zkp-cave'];
  const showPlayground = playgroundBranches.includes(currentExp);
  return `
    ${showPlayground ? `
    <div style="padding:0 0 14px 0;">
      <button onclick="launchPlaygroundHub()" style="
        width:100%;padding:14px 16px;border-radius:12px;
        background:linear-gradient(135deg,rgba(191,95,255,0.15),rgba(0,229,255,0.15),rgba(255,77,184,0.10));
        border:1px solid rgba(191,95,255,0.5);color:#bf5fff;
        font-family:'Orbitron',monospace;font-size:11px;font-weight:700;
        cursor:pointer;letter-spacing:0.1em;
        display:flex;align-items:center;justify-content:center;gap:10px;
        transition:all 0.25s;box-shadow:0 0 20px rgba(191,95,255,0.1);"
        onmouseover="this.style.background='linear-gradient(135deg,rgba(191,95,255,0.35),rgba(0,229,255,0.25),rgba(255,77,184,0.2))';this.style.boxShadow='0 0 30px rgba(191,95,255,0.3)';this.style.transform='translateY(-1px)'"
        onmouseout="this.style.background='linear-gradient(135deg,rgba(191,95,255,0.15),rgba(0,229,255,0.15),rgba(255,77,184,0.10))';this.style.boxShadow='0 0 20px rgba(191,95,255,0.1)';this.style.transform='none'">
        <span style="font-size:18px;">🚀</span>
        <span>PLAYGROUNDS</span>
        <span style="font-size:10px;opacity:0.7;font-family:'Space Mono',monospace;">QUIZ · GAME · PROBLEMS</span>
      </button>
    </div>` : ''}
    <div class="rp-step-card">
      <div class="rp-step-label">&gt; CURRENT_STEP</div>
      <div id="cs-step" style="color:var(--text);font-family:'Share Tech Mono',monospace;font-size:12px;line-height:1.6;">${desc}</div>
    </div>

    <div class="rp-card">
      <div class="rp-card-header" onclick="this.closest('.rp-card').classList.toggle('collapsed')">
        <span class="rp-card-title">&gt; COMPLEXITY</span>
        <span class="rp-card-chevron">▾</span>
      </div>
      <div class="rp-card-body">
        <div class="rp-complexity-row">
          <div class="rp-complexity-badge">
            <span class="rp-complexity-label">Time</span>
            <span class="rp-complexity-value">${timeC}</span>
          </div>
          <div class="rp-complexity-badge">
            <span class="rp-complexity-label">Space</span>
            <span class="rp-complexity-value">${spaceC}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="rp-card">
      <div class="rp-card-header" onclick="this.closest('.rp-card').classList.toggle('collapsed')">
        <span class="rp-card-title">&gt; C++ IMPLEMENTATION</span>
        <span class="rp-card-chevron">▾</span>
      </div>
      <div class="rp-card-body" style="padding:12px;">
        <pre class="cs-code-block">${wrappedCode}</pre>
      </div>
    </div>

    <div class="rp-card">
      <div class="rp-card-header" onclick="this.closest('.rp-card').classList.toggle('collapsed')">
        <span class="rp-card-title">&gt; NOTES</span>
        <span class="rp-card-chevron">▾</span>
      </div>
      <div class="rp-card-body">
        <div style="font-family:'Share Tech Mono',monospace;font-size:11px;color:var(--text2);line-height:1.7;">${desc}</div>
      </div>
    </div>

    ${extraInfo ? `<div class="rp-card"><div class="rp-card-header" onclick="this.closest('.rp-card').classList.toggle('collapsed')"><span class="rp-card-title">&gt; EXTRA INFO</span><span class="rp-card-chevron">▾</span></div><div class="rp-card-body">${extraInfo}</div></div>` : ''}
  `;
}

const canvas = document.getElementById('sim-canvas');
const ctx = canvas.getContext('2d');

function clearCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const isLight = document.body.classList.contains('light');
  ctx.fillStyle = isLight ? '#f5f7ff' : '#0a0a1a';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawGrid(alpha = 0.07) {
  ctx.save();
  const isLight = document.body.classList.contains('light');
  ctx.strokeStyle = `rgba(42,42,90,${alpha})`;
  ctx.lineWidth = 0.5;
  const step = 40;
  for (let x = 0; x <= canvas.width; x += step) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
  }
  for (let y = 0; y <= canvas.height; y += step) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
  }
  ctx.restore();
}

function arrow(x1,y1,x2,y2,color,width=1.5) {
  ctx.save();
  ctx.strokeStyle = color; ctx.fillStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
  const angle = Math.atan2(y2-y1, x2-x1);
  const al = 10;
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - al*Math.cos(angle-0.4), y2 - al*Math.sin(angle-0.4));
  ctx.lineTo(x2 - al*Math.cos(angle+0.4), y2 - al*Math.sin(angle+0.4));
  ctx.closePath(); ctx.fill();
  ctx.restore();
}

function label(text, x, y, color='#7a94b0', size=11) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.font = `${size}px "Space Mono", monospace`;
  ctx.fillText(text, x, y);
  ctx.restore();
}

function makeSlider(id, name, min, max, val, step, unit, onChange) {
  LAB['cb_'+id] = onChange;
  return `<div class="param-group">
    <div class="param-label">
      <span>${name}</span>
      <span class="param-value" id="v_${id}">${val} ${unit}</span>
    </div>
    <input type="range" class="param-slider" id="s_${id}" min="${min}" max="${max}" step="${step}" value="${val}"
      data-cbid="${id}" data-unit="${unit}">
  </div>`;
}

// Delegated slider handler
document.addEventListener('input', e => {
  const s = e.target.closest('[data-cbid]');
  if (!s) return;
  const id = s.dataset.cbid, unit = s.dataset.unit;
  const vEl = document.getElementById('v_'+id);
  if (vEl) vEl.textContent = s.value + ' ' + unit;
  if (LAB['cb_'+id]) LAB['cb_'+id](+s.value);
});


function buildLeftPanel(innerHtml) {
  const exp = EXPERIMENTS.find(e => e.id === currentExp) || { title: 'Algorithm', tag: '' };
  const lp = document.getElementById('left-panel');
  lp.innerHTML = `
    <div class="lp-header">&gt; CONTROLS</div>
    <div class="lp-exp-title">${exp.title}</div>
    <div class="lp-exp-tag">${exp.tag}</div>
    ${innerHtml}
  `;
}
function buildRightPanel(html) { document.getElementById('right-panel').innerHTML = html; }

// Mobile tab switching for experiment screen
function switchExpTab(tab) {
  const lp = document.getElementById('left-panel');
  const cp = document.getElementById('center-panel');
  const rp = document.getElementById('right-panel');
  [lp, cp, rp].forEach(el => el && el.classList.remove('tab-active'));
  document.querySelectorAll('.mobile-exp-tab').forEach(b => b.classList.remove('active'));
  if (tab === 'controls') {
    lp && lp.classList.add('tab-active');
    document.getElementById('mtab-controls').classList.add('active');
  } else if (tab === 'info') {
    rp && rp.classList.add('tab-active');
    document.getElementById('mtab-info').classList.add('active');
  } else {
    cp && cp.classList.add('tab-active');
    document.getElementById('mtab-visual').classList.add('active');
  }
}

function updateDataVal(id, val) {
  const el = document.getElementById('d_'+id);
  if (el) el.textContent = val;
}

// Mini graph helper
function drawMiniGraph(canvasId, xData, yData, color, xLabel, yLabel, title) {
  const c = document.getElementById(canvasId);
  if (!c) return;
  const gc = c.getContext('2d');
  const W = c.width, H = c.height;
  gc.clearRect(0,0,W,H);
  const isLightMG = document.body.classList.contains('light');
  gc.fillStyle = isLightMG ? '#1a1a38' : '#0a0a1a'; gc.fillRect(0,0,W,H);
  const pad = { l:36, r:10, t:20, b:28 };
  const pw = W - pad.l - pad.r, ph = H - pad.t - pad.b;

  // title
  gc.fillStyle = '#5050a0'; gc.font = '9px "Space Mono",monospace';
  gc.fillText(title, pad.l, 13);

  if (!xData || xData.length < 2) return;
  const xMin = Math.min(...xData), xMax = Math.max(...xData);
  const yMin = Math.min(...yData), yMax = Math.max(...yData);
  const xR = xMax - xMin || 1, yR = yMax - yMin || 1;

  const tx = x => pad.l + (x - xMin) / xR * pw;
  const ty = y => pad.t + ph - (y - yMin) / yR * ph;

  // Axes
  gc.strokeStyle = '#2a2a5a'; gc.lineWidth = 1;
  gc.beginPath(); gc.moveTo(pad.l, pad.t); gc.lineTo(pad.l, pad.t+ph); gc.lineTo(pad.l+pw, pad.t+ph); gc.stroke();

  // Labels
  gc.fillStyle = '#5050a0'; gc.font = '9px "Space Mono",monospace';
  gc.fillText(xLabel, pad.l+pw-20, pad.t+ph+20);
  gc.save(); gc.translate(12, pad.t+ph/2); gc.rotate(-Math.PI/2);
  gc.fillText(yLabel, -15, 0); gc.restore();

  // Ticks
  gc.fillStyle = '#3d5470'; gc.font = '8px "Space Mono",monospace';
  gc.fillText(xMin.toFixed(0), pad.l, pad.t+ph+16);
  gc.fillText(xMax.toFixed(0), pad.l+pw-16, pad.t+ph+16);
  gc.fillText(yMin.toFixed(1), pad.l-30, pad.t+ph);
  gc.fillText(yMax.toFixed(1), pad.l-30, pad.t+6);

  // Line
  gc.beginPath(); gc.strokeStyle = color; gc.lineWidth = 1.8;
  xData.forEach((x,i) => {
    i===0 ? gc.moveTo(tx(x), ty(yData[i])) : gc.lineTo(tx(x), ty(yData[i]));
  });
  gc.stroke();

  // Glow
  gc.beginPath(); gc.strokeStyle = color.replace(')',',0.2)').replace('rgb','rgba');
  gc.lineWidth = 5;
  xData.forEach((x,i) => {
    i===0 ? gc.moveTo(tx(x), ty(yData[i])) : gc.lineTo(tx(x), ty(yData[i]));
  });
  gc.stroke();
}

// Global data-action dispatcher
document.addEventListener('click', e => {
  const btn = e.target.closest('[data-action]');
  if (!btn) return;
  const action = btn.dataset.action;
  if (LAB[action]) LAB[action](btn);
});




//  THEORY DATA — per-experiment descriptions
// ══════════════════════════════════════════════════════
const THEORY_DB = {
  'bubble-sort': {
    paras: [
      { label:'01 // OVERVIEW', text:'Bubble Sort is the simplest comparison-based sorting algorithm. It repeatedly scans the array from left to right, comparing each pair of adjacent elements and swapping them if they are in the wrong order. After each complete pass, the largest unsorted element has "bubbled up" to its correct position at the right end of the unsorted portion.' },
      { label:'02 // HOW IT WORKS', text:'The algorithm runs n-1 outer passes over an array of size n. In pass i, it compares elements at indices 0 through n-i-1. An important optimization: if a complete pass makes zero swaps, the array is already sorted and the algorithm exits early — this makes best-case O(n) for already-sorted inputs.' },
      { label:'03 // INTUITION', text:'Think of heavier bubbles sinking and lighter ones rising to the surface. Each pass guarantees one more element reaches its final sorted position. The algorithm is stable — equal elements never swap, so relative ordering of duplicates is preserved.' },
    ],
    bullets: ['Best case O(n) with early-exit optimization','Stable sort — preserves relative order of equal elements','In-place — requires only O(1) extra memory','Rarely used in practice due to O(n²) average case'],
    timeC: 'O(n²)', spaceC: 'O(1)',
    io: { Input:'Unsorted integer array', Output:'Array sorted in ascending order', Stable:'Yes', InPlace:'Yes' }
  },
  'selection-sort': {
    paras: [
      { label:'01 // OVERVIEW', text:'Selection Sort divides the array into a sorted portion (left) and an unsorted portion (right). In each pass, it scans the unsorted portion to find the minimum element and swaps it with the leftmost unsorted element. After n-1 passes, the array is fully sorted.' },
      { label:'02 // HOW IT WORKS', text:'The algorithm maintains a boundary index that moves right by one after each pass. For each boundary position i, it finds the index of the minimum element in array[i..n-1] and swaps array[i] with that minimum. The number of swaps is at most n-1, making it efficient when write operations are costly.' },
      { label:'03 // KEY PROPERTY', text:'Unlike Bubble Sort, Selection Sort always performs exactly O(n²) comparisons regardless of input — it does not benefit from partial sortedness. However, it minimizes the number of swaps (at most n-1), which is valuable when writes are expensive, such as sorting on flash memory.' },
    ],
    bullets: ['Always O(n²) — does not improve on sorted input','Minimizes swaps — at most n-1 writes to memory','Not stable — may change relative order of equal elements','In-place with O(1) extra space'],
    timeC: 'O(n²)', spaceC: 'O(1)',
    io: { Input:'Unsorted integer array', Output:'Array sorted in ascending order', Stable:'No', InPlace:'Yes' }
  },
  'insertion-sort': {
    paras: [
      { label:'01 // OVERVIEW', text:'Insertion Sort builds the sorted array one element at a time by inserting each new element into its correct position within the already-sorted left portion. It mirrors how people naturally sort playing cards in their hand.' },
      { label:'02 // HOW IT WORKS', text:'Starting from index 1, the algorithm picks the current element as a "key" and shifts all sorted elements that are greater than the key one position to the right, creating space to insert the key in its correct location. This continues until the key is placed correctly.' },
      { label:'03 // WHEN TO USE', text:'Insertion Sort is highly efficient for nearly-sorted data (O(n) in best case) and for small arrays (n < 20). It is online — it can sort a stream of data as it arrives. It is the algorithm used internally by TimSort (Python, Java) for small sub-arrays.' },
    ],
    bullets: ['O(n) best case on nearly-sorted input','Stable and in-place','Excellent for small or nearly-sorted arrays','Used as a subroutine in TimSort and IntroSort'],
    timeC: 'O(n²)', spaceC: 'O(1)',
    io: { Input:'Unsorted integer array', Output:'Sorted array', Stable:'Yes', InPlace:'Yes' }
  },
  'merge-sort': {
    paras: [
      { label:'01 // OVERVIEW', text:'Merge Sort is a divide-and-conquer algorithm that splits the array in half recursively until each sub-array has one element (trivially sorted), then merges adjacent sub-arrays back together in sorted order. It guarantees O(n log n) in all cases.' },
      { label:'02 // THE MERGE STEP', text:'The critical operation is merging two sorted halves. Two pointers scan each half simultaneously, always picking the smaller element and placing it into a temporary output array. This merge takes O(n) time and produces a sorted combined array.' },
      { label:'03 // TRADEOFFS', text:'Merge Sort requires O(n) extra space for the temporary arrays during merging, which is its main disadvantage. However, it is the preferred algorithm when stability is required or when sorting linked lists (where merging is O(1) extra space). It is the basis of external sorting algorithms used for massive datasets.' },
    ],
    bullets: ['Guaranteed O(n log n) — no worst-case degradation','Stable sort — preserves relative order of equal elements','Requires O(n) extra memory for auxiliary arrays','Ideal for external sorting and linked-list sorting'],
    timeC: 'O(n log n)', spaceC: 'O(n)',
    io: { Input:'Unsorted array', Output:'Sorted array', Stable:'Yes', InPlace:'No' }
  },
  'quick-sort': {
    paras: [
      { label:'01 // OVERVIEW', text:'Quick Sort selects a pivot element and partitions the array into two sub-arrays: elements less than the pivot and elements greater. It then recursively sorts each partition. With a good pivot choice, it achieves O(n log n) on average and is the fastest practical comparison-based sort.' },
      { label:'02 // PARTITION SCHEME', text:'The Lomuto partition scheme (used here) selects the last element as pivot, then walks two pointers through the array. When an element ≤ pivot is found, it is swapped to the left partition. Finally, the pivot is placed at the boundary. The Hoare scheme uses two inward-moving pointers and makes fewer swaps.' },
      { label:'03 // PIVOT SELECTION', text:'Worst case O(n²) occurs when the pivot is always the smallest or largest element (e.g., already-sorted input with last-element pivot). Randomized pivot selection or the median-of-three strategy virtually eliminates this risk in practice. Quick Sort is cache-friendly and typically 2-3× faster than Merge Sort in practice.' },
    ],
    bullets: ['Average O(n log n) — fastest practical sort in most cases','In-place — only O(log n) stack space for recursion','Not stable — equal elements may reorder','Worst case O(n²) avoided with randomized pivot'],
    timeC: 'O(n log n) avg', spaceC: 'O(log n)',
    io: { Input:'Unsorted array', Output:'Sorted array', Stable:'No', InPlace:'Yes' }
  },
  'heap-sort': {
    paras: [
      { label:'01 // OVERVIEW', text:'Heap Sort uses the max-heap data structure to sort in-place. It first builds a max-heap from the array (heapify), ensuring the largest element is at the root. It then repeatedly extracts the maximum by swapping it to the end and restoring the heap property on the remaining elements.' },
      { label:'02 // BUILD PHASE', text:"Building the heap takes O(n) time using Floyd's bottom-up heap construction — start from the last non-leaf node (n/2-1) and heapify downward. This is more efficient than inserting n elements one-by-one (which would take O(n log n))." },
      { label:'03 // EXTRACTION PHASE', text:"After building, n-1 extractions each take O(log n) (to re-heapify), giving O(n log n) total. Heap Sort guarantees O(n log n) worst-case with O(1) extra space — better than Merge Sort's space requirement. However, poor cache locality makes it ~2× slower than Quick Sort in practice." },
    ],
    bullets: ['Guaranteed O(n log n) with O(1) extra space','Not stable — relative order of equal elements may change','Poor cache performance compared to Quick Sort','Used in systems requiring guaranteed worst-case performance'],
    timeC: 'O(n log n)', spaceC: 'O(1)',
    io: { Input:'Unsorted array', Output:'Sorted array', Stable:'No', InPlace:'Yes' }
  },
  'n-queens': {
    paras: [
      { label:'01 // PROBLEM', text:'The N-Queens problem asks you to place N chess queens on an N×N board such that no two queens threaten each other — no two queens share the same row, column, or diagonal. It is a classic constraint satisfaction problem demonstrating backtracking.' },
      { label:'02 // BACKTRACKING STRATEGY', text:'The algorithm places queens row by row. For each row, it tries every column. If placing a queen at (row, col) is safe (no conflict with already-placed queens), it recurses to the next row. If no safe column exists, it backtracks to the previous row and tries the next column — systematically exploring all possibilities.' },
      { label:'03 // CONFLICT CHECK', text:'Checking safety requires: (1) no queen in the same column, (2) no queen on the same left diagonal (row-col = constant), (3) no queen on the same right diagonal (row+col = constant). Using sets for these three conditions makes each check O(1) instead of O(n).' },
      { label:'04 // SOLUTIONS', text:'For n=4 there are 2 solutions, for n=8 there are 92 solutions, for n=13 there are 73,712 solutions. The total search tree has O(n!) nodes but pruning reduces the actual work dramatically — the algorithm avoids exploring branches that are already invalid.' },
    ],
    bullets: ['Classic backtracking — try, check, backtrack','3 constraint sets: columns, left-diagonals, right-diagonals','O(N!) time worst case, much less with pruning','Fundamental to constraint satisfaction problems (CSP)'],
    timeC: 'O(N!)', spaceC: 'O(N)',
    io: { Input:'Board size N', Output:'All valid queen placements', Backtracking:'Yes', Solutions:'Varies by N' }
  },
  'sudoku-solver': {
    paras: [
      { label:'01 // PROBLEM', text:'Sudoku requires filling a 9×9 grid with digits 1-9 such that every row, column, and 3×3 box contains each digit exactly once. The recursive backtracking solver tries each valid digit in each empty cell, propagating constraints and backing up when contradictions arise.' },
      { label:'02 // ALGORITHM', text:'Find the first empty cell. Try placing digits 1-9. For each digit, check if it is valid in the current row, column, and 3×3 box. If valid, place it and recurse to the next empty cell. If no digit works, erase the current cell and return false (backtrack).' },
      { label:'03 // CONSTRAINT PROPAGATION', text:'Each placement reduces the search space. A well-placed constraint check eliminates branches early. The key insight: validity checking in O(1) using boolean arrays for each row, column, and box. With proper implementation, even hard Sudoku puzzles solve in microseconds.' },
    ],
    bullets: ['Backtracking with constraint propagation','O(9^81) theoretical worst case — practically instant','Checks row, column, and 3×3 box constraints','Foundation for constraint programming techniques'],
    timeC: 'O(9^81)', spaceC: 'O(1)',
    io: { Input:'Partially filled 9×9 grid', Output:'Completed valid grid', Backtracking:'Yes', Guaranteed:'Yes' }
  },
  'rat-in-maze': {
    paras: [
      { label:'01 // PROBLEM', text:'Given an N×N maze with blocked cells (1=open, 0=wall), find all paths from the top-left corner (0,0) to the bottom-right corner (N-1, N-1). The rat can move in four directions: Up, Down, Left, Right — but cannot visit a cell twice or enter a blocked cell.' },
      { label:'02 // BACKTRACKING', text:'The algorithm marks the current cell as visited and tries all four directions. For each valid neighboring cell (in-bounds, open, not visited), it recursively explores that path. When it reaches the destination, it records the solution. After returning from all recursive calls, it unmarks the cell (backtrack).' },
      { label:'03 // APPLICATIONS', text:'Rat-in-Maze is the foundational model for pathfinding in robotics, game AI, network routing, and GPS navigation. The backtracking approach finds all paths, while BFS finds the shortest path. In competitive programming, this pattern appears in flood-fill, island-counting, and reachability problems.' },
    ],
    bullets: ['Backtracking with visited-cell tracking','Finds ALL paths from source to destination','Mark cell as visited → explore → unmark (backtrack)','Models robot navigation and game pathfinding'],
    timeC: 'O(4^(N²))', spaceC: 'O(N²)',
    io: { Input:'N×N maze grid', Output:'All valid paths', Directions:'4 (U/D/L/R)', Backtracking:'Yes' }
  },
  'bfs': {
    paras: [
      { label:'01 // OVERVIEW', text:'Breadth-First Search (BFS) explores a graph level by level using a queue. Starting from a source node, it visits all immediate neighbors first, then their unvisited neighbors, and so on. This layered exploration guarantees that the first time a node is reached, it is via the shortest path (in an unweighted graph).' },
      { label:'02 // ALGORITHM', text:'Initialize a queue with the source node (marked visited). While the queue is non-empty: dequeue a node u, process it, then enqueue all unvisited neighbors of u (marking them visited). The distance to each node equals the BFS level at which it was first discovered.' },
      { label:'03 // APPLICATIONS', text:'BFS is the core of shortest-path finding in unweighted graphs, web crawlers (exploring pages level by level), social network "degrees of separation", peer-to-peer network protocols, and solving sliding puzzles optimally. Its O(V+E) complexity makes it practical for very large graphs.' },
    ],
    bullets: ['Finds shortest path in unweighted graphs','Explores level by level using a FIFO queue','O(V+E) time and space complexity','Applications: shortest paths, web crawlers, social networks'],
    timeC: 'O(V+E)', spaceC: 'O(V)',
    io: { Input:'Graph + source node', Output:'BFS order + distances', Queue:'FIFO', ShortestPath:'Yes (unweighted)' }
  },
  'dfs': {
    paras: [
      { label:'01 // OVERVIEW', text:'Depth-First Search (DFS) explores a graph by going as deep as possible along each branch before backtracking. It uses a stack (either explicitly or through recursion) and is the foundation for cycle detection, topological sorting, strongly connected components, and maze generation.' },
      { label:'02 // ALGORITHM', text:'From the source, mark it visited and recursively visit each unvisited neighbor. Backtrack when all neighbors have been visited. DFS produces a DFS tree that categorizes edges as: tree edges, back edges (to ancestor — indicates cycle), forward edges, and cross edges.' },
      { label:'03 // APPLICATIONS', text:"DFS underpins Tarjan's algorithm for strongly connected components, Kosaraju's algorithm, topological sorting (reverse post-order), generating spanning trees, solving mazes, and detecting cycles in directed and undirected graphs. It is also the basis of recursive parsing in compilers." },
    ],
    bullets: ['Explores as deep as possible before backtracking','Uses a stack (recursive or explicit)','Detects back edges → indicates cycles','Applications: topological sort, SCCs, maze solving'],
    timeC: 'O(V+E)', spaceC: 'O(V)',
    io: { Input:'Graph + source node', Output:'DFS traversal order', Stack:'Implicit/Explicit', CycleDetect:'Yes' }
  },
  'dijkstra': {
    paras: [
      { label:'01 // OVERVIEW', text:"Dijkstra's algorithm finds the shortest path from a single source to all other vertices in a weighted graph with non-negative edge weights. It is a greedy algorithm — at each step, it processes the unvisited vertex with the smallest known distance from the source." },
      { label:'02 // ALGORITHM', text:'Initialize dist[source]=0, dist[all others]=∞. Use a priority queue (min-heap) keyed by distance. While the queue is non-empty: extract the minimum-distance vertex u, then for each neighbor v: if dist[u] + weight(u,v) < dist[v], update dist[v] and add (dist[v], v) to the queue.' },
      { label:'03 // WHY NON-NEGATIVE WEIGHTS', text:"Dijkstra fails with negative edge weights because once a vertex is extracted from the priority queue, its distance is finalized — but a negative edge could later provide a shorter path. For negative weights, use Bellman-Ford. Dijkstra with a Fibonacci heap achieves O(E + V log V) — the fastest known single-source shortest path algorithm for sparse graphs." },
    ],
    bullets:["Greedy: always processes the closest unvisited node","Requires non-negative edge weights","O((V+E) log V) with a binary heap priority queue","Powers GPS navigation and network routing protocols"],
    timeC: 'O((V+E)log V)', spaceC: 'O(V)',
    io: { Input:'Weighted graph + source', Output:'Shortest distances from source', Negative:'Not supported', DataStruct:'Min-heap' }
  },
  'fibonacci-dp': {
    paras: [
      { label:'01 // OVERVIEW', text:'The naive recursive Fibonacci has exponential time O(2^n) due to redundant recomputation of the same subproblems. Dynamic Programming eliminates this by storing solutions to subproblems — either top-down (memoization) or bottom-up (tabulation) — reducing time to O(n).' },
      { label:'02 // MEMOIZATION VS TABULATION', text:'Memoization (top-down): add a cache to the recursive function. Check the cache before computing; store results after. Tabulation (bottom-up): fill a DP table iteratively from base cases F(0)=0, F(1)=1, computing F(i)=F(i-1)+F(i-2). Tabulation avoids recursion overhead.' },
      { label:'03 // DP PRINCIPLES', text:'Fibonacci is the "Hello World" of dynamic programming. The two core DP properties it demonstrates: (1) Optimal substructure — F(n) is completely defined by F(n-1) and F(n-2). (2) Overlapping subproblems — F(5) requires F(4) and F(3), and F(4) also requires F(3) — so F(3) would be computed twice without memoization.' },
    ],
    bullets:['Naive recursion: O(2^n) — DP reduces to O(n)','Two approaches: memoization (top-down) vs tabulation (bottom-up)','Demonstrates optimal substructure + overlapping subproblems','Space can be further reduced to O(1) using two variables'],
    timeC: 'O(n)', spaceC: 'O(n)',
    io: { Input:'Integer n', Output:'nth Fibonacci number', Memoization:'Yes', BaseCase:'F(0)=0, F(1)=1' }
  },
  'lcs': {
    paras: [
      { label:'01 // OVERVIEW', text:'The Longest Common Subsequence (LCS) problem finds the longest sequence that is a subsequence of both given strings (characters need not be contiguous). LCS is fundamental to diff tools, DNA sequence alignment, spell checkers, and plagiarism detection.' },
      { label:'02 // DP RECURRENCE', text:'Let dp[i][j] = LCS length of str1[0..i-1] and str2[0..j-1]. If str1[i-1] == str2[j-1]: dp[i][j] = dp[i-1][j-1] + 1. Otherwise: dp[i][j] = max(dp[i-1][j], dp[i][j-1]). Base case: dp[i][0] = dp[0][j] = 0. Fill the table row by row in O(mn) time.' },
      { label:'03 // TRACEBACK', text:'After filling the DP table, trace back from dp[m][n] to reconstruct the actual subsequence: if characters match at (i,j), include that character and move diagonally. Otherwise, move in the direction of the larger value. This gives the actual LCS string, not just its length.' },
    ],
    bullets:['O(mn) time and space for strings of length m and n','2D DP table filled row by row','Traceback reconstructs the actual subsequence','Applications: diff/patch tools, DNA alignment, plagiarism detection'],
    timeC: 'O(m×n)', spaceC: 'O(m×n)',
    io: { Input:'Two strings', Output:'Length + LCS string', Contiguous:'No', Traceback:'Yes' }
  },
  'knapsack': {
    paras: [
      { label:'01 // OVERVIEW', text:'The 0/1 Knapsack problem: given n items each with a weight and value, and a knapsack of capacity W, find the maximum value you can carry. Each item is either taken (1) or left (0) — it cannot be split. This is an NP-complete problem solved exactly in pseudo-polynomial time by DP.' },
      { label:'02 // DP RECURRENCE', text:'dp[i][w] = maximum value using items 1..i with capacity w. For item i: if weight[i] > w, cannot include it: dp[i][w] = dp[i-1][w]. Otherwise: dp[i][w] = max(dp[i-1][w], dp[i-1][w-weight[i]] + value[i]). Fill an (n+1)×(W+1) table.' },
      { label:'03 // ITEM SELECTION', text:'To find which items are selected, trace back the DP table: if dp[i][w] ≠ dp[i-1][w], item i was included — record it, subtract its weight, move to row i-1. This greedy traceback correctly identifies the optimal subset. Applications: resource allocation, portfolio optimization, bin packing.' },
    ],
    bullets:['NP-complete — DP gives pseudo-polynomial O(nW) solution','2D table: rows=items, columns=capacities 0..W','Traceback identifies the optimal item set','Applications: resource scheduling, cutting stock, portfolio optimization'],
    timeC: 'O(n×W)', spaceC: 'O(n×W)',
    io: { Input:'Items (weight,value), capacity W', Output:'Max value + items selected', Fractional:'No', Traceback:'Yes' }
  },
  'stack-ops': {
    paras: [
      { label:'01 // OVERVIEW', text:'A Stack is a linear data structure following Last-In First-Out (LIFO) order. The last element pushed is the first to be popped. Stacks are implemented as arrays or linked lists and support three core operations: Push (add to top), Pop (remove from top), and Peek (view top without removing).' },
      { label:'02 // APPLICATIONS', text:'Stacks are ubiquitous: function call management (the call stack), expression evaluation (postfix/infix), undo/redo in text editors, browser back navigation, DFS traversal, balanced parentheses checking, and converting expressions between infix, postfix, and prefix notation.' },
      { label:'03 // IMPLEMENTATION', text:'Array-based stacks use a top pointer that increments on push and decrements on pop — O(1) for all operations. Linked-list stacks insert/delete at the head — also O(1). Overflow occurs when the array is full; underflow when popping from an empty stack. Dynamic arrays amortize to O(1) push.' },
    ],
    bullets:['LIFO: Last In, First Out','Push, Pop, Peek — all O(1)','Used for function calls, expression parsing, DFS','Overflow: push to full stack; Underflow: pop from empty'],
    timeC: 'O(1) per op', spaceC: 'O(n)',
    io: { Input:'Push/Pop operations', Output:'Stack state after each op', Order:'LIFO', Overflow:'When full' }
  },
  'queue-ops': {
    paras: [
      { label:'01 // OVERVIEW', text:'A Queue is a linear data structure following First-In First-Out (FIFO) order. The first element enqueued is the first to be dequeued. Queues model real-world lines: print queues, CPU scheduling, network packet buffers, and BFS graph traversal.' },
      { label:'02 // CIRCULAR QUEUE', text:'A naive array queue wastes space as the front advances. A circular queue reuses positions by treating the array as a ring: front = (front+1) % capacity, rear = (rear+1) % capacity. This achieves O(1) enqueue and dequeue without shifting elements.' },
      { label:'03 // VARIANTS', text:'Priority Queue: elements dequeued by priority, not insertion order (implemented with a heap). Deque (double-ended queue): insertion and removal at both ends. Monotonic Queue: maintains elements in monotonically increasing/decreasing order — used in sliding window maximum problems.' },
    ],
    bullets:['FIFO: First In, First Out','Enqueue at rear, Dequeue from front — O(1)','Circular array avoids wasted space','Applications: BFS, CPU scheduling, buffering, producer-consumer'],
    timeC: 'O(1) per op', spaceC: 'O(n)',
    io: { Input:'Enqueue/Dequeue operations', Output:'Queue state after each op', Order:'FIFO', Variant:'Circular' }
  },
  'bst-ops': {
    paras: [
      { label:'01 // OVERVIEW', text:"A Binary Search Tree (BST) is a binary tree where every node's left subtree contains only values less than the node, and every right subtree contains only values greater. This ordering property enables O(log n) average-case search, insertion, and deletion." },
      { label:'02 // OPERATIONS', text:'Search: compare with current node, recurse left if target < node, right if target > node. Insert: recurse like search until a null child is found. Delete: three cases — (1) leaf: simply remove, (2) one child: replace with child, (3) two children: replace value with in-order successor (minimum of right subtree) and delete that successor.' },
      { label:'03 // DEGRADATION', text:'A BST degrades to O(n) when insertions are sorted, creating a linked-list-like structure. Balanced BSTs (AVL, Red-Black) automatically rebalance to maintain O(log n). An in-order traversal of a BST visits nodes in sorted order — making BST the basis of sorted maps (std::map in C++).' },
    ],
    bullets:["Left < Node < Right invariant",'O(log n) average; O(n) worst case (degenerate)','In-order traversal gives sorted sequence','Self-balancing variants (AVL, Red-Black) guarantee O(log n)'],
    timeC: 'O(h)', spaceC: 'O(n)',
    io: { Input:'Values to insert/search/delete', Output:'BST structure', Balanced:'No (basic BST)', InOrder:'Sorted output' }
  },
  'avl-tree': {
    paras: [
      { label:'01 // OVERVIEW', text:'AVL (Adelson-Velsky and Landis) trees are self-balancing BSTs where the balance factor (height of left subtree - height of right subtree) of every node is always -1, 0, or +1. This guarantees O(log n) for all operations regardless of insertion order.' },
      { label:'02 // ROTATIONS', text:'When an insertion violates the balance property, the tree performs rotations: LL rotation (single right rotation), RR rotation (single left rotation), LR rotation (left on child, then right on parent), RL rotation (right on child, then left on parent). Each rotation is O(1) and restores balance.' },
      { label:'03 // BALANCE FACTOR', text:'After every insertion, balance factors are recalculated up the path to the root. The height of an AVL tree with n nodes is at most 1.44 log₂(n) — much better than an unbalanced BST. AVL trees are used in databases and language runtime environments where guaranteed log-time lookups are critical.' },
    ],
    bullets:['Balance factor = height(left) - height(right) ∈ {-1,0,1}','4 rotation types: LL, RR, LR, RL','O(log n) guaranteed for all operations','Height ≤ 1.44 log₂(n) — strictly balanced'],
    timeC: 'O(log n)', spaceC: 'O(n)',
    io: { Input:'Values to insert', Output:'Balanced AVL tree', RotationTypes:'LL, RR, LR, RL', MaxHeight:'1.44 log₂(n)' }
  },
  'red-black-tree': {
    paras: [
      { label:'01 // OVERVIEW', text:'Red-Black trees are self-balancing BSTs with an extra color bit per node (Red or Black). Five properties must hold: (1) Root is Black, (2) Leaves (NULL) are Black, (3) Red nodes have only Black children, (4) All paths from any node to its NULL descendants have the same number of Black nodes.' },
      { label:'02 // REBALANCING', text:'After insertion (new node is Red), three cases arise based on uncle color. Case 1 (uncle Red): recolor parent and uncle Black, grandparent Red, move up. Case 2/3 (uncle Black): perform rotations and recolor. The algorithm propagates at most O(log n) levels up the tree.' },
      { label:'03 // VS AVL', text:"Red-Black trees are slightly less balanced than AVL (height up to 2 log n vs AVL's 1.44 log n), but require fewer rotations on insertion and deletion. This makes them preferred for frequent insertions (e.g., std::map in C++, java.util.TreeMap, Linux kernel rbtree)." },
    ],
    bullets:['5 color properties maintain O(log n) balance','Faster insertions than AVL — fewer rotations','Powers C++ std::map, Java TreeMap, Linux kernel','Height ≤ 2 log₂(n+1)'],
    timeC: 'O(log n)', spaceC: 'O(n)',
    io: { Input:'Values to insert', Output:'Red-Black tree', Colors:'Red/Black', MaxHeight:'2 log₂(n+1)' }
  },
  'tree-traversal': {
    paras: [
      { label:'01 // OVERVIEW', text:'Tree traversal systematically visits every node in a binary tree exactly once. The four standard traversals differ in the order they visit the current node relative to its left and right subtrees: Inorder (Left-Root-Right), Preorder (Root-Left-Right), Postorder (Left-Right-Root), and Level Order (breadth-first).' },
      { label:'02 // INORDER & PREORDER', text:'Inorder traversal of a BST visits nodes in ascending sorted order — the fundamental property used in BST validation and sorted output. Preorder traversal visits the root first — used to create a copy of the tree, serialize tree structure, and generate prefix expressions.' },
      { label:'03 // POSTORDER & LEVEL ORDER', text:'Postorder traversal processes children before parents — used for safe tree deletion, computing directory sizes, and generating postfix expressions. Level Order (BFS on trees) visits nodes level by level — used for finding the minimum depth, printing level-by-level, and building heaps.' },
    ],
    bullets:['Inorder (L-Root-R): gives sorted output for BST','Preorder (Root-L-R): tree serialization/copy','Postorder (L-R-Root): deletion, postfix expressions','Level Order (BFS): shortest path, level-wise processing'],
    timeC: 'O(n)', spaceC: 'O(h)',
    io: { Input:'Binary tree', Output:'Node visit sequence', AllNodes:'Visited exactly once', Recursive:'Yes / Iterative' }
  },
  'topo-sort': {
    paras: [
      { label:'01 // OVERVIEW', text:'Topological Sort orders the vertices of a Directed Acyclic Graph (DAG) such that for every directed edge u→v, vertex u appears before v in the ordering. It is only possible for DAGs — a cycle makes topological ordering impossible.' },
      { label:"02 // KAHN'S ALGORITHM (BFS)", text:"Compute in-degrees of all vertices. Add all vertices with in-degree 0 to a queue. While the queue is non-empty: dequeue vertex u, add to result, decrement in-degrees of all u's neighbors — if any neighbor's in-degree becomes 0, enqueue it. If result size < V, a cycle exists." },
      { label:'03 // APPLICATIONS', text:'Topological sort is used in: build systems (make, gradle) to order compilation tasks, package managers (npm, pip) to resolve dependencies, course scheduling, spreadsheet cell evaluation, instruction scheduling in compilers, and event-driven simulation ordering.' },
    ],
    bullets:['Only valid for DAGs (Directed Acyclic Graphs)',"Kahn's: BFS-based using in-degree counting","DFS-based: reverse post-order gives topological order",'Applications: build systems, dependency resolution, scheduling'],
    timeC: 'O(V+E)', spaceC: 'O(V)',
    io: { Input:'DAG (Directed Acyclic Graph)', Output:'Topological ordering', CycleDetect:"Yes (by Kahn's)", Unique:'Only if all in-degrees unique' }
  },
  'kruskal': {
    paras: [
      { label:'01 // OVERVIEW', text:"Kruskal's algorithm builds a Minimum Spanning Tree (MST) — a subset of edges connecting all vertices with minimum total weight and no cycles. It works on any connected undirected weighted graph and produces the optimal spanning tree." },
      { label:'02 // ALGORITHM', text:'Sort all edges by weight. Process edges in ascending order: for each edge (u, v, w), use Union-Find to check if u and v are in the same connected component. If not, add the edge to the MST and union their components. Stop when MST has V-1 edges.' },
      { label:'03 // UNION-FIND', text:"The Union-Find (Disjoint Set Union) data structure makes cycle detection O(α(V)) per operation — effectively O(1). Path compression and union by rank ensure near-constant time. The overall algorithm is dominated by sorting: O(E log E). Kruskal's is preferred for sparse graphs." },
    ],
    bullets:["Greedy: always pick cheapest safe edge","Uses Union-Find for O(α(V)) cycle detection","Sort edges: O(E log E) — dominates runtime","Preferred for sparse graphs (E << V²)"],
    timeC: 'O(E log E)', spaceC: 'O(V)',
    io: { Input:'Weighted undirected graph', Output:'MST edges + total weight', CyclePrevention:'Union-Find', EdgesSorted:'By weight ascending' }
  },
  'prim': {
    paras: [
      { label:'01 // OVERVIEW', text:"Prim's algorithm builds a Minimum Spanning Tree by growing it from a starting vertex. It maintains a frontier (the cut) between vertices in the MST and those outside, always adding the minimum-weight edge crossing the frontier." },
      { label:'02 // ALGORITHM', text:'Initialize: key[0]=0, key[all others]=∞. Use a min-priority queue. While queue is non-empty: extract minimum key vertex u, add to MST. For each neighbor v of u: if v is not in MST and edge weight < key[v], update key[v] and set parent[v] = u.' },
      { label:'03 // VS KRUSKAL', text:"Prim's is better for dense graphs (E ≈ V²) while Kruskal's suits sparse graphs. With a Fibonacci heap, Prim's runs in O(E + V log V). Prim's grows a single connected tree; Kruskal's may work with a forest that merges at the end. Both produce valid MSTs." },
    ],
    bullets:["Grows MST from a single seed vertex","Min-heap ensures cheapest crossing edge is always selected","O((V+E) log V) with binary heap","Better for dense graphs vs Kruskal's"],
    timeC: 'O((V+E)log V)', spaceC: 'O(V)',
    io: { Input:'Weighted undirected graph', Output:'MST', StartVertex:'Any', DataStruct:'Min priority queue' }
  },
  'bellman-ford': {
    paras: [
      { label:'01 // OVERVIEW', text:'Bellman-Ford finds shortest paths from a single source to all vertices, even when negative edge weights are present. Unlike Dijkstra, it handles negative weights correctly and can detect negative cycles (a cycle whose total weight is negative — makes shortest path undefined).' },
      { label:'02 // ALGORITHM', text:'Initialize dist[source]=0, dist[all others]=∞. Repeat V-1 times: for each edge (u,v,w), if dist[u]+w < dist[v], update dist[v]. After V-1 iterations, all shortest paths are found (since no shortest path has more than V-1 edges in a graph without negative cycles).' },
      { label:'03 // NEGATIVE CYCLE DETECTION', text:'After V-1 relaxation passes, do one more pass. If any edge can still be relaxed (dist[u]+w < dist[v]), a negative cycle exists and reachable from the source. Bellman-Ford is used in routing protocols (RIP protocol) and currency arbitrage detection.' },
    ],
    bullets:['Handles negative edge weights — Dijkstra cannot','Detects negative cycles with one extra pass','O(V·E) — slower than Dijkstra for non-negative weights','Used in RIP protocol and arbitrage detection'],
    timeC: 'O(V·E)', spaceC: 'O(V)',
    io: { Input:'Weighted directed graph + source', Output:'Shortest distances', NegativeWeights:'Supported', NegativeCycle:'Detected' }
  },
  'kmp': {
    paras: [
      { label:'01 // OVERVIEW', text:'The Knuth-Morris-Pratt (KMP) algorithm finds all occurrences of a pattern string P in a text string T in O(n+m) time — without ever re-examining already-matched characters. It achieves this by precomputing a "failure function" (LPS array) that encodes how to skip ahead after a mismatch.' },
      { label:'02 // LPS TABLE', text:'The LPS (Longest Proper Prefix which is also a Suffix) array for pattern P stores at each position i the length of the longest proper prefix of P[0..i] that is also a suffix. During mismatch at position j in P, instead of restarting from P[0], jump to P[LPS[j-1]] — skipping already-matched characters.' },
      { label:'03 // WHY O(n+m)', text:"The main scan pointer i (into text T) never moves backward. The pattern pointer j moves forward with matches and backward (via LPS) on mismatch — but j's total backward movement cannot exceed its total forward movement. So the total number of pointer moves is O(n+m)." },
    ],
    bullets:['O(n+m) — never re-examines matched characters','LPS table built in O(m) time and space','Works correctly for patterns with repeating substrings','Applications: text editors, DNA matching, network intrusion detection'],
    timeC: 'O(n+m)', spaceC: 'O(m)',
    io: { Input:'Text T, Pattern P', Output:'All match positions', LPSBuild:'O(m)', MainSearch:'O(n)' }
  },
  'rabin-karp': {
    paras: [
      { label:'01 // OVERVIEW', text:'Rabin-Karp uses hashing to find pattern P in text T. Instead of comparing P character-by-character with every window in T, it computes a hash of each window and only does character-level comparison when hashes match. Rolling hash makes each window computation O(1).' },
      { label:'02 // ROLLING HASH', text:'The rolling hash removes the leftmost character and adds the rightmost in O(1): new_hash = (d * (old_hash - T[i] * h) + T[i+m]) % q, where d is the alphabet size, q is a prime, and h = d^(m-1) % q. This avoids recomputing the entire hash for each of the n-m+1 windows.' },
      { label:'03 // SPURIOUS HITS', text:'When hashes match, a character-by-character verification confirms the actual match — this handles hash collisions (spurious hits). With a good prime q and uniform input, spurious hits are rare. Rabin-Karp excels at multi-pattern search: precompute hashes for k patterns and check each window against all k in O(k) time.' },
    ],
    bullets:['Rolling hash: O(1) per window shift','O(n+m) average — O(nm) worst (many hash collisions)','Spurious hits require character-level verification','Excellent for multi-pattern search'],
    timeC: 'O(n+m) avg', spaceC: 'O(m)',
    io: { Input:'Text T, Pattern P', Output:'Match positions', HashCollision:'Possible (verified)', BestFor:'Multi-pattern search' }
  },
  'trie': {
    paras: [
      { label:'01 // OVERVIEW', text:'A Trie (prefix tree) is a tree data structure where each path from root to a node represents a prefix of one or more stored strings. Nodes are shared among strings with common prefixes, making the Trie space-efficient for large vocabularies with common prefixes.' },
      { label:'02 // OPERATIONS', text:"Insert word w: traverse from root, character by character. If a node for character c does not exist, create it. Mark the last node as a word-end. Search: traverse character by character — if any character's node is missing, return false. Starts-with (prefix search): same as search but check any prefix." },
      { label:'03 // APPLICATIONS', text:'Tries power autocomplete in search engines and IDE code completion, spell checkers, IP routing tables (longest prefix match), word games (Boggle, Scrabble AI), and contact lookup. A compressed Trie (Patricia tree) merges chains of single-child nodes to reduce space.' },
    ],
    bullets:['O(m) insert and search — m = word length','Shared prefixes save memory for large dictionaries','Supports prefix queries that BSTs cannot','Applications: autocomplete, spell check, IP routing'],
    timeC: 'O(m) per op', spaceC: 'O(ALPHABET × n)',
    io: { Input:'Words to insert/search', Output:'Prefix tree structure', PrefixSearch:'O(m)', AlphabetSize:'26 (a-z)' }
  },
  'binary-search': {
    paras: [
      { label:'01 // OVERVIEW', text:'Binary Search finds a target value in a sorted array by repeatedly halving the search space. If the target equals the middle element, return its index. If target < middle, search the left half. If target > middle, search the right half. This halving makes it O(log n).' },
      { label:'02 // BOUNDARY CONDITIONS', text:'The trickiest part of binary search is getting boundaries right. Always use mid = lo + (hi - lo) / 2 instead of (lo + hi) / 2 to avoid integer overflow. The loop condition lo ≤ hi (not lo < hi) ensures the single-element case is handled. Binary search has many variants for finding first/last occurrence of duplicates.' },
      { label:'03 // BEYOND SIMPLE SEARCH', text:'Binary search applies to any monotone function: find the first/last position satisfying a condition, compute integer square roots, find minimum in rotated sorted array, find peak element. This "binary search on answer" technique is powerful in competitive programming.' },
    ],
    bullets:['O(log n) — halves search space each step','Requires sorted input','Use lo+(hi-lo)/2 to avoid integer overflow','Generalized: binary search on any monotone predicate'],
    timeC: 'O(log n)', spaceC: 'O(1)',
    io: { Input:'Sorted array + target', Output:'Index or -1', Prerequisite:'Sorted array', Iterations:'⌈log₂(n)⌉' }
  },


  // ── Machine Learning ──
  'linear-regression': {
    paras: [
      { label:'01 // MODEL', text:'Linear regression fits a line y = wx + b to data by minimising Mean Squared Error: MSE = (1/n)Σ(yᵢ − ŷᵢ)². The parameters w (slope) and b (intercept) are learned iteratively using gradient descent rather than the closed-form normal equation, making it scalable to large datasets.' },
      { label:'02 // GRADIENT DESCENT', text:'At each step, compute the partial derivatives ∂MSE/∂w and ∂MSE/∂b, then update: w ← w − α·∂MSE/∂w and b ← b − α·∂MSE/∂b, where α is the learning rate. Too large an α causes divergence; too small causes slow convergence. The loss curve should decrease monotonically for a convex loss like MSE.' },
      { label:'03 // EXTENSIONS', text:'Polynomial regression adds features x², x³,… allowing curved fits while keeping the linear algebra. Ridge (L2) and Lasso (L1) regularisation add penalty terms to the loss to prevent overfitting. Stochastic gradient descent (SGD) updates on one sample at a time; mini-batch GD uses small batches for a balance of speed and stability.' },
    ],
    bullets:['Model: ŷ = wx + b','Loss: MSE = mean((y − ŷ)²)','Update: w -= α·∂L/∂w  b -= α·∂L/∂b','Converges for convex loss with appropriate α'],
    timeC:'O(n·epochs)', spaceC:'O(1)',
    io:{ Input:'(x,y) data points', Output:'w, b parameters', Loss:'MSE (convex)', Convergence:'Guaranteed for convex + proper α' }
  },
  'knn': {
    paras: [
      { label:'01 // ALGORITHM', text:'KNN stores all training examples and defers computation to prediction time. To classify a new point: (1) Compute distance to every training point (Euclidean, Manhattan, or Minkowski). (2) Select the k nearest neighbours. (3) Return the majority class. There is no training phase — KNN is a lazy learner.' },
      { label:'02 // DECISION BOUNDARY', text:'The decision boundary of KNN is piecewise linear (Voronoi-like). As k increases, the boundary smooths and bias increases while variance decreases. k=1 perfectly memorises training data (high variance). k=n always predicts the majority class (high bias). Optimal k is found via cross-validation.' },
      { label:'03 // COMPLEXITY', text:'Naive KNN prediction costs O(n·d) per query (n training points, d features). KD-trees and ball trees reduce average complexity to O(d log n). For high-dimensional data (d > 20), these structures degrade and approximate nearest-neighbour methods (Annoy, FAISS) become necessary.' },
    ],
    bullets:['No training phase — lazy learner','Prediction: O(n·d) naive, O(d log n) with KD-tree','k controls bias-variance tradeoff','Sensitive to feature scaling — always normalise'],
    timeC:'O(n·d) per query', spaceC:'O(n·d)',
    io:{ Training:'Store all examples (no fit)', Prediction:'k nearest by distance', BoundaryType:'Piecewise linear (Voronoi)', BestK:'Via cross-validation' }
  },
  'kmeans': {
    paras: [
      { label:'01 // ALGORITHM', text:'K-Means partitions n points into k clusters by alternating two steps: (E) Assign each point to the nearest centroid by Euclidean distance. (M) Recompute each centroid as the mean of its assigned points. Repeat until assignments stop changing. Convergence is guaranteed but may reach a local optimum.' },
      { label:'02 // INITIALISATION', text:'Random initialisation can lead to poor local minima. K-Means++ selects the first centroid randomly, then picks each subsequent centroid with probability proportional to its squared distance from the nearest chosen centroid. This spreads initial centroids and improves final clustering quality significantly.' },
      { label:'03 // CHOOSING K', text:'The elbow method plots inertia (sum of squared distances to nearest centroid) vs k — look for the "elbow" where adding more clusters gives diminishing returns. The silhouette score measures how similar each point is to its own cluster vs others, ranging from -1 (wrong cluster) to +1 (well-clustered).' },
    ],
    bullets:['Alternates E-step (assign) and M-step (update centroids)','Converges to local minimum — run multiple times','K-Means++ for better initialisation','Assumes spherical clusters of similar size'],
    timeC:'O(k·n·d·iters)', spaceC:'O(k·d + n)',
    io:{ Input:'n points in d dimensions', Output:'k cluster labels + centroids', Convergence:'Local minimum guaranteed', Weakness:'Assumes spherical clusters' }
  },
  'decision-tree': {
    paras: [
      { label:'01 // SPLITTING', text:'A decision tree recursively splits data using the feature and threshold that maximises information gain: IG = H(parent) − Σ(|child|/|parent|)·H(child), where H is entropy: H = −Σpᵢlog₂pᵢ. Gini impurity (1 − Σpᵢ²) is an alternative that is computationally cheaper. Each internal node is a binary question; each leaf is a class prediction.' },
      { label:'02 // OVERFITTING', text:'Unpruned trees overfit by memorising training data. Pre-pruning stops splitting when gain falls below a threshold or tree depth exceeds a limit. Post-pruning builds the full tree then removes branches that do not improve validation accuracy. Minimum samples per leaf is the simplest practical regularisation.' },
      { label:'03 // ENSEMBLES', text:'Random Forests train many trees on random data subsets and feature subsets, then average predictions — dramatically reducing variance. Gradient Boosted Trees train sequentially, each tree correcting residuals of the previous — reducing bias. XGBoost and LightGBM are the dominant implementations in competitive ML.' },
    ],
    bullets:['Split criterion: information gain or Gini impurity','Greedy recursive splitting — not globally optimal','Prone to overfit — control depth or min-samples','Foundation of Random Forest and Gradient Boosting'],
    timeC:'O(n·d·log n) build', spaceC:'O(n)',
    io:{ Split:'Max information gain / min Gini', Depth:'Controls model complexity', Pruning:'Pre or post to prevent overfit', Ensemble:'RF and GBT for better performance' }
  },
  'perceptron': {
    paras: [
      { label:'01 // MODEL', text:'The perceptron (Rosenblatt, 1958) computes ŷ = sign(w·x + b). The activation is 1 if the dot product is positive, −1 otherwise. It classifies inputs by which side of the decision hyperplane w·x + b = 0 they fall on. This is the simplest possible neural network — one neuron, one layer.' },
      { label:'02 // LEARNING RULE', text:'For each misclassified example (x, y): update w ← w + α·y·x and b ← b + α·y. This nudges the hyperplane toward the misclassified point. The Perceptron Convergence Theorem guarantees convergence in a finite number of steps if the data is linearly separable. If not separable, the algorithm cycles forever.' },
      { label:'03 // LIMITATIONS & LEGACY', text:'The perceptron cannot solve XOR (Minsky & Papert, 1969) — a fact that temporarily halted neural network research. Multilayer perceptrons (MLP) with hidden layers and non-linear activations overcome this. The perceptron update rule is the foundation of backpropagation: the gradient of binary cross-entropy with a step activation.' },
    ],
    bullets:['Decision boundary: hyperplane w·x + b = 0','Update on misclassified: w += α·y·x','Convergence guaranteed iff linearly separable','Cannot solve XOR — need hidden layers'],
    timeC:'O(n·epochs)', spaceC:'O(d)',
    io:{ Activation:'sign(w·x + b)', Update:'w += α·y·x on error', Guarantee:'Converges if linearly separable', Legacy:'Foundation of all neural networks' }
  },
  // ── Binary Arithmetic ──
  'binary-addition': {
    paras: [
      { label:'01 // OVERVIEW', text:'Binary addition works column-by-column from LSB to MSB, just like decimal addition but with only two digits (0 and 1). The key rules: 0+0=0, 0+1=1, 1+0=1, 1+1=10 (write 0, carry 1), 1+1+1=11 (write 1, carry 1). A full adder circuit computes the sum and carry for one bit position.' },
      { label:'02 // FULL ADDER LOGIC', text:'A Full Adder has three inputs: A, B, and Cin (carry-in). It produces two outputs: Sum = A XOR B XOR Cin, and Cout = (A AND B) OR (Cin AND (A XOR B)). This can be built from two half-adders and one OR gate. An n-bit ripple carry adder chains n full adders, passing carry from each stage to the next.' },
      { label:'03 // HARDWARE', text:'The ripple carry adder is simple but slow — carry must propagate through all n stages. Carry-lookahead adders (CLA) precompute carry signals in parallel using generate (G=A AND B) and propagate (P=A XOR B) signals, reducing critical path to O(log n). Modern CPUs use carry-save adders in multipliers and Kogge-Stone prefix adders.' },
    ],
    bullets:['Sum = A XOR B XOR Cin; Carry = majority(A,B,Cin)','Ripple carry: O(n) latency, simple hardware','Carry lookahead: O(log n) latency using G/P signals','Half-adder: no Cin; Full-adder: includes Cin'],
    timeC: 'O(n) bits', spaceC: 'O(n)',
    io: { Input:'Two n-bit binary numbers', Output:'Sum + carry-out', Circuit:'Ripple-carry full adders', Overflow:'Check carry-out' }
  },
  'binary-subtraction': {
    paras: [
      { label:"01 // 2'S COMPLEMENT", text:"2s complement is the standard way to represent negative integers in binary. To negate a number: (1) flip all bits (1s complement), then (2) add 1. A subtraction A − B is performed as A + (−B) = A + (2s complement of B). This eliminates the need for a separate subtraction circuit — the same adder handles both addition and subtraction." },
      { label:'02 // BORROW METHOD', text:'The direct borrow method works like decimal subtraction: when a bit cannot be subtracted (0−1), borrow 1 from the next higher bit. Borrowing propagates: if the next bit is also 0, the borrow cascades further. While intuitive, the 2s complement method is preferred in hardware because it reuses the adder circuit.' },
      { label:'03 // OVERFLOW DETECTION', text:'Overflow in signed arithmetic occurs when the result cannot be represented in n bits. For addition: overflow if two positives give a negative, or two negatives give a positive. Simple rule: overflow iff carry-in to MSB ≠ carry-out from MSB. For 2s complement subtraction, the same overflow detection applies after converting to addition.' },
    ],
    bullets:["2s complement: flip bits, add 1 — then use adder circuit","Borrow method: analogous to decimal subtraction","Overflow: Cin to MSB ≠ Cout from MSB","n-bit range: −2^(n−1) to +2^(n−1)−1"],
    timeC: 'O(n) bits', spaceC: 'O(n)',
    io: { Input:'Two n-bit signed numbers', Output:'Difference + overflow flag', Method:"2s complement + adder", Overflow:'Detected by carry comparison' }
  },
  'binary-multiplication': {
    paras: [
      { label:"01 // BOOTH'S ALGORITHM", text:"Booth's algorithm (1951) multiplies two signed 2s complement numbers efficiently. It examines pairs of bits in the multiplier Q and recodes them: 00 or 11 → no operation; 01 → add multiplicand M to accumulator; 10 → subtract M from accumulator. After each step, arithmetic right shift the combined register [A, Q, Q-1]." },
      { label:'02 // THE REGISTER TABLE', text:'Maintain three registers: A (accumulator, n+1 bits, initially 0), Q (multiplier, n bits), Q-1 (extra bit, initially 0). For each of n steps: examine the pair (Q0, Q-1) — the LSB of Q and the extra bit. Based on the pair: add M or subtract M to A, or do nothing. Then arithmetic right shift all of [A, Q, Q-1] together.' },
      { label:'03 // WHY IT IS EFFICIENT', text:"Booth's encoding exploits that a string of 1s in the multiplier (e.g., 0111100) can be represented as (10000-100) — only two operations instead of four. Modified Booth's (radix-4) examines 3 bits at a time, halving the number of partial products. This is the foundation of the multiply-accumulate (MAC) operation in all modern DSPs and CPUs." },
    ],
    bullets:["Handles signed 2s complement multiplication directly","Q0,Q-1 pair: 01→add M; 10→sub M; 00,11→shift only","Arithmetic right shift preserves sign bit","Modified Booth (radix-4): half as many partial products"],
    timeC: 'O(n) steps', spaceC: 'O(n)',
    io: { Input:'Two n-bit signed numbers M, Q', Output:'2n-bit product in [A,Q]', Steps:'n iterations', Shift:'Arithmetic right shift' }
  },
  'binary-division': {
    paras: [
      { label:'01 // RESTORING DIVISION', text:'The restoring division algorithm divides an n-bit dividend by an n-bit divisor to get an n-bit quotient and remainder. It mirrors binary long division: for each bit position, shift the partial remainder left, subtract the divisor, and check the sign. If the result is negative, restore by adding the divisor back (hence "restoring") and set quotient bit to 0; if positive, keep it and set quotient bit to 1.' },
      { label:'02 // THE ALGORITHM', text:'Initialize: A=0 (partial remainder), Q=dividend, M=divisor. For each of n steps: (1) Left-shift [A,Q] by 1. (2) Subtract M from A: A = A − M. (3) If A < 0 (MSB=1): restore A = A + M, set Q0 = 0. (4) If A ≥ 0: set Q0 = 1. After n steps: Q holds the quotient, A holds the remainder.' },
      { label:'03 // NON-RESTORING VARIANT', text:'Non-restoring division avoids the restore step by conditionally adding or subtracting M based on the current sign of A: if A ≥ 0, shift left and subtract M; if A < 0, shift left and add M. This reduces hardware by removing the restore adder. A final correction step may be needed if the remainder is negative at the end.' },
    ],
    bullets:['Shift-and-subtract mirrors binary long division','Restore step: add M back if A goes negative','Quotient bit: 1 if result ≥ 0, 0 if result < 0','Non-restoring: avoids restore, uses conditional add/sub'],
    timeC: 'O(n) steps', spaceC: 'O(n)',
    io: { Input:'n-bit dividend, n-bit divisor', Output:'Quotient + Remainder', Steps:'n iterations', Restoring:'Add back if negative' }
  },

  'binary-addition-gates': {
    paras: [
      { label:'01 // HALF ADDER', text:'A Half Adder adds two single bits with no carry-in. It needs two gates: XOR for the Sum bit (S = A ⊕ B) and AND for the Carry bit (C = A · B). It cannot handle an incoming carry, so it is only useful for the least-significant bit position.' },
      { label:'02 // FULL ADDER', text:'A Full Adder adds three bits: A, B, and Cin. It is built from two half-adders: HA1 computes (A ⊕ B) and (A · B). HA2 computes ((A ⊕ B) ⊕ Cin) = Sum and ((A ⊕ B) · Cin). The final Cout = (A · B) OR ((A ⊕ B) · Cin). Equivalently: Sum = A ⊕ B ⊕ Cin, Cout = majority(A, B, Cin).' },
      { label:'03 // RIPPLE CARRY', text:'An n-bit ripple carry adder chains n full adders. The Cout of bit i feeds the Cin of bit i+1. This is simple to build but the carry must ripple through all n stages — latency = O(n). Carry-lookahead adders precompute carries in parallel, achieving O(log n) latency using generate (G = A·B) and propagate (P = A⊕B) signals.' },
    ],
    bullets:['Sum = A ⊕ B ⊕ Cin (XOR chain)','Cout = (A·B) + (Cin·(A⊕B)) (majority)','Ripple carry: O(n) delay — simple, slow','CLA: O(log n) delay — uses G/P signals'],
    timeC:'O(n)', spaceC:'O(n)',
    io:{ Gates:'2 XOR + 2 AND + 1 OR per bit', Input:'A, B, Cin', Output:'Sum, Cout', Latency:'O(n) ripple' }
  },
  'binary-subtraction-gates': {
    paras: [
      { label:"01 // XOR AS INVERTER", text:"A XOR gate with one input tied to 1 acts as a programmable inverter: when control=1, output = NOT(input); when control=0, output = input. For 2s complement subtraction, the B inputs are fed through XOR gates with control=1 (to invert all bits), then the carry-in of the LSB is set to 1 (to add 1). This converts the adder into a subtractor with no extra hardware." },
      { label:'02 // ADD/SUB CIRCUIT', text:'A single n-bit adder/subtractor circuit uses n XOR gates on the B input, all controlled by a single Sub signal. When Sub=0: XORs pass B unchanged → adder. When Sub=1: XORs invert B and Sub feeds into Cin0 → computes A + (~B) + 1 = A − B. This is how every ALU in every processor performs both addition and subtraction.' },
      { label:'03 // OVERFLOW', text:'Overflow in signed arithmetic: V = Cn XOR Cn-1 (carry into MSB XOR carry out of MSB). An extra XOR gate detects overflow. For unsigned overflow, check Cn (carry out of MSB). The condition V=1 means the result exceeded the representable signed range [-2^(n-1), 2^(n-1)-1].' },
    ],
    bullets:['XOR with Sub=1: programmable bit inverter','Sub signal drives both XOR bank and Cin0','Single circuit: adder (Sub=0) or subtractor (Sub=1)','Overflow: V = Cout_MSB XOR Cin_MSB'],
    timeC:'O(n)', spaceC:'O(n)',
    io:{ Circuit:'n XOR + n Full Adders', Control:'Sub=0:add, Sub=1:sub', Overflow:'Extra XOR gate', Standard:'Used in every ALU' }
  },
  'binary-multiplication-gates': {
    paras: [
      { label:"01 // BOOTH DATAPATH", text:"Booth's hardware datapath consists of: (1) An n+1 bit accumulator register A (sign-extended). (2) An n-bit multiplier register Q. (3) A 1-bit extra register Q-1. (4) An adder/subtractor connected to A and M. (5) A combined arithmetic right-shift unit for [A, Q, Q-1]. The control unit examines (Q0, Q-1) each cycle to decide add, subtract, or nothing." },
      { label:'02 // CONTROL LOGIC', text:'The control logic is a simple 2-input decoder on (Q0, Q-1): 00 → no-op, 01 → A = A + M, 10 → A = A − M, 11 → no-op. A counter counts n iterations. After each iteration, an arithmetic right shift moves the MSB of A into Q(n-1), and Q0 into Q-1. The combined shift register is the critical path component.' },
      { label:'03 // MODIFIED BOOTH', text:"Modified Booth (radix-4) encoding examines 3 bits at a time: (Q_{2i+1}, Q_{2i}, Q_{2i-1}), producing partial products of {0, ±M, ±2M}. This halves the number of partial products from n to n/2, significantly reducing the adder tree depth. All modern CPUs use a variant of Modified Booth with a Wallace tree for the partial product summation." },
    ],
    bullets:['Registers: A (accum), Q (multiplier), Q-1 (extra)','Control: (Q0,Q-1) → add/sub/nop + arith shift','n iterations for n-bit numbers','Modified Booth: n/2 partial products with ±2M option'],
    timeC:'O(n) cycles', spaceC:'O(n)',
    io:{ Registers:'A, Q, Q-1, M', ControlInputs:'Q0 and Q-1', ShiftType:'Arithmetic right', Modified:'Radix-4, ±2M' }
  },
  'binary-division-gates': {
    paras: [
      { label:'01 // DIVIDER DATAPATH', text:'The restoring divider datapath contains: (1) A partial remainder register A (n bits). (2) A combined shift register [A, Q] for the dividend/quotient. (3) A subtractor for A − M. (4) A sign detector (MSB of subtraction result). (5) A MUX: if result ≥ 0, keep A = A−M and set Q0=1; if result < 0, restore A and set Q0=0. The MUX is the key hardware element.' },
      { label:'02 // NON-RESTORING', text:'Non-restoring division avoids the restore step. Instead: if A ≥ 0, left-shift and subtract M; if A < 0, left-shift and add M. The quotient bit is set accordingly. This requires only one add/subtract per cycle (not two on restore), but may need a final correction step. Non-restoring is used in most practical hardware because it avoids the extra adder cycle.' },
      { label:'03 // SRT DIVISION', text:'SRT (Sweeney-Robertson-Tocher) division uses a precomputed lookup table to select quotient digits from a set {-1, 0, 1} based on partial remainder and divisor estimates. It allows overlapped computation and is the basis for the dividers in Intel, ARM, and RISC-V processors. The Pentium FDIV bug (1994) was a flaw in an SRT lookup table.' },
    ],
    bullets:['Datapath: shift register + subtractor + sign MUX','Restoring: may need 2 operations per cycle (sub + restore)','Non-restoring: always 1 operation (add or sub)','SRT: quotient digits from {-1,0,1} via lookup table'],
    timeC:'O(n) cycles', spaceC:'O(n)',
    io:{ Registers:'A (remainder), Q (quotient)', KeyGate:'Sign detector MUX', NonRestoring:'1 op/cycle', SRT:'Used in modern CPUs' }
  },
  'interpolation-search': {
    paras: [
      { label:'01 // OVERVIEW', text:'Interpolation Search improves on Binary Search for uniformly distributed sorted arrays by estimating the probe position based on the value being sought: pos = lo + ((target - arr[lo]) * (hi - lo)) / (arr[hi] - arr[lo]). This probes near where the target actually is.' },
      { label:'02 // PERFORMANCE', text:"For uniformly distributed data, interpolation search achieves O(log log n) average comparisons — dramatically better than binary search's O(log n). For n = 1 million, binary search needs ~20 comparisons; interpolation search needs ~4. However, worst case is O(n) (sorted geometric sequence)." },
      { label:'03 // WHEN TO USE', text:'Interpolation search excels when values are uniformly distributed (e.g., names in a phone book, timestamps). It degrades for skewed distributions. In practice, it is less common due to implementation complexity and sensitivity to distribution assumptions.' },
    ],
    bullets:['O(log log n) average for uniform distribution','O(n) worst case — worse than binary search','Position estimated from value, not just midpoint','Best for uniformly distributed large datasets'],
    timeC: 'O(log log n) avg', spaceC: 'O(1)',
    io: { Input:'Sorted uniform array + target', Output:'Index or -1', Distribution:'Uniform ideal', WorstCase:'O(n)' }
  },
  'tower-of-hanoi': {
    paras: [
      { label:'01 // OVERVIEW', text:'Tower of Hanoi is a mathematical puzzle with three pegs and n disks of different sizes. The goal: move all disks from the source peg to the destination peg using an auxiliary peg, following the rule that a larger disk can never be placed on a smaller one.' },
      { label:'02 // RECURSIVE SOLUTION', text:'To move n disks from source to destination: (1) Move top n-1 disks from source to auxiliary (recursively). (2) Move the largest disk from source to destination. (3) Move n-1 disks from auxiliary to destination (recursively). This produces the optimal solution with exactly 2^n - 1 moves.' },
      { label:'03 // MATHEMATICAL INSIGHT', text:'The recursion tree has height n, and each level doubles the number of moves: T(n) = 2T(n-1) + 1, which solves to T(n) = 2^n - 1. For n=64 (legend says it marks the end of the world), that is 18,446,744,073,709,551,615 moves — at one move per second, about 585 billion years.' },
    ],
    bullets:['Minimum moves = 2^n - 1 (provably optimal)','Classic recursion: reduce to two subproblems of size n-1','Demonstrates exponential complexity of recursive problems','Models recursive call stack behavior visually'],
    timeC: 'O(2ⁿ)', spaceC: 'O(n)',
    io: { Input:'Number of disks n', Output:'Sequence of moves', MinMoves:'2^n - 1', Pegs:'3 (Source, Aux, Dest)' }
  },
  'permutations': {
    paras: [
      { label:'01 // OVERVIEW', text:'Permutation generation produces all possible orderings of a given set of elements. For n elements, there are n! permutations. The recursive approach fixes one element at each position by swapping it with each remaining element and recursing on the sub-array.' },
      { label:'02 // ALGORITHM', text:'To generate permutations of array[l..r]: for each index i from l to r, swap array[l] and array[i], recurse on array[l+1..r], then swap back (backtrack). When l == r, one complete permutation has been formed. The backtrack restores the array for the next choice.' },
      { label:'03 // APPLICATIONS', text:'Permutation generation is used in: solving combinatorial optimization problems by brute force, testing all possible orderings, generating test cases, solving anagram problems, and as the foundation for more advanced techniques like branch-and-bound and exact algorithms for NP-hard problems.' },
    ],
    bullets:['n! permutations for n elements','Recursive swap-and-recurse with backtracking','Time O(n!) — unavoidable for exhaustive generation','Foundation for combinatorial search and TSP brute force'],
    timeC: 'O(n!)', spaceC: 'O(n)',
    io: { Input:'Array of n elements', Output:'All n! permutations', Backtrack:'Yes', Duplicates:'Handled separately' }
  },
  'activity-selection': {
    paras: [
      { label:'01 // OVERVIEW', text:'The Activity Selection problem selects the maximum number of non-overlapping activities from a given set, where each activity has a start time and finish time. It is the canonical greedy algorithm problem — the greedy choice at each step leads to a globally optimal solution.' },
      { label:'02 // GREEDY PROOF', text:'Sort activities by finish time. Always select the activity that finishes earliest and does not conflict with the previously selected activity. Proof of optimality: if the greedy choice (earliest-finishing) is not in some optimal solution, we can always swap it with the chosen activity without reducing the count.' },
      { label:'03 // EXCHANGE ARGUMENT', text:"The correctness proof uses an exchange argument: suppose an optimal solution picks activity B instead of greedy's choice A (where A finishes ≤ B finishes). Then B can be replaced by A without conflicting with any other chosen activity — so the greedy choice is always safe." },
    ],
    bullets:['Greedy: sort by finish time, always pick earliest-finishing compatible','Exchange argument proves greedy optimality','O(n log n) for sorting, O(n) for greedy selection','Classic example where greedy works provably'],
    timeC: 'O(n log n)', spaceC: 'O(1)',
    io: { Input:'Activities with start/end times', Output:'Max non-overlapping set', Sorting:'By finish time', Greedy:'Yes — provably optimal' }
  },
  'huffman-coding': {
    paras: [
      { label:'01 // OVERVIEW', text:'Huffman Coding builds an optimal prefix-free variable-length encoding for a set of characters based on their frequencies. More frequent characters get shorter codes. The resulting code is optimal — no other prefix-free encoding produces smaller total encoded length.' },
      { label:'02 // BUILDING THE TREE', text:'Create a leaf node for each character with its frequency. Use a min-priority queue. Repeatedly extract the two nodes with the lowest frequency, create a new internal node with these as children (frequency = sum), and insert back. Repeat until one node remains — the Huffman tree root.' },
      { label:'03 // PREFIX-FREE PROPERTY', text:'Because codes correspond to root-to-leaf paths, no code is a prefix of another. This allows unambiguous decoding without delimiters. Huffman coding is used in JPEG, MP3, ZIP (DEFLATE), HTTP/2 (HPACK), and is the foundation of arithmetic coding and range coding.' },
    ],
    bullets:['Optimal prefix-free code — proven by greedy exchange','Frequent characters → shorter codes','Min-heap construction: O(n log n)','Used in JPEG, ZIP, MP3, HTTP/2 compression'],
    timeC: 'O(n log n)', spaceC: 'O(n)',
    io: { Input:'Characters + frequencies', Output:'Huffman codes + encoded bits', PrefixFree:'Yes', Optimal:'Provably optimal' }
  },
  'union-find': {
    paras: [
      { label:'01 // OVERVIEW', text:'Disjoint Set Union (DSU / Union-Find) maintains a collection of disjoint sets and supports two operations: Find (which set does element x belong to?) and Union (merge the sets containing x and y). With two optimizations — path compression and union by rank — each operation runs in O(α(n)) ≈ O(1).' },
      { label:'02 // PATH COMPRESSION', text:'During Find(x), after finding the root, update the parent of every node visited along the path to point directly to the root. This flattens the tree over time, making future finds faster. Without this, Find could take O(log n); with it, it approaches O(1) amortized.' },
      { label:'03 // UNION BY RANK', text:'When merging two sets, attach the shorter tree under the root of the taller tree (rank = upper bound on height). This prevents the tree from degenerating into a chain. Combined with path compression, the amortized complexity is O(α(n)) per operation, where α is the inverse Ackermann function — effectively constant for all practical inputs.' },
    ],
    bullets:["Path compression + union by rank → O(α(n)) ≈ O(1)","α(n) = inverse Ackermann — at most 4 for any real input","Powers Kruskal's MST and network connectivity queries","Used in image segmentation, percolation, and game grids"],
    timeC: 'O(α(n)) per op', spaceC: 'O(n)',
    io: { Input:'n elements + union/find operations', Output:'Component membership', PathCompression:'Yes', UnionByRank:'Yes' }
  },


  // ── Machine Learning ──
  'linear-regression': {
    paras: [
      { label:'01 // MODEL', text:'Linear regression fits a line y = wx + b to data by minimising Mean Squared Error: MSE = (1/n)Σ(yᵢ − ŷᵢ)². The parameters w (slope) and b (intercept) are learned iteratively using gradient descent rather than the closed-form normal equation, making it scalable to large datasets.' },
      { label:'02 // GRADIENT DESCENT', text:'At each step, compute the partial derivatives ∂MSE/∂w and ∂MSE/∂b, then update: w ← w − α·∂MSE/∂w and b ← b − α·∂MSE/∂b, where α is the learning rate. Too large an α causes divergence; too small causes slow convergence. The loss curve should decrease monotonically for a convex loss like MSE.' },
      { label:'03 // EXTENSIONS', text:'Polynomial regression adds features x², x³,… allowing curved fits while keeping the linear algebra. Ridge (L2) and Lasso (L1) regularisation add penalty terms to the loss to prevent overfitting. Stochastic gradient descent (SGD) updates on one sample at a time; mini-batch GD uses small batches for a balance of speed and stability.' },
    ],
    bullets:['Model: ŷ = wx + b','Loss: MSE = mean((y − ŷ)²)','Update: w -= α·∂L/∂w  b -= α·∂L/∂b','Converges for convex loss with appropriate α'],
    timeC:'O(n·epochs)', spaceC:'O(1)',
    io:{ Input:'(x,y) data points', Output:'w, b parameters', Loss:'MSE (convex)', Convergence:'Guaranteed for convex + proper α' }
  },
  'knn': {
    paras: [
      { label:'01 // ALGORITHM', text:'KNN stores all training examples and defers computation to prediction time. To classify a new point: (1) Compute distance to every training point (Euclidean, Manhattan, or Minkowski). (2) Select the k nearest neighbours. (3) Return the majority class. There is no training phase — KNN is a lazy learner.' },
      { label:'02 // DECISION BOUNDARY', text:'The decision boundary of KNN is piecewise linear (Voronoi-like). As k increases, the boundary smooths and bias increases while variance decreases. k=1 perfectly memorises training data (high variance). k=n always predicts the majority class (high bias). Optimal k is found via cross-validation.' },
      { label:'03 // COMPLEXITY', text:'Naive KNN prediction costs O(n·d) per query (n training points, d features). KD-trees and ball trees reduce average complexity to O(d log n). For high-dimensional data (d > 20), these structures degrade and approximate nearest-neighbour methods (Annoy, FAISS) become necessary.' },
    ],
    bullets:['No training phase — lazy learner','Prediction: O(n·d) naive, O(d log n) with KD-tree','k controls bias-variance tradeoff','Sensitive to feature scaling — always normalise'],
    timeC:'O(n·d) per query', spaceC:'O(n·d)',
    io:{ Training:'Store all examples (no fit)', Prediction:'k nearest by distance', BoundaryType:'Piecewise linear (Voronoi)', BestK:'Via cross-validation' }
  },
  'kmeans': {
    paras: [
      { label:'01 // ALGORITHM', text:'K-Means partitions n points into k clusters by alternating two steps: (E) Assign each point to the nearest centroid by Euclidean distance. (M) Recompute each centroid as the mean of its assigned points. Repeat until assignments stop changing. Convergence is guaranteed but may reach a local optimum.' },
      { label:'02 // INITIALISATION', text:'Random initialisation can lead to poor local minima. K-Means++ selects the first centroid randomly, then picks each subsequent centroid with probability proportional to its squared distance from the nearest chosen centroid. This spreads initial centroids and improves final clustering quality significantly.' },
      { label:'03 // CHOOSING K', text:'The elbow method plots inertia (sum of squared distances to nearest centroid) vs k — look for the "elbow" where adding more clusters gives diminishing returns. The silhouette score measures how similar each point is to its own cluster vs others, ranging from -1 (wrong cluster) to +1 (well-clustered).' },
    ],
    bullets:['Alternates E-step (assign) and M-step (update centroids)','Converges to local minimum — run multiple times','K-Means++ for better initialisation','Assumes spherical clusters of similar size'],
    timeC:'O(k·n·d·iters)', spaceC:'O(k·d + n)',
    io:{ Input:'n points in d dimensions', Output:'k cluster labels + centroids', Convergence:'Local minimum guaranteed', Weakness:'Assumes spherical clusters' }
  },
  'decision-tree': {
    paras: [
      { label:'01 // SPLITTING', text:'A decision tree recursively splits data using the feature and threshold that maximises information gain: IG = H(parent) − Σ(|child|/|parent|)·H(child), where H is entropy: H = −Σpᵢlog₂pᵢ. Gini impurity (1 − Σpᵢ²) is an alternative that is computationally cheaper. Each internal node is a binary question; each leaf is a class prediction.' },
      { label:'02 // OVERFITTING', text:'Unpruned trees overfit by memorising training data. Pre-pruning stops splitting when gain falls below a threshold or tree depth exceeds a limit. Post-pruning builds the full tree then removes branches that do not improve validation accuracy. Minimum samples per leaf is the simplest practical regularisation.' },
      { label:'03 // ENSEMBLES', text:'Random Forests train many trees on random data subsets and feature subsets, then average predictions — dramatically reducing variance. Gradient Boosted Trees train sequentially, each tree correcting residuals of the previous — reducing bias. XGBoost and LightGBM are the dominant implementations in competitive ML.' },
    ],
    bullets:['Split criterion: information gain or Gini impurity','Greedy recursive splitting — not globally optimal','Prone to overfit — control depth or min-samples','Foundation of Random Forest and Gradient Boosting'],
    timeC:'O(n·d·log n) build', spaceC:'O(n)',
    io:{ Split:'Max information gain / min Gini', Depth:'Controls model complexity', Pruning:'Pre or post to prevent overfit', Ensemble:'RF and GBT for better performance' }
  },
  'perceptron': {
    paras: [
      { label:'01 // MODEL', text:'The perceptron (Rosenblatt, 1958) computes ŷ = sign(w·x + b). The activation is 1 if the dot product is positive, −1 otherwise. It classifies inputs by which side of the decision hyperplane w·x + b = 0 they fall on. This is the simplest possible neural network — one neuron, one layer.' },
      { label:'02 // LEARNING RULE', text:'For each misclassified example (x, y): update w ← w + α·y·x and b ← b + α·y. This nudges the hyperplane toward the misclassified point. The Perceptron Convergence Theorem guarantees convergence in a finite number of steps if the data is linearly separable. If not separable, the algorithm cycles forever.' },
      { label:'03 // LIMITATIONS & LEGACY', text:'The perceptron cannot solve XOR (Minsky & Papert, 1969) — a fact that temporarily halted neural network research. Multilayer perceptrons (MLP) with hidden layers and non-linear activations overcome this. The perceptron update rule is the foundation of backpropagation: the gradient of binary cross-entropy with a step activation.' },
    ],
    bullets:['Decision boundary: hyperplane w·x + b = 0','Update on misclassified: w += α·y·x','Convergence guaranteed iff linearly separable','Cannot solve XOR — need hidden layers'],
    timeC:'O(n·epochs)', spaceC:'O(d)',
    io:{ Activation:'sign(w·x + b)', Update:'w += α·y·x on error', Guarantee:'Converges if linearly separable', Legacy:'Foundation of all neural networks' }
  },
  // ── Binary Arithmetic ──
  'binary-addition': {
    paras: [
      { label:'01 // OVERVIEW', text:'Binary addition works column-by-column from LSB to MSB, just like decimal addition but with only two digits (0 and 1). The key rules: 0+0=0, 0+1=1, 1+0=1, 1+1=10 (write 0, carry 1), 1+1+1=11 (write 1, carry 1). A full adder circuit computes the sum and carry for one bit position.' },
      { label:'02 // FULL ADDER LOGIC', text:'A Full Adder has three inputs: A, B, and Cin (carry-in). It produces two outputs: Sum = A XOR B XOR Cin, and Cout = (A AND B) OR (Cin AND (A XOR B)). This can be built from two half-adders and one OR gate. An n-bit ripple carry adder chains n full adders, passing carry from each stage to the next.' },
      { label:'03 // HARDWARE', text:'The ripple carry adder is simple but slow — carry must propagate through all n stages. Carry-lookahead adders (CLA) precompute carry signals in parallel using generate (G=A AND B) and propagate (P=A XOR B) signals, reducing critical path to O(log n). Modern CPUs use carry-save adders in multipliers and Kogge-Stone prefix adders.' },
    ],
    bullets:['Sum = A XOR B XOR Cin; Carry = majority(A,B,Cin)','Ripple carry: O(n) latency, simple hardware','Carry lookahead: O(log n) latency using G/P signals','Half-adder: no Cin; Full-adder: includes Cin'],
    timeC: 'O(n) bits', spaceC: 'O(n)',
    io: { Input:'Two n-bit binary numbers', Output:'Sum + carry-out', Circuit:'Ripple-carry full adders', Overflow:'Check carry-out' }
  },
  'binary-subtraction': {
    paras: [
      { label:"01 // 2'S COMPLEMENT", text:"2s complement is the standard way to represent negative integers in binary. To negate a number: (1) flip all bits (1s complement), then (2) add 1. A subtraction A − B is performed as A + (−B) = A + (2s complement of B). This eliminates the need for a separate subtraction circuit — the same adder handles both addition and subtraction." },
      { label:'02 // BORROW METHOD', text:'The direct borrow method works like decimal subtraction: when a bit cannot be subtracted (0−1), borrow 1 from the next higher bit. Borrowing propagates: if the next bit is also 0, the borrow cascades further. While intuitive, the 2s complement method is preferred in hardware because it reuses the adder circuit.' },
      { label:'03 // OVERFLOW DETECTION', text:'Overflow in signed arithmetic occurs when the result cannot be represented in n bits. For addition: overflow if two positives give a negative, or two negatives give a positive. Simple rule: overflow iff carry-in to MSB ≠ carry-out from MSB. For 2s complement subtraction, the same overflow detection applies after converting to addition.' },
    ],
    bullets:["2s complement: flip bits, add 1 — then use adder circuit","Borrow method: analogous to decimal subtraction","Overflow: Cin to MSB ≠ Cout from MSB","n-bit range: −2^(n−1) to +2^(n−1)−1"],
    timeC: 'O(n) bits', spaceC: 'O(n)',
    io: { Input:'Two n-bit signed numbers', Output:'Difference + overflow flag', Method:"2s complement + adder", Overflow:'Detected by carry comparison' }
  },
  'binary-multiplication': {
    paras: [
      { label:"01 // BOOTH'S ALGORITHM", text:"Booth's algorithm (1951) multiplies two signed 2s complement numbers efficiently. It examines pairs of bits in the multiplier Q and recodes them: 00 or 11 → no operation; 01 → add multiplicand M to accumulator; 10 → subtract M from accumulator. After each step, arithmetic right shift the combined register [A, Q, Q-1]." },
      { label:'02 // THE REGISTER TABLE', text:'Maintain three registers: A (accumulator, n+1 bits, initially 0), Q (multiplier, n bits), Q-1 (extra bit, initially 0). For each of n steps: examine the pair (Q0, Q-1) — the LSB of Q and the extra bit. Based on the pair: add M or subtract M to A, or do nothing. Then arithmetic right shift all of [A, Q, Q-1] together.' },
      { label:'03 // WHY IT IS EFFICIENT', text:"Booth's encoding exploits that a string of 1s in the multiplier (e.g., 0111100) can be represented as (10000-100) — only two operations instead of four. Modified Booth's (radix-4) examines 3 bits at a time, halving the number of partial products. This is the foundation of the multiply-accumulate (MAC) operation in all modern DSPs and CPUs." },
    ],
    bullets:["Handles signed 2s complement multiplication directly","Q0,Q-1 pair: 01→add M; 10→sub M; 00,11→shift only","Arithmetic right shift preserves sign bit","Modified Booth (radix-4): half as many partial products"],
    timeC: 'O(n) steps', spaceC: 'O(n)',
    io: { Input:'Two n-bit signed numbers M, Q', Output:'2n-bit product in [A,Q]', Steps:'n iterations', Shift:'Arithmetic right shift' }
  },
  'binary-division': {
    paras: [
      { label:'01 // RESTORING DIVISION', text:'The restoring division algorithm divides an n-bit dividend by an n-bit divisor to get an n-bit quotient and remainder. It mirrors binary long division: for each bit position, shift the partial remainder left, subtract the divisor, and check the sign. If the result is negative, restore by adding the divisor back (hence "restoring") and set quotient bit to 0; if positive, keep it and set quotient bit to 1.' },
      { label:'02 // THE ALGORITHM', text:'Initialize: A=0 (partial remainder), Q=dividend, M=divisor. For each of n steps: (1) Left-shift [A,Q] by 1. (2) Subtract M from A: A = A − M. (3) If A < 0 (MSB=1): restore A = A + M, set Q0 = 0. (4) If A ≥ 0: set Q0 = 1. After n steps: Q holds the quotient, A holds the remainder.' },
      { label:'03 // NON-RESTORING VARIANT', text:'Non-restoring division avoids the restore step by conditionally adding or subtracting M based on the current sign of A: if A ≥ 0, shift left and subtract M; if A < 0, shift left and add M. This reduces hardware by removing the restore adder. A final correction step may be needed if the remainder is negative at the end.' },
    ],
    bullets:['Shift-and-subtract mirrors binary long division','Restore step: add M back if A goes negative','Quotient bit: 1 if result ≥ 0, 0 if result < 0','Non-restoring: avoids restore, uses conditional add/sub'],
    timeC: 'O(n) steps', spaceC: 'O(n)',
    io: { Input:'n-bit dividend, n-bit divisor', Output:'Quotient + Remainder', Steps:'n iterations', Restoring:'Add back if negative' }
  },

  'binary-addition-gates': {
    paras: [
      { label:'01 // HALF ADDER', text:'A Half Adder adds two single bits with no carry-in. It needs two gates: XOR for the Sum bit (S = A ⊕ B) and AND for the Carry bit (C = A · B). It cannot handle an incoming carry, so it is only useful for the least-significant bit position.' },
      { label:'02 // FULL ADDER', text:'A Full Adder adds three bits: A, B, and Cin. It is built from two half-adders: HA1 computes (A ⊕ B) and (A · B). HA2 computes ((A ⊕ B) ⊕ Cin) = Sum and ((A ⊕ B) · Cin). The final Cout = (A · B) OR ((A ⊕ B) · Cin). Equivalently: Sum = A ⊕ B ⊕ Cin, Cout = majority(A, B, Cin).' },
      { label:'03 // RIPPLE CARRY', text:'An n-bit ripple carry adder chains n full adders. The Cout of bit i feeds the Cin of bit i+1. This is simple to build but the carry must ripple through all n stages — latency = O(n). Carry-lookahead adders precompute carries in parallel, achieving O(log n) latency using generate (G = A·B) and propagate (P = A⊕B) signals.' },
    ],
    bullets:['Sum = A ⊕ B ⊕ Cin (XOR chain)','Cout = (A·B) + (Cin·(A⊕B)) (majority)','Ripple carry: O(n) delay — simple, slow','CLA: O(log n) delay — uses G/P signals'],
    timeC:'O(n)', spaceC:'O(n)',
    io:{ Gates:'2 XOR + 2 AND + 1 OR per bit', Input:'A, B, Cin', Output:'Sum, Cout', Latency:'O(n) ripple' }
  },
  'binary-subtraction-gates': {
    paras: [
      { label:"01 // XOR AS INVERTER", text:"A XOR gate with one input tied to 1 acts as a programmable inverter: when control=1, output = NOT(input); when control=0, output = input. For 2s complement subtraction, the B inputs are fed through XOR gates with control=1 (to invert all bits), then the carry-in of the LSB is set to 1 (to add 1). This converts the adder into a subtractor with no extra hardware." },
      { label:'02 // ADD/SUB CIRCUIT', text:'A single n-bit adder/subtractor circuit uses n XOR gates on the B input, all controlled by a single Sub signal. When Sub=0: XORs pass B unchanged → adder. When Sub=1: XORs invert B and Sub feeds into Cin0 → computes A + (~B) + 1 = A − B. This is how every ALU in every processor performs both addition and subtraction.' },
      { label:'03 // OVERFLOW', text:'Overflow in signed arithmetic: V = Cn XOR Cn-1 (carry into MSB XOR carry out of MSB). An extra XOR gate detects overflow. For unsigned overflow, check Cn (carry out of MSB). The condition V=1 means the result exceeded the representable signed range [-2^(n-1), 2^(n-1)-1].' },
    ],
    bullets:['XOR with Sub=1: programmable bit inverter','Sub signal drives both XOR bank and Cin0','Single circuit: adder (Sub=0) or subtractor (Sub=1)','Overflow: V = Cout_MSB XOR Cin_MSB'],
    timeC:'O(n)', spaceC:'O(n)',
    io:{ Circuit:'n XOR + n Full Adders', Control:'Sub=0:add, Sub=1:sub', Overflow:'Extra XOR gate', Standard:'Used in every ALU' }
  },
  'binary-multiplication-gates': {
    paras: [
      { label:"01 // BOOTH DATAPATH", text:"Booth's hardware datapath consists of: (1) An n+1 bit accumulator register A (sign-extended). (2) An n-bit multiplier register Q. (3) A 1-bit extra register Q-1. (4) An adder/subtractor connected to A and M. (5) A combined arithmetic right-shift unit for [A, Q, Q-1]. The control unit examines (Q0, Q-1) each cycle to decide add, subtract, or nothing." },
      { label:'02 // CONTROL LOGIC', text:'The control logic is a simple 2-input decoder on (Q0, Q-1): 00 → no-op, 01 → A = A + M, 10 → A = A − M, 11 → no-op. A counter counts n iterations. After each iteration, an arithmetic right shift moves the MSB of A into Q(n-1), and Q0 into Q-1. The combined shift register is the critical path component.' },
      { label:'03 // MODIFIED BOOTH', text:"Modified Booth (radix-4) encoding examines 3 bits at a time: (Q_{2i+1}, Q_{2i}, Q_{2i-1}), producing partial products of {0, ±M, ±2M}. This halves the number of partial products from n to n/2, significantly reducing the adder tree depth. All modern CPUs use a variant of Modified Booth with a Wallace tree for the partial product summation." },
    ],
    bullets:['Registers: A (accum), Q (multiplier), Q-1 (extra)','Control: (Q0,Q-1) → add/sub/nop + arith shift','n iterations for n-bit numbers','Modified Booth: n/2 partial products with ±2M option'],
    timeC:'O(n) cycles', spaceC:'O(n)',
    io:{ Registers:'A, Q, Q-1, M', ControlInputs:'Q0 and Q-1', ShiftType:'Arithmetic right', Modified:'Radix-4, ±2M' }
  },
  'binary-division-gates': {
    paras: [
      { label:'01 // DIVIDER DATAPATH', text:'The restoring divider datapath contains: (1) A partial remainder register A (n bits). (2) A combined shift register [A, Q] for the dividend/quotient. (3) A subtractor for A − M. (4) A sign detector (MSB of subtraction result). (5) A MUX: if result ≥ 0, keep A = A−M and set Q0=1; if result < 0, restore A and set Q0=0. The MUX is the key hardware element.' },
      { label:'02 // NON-RESTORING', text:'Non-restoring division avoids the restore step. Instead: if A ≥ 0, left-shift and subtract M; if A < 0, left-shift and add M. The quotient bit is set accordingly. This requires only one add/subtract per cycle (not two on restore), but may need a final correction step. Non-restoring is used in most practical hardware because it avoids the extra adder cycle.' },
      { label:'03 // SRT DIVISION', text:'SRT (Sweeney-Robertson-Tocher) division uses a precomputed lookup table to select quotient digits from a set {-1, 0, 1} based on partial remainder and divisor estimates. It allows overlapped computation and is the basis for the dividers in Intel, ARM, and RISC-V processors. The Pentium FDIV bug (1994) was a flaw in an SRT lookup table.' },
    ],
    bullets:['Datapath: shift register + subtractor + sign MUX','Restoring: may need 2 operations per cycle (sub + restore)','Non-restoring: always 1 operation (add or sub)','SRT: quotient digits from {-1,0,1} via lookup table'],
    timeC:'O(n) cycles', spaceC:'O(n)',
    io:{ Registers:'A (remainder), Q (quotient)', KeyGate:'Sign detector MUX', NonRestoring:'1 op/cycle', SRT:'Used in modern CPUs' }
  },
  'interpolation-search': {
    paras: [{ label:'01 // OVERVIEW', text:'Interpolation search uses value-based position estimation to outperform binary search on uniformly distributed sorted data.' }],
    bullets: ['O(log log n) average for uniform data'],
    timeC: 'O(log log n)', spaceC: 'O(1)',
    io: {}
  },

  // ── Computational Geometry ──
  'convex-hull': {
    paras: [
      { label:'01 // OVERVIEW', text:'The Convex Hull of a set of points is the smallest convex polygon that encloses all the points. Visually, it is the shape formed by stretching a rubber band around all the points. Graham Scan solves this in O(n log n) time using a polar angle sort and a monotone stack.' },
      { label:'02 // GRAHAM SCAN', text:'Step 1: Find the bottommost point P0 (leftmost if tie). Step 2: Sort all other points by polar angle with respect to P0. Step 3: Process points in sorted order using a stack — pop the stack whenever making a right turn (clockwise orientation). Points remaining on the stack form the convex hull.' },
      { label:'03 // ORIENTATION TEST', text:'The key primitive is the cross product: given three points A, B, C, compute (B-A) × (C-A). If positive: counterclockwise (left turn). If negative: clockwise (right turn — discard). If zero: collinear. This O(1) test is the building block of all computational geometry algorithms.' },
    ],
    bullets:['O(n log n) time dominated by sorting phase','Uses polar angle sort + monotone stack','Cross-product orientation test determines left vs right turns','Applications: collision detection, robotics, GIS, path planning'],
    timeC: 'O(n log n)', spaceC: 'O(n)',
    io: { Input:'Set of 2D points', Output:'Convex hull vertices (CCW)', KeyOp:'Cross product test', Sort:'By polar angle' }
  },
  'line-intersection': {
    paras: [
      { label:'01 // OVERVIEW', text:'Given two line segments AB and CD, determine whether they intersect. The algorithm uses orientation tests: three points A, B, C are collinear, clockwise, or counterclockwise based on the sign of the cross product (B-A)×(C-A). Two segments intersect iff they properly cross or an endpoint lies on the other segment.' },
      { label:'02 // INTERSECTION TEST', text:'Segments AB and CD intersect iff: orientation(A,B,C) ≠ orientation(A,B,D) AND orientation(C,D,A) ≠ orientation(C,D,B). The first condition checks that C and D are on opposite sides of line AB; the second that A and B are on opposite sides of line CD. Handle collinear edge cases separately.' },
      { label:'03 // SWEEP LINE', text:'For n segments, a sweep-line (Bentley-Ottmann) algorithm finds all intersections in O((n+k) log n) where k is the number of intersections. A vertical sweep line moves left to right, maintaining active segments in a balanced BST ordered by y-coordinate, detecting inversions that indicate intersections.' },
    ],
    bullets:['Orientation test: sign of cross product (B-A)×(C-A)','Two segments intersect iff orientations differ on both sides','Collinear case: check if endpoint lies within segment bounds','Sweep-line: O((n+k) log n) for all intersections'],
    timeC: 'O(1) per pair', spaceC: 'O(1)',
    io: { Input:'Two line segments (4 points)', Output:'Intersects: Yes/No + Point', Method:'Orientation test', Collinear:'Handled separately' }
  },
  'closest-pair': {
    paras: [
      { label:'01 // OVERVIEW', text:'Given n points in a 2D plane, find the pair with the minimum Euclidean distance. Brute force is O(n²). The divide-and-conquer algorithm achieves O(n log n) by recursively splitting points, solving halves, and merging by considering only a narrow vertical strip around the dividing line.' },
      { label:'02 // ALGORITHM', text:'Sort points by x-coordinate. Recursively find closest pair in left half (d_L) and right half (d_R). Let d = min(d_L, d_R). Check points within a vertical strip of width 2d around the median. For each strip point, check at most 7 other points within distance d vertically — this is the key insight that keeps the merge step O(n).' },
      { label:'03 // STRIP ANALYSIS', text:'The 7-point bound comes from geometry: pack circles of radius d/2 around each point in the strip. At most 8 such circles fit in a d × 2d rectangle without overlapping, so any strip point has at most 7 neighbors to check. This transforms an apparent O(n²) step into O(n).' },
    ],
    bullets:['O(n log n) vs brute-force O(n²)','Divide: split by median x, conquer each half separately','Strip check: only 7 candidates per point in the 2d-wide strip','Classic divide-and-conquer with a geometric proof'],
    timeC: 'O(n log n)', spaceC: 'O(n)',
    io: { Input:'Set of n 2D points', Output:'Closest pair + distance', Strip:'Width 2d around median', MaxCheck:'7 per strip point' }
  },
  'polygon-area': {
    paras: [
      { label:'01 // OVERVIEW', text:"The Shoelace Formula (Gauss's area formula) computes the area of any simple polygon given its vertices in order. For polygon with vertices (x0,y0)...(xn-1,yn-1), the signed area = ½|Σ(xᵢ·yᵢ₊₁ - xᵢ₊₁·yᵢ)|. Positive for CCW vertices, negative for CW." },
      { label:'02 // DERIVATION', text:'The formula can be derived by summing trapezoid areas between each edge and the x-axis. Each edge from (xᵢ,yᵢ) to (xᵢ₊₁,yᵢ₊₁) contributes (xᵢ₊₁-xᵢ)(yᵢ+yᵢ₊₁)/2. After cancellation, this reduces to the compact Shoelace form. It works for any non-self-intersecting polygon, convex or concave.' },
      { label:'03 // APPLICATIONS', text:'The Shoelace formula is a staple of competitive programming for computing polygon areas, checking point-in-polygon via signed areas, computing the area of irregular survey regions, and in Pick&#39;s theorem (A = I + B/2 - 1) to count interior lattice points. O(n) time for n vertices — as fast as theoretically possible.' },
    ],
    bullets:["Area = ½|Σ(xᵢ·yᵢ₊₁ - xᵢ₊₁·yᵢ)| for i=0..n-1","Works for any simple (non-self-intersecting) polygon","Signed area: positive=CCW vertices, negative=CW","O(n) — linear in the number of vertices"],
    timeC: 'O(n)', spaceC: 'O(1)',
    io: { Input:'Polygon vertices in order', Output:'Area (signed + absolute)', Convex:'Not required', Complexity:'O(n)' }
  },

  // ── Bit Manipulation ──
  'subset-bitmask': {
    paras: [
      { label:'01 // OVERVIEW', text:'Given a set of n elements, there are exactly 2^n subsets. Using integers 0 to 2^n-1 as bitmasks, each bit position i represents whether element i is in the subset. Bit i is set (1) if element i is included, clear (0) if excluded. This gives a compact, cache-friendly representation of all subsets.' },
      { label:'02 // ENUMERATION', text:'To enumerate all subsets: for mask in range(0, 1<<n): the subset corresponding to mask contains element i iff (mask >> i) & 1 == 1. To iterate over all set bits of a mask: while mask != 0 { bit = mask & (-mask); process(bit); mask ^= bit; }. The trick mask & (-mask) isolates the lowest set bit.' },
      { label:'03 // DP OVER SUBSETS', text:'Bitmask DP solves problems like TSP (Traveling Salesman) in O(2^n × n²) instead of O(n!). State: dp[mask][i] = min cost to visit all cities in mask, ending at city i. Transition: dp[mask | (1<<j)][j] = min(dp[mask][i] + dist[i][j]). Used in assignment problems, SOS DP, and competitive programming classics.' },
    ],
    bullets:['2^n subsets of n elements via integers 0..2^n-1','Bit i set ↔ element i in subset','mask & (-mask): isolates lowest set bit','Bitmask DP: TSP in O(2^n · n²) — vs O(n!) brute force'],
    timeC: 'O(2^n)', spaceC: 'O(1) per subset',
    io: { Input:'Set of n elements', Output:'All 2^n subsets', KeyOp:'Bitwise AND, shift', Application:'DP over subsets, TSP' }
  },
  'xor-tricks': {
    paras: [
      { label:'01 // XOR PROPERTIES', text:'XOR (⊕) is commutative, associative, and self-inverse: x ⊕ x = 0, x ⊕ 0 = x. These properties enable elegant solutions: XOR of all elements where every element appears twice except one gives the lone element in O(n) time and O(1) space. This solves the "single number" problem without sorting or hashing.' },
      { label:'02 // CLASSIC TRICKS', text:'Find missing number: XOR of 1..n with all array elements. Swap without temp: a^=b; b^=a; a^=b;. Detect if two integers have opposite signs: (a^b) < 0. Turn off lowest set bit: n &= (n-1). Count set bits (Brian Kernighan): while(n) { count++; n &= n-1; }. These are battle-tested competitive programming weapons.' },
      { label:'03 // XOR IN ALGORITHMS', text:'XOR is used in: bit-reversal for FFT butterfly operations, Gray code generation (n ^ (n>>1) converts integer to Gray code), CRC checksums and error detection, XOR-linked lists (store prev^next in one field), linear algebra over GF(2) (the Gaussian elimination basis), and finding the XOR basis of a set of numbers for max XOR queries.' },
    ],
    bullets:['a ⊕ a = 0 and a ⊕ 0 = a — XOR is self-inverse','Find single non-duplicate: XOR all elements → O(n), O(1)','n &= (n-1): removes lowest set bit in O(1)','XOR basis: foundation for max-XOR and linear GF(2) problems'],
    timeC: 'O(n) typical', spaceC: 'O(1)',
    io: { Input:'Array or integer n', Output:'Single number / missing / max XOR', KeyProp:'Self-inverse', Applications:'SSND, swap, Gray code, CRC' }
  },
  'power-of-two': {
    paras: [
      { label:'01 // THE BIT TRICK', text:'A positive integer n is a power of 2 iff it has exactly one set bit. The elegant check: (n & (n-1)) == 0 (and n > 0). Why? If n = 2^k, its binary is 100...0 (k zeros). Then n-1 = 011...1. Their AND is zero. For any non-power-of-two, n and n-1 share at least one set bit, so AND is non-zero.' },
      { label:'02 // RELATED BIT PATTERNS', text:'Counting set bits (popcount): Brian Kernighan method runs in O(k) where k = number of set bits. Hardware __builtin_popcount() does it in O(1). Isolate lowest set bit: n & (-n). Clear lowest set bit: n & (n-1). Get highest set bit: 1 << (31 - __builtin_clz(n)). These O(1) operations are fundamental to bitset algorithms.' },
      { label:'03 // APPLICATIONS', text:'Power-of-two detection is used in: hash table size validation (capacity must be power of 2 for fast modulo via bitwise AND), memory allocators (buddy system allocates power-of-2 blocks), FFT (radix-2 requires n to be a power of 2), graphics (texture dimensions for MIP-mapping), and checking alignment in systems programming.' },
    ],
    bullets:['n is power of 2 iff n > 0 and (n & (n-1)) == 0','n & (n-1) clears the lowest set bit','n & (-n) isolates the lowest set bit','Used in hash tables, FFT, memory allocators, texture mapping'],
    timeC: 'O(1)', spaceC: 'O(1)',
    io: { Input:'Integer n', Output:'Is power of 2: Yes/No', Trick:'n & (n-1) == 0', RelatedOps:'Count bits, isolate/clear lowest' }
  },
  'bitwise-sieve': {
    paras: [
      { label:'01 // OVERVIEW', text:'The Sieve of Eratosthenes finds all primes up to N in O(N log log N) time. The bitwise variant uses a bit array instead of a boolean array — storing 8 numbers per byte instead of 1. For N = 10^8, a boolean array needs 100 MB; the bitwise sieve needs only 12.5 MB — an 8× memory reduction.' },
      { label:'02 // IMPLEMENTATION', text:'Use an integer array where bit j of word i represents number (i*32 + j). Set bit = composite, clear bit = prime. To mark k as composite: sieve[k/32] |= (1 << (k%32)). To check if k is prime: !(sieve[k/32] >> (k%32) & 1). Start: mark all even numbers in one loop, then sieve odd numbers up to sqrt(N).' },
      { label:'03 // PERFORMANCE', text:'The bitwise sieve fits in L3 cache for larger N values, dramatically improving speed due to cache locality. Segmented sieve processes the range in blocks of size sqrt(N), keeping the working set in L1 cache. For competitive programming, a bitwise segmented sieve can enumerate primes up to 10^9 in under 2 seconds.' },
    ],
    bullets:["8× memory reduction vs boolean array sieve","O(N log log N) time — same asymptotic as standard sieve","Bit j of word i → number (32i + j)","Segmented variant: L1-cache-friendly, handles N up to 10^9"],
    timeC: 'O(N log log N)', spaceC: 'O(N/8) bytes',
    io: { Input:'Upper bound N', Output:'All primes ≤ N', Memory:'N/8 bytes (vs N bytes)', Segmented:'Yes, for large N' }
  },
  // ── Cryptography ──
  'rsa': {
    paras: [
      { label:'01 // KEY GENERATION', text:'RSA key generation: (1) pick two large primes p and q; (2) compute n = p·q (the modulus) and φ(n) = (p−1)(q−1); (3) choose public exponent e coprime to φ(n), typically 65537; (4) compute private key d = e⁻¹ mod φ(n) via extended Euclidean algorithm. Public key is (e, n); private key is (d, n). Security rests on the hardness of factoring n.' },
      { label:'02 // ENCRYPTION & DECRYPTION', text:'Encryption: C = Mᵉ mod n. Decryption: M = Cᵈ mod n. This works because eᵈ ≡ 1 (mod φ(n)), so Cᵈ = Mᵉᵈ ≡ M (mod n) by Euler\'s theorem. Modular exponentiation uses repeated squaring: computing Mᵉ mod n requires O(log e) multiplications rather than e multiplications. For e = 65537, that\'s just 17 squarings.' },
      { label:'03 // SECURITY', text:'A 2048-bit RSA key has n ≈ 2²⁰⁴⁸. The best known factoring algorithm (General Number Field Sieve) would require more operations than atoms in the observable universe to factor a 2048-bit n. RSA is used for key exchange in TLS but not for bulk encryption — it\'s far slower than AES. In practice, RSA encrypts a symmetric AES key, which then encrypts the actual data.' },
    ],
    bullets:['Key gen: choose primes p, q → n=pq, φ(n)=(p−1)(q−1)','Public key: (e, n) — pick e coprime to φ(n)','Private key: d = e⁻¹ mod φ(n) via extended Euclid','Encrypt: C = Mᵉ mod n  |  Decrypt: M = Cᵈ mod n'],
    timeC:'O(log² n) per op', spaceC:'O(log n)',
    io:{ KeySize:'2048+ bits for security', e:'65537 (0x10001) standard', Encrypt:'C = Mᵉ mod n', Decrypt:'M = Cᵈ mod n' }
  },
  'diffie-hellman': {
    paras: [
      { label:'01 // THE PROBLEM', text:'How can Alice and Bob agree on a secret key over a public channel without ever sending the secret? Before DH (1976), secure communication required a prior secure channel to exchange keys — a chicken-and-egg problem. Diffie-Hellman solved this using the discrete logarithm problem: given g, p, and gˣ mod p, finding x is computationally infeasible for large p.' },
      { label:'02 // THE PROTOCOL', text:'(1) Agree publicly on prime p and generator g. (2) Alice picks private a, sends A = gᵃ mod p. (3) Bob picks private b, sends B = gᵇ mod p. (4) Alice computes Bᵃ mod p = gᵃᵇ mod p. (5) Bob computes Aᵇ mod p = gᵃᵇ mod p. Both arrive at the same shared secret K = gᵃᵇ mod p, but an eavesdropper only sees g, p, A, B — and must solve the discrete log to recover a or b.' },
      { label:'03 // MODERN USAGE', text:'DH is used in every TLS handshake (ECDHE — Elliptic Curve Diffie-Hellman Ephemeral). The "ephemeral" means a new keypair is generated for every connection, providing forward secrecy: even if the server\'s long-term private key is compromised later, past sessions remain secure. X25519 (Curve25519) is the recommended elliptic curve variant, used in TLS 1.3.' },
    ],
    bullets:['Public: prime p, generator g. Private: a (Alice), b (Bob)','Alice → Bob: A = gᵃ mod p. Bob → Alice: B = gᵇ mod p','Shared secret: K = gᵃᵇ mod p (both compute independently)','Security: discrete log problem — hard to invert gˣ mod p'],
    timeC:'O(log² p)', spaceC:'O(log p)',
    io:{ Public:'g, p, A=gᵃ mod p, B=gᵇ mod p', Secret:'K = gᵃᵇ mod p', Modern:'ECDHE in TLS 1.3', ForwardSecrecy:'Ephemeral keys protect past sessions' }
  },
  'aes-round': {
    paras: [
      { label:'01 // AES OVERVIEW', text:'AES (Rijndael) operates on a 4×4 matrix of bytes called the State. A 128-bit key runs 10 rounds; 192-bit runs 12; 256-bit runs 14. Each round applies four transformations: SubBytes (non-linear byte substitution via S-Box), ShiftRows (cyclic row rotation), MixColumns (matrix multiply in GF(2⁸)), and AddRoundKey (XOR with round key). The final round skips MixColumns.' },
      { label:'02 // SUBBYTES', text:'SubBytes replaces each byte b with S-Box[b], a fixed 256-entry lookup table derived from the multiplicative inverse in GF(2⁸) followed by an affine transform. This provides non-linearity — the crucial property that prevents linear cryptanalysis. The S-Box was carefully designed to have low differential uniformity and high algebraic complexity, making it resistant to differential and linear attacks.' },
      { label:'03 // SHIFTROWS', text:'ShiftRows cyclically shifts each row of the State: row 0 is unchanged, row 1 shifts left by 1, row 2 by 2, row 3 by 3. Combined with MixColumns, ShiftRows provides diffusion — ensuring that bytes in one column affect all four columns after two rounds. This "wide-trail strategy" ensures every output bit depends on every input bit after just 2 rounds (full diffusion after 3).' },
    ],
    bullets:['State: 4×4 byte matrix (128 bits)','SubBytes: non-linear S-Box substitution in GF(2⁸)','ShiftRows: row 1 shifts ←1, row 2 ←2, row 3 ←3','MixColumns + ShiftRows = full diffusion in 3 rounds'],
    timeC:'O(rounds × 16)', spaceC:'O(1) (in-place)',
    io:{ Block:'128 bits = 4×4 bytes', KeySizes:'128/192/256 bit → 10/12/14 rounds', SubBytes:'256-entry GF(2⁸) S-Box', ShiftRows:'Cyclic left-rotation per row' }
  },
  'caesar-vigenere': {
    paras: [
      { label:'01 // CAESAR CIPHER', text:'Caesar cipher shifts each letter by a fixed amount k (0–25): C = (P + k) mod 26. Julius Caesar used k = 3. With only 26 possible shifts, brute-force takes under a second. Frequency analysis is even faster: in English, E is most common (12.7%), followed by T (9.1%), A (8.2%). Match the ciphertext frequency distribution to English frequencies to instantly recover k.' },
      { label:'02 // VIGENÈRE CIPHER', text:'Vigenère uses a keyword to create a polyalphabetic cipher: Cᵢ = (Pᵢ + Kᵢ mod L) mod 26, where L is the keyword length. For keyword "KEY": K=10, E=4, Y=24. Each letter of plaintext is shifted by the corresponding keyword letter cyclically. This defeats simple frequency analysis — the same plaintext letter maps to multiple ciphertext letters.' },
      { label:'03 // KASISKI TEST & SECURITY', text:'Vigenère was called "le chiffre indéchiffrable" for 300 years, but Kasiski (1863) cracked it: repeated ciphertext substrings correspond to the same plaintext encrypted with aligned key positions, revealing the key length. Once L is known, the cipher reduces to L independent Caesar ciphers. Modern ciphers avoid this by using key schedules that never repeat.' },
    ],
    bullets:['Caesar: C = (P + k) mod 26 — only 25 possible shifts','Vigenère: uses keyword, Cᵢ = (Pᵢ + K[i mod L]) mod 26','Frequency analysis breaks Caesar in milliseconds','Kasiski test finds Vigenère key length from repeated patterns'],
    timeC:'O(n)', spaceC:'O(1)',
    io:{ Caesar:'26 possible keys — trivially brute-forced', Vigenère:'26^L keys — but Kasiski test finds L', KeyLength:'Longer = harder (OTP = infinite key = unbreakable)', Modern:'Stream ciphers (ChaCha20) are polyalphabetic descendants' }
  },
  'sha256': {
    paras: [
      { label:'01 // STRUCTURE', text:'SHA-256 processes input in 512-bit (64-byte) blocks using the Merkle-Damgård construction. First, pad the message: append bit 1, then zeros, then 64-bit big-endian message length, so total length ≡ 448 (mod 512). Parse into N 512-bit blocks. Initialize 8 hash values (H₀–H₇) from fractional parts of primes. Process each block with the compression function.' },
      { label:'02 // COMPRESSION FUNCTION', text:'Each 512-bit block runs 64 rounds. Per round: σ₀(a) = ROTR²(a) XOR ROTR¹³(a) XOR ROTR²²(a), σ₁(e) = ROTR⁶(e) XOR ROTR¹¹(e) XOR ROTR²⁵(e), Ch(e,f,g) = (e AND f) XOR (NOT e AND g), Maj(a,b,c) = (a AND b) XOR (a AND c) XOR (b AND c). T₁ = h + σ₁(e) + Ch + Kᵢ + Wᵢ; T₂ = σ₀(a) + Maj. Update 8 state words.' },
      { label:'03 // AVALANCHE & COLLISION RESISTANCE', text:'SHA-256\'s avalanche effect: flipping one input bit changes ~50% of output bits. The Merkle-Damgård padding ensures no length-extension attacks without HMAC. Collision resistance: finding two messages with the same hash requires ~2¹²⁸ operations (birthday paradox on 256-bit space). SHA-256 underpins Bitcoin mining (PoW), TLS certificates (HMAC-SHA256), and password hashing (PBKDF2-SHA256).' },
    ],
    bullets:['Input: any length → padded to multiple of 512 bits','64 rounds per block: rotations, XOR, Ch, Maj functions','Avalanche: 1 bit input flip → ~128 output bits change','Output: 256 bits = 32 bytes = 64 hex chars — always'],
    timeC:'O(n) — linear in message length', spaceC:'O(1) — 8 × 32-bit state words',
    io:{ BlockSize:'512 bits (64 bytes)', OutputSize:'256 bits (32 bytes)', Rounds:'64 per block', Security:'128-bit collision resistance (birthday)' }
  },
  // ── Network Security ──
    'ddos-attack': {
    paras: [
      { label:'01 // WHAT IS DDoS', text:"A Distributed Denial-of-Service attack overwhelms a target server with traffic from thousands of compromised machines (a botnet), exhausting bandwidth, CPU, or connection-table resources until legitimate users cannot get a response. Unlike a DoS from a single IP (easily blocked), DDoS traffic comes from diverse global addresses, making it hard to filter without collateral damage." },
      { label:'02 // HOW BOTNETS WORK', text:"Attackers infect ordinary computers, IoT devices, and cloud VMs with malware, creating zombie nodes that silently await commands. When the operator fires the command, all bots simultaneously send SYN packets, UDP floods, HTTP GET storms, or amplified DNS/NTP reflections at the target. The 2016 Mirai botnet used 600,000 IoT cameras to peak at 1.1 Tbps — enough to knock major DNS providers offline." },
      { label:'03 // DEFENCES', text:"Modern DDoS mitigation uses anycast diffusion (spread traffic across PoPs), scrubbing centres (filter malicious packets before they reach the origin), rate-limiting (drop IPs exceeding N requests/s), SYN cookies (avoid allocating state before handshake completes), and BGP blackholing (null-route the target at the ISP level). Cloud providers like Cloudflare absorb attacks exceeding 3 Tbps using distributed scrubbing infrastructure." },
    ],
    bullets:['Botnet: thousands of infected zombie machines','Flood types: SYN flood, UDP flood, HTTP GET storm, amplification','Goal: exhaust bandwidth, CPU, or connection-table limits','Defence: anycast scrubbing, rate-limiting, SYN cookies, BGP blackhole'],
    timeC:'O(bots × rate)', spaceC:'O(connections)',
    io:{ Bots:'Infected PCs, IoT, VMs', Attack:'SYN/UDP/HTTP flood', Peak:'Mirai: 1.1 Tbps (2016)', Defence:'Anycast + scrubbing centres' }
  },
  'sql-injection': {
    paras: [
      { label:'01 // THE VULNERABILITY', text:"SQL injection occurs when user-supplied input is concatenated directly into a database query string without sanitisation. A login form that builds query = SELECT * FROM users WHERE name= followed by user input is trivially bypassed: entering OR 1=1 makes the WHERE clause always true, returning all rows. OWASP has ranked SQLi as the #1 web security risk for over a decade." },
      { label:'02 // VARIANTS', text:"Classic in-band SQLi returns results directly in the HTTP response. Blind SQLi gets no output — the attacker infers data by observing true/false differences in response time or content. Out-of-band SQLi exfiltrates data via DNS or HTTP requests triggered by the database engine itself. Second-order SQLi stores the payload, which fires when retrieved later from a different code path." },
      { label:'03 // PREVENTION', text:"Prepared statements (parameterised queries) completely prevent SQLi: the query structure is compiled first, then parameter values are bound separately — the DB engine never interprets user data as SQL. ORMs provide parameterisation by default. Input validation (whitelist allowed characters), least-privilege DB accounts (no DROP TABLE rights), and WAFs add defence-in-depth, but parameterised queries are the only correct primary fix." },
    ],
    bullets:["Classic: ' OR '1'='1 — always-true WHERE clause",'Blind SQLi: infer data from boolean or timing differences','Prevention: prepared statements / parameterised queries','Never concatenate user input directly into SQL strings'],
    timeC:'O(1) per query', spaceC:'O(1)',
    io:{ Payload:"OR 1=1 -- (always true)", Blind:'Time/boolean side-channel', Fix:'Prepared statements (parameterised queries)', Risk:'OWASP Top 10 #1 for 10+ years' }
  },
  'firewall-filter': {
    paras: [
      { label:'01 // PACKET FILTERING', text:"A packet-filtering firewall inspects each IP packet header fields — source IP, destination IP, protocol (TCP/UDP/ICMP), source port, destination port — and compares them against an ordered ruleset. If a packet matches an ALLOW rule it is forwarded; if it matches a DENY rule (or reaches the implicit default-deny) it is dropped. This happens at line rate in hardware (ASICs or FPGAs) on modern firewalls." },
      { label:'02 // STATEFUL vs STATELESS', text:"Stateless filters evaluate each packet independently — simple but blind to connection state. A stateful firewall tracks the TCP three-way handshake and only permits packets belonging to established or related sessions, blocking unsolicited inbound SYN packets from untrusted sources. Next-generation firewalls (NGFW) add layer-7 deep packet inspection: recognising application protocols regardless of port number." },
      { label:'03 // RULE ORDERING & DEFAULT-DENY', text:"Rules are evaluated top-to-bottom and the first match wins. The classic hardened posture is default-deny: block everything, then explicitly permit only required services (port 443 inbound for HTTPS, port 22 from admin IPs only for SSH). This limits the attack surface to exactly the intended services and catches misconfigured clients rather than letting unknown traffic through." },
    ],
    bullets:['Stateless: match src/dst IP, port, protocol per packet','Stateful: track TCP sessions — allow ESTABLISHED, drop unsolicited SYN','NGFW: deep packet inspection at layer 7','Default-deny: block all, then whitelist required services only'],
    timeC:'O(rules) per packet', spaceC:'O(sessions) stateful',
    io:{ Match:'IP, port, protocol, flags', Policy:'ALLOW / DENY / LOG', Stateful:'Track TCP state (SYN/SYN-ACK/ACK)', NGFW:'Layer-7 DPI, IDS/IPS integration' }
  },
  'mitm-attack': {
    paras: [
      { label:'01 // THE ATTACK', text:"In a man-in-the-middle (MITM) attack the adversary positions themselves on the network path between two parties, transparently forwarding (and potentially modifying) traffic. Classic vectors include ARP spoofing (sending fake ARP replies so the LAN routes victim traffic through the attacker NIC), DNS spoofing (fake DNS responses pointing domains to attacker IPs), and rogue Wi-Fi access points." },
      { label:'02 // WHAT ATTACKERS CAN DO', text:"A passive MITM eavesdrops on unencrypted traffic (HTTP, Telnet, FTP) — reading credentials, session cookies, and private data. An active MITM can modify content in transit: inject malicious scripts into HTTP responses, strip TLS (SSL stripping), or relay and forge handshakes. SSL stripping downgrades HTTPS to HTTP, so the victim believes they have a secure connection while the attacker sees plaintext." },
      { label:'03 // DEFENCES', text:"TLS (HTTPS) with proper certificate validation defeats passive MITM and most active MITM. Certificate pinning rejects certificates not matching the expected public key. HSTS (HTTP Strict Transport Security) forces HTTPS even when the user types http://, defeating SSL stripping. Mutual TLS (mTLS) requires both sides to present certificates. At the network level, 802.1X port authentication and dynamic ARP inspection block ARP-based MITM." },
    ],
    bullets:['ARP spoof / rogue AP redirects LAN traffic through attacker','Passive: eavesdrop plaintext credentials and session cookies','SSL stripping: downgrade HTTPS to HTTP transparently','Defence: TLS + cert validation, HSTS, certificate pinning, mTLS'],
    timeC:'O(packets forwarded)', spaceC:'O(1) per flow',
    io:{ Vector:'ARP spoof, DNS spoof, rogue AP', Passive:'Eavesdrop plaintext traffic', Active:'Modify packets, SSL strip', Defence:'TLS/HSTS/pinning/mTLS/DNSSEC' }
  },
  'zkp-cave': {
    paras: [
      { label:'01 // THE ALI BABA CAVE', text:"Oded Goldreich, Silvio Micali and Avi Wigderson (1986) formalised zero-knowledge proofs. The Ali Baba cave analogy (Jean-Jacques Quisquater, 1990) makes the idea intuitive: a cave has two paths A and B that meet at a locked door in the middle. Peggy (Prover) knows the secret password. Victor (Verifier) waits outside while Peggy enters either path. Victor then calls which side Peggy should exit from. If Peggy knows the password she can always comply; if she cannot, she can only comply 50% of the time by luck." },
      { label:'02 // SOUNDNESS & ZERO-KNOWLEDGE', text:"After n rounds, an unknowing prover succeeds by chance with probability only (1/2)^n. After 30 rounds, that is less than 1 in a billion. Crucially, Victor learns nothing about the password itself — only that Peggy knows it. This is the zero-knowledge property: the transcript of the interaction is indistinguishable from a transcript that could be simulated without any knowledge of the secret." },
      { label:'03 // REAL-WORLD ZKPs', text:"Modern ZKP systems include zk-SNARKs (Succinct Non-interactive ARguments of Knowledge), used in Zcash for privacy-preserving cryptocurrency transactions, and zk-STARKs (Scalable Transparent ARguments of Knowledge), used for blockchain scaling. ZKPs also power privacy-preserving authentication (prove you are over 18 without revealing your date of birth), anonymous credentials (prove group membership without revealing identity), and Ethereum Layer-2 rollups." },
    ],
    bullets:['Completeness: if Prover knows secret, Verifier always accepts','Soundness: without secret, success probability is (1/2)^n per round','Zero-knowledge: transcript reveals nothing about the secret itself','Applications: zk-SNARKs (Zcash), L2 rollups, anonymous credentials'],
    timeC:'O(rounds) interactive; O(1) non-interactive (SNARK)', spaceC:'O(1) state',
    io:{ Protocol:'Interactive: n rounds each 50% catch probability', Modern:'zk-SNARKs / zk-STARKs (non-interactive)', Uses:'Zcash, L2 rollups, age proofs, anonymous auth', Security:'Computationally sound (SNARKs) or info-theoretically (MPC)' }
  },
};

// ══════════════════════════════════════════════════════════
//  DISPATCH TABLE
// ══════════════════════════════════════════════════════════
const EXPERIMENT_RUNNERS = {
  'bubble-sort':    () => runSortViz('bubble-sort'),
  'selection-sort': () => runSortViz('selection-sort'),
  'insertion-sort': () => runSortViz('insertion-sort'),
  'merge-sort':     () => runSortViz('merge-sort'),
  'quick-sort':     () => runSortViz('quick-sort'),
  'heap-sort':      () => runSortViz('heap-sort'),
  'n-queens':       () => runNQueens(),
  'sudoku-solver':  () => runSudokuSolver(),
  'rat-in-maze':    () => runRatMaze(),
  'bfs':            () => runGraphAlgo('bfs'),
  'dfs':            () => runGraphAlgo('dfs'),
  'dijkstra':       () => runGraphAlgo('dijkstra'),
  'fibonacci-dp':   () => runFibDP(),
  'lcs':            () => runLCS(),
  'knapsack':       () => runKnapsack(),
  'stack-ops':      () => runStackOps(),
  'queue-ops':      () => runQueueOps(),
  'bst-ops':             () => runBSTOps(),
  'avl-tree':            () => runAVLTree(),
  'red-black-tree':      () => runRedBlackTree(),
  'tree-traversal':      () => runTreeTraversal(),
  'topo-sort':           () => runTopoSort(),
  'kruskal':             () => runKruskal(),
  'prim':                () => runPrim(),
  'bellman-ford':        () => runBellmanFord(),
  'kmp':                 () => runKMP(),
  'rabin-karp':          () => runRabinKarp(),
  'trie':                () => runTrie(),
  'binary-search':       () => runBinarySearch(),
  'interpolation-search':() => runInterpolationSearch(),
  'tower-of-hanoi':      () => runTowerOfHanoi(),
  'permutations':        () => runPermutations(),
  'activity-selection':  () => runActivitySelection(),
  'huffman-coding':      () => runHuffmanCoding(),
  'union-find':          () => runUnionFind(),
  // Computational Geometry
  'convex-hull':         () => runConvexHull(),
  'line-intersection':   () => runLineIntersection(),
  'closest-pair':        () => runClosestPair(),
  'polygon-area':        () => runPolygonArea(),
  // Bit Manipulation
  'subset-bitmask':      () => runSubsetBitmask(),
  'xor-tricks':          () => runXorTricks(),
  'power-of-two':        () => runPowerOfTwo(),
  'bitwise-sieve':       () => runBitwiseSieve(),
  // Binary Arithmetic
  'binary-addition':        () => runBinaryAddition(),
  'binary-subtraction':     () => runBinarySubtraction(),
  'binary-multiplication':  () => runBinaryMultiplication(),
  'binary-division':        () => runBinaryDivision(),
  // Gates versions
  'binary-addition-gates':      () => runBinaryAdditionGates(),
  'binary-subtraction-gates':   () => runBinarySubtractionGates(),
  'binary-multiplication-gates':() => runBinaryMultiplicationGates(),
  'binary-division-gates':      () => runBinaryDivisionGates(),
  // Machine Learning
  'linear-regression': () => runLinearRegression(),
  'knn':               () => runKNN(),
  'kmeans':            () => runKMeans(),
  'decision-tree':     () => runDecisionTree(),
  'perceptron':        () => runPerceptron(),
  // Cryptography
  'rsa':              () => runRSA(),
  'diffie-hellman':   () => runDiffieHellman(),
  'aes-round':        () => runAESRound(),
  'caesar-vigenere':  () => runCaesarVigenere(),
  'sha256':           () => runSHA256(),
  // Network Security
  'ddos-attack':      () => runDDoSAttack(),
  'sql-injection':    () => runSQLInjection(),
  'firewall-filter':  () => runFirewallFilter(),
  'mitm-attack':      () => runMITMAttack(),
  'zkp-cave':         () => runZKPCave(),
};

// ══════════════════════════════════════════════════════════════════
// ── Gaming hero: story-driven character animation controller ──
(function() {
  // Story timeline synced to 18s CSS animation loop
  // Each entry: [startMs, endMs, speechText, laptopHTML, speechColor]
  const STORY = [
    [0,    3500,  '📖 DSA... why so hard?',       '&gt; err<br>&gt; ???<br>✗ fail',                   '#fdcb6e'],
    [3500, 6000,  '😩 I give up...',               '&gt; ???<br>&gt; ugh<br>✗ lost',                   '#ff7675'],
    [6000, 8500,  '🤔 Wait... what\'s this?',      '&gt; ...<br>&gt; hmm<br>★ new?',                   '#74b9ff'],
    [8500, 11000, '😮 EPISTEME??',                 '▶ run()<br>▶ sort()<br>✓ WOW',                    '#00e5ff'],
    [11000,14000, '🚀 THIS IS AMAZING!!',          '▶ sort()<br>★ O(n log n)<br>✓ YES!',              '#00ffa3'],
    [14000,18000, '✨ Learning DSA is FUN!',        '&gt; viz()<br>★ merge<br>✓ done!',                '#bf5fff'],
  ];

  const speechEl = document.getElementById('gm-speech-text');
  const laptopEl = document.getElementById('gm-laptop-content');
  const speechWrap = document.getElementById('gm-speech-wrap');

  if (!speechEl || !laptopEl) return;

  const CYCLE = 18000;
  let startTime = performance.now();

  function getPhase(t) {
    const elapsed = (t - startTime) % CYCLE;
    for (let i = STORY.length - 1; i >= 0; i--) {
      if (elapsed >= STORY[i][0]) return i;
    }
    return 0;
  }

  let lastPhase = -1;
  function tick(t) {
    const phase = getPhase(t);
    if (phase !== lastPhase) {
      lastPhase = phase;
      const [,, speech, laptop, color] = STORY[phase];

      // Fade speech
      speechEl.style.transition = 'opacity 0.25s';
      speechEl.style.opacity = '0';
      setTimeout(() => {
        if (speechEl) {
          speechEl.textContent = speech;
          speechEl.style.opacity = '1';
        }
      }, 250);

      // Update speech bubble border color
      if (speechWrap) {
        speechWrap.style.transition = 'border-color 0.5s, box-shadow 0.5s';
        speechWrap.style.borderColor = color;
        speechWrap.style.color = color;
        speechWrap.style.boxShadow = `0 0 16px ${color}40`;
      }

      // Update laptop content
      if (laptopEl) {
        laptopEl.style.transition = 'opacity 0.2s';
        laptopEl.style.opacity = '0';
        setTimeout(() => {
          if (laptopEl) {
            laptopEl.innerHTML = laptop;
            laptopEl.style.opacity = '1';
          }
        }, 200);
      }
    }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);

  // Token hover: scale up + show tooltip
  document.querySelectorAll('.gm-float-token').forEach(tok => {
    tok.style.cursor = 'pointer';
    tok.addEventListener('mouseenter', () => {
      tok.style.transform = 'scale(1.4) rotate(0deg)';
      tok.style.transition = 'transform 0.2s';
      tok.style.opacity = '1';
      tok.style.filter = 'drop-shadow(0 0 12px currentColor)';
    });
    tok.addEventListener('mouseleave', () => {
      tok.style.transform = '';
      tok.style.transition = 'transform 0.3s';
      tok.style.opacity = '';
      tok.style.filter = '';
    });
  });
})();


// ══════════════════════════════════════════════════════════════════
//  FOOTER — FEEDBACK FORM + FAQ + SOCIAL
// ══════════════════════════════════════════════════════════════════
(function() {
  // ── Star rating ──
  let fbRating = 0;
  const stars = document.querySelectorAll('.fb-star');
  function setStars(n) {
    fbRating = n;
    stars.forEach(s => s.classList.toggle('lit', +s.dataset.v <= n));
  }
  stars.forEach(s => {
    s.addEventListener('mouseenter', () => stars.forEach(st => st.classList.toggle('lit', +st.dataset.v <= +s.dataset.v)));
    s.addEventListener('mouseleave', () => setStars(fbRating));
    s.addEventListener('click',      () => setStars(+s.dataset.v));
  });

  // ── Character counter ──
  const ta = document.getElementById('fb-review');
  const cnt = document.getElementById('fb-count');
  if (ta) ta.addEventListener('input', () => { cnt.textContent = ta.value.length; });

  // ── FAQ data ──
  const FAQS = [
    { q: '🔍  What is Episteme?', a: 'Episteme is a free, single-file browser-based DSA visualizer. No install needed — open the HTML file and explore 51 algorithms across 14 branches with animated step-by-step visualizations, C++ code, and complexity analysis.' },
    { q: '💻  Can I use it offline?', a: 'Yes! The entire app is self-contained in one HTML file. Download it once and run it locally in any modern browser without an internet connection.' },
    { q: '🧠  Is it good for interview prep?', a: 'Absolutely. Each experiment includes time/space complexity, a code panel with highlighted C++ pseudocode, and an interactive theory screen — covering everything you\'d need to explain an algorithm confidently in an interview.' },
    { q: '🔢  Which languages are shown?', a: 'Code panels show C++ by default, as it\'s the most common language for competitive programming and systems interviews. The visual logic and concepts apply universally to any language.' },
    { q: '🤝  How can I contribute?', a: 'Episteme is open-source. Fork the repo, add a new experiment following the EXPERIMENT_RUNNERS pattern, and open a PR. You can also submit suggestions via the feedback form on this page.' },
    { q: '📱  Does it work on mobile?', a: 'The canvas-based experiments are optimized for desktop (1200px+). Mobile browsing works for reading theory and exploring the branch menu, but interactive simulations are best experienced on a larger screen.' },
  ];

  const faqList = document.getElementById('faq-list');
  if (faqList) {
    FAQS.forEach((f, i) => {
      const item = document.createElement('div');
      item.className = 'faq-item';
      item.innerHTML = `
        <div class="faq-q" onclick="toggleFaq(this.parentElement)">
          <span>${f.q}</span>
          <span class="faq-chevron">▼</span>
        </div>
        <div class="faq-a">${f.a}</div>`;
      faqList.appendChild(item);
    });
  }

  // ── Social data ──
  const SOCIALS = [
    { name: 'Instagram', handle: '@episteme.socials',    icon: '📸', color: '#e1306c', url: 'https://instagram.com/episteme.socials' },
    { name: 'YouTube',   handle: '@epistemeTutorials',   icon: '▶️',  color: '#ff4444', url: 'https://youtube.com/@epistemeTutorials' },
    { name: 'GitHub',    handle: '@episteme-dsa',        icon: '🐙', color: '#e8e8ff', url: 'https://github.com/episteme-dsa' },
    { name: 'Discord',   handle: 'Episteme Server',      icon: '💬', color: '#5865f2', url: 'https://discord.gg/' },
    { name: 'LinkedIn',  handle: 'Episteme Project',     icon: '🔗', color: '#0a66c2', url: 'https://linkedin.com/company/episteme-dsa' },
    { name: 'Twitter/X', handle: '@EpistemeDSA',         icon: '𝕏',  color: '#e8e8ff', url: 'https://x.com/EpistemeDSA' },
  ];
  const QUICK_LINKS = [
    { label: '📄 Docs', url: 'docs.html', desc: 'How to use Episteme' },
    { label: '🐛 Report Bug', url: 'https://github.com/episteme-dsa/issues/new', desc: 'Found something broken?' },
    { label: '✨ Changelog', url: 'changelog.html', desc: "What's new in v3.0" },
    { label: '🏆 Leaderboard', url: 'leaderboard.html', desc: 'Top contributors' },
    { label: '📚 DSA Roadmap', url: 'roadmap.html', desc: 'Structured learning path' },
    { label: '⭐ Star on GitHub', url: 'https://github.com/episteme-dsa', desc: 'Show your support!' },
  ];

  const socialGrid = document.getElementById('social-grid');
  if (socialGrid) {
    SOCIALS.forEach(s => {
      const a = document.createElement('a');
      a.className = 'social-link';
      a.href = s.url; a.target = '_blank'; a.rel = 'noopener';
      a.style.setProperty('--sl-color', s.color);
      a.innerHTML = `
        <div class="social-icon-wrap">${s.icon}</div>
        <div class="social-info">
          <div class="social-name">${s.name}</div>
          <div class="social-handle">${s.handle}</div>
        </div>
        <span class="social-arrow">→</span>`;
      socialGrid.appendChild(a);
    });
  }

  const qlStrip = document.getElementById('quick-links');
  if (qlStrip) {
    QUICK_LINKS.forEach(ql => {
      const a = document.createElement('a');
      a.className = 'quick-link';
      a.href = ql.url;
      // open github in new tab, local pages in same tab
      if (ql.url.startsWith('http')) { a.target = '_blank'; a.rel = 'noopener'; }
      a.innerHTML = `<span class="ql-label">${ql.label}</span><span class="ql-desc">${ql.desc}</span>`;
      qlStrip.appendChild(a);
    });
  }
})();

// ── Tab switcher ──
function switchInfoTab(tab) {
  document.getElementById('tab-faq').classList.toggle('active', tab==='faq');
  document.getElementById('tab-social').classList.toggle('active', tab==='social');
  document.getElementById('panel-faq').classList.toggle('hidden', tab!=='faq');
  const sp = document.getElementById('panel-social');
  sp.classList.toggle('active', tab==='social');
}

// ── FAQ accordion ──
function toggleFaq(item) {
  const wasOpen = item.classList.contains('open');
  document.querySelectorAll('.faq-item.open').forEach(el => el.classList.remove('open'));
  if (!wasOpen) item.classList.add('open');
}

// ── Feedback submission → Telegram ──
async function submitFeedback() {
  const name    = (document.getElementById('fb-name')?.value  || '').trim();
  const email   = (document.getElementById('fb-email')?.value || '').trim();
  const branch  = (document.getElementById('fb-branch')?.value|| '').trim();
  const source  = (document.getElementById('fb-source')?.value|| '').trim();
  const review  = (document.getElementById('fb-review')?.value|| '').trim();
  const feature = (document.getElementById('fb-feature')?.value|| '').trim();
  const rating  = window._fbRating || document.querySelectorAll('.fb-star.lit').length || 0;

  const status = document.getElementById('fb-status');
  const btn    = document.getElementById('fb-submit');

  // Basic validation
  if (!name)   { showFbStatus('error', '⚠ Please enter your name.'); return; }
  if (!review) { showFbStatus('error', '⚠ Please write a review.'); return; }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    showFbStatus('error', '⚠ Email looks invalid.'); return;
  }

  const payload = { name, email, branch, source, rating, review, feature,
    timestamp: new Date().toISOString(), app: 'Episteme DSA Visualizer' };

  const stars = rating > 0 ? '⭐'.repeat(rating) : '(no rating)';
  const msg = [
    '🎓 *New Episteme Feedback*',
    `👤 *Name:* ${name}`,
    email ? `📧 *Email:* ${email}` : '',
    branch ? `🌿 *Branch:* ${branch}` : '',
    source ? `🔍 *Source:* ${source}` : '',
    `${stars} *Rating:* ${rating}/5`,
    `💬 *Review:*\n${review}`,
    feature ? `✨ *Feature Request:* ${feature}` : '',
    `🕐 *Time:* ${new Date().toLocaleString()}`,
  ].filter(Boolean).join('\n');

  btn.classList.add('loading'); btn.disabled = true;
  status.className = 'fb-status'; status.style.display = 'none';

  try {
    const BOT = '8384351322:AAHAH0kmsvQ2TbJr7iP5S82lzes9PIPbpF0';
    // Send to Telegram — chat_id uses the bot owner's ID via getUpdates or use channel
    // We'll send to a channel/chat. Using @EpistemeFeedback or personal chat.
    // The bot needs a chat_id — we'll use a webhook approach by getting updates first.
    // For now, send to bot creator's default chat (bot token owner = first number in token)
    const CHAT_ID = '8384351322'; // owner user ID extracted from token prefix

    const res = await fetch(`https://api.telegram.org/bot${BOT}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: CHAT_ID, text: msg, parse_mode: 'Markdown' })
    });
    const data = await res.json();
    if (data.ok) {
      showFbStatus('success', '✅ Feedback sent! Thank you, ' + name + ' 🚀');
      // Clear form
      ['fb-name','fb-email','fb-review','fb-feature'].forEach(id => {
        const el = document.getElementById(id); if(el) el.value='';
      });
      ['fb-branch','fb-source'].forEach(id => {
        const el = document.getElementById(id); if(el) el.selectedIndex=0;
      });
      document.querySelectorAll('.fb-star').forEach(s => s.classList.remove('lit'));
      document.getElementById('fb-count').textContent = '0';
    } else {
      throw new Error(data.description || 'Telegram API error');
    }
  } catch(e) {
    showFbStatus('error', '❌ Could not send — please try again or contact us directly.');
    console.error('Feedback error:', e);
  } finally {
    btn.classList.remove('loading'); btn.disabled = false;
  }
}

function showFbStatus(type, msg) {
  const el = document.getElementById('fb-status');
  if (!el) return;
  el.textContent = msg;
  el.className = 'fb-status ' + type;
}


// ══════════════════════════════════════════════════════════════════
//  SEARCH FUNCTIONALITY
// ══════════════════════════════════════════════════════════════════
(function(){
  let _searchOpen = false;

  window.doSearch = function(q) {
    const box = document.getElementById('search-results');
    if (!box) return;
    q = q.trim().toLowerCase();
    if (!q) { box.style.display='none'; return; }

    const hits = EXPERIMENTS.filter(e =>
      e.title.toLowerCase().includes(q) ||
      e.tag.toLowerCase().includes(q) ||
      e.desc.toLowerCase().includes(q) ||
      e.id.includes(q)
    ).slice(0, 8);

    if (!hits.length) {
      box.innerHTML = '<div class="sr-empty">No algorithms found for "' + q + '"</div>';
      box.style.display = 'block'; return;
    }

    function hl(text, q) {
      const re = new RegExp('(' + q.replace(/[.*+?^${}()|[\]\\]/g,'\\$&') + ')', 'gi');
      return text.replace(re, '<mark class="sr-hl">$1</mark>');
    }

    const branch = (tag) => BRANCHES.find(b => b.tags.includes(tag));

    box.innerHTML = hits.map((e,i) => {
      const br = branch(e.tag);
      return `<div class="sr-item" tabindex="0" data-id="${e.id}"
        onmousedown="searchLaunch('${e.id}')" onkeydown="if(event.key==='Enter')searchLaunch('${e.id}')">
        <span class="sr-icon">${e.icon}</span>
        <div class="sr-info">
          <div class="sr-title">${hl(e.title, q)}</div>
          <div class="sr-tag">${e.tag} ${br?'· <span class="sr-branch">'+br.name+'</span>':''}</div>
        </div>
      </div>`;
    }).join('');
    box.style.display = 'block';
  };

  window.searchKey = function(e) {
    const box = document.getElementById('search-results');
    if (e.key === 'Escape') { box.style.display='none'; e.target.blur(); }
    if (e.key === 'Enter') {
      const first = box.querySelector('.sr-item');
      if (first) searchLaunch(first.dataset.id);
    }
  };

  window.searchLaunch = function(id) {
    document.getElementById('search-results').style.display = 'none';
    document.getElementById('search-input').value = '';
    openExperiment(id);
  };

  // Close search when clicking outside
  document.addEventListener('click', e => {
    const wrap = document.getElementById('search-wrap');
    if (wrap && !wrap.contains(e.target)) {
      const box = document.getElementById('search-results');
      if (box) box.style.display = 'none';
    }
  });
})();

// ══════════════════════════════════════════════════════════
//  QUIZ MODE ENGINE
//  Interactive self-solve challenges for Branch 1 (Sorting)
//  and Branch 2 (Recursion & Backtracking)
// ══════════════════════════════════════════════════════════

let quizOverlay = null;

function launchQuizMode() {
  const quizMap = {
    'bubble-sort':    () => launchSortQuiz('bubble'),
    'selection-sort': () => launchSortQuiz('selection'),
    'insertion-sort': () => launchSortQuiz('insertion'),
    'merge-sort':     () => launchSortQuiz('merge'),
    'quick-sort':     () => launchSortQuiz('quick'),
    'heap-sort':      () => launchSortQuiz('heap'),
    'n-queens':       launchNQueensQuiz,
    'rat-in-maze':    launchMazeQuiz,
    'sudoku-solver':  launchSudokuQuiz,
    'bfs':            () => launchGraphQuiz('bfs'),
    'dfs':            () => launchGraphQuiz('dfs'),
    'dijkstra':       () => launchGraphQuiz('dijkstra'),
    'fibonacci-dp':   launchFibQuiz,
    'lcs':            launchLCSQuiz,
    'knapsack':       launchKnapsackQuiz,
    'stack-ops':      launchStackQuiz,
    'queue-ops':      launchQueueQuiz,
    'bst-ops':        launchBSTQuiz,
    'avl-tree':       launchBSTQuiz,
    'tree-traversal': launchTreeTraversalQuiz,
    'red-black-tree': launchBSTQuiz,
    'topo-sort':      launchTopoQuiz,
    'kruskal':        launchMSTQuiz,
    'prim':           launchMSTQuiz,
    'bellman-ford':   launchBellmanQuiz,
    'kmp':            launchKMPQuiz,
    'rabin-karp':     launchRabinKarpQuiz,
    'trie':           launchTrieQuiz,
    'binary-search':  launchBinarySearchQuiz,
    'interpolation-search': launchBinarySearchQuiz,
    'activity-selection':   launchActivityQuiz,
    'huffman-coding':       launchHuffmanQuiz,
    'union-find':           launchDSUQuiz,
    'convex-hull':          launchConvexHullQuiz,
    'line-intersection':    launchLineIntersectionQuiz,
    'closest-pair':         launchClosestPairQuiz,
    'polygon-area':         launchPolygonAreaQuiz,
    'subset-bitmask':       launchSubsetQuiz,
    'xor-tricks':           launchXORQuiz,
    'power-of-two':         launchPowerOfTwoQuiz,
    'bitwise-sieve':        launchSieveQuiz,
    'binary-addition':      () => launchBinaryArithQuiz('add'),
    'binary-subtraction':   () => launchBinaryArithQuiz('sub'),
    'binary-multiplication':() => launchBinaryArithQuiz('mul'),
    'binary-division':      () => launchBinaryArithQuiz('div'),
    'binary-addition-gates':      () => launchBinaryArithQuiz('add'),
    'binary-subtraction-gates':   () => launchBinaryArithQuiz('sub'),
    'binary-multiplication-gates':() => launchBinaryArithQuiz('mul'),
    'binary-division-gates':      () => launchBinaryArithQuiz('div'),
    // Network Security quizzes
    'ddos-attack':     launchNetSecQuiz,
    'sql-injection':   launchNetSecQuiz,
    'firewall-filter': launchNetSecQuiz,
    'mitm-attack':     launchNetSecQuiz,
    'zkp-cave':        launchNetSecQuiz,
    // Cryptography quizzes
    'rsa':             launchRSAQuiz,
    'diffie-hellman':  launchDHQuiz,
    'aes-round':       launchAESQuiz,
    'caesar-vigenere': launchCaesarQuiz,
    'sha256':          launchSHAQuiz,
  };
  const fn = quizMap[currentExp];
  if (fn) fn();
}

/* ── Shared overlay builder ── */
function createQuizOverlay(title, accentColor) {
  if (quizOverlay) quizOverlay.remove();
  const ov = document.createElement('div');
  ov.id = 'quiz-overlay';
  ov.style.cssText = `
    position:fixed;inset:0;z-index:2000;
    background:rgba(5,5,18,0.96);
    display:flex;flex-direction:column;align-items:center;justify-content:flex-start;
    overflow-y:auto;padding:20px 16px 40px;
    animation:quizFadeIn 0.35s ease;
  `;
  ov.innerHTML = `
    <style>
      @keyframes quizFadeIn{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}
      @keyframes quizPop{0%{transform:scale(0.7)}70%{transform:scale(1.12)}100%{transform:scale(1)}}
      @keyframes quizShake{0%,100%{transform:translateX(0)}25%{transform:translateX(-8px)}75%{transform:translateX(8px)}}
      @keyframes quizGlow{0%,100%{box-shadow:0 0 8px ${accentColor}}50%{box-shadow:0 0 28px ${accentColor}}}
      .quiz-header{width:100%;max-width:820px;display:flex;align-items:center;gap:14px;margin-bottom:18px;flex-shrink:0;}
      .quiz-close{background:none;border:1px solid #2a2a5a;color:#9090c0;padding:7px 14px;border-radius:8px;
        font-family:'Space Mono',monospace;font-size:11px;cursor:pointer;margin-left:auto;
        transition:all 0.2s;}
      .quiz-close:hover{border-color:${accentColor};color:${accentColor};}
      .quiz-title{font-family:'Orbitron',monospace;font-size:18px;font-weight:700;color:${accentColor};
        text-shadow:0 0 20px ${accentColor}44;letter-spacing:0.06em;}
      .quiz-badge{font-family:'Space Mono',monospace;font-size:10px;color:#5050a0;
        background:#111128;border:1px solid #2a2a5a;padding:4px 10px;border-radius:20px;}
      .quiz-body{width:100%;max-width:820px;display:flex;flex-direction:column;gap:14px;}
      .quiz-instructions{background:#111128;border:1px solid #2a2a5a;border-radius:12px;padding:14px 18px;
        font-family:'Space Mono',monospace;font-size:12px;color:#9090c0;line-height:1.7;}
      .quiz-instructions b{color:${accentColor};}
      .quiz-stats{display:flex;gap:12px;flex-wrap:wrap;}
      .quiz-stat{background:#111128;border:1px solid #2a2a5a;border-radius:8px;padding:8px 16px;
        font-family:'Space Mono',monospace;font-size:11px;color:#5050a0;flex:1;text-align:center;min-width:80px;}
      .quiz-stat span{display:block;font-size:18px;font-weight:700;color:${accentColor};line-height:1.3;}
      .quiz-canvas-wrap{background:#0a0a1a;border:1px solid #2a2a5a;border-radius:16px;overflow:hidden;
        display:flex;align-items:center;justify-content:center;padding:12px;position:relative;}
      .quiz-canvas-wrap canvas{border-radius:8px;cursor:pointer;display:block;max-width:100%;}
      .quiz-feedback{background:#111128;border-radius:12px;padding:14px 18px;
        font-family:'Space Mono',monospace;font-size:13px;text-align:center;min-height:44px;
        border:1px solid #2a2a5a;transition:all 0.3s;}
      .quiz-btn-row{display:flex;gap:10px;flex-wrap:wrap;}
      .quiz-btn{flex:1;padding:10px 16px;border-radius:8px;border:1px solid #2a2a5a;
        background:#111128;color:#9090c0;font-family:'Space Mono',monospace;font-size:12px;
        cursor:pointer;transition:all 0.2s;min-width:100px;}
      .quiz-btn:hover{border-color:${accentColor};color:${accentColor};}
      .quiz-btn.primary{background:${accentColor};color:#0d0d1a;border-color:${accentColor};font-weight:700;}
      .quiz-btn.primary:hover{background:transparent;color:${accentColor};}
      .quiz-hint-btn{background:rgba(255,224,64,0.08);border-color:rgba(255,224,64,0.3);color:#ffe040;}
      .quiz-hint-btn:hover{background:rgba(255,224,64,0.2)!important;color:#ffe040!important;border-color:#ffe040!important;}
    </style>
    <div class="quiz-header">
      <div class="quiz-title">🎮 QUIZ MODE</div>
      <div class="quiz-badge" id="quiz-level-badge">CHALLENGE</div>
      <button class="quiz-close" onclick="closeQuiz()">✕ Exit Quiz</button>
    </div>
    <div class="quiz-body" id="quiz-body"></div>
  `;
  document.body.appendChild(ov);
  quizOverlay = ov;
  return ov;
}

function closeQuiz() {
  if (quizOverlay) { quizOverlay.remove(); quizOverlay = null; }
}

function showQuizResult(ov, score, total, name, accent) {
  const body = ov.querySelector('.quiz-body') || document.getElementById('quiz-body');
  if (!body) return;
  const pct = total > 0 ? Math.round((score / total) * 100) : 0;
  const emoji = pct >= 90 ? '🏆' : pct >= 70 ? '✅' : pct >= 50 ? '📖' : '💪';
  const msg   = pct >= 90 ? 'Perfect! Excellent mastery!' :
                pct >= 70 ? 'Great work — you know this well.' :
                pct >= 50 ? 'Good effort — keep reviewing.' :
                            'Keep studying — you\'ll get it!';
  body.innerHTML = `
    <div class="quiz-instructions" style="text-align:center;padding:28px;">
      <div style="font-size:48px;margin-bottom:12px;">${emoji}</div>
      <div style="font-size:22px;font-weight:700;color:${accent};">SCORE: ${score} / ${total}</div>
      <div style="font-size:15px;margin-top:8px;color:${accent};opacity:0.8;">${pct}%</div>
      <div style="margin-top:14px;color:#9090c0;font-family:'Share Tech Mono',monospace;font-size:13px;">${msg}</div>
    </div>
    <div class="quiz-btn-row" style="margin-top:16px;">
      <button class="quiz-btn primary" onclick="closeQuiz()">✕ Close</button>
    </div>`;
}

// ── HELPER: timer ──
function quizTimer(elId) {
  let s = 0;
  const iv = setInterval(() => {
    s++;
    const el = document.getElementById(elId);
    if (el) el.textContent = s + 's';
    else clearInterval(iv);
  }, 1000);
  return { stop: () => clearInterval(iv), getTime: () => s };
}

/* ════════════════════════════════════════════════
   SORT QUIZ — drag bars to correct sorted order
   ════════════════════════════════════════════════ */
function launchSortQuiz(sortType) {
  const accentColor = '#00e5ff';
  createQuizOverlay('Sort It Yourself', accentColor);
  const body = document.getElementById('quiz-body');

  const LEVELS = [
    { n: 6,  label: 'EASY',   desc: '6 bars — get the feel!' },
    { n: 9,  label: 'MEDIUM', desc: '9 bars — focus up.' },
    { n: 13, label: 'HARD',   desc: '13 bars — prove yourself.' },
  ];
  let level = 0, moves = 0, solved = false;
  let arr = [], target = [], dragIdx = null, hoverIdx = null;
  let timer = null, timerEl = 'sq-time';

  function shuffle(a) {
    // ensure shuffled != sorted
    do { for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];} }
    while(JSON.stringify(a)===JSON.stringify([...a].sort((x,y)=>x-y)));
    return a;
  }

  function initLevel() {
    moves = 0; solved = false;
    const n = LEVELS[level].n;
    target = Array.from({length:n}, (_,i) => Math.round(20 + (i/(n-1))*75));
    arr = shuffle([...target]);
    if (timer) timer.stop();
    timer = quizTimer(timerEl);
    setFeedback('💡 Drag bars left/right to sort them in ascending order!', '#9090c0');
    updateStats();
    render();
  }

  function checkSolved() {
    if (JSON.stringify(arr) === JSON.stringify([...arr].sort((a,b)=>a-b))) {
      solved = true;
      timer && timer.stop();
      const t = timer ? timer.getTime() : 0;
      setFeedback(`🎉 Sorted! ${moves} moves · ${t}s — ${moves<=arr.length?'Excellent! Near-optimal!':'Good job!'}`, '#00ffa3');
      document.getElementById('sq-moves').textContent = moves;
      // animate canvas glow
      const cw = document.getElementById('sq-canvas-wrap');
      if (cw) { cw.style.animation='quizGlow 0.8s ease 3'; setTimeout(()=>{ if(cw) cw.style.animation=''; }, 2500); }
    }
  }

  function updateStats() {
    const ms = document.getElementById('sq-moves');
    if (ms) ms.textContent = moves;
  }

  function setFeedback(msg, color) {
    const fb = document.getElementById('sq-feedback');
    if (fb) { fb.textContent = msg; fb.style.color = color || '#9090c0'; }
  }

  // Render on a canvas
  function render() {
    const c = document.getElementById('sq-canvas');
    if (!c) return;
    const W = c.width, H = c.height;
    const ctx = c.getContext('2d');
    const n = arr.length;
    const gap = (W - 32) / n;
    const barW = Math.max(8, gap - 4);
    const maxH = H - 52;
    const maxV = Math.max(...arr);

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#0a0a1a'; ctx.fillRect(0, 0, W, H);

    // Grid lines
    for (let g = 0; g <= 4; g++) {
      ctx.strokeStyle = 'rgba(0,229,255,0.05)'; ctx.lineWidth = 1;
      const y = 16 + (maxH / 4) * g;
      ctx.beginPath(); ctx.moveTo(16, y); ctx.lineTo(W - 16, y); ctx.stroke();
    }

    arr.forEach((v, i) => {
      const bh = Math.max(6, (v / maxV) * maxH);
      const bx = 16 + i * gap + (gap - barW) / 2;
      const by = H - 36 - bh;

      const isSorted = arr[i] === [...arr].sort((a,b)=>a-b)[i];
      let col = isSorted ? '#00ffa3' : '#00e5ff';
      if (i === dragIdx) col = '#ff6b9d';
      else if (i === hoverIdx && dragIdx !== null) col = '#ffe040';

      const grad = ctx.createLinearGradient(bx, by, bx, by + bh);
      grad.addColorStop(0, col);
      grad.addColorStop(1, col + '44');
      ctx.fillStyle = grad;

      if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(bx, by, barW, bh, [4, 4, 0, 0]); ctx.fill(); }
      else ctx.fillRect(bx, by, barW, bh);

      // Glow on drag/hover
      if (i === dragIdx || i === hoverIdx) {
        ctx.shadowColor = col; ctx.shadowBlur = 18;
        ctx.fillStyle = col;
        if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(bx, by, barW, bh, [4, 4, 0, 0]); ctx.fill(); }
        else ctx.fillRect(bx, by, barW, bh);
        ctx.shadowBlur = 0;
      }

      // Value label
      ctx.fillStyle = (i === dragIdx) ? '#ff6b9d' : (isSorted ? '#00ffa3' : '#00e5ff');
      ctx.font = `bold ${Math.min(11, Math.floor(barW * 0.6))}px 'Space Mono',monospace`;
      ctx.textAlign = 'center';
      ctx.fillText(v, bx + barW / 2, by - 4);

      // Index label
      ctx.fillStyle = '#2a4060';
      ctx.font = `9px 'Space Mono',monospace`;
      ctx.fillText(i, bx + barW / 2, H - 18);
    });

    ctx.textAlign = 'start';

    // "Sorted" checkmarks
    if (solved) {
      ctx.fillStyle = '#00ffa3';
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'center';
      arr.forEach((v, i) => {
        const bx = 16 + i * gap + gap / 2;
        ctx.fillText('✓', bx, H - 4);
      });
      ctx.textAlign = 'start';
    }
  }

  function getBarIdx(x, canvasWidth) {
    const n = arr.length;
    const gap = (canvasWidth - 32) / n;
    return Math.max(0, Math.min(n - 1, Math.floor((x - 16) / gap)));
  }

  body.innerHTML = `
    <div class="quiz-instructions">
      <b>🎯 Goal:</b> Drag the bars to sort them in <b>ascending order</b> (shortest → tallest).<br>
      <b>💡 How:</b> Click a bar to grab it, then click the position to drop it. Green = correct position!
    </div>
    <div class="quiz-stats">
      <div class="quiz-stat">Moves<span id="sq-moves">0</span></div>
      <div class="quiz-stat">Time<span id="sq-time">0s</span></div>
      <div class="quiz-stat">Level<span id="sq-level">${LEVELS[level].label}</span></div>
    </div>
    <div class="quiz-canvas-wrap" id="sq-canvas-wrap">
      <canvas id="sq-canvas" width="720" height="260"></canvas>
    </div>
    <div class="quiz-feedback" id="sq-feedback">Loading…</div>
    <div class="quiz-btn-row">
      <button class="quiz-btn primary" onclick="sqNextLevel()">Next Level ›</button>
      <button class="quiz-btn" onclick="sqRestart()">↺ Restart</button>
      <button class="quiz-btn quiz-hint-btn" onclick="sqHint()">💡 Hint</button>
    </div>
  `;

  // Wire up canvas interaction
  const cvs = document.getElementById('sq-canvas');
  cvs.addEventListener('click', e => {
    if (solved) return;
    const rect = cvs.getBoundingClientRect();
    const scaleX = cvs.width / rect.width;
    const x = (e.clientX - rect.left) * scaleX;
    const idx = getBarIdx(x, cvs.width);

    if (dragIdx === null) {
      dragIdx = idx;
      setFeedback(`Grabbed bar [${arr[idx]}] — click where to drop it!`, '#ffe040');
    } else {
      if (dragIdx !== idx) {
        // swap
        [arr[dragIdx], arr[idx]] = [arr[idx], arr[dragIdx]];
        moves++;
        updateStats();
        checkSolved();
        if (!solved) setFeedback(`Swapped positions ${dragIdx} ↔ ${idx}. Keep going!`, '#9090c0');
      }
      dragIdx = null; hoverIdx = null;
    }
    render();
  });

  cvs.addEventListener('mousemove', e => {
    if (dragIdx === null || solved) return;
    const rect = cvs.getBoundingClientRect();
    const scaleX = cvs.width / rect.width;
    hoverIdx = getBarIdx((e.clientX - rect.left) * scaleX, cvs.width);
    render();
  });

  cvs.addEventListener('mouseleave', () => { hoverIdx = null; render(); });

  // Touch support
  cvs.addEventListener('touchstart', e => {
    e.preventDefault();
    const t = e.touches[0];
    const rect = cvs.getBoundingClientRect();
    const scaleX = cvs.width / rect.width;
    const idx = getBarIdx((t.clientX - rect.left) * scaleX, cvs.width);
    if (dragIdx === null) { dragIdx = idx; setFeedback(`Grabbed bar [${arr[idx]}] — tap where to drop!`, '#ffe040'); }
    else {
      if (dragIdx !== idx) { [arr[dragIdx], arr[idx]] = [arr[idx], arr[dragIdx]]; moves++; updateStats(); checkSolved(); if(!solved) setFeedback('Swapped! Keep sorting.','#9090c0'); }
      dragIdx = null;
    }
    render();
  }, { passive: false });

  window.sqNextLevel = () => {
    level = Math.min(level + 1, LEVELS.length - 1);
    document.getElementById('sq-level').textContent = LEVELS[level].label;
    document.getElementById('quiz-level-badge').textContent = LEVELS[level].label;
    initLevel();
  };
  window.sqRestart = () => { level = 0; document.getElementById('sq-level').textContent = LEVELS[0].label; initLevel(); };
  window.sqHint = () => {
    if (solved) return;
    // find first out-of-place bar
    const sorted = [...arr].sort((a,b)=>a-b);
    for (let i = 0; i < arr.length; i++) {
      if (arr[i] !== sorted[i]) {
        const j = arr.indexOf(sorted[i]);
        setFeedback(`💡 Hint: Swap position ${i} [${arr[i]}] with position ${j} [${arr[j]}]`, '#ffe040');
        // briefly highlight
        dragIdx = i; hoverIdx = j; render();
        setTimeout(() => { dragIdx = null; hoverIdx = null; render(); }, 1400);
        return;
      }
    }
  };

  initLevel();
}

/* ════════════════════════════════════════════════
   N-QUEENS QUIZ — place queens yourself on board
   ════════════════════════════════════════════════ */
function launchNQueensQuiz() {
  const accentColor = '#e879f9';
  createQuizOverlay('N-Queens Challenge', accentColor);
  const body = document.getElementById('quiz-body');

  let N = 5, board = Array(N).fill(-1), conflicts = new Set(), solved = false;
  let moves = 0, timer = null;

  function getConflicts(b, N) {
    const conf = new Set();
    for (let r1 = 0; r1 < N; r1++) {
      if (b[r1] === -1) continue;
      for (let r2 = r1 + 1; r2 < N; r2++) {
        if (b[r2] === -1) continue;
        if (b[r1] === b[r2] || Math.abs(b[r1] - b[r2]) === Math.abs(r1 - r2)) {
          conf.add(r1); conf.add(r2);
        }
      }
    }
    return conf;
  }

  function checkSolved() {
    const placed = board.filter(c => c !== -1).length;
    if (placed === N && getConflicts(board, N).size === 0) {
      solved = true;
      timer && timer.stop();
      const t = timer ? timer.getTime() : 0;
      setFeedback(`👑 Perfect! All ${N} queens placed safely! ${moves} moves · ${t}s`, '#00ffa3');
    }
  }

  function setFeedback(msg, color) {
    const fb = document.getElementById('nq-feedback');
    if (fb) { fb.textContent = msg; fb.style.color = color || '#9090c0'; }
  }

  function initBoard(newN) {
    N = newN; board = Array(N).fill(-1); conflicts = new Set(); solved = false; moves = 0;
    if (timer) timer.stop();
    timer = quizTimer('nq-time');
    setFeedback(`Click a cell to place/remove a queen. Place all ${N} queens safely!`, '#9090c0');
    document.getElementById('nq-moves').textContent = 0;
    render();
  }

  function render() {
    const c = document.getElementById('nq-canvas');
    if (!c) return;
    const W = c.width, H = c.height;
    const ctx = c.getContext('2d');
    conflicts = getConflicts(board, N);
    const cell = Math.min(Math.floor((W - 20) / N), Math.floor((H - 20) / N));
    const offX = Math.floor((W - cell * N) / 2);
    const offY = Math.floor((H - cell * N) / 2);

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#0a0a1a'; ctx.fillRect(0, 0, W, H);

    for (let r = 0; r < N; r++) {
      for (let col = 0; col < N; col++) {
        const x = offX + col * cell, y = offY + r * cell;
        const isLight = (r + col) % 2 === 0;
        ctx.fillStyle = isLight ? '#141430' : '#0e0e24';
        ctx.fillRect(x, y, cell, cell);

        // Border
        ctx.strokeStyle = 'rgba(232,121,249,0.2)'; ctx.lineWidth = 0.5;
        ctx.strokeRect(x, y, cell, cell);

        // Conflict highlight
        if (board[r] === col && conflicts.has(r)) {
          ctx.fillStyle = 'rgba(255,71,87,0.25)'; ctx.fillRect(x, y, cell, cell);
        }

        // Queen
        if (board[r] === col) {
          const isConflict = conflicts.has(r);
          ctx.shadowColor = isConflict ? '#ff4757' : '#e879f9';
          ctx.shadowBlur = 16;
          ctx.font = `${Math.floor(cell * 0.6)}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.fillStyle = isConflict ? '#ff4757' : (solved ? '#00ffa3' : '#e879f9');
          ctx.fillText('♛', x + cell / 2, y + cell * 0.72);
          ctx.shadowBlur = 0;
        }
      }
    }

    // Attack lines for conflicting queens
    conflicts.forEach(r => {
      if (board[r] !== -1) {
        const qx = offX + board[r] * cell + cell / 2;
        const qy = offY + r * cell + cell / 2;
        // row attack
        ctx.strokeStyle = 'rgba(255,71,87,0.15)'; ctx.lineWidth = cell - 4;
        ctx.beginPath(); ctx.moveTo(offX, qy); ctx.lineTo(offX + N * cell, qy); ctx.stroke();
      }
    });

    // Board border
    ctx.strokeStyle = '#2a2a5a'; ctx.lineWidth = 2;
    ctx.strokeRect(offX, offY, N * cell, N * cell);

    // Row numbers
    ctx.font = '9px Space Mono, monospace'; ctx.fillStyle = '#2a3060'; ctx.textAlign = 'right';
    for (let r = 0; r < N; r++) ctx.fillText(r, offX - 3, offY + r * cell + cell * 0.65);
    ctx.textAlign = 'start';

    // Placed counter
    const placed = board.filter(c => c !== -1).length;
    ctx.font = '11px Space Mono, monospace';
    ctx.fillStyle = '#5050a0';
    ctx.fillText(`Queens: ${placed}/${N}  Conflicts: ${conflicts.size / 2 | 0}`, offX, offY - 6);
  }

  function handleClick(x, y) {
    if (solved) return;
    const c = document.getElementById('nq-canvas');
    const cell = Math.min(Math.floor((c.width - 20) / N), Math.floor((c.height - 20) / N));
    const offX = Math.floor((c.width - cell * N) / 2);
    const offY = Math.floor((c.height - cell * N) / 2);
    const col = Math.floor((x - offX) / cell);
    const row = Math.floor((y - offY) / cell);
    if (row < 0 || row >= N || col < 0 || col >= N) return;

    if (board[row] === col) {
      board[row] = -1; // remove queen
      setFeedback(`Removed queen from row ${row}.`, '#9090c0');
    } else {
      board[row] = col; // place/move queen
      moves++;
      document.getElementById('nq-moves').textContent = moves;
      const conf = getConflicts(board, N);
      if (conf.size > 0) setFeedback(`⚠️ Conflict! Queens in rows ${[...conf].join(', ')} attack each other.`, '#ff4757');
      else setFeedback(`✅ No conflicts so far — keep placing!`, '#00ffa3');
      checkSolved();
    }
    render();
  }

  body.innerHTML = `
    <div class="quiz-instructions">
      <b>♛ Goal:</b> Place <b>${5} queens</b> on the board so no two queens attack each other.<br>
      <b>💡 Rules:</b> No two queens can share the same row, column, or diagonal.<br>
      <b>🖱 How:</b> Click any cell to place/move a queen. Red = conflict!
    </div>
    <div class="quiz-stats">
      <div class="quiz-stat">Moves<span id="nq-moves">0</span></div>
      <div class="quiz-stat">Time<span id="nq-time">0s</span></div>
      <div class="quiz-stat">Board<span id="nq-size">${N}×${N}</span></div>
    </div>
    <div class="quiz-canvas-wrap">
      <canvas id="nq-canvas" width="480" height="480" style="cursor:pointer;"></canvas>
    </div>
    <div class="quiz-feedback" id="nq-feedback">Click a cell to place a queen!</div>
    <div class="quiz-btn-row">
      <button class="quiz-btn primary" onclick="nqNextSize()">Harder (${N+1}×${N+1}) ›</button>
      <button class="quiz-btn" onclick="nqClear()">↺ Clear Board</button>
      <button class="quiz-btn quiz-hint-btn" onclick="nqHint()">💡 Hint</button>
    </div>
  `;

  const cvs = document.getElementById('nq-canvas');
  cvs.addEventListener('click', e => {
    const r = cvs.getBoundingClientRect();
    handleClick((e.clientX - r.left) * (cvs.width / r.width), (e.clientY - r.top) * (cvs.height / r.height));
  });
  cvs.addEventListener('touchstart', e => {
    e.preventDefault();
    const r = cvs.getBoundingClientRect(), t = e.touches[0];
    handleClick((t.clientX - r.left) * (cvs.width / r.width), (t.clientY - r.top) * (cvs.height / r.height));
  }, { passive: false });

  window.nqClear = () => { board = Array(N).fill(-1); solved = false; moves = 0; if(timer)timer.stop(); timer=quizTimer('nq-time'); document.getElementById('nq-moves').textContent=0; setFeedback(`Board cleared! Place ${N} queens.`,'#9090c0'); render(); };
  window.nqNextSize = () => {
    N = Math.min(N + 1, 8);
    board = Array(N).fill(-1); solved = false; moves = 0;
    if (timer) timer.stop(); timer = quizTimer('nq-time');
    document.getElementById('nq-moves').textContent = 0;
    document.getElementById('nq-size').textContent = N+'×'+N;
    const btn = document.querySelector('.quiz-btn.primary');
    if (btn && N < 8) btn.textContent = `Harder (${N+1}×${N+1}) ›`;
    else if (btn) btn.textContent = 'Max size!';
    setFeedback(`New board: ${N}×${N}. Place ${N} queens!`, accentColor);
    render();
  };
  window.nqHint = () => {
    // find first empty row and suggest a safe column
    for (let r = 0; r < N; r++) {
      for (let col = 0; col < N; col++) {
        const test = [...board]; test[r] = col;
        if (getConflicts(test, N).size === 0) {
          setFeedback(`💡 Hint: Row ${r}, Column ${col} is currently safe!`, '#ffe040');
          return;
        }
      }
    }
    setFeedback('💡 No safe move found — try clearing and restarting!', '#ffe040');
  };

  initBoard(N);
}


/* ════════════════════════════════════════════════════════
   BRANCH 7 — ADVANCED GRAPHS
   Topo Sort: click nodes in valid topological order
   MST (Kruskal/Prim): click edges to build minimum spanning tree
   Bellman-Ford: fill in shortest distance table
   ════════════════════════════════════════════════════════ */
function launchTopoQuiz() {
  const accent = '#fb923c';
  createQuizOverlay('Topological Sort — Order the DAG', accent);
  const body = document.getElementById('quiz-body');

  const NODES = ['A','B','C','D','E','F','G'];
  const EDGES = [['A','C'],['A','D'],['B','D'],['B','E'],['C','F'],['D','F'],['D','G'],['E','G']];
  const adj = Object.fromEntries(NODES.map(n=>[n,[]]));
  EDGES.forEach(([u,v])=>adj[u].push(v));

  function isValidNext(placed, next) {
    return EDGES.filter(([,v])=>v===next).every(([u])=>placed.includes(u));
  }

  let placed = [], moves = 0, timer = null, solved = false;

  function setFeedback(msg, color) { const fb=document.getElementById('tq2-feedback'); if(fb){fb.textContent=msg;fb.style.color=color||'#9090c0';} }

  function initQuiz() {
    placed=[]; moves=0; solved=false;
    if(timer)timer.stop(); timer=quizTimer('tq2-time');
    document.getElementById('tq2-moves').textContent=0;
    renderNodes();
    setFeedback('Click nodes in a valid topological order — all prerequisites must come first!','#9090c0');
  }

  function renderNodes() {
    const el=document.getElementById('tq2-nodes'); if(!el)return;
    const available=NODES.filter(n=>!placed.includes(n)&&isValidNext(placed,n));
    el.innerHTML=NODES.map(n=>{
      const isPlaced=placed.includes(n), isAvail=available.includes(n), idx=placed.indexOf(n);
      const bg=isPlaced?'rgba(251,146,60,0.2)':isAvail?'rgba(251,146,60,0.08)':'rgba(255,255,255,0.02)';
      const bc=isPlaced?accent:isAvail?accent+'66':'#2a2a5a';
      const col=isPlaced?accent:isAvail?'#c0c0e0':'#3a3a6a';
      return`<div onclick="tq2Click('${n}')" style="width:72px;height:72px;border-radius:12px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;background:${bg};border:2px solid ${bc};cursor:${isAvail&&!isPlaced?'pointer':'default'};transition:all 0.2s;">
        <span style="font-family:'Orbitron',monospace;font-size:20px;font-weight:700;color:${col};">${n}</span>
        <span style="font-family:'Space Mono',monospace;font-size:9px;color:${isPlaced?accent:'#3a3a6a'};">${isPlaced?'#'+(idx+1):isAvail?'ready':'waiting'}</span>
      </div>`;
    }).join('');
    document.getElementById('tq2-result').innerHTML=`<div style="font-family:'Space Mono',monospace;font-size:10px;color:#3a5070;margin-bottom:6px;">ORDER SO FAR:</div>
      <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;min-height:32px;">${placed.length?placed.map((n,i)=>`<span style="padding:5px 12px;background:rgba(251,146,60,0.15);border:1px solid ${accent};border-radius:6px;font-family:'Space Mono',monospace;font-size:13px;font-weight:700;color:${accent};">${n}</span>${i<placed.length-1?`<span style="color:#3a5070;">→</span>`:''}`).join(''):'<span style="color:#2a4060;font-family:Space Mono,monospace;font-size:12px;">click a node to start…</span>'}</div>`;
  }

  window.tq2Click=(n)=>{
    if(solved||placed.includes(n))return;
    if(!isValidNext(placed,n)){const prereqs=EDGES.filter(([,v])=>v===n).map(([u])=>u).filter(u=>!placed.includes(u));setFeedback(`❌ Can't place ${n} yet — [${prereqs.join(', ')}] must come first!`,'#ff4757');return;}
    placed.push(n);moves++;document.getElementById('tq2-moves').textContent=moves;
    if(placed.length===NODES.length){solved=true;timer&&timer.stop();setFeedback(`🎉 Valid topological order! [${placed.join('→')}] · ${timer?timer.getTime():0}s`,'#00ffa3');}
    else setFeedback(`✅ ${n} placed at #${placed.length}. ${NODES.length-placed.length} remaining.`,'#00ffa3');
    renderNodes();
  };

  body.innerHTML=`
    <div class="quiz-instructions"><b>📋 Topological Sort:</b> Click nodes so every prerequisite appears before its dependent.<br>
    Edges: <span style="color:#fb923c;font-family:'Space Mono',monospace;font-size:11px;">${EDGES.map(([u,v])=>`${u}→${v}`).join('  ')}</span></div>
    <div class="quiz-stats"><div class="quiz-stat">Moves<span id="tq2-moves">0</span></div><div class="quiz-stat">Time<span id="tq2-time">0s</span></div></div>
    <div id="tq2-nodes" style="display:flex;gap:10px;flex-wrap:wrap;justify-content:center;background:#111128;border:1px solid #2a2a5a;border-radius:12px;padding:16px;"></div>
    <div id="tq2-result" style="background:#111128;border:1px solid #2a2a5a;border-radius:12px;padding:14px;"></div>
    <div class="quiz-feedback" id="tq2-feedback"></div>
    <div class="quiz-btn-row"><button class="quiz-btn" onclick="tq2Reset()">↺ Restart</button><button class="quiz-btn quiz-hint-btn" onclick="tq2Hint()">💡 Hint</button></div>`;
  window.tq2Reset=()=>initQuiz();
  window.tq2Hint=()=>{const avail=NODES.filter(n=>!placed.includes(n)&&isValidNext(placed,n));if(avail.length)setFeedback(`💡 Any of [${avail.join(', ')}] can be placed next!`,'#ffe040');};
  initQuiz();
}

function launchMSTQuiz() {
  const isPrim=currentExp==='prim', accent='#fbbf24';
  createQuizOverlay(isPrim?"Prim's MST — Grow the Tree":"Kruskal's MST — Pick the Edges",accent);
  const body=document.getElementById('quiz-body');

  const NODES=[{id:0,label:'A',x:200,y:80},{id:1,label:'B',x:80,y:200},{id:2,label:'C',x:320,y:200},
               {id:3,label:'D',x:80,y:340},{id:4,label:'E',x:320,y:340},{id:5,label:'F',x:200,y:420}];
  const EDGES=[{u:0,v:1,w:4},{u:0,v:2,w:3},{u:1,v:2,w:2},{u:1,v:3,w:5},{u:2,v:4,w:6},{u:3,v:4,w:7},{u:3,v:5,w:8},{u:4,v:5,w:1}];

  const sorted=[...EDGES].sort((a,b)=>a.w-b.w);
  const par=[0,1,2,3,4,5]; function find(x){return par[x]===x?x:par[x]=find(par[x]);}
  const correctMST=new Set();
  sorted.forEach(e=>{const pu=find(e.u),pv=find(e.v);if(pu!==pv){par[pu]=pv;correctMST.add(`${Math.min(e.u,e.v)},${Math.max(e.u,e.v)}`);  }});

  let selectedEdges=new Set(),moves=0,timer=null,solved=false;
  function ek(u,v){return`${Math.min(u,v)},${Math.max(u,v)}`;}
  function setFeedback(msg,color){const fb=document.getElementById('mq-feedback');if(fb){fb.textContent=msg;fb.style.color=color||'#9090c0';}}

  function checkSolved(){
    if(selectedEdges.size!==5)return;
    const selW=EDGES.filter(e=>selectedEdges.has(ek(e.u,e.v))).reduce((s,e)=>s+e.w,0);
    const mstW=EDGES.filter(e=>correctMST.has(ek(e.u,e.v))).reduce((s,e)=>s+e.w,0);
    const p2=[0,1,2,3,4,5];function f2(x){return p2[x]===x?x:p2[x]=f2(p2[x]);}
    [...selectedEdges].map(k=>k.split(',').map(Number)).forEach(([u,v])=>{const pu=f2(u),pv=f2(v);if(pu!==pv)p2[pu]=pv;});
    const roots=new Set(NODES.map(n=>f2(n.id)));
    if(roots.size===1&&selW===mstW){solved=true;timer&&timer.stop();setFeedback(`🎉 Correct MST! Total weight = ${selW}. ${moves} moves · ${timer?timer.getTime():0}s`,'#00ffa3');}
    else if(roots.size>1)setFeedback(`⚠️ Not fully connected — keep adding edges.`,'#f59e0b');
    else setFeedback(`❌ Weight ${selW} ≠ optimal ${mstW}. Try lighter edges!`,'#ff4757');
  }

  function render(){
    const c=document.getElementById('mq-canvas');if(!c)return;
    const W=c.width,H=c.height,ctx=c.getContext('2d');
    ctx.clearRect(0,0,W,H);ctx.fillStyle='#0a0a1a';ctx.fillRect(0,0,W,H);
    EDGES.forEach(e=>{
      const a=NODES[e.u],b=NODES[e.v],key=ek(e.u,e.v),isSel=selectedEdges.has(key),isCorrect=correctMST.has(key);
      ctx.strokeStyle=isSel?(isCorrect?'#00ffa3':'#ff4757'):'#1e3050';ctx.lineWidth=isSel?3:1.5;
      ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();
      const mx=(a.x+b.x)/2,my=(a.y+b.y)/2;
      ctx.fillStyle='#0a0a1a';ctx.beginPath();ctx.arc(mx,my,10,0,Math.PI*2);ctx.fill();
      ctx.fillStyle=isSel?(isCorrect?'#00ffa3':'#ff4757'):'#3a5070';ctx.font='bold 10px Space Mono,monospace';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(e.w,mx,my);ctx.textBaseline='alphabetic';
    });
    NODES.forEach(nd=>{
      const r=22,inMST=[...selectedEdges].some(k=>k.split(',').map(Number).includes(nd.id));
      ctx.fillStyle=inMST?'rgba(251,191,36,0.2)':'#0a1825';ctx.beginPath();ctx.arc(nd.x,nd.y,r,0,Math.PI*2);ctx.fill();
      ctx.strokeStyle=inMST?accent:'#1e3050';ctx.lineWidth=2;ctx.beginPath();ctx.arc(nd.x,nd.y,r,0,Math.PI*2);ctx.stroke();
      ctx.fillStyle=inMST?accent:'#3d5470';ctx.font='bold 13px Space Mono,monospace';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(nd.label,nd.x,nd.y);ctx.textBaseline='alphabetic';
    });ctx.textAlign='start';
  }

  function getEdgeAt(x,y){return EDGES.find(e=>{const a=NODES[e.u],b=NODES[e.v],t=((x-a.x)*(b.x-a.x)+(y-a.y)*(b.y-a.y))/((b.x-a.x)**2+(b.y-a.y)**2),tc=Math.max(0,Math.min(1,t));return Math.hypot(x-(a.x+tc*(b.x-a.x)),y-(a.y+tc*(b.y-a.y)))<12;});}

  body.innerHTML=`
    <div class="quiz-instructions"><b>🌉 ${isPrim?"Prim's":"Kruskal's"} MST:</b> Click edges to build the Minimum Spanning Tree.<br>Select exactly <b>5 edges</b> connecting all 6 nodes with minimum total weight. No cycles!</div>
    <div class="quiz-stats"><div class="quiz-stat">Moves<span id="mq-moves">0</span></div><div class="quiz-stat">Time<span id="mq-time">0s</span></div><div class="quiz-stat">Edges<span id="mq-edges">0/5</span></div></div>
    <div class="quiz-canvas-wrap"><canvas id="mq-canvas" width="500" height="480" style="cursor:pointer;max-width:100%;"></canvas></div>
    <div class="quiz-feedback" id="mq-feedback">Click edges to add/remove from your MST!</div>
    <div class="quiz-btn-row"><button class="quiz-btn" onclick="mqReset()">↺ Restart</button><button class="quiz-btn quiz-hint-btn" onclick="mqHint()">💡 Hint</button></div>`;

  const cvs=document.getElementById('mq-canvas');
  function handleClick(x,y){if(solved)return;const e=getEdgeAt(x,y);if(!e)return;const key=ek(e.u,e.v);if(selectedEdges.has(key))selectedEdges.delete(key);else{selectedEdges.add(key);moves++;document.getElementById('mq-moves').textContent=moves;}document.getElementById('mq-edges').textContent=`${selectedEdges.size}/5`;checkSolved();render();}
  cvs.addEventListener('click',e=>{const r=cvs.getBoundingClientRect();handleClick((e.clientX-r.left)*(cvs.width/r.width),(e.clientY-r.top)*(cvs.height/r.height));});
  cvs.addEventListener('touchstart',e=>{e.preventDefault();const r=cvs.getBoundingClientRect(),t=e.touches[0];handleClick((t.clientX-r.left)*(cvs.width/r.width),(t.clientY-r.top)*(cvs.height/r.height));},{passive:false});
  timer=quizTimer('mq-time');
  window.mqReset=()=>{selectedEdges=new Set();moves=0;solved=false;if(timer)timer.stop();timer=quizTimer('mq-time');document.getElementById('mq-moves').textContent=0;document.getElementById('mq-edges').textContent='0/5';setFeedback('Click edges to build the MST!','#9090c0');render();};
  window.mqHint=()=>{const notYet=[...correctMST].filter(k=>!selectedEdges.has(k));if(notYet.length){const[u,v]=notYet[0].split(',').map(Number);const e=EDGES.find(e=>e.u===u&&e.v===v);setFeedback(`💡 Edge ${NODES[u].label}—${NODES[v].label} (weight ${e.w}) is in the optimal MST.`,'#ffe040');}};
  render();
}

function launchBellmanQuiz() {
  const accent='#f87171';
  createQuizOverlay('Bellman-Ford — Fill the Distance Table',accent);
  const body=document.getElementById('quiz-body');

  const NODES=['A','B','C','D','E'];
  const EDGES=[{u:0,v:1,w:6},{u:0,v:2,w:7},{u:1,v:3,w:5},{u:1,v:2,w:8},{u:1,v:4,w:-4},{u:2,v:3,w:-3},{u:2,v:4,w:9},{u:3,v:0,w:2},{u:4,v:3,w:7}];
  function bellman(src){const dist=Array(5).fill(Infinity);dist[src]=0;for(let i=0;i<4;i++)EDGES.forEach(({u,v,w})=>{if(dist[u]+w<dist[v])dist[v]=dist[u]+w;});return dist;}
  const CORRECT=bellman(0);
  const NP=[{x:240,y:60},{x:100,y:180},{x:380,y:180},{x:100,y:340},{x:380,y:340}];

  let userDist=Array(5).fill(''),selected=null,moves=0,timer=null,solved=false;
  function setFeedback(msg,color){const fb=document.getElementById('bf-feedback');if(fb){fb.textContent=msg;fb.style.color=color||'#9090c0';}}
  function checkSolved(){if(userDist.every((v,i)=>v!==''&&parseInt(v)===CORRECT[i])){solved=true;timer&&timer.stop();setFeedback(`🎉 All distances correct! ${moves} moves · ${timer?timer.getTime():0}s`,'#00ffa3');}}

  function render(){
    const c=document.getElementById('bf-canvas');if(!c)return;
    const W=c.width,H=c.height,ctx=c.getContext('2d');
    ctx.clearRect(0,0,W,H);ctx.fillStyle='#0a0a1a';ctx.fillRect(0,0,W,H);
    EDGES.forEach(({u,v,w})=>{const a=NP[u],b=NP[v];ctx.strokeStyle=w<0?'rgba(248,113,113,0.6)':'#1e3050';ctx.lineWidth=w<0?2:1.5;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();const mx=(a.x+b.x)/2,my=(a.y+b.y)/2;ctx.fillStyle=w<0?'#f87171':'#3a5070';ctx.font='bold 10px Space Mono,monospace';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(w,mx,my-6);ctx.textBaseline='alphabetic';});
    NP.forEach((p,i)=>{const r=24,isSel=selected===i,ua=userDist[i],correct=ua!==''&&parseInt(ua)===CORRECT[i],wrong=ua!==''&&parseInt(ua)!==CORRECT[i];ctx.fillStyle=isSel?'rgba(248,113,113,0.3)':correct?'rgba(0,255,163,0.15)':wrong?'rgba(255,71,87,0.15)':'#0a1825';ctx.beginPath();ctx.arc(p.x,p.y,r,0,Math.PI*2);ctx.fill();ctx.strokeStyle=isSel?accent:correct?'#00ffa3':wrong?'#ff4757':'#1e3050';ctx.lineWidth=2;ctx.beginPath();ctx.arc(p.x,p.y,r,0,Math.PI*2);ctx.stroke();ctx.fillStyle=isSel?accent:correct?'#00ffa3':wrong?'#ff4757':'#3d5470';ctx.font='bold 13px Space Mono,monospace';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(NODES[i],p.x,p.y);ctx.font='bold 10px Space Mono,monospace';ctx.fillStyle=correct?'#00ffa3':wrong?'#ff4757':'#5a7090';ctx.fillText(ua===''?'?':ua,p.x,p.y+r+14);ctx.textBaseline='alphabetic';});
    ctx.fillStyle='#2a4060';ctx.font='10px Space Mono,monospace';ctx.textAlign='left';ctx.fillText('Source: A   Red = negative edges',10,H-10);ctx.textAlign='start';
  }

  body.innerHTML=`
    <div class="quiz-instructions"><b>🛡 Bellman-Ford:</b> Click each node and enter its shortest distance from <b>A</b>.<br>Red edges have <b>negative weights</b> — the shortest path may use them!</div>
    <div class="quiz-stats"><div class="quiz-stat">Moves<span id="bf-moves">0</span></div><div class="quiz-stat">Time<span id="bf-time">0s</span></div><div class="quiz-stat">Correct<span id="bf-correct">0/5</span></div></div>
    <div class="quiz-canvas-wrap"><canvas id="bf-canvas" width="500" height="420" style="cursor:pointer;max-width:100%;"></canvas></div>
    <div style="display:flex;gap:6px;justify-content:center;flex-wrap:wrap;background:#111128;border:1px solid #2a2a5a;border-radius:10px;padding:10px;">
      <button class="quiz-btn" style="flex:0 0 44px;padding:8px 0;color:#f87171;" onclick="bfInput('-')">±</button>
      ${[0,1,2,3,4,5,6,7,8,9].map(n=>`<button class="quiz-btn" style="flex:0 0 38px;padding:8px 0;" onclick="bfInput(${n})">${n}</button>`).join('')}
      <button class="quiz-btn" style="flex:0 0 44px;padding:8px 0;color:#ff4757;" onclick="bfInput(-1)">⌫</button>
    </div>
    <div class="quiz-feedback" id="bf-feedback">Click a node then enter its shortest distance from A.</div>
    <div class="quiz-btn-row"><button class="quiz-btn" onclick="bfReset()">↺ Restart</button><button class="quiz-btn quiz-hint-btn" onclick="bfHint()">💡 Hint</button></div>`;

  timer=quizTimer('bf-time');
  const cvs=document.getElementById('bf-canvas');
  function handleClick(x,y){const nd=NP.findIndex(p=>Math.hypot(p.x-x,p.y-y)<26);if(nd===-1)return;selected=nd;setFeedback(`Node ${NODES[nd]} selected. Enter shortest distance from A.`,accent);render();}
  cvs.addEventListener('click',e=>{const r=cvs.getBoundingClientRect();handleClick((e.clientX-r.left)*(cvs.width/r.width),(e.clientY-r.top)*(cvs.height/r.height));});
  cvs.addEventListener('touchstart',e=>{e.preventDefault();const r=cvs.getBoundingClientRect(),t=e.touches[0];handleClick((t.clientX-r.left)*(cvs.width/r.width),(t.clientY-r.top)*(cvs.height/r.height));},{passive:false});

  window.bfInput=(n)=>{if(selected===null){setFeedback('Click a node first!','#ff4757');return;}if(n==='-'){userDist[selected]=userDist[selected].startsWith('-')?userDist[selected].slice(1):'-'+userDist[selected];render();return;}if(n===-1)userDist[selected]=userDist[selected].slice(0,-1)||'';else userDist[selected]=(userDist[selected]===''||userDist[selected]==='-')?userDist[selected]+n:userDist[selected]+n;moves++;document.getElementById('bf-moves').textContent=moves;const correct=userDist.filter((v,i)=>v!==''&&parseInt(v)===CORRECT[i]).length;document.getElementById('bf-correct').textContent=`${correct}/5`;const ua=userDist[selected];if(ua!==''&&ua!=='-'&&parseInt(ua)===CORRECT[selected])setFeedback(`✅ ${NODES[selected]}: distance ${ua} correct!`,'#00ffa3');checkSolved();render();};
  const kh=e=>{if(!document.getElementById('bf-canvas')){document.removeEventListener('keydown',kh);return;}if(selected===null)return;if(e.key>='0'&&e.key<='9'){e.preventDefault();window.bfInput(+e.key);}if(e.key==='-'){e.preventDefault();window.bfInput('-');}if(e.key==='Backspace'||e.key==='Delete'){e.preventDefault();window.bfInput(-1);}};
  document.addEventListener('keydown',kh);
  window.bfReset=()=>{userDist=Array(5).fill('');selected=null;moves=0;solved=false;if(timer)timer.stop();timer=quizTimer('bf-time');document.getElementById('bf-moves').textContent=0;document.getElementById('bf-correct').textContent='0/5';setFeedback('Click a node then enter its distance from A.','#9090c0');render();};
  window.bfHint=()=>{const unsolved=NODES.findIndex((_,i)=>userDist[i]===''||parseInt(userDist[i])!==CORRECT[i]);if(unsolved!==-1)setFeedback(`💡 ${NODES[unsolved]}: shortest distance from A = ${CORRECT[unsolved]}`,'#ffe040');};
  render();
}

/* ════════════════════════════════════════════════════════
   BRANCH 8 — STRINGS
   KMP/Rabin-Karp: click positions where pattern matches in text
   Trie: type and insert words to build the prefix tree
   ════════════════════════════════════════════════════════ */
function launchKMPQuiz() {
  const accent='#818cf8';
  createQuizOverlay('KMP — Spot the Pattern Matches',accent);
  const body=document.getElementById('quiz-body');

  const CHALLENGES=[{text:'AABAACAADAABAAABAA',pattern:'AABAA',correct:[0,9,13]},{text:'ABCABCABCABD',pattern:'ABC',correct:[0,3,6]},{text:'ABABDABABCABABAB',pattern:'ABABAB',correct:[9]}];
  let lvl=0,userPicks=new Set(),moves=0,timer=null,solved=false;

  function setFeedback(msg,color){const fb=document.getElementById('kq2-feedback');if(fb){fb.textContent=msg;fb.style.color=color||'#9090c0';}}
  function checkSolved(){const{correct}=CHALLENGES[lvl];if([...userPicks].every(i=>correct.includes(i))&&correct.every(i=>userPicks.has(i))&&userPicks.size===correct.length){solved=true;timer&&timer.stop();setFeedback(`🎉 Found all ${correct.length} match(es) correctly! ${moves} moves · ${timer?timer.getTime():0}s`,'#00ffa3');}}

  function renderChallenge(){
    const{text,pattern}=CHALLENGES[lvl];const n=text.length,m=pattern.length;
    const charW=Math.max(24,Math.min(34,Math.floor(500/n)));
    let html=`<div style="overflow-x:auto;padding:8px 0;"><div style="display:flex;gap:1px;margin-bottom:4px;">`;
    for(let i=0;i<n;i++)html+=`<div style="width:${charW}px;text-align:center;font-family:'Space Mono',monospace;font-size:8px;color:#2a4060;">${i}</div>`;
    html+=`</div><div style="display:flex;gap:1px;margin-bottom:8px;">`;
    for(let i=0;i<n;i++){const isStart=i<=n-m,isPick=userPicks.has(i),isCorrect=isPick&&CHALLENGES[lvl].correct.includes(i),isWrong=isPick&&!CHALLENGES[lvl].correct.includes(i);const bg=isWrong?'rgba(255,71,87,0.3)':isPick?'rgba(129,140,248,0.3)':'rgba(129,140,248,0.05)';const bc=isWrong?'#ff4757':isPick?accent:'rgba(129,140,248,0.2)';const col=isWrong?'#ff4757':isPick?accent:'#5a7090';html+=`<div onclick="${isStart&&!solved?`kmpPick(${i})`:'void 0'}" style="width:${charW}px;height:${charW}px;display:flex;align-items:center;justify-content:center;background:${bg};border:1px solid ${bc};border-radius:4px;font-family:'Space Mono',monospace;font-size:${Math.min(14,charW*0.45)}px;font-weight:700;color:${col};cursor:${isStart?'pointer':'default'};transition:all 0.15s;">${text[i]}</div>`;}
    html+=`</div><div style="display:flex;gap:1px;">`;
    for(let i=0;i<m;i++)html+=`<div style="width:${charW}px;height:${charW}px;display:flex;align-items:center;justify-content:center;background:rgba(245,158,11,0.15);border:1px solid rgba(245,158,11,0.3);border-radius:4px;font-family:'Space Mono',monospace;font-size:${Math.min(14,charW*0.45)}px;font-weight:700;color:#f59e0b;">${pattern[i]}</div>`;
    html+=`</div><div style="font-family:'Space Mono',monospace;font-size:10px;color:#3a5070;margin-top:4px;">▲ Pattern to find</div></div>`;
    document.getElementById('kq2-grid').innerHTML=html;
  }

  window.kmpPick=(i)=>{if(solved)return;if(userPicks.has(i))userPicks.delete(i);else{userPicks.add(i);moves++;document.getElementById('kq2-moves').textContent=moves;}const{text,pattern,correct}=CHALLENGES[lvl];if(userPicks.has(i)){if(correct.includes(i))setFeedback(`✅ Match at index ${i}! "${text.slice(i,i+pattern.length)}" = pattern.`,'#00ffa3');else setFeedback(`❌ No match at ${i} — "${text.slice(i,i+pattern.length)}" ≠ "${pattern}".`,'#ff4757');}renderChallenge();checkSolved();};

  body.innerHTML=`
    <div class="quiz-instructions"><b>🔍 KMP Match Finder:</b> Click every position where the pattern <b>starts</b> in the text.<br>Click a character to mark it as a match start. Click again to unmark.</div>
    <div class="quiz-stats"><div class="quiz-stat">Moves<span id="kq2-moves">0</span></div><div class="quiz-stat">Time<span id="kq2-time">0s</span></div><div class="quiz-stat">Level<span id="kq2-level">1/${CHALLENGES.length}</span></div></div>
    <div style="background:#111128;border:1px solid #2a2a5a;border-radius:12px;padding:14px;">
      <div style="font-family:'Space Mono',monospace;font-size:11px;color:#5a7090;margin-bottom:10px;" id="kq2-pattern-label">Pattern: <span style="color:${accent};font-weight:700;">${CHALLENGES[0].pattern}</span> | Click where it matches:</div>
      <div id="kq2-grid"></div>
    </div>
    <div class="quiz-feedback" id="kq2-feedback">Click every position where the pattern starts!</div>
    <div class="quiz-btn-row"><button class="quiz-btn primary" onclick="kmpNext()">Next ›</button><button class="quiz-btn" onclick="kmpReset()">↺ Restart</button><button class="quiz-btn quiz-hint-btn" onclick="kmpHint()">💡 Hint</button></div>`;
  timer=quizTimer('kq2-time');
  window.kmpNext=()=>{lvl=Math.min(lvl+1,CHALLENGES.length-1);userPicks=new Set();moves=0;solved=false;if(timer)timer.stop();timer=quizTimer('kq2-time');document.getElementById('kq2-level').textContent=(lvl+1)+'/'+CHALLENGES.length;document.getElementById('kq2-moves').textContent=0;const{pattern}=CHALLENGES[lvl];document.getElementById('kq2-pattern-label').innerHTML=`Pattern: <span style="color:${accent};font-weight:700;">${pattern}</span> | Click where it matches:`;renderChallenge();setFeedback('Click every match start position!','#9090c0');};
  window.kmpReset=()=>{lvl=0;userPicks=new Set();moves=0;solved=false;if(timer)timer.stop();timer=quizTimer('kq2-time');document.getElementById('kq2-level').textContent='1/'+CHALLENGES.length;document.getElementById('kq2-moves').textContent=0;renderChallenge();setFeedback('Click match positions!','#9090c0');};
  window.kmpHint=()=>{const{correct}=CHALLENGES[lvl];const r=correct.filter(i=>!userPicks.has(i));if(r.length)setFeedback(`💡 There is a match starting at index ${r[0]}.`,'#ffe040');else setFeedback(`💡 All matches found! Double-check you haven't marked wrong positions.`,'#ffe040');};
  renderChallenge();
}

function launchRabinKarpQuiz() {
  const accent='#c084fc';
  createQuizOverlay('Rabin-Karp — Rolling Hash Windows',accent);
  const body=document.getElementById('quiz-body');

  const TEXT='ABCABCABCABDABC',PATTERN='ABC',correct=[0,3,6,12];
  let userPicks=new Set(),moves=0,timer=null,solved=false;
  const n=TEXT.length,m=PATTERN.length;

  function setFeedback(msg,color){const fb=document.getElementById('rkq-feedback');if(fb){fb.textContent=msg;fb.style.color=color||'#9090c0';}}
  function checkSolved(){if([...userPicks].every(i=>correct.includes(i))&&correct.every(i=>userPicks.has(i))){solved=true;timer&&timer.stop();setFeedback(`🎉 Found all ${correct.length} matches! ${moves} moves · ${timer?timer.getTime():0}s`,'#00ffa3');}}

  function renderGrid(){
    const charW=Math.max(26,Math.min(34,Math.floor(520/n)));
    let html=`<div style="overflow-x:auto;padding:4px 0;"><div style="display:flex;gap:1px;margin-bottom:4px;">`;
    for(let i=0;i<n;i++)html+=`<div style="width:${charW}px;text-align:center;font-family:'Space Mono',monospace;font-size:8px;color:#2a4060;">${i}</div>`;
    html+=`</div><div style="display:flex;gap:1px;margin-bottom:8px;">`;
    for(let i=0;i<n;i++){const isPick=userPicks.has(i)&&i<=n-m,isCorrect=isPick&&correct.includes(i),isWrong=isPick&&!correct.includes(i),canClick=i<=n-m;const bg=isWrong?'rgba(255,71,87,0.3)':isPick?'rgba(192,132,252,0.3)':'rgba(192,132,252,0.05)';const bc=isWrong?'#ff4757':isPick?accent:'rgba(192,132,252,0.2)';html+=`<div onclick="${canClick&&!solved?`rkPick(${i})`:'void 0'}" style="width:${charW}px;height:${charW}px;display:flex;align-items:center;justify-content:center;background:${bg};border:1px solid ${bc};border-radius:4px;font-family:'Space Mono',monospace;font-size:${Math.min(14,charW*0.45)}px;font-weight:700;color:${isPick?(isWrong?'#ff4757':accent):'#5a7090'};cursor:${canClick?'pointer':'default'};transition:all 0.15s;">${TEXT[i]}</div>`;}
    html+=`</div><div style="display:flex;gap:1px;">`;
    for(let i=0;i<m;i++)html+=`<div style="width:${charW}px;height:${charW}px;display:flex;align-items:center;justify-content:center;background:rgba(245,158,11,0.15);border:1px solid rgba(245,158,11,0.3);border-radius:4px;font-family:'Space Mono',monospace;font-size:${Math.min(14,charW*0.45)}px;font-weight:700;color:#f59e0b;">${PATTERN[i]}</div>`;
    html+=`</div><div style="font-family:'Space Mono',monospace;font-size:10px;color:#3a5070;margin-top:4px;">▲ Pattern</div></div>`;
    document.getElementById('rkq-grid').innerHTML=html;
  }

  window.rkPick=(i)=>{if(solved)return;if(userPicks.has(i))userPicks.delete(i);else{userPicks.add(i);moves++;document.getElementById('rkq-moves').textContent=moves;}if(userPicks.has(i)){const win=TEXT.slice(i,i+m);if(win===PATTERN)setFeedback(`✅ "${win}" at index ${i} — exact match!`,'#00ffa3');else setFeedback(`❌ "${win}" ≠ "${PATTERN}" — wrong window.`,'#ff4757');}renderGrid();checkSolved();};

  body.innerHTML=`
    <div class="quiz-instructions"><b>#️⃣ Rabin-Karp:</b> Click every position where the sliding window exactly matches the pattern.<br>Text: <span style="color:${accent};font-family:'Space Mono',monospace;">${TEXT}</span>&nbsp; Pattern: <span style="color:#f59e0b;font-family:'Space Mono',monospace;">${PATTERN}</span></div>
    <div class="quiz-stats"><div class="quiz-stat">Moves<span id="rkq-moves">0</span></div><div class="quiz-stat">Time<span id="rkq-time">0s</span></div><div class="quiz-stat">Found<span id="rkq-found">0/${correct.length}</span></div></div>
    <div style="background:#111128;border:1px solid #2a2a5a;border-radius:12px;padding:14px;"><div id="rkq-grid"></div></div>
    <div class="quiz-feedback" id="rkq-feedback">Click every window start where the pattern matches!</div>
    <div class="quiz-btn-row"><button class="quiz-btn" onclick="rkReset()">↺ Restart</button><button class="quiz-btn quiz-hint-btn" onclick="rkHint()">💡 Hint</button></div>`;
  timer=quizTimer('rkq-time');
  window.rkReset=()=>{userPicks=new Set();moves=0;solved=false;if(timer)timer.stop();timer=quizTimer('rkq-time');document.getElementById('rkq-moves').textContent=0;document.getElementById('rkq-found').textContent='0/'+correct.length;renderGrid();setFeedback('Click match positions!','#9090c0');};
  window.rkHint=()=>{const r=correct.filter(i=>!userPicks.has(i));if(r.length)setFeedback(`💡 Match at index ${r[0]}.`,'#ffe040');};
  renderGrid();
}

function launchTrieQuiz() {
  const accent='#6ee7b7';
  createQuizOverlay('Trie — Build the Prefix Tree',accent);
  const body=document.getElementById('quiz-body');

  const WORDS=['CAT','CAR','CARD','BAT','BAND','BAN','APP','APPLE'];
  let insertedWords=new Set(),inputWord='',moves=0,timer=null,solved=false;

  function setFeedback(msg,color){const fb=document.getElementById('trq-feedback');if(fb){fb.textContent=msg;fb.style.color=color||'#9090c0';}}

  function buildTrie(words){const root={ch:'',children:{},isEnd:false};words.forEach(w=>{let n=root;for(const c of w){if(!n.children[c])n.children[c]={ch:c,children:{},isEnd:false};n=n.children[c];}n.isEnd=true;});return root;}

  function renderTrie(){
    const root=buildTrie([...insertedWords]);
    const nodes=[],edges=[];
    function layout(node,depth,left,right,parentId){const id=nodes.length;nodes.push({id,ch:node.ch||'⬛',isEnd:node.isEnd,x:(left+right)/2,y:40+depth*70});if(parentId!==null)edges.push({from:parentId,to:id,ch:node.ch});const children=Object.values(node.children);const step=(right-left)/Math.max(children.length,1);children.forEach((c,i)=>layout(c,depth+1,left+i*step,left+(i+1)*step,id));}
    layout(root,0,20,580,null);
    const c=document.getElementById('trq-canvas');if(!c)return;
    const ctx=c.getContext('2d');ctx.clearRect(0,0,c.width,c.height);ctx.fillStyle='#0a0a1a';ctx.fillRect(0,0,c.width,c.height);
    edges.forEach(({from,to,ch})=>{const a=nodes[from],b=nodes[to];ctx.strokeStyle='rgba(110,231,183,0.3)';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();ctx.fillStyle=accent;ctx.font='bold 10px Space Mono,monospace';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(ch,(a.x+b.x)/2-6,(a.y+b.y)/2);ctx.textBaseline='alphabetic';});
    nodes.forEach(({id,ch,isEnd,x,y})=>{if(id===0)return;const r=isEnd?16:12;ctx.fillStyle=isEnd?'rgba(110,231,183,0.25)':'rgba(110,231,183,0.06)';ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();ctx.strokeStyle=isEnd?accent:'rgba(110,231,183,0.3)';ctx.lineWidth=isEnd?2:1;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.stroke();if(isEnd){ctx.shadowColor=accent;ctx.shadowBlur=8;}ctx.fillStyle=isEnd?accent:'#5a9080';ctx.font=`bold ${Math.min(11,r*0.75)}px Space Mono,monospace`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(ch,x,y);ctx.shadowBlur=0;ctx.textBaseline='alphabetic';});
    ctx.textAlign='start';
    const el=document.getElementById('trq-wordlist');if(el)el.innerHTML=WORDS.map(w=>{const ins=insertedWords.has(w);return`<span style="padding:4px 10px;border-radius:6px;background:${ins?'rgba(110,231,183,0.2)':'rgba(255,255,255,0.02)'};border:1px solid ${ins?accent:'#2a2a5a'};font-family:'Space Mono',monospace;font-size:12px;color:${ins?accent:'#3a3a6a'};">${w}${ins?' ✓':''}</span>`;}).join('');
  }

  body.innerHTML=`
    <div class="quiz-instructions"><b>🌿 Build the Trie!</b> Insert all ${WORDS.length} words: <span style="color:${accent};font-family:'Space Mono',monospace;font-size:11px;">${WORDS.join(', ')}</span><br>Type using the letter buttons or keyboard, then press INSERT.</div>
    <div class="quiz-stats"><div class="quiz-stat">Moves<span id="trq-moves">0</span></div><div class="quiz-stat">Time<span id="trq-time">0s</span></div><div class="quiz-stat">Words<span id="trq-words">0/${WORDS.length}</span></div></div>
    <div class="quiz-canvas-wrap"><canvas id="trq-canvas" width="600" height="320" style="max-width:100%;"></canvas></div>
    <div id="trq-wordlist" style="display:flex;gap:6px;flex-wrap:wrap;padding:10px;background:#111128;border:1px solid #2a2a5a;border-radius:10px;"></div>
    <div style="background:#111128;border:1px solid #2a2a5a;border-radius:10px;padding:10px;display:flex;flex-direction:column;gap:8px;">
      <div style="display:flex;align-items:center;gap:8px;justify-content:center;">
        <span style="font-family:'Space Mono',monospace;font-size:14px;color:${accent};min-width:80px;text-align:center;padding:6px 12px;background:#0a1520;border:1px solid ${accent};border-radius:6px;" id="trq-input">_</span>
        <button class="quiz-btn primary" style="padding:8px 16px;" onclick="trqInsert()">⬆ INSERT</button>
        <button class="quiz-btn" style="padding:8px 8px;color:#ff4757;" onclick="trqClearInput()">✕</button>
      </div>
      <div style="display:flex;gap:4px;flex-wrap:wrap;justify-content:center;">
        ${'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map(l=>`<button class="quiz-btn" style="flex:0 0 34px;padding:5px 0;font-size:11px;" onclick="trqType('${l}')">${l}</button>`).join('')}
      </div>
    </div>
    <div class="quiz-feedback" id="trq-feedback">Type a word, then press INSERT!</div>
    <div class="quiz-btn-row"><button class="quiz-btn" onclick="trqReset()">↺ Restart</button><button class="quiz-btn quiz-hint-btn" onclick="trqHint()">💡 Hint</button></div>`;
  timer=quizTimer('trq-time');
  window.trqType=(l)=>{inputWord+=l;document.getElementById('trq-input').textContent=inputWord||'_';};
  window.trqClearInput=()=>{inputWord='';document.getElementById('trq-input').textContent='_';};
  window.trqInsert=()=>{if(!inputWord)return;if(!WORDS.includes(inputWord)){setFeedback(`"${inputWord}" not in word list. Try: ${WORDS.filter(w=>!insertedWords.has(w)).slice(0,3).join(', ')}…`,'#ff4757');inputWord='';document.getElementById('trq-input').textContent='_';return;}if(insertedWords.has(inputWord)){setFeedback(`"${inputWord}" already inserted!`,'#f59e0b');}else{insertedWords.add(inputWord);moves++;document.getElementById('trq-moves').textContent=moves;document.getElementById('trq-words').textContent=`${insertedWords.size}/${WORDS.length}`;setFeedback(`✅ "${inputWord}" inserted!`,accent);}inputWord='';document.getElementById('trq-input').textContent='_';if(insertedWords.size===WORDS.length){solved=true;timer&&timer.stop();setFeedback(`🎉 All ${WORDS.length} words inserted! Trie complete.`,'#00ffa3');}renderTrie();};
  window.trqReset=()=>{insertedWords=new Set();inputWord='';moves=0;solved=false;if(timer)timer.stop();timer=quizTimer('trq-time');document.getElementById('trq-moves').textContent=0;document.getElementById('trq-words').textContent=`0/${WORDS.length}`;document.getElementById('trq-input').textContent='_';renderTrie();setFeedback('Insert all words!','#9090c0');};
  window.trqHint=()=>{const r=WORDS.filter(w=>!insertedWords.has(w));if(r.length)setFeedback(`💡 Try inserting: "${r[0]}"`,'#ffe040');};
  const kh=e=>{if(!document.getElementById('trq-canvas')){document.removeEventListener('keydown',kh);return;}if(e.key.match(/^[A-Za-z]$/)){e.preventDefault();window.trqType(e.key.toUpperCase());}if(e.key==='Enter'){e.preventDefault();window.trqInsert();}if(e.key==='Backspace'){e.preventDefault();inputWord=inputWord.slice(0,-1);document.getElementById('trq-input').textContent=inputWord||'_';}};
  document.addEventListener('keydown',kh);
  renderTrie();
}

/* ════════════════════════════════════════════════════════
   BRANCH 9 — SEARCHING
   Binary/Interpolation: guess target using binary search logic
   ════════════════════════════════════════════════════════ */
function launchBinarySearchQuiz() {
  const isInterp=currentExp==='interpolation-search', accent='#38bdf8';
  createQuizOverlay(isInterp?'Interpolation Search — Guess Smart!':'Binary Search — Find the Number!',accent);
  const body=document.getElementById('quiz-body');

  const LEVELS=[{n:16,label:'EASY'},{n:32,label:'MEDIUM'},{n:64,label:'HARD'}];
  let lvl=0,arr=[],target=0,lo=0,hi=0,moves=0,timer=null,solved=false,history=[];

  function initLevel(){
    const n=LEVELS[lvl].n;arr=Array.from({length:n},(_,i)=>i*3+1);lo=0;hi=n-1;target=arr[Math.floor(Math.random()*n)];moves=0;solved=false;history=[];
    if(timer)timer.stop();timer=quizTimer('bs-time');document.getElementById('bs-moves').textContent=0;
    setFeedback(`Find the hidden number! Range: [${arr[lo]}…${arr[hi]}]. Use the Higher/Lower/Found buttons.`,'#9090c0');renderArray();
  }

  function setFeedback(msg,color){const fb=document.getElementById('bs-feedback');if(fb){fb.textContent=msg;fb.style.color=color||'#9090c0';}}

  function renderArray(){
    const el=document.getElementById('bs-array');if(!el)return;
    const n=arr.length,cellW=Math.max(14,Math.min(26,Math.floor(560/n)));
    const mid=lo<=hi?(isInterp?lo+Math.floor(((target-arr[lo])/(arr[hi]-arr[lo]))*(hi-lo)):Math.floor((lo+hi)/2)):-1;
    let html=`<div style="overflow-x:auto;padding:4px 0;"><div style="display:flex;gap:1px;">`;
    for(let i=0;i<n;i++){const inRange=i>=lo&&i<=hi,isMid=i===mid&&lo<=hi,isFound=solved&&arr[i]===target;const bg=isFound?'rgba(0,255,163,0.3)':isMid?'rgba(56,189,248,0.35)':inRange?'rgba(56,189,248,0.1)':'rgba(255,255,255,0.02)';const bc=isFound?'#00ffa3':isMid?accent:inRange?'rgba(56,189,248,0.3)':'#1e1e3a';const col=isFound?'#00ffa3':isMid?accent:inRange?'#5a8aaa':'#2a2a4a';html+=`<div style="width:${cellW}px;height:${cellW}px;display:flex;align-items:center;justify-content:center;background:${bg};border:1px solid ${bc};border-radius:3px;font-family:'Space Mono',monospace;font-size:${Math.min(9,cellW*0.35)}px;color:${col};">${arr[i]}</div>`;}
    html+=`</div></div>`;
    if(lo<=hi){const mid2=isInterp?lo+Math.floor(((target-arr[lo])/(arr[hi]-arr[lo]))*(hi-lo)):Math.floor((lo+hi)/2);const sm=Math.max(lo,Math.min(hi,mid2));html+=`<div style="margin-top:8px;font-family:'Space Mono',monospace;font-size:12px;color:#5a8aaa;">lo=${arr[lo]}  hi=${arr[hi]}  <span style="color:${accent};font-weight:700;">${isInterp?'probe':'mid'}=${arr[sm]}</span></div>`;}
    el.innerHTML=html;
    document.getElementById('bs-lo').textContent=lo<=hi?arr[lo]:'—';document.getElementById('bs-hi').textContent=lo<=hi?arr[hi]:'—';
  }

  body.innerHTML=`
    <div class="quiz-instructions"><b>${isInterp?'📡 Interpolation':'🎯 Binary'} Search:</b> I'm hiding a number in the sorted array.<br>Use <b>Higher / Lower / Found</b> buttons based on the highlighted probe cell.</div>
    <div class="quiz-stats"><div class="quiz-stat">Guesses<span id="bs-moves">0</span></div><div class="quiz-stat">Time<span id="bs-time">0s</span></div><div class="quiz-stat">Level<span id="bs-level">${LEVELS[0].label}</span></div></div>
    <div style="background:#111128;border:1px solid #2a2a5a;border-radius:12px;padding:14px;" id="bs-array"></div>
    <div style="text-align:center;padding:10px;font-family:'Space Mono',monospace;font-size:13px;color:#5a7090;">Range: [<span id="bs-lo" style="color:${accent};">…</span> … <span id="bs-hi" style="color:${accent};">…</span>]</div>
    <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;">
      <button class="quiz-btn" style="flex:1;min-width:90px;padding:12px;color:#f87171;border-color:#f87171;" onclick="bsGuess('lower')">◄ Lower</button>
      <button class="quiz-btn primary" style="flex:1;min-width:90px;padding:12px;" onclick="bsGuess('found')">✓ Found!</button>
      <button class="quiz-btn" style="flex:1;min-width:90px;padding:12px;color:#f59e0b;border-color:#f59e0b;" onclick="bsGuess('higher')">Higher ►</button>
    </div>
    <div class="quiz-feedback" id="bs-feedback"></div>
    <div id="bs-history" style="font-family:'Space Mono',monospace;font-size:10px;color:#3a5070;text-align:center;margin-top:4px;"></div>
    <div class="quiz-btn-row"><button class="quiz-btn primary" onclick="bsNextLevel()">Next Level ›</button><button class="quiz-btn" onclick="bsReset()">↺ New Game</button><button class="quiz-btn quiz-hint-btn" onclick="bsHint()">💡 Hint</button></div>`;

  window.bsGuess=(choice)=>{
    if(solved||lo>hi)return;
    const mid=isInterp?lo+Math.floor(((target-arr[lo])/(arr[hi]-arr[lo]))*(hi-lo)):Math.floor((lo+hi)/2);
    const sm=Math.max(lo,Math.min(hi,mid));const pv=arr[sm];moves++;document.getElementById('bs-moves').textContent=moves;
    history.push(`Probe=${pv}→${choice}`);document.getElementById('bs-history').textContent=history.slice(-3).join(' | ');
    if(choice==='found'){if(pv===target){solved=true;timer&&timer.stop();setFeedback(`🎉 Found ${target} in ${moves} guesses!`,'#00ffa3');}else setFeedback(`❌ Probe is ${pv}, not the target. Higher or Lower?`,'#ff4757');}
    else if(choice==='higher'){if(target>pv){lo=sm+1;setFeedback(`✅ Target > ${pv} — searching right half.`,'#00ffa3');}else setFeedback(`❌ Target is NOT higher than ${pv}. Try again!`,'#ff4757');}
    else{if(target<pv){hi=sm-1;setFeedback(`✅ Target < ${pv} — searching left half.`,'#00ffa3');}else setFeedback(`❌ Target is NOT lower than ${pv}. Try again!`,'#ff4757');}
    renderArray();
  };
  window.bsNextLevel=()=>{lvl=Math.min(lvl+1,LEVELS.length-1);document.getElementById('bs-level').textContent=LEVELS[lvl].label;initLevel();};
  window.bsReset=()=>{lvl=0;document.getElementById('bs-level').textContent=LEVELS[0].label;initLevel();};
  window.bsHint=()=>{const mid=isInterp?lo+Math.floor(((target-arr[lo])/(arr[hi]-arr[lo]))*(hi-lo)):Math.floor((lo+hi)/2);const sm=Math.max(lo,Math.min(hi,mid));const pv=arr[sm];if(target===pv)setFeedback(`💡 The probe value IS the target! Click Found!`,'#ffe040');else if(target>pv)setFeedback(`💡 Target is Higher than probe (${pv}).`,'#ffe040');else setFeedback(`💡 Target is Lower than probe (${pv}).`,'#ffe040');};
  initLevel();
}

/* ════════════════════════════════════════════════════════
   BRANCH 10 — GREEDY
   Activity Selection: click non-overlapping activities to maximize count
   Huffman Coding: assign binary codes to characters
   ════════════════════════════════════════════════════════ */
function launchActivityQuiz() {
  const accent='#a3e635';
  createQuizOverlay('Activity Selection — Pick the Most!',accent);
  const body=document.getElementById('quiz-body');

  const ACTIVITIES=[{id:1,s:1,e:3},{id:2,s:0,e:6},{id:3,s:5,e:7},{id:4,s:3,e:9},{id:5,s:5,e:9},{id:6,s:6,e:10},{id:7,s:8,e:11},{id:8,s:8,e:12},{id:9,s:2,e:13},{id:10,s:11,e:14}];
  const sorted=[...ACTIVITIES].sort((a,b)=>a.e-b.e);
  const correctSel=new Set();let lastEnd=-Infinity;sorted.forEach(a=>{if(a.s>=lastEnd){correctSel.add(a.id);lastEnd=a.e;}});
  const maxEnd=Math.max(...ACTIVITIES.map(a=>a.e))+1;
  let selected=new Set(),moves=0,timer=null,solved=false;

  function setFeedback(msg,color){const fb=document.getElementById('aq-feedback');if(fb){fb.textContent=msg;fb.style.color=color||'#9090c0';}}
  function hasOverlap(sel){const acts=[...sel].map(id=>ACTIVITIES.find(a=>a.id===id)).sort((a,b)=>a.s-b.s);for(let i=1;i<acts.length;i++)if(acts[i].s<acts[i-1].e)return true;return false;}
  function checkSolved(){if(hasOverlap(selected)){setFeedback(`⚠️ Overlap! Some activities conflict.`,'#ff4757');return;}if(selected.size===correctSel.size&&[...selected].every(id=>correctSel.has(id))){solved=true;timer&&timer.stop();setFeedback(`🎉 Optimal! ${selected.size} activities with no conflicts! ${moves} moves · ${timer?timer.getTime():0}s`,'#00ffa3');}else if(selected.size>0)setFeedback(`${selected.size} activities, no conflicts yet — can you fit more?`,'#9090c0');}

  function renderActivities(){
    const timeScale=460/maxEnd;const rowH=32;const ox=50,oy=10;
    let html=`<div style="overflow-x:auto;"><div style="position:relative;height:${ACTIVITIES.length*rowH+50}px;min-width:520px;">`;
    for(let t=0;t<=maxEnd;t+=2)html+=`<div style="position:absolute;left:${ox+t*timeScale}px;top:${ACTIVITIES.length*rowH+14}px;font-family:'Space Mono',monospace;font-size:8px;color:#2a4060;">${t}</div>`;
    ACTIVITIES.forEach((a,i)=>{const isSel=selected.has(a.id),isConflict=isSel&&hasOverlap(selected),col=isSel?(isConflict?'#ff4757':accent):'#1e3a5a';const bx=ox+a.s*timeScale,bw=(a.e-a.s)*timeScale,by=oy+i*rowH;html+=`<div onclick="aqToggle(${a.id})" style="position:absolute;left:${bx}px;top:${by+4}px;width:${bw}px;height:${rowH-8}px;background:${col}${isSel?'':'44'};border:2px solid ${col};border-radius:4px;display:flex;align-items:center;justify-content:center;font-family:'Space Mono',monospace;font-size:10px;font-weight:700;color:${isSel?'#0a0a1a':'#3d5070'};cursor:pointer;transition:all 0.15s;box-shadow:${isSel?`0 0 8px ${col}`:'none'};">A${a.id}</div>`;});
    html+=`</div></div>`;document.getElementById('aq-bars').innerHTML=html;
  }

  window.aqToggle=(id)=>{if(solved)return;if(selected.has(id))selected.delete(id);else{selected.add(id);moves++;document.getElementById('aq-moves').textContent=moves;}renderActivities();checkSolved();document.getElementById('aq-count').textContent=selected.size;};

  body.innerHTML=`
    <div class="quiz-instructions"><b>📅 Activity Selection:</b> Click activities to select them — maximize count with <b>no overlaps</b>.<br>💡 Greedy tip: Sort by finish time, always pick earliest-ending compatible activity!</div>
    <div class="quiz-stats"><div class="quiz-stat">Moves<span id="aq-moves">0</span></div><div class="quiz-stat">Time<span id="aq-time">0s</span></div><div class="quiz-stat">Selected<span id="aq-count">0</span></div></div>
    <div id="aq-bars" style="background:#111128;border:1px solid #2a2a5a;border-radius:12px;padding:14px;"></div>
    <div class="quiz-feedback" id="aq-feedback">Click activities — maximize count with no overlaps!</div>
    <div class="quiz-btn-row"><button class="quiz-btn" onclick="aqReset()">↺ Restart</button><button class="quiz-btn quiz-hint-btn" onclick="aqHint()">💡 Hint</button></div>`;
  timer=quizTimer('aq-time');
  window.aqReset=()=>{selected=new Set();moves=0;solved=false;if(timer)timer.stop();timer=quizTimer('aq-time');document.getElementById('aq-moves').textContent=0;document.getElementById('aq-count').textContent=0;renderActivities();setFeedback('Click activities!','#9090c0');};
  window.aqHint=()=>{const next=sorted.find(a=>![...selected].some(id=>ACTIVITIES.find(x=>x.id===id)?.e>a.s)&&!selected.has(a.id));if(next)setFeedback(`💡 A${next.id} [${next.s},${next.e}] — earliest finish with no conflict.`,'#ffe040');};
  renderActivities();setFeedback('Click activities to select!','#9090c0');
}

function launchHuffmanQuiz() {
  const accent='#f59e0b';
  createQuizOverlay('Huffman Coding — Assign the Codes',accent);
  const body=document.getElementById('quiz-body');

  const TEXT='ABRACADABRA';const freq={};for(const c of TEXT)freq[c]=(freq[c]||0)+1;
  class HN{constructor(ch,f,l,r){this.ch=ch;this.f=f;this.left=l||null;this.right=r||null;}}
  let pq=Object.entries(freq).map(([ch,f])=>new HN(ch,f,null,null));
  while(pq.length>1){pq.sort((a,b)=>a.f-b.f);const a=pq.shift(),b=pq.shift();pq.push(new HN(null,a.f+b.f,a,b));}
  const root=pq[0];const correctCodes={};
  function buildCodes(node,code){if(!node)return;if(node.ch)correctCodes[node.ch]=code||'0';buildCodes(node.left,code+'0');buildCodes(node.right,code+'1');}
  buildCodes(root,'');
  const chars=Object.keys(freq).sort();
  let userCodes={},selectedChar=null,moves=0,timer=null,solved=false;

  function setFeedback(msg,color){const fb=document.getElementById('hq-feedback');if(fb){fb.textContent=msg;fb.style.color=color||'#9090c0';}}
  function checkSolved(){if(chars.every(c=>userCodes[c]===correctCodes[c])){solved=true;timer&&timer.stop();setFeedback(`🎉 All Huffman codes correct! ${moves} moves · ${timer?timer.getTime():0}s`,'#00ffa3');}}

  function renderCodes(){
    const el=document.getElementById('hq-chars');if(!el)return;
    el.innerHTML=chars.map(c=>{const isSel=selectedChar===c,uc=userCodes[c]||'',correct=uc!==''&&uc===correctCodes[c],wrong=uc!==''&&uc!==correctCodes[c];const bc=isSel?accent:correct?'#00ffa3':wrong?'#ff4757':'#2a2a5a';const bg=isSel?'rgba(245,158,11,0.15)':correct?'rgba(0,255,163,0.1)':wrong?'rgba(255,71,87,0.1)':'#111128';return`<div onclick="hqSelect('${c}')" style="padding:12px 14px;background:${bg};border:2px solid ${bc};border-radius:10px;cursor:pointer;transition:all 0.2s;min-width:80px;text-align:center;"><div style="font-family:'Orbitron',monospace;font-size:18px;font-weight:700;color:${isSel?accent:'#c0c0e0'};">${c}</div><div style="font-family:'Space Mono',monospace;font-size:9px;color:#3a5070;margin:2px 0;">freq: ${freq[c]}</div><div style="font-family:'Space Mono',monospace;font-size:13px;font-weight:700;color:${correct?'#00ffa3':wrong?'#ff4757':isSel?accent:'#3a5070'};">${uc||'?'}</div></div>`;}).join('');
  }

  window.hqSelect=(c)=>{selectedChar=c;setFeedback(`'${c}' (freq=${freq[c]}) selected. Enter its Huffman code using 0 and 1.`,accent);renderCodes();};
  window.hqBit=(b)=>{if(selectedChar===null){setFeedback('Click a character first!','#ff4757');return;}if(b===-1)userCodes[selectedChar]=(userCodes[selectedChar]||'').slice(0,-1);else{userCodes[selectedChar]=(userCodes[selectedChar]||'')+b;moves++;document.getElementById('hq-moves').textContent=moves;}const uc=userCodes[selectedChar];const correct=uc===correctCodes[selectedChar];if(correct)setFeedback(`✅ '${selectedChar}' = "${uc}" is correct!`,'#00ffa3');else if(uc!=='')setFeedback(`'${selectedChar}' code: "${uc}" (${uc.length} bits so far)`,'#9090c0');const corr=chars.filter(c=>userCodes[c]===correctCodes[c]).length;document.getElementById('hq-correct').textContent=`${corr}/${chars.length}`;renderCodes();checkSolved();};

  body.innerHTML=`
    <div class="quiz-instructions"><b>📨 Huffman Coding:</b> Assign binary codes to each character.<br>Text: <span style="color:${accent};font-family:'Space Mono',monospace;">${TEXT}</span><br>More frequent = shorter code. Build the tree: left=0, right=1.</div>
    <div class="quiz-stats"><div class="quiz-stat">Moves<span id="hq-moves">0</span></div><div class="quiz-stat">Time<span id="hq-time">0s</span></div><div class="quiz-stat">Correct<span id="hq-correct">0/${chars.length}</span></div></div>
    <div id="hq-chars" style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center;background:#111128;border:1px solid #2a2a5a;border-radius:12px;padding:14px;"></div>
    <div style="display:flex;gap:10px;justify-content:center;background:#111128;border:1px solid #2a2a5a;border-radius:10px;padding:10px;">
      <button class="quiz-btn" style="flex:1;padding:12px;font-size:20px;font-weight:700;" onclick="hqBit(0)">0</button>
      <button class="quiz-btn" style="flex:1;padding:12px;font-size:20px;font-weight:700;" onclick="hqBit(1)">1</button>
      <button class="quiz-btn" style="flex:0 0 50px;padding:12px;color:#ff4757;" onclick="hqBit(-1)">⌫</button>
    </div>
    <div class="quiz-feedback" id="hq-feedback">Click a character, then enter its Huffman code!</div>
    <div class="quiz-btn-row"><button class="quiz-btn" onclick="hqReset()">↺ Restart</button><button class="quiz-btn quiz-hint-btn" onclick="hqHint()">💡 Hint</button></div>`;
  timer=quizTimer('hq-time');
  const kh=e=>{if(!document.getElementById('hq-chars')){document.removeEventListener('keydown',kh);return;}if(selectedChar===null)return;if(e.key==='0'||e.key==='1'){e.preventDefault();window.hqBit(+e.key);}if(e.key==='Backspace'){e.preventDefault();window.hqBit(-1);}};
  document.addEventListener('keydown',kh);
  window.hqReset=()=>{userCodes={};selectedChar=null;moves=0;solved=false;if(timer)timer.stop();timer=quizTimer('hq-time');document.getElementById('hq-moves').textContent=0;document.getElementById('hq-correct').textContent=`0/${chars.length}`;renderCodes();setFeedback('Click a character to assign its Huffman code!','#9090c0');};
  window.hqHint=()=>{const wrong=chars.find(c=>userCodes[c]===undefined||userCodes[c]!==correctCodes[c]);if(wrong)setFeedback(`💡 '${wrong}' (freq ${freq[wrong]}) → code "${correctCodes[wrong]}"`,'#ffe040');};
  renderCodes();setFeedback('Click a character to assign its Huffman code!','#9090c0');
}

/* ════════════════════════════════════════════════════════
   BRANCH 3 — GRAPH QUIZ
   BFS: click nodes in BFS order from A
   DFS: click nodes in DFS order from A
   Dijkstra: assign correct shortest distances by clicking
   ════════════════════════════════════════════════════════ */
function launchGraphQuiz(algoId) {
  const accent = '#06b6d4';
  createQuizOverlay('Graph Traversal Quiz', accent);
  const body = document.getElementById('quiz-body');

  // Fixed small graph for quiz (6 nodes, deterministic)
  const NODES = [
    {id:0,label:'A',x:300,y:80},  {id:1,label:'B',x:160,y:180},
    {id:2,label:'C',x:440,y:180}, {id:3,label:'D',x:100,y:320},
    {id:4,label:'E',x:300,y:320}, {id:5,label:'F',x:480,y:320},
  ];
  const EDGES = [{u:0,v:1,w:4},{u:0,v:2,w:2},{u:1,v:3,w:5},{u:1,v:4,w:3},
                 {u:2,v:4,w:1},{u:2,v:5,w:6},{u:4,v:3,w:2},{u:4,v:5,w:4}];
  const ADJ = Array.from({length:6},()=>[]);
  EDGES.forEach(({u,v,w})=>{ ADJ[u].push({v,w}); ADJ[v].push({v:u,w}); });

  // Compute correct answers
  function bfsOrder(src) {
    const vis=new Set([src]), q=[src], order=[];
    while(q.length){const u=q.shift();order.push(u);for(const{v}of ADJ[u])if(!vis.has(v)){vis.add(v);q.push(v);}}
    return order;
  }
  function dfsOrder(src) {
    const vis=new Set(), order=[];
    function dfs(u){vis.add(u);order.push(u);for(const{v}of ADJ[u])if(!vis.has(v))dfs(v);}
    dfs(src); return order;
  }
  function dijkstraDist(src) {
    const dist=Array(6).fill(Infinity); dist[src]=0;
    const pq=[[0,src]];
    while(pq.length){
      pq.sort((a,b)=>a[0]-b[0]);const[d,u]=pq.shift();
      if(d>dist[u]) continue;
      for(const{v,w}of ADJ[u])if(dist[u]+w<dist[v]){dist[v]=dist[u]+w;pq.push([dist[v],v]);}
    }
    return dist;
  }

  const correctBFS = bfsOrder(0);
  const correctDFS = dfsOrder(0);
  const correctDist = dijkstraDist(0);

  let clicked = [], inputDist = Array(6).fill(''), selectedNode = null;
  let moves = 0, timer = null, solved = false;

  const MODE = algoId; // 'bfs','dfs','dijkstra'
  const modeLabel = MODE==='bfs'?'BFS':MODE==='dfs'?'DFS':"Dijkstra's";
  const correctOrder = MODE==='dijkstra' ? null : (MODE==='bfs' ? correctBFS : correctDFS);

  function setFeedback(msg, color) {
    const fb = document.getElementById('gq-feedback');
    if(fb){fb.textContent=msg; fb.style.color=color||'#9090c0';}
  }

  function checkSolved() {
    if(MODE==='dijkstra') {
      const allRight = inputDist.every((v,i)=>parseInt(v)===correctDist[i]);
      if(allRight){ solved=true; timer&&timer.stop(); setFeedback(`🎉 All distances correct! ${moves} moves · ${timer?timer.getTime():0}s`,'#00ffa3'); }
    } else {
      if(clicked.length===NODES.length && JSON.stringify(clicked)===JSON.stringify(correctOrder)){
        solved=true; timer&&timer.stop();
        setFeedback(`🎉 Correct ${modeLabel} order! ${moves} moves · ${timer?timer.getTime():0}s`,'#00ffa3');
      }
    }
    render();
  }

  function getNodeAt(x,y) {
    return NODES.find(n=>Math.hypot(n.x-x,n.y-y)<26);
  }

  function render() {
    const c=document.getElementById('gq-canvas');
    if(!c) return;
    const W=c.width,H=c.height,ctx=c.getContext('2d');
    ctx.clearRect(0,0,W,H); ctx.fillStyle='#0a0a1a'; ctx.fillRect(0,0,W,H);

    // Edges
    EDGES.forEach(({u,v,w})=>{
      const a=NODES[u],b=NODES[v];
      ctx.strokeStyle='#1e3050'; ctx.lineWidth=2;
      ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y); ctx.stroke();
      const mx=(a.x+b.x)/2, my=(a.y+b.y)/2;
      ctx.fillStyle='#2a4060'; ctx.font='10px Space Mono,monospace';
      ctx.textAlign='center'; ctx.fillText(w,mx,my-5);
    });

    // Nodes
    NODES.forEach((nd,i)=>{
      const r=24;
      const orderIdx = clicked.indexOf(i);
      const isClicked = orderIdx!==-1;
      const isSelected = selectedNode===i;
      let fill='#0a1825', stroke='#1e3050', textC='#3d5470';

      if(isClicked){ fill='rgba(0,229,255,0.25)'; stroke=accent; textC=accent; }
      if(isSelected){ fill='rgba(0,229,255,0.4)'; stroke='#fff'; textC='#fff'; }
      if(solved){ fill='rgba(0,255,163,0.2)'; stroke='#00ffa3'; textC='#00ffa3'; }

      // Wrong click highlight
      if(MODE!=='dijkstra' && isClicked && orderIdx < clicked.length) {
        const expected = correctOrder[orderIdx];
        if(expected !== i){ fill='rgba(255,71,87,0.25)'; stroke='#ff4757'; textC='#ff4757'; }
      }

      ctx.shadowColor=isSelected?accent:'transparent'; ctx.shadowBlur=isSelected?16:0;
      ctx.fillStyle=fill; ctx.beginPath(); ctx.arc(nd.x,nd.y,r,0,Math.PI*2); ctx.fill();
      ctx.strokeStyle=stroke; ctx.lineWidth=2;
      ctx.beginPath(); ctx.arc(nd.x,nd.y,r,0,Math.PI*2); ctx.stroke();
      ctx.shadowBlur=0;

      ctx.fillStyle=textC; ctx.font='bold 14px Space Mono,monospace';
      ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(nd.label,nd.x,nd.y);

      // Order badge
      if(MODE!=='dijkstra' && isClicked){
        ctx.fillStyle=accent; ctx.font='bold 10px Space Mono,monospace';
        ctx.fillText(orderIdx+1,nd.x+r-2,nd.y-r+2);
      }

      // Distance input display
      if(MODE==='dijkstra'){
        const val = inputDist[i];
        const correct = parseInt(val)===correctDist[i];
        ctx.fillStyle=val===''?'#2a4060':(correct?'#00ffa3':'#ff4757');
        ctx.font='bold 11px Space Mono,monospace';
        ctx.fillText(val===''?'?':val, nd.x, nd.y+r+14);
      }
      ctx.textBaseline='alphabetic'; ctx.textAlign='start';
    });
  }

  const instrMap = {
    bfs: `<b>🌊 BFS:</b> Click nodes in the order BFS would visit them starting from <b>A</b>.<br>BFS visits neighbors level by level (uses a Queue).`,
    dfs: `<b>🌲 DFS:</b> Click nodes in the order DFS would visit them starting from <b>A</b>.<br>DFS goes as deep as possible first (uses a Stack/recursion).`,
    dijkstra: `<b>🗺 Dijkstra:</b> Click each node, then type its shortest distance from <b>A</b>.<br>Use the number pad below. Edge weights are shown on each edge.`,
  };

  body.innerHTML = `
    <div class="quiz-instructions">${instrMap[MODE]}</div>
    <div class="quiz-stats">
      <div class="quiz-stat">Moves<span id="gq-moves">0</span></div>
      <div class="quiz-stat">Time<span id="gq-time">0s</span></div>
      <div class="quiz-stat">${MODE==='dijkstra'?'Correct':'Visited'}<span id="gq-progress">0/${NODES.length}</span></div>
    </div>
    <div class="quiz-canvas-wrap"><canvas id="gq-canvas" width="600" height="420" style="cursor:pointer;max-width:100%;"></canvas></div>
    ${MODE==='dijkstra'?`
    <div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap;align-items:center;background:#111128;border:1px solid #2a2a5a;border-radius:10px;padding:10px;">
      <span style="font-family:'Space Mono',monospace;font-size:11px;color:#5050a0;flex-basis:100%;text-align:center;">Click a node to select it, then enter its distance from A:</span>
      ${[0,1,2,3,4,5,6,7,8,9].map(n=>`<button class="quiz-btn" style="flex:0 0 38px;padding:8px 0;"onclick="gqDijInput(${n})">${n}</button>`).join('')}
      <button class="quiz-btn" style="flex:0 0 44px;padding:8px 0;color:#ff4757;" onclick="gqDijInput(-1)">⌫</button>
    </div>`:``}
    <div class="quiz-feedback" id="gq-feedback">${MODE==='dijkstra'?'Click a node then type its shortest distance from A.':'Click nodes in '+modeLabel+' order from A!'}</div>
    <div class="quiz-btn-row">
      <button class="quiz-btn" onclick="gqReset()">↺ Restart</button>
      <button class="quiz-btn quiz-hint-btn" onclick="gqHint()">💡 Hint</button>
    </div>
  `;

  timer = quizTimer('gq-time');

  const cvs = document.getElementById('gq-canvas');
  function handleClick(x,y){
    if(solved) return;
    const nd = getNodeAt(x,y);
    if(!nd) return;
    moves++;
    document.getElementById('gq-moves').textContent=moves;
    if(MODE==='dijkstra'){
      selectedNode = nd.id;
      setFeedback(`Node ${nd.label} selected. Enter its shortest distance from A using the numpad.`, accent);
      render(); return;
    }
    // BFS/DFS
    if(clicked.includes(nd.id)){ setFeedback(`${nd.label} already clicked!`,'#ff4757'); return; }
    const expectedIdx = clicked.length;
    const expected = correctOrder[expectedIdx];
    clicked.push(nd.id);
    document.getElementById('gq-progress').textContent=`${clicked.length}/${NODES.length}`;
    if(nd.id !== expected){
      setFeedback(`❌ Wrong! Expected ${NODES[expected].label}, got ${nd.label}. Keep going!`,'#ff4757');
    } else {
      setFeedback(`✅ ${nd.label} is correct! (step ${expectedIdx+1})`, '#00ffa3');
    }
    checkSolved();
  }
  cvs.addEventListener('click',e=>{const r=cvs.getBoundingClientRect();handleClick((e.clientX-r.left)*(cvs.width/r.width),(e.clientY-r.top)*(cvs.height/r.height));});
  cvs.addEventListener('touchstart',e=>{e.preventDefault();const r=cvs.getBoundingClientRect(),t=e.touches[0];handleClick((t.clientX-r.left)*(cvs.width/r.width),(t.clientY-r.top)*(cvs.height/r.height));},{passive:false});

  window.gqDijInput = (n) => {
    if(selectedNode===null){setFeedback('Click a node first!','#ff4757');return;}
    if(n===-1){ inputDist[selectedNode]=''; }
    else {
      inputDist[selectedNode] = inputDist[selectedNode]==='' ? String(n) : inputDist[selectedNode]+n;
      moves++;
    }
    const correct = inputDist.filter((v,i)=>v!==''&&parseInt(v)===correctDist[i]).length;
    document.getElementById('gq-progress').textContent=`${correct}/${NODES.length}`;
    document.getElementById('gq-moves').textContent=moves;
    const cur=inputDist[selectedNode];
    if(cur!==''&&parseInt(cur)===correctDist[selectedNode]) setFeedback(`✅ ${NODES[selectedNode].label}: distance ${cur} is correct!`,'#00ffa3');
    else if(cur!=='') setFeedback(`Entered ${cur} for ${NODES[selectedNode].label}. Correct is ${correctDist[selectedNode]}.`,'#9090c0');
    checkSolved(); render();
  };

  const kh = e=>{
    if(!document.getElementById('gq-canvas')){document.removeEventListener('keydown',kh);return;}
    if(MODE==='dijkstra'&&selectedNode!==null&&e.key>='0'&&e.key<='9'){e.preventDefault();window.gqDijInput(+e.key);}
    if(MODE==='dijkstra'&&(e.key==='Backspace'||e.key==='Delete')){e.preventDefault();window.gqDijInput(-1);}
  };
  document.addEventListener('keydown',kh);

  window.gqReset = ()=>{
    clicked=[]; inputDist=Array(6).fill(''); selectedNode=null; moves=0; solved=false;
    if(timer)timer.stop(); timer=quizTimer('gq-time');
    document.getElementById('gq-moves').textContent=0;
    document.getElementById('gq-progress').textContent=`0/${NODES.length}`;
    setFeedback(MODE==='dijkstra'?'Click a node then enter its distance from A.':'Click nodes in '+modeLabel+' order from A!','#9090c0');
    render();
  };
  window.gqHint = ()=>{
    if(MODE==='dijkstra'){
      const unsolved=NODES.findIndex((_,i)=>inputDist[i]===''||parseInt(inputDist[i])!==correctDist[i]);
      if(unsolved!==-1) setFeedback(`💡 ${NODES[unsolved].label}: shortest distance from A = ${correctDist[unsolved]}`,'#ffe040');
    } else {
      const next=correctOrder[clicked.length];
      if(next!==undefined) setFeedback(`💡 Next node to visit: ${NODES[next].label}`,'#ffe040');
    }
  };
  render();
}

/* ════════════════════════════════════════════════════════
   BRANCH 4 — DP QUIZZES
   Fibonacci: fill in missing DP table cells
   LCS: select matching characters to build the subsequence
   Knapsack: check/uncheck items to maximize value under capacity
   ════════════════════════════════════════════════════════ */
function launchFibQuiz() {
  const accent='#f87171';
  createQuizOverlay('Fibonacci DP Challenge',accent);
  const body=document.getElementById('quiz-body');

  const LEVELS=[{n:7,blanks:[3,5,6,7]},{n:10,blanks:[4,6,8,9,10]},{n:13,blanks:[5,7,9,11,12,13]}];
  let lvl=0, userAnswers={}, moves=0, timer=null, solved=false;

  function getFib(n){const dp=Array(n+1).fill(0);dp[1]=1;for(let i=2;i<=n;i++)dp[i]=dp[i-1]+dp[i-2];return dp;}

  function initLevel(){
    moves=0;solved=false;userAnswers={};
    if(timer)timer.stop(); timer=quizTimer('fq-time');
    document.getElementById('fq-moves').textContent=0;
    renderTable();
    setFeedback('Click a blank cell (?) then type or tap the correct Fibonacci value!','#9090c0');
  }

  function setFeedback(msg,color){const fb=document.getElementById('fq-feedback');if(fb){fb.textContent=msg;fb.style.color=color||'#9090c0';}}

  function checkSolved(){
    const {n,blanks}=LEVELS[lvl];
    const fib=getFib(n);
    if(blanks.every(i=>userAnswers[i]!==undefined&&parseInt(userAnswers[i])===fib[i])){
      solved=true;timer&&timer.stop();
      setFeedback(`🎉 All cells correct! ${moves} moves · ${timer?timer.getTime():0}s`,'#00ffa3');
    }
  }

  function renderTable(){
    const {n,blanks}=LEVELS[lvl];
    const fib=getFib(n);
    let html=`<div style="overflow-x:auto;"><table style="border-collapse:collapse;margin:0 auto;font-family:'Space Mono',monospace;">
    <tr>${Array.from({length:n+1},(_,i)=>`<td style="padding:4px 6px;text-align:center;font-size:11px;color:#3a5070;">[${i}]</td>`).join('')}</tr>
    <tr>`;
    for(let i=0;i<=n;i++){
      const isBlank=blanks.includes(i);
      const ua=userAnswers[i];
      const correct=ua!==undefined&&parseInt(ua)===fib[i];
      const wrong=ua!==undefined&&parseInt(ua)!==fib[i];
      if(!isBlank){
        html+=`<td style="padding:6px 10px;background:rgba(248,113,113,0.08);border:1px solid rgba(248,113,113,0.25);border-radius:4px;text-align:center;color:#f87171;font-weight:700;">${fib[i]}</td>`;
      } else {
        const bg=correct?'rgba(0,255,163,0.2)':wrong?'rgba(255,71,87,0.2)':'rgba(248,113,113,0.05)';
        const bc=correct?'#00ffa3':wrong?'#ff4757':'rgba(248,113,113,0.3)';
        const val=ua!==undefined?ua:'?';
        html+=`<td id="fcell_${i}" onclick="fqSelect(${i})" style="padding:6px 10px;background:${bg};border:2px solid ${bc};border-radius:4px;text-align:center;color:${correct?'#00ffa3':wrong?'#ff4757':accent};font-weight:700;cursor:pointer;min-width:36px;">${val}</td>`;
      }
    }
    html+=`</tr></table></div>`;
    document.getElementById('fq-table').innerHTML=html;
  }

  let selectedCell=null;
  window.fqSelect=(i)=>{selectedCell=i;document.querySelectorAll('[id^=fcell_]').forEach(el=>el.style.outline='');const el=document.getElementById('fcell_'+i);if(el)el.style.outline=`2px solid ${accent}`;setFeedback(`Selected dp[${i}]. What is fib(${i})?`,accent);};
  window.fqInput=(n)=>{
    if(selectedCell===null){setFeedback('Click a blank cell first!','#ff4757');return;}
    if(n===-1){userAnswers[selectedCell]='';} else {
      userAnswers[selectedCell]=(userAnswers[selectedCell]||'')+n;
      moves++;document.getElementById('fq-moves').textContent=moves;
    }
    const{blanks}=LEVELS[lvl],fib=getFib(LEVELS[lvl].n);
    const ua=userAnswers[selectedCell];
    if(ua!==''&&parseInt(ua)===fib[selectedCell]) setFeedback(`✅ dp[${selectedCell}] = ${ua} ✓`,'#00ffa3');
    else if(ua!=='') setFeedback(`dp[${selectedCell}] = ${ua}… (dp[${selectedCell-1}] + dp[${selectedCell-2}])`,'#9090c0');
    renderTable(); checkSolved();
  };

  body.innerHTML=`
    <div class="quiz-instructions">
      <b>🔢 Fill the DP table!</b> Each cell = previous two cells added together.<br>
      <b>Formula:</b> dp[i] = dp[i-1] + dp[i-2] &nbsp;|&nbsp; dp[0]=0, dp[1]=1<br>
      <b>How:</b> Click a <b>?</b> cell, then use the numpad to enter the value.
    </div>
    <div class="quiz-stats">
      <div class="quiz-stat">Moves<span id="fq-moves">0</span></div>
      <div class="quiz-stat">Time<span id="fq-time">0s</span></div>
      <div class="quiz-stat">Level<span id="fq-level">${LEVELS[0].n} cells</span></div>
    </div>
    <div id="fq-table" style="background:#111128;border:1px solid #2a2a5a;border-radius:12px;padding:16px;"></div>
    <div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap;background:#111128;border:1px solid #2a2a5a;border-radius:10px;padding:10px;">
      ${[0,1,2,3,4,5,6,7,8,9].map(n=>`<button class="quiz-btn" style="flex:0 0 40px;padding:9px 0;" onclick="fqInput(${n})">${n}</button>`).join('')}
      <button class="quiz-btn" style="flex:0 0 44px;padding:9px 0;color:#ff4757;" onclick="fqInput(-1)">⌫</button>
    </div>
    <div class="quiz-feedback" id="fq-feedback">Click a ? cell and fill in the Fibonacci value!</div>
    <div class="quiz-btn-row">
      <button class="quiz-btn primary" onclick="fqNext()">Next Level ›</button>
      <button class="quiz-btn" onclick="fqReset()">↺ Restart</button>
      <button class="quiz-btn quiz-hint-btn" onclick="fqHint()">💡 Hint</button>
    </div>
  `;

  const kh=e=>{if(!document.getElementById('fq-table')){document.removeEventListener('keydown',kh);return;}if(e.key>='0'&&e.key<='9'){e.preventDefault();window.fqInput(+e.key);}if(e.key==='Backspace'||e.key==='Delete'){e.preventDefault();window.fqInput(-1);}};
  document.addEventListener('keydown',kh);

  window.fqNext=()=>{lvl=Math.min(lvl+1,LEVELS.length-1);document.getElementById('fq-level').textContent=LEVELS[lvl].n+' cells';initLevel();};
  window.fqReset=()=>{lvl=0;document.getElementById('fq-level').textContent=LEVELS[0].n+' cells';initLevel();};
  window.fqHint=()=>{
    const{n,blanks}=LEVELS[lvl],fib=getFib(n);
    const wrong=blanks.find(i=>userAnswers[i]===undefined||parseInt(userAnswers[i])!==fib[i]);
    if(wrong!==undefined) setFeedback(`💡 dp[${wrong}] = dp[${wrong-1}](${fib[wrong-1]}) + dp[${wrong-2}](${fib[wrong-2]}) = ${fib[wrong]}`,'#ffe040');
  };
  initLevel();
}

function launchLCSQuiz(){
  const accent='#818cf8';
  createQuizOverlay('LCS — Find the Subsequence',accent);
  const body=document.getElementById('quiz-body');

  const CHALLENGES=[
    {a:'ABCDE',b:'ACE',lcs:'ACE'},
    {a:'ABCBDAB',b:'BDCAB',lcs:'BCAB'},
    {a:'AGGTAB',b:'GXTXAYB',lcs:'GTAB'},
  ];
  let lvl=0,selectedA=[],selectedB=[],moves=0,timer=null,solved=false;

  function setFeedback(msg,color){const fb=document.getElementById('lq-feedback');if(fb){fb.textContent=msg;fb.style.color=color||'#9090c0';}}

  function isValidSubseq(str,sel){
    let last=-1,ok=true;
    sel.forEach(i=>{if(i<=last)ok=false;last=i;});
    return ok;
  }

  function checkSolved(){
    const{a,b,lcs}=CHALLENGES[lvl];
    const strA=selectedA.map(i=>a[i]).join('');
    const strB=selectedB.map(i=>b[i]).join('');
    if(strA===strB&&strA.length===lcs.length&&isValidSubseq(a,selectedA)&&isValidSubseq(b,selectedB)){
      solved=true;timer&&timer.stop();
      setFeedback(`🎉 LCS = "${strA}" (length ${strA.length})! ${moves} moves · ${timer?timer.getTime():0}s`,'#00ffa3');
    } else if(strA===strB&&strA.length>0){
      setFeedback(`✅ Common so far: "${strA}" — keep selecting more characters!`,'#00ffa3');
    }
  }

  function initLevel(){
    selectedA=[]; selectedB=[]; moves=0; solved=false;
    if(timer)timer.stop();timer=quizTimer('lq-time');
    document.getElementById('lq-moves').textContent=0;
    renderStrings();
    setFeedback(`Select matching characters from both strings to form the LCS!`,'#9090c0');
  }

  function renderStrings(){
    const{a,b}=CHALLENGES[lvl];
    ['A','B'].forEach((strId,si)=>{
      const str=si===0?a:b, sel=si===0?selectedA:selectedB;
      const el=document.getElementById('lq-str'+strId);
      if(!el) return;
      el.innerHTML=str.split('').map((ch,i)=>{
        const isSel=sel.includes(i);
        const bg=isSel?'rgba(129,140,248,0.3)':'rgba(129,140,248,0.05)';
        const border=isSel?accent:'rgba(129,140,248,0.2)';
        return `<span id="lch_${strId}_${i}" onclick="lqClick('${strId}',${i})"
          style="display:inline-flex;align-items:center;justify-content:center;width:38px;height:38px;
          margin:3px;border:2px solid ${border};border-radius:8px;background:${bg};
          color:${isSel?accent:'#5050a0'};font-family:'Space Mono',monospace;font-size:15px;font-weight:700;
          cursor:pointer;transition:all 0.15s;">${ch}</span>`;
      }).join('');
    });
    const strA=selectedA.map(i=>a[i]).join('');
    const strB=selectedB.map(i=>b[i]).join('');
    const match=strA===strB;
    const el=document.getElementById('lq-current');
    if(el) el.textContent=`Selected: "${strA}" / "${strB}" ${match&&strA.length>0?'✓ match':''}`;
  }

  window.lqClick=(strId,i)=>{
    if(solved) return;
    const isA=strId==='A';
    const sel=isA?selectedA:selectedB;
    const idx=sel.indexOf(i);
    if(idx!==-1) sel.splice(idx,1);
    else {
      sel.push(i); sel.sort((a,b)=>a-b); moves++;
      document.getElementById('lq-moves').textContent=moves;
    }
    renderStrings(); checkSolved();
  };

  body.innerHTML=`
    <div class="quiz-instructions">
      <b>📏 Find the LCS!</b> Select the same characters (in order) from <b>both</b> strings.<br>
      Selected chars must form the same subsequence in both — longest wins!<br>
      <b>How:</b> Click characters in each row to select/deselect them.
    </div>
    <div class="quiz-stats">
      <div class="quiz-stat">Moves<span id="lq-moves">0</span></div>
      <div class="quiz-stat">Time<span id="lq-time">0s</span></div>
      <div class="quiz-stat">Level<span id="lq-level">${lvl+1}/${CHALLENGES.length}</span></div>
    </div>
    <div style="background:#111128;border:1px solid #2a2a5a;border-radius:12px;padding:16px;display:flex;flex-direction:column;gap:12px;">
      <div><div style="font-family:'Space Mono',monospace;font-size:10px;color:#3a5070;margin-bottom:6px;">STRING A:</div><div id="lq-strA" style="display:flex;flex-wrap:wrap;gap:2px;"></div></div>
      <div><div style="font-family:'Space Mono',monospace;font-size:10px;color:#3a5070;margin-bottom:6px;">STRING B:</div><div id="lq-strB" style="display:flex;flex-wrap:wrap;gap:2px;"></div></div>
      <div id="lq-current" style="font-family:'Space Mono',monospace;font-size:12px;color:${accent};text-align:center;padding:8px;background:rgba(129,140,248,0.06);border-radius:8px;"></div>
    </div>
    <div class="quiz-feedback" id="lq-feedback">Select matching characters from both strings!</div>
    <div class="quiz-btn-row">
      <button class="quiz-btn primary" onclick="lqNext()">Next Challenge ›</button>
      <button class="quiz-btn" onclick="lqReset()">↺ Restart</button>
      <button class="quiz-btn quiz-hint-btn" onclick="lqHint()">💡 Hint</button>
    </div>
  `;
  window.lqNext=()=>{lvl=Math.min(lvl+1,CHALLENGES.length-1);document.getElementById('lq-level').textContent=(lvl+1)+'/'+CHALLENGES.length;initLevel();};
  window.lqReset=()=>{lvl=0;document.getElementById('lq-level').textContent='1/'+CHALLENGES.length;initLevel();};
  window.lqHint=()=>{const{lcs}=CHALLENGES[lvl];setFeedback(`💡 The LCS is "${lcs}" (length ${lcs.length}). Select those characters in order!`,'#ffe040');};
  initLevel();
}

function launchKnapsackQuiz(){
  const accent='#a3e635';
  createQuizOverlay('0/1 Knapsack Challenge',accent);
  const body=document.getElementById('quiz-body');

  const CHALLENGES=[
    {items:[{n:'📦A',w:2,v:6},{n:'📦B',w:2,v:10},{n:'📦C',w:3,v:12}],cap:5,opt:22,optItems:[1,2]},
    {items:[{n:'💎X',w:1,v:3},{n:'🎒Y',w:4,v:8},{n:'📱Z',w:3,v:7},{n:'🔑W',w:2,v:5}],cap:6,opt:15,optItems:[0,1,3]},
    {items:[{n:'A',w:2,v:6},{n:'B',w:2,v:10},{n:'C',w:3,v:12},{n:'D',w:5,v:13},{n:'E',w:4,v:8}],cap:8,opt:28,optItems:[1,2,3]},
  ];
  let lvl=0,selected=new Set(),moves=0,timer=null,solved=false;

  function setFeedback(msg,color){const fb=document.getElementById('kq-feedback');if(fb){fb.textContent=msg;fb.style.color=color||'#9090c0';}}

  function calcStats(){
    const{items,cap}=CHALLENGES[lvl];
    const w=[...selected].reduce((s,i)=>s+items[i].w,0);
    const v=[...selected].reduce((s,i)=>s+items[i].v,0);
    return{w,v};
  }

  function checkSolved(){
    const{cap,opt}=CHALLENGES[lvl];
    const{w,v}=calcStats();
    if(w<=cap&&v===opt){
      solved=true;timer&&timer.stop();
      setFeedback(`🎉 Optimal! Max value = ${v} within capacity! ${moves} moves · ${timer?timer.getTime():0}s`,'#00ffa3');
    } else if(w>cap){
      setFeedback(`⚠️ Over capacity! Weight ${w} > ${cap}. Remove an item.`,'#ff4757');
    } else {
      setFeedback(`Value: ${v} | Weight: ${w}/${cap}. Can you do better?`,'#9090c0');
    }
  }

  function initLevel(){
    selected=new Set();moves=0;solved=false;
    if(timer)timer.stop();timer=quizTimer('kq-time');
    document.getElementById('kq-moves').textContent=0;
    renderItems();
    const{cap,opt}=CHALLENGES[lvl];
    setFeedback(`Capacity = ${cap}. Target max value = ${opt}. Pick the best items!`,'#9090c0');
  }

  function renderItems(){
    const{items,cap}=CHALLENGES[lvl];
    const{w,v}=calcStats();
    const el=document.getElementById('kq-items');
    if(!el) return;
    el.innerHTML=items.map((it,i)=>{
      const isSel=selected.has(i);
      const bg=isSel?`rgba(163,230,53,0.2)`:'rgba(163,230,53,0.04)';
      const bc=isSel?accent:'rgba(163,230,53,0.2)';
      return `<div onclick="kqToggle(${i})" style="display:flex;align-items:center;gap:12px;padding:12px 16px;
        background:${bg};border:2px solid ${bc};border-radius:10px;cursor:pointer;transition:all 0.2s;">
        <span style="font-size:22px;">${it.n}</span>
        <div style="flex:1;font-family:'Space Mono',monospace;">
          <div style="font-size:13px;font-weight:700;color:${isSel?accent:'#5a7090'};">Weight: ${it.w} | Value: ${it.v}</div>
          <div style="font-size:10px;color:#3a5070;">Ratio: ${(it.v/it.w).toFixed(1)}</div>
        </div>
        <div style="font-size:18px;">${isSel?'✅':'☐'}</div>
      </div>`;
    }).join('');
    const cap_pct=Math.min(1,w/cap);
    const barColor=w>cap?'#ff4757':w/cap>0.8?'#f59e0b':accent;
    document.getElementById('kq-bar').innerHTML=`
      <div style="display:flex;justify-content:space-between;font-family:'Space Mono',monospace;font-size:11px;color:#5a7090;margin-bottom:4px;">
        <span>Capacity Used: ${w}/${cap}</span><span>Value: ${v}</span>
      </div>
      <div style="background:#0a1520;border-radius:4px;height:8px;overflow:hidden;">
        <div style="height:100%;width:${cap_pct*100}%;background:${barColor};border-radius:4px;transition:all 0.3s;"></div>
      </div>`;
  }

  window.kqToggle=(i)=>{
    if(solved) return;
    if(selected.has(i))selected.delete(i); else {selected.add(i);moves++;document.getElementById('kq-moves').textContent=moves;}
    renderItems(); checkSolved();
  };

  body.innerHTML=`
    <div class="quiz-instructions">
      <b>🎒 Goal:</b> Select items to <b>maximize total value</b> without exceeding the capacity.<br>
      <b>Rules:</b> Each item can be taken once (0/1). Watch the capacity bar!<br>
      <b>How:</b> Click items to include/exclude them. Find the optimal selection!
    </div>
    <div class="quiz-stats">
      <div class="quiz-stat">Moves<span id="kq-moves">0</span></div>
      <div class="quiz-stat">Time<span id="kq-time">0s</span></div>
      <div class="quiz-stat">Level<span id="kq-level">${lvl+1}/${CHALLENGES.length}</span></div>
    </div>
    <div id="kq-bar" style="background:#111128;border:1px solid #2a2a5a;border-radius:10px;padding:12px;"></div>
    <div id="kq-items" style="display:flex;flex-direction:column;gap:8px;"></div>
    <div class="quiz-feedback" id="kq-feedback">Select items to maximize value!</div>
    <div class="quiz-btn-row">
      <button class="quiz-btn primary" onclick="kqNext()">Next Level ›</button>
      <button class="quiz-btn" onclick="kqReset()">↺ Restart</button>
      <button class="quiz-btn quiz-hint-btn" onclick="kqHint()">💡 Hint</button>
    </div>
  `;
  window.kqNext=()=>{lvl=Math.min(lvl+1,CHALLENGES.length-1);document.getElementById('kq-level').textContent=(lvl+1)+'/'+CHALLENGES.length;initLevel();};
  window.kqReset=()=>{lvl=0;document.getElementById('kq-level').textContent='1/'+CHALLENGES.length;initLevel();};
  window.kqHint=()=>{
    const{items,optItems,opt,cap}=CHALLENGES[lvl];
    const names=optItems.map(i=>items[i].n).join(', ');
    setFeedback(`💡 Optimal: take ${names} → value ${opt} within capacity ${cap}`,'#ffe040');
  };
  initLevel();
}

/* ════════════════════════════════════════════════════════
   BRANCH 5 — STACK & QUEUE QUIZ
   Stack: given sequence of pushes/pops, predict the stack state
   Queue: given enqueue/dequeue ops, predict the queue state
   ════════════════════════════════════════════════════════ */
function launchStackQuiz(){
  const accent='#fb7185';
  createQuizOverlay('Stack Operations Quiz',accent);
  const body=document.getElementById('quiz-body');

  const CHALLENGES=[
    {ops:['push 5','push 3','pop','push 8','push 1'],answer:[5,8,1],desc:'What is the stack from bottom to top?'},
    {ops:['push 10','push 7','push 2','pop','pop','push 9','push 4'],answer:[10,9,4],desc:'What is the stack from bottom to top?'},
    {ops:['push 6','push 3','push 9','pop','push 2','pop','push 7'],answer:[6,3,7],desc:'What is the stack from bottom to top?'},
  ];
  let lvl=0,userStack=[],inputVal='',moves=0,timer=null,solved=false,opStep=0,stackState=[];

  function setFeedback(msg,color){const fb=document.getElementById('sq2-feedback');if(fb){fb.textContent=msg;fb.style.color=color||'#9090c0';}}

  function computeStack(ops){
    const st=[];
    ops.forEach(op=>{
      if(op.startsWith('push'))st.push(parseInt(op.split(' ')[1]));
      else if(op==='pop'&&st.length)st.pop();
    });
    return st;
  }

  function initLevel(){
    moves=0;solved=false;userStack=[];inputVal='';opStep=0;
    stackState=computeStack(CHALLENGES[lvl].ops);
    if(timer)timer.stop();timer=quizTimer('sq2-time');
    document.getElementById('sq2-moves').textContent=0;
    renderQuiz();
    setFeedback(CHALLENGES[lvl].desc,'#9090c0');
  }

  function checkSolved(){
    const ans=CHALLENGES[lvl].answer;
    if(JSON.stringify(userStack)===JSON.stringify(ans)){
      solved=true;timer&&timer.stop();
      setFeedback(`🎉 Correct! Stack = [${ans.join(', ')}] (bottom→top). ${moves} moves · ${timer?timer.getTime():0}s`,'#00ffa3');
    } else {
      setFeedback(`Stack so far: [${userStack.join(', ')}]. Keep building!`,'#9090c0');
    }
  }

  function renderQuiz(){
    const{ops}=CHALLENGES[lvl];
    document.getElementById('sq2-ops').innerHTML=ops.map((op,i)=>{
      const isPush=op.startsWith('push');
      const col=isPush?'#00e5ff':'#ff4757';
      return `<div style="padding:6px 12px;background:rgba(255,255,255,0.03);border:1px solid ${col}33;border-radius:6px;
        font-family:'Space Mono',monospace;font-size:13px;color:${col};display:flex;align-items:center;gap:8px;">
        <span style="font-size:16px;">${isPush?'⬆':'⬇'}</span> ${op}
      </div>`;
    }).join('');
    document.getElementById('sq2-userstack').innerHTML=`
      <div style="font-family:'Space Mono',monospace;font-size:11px;color:#3a5070;margin-bottom:8px;">YOUR ANSWER (bottom → top):</div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;min-height:44px;align-items:center;">
        ${userStack.map((v,i)=>`<div onclick="sq2Remove(${i})" style="padding:8px 14px;background:rgba(251,113,133,0.15);border:1px solid ${accent};border-radius:8px;
          font-family:'Space Mono',monospace;font-size:14px;font-weight:700;color:${accent};cursor:pointer;" title="Click to remove">${v}</div>`).join('')}
        ${userStack.length===0?'<span style="color:#2a4060;font-family:Space Mono,monospace;font-size:12px;">empty — add values below</span>':''}
      </div>`;
  }

  window.sq2AddVal=(n)=>{
    if(solved)return;
    if(n===-1){inputVal=inputVal.slice(0,-1);}else{inputVal+=n;}
    document.getElementById('sq2-input-display').textContent=inputVal||'_';
  };
  window.sq2Push=()=>{
    if(!inputVal||solved)return;
    userStack.push(parseInt(inputVal));inputVal='';
    document.getElementById('sq2-input-display').textContent='_';
    moves++;document.getElementById('sq2-moves').textContent=moves;
    renderQuiz();checkSolved();
  };
  window.sq2Remove=(i)=>{userStack.splice(i,1);renderQuiz();};

  body.innerHTML=`
    <div class="quiz-instructions">
      <b>📚 Stack Quiz:</b> Read the operations below, then build the final stack state.<br>
      <b>LIFO rule:</b> Last In = First Out. Pop removes the TOP element.<br>
      <b>How:</b> Enter each value using the numpad and press PUSH to add it bottom-to-top.
    </div>
    <div class="quiz-stats">
      <div class="quiz-stat">Moves<span id="sq2-moves">0</span></div>
      <div class="quiz-stat">Time<span id="sq2-time">0s</span></div>
      <div class="quiz-stat">Level<span id="sq2-level">${lvl+1}/${CHALLENGES.length}</span></div>
    </div>
    <div style="background:#111128;border:1px solid #2a2a5a;border-radius:12px;padding:14px;">
      <div style="font-family:'Space Mono',monospace;font-size:10px;color:#3a5070;margin-bottom:8px;">OPERATIONS (in order):</div>
      <div id="sq2-ops" style="display:flex;flex-direction:column;gap:6px;"></div>
    </div>
    <div id="sq2-userstack" style="background:#111128;border:1px solid #2a2a5a;border-radius:12px;padding:14px;"></div>
    <div style="background:#111128;border:1px solid #2a2a5a;border-radius:10px;padding:10px;display:flex;flex-direction:column;gap:8px;">
      <div style="display:flex;align-items:center;gap:8px;justify-content:center;">
        <span style="font-family:'Space Mono',monospace;font-size:12px;color:#5a7090;">Value:</span>
        <span id="sq2-input-display" style="min-width:48px;padding:6px 12px;background:#0a1520;border:1px solid ${accent};border-radius:6px;font-family:'Space Mono',monospace;font-size:14px;color:${accent};text-align:center;">_</span>
        <button class="quiz-btn primary" style="padding:8px 16px;" onclick="sq2Push()">⬆ PUSH</button>
      </div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:center;">
        ${[0,1,2,3,4,5,6,7,8,9].map(n=>`<button class="quiz-btn" style="flex:0 0 38px;padding:8px 0;" onclick="sq2AddVal(${n})">${n}</button>`).join('')}
        <button class="quiz-btn" style="flex:0 0 44px;padding:8px 0;color:#ff4757;" onclick="sq2AddVal(-1)">⌫</button>
      </div>
    </div>
    <div class="quiz-feedback" id="sq2-feedback"></div>
    <div class="quiz-btn-row">
      <button class="quiz-btn primary" onclick="sq2Next()">Next Level ›</button>
      <button class="quiz-btn" onclick="sq2Reset()">↺ Restart</button>
      <button class="quiz-btn quiz-hint-btn" onclick="sq2Hint()">💡 Hint</button>
    </div>
  `;
  window.sq2Next=()=>{lvl=Math.min(lvl+1,CHALLENGES.length-1);document.getElementById('sq2-level').textContent=(lvl+1)+'/'+CHALLENGES.length;initLevel();};
  window.sq2Reset=()=>{lvl=0;document.getElementById('sq2-level').textContent='1/'+CHALLENGES.length;initLevel();};
  window.sq2Hint=()=>setFeedback(`💡 Final stack (bottom→top): [${CHALLENGES[lvl].answer.join(', ')}]`,'#ffe040');
  const kh=e=>{if(!document.getElementById('sq2-ops')){document.removeEventListener('keydown',kh);return;}if(e.key>='0'&&e.key<='9'){e.preventDefault();window.sq2AddVal(+e.key);}if(e.key==='Backspace'){e.preventDefault();window.sq2AddVal(-1);}if(e.key==='Enter'){e.preventDefault();window.sq2Push();}};
  document.addEventListener('keydown',kh);
  initLevel();
}

function launchQueueQuiz(){
  const accent='#38bdf8';
  createQuizOverlay('Queue Operations Quiz',accent);
  const body=document.getElementById('quiz-body');

  const CHALLENGES=[
    {ops:['enq 3','enq 7','deq','enq 5','enq 2'],answer:[7,5,2],desc:'What is the queue from front to back?'},
    {ops:['enq 1','enq 4','enq 9','deq','deq','enq 6','enq 3'],answer:[9,6,3],desc:'What is the queue from front to back?'},
    {ops:['enq 8','enq 2','deq','enq 5','enq 1','deq','enq 4'],answer:[5,1,4],desc:'What is the queue from front to back?'},
  ];
  let lvl=0,userQueue=[],inputVal='',moves=0,timer=null,solved=false;

  function setFeedback(msg,color){const fb=document.getElementById('qq-feedback');if(fb){fb.textContent=msg;fb.style.color=color||'#9090c0';}}
  function computeQueue(ops){const q=[];ops.forEach(op=>{if(op.startsWith('enq'))q.push(parseInt(op.split(' ')[1]));else if(op==='deq'&&q.length)q.shift();});return q;}

  function checkSolved(){
    const ans=CHALLENGES[lvl].answer;
    if(JSON.stringify(userQueue)===JSON.stringify(ans)){
      solved=true;timer&&timer.stop();
      setFeedback(`🎉 Correct! Queue = [${ans.join(' → ')}] (front→back). ${moves} moves · ${timer?timer.getTime():0}s`,'#00ffa3');
    } else {
      setFeedback(`Queue so far: [${userQueue.join(' → ')}]. Keep building front-to-back!`,'#9090c0');
    }
  }

  function renderQuiz(){
    const{ops}=CHALLENGES[lvl];
    document.getElementById('qq-ops').innerHTML=ops.map(op=>{
      const isEnq=op.startsWith('enq');
      const col=isEnq?accent:'#ff4757';
      return `<div style="padding:6px 12px;background:rgba(255,255,255,0.03);border:1px solid ${col}33;border-radius:6px;
        font-family:'Space Mono',monospace;font-size:13px;color:${col};display:flex;align-items:center;gap:8px;">
        <span>${isEnq?'➡':'⬅'}</span> ${isEnq?op.replace('enq','ENQUEUE'):op.replace('deq','DEQUEUE')}
      </div>`;
    }).join('');
    document.getElementById('qq-userqueue').innerHTML=`
      <div style="font-family:'Space Mono',monospace;font-size:11px;color:#3a5070;margin-bottom:8px;">YOUR ANSWER (front → back):</div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;min-height:44px;align-items:center;">
        ${userQueue.length?`<span style="font-family:Space Mono,monospace;font-size:10px;color:#3a5070;">FRONT ►</span>
        ${userQueue.map((v,i)=>`<div onclick="qqRemove(${i})" style="padding:8px 14px;background:rgba(56,189,248,0.12);border:1px solid ${accent};border-radius:8px;
          font-family:'Space Mono',monospace;font-size:14px;font-weight:700;color:${accent};cursor:pointer;">${v}</div>`).join('')}
        <span style="font-family:Space Mono,monospace;font-size:10px;color:#3a5070;">► BACK</span>`
        :'<span style="color:#2a4060;font-family:Space Mono,monospace;font-size:12px;">empty — add values below</span>'}
      </div>`;
  }

  window.qqAddVal=(n)=>{if(n===-1)inputVal=inputVal.slice(0,-1);else inputVal+=n;document.getElementById('qq-input-display').textContent=inputVal||'_';};
  window.qqEnqueue=()=>{
    if(!inputVal||solved)return;
    userQueue.push(parseInt(inputVal));inputVal='';
    document.getElementById('qq-input-display').textContent='_';
    moves++;document.getElementById('qq-moves').textContent=moves;
    renderQuiz();checkSolved();
  };
  window.qqRemove=(i)=>{userQueue.splice(i,1);renderQuiz();};

  body.innerHTML=`
    <div class="quiz-instructions">
      <b>🚶 Queue Quiz:</b> Read the enqueue/dequeue operations, then build the final queue.<br>
      <b>FIFO rule:</b> First In = First Out. Dequeue removes the FRONT element.<br>
      <b>How:</b> Enter each remaining value front-to-back and press ENQUEUE.
    </div>
    <div class="quiz-stats">
      <div class="quiz-stat">Moves<span id="qq-moves">0</span></div>
      <div class="quiz-stat">Time<span id="qq-time">0s</span></div>
      <div class="quiz-stat">Level<span id="qq-level">${lvl+1}/${CHALLENGES.length}</span></div>
    </div>
    <div style="background:#111128;border:1px solid #2a2a5a;border-radius:12px;padding:14px;">
      <div style="font-family:'Space Mono',monospace;font-size:10px;color:#3a5070;margin-bottom:8px;">OPERATIONS (in order):</div>
      <div id="qq-ops" style="display:flex;flex-direction:column;gap:6px;"></div>
    </div>
    <div id="qq-userqueue" style="background:#111128;border:1px solid #2a2a5a;border-radius:12px;padding:14px;"></div>
    <div style="background:#111128;border:1px solid #2a2a5a;border-radius:10px;padding:10px;display:flex;flex-direction:column;gap:8px;">
      <div style="display:flex;align-items:center;gap:8px;justify-content:center;">
        <span style="font-family:'Space Mono',monospace;font-size:12px;color:#5a7090;">Value:</span>
        <span id="qq-input-display" style="min-width:48px;padding:6px 12px;background:#0a1520;border:1px solid ${accent};border-radius:6px;font-family:'Space Mono',monospace;font-size:14px;color:${accent};text-align:center;">_</span>
        <button class="quiz-btn primary" style="padding:8px 16px;" onclick="qqEnqueue()">➡ ENQUEUE</button>
      </div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:center;">
        ${[0,1,2,3,4,5,6,7,8,9].map(n=>`<button class="quiz-btn" style="flex:0 0 38px;padding:8px 0;" onclick="qqAddVal(${n})">${n}</button>`).join('')}
        <button class="quiz-btn" style="flex:0 0 44px;padding:8px 0;color:#ff4757;" onclick="qqAddVal(-1)">⌫</button>
      </div>
    </div>
    <div class="quiz-feedback" id="qq-feedback"></div>
    <div class="quiz-btn-row">
      <button class="quiz-btn primary" onclick="qqNext()">Next Level ›</button>
      <button class="quiz-btn" onclick="qqReset()">↺ Restart</button>
      <button class="quiz-btn quiz-hint-btn" onclick="qqHint()">💡 Hint</button>
    </div>
  `;
  window.qqNext=()=>{lvl=Math.min(lvl+1,CHALLENGES.length-1);document.getElementById('qq-level').textContent=(lvl+1)+'/'+CHALLENGES.length;initLevel();};
  window.qqReset=()=>{lvl=0;document.getElementById('qq-level').textContent='1/'+CHALLENGES.length;initLevel();};
  window.qqHint=()=>setFeedback(`💡 Final queue (front→back): [${CHALLENGES[lvl].answer.join(' → ')}]`,'#ffe040');
  const kh=e=>{if(!document.getElementById('qq-ops')){document.removeEventListener('keydown',kh);return;}if(e.key>='0'&&e.key<='9'){e.preventDefault();window.qqAddVal(+e.key);}if(e.key==='Backspace'){e.preventDefault();window.qqAddVal(-1);}if(e.key==='Enter'){e.preventDefault();window.qqEnqueue();}};
  document.addEventListener('keydown',kh);

  function initLevel(){
    userQueue=[];inputVal='';moves=0;solved=false;
    if(timer)timer.stop();timer=quizTimer('qq-time');
    document.getElementById('qq-moves').textContent=0;
    renderQuiz(); setFeedback(CHALLENGES[lvl].desc,'#9090c0');
  }
  initLevel();
}

/* ════════════════════════════════════════════════════════
   BRANCH 6 — TREE QUIZ
   BST: drag-insert values into correct BST position
   Tree Traversal: click nodes in correct traversal order
   AVL/Red-Black: insert values and predict the tree structure
   ════════════════════════════════════════════════════════ */
function launchBSTQuiz(){
  const accent='#34d399';
  createQuizOverlay('BST — Insert Challenge',accent);
  const body=document.getElementById('quiz-body');

  const CHALLENGES=[
    {title:'Build this BST',values:[50,30,70,20,40],insertNext:35,hint:'35 < 50 → left, 35 > 30 → right, 35 < 40 → left of 40'},
    {title:'Insert into BST',values:[60,40,80,20,50,70,90],insertNext:45,hint:'45 < 60 → left, 45 > 40 → right, 45 < 50 → left of 50'},
    {title:'BST Insertion',values:[55,35,75,25,45,65,85],insertNext:40,hint:'40 < 55 → left, 40 > 35 → right, 40 < 45 → left of 45'},
  ];
  let lvl=0, moves=0, timer=null, solved=false;
  let selectedParent=null, insertSide=null;

  class Node{constructor(v){this.v=v;this.left=null;this.right=null;}}
  function bstInsert(root,v){if(!root)return new Node(v);if(v<root.v)root.left=bstInsert(root.left,v);else if(v>root.v)root.right=bstInsert(root.right,v);return root;}
  function buildBST(vals){let root=null;vals.forEach(v=>root=bstInsert(root,v));return root;}

  function setFeedback(msg,color){const fb=document.getElementById('bq-feedback');if(fb){fb.textContent=msg;fb.style.color=color||'#9090c0';}}

  // Find correct parent for insertion
  function findInsertParent(root,v){
    let node=root,parent=null,side=null;
    while(node){
      parent=node;
      if(v<node.v){side='left';node=node.left;}
      else{side='right';node=node.right;}
    }
    return{parent,side};
  }

  function initLevel(){
    moves=0;solved=false;selectedParent=null;insertSide=null;
    if(timer)timer.stop();timer=quizTimer('bq-time');
    document.getElementById('bq-moves').textContent=0;
    renderTree();
    const{insertNext}=CHALLENGES[lvl];
    setFeedback(`Where would you insert ${insertNext}? Click the correct parent node, then choose LEFT or RIGHT.`,'#9090c0');
  }

  function renderTree(){
    const c=document.getElementById('bq-canvas');
    if(!c) return;
    const W=c.width,H=c.height,ctx=c.getContext('2d');
    ctx.clearRect(0,0,W,H);ctx.fillStyle='#0a0a1a';ctx.fillRect(0,0,W,H);

    const{values,insertNext}=CHALLENGES[lvl];
    const root=buildBST(values);
    const{parent:correctParent,side:correctSide}=findInsertParent(root,insertNext);

    // Layout tree
    const nodeMap={};
    function layout(node,depth,left,right){
      if(!node)return;
      const x=(left+right)/2, y=50+depth*72;
      nodeMap[node.v]={x,y,node};
      layout(node.left,depth+1,left,(left+right)/2);
      layout(node.right,depth+1,(left+right)/2,right);
    }
    layout(root,0,30,W-30);

    // Edges
    Object.values(nodeMap).forEach(({x,y,node})=>{
      if(node.left&&nodeMap[node.left.v]){
        const{x:cx,y:cy}=nodeMap[node.left.v];
        ctx.strokeStyle='#1e3050';ctx.lineWidth=1.5;
        ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(cx,cy);ctx.stroke();
      }
      if(node.right&&nodeMap[node.right.v]){
        const{x:cx,y:cy}=nodeMap[node.right.v];
        ctx.strokeStyle='#1e3050';ctx.lineWidth=1.5;
        ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(cx,cy);ctx.stroke();
      }
    });

    // Nodes
    Object.values(nodeMap).forEach(({x,y,node})=>{
      const r=22;
      const isSelected=selectedParent===node.v;
      const isCorrect=correctParent&&node.v===correctParent.v;
      let fill='#0a1825',stroke='#1e3050',textC='#3d5470';
      if(isSelected){fill='rgba(52,211,153,0.3)';stroke=accent;textC=accent;}
      ctx.shadowColor=isSelected?accent:'transparent';ctx.shadowBlur=isSelected?14:0;
      ctx.fillStyle=fill;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();
      ctx.strokeStyle=stroke;ctx.lineWidth=2;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.stroke();
      ctx.shadowBlur=0;
      ctx.fillStyle=textC;ctx.font='bold 13px Space Mono,monospace';
      ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(node.v,x,y);
      ctx.textBaseline='alphabetic';

      // Show ghost insert position
      if(isSelected){
        const gx=insertSide==='left'?x-50:x+50, gy=y+72;
        ctx.fillStyle='rgba(52,211,153,0.15)';ctx.beginPath();ctx.arc(gx,gy,r,0,Math.PI*2);ctx.fill();
        ctx.strokeStyle=accent+'88';ctx.lineWidth=2;ctx.setLineDash([4,4]);ctx.beginPath();ctx.arc(gx,gy,r,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);
        ctx.fillStyle=accent+'88';ctx.font='bold 13px Space Mono,monospace';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(insertNext,gx,gy);ctx.textBaseline='alphabetic';
        ctx.strokeStyle=accent+'44';ctx.lineWidth=1.5;ctx.setLineDash([3,3]);ctx.beginPath();ctx.moveTo(x,y+r);ctx.lineTo(gx,gy-r);ctx.stroke();ctx.setLineDash([]);
      }
    });
    ctx.textAlign='start';

    // Insert label
    ctx.fillStyle='#3a5070';ctx.font='11px Space Mono,monospace';
    ctx.fillText(`Insert: ${insertNext}`,10,H-12);
  }

  function getNodeAt(x,y){
    const{values}=CHALLENGES[lvl];
    const root=buildBST(values);
    const W=700,H=420;
    const nodeMap={};
    function layout(node,depth,left,right){if(!node)return;const nx=(left+right)/2,ny=50+depth*72;nodeMap[node.v]={x:nx,y:ny};layout(node.left,depth+1,left,(left+right)/2);layout(node.right,depth+1,(left+right)/2,right);}
    layout(root,0,30,W-30);
    return Object.entries(nodeMap).find(([v,pos])=>Math.hypot(pos.x-x,pos.y-y)<26)?.[0];
  }

  body.innerHTML=`
    <div class="quiz-instructions">
      <b>🌳 BST Insert:</b> Find the correct position to insert the new value.<br>
      <b>Rule:</b> Go left if smaller than current node, right if larger.<br>
      <b>How:</b> Click the node that should be the <b>parent</b>, then tap LEFT or RIGHT child.
    </div>
    <div class="quiz-stats">
      <div class="quiz-stat">Moves<span id="bq-moves">0</span></div>
      <div class="quiz-stat">Time<span id="bq-time">0s</span></div>
      <div class="quiz-stat">Level<span id="bq-level">${lvl+1}/${CHALLENGES.length}</span></div>
    </div>
    <div class="quiz-canvas-wrap"><canvas id="bq-canvas" width="700" height="420" style="cursor:pointer;max-width:100%;"></canvas></div>
    <div style="display:flex;gap:8px;justify-content:center;">
      <button class="quiz-btn" style="flex:1;" onclick="bqChooseSide('left')">◄ Left child</button>
      <button class="quiz-btn" style="flex:1;" onclick="bqChooseSide('right')">Right child ►</button>
    </div>
    <div class="quiz-feedback" id="bq-feedback"></div>
    <div class="quiz-btn-row">
      <button class="quiz-btn primary" onclick="bqNext()">Next Level ›</button>
      <button class="quiz-btn" onclick="bqReset()">↺ Restart</button>
      <button class="quiz-btn quiz-hint-btn" onclick="bqHint()">💡 Hint</button>
    </div>
  `;

  const cvs=document.getElementById('bq-canvas');
  function handleClick(x,y){
    if(solved)return;
    const v=getNodeAt(x,y);
    if(v===undefined)return;
    selectedParent=parseInt(v);moves++;document.getElementById('bq-moves').textContent=moves;
    renderTree();
    setFeedback(`Selected node ${v}. Now choose: should ${CHALLENGES[lvl].insertNext} go LEFT or RIGHT of ${v}?`,accent);
  }
  cvs.addEventListener('click',e=>{const r=cvs.getBoundingClientRect();handleClick((e.clientX-r.left)*(cvs.width/r.width),(e.clientY-r.top)*(cvs.height/r.height));});
  cvs.addEventListener('touchstart',e=>{e.preventDefault();const r=cvs.getBoundingClientRect(),t=e.touches[0];handleClick((t.clientX-r.left)*(cvs.width/r.width),(t.clientY-r.top)*(cvs.height/r.height));},{passive:false});

  window.bqChooseSide=(side)=>{
    if(solved||selectedParent===null){setFeedback('Click a node first!','#ff4757');return;}
    insertSide=side;renderTree();
    const{values,insertNext}=CHALLENGES[lvl];
    const root=buildBST(values);
    const{parent,side:correctSide}=findInsertParent(root,insertNext);
    if(parent&&parent.v===selectedParent&&side===correctSide){
      solved=true;timer&&timer.stop();
      setFeedback(`🎉 Correct! ${insertNext} goes as the ${side} child of ${selectedParent}! ${moves} moves · ${timer?timer.getTime():0}s`,'#00ffa3');
    } else {
      setFeedback(`❌ Not quite. Try another node/side! Hint: ${insertNext} ${insertNext<selectedParent?'< ':'> '}${selectedParent}`,'#ff4757');
      selectedParent=null;insertSide=null;renderTree();
    }
  };
  window.bqNext=()=>{lvl=Math.min(lvl+1,CHALLENGES.length-1);document.getElementById('bq-level').textContent=(lvl+1)+'/'+CHALLENGES.length;initLevel();};
  window.bqReset=()=>{lvl=0;document.getElementById('bq-level').textContent='1/'+CHALLENGES.length;initLevel();};
  window.bqHint=()=>setFeedback(`💡 ${CHALLENGES[lvl].hint}`,'#ffe040');
  initLevel();
}

function launchTreeTraversalQuiz(){
  const accent='#a78bfa';
  createQuizOverlay('Tree Traversal Quiz',accent);
  const body=document.getElementById('quiz-body');

  // Fixed tree
  //       1
  //      / \
  //     2   3
  //    / \ / \
  //   4  5 6  7
  const TREE={v:1,left:{v:2,left:{v:4,left:null,right:null},right:{v:5,left:null,right:null}},right:{v:3,left:{v:6,left:null,right:null},right:{v:7,left:null,right:null}}};

  function inorder(n){if(!n)return[];return[...inorder(n.left),n.v,...inorder(n.right)];}
  function preorder(n){if(!n)return[];return[n.v,...preorder(n.left),...preorder(n.right)];}
  function postorder(n){if(!n)return[];return[...postorder(n.left),...postorder(n.right),n.v];}
  function levelorder(n){if(!n)return[];const q=[n],r=[];while(q.length){const u=q.shift();r.push(u.v);if(u.left)q.push(u.left);if(u.right)q.push(u.right);}return r;}

  const MODES=[
    {label:'Inorder (L→Root→R)',correct:inorder(TREE),desc:'Visit LEFT subtree, then ROOT, then RIGHT subtree.'},
    {label:'Preorder (Root→L→R)',correct:preorder(TREE),desc:'Visit ROOT first, then LEFT subtree, then RIGHT subtree.'},
    {label:'Postorder (L→R→Root)',correct:postorder(TREE),desc:'Visit LEFT subtree, then RIGHT subtree, then ROOT.'},
    {label:'Level Order (BFS)',correct:levelorder(TREE),desc:'Visit level by level, left to right.'},
  ];
  let modeIdx=0, clicked=[], moves=0, timer=null, solved=false;

  function setFeedback(msg,color){const fb=document.getElementById('tq-feedback');if(fb){fb.textContent=msg;fb.style.color=color||'#9090c0';}}

  function initMode(){
    clicked=[];moves=0;solved=false;
    if(timer)timer.stop();timer=quizTimer('tq-time');
    document.getElementById('tq-moves').textContent=0;
    document.getElementById('tq-mode').textContent=MODES[modeIdx].label;
    setFeedback(MODES[modeIdx].desc+' Click nodes in the correct order!','#9090c0');
    render();
    renderProgress();
  }

  function renderProgress(){
    const el=document.getElementById('tq-progress-row');
    if(!el)return;
    el.innerHTML=MODES[modeIdx].correct.map((v,i)=>{
      const done=i<clicked.length;
      const isNext=i===clicked.length;
      const correct=done&&clicked[i]===v;
      const wrong=done&&clicked[i]!==v;
      return `<div style="width:32px;height:32px;border-radius:6px;display:flex;align-items:center;justify-content:center;
        background:${wrong?'rgba(255,71,87,0.2)':correct?'rgba(167,139,250,0.25)':isNext?'rgba(167,139,250,0.08)':'rgba(255,255,255,0.02)'};
        border:2px solid ${wrong?'#ff4757':correct?accent:isNext?accent+'66':'#1e3050'};
        font-family:'Space Mono',monospace;font-size:12px;font-weight:700;
        color:${wrong?'#ff4757':correct?accent:isNext?accent+'88':'#2a4060'};">
        ${done?(wrong?'✗':clicked[i]):'?'}
      </div>`;
    }).join('');
  }

  function getNodePos(W,H){
    const pos={};
    function layout(node,depth,left,right){if(!node)return;pos[node.v]={x:(left+right)/2,y:40+depth*90};layout(node.left,depth+1,left,(left+right)/2);layout(node.right,depth+1,(left+right)/2,right);}
    layout(TREE,0,40,W-40);return pos;
  }

  function render(){
    const c=document.getElementById('tq-canvas');if(!c)return;
    const W=c.width,H=c.height,ctx=c.getContext('2d');
    ctx.clearRect(0,0,W,H);ctx.fillStyle='#0a0a1a';ctx.fillRect(0,0,W,H);
    const pos=getNodePos(W,H);
    // Edges
    function drawEdges(node){if(!node)return;if(node.left){const p=pos[node.v],ch=pos[node.left.v];ctx.strokeStyle='#1e3050';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(ch.x,ch.y);ctx.stroke();}if(node.right){const p=pos[node.v],ch=pos[node.right.v];ctx.strokeStyle='#1e3050';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(ch.x,ch.y);ctx.stroke();}drawEdges(node.left);drawEdges(node.right);}
    drawEdges(TREE);
    // Nodes
    const correctSoFar=MODES[modeIdx].correct;
    Object.entries(pos).forEach(([v,{x,y}])=>{
      const vi=parseInt(v);const r=24;
      const orderIdx=clicked.indexOf(vi);
      const isCl=orderIdx!==-1;
      const isCorrect=isCl&&correctSoFar[orderIdx]===vi;
      const isWrong=isCl&&correctSoFar[orderIdx]!==vi;
      let fill='#0a1825',stroke='#1e3050',textC='#3d5470';
      if(isCorrect){fill='rgba(167,139,250,0.25)';stroke=accent;textC=accent;}
      if(isWrong){fill='rgba(255,71,87,0.2)';stroke='#ff4757';textC='#ff4757';}
      if(solved){fill='rgba(0,255,163,0.15)';stroke='#00ffa3';textC='#00ffa3';}
      ctx.fillStyle=fill;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();
      ctx.strokeStyle=stroke;ctx.lineWidth=2;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.stroke();
      ctx.fillStyle=textC;ctx.font='bold 14px Space Mono,monospace';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(vi,x,y);
      if(isCl){ctx.fillStyle=accent;ctx.font='bold 10px Space Mono,monospace';ctx.fillText(orderIdx+1,x+r-2,y-r+2);}
      ctx.textBaseline='alphabetic';
    });
    ctx.textAlign='start';
  }

  body.innerHTML=`
    <div class="quiz-instructions">
      <b>🚶 Tree Traversal:</b> Click nodes in the correct traversal order.<br>
      <b>Mode:</b> <span id="tq-mode" style="color:${accent};">${MODES[0].label}</span><br>
      Numbers show the order you clicked. Wrong order = red highlight.
    </div>
    <div class="quiz-stats">
      <div class="quiz-stat">Moves<span id="tq-moves">0</span></div>
      <div class="quiz-stat">Time<span id="tq-time">0s</span></div>
      <div class="quiz-stat">Mode<span id="tq-modenum">${modeIdx+1}/${MODES.length}</span></div>
    </div>
    <div class="quiz-canvas-wrap"><canvas id="tq-canvas" width="600" height="340" style="cursor:pointer;max-width:100%;"></canvas></div>
    <div id="tq-progress-row" style="display:flex;gap:6px;flex-wrap:wrap;justify-content:center;background:#111128;border:1px solid #2a2a5a;border-radius:10px;padding:10px;"></div>
    <div class="quiz-feedback" id="tq-feedback"></div>
    <div class="quiz-btn-row">
      <button class="quiz-btn primary" onclick="tqNextMode()">Next Mode ›</button>
      <button class="quiz-btn" onclick="tqReset()">↺ Clear</button>
      <button class="quiz-btn quiz-hint-btn" onclick="tqHint()">💡 Hint</button>
    </div>
  `;

  const cvs=document.getElementById('tq-canvas');
  function handleClick(x,y){
    if(solved)return;
    const pos=getNodePos(cvs.width,cvs.height);
    const found=Object.entries(pos).find(([v,p])=>Math.hypot(p.x-x,p.y-y)<26);
    if(!found)return;
    const vi=parseInt(found[0]);
    if(clicked.includes(vi)){setFeedback(`${vi} already clicked!`,'#ff4757');return;}
    const expectedIdx=clicked.length;
    const expected=MODES[modeIdx].correct[expectedIdx];
    clicked.push(vi);moves++;document.getElementById('tq-moves').textContent=moves;
    if(vi===expected)setFeedback(`✅ ${vi} is step ${expectedIdx+1} — correct!`,'#00ffa3');
    else setFeedback(`❌ Expected ${expected}, got ${vi}. Try to recall the ${MODES[modeIdx].label} rule!`,'#ff4757');
    if(clicked.length===MODES[modeIdx].correct.length&&JSON.stringify(clicked)===JSON.stringify(MODES[modeIdx].correct)){
      solved=true;timer&&timer.stop();
      setFeedback(`🎉 Perfect ${MODES[modeIdx].label}! ${moves} moves · ${timer?timer.getTime():0}s`,'#00ffa3');
    }
    render();renderProgress();
  }
  cvs.addEventListener('click',e=>{const r=cvs.getBoundingClientRect();handleClick((e.clientX-r.left)*(cvs.width/r.width),(e.clientY-r.top)*(cvs.height/r.height));});
  cvs.addEventListener('touchstart',e=>{e.preventDefault();const r=cvs.getBoundingClientRect(),t=e.touches[0];handleClick((t.clientX-r.left)*(cvs.width/r.width),(t.clientY-r.top)*(cvs.height/r.height));},{passive:false});

  window.tqNextMode=()=>{modeIdx=(modeIdx+1)%MODES.length;document.getElementById('tq-modenum').textContent=(modeIdx+1)+'/'+MODES.length;initMode();};
  window.tqReset=()=>initMode();
  window.tqHint=()=>{const next=MODES[modeIdx].correct[clicked.length];if(next!==undefined)setFeedback(`💡 Next node: ${next}`,'#ffe040');};
  initMode();
}


/* ════════════════════════════════════════════════
   MAZE QUIZ — navigate the maze yourself
   ════════════════════════════════════════════════ */
function launchMazeQuiz() {
  const accentColor = '#fb923c';
  createQuizOverlay('Rat in a Maze', accentColor);
  const body = document.getElementById('quiz-body');

  const MAZES = [
    // Easy 5×5
    [[1,1,0,1,1],[1,0,0,1,0],[1,1,1,0,1],[0,1,0,1,1],[0,1,1,1,1]],
    // Medium 7×7
    [[1,0,1,1,1,0,1],[1,1,1,0,1,1,1],[0,0,1,0,0,0,1],[1,1,1,1,1,0,1],[1,0,0,0,1,1,1],[1,1,0,1,1,0,1],[0,1,1,1,0,1,1]],
    // Hard 9×9
    [[1,1,0,1,1,1,0,1,1],[1,0,0,0,1,0,0,0,1],[1,1,1,0,1,1,1,0,1],[0,0,1,1,0,1,0,1,0],[1,1,1,0,1,0,1,1,1],[1,0,0,1,1,1,0,0,1],[1,1,0,0,0,1,1,0,1],[0,1,1,1,0,0,1,1,1],[0,0,0,1,1,1,0,1,1]],
  ];

  let lvl = 0, maze, N, pos, path, solved, moves, timer;

  function initMaze(l) {
    lvl = l; maze = MAZES[lvl].map(r=>[...r]);
    N = maze.length; pos = {r:0,c:0}; path = [{r:0,c:0}];
    solved = false; moves = 0;
    if (timer) timer.stop();
    timer = quizTimer('mz-time');
    document.getElementById('mz-moves').textContent = 0;
    setFeedback('🐭 Navigate the rat to the 🏁 goal (bottom-right)! Use arrow keys or tap.', '#9090c0');
    render();
  }

  function setFeedback(msg, color) {
    const fb = document.getElementById('mz-feedback');
    if (fb) { fb.textContent = msg; fb.style.color = color||'#9090c0'; }
  }

  function move(dr, dc) {
    if (solved) return;
    const nr = pos.r + dr, nc = pos.c + dc;
    if (nr < 0 || nr >= N || nc < 0 || nc >= N) { setFeedback('🚧 Wall — out of bounds!', '#ff4757'); return; }
    if (maze[nr][nc] === 0) { setFeedback('🧱 Blocked! That cell is a wall.', '#ff4757'); return; }
    pos = {r:nr, c:nc}; moves++;
    // track path (allow revisit but don't duplicate consecutive)
    if (!path.length || path[path.length-1].r !== nr || path[path.length-1].c !== nc) path.push({r:nr,c:nc});
    document.getElementById('mz-moves').textContent = moves;
    if (nr === N-1 && nc === N-1) {
      solved = true; timer&&timer.stop();
      const t = timer?timer.getTime():0;
      setFeedback(`🎉 Reached the goal in ${moves} moves · ${t}s! 🐭→🏁`, '#00ffa3');
    } else {
      setFeedback(`Moved to (${nr},${nc}). Keep going!`, '#9090c0');
    }
    render();
  }

  function render() {
    const c = document.getElementById('mz-canvas');
    if (!c) return;
    const W = c.width, H = c.height;
    const ctx = c.getContext('2d');
    const cell = Math.min(Math.floor((W-20)/N), Math.floor((H-20)/N));
    const ox = Math.floor((W - cell*N)/2), oy = Math.floor((H - cell*N)/2);

    ctx.clearRect(0,0,W,H);
    ctx.fillStyle='#0a0a1a'; ctx.fillRect(0,0,W,H);

    for (let r=0;r<N;r++) for (let c2=0;c2<N;c2++) {
      const x=ox+c2*cell, y=oy+r*cell;
      const isPath = path.some(p=>p.r===r&&p.c===c2);
      ctx.fillStyle = maze[r][c2]===0 ? '#0e0e26' : (isPath?'rgba(251,146,60,0.12)':'#131332');
      ctx.fillRect(x,y,cell,cell);

      if (maze[r][c2]===0) {
        // Wall pattern
        ctx.fillStyle='#0a0a20'; ctx.fillRect(x+1,y+1,cell-2,cell-2);
        ctx.fillStyle='rgba(0,229,255,0.04)'; ctx.fillRect(x,y,cell,cell);
      }

      ctx.strokeStyle='rgba(251,146,60,0.15)'; ctx.lineWidth=0.5;
      ctx.strokeRect(x,y,cell,cell);
    }

    // Draw path trail
    if (path.length > 1) {
      ctx.strokeStyle='rgba(251,146,60,0.4)'; ctx.lineWidth=3; ctx.setLineDash([4,4]);
      ctx.beginPath();
      path.forEach((p,i)=>{ const px=ox+p.c*cell+cell/2,py=oy+p.r*cell+cell/2; i===0?ctx.moveTo(px,py):ctx.lineTo(px,py); });
      ctx.stroke(); ctx.setLineDash([]);
    }

    // Goal
    const gx=ox+(N-1)*cell, gy=oy+(N-1)*cell;
    ctx.fillStyle='rgba(0,255,163,0.15)'; ctx.fillRect(gx,gy,cell,cell);
    ctx.font=`${Math.floor(cell*0.6)}px sans-serif`; ctx.textAlign='center';
    ctx.fillText('🏁', gx+cell/2, gy+cell*0.72);

    // Rat
    const rx=ox+pos.c*cell, ry=oy+pos.r*cell;
    ctx.fillStyle='rgba(251,146,60,0.2)'; ctx.fillRect(rx,ry,cell,cell);
    ctx.shadowColor=accentColor; ctx.shadowBlur=12;
    ctx.font=`${Math.floor(cell*0.65)}px sans-serif`;
    ctx.fillText('🐭', rx+cell/2, ry+cell*0.75);
    ctx.shadowBlur=0; ctx.textAlign='start';

    // Start label
    ctx.font='9px Space Mono,monospace'; ctx.fillStyle='#3a4060';
    ctx.fillText('START', ox+2, oy-4);
    ctx.fillText('GOAL', ox+(N-1)*cell+2, oy+(N-1)*cell-4);
  }

  body.innerHTML = `
    <div class="quiz-instructions">
      <b>🐭 Goal:</b> Navigate the rat from <b>top-left</b> to the <b>🏁 bottom-right</b> goal.<br>
      <b>⬛ Walls:</b> Dark cells are walls — you can't pass through them.<br>
      <b>🕹 Controls:</b> <b>Arrow keys</b> or tap the <b>direction buttons</b> below.
    </div>
    <div class="quiz-stats">
      <div class="quiz-stat">Moves<span id="mz-moves">0</span></div>
      <div class="quiz-stat">Time<span id="mz-time">0s</span></div>
      <div class="quiz-stat">Size<span id="mz-size">${MAZES[0].length}×${MAZES[0].length}</span></div>
    </div>
    <div class="quiz-canvas-wrap">
      <canvas id="mz-canvas" width="460" height="460"></canvas>
    </div>
    <div class="quiz-feedback" id="mz-feedback">Use arrows or buttons to move!</div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;max-width:200px;margin:0 auto;">
      <div></div>
      <button class="quiz-btn" style="padding:12px;" onclick="mzMove(-1,0)">▲</button>
      <div></div>
      <button class="quiz-btn" style="padding:12px;" onclick="mzMove(0,-1)">◄</button>
      <button class="quiz-btn" style="padding:12px;" onclick="mzMove(0,0)">●</button>
      <button class="quiz-btn" style="padding:12px;" onclick="mzMove(0,1)">►</button>
      <div></div>
      <button class="quiz-btn" style="padding:12px;" onclick="mzMove(1,0)">▼</button>
      <div></div>
    </div>
    <div class="quiz-btn-row" style="margin-top:8px;">
      <button class="quiz-btn primary" onclick="mzNextLevel()">Harder Maze ›</button>
      <button class="quiz-btn" onclick="mzRestart()">↺ Restart</button>
      <button class="quiz-btn quiz-hint-btn" onclick="mzHint()">💡 Hint</button>
    </div>
  `;

  // Keyboard control
  const keyHandler = e => {
    if (!document.getElementById('mz-canvas')) { document.removeEventListener('keydown', keyHandler); return; }
    const map = { ArrowUp:[-1,0], ArrowDown:[1,0], ArrowLeft:[0,-1], ArrowRight:[0,1],
                  w:[-1,0], s:[1,0], a:[0,-1], d:[0,1] };
    const d = map[e.key];
    if (d) { e.preventDefault(); move(d[0],d[1]); }
  };
  document.addEventListener('keydown', keyHandler);

  // BFS hint solver
  function bfsSolve() {
    const queue = [[{r:0,c:0}]];
    const visited = Array.from({length:N},()=>Array(N).fill(false));
    visited[0][0] = true;
    while (queue.length) {
      const p = queue.shift();
      const {r,c} = p[p.length-1];
      if (r===N-1&&c===N-1) return p;
      for (const [dr,dc] of [[-1,0],[1,0],[0,-1],[0,1]]) {
        const nr=r+dr,nc=c+dc;
        if (nr>=0&&nr<N&&nc>=0&&nc<N&&maze[nr][nc]===1&&!visited[nr][nc]) {
          visited[nr][nc]=true; queue.push([...p,{r:nr,c:nc}]);
        }
      }
    }
    return null;
  }

  window.mzMove = move;
  window.mzNextLevel = () => {
    const next = Math.min(lvl+1, MAZES.length-1);
    initMaze(next);
    document.getElementById('mz-size').textContent = MAZES[next].length+'×'+MAZES[next].length;
    setFeedback(`Level ${next+1} maze loaded!`, accentColor);
  };
  window.mzRestart = () => { initMaze(lvl); };
  window.mzHint = () => {
    const sol = bfsSolve();
    if (!sol) { setFeedback('No path from current state!','#ff4757'); return; }
    // find current pos in solution path
    let idx = sol.findIndex(p=>p.r===pos.r&&p.c===pos.c);
    if (idx === -1 || idx >= sol.length-1) { setFeedback('💡 Try restarting — you may be off the optimal path.','#ffe040'); return; }
    const next = sol[idx+1];
    const dirs = {'-1,0':'UP','1,0':'DOWN','0,-1':'LEFT','0,1':'RIGHT'};
    const key = `${next.r-pos.r},${next.c-pos.c}`;
    setFeedback(`💡 Hint: Move ${dirs[key]||'→'} to (${next.r},${next.c})`, '#ffe040');
  };

  initMaze(0);
}

/* ════════════════════════════════════════════════
   SUDOKU QUIZ — fill in the blanks yourself
   ════════════════════════════════════════════════ */
function launchSudokuQuiz() {
  const accentColor = '#c084fc';
  createQuizOverlay('Sudoku Challenge', accentColor);
  const body = document.getElementById('quiz-body');

  // Pre-made easy 9×9 puzzles (0=empty)
  const PUZZLES = [
    [5,3,0,0,7,0,0,0,0,
     6,0,0,1,9,5,0,0,0,
     0,9,8,0,0,0,0,6,0,
     8,0,0,0,6,0,0,0,3,
     4,0,0,8,0,3,0,0,1,
     7,0,0,0,2,0,0,0,6,
     0,6,0,0,0,0,2,8,0,
     0,0,0,4,1,9,0,0,5,
     0,0,0,0,8,0,0,7,9],
  ];

  const SOLUTION = [
    [5,3,4,6,7,8,9,1,2,
     6,7,2,1,9,5,3,4,8,
     1,9,8,3,4,2,5,6,7,
     8,5,9,7,6,1,4,2,3,
     4,2,6,8,5,3,7,9,1,
     7,1,3,9,2,4,8,5,6,
     9,6,1,5,3,7,2,8,4,
     2,8,7,4,1,9,6,3,5,
     3,4,5,2,8,6,1,7,9],
  ];

  let puzIdx = 0;
  let grid = [], given = [], selected = null, moves = 0, timer = null;

  function initPuzzle() {
    grid = [...PUZZLES[puzIdx]];
    given = grid.map(v => v !== 0);
    selected = null; moves = 0;
    if (timer) timer.stop();
    timer = quizTimer('sdk-time');
    document.getElementById('sdk-moves').textContent = 0;
    setFeedback('Tap a blank cell, then press a number button to fill it in!', '#9090c0');
    render();
  }

  function setFeedback(msg, color) {
    const fb = document.getElementById('sdk-feedback');
    if (fb) { fb.textContent = msg; fb.style.color = color||'#9090c0'; }
  }

  function isValid(g, idx, val) {
    const row = Math.floor(idx/9), col = idx%9;
    for (let c=0;c<9;c++) if (c!==col && g[row*9+c]===val) return false;
    for (let r=0;r<9;r++) if (r!==row && g[r*9+col]===val) return false;
    const br=Math.floor(row/3)*3, bc=Math.floor(col/3)*3;
    for (let dr=0;dr<3;dr++) for (let dc=0;dc<3;dc++) {
      const i=(br+dr)*9+(bc+dc);
      if (i!==idx && g[i]===val) return false;
    }
    return true;
  }

  function checkComplete() {
    if (grid.every((v,i) => v === SOLUTION[puzIdx][i])) {
      timer&&timer.stop();
      const t=timer?timer.getTime():0;
      setFeedback(`🎉 Puzzle solved! ${moves} moves · ${t}s`, '#00ffa3');
    }
  }

  function render() {
    const c = document.getElementById('sdk-canvas');
    if (!c) return;
    const W=c.width, H=c.height, ctx=c.getContext('2d');
    const cell=Math.floor(Math.min(W,H)/9.4);
    const ox=Math.floor((W-cell*9)/2), oy=Math.floor((H-cell*9)/2);

    ctx.clearRect(0,0,W,H);
    ctx.fillStyle='#0a0a1a'; ctx.fillRect(0,0,W,H);

    for (let r=0;r<9;r++) for (let col=0;col<9;col++) {
      const i=r*9+col;
      const x=ox+col*cell, y=oy+r*cell;
      // box shading
      const boxShade = (Math.floor(r/3)+Math.floor(col/3))%2===0;
      ctx.fillStyle = boxShade ? '#12122a' : '#0f0f22';
      ctx.fillRect(x,y,cell,cell);

      // selected
      if (selected===i) { ctx.fillStyle='rgba(192,132,252,0.22)'; ctx.fillRect(x,y,cell,cell); }
      // same row/col/box hint
      if (selected!==null) {
        const sr=Math.floor(selected/9), sc=selected%9;
        if (r===sr||col===sc||(Math.floor(r/3)===Math.floor(sr/3)&&Math.floor(col/3)===Math.floor(sc/3))) {
          ctx.fillStyle='rgba(192,132,252,0.07)'; ctx.fillRect(x,y,cell,cell);
        }
      }

      // error highlight
      if (grid[i]!==0 && !isValid(grid,i,grid[i])) {
        ctx.fillStyle='rgba(255,71,87,0.2)'; ctx.fillRect(x,y,cell,cell);
      }

      // grid lines
      ctx.strokeStyle='rgba(192,132,252,0.15)'; ctx.lineWidth=0.5;
      ctx.strokeRect(x,y,cell,cell);

      // values
      if (grid[i]!==0) {
        const isGiven2=given[i];
        const isErr = !isValid(grid,i,grid[i]);
        ctx.fillStyle = isErr ? '#ff4757' : (isGiven2 ? '#e8e8ff' : accentColor);
        ctx.font = `${isGiven2?'bold ':' '}${Math.floor(cell*0.55)}px 'Space Mono',monospace`;
        ctx.textAlign='center';
        ctx.fillText(grid[i], x+cell/2, y+cell*0.7);
      }
    }

    // Bold 3×3 box borders
    ctx.strokeStyle='rgba(192,132,252,0.5)'; ctx.lineWidth=2;
    for (let b=0;b<=3;b++) {
      ctx.beginPath(); ctx.moveTo(ox+b*3*cell,oy); ctx.lineTo(ox+b*3*cell,oy+9*cell); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(ox,oy+b*3*cell); ctx.lineTo(ox+9*cell,oy+b*3*cell); ctx.stroke();
    }

    ctx.textAlign='start';
  }

  body.innerHTML = `
    <div class="quiz-instructions">
      <b>🔢 Goal:</b> Fill in the 9×9 grid so every row, column, and 3×3 box contains digits 1–9.<br>
      <b>🖱 How:</b> Tap a blank cell to select it (highlighted), then press a number button below.<br>
      <b>⌨ Also:</b> You can use keyboard number keys 1–9 and Delete/Backspace to erase.
    </div>
    <div class="quiz-stats">
      <div class="quiz-stat">Moves<span id="sdk-moves">0</span></div>
      <div class="quiz-stat">Time<span id="sdk-time">0s</span></div>
      <div class="quiz-stat">Errors<span id="sdk-errors">0</span></div>
    </div>
    <div class="quiz-canvas-wrap">
      <canvas id="sdk-canvas" width="460" height="460" style="cursor:pointer;"></canvas>
    </div>
    <div class="quiz-feedback" id="sdk-feedback">Select a cell, then tap a number!</div>
    <div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin:4px 0;">
      ${[1,2,3,4,5,6,7,8,9].map(n=>`<button class="quiz-btn" style="flex:0 0 40px;padding:10px 0;font-size:15px;" onclick="sdkInput(${n})">${n}</button>`).join('')}
      <button class="quiz-btn" style="flex:0 0 48px;padding:10px 0;font-size:13px;color:#ff4757;" onclick="sdkInput(0)">⌫</button>
    </div>
    <div class="quiz-btn-row">
      <button class="quiz-btn" onclick="sdkRestart()">↺ Restart</button>
      <button class="quiz-btn quiz-hint-btn" onclick="sdkHint()">💡 Hint</button>
    </div>
  `;

  const cvs = document.getElementById('sdk-canvas');
  function handleSdkClick(x, y) {
    const cell=Math.floor(Math.min(cvs.width,cvs.height)/9.4);
    const ox=Math.floor((cvs.width-cell*9)/2), oy=Math.floor((cvs.height-cell*9)/2);
    const col=Math.floor((x-ox)/cell), row=Math.floor((y-oy)/cell);
    if (row<0||row>=9||col<0||col>=9) return;
    const i=row*9+col;
    if (given[i]) { setFeedback('That cell is given — it cannot be changed.','#ff4757'); return; }
    selected=i; render();
  }
  cvs.addEventListener('click',e=>{const r=cvs.getBoundingClientRect();handleSdkClick((e.clientX-r.left)*(cvs.width/r.width),(e.clientY-r.top)*(cvs.height/r.height));});
  cvs.addEventListener('touchstart',e=>{e.preventDefault();const r=cvs.getBoundingClientRect(),t=e.touches[0];handleSdkClick((t.clientX-r.left)*(cvs.width/r.width),(t.clientY-r.top)*(cvs.height/r.height));},{passive:false});

  const keyH = e => {
    if (!document.getElementById('sdk-canvas')) { document.removeEventListener('keydown',keyH); return; }
    if (selected===null) return;
    if (e.key>='1'&&e.key<='9') { e.preventDefault(); window.sdkInput(+e.key); }
    if (e.key==='Backspace'||e.key==='Delete') { e.preventDefault(); window.sdkInput(0); }
  };
  document.addEventListener('keydown',keyH);

  window.sdkInput = val => {
    if (selected===null) { setFeedback('Tap a blank cell first!','#ff4757'); return; }
    if (given[selected]) return;
    grid[selected]=val; moves++;
    document.getElementById('sdk-moves').textContent=moves;
    const errors=grid.filter((v,i)=>v!==0&&!isValid(grid,i,v)).length;
    document.getElementById('sdk-errors').textContent=errors;
    if (val===0) setFeedback(`Cleared cell.`,'#9090c0');
    else if (!isValid(grid,selected,val)) setFeedback(`⚠️ Conflict! ${val} already exists in this row/col/box.`,'#ff4757');
    else { setFeedback(`Placed ${val} ✓`,'#00ffa3'); checkComplete(); }
    render();
  };
  window.sdkRestart = () => initPuzzle();
  window.sdkHint = () => {
    // Find first empty cell with only 1 possibility
    for (let i=0;i<81;i++) {
      if (grid[i]!==0) continue;
      const possible=[];
      for (let v=1;v<=9;v++) if(isValid(grid,i,v)) possible.push(v);
      if (possible.length===1) {
        selected=i; render();
        setFeedback(`💡 Cell (${Math.floor(i/9)},${i%9}) must be ${possible[0]}!`,'#ffe040');
        return;
      }
    }
    setFeedback('💡 No single-option cells right now — look for row/col/box constraints!','#ffe040');
  };

  initPuzzle();
}

/* ════════════════════════════════════════════════════════
   BRANCH 11 — DSU (DISJOINT SET UNION)
   Quiz: given union sequence, predict which elements are connected
   ════════════════════════════════════════════════════════ */
function launchDSUQuiz() {
  const accent = '#f472b6';
  createQuizOverlay('DSU — Predict the Components', accent);
  const body = document.getElementById('quiz-body');

  const CHALLENGES = [
    { n:6, unions:[[0,1],[2,3],[1,2]], questions:[{a:0,b:3,ans:true},{a:4,b:5,ans:false},{a:0,b:5,ans:false}], label:'6 nodes, 3 unions' },
    { n:8, unions:[[0,1],[2,3],[4,5],[6,7],[0,2],[4,6]], questions:[{a:0,b:3,ans:true},{a:1,b:5,ans:false},{a:4,b:7,ans:true},{a:0,b:7,ans:false}], label:'8 nodes, 6 unions' },
    { n:7, unions:[[0,1],[1,2],[2,3],[3,4],[4,5],[5,6]], questions:[{a:0,b:6,ans:true},{a:1,b:4,ans:true},{a:0,b:3,ans:true}], label:'7 nodes, chain' },
  ];

  function makeDSU(n){ const p=Array.from({length:n},(_,i)=>i); function find(x){return p[x]===x?x:p[x]=find(p[x]);} function union(a,b){p[find(a)]=find(b);} return{find,union}; }

  let lvl=0, qIdx=0, moves=0, timer=null, score=0, solved=false;

  function setFeedback(msg,color){const fb=document.getElementById('dq-feedback');if(fb){fb.textContent=msg;fb.style.color=color||'#9090c0';}}

  function initLevel(){
    qIdx=0; moves=0; score=0; solved=false;
    if(timer)timer.stop(); timer=quizTimer('dq-time');
    document.getElementById('dq-moves').textContent=0;
    renderQuestion();
  }

  function renderQuestion(){
    const{n,unions,questions}=CHALLENGES[lvl];
    if(qIdx>=questions.length){ solved=true; timer&&timer.stop(); setFeedback(`🎉 All ${questions.length} questions correct! ${moves} moves · ${timer?timer.getTime():0}s`,'#00ffa3'); return; }
    const{a,b}=questions[qIdx];
    document.getElementById('dq-question').innerHTML=`
      <div style="font-family:'Space Mono',monospace;font-size:13px;color:#c0c0e0;margin-bottom:10px;">
        After these unions: <span style="color:${accent};">${unions.map(([x,y])=>`union(${x},${y})`).join(', ')}</span>
      </div>
      <div style="font-size:16px;font-weight:700;font-family:'Orbitron',monospace;color:#fff;text-align:center;padding:16px;background:rgba(244,114,182,0.08);border:1px solid ${accent}44;border-radius:10px;">
        Are nodes <span style="color:${accent};">${a}</span> and <span style="color:${accent};">${b}</span> in the same component?
      </div>
      <div style="font-family:'Space Mono',monospace;font-size:11px;color:#3a5070;margin-top:8px;text-align:center;">
        Question ${qIdx+1} / ${questions.length}
      </div>`;
  }

  function answer(yn){
    if(solved)return;
    const{unions,questions,n}=CHALLENGES[lvl];
    const dsu=makeDSU(n); unions.forEach(([a,b])=>dsu.union(a,b));
    const{a,b,ans}=questions[qIdx];
    const correct=(dsu.find(a)===dsu.find(b))===yn;
    moves++; document.getElementById('dq-moves').textContent=moves;
    if(correct){ score++; setFeedback(`✅ Correct! Nodes ${a} and ${b} are ${ans?'':'NOT '}connected.`,'#00ffa3'); }
    else { setFeedback(`❌ Wrong! They are ${ans?'':'NOT '}connected — ${ans?`union operations link them through a common root`:`they were never merged`}.`,'#ff4757'); }
    qIdx++;
    document.getElementById('dq-score').textContent=`${score}/${CHALLENGES[lvl].questions.length}`;
    setTimeout(()=>renderQuestion(), 900);
  }

  body.innerHTML=`
    <div class="quiz-instructions">
      <b>🔗 DSU Quiz:</b> Given a sequence of union operations, answer if two nodes end up in the same component.<br>
      <b>Tip:</b> Apply path compression mentally — if A→B and B→C, then A and C share a root.
    </div>
    <div class="quiz-stats">
      <div class="quiz-stat">Moves<span id="dq-moves">0</span></div>
      <div class="quiz-stat">Time<span id="dq-time">0s</span></div>
      <div class="quiz-stat">Score<span id="dq-score">0/${CHALLENGES[0].questions.length}</span></div>
    </div>
    <div id="dq-question" style="background:#111128;border:1px solid #2a2a5a;border-radius:12px;padding:16px;"></div>
    <div style="display:flex;gap:12px;justify-content:center;">
      <button class="quiz-btn" style="flex:1;padding:16px;font-size:16px;color:#00ffa3;border-color:#00ffa3;" onclick="dqAnswer(true)">✅ YES — Same</button>
      <button class="quiz-btn" style="flex:1;padding:16px;font-size:16px;color:#ff4757;border-color:#ff4757;" onclick="dqAnswer(false)">❌ NO — Different</button>
    </div>
    <div class="quiz-feedback" id="dq-feedback">Are the two nodes in the same component after all unions?</div>
    <div class="quiz-btn-row">
      <button class="quiz-btn primary" onclick="dqNext()">Next Level ›</button>
      <button class="quiz-btn" onclick="dqReset()">↺ Restart</button>
      <button class="quiz-btn quiz-hint-btn" onclick="dqHint()">💡 Hint</button>
    </div>`;

  window.dqAnswer = answer;
  window.dqNext=()=>{lvl=Math.min(lvl+1,CHALLENGES.length-1);document.getElementById('dq-score').textContent=`0/${CHALLENGES[lvl].questions.length}`;initLevel();};
  window.dqReset=()=>{lvl=0;document.getElementById('dq-score').textContent=`0/${CHALLENGES[0].questions.length}`;initLevel();};
  window.dqHint=()=>{
    const{unions,questions,n}=CHALLENGES[lvl];
    if(qIdx>=questions.length)return;
    const dsu=makeDSU(n);unions.forEach(([a,b])=>dsu.union(a,b));
    const{a,b,ans}=questions[qIdx];
    setFeedback(`💡 Trace through: ${unions.map(([x,y])=>`union(${x},${y})`).join(' → ')}. Nodes ${a}&${b} share root? ${ans?'Yes':'No'}.`,'#ffe040');
  };
  initLevel();
}

/* ════════════════════════════════════════════════════════
   BRANCH 12 — COMPUTATIONAL GEOMETRY
   Convex Hull: click which points are ON the hull
   Line Intersection: decide if two segments intersect
   Closest Pair: click the closest pair of points
   Polygon Area: estimate the area using the shoelace formula
   ════════════════════════════════════════════════════════ */
function launchConvexHullQuiz() {
  const accent = '#22d3ee';
  createQuizOverlay('Convex Hull — Mark the Hull Points', accent);
  const body = document.getElementById('quiz-body');

  // Fixed point sets with known hulls
  const CHALLENGES = [
    { pts:[[100,200],[200,80],[350,150],[300,300],[150,320],[250,200],[180,180]], hull:[0,1,2,3,4] },
    { pts:[[80,100],[200,60],[380,100],[420,250],[350,380],[200,400],[60,320],[150,220],[280,200]], hull:[0,1,2,3,4,5,6] },
    { pts:[[150,150],[300,80],[450,160],[400,320],[250,380],[100,280],[220,240],[310,200]], hull:[0,1,2,3,4,5] },
  ];
  let lvl=0, selected=new Set(), moves=0, timer=null, solved=false;

  function setFeedback(msg,color){const fb=document.getElementById('chq-feedback');if(fb){fb.textContent=msg;fb.style.color=color||'#9090c0';}}

  function checkSolved(){
    const{hull}=CHALLENGES[lvl];
    if([...selected].every(i=>hull.includes(i))&&hull.every(i=>selected.has(i))){
      solved=true;timer&&timer.stop();
      setFeedback(`🎉 Perfect! All ${hull.length} hull points identified! ${moves} moves · ${timer?timer.getTime():0}s`,'#00ffa3');
    }
  }

  function render(){
    const c=document.getElementById('chq-canvas');if(!c)return;
    const W=c.width,H=c.height,ctx=c.getContext('2d');
    ctx.clearRect(0,0,W,H);ctx.fillStyle='#0a0a1a';ctx.fillRect(0,0,W,H);
    const{pts,hull}=CHALLENGES[lvl];
    // Draw hull polygon hint outline (very faint)
    if(solved){
      ctx.beginPath();hull.forEach((i,j)=>{j===0?ctx.moveTo(pts[i][0],pts[i][1]):ctx.lineTo(pts[i][0],pts[i][1]);});ctx.closePath();
      ctx.strokeStyle='rgba(34,211,238,0.5)';ctx.lineWidth=2;ctx.stroke();
    }
    // Points
    pts.forEach((p,i)=>{
      const isSel=selected.has(i),isHull=hull.includes(i);
      const correct=isSel&&isHull,wrong=isSel&&!isHull;
      const r=isSel?12:8;
      ctx.fillStyle=solved?'rgba(0,255,163,0.3)':wrong?'rgba(255,71,87,0.3)':isSel?`rgba(34,211,238,0.3)`:'rgba(255,255,255,0.06)';
      ctx.beginPath();ctx.arc(p[0],p[1],r,0,Math.PI*2);ctx.fill();
      ctx.strokeStyle=solved?'#00ffa3':wrong?'#ff4757':isSel?accent:'rgba(255,255,255,0.2)';ctx.lineWidth=2;
      ctx.beginPath();ctx.arc(p[0],p[1],r,0,Math.PI*2);ctx.stroke();
      ctx.fillStyle=isSel?(wrong?'#ff4757':accent):'#5a7090';ctx.font='bold 10px Space Mono,monospace';ctx.textAlign='center';ctx.textBaseline='middle';
      ctx.fillText(i,p[0],p[1]);ctx.textBaseline='alphabetic';
    });
    ctx.textAlign='start';
  }

  function getPointAt(x,y){const{pts}=CHALLENGES[lvl];return pts.findIndex(p=>Math.hypot(p[0]-x,p[1]-y)<16);}

  body.innerHTML=`
    <div class="quiz-instructions">
      <b>🔷 Convex Hull:</b> Click all points that lie <b>on the convex hull</b> — the outermost boundary.<br>
      <b>Rule:</b> Hull points are those you can't express as a convex combination of others. Think: rubber band stretched around all points!
    </div>
    <div class="quiz-stats">
      <div class="quiz-stat">Moves<span id="chq-moves">0</span></div>
      <div class="quiz-stat">Time<span id="chq-time">0s</span></div>
      <div class="quiz-stat">Level<span id="chq-level">1/${CHALLENGES.length}</span></div>
    </div>
    <div class="quiz-canvas-wrap"><canvas id="chq-canvas" width="520" height="440" style="cursor:pointer;max-width:100%;"></canvas></div>
    <div class="quiz-feedback" id="chq-feedback">Click points on the convex hull (outermost boundary). Click again to deselect.</div>
    <div class="quiz-btn-row">
      <button class="quiz-btn primary" onclick="chqNext()">Next ›</button>
      <button class="quiz-btn" onclick="chqReset()">↺ Restart</button>
      <button class="quiz-btn quiz-hint-btn" onclick="chqHint()">💡 Hint</button>
    </div>`;

  timer=quizTimer('chq-time');
  const cvs=document.getElementById('chq-canvas');
  function handleClick(x,y){if(solved)return;const i=getPointAt(x,y);if(i===-1)return;if(selected.has(i))selected.delete(i);else{selected.add(i);moves++;document.getElementById('chq-moves').textContent=moves;const isHull=CHALLENGES[lvl].hull.includes(i);setFeedback(isHull?`✅ Point ${i} is on the hull!`:`❌ Point ${i} is inside the hull.`,isHull?'#00ffa3':'#ff4757');}render();checkSolved();}
  cvs.addEventListener('click',e=>{const r=cvs.getBoundingClientRect();handleClick((e.clientX-r.left)*(cvs.width/r.width),(e.clientY-r.top)*(cvs.height/r.height));});
  cvs.addEventListener('touchstart',e=>{e.preventDefault();const r=cvs.getBoundingClientRect(),t=e.touches[0];handleClick((t.clientX-r.left)*(cvs.width/r.width),(t.clientY-r.top)*(cvs.height/r.height));},{passive:false});

  function initLevel(){selected=new Set();moves=0;solved=false;if(timer)timer.stop();timer=quizTimer('chq-time');document.getElementById('chq-moves').textContent=0;setFeedback('Click all hull points!','#9090c0');render();}
  window.chqNext=()=>{lvl=Math.min(lvl+1,CHALLENGES.length-1);document.getElementById('chq-level').textContent=(lvl+1)+'/'+CHALLENGES.length;initLevel();};
  window.chqReset=()=>{lvl=0;document.getElementById('chq-level').textContent='1/'+CHALLENGES.length;initLevel();};
  window.chqHint=()=>{const{hull,pts}=CHALLENGES[lvl];const missing=hull.find(i=>!selected.has(i));if(missing!==undefined)setFeedback(`💡 Point ${missing} at (${Math.round(pts[missing][0])},${Math.round(pts[missing][1])}) is on the hull.`,'#ffe040');};
  render();
}

function launchLineIntersectionQuiz() {
  const accent='#22d3ee';
  createQuizOverlay('Line Intersection — Do They Cross?', accent);
  const body=document.getElementById('quiz-body');

  const CHALLENGES=[
    {segs:[[[100,150],[400,350]],[[100,350],[400,150]]],intersects:true,desc:'Two diagonal lines crossing in the middle'},
    {segs:[[[80,100],[300,100]],[[400,200],[600,400]]],intersects:false,desc:'Horizontal line and diagonal — parallel tracks'},
    {segs:[[[100,300],[350,100]],[[200,350],[450,150]]],intersects:false,desc:'Parallel diagonals — same slope, different intercept'},
    {segs:[[[150,400],[350,100]],[[100,150],[450,300]]],intersects:true,desc:'Two segments that cross each other'},
    {segs:[[[100,200],[300,200]],[[200,100],[200,400]]],intersects:true,desc:'Horizontal and vertical — T-intersection'},
  ];
  let qIdx=0,score=0,moves=0,timer=null,solved=false;

  function setFeedback(msg,color){const fb=document.getElementById('liq-feedback');if(fb){fb.textContent=msg;fb.style.color=color||'#9090c0';}}

  function renderSegs(reveal=false){
    const c=document.getElementById('liq-canvas');if(!c)return;
    const W=c.width,H=c.height,ctx=c.getContext('2d');
    ctx.clearRect(0,0,W,H);ctx.fillStyle='#0a0a1a';ctx.fillRect(0,0,W,H);
    const{segs,intersects}=CHALLENGES[qIdx];
    const colors=['#00e5ff','#f59e0b'];
    segs.forEach(([a,b],i)=>{
      ctx.strokeStyle=colors[i];ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(a[0],a[1]);ctx.lineTo(b[0],b[1]);ctx.stroke();
      [a,b].forEach(p=>{ctx.fillStyle=colors[i];ctx.beginPath();ctx.arc(p[0],p[1],6,0,Math.PI*2);ctx.fill();});
    });
    if(reveal&&intersects){
      // Compute intersection point for display
      const [[x1,y1],[x2,y2]]=segs[0],[[x3,y3],[x4,y4]]=segs[1];
      const d=(x1-x2)*(y3-y4)-(y1-y2)*(x3-x4);
      if(Math.abs(d)>0.001){const t=((x1-x3)*(y3-y4)-(y1-y3)*(x3-x4))/d;const ix=x1+t*(x2-x1),iy=y1+t*(y2-y1);ctx.fillStyle='#00ffa3';ctx.beginPath();ctx.arc(ix,iy,10,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#00ffa3';ctx.lineWidth=3;ctx.beginPath();ctx.arc(ix,iy,16,0,Math.PI*2);ctx.stroke();}
    }
    ctx.textAlign='start';
  }

  function answer(yn){
    if(solved)return;
    const{intersects,desc}=CHALLENGES[qIdx];
    const correct=yn===intersects;moves++;document.getElementById('liq-moves').textContent=moves;
    renderSegs(true);
    if(correct){score++;setFeedback(`✅ Correct! ${desc}.`,'#00ffa3');}
    else{setFeedback(`❌ Wrong! ${desc}. They do${intersects?'':' NOT'} intersect.`,'#ff4757');}
    document.getElementById('liq-score').textContent=`${score}/${CHALLENGES.length}`;
    qIdx++;
    if(qIdx>=CHALLENGES.length){solved=true;timer&&timer.stop();setTimeout(()=>setFeedback(`🎉 Done! Score: ${score}/${CHALLENGES.length}. ${timer?timer.getTime():0}s`,'#00ffa3'),800);}
    else setTimeout(()=>{renderSegs();setFeedback('Do these two segments intersect?','#9090c0');},1000);
  }

  body.innerHTML=`
    <div class="quiz-instructions"><b>✂️ Line Intersection:</b> Decide if the two colored segments cross each other.<br>
    <b>Rule:</b> Two segments AB and CD intersect if C and D are on opposite sides of line AB, AND A and B are on opposite sides of CD.</div>
    <div class="quiz-stats"><div class="quiz-stat">Moves<span id="liq-moves">0</span></div><div class="quiz-stat">Time<span id="liq-time">0s</span></div><div class="quiz-stat">Score<span id="liq-score">0/${CHALLENGES.length}</span></div></div>
    <div class="quiz-canvas-wrap"><canvas id="liq-canvas" width="520" height="420" style="max-width:100%;"></canvas></div>
    <div style="display:flex;gap:12px;justify-content:center;">
      <button class="quiz-btn" style="flex:1;padding:16px;font-size:15px;color:#00ffa3;border-color:#00ffa3;" onclick="liqAnswer(true)">✅ YES — Intersect</button>
      <button class="quiz-btn" style="flex:1;padding:16px;font-size:15px;color:#ff4757;border-color:#ff4757;" onclick="liqAnswer(false)">❌ NO — Don't Cross</button>
    </div>
    <div class="quiz-feedback" id="liq-feedback">Do the two segments cross?</div>
    <div class="quiz-btn-row"><button class="quiz-btn" onclick="liqReset()">↺ Restart</button></div>`;

  timer=quizTimer('liq-time');
  window.liqAnswer=answer;
  window.liqReset=()=>{qIdx=0;score=0;moves=0;solved=false;if(timer)timer.stop();timer=quizTimer('liq-time');document.getElementById('liq-moves').textContent=0;document.getElementById('liq-score').textContent=`0/${CHALLENGES.length}`;renderSegs();setFeedback('Do the two segments cross?','#9090c0');};
  renderSegs();setFeedback('Do the two segments cross?','#9090c0');
}

function launchClosestPairQuiz() {
  const accent='#22d3ee';
  createQuizOverlay('Closest Pair — Find the Nearest Neighbors', accent);
  const body=document.getElementById('quiz-body');

  function genPts(n=8){return Array.from({length:n},()=>[60+Math.random()*400,60+Math.random()*340]);}
  function dist(a,b){return Math.hypot(a[0]-b[0],a[1]-b[1]);}
  function findClosest(pts){let best=Infinity,pair=[0,1];for(let i=0;i<pts.length;i++)for(let j=i+1;j<pts.length;j++){const d=dist(pts[i],pts[j]);if(d<best){best=d;pair=[i,j];}}return{d:best,pair};}

  let pts=genPts(),selected=new Set(),moves=0,timer=null,solved=false;
  let correct=findClosest(pts);

  function setFeedback(msg,color){const fb=document.getElementById('cpq-feedback');if(fb){fb.textContent=msg;fb.style.color=color||'#9090c0';}}

  function render(){
    const c=document.getElementById('cpq-canvas');if(!c)return;
    const W=c.width,H=c.height,ctx=c.getContext('2d');
    ctx.clearRect(0,0,W,H);ctx.fillStyle='#0a0a1a';ctx.fillRect(0,0,W,H);
    if(selected.size===2){const[a,b]=[...selected];ctx.strokeStyle=solved?'#00ffa3':'rgba(34,211,238,0.5)';ctx.lineWidth=2;ctx.setLineDash([4,4]);ctx.beginPath();ctx.moveTo(pts[a][0],pts[a][1]);ctx.lineTo(pts[b][0],pts[b][1]);ctx.stroke();ctx.setLineDash([]);}
    pts.forEach((p,i)=>{const isSel=selected.has(i);const r=isSel?12:7;ctx.fillStyle=solved?'rgba(0,255,163,0.2)':isSel?'rgba(34,211,238,0.3)':'rgba(255,255,255,0.05)';ctx.beginPath();ctx.arc(p[0],p[1],r,0,Math.PI*2);ctx.fill();ctx.strokeStyle=solved?'#00ffa3':isSel?accent:'rgba(255,255,255,0.2)';ctx.lineWidth=2;ctx.beginPath();ctx.arc(p[0],p[1],r,0,Math.PI*2);ctx.stroke();ctx.fillStyle=isSel?(solved?'#00ffa3':accent):'#5a7090';ctx.font='bold 10px Space Mono,monospace';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(i,p[0],p[1]);ctx.textBaseline='alphabetic';});
    ctx.textAlign='start';
  }

  function initGame(){pts=genPts();selected=new Set();moves=0;solved=false;correct=findClosest(pts);if(timer)timer.stop();timer=quizTimer('cpq-time');document.getElementById('cpq-moves').textContent=0;setFeedback('Click the TWO closest points!','#9090c0');render();}

  body.innerHTML=`
    <div class="quiz-instructions"><b>📍 Closest Pair:</b> Click the two points that are closest to each other.<br>
    <b>💡 Tip:</b> The divide-and-conquer algorithm finds this in O(n log n) — but for this small set, scan visually!</div>
    <div class="quiz-stats"><div class="quiz-stat">Moves<span id="cpq-moves">0</span></div><div class="quiz-stat">Time<span id="cpq-time">0s</span></div></div>
    <div class="quiz-canvas-wrap"><canvas id="cpq-canvas" width="520" height="420" style="cursor:pointer;max-width:100%;"></canvas></div>
    <div class="quiz-feedback" id="cpq-feedback">Click the two closest points!</div>
    <div class="quiz-btn-row"><button class="quiz-btn primary" onclick="cpqNew()">🔀 New Points</button><button class="quiz-btn" onclick="cpqReset()">↺ Restart</button><button class="quiz-btn quiz-hint-btn" onclick="cpqHint()">💡 Hint</button></div>`;

  timer=quizTimer('cpq-time');
  const cvs=document.getElementById('cpq-canvas');
  function handleClick(x,y){if(solved)return;const i=pts.findIndex(p=>Math.hypot(p[0]-x,p[1]-y)<16);if(i===-1)return;if(selected.has(i)){selected.delete(i);render();return;}selected.add(i);moves++;document.getElementById('cpq-moves').textContent=moves;render();if(selected.size===2){const[a,b]=[...selected];const userPair=[a,b].sort().join(','),correctPair=correct.pair.sort().join(',');if(userPair===correctPair){solved=true;timer&&timer.stop();setFeedback(`🎉 Correct! Points ${a} and ${b} are closest (dist=${correct.d.toFixed(1)}). ${timer?timer.getTime():0}s`,'#00ffa3');}else{setFeedback(`❌ Not the closest pair. Distance=${dist(pts[a],pts[b]).toFixed(1)} but min is ${correct.d.toFixed(1)}.`,'#ff4757');selected.clear();}render();}}
  cvs.addEventListener('click',e=>{const r=cvs.getBoundingClientRect();handleClick((e.clientX-r.left)*(cvs.width/r.width),(e.clientY-r.top)*(cvs.height/r.height));});
  cvs.addEventListener('touchstart',e=>{e.preventDefault();const r=cvs.getBoundingClientRect(),t=e.touches[0];handleClick((t.clientX-r.left)*(cvs.width/r.width),(t.clientY-r.top)*(cvs.height/r.height));},{passive:false});
  window.cpqNew=initGame;
  window.cpqReset=()=>{selected=new Set();moves=0;solved=false;if(timer)timer.stop();timer=quizTimer('cpq-time');document.getElementById('cpq-moves').textContent=0;setFeedback('Click the TWO closest points!','#9090c0');render();};
  window.cpqHint=()=>{const[a,b]=correct.pair;setFeedback(`💡 One of the closest pair is point ${a} or point ${b}.`,'#ffe040');};
  render();
}

function launchPolygonAreaQuiz() {
  const accent='#22d3ee';
  createQuizOverlay('Shoelace Formula — Estimate the Area', accent);
  const body=document.getElementById('quiz-body');

  // Polygons with known integer areas
  const CHALLENGES=[
    {pts:[[200,100],[380,200],[350,360],[150,360],[80,220]],area:75400,label:'Pentagon'},
    {pts:[[250,80],[420,200],[380,380],[120,380],[80,200]],area:97600,label:'Irregular pentagon'},
    {pts:[[200,80],[370,160],[420,300],[300,400],[150,400],[60,290],[80,160]],area:120000,label:'Heptagon'},
  ];
  let lvl=0,inputVal='',moves=0,timer=null,solved=false;

  function shoelace(pts){let s=0;for(let i=0;i<pts.length;i++){const j=(i+1)%pts.length;s+=pts[i][0]*pts[j][1]-pts[j][0]*pts[i][1];}return Math.abs(s)/2;}

  function setFeedback(msg,color){const fb=document.getElementById('paq-feedback');if(fb){fb.textContent=msg;fb.style.color=color||'#9090c0';}}

  function render(){
    const c=document.getElementById('paq-canvas');if(!c)return;
    const W=c.width,H=c.height,ctx=c.getContext('2d');
    ctx.clearRect(0,0,W,H);ctx.fillStyle='#0a0a1a';ctx.fillRect(0,0,W,H);
    const{pts}=CHALLENGES[lvl];
    ctx.fillStyle='rgba(34,211,238,0.06)';ctx.beginPath();pts.forEach((p,i)=>i===0?ctx.moveTo(p[0],p[1]):ctx.lineTo(p[0],p[1]));ctx.closePath();ctx.fill();
    ctx.strokeStyle=solved?'#00ffa3':accent;ctx.lineWidth=2;ctx.beginPath();pts.forEach((p,i)=>i===0?ctx.moveTo(p[0],p[1]):ctx.lineTo(p[0],p[1]));ctx.closePath();ctx.stroke();
    pts.forEach((p,i)=>{ctx.fillStyle=accent;ctx.beginPath();ctx.arc(p[0],p[1],5,0,Math.PI*2);ctx.fill();ctx.fillStyle='#3a5070';ctx.font='10px Space Mono,monospace';ctx.textAlign='center';ctx.fillText(`(${p[0]},${p[1]})`,p[0],p[1]-10);});
    ctx.textAlign='start';
  }

  function checkAnswer(){
    const{area}=CHALLENGES[lvl];const entered=parseInt(inputVal);
    if(isNaN(entered))return;
    const tol=area*0.1;
    if(Math.abs(entered-area)<=tol){
      solved=true;timer&&timer.stop();
      setFeedback(`🎉 Correct! Area ≈ ${Math.round(area)} sq units. ${moves} moves · ${timer?timer.getTime():0}s`,'#00ffa3');
    } else if(Math.abs(entered-area)<=area*0.25){
      setFeedback(`Close! Your answer: ${entered}, actual: ${Math.round(area)}. Off by ${Math.abs(entered-area).toFixed(0)}.`,'#f59e0b');
    } else {
      setFeedback(`❌ Not quite. You entered ${entered}, actual area ≈ ${Math.round(area)}.`,'#ff4757');
    }
  }

  function initLevel(){inputVal='';moves=0;solved=false;if(timer)timer.stop();timer=quizTimer('paq-time');document.getElementById('paq-moves').textContent=0;document.getElementById('paq-input').textContent='_';const{pts,label}=CHALLENGES[lvl];const exact=shoelace(pts);setFeedback(`Estimate the area of the ${label} using the shoelace formula!`,'#9090c0');render();}

  body.innerHTML=`
    <div class="quiz-instructions"><b>📐 Shoelace Formula:</b> Estimate the polygon area.<br>
    <b>Formula:</b> Area = ½|Σ(x_i·y_{i+1} - x_{i+1}·y_i)|<br>
    <b>How:</b> Enter your answer (within 10% is accepted). Use the numpad.</div>
    <div class="quiz-stats"><div class="quiz-stat">Moves<span id="paq-moves">0</span></div><div class="quiz-stat">Time<span id="paq-time">0s</span></div><div class="quiz-stat">Level<span id="paq-level">1/${CHALLENGES.length}</span></div></div>
    <div class="quiz-canvas-wrap"><canvas id="paq-canvas" width="520" height="420" style="max-width:100%;"></canvas></div>
    <div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap;background:#111128;border:1px solid #2a2a5a;border-radius:10px;padding:10px;">
      <div style="display:flex;align-items:center;gap:8px;width:100%;justify-content:center;">
        <span style="font-family:'Space Mono',monospace;font-size:12px;color:#5a7090;">Area ≈</span>
        <span id="paq-input" style="min-width:80px;padding:6px 14px;background:#0a1520;border:1px solid ${accent};border-radius:6px;font-family:'Space Mono',monospace;font-size:16px;color:${accent};text-align:center;">_</span>
        <button class="quiz-btn primary" style="padding:8px 16px;" onclick="paqSubmit()">✓ Submit</button>
      </div>
      <div style="display:flex;gap:5px;flex-wrap:wrap;justify-content:center;">
        ${[0,1,2,3,4,5,6,7,8,9].map(n=>`<button class="quiz-btn" style="flex:0 0 38px;padding:8px 0;" onclick="paqInput(${n})">${n}</button>`).join('')}
        <button class="quiz-btn" style="flex:0 0 44px;padding:8px 0;color:#ff4757;" onclick="paqInput(-1)">⌫</button>
      </div>
    </div>
    <div class="quiz-feedback" id="paq-feedback">Enter the area using the numpad!</div>
    <div class="quiz-btn-row"><button class="quiz-btn primary" onclick="paqNext()">Next Level ›</button><button class="quiz-btn" onclick="paqReset()">↺ Restart</button><button class="quiz-btn quiz-hint-btn" onclick="paqHint()">💡 Hint</button></div>`;

  timer=quizTimer('paq-time');
  window.paqInput=(n)=>{if(n===-1)inputVal=inputVal.slice(0,-1);else inputVal+=n;document.getElementById('paq-input').textContent=inputVal||'_';};
  window.paqSubmit=()=>{if(!inputVal)return;moves++;document.getElementById('paq-moves').textContent=moves;checkAnswer();};
  window.paqNext=()=>{lvl=Math.min(lvl+1,CHALLENGES.length-1);document.getElementById('paq-level').textContent=(lvl+1)+'/'+CHALLENGES.length;initLevel();};
  window.paqReset=()=>{lvl=0;document.getElementById('paq-level').textContent='1/'+CHALLENGES.length;initLevel();};
  window.paqHint=()=>{const{pts}=CHALLENGES[lvl];const area=shoelace(pts);setFeedback(`💡 Exact area = ${Math.round(area)} sq units. Use ½|Σ(x_i·y_{i+1} − x_{i+1}·y_i)|.`,'#ffe040');};
  const kh=e=>{if(!document.getElementById('paq-canvas')){document.removeEventListener('keydown',kh);return;}if(e.key>='0'&&e.key<='9'){e.preventDefault();window.paqInput(+e.key);}if(e.key==='Backspace'){e.preventDefault();window.paqInput(-1);}if(e.key==='Enter'){e.preventDefault();window.paqSubmit();}};
  document.addEventListener('keydown',kh);
  initLevel();
}

/* ════════════════════════════════════════════════════════
   BRANCH 13 — BIT MANIPULATION
   Subset: identify which elements are in a given bitmask
   XOR: predict the result of XOR operations
   Power of Two: check if a number is a power of 2
   Bitwise Sieve: identify primes up to N using a sieve
   ════════════════════════════════════════════════════════ */
function launchSubsetQuiz() {
  const accent='#e879f9';
  createQuizOverlay('Bitmask Subsets — Read the Mask', accent);
  const body=document.getElementById('quiz-body');

  const ELEMS=['A','B','C','D'];
  const N=4;
  let qMask=0, userSel=new Set(), moves=0, timer=null, solved=false;

  function newQuestion(){
    qMask=Math.floor(Math.random()*(1<<N));
    userSel=new Set(); solved=false;
    if(timer)timer.stop(); timer=quizTimer('sbq-time');
    document.getElementById('sbq-moves').textContent=0;
    renderQuestion();
    setFeedback(`Mask = ${qMask} (binary: ${qMask.toString(2).padStart(N,'0')}). Which elements are included?`,'#9090c0');
  }

  function setFeedback(msg,color){const fb=document.getElementById('sbq-feedback');if(fb){fb.textContent=msg;fb.style.color=color||'#9090c0';}}

  function renderQuestion(){
    const el=document.getElementById('sbq-grid');if(!el)return;
    const binary=qMask.toString(2).padStart(N,'0');
    el.innerHTML=`
      <div style="font-family:'Orbitron',monospace;font-size:28px;color:${accent};text-align:center;padding:12px;">${qMask}</div>
      <div style="font-family:'Space Mono',monospace;font-size:20px;color:#c0c0e0;text-align:center;letter-spacing:8px;padding:8px;">${binary}</div>
      <div style="display:flex;justify-content:center;gap:6px;margin:8px 0;">
        ${ELEMS.map((e,i)=>`<div style="width:44px;text-align:center;font-family:'Space Mono',monospace;font-size:10px;color:${binary[N-1-i]==='1'?accent:'#2a2a5a'};">bit ${i}</div>`).join('')}
      </div>
      <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-top:10px;">
        ${ELEMS.map((e,i)=>{const isSel=userSel.has(i);const isCorrect=!!(qMask>>i&1);const bg=isSel?'rgba(232,121,249,0.25)':'rgba(232,121,249,0.04)';const bc=isSel?accent:'#3a2a5a';return`<button onclick="sbqToggle(${i})" style="width:72px;height:72px;border-radius:12px;background:${bg};border:2px solid ${bc};font-family:'Orbitron',monospace;font-size:20px;font-weight:700;color:${isSel?accent:'#4a3a6a'};cursor:pointer;transition:all 0.15s;">${e}<br><span style="font-size:9px;font-family:'Space Mono',monospace;color:${isSel?accent:'#3a3a6a'};">${isSel?'✓':'○'}</span></button>`;}).join('')}
      </div>`;
  }

  window.sbqToggle=(i)=>{
    if(solved)return;
    if(userSel.has(i))userSel.delete(i);else{userSel.add(i);moves++;document.getElementById('sbq-moves').textContent=moves;}
    renderQuestion();
    // Check after each toggle if matches
    const expected=new Set(Array.from({length:N},(_,j)=>j).filter(j=>qMask>>j&1));
    const userSet=new Set([...userSel]);
    const correct=[...expected].every(j=>userSet.has(j))&&[...userSet].every(j=>expected.has(j));
    if(correct){solved=true;timer&&timer.stop();const names=[...expected].map(j=>ELEMS[j]).join(', ')||'∅';setFeedback(`🎉 Correct! Mask ${qMask} = {${names}}. ${moves} moves · ${timer?timer.getTime():0}s`,'#00ffa3');}
  };

  body.innerHTML=`
    <div class="quiz-instructions"><b>🎭 Bitmask Reading:</b> Given a mask number, click all elements that are <b>included</b> in the subset.<br>
    <b>Rule:</b> Bit i is set (1) → element i is included. e.g. mask=5 (binary 0101) → A and C.</div>
    <div class="quiz-stats"><div class="quiz-stat">Moves<span id="sbq-moves">0</span></div><div class="quiz-stat">Time<span id="sbq-time">0s</span></div></div>
    <div id="sbq-grid" style="background:#111128;border:1px solid #2a2a5a;border-radius:12px;padding:16px;"></div>
    <div class="quiz-feedback" id="sbq-feedback">Click the elements included in the mask!</div>
    <div class="quiz-btn-row"><button class="quiz-btn primary" onclick="sbqNew()">🔀 New Mask</button><button class="quiz-btn quiz-hint-btn" onclick="sbqHint()">💡 Hint</button></div>`;
  timer=quizTimer('sbq-time');
  window.sbqNew=newQuestion;
  window.sbqHint=()=>{const included=ELEMS.filter((_,i)=>qMask>>i&1).join(', ')||'none';setFeedback(`💡 Mask ${qMask} = binary ${qMask.toString(2).padStart(N,'0')} → includes: {${included}}`,'#ffe040');};
  newQuestion();
}

function launchXORQuiz() {
  const accent='#e879f9';
  createQuizOverlay('XOR Tricks — Predict the Result', accent);
  const body=document.getElementById('quiz-body');

  const CHALLENGES=[
    {type:'xor',a:5,b:3,q:'5 XOR 3 = ?',ans:5^3},
    {type:'xor',a:12,b:10,q:'12 XOR 10 = ?',ans:12^10},
    {type:'missing',arr:[1,2,3,4,6],n:6,q:'Array [1,2,3,4,6] contains all 1–6 except one. XOR trick: find the missing number!',ans:5},
    {type:'single',arr:[2,3,4,3,2],q:'Array [2,3,4,3,2] — all duplicate except one. XOR all to find the lone element!',ans:4},
    {type:'swap',a:7,b:13,q:'After XOR swap of a=7 and b=13 (a^=b;b^=a;a^=b), what is a?',ans:13},
    {type:'xor',a:255,b:170,q:'255 XOR 170 = ?',ans:255^170},
  ];
  let qIdx=0,score=0,inputVal='',moves=0,timer=null,solved=false;

  function setFeedback(msg,color){const fb=document.getElementById('xq-feedback');if(fb){fb.textContent=msg;fb.style.color=color||'#9090c0';}}

  function renderQ(){
    const q=CHALLENGES[qIdx];
    document.getElementById('xq-question').innerHTML=`
      <div style="font-family:'Space Mono',monospace;font-size:13px;color:#c0c0e0;line-height:1.7;">${q.q}</div>
      ${q.type!=='xor'?`<div style="font-family:'Space Mono',monospace;font-size:10px;color:#5a7090;margin-top:8px;">Hint: XOR(all 1..${q.n||'n'}) XOR XOR(all array elements) = missing element</div>`:''}
      <div style="font-family:'Space Mono',monospace;font-size:10px;color:#3a5070;margin-top:6px;">Question ${qIdx+1}/${CHALLENGES.length}</div>`;
  }

  function submitAns(){
    if(!inputVal||solved)return;
    const q=CHALLENGES[qIdx];const entered=parseInt(inputVal);moves++;document.getElementById('xq-moves').textContent=moves;
    if(entered===q.ans){score++;setFeedback(`✅ Correct! Answer = ${q.ans}.`,'#00ffa3');}
    else setFeedback(`❌ Wrong. Answer was ${q.ans}. (${q.ans.toString(2)} in binary)`,'#ff4757');
    document.getElementById('xq-score').textContent=`${score}/${CHALLENGES.length}`;
    inputVal='';document.getElementById('xq-input').textContent='_';
    qIdx++;
    if(qIdx>=CHALLENGES.length){solved=true;timer&&timer.stop();setTimeout(()=>setFeedback(`🎉 Done! Score: ${score}/${CHALLENGES.length}. ${timer?timer.getTime():0}s`,'#00ffa3'),600);}
    else setTimeout(()=>renderQ(),600);
  }

  body.innerHTML=`
    <div class="quiz-instructions"><b>⊕ XOR Tricks:</b> Answer each XOR-based puzzle.<br>
    <b>Key properties:</b> A⊕A=0, A⊕0=A, commutative & associative.<br>
    <b>How:</b> Enter your numeric answer using the numpad.</div>
    <div class="quiz-stats"><div class="quiz-stat">Moves<span id="xq-moves">0</span></div><div class="quiz-stat">Time<span id="xq-time">0s</span></div><div class="quiz-stat">Score<span id="xq-score">0/${CHALLENGES.length}</span></div></div>
    <div id="xq-question" style="background:#111128;border:1px solid #2a2a5a;border-radius:12px;padding:16px;"></div>
    <div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap;background:#111128;border:1px solid #2a2a5a;border-radius:10px;padding:10px;">
      <div style="display:flex;align-items:center;gap:8px;width:100%;justify-content:center;">
        <span style="font-family:'Space Mono',monospace;font-size:12px;color:#5a7090;">Answer:</span>
        <span id="xq-input" style="min-width:70px;padding:6px 14px;background:#0a1520;border:1px solid ${accent};border-radius:6px;font-family:'Space Mono',monospace;font-size:16px;color:${accent};text-align:center;">_</span>
        <button class="quiz-btn primary" style="padding:8px 16px;" onclick="xqSubmit()">✓ Submit</button>
      </div>
      <div style="display:flex;gap:5px;flex-wrap:wrap;justify-content:center;">
        ${[0,1,2,3,4,5,6,7,8,9].map(n=>`<button class="quiz-btn" style="flex:0 0 38px;padding:8px 0;" onclick="xqInput(${n})">${n}</button>`).join('')}
        <button class="quiz-btn" style="flex:0 0 44px;padding:8px 0;color:#ff4757;" onclick="xqInput(-1)">⌫</button>
      </div>
    </div>
    <div class="quiz-feedback" id="xq-feedback">Enter your answer!</div>
    <div class="quiz-btn-row"><button class="quiz-btn" onclick="xqReset()">↺ Restart</button><button class="quiz-btn quiz-hint-btn" onclick="xqHint()">💡 Hint</button></div>`;

  timer=quizTimer('xq-time');
  window.xqInput=(n)=>{if(n===-1)inputVal=inputVal.slice(0,-1);else inputVal+=n;document.getElementById('xq-input').textContent=inputVal||'_';};
  window.xqSubmit=submitAns;
  window.xqReset=()=>{qIdx=0;score=0;inputVal='';moves=0;solved=false;if(timer)timer.stop();timer=quizTimer('xq-time');document.getElementById('xq-moves').textContent=0;document.getElementById('xq-score').textContent=`0/${CHALLENGES.length}`;document.getElementById('xq-input').textContent='_';renderQ();setFeedback('Enter your answer!','#9090c0');};
  window.xqHint=()=>{const q=CHALLENGES[qIdx];if(q){const hint={xor:`${q.a} = ${q.a.toString(2)}, ${q.b} = ${q.b.toString(2)}. XOR bit by bit.`,missing:`XOR all 1..${q.n} = ${Array.from({length:q.n},(_,i)=>i+1).reduce((a,b)=>a^b)}. XOR array = ${q.arr.reduce((a,b)=>a^b)}. Result = ?`,single:`XOR all elements: ${q.arr.reduce((a,b)=>a^b)} (pairs cancel out).`,swap:`After swap: a gets b's original value = ${q.b}.`}[q.type];setFeedback(`💡 ${hint||'Think step by step!'}`,'#ffe040');}};
  const kh=e=>{if(!document.getElementById('xq-question')){document.removeEventListener('keydown',kh);return;}if(e.key>='0'&&e.key<='9'){e.preventDefault();window.xqInput(+e.key);}if(e.key==='Backspace'){e.preventDefault();window.xqInput(-1);}if(e.key==='Enter'){e.preventDefault();window.xqSubmit();}};
  document.addEventListener('keydown',kh);
  renderQ();
}

function launchPowerOfTwoQuiz() {
  const accent='#e879f9';
  createQuizOverlay('Power of Two — True or False?', accent);
  const body=document.getElementById('quiz-body');

  // Mix of powers of 2 and non-powers
  const NUMS=[1,2,4,6,8,12,16,24,32,48,64,100,128,200,256,300,512,1000,1024,2000];
  let qIdx=0,score=0,moves=0,timer=null,solved=false;
  const ORDER=[...NUMS].sort(()=>Math.random()-0.5);

  function setFeedback(msg,color){const fb=document.getElementById('p2q-feedback');if(fb){fb.textContent=msg;fb.style.color=color||'#9090c0';}}
  function isPow2(n){return n>0&&(n&(n-1))===0;}

  function renderQ(){
    const n=ORDER[qIdx];
    document.getElementById('p2q-number').innerHTML=`
      <div style="font-family:'Orbitron',monospace;font-size:48px;font-weight:700;color:${accent};text-align:center;padding:20px;">${n}</div>
      <div style="font-family:'Space Mono',monospace;font-size:13px;color:#3a5070;text-align:center;">binary: ${n.toString(2)}</div>
      <div style="font-family:'Space Mono',monospace;font-size:11px;color:#2a4060;text-align:center;margin-top:4px;">${n} & (${n}-1) = ${n&(n-1)}</div>
      <div style="font-family:'Space Mono',monospace;font-size:10px;color:#2a3050;text-align:center;margin-top:4px;">Question ${qIdx+1}/${ORDER.length}</div>`;
  }

  function answer(yn){
    if(solved)return;
    const n=ORDER[qIdx],correct=isPow2(n);
    const rightAnswer=yn===correct;moves++;document.getElementById('p2q-moves').textContent=moves;
    if(rightAnswer){score++;setFeedback(`✅ Correct! ${n} is${correct?'':' NOT'} a power of 2. (n&(n-1)=${n&(n-1)})`,'#00ffa3');}
    else setFeedback(`❌ Wrong! ${n} is${correct?'':' NOT'} a power of 2. Trick: n&(n-1)=${n&(n-1)}.`,'#ff4757');
    document.getElementById('p2q-score').textContent=`${score}/${ORDER.length}`;
    qIdx++;
    if(qIdx>=ORDER.length){solved=true;timer&&timer.stop();setTimeout(()=>setFeedback(`🎉 Done! Score: ${score}/${ORDER.length}. ${timer?timer.getTime():0}s`,'#00ffa3'),600);}
    else setTimeout(()=>renderQ(),700);
  }

  body.innerHTML=`
    <div class="quiz-instructions"><b>2️⃣ Power of Two Check:</b> Is the number a power of 2?<br>
    <b>Bitwise trick:</b> <code style="color:${accent};">n & (n-1) == 0</code> means YES (only one bit set).<br>
    <b>Binary hint:</b> shown below each number.</div>
    <div class="quiz-stats"><div class="quiz-stat">Moves<span id="p2q-moves">0</span></div><div class="quiz-stat">Time<span id="p2q-time">0s</span></div><div class="quiz-stat">Score<span id="p2q-score">0/${ORDER.length}</span></div></div>
    <div id="p2q-number" style="background:#111128;border:1px solid #2a2a5a;border-radius:12px;padding:12px;"></div>
    <div style="display:flex;gap:12px;justify-content:center;">
      <button class="quiz-btn" style="flex:1;padding:16px;font-size:16px;color:#00ffa3;border-color:#00ffa3;" onclick="p2qAnswer(true)">✅ YES — Power of 2</button>
      <button class="quiz-btn" style="flex:1;padding:16px;font-size:16px;color:#ff4757;border-color:#ff4757;" onclick="p2qAnswer(false)">❌ NO — Not Power of 2</button>
    </div>
    <div class="quiz-feedback" id="p2q-feedback">Is it a power of 2?</div>
    <div class="quiz-btn-row"><button class="quiz-btn" onclick="p2qReset()">↺ Restart</button><button class="quiz-btn quiz-hint-btn" onclick="p2qHint()">💡 Hint</button></div>`;

  timer=quizTimer('p2q-time');
  window.p2qAnswer=answer;
  window.p2qReset=()=>{qIdx=0;score=0;moves=0;solved=false;ORDER.sort(()=>Math.random()-0.5);if(timer)timer.stop();timer=quizTimer('p2q-time');document.getElementById('p2q-moves').textContent=0;document.getElementById('p2q-score').textContent=`0/${ORDER.length}`;renderQ();setFeedback('Is it a power of 2?','#9090c0');};
  window.p2qHint=()=>{if(qIdx<ORDER.length){const n=ORDER[qIdx];setFeedback(`💡 ${n} in binary = ${n.toString(2)}. Powers of 2 have exactly ONE bit set. ${n} has ${n.toString(2).split('1').length-1} bit(s) set.`,'#ffe040');}};
  renderQ();setFeedback('Is it a power of 2?','#9090c0');
}

function launchSieveQuiz() {
  const accent='#e879f9';
  createQuizOverlay('Bitwise Sieve — Mark the Primes', accent);
  const body=document.getElementById('quiz-body');

  const LIMIT=30;
  // Correct primes up to 30
  function sieve(n){const b=Array(n+1).fill(true);b[0]=b[1]=false;for(let i=2;i*i<=n;i++)if(b[i])for(let j=i*i;j<=n;j+=i)b[j]=false;return b;}
  const isPrime=sieve(LIMIT);
  const PRIMES=Array.from({length:LIMIT-1},(_,i)=>i+2).filter(n=>isPrime[n]);

  let selected=new Set(),moves=0,timer=null,solved=false;

  function setFeedback(msg,color){const fb=document.getElementById('svq-feedback');if(fb){fb.textContent=msg;fb.style.color=color||'#9090c0';}}

  function checkSolved(){
    if(PRIMES.every(p=>selected.has(p))&&[...selected].every(p=>isPrime[p])){
      solved=true;timer&&timer.stop();
      setFeedback(`🎉 All ${PRIMES.length} primes marked correctly! Primes: [${PRIMES.join(', ')}]. ${timer?timer.getTime():0}s`,'#00ffa3');
    }
  }

  function renderGrid(){
    const el=document.getElementById('svq-grid');if(!el)return;
    const nums=Array.from({length:LIMIT-1},(_,i)=>i+2);
    el.innerHTML=`<div style="display:flex;flex-wrap:wrap;gap:6px;justify-content:center;">
      ${nums.map(n=>{
        const isSel=selected.has(n),isP=isPrime[n];
        const correct=isSel&&isP,wrong=isSel&&!isP;
        const bg=solved?'rgba(0,255,163,0.2)':wrong?'rgba(255,71,87,0.25)':isSel?'rgba(232,121,249,0.25)':'rgba(232,121,249,0.04)';
        const bc=solved?'#00ffa3':wrong?'#ff4757':isSel?accent:'#3a2a5a';
        return`<button onclick="svqToggle(${n})" style="width:44px;height:44px;border-radius:8px;background:${bg};border:2px solid ${bc};font-family:'Space Mono',monospace;font-size:14px;font-weight:700;color:${solved?'#00ffa3':wrong?'#ff4757':isSel?accent:'#4a3a6a'};cursor:pointer;transition:all 0.15s;">${n}</button>`;
      }).join('')}
    </div>`;
  }

  window.svqToggle=(n)=>{
    if(solved)return;
    if(selected.has(n))selected.delete(n);else{selected.add(n);moves++;document.getElementById('svq-moves').textContent=moves;}
    renderGrid();
    if(selected.has(n)){if(isPrime[n])setFeedback(`✅ ${n} is prime!`,'#00ffa3');else setFeedback(`❌ ${n} is NOT prime (divisible by ${[2,3,5,7,11,13].find(p=>n%p===0&&p!==n)||'?'}).`,'#ff4757');}
    checkSolved();
  };

  body.innerHTML=`
    <div class="quiz-instructions"><b>🔢 Bitwise Sieve:</b> Click all prime numbers from 2 to ${LIMIT}.<br>
    <b>Sieve of Eratosthenes:</b> Mark 2, then cross out multiples; repeat for each unmarked number.<br>
    <b>Bitwise twist:</b> Each number stored as 1 bit — 8× memory savings over bool arrays!</div>
    <div class="quiz-stats"><div class="quiz-stat">Moves<span id="svq-moves">0</span></div><div class="quiz-stat">Time<span id="svq-time">0s</span></div><div class="quiz-stat">Found<span id="svq-found">0/${PRIMES.length}</span></div></div>
    <div id="svq-grid" style="background:#111128;border:1px solid #2a2a5a;border-radius:12px;padding:16px;"></div>
    <div class="quiz-feedback" id="svq-feedback">Click all prime numbers from 2 to ${LIMIT}!</div>
    <div class="quiz-btn-row"><button class="quiz-btn" onclick="svqReset()">↺ Restart</button><button class="quiz-btn quiz-hint-btn" onclick="svqHint()">💡 Hint</button></div>`;

  timer=quizTimer('svq-time');
  window.svqReset=()=>{selected=new Set();moves=0;solved=false;if(timer)timer.stop();timer=quizTimer('svq-time');document.getElementById('svq-moves').textContent=0;document.getElementById('svq-found').textContent=`0/${PRIMES.length}`;renderGrid();setFeedback(`Mark all primes from 2 to ${LIMIT}!`,'#9090c0');};
  window.svqHint=()=>{const missing=PRIMES.find(p=>!selected.has(p));if(missing)setFeedback(`💡 ${missing} is prime — you haven't marked it yet.`,'#ffe040');};
  // Update found count on every toggle
  const orig=window.svqToggle;
  window.svqToggle=(n)=>{orig(n);document.getElementById('svq-found').textContent=`${[...selected].filter(x=>isPrime[x]).length}/${PRIMES.length}`;};
  renderGrid();setFeedback(`Click all prime numbers from 2 to ${LIMIT}!`,'#9090c0');
}

/* ════════════════════════════════════════════════════════
   BRANCH 14 — BINARY ARITHMETIC
   Shared quiz: fill in the result of a binary arithmetic operation
   (add/sub/mul/div) — enter the binary result
   ════════════════════════════════════════════════════════ */
function launchBinaryArithQuiz(op) {
  const opLabels={add:'Binary Addition',sub:'Binary Subtraction',mul:"Booth's Multiplication",div:'Restoring Division'};
  const accent='#34d399';
  createQuizOverlay(`${opLabels[op]} — Fill the Result`, accent);
  const body=document.getElementById('quiz-body');

  function padBin(n,bits){return(n>>>0).toString(2).padStart(bits,'0');}

  // Generate question pairs
  function genQs(op){
    const qs=[];
    if(op==='add'){[[12,9],[45,27],[63,18],[100,28],[85,43]].forEach(([a,b])=>qs.push({a,b,ans:a+b,desc:`${a} + ${b}`,bDesc:`${padBin(a,8)} + ${padBin(b,8)}`}));}
    else if(op==='sub'){[[15,6],[42,17],[63,28],[100,37],[80,33]].forEach(([a,b])=>qs.push({a,b,ans:a-b,desc:`${a} − ${b}`,bDesc:`${padBin(a,8)} − ${padBin(b,8)} (2's complement)`}));}
    else if(op==='mul'){[[3,5],[4,6],[5,7],[6,4],[8,3]].forEach(([a,b])=>qs.push({a,b,ans:a*b,desc:`${a} × ${b}`,bDesc:`Booth's: ${padBin(a,4)} × ${padBin(b,4)}`}));}
    else{[[12,3],[15,4],[24,6],[20,5],[18,3]].forEach(([a,b])=>qs.push({a,b,ans:Math.floor(a/b),desc:`${a} ÷ ${b} (quotient)`,bDesc:`${padBin(a,8)} ÷ ${padBin(b,8)}`}));}
    return qs;
  }

  const QS=genQs(op);
  let qIdx=0,inputVal='',score=0,moves=0,timer=null,solved=false;

  function setFeedback(msg,color){const fb=document.getElementById('baq-feedback');if(fb){fb.textContent=msg;fb.style.color=color||'#9090c0';}}

  function renderQ(){
    const q=QS[qIdx];
    document.getElementById('baq-question').innerHTML=`
      <div style="font-family:'Space Mono',monospace;font-size:13px;color:#3a5070;margin-bottom:6px;">${q.bDesc}</div>
      <div style="font-family:'Orbitron',monospace;font-size:20px;color:#fff;text-align:center;padding:14px;background:rgba(52,211,153,0.06);border:1px solid rgba(52,211,153,0.2);border-radius:10px;">${q.desc} = ?</div>
      <div style="font-family:'Space Mono',monospace;font-size:10px;color:#2a4060;margin-top:8px;text-align:center;">Q ${qIdx+1}/${QS.length} — Enter the decimal result</div>`;
  }

  function submit(){
    if(!inputVal||solved)return;
    const q=QS[qIdx];const entered=parseInt(inputVal);moves++;document.getElementById('baq-moves').textContent=moves;
    if(entered===q.ans){score++;setFeedback(`✅ Correct! ${q.desc} = ${q.ans} (binary: ${padBin(q.ans,8)}).`,'#00ffa3');}
    else setFeedback(`❌ Wrong. ${q.desc} = ${q.ans}, not ${entered}. Binary: ${padBin(q.ans,8)}.`,'#ff4757');
    document.getElementById('baq-score').textContent=`${score}/${QS.length}`;
    inputVal='';document.getElementById('baq-input').textContent='_';
    qIdx++;
    if(qIdx>=QS.length){solved=true;timer&&timer.stop();setTimeout(()=>setFeedback(`🎉 Done! Score: ${score}/${QS.length}. ${timer?timer.getTime():0}s`,'#00ffa3'),600);}
    else setTimeout(()=>renderQ(),600);
  }

  body.innerHTML=`
    <div class="quiz-instructions"><b>💻 ${opLabels[op]}:</b> Solve binary arithmetic problems.<br>
    <b>How:</b> Enter the <b>decimal result</b> of each operation using the numpad.<br>
    ${op==='mul'?`<b>Booth's:</b> Encodes runs of 1s to minimize partial products.`:op==='div'?`<b>Restoring:</b> Shift-and-subtract in binary, restoring remainder if negative.`:`<b>Remember:</b> ${op==='add'?'Carry propagates left.':'2\'s complement: flip bits + 1 = subtract.'}`}
    </div>
    <div class="quiz-stats"><div class="quiz-stat">Moves<span id="baq-moves">0</span></div><div class="quiz-stat">Time<span id="baq-time">0s</span></div><div class="quiz-stat">Score<span id="baq-score">0/${QS.length}</span></div></div>
    <div id="baq-question" style="background:#111128;border:1px solid #2a2a5a;border-radius:12px;padding:16px;"></div>
    <div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap;background:#111128;border:1px solid #2a2a5a;border-radius:10px;padding:10px;">
      <div style="display:flex;align-items:center;gap:8px;width:100%;justify-content:center;">
        <span id="baq-input" style="min-width:70px;padding:6px 14px;background:#0a1520;border:1px solid ${accent};border-radius:6px;font-family:'Space Mono',monospace;font-size:16px;color:${accent};text-align:center;">_</span>
        <button class="quiz-btn primary" style="padding:8px 16px;" onclick="baqSubmit()">✓ Submit</button>
      </div>
      <div style="display:flex;gap:5px;flex-wrap:wrap;justify-content:center;">
        ${[0,1,2,3,4,5,6,7,8,9].map(n=>`<button class="quiz-btn" style="flex:0 0 38px;padding:8px 0;" onclick="baqInput(${n})">${n}</button>`).join('')}
        <button class="quiz-btn" style="flex:0 0 44px;padding:8px 0;color:#ff4757;" onclick="baqInput(-1)">⌫</button>
      </div>
    </div>
    <div class="quiz-feedback" id="baq-feedback">Enter the decimal result!</div>
    <div class="quiz-btn-row"><button class="quiz-btn" onclick="baqReset()">↺ Restart</button><button class="quiz-btn quiz-hint-btn" onclick="baqHint()">💡 Hint</button></div>`;

  timer=quizTimer('baq-time');
  window.baqInput=(n)=>{if(n===-1)inputVal=inputVal.slice(0,-1);else inputVal+=n;document.getElementById('baq-input').textContent=inputVal||'_';};
  window.baqSubmit=submit;
  window.baqReset=()=>{qIdx=0;score=0;inputVal='';moves=0;solved=false;if(timer)timer.stop();timer=quizTimer('baq-time');document.getElementById('baq-moves').textContent=0;document.getElementById('baq-score').textContent=`0/${QS.length}`;document.getElementById('baq-input').textContent='_';renderQ();setFeedback('Enter the decimal result!','#9090c0');};
  window.baqHint=()=>{if(qIdx<QS.length){const q=QS[qIdx];setFeedback(`💡 ${q.desc} = ${q.ans} (binary: ${padBin(q.ans,8)})`,'#ffe040');}};
  const kh=e=>{if(!document.getElementById('baq-question')){document.removeEventListener('keydown',kh);return;}if(e.key>='0'&&e.key<='9'){e.preventDefault();window.baqInput(+e.key);}if(e.key==='Backspace'){e.preventDefault();window.baqInput(-1);}if(e.key==='Enter'){e.preventDefault();window.baqSubmit();}};
  document.addEventListener('keydown',kh);
  renderQ();setFeedback('Enter the decimal result!','#9090c0');
}



// ══════════════════════════════════════════════════════════
//  PLAYGROUND HUB
// ══════════════════════════════════════════════════════════

let playgroundOverlay = null;

function closePlayground() {
  if (playgroundOverlay) { playgroundOverlay.remove(); playgroundOverlay = null; }
}

function createPlaygroundOverlay(title, accentColor) {
  if (playgroundOverlay) playgroundOverlay.remove();
  const ov = document.createElement('div');
  ov.id = 'playground-overlay';
  ov.style.cssText = `position:fixed;inset:0;z-index:2000;background:rgba(4,4,16,0.97);display:flex;flex-direction:column;align-items:center;justify-content:flex-start;overflow-y:auto;padding:20px 16px 48px;animation:pgFadeIn 0.3s ease;`;
  ov.innerHTML = `<style>
    @keyframes pgFadeIn{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:none}}
    @keyframes pgBounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
    @keyframes pgGlow{0%,100%{box-shadow:0 0 10px ${accentColor}44}50%{box-shadow:0 0 35px ${accentColor}99}}
    @keyframes pgCorrect{0%{background:rgba(0,255,163,0.0)}50%{background:rgba(0,255,163,0.25)}100%{background:rgba(0,255,163,0.0)}}
    @keyframes pgWrong{0%,100%{transform:translateX(0)}20%,60%{transform:translateX(-8px)}40%,80%{transform:translateX(8px)}}
    .pg-close{background:none;border:1px solid #2a2a5a;color:#6060a0;padding:7px 16px;border-radius:8px;font-family:'Space Mono',monospace;font-size:11px;cursor:pointer;margin-left:auto;transition:all 0.2s;}
    .pg-close:hover{border-color:#ff4757;color:#ff4757;}
    .pg-back{background:none;border:1px solid #2a2a5a;color:#6060a0;padding:7px 14px;border-radius:8px;font-family:'Space Mono',monospace;font-size:11px;cursor:pointer;transition:all 0.2s;align-self:flex-start;}
    .pg-back:hover{border-color:${accentColor};color:${accentColor};}
    .pg-body{width:100%;max-width:900px;display:flex;flex-direction:column;gap:16px;}
    .pg-hub{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;width:100%;}
    @media(max-width:700px){.pg-hub{grid-template-columns:1fr;}}
    .pg-hub-card{border-radius:20px;padding:28px 22px;cursor:pointer;transition:all 0.3s;display:flex;flex-direction:column;gap:14px;border:1.5px solid transparent;}
    .pg-hub-card:hover{transform:translateY(-4px);}
    .pg-hub-card-emoji{font-size:42px;line-height:1;animation:pgBounce 2s ease-in-out infinite;}
    .pg-hub-card-title{font-family:'Orbitron',monospace;font-size:14px;font-weight:700;letter-spacing:0.06em;}
    .pg-hub-card-desc{font-family:'Space Mono',monospace;font-size:11px;line-height:1.7;opacity:0.8;}
    .pg-hub-card-badge{font-family:'Space Mono',monospace;font-size:9px;padding:3px 10px;border-radius:20px;display:inline-block;font-weight:700;letter-spacing:0.1em;}
    .pg-quiz-q{background:#0d0d28;border:1px solid #2a2a5a;border-radius:14px;padding:20px 22px;font-family:'Space Mono',monospace;font-size:13px;line-height:1.7;color:#c8c8ff;}
    .pg-quiz-type{font-size:9px;letter-spacing:0.15em;margin-bottom:10px;display:inline-block;padding:3px 10px;border-radius:20px;font-weight:700;}
    .pg-choices{display:grid;grid-template-columns:1fr 1fr;gap:10px;}
    @media(max-width:500px){.pg-choices{grid-template-columns:1fr;}}
    .pg-choice{background:#0d0d28;border:1px solid #2a2a5a;border-radius:10px;padding:13px 16px;color:#c8c8ff;font-family:'Space Mono',monospace;font-size:12px;cursor:pointer;transition:all 0.2s;text-align:left;width:100%;}
    .pg-choice:hover:not(:disabled){transform:translateX(3px);border-color:${accentColor}66;}
    .pg-choice.correct{background:rgba(0,255,163,0.15)!important;border-color:#00ffa3!important;color:#00ffa3!important;animation:pgCorrect 0.6s ease;}
    .pg-choice.wrong{background:rgba(255,71,87,0.15)!important;border-color:#ff4757!important;color:#ff4757!important;animation:pgWrong 0.4s ease;}
    .pg-fill-input{background:#0d0d28;border:1px solid #2a2a5a;border-radius:10px;padding:13px 16px;color:#c8c8ff;font-family:'Space Mono',monospace;font-size:13px;width:100%;outline:none;transition:border-color 0.2s;box-sizing:border-box;}
    .pg-fill-input:focus{border-color:${accentColor};}
    .pg-progress-bar{height:4px;background:#1a1a3a;border-radius:4px;overflow:hidden;margin-bottom:4px;}
    .pg-progress-fill{height:100%;border-radius:4px;transition:width 0.4s ease;background:linear-gradient(90deg,${accentColor},#bf5fff);}
    .pg-feedback-badge{border-radius:12px;padding:12px 18px;font-family:'Space Mono',monospace;font-size:13px;text-align:center;transition:all 0.3s;}
    .pg-game-canvas-wrap{background:#060618;border:1.5px solid #2a2a5a;border-radius:16px;overflow:hidden;display:flex;align-items:center;justify-content:center;padding:12px;position:relative;}
    .pg-game-btn{flex:1;padding:11px 16px;border-radius:10px;border:1px solid #2a2a5a;background:#0d0d28;color:#9090c0;font-family:'Space Mono',monospace;font-size:12px;cursor:pointer;transition:all 0.2s;min-width:90px;}
    .pg-game-btn:hover{border-color:${accentColor};color:${accentColor};}
    .pg-game-btn.primary{background:${accentColor};color:#040412;border-color:${accentColor};font-weight:700;}
    .pg-game-btn.primary:hover{background:transparent;color:${accentColor};}
    .pg-game-stat{background:#0d0d28;border:1px solid #2a2a5a;border-radius:8px;padding:8px 14px;font-family:'Space Mono',monospace;font-size:11px;color:#5050a0;flex:1;text-align:center;min-width:70px;}
    .pg-game-stat span{display:block;font-size:17px;font-weight:700;line-height:1.3;}
    .pg-problem-card{background:#0d0d28;border:1px solid #2a2a5a;border-radius:14px;padding:20px 22px;}
    .pg-problem-body{font-family:'Space Mono',monospace;font-size:12px;line-height:1.8;color:#9090c0;margin-bottom:14px;}
    .pg-problem-example{background:#060618;border-left:3px solid;border-radius:0 8px 8px 0;padding:10px 14px;margin:10px 0;font-family:'Space Mono',monospace;font-size:11px;line-height:1.7;}
    .pg-code-area{background:#060618;border:1px solid #2a2a5a;border-radius:10px;padding:14px 16px;font-family:'Space Mono',monospace;font-size:12px;color:#c8c8ff;width:100%;min-height:180px;outline:none;resize:vertical;line-height:1.6;transition:border-color 0.2s;box-sizing:border-box;}
    .pg-code-area:focus{border-color:${accentColor};}
    .pg-run-result{background:#060618;border:1px solid #2a2a5a;border-radius:10px;padding:12px 16px;font-family:'Space Mono',monospace;font-size:12px;line-height:1.6;min-height:44px;color:#9090c0;transition:all 0.3s;white-space:pre-wrap;}
    .pg-run-result.pass{border-color:#00ffa3;color:#00ffa3;}
    .pg-run-result.fail{border-color:#ff4757;color:#ff8a8a;}
  </style>
  <div style="width:100%;max-width:900px;display:flex;align-items:center;gap:14px;margin-bottom:22px;flex-shrink:0;">
    <div>
      <div style="font-family:'Orbitron',monospace;font-size:20px;font-weight:900;color:${accentColor};text-shadow:0 0 30px ${accentColor}66;letter-spacing:0.08em;" id="pg-main-title">🚀 PLAYGROUNDS</div>
      <div style="font-family:'Space Mono',monospace;font-size:10px;color:#5050a0;letter-spacing:0.12em;" id="pg-main-sub">CHOOSE YOUR MODE</div>
    </div>
    <button class="pg-close" onclick="closePlayground()">✕ EXIT</button>
  </div>
  <div class="pg-body" id="pg-body"></div>`;
  document.body.appendChild(ov);
  playgroundOverlay = ov;
  return ov;
}

function launchPlaygroundHub() {
  const expMeta = EXPERIMENTS.find(e => e.id === currentExp) || {};
  const accent = expMeta.accentColor || '#bf5fff';
  createPlaygroundOverlay(expMeta.title || 'Experiment', accent);
  showPlaygroundHub(accent, expMeta);
}

function showPlaygroundHub(accent, expMeta) {
  const body = document.getElementById('pg-body');
  const titleEl = document.getElementById('pg-main-title');
  const subEl = document.getElementById('pg-main-sub');
  if(titleEl) titleEl.innerHTML = '🚀 PLAYGROUNDS';
  if(subEl) subEl.textContent = (expMeta.title||'').toUpperCase() + ' — CHOOSE YOUR MODE';
  body.innerHTML = `
    <div style="text-align:center;padding:8px 0 24px;font-family:'Space Mono',monospace;font-size:12px;color:#5050a0;line-height:1.7;">
      Three ways to master <span style="color:${accent};font-weight:700;">${expMeta.title||currentExp}</span>.<br>
      Pick your challenge — quiz your knowledge, play the concept, or solve real problems.
    </div>
    <div class="pg-hub">
      <div class="pg-hub-card" style="background:linear-gradient(145deg,rgba(0,229,255,0.08),rgba(0,100,150,0.05));border-color:rgba(0,229,255,0.25);"
        onmouseover="this.style.borderColor='rgba(0,229,255,0.6)';this.style.boxShadow='0 0 30px rgba(0,229,255,0.15)'"
        onmouseout="this.style.borderColor='rgba(0,229,255,0.25)';this.style.boxShadow='none'"
        onclick="launchQuizPlayground()">
        <div class="pg-hub-card-emoji" style="animation-delay:0s">🧠</div>
        <div class="pg-hub-card-title" style="color:#00e5ff;">Quiz Playground</div>
        <div class="pg-hub-card-desc" style="color:#7070a0;">MCQ, fill-in-the-blank, true/false &amp; sequence questions. Test what you know.</div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;">
          <span class="pg-hub-card-badge" style="background:rgba(0,229,255,0.1);color:#00e5ff;border:1px solid rgba(0,229,255,0.2);">MCQ</span>
          <span class="pg-hub-card-badge" style="background:rgba(0,229,255,0.1);color:#00e5ff;border:1px solid rgba(0,229,255,0.2);">FILL-IN</span>
          <span class="pg-hub-card-badge" style="background:rgba(0,229,255,0.1);color:#00e5ff;border:1px solid rgba(0,229,255,0.2);">T/F</span>
        </div>
      </div>
      <div class="pg-hub-card" style="background:linear-gradient(145deg,rgba(255,77,184,0.08),rgba(150,0,100,0.05));border-color:rgba(255,77,184,0.25);"
        onmouseover="this.style.borderColor='rgba(255,77,184,0.6)';this.style.boxShadow='0 0 30px rgba(255,77,184,0.15)'"
        onmouseout="this.style.borderColor='rgba(255,77,184,0.25)';this.style.boxShadow='none'"
        onclick="launchGamePlayground()">
        <div class="pg-hub-card-emoji" style="animation-delay:0.3s">🎮</div>
        <div class="pg-hub-card-title" style="color:#ff4db8;">Game Playground</div>
        <div class="pg-hub-card-desc" style="color:#7070a0;">Play the algorithm hands-on. Interact, make moves, and feel how it actually works.</div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;">
          <span class="pg-hub-card-badge" style="background:rgba(255,77,184,0.1);color:#ff4db8;border:1px solid rgba(255,77,184,0.2);">INTERACTIVE</span>
          <span class="pg-hub-card-badge" style="background:rgba(255,77,184,0.1);color:#ff4db8;border:1px solid rgba(255,77,184,0.2);">GAMIFIED</span>
        </div>
      </div>
      <div class="pg-hub-card" style="background:linear-gradient(145deg,rgba(163,230,53,0.08),rgba(80,130,0,0.05));border-color:rgba(163,230,53,0.25);"
        onmouseover="this.style.borderColor='rgba(163,230,53,0.6)';this.style.boxShadow='0 0 30px rgba(163,230,53,0.15)'"
        onmouseout="this.style.borderColor='rgba(163,230,53,0.25)';this.style.boxShadow='none'"
        onclick="launchProblemPlayground()">
        <div class="pg-hub-card-emoji" style="animation-delay:0.6s">💻</div>
        <div class="pg-hub-card-title" style="color:#a3e635;">Problem Playground</div>
        <div class="pg-hub-card-desc" style="color:#7070a0;">3 real-world puzzles that can only be solved using this algorithm. Write &amp; run code.</div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;">
          <span class="pg-hub-card-badge" style="background:rgba(163,230,53,0.1);color:#a3e635;border:1px solid rgba(163,230,53,0.2);">EASY</span>
          <span class="pg-hub-card-badge" style="background:rgba(163,230,53,0.1);color:#a3e635;border:1px solid rgba(163,230,53,0.2);">MEDIUM</span>
          <span class="pg-hub-card-badge" style="background:rgba(163,230,53,0.1);color:#a3e635;border:1px solid rgba(163,230,53,0.2);">HARD</span>
        </div>
      </div>
    </div>`;
}

function pgBackToHub() {
  const expMeta = EXPERIMENTS.find(e => e.id === currentExp) || {};
  const accent = expMeta.accentColor || '#bf5fff';
  showPlaygroundHub(accent, expMeta);
}



// ══════════════════════════════════════════════════════════
//  QUIZ PLAYGROUND
// ══════════════════════════════════════════════════════════

const QUIZ_BANK = {
  'bubble-sort': [
    {type:'mcq',q:'What is the worst-case time complexity of Bubble Sort?',choices:['O(n)','O(n log n)','O(n²)','O(log n)'],a:2},
    {type:'mcq',q:'With early-exit optimization, Bubble Sort best case is:',choices:['O(n²)','O(n log n)','O(n)','O(1)'],a:2},
    {type:'mcq',q:'After the k-th pass, which elements are in final position?',choices:['First k','Last k','Middle k','None yet'],a:1},
    {type:'tf',q:'Bubble Sort is a stable sorting algorithm.',a:true},
    {type:'tf',q:'Bubble Sort requires O(n) extra space.',a:false},
    {type:'fill',q:'Bubble sort is named because larger elements _____ to the top each pass.',a:'bubble',hint:'Like bubbles rising in water…'},
    {type:'mcq',q:'What triggers the early-exit optimization?',choices:['Reaching mid-array','No swaps in a pass','Array length < 5','Finding the min'],a:1},
    {type:'mcq',q:'In Bubble Sort, inner loop runs how many times in pass i?',choices:['n','n-i-1','i','n/2'],a:1},
  ],
  'selection-sort': [
    {type:'mcq',q:'Selection Sort makes at most how many swaps for n elements?',choices:['O(n²)','O(n log n)','O(n)','n-1'],a:3},
    {type:'mcq',q:'Time complexity of Selection Sort in ALL cases:',choices:['O(n)','O(n log n)','O(n²)','O(n³)'],a:2},
    {type:'tf',q:'Selection Sort is a stable sorting algorithm.',a:false},
    {type:'fill',q:'Each pass of Selection Sort finds the _____ element from the unsorted portion.',a:'minimum',hint:'Think smallest value…'},
    {type:'mcq',q:'Number of comparisons for n=5:',choices:['10','5','15','4'],a:0},
    {type:'mcq',q:'Selection Sort is preferred when:',choices:['Memory writes are costly','Speed is critical','Data is nearly sorted','Data is random'],a:0},
  ],
  'insertion-sort': [
    {type:'mcq',q:'Best case time complexity of Insertion Sort:',choices:['O(n²)','O(n log n)','O(n)','O(1)'],a:2},
    {type:'mcq',q:'Insertion Sort is most efficient when input is:',choices:['Random','Reverse sorted','Nearly sorted','All equal'],a:2},
    {type:'tf',q:'Insertion Sort is stable.',a:true},
    {type:'fill',q:'Insertion Sort builds sorted array one element at a time by _____ each into its correct spot.',a:'inserting',hint:'The name gives it away…'},
    {type:'mcq',q:'Best real-world use for Insertion Sort:',choices:['Sorting 1M records','Online sorting (data arrives one-by-one)','Parallel sorting','Database indexing'],a:1},
    {type:'mcq',q:'After 3 steps of Insertion Sort on [4,2,7,1], the sorted prefix is:',choices:['[2,4,7]','[1,2,4]','[4,2,7]','[1,4,7]'],a:0},
  ],
  'merge-sort': [
    {type:'mcq',q:'Time complexity of Merge Sort in all cases:',choices:['O(n)','O(n²)','O(n log n)','O(log n)'],a:2},
    {type:'mcq',q:'Extra space required by Merge Sort:',choices:['O(1)','O(log n)','O(n)','O(n²)'],a:2},
    {type:'tf',q:'Merge Sort is a stable sorting algorithm.',a:true},
    {type:'fill',q:'Merge Sort uses the _____ paradigm: split, recurse, combine.',a:'divide and conquer',hint:'Split and rule…'},
    {type:'mcq',q:'Recursion depth for n=8:',choices:['2','3','4','8'],a:1},
    {type:'mcq',q:'Which phase does the real work in Merge Sort?',choices:['Splitting','Merging','Recursion setup','Base case'],a:1},
  ],
  'quick-sort': [
    {type:'mcq',q:'Average case time complexity of Quick Sort:',choices:['O(n)','O(n²)','O(n log n)','O(log n)'],a:2},
    {type:'mcq',q:'Worst case of Quick Sort occurs when:',choices:['Array is random','Pivot always picks min/max (sorted input)','Array has duplicates','Array size is odd'],a:1},
    {type:'tf',q:'Quick Sort requires O(log n) extra space on average (call stack).',a:true},
    {type:'fill',q:'Quick Sort partitions array around a _____ element.',a:'pivot',hint:'The element that divides…'},
    {type:'mcq',q:'Best pivot selection strategy:',choices:['Always first','Always last','Median of three','Always middle'],a:2},
    {type:'tf',q:'Quick Sort is a stable sorting algorithm.',a:false},
  ],
  'heap-sort': [
    {type:'mcq',q:'Which data structure does Heap Sort use?',choices:['Stack','Binary Heap','Hash Table','Trie'],a:1},
    {type:'mcq',q:'Building a max-heap from n elements takes:',choices:['O(n log n)','O(n)','O(n²)','O(log n)'],a:1},
    {type:'tf',q:'Heap Sort is in-place (O(1) extra space).',a:true},
    {type:'fill',q:'In a max-heap, the _____ element is always at the root.',a:'largest',hint:'Max-heap → max at top'},
    {type:'mcq',q:'Heap Sort is avoided in practice because:',choices:["It's unstable and has poor cache performance","It's too complex","Uses too much memory","Slower than O(n²)"],a:0},
    {type:'mcq',q:'After extracting max from heap, we restore it with:',choices:['Full rebuild','Heapify (sift-down)','Rotate left','Sort again'],a:1},
  ],
  'n-queens': [
    {type:'mcq',q:'How many solutions exist for the 8-Queens problem?',choices:['12','92','64','8'],a:1},
    {type:'mcq',q:'N-Queens uses which technique?',choices:['Dynamic Programming','Greedy','Backtracking','BFS'],a:2},
    {type:'tf',q:'Two queens attack each other if on the same diagonal.',a:true},
    {type:'fill',q:'Backtracking explores a path and _____ when a conflict is detected.',a:'backtracks',hint:'Returns and tries another path…'},
    {type:'mcq',q:'N-Queens has NO solution when:',choices:['N=1','N=2 or N=3','N=4','N>8'],a:1},
    {type:'mcq',q:'We place queens one per:',choices:['Cell','Row','Column','Diagonal'],a:1},
  ],
  'sudoku-solver': [
    {type:'mcq',q:'Sudoku uses which technique?',choices:['Greedy','Dynamic Programming','Backtracking','BFS'],a:2},
    {type:'mcq',q:'A number must be unique in its row, column, and:',choices:['Diagonal','3×3 box','Adjacent cells','Corner cells'],a:1},
    {type:'tf',q:'Every valid Sudoku puzzle has exactly one solution.',a:false},
    {type:'fill',q:'When solver hits an invalid state, it _____ and tries the next digit.',a:'backtracks',hint:'Undo and retry…'},
    {type:'mcq',q:'Standard Sudoku grid size:',choices:['6×6','8×8','9×9','10×10'],a:2},
    {type:'tf',q:'Backtracking pruning makes Sudoku solving much faster than brute force.',a:true},
  ],
  'rat-in-maze': [
    {type:'mcq',q:'Rat in a Maze finds ALL paths using:',choices:['DFS only','BFS only','Backtracking','Dijkstra'],a:2},
    {type:'mcq',q:'A cell with value 0 means:',choices:['Open path','Blocked','Destination','Start'],a:1},
    {type:'tf',q:'Backtracking marks cells as visited to avoid cycles.',a:true},
    {type:'fill',q:'The rat can move in _____ directions in the classic version.',a:'4',hint:'Up, down, left, right'},
    {type:'mcq',q:'Rat in a Maze is classified as a:',choices:['Greedy problem','Constraint Satisfaction Problem','DP problem','Sorting problem'],a:1},
    {type:'mcq',q:'Worst case complexity for N×N maze:',choices:['O(N²)','O(2^N)','O(4^(N²)) approximately','O(N log N)'],a:2},
  ],
  'bfs': [
    {type:'mcq',q:'BFS uses which data structure?',choices:['Stack','Queue','Heap','Tree'],a:1},
    {type:'mcq',q:'BFS finds shortest path in:',choices:['Weighted graphs','Unweighted graphs','Both','Neither'],a:1},
    {type:'tf',q:'BFS explores all neighbors before going deeper.',a:true},
    {type:'fill',q:'BFS traversal order is called _____ order.',a:'level',hint:'Layer by layer…'},
    {type:'mcq',q:'Time complexity of BFS (V vertices, E edges):',choices:['O(V)','O(E)','O(V+E)','O(V×E)'],a:2},
    {type:'tf',q:'BFS can find shortest path with negative weights.',a:false},
  ],
  'dfs': [
    {type:'mcq',q:'DFS uses which data structure (iterative)?',choices:['Queue','Heap','Stack','Array'],a:2},
    {type:'tf',q:'DFS can detect cycles in a directed graph.',a:true},
    {type:'tf',q:'DFS always finds the shortest path.',a:false},
    {type:'fill',q:'DFS explores as _____ as possible before backtracking.',a:'deep',hint:'Opposite of BFS…'},
    {type:'mcq',q:'Which uses DFS?',choices:['Shortest path in maps','Level-order printing','Topological sort','Prim MST'],a:2},
    {type:'mcq',q:'Time complexity of DFS:',choices:['O(V²)','O(V+E)','O(E log V)','O(V log V)'],a:1},
  ],
  'dijkstra': [
    {type:'mcq',q:'Dijkstra uses which data structure for efficiency?',choices:['Stack','Queue','Priority Queue','Hash Table'],a:2},
    {type:'mcq',q:'Dijkstra fails on graphs with:',choices:['Directed edges','Negative weights','Cycles','Large N'],a:1},
    {type:'tf',q:'Dijkstra is a greedy algorithm.',a:true},
    {type:'fill',q:"Dijkstra finds the _____ path from source to all vertices.",a:'shortest',hint:'Minimum cost path…'},
    {type:'mcq',q:'Time complexity with binary heap:',choices:['O(V²)','O(E log V)','O(V+E)','O(V log V)'],a:1},
    {type:'mcq',q:'Why does Dijkstra fail with negative edges?',choices:["Can't compute","May finalize non-optimal distance","Priority queue breaks","Loops forever"],a:1},
  ],

  'fibonacci-dp': [
    {type:'mcq',q:'What problem does memoization solve in recursive Fibonacci?',choices:['Stack overflow','Redundant recomputation','Memory leaks','Wrong answers'],a:1},
    {type:'mcq',q:'Time complexity of DP Fibonacci vs naive recursive?',choices:['Same O(2^n)','O(n) vs O(2^n)','O(log n) vs O(n)','O(1) vs O(n)'],a:1},
    {type:'tf',q:'Tabulation (bottom-up DP) avoids recursion entirely.',a:true},
    {type:'fill',q:'DP avoids redundant calls by _____ previously computed results.',a:'caching',hint:'Store and reuse…'},
    {type:'mcq',q:'Fibonacci DP table size for F(n)?',choices:['n/2','n','n²','2^n'],a:1},
    {type:'tf',q:'Memoization is a top-down DP technique.',a:true},
  ],
  'lcs': [
    {type:'mcq',q:'LCS of "ABCBDAB" and "BDCAB" has length:',choices:['3','4','5','6'],a:1},
    {type:'mcq',q:'LCS DP table has size:',choices:['m×n','(m+1)×(n+1)','m+n','max(m,n)'],a:1},
    {type:'tf',q:'LCS is used in DNA sequence alignment.',a:true},
    {type:'fill',q:'LCS stands for Longest Common _____.',a:'Subsequence',hint:'Not substring — can skip chars…'},
    {type:'mcq',q:'Time complexity of LCS DP?',choices:['O(m+n)','O(m×n)','O(m²)','O(2^n)'],a:1},
    {type:'mcq',q:'LCS uses which DP technique?',choices:['1D tabulation','2D table','Memoization only','Greedy'],a:1},
  ],
  'knapsack': [
    {type:'mcq',q:'0/1 Knapsack time complexity?',choices:['O(n)','O(nW)','O(n²)','O(2^n) naive'],a:1},
    {type:'mcq',q:'In 0/1 Knapsack, each item can be taken:',choices:['Any number of times','Exactly once','0 or 1 times','Fractionally'],a:2},
    {type:'tf',q:'Fractional Knapsack can be solved greedily.',a:true},
    {type:'fill',q:'Knapsack DP table entry dp[i][w] = max value using first i items with capacity _____.',a:'w',hint:'The column index is the capacity'},
    {type:'mcq',q:'If item weight > current capacity, we:',choices:['Force include it','Skip it (take dp[i-1][w])','Break the item','Use fractional amount'],a:1},
    {type:'tf',q:'0/1 Knapsack DP always finds the optimal solution.',a:true},
  ],
  'stack-ops': [
    {type:'mcq',q:'Stack follows which principle?',choices:['FIFO','LIFO','LILO','Random access'],a:1},
    {type:'mcq',q:'Which operation adds to a stack?',choices:['Enqueue','Push','Insert','Append'],a:1},
    {type:'tf',q:'Stack overflow occurs when you push onto a full stack.',a:true},
    {type:'fill',q:'Stack is used in function call management via the call _____.',a:'stack',hint:'The runtime memory structure…'},
    {type:'mcq',q:'Balanced parentheses checking uses a:',choices:['Queue','Stack','Heap','Tree'],a:1},
    {type:'mcq',q:'Stack peek operation:',choices:['Removes top','Returns top without removing','Adds to top','Clears stack'],a:1},
  ],
  'queue-ops': [
    {type:'mcq',q:'Queue follows which principle?',choices:['LIFO','FIFO','Random','Priority'],a:1},
    {type:'mcq',q:'Which operation adds to a queue?',choices:['Push','Pop','Enqueue','Peek'],a:2},
    {type:'tf',q:'A deque supports insertion and deletion at both ends.',a:true},
    {type:'fill',q:'Queue removes from the _____ end.',a:'front',hint:'Opposite of where you insert…'},
    {type:'mcq',q:'BFS uses a _____ to track nodes to visit.',a:1,choices:['Stack','Queue','Heap','Array']},
    {type:'mcq',q:'Circular queue solves:',choices:['Priority ordering','Memory waste from shifting','Overflow always','Underflow always'],a:1},
  ],
  'bst-ops': [
    {type:'mcq',q:'BST average search time?',choices:['O(1)','O(log n)','O(n)','O(n²)'],a:1},
    {type:'mcq',q:'In a BST, left child is always _____ than parent.',choices:['Greater','Equal','Smaller','Random'],a:2},
    {type:'tf',q:'Inorder traversal of a BST gives sorted output.',a:true},
    {type:'fill',q:'BST worst case (degenerate/sorted input) degrades to O(_____) search.',a:'n',hint:'Like a linked list…'},
    {type:'mcq',q:'BST deletion of a node with two children: replace with?',choices:['Any node','Inorder successor or predecessor','Root','Left child'],a:1},
    {type:'tf',q:'A BST can become unbalanced over many insertions.',a:true},
  ],
  'avl-tree': [
    {type:'mcq',q:'AVL tree maintains balance by ensuring height difference ≤:',choices:['0','1','2','log n'],a:1},
    {type:'mcq',q:'Which rotation fixes Left-Left imbalance?',choices:['Left rotation','Right rotation','Left-Right rotation','Right-Left rotation'],a:1},
    {type:'tf',q:'AVL tree guarantees O(log n) for all operations.',a:true},
    {type:'fill',q:'The balance factor = height(left) − height(_____)',a:'right',hint:'The other subtree…'},
    {type:'mcq',q:'How many rotations does LR imbalance need?',choices:['1','2','3','4'],a:1},
    {type:'tf',q:'AVL trees are always strictly balanced.',a:true},
  ],
  'tree-traversal': [
    {type:'mcq',q:'Inorder traversal visits nodes in which order?',choices:['Root-Left-Right','Left-Root-Right','Left-Right-Root','Right-Root-Left'],a:1},
    {type:'mcq',q:'Which traversal is used to copy a tree?',choices:['Inorder','Preorder','Postorder','Level-order'],a:1},
    {type:'tf',q:'Level-order traversal uses a queue.',a:true},
    {type:'fill',q:'Postorder traversal visits the root _____ the children.',a:'after',hint:'Post = after…'},
    {type:'mcq',q:'Preorder is used for:',choices:['Sorting BST','Prefix expression trees','Deleting a tree','Counting nodes'],a:1},
    {type:'mcq',q:'BFS on a tree is equivalent to _____ traversal.',choices:['Inorder','Preorder','Postorder','Level-order'],a:3},
  ],
  'red-black-tree': [
    {type:'mcq',q:'Red-Black tree guarantees height ≤:',choices:['log n','2 log n','n/2','n'],a:1},
    {type:'mcq',q:'Root of a Red-Black tree is always:',choices:['Red','Black','Either','Null'],a:1},
    {type:'tf',q:'No two consecutive red nodes are allowed.',a:true},
    {type:'fill',q:'Every path from root to null must have the same number of _____ nodes.',a:'black',hint:'The strict color…'},
    {type:'mcq',q:'Red-Black trees are used in:',choices:['Python lists','C++ std::map and Java TreeMap','Hash tables','Queues'],a:1},
    {type:'tf',q:'Red-Black trees are less strictly balanced than AVL trees.',a:true},
  ],
  'topo-sort': [
    {type:'mcq',q:'Topological sort applies to:',choices:['Any graph','Undirected graphs','DAGs only','Weighted graphs'],a:2},
    {type:'mcq',q:'Kahn\'s algorithm uses which data structure?',choices:['Stack','Queue (in-degree=0 nodes)','Heap','Set'],a:1},
    {type:'tf',q:'A graph with a cycle cannot have a topological order.',a:true},
    {type:'fill',q:'Topological sort ensures for every edge u→v, u appears _____ v in the result.',a:'before',hint:'Dependency order…'},
    {type:'mcq',q:'DFS-based topo sort uses:',choices:['BFS queue','Finish-time stack','In-degree array','Priority queue'],a:1},
    {type:'mcq',q:'Build systems like Make use topological sort to:',choices:['Optimize speed','Order task dependencies','Sort file names','Find cycles'],a:1},
  ],
  'kruskal': [
    {type:'mcq',q:"Kruskal's algorithm builds MST by:",choices:['Growing from a seed node','Adding cheapest edge not forming cycle','BFS expansion','DFS post-order'],a:1},
    {type:'mcq',q:"Kruskal's uses which data structure to detect cycles?",choices:['Stack','Queue','Union-Find (DSU)','Heap'],a:2},
    {type:'tf',q:'Kruskal processes edges in sorted order by weight.',a:true},
    {type:'fill',q:"Kruskal's time complexity is dominated by _____ the edges.",a:'sorting',hint:'The first step…'},
    {type:'mcq',q:'MST of n nodes has exactly _____ edges.',choices:['n','n-1','n+1','n/2'],a:1},
    {type:'tf',q:"Kruskal's is better than Prim's for sparse graphs.",a:true},
  ],
  'prim': [
    {type:'mcq',q:"Prim's algorithm grows MST from a:",choices:['Random edge','Seed node','Sorted edge list','Cycle'],a:1},
    {type:'mcq',q:"Prim's uses which structure to pick cheapest frontier edge?",choices:['Stack','Queue','Priority Queue','Union-Find'],a:2},
    {type:'tf',q:"Prim's is better suited for dense graphs than Kruskal's.",a:true},
    {type:'fill',q:"Prim's always picks the minimum weight edge crossing the _____.",a:'cut',hint:'The boundary between visited and unvisited…'},
    {type:'mcq',q:"Prim's time complexity with binary heap?",choices:['O(V²)','O(E log V)','O(V+E)','O(E²)'],a:1},
    {type:'mcq',q:'Both Kruskal and Prim produce:',choices:['Same edges always','A minimum spanning tree','A shortest path tree','A balanced BST'],a:1},
  ],
  'bellman-ford': [
    {type:'mcq',q:'Bellman-Ford handles what that Dijkstra cannot?',choices:['Directed graphs','Negative weight edges','Large graphs','Dense graphs'],a:1},
    {type:'mcq',q:'Bellman-Ford relaxes all edges how many times?',choices:['Once','V times','V-1 times','E times'],a:2},
    {type:'tf',q:'Bellman-Ford can detect negative weight cycles.',a:true},
    {type:'fill',q:'Bellman-Ford time complexity is O(V × _____)',a:'E',hint:'Vertices times…'},
    {type:'mcq',q:'If Vth relaxation still improves a distance, it indicates:',choices:['Shortest path found','Negative cycle exists','Wrong input','Graph is disconnected'],a:1},
    {type:'tf',q:'Bellman-Ford is slower than Dijkstra for graphs without negative edges.',a:true},
  ],
  'kmp': [
    {type:'mcq',q:'KMP avoids redundant comparisons using a:',choices:['Hash table','Failure function (LPS array)','BFS tree','Sorted index'],a:1},
    {type:'mcq',q:'KMP time complexity for text length n and pattern length m?',choices:['O(n×m)','O(n+m)','O(n log m)','O(m²)'],a:1},
    {type:'tf',q:'The KMP failure function represents the longest proper prefix that is also a suffix.',a:true},
    {type:'fill',q:'KMP never moves the text pointer _____.',a:'backwards',hint:'It only goes forward…'},
    {type:'mcq',q:'Preprocessing the pattern in KMP takes:',choices:['O(1)','O(m)','O(m²)','O(n)'],a:1},
    {type:'mcq',q:'KMP is used in:',choices:['Database joins','Text editors (find/replace)','Sorting','Graph search'],a:1},
  ],
  'rabin-karp': [
    {type:'mcq',q:'Rabin-Karp uses _____ to compare windows efficiently.',choices:['Sorting','Rolling hash','BFS','Trie'],a:1},
    {type:'mcq',q:'Average time complexity of Rabin-Karp?',choices:['O(n×m)','O(n+m)','O(n log n)','O(m²)'],a:1},
    {type:'tf',q:'Hash collisions in Rabin-Karp cause spurious hits that need verification.',a:true},
    {type:'fill',q:'Rabin-Karp is ideal for finding _____ patterns simultaneously.',a:'multiple',hint:'More than one pattern…'},
    {type:'mcq',q:'Rolling hash updates in:',choices:['O(m)','O(1)','O(log m)','O(n)'],a:1},
    {type:'mcq',q:'Worst case of Rabin-Karp (all hashes collide)?',choices:['O(n+m)','O(n×m)','O(n²)','O(m²)'],a:1},
  ],
  'trie': [
    {type:'mcq',q:'Trie lookup time for a word of length m?',choices:['O(n)','O(m)','O(log n)','O(1)'],a:1},
    {type:'mcq',q:'Tries are also called:',choices:['Suffix trees','Prefix trees','Binary trees','B-trees'],a:1},
    {type:'tf',q:'All words with the same prefix share nodes in a trie.',a:true},
    {type:'fill',q:'Trie is most commonly used for _____ systems.',a:'autocomplete',hint:'Suggest as you type…'},
    {type:'mcq',q:'Space complexity of a trie for n words of avg length m?',choices:['O(n)','O(m)','O(n×m)','O(n+m)'],a:2},
    {type:'tf',q:'Trie can be used to sort strings lexicographically.',a:true},
  ],
  'binary-search': [
    {type:'mcq',q:'Binary search time complexity?',choices:['O(n)','O(log n)','O(n log n)','O(1)'],a:1},
    {type:'mcq',q:'Binary search requires the array to be:',choices:['Randomly ordered','Sorted','Distinct elements','No duplicates'],a:1},
    {type:'tf',q:'Binary search can find the insertion position even if element is absent.',a:true},
    {type:'fill',q:'Binary search eliminates _____ of the search space each step.',a:'half',hint:'Divides by 2…'},
    {type:'mcq',q:'For n=1,000,000 elements, binary search takes at most:',choices:['100 steps','20 steps','1000 steps','500 steps'],a:1},
    {type:'mcq',q:'Binary search is equivalent to searching a:',choices:['Hash table','Sorted linked list','BST','Heap'],a:2},
  ],
  'interpolation-search': [
    {type:'mcq',q:'Interpolation search best case complexity?',choices:['O(n)','O(log n)','O(log log n)','O(1)'],a:2},
    {type:'mcq',q:'Interpolation search works best when data is:',choices:['Sorted and clustered','Uniformly distributed','Random','All equal'],a:1},
    {type:'tf',q:'Interpolation search estimates probe position from the value sought.',a:true},
    {type:'fill',q:'Interpolation search worst case is O(_____) for non-uniform data.',a:'n',hint:'Degenerates to linear…'},
    {type:'mcq',q:'Interpolation search improves on binary search by:',choices:['Using hashing','Using value distribution to guess position','Sorting first','Using two pointers'],a:1},
    {type:'tf',q:'Interpolation search always requires more comparisons than binary search.',a:false},
  ],
  'activity-selection': [
    {type:'mcq',q:'Activity selection greedy choice: always pick activity with earliest:',choices:['Start time','Finish time','Duration','Priority'],a:1},
    {type:'mcq',q:'Activity selection finds maximum number of:',choices:['Total time used','Non-overlapping activities','Shortest activities','Heaviest activities'],a:1},
    {type:'tf',q:'Activity selection problem has optimal substructure.',a:true},
    {type:'fill',q:'Activities are sorted by _____ time before greedy selection.',a:'finish',hint:'When they end…'},
    {type:'mcq',q:'Time complexity of activity selection (after sorting)?',choices:['O(n²)','O(n)','O(n log n)','O(1)'],a:1},
    {type:'tf',q:'Greedy works for activity selection because locally optimal = globally optimal.',a:true},
  ],
  'huffman-coding': [
    {type:'mcq',q:'Huffman coding assigns shorter codes to:',choices:['Longer characters','Less frequent characters','More frequent characters','Random characters'],a:2},
    {type:'mcq',q:'Huffman tree is built by repeatedly merging:',choices:['Two highest frequency nodes','Two lowest frequency nodes','Adjacent nodes','Random nodes'],a:1},
    {type:'tf',q:'Huffman codes are prefix-free (no code is prefix of another).',a:true},
    {type:'fill',q:'Huffman coding is used in _____ and ZIP compression.',a:'JPEG',hint:'Image format…'},
    {type:'mcq',q:'Building Huffman tree takes?',choices:['O(n)','O(n log n)','O(n²)','O(log n)'],a:1},
    {type:'tf',q:'Huffman encoding can achieve better compression than fixed-length encoding.',a:true},
  ],
  'union-find': [
    {type:'mcq',q:'Union-Find supports which two operations?',choices:['Push/Pop','Find/Union','Insert/Delete','Search/Sort'],a:1},
    {type:'mcq',q:'Path compression optimizes:',choices:['Union operation','Find operation','Both equally','Neither'],a:1},
    {type:'tf',q:'Union by rank keeps trees shallow.',a:true},
    {type:'fill',q:'With path compression and union by rank, operations are nearly O(_____) amortized.',a:'1',hint:'Almost constant time…'},
    {type:'mcq',q:'Union-Find is used in:',choices:["Dijkstra's","Kruskal's MST","Binary search","DFS"],a:1},
    {type:'mcq',q:'Union-Find detects:',choices:['Shortest paths','Connected components and cycles','Topological order','Balanced trees'],a:1},
  ],
  'convex-hull': [
    {type:'mcq',q:'Graham Scan convex hull time complexity?',choices:['O(n)','O(n log n)','O(n²)','O(log n)'],a:1},
    {type:'mcq',q:'Convex hull is the _____ polygon enclosing all points.',choices:['Largest','Smallest convex','Largest convex','Random'],a:1},
    {type:'tf',q:'Graham Scan uses a stack to build the hull.',a:true},
    {type:'fill',q:'Graham Scan sorts points by _____ angle from the lowest point.',a:'polar',hint:'The angle around the anchor…'},
    {type:'mcq',q:'Cross product determines if a turn is:',choices:['Clockwise or counter-clockwise','Longer or shorter','Inside or outside','Forward or backward'],a:0},
    {type:'tf',q:'All convex hull points are extreme points of the point set.',a:true},
  ],
  'line-intersection': [
    {type:'mcq',q:'Two segments intersect if their bounding boxes overlap AND:',choices:['They are parallel','Cross product signs differ','They are equal length','Both are vertical'],a:1},
    {type:'mcq',q:'Sweep line algorithm detects all intersections in:',choices:['O(n)','O(n log n)','O(n²)','O(n³)'],a:1},
    {type:'tf',q:'Collinear overlapping segments are considered intersecting.',a:true},
    {type:'fill',q:'Cross product of two vectors is _____ when they are parallel.',a:'zero',hint:'No perpendicular component…'},
    {type:'mcq',q:'Line segment intersection is used in:',choices:['Sorting numbers','CAD collision detection','Graph BFS','DP tables'],a:1},
    {type:'tf',q:'Two parallel lines never intersect.',a:true},
  ],
  'closest-pair': [
    {type:'mcq',q:'Closest pair divide-and-conquer time complexity?',choices:['O(n²)','O(n log n)','O(n)','O(log n)'],a:1},
    {type:'mcq',q:'After finding closest pairs in each half, we check a strip of width:',choices:['d','2d','d/2','d²'],a:1},
    {type:'tf',q:'The strip contains at most 8 points within distance d.',a:true},
    {type:'fill',q:'The closest pair algorithm splits the point set by a vertical _____.',a:'line',hint:'A separator…'},
    {type:'mcq',q:'Brute-force closest pair takes:',choices:['O(n log n)','O(n)','O(n²)','O(n³)'],a:2},
    {type:'tf',q:'Closest pair is useful in clustering algorithms.',a:true},
  ],
  'polygon-area': [
    {type:'mcq',q:'Shoelace formula computes polygon area in:',choices:['O(n²)','O(n log n)','O(n)','O(1)'],a:2},
    {type:'mcq',q:'Shoelace formula uses:',choices:['Cross products of all pairs','Sum of coordinate differences','Signed area of triangles from origin','Circle approximation'],a:2},
    {type:'tf',q:'Shoelace formula works for non-convex polygons.',a:true},
    {type:'fill',q:'The final area = |sum| / _____',a:'2',hint:'Divide by two…'},
    {type:'mcq',q:'A negative Shoelace result indicates:',choices:['Invalid polygon','Counter-clockwise vertex order','Clockwise vertex order','Overlapping edges'],a:2},
    {type:'tf',q:'Shoelace formula requires the polygon to be simple (non-self-intersecting).',a:true},
  ],
  'subset-bitmask': [
    {type:'mcq',q:'Number of subsets of a set with n elements?',choices:['n','n²','2^n','n!'],a:2},
    {type:'mcq',q:'Bitmask i has kth bit set when:',choices:['i > k','i & (1<<k) != 0','i | k != 0','i ^ k == 0'],a:1},
    {type:'tf',q:'Iterating from 0 to (1<<n)-1 enumerates all subsets.',a:true},
    {type:'fill',q:'To check if bit k is set: i & (1 << _____)',a:'k',hint:'The bit position…'},
    {type:'mcq',q:'Bitmask DP is useful when n ≤:',choices:['100','1000','20-25','1000000'],a:2},
    {type:'tf',q:'XOR of a bitmask with itself equals 0.',a:true},
  ],
  'xor-tricks': [
    {type:'mcq',q:'XOR of a number with itself?',choices:['The number','1','0','Undefined'],a:2},
    {type:'mcq',q:'Find the single non-duplicate in array: XOR all elements gives?',choices:['0','The duplicate','The unique element','Sum'],a:2},
    {type:'tf',q:'XOR is commutative and associative.',a:true},
    {type:'fill',q:'To swap a and b without temp: a ^= b; b ^= a; a ^= _____',a:'b',hint:'Third XOR step…'},
    {type:'mcq',q:'XOR of all numbers 1 to n can be computed in:',choices:['O(n)','O(log n)','O(1) with pattern','O(n²)'],a:2},
    {type:'tf',q:'n & (n-1) clears the lowest set bit of n.',a:true},
  ],
  'power-of-two': [
    {type:'mcq',q:'A number n is a power of 2 if n & (n-1) equals:',choices:['n','1','0','n-1'],a:2},
    {type:'mcq',q:'Which is NOT a power of 2?',choices:['16','32','48','64'],a:2},
    {type:'tf',q:'Powers of 2 have exactly one bit set in binary.',a:true},
    {type:'fill',q:'2^10 = _____',a:'1024',hint:'Kilo…'},
    {type:'mcq',q:'Next power of 2 greater than or equal to n can be found using:',choices:['Division by 2','Bit manipulation with leading zeros','Modulo','Addition'],a:1},
    {type:'tf',q:'0 is considered a power of 2 by the n & (n-1) trick.',a:false},
  ],
  'bitwise-sieve': [
    {type:'mcq',q:'Sieve of Eratosthenes time complexity?',choices:['O(n)','O(n log log n)','O(n log n)','O(n²)'],a:1},
    {type:'mcq',q:'Bitwise sieve saves memory by using _____ per number.',choices:['1 byte','1 bit','4 bytes','8 bytes'],a:1},
    {type:'tf',q:'In Sieve of Eratosthenes, multiples of primes are marked as composite.',a:true},
    {type:'fill',q:'We only need to sieve up to √n because all composites have a factor ≤ _____.',a:'√n',hint:'Square root of limit…'},
    {type:'mcq',q:'Bitwise sieve uses which operations to mark/check composites?',choices:['Addition/subtraction','Bitwise OR/AND','Division/modulo','Shift/XOR'],a:1},
    {type:'tf',q:'1 is considered prime in the Sieve.',a:false},
  ],
  'binary-addition': [
    {type:'mcq',q:'1 + 1 in binary equals?',choices:['2','10','11','01'],a:1},
    {type:'mcq',q:'A full adder has how many inputs?',choices:['1','2','3','4'],a:2},
    {type:'tf',q:'Carry propagation can cause a ripple effect in multi-bit addition.',a:true},
    {type:'fill',q:'The carry-out from adding two 1-bit numbers is their bitwise _____.',a:'AND',hint:'1 AND 1 = 1…'},
    {type:'mcq',q:'Sum bit in full adder = A XOR B XOR:',choices:['AND','OR','Carry-in','NOT carry'],a:2},
    {type:'tf',q:'Binary addition is identical to decimal addition, just base 2.',a:true},
  ],
  'binary-subtraction': [
    {type:'mcq',q:"Two's complement of a number is obtained by:",choices:['Inverting bits','Inverting bits + 1','Multiplying by -1','Shifting right'],a:1},
    {type:'mcq',q:"Two's complement represents negative numbers using:",choices:['Sign-magnitude','Biased notation','MSB as sign with inversion+1','Absolute value'],a:2},
    {type:'tf',q:"In two's complement, there is only one representation of zero.",a:true},
    {type:'fill',q:"To subtract B from A using two's complement: A + (_____'s complement of B)",a:'two',hint:'The name of the method…'},
    {type:'mcq',q:'Range of 8-bit signed two\'s complement?',choices:['-127 to 127','-128 to 127','-128 to 128','0 to 255'],a:1},
    {type:'tf',q:"Two's complement subtraction uses the same hardware as addition.",a:true},
  ],
  'binary-multiplication': [
    {type:'mcq',q:"Booth's algorithm handles multiplication of:",choices:['Only positive numbers','Only negative numbers','Both positive and negative in two\'s complement','Floating point'],a:2},
    {type:'mcq',q:"Booth's algorithm examines _____ consecutive bits at a time.",choices:['1','2','3','4'],a:1},
    {type:'tf',q:"Booth's reduces the number of partial products for runs of 1s or 0s.",a:true},
    {type:'fill',q:"Booth's algorithm uses a _____ register to accumulate the result.",a:'accumulator',hint:'The running total register…'},
    {type:'mcq',q:"Pattern 01 in Booth's means:",choices:['Subtract','Add multiplicand','Do nothing','Shift only'],a:1},
    {type:'tf',q:"Booth's algorithm operates on the multiplier bit by bit from LSB.",a:true},
  ],
  'binary-division': [
    {type:'mcq',q:'Restoring division algorithm restores the remainder when:',choices:['Division is exact','Partial remainder goes negative','Quotient bit is 1','All steps done'],a:1},
    {type:'mcq',q:'Non-restoring division avoids restoring by:',choices:['Skipping negatives','Adding or subtracting based on sign','Using Booth','Multiplying instead'],a:1},
    {type:'tf',q:'Binary division is the inverse of binary multiplication.',a:true},
    {type:'fill',q:'In restoring division, we subtract the divisor and restore if the result is _____.',a:'negative',hint:'The bad case…'},
    {type:'mcq',q:'Binary division produces a _____ and a remainder.',choices:['Carry','Quotient','Complement','Partial product'],a:1},
    {type:'tf',q:'Hardware dividers typically use shift-subtract loops.',a:true},
  ],
  'binary-addition-gates': [
    {type:'mcq',q:'Half adder uses which gates?',choices:['OR + AND','XOR + AND','NOR + NAND','NOT + OR'],a:1},
    {type:'mcq',q:'Full adder requires how many logic gates minimum?',choices:['2','3','5','9'],a:2},
    {type:'tf',q:'A ripple carry adder chains full adders together.',a:true},
    {type:'fill',q:'Sum output of half adder = A _____ B',a:'XOR',hint:'Exclusive OR…'},
    {type:'mcq',q:'Carry-lookahead adder is faster because it:',choices:['Uses fewer gates','Computes carries in parallel','Avoids addition','Uses multiplication'],a:1},
    {type:'tf',q:'Each full adder in a ripple carry adder must wait for carry-in.',a:true},
  ],
  'binary-subtraction-gates': [
    {type:'mcq',q:"Two's complement subtractor uses the same gates as an adder plus:",choices:['More XOR gates','Inverters (NOT) on one input + set carry-in=1','NAND array','Separate subtract unit'],a:1},
    {type:'tf',q:'An adder-subtractor circuit can perform both operations.',a:true},
    {type:'fill',q:'To subtract B, we invert all bits of B and set carry-in = _____, giving two\'s complement.',a:'1',hint:'Initial carry adds 1…'},
    {type:'mcq',q:'Overflow in subtraction occurs when:',choices:['Result is negative','Sign bit is wrong (carry-in XOR carry-out of MSB)','All bits are 1','Operands are equal'],a:1},
    {type:'mcq',q:'A single bit controls add/subtract mode by XORing with:',choices:['Sum','Carry','B operand bits','A operand bits'],a:2},
    {type:'tf',q:'Subtraction and addition use the same full adder hardware with mode control.',a:true},
  ],
  'binary-multiplication-gates': [
    {type:'mcq',q:"Booth's gate datapath uses a shift register to:",choices:['Store the multiplier and shift each step','Invert bits','Compute XOR','Store the sum'],a:0},
    {type:'mcq',q:"In Booth's circuit, the control logic examines:",choices:['MSB only','LSB only','Two consecutive bits (current + previous)','All bits at once'],a:2},
    {type:'tf',q:"Booth's multiplier datapath includes an adder/subtractor unit.",a:true},
    {type:'fill',q:"The accumulator register is _____ bits wide for multiplying two n-bit numbers.",a:'2n',hint:'Double the operand width…'},
    {type:'mcq',q:'After each Booth step, the datapath performs a:',choices:['Left shift','Arithmetic right shift','Logical left shift','No shift'],a:1},
    {type:'tf',q:"Booth's hardware handles negative multipliers without special cases.",a:true},
  ],
  'binary-division-gates': [
    {type:'mcq',q:'Restoring divider gate datapath shifts the _____ register left each step.',choices:['Quotient','Divisor','Remainder','Accumulator'],a:2},
    {type:'mcq',q:'The subtract step in restoring division uses:',choices:['A multiplexer','An adder with complement','A shift register','XOR array'],a:1},
    {type:'tf',q:'A quotient bit is set to 1 if the partial remainder is non-negative after subtract.',a:true},
    {type:'fill',q:'Restoring division iterates _____ times for n-bit operands.',a:'n',hint:'One step per bit…'},
    {type:'mcq',q:'Control logic in the restoring divider checks:',choices:['MSB of quotient','Sign bit of partial remainder','Carry flag','Zero flag'],a:1},
    {type:'tf',q:'The divisor register remains constant throughout the division algorithm.',a:true},
  ],
  'linear-regression': [
    {type:'mcq',q:'Gradient descent updates weights by moving in the direction of:',choices:['Gradient','Negative gradient','Maximum error','Random direction'],a:1},
    {type:'mcq',q:'Learning rate too large causes gradient descent to:',choices:['Converge slowly','Overshoot and diverge','Converge instantly','Find local minima'],a:1},
    {type:'tf',q:'Linear regression minimizes mean squared error.',a:true},
    {type:'fill',q:'The line of best fit equation is y = mx + _____',a:'b',hint:'The y-intercept…'},
    {type:'mcq',q:'R² score of 1.0 means:',choices:['No fit','50% variance explained','Perfect fit','Overfitting'],a:2},
    {type:'tf',q:'Linear regression assumes a linear relationship between variables.',a:true},
  ],
  'knn': [
    {type:'mcq',q:'KNN classification predicts the class of a point by:',choices:['Training a model','Majority vote of K nearest neighbors','Gradient descent','Building a tree'],a:1},
    {type:'mcq',q:'Best distance metric for continuous features?',choices:['Hamming','Jaccard','Euclidean','Cosine'],a:2},
    {type:'tf',q:'KNN is a lazy learner — no explicit training phase.',a:true},
    {type:'fill',q:'KNN with K=1 classifies based on the _____ nearest neighbor.',a:'single',hint:'Just one…'},
    {type:'mcq',q:'Large K in KNN leads to:',choices:['Overfitting','Underfitting (smoother boundary)','Faster prediction','Less memory'],a:1},
    {type:'tf',q:'KNN prediction time grows with the training set size.',a:true},
  ],
  'kmeans': [
    {type:'mcq',q:'K-Means initializes by:',choices:['Sorting data','Randomly placing K centroids','Using KNN','Building a tree'],a:1},
    {type:'mcq',q:'K-Means is guaranteed to:',choices:['Find global optimum','Converge to a local optimum','Run in O(n) time','Never converge'],a:1},
    {type:'tf',q:'K-Means requires specifying K (number of clusters) in advance.',a:true},
    {type:'fill',q:'Each iteration of K-Means assigns points to the _____ centroid.',a:'nearest',hint:'Minimum distance…'},
    {type:'mcq',q:'K-Means objective: minimize:',choices:['Total distance between centroids','Within-cluster sum of squared distances','Between-cluster distance','Number of iterations'],a:1},
    {type:'tf',q:'K-Means can produce different results with different initializations.',a:true},
  ],
  'decision-tree': [
    {type:'mcq',q:'Decision tree splits use which criterion (commonly)?',choices:['Euclidean distance','Gini impurity or Information Gain','Gradient','Random selection'],a:1},
    {type:'mcq',q:'Overfitting in decision trees is reduced by:',choices:['Adding more nodes','Pruning','Increasing depth','More features'],a:1},
    {type:'tf',q:'A leaf node in a decision tree represents a class label.',a:true},
    {type:'fill',q:'Information Gain = entropy before split − weighted entropy _____.',a:'after',hint:'Improvement from splitting…'},
    {type:'mcq',q:'Random Forest improves decision trees by:',choices:['Growing deeper trees','Averaging many trees trained on random subsets','Using gradient descent','Pruning aggressively'],a:1},
    {type:'tf',q:'Decision trees are interpretable (human-readable).',a:true},
  ],
  'perceptron': [
    {type:'mcq',q:'Perceptron learning rule updates weights when:',choices:['Prediction is correct','Prediction is wrong','Every iteration','Randomly'],a:1},
    {type:'mcq',q:'Perceptron can only classify _____ separable data.',choices:['Non-linearly','Linearly','Randomly','Hierarchically'],a:1},
    {type:'tf',q:'Perceptron is the building block of neural networks.',a:true},
    {type:'fill',q:'Perceptron activation: output = 1 if weighted sum ≥ _____',a:'threshold',hint:'The decision boundary value…'},
    {type:'mcq',q:'Perceptron convergence theorem: it converges if data is:',choices:['Large enough','Linearly separable','Normally distributed','Balanced'],a:1},
    {type:'tf',q:'XOR problem cannot be solved by a single perceptron.',a:true},
  ],
  'ddos-attack': [
    {type:'mcq',q:'DDoS stands for:',choices:['Direct Denial of Service','Distributed Denial of Service','Dynamic Data over Systems','Directed Data Overflow Scheme'],a:1},
    {type:'mcq',q:'Primary goal of a DDoS attack:',choices:['Steal data','Encrypt files','Exhaust server resources','Modify database'],a:2},
    {type:'tf',q:'A botnet is commonly used to amplify DDoS attacks.',a:true},
    {type:'fill',q:'DDoS floods the target with massive _____ traffic.',a:'network',hint:'What it overwhelms…'},
    {type:'mcq',q:'Rate limiting helps mitigate DDoS by:',choices:['Encrypting traffic','Limiting requests per IP per second','Blocking all traffic','Rerouting packets'],a:1},
    {type:'tf',q:'UDP flood is a common type of DDoS attack.',a:true},
  ],
  'sql-injection': [
    {type:'mcq',q:'SQL injection inserts malicious SQL into:',choices:['Database directly','User input fields','Server config','Network packets'],a:1},
    {type:'mcq',q:'Best defense against SQL injection:',choices:['Input length limits','Parameterized queries / prepared statements','HTTPS','Firewall'],a:1},
    {type:'tf',q:'SQL injection can allow an attacker to dump entire databases.',a:true},
    {type:'fill',q:"Classic SQL injection uses a comment (-- or #) to _____ the rest of the query.",a:'ignore',hint:'Makes the rest disappear…'},
    {type:'mcq',q:"' OR '1'='1 works because:",choices:['It crashes the DB','It always evaluates to true','It deletes the table','It encrypts data'],a:1},
    {type:'tf',q:'ORM frameworks automatically prevent all SQL injection.',a:false},
  ],
  'firewall-filter': [
    {type:'mcq',q:'A firewall operates at which OSI layer (packet filter)?',choices:['Layer 7','Layer 3-4','Layer 1','Layer 2'],a:1},
    {type:'mcq',q:'Stateful firewall tracks:',choices:['Individual packets only','Full connection state','User identity','Encryption keys'],a:1},
    {type:'tf',q:'A whitelist firewall allows only explicitly permitted traffic.',a:true},
    {type:'fill',q:'Firewalls filter traffic based on IP address, port, and _____.',a:'protocol',hint:'TCP/UDP/ICMP…'},
    {type:'mcq',q:'WAF stands for:',choices:['Wide Area Firewall','Web Application Firewall','Wireless Access Filter','Wired Auth Framework'],a:1},
    {type:'tf',q:'Firewalls can prevent insider threats completely.',a:false},
  ],
  'mitm-attack': [
    {type:'mcq',q:'In MITM, the attacker:',choices:['Crashes the server','Intercepts and possibly alters communication between two parties','Sends spam','Encrypts victim files'],a:1},
    {type:'mcq',q:'ARP spoofing enables MITM by:',choices:['Flooding DNS','Associating attacker MAC with victim IP','Breaking HTTPS','Stealing passwords directly'],a:1},
    {type:'tf',q:'HTTPS with certificate pinning helps prevent MITM attacks.',a:true},
    {type:'fill',q:'MITM stands for Man-in-the-_____.',a:'Middle',hint:'Between two parties…'},
    {type:'mcq',q:'SSL stripping downgrades:',choices:['HTTP to FTP','HTTPS to HTTP','TLS 1.3 to TLS 1.0','DNS to UDP'],a:1},
    {type:'tf',q:'End-to-end encryption prevents passive MITM eavesdropping.',a:true},
  ],

  'tower-of-hanoi': [
    {type:'mcq',q:'Minimum moves for Tower of Hanoi with n disks?',choices:['n','2n','2^n - 1','n!'],a:2},
    {type:'mcq',q:'Tower of Hanoi uses which algorithmic technique?',choices:['Iteration','Dynamic Programming','Recursion','Greedy'],a:2},
    {type:'tf',q:'Tower of Hanoi with 3 disks requires exactly 7 moves minimum.',a:true},
    {type:'fill',q:'T(n) = 2*T(n-1) + 1. T(1) = ___',a:'1',hint:'One disk, one move…'},
    {type:'mcq',q:'Tower of Hanoi time complexity?',choices:['O(n)','O(n²)','O(2^n)','O(log n)'],a:2},
    {type:'tf',q:'The recursive solution elegantly maps to: move n-1 disks, move largest, move n-1 disks again.',a:true},
  ],
  'permutations': [
    {type:'mcq',q:'Number of permutations of n distinct elements?',choices:['n','n²','2^n','n!'],a:3},
    {type:'mcq',q:'Permutation generation uses which technique?',choices:['DP','Backtracking with swaps','BFS','Greedy'],a:1},
    {type:'tf',q:'Swapping arr[i] with every element arr[i..n-1] generates all permutations.',a:true},
    {type:'fill',q:'For n=3, total permutations = ___',a:'6',hint:'3! = ?'},
    {type:'mcq',q:'After recursing on position i, we swap back to:',choices:['Sort the array','Restore original order (backtrack)','Pick the next element','Skip duplicates'],a:1},
    {type:'tf',q:'Permutation generator has O(n!) time complexity.',a:true},
  ],
  'rsa': [
    {type:'mcq',q:'RSA security relies on the difficulty of:',choices:['Sorting','Factoring large numbers into primes','Graph traversal','Solving equations'],a:1},
    {type:'mcq',q:'RSA encryption uses which key?',choices:['Private key','Shared key','Public key','Session key'],a:2},
    {type:'tf',q:'RSA decryption uses the private key.',a:true},
    {type:'fill',q:'RSA is an _____ encryption algorithm (two different keys).',a:'asymmetric',hint:'Not symmetric — two keys…'},
    {type:'mcq',q:'RSA key generation requires choosing two large:',choices:['Even numbers','Prime numbers','Fibonacci numbers','Perfect squares'],a:1},
    {type:'tf',q:'The public key can be shared openly without compromising security.',a:true},
  ],
  'diffie-hellman': [
    {type:'mcq',q:'Diffie-Hellman is used for:',choices:['Encrypting messages directly','Secure key exchange over public channel','Hashing passwords','Digital signatures'],a:1},
    {type:'mcq',q:'DH security is based on the:',choices:['Factoring problem','Discrete logarithm problem','Travelling salesman','AES rounds'],a:1},
    {type:'tf',q:'Both DH parties arrive at the same shared secret without ever transmitting it.',a:true},
    {type:'fill',q:'DH allows establishing a _____ key over an insecure channel.',a:'shared',hint:'The goal of key exchange…'},
    {type:'mcq',q:'The "mixing colors" analogy works because:',choices:['Colors encrypt data','Mixed colors hard to un-mix (one-way)','Colors are public keys','Colors hash inputs'],a:1},
    {type:'tf',q:'An eavesdropper cannot compute the shared secret from intercepted public values.',a:true},
  ],
  'aes-round': [
    {type:'mcq',q:'AES block size is always:',choices:['64 bits','128 bits','256 bits','512 bits'],a:1},
    {type:'mcq',q:'AES-128 uses how many rounds?',choices:['8','10','12','14'],a:1},
    {type:'tf',q:'SubBytes applies a non-linear S-box substitution to each byte.',a:true},
    {type:'fill',q:'AES stands for Advanced _____ Standard.',a:'Encryption',hint:'The E in AES…'},
    {type:'mcq',q:'Which AES step provides diffusion across columns?',choices:['SubBytes','ShiftRows','MixColumns','AddRoundKey'],a:2},
    {type:'tf',q:'AES is a symmetric block cipher (same key for encrypt and decrypt).',a:true},
  ],
  'caesar-vigenere': [
    {type:'mcq',q:'Caesar cipher shifts each letter by a fixed:',choices:['Random value per letter','Constant key value','Prime number','Letter position'],a:1},
    {type:'mcq',q:'Vigenère improves over Caesar by using a:',choices:['Longer alphabet','Repeated keyword (different shift per position)','Hash function','Random pad'],a:1},
    {type:'tf',q:'Caesar with shift 13 is called ROT13.',a:true},
    {type:'fill',q:'Caesar cipher is a type of _____ cipher (each letter maps to another).',a:'substitution',hint:'Letters are replaced…'},
    {type:'mcq',q:'Frequency analysis easily breaks:',choices:['AES','RSA','Caesar cipher','Diffie-Hellman'],a:2},
    {type:'tf',q:'Vigenère was called "le chiffre indéchiffrable" (unbreakable) for centuries.',a:true},
  ],
  'sha256': [
    {type:'mcq',q:'SHA-256 output size is:',choices:['128 bits','160 bits','256 bits','512 bits'],a:2},
    {type:'mcq',q:'SHA-256 is a:',choices:['Symmetric cipher','Block cipher','Cryptographic hash function','Key exchange'],a:2},
    {type:'tf',q:'SHA-256 is a one-way function — you cannot reverse a hash to get the input.',a:true},
    {type:'fill',q:'SHA stands for Secure _____ Algorithm.',a:'Hash',hint:'The H in SHA…'},
    {type:'mcq',q:'A tiny change in input causes a completely different hash — this is called:',choices:['Diffusion','Confusion','Avalanche effect','Padding'],a:2},
    {type:'tf',q:'SHA-256 is used in Bitcoin mining and digital signatures.',a:true},
  ],
  'zkp-cave': [
    {type:'mcq',q:'Zero-Knowledge Proof lets you prove knowledge:',choices:['By sharing the secret','Without revealing the secret','Through a trusted party','By solving a hash'],a:1},
    {type:'mcq',q:'ZKP satisfies: Completeness, Soundness, and:',choices:['Efficiency','Zero-Knowledge property','Public verifiability','Reversibility'],a:2},
    {type:'tf',q:'In the Ali Baba cave analogy, the prover never reveals which path they know.',a:true},
    {type:'fill',q:'ZKP = Zero-_____ Proof.',a:'Knowledge',hint:'Nothing is revealed…'},
    {type:'mcq',q:'ZKP works through repeated:',choices:['Encryption cycles','Challenge-response rounds','Hash iterations','Key exchanges'],a:1},
    {type:'tf',q:'ZKPs are used in blockchain privacy and authentication systems.',a:true},
  ],
};
function launchQuizPlayground() {
  const expMeta = EXPERIMENTS.find(e => e.id === currentExp) || {};
  const accent = expMeta.accentColor || '#00e5ff';
  const questions = QUIZ_BANK[currentExp];
  const body = document.getElementById('pg-body');
  const titleEl = document.getElementById('pg-main-title');
  const subEl = document.getElementById('pg-main-sub');
  if(titleEl) titleEl.innerHTML = '🧠 QUIZ PLAYGROUND';
  if(subEl) subEl.textContent = (expMeta.title||'').toUpperCase();

  if (!questions || !questions.length) {
    body.innerHTML = `<button class="pg-back" onclick="pgBackToHub()">← Back to Hub</button>
      <div style="text-align:center;padding:60px;font-family:'Space Mono',monospace;color:#5050a0;">Quiz coming soon! 🚧</div>`;
    return;
  }

  let qIdx = 0, score = 0, answered = false;
  const shuffled = [...questions].sort(() => Math.random()-0.5).slice(0, Math.min(questions.length, 6));

  function renderQ() {
    if (qIdx >= shuffled.length) { showQResult(); return; }
    const q = shuffled[qIdx];
    const pct = (qIdx/shuffled.length)*100;
    const typeLabel = {mcq:'MULTIPLE CHOICE',fill:'FILL IN THE BLANK',tf:'TRUE OR FALSE',seq:'SEQUENCE'}[q.type];
    const typeColor = {mcq:'#00e5ff',fill:'#bf5fff',tf:'#ffe040',seq:'#ff4db8'}[q.type];

    let inputHtml = '';
    if (q.type==='mcq'||q.type==='seq') {
      inputHtml = `<div class="pg-choices">${q.choices.map((c,i)=>
        `<button class="pg-choice" onclick="pgAnswerMCQ(${i})">${String.fromCharCode(65+i)}. ${c}</button>`
      ).join('')}</div>`;
    } else if (q.type==='fill') {
      inputHtml = `<div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;">
        <input class="pg-fill-input" id="pg-fill-in" placeholder="Type your answer…" style="flex:1;min-width:200px;" onkeydown="if(event.key==='Enter')pgAnswerFill()">
        <button class="pg-game-btn primary" style="min-width:100px;" onclick="pgAnswerFill()">Submit →</button>
      </div>
      <div style="font-family:'Space Mono',monospace;font-size:10px;color:#3a3a6a;margin-top:6px;">💡 ${q.hint||'Think carefully!'}</div>`;
    } else if (q.type==='tf') {
      inputHtml = `<div style="display:flex;gap:12px;">
        <button class="pg-choice" style="font-size:15px;" onclick="pgAnswerTF(true)">✅ TRUE</button>
        <button class="pg-choice" style="font-size:15px;" onclick="pgAnswerTF(false)">❌ FALSE</button>
      </div>`;
    }

    body.innerHTML = `
      <button class="pg-back" onclick="pgBackToHub()">← Back to Hub</button>
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:6px;">
        <div style="font-family:'Space Mono',monospace;font-size:11px;color:#5050a0;">Q ${qIdx+1} / ${shuffled.length}</div>
        <div style="flex:1;"><div class="pg-progress-bar"><div class="pg-progress-fill" style="width:${pct}%"></div></div></div>
        <div style="font-family:'Orbitron',monospace;font-size:13px;color:${accent};font-weight:700;">⭐ ${score}</div>
      </div>
      <div class="pg-quiz-q">
        <div class="pg-quiz-type" style="background:${typeColor}22;color:${typeColor};border:1px solid ${typeColor}44;">${typeLabel}</div>
        <div style="font-size:14px;line-height:1.7;">${q.q}</div>
      </div>
      ${inputHtml}
      <div class="pg-feedback-badge" id="pg-qfb" style="background:#0d0d28;border:1px solid #2a2a5a;color:#5050a0;min-height:44px;display:flex;align-items:center;justify-content:center;">
        Choose an answer above
      </div>`;
    answered = false;
    if (q.type==='fill') setTimeout(()=>{const el=document.getElementById('pg-fill-in');if(el)el.focus();},80);
  }

  function setFB(msg, good) {
    const el = document.getElementById('pg-qfb'); if(!el) return;
    el.textContent = msg;
    el.style.background = good?'rgba(0,255,163,0.1)':'rgba(255,71,87,0.1)';
    el.style.borderColor = good?'#00ffa3':'#ff4757';
    el.style.color = good?'#00ffa3':'#ff8a8a';
  }

  window.pgAnswerMCQ = (idx) => {
    if (answered) return; answered = true;
    const q = shuffled[qIdx];
    const correct = idx === q.a;
    if (correct) score++;
    document.querySelectorAll('.pg-choice').forEach((btn,i)=>{
      btn.disabled=true;
      if(i===q.a) btn.classList.add('correct');
      else if(i===idx&&!correct) btn.classList.add('wrong');
    });
    setFB(correct?'🎉 Correct! +1 point':`❌ Answer: ${String.fromCharCode(65+q.a)}. ${q.choices[q.a]}`, correct);
    setTimeout(()=>{qIdx++;renderQ();},1400);
  };

  window.pgAnswerFill = () => {
    if (answered) return; answered = true;
    const input = document.getElementById('pg-fill-in'); if(!input) return;
    const val = input.value.trim().toLowerCase();
    const q = shuffled[qIdx];
    const correct = val===q.a.toLowerCase()||(q.a.toLowerCase().includes(val)&&val.length>=3);
    if (correct) score++;
    input.disabled=true;
    input.style.borderColor=correct?'#00ffa3':'#ff4757';
    input.style.color=correct?'#00ffa3':'#ff8a8a';
    setFB(correct?`🎉 Correct! "${q.a}"`:`❌ Answer: "${q.a}"`, correct);
    setTimeout(()=>{qIdx++;renderQ();},1600);
  };

  window.pgAnswerTF = (val) => {
    if (answered) return; answered = true;
    const q = shuffled[qIdx];
    const correct = val===q.a;
    if (correct) score++;
    document.querySelectorAll('.pg-choice').forEach(btn=>{
      btn.disabled=true;
      const isT=btn.textContent.includes('TRUE');
      if((isT&&q.a)||(!isT&&!q.a)) btn.classList.add('correct');
      else if((isT&&val&&!correct)||(!isT&&!val&&!correct)) btn.classList.add('wrong');
    });
    setFB(correct?'🎉 Correct! +1 point':`❌ Answer is ${q.a?'TRUE':'FALSE'}`, correct);
    setTimeout(()=>{qIdx++;renderQ();},1400);
  };

  function showQResult() {
    const pct = Math.round((score/shuffled.length)*100);
    const emoji = pct>=80?'🏆':pct>=60?'🎯':pct>=40?'📚':'🔄';
    const msg = pct>=80?'Outstanding!':pct>=60?'Good job!':pct>=40?'Keep studying!':'Practice more!';
    const color = pct>=80?'#00ffa3':pct>=60?accent:pct>=40?'#ffe040':'#ff8a8a';
    body.innerHTML = `
      <button class="pg-back" onclick="pgBackToHub()">← Back to Hub</button>
      <div style="text-align:center;padding:30px 20px;display:flex;flex-direction:column;align-items:center;gap:18px;">
        <div style="font-size:64px;">${emoji}</div>
        <div style="font-family:'Orbitron',monospace;font-size:28px;font-weight:900;color:${color};">${pct}%</div>
        <div style="font-family:'Space Mono',monospace;font-size:14px;color:#9090c0;">${score} / ${shuffled.length} correct — ${msg}</div>
        <div style="width:220px;height:8px;background:#1a1a3a;border-radius:8px;overflow:hidden;">
          <div style="width:${pct}%;height:100%;background:linear-gradient(90deg,${color},${accent});border-radius:8px;"></div>
        </div>
        <div style="display:flex;gap:12px;margin-top:12px;">
          <button class="pg-game-btn primary" onclick="launchQuizPlayground()">🔄 Try Again</button>
          <button class="pg-game-btn" onclick="pgBackToHub()">🏠 Hub</button>
        </div>
      </div>`;
  }

  renderQ();
}



// ══════════════════════════════════════════════════════════
//  GAME PLAYGROUND
// ══════════════════════════════════════════════════════════

function launchGamePlayground() {
  const expMeta = EXPERIMENTS.find(e=>e.id===currentExp)||{};
  const accent = expMeta.accentColor||'#ff4db8';
  const body = document.getElementById('pg-body');
  const titleEl = document.getElementById('pg-main-title');
  const subEl = document.getElementById('pg-main-sub');
  if(titleEl) titleEl.innerHTML = '🎮 GAME PLAYGROUND';
  if(subEl) subEl.textContent = (expMeta.title||'').toUpperCase();
  const gameMap = {
    'bubble-sort':    ()=>pgGameBubbleSort(accent),
    'selection-sort': ()=>pgGameSelectionSort(accent),
    'insertion-sort': ()=>pgGameInsertionSort(accent),
    'merge-sort':     ()=>pgGameMergeSort(accent),
    'quick-sort':     ()=>pgGameQuickSort(accent),
    'heap-sort':      ()=>pgGameHeapSort(accent),
    'n-queens':       ()=>pgGameNQueens(accent),
    'sudoku-solver':  ()=>pgGameSudoku(accent),
    'rat-in-maze':    ()=>pgGameMaze(accent),
    'bfs':            ()=>pgGameBFS(accent),
    'dfs':            ()=>pgGameDFS(accent),
    'dijkstra':       ()=>pgGameDijkstra(accent),
    'fibonacci-dp':   ()=>pgGameFibDP(accent),
    'lcs':            ()=>pgGameLCS(accent),
    'knapsack':       ()=>pgGameKnapsack(accent),
    'stack-ops':      ()=>pgGameStack(accent),
    'queue-ops':      ()=>pgGameQueue(accent),
    'bst-ops':        ()=>pgGameBST(accent),
    'avl-tree':       ()=>pgGameAVL(accent),
    'tree-traversal': ()=>pgGameTreeTraversal(accent),
    'red-black-tree': ()=>pgGameRBT(accent),
    'topo-sort':      ()=>pgGameTopo(accent),
    'kruskal':        ()=>pgGameKruskal(accent),
    'prim':           ()=>pgGamePrim(accent),
    'bellman-ford':   ()=>pgGameBellman(accent),
    'kmp':            ()=>pgGameKMP(accent),
    'rabin-karp':     ()=>pgGameRabinKarp(accent),
    'trie':           ()=>pgGameTrie(accent),
    'binary-search':  ()=>pgGameBinarySearch(accent),
    'interpolation-search': ()=>pgGameBinarySearch(accent),
    'activity-selection':   ()=>pgGameActivity(accent),
    'huffman-coding': ()=>pgGameHuffman(accent),
    'union-find':     ()=>pgGameUnionFind(accent),
    'convex-hull':    ()=>pgGameConvexHull(accent),
    'line-intersection':    ()=>pgGameLineIntersect(accent),
    'closest-pair':   ()=>pgGameClosestPair(accent),
    'polygon-area':   ()=>pgGamePolygonArea(accent),
    'subset-bitmask': ()=>pgGameBitmask(accent),
    'xor-tricks':     ()=>pgGameXOR(accent),
    'power-of-two':   ()=>pgGamePow2(accent),
    'bitwise-sieve':  ()=>pgGameSieve(accent),
    'binary-addition':()=>pgGameBinArith(accent,'add'),
    'binary-subtraction':()=>pgGameBinArith(accent,'sub'),
    'binary-multiplication':()=>pgGameBinArith(accent,'mul'),
    'binary-division':()=>pgGameBinArith(accent,'div'),
    'binary-addition-gates':()=>pgGameBinArith(accent,'add'),
    'binary-subtraction-gates':()=>pgGameBinArith(accent,'sub'),
    'binary-multiplication-gates':()=>pgGameBinArith(accent,'mul'),
    'binary-division-gates':()=>pgGameBinArith(accent,'div'),
    'linear-regression':()=>pgGameLinReg(accent),
    'knn':            ()=>pgGameKNN(accent),
    'kmeans':         ()=>pgGameKMeans(accent),
    'decision-tree':  ()=>pgGameDecisionTree(accent),
    'perceptron':     ()=>pgGamePerceptron(accent),
    'ddos-attack':    ()=>pgGameNetSec(accent,'ddos'),
    'sql-injection':  ()=>pgGameNetSec(accent,'sql'),
    'firewall-filter':()=>pgGameNetSec(accent,'firewall'),
    'mitm-attack':    ()=>pgGameNetSec(accent,'mitm'),
    'tower-of-hanoi': ()=>pgGameTowerHanoi(accent),
    'permutations':   ()=>pgGamePermutations(accent),
    'rsa':            ()=>pgGameCrypto(accent,'rsa'),
    'diffie-hellman': ()=>pgGameCrypto(accent,'dh'),
    'aes-round':      ()=>pgGameCrypto(accent,'aes'),
    'caesar-vigenere':()=>pgGameCrypto(accent,'caesar'),
    'sha256':         ()=>pgGameCrypto(accent,'sha'),
    'zkp-cave':       ()=>pgGameCrypto(accent,'zkp'),
  };
  const fn = gameMap[currentExp];
  if (fn) { fn(); }
  else {
    body.innerHTML = `<button class="pg-back" onclick="pgBackToHub()">← Back to Hub</button>
      <div style="text-align:center;padding:60px;font-family:'Space Mono',monospace;color:#5050a0;">Game coming soon! 🎮<br><br>🚧</div>`;
  }
}

function pgGameShell(accent, title, instructions, statsHtml, boardId, feedbackId, buttonsHtml) {
  const body = document.getElementById('pg-body');
  body.innerHTML = `
    <button class="pg-back" onclick="pgBackToHub()">← Back to Hub</button>
    <div style="background:#0d0d28;border:1px solid #2a2a5a;border-radius:14px;padding:14px 18px;font-family:'Space Mono',monospace;font-size:12px;color:#7070a0;line-height:1.7;">
      <span style="color:${accent};font-weight:700;">🎮 ${title}:</span> ${instructions}
    </div>
    <div style="display:flex;gap:10px;flex-wrap:wrap;">${statsHtml}</div>
    <div class="pg-game-canvas-wrap" style="min-height:200px;position:relative;">
      <div id="${boardId}" style="width:100%;display:flex;justify-content:center;align-items:flex-end;gap:8px;padding:12px;flex-wrap:wrap;min-height:180px;"></div>
    </div>
    <div id="${feedbackId}" style="font-family:'Space Mono',monospace;font-size:12px;color:#9090c0;text-align:center;padding:10px;background:#0d0d28;border:1px solid #2a2a5a;border-radius:10px;transition:color 0.3s;"></div>
    <div style="display:flex;gap:10px;flex-wrap:wrap;">${buttonsHtml}</div>`;
}

function pgStat(id, label, color) {
  return `<div class="pg-game-stat" style="border-color:${color}33;">${label}<span id="${id}" style="color:${color};">0</span></div>`;
}

/* ── Bubble Sort: swap ADJACENT only ── */
function pgGameBubbleSort(accent) {
  let arr, selected, moves, swaps, done, timer, tv;
  function newGame() {
    const N=7; arr=Array.from({length:N},(_,i)=>i+1).sort(()=>Math.random()-0.5);
    while(arr.every((v,i)=>!i||arr[i-1]<=v)) arr.sort(()=>Math.random()-0.5);
    selected=null;moves=0;swaps=0;done=false;tv=0;
    if(timer)clearInterval(timer);
    timer=setInterval(()=>{tv++;const el=document.getElementById('bs-time');if(el)el.textContent=tv+'s';else clearInterval(timer);},1000);
    render();
  }
  function isSorted(){return arr.every((v,i)=>!i||arr[i-1]<=v);}
  function render(){
    const wrap=document.getElementById('bs-board');if(!wrap)return;
    const sorted=[...arr].sort((a,b)=>a-b);
    wrap.innerHTML=arr.map((v,i)=>{
      const isSel=i===selected, isOk=v===sorted[i];
      const bg=isSel?'#ff4db8':(isOk?'rgba(0,255,163,0.8)':accent);
      const brd=isSel?'#ff4db8':(isOk?'#00ffa3':'transparent');
      return `<div onclick="pgBSClick(${i})" style="width:50px;height:${26+v*16}px;background:${bg};border:2px solid ${brd};border-radius:8px 8px 4px 4px;cursor:pointer;display:flex;align-items:flex-end;justify-content:center;padding-bottom:5px;font-family:'Orbitron',monospace;font-size:13px;font-weight:700;color:#0a0a1a;transition:all 0.15s;${isSel?'transform:translateY(-8px) scale(1.08);':''}">${v}</div>`;
    }).join('');
    if(done){
      wrap.style.position='relative';
      wrap.innerHTML+=`<div style="position:absolute;inset:0;background:rgba(4,4,16,0.88);border-radius:12px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;z-index:2;">
        <div style="font-size:44px;">🎉</div>
        <div style="font-family:'Orbitron',monospace;font-size:18px;color:#00ffa3;font-weight:900;">SORTED!</div>
        <div style="font-family:'Space Mono',monospace;font-size:12px;color:#9090c0;">${swaps} swaps · ${tv}s</div>
        <button class="pg-game-btn primary" onclick="pgGameBubbleSort('${accent}')" style="margin-top:6px;">Play Again</button>
      </div>`;
    }
    const ms=document.getElementById('bs-moves');if(ms)ms.textContent=moves;
    const sw=document.getElementById('bs-swaps');if(sw)sw.textContent=swaps;
    const fb=document.getElementById('bs-fb');
    if(fb&&!done){const w=arr.filter((v,i)=>v!==sorted[i]).length;fb.textContent=w?`${w} elements out of place — only adjacent swaps!`:'🏆 Sorted!';fb.style.color=w?'#9090c0':'#00ffa3';}
  }
  window.pgBSClick=(i)=>{
    if(done)return;moves++;
    if(selected===null){selected=i;}
    else{
      if(Math.abs(selected-i)===1){[arr[selected],arr[i]]=[arr[i],arr[selected]];swaps++;if(isSorted()){done=true;clearInterval(timer);}}
      else{const fb=document.getElementById('bs-fb');if(fb){fb.textContent='⚠️ Only ADJACENT swaps! (Bubble Sort rule)';fb.style.color='#ff8a8a';}}
      selected=null;
    }
    render();
  };
  pgGameShell(accent,'Bubble Sort Game',
    'Click a bar to select it (it lifts), then click an <strong style="color:#ffe040;">adjacent</strong> bar to swap. Sort <strong style="color:#00ffa3;">ascending</strong> — left small, right large.',
    pgStat('bs-moves','Clicks',accent)+pgStat('bs-swaps','Swaps','#ff4db8')+pgStat('bs-time','Time','#ffe040'),
    'bs-board','bs-fb',
    `<button class="pg-game-btn primary" onclick="pgGameBubbleSort('${accent}')">↺ New Game</button>
     <button class="pg-game-btn" style="border-color:rgba(255,224,64,0.4);color:#ffe040;" onclick="pgBSHint()">💡 Hint</button>`
  );
  window.pgBSHint=()=>{
    for(let i=0;i<arr.length-1;i++){if(arr[i]>arr[i+1]){const fb=document.getElementById('bs-fb');if(fb){fb.textContent=`💡 Swap [${arr[i]}] at pos ${i} ↔ [${arr[i+1]}] at pos ${i+1}`;fb.style.color='#ffe040';}selected=i;render();setTimeout(()=>{selected=null;render();},1200);return;}}
  };
  newGame();
}

/* ── Selection Sort: find min → click destination ── */
function pgGameSelectionSort(accent) {
  let arr, sortedTo, selected, done, timer, tv, swaps;
  function newGame(){
    arr=Array.from({length:7},(_,i)=>i+1).sort(()=>Math.random()-0.5);
    while(arr.every((v,i)=>!i||arr[i-1]<=v))arr.sort(()=>Math.random()-0.5);
    sortedTo=0;selected=null;done=false;tv=0;swaps=0;
    if(timer)clearInterval(timer);
    timer=setInterval(()=>{tv++;const el=document.getElementById('ss-time');if(el)el.textContent=tv+'s';else clearInterval(timer);},1000);
    render();
  }
  function render(){
    const wrap=document.getElementById('ss-board');if(!wrap)return;
    const trueMin=arr.indexOf(Math.min(...arr.slice(sortedTo)));
    wrap.innerHTML=arr.map((v,i)=>{
      const locked=i<sortedTo, isSel=i===selected, isMin=i===trueMin&&!locked&&selected===null;
      const bg=locked?'rgba(0,255,163,0.7)':(isSel?'#ffe040':(isMin?'rgba(255,224,64,0.3)':accent));
      const brd=locked?'#00ffa3':(isSel?'#ffe040':(isMin?'rgba(255,224,64,0.6)':'transparent'));
      return `<div onclick="pgSSClick(${i})" style="width:50px;height:${26+v*16}px;background:${bg};border:2px solid ${brd};border-radius:8px 8px 4px 4px;cursor:${locked?'default':'pointer'};display:flex;align-items:flex-end;justify-content:center;padding-bottom:5px;font-family:'Orbitron',monospace;font-size:13px;font-weight:700;color:#0a0a1a;transition:all 0.15s;${isSel?'transform:translateY(-8px) scale(1.08);':''}">${v}</div>`;
    }).join('');
    if(done){
      wrap.style.position='relative';
      wrap.innerHTML+=`<div style="position:absolute;inset:0;background:rgba(4,4,16,0.88);border-radius:12px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;z-index:2;">
        <div style="font-size:44px;">🎉</div><div style="font-family:'Orbitron',monospace;font-size:18px;color:#00ffa3;font-weight:900;">SORTED!</div>
        <div style="font-family:'Space Mono',monospace;font-size:12px;color:#9090c0;">${swaps} swaps · ${tv}s</div>
        <button class="pg-game-btn primary" onclick="pgGameSelectionSort('${accent}')" style="margin-top:6px;">Play Again</button>
      </div>`;
    }
    const sw=document.getElementById('ss-swaps');if(sw)sw.textContent=swaps;
  }
  window.pgSSClick=(i)=>{
    if(done||i<sortedTo)return;
    const fb=document.getElementById('ss-fb');
    const trueMin=arr.indexOf(Math.min(...arr.slice(sortedTo)));
    if(selected===null){
      if(i===trueMin){selected=i;if(fb){fb.textContent=`✅ Min [${arr[i]}] found! Now click position ${sortedTo} to place it.`;fb.style.color='#00ffa3';}}
      else{if(fb){fb.textContent=`❌ Not the minimum! Find smallest in pos ${sortedTo}–${arr.length-1}.`;fb.style.color='#ff8a8a';}}
    } else {
      if(i===sortedTo){[arr[selected],arr[sortedTo]]=[arr[sortedTo],arr[selected]];swaps++;sortedTo++;selected=null;
        if(sortedTo>=arr.length-1)done=true;
        if(done)clearInterval(timer);
        if(fb&&!done){fb.textContent=`✅ Placed! Find min in pos ${sortedTo}–${arr.length-1}.`;fb.style.color='#00ffa3';}
      } else {if(fb){fb.textContent=`❌ Place it at position ${sortedTo}!`;fb.style.color='#ff8a8a';}}
    }
    render();
  };
  pgGameShell(accent,'Selection Sort Game',
    'Step 1: click the <strong style="color:#ffe040;">minimum</strong> element in the unsorted area. Step 2: click <strong style="color:#00ffa3;">position '+(0)+'</strong> to place it. Green = locked!',
    pgStat('ss-swaps','Swaps',accent)+pgStat('ss-time','Time','#ffe040'),
    'ss-board','ss-fb',`<button class="pg-game-btn primary" onclick="pgGameSelectionSort('${accent}')">↺ New Game</button>`);
  newGame();
}

/* ── Insertion Sort: click where to insert ── */
function pgGameInsertionSort(accent) {
  let arr, sortedTo, done, timer, tv, moves;
  function newGame(){
    arr=Array.from({length:6},(_,i)=>i+1).sort(()=>Math.random()-0.5);
    while(arr.every((v,i)=>!i||arr[i-1]<=v))arr.sort(()=>Math.random()-0.5);
    sortedTo=1;done=false;tv=0;moves=0;
    if(timer)clearInterval(timer);
    timer=setInterval(()=>{tv++;const el=document.getElementById('is-time');if(el)el.textContent=tv+'s';else clearInterval(timer);},1000);
    render();
  }
  function render(){
    const wrap=document.getElementById('is-board');if(!wrap)return;
    const cur=arr[sortedTo];
    wrap.innerHTML=arr.map((v,i)=>{
      const locked=i<sortedTo, isCur=i===sortedTo;
      const bg=locked?'rgba(0,229,255,0.6)':(isCur?'#ffe040':accent);
      const brd=locked?'rgba(0,229,255,0.5)':(isCur?'#ffe040':'transparent');
      return `<div onclick="${locked?`pgISClick(${i})`:'null'}" style="width:50px;height:${26+v*16}px;background:${bg};border:2px solid ${brd};border-radius:8px 8px 4px 4px;cursor:${locked?'pointer':'default'};display:flex;align-items:flex-end;justify-content:center;padding-bottom:5px;font-family:'Orbitron',monospace;font-size:13px;font-weight:700;color:#0a0a1a;transition:all 0.15s;${isCur?'transform:translateY(-10px);':''}">${v}</div>`;
    }).join('');
    if(done){
      wrap.style.position='relative';
      wrap.innerHTML+=`<div style="position:absolute;inset:0;background:rgba(4,4,16,0.88);border-radius:12px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;z-index:2;">
        <div style="font-size:44px;">🎉</div><div style="font-family:'Orbitron',monospace;font-size:18px;color:#00ffa3;font-weight:900;">SORTED!</div>
        <div style="font-family:'Space Mono',monospace;font-size:12px;color:#9090c0;">${moves} moves · ${tv}s</div>
        <button class="pg-game-btn primary" onclick="pgGameInsertionSort('${accent}')" style="margin-top:6px;">Play Again</button>
      </div>`;
    }
    const mv=document.getElementById('is-moves');if(mv)mv.textContent=moves;
    const fb=document.getElementById('is-fb');
    if(fb&&!done)fb.textContent=`Yellow [${cur}] needs inserting. Click the correct spot in the blue sorted region.`;
  }
  window.pgISClick=(i)=>{
    if(done||i>=sortedTo)return;moves++;
    const cur=arr[sortedTo];
    let correctPos=0;
    for(;correctPos<sortedTo;correctPos++)if(cur<arr[correctPos])break;
    const fb=document.getElementById('is-fb');
    if(i===correctPos||(correctPos===sortedTo&&i===sortedTo-1)){
      arr.splice(sortedTo,1);arr.splice(correctPos,0,cur);
      if(fb){fb.textContent=`✅ Inserted [${cur}] at pos ${correctPos}!`;fb.style.color='#00ffa3';}
      sortedTo++;
      if(sortedTo>=arr.length)done=true;
      if(done)clearInterval(timer);
    } else {if(fb){fb.textContent=`❌ Wrong! [${cur}] should go at index ${correctPos}.`;fb.style.color='#ff8a8a';}}
    render();
  };
  pgGameShell(accent,'Insertion Sort Game',
    'The <strong style="color:#ffe040;">yellow</strong> bar is next to insert. Click the correct position in the <strong style="color:#00e5ff;">blue sorted region</strong> where it belongs!',
    pgStat('is-moves','Moves',accent)+pgStat('is-time','Time','#ffe040'),
    'is-board','is-fb',`<button class="pg-game-btn primary" onclick="pgGameInsertionSort('${accent}')">↺ New Game</button>`);
  newGame();
}

/* ── Merge Sort: click correct merge order ── */
function pgGameMergeSort(accent) {
  let left, right, result, lPtr, rPtr, done, timer, tv, errors;
  function newGame(){
    const all=Array.from({length:6},(_,i)=>i+1).sort(()=>Math.random()-0.5);
    left=[...all.slice(0,3)].sort((a,b)=>a-b);right=[...all.slice(3)].sort((a,b)=>a-b);
    result=[];lPtr=0;rPtr=0;done=false;tv=0;errors=0;
    if(timer)clearInterval(timer);
    timer=setInterval(()=>{tv++;const el=document.getElementById('ms-time');if(el)el.textContent=tv+'s';else clearInterval(timer);},1000);
    render();
  }
  function render(){
    const wrap=document.getElementById('ms-board');if(!wrap)return;
    const lV=lPtr<left.length?left[lPtr]:Infinity, rV=rPtr<right.length?right[rPtr]:Infinity;
    const makeRow=(arr,ptr,color,side)=>arr.map((v,i)=>{
      const picked=i<ptr, isNext=i===ptr;
      return `<div onclick="${isNext?`pgMGClick('${side}')`:''}" style="width:44px;height:44px;display:flex;align-items:center;justify-content:center;background:${picked?'#111128':isNext?color:'rgba('+hexToRgbStr(color)+',0.2)'};color:${picked?'#2a2a5a':isNext?'#0a0a1a':color};border:2px solid ${picked?'#111128':isNext?color:'rgba('+hexToRgbStr(color)+',0.3)'};border-radius:8px;font-family:'Orbitron',monospace;font-size:15px;font-weight:700;cursor:${isNext?'pointer':'default'};transition:all 0.15s;${isNext?'box-shadow:0 0 14px '+color+'66;transform:scale(1.1);':''}${picked?'text-decoration:line-through;':''}">${v}</div>`;
    }).join('');
    const mergedHtml=result.map(v=>`<div style="width:44px;height:44px;display:flex;align-items:center;justify-content:center;background:rgba(0,255,163,0.25);color:#00ffa3;border:2px solid rgba(0,255,163,0.4);border-radius:8px;font-family:'Orbitron',monospace;font-size:15px;font-weight:700;">${v}</div>`).join('')
      +Array(left.length+right.length-result.length).fill('<div style="width:44px;height:44px;border:2px dashed #2a2a5a;border-radius:8px;opacity:0.3;"></div>').join('');
    wrap.innerHTML=`<div style="display:flex;flex-direction:column;gap:14px;width:100%;padding:8px;">
      <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;"><span style="font-family:'Space Mono',monospace;font-size:10px;color:#00e5ff;min-width:50px;">LEFT:</span>${makeRow(left,lPtr,'#00e5ff','L')}</div>
      <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;"><span style="font-family:'Space Mono',monospace;font-size:10px;color:#bf5fff;min-width:50px;">RIGHT:</span>${makeRow(right,rPtr,'#bf5fff','R')}</div>
      <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;"><span style="font-family:'Space Mono',monospace;font-size:10px;color:#00ffa3;min-width:50px;">MERGED:</span>${mergedHtml}</div>
    </div>`;
    if(done){
      wrap.style.position='relative';
      wrap.innerHTML+=`<div style="position:absolute;inset:0;background:rgba(4,4,16,0.88);border-radius:12px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;z-index:2;">
        <div style="font-size:44px;">🎉</div><div style="font-family:'Orbitron',monospace;font-size:18px;color:#00ffa3;font-weight:900;">MERGED!</div>
        <div style="font-family:'Space Mono',monospace;font-size:12px;color:#9090c0;">${errors} errors · ${tv}s</div>
        <button class="pg-game-btn primary" onclick="pgGameMergeSort('${accent}')" style="margin-top:6px;">Play Again</button>
      </div>`;
    }
    const er=document.getElementById('ms-errs');if(er)er.textContent=errors;
    const fb=document.getElementById('ms-fb');
    if(fb&&!done){
      if(lPtr>=left.length)fb.textContent='LEFT done — click remaining RIGHT cards!';
      else if(rPtr>=right.length)fb.textContent='RIGHT done — click remaining LEFT cards!';
      else fb.textContent=`Pick smaller: LEFT [${lV}] vs RIGHT [${rV}]. Click the highlighted card!`;
      fb.style.color='#9090c0';
    }
  }
  function hexToRgbStr(h){try{return `${parseInt(h.slice(1,3),16)},${parseInt(h.slice(3,5),16)},${parseInt(h.slice(5,7),16)}`;}catch{return '128,128,255';}}
  window.pgMGClick=(side)=>{
    if(done)return;
    const lV=lPtr<left.length?left[lPtr]:Infinity,rV=rPtr<right.length?right[rPtr]:Infinity;
    const correct=lV<=rV?'L':'R';
    const fb=document.getElementById('ms-fb');
    if(side===correct){
      if(side==='L'){result.push(left[lPtr]);lPtr++;}else{result.push(right[rPtr]);rPtr++;}
      if(fb){fb.textContent=`✅ Correct!`;fb.style.color='#00ffa3';}
      if(lPtr>=left.length&&rPtr>=right.length){done=true;clearInterval(timer);}
    } else {errors++;if(fb){fb.textContent=`❌ Wrong side! ${Math.min(lV,rV)} is smaller.`;fb.style.color='#ff8a8a';}}
    render();
  };
  const body=document.getElementById('pg-body');
  body.innerHTML=`<button class="pg-back" onclick="pgBackToHub()">← Back to Hub</button>
    <div style="background:#0d0d28;border:1px solid #2a2a5a;border-radius:14px;padding:14px 18px;font-family:'Space Mono',monospace;font-size:12px;color:#7070a0;line-height:1.7;">
      <span style="color:${accent};font-weight:700;">🎮 Merge Game:</span> Two sorted halves. Click the <strong style="color:#ffe040;">highlighted card</strong> from LEFT or RIGHT that should come next in the merged output — always pick the smaller!
    </div>
    <div style="display:flex;gap:10px;">${pgStat('ms-errs','Errors','#ff8a8a')}${pgStat('ms-time','Time',accent)}</div>
    <div class="pg-game-canvas-wrap" style="min-height:200px;position:relative;"><div id="ms-board" style="width:100%;"></div></div>
    <div id="ms-fb" style="font-family:'Space Mono',monospace;font-size:12px;color:#9090c0;text-align:center;padding:10px;background:#0d0d28;border:1px solid #2a2a5a;border-radius:10px;"></div>
    <div style="display:flex;gap:10px;"><button class="pg-game-btn primary" onclick="pgGameMergeSort('${accent}')">↺ New Game</button></div>`;
  newGame();
}

/* ── Quick Sort: pick pivot, classify elements ── */
function pgGameQuickSort(accent) {
  let arr, pivot, pivotIdx, less, greater, done, timer, tv, errors, phase;
  function newGame(){
    arr=Array.from({length:7},(_,i)=>i+1).sort(()=>Math.random()-0.5);
    while(arr.every((v,i)=>!i||arr[i-1]<=v))arr.sort(()=>Math.random()-0.5);
    pivot=null;pivotIdx=null;less=[];greater=[];done=false;tv=0;errors=0;phase='pick';
    if(timer)clearInterval(timer);
    timer=setInterval(()=>{tv++;const el=document.getElementById('qs-time');if(el)el.textContent=tv+'s';else clearInterval(timer);},1000);
    render();
  }
  function render(){
    const wrap=document.getElementById('qs-board');if(!wrap)return;
    if(phase==='pick'){
      wrap.innerHTML=`<div style="display:flex;flex-direction:column;gap:12px;width:100%;padding:8px;align-items:center;">
        <div style="font-family:'Space Mono',monospace;font-size:11px;color:#ffe040;">👆 Click any element to choose as PIVOT</div>
        <div style="display:flex;gap:8px;align-items:flex-end;">${arr.map((v,i)=>`<div onclick="pgQSPick(${i})" style="width:50px;height:${26+v*16}px;background:${accent};border-radius:8px 8px 4px 4px;display:flex;align-items:flex-end;justify-content:center;padding-bottom:5px;cursor:pointer;font-family:'Orbitron',monospace;font-size:13px;font-weight:700;color:#0a0a1a;transition:all 0.15s;" onmouseover="this.style.transform='translateY(-6px)'" onmouseout="this.style.transform='none'">${v}</div>`).join('')}</div>
      </div>`;
    } else {
      const remaining=arr.filter((_,i)=>i!==pivotIdx);
      wrap.innerHTML=`<div style="display:flex;flex-direction:column;gap:14px;width:100%;padding:8px;">
        <div style="text-align:center;font-family:'Space Mono',monospace;font-size:11px;color:#7070a0;">
          PIVOT = <span style="color:#ffe040;font-size:16px;font-weight:700;">${pivot}</span> &nbsp;·&nbsp;
          Click <span style="color:#00e5ff;">&lt; LESS</span> or <span style="color:#ff4db8;">&gt; GREATER</span> for each
        </div>
        <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;">${remaining.map(v=>{
          const inL=less.includes(v),inG=greater.includes(v);
          return `<div style="display:flex;flex-direction:column;gap:4px;align-items:center;">
            <div onclick="pgQSSort(${v},'L')" style="padding:6px 12px;border-radius:6px;cursor:pointer;background:${inL?'rgba(0,229,255,0.3)':'rgba(0,229,255,0.07)'};border:1px solid ${inL?'#00e5ff':'rgba(0,229,255,0.2)'};color:#00e5ff;font-family:'Space Mono',monospace;font-size:9px;transition:all 0.15s;">&lt; LESS</div>
            <div style="width:44px;height:44px;background:${inL?'rgba(0,229,255,0.25)':inG?'rgba(255,77,184,0.25)':accent};display:flex;align-items:center;justify-content:center;border-radius:8px;font-family:'Orbitron',monospace;font-size:15px;font-weight:700;color:#0a0a1a;border:2px solid ${inL?'#00e5ff':inG?'#ff4db8':'transparent'};">${v}</div>
            <div onclick="pgQSSort(${v},'G')" style="padding:6px 12px;border-radius:6px;cursor:pointer;background:${inG?'rgba(255,77,184,0.3)':'rgba(255,77,184,0.07)'};border:1px solid ${inG?'#ff4db8':'rgba(255,77,184,0.2)'};color:#ff4db8;font-family:'Space Mono',monospace;font-size:9px;transition:all 0.15s;">&gt; GREATER</div>
          </div>`;
        }).join('')}</div>
        ${less.length+greater.length===remaining.length?`<div style="display:flex;justify-content:center;"><button class="pg-game-btn primary" style="min-width:160px;" onclick="pgQSVerify()">✅ Check Partition</button></div>`:''}
      </div>`;
    }
    if(done){
      wrap.style.position='relative';
      wrap.innerHTML+=`<div style="position:absolute;inset:0;background:rgba(4,4,16,0.88);border-radius:12px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;z-index:2;">
        <div style="font-size:44px;">⚡</div><div style="font-family:'Orbitron',monospace;font-size:18px;color:#00ffa3;font-weight:900;">PARTITIONED!</div>
        <div style="font-family:'Space Mono',monospace;font-size:11px;color:#7070a0;">[${less.sort((a,b)=>a-b).join(',')}] | ${pivot} | [${greater.sort((a,b)=>a-b).join(',')}]</div>
        <div style="font-family:'Space Mono',monospace;font-size:12px;color:#9090c0;">${errors} errors · ${tv}s</div>
        <button class="pg-game-btn primary" onclick="pgGameQuickSort('${accent}')" style="margin-top:6px;">Play Again</button>
      </div>`;
    }
    const er=document.getElementById('qs-errs');if(er)er.textContent=errors;
  }
  window.pgQSPick=(i)=>{pivotIdx=i;pivot=arr[i];phase='sort';less=[];greater=[];render();};
  window.pgQSSort=(v,side)=>{less=less.filter(x=>x!==v);greater=greater.filter(x=>x!==v);if(side==='L')less.push(v);else greater.push(v);render();};
  window.pgQSVerify=()=>{
    const remaining=arr.filter((_,i)=>i!==pivotIdx);
    const wrong=remaining.filter(v=>(v<pivot&&!less.includes(v))||(v>pivot&&!greater.includes(v))).length;
    const fb=document.getElementById('qs-fb');
    if(wrong===0){done=true;clearInterval(timer);}
    else{errors++;if(fb){fb.textContent=`❌ ${wrong} elements in wrong bucket!`;fb.style.color='#ff8a8a';}}
    render();
  };
  const body=document.getElementById('pg-body');
  body.innerHTML=`<button class="pg-back" onclick="pgBackToHub()">← Back to Hub</button>
    <div style="background:#0d0d28;border:1px solid #2a2a5a;border-radius:14px;padding:14px 18px;font-family:'Space Mono',monospace;font-size:12px;color:#7070a0;line-height:1.7;">
      <span style="color:${accent};font-weight:700;">🎮 Quick Sort Game:</span> Choose a pivot, then classify each remaining element as LESS or GREATER. Just like real partitioning!
    </div>
    <div style="display:flex;gap:10px;">${pgStat('qs-errs','Errors','#ff8a8a')}${pgStat('qs-time','Time',accent)}</div>
    <div class="pg-game-canvas-wrap" style="min-height:200px;position:relative;"><div id="qs-board" style="width:100%;"></div></div>
    <div id="qs-fb" style="font-family:'Space Mono',monospace;font-size:12px;color:#9090c0;text-align:center;padding:10px;background:#0d0d28;border:1px solid #2a2a5a;border-radius:10px;">Pick any element as pivot!</div>
    <div style="display:flex;gap:10px;"><button class="pg-game-btn primary" onclick="pgGameQuickSort('${accent}')">↺ New Game</button></div>`;
  newGame();
}

/* ── Heap Sort: fix violations ── */
function pgGameHeapSort(accent) {
  let arr, done, timer, tv, moves;
  function newGame(){
    arr=[8,3,7,1,5,9,2,6,4].sort(()=>Math.random()-0.5);
    done=false;tv=0;moves=0;
    if(timer)clearInterval(timer);
    timer=setInterval(()=>{tv++;const el=document.getElementById('hs-time');if(el)el.textContent=tv+'s';else clearInterval(timer);},1000);
    render();
  }
  function findV(){for(let i=0;i<Math.floor(arr.length/2);i++){const l=2*i+1,r=2*i+2;if(l<arr.length&&arr[l]>arr[i])return[i,l];if(r<arr.length&&arr[r]>arr[i])return[i,r];}return null;}
  function render(){
    const wrap=document.getElementById('hs-board');if(!wrap)return;
    const v=findV();
    const rows=[[0],[1,2],[3,4,5,6],[7,8]];
    let html=`<div style="display:flex;flex-direction:column;gap:10px;align-items:center;width:100%;padding:10px;">`;
    rows.forEach(row=>{
      html+=`<div style="display:flex;gap:12px;justify-content:center;">`;
      row.forEach(i=>{
        if(i>=arr.length){html+=`<div style="width:42px;"></div>`;return;}
        const isV=v&&(i===v[0]||i===v[1]);
        html+=`<div onclick="pgHSClick(${i})" style="width:42px;height:42px;display:flex;align-items:center;justify-content:center;border-radius:50%;font-family:'Orbitron',monospace;font-size:13px;font-weight:700;cursor:${isV?'pointer':'default'};transition:all 0.15s;background:${isV?'rgba(255,71,87,0.25)':'rgba(191,95,255,0.15)'};color:${isV?'#ff8a8a':'#bf5fff'};border:2px solid ${isV?'#ff4757':'rgba(191,95,255,0.3)'};${isV?'animation:pgGlow 1s infinite;':''}">${arr[i]}</div>`;
      });
      html+=`</div>`;
    });
    html+=`</div>`;
    wrap.innerHTML=html;
    if(done){
      wrap.style.position='relative';
      wrap.innerHTML+=`<div style="position:absolute;inset:0;background:rgba(4,4,16,0.88);border-radius:12px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;z-index:2;">
        <div style="font-size:44px;">🔺</div><div style="font-family:'Orbitron',monospace;font-size:18px;color:#00ffa3;font-weight:900;">MAX-HEAP BUILT!</div>
        <div style="font-family:'Space Mono',monospace;font-size:12px;color:#9090c0;">${moves} swaps · ${tv}s</div>
        <button class="pg-game-btn primary" onclick="pgGameHeapSort('${accent}')" style="margin-top:6px;">Play Again</button>
      </div>`;
    }
    const mv=document.getElementById('hs-moves');if(mv)mv.textContent=moves;
    const fb=document.getElementById('hs-fb');
    if(fb&&!done){
      if(v){fb.textContent=`🔴 Violation! Parent ${arr[v[0]]} < Child ${arr[v[1]]}. Click either red node to swap!`;fb.style.color='#ff8a8a';}
      else{fb.textContent='✅ Max-Heap valid! All parents ≥ children. 🏆';fb.style.color='#00ffa3';setTimeout(()=>{done=true;clearInterval(timer);render();},800);}
    }
  }
  window.pgHSClick=(i)=>{const v=findV();if(!v||(!( i===v[0]||i===v[1])))return;[arr[v[0]],arr[v[1]]]=[arr[v[1]],arr[v[0]]];moves++;render();};
  pgGameShell(accent,'Heap Sort Game',
    'Fix the max-heap! When you see <strong style="color:#ff4757;">red nodes</strong> (parent &lt; child), click either to swap them. Build a valid max-heap!',
    pgStat('hs-moves','Swaps',accent)+pgStat('hs-time','Time','#ffe040'),
    'hs-board','hs-fb',`<button class="pg-game-btn primary" onclick="pgGameHeapSort('${accent}')">↺ New Game</button>`);
  newGame();
}

/* ── N-Queens: place queens ── */
function pgGameNQueens(accent) {
  let N=6, board, done, timer, tv, moves;
  function newGame(n){
    N=n||6;board=Array(N).fill(-1);done=false;tv=0;moves=0;
    if(timer)clearInterval(timer);
    timer=setInterval(()=>{tv++;const el=document.getElementById('nq-time');if(el)el.textContent=tv+'s';else clearInterval(timer);},1000);
    render();
  }
  function confRows(){const s=new Set();for(let a=0;a<N;a++)for(let b=a+1;b<N;b++){if(board[a]!==-1&&board[b]!==-1&&(board[a]===board[b]||Math.abs(board[a]-board[b])===Math.abs(a-b))){s.add(a);s.add(b);}}return s;}
  function render(){
    const wrap=document.getElementById('nq-board');if(!wrap)return;
    const cs=confRows(),cell=Math.min(54,Math.floor(460/N));
    let html='<div style="display:flex;flex-direction:column;gap:2px;padding:6px;">';
    for(let r=0;r<N;r++){
      html+='<div style="display:flex;gap:2px;">';
      for(let c=0;c<N;c++){
        const hasQ=board[r]===c,isConf=hasQ&&cs.has(r),light=(r+c)%2===0;
        html+=`<div onclick="pgNQClick(${r},${c})" style="width:${cell}px;height:${cell}px;display:flex;align-items:center;justify-content:center;background:${isConf?'rgba(255,71,87,0.28)':hasQ?'rgba(0,255,163,0.18)':light?'#141432':'#0e0e28'};border:1px solid ${isConf?'rgba(255,71,87,0.4)':hasQ?'rgba(0,255,163,0.3)':'rgba(191,95,255,0.08)'};border-radius:4px;cursor:pointer;font-size:${cell*.5}px;transition:all 0.12s;user-select:none;" onmouseover="${!hasQ?'this.style.background=\'rgba(191,95,255,0.15)\'':''}" onmouseout="${!hasQ?'this.style.background=\''+(light?'#141432':'#0e0e28')+'\'':''}">${hasQ?(isConf?'♛':'👑'):''}</div>`;
      }
      html+='</div>';
    }
    html+='</div>';
    wrap.innerHTML=html;
    if(done){
      wrap.style.position='relative';
      wrap.innerHTML+=`<div style="position:absolute;inset:0;background:rgba(4,4,16,0.88);border-radius:12px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;z-index:2;">
        <div style="font-size:44px;">👑</div><div style="font-family:'Orbitron',monospace;font-size:18px;color:#00ffa3;font-weight:900;">${N}-QUEENS SOLVED!</div>
        <div style="font-family:'Space Mono',monospace;font-size:12px;color:#9090c0;">${moves} moves · ${tv}s</div>
        <div style="display:flex;gap:8px;margin-top:6px;">
          <button class="pg-game-btn primary" onclick="pgGameNQueens('${accent}')">6×6 Again</button>
          <button class="pg-game-btn" style="border-color:rgba(232,121,249,0.4);color:#e879f9;" onclick="window.nqNew(8)">8×8 Hard</button>
        </div>
      </div>`;
    }
    const mv=document.getElementById('nq-moves');if(mv)mv.textContent=moves;
    const fb=document.getElementById('nq-fb');
    if(fb&&!done){const cf=confRows().size,pl=board.filter(x=>x!==-1).length;if(cf){fb.textContent=`⚠️ ${cf/2} conflict(s)! Red queens attack each other.`;fb.style.color='#ff8a8a';}else{fb.textContent=`${pl}/${N} queens placed, no conflicts.`;fb.style.color='#00ffa3';}}
  }
  window.pgNQClick=(r,c)=>{
    if(done)return;moves++;
    board[r]=(board[r]===c)?-1:c;
    const pl=board.filter(x=>x!==-1).length,cf=confRows().size;
    if(pl===N&&cf===0){done=true;clearInterval(timer);}
    render();
  };
  window.nqNew=newGame;
  pgGameShell(accent,'N-Queens Game',
    `Place ${N} queens so <strong style="color:#00ffa3;">none attack each other</strong>. Click to place/remove. <span style="color:#ff4757;">Red = conflict!</span>`,
    pgStat('nq-moves','Moves',accent)+pgStat('nq-time','Time','#ffe040'),
    'nq-board','nq-fb',
    `<button class="pg-game-btn primary" onclick="pgGameNQueens('${accent}')">↺ New (6×6)</button>
     <button class="pg-game-btn" style="border-color:rgba(232,121,249,0.4);color:#e879f9;" onclick="window.nqNew(8)">🔥 Hard (8×8)</button>`);
  newGame(6);
}

/* ── Sudoku ── */
function pgGameSudoku(accent) {
  const PUZ=[[5,3,0,0,7,0,0,0,0],[6,0,0,1,9,5,0,0,0],[0,9,8,0,0,0,0,6,0],[8,0,0,0,6,0,0,0,3],[4,0,0,8,0,3,0,0,1],[7,0,0,0,2,0,0,0,6],[0,6,0,0,0,0,2,8,0],[0,0,0,4,1,9,0,0,5],[0,0,0,0,8,0,0,7,9]];
  const SOL=[[5,3,4,6,7,8,9,1,2],[6,7,2,1,9,5,3,4,8],[1,9,8,3,4,2,5,6,7],[8,5,9,7,6,1,4,2,3],[4,2,6,8,5,3,7,9,1],[7,1,3,9,2,4,8,5,6],[9,6,1,5,3,7,2,8,4],[2,8,7,4,1,9,6,3,5],[3,4,5,2,8,6,1,7,9]];
  let grid,sel,done,timer,tv,errors;
  function newGame(){grid=PUZ.map(r=>[...r]);sel=null;done=false;tv=0;errors=0;
    if(timer)clearInterval(timer);
    timer=setInterval(()=>{tv++;const el=document.getElementById('sd-time');if(el)el.textContent=tv+'s';else clearInterval(timer);},1000);
    render();}
  function render(){
    const body=document.getElementById('pg-body');if(!body)return;
    const boardWrap=document.getElementById('sd-board');
    if(!boardWrap)return;
    let html=`<div style="display:grid;grid-template-columns:repeat(9,1fr);gap:1px;background:#2a2a5a;border:2px solid #2a2a5a;border-radius:8px;overflow:hidden;max-width:360px;margin:0 auto;">`;
    for(let r=0;r<9;r++)for(let c=0;c<9;c++){
      const v=grid[r][c],orig=PUZ[r][c]!==0,isSel=sel&&sel[0]===r&&sel[1]===c,isWrong=v&&!orig&&v!==SOL[r][c];
      const br=(c===2||c===5)?'border-right:2px solid #5050a0;':'',bb=(r===2||r===5)?'border-bottom:2px solid #5050a0;':'';
      html+=`<div onclick="${!orig?`pgSDClick(${r},${c})`:''}" style="aspect-ratio:1;display:flex;align-items:center;justify-content:center;background:${isSel?'rgba(191,95,255,0.25)':orig?'#0d0d28':'#060820'};color:${orig?'#c8c8ff':isWrong?'#ff6b7a':'#bf5fff'};font-family:'Orbitron',monospace;font-size:13px;font-weight:${orig?700:400};cursor:${orig?'default':'pointer'};${br}${bb}${isSel?'outline:2px solid #bf5fff;outline-offset:-2px;':''}">${v||''}</div>`;
    }
    html+=`</div>`;
    if(sel){html+=`<div style="display:flex;gap:5px;flex-wrap:wrap;margin-top:10px;justify-content:center;">${[1,2,3,4,5,6,7,8,9].map(n=>`<button onclick="pgSDNum(${n})" style="width:36px;height:36px;border-radius:8px;border:1px solid rgba(191,95,255,0.3);background:rgba(191,95,255,0.07);color:#bf5fff;font-family:'Orbitron',monospace;font-size:14px;font-weight:700;cursor:pointer;" onmouseover="this.style.background='rgba(191,95,255,0.25)'" onmouseout="this.style.background='rgba(191,95,255,0.07)'">${n}</button>`).join('')}<button onclick="pgSDNum(0)" style="width:36px;height:36px;border-radius:8px;border:1px solid rgba(255,71,87,0.3);background:rgba(255,71,87,0.07);color:#ff6b7a;font-family:'Space Mono',monospace;font-size:18px;cursor:pointer;">✕</button></div>`;}
    boardWrap.innerHTML=html;
    if(done){boardWrap.style.position='relative';boardWrap.innerHTML+=`<div style="position:absolute;inset:0;background:rgba(4,4,16,0.88);border-radius:12px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;z-index:2;"><div style="font-size:44px;">🔢</div><div style="font-family:'Orbitron',monospace;font-size:18px;color:#00ffa3;font-weight:900;">SOLVED!</div><div style="font-family:'Space Mono',monospace;font-size:12px;color:#9090c0;">${errors} errors · ${tv}s</div><button class="pg-game-btn primary" onclick="pgGameSudoku('${accent}')" style="margin-top:6px;">Play Again</button></div>`;}
    const er=document.getElementById('sd-errs');if(er)er.textContent=errors;
  }
  window.pgSDClick=(r,c)=>{sel=[r,c];render();};
  window.pgSDNum=(n)=>{
    if(!sel)return;const[r,c]=sel;
    if(!n){grid[r][c]=0;sel=null;}
    else{if(n!==SOL[r][c])errors++;grid[r][c]=n;sel=null;
      if(grid.every((row,ri)=>row.every((v,ci)=>v===SOL[ri][ci]))){done=true;clearInterval(timer);}}
    render();};
  const body=document.getElementById('pg-body');
  body.innerHTML=`<button class="pg-back" onclick="pgBackToHub()">← Back to Hub</button>
    <div style="background:#0d0d28;border:1px solid #2a2a5a;border-radius:14px;padding:14px 18px;font-family:'Space Mono',monospace;font-size:12px;color:#7070a0;line-height:1.7;"><span style="color:${accent};font-weight:700;">🎮 Sudoku:</span> Click a blank cell, then a number. Each row, column, and 3×3 box must have 1-9 once.</div>
    <div style="display:flex;gap:10px;">${pgStat('sd-errs','Errors','#ff8a8a')}${pgStat('sd-time','Time',accent)}</div>
    <div class="pg-game-canvas-wrap" style="min-height:250px;position:relative;flex-direction:column;"><div id="sd-board" style="width:100%;padding:12px;display:flex;flex-direction:column;align-items:center;gap:10px;"></div></div>
    <div id="sd-fb" style="font-family:'Space Mono',monospace;font-size:12px;color:#9090c0;text-align:center;padding:10px;background:#0d0d28;border:1px solid #2a2a5a;border-radius:10px;">Click a blank cell to start!</div>
    <div style="display:flex;gap:10px;"><button class="pg-game-btn primary" onclick="pgGameSudoku('${accent}')">↺ New Game</button></div>`;
  newGame();
}

/* ── Rat in Maze ── */
function pgGameMaze(accent) {
  const MAZE=[[1,0,1,1,1,1,1],[1,1,1,0,0,1,0],[0,0,1,0,1,1,0],[1,1,1,1,1,0,0],[1,0,0,0,1,0,1],[1,1,1,1,1,1,1],[0,0,0,0,0,1,1]];
  const N=MAZE.length;
  let pos,path,done,timer,tv,moves;
  function newGame(){pos=[0,0];path=[[0,0]];done=false;tv=0;moves=0;
    if(timer)clearInterval(timer);
    timer=setInterval(()=>{tv++;const el=document.getElementById('rm-time');if(el)el.textContent=tv+'s';else clearInterval(timer);},1000);
    render();}
  function render(){
    const wrap=document.getElementById('rm-board');if(!wrap)return;
    const cell=52;
    let html=`<div style="display:grid;grid-template-columns:repeat(${N},${cell}px);gap:2px;padding:8px;">`;
    for(let r=0;r<N;r++)for(let c=0;c<N;c++){
      const isPos=pos[0]===r&&pos[1]===c,isEnd=r===N-1&&c===N-1,isBlocked=!MAZE[r][c],inPath=path.some(p=>p[0]===r&&p[1]===c);
      html+=`<div onclick="pgRatMove(${r},${c})" style="width:${cell}px;height:${cell}px;display:flex;align-items:center;justify-content:center;background:${isBlocked?'#060614':isPos?accent:isEnd?'rgba(0,255,163,0.25)':inPath?'rgba(191,95,255,0.18)':'#0d0d28'};border:${isEnd?'2px solid #00ffa3':isPos?`2px solid ${accent}`:'1px solid #1a1a3a'};border-radius:6px;cursor:pointer;font-size:${cell*.45}px;transition:all 0.12s;user-select:none;">${isPos?'🐭':isEnd?'🧀':MAZE[r][c]===0?'🧱':inPath?'·':''}</div>`;
    }
    html+=`</div>`;
    wrap.innerHTML=html;
    if(done){wrap.style.position='relative';wrap.innerHTML+=`<div style="position:absolute;inset:0;background:rgba(4,4,16,0.88);border-radius:12px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;z-index:2;"><div style="font-size:44px;">🧀</div><div style="font-family:'Orbitron',monospace;font-size:18px;color:#00ffa3;font-weight:900;">CHEESE FOUND!</div><div style="font-family:'Space Mono',monospace;font-size:12px;color:#9090c0;">${path.length} steps · ${tv}s</div><button class="pg-game-btn primary" onclick="pgGameMaze('${accent}')" style="margin-top:6px;">Play Again</button></div>`;}
    const mv=document.getElementById('rm-moves');if(mv)mv.textContent=moves;
    const fb=document.getElementById('rm-fb');if(fb&&!done){fb.textContent='Click adjacent open cells to guide the 🐭 to the 🧀 at bottom-right!';fb.style.color='#9090c0';}
  }
  window.pgRatMove=(r,c)=>{
    if(done)return;
    const[pr,pc]=pos,adj=(Math.abs(r-pr)+Math.abs(c-pc))===1;
    const fb=document.getElementById('rm-fb');
    if(!adj){if(fb){fb.textContent='⚠️ Only adjacent moves!';fb.style.color='#ff8a8a';}return;}
    if(!MAZE[r][c]){if(fb){fb.textContent='🧱 Blocked! Try another path.';fb.style.color='#ff8a8a';}return;}
    pos=[r,c];moves++;if(!path.some(p=>p[0]===r&&p[1]===c))path.push([r,c]);
    if(r===N-1&&c===N-1){done=true;clearInterval(timer);}
    render();};
  pgGameShell(accent,'Rat in a Maze','Click adjacent open cells to guide 🐭 to 🧀 at bottom-right. 🧱 = blocked!',
    pgStat('rm-moves','Moves',accent)+pgStat('rm-time','Time','#ffe040'),
    'rm-board','rm-fb',`<button class="pg-game-btn primary" onclick="pgGameMaze('${accent}')">↺ New Game</button>`);
  newGame();
}

/* ── BFS: click nodes in BFS order ── */
function pgGameBFS(accent) {
  const ND=[{id:0,l:'A',x:220,y:60},{id:1,l:'B',x:100,y:160},{id:2,l:'C',x:340,y:160},{id:3,l:'D',x:40,y:280},{id:4,l:'E',x:180,y:280},{id:5,l:'F',x:380,y:280}];
  const ED=[{u:0,v:1},{u:0,v:2},{u:1,v:3},{u:1,v:4},{u:2,v:4},{u:2,v:5}];
  const ADJ=Array.from({length:6},()=>[]);ED.forEach(({u,v})=>{ADJ[u].push(v);ADJ[v].push(u);});
  const order=[];const seen=new Set([0]);const q=[0];while(q.length){const n=q.shift();order.push(n);[...ADJ[n]].sort((a,b)=>a-b).forEach(nb=>{if(!seen.has(nb)){seen.add(nb);q.push(nb);}});}
  let clicked,done,errors,timer,tv;
  function newGame(){clicked=[];done=false;errors=0;tv=0;if(timer)clearInterval(timer);timer=setInterval(()=>{tv++;const el=document.getElementById('bf-time');if(el)el.textContent=tv+'s';else clearInterval(timer);},1000);render();}
  function render(){
    const wrap=document.getElementById('bf-board');if(!wrap)return;
    let svg=`<svg width="460" height="340" style="overflow:visible;">`;
    ED.forEach(({u,v})=>{const bv=clicked.includes(u)&&clicked.includes(v);svg+=`<line x1="${ND[u].x}" y1="${ND[u].y}" x2="${ND[v].x}" y2="${ND[v].y}" stroke="${bv?accent:'#2a2a5a'}" stroke-width="${bv?2:1}" opacity="${bv?.8:.4}"/>`;});
    ND.forEach(n=>{
      const isC=clicked.includes(n.id),isNext=order[clicked.length]===n.id,ord=clicked.indexOf(n.id);
      const col=isC?accent:(isNext?'#ffe040':'#3a3a6a');
      svg+=`<g onclick="pgBFSClick(${n.id})" style="cursor:pointer;"><circle cx="${n.x}" cy="${n.y}" r="24" fill="${isC?accent+'33':isNext?'rgba(255,224,64,0.15)':'rgba(58,58,106,0.5)'}" stroke="${col}" stroke-width="2"/>${isC?`<text x="${n.x}" y="${n.y-28}" fill="${accent}" font-family="Orbitron,monospace" font-size="11" text-anchor="middle" font-weight="700">${ord+1}</text>`:''}<text x="${n.x}" y="${n.y+5}" fill="${col}" font-family="Orbitron,monospace" font-size="14" text-anchor="middle" font-weight="700">${n.l}</text></g>`;
    });
    svg+=`</svg>`;
    wrap.innerHTML=svg;
    if(done){wrap.style.position='relative';wrap.innerHTML+=`<div style="position:absolute;inset:0;background:rgba(4,4,16,0.88);border-radius:12px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;z-index:2;"><div style="font-size:44px;">🌊</div><div style="font-family:'Orbitron',monospace;font-size:18px;color:#00ffa3;font-weight:900;">BFS COMPLETE!</div><div style="font-family:'Space Mono',monospace;font-size:12px;color:#9090c0;">Order: ${order.map(i=>ND[i].l).join('→')} · ${errors} errors · ${tv}s</div><button class="pg-game-btn primary" onclick="pgGameBFS('${accent}')" style="margin-top:6px;">Play Again</button></div>`;}
    const er=document.getElementById('bf-errs');if(er)er.textContent=errors;
    const fb=document.getElementById('bf-fb');if(fb&&!done){const nx=ND[order[clicked.length]];fb.textContent=`Click ${nx?nx.l:'?'} next (${clicked.length+1}/${order.length}). BFS = level by level!`;fb.style.color='#9090c0';}
  }
  window.pgBFSClick=(id)=>{if(done)return;const exp=order[clicked.length];if(id===exp){clicked.push(id);if(clicked.length===order.length){done=true;clearInterval(timer);}}else{errors++;const fb=document.getElementById('bf-fb');if(fb){fb.textContent=`❌ Expected ${ND[exp].l}. BFS explores level-by-level!`;fb.style.color='#ff8a8a';}}render();};
  pgGameShell(accent,'BFS Game','Click nodes in correct <strong style="color:#ffe040;">BFS order</strong> from A. Yellow = next expected. Level by level!',
    pgStat('bf-errs','Errors','#ff8a8a')+pgStat('bf-time','Time',accent),
    'bf-board','bf-fb',`<button class="pg-game-btn primary" onclick="pgGameBFS('${accent}')">↺ New Game</button>`);
  newGame();
}

/* ── DFS: click nodes in DFS order ── */
function pgGameDFS(accent) {
  const ND=[{id:0,l:'A',x:220,y:60},{id:1,l:'B',x:100,y:160},{id:2,l:'C',x:340,y:160},{id:3,l:'D',x:40,y:280},{id:4,l:'E',x:180,y:280},{id:5,l:'F',x:380,y:280}];
  const ED=[{u:0,v:1},{u:0,v:2},{u:1,v:3},{u:1,v:4},{u:2,v:4},{u:2,v:5}];
  const ADJ=Array.from({length:6},()=>[]);ED.forEach(({u,v})=>{ADJ[u].push(v);ADJ[v].push(u);});
  const order=[];const ds=new Set();function dfs(n){ds.add(n);order.push(n);[...ADJ[n]].sort((a,b)=>a-b).forEach(nb=>{if(!ds.has(nb))dfs(nb);});}dfs(0);
  let clicked,done,errors,timer,tv;
  function newGame(){clicked=[];done=false;errors=0;tv=0;if(timer)clearInterval(timer);timer=setInterval(()=>{tv++;const el=document.getElementById('df-time');if(el)el.textContent=tv+'s';else clearInterval(timer);},1000);render();}
  function render(){
    const wrap=document.getElementById('df-board');if(!wrap)return;
    let svg=`<svg width="460" height="340" style="overflow:visible;">`;
    ED.forEach(({u,v})=>{const bv=clicked.includes(u)&&clicked.includes(v);svg+=`<line x1="${ND[u].x}" y1="${ND[u].y}" x2="${ND[v].x}" y2="${ND[v].y}" stroke="${bv?'#4ade80':'#2a2a5a'}" stroke-width="${bv?2:1}" opacity="${bv?.8:.4}"/>`;});
    ND.forEach(n=>{
      const isC=clicked.includes(n.id),isNext=order[clicked.length]===n.id,ord=clicked.indexOf(n.id);
      const col=isC?'#4ade80':(isNext?'#ffe040':'#3a3a6a');
      svg+=`<g onclick="pgDFSClick(${n.id})" style="cursor:pointer;"><circle cx="${n.x}" cy="${n.y}" r="24" fill="${isC?'rgba(74,222,128,0.2)':isNext?'rgba(255,224,64,0.15)':'rgba(58,58,106,0.5)'}" stroke="${col}" stroke-width="2"/>${isC?`<text x="${n.x}" y="${n.y-28}" fill="#4ade80" font-family="Orbitron,monospace" font-size="11" text-anchor="middle" font-weight="700">${ord+1}</text>`:''}<text x="${n.x}" y="${n.y+5}" fill="${col}" font-family="Orbitron,monospace" font-size="14" text-anchor="middle" font-weight="700">${n.l}</text></g>`;
    });
    svg+=`</svg>`;
    wrap.innerHTML=svg;
    if(done){wrap.style.position='relative';wrap.innerHTML+=`<div style="position:absolute;inset:0;background:rgba(4,4,16,0.88);border-radius:12px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;z-index:2;"><div style="font-size:44px;">🌲</div><div style="font-family:'Orbitron',monospace;font-size:18px;color:#00ffa3;font-weight:900;">DFS COMPLETE!</div><div style="font-family:'Space Mono',monospace;font-size:12px;color:#9090c0;">Order: ${order.map(i=>ND[i].l).join('→')} · ${errors} errors · ${tv}s</div><button class="pg-game-btn primary" onclick="pgGameDFS('${accent}')" style="margin-top:6px;">Play Again</button></div>`;}
    const er=document.getElementById('df-errs');if(er)er.textContent=errors;
    const fb=document.getElementById('df-fb');if(fb&&!done){const nx=ND[order[clicked.length]];fb.textContent=`Click ${nx?nx.l:'?'} next. DFS = go as DEEP as possible first!`;fb.style.color='#9090c0';}
  }
  window.pgDFSClick=(id)=>{if(done)return;const exp=order[clicked.length];if(id===exp){clicked.push(id);if(clicked.length===order.length){done=true;clearInterval(timer);}}else{errors++;const fb=document.getElementById('df-fb');if(fb){fb.textContent=`❌ Expected ${ND[exp].l}. DFS dives deep first!`;fb.style.color='#ff8a8a';}}render();};
  pgGameShell(accent,'DFS Game','Click nodes in correct <strong style="color:#ffe040;">DFS order</strong> from A. Go as DEEP as possible before backtracking!',
    pgStat('df-errs','Errors','#ff8a8a')+pgStat('df-time','Time',accent),
    'df-board','df-fb',`<button class="pg-game-btn primary" onclick="pgGameDFS('${accent}')">↺ New Game</button>`);
  newGame();
}

/* ── Dijkstra: assign shortest distances ── */
function pgGameDijkstra(accent) {
  const ND=[{id:0,l:'A',x:60,y:160},{id:1,l:'B',x:200,y:60},{id:2,l:'C',x:380,y:60},{id:3,l:'D',x:200,y:280},{id:4,l:'E',x:380,y:280}];
  const ED=[{u:0,v:1,w:4},{u:0,v:3,w:2},{u:1,v:2,w:5},{u:1,v:3,w:1},{u:3,v:4,w:3},{u:2,v:4,w:2}];
  const DISTS=[0,3,8,2,5];
  let userD,done,errors,timer,tv,sel;
  function newGame(){userD=Array(5).fill(null);userD[0]=0;done=false;errors=0;tv=0;sel=null;if(timer)clearInterval(timer);timer=setInterval(()=>{tv++;const el=document.getElementById('dj-time');if(el)el.textContent=tv+'s';else clearInterval(timer);},1000);render();}
  function render(){
    const wrap=document.getElementById('dj-board');if(!wrap)return;
    let svg=`<svg width="480" height="360" style="overflow:visible;">`;
    ED.forEach(({u,v,w})=>{const ok=userD[u]!==null&&userD[v]!==null&&(userD[u]+w===DISTS[v]||userD[v]+w===DISTS[u]);svg+=`<line x1="${ND[u].x}" y1="${ND[u].y}" x2="${ND[v].x}" y2="${ND[v].y}" stroke="${ok?accent:'#3a3a6a'}" stroke-width="${ok?2.5:1.5}" opacity="${ok?.9:.5}"/><text x="${(ND[u].x+ND[v].x)/2}" y="${(ND[u].y+ND[v].y)/2-7}" fill="#ffe040" font-family="Space Mono,monospace" font-size="12" text-anchor="middle" font-weight="700">${w}</text>`;});
    ND.forEach(n=>{const isSel=sel===n.id,hasD=userD[n.id]!==null,isOk=hasD&&userD[n.id]===DISTS[n.id],isWrong=hasD&&!isOk;const col=isWrong?'#ff4757':(isOk?'#00ffa3':(isSel?'#ffe040':accent));svg+=`<g onclick="pgDJClick(${n.id})" style="cursor:pointer;"><circle cx="${n.x}" cy="${n.y}" r="26" fill="rgba(${isWrong?'255,71,87':isOk?'0,255,163':isSel?'255,224,64':'6,182,212'},0.15)" stroke="${col}" stroke-width="2.5"/><text x="${n.x}" y="${n.y+5}" fill="${col}" font-family="Orbitron,monospace" font-size="15" text-anchor="middle" font-weight="900">${n.l}</text>${hasD?`<text x="${n.x}" y="${n.y+24}" fill="${col}" font-family="Space Mono,monospace" font-size="10" text-anchor="middle">[${userD[n.id]}]</text>`:`<text x="${n.x}" y="${n.y+24}" fill="#3a3a6a" font-family="Space Mono,monospace" font-size="10" text-anchor="middle">[?]</text>`}</g>`;});
    svg+=`</svg>`;
    let numpad='';
    if(sel!==null&&sel!==0){numpad=`<div style="margin-top:10px;text-align:center;"><div style="font-family:'Space Mono',monospace;font-size:11px;color:#7070a0;margin-bottom:8px;">Shortest dist A → ${ND[sel].l}:</div><div style="display:flex;gap:5px;justify-content:center;flex-wrap:wrap;">${[0,1,2,3,4,5,6,7,8,9,10].map(n=>`<button onclick="pgDJEnter(${n})" style="width:38px;height:38px;border-radius:8px;border:1px solid rgba(6,182,212,0.3);background:rgba(6,182,212,0.07);color:#06b6d4;font-family:'Orbitron',monospace;font-size:13px;font-weight:700;cursor:pointer;" onmouseover="this.style.background='rgba(6,182,212,0.25)'" onmouseout="this.style.background='rgba(6,182,212,0.07)'">${n}</button>`).join('')}<button onclick="pgDJClear()" style="padding:0 10px;height:38px;border-radius:8px;border:1px solid rgba(255,71,87,0.3);background:rgba(255,71,87,0.07);color:#ff6b7a;font-family:'Space Mono',monospace;font-size:12px;cursor:pointer;">CLR</button></div></div>`;}
    wrap.innerHTML=`<div style="display:flex;flex-direction:column;align-items:center;">${svg}${numpad}</div>`;
    if(done){wrap.style.position='relative';wrap.innerHTML+=`<div style="position:absolute;inset:0;background:rgba(4,4,16,0.88);border-radius:12px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;z-index:2;"><div style="font-size:44px;">🗺</div><div style="font-family:'Orbitron',monospace;font-size:18px;color:#00ffa3;font-weight:900;">ALL PATHS FOUND!</div><div style="font-family:'Space Mono',monospace;font-size:11px;color:#7070a0;">A=0, B=3, C=8, D=2, E=5</div><div style="font-family:'Space Mono',monospace;font-size:12px;color:#9090c0;">${errors} errors · ${tv}s</div><button class="pg-game-btn primary" onclick="pgGameDijkstra('${accent}')" style="margin-top:6px;">Play Again</button></div>`;}
    const er=document.getElementById('dj-errs');if(er)er.textContent=errors;
    const fb=document.getElementById('dj-fb');if(fb&&!done){const rem=ND.filter(n=>userD[n.id]===null).length;fb.textContent=`Click a node and enter its shortest distance from A. ${rem} nodes remaining.`;fb.style.color='#9090c0';}
  }
  window.pgDJClick=(id)=>{if(id===0)return;sel=id;render();};
  window.pgDJEnter=(n)=>{if(sel===null)return;userD[sel]=n;const fb=document.getElementById('dj-fb');if(n!==DISTS[sel]){errors++;if(fb){fb.textContent=`❌ Wrong! Distance to ${ND[sel].l} = ${DISTS[sel]}`;fb.style.color='#ff8a8a';}}else{if(fb){fb.textContent=`✅ Correct! dist[${ND[sel].l}]=${n}`;fb.style.color='#00ffa3';}}if(ND.every(n2=>userD[n2.id]===DISTS[n2.id])){done=true;clearInterval(timer);}sel=null;render();};
  window.pgDJClear=()=>{if(sel!==null)userD[sel]=null;render();};
  const body=document.getElementById('pg-body');
  body.innerHTML=`<button class="pg-back" onclick="pgBackToHub()">← Back to Hub</button>
    <div style="background:#0d0d28;border:1px solid #2a2a5a;border-radius:14px;padding:14px 18px;font-family:'Space Mono',monospace;font-size:12px;color:#7070a0;line-height:1.7;"><span style="color:${accent};font-weight:700;">🎮 Dijkstra Game:</span> A=0 is set. Click each node and enter its shortest distance from A. Edge weights shown on lines.</div>
    <div style="display:flex;gap:10px;">${pgStat('dj-errs','Errors','#ff8a8a')}${pgStat('dj-time','Time',accent)}</div>
    <div class="pg-game-canvas-wrap" style="min-height:260px;position:relative;flex-direction:column;"><div id="dj-board" style="width:100%;padding:10px;"></div></div>
    <div id="dj-fb" style="font-family:'Space Mono',monospace;font-size:12px;color:#9090c0;text-align:center;padding:10px;background:#0d0d28;border:1px solid #2a2a5a;border-radius:10px;"></div>
    <div style="display:flex;gap:10px;"><button class="pg-game-btn primary" onclick="pgGameDijkstra('${accent}')">↺ New Game</button></div>`;
  newGame();
}




/* ── DP: Fibonacci Memo Game — fill the memo table ── */
function pgGameFibDP(accent) {
  const N=10; let memo, done, errors, timer, tv;
  function newGame(){memo=Array(N+1).fill(null);memo[0]=0;memo[1]=1;done=false;errors=0;tv=0;if(timer)clearInterval(timer);timer=setInterval(()=>{tv++;const el=document.getElementById('fd-time');if(el)el.textContent=tv+'s';else clearInterval(timer);},1000);render();}
  function fib(n){return n<=1?n:fib(n-1)+fib(n-2);}
  function render(){
    const wrap=document.getElementById('fd-board');if(!wrap)return;
    const cells=Array.from({length:N+1},(_,i)=>{
      const known=memo[i]!==null,correct=memo[i]===fib(i);
      const isNext=!known&&(memo[i-1]!==null&&memo[i-2]!==null);
      return `<div style="display:flex;flex-direction:column;align-items:center;gap:5px;">
        <div style="font-family:'Space Mono',monospace;font-size:10px;color:#5050a0;">F(${i})</div>
        <div onclick="${isNext?`pgFibClick(${i})`:''}" style="width:52px;height:52px;display:flex;align-items:center;justify-content:center;border-radius:10px;font-family:'Orbitron',monospace;font-size:14px;font-weight:700;cursor:${isNext?'pointer':'default'};transition:all 0.15s;background:${known?'rgba(0,255,163,0.2)':isNext?'rgba('+accent.slice(1).match(/../g).map(x=>parseInt(x,16)).join(',')+',.15)':'#0d0d28'};color:${known?'#00ffa3':isNext?accent:'#2a2a5a'};border:2px solid ${known?'#00ffa3':isNext?accent:'#2a2a5a'};${isNext?'animation:pgGlow 1.5s infinite;':''}">${known?memo[i]:'?'}</div>
      </div>`;
    }).join('');
    wrap.innerHTML=`<div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center;padding:12px;">${cells}</div>`;
    if(done){wrap.style.position='relative';wrap.innerHTML+=`<div style="position:absolute;inset:0;background:rgba(4,4,16,0.88);border-radius:12px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;z-index:2;"><div style="font-size:44px;">🐚</div><div style="font-family:'Orbitron',monospace;font-size:18px;color:#00ffa3;font-weight:900;">TABLE FILLED!</div><div style="font-family:'Space Mono',monospace;font-size:12px;color:#9090c0;">${errors} errors · ${tv}s</div><button class="pg-game-btn primary" onclick="pgGameFibDP('${accent}')" style="margin-top:6px;">Play Again</button></div>`;}
    const er=document.getElementById('fd-errs');if(er)er.textContent=errors;
    const fb=document.getElementById('fd-fb');
    const next=Array.from({length:N+1},(_,i)=>i).find(i=>memo[i]===null&&i>1&&memo[i-1]!==null&&memo[i-2]!==null);
    if(fb&&!done){fb.textContent=next!==undefined?`Click F(${next}): F(${next-2})+F(${next-1}) = ${fib(next-2)}+${fib(next-1)} = ?`:'All filled!';fb.style.color='#9090c0';}
  }
  const body=document.getElementById('pg-body');
  body.innerHTML=`<button class="pg-back" onclick="pgBackToHub()">← Back to Hub</button>
    <div style="background:#0d0d28;border:1px solid #2a2a5a;border-radius:14px;padding:14px 18px;font-family:'Space Mono',monospace;font-size:12px;color:#7070a0;line-height:1.7;"><span style="color:${accent};font-weight:700;">🎮 Fibonacci DP:</span> Fill the memo table left to right. Click the <strong style="color:${accent};">glowing cell</strong> and type the correct Fibonacci value.</div>
    <div style="display:flex;gap:10px;">${pgStat('fd-errs','Errors','#ff8a8a')}${pgStat('fd-time','Time',accent)}</div>
    <div class="pg-game-canvas-wrap" style="min-height:140px;position:relative;"><div id="fd-board" style="width:100%;"></div></div>
    <div id="fd-input-wrap" style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-top:4px;"></div>
    <div id="fd-fb" style="font-family:'Space Mono',monospace;font-size:12px;color:#9090c0;text-align:center;padding:10px;background:#0d0d28;border:1px solid #2a2a5a;border-radius:10px;"></div>
    <div style="display:flex;gap:10px;"><button class="pg-game-btn primary" onclick="pgGameFibDP('${accent}')">↺ New Game</button></div>`;
  window.pgFibClick=(i)=>{
    const ans=prompt(`What is F(${i}) = F(${i-2}) + F(${i-1}) = ${fib(i-2)} + ${fib(i-1)} ?`);
    if(ans===null)return;
    const fb=document.getElementById('fd-fb');
    if(parseInt(ans)===fib(i)){memo[i]=fib(i);if(fb){fb.textContent=`✅ Correct! F(${i})=${fib(i)}`;fb.style.color='#00ffa3';}if(memo.every((v,idx)=>idx<=N&&v===fib(idx))){done=true;clearInterval(timer);}}
    else{errors++;if(fb){fb.textContent=`❌ Wrong! F(${i}) = ${fib(i)}`;fb.style.color='#ff8a8a';}}
    render();
  };
  newGame();
}

/* ── LCS: fill the DP table cell by cell ── */
function pgGameLCS(accent) {
  const S1='ABCB', S2='BCAB';
  const m=S1.length, n=S2.length;
  function lcsDP(){const dp=Array.from({length:m+1},()=>Array(n+1).fill(0));for(let i=1;i<=m;i++)for(let j=1;j<=n;j++)dp[i][j]=S1[i-1]===S2[j-1]?dp[i-1][j-1]+1:Math.max(dp[i-1][j],dp[i][j-1]);return dp;}
  const solution=lcsDP();
  let userDP, done, errors, timer, tv;
  function newGame(){userDP=Array.from({length:m+1},()=>Array(n+1).fill(null));for(let i=0;i<=m;i++)userDP[i][0]=0;for(let j=0;j<=n;j++)userDP[0][j]=0;done=false;errors=0;tv=0;if(timer)clearInterval(timer);timer=setInterval(()=>{tv++;const el=document.getElementById('lc-time');if(el)el.textContent=tv+'s';else clearInterval(timer);},1000);render();}
  function render(){
    const wrap=document.getElementById('lc-board');if(!wrap)return;
    let html=`<div style="overflow-x:auto;padding:8px;"><table style="border-collapse:collapse;font-family:'Space Mono',monospace;font-size:12px;">`;
    html+=`<tr><td style="padding:6px 10px;"></td><td style="padding:6px 10px;color:#5050a0;"></td>`;
    for(let j=0;j<n;j++)html+=`<td style="padding:6px 10px;color:${accent};font-weight:700;text-align:center;">${S2[j]}</td>`;
    html+=`</tr>`;
    for(let i=0;i<=m;i++){
      html+=`<tr><td style="padding:6px 10px;color:${accent};font-weight:700;">${i>0?S1[i-1]:''}</td>`;
      for(let j=0;j<=n;j++){
        const val=userDP[i][j], correct=solution[i][j];
        const filled=val!==null, isNext=!filled&&(i>0||j>0)&&userDP[Math.max(0,i-1)][j]!==null&&userDP[i][Math.max(0,j-1)]!==null&&(i===0||userDP[i-1][j]!==null)&&(j===0||userDP[i][j-1]!==null);
        const isCorrect=filled&&val===correct, isWrong=filled&&val!==correct;
        html+=`<td onclick="${isNext?`pgLCSClick(${i},${j})`:''}" style="padding:6px 10px;width:40px;height:36px;text-align:center;background:${isCorrect?'rgba(0,255,163,0.2)':isWrong?'rgba(255,71,87,0.2)':isNext?'rgba('+accent.slice(1).match(/../g).map(x=>parseInt(x,16)).join(',')+',.15)':'#0d0d28'};border:1px solid ${isCorrect?'#00ffa3':isWrong?'#ff4757':isNext?accent:'#2a2a5a'};border-radius:4px;cursor:${isNext?'pointer':'default'};color:${isCorrect?'#00ffa3':isWrong?'#ff8a8a':filled?'#c8c8ff':'#3a3a6a'};font-weight:700;">${filled?val:'?'}</td>`;
      }
      html+=`</tr>`;
    }
    html+=`</table></div>`;
    wrap.innerHTML=html;
    if(done){wrap.style.position='relative';wrap.innerHTML+=`<div style="position:absolute;inset:0;background:rgba(4,4,16,0.88);border-radius:12px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;z-index:2;"><div style="font-size:44px;">📏</div><div style="font-family:'Orbitron',monospace;font-size:18px;color:#00ffa3;font-weight:900;">LCS = ${solution[m][n]}!</div><div style="font-family:'Space Mono',monospace;font-size:12px;color:#9090c0;">${errors} errors · ${tv}s</div><button class="pg-game-btn primary" onclick="pgGameLCS('${accent}')" style="margin-top:6px;">Play Again</button></div>`;}
    const er=document.getElementById('lc-errs');if(er)er.textContent=errors;
  }
  window.pgLCSClick=(i,j)=>{
    const fb=document.getElementById('lc-fb');
    const correct=solution[i][j];
    const hint=S1[i-1]===S2[j-1]?`Match! dp[${i-1}][${j-1}]+1`:`No match: max(dp[${i-1}][${j}], dp[${i}][${j-1}])`;
    const ans=prompt(`dp[${i}][${j}]? (${S1[i-1]||'-'} vs ${S2[j-1]||'-'}) ${hint}`);
    if(ans===null)return;
    if(parseInt(ans)===correct){userDP[i][j]=correct;if(fb){fb.textContent=`✅ dp[${i}][${j}]=${correct}`;fb.style.color='#00ffa3';}
      if(userDP.every((row,ri)=>row.every((v,ci)=>v===solution[ri][ci]))){done=true;clearInterval(timer);}}
    else{errors++;if(fb){fb.textContent=`❌ Wrong! dp[${i}][${j}]=${correct}`;fb.style.color='#ff8a8a';}}
    render();
  };
  const body=document.getElementById('pg-body');
  body.innerHTML=`<button class="pg-back" onclick="pgBackToHub()">← Back to Hub</button>
    <div style="background:#0d0d28;border:1px solid #2a2a5a;border-radius:14px;padding:14px 18px;font-family:'Space Mono',monospace;font-size:12px;color:#7070a0;line-height:1.7;"><span style="color:${accent};font-weight:700;">🎮 LCS Table Game:</span> Fill the DP table for S1="${S1}" and S2="${S2}". Click a cell to enter its value. Match = diagonal+1, else max of top/left.</div>
    <div style="display:flex;gap:10px;">${pgStat('lc-errs','Errors','#ff8a8a')}${pgStat('lc-time','Time',accent)}</div>
    <div class="pg-game-canvas-wrap" style="min-height:200px;position:relative;flex-direction:column;"><div id="lc-board" style="width:100%;display:flex;justify-content:center;"></div></div>
    <div id="lc-fb" style="font-family:'Space Mono',monospace;font-size:12px;color:#9090c0;text-align:center;padding:10px;background:#0d0d28;border:1px solid #2a2a5a;border-radius:10px;">Click a glowing cell to fill it!</div>
    <div style="display:flex;gap:10px;"><button class="pg-game-btn primary" onclick="pgGameLCS('${accent}')">↺ New Game</button></div>`;
  newGame();
}

/* ── Knapsack Game: select items to maximize value ── */
function pgGameKnapsack(accent) {
  const ITEMS=[{n:'Laptop',w:4,v:8},{n:'Phone',w:1,v:3},{n:'Camera',w:2,v:5},{n:'Book',w:1,v:2},{n:'Watch',w:1,v:4},{n:'Tablet',w:3,v:6}];
  const CAP=6;
  function dpSolve(){let dp=Array(CAP+1).fill(0);ITEMS.forEach(item=>{for(let c=CAP;c>=item.w;c--)dp[c]=Math.max(dp[c],dp[c-item.w]+item.v);});return dp[CAP];}
  const BEST=dpSolve();
  let selected, done, timer, tv;
  function newGame(){selected=new Set();done=false;tv=0;if(timer)clearInterval(timer);timer=setInterval(()=>{tv++;const el=document.getElementById('kp-time');if(el)el.textContent=tv+'s';else clearInterval(timer);},1000);render();}
  function totalW(){return [...selected].reduce((s,i)=>s+ITEMS[i].w,0);}
  function totalV(){return [...selected].reduce((s,i)=>s+ITEMS[i].v,0);}
  function render(){
    const wrap=document.getElementById('kp-board');if(!wrap)return;
    const tw=totalW(),tv2=totalV(),over=tw>CAP;
    wrap.innerHTML=`<div style="display:flex;flex-direction:column;gap:10px;width:100%;padding:10px;">
      <div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap;">
        ${ITEMS.map((it,i)=>{const sel=selected.has(i);return `<div onclick="pgKPClick(${i})" style="padding:12px 16px;border-radius:12px;cursor:pointer;transition:all 0.15s;background:${sel?accent+'33':'#0d0d28'};border:2px solid ${sel?accent:'#2a2a5a'};display:flex;flex-direction:column;align-items:center;gap:4px;min-width:80px;${sel?'transform:translateY(-4px);':''}">
          <div style="font-size:22px;">${['💻','📱','📷','📖','⌚','📱'][i]}</div>
          <div style="font-family:'Space Mono',monospace;font-size:10px;color:${sel?accent:'#9090c0'};">${it.n}</div>
          <div style="font-family:'Space Mono',monospace;font-size:9px;color:#5050a0;">W:${it.w} V:${it.v}</div>
        </div>`}).join('')}
      </div>
      <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;">
        <div style="font-family:'Space Mono',monospace;font-size:12px;padding:8px 16px;border-radius:8px;background:${over?'rgba(255,71,87,0.15)':'rgba(0,255,163,0.1)'};border:1px solid ${over?'#ff4757':'rgba(0,255,163,0.3)'};color:${over?'#ff8a8a':'#00ffa3'};">Weight: ${tw}/${CAP} ${over?'⚠️ OVER!':''}</div>
        <div style="font-family:'Space Mono',monospace;font-size:12px;padding:8px 16px;border-radius:8px;background:rgba(${accent.slice(1).match(/../g).map(x=>parseInt(x,16)).join(',')},0.1);border:1px solid ${accent}44;color:${accent};">Value: ${tv2} / Best: ${BEST}</div>
      </div>
      ${!over&&tv2===BEST?`<div style="text-align:center;font-family:'Orbitron',monospace;font-size:14px;color:#00ffa3;padding:8px;">🏆 OPTIMAL! You matched the DP solution!</div>`:''}
    </div>`;
    if(done){wrap.style.position='relative';wrap.innerHTML+=`<div style="position:absolute;inset:0;background:rgba(4,4,16,0.88);border-radius:12px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;z-index:2;"><div style="font-size:44px;">🎒</div><div style="font-family:'Orbitron',monospace;font-size:18px;color:#00ffa3;font-weight:900;">OPTIMAL FOUND!</div><div style="font-family:'Space Mono',monospace;font-size:12px;color:#9090c0;">Value: ${tv2} / ${BEST} · ${tv}s</div><button class="pg-game-btn primary" onclick="pgGameKnapsack('${accent}')" style="margin-top:6px;">Play Again</button></div>`;}
    const fb=document.getElementById('kp-fb');if(fb&&!done){if(over){fb.textContent='⚠️ Over capacity! Remove an item.';fb.style.color='#ff8a8a';}else if(tv2===BEST){done=true;clearInterval(timer);}else{fb.textContent=`Try to reach value ${BEST}. Capacity left: ${CAP-tw}`;fb.style.color='#9090c0';}}
  }
  window.pgKPClick=(i)=>{if(selected.has(i))selected.delete(i);else selected.add(i);render();};
  const body=document.getElementById('pg-body');
  body.innerHTML=`<button class="pg-back" onclick="pgBackToHub()">← Back to Hub</button>
    <div style="background:#0d0d28;border:1px solid #2a2a5a;border-radius:14px;padding:14px 18px;font-family:'Space Mono',monospace;font-size:12px;color:#7070a0;line-height:1.7;"><span style="color:${accent};font-weight:700;">🎮 Knapsack Game:</span> Select items to maximize total value without exceeding capacity ${CAP}. Click to toggle selection!</div>
    <div style="display:flex;gap:10px;">${pgStat('kp-time','Time',accent)}</div>
    <div class="pg-game-canvas-wrap" style="min-height:200px;position:relative;flex-direction:column;"><div id="kp-board" style="width:100%;"></div></div>
    <div id="kp-fb" style="font-family:'Space Mono',monospace;font-size:12px;color:#9090c0;text-align:center;padding:10px;background:#0d0d28;border:1px solid #2a2a5a;border-radius:10px;">Select items to maximize value within capacity ${CAP}!</div>
    <div style="display:flex;gap:10px;"><button class="pg-game-btn primary" onclick="pgGameKnapsack('${accent}')">↺ New Game</button></div>`;
  newGame();
}

/* ── Stack Game: push/pop in correct LIFO order ── */
function pgGameStack(accent) {
  const OPS=[{op:'push',val:3},{op:'push',val:7},{op:'push',val:1},{op:'pop'},{op:'push',val:5},{op:'pop'},{op:'pop'}];
  let stack, step, done, errors, timer, tv;
  function newGame(){stack=[];step=0;done=false;errors=0;tv=0;if(timer)clearInterval(timer);timer=setInterval(()=>{tv++;const el=document.getElementById('st-time');if(el)el.textContent=tv+'s';else clearInterval(timer);},1000);render();}
  function render(){
    const wrap=document.getElementById('st-board');if(!wrap)return;
    const cur=step<OPS.length?OPS[step]:null;
    const stackVis=`<div style="display:flex;flex-direction:column-reverse;gap:4px;align-items:center;min-height:140px;justify-content:flex-start;padding:10px 20px;">
      ${stack.length===0?`<div style="font-family:'Space Mono',monospace;font-size:11px;color:#3a3a6a;padding:20px;">Empty stack</div>`:''}
      ${stack.map((v,i)=>`<div style="width:80px;height:36px;display:flex;align-items:center;justify-content:center;background:${i===stack.length-1?accent+'44':'rgba(191,95,255,0.15)'};border:1.5px solid ${i===stack.length-1?accent:'rgba(191,95,255,0.3)'};border-radius:6px;font-family:'Orbitron',monospace;font-size:14px;font-weight:700;color:${i===stack.length-1?accent:'#bf5fff'};">${v}</div>`).reverse().join('')}
      <div style="width:88px;height:4px;background:#5050a0;border-radius:2px;margin-top:4px;"></div>
    </div>`;
    wrap.innerHTML=`<div style="display:flex;gap:20px;align-items:flex-start;justify-content:center;width:100%;flex-wrap:wrap;padding:8px;">
      <div style="display:flex;flex-direction:column;align-items:center;gap:8px;">
        <div style="font-family:'Space Mono',monospace;font-size:10px;color:#5050a0;letter-spacing:0.1em;">STACK (top↑)</div>
        ${stackVis}
      </div>
      <div style="display:flex;flex-direction:column;gap:8px;min-width:200px;">
        ${cur?`<div style="background:#0d0d28;border:1.5px solid ${accent};border-radius:12px;padding:14px 18px;text-align:center;">
          <div style="font-family:'Space Mono',monospace;font-size:10px;color:#5050a0;margin-bottom:8px;">NEXT OPERATION</div>
          <div style="font-family:'Orbitron',monospace;font-size:16px;font-weight:700;color:${accent};">${cur.op.toUpperCase()}${cur.val!==undefined?' ('+cur.val+')':''}</div>
        </div>`:'<div style="font-family:\'Orbitron\',monospace;font-size:14px;color:#00ffa3;text-align:center;padding:14px;">All done!</div>'}
        <div style="display:flex;gap:8px;flex-wrap:wrap;">
          ${cur&&cur.op==='push'?`<button onclick="pgSTDo()" class="pg-game-btn primary">PUSH ${cur.val} ↑</button>`:''}
          ${cur&&cur.op==='pop'?`<button onclick="pgSTDo()" class="pg-game-btn primary">POP ↓</button>`:''}
        </div>
        <div style="font-family:'Space Mono',monospace;font-size:10px;color:#5050a0;">Steps: ${step}/${OPS.length}</div>
      </div>
    </div>`;
    if(done){wrap.style.position='relative';wrap.innerHTML+=`<div style="position:absolute;inset:0;background:rgba(4,4,16,0.88);border-radius:12px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;z-index:2;"><div style="font-size:44px;">📚</div><div style="font-family:'Orbitron',monospace;font-size:18px;color:#00ffa3;font-weight:900;">STACK COMPLETE!</div><div style="font-family:'Space Mono',monospace;font-size:12px;color:#9090c0;">${errors} errors · ${tv}s</div><button class="pg-game-btn primary" onclick="pgGameStack('${accent}')" style="margin-top:6px;">Play Again</button></div>`;}
    const er=document.getElementById('st-errs');if(er)er.textContent=errors;
  }
  window.pgSTDo=()=>{const op=OPS[step];if(op.op==='push')stack.push(op.val);else stack.pop();step++;if(step>=OPS.length){done=true;clearInterval(timer);}render();};
  const body=document.getElementById('pg-body');
  body.innerHTML=`<button class="pg-back" onclick="pgBackToHub()">← Back to Hub</button>
    <div style="background:#0d0d28;border:1px solid #2a2a5a;border-radius:14px;padding:14px 18px;font-family:'Space Mono',monospace;font-size:12px;color:#7070a0;line-height:1.7;"><span style="color:${accent};font-weight:700;">🎮 Stack Game:</span> Follow the operations sequence. Click the button to execute each Push/Pop. Watch the LIFO order!</div>
    <div style="display:flex;gap:10px;">${pgStat('st-errs','Errors','#ff8a8a')}${pgStat('st-time','Time',accent)}</div>
    <div class="pg-game-canvas-wrap" style="min-height:220px;position:relative;"><div id="st-board" style="width:100%;"></div></div>
    <div id="st-fb" style="font-family:'Space Mono',monospace;font-size:12px;color:#9090c0;text-align:center;padding:10px;background:#0d0d28;border:1px solid #2a2a5a;border-radius:10px;">Execute operations in order! LIFO = Last In, First Out.</div>
    <div style="display:flex;gap:10px;"><button class="pg-game-btn primary" onclick="pgGameStack('${accent}')">↺ New Game</button></div>`;
  newGame();
}

/* ── Queue Game: enqueue/dequeue in FIFO order ── */
function pgGameQueue(accent) {
  const OPS=[{op:'enq',val:'A'},{op:'enq',val:'B'},{op:'enq',val:'C'},{op:'deq'},{op:'enq',val:'D'},{op:'deq'},{op:'deq'}];
  let queue, step, done, timer, tv;
  function newGame(){queue=[];step=0;done=false;tv=0;if(timer)clearInterval(timer);timer=setInterval(()=>{tv++;const el=document.getElementById('qu-time');if(el)el.textContent=tv+'s';else clearInterval(timer);},1000);render();}
  function render(){
    const wrap=document.getElementById('qu-board');if(!wrap)return;
    const cur=step<OPS.length?OPS[step]:null;
    wrap.innerHTML=`<div style="display:flex;flex-direction:column;gap:14px;width:100%;padding:10px;align-items:center;">
      <div style="display:flex;flex-direction:column;align-items:center;gap:6px;">
        <div style="font-family:'Space Mono',monospace;font-size:10px;color:#5050a0;">← DEQUEUE (front) &nbsp;&nbsp; ENQUEUE (rear) →</div>
        <div style="display:flex;gap:3px;align-items:center;">
          <div style="font-size:20px;">👈</div>
          <div style="display:flex;gap:2px;min-width:200px;min-height:48px;border:1.5px solid #2a2a5a;border-radius:8px;padding:4px;align-items:center;justify-content:flex-start;background:#060618;flex-wrap:wrap;">
            ${queue.length===0?`<span style="font-family:'Space Mono',monospace;font-size:10px;color:#3a3a6a;padding:4px 8px;">Empty</span>`:''}
            ${queue.map((v,i)=>`<div style="width:36px;height:36px;display:flex;align-items:center;justify-content:center;background:${i===0?accent+'44':'rgba(56,189,248,0.15)'};border:1.5px solid ${i===0?accent:'rgba(56,189,248,0.3)'};border-radius:6px;font-family:'Orbitron',monospace;font-size:13px;font-weight:700;color:${i===0?accent:'#38bdf8'};">${v}</div>`).join('')}
          </div>
          <div style="font-size:20px;">👈</div>
        </div>
      </div>
      ${cur?`<div style="background:#0d0d28;border:1.5px solid ${accent};border-radius:12px;padding:12px 20px;text-align:center;"><div style="font-family:'Space Mono',monospace;font-size:10px;color:#5050a0;margin-bottom:6px;">NEXT OPERATION</div><div style="font-family:'Orbitron',monospace;font-size:16px;font-weight:700;color:${accent};">${cur.op==='enq'?'ENQUEUE ('+cur.val+')':'DEQUEUE'}</div></div>`:'<div style="font-family:\'Orbitron\',monospace;font-size:14px;color:#00ffa3;text-align:center;">All done!</div>'}
      <div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center;">
        ${cur&&cur.op==='enq'?`<button onclick="pgQUDo()" class="pg-game-btn primary">ENQUEUE '${cur.val}' →</button>`:''}
        ${cur&&cur.op==='deq'?`<button onclick="pgQUDo()" class="pg-game-btn primary">← DEQUEUE</button>`:''}
      </div>
      <div style="font-family:'Space Mono',monospace;font-size:10px;color:#5050a0;">Steps: ${step}/${OPS.length}</div>
    </div>`;
    if(done){wrap.style.position='relative';wrap.innerHTML+=`<div style="position:absolute;inset:0;background:rgba(4,4,16,0.88);border-radius:12px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;z-index:2;"><div style="font-size:44px;">🚶</div><div style="font-family:'Orbitron',monospace;font-size:18px;color:#00ffa3;font-weight:900;">QUEUE COMPLETE!</div><div style="font-family:'Space Mono',monospace;font-size:12px;color:#9090c0;">${tv}s</div><button class="pg-game-btn primary" onclick="pgGameQueue('${accent}')" style="margin-top:6px;">Play Again</button></div>`;}
  }
  window.pgQUDo=()=>{const op=OPS[step];if(op.op==='enq')queue.push(op.val);else queue.shift();step++;if(step>=OPS.length){done=true;clearInterval(timer);}render();};
  const body=document.getElementById('pg-body');
  body.innerHTML=`<button class="pg-back" onclick="pgBackToHub()">← Back to Hub</button>
    <div style="background:#0d0d28;border:1px solid #2a2a5a;border-radius:14px;padding:14px 18px;font-family:'Space Mono',monospace;font-size:12px;color:#7070a0;line-height:1.7;"><span style="color:${accent};font-weight:700;">🎮 Queue Game:</span> Execute each operation on the queue. FIFO = First In, First Out. Enqueue adds to rear, dequeue removes from front!</div>
    <div style="display:flex;gap:10px;">${pgStat('qu-time','Time',accent)}</div>
    <div class="pg-game-canvas-wrap" style="min-height:220px;position:relative;"><div id="qu-board" style="width:100%;"></div></div>
    <div id="qu-fb" style="font-family:'Space Mono',monospace;font-size:12px;color:#9090c0;text-align:center;padding:10px;background:#0d0d28;border:1px solid #2a2a5a;border-radius:10px;">FIFO: First In, First Out!</div>
    <div style="display:flex;gap:10px;"><button class="pg-game-btn primary" onclick="pgGameQueue('${accent}')">↺ New Game</button></div>`;
  newGame();
}

/* ── BST Insert Game ── */
function pgGameBST(accent) {
  const vals=[5,3,7,1,4,6,8]; let inserted, done, timer, tv;
  function newGame(){inserted=[];done=false;tv=0;if(timer)clearInterval(timer);timer=setInterval(()=>{tv++;const el=document.getElementById('bt-time');if(el)el.textContent=tv+'s';else clearInterval(timer);},1000);render();}
  function buildTree(vals){let root=null;vals.forEach(v=>{root=insert(root,v);});return root;}
  function insert(node,v){if(!node)return{v,left:null,right:null};if(v<node.v)node.left=insert(node.left,v);else node.right=insert(node.right,v);return node;}
  function renderTree(node,x,y,spread){if(!node)return '';const lx=x-spread,rx=x+spread,ny=y+60;let svg='';if(node.left)svg+=`<line x1="${x}" y1="${y}" x2="${lx}" y2="${ny}" stroke="#2a2a5a" stroke-width="1.5"/>`;if(node.right)svg+=`<line x1="${x}" y1="${y}" x2="${rx}" y2="${ny}" stroke="#2a2a5a" stroke-width="1.5"/>`;svg+=`<circle cx="${x}" cy="${y}" r="18" fill="${inserted.includes(node.v)?accent+'33':'#0d0d28'}" stroke="${inserted.includes(node.v)?accent:'#3a3a6a'}" stroke-width="2"/>`;svg+=`<text x="${x}" y="${y+5}" fill="${inserted.includes(node.v)?accent:'#9090c0'}" font-family="Orbitron,monospace" font-size="12" text-anchor="middle" font-weight="700">${node.v}</text>`;if(node.left)svg+=renderTree(node.left,lx,ny,spread/2);if(node.right)svg+=renderTree(node.right,rx,ny,spread/2);return svg;}
  function render(){
    const wrap=document.getElementById('bt-board');if(!wrap)return;
    const tree=buildTree(vals);
    const next=vals[inserted.length];
    wrap.innerHTML=`<div style="display:flex;flex-direction:column;align-items:center;gap:12px;width:100%;padding:8px;">
      <svg width="420" height="240" style="overflow:visible;">${renderTree(tree,210,30,90)}</svg>
      ${next!==undefined?`<div style="font-family:'Space Mono',monospace;font-size:12px;color:#9090c0;text-align:center;">Insert <span style="color:${accent};font-weight:700;font-size:16px;">${next}</span> — click where it goes in the tree above, or just press Insert!</div>`:''}
    </div>`;
    if(done){wrap.style.position='relative';wrap.innerHTML+=`<div style="position:absolute;inset:0;background:rgba(4,4,16,0.88);border-radius:12px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;z-index:2;"><div style="font-size:44px;">🌳</div><div style="font-family:'Orbitron',monospace;font-size:18px;color:#00ffa3;font-weight:900;">BST BUILT!</div><div style="font-family:'Space Mono',monospace;font-size:12px;color:#9090c0;">${tv}s</div><button class="pg-game-btn primary" onclick="pgGameBST('${accent}')" style="margin-top:6px;">Play Again</button></div>`;}
    const fb=document.getElementById('bt-fb');if(fb&&!done&&next!==undefined){fb.textContent=`Inserting ${next}: go left if < parent, right if > parent.`;fb.style.color='#9090c0';}
  }
  const body=document.getElementById('pg-body');
  body.innerHTML=`<button class="pg-back" onclick="pgBackToHub()">← Back to Hub</button>
    <div style="background:#0d0d28;border:1px solid #2a2a5a;border-radius:14px;padding:14px 18px;font-family:'Space Mono',monospace;font-size:12px;color:#7070a0;line-height:1.7;"><span style="color:${accent};font-weight:700;">🎮 BST Game:</span> Watch nodes insert into the Binary Search Tree. Press "Insert Next" to insert one at a time and see the BST grow.</div>
    <div style="display:flex;gap:10px;">${pgStat('bt-time','Time',accent)}</div>
    <div class="pg-game-canvas-wrap" style="min-height:260px;position:relative;flex-direction:column;"><div id="bt-board" style="width:100%;display:flex;justify-content:center;"></div></div>
    <div id="bt-fb" style="font-family:'Space Mono',monospace;font-size:12px;color:#9090c0;text-align:center;padding:10px;background:#0d0d28;border:1px solid #2a2a5a;border-radius:10px;"></div>
    <div style="display:flex;gap:10px;"><button class="pg-game-btn primary" onclick="window.pgBTNext()">Insert Next →</button><button class="pg-game-btn" onclick="pgGameBST('${accent}')">↺ Reset</button></div>`;
  window.pgBTNext=()=>{if(inserted.length<vals.length){inserted.push(vals[inserted.length]);if(inserted.length===vals.length){done=true;clearInterval(timer);}}render();};
  newGame();
}

/* ── AVL/Tree Traversal/Red-Black: simplified visual quiz ── */
function pgGameAVL(accent){pgGameGenericVisual(accent,'AVL Tree Rotations','avl','AVL Game: Identify the rotation type!',['LL → Right Rotate','RR → Left Rotate','LR → Left then Right','RL → Right then Left'],['LL','RR','LR','RL'],['Right rotation','Left rotation','Left-Right rotation','Right-Left rotation']);}
function pgGameTreeTraversal(accent){
  const body=document.getElementById('pg-body');
  const TREE={v:4,left:{v:2,left:{v:1,left:null,right:null},right:{v:3,left:null,right:null}},right:{v:6,left:{v:5,left:null,right:null},right:{v:7,left:null,right:null}}};
  function inorder(n,r=[]){if(!n)return r;inorder(n.left,r);r.push(n.v);inorder(n.right,r);return r;}
  function preorder(n,r=[]){if(!n)return r;r.push(n.v);preorder(n.left,r);preorder(n.right,r);return r;}
  function postorder(n,r=[]){if(!n)return r;postorder(n.left,r);postorder(n.right,r);r.push(n.v);return r;}
  const modes=[{name:'INORDER',order:inorder(TREE),hint:'Left → Root → Right'},{name:'PREORDER',order:preorder(TREE),hint:'Root → Left → Right'},{name:'POSTORDER',order:postorder(TREE),hint:'Left → Right → Root'}];
  let modeIdx=0,clicked,done,errors,timer,tv;
  function newGame(m=0){modeIdx=m;clicked=[];done=false;errors=0;tv=0;if(timer)clearInterval(timer);timer=setInterval(()=>{tv++;const el=document.getElementById('tt-time');if(el)el.textContent=tv+'s';else clearInterval(timer);},1000);render();}
  function renderNode(n,x,y,sp){if(!n)return '';const ord=modes[modeIdx].order,idx=clicked.indexOf(n.v),isC=idx>=0,isNext=ord[clicked.length]===n.v;const col=isC?accent:(isNext?'#ffe040':'#3a3a6a');let svg='';if(n.left){const nx=x-sp,ny=y+60;svg+=`<line x1="${x}" y1="${y}" x2="${nx}" y2="${ny}" stroke="#2a2a5a" stroke-width="1.5"/>`;svg+=renderNode(n.left,nx,ny,sp/2);}if(n.right){const nx=x+sp,ny=y+60;svg+=`<line x1="${x}" y1="${y}" x2="${nx}" y2="${ny}" stroke="#2a2a5a" stroke-width="1.5"/>`;svg+=renderNode(n.right,nx,ny,sp/2);}svg+=`<g onclick="pgTTClick(${n.v})" style="cursor:pointer;"><circle cx="${x}" cy="${y}" r="20" fill="${isC?accent+'33':isNext?'rgba(255,224,64,0.15)':'rgba(42,42,90,0.5)'}" stroke="${col}" stroke-width="2"/>${isC?`<text x="${x}" y="${y-24}" fill="${accent}" font-family="Orbitron,monospace" font-size="10" text-anchor="middle">${idx+1}</text>`:''}<text x="${x}" y="${y+5}" fill="${col}" font-family="Orbitron,monospace" font-size="13" text-anchor="middle" font-weight="700">${n.v}</text></g>`;return svg;}
  function render(){
    const wrap=document.getElementById('tt-board');if(!wrap)return;
    const m=modes[modeIdx];
    wrap.innerHTML=`<div style="display:flex;flex-direction:column;align-items:center;gap:8px;width:100%;padding:8px;">
      <div style="font-family:'Space Mono',monospace;font-size:10px;color:#5050a0;">${m.hint}</div>
      <svg width="380" height="220" style="overflow:visible;">${renderNode(TREE,190,30,80)}</svg>
    </div>`;
    if(done){wrap.style.position='relative';wrap.innerHTML+=`<div style="position:absolute;inset:0;background:rgba(4,4,16,0.88);border-radius:12px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;z-index:2;"><div style="font-size:44px;">🚶</div><div style="font-family:'Orbitron',monospace;font-size:18px;color:#00ffa3;font-weight:900;">${m.name} DONE!</div><div style="font-family:'Space Mono',monospace;font-size:12px;color:#9090c0;">${errors} errors · ${tv}s · Order: ${m.order.join('→')}</div><div style="display:flex;gap:8px;margin-top:6px;">${modes.map((mm,i)=>`<button onclick="window.pgTTNewGame(${i})" class="pg-game-btn${i===modeIdx?' primary':''}">${mm.name}</button>`).join('')}</div></div>`;}
    const er=document.getElementById('tt-errs');if(er)er.textContent=errors;
    const fb=document.getElementById('tt-fb');if(fb&&!done){const nx=m.order[clicked.length];fb.textContent=`${m.name} (${m.hint}): click node ${nx} next (${clicked.length+1}/${m.order.length})`;fb.style.color='#9090c0';}
  }
  window.pgTTClick=(v)=>{if(done)return;const m=modes[modeIdx];const exp=m.order[clicked.length];if(v===exp){clicked.push(v);if(clicked.length===m.order.length){done=true;clearInterval(timer);}}else{errors++;const fb=document.getElementById('tt-fb');if(fb){fb.textContent=`❌ Expected ${exp}. Remember: ${m.hint}`;fb.style.color='#ff8a8a';}}render();};
  window.pgTTNewGame=newGame;
  body.innerHTML=`<button class="pg-back" onclick="pgBackToHub()">← Back to Hub</button>
    <div style="background:#0d0d28;border:1px solid #2a2a5a;border-radius:14px;padding:14px 18px;font-family:'Space Mono',monospace;font-size:12px;color:#7070a0;line-height:1.7;"><span style="color:${accent};font-weight:700;">🎮 Traversal Game:</span> Click nodes in the correct traversal order. Yellow = next expected node.</div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;">${modes.map((m,i)=>`<button onclick="window.pgTTNewGame(${i})" class="pg-game-btn${i===0?' primary':''}">${m.name}</button>`).join('')}</div>
    <div style="display:flex;gap:10px;">${pgStat('tt-errs','Errors','#ff8a8a')}${pgStat('tt-time','Time',accent)}</div>
    <div class="pg-game-canvas-wrap" style="min-height:250px;position:relative;"><div id="tt-board" style="width:100%;display:flex;justify-content:center;"></div></div>
    <div id="tt-fb" style="font-family:'Space Mono',monospace;font-size:12px;color:#9090c0;text-align:center;padding:10px;background:#0d0d28;border:1px solid #2a2a5a;border-radius:10px;"></div>
    <div style="display:flex;gap:10px;"><button class="pg-game-btn primary" onclick="window.pgTTNewGame(0)">↺ Reset</button></div>`;
  newGame(0);
}
function pgGameRBT(accent){pgGameTreeTraversal(accent);}

/* ── Generic visual quiz for many experiments ── */
function pgGameGenericVisual(accent,title,id,instruction,options,answers,explanations){
  const body=document.getElementById('pg-body');
  let score=0,q=0,done=false,timer,tv;
  const questions=answers.map((a,i)=>({q:`Which rotation fixes: ${a} imbalance?`,choices:options,a:i,explain:explanations[i]}));
  function render(){
    const wrap=document.getElementById(id+'-board');if(!wrap)return;
    if(q>=questions.length){wrap.innerHTML=`<div style="text-align:center;padding:30px;"><div style="font-size:44px;">🏆</div><div style="font-family:'Orbitron',monospace;font-size:18px;color:#00ffa3;font-weight:900;margin-top:10px;">Score: ${score}/${questions.length}</div></div>`;if(timer)clearInterval(timer);return;}
    const curr=questions[q];
    wrap.innerHTML=`<div style="padding:16px;display:flex;flex-direction:column;gap:12px;">
      <div style="font-family:'Space Mono',monospace;font-size:13px;color:#c8c8ff;background:#0d0d28;border:1px solid #2a2a5a;border-radius:10px;padding:14px;">${curr.q}</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
        ${curr.choices.map((c,i)=>`<button onclick="pgGVAnswer(${i})" style="padding:10px;border-radius:8px;border:1px solid #2a2a5a;background:#0d0d28;color:#c8c8ff;font-family:'Space Mono',monospace;font-size:11px;cursor:pointer;text-align:left;transition:all 0.15s;" onmouseover="this.style.borderColor='${accent}'" onmouseout="this.style.borderColor='#2a2a5a'">${String.fromCharCode(65+i)}. ${c}</button>`).join('')}
      </div>
      <div id="${id}-fb" style="font-family:'Space Mono',monospace;font-size:12px;color:#5050a0;text-align:center;padding:8px;background:#060618;border-radius:8px;">Q ${q+1}/${questions.length} · Score: ${score}</div>
    </div>`;
  }
  window.pgGVAnswer=(i)=>{
    const curr=questions[q];const correct=i===curr.a;if(correct)score++;
    document.querySelectorAll(`#${id}-board button`).forEach((btn,bi)=>{btn.disabled=true;if(bi===curr.a)btn.style.background='rgba(0,255,163,0.2)';else if(bi===i&&!correct)btn.style.background='rgba(255,71,87,0.2)';});
    const fb=document.getElementById(id+'-fb');if(fb){fb.textContent=correct?`✅ Correct! ${curr.explain}`:`❌ Answer: ${curr.explain}`;fb.style.color=correct?'#00ffa3':'#ff8a8a';}
    setTimeout(()=>{q++;render();},1400);
  };
  body.innerHTML=`<button class="pg-back" onclick="pgBackToHub()">← Back to Hub</button>
    <div style="background:#0d0d28;border:1px solid #2a2a5a;border-radius:14px;padding:14px 18px;font-family:'Space Mono',monospace;font-size:12px;color:#7070a0;line-height:1.7;"><span style="color:${accent};font-weight:700;">🎮 ${title}:</span> ${instruction}</div>
    <div style="display:flex;gap:10px;">${pgStat(id+'-time','Time',accent)}</div>
    <div class="pg-game-canvas-wrap" style="min-height:200px;position:relative;"><div id="${id}-board" style="width:100%;"></div></div>
    <div style="display:flex;gap:10px;"><button class="pg-game-btn primary" onclick="pgGameGenericVisual('${accent}','${title}','${id}','${instruction}',[${options.map(o=>`'${o}'`)}],[${answers.map(a=>`'${a}'`)}],[${explanations.map(e=>`'${e}'`)}])">↺ Restart</button></div>`;
  if(timer)clearInterval(timer);timer=setInterval(()=>{tv++;const el=document.getElementById(id+'-time');if(el)el.textContent=tv+'s';else clearInterval(timer);},1000);
  render();
}

/* ── Topo Sort game ── */
function pgGameTopo(accent){
  const body=document.getElementById('pg-body');
  const NODES=['Compile','Test','Package','Deploy','Notify'],EDGES=[[0,1],[0,2],[1,2],[2,3],[3,4]];
  const ADJ=Array.from({length:5},()=>[]);EDGES.forEach(([u,v])=>{ADJ[u].push(v);});
  const indeg=Array(5).fill(0);EDGES.forEach(([,v])=>indeg[v]++);
  const validFirsts=new Set();indeg.forEach((d,i)=>{if(d===0)validFirsts.add(i);});
  let order,indegCur,done,errors,timer,tv;
  function newGame(){order=[];indegCur=[...indeg];done=false;errors=0;tv=0;if(timer)clearInterval(timer);timer=setInterval(()=>{tv++;const el=document.getElementById('tp-time');if(el)el.textContent=tv+'s';else clearInterval(timer);},1000);render();}
  function render(){
    const wrap=document.getElementById('tp-board');if(!wrap)return;
    const available=new Set(indegCur.map((d,i)=>d===0&&!order.includes(i)?i:-1).filter(i=>i>=0));
    const W=460,H=200;
    let svg=`<svg width="${W}" height="${H}" style="overflow:visible;">`;
    const nx=[60,140,220,320,400],ny=[100,40,100,100,100];
    EDGES.forEach(([u,v])=>{const done2=order.includes(u)&&order.includes(v);svg+=`<line x1="${nx[u]}" y1="${ny[u]}" x2="${nx[v]}" y2="${ny[v]}" stroke="${done2?accent:'#2a2a5a'}" stroke-width="${done2?2:1.5}" marker-end="url(#arr)" opacity="${done2?.9:.4}"/>`;});
    svg+=`<defs><marker id="arr" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto"><polygon points="0 0, 8 3, 0 6" fill="#5050a0"/></marker></defs>`;
    NODES.forEach((n,i)=>{const inOrder=order.includes(i),isAvail=available.has(i),col=inOrder?accent:(isAvail?'#ffe040':'#3a3a6a');svg+=`<g onclick="${isAvail?`pgTPClick(${i})`:''}" style="cursor:${isAvail?'pointer':'default'};"><circle cx="${nx[i]}" cy="${ny[i]}" r="28" fill="${inOrder?accent+'33':isAvail?'rgba(255,224,64,0.12)':'rgba(42,42,90,0.5)'}" stroke="${col}" stroke-width="2"/><text x="${nx[i]}" y="${ny[i]-8}" fill="${col}" font-family="Space Mono,monospace" font-size="9" text-anchor="middle">${inOrder?order.indexOf(i)+1:'?'}</text><text x="${nx[i]}" y="${ny[i]+5}" fill="${col}" font-family="Space Mono,monospace" font-size="9" text-anchor="middle">${n.split('').slice(0,5).join('')}</text></g>`;});
    svg+=`</svg>`;
    wrap.innerHTML=svg;
    if(done){wrap.style.position='relative';wrap.innerHTML+=`<div style="position:absolute;inset:0;background:rgba(4,4,16,0.88);border-radius:12px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;z-index:2;"><div style="font-size:44px;">📋</div><div style="font-family:'Orbitron',monospace;font-size:18px;color:#00ffa3;font-weight:900;">TOPO ORDER FOUND!</div><div style="font-family:'Space Mono',monospace;font-size:12px;color:#9090c0;">${NODES.map((_,i)=>NODES[order[i]]).join('→')} · ${errors} errors · ${tv}s</div><button class="pg-game-btn primary" onclick="pgGameTopo('${accent}')" style="margin-top:6px;">Play Again</button></div>`;}
    const er=document.getElementById('tp-errs');if(er)er.textContent=errors;
    const fb=document.getElementById('tp-fb');if(fb&&!done){fb.textContent=`Click any yellow node (in-degree=0) to process it. Available: ${[...available].map(i=>NODES[i]).join(', ')}`;fb.style.color='#9090c0';}
  }
  window.pgTPClick=(i)=>{order.push(i);ADJ[i].forEach(v=>indegCur[v]--);if(order.length===NODES.length){done=true;clearInterval(timer);}render();};
  pgGameShell(accent,'Topological Sort Game','Click nodes with <strong style="color:#ffe040;">in-degree 0</strong> (no unfulfilled dependencies). Process tasks in dependency order!',pgStat('tp-errs','Errors','#ff8a8a')+pgStat('tp-time','Time',accent),'tp-board','tp-fb',`<button class="pg-game-btn primary" onclick="pgGameTopo('${accent}')">↺ New Game</button>`);
  newGame();
}

/* ── Kruskal/Prim: pick cheapest edge that doesn't form cycle ── */
function pgGameKruskal(accent){pgGameMSTGame(accent,'Kruskal');}
function pgGamePrim(accent){pgGameMSTGame(accent,'Prim');}
function pgGameMSTGame(accent,algo){
  const body=document.getElementById('pg-body');
  const ND=[{x:80,y:120},{x:220,y:50},{x:360,y:120},{x:150,y:250},{x:300,y:250}];
  const ED=[{u:0,v:1,w:4},{u:0,v:3,w:2},{u:1,v:2,w:5},{u:1,v:3,w:3},{u:2,v:4,w:1},{u:3,v:4,w:6},{u:1,v:4,w:7}];
  const sorted=[...ED].sort((a,b)=>a.w-b.w);
  let mst,uf,done,errors,timer,tv;
  function find(p,x){while(p[x]!==x)x=p[x]=p[p[x]];return x;}
  function union(p,x,y){p[find(p,x)]=find(p,y);}
  function newGame(){mst=[];uf=[0,1,2,3,4];done=false;errors=0;tv=0;if(timer)clearInterval(timer);timer=setInterval(()=>{tv++;const el=document.getElementById('ms2-time');if(el)el.textContent=tv+'s';else clearInterval(timer);},1000);render();}
  function getNextMSTEdge(){return sorted.find(e=>!mst.includes(e)&&find([...uf],e.u)!==find([...uf],e.v));}
  function render(){
    const wrap=document.getElementById('ms2-board');if(!wrap)return;
    const nextEdge=getNextMSTEdge();
    let svg=`<svg width="460" height="310" style="overflow:visible;">`;
    ED.forEach(e=>{const inMST=mst.includes(e),isNext=e===nextEdge;svg+=`<line x1="${ND[e.u].x}" y1="${ND[e.u].y}" x2="${ND[e.v].x}" y2="${ND[e.v].y}" stroke="${inMST?accent:isNext?'#ffe040':'#3a3a6a'}" stroke-width="${inMST?3:isNext?2:1.5}" opacity="${inMST||isNext?1:0.5}"/>`;svg+=`<text x="${(ND[e.u].x+ND[e.v].x)/2}" y="${(ND[e.u].y+ND[e.v].y)/2-6}" fill="${inMST?accent:isNext?'#ffe040':'#5050a0'}" font-family="Space Mono,monospace" font-size="12" text-anchor="middle" font-weight="700">${e.w}</text>`;});
    ND.forEach((n,i)=>{svg+=`<circle cx="${n.x}" cy="${n.y}" r="18" fill="${mst.some(e=>e.u===i||e.v===i)?accent+'33':'#0d0d28'}" stroke="${mst.some(e=>e.u===i||e.v===i)?accent:'#3a3a6a'}" stroke-width="2"/>`;svg+=`<text x="${n.x}" y="${n.y+5}" fill="#c8c8ff" font-family="Orbitron,monospace" font-size="12" text-anchor="middle" font-weight="700">${i}</text>`;});
    svg+=`</svg>`;
    wrap.innerHTML=svg;
    if(done){wrap.style.position='relative';const totalW=mst.reduce((s,e)=>s+e.w,0);wrap.innerHTML+=`<div style="position:absolute;inset:0;background:rgba(4,4,16,0.88);border-radius:12px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;z-index:2;"><div style="font-size:44px;">🌉</div><div style="font-family:'Orbitron',monospace;font-size:18px;color:#00ffa3;font-weight:900;">MST FOUND!</div><div style="font-family:'Space Mono',monospace;font-size:12px;color:#9090c0;">Total weight: ${totalW} · ${errors} errors · ${tv}s</div><button class="pg-game-btn primary" onclick="pgGameMSTGame('${accent}','${algo}')" style="margin-top:6px;">Play Again</button></div>`;}
    const er=document.getElementById('ms2-errs');if(er)er.textContent=errors;
    const fb=document.getElementById('ms2-fb');
    if(fb&&!done&&nextEdge){fb.textContent=`Next cheapest valid edge: ${nextEdge.u}—${nextEdge.v} (weight ${nextEdge.w}). Click it!`;fb.style.color='#9090c0';}
    // Add click handlers to edges
    ED.forEach((e,idx)=>{const el=document.getElementById(`mst-edge-${idx}`);});
    // Re-render with clickable edge labels
    let svg2=`<svg width="460" height="310" style="overflow:visible;">`;
    ED.forEach((e,idx)=>{const inMST=mst.includes(e),isNext=e===nextEdge;const mx=(ND[e.u].x+ND[e.v].x)/2,my=(ND[e.u].y+ND[e.v].y)/2;svg2+=`<line x1="${ND[e.u].x}" y1="${ND[e.u].y}" x2="${ND[e.v].x}" y2="${ND[e.v].y}" stroke="${inMST?accent:isNext?'#ffe040':'#3a3a6a'}" stroke-width="${inMST?3:isNext?2:1.5}" opacity="${inMST||isNext?1:0.5}"/>`;svg2+=`<g onclick="${!inMST?`pgMSTClick(${idx})`:''}" style="cursor:${!inMST?'pointer':'default'};"><circle cx="${mx}" cy="${my}" r="12" fill="${inMST?accent+'22':isNext?'rgba(255,224,64,0.2)':'rgba(30,30,60,0.6)'}" stroke="${inMST?accent:isNext?'#ffe040':'#3a3a6a'}" stroke-width="1.5"/><text x="${mx}" y="${my+4}" fill="${inMST?accent:isNext?'#ffe040':'#7070a0'}" font-family="Space Mono,monospace" font-size="11" text-anchor="middle" font-weight="700">${e.w}</text></g>`;});
    ND.forEach((n,i)=>{svg2+=`<circle cx="${n.x}" cy="${n.y}" r="18" fill="${mst.some(e=>e.u===i||e.v===i)?accent+'33':'#0d0d28'}" stroke="${mst.some(e=>e.u===i||e.v===i)?accent:'#3a3a6a'}" stroke-width="2"/>`;svg2+=`<text x="${n.x}" y="${n.y+5}" fill="#c8c8ff" font-family="Orbitron,monospace" font-size="12" text-anchor="middle" font-weight="700">${i}</text>`;});
    svg2+=`</svg>`;
    wrap.innerHTML=svg2;
  }
  window.pgMSTClick=(idx)=>{
    const e=ED[idx];if(mst.includes(e))return;
    const fb=document.getElementById('ms2-fb');
    const nextEdge=getNextMSTEdge();
    if(find([...uf],e.u)===find([...uf],e.v)){errors++;if(fb){fb.textContent=`❌ This edge forms a cycle! Skip it.`;fb.style.color='#ff8a8a';}return;}
    if(e!==nextEdge){errors++;if(fb){fb.textContent=`❌ Not cheapest valid edge! Take w=${nextEdge.w} first.`;fb.style.color='#ff8a8a';}return;}
    mst.push(e);union(uf,e.u,e.v);
    if(mst.length===ND.length-1){done=true;clearInterval(timer);}
    render();
  };
  body.innerHTML=`<button class="pg-back" onclick="pgBackToHub()">← Back to Hub</button>
    <div style="background:#0d0d28;border:1px solid #2a2a5a;border-radius:14px;padding:14px 18px;font-family:'Space Mono',monospace;font-size:12px;color:#7070a0;line-height:1.7;"><span style="color:${accent};font-weight:700;">🎮 ${algo} MST Game:</span> Click the edge weights to add them to the MST. Always pick the cheapest edge that doesn't form a cycle!</div>
    <div style="display:flex;gap:10px;">${pgStat('ms2-errs','Errors','#ff8a8a')}${pgStat('ms2-time','Time',accent)}</div>
    <div class="pg-game-canvas-wrap" style="min-height:320px;position:relative;"><div id="ms2-board" style="width:100%;display:flex;justify-content:center;padding:10px;"></div></div>
    <div id="ms2-fb" style="font-family:'Space Mono',monospace;font-size:12px;color:#9090c0;text-align:center;padding:10px;background:#0d0d28;border:1px solid #2a2a5a;border-radius:10px;"></div>
    <div style="display:flex;gap:10px;"><button class="pg-game-btn primary" onclick="pgGameMSTGame('${accent}','${algo}')">↺ New Game</button></div>`;
  newGame();
}

/* ── Bellman-Ford: guess relaxed distances ── */
function pgGameBellman(accent){
  const body=document.getElementById('pg-body');
  // Small graph with negative edge
  const ND=[{l:'A',x:60,y:120},{l:'B',x:200,y:50},{l:'C',x:340,y:120},{l:'D',x:200,y:220}];
  const ED=[{u:0,v:1,w:1},{u:0,v:2,w:4},{u:1,v:2,w:-2},{u:1,v:3,w:3},{u:3,v:2,w:1}];
  // True distances from A
  const DIST=[0,1,-1,4];
  let userD,done,errors,timer,tv,sel;
  function newGame(){userD=Array(4).fill(null);userD[0]=0;done=false;errors=0;tv=0;sel=null;if(timer)clearInterval(timer);timer=setInterval(()=>{tv++;const el=document.getElementById('bf2-time');if(el)el.textContent=tv+'s';else clearInterval(timer);},1000);render();}
  function render(){
    const wrap=document.getElementById('bf2-board');if(!wrap)return;
    let svg=`<svg width="440" height="290" style="overflow:visible;">`;
    ED.forEach(({u,v,w})=>{const neg=w<0;svg+=`<line x1="${ND[u].x}" y1="${ND[u].y}" x2="${ND[v].x}" y2="${ND[v].y}" stroke="${neg?'#ff8a8a':'#3a3a6a'}" stroke-width="1.5" opacity=".7"/>`;svg+=`<text x="${(ND[u].x+ND[v].x)/2}" y="${(ND[u].y+ND[v].y)/2-7}" fill="${neg?'#ff8a8a':'#ffe040'}" font-family="Space Mono,monospace" font-size="12" text-anchor="middle" font-weight="700">${w}</text>`;});
    ND.forEach((n,i)=>{const hasD=userD[i]!==null,isOk=hasD&&userD[i]===DIST[i],isWrong=hasD&&!isOk,isSel=sel===i;const col=isWrong?'#ff4757':(isOk?'#00ffa3':(isSel?'#ffe040':accent));svg+=`<g onclick="pgBF2Click(${i})" style="cursor:pointer;"><circle cx="${n.x}" cy="${n.y}" r="26" fill="rgba(${col.slice(1).match(/../g).map(x=>parseInt(x,16)).join(',')},0.15)" stroke="${col}" stroke-width="2.5"/><text x="${n.x}" y="${n.y+5}" fill="${col}" font-family="Orbitron,monospace" font-size="14" text-anchor="middle" font-weight="900">${n.l}</text>${hasD?`<text x="${n.x}" y="${n.y+24}" fill="${col}" font-family="Space Mono,monospace" font-size="10" text-anchor="middle">[${userD[i]}]</text>`:`<text x="${n.x}" y="${n.y+24}" fill="#3a3a6a" font-family="Space Mono,monospace" font-size="10" text-anchor="middle">[?]</text>`}</g>`;});
    svg+=`</svg>`;
    let numpad='';
    if(sel!==null&&sel!==0){const negOpts=[-3,-2,-1,0,1,2,3,4,5];numpad=`<div style="margin-top:8px;text-align:center;"><div style="font-family:'Space Mono',monospace;font-size:11px;color:#7070a0;margin-bottom:8px;">Shortest dist A→${ND[sel].l} (note: negative edges allowed!):</div><div style="display:flex;gap:5px;justify-content:center;flex-wrap:wrap;">${negOpts.map(n=>`<button onclick="pgBF2Enter(${n})" style="width:38px;height:38px;border-radius:8px;border:1px solid rgba(248,113,113,0.3);background:rgba(248,113,113,0.07);color:#f87171;font-family:'Orbitron',monospace;font-size:12px;cursor:pointer;" onmouseover="this.style.background='rgba(248,113,113,0.25)'" onmouseout="this.style.background='rgba(248,113,113,0.07)'">${n}</button>`).join('')}<button onclick="pgBF2Clear()" style="padding:0 10px;height:38px;border-radius:8px;border:1px solid rgba(255,71,87,0.3);background:rgba(255,71,87,0.07);color:#ff6b7a;font-family:'Space Mono',monospace;font-size:12px;cursor:pointer;">CLR</button></div></div>`;}
    wrap.innerHTML=`<div style="display:flex;flex-direction:column;align-items:center;">${svg}${numpad}</div>`;
    if(done){wrap.style.position='relative';wrap.innerHTML+=`<div style="position:absolute;inset:0;background:rgba(4,4,16,0.88);border-radius:12px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;z-index:2;"><div style="font-size:44px;">🛡</div><div style="font-family:'Orbitron',monospace;font-size:18px;color:#00ffa3;font-weight:900;">DISTANCES FOUND!</div><div style="font-family:'Space Mono',monospace;font-size:11px;color:#7070a0;">A=0, B=1, C=-1, D=4 (note negative weights!)</div><div style="font-family:'Space Mono',monospace;font-size:12px;color:#9090c0;">${errors} errors · ${tv}s</div><button class="pg-game-btn primary" onclick="pgGameBellman('${accent}')" style="margin-top:6px;">Play Again</button></div>`;}
    const er=document.getElementById('bf2-errs');if(er)er.textContent=errors;
    const fb=document.getElementById('bf2-fb');if(fb&&!done){fb.textContent='Note red edges have NEGATIVE weights! Click a node to set its shortest distance.';fb.style.color='#9090c0';}
  }
  window.pgBF2Click=(i)=>{if(i===0)return;sel=i;render();};
  window.pgBF2Enter=(n)=>{if(sel===null)return;const fb=document.getElementById('bf2-fb');userD[sel]=n;if(n!==DIST[sel]){errors++;if(fb){fb.textContent=`❌ Wrong! dist[${ND[sel].l}]=${DIST[sel]} (use Bellman-Ford relaxation!)`;fb.style.color='#ff8a8a';}}else{if(fb){fb.textContent=`✅ Correct! ${ND[sel].l}=${n}`;fb.style.color='#00ffa3';}}if(ND.every((_,i2)=>userD[i2]===DIST[i2])){done=true;clearInterval(timer);}sel=null;render();};
  window.pgBF2Clear=()=>{if(sel!==null)userD[sel]=null;render();};
  body.innerHTML=`<button class="pg-back" onclick="pgBackToHub()">← Back to Hub</button>
    <div style="background:#0d0d28;border:1px solid #2a2a5a;border-radius:14px;padding:14px 18px;font-family:'Space Mono',monospace;font-size:12px;color:#7070a0;line-height:1.7;"><span style="color:${accent};font-weight:700;">🎮 Bellman-Ford Game:</span> <span style="color:#ff8a8a;">Red edges have NEGATIVE weights!</span> Click each node and enter its correct shortest distance from A.</div>
    <div style="display:flex;gap:10px;">${pgStat('bf2-errs','Errors','#ff8a8a')}${pgStat('bf2-time','Time',accent)}</div>
    <div class="pg-game-canvas-wrap" style="min-height:270px;position:relative;flex-direction:column;"><div id="bf2-board" style="width:100%;padding:10px;"></div></div>
    <div id="bf2-fb" style="font-family:'Space Mono',monospace;font-size:12px;color:#9090c0;text-align:center;padding:10px;background:#0d0d28;border:1px solid #2a2a5a;border-radius:10px;"></div>
    <div style="display:flex;gap:10px;"><button class="pg-game-btn primary" onclick="pgGameBellman('${accent}')">↺ New Game</button></div>`;
  newGame();
}

/* ── KMP: match pattern step by step ── */
function pgGameKMP(accent){
  const TEXT='AABAABAAC', PAT='AABAA';
  const body=document.getElementById('pg-body');
  let i,j,done,errors,timer,tv,found;
  function lps(){const L=Array(PAT.length).fill(0);let l=0,k=1;while(k<PAT.length){if(PAT[k]===PAT[l]){L[k++]=++l;}else if(l){l=L[l-1];}else L[k++]=0;}return L;}
  const LPS=lps();
  function newGame(){i=0;j=0;done=false;errors=0;tv=0;found=false;if(timer)clearInterval(timer);timer=setInterval(()=>{tv++;const el=document.getElementById('km-time');if(el)el.textContent=tv+'s';else clearInterval(timer);},1000);render();}
  function render(){
    const wrap=document.getElementById('km-board');if(!wrap)return;
    const tCells=TEXT.split('').map((c,idx)=>{const isI=idx===i,matched=idx>=i-j&&idx<i;return `<div style="width:36px;height:36px;display:flex;align-items:center;justify-content:center;border-radius:6px;font-family:'Orbitron',monospace;font-size:14px;font-weight:700;background:${isI?accent+'44':matched?'rgba(0,255,163,0.2)':'#0d0d28'};color:${isI?accent:matched?'#00ffa3':'#c8c8ff'};border:1.5px solid ${isI?accent:matched?'rgba(0,255,163,0.4)':'#2a2a5a'};">${c}</div>`;}).join('');
    const pCells=PAT.split('').map((c,idx)=>{const isJ=idx===j,past=idx<j;return `<div style="width:36px;height:36px;display:flex;align-items:center;justify-content:center;border-radius:6px;font-family:'Orbitron',monospace;font-size:14px;font-weight:700;background:${isJ?'rgba(255,224,64,0.3)':past?'rgba(0,255,163,0.2)':'#0d0d28'};color:${isJ?'#ffe040':past?'#00ffa3':'#9090c0'};border:1.5px solid ${isJ?'#ffe040':past?'rgba(0,255,163,0.4)':'#2a2a5a'};">${c}</div>`;}).join('');
    const nextChar=i<TEXT.length?TEXT[i]:'—', patChar=j<PAT.length?PAT[j]:'—';
    wrap.innerHTML=`<div style="display:flex;flex-direction:column;gap:10px;padding:10px;align-items:center;">
      <div><div style="font-family:'Space Mono',monospace;font-size:10px;color:#5050a0;margin-bottom:4px;">TEXT:</div><div style="display:flex;gap:3px;">${tCells}</div></div>
      <div style="margin-left:${(i-j)*39}px;"><div style="font-family:'Space Mono',monospace;font-size:10px;color:#5050a0;margin-bottom:4px;">PATTERN:</div><div style="display:flex;gap:3px;">${pCells}</div></div>
      ${found?`<div style="font-family:'Orbitron',monospace;font-size:14px;color:#00ffa3;text-align:center;">🎉 Pattern found at index ${i-j}!</div>`:`<div style="font-family:'Space Mono',monospace;font-size:12px;color:#9090c0;text-align:center;">Text[${i}]='${nextChar}' vs Pattern[${j}]='${patChar}' — ${nextChar===patChar?'MATCH! Click ✓':'MISMATCH! Click ✗'}</div>`}
      <div style="display:flex;gap:10px;">${!done?`<button onclick="pgKMPStep(true)" style="padding:10px 20px;border-radius:8px;background:rgba(0,255,163,0.2);border:1.5px solid #00ffa3;color:#00ffa3;font-family:'Space Mono',monospace;font-size:13px;cursor:pointer;">✓ Match</button><button onclick="pgKMPStep(false)" style="padding:10px 20px;border-radius:8px;background:rgba(255,71,87,0.2);border:1.5px solid #ff4757;color:#ff8a8a;font-family:'Space Mono',monospace;font-size:13px;cursor:pointer;">✗ Mismatch</button>`:''}
      </div>
    </div>`;
    if(done){wrap.style.position='relative';wrap.innerHTML+=`<div style="position:absolute;inset:0;background:rgba(4,4,16,0.88);border-radius:12px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;z-index:2;"><div style="font-size:44px;">🔍</div><div style="font-family:'Orbitron',monospace;font-size:18px;color:#00ffa3;font-weight:900;">KMP COMPLETE!</div><div style="font-family:'Space Mono',monospace;font-size:12px;color:#9090c0;">${errors} wrong guesses · ${tv}s</div><button class="pg-game-btn primary" onclick="pgGameKMP('${accent}')" style="margin-top:6px;">Play Again</button></div>`;}
    const er=document.getElementById('km-errs');if(er)er.textContent=errors;
  }
  window.pgKMPStep=(isMatch)=>{
    const fb=document.getElementById('km-fb');
    const actualMatch=i<TEXT.length&&j<PAT.length&&TEXT[i]===PAT[j];
    if(isMatch!==actualMatch){errors++;if(fb){fb.textContent=`❌ Wrong! Text[${i}]='${TEXT[i]}' ${actualMatch?'==':'!='} Pattern[${j}]='${PAT[j]}'`;fb.style.color='#ff8a8a';}return;}
    if(actualMatch){i++;j++;if(j===PAT.length){found=true;done=true;clearInterval(timer);}}
    else{if(j>0)j=LPS[j-1];else i++;}
    if(i>=TEXT.length&&!found){done=true;clearInterval(timer);}
    render();
  };
  const body2=document.getElementById('pg-body');
  body2.innerHTML=`<button class="pg-back" onclick="pgBackToHub()">← Back to Hub</button>
    <div style="background:#0d0d28;border:1px solid #2a2a5a;border-radius:14px;padding:14px 18px;font-family:'Space Mono',monospace;font-size:12px;color:#7070a0;line-height:1.7;"><span style="color:${accent};font-weight:700;">🎮 KMP Game:</span> At each step, decide if the highlighted characters MATCH or MISMATCH. KMP uses the LPS array to skip on mismatch!</div>
    <div style="display:flex;gap:10px;">${pgStat('km-errs','Errors','#ff8a8a')}${pgStat('km-time','Time',accent)}</div>
    <div class="pg-game-canvas-wrap" style="min-height:200px;position:relative;flex-direction:column;"><div id="km-board" style="width:100%;"></div></div>
    <div id="km-fb" style="font-family:'Space Mono',monospace;font-size:12px;color:#9090c0;text-align:center;padding:10px;background:#0d0d28;border:1px solid #2a2a5a;border-radius:10px;"></div>
    <div style="display:flex;gap:10px;"><button class="pg-game-btn primary" onclick="pgGameKMP('${accent}')">↺ New Game</button></div>`;
  newGame();
}

/* ── Rabin-Karp: identify hash matches ── */
function pgGameRabinKarp(accent){
  const body=document.getElementById('pg-body');
  const TEXT='AABAACAADAA', PAT='AABA';
  const BASE=31,MOD=101;
  function hash(s){return s.split('').reduce((h,c)=>(h*BASE+c.charCodeAt(0))%MOD,0);}
  const pH=hash(PAT), windows=[];
  for(let i=0;i<=TEXT.length-PAT.length;i++){const w=TEXT.slice(i,i+PAT.length);windows.push({start:i,text:w,h:hash(w),isMatch:hash(w)===pH&&w===PAT,isSpurious:hash(w)===pH&&w!==PAT});}
  let step,done,errors,timer,tv;
  function newGame(){step=0;done=false;errors=0;tv=0;if(timer)clearInterval(timer);timer=setInterval(()=>{tv++;const el=document.getElementById('rk-time');if(el)el.textContent=tv+'s';else clearInterval(timer);},1000);render();}
  function render(){
    const wrap=document.getElementById('rk-board');if(!wrap)return;
    const w=windows[step];
    const tCells=TEXT.split('').map((c,i)=>{const inW=i>=w.start&&i<w.start+PAT.length;return `<div style="width:28px;height:28px;display:flex;align-items:center;justify-content:center;border-radius:4px;font-family:'Orbitron',monospace;font-size:12px;font-weight:700;background:${inW?accent+'33':'#0d0d28'};color:${inW?accent:'#c8c8ff'};border:1px solid ${inW?accent:'#2a2a5a'};">${c}</div>`;}).join('');
    wrap.innerHTML=`<div style="display:flex;flex-direction:column;gap:12px;padding:10px;align-items:center;">
      <div style="display:flex;gap:2px;flex-wrap:wrap;justify-content:center;">${tCells}</div>
      <div style="background:#0d0d28;border:1.5px solid ${accent};border-radius:10px;padding:12px 18px;text-align:center;width:100%;max-width:320px;">
        <div style="font-family:'Space Mono',monospace;font-size:10px;color:#5050a0;margin-bottom:6px;">WINDOW [${w.start}..${w.start+PAT.length-1}]</div>
        <div style="font-family:'Orbitron',monospace;font-size:20px;font-weight:700;color:${accent};letter-spacing:4px;">${w.text}</div>
        <div style="font-family:'Space Mono',monospace;font-size:11px;color:#7070a0;margin-top:6px;">Hash = <span style="color:${w.h===pH?'#ffe040':'#9090c0'};font-weight:700;">${w.h}</span> ${w.h===pH?'= Pattern hash! 🔥':'≠ Pattern hash'}</div>
      </div>
      <div style="font-family:'Space Mono',monospace;font-size:11px;color:#7070a0;">Pattern hash = ${pH}</div>
      <div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:center;">
        <button onclick="pgRKGuess(true)" style="padding:10px 18px;border-radius:8px;background:rgba(0,255,163,0.15);border:1.5px solid #00ffa3;color:#00ffa3;font-family:'Space Mono',monospace;font-size:12px;cursor:pointer;">✅ Match Found</button>
        <button onclick="pgRKGuess(false)" style="padding:10px 18px;border-radius:8px;background:rgba(255,71,87,0.15);border:1.5px solid #ff4757;color:#ff8a8a;font-family:'Space Mono',monospace;font-size:12px;cursor:pointer;">⏭ Skip (no match)</button>
      </div>
    </div>`;
    if(done){wrap.style.position='relative';wrap.innerHTML+=`<div style="position:absolute;inset:0;background:rgba(4,4,16,0.88);border-radius:12px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;z-index:2;"><div style="font-size:44px;">#️⃣</div><div style="font-family:'Orbitron',monospace;font-size:18px;color:#00ffa3;font-weight:900;">SCAN COMPLETE!</div><div style="font-family:'Space Mono',monospace;font-size:12px;color:#9090c0;">${errors} errors · ${tv}s</div><button class="pg-game-btn primary" onclick="pgGameRabinKarp('${accent}')" style="margin-top:6px;">Play Again</button></div>`;}
    const er=document.getElementById('rk-errs');if(er)er.textContent=errors;
    const fb=document.getElementById('rk-fb');if(fb&&!done){fb.textContent=`Step ${step+1}/${windows.length}: Window "${w.text}" — is this a real match?`;fb.style.color='#9090c0';}
  }
  window.pgRKGuess=(match)=>{
    const w=windows[step],fb=document.getElementById('rk-fb');
    const correct=match===w.isMatch;
    if(!correct){errors++;if(fb){fb.textContent=`❌ ${w.isMatch?'This IS a match!':'Not a match'} ${w.isSpurious?'(spurious hit — hash collision!)':''}`;fb.style.color='#ff8a8a';}}
    else if(fb){fb.textContent=`✅ Correct! ${w.isMatch?'Real match at '+w.start+'.':w.isSpurious?'Hash match but different string — spurious hit!':'No match.'}`;fb.style.color='#00ffa3';}
    step++;if(step>=windows.length){done=true;clearInterval(timer);}else setTimeout(render,1200);
  };
  body.innerHTML=`<button class="pg-back" onclick="pgBackToHub()">← Back to Hub</button>
    <div style="background:#0d0d28;border:1px solid #2a2a5a;border-radius:14px;padding:14px 18px;font-family:'Space Mono',monospace;font-size:12px;color:#7070a0;line-height:1.7;"><span style="color:${accent};font-weight:700;">🎮 Rabin-Karp Game:</span> For each window, decide if it's a real MATCH or not. Watch for spurious hits (same hash, different string)!</div>
    <div style="display:flex;gap:10px;">${pgStat('rk-errs','Errors','#ff8a8a')}${pgStat('rk-time','Time',accent)}</div>
    <div class="pg-game-canvas-wrap" style="min-height:200px;position:relative;flex-direction:column;"><div id="rk-board" style="width:100%;"></div></div>
    <div id="rk-fb" style="font-family:'Space Mono',monospace;font-size:12px;color:#9090c0;text-align:center;padding:10px;background:#0d0d28;border:1px solid #2a2a5a;border-radius:10px;"></div>
    <div style="display:flex;gap:10px;"><button class="pg-game-btn primary" onclick="pgGameRabinKarp('${accent}')">↺ New Game</button></div>`;
  newGame();
}

/* ── Trie: insert words and trace paths ── */
function pgGameTrie(accent){
  const WORDS=['CAR','CARD','CAT','CART','CARE'];
  const body=document.getElementById('pg-body');
  let inserted, done, timer, tv;
  function buildTrie(words){const root={};words.forEach(w=>{let n=root;for(const c of w){if(!n[c])n[c]={};n=n[c];}n['$']=true;});return root;}
  function newGame(){inserted=0;done=false;tv=0;if(timer)clearInterval(timer);timer=setInterval(()=>{tv++;const el=document.getElementById('tr-time');if(el)el.textContent=tv+'s';else clearInterval(timer);},1000);render();}
  function renderTrie(node,prefix,x,y,spread){let svg='';const children=Object.keys(node).filter(k=>k!=='$');children.forEach((k,i)=>{const angle=children.length>1?(i/(children.length-1)-0.5)*Math.min(spread,140):0;const nx=x+angle,ny=y+70;svg+=`<line x1="${x}" y1="${y}" x2="${nx}" y2="${ny}" stroke="${accent}44" stroke-width="1.5"/>`;svg+=`<text x="${(x+nx)/2-8}" y="${(y+ny)/2}" fill="${accent}" font-family="Space Mono,monospace" font-size="11" font-weight="700">${k}</text>`;svg+=renderTrie(node[k],prefix+k,nx,ny,spread*0.7);});if(node['$']){svg+=`<text x="${x}" y="${y+16}" fill="#00ffa3" font-family="Space Mono,monospace" font-size="9" text-anchor="middle">*</text>`;}svg+=`<circle cx="${x}" cy="${y}" r="12" fill="${prefix?accent+'22':'rgba(191,95,255,0.2)'}" stroke="${prefix?accent:'rgba(191,95,255,0.5)'}" stroke-width="1.5"/>`;if(prefix){const last=prefix[prefix.length-1];svg+=`<text x="${x}" y="${y+4}" fill="${accent}" font-family="Orbitron,monospace" font-size="10" text-anchor="middle" font-weight="700">${last}</text>`;}return svg;}
  function render(){
    const wrap=document.getElementById('tr-board');if(!wrap)return;
    const trie=buildTrie(WORDS.slice(0,inserted));
    wrap.innerHTML=`<div style="display:flex;flex-direction:column;align-items:center;gap:8px;width:100%;padding:8px;">
      <svg width="440" height="260" style="overflow:visible;"><text x="220" y="25" fill="rgba(191,95,255,0.7)" font-family="Orbitron,monospace" font-size="11" text-anchor="middle">ROOT</text>${renderTrie(trie,'',220,40,180)}</svg>
      <div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:center;">${WORDS.map((w,i)=>`<span style="font-family:'Space Mono',monospace;font-size:11px;padding:4px 10px;border-radius:6px;background:${i<inserted?accent+'22':'#0d0d28'};color:${i<inserted?accent:'#3a3a6a'};border:1px solid ${i<inserted?accent+'44':'#2a2a5a'};">${w}</span>`).join('')}</div>
    </div>`;
    if(done){wrap.style.position='relative';wrap.innerHTML+=`<div style="position:absolute;inset:0;background:rgba(4,4,16,0.88);border-radius:12px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;z-index:2;"><div style="font-size:44px;">🌿</div><div style="font-family:'Orbitron',monospace;font-size:18px;color:#00ffa3;font-weight:900;">TRIE BUILT!</div><div style="font-family:'Space Mono',monospace;font-size:12px;color:#9090c0;">${WORDS.length} words inserted · ${tv}s</div><button class="pg-game-btn primary" onclick="pgGameTrie('${accent}')" style="margin-top:6px;">Play Again</button></div>`;}
    const fb=document.getElementById('tr-fb');if(fb&&!done){if(inserted<WORDS.length)fb.textContent=`Press "Insert Next" to add "${WORDS[inserted]}" to the trie.`;fb.style.color='#9090c0';}
  }
  body.innerHTML=`<button class="pg-back" onclick="pgBackToHub()">← Back to Hub</button>
    <div style="background:#0d0d28;border:1px solid #2a2a5a;border-radius:14px;padding:14px 18px;font-family:'Space Mono',monospace;font-size:12px;color:#7070a0;line-height:1.7;"><span style="color:${accent};font-weight:700;">🎮 Trie Game:</span> Watch words being inserted into the Trie. Shared prefixes share nodes — that's the power of Tries!</div>
    <div style="display:flex;gap:10px;">${pgStat('tr-time','Time',accent)}</div>
    <div class="pg-game-canvas-wrap" style="min-height:280px;position:relative;flex-direction:column;"><div id="tr-board" style="width:100%;display:flex;justify-content:center;"></div></div>
    <div id="tr-fb" style="font-family:'Space Mono',monospace;font-size:12px;color:#9090c0;text-align:center;padding:10px;background:#0d0d28;border:1px solid #2a2a5a;border-radius:10px;"></div>
    <div style="display:flex;gap:10px;"><button class="pg-game-btn primary" onclick="window.pgTrieNext()">Insert Next Word →</button><button class="pg-game-btn" onclick="pgGameTrie('${accent}')">↺ Reset</button></div>`;
  window.pgTrieNext=()=>{if(inserted<WORDS.length){inserted++;if(inserted>=WORDS.length){done=true;clearInterval(timer);}}render();};
  newGame();
}

/* ── Binary Search: guess target position ── */
function pgGameBinarySearch(accent){
  const body=document.getElementById('pg-body');
  const arr=[2,5,8,12,16,23,38,56,72,91];
  let target,low,high,found,done,errors,timer,tv;
  function newGame(){target=arr[Math.floor(Math.random()*arr.length)];low=0;high=arr.length-1;found=false;done=false;errors=0;tv=0;if(timer)clearInterval(timer);timer=setInterval(()=>{tv++;const el=document.getElementById('bs2-time');if(el)el.textContent=tv+'s';else clearInterval(timer);},1000);render();}
  function render(){
    const wrap=document.getElementById('bs2-board');if(!wrap)return;
    const mid=Math.floor((low+high)/2);
    const cells=arr.map((v,i)=>{const isM=i===mid,isL=i===low,isH=i===high,inRange=i>=low&&i<=high;return `<div style="display:flex;flex-direction:column;align-items:center;gap:4px;"><div style="width:44px;height:44px;display:flex;align-items:center;justify-content:center;border-radius:8px;font-family:'Orbitron',monospace;font-size:13px;font-weight:700;background:${isM?accent+'44':inRange?'rgba(0,229,255,0.08)':'#060618'};color:${isM?accent:inRange?'#c8c8ff':'#3a3a6a'};border:2px solid ${isM?accent:isL||isH?'rgba(0,229,255,0.4)':'rgba(42,42,90,0.5)'};${isM?'box-shadow:0 0 12px '+accent+'66;':''}">${v}</div><div style="font-family:'Space Mono',monospace;font-size:8px;color:${isM?accent:isL?'#00e5ff':isH?'#bf5fff':'#3a3a6a'};">${isM?'MID':isL?'L':isH?'H':''}</div></div>`;}).join('');
    wrap.innerHTML=`<div style="display:flex;flex-direction:column;gap:12px;align-items:center;width:100%;padding:10px;">
      <div style="font-family:'Space Mono',monospace;font-size:12px;color:#9090c0;">Target: <span style="color:${accent};font-size:16px;font-weight:700;">${target}</span> &nbsp; MID = arr[${mid}] = <span style="color:${accent};font-weight:700;">${arr[mid]}</span></div>
      <div style="display:flex;gap:5px;flex-wrap:wrap;justify-content:center;">${cells}</div>
      ${!found&&!done?`<div style="font-family:'Space Mono',monospace;font-size:11px;color:#7070a0;">Is ${target} equal to, less than, or greater than arr[mid]=${arr[mid]}?</div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center;">
        <button onclick="pgBS2Click('eq')" style="padding:10px 16px;border-radius:8px;background:rgba(0,255,163,0.15);border:1.5px solid #00ffa3;color:#00ffa3;font-family:'Space Mono',monospace;font-size:11px;cursor:pointer;">= Found!</button>
        <button onclick="pgBS2Click('lt')" style="padding:10px 16px;border-radius:8px;background:rgba(0,229,255,0.1);border:1.5px solid #00e5ff;color:#00e5ff;font-family:'Space Mono',monospace;font-size:11px;cursor:pointer;">&lt; Go Left</button>
        <button onclick="pgBS2Click('gt')" style="padding:10px 16px;border-radius:8px;background:rgba(191,95,255,0.1);border:1.5px solid #bf5fff;color:#bf5fff;font-family:'Space Mono',monospace;font-size:11px;cursor:pointer;">&gt; Go Right</button>
      </div>`:''}
    </div>`;
    if(done){wrap.style.position='relative';wrap.innerHTML+=`<div style="position:absolute;inset:0;background:rgba(4,4,16,0.88);border-radius:12px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;z-index:2;"><div style="font-size:44px;">${found?'🎯':'❌'}</div><div style="font-family:'Orbitron',monospace;font-size:18px;color:${found?'#00ffa3':'#ff8a8a'};font-weight:900;">${found?'TARGET FOUND!':'NOT FOUND!'}</div><div style="font-family:'Space Mono',monospace;font-size:12px;color:#9090c0;">${errors} errors · ${tv}s</div><button class="pg-game-btn primary" onclick="pgGameBinarySearch('${accent}')" style="margin-top:6px;">Play Again</button></div>`;}
    const er=document.getElementById('bs2-errs');if(er)er.textContent=errors;
  }
  window.pgBS2Click=(dir)=>{
    const mid2=Math.floor((low+high)/2),fb=document.getElementById('bs2-fb');
    const correct=dir==='eq'?arr[mid2]===target:dir==='lt'?target<arr[mid2]:target>arr[mid2];
    if(!correct){errors++;if(fb){fb.textContent=`❌ Wrong! ${target} ${target===arr[mid2]?'==':target<arr[mid2]?'<':'>'} ${arr[mid2]}`;fb.style.color='#ff8a8a';}return;}
    if(dir==='eq'){found=true;done=true;clearInterval(timer);}
    else if(dir==='lt')high=mid2-1;
    else low=mid2+1;
    if(!done&&low>high){done=true;clearInterval(timer);}
    if(fb){fb.textContent=`✅ Correct! ${dir==='lt'?'Search left half.':dir==='gt'?'Search right half.':'Found it!'}`;fb.style.color='#00ffa3';}
    render();
  };
  body.innerHTML=`<button class="pg-back" onclick="pgBackToHub()">← Back to Hub</button>
    <div style="background:#0d0d28;border:1px solid #2a2a5a;border-radius:14px;padding:14px 18px;font-family:'Space Mono',monospace;font-size:12px;color:#7070a0;line-height:1.7;"><span style="color:${accent};font-weight:700;">🎮 Binary Search Game:</span> At each step, compare target to MID. Is it equal, less than, or greater? Halve the search space!</div>
    <div style="display:flex;gap:10px;">${pgStat('bs2-errs','Errors','#ff8a8a')}${pgStat('bs2-time','Time',accent)}</div>
    <div class="pg-game-canvas-wrap" style="min-height:200px;position:relative;flex-direction:column;"><div id="bs2-board" style="width:100%;"></div></div>
    <div id="bs2-fb" style="font-family:'Space Mono',monospace;font-size:12px;color:#9090c0;text-align:center;padding:10px;background:#0d0d28;border:1px solid #2a2a5a;border-radius:10px;"></div>
    <div style="display:flex;gap:10px;"><button class="pg-game-btn primary" onclick="pgGameBinarySearch('${accent}')">↺ New Game</button></div>`;
  newGame();
}

/* ── Activity Selection ── */
function pgGameActivity(accent){
  const ACTS=[{n:'A',s:1,e:4},{n:'B',s:3,e:5},{n:'C',s:0,e:6},{n:'D',s:5,e:7},{n:'E',s:3,e:9},{n:'F',s:5,e:9},{n:'G',s:6,e:10},{n:'H',s:8,e:11},{n:'I',s:8,e:12},{n:'J',s:2,e:14}];
  const sorted=[...ACTS].sort((a,b)=>a.e-b.e);
  const body=document.getElementById('pg-body');
  let selected,done,errors,timer,tv;
  function greedySolution(){const s=[];let lastEnd=-1;sorted.forEach(a=>{if(a.s>=lastEnd){s.push(a);lastEnd=a.e;}});return s;}
  const BEST=greedySolution();
  function newGame(){selected=[];done=false;errors=0;tv=0;if(timer)clearInterval(timer);timer=setInterval(()=>{tv++;const el=document.getElementById('ac-time');if(el)el.textContent=tv+'s';else clearInterval(timer);},1000);render();}
  function hasConflict(act){return selected.some(s=>!(act.e<=s.s||act.s>=s.e));}
  function render(){
    const wrap=document.getElementById('ac-board');if(!wrap)return;
    const rows=sorted.map(a=>{const sel=selected.includes(a),conflict=!sel&&hasConflict(a);const barW=Math.max(20,(a.e-a.s)*30),barX=a.s*30;return `<div style="display:flex;align-items:center;gap:8px;padding:3px 0;">
      <div style="font-family:'Space Mono',monospace;font-size:11px;color:${sel?accent:conflict?'#ff8a8a':'#7070a0'};width:16px;">${a.n}</div>
      <div style="position:relative;flex:1;height:28px;">
        <div onclick="${!conflict||sel?`pgACClick('${a.n}')`:''}" style="position:absolute;left:${barX}px;width:${barW}px;height:24px;top:2px;border-radius:6px;background:${sel?accent+'55':conflict?'rgba(255,71,87,0.2)':'rgba(100,100,180,0.2)'};border:1.5px solid ${sel?accent:conflict?'rgba(255,71,87,0.4)':'rgba(100,100,180,0.3)'};display:flex;align-items:center;justify-content:center;cursor:${conflict&&!sel?'not-allowed':'pointer'};font-family:'Space Mono',monospace;font-size:9px;color:${sel?accent:conflict?'#ff6b7a':'#7070a0'};">${a.s}-${a.e}</div>
      </div>
    </div>`;}).join('');
    wrap.innerHTML=`<div style="padding:10px;width:100%;"><div style="display:flex;gap:4px;margin-bottom:4px;padding-left:24px;">${Array.from({length:15},(_,i)=>`<div style="width:30px;font-family:'Space Mono',monospace;font-size:9px;color:#3a3a6a;text-align:center;">${i}</div>`).join('')}</div>${rows}</div>`;
    if(done){wrap.style.position='relative';wrap.innerHTML+=`<div style="position:absolute;inset:0;background:rgba(4,4,16,0.88);border-radius:12px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;z-index:2;"><div style="font-size:44px;">📅</div><div style="font-family:'Orbitron',monospace;font-size:18px;color:${selected.length===BEST.length?'#00ffa3':'#ffe040'};font-weight:900;">${selected.length===BEST.length?'OPTIMAL!':selected.length+' / '+BEST.length+' optimal'}</div><div style="font-family:'Space Mono',monospace;font-size:12px;color:#9090c0;">${errors} errors · ${tv}s</div><button class="pg-game-btn primary" onclick="pgGameActivity('${accent}')" style="margin-top:6px;">Play Again</button></div>`;}
    const er=document.getElementById('ac-errs');if(er)er.textContent=errors;
    const fb=document.getElementById('ac-fb');if(fb&&!done){fb.textContent=`Selected ${selected.length} activities. Greedy: always pick earliest-finishing non-conflicting! Press Done when finished.`;fb.style.color='#9090c0';}
  }
  window.pgACClick=(n)=>{const a=ACTS.find(x=>x.n===n);if(!a)return;if(selected.includes(a)){selected=selected.filter(x=>x!==a);}else{if(hasConflict(a)){errors++;const fb=document.getElementById('ac-fb');if(fb){fb.textContent='⚠️ Conflict! This activity overlaps with a selected one.';fb.style.color='#ff8a8a';}return;}selected.push(a);}render();};
  body.innerHTML=`<button class="pg-back" onclick="pgBackToHub()">← Back to Hub</button>
    <div style="background:#0d0d28;border:1px solid #2a2a5a;border-radius:14px;padding:14px 18px;font-family:'Space Mono',monospace;font-size:12px;color:#7070a0;line-height:1.7;"><span style="color:${accent};font-weight:700;">🎮 Activity Selection:</span> Click activities (shown as bars) to select them. No two selected can overlap. Try to select the <strong style="color:${accent};">maximum</strong> number!</div>
    <div style="display:flex;gap:10px;">${pgStat('ac-errs','Errors','#ff8a8a')}${pgStat('ac-time','Time',accent)}</div>
    <div class="pg-game-canvas-wrap" style="min-height:280px;position:relative;overflow-x:auto;"><div id="ac-board" style="width:100%;min-width:480px;"></div></div>
    <div id="ac-fb" style="font-family:'Space Mono',monospace;font-size:12px;color:#9090c0;text-align:center;padding:10px;background:#0d0d28;border:1px solid #2a2a5a;border-radius:10px;"></div>
    <div style="display:flex;gap:10px;"><button class="pg-game-btn primary" onclick="done=true;clearInterval(timer);render()">✅ Done</button><button class="pg-game-btn" onclick="pgGameActivity('${accent}')">↺ New Game</button></div>`;
  newGame();
}

/* ── Huffman Coding ── */
function pgGameHuffman(accent){
  const CHARS=[{c:'A',f:5},{c:'B',f:9},{c:'C',f:12},{c:'D',f:13},{c:'E',f:16},{c:'F',f:45}];
  const body=document.getElementById('pg-body');
  let nodes,done,timer,tv,mergeCount;
  function newGame(){nodes=CHARS.map(x=>({...x,left:null,right:null})).sort((a,b)=>a.f-b.f);done=false;tv=0;mergeCount=0;if(timer)clearInterval(timer);timer=setInterval(()=>{tv++;const el=document.getElementById('hf-time');if(el)el.textContent=tv+'s';else clearInterval(timer);},1000);render();}
  function render(){
    const wrap=document.getElementById('hf-board');if(!wrap)return;
    wrap.innerHTML=`<div style="display:flex;flex-direction:column;gap:12px;align-items:center;width:100%;padding:10px;">
      <div style="font-family:'Space Mono',monospace;font-size:11px;color:#7070a0;text-align:center;">Priority Queue (sorted by frequency). Pick the <strong style="color:${accent};">two smallest</strong> to merge!</div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center;">
        ${nodes.map((n,i)=>`<div style="display:flex;flex-direction:column;align-items:center;gap:4px;padding:10px 14px;border-radius:10px;background:${accent}22;border:1.5px solid ${accent}44;min-width:52px;">
          <div style="font-family:'Orbitron',monospace;font-size:16px;font-weight:700;color:${accent};">${n.f}</div>
          <div style="font-family:'Space Mono',monospace;font-size:10px;color:#9090c0;">${n.c||'?'}</div>
          ${i<2?`<div style="font-size:8px;color:#ffe040;font-family:'Space Mono',monospace;">MERGE ↑</div>`:''}
        </div>`).join('')}
      </div>
      ${nodes.length>1?`<button onclick="pgHFMerge()" class="pg-game-btn primary" style="min-width:200px;">Merge Two Smallest (${nodes[0].f} + ${nodes[1].f} = ${nodes[0].f+nodes[1].f})</button>`:''}
      <div style="font-family:'Space Mono',monospace;font-size:11px;color:#5050a0;">Merges done: ${mergeCount} / ${CHARS.length-1}</div>
    </div>`;
    if(done){wrap.style.position='relative';const root=nodes[0];wrap.innerHTML+=`<div style="position:absolute;inset:0;background:rgba(4,4,16,0.88);border-radius:12px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;z-index:2;"><div style="font-size:44px;">📨</div><div style="font-family:'Orbitron',monospace;font-size:18px;color:#00ffa3;font-weight:900;">HUFFMAN TREE DONE!</div><div style="font-family:'Space Mono',monospace;font-size:12px;color:#9090c0;">Root freq: ${root.f} · ${mergeCount} merges · ${tv}s</div><button class="pg-game-btn primary" onclick="pgGameHuffman('${accent}')" style="margin-top:6px;">Play Again</button></div>`;}
    const fb=document.getElementById('hf-fb');if(fb&&!done){fb.textContent=`Always merge the two nodes with the LOWEST frequency. This creates an optimal prefix-free code.`;fb.style.color='#9090c0';}
  }
  window.pgHFMerge=()=>{if(nodes.length<=1)return;const a=nodes.shift(),b=nodes.shift();const merged={c:null,f:a.f+b.f,left:a,right:b};let i=0;while(i<nodes.length&&nodes[i].f<merged.f)i++;nodes.splice(i,0,merged);mergeCount++;if(nodes.length===1){done=true;clearInterval(timer);}render();};
  body.innerHTML=`<button class="pg-back" onclick="pgBackToHub()">← Back to Hub</button>
    <div style="background:#0d0d28;border:1px solid #2a2a5a;border-radius:14px;padding:14px 18px;font-family:'Space Mono',monospace;font-size:12px;color:#7070a0;line-height:1.7;"><span style="color:${accent};font-weight:700;">🎮 Huffman Game:</span> Build the Huffman tree by repeatedly merging the two lowest-frequency nodes. Click "Merge" each time!</div>
    <div style="display:flex;gap:10px;">${pgStat('hf-time','Time',accent)}</div>
    <div class="pg-game-canvas-wrap" style="min-height:220px;position:relative;flex-direction:column;"><div id="hf-board" style="width:100%;"></div></div>
    <div id="hf-fb" style="font-family:'Space Mono',monospace;font-size:12px;color:#9090c0;text-align:center;padding:10px;background:#0d0d28;border:1px solid #2a2a5a;border-radius:10px;"></div>
    <div style="display:flex;gap:10px;"><button class="pg-game-btn primary" onclick="pgGameHuffman('${accent}')">↺ New Game</button></div>`;
  newGame();
}

/* ── Union Find ── */
function pgGameUnionFind(accent){
  const body=document.getElementById('pg-body');
  const N=7;
  const OPS=[{op:'union',a:0,b:1},{op:'union',a:2,b:3},{op:'find',a:0},{op:'union',a:1,b:2},{op:'find',a:3},{op:'union',a:4,b:5},{op:'find',a:2}];
  let parent,rank,step,done,timer,tv;
  function newGame(){parent=Array.from({length:N},(_,i)=>i);rank=Array(N).fill(0);step=0;done=false;tv=0;if(timer)clearInterval(timer);timer=setInterval(()=>{tv++;const el=document.getElementById('uf-time');if(el)el.textContent=tv+'s';else clearInterval(timer);},1000);render();}
  function find(x){while(parent[x]!==x){parent[x]=parent[parent[x]];x=parent[x];}return x;}
  function union(x,y){const rx=find(x),ry=find(y);if(rx===ry)return false;if(rank[rx]<rank[ry])parent[rx]=ry;else if(rank[rx]>rank[ry])parent[ry]=rx;else{parent[ry]=rx;rank[rx]++;}return true;}
  function render(){
    const wrap=document.getElementById('uf-board');if(!wrap)return;
    const op=step<OPS.length?OPS[step]:null;
    const components={};for(let i=0;i<N;i++){const r=find(i);if(!components[r])components[r]=[];components[r].push(i);}
    wrap.innerHTML=`<div style="display:flex;flex-direction:column;gap:12px;align-items:center;width:100%;padding:10px;">
      <div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:center;">
        ${Object.values(components).map(group=>`<div style="display:flex;gap:3px;padding:6px 10px;border-radius:10px;background:${accent}11;border:1px solid ${accent}33;">${group.map(n=>`<div style="width:34px;height:34px;display:flex;align-items:center;justify-content:center;border-radius:6px;background:${accent}33;color:${accent};font-family:'Orbitron',monospace;font-size:13px;font-weight:700;border:1.5px solid ${accent};">${n}</div>`).join('')}</div>`).join('')}
      </div>
      <div style="font-family:'Space Mono',monospace;font-size:11px;color:#5050a0;text-align:center;">Parent array: [${parent.join(', ')}]</div>
      ${op?`<div style="background:#0d0d28;border:1.5px solid ${accent};border-radius:10px;padding:12px 18px;text-align:center;"><div style="font-family:'Space Mono',monospace;font-size:10px;color:#5050a0;margin-bottom:6px;">NEXT OPERATION</div><div style="font-family:'Orbitron',monospace;font-size:16px;font-weight:700;color:${accent};">${op.op.toUpperCase()}(${op.a}${op.b!==undefined?', '+op.b:''})</div></div>`:'<div style="font-family:\'Orbitron\',monospace;font-size:14px;color:#00ffa3;text-align:center;">All operations done!</div>'}
      ${op?`<button onclick="pgUFDo()" class="pg-game-btn primary">Execute ${op.op.toUpperCase()}</button>`:''}
      <div style="font-family:'Space Mono',monospace;font-size:10px;color:#5050a0;">Step: ${step}/${OPS.length}</div>
    </div>`;
    if(done){wrap.style.position='relative';wrap.innerHTML+=`<div style="position:absolute;inset:0;background:rgba(4,4,16,0.88);border-radius:12px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;z-index:2;"><div style="font-size:44px;">🔗</div><div style="font-family:'Orbitron',monospace;font-size:18px;color:#00ffa3;font-weight:900;">ALL OPS DONE!</div><div style="font-family:'Space Mono',monospace;font-size:12px;color:#9090c0;">${tv}s</div><button class="pg-game-btn primary" onclick="pgGameUnionFind('${accent}')" style="margin-top:6px;">Play Again</button></div>`;}
    const fb=document.getElementById('uf-fb');if(fb&&op&&!done){if(op.op==='union')fb.textContent=`UNION(${op.a},${op.b}): connects the sets containing ${op.a} and ${op.b} (if not already connected).`;else{const root=find(op.a);fb.textContent=`FIND(${op.a}): returns the root of ${op.a}'s set = ${root}. Path compression applied!`;}fb.style.color='#9090c0';}
  }
  window.pgUFDo=()=>{const op=OPS[step];if(op.op==='union')union(op.a,op.b);step++;if(step>=OPS.length){done=true;clearInterval(timer);}render();};
  body.innerHTML=`<button class="pg-back" onclick="pgBackToHub()">← Back to Hub</button>
    <div style="background:#0d0d28;border:1px solid #2a2a5a;border-radius:14px;padding:14px 18px;font-family:'Space Mono',monospace;font-size:12px;color:#7070a0;line-height:1.7;"><span style="color:${accent};font-weight:700;">🎮 Union-Find Game:</span> Execute Union and Find operations. Watch how components merge and paths compress!</div>
    <div style="display:flex;gap:10px;">${pgStat('uf-time','Time',accent)}</div>
    <div class="pg-game-canvas-wrap" style="min-height:220px;position:relative;flex-direction:column;"><div id="uf-board" style="width:100%;"></div></div>
    <div id="uf-fb" style="font-family:'Space Mono',monospace;font-size:12px;color:#9090c0;text-align:center;padding:10px;background:#0d0d28;border:1px solid #2a2a5a;border-radius:10px;"></div>
    <div style="display:flex;gap:10px;"><button class="pg-game-btn primary" onclick="pgGameUnionFind('${accent}')">↺ New Game</button></div>`;
  newGame();
}

/* ── Geometry, Bit Manip, Binary Arith, ML, NetSec: Q&A style games ── */
function pgGameConvexHull(accent){pgGameQA(accent,'Convex Hull','convex',['Which turn direction is kept in Graham Scan?','Convex hull of 3 collinear points has how many vertices?','First step of Graham Scan?','Cross product = 0 means?'],['Counter-clockwise (left turns)','2 (the endpoints)','Find the lowest point as anchor','Points are collinear'],['ccw','2','anchor','collinear']);}
function pgGameLineIntersect(accent){pgGameQA(accent,'Line Intersection','linei',['Two segments intersect if cross products have...','Collinear overlapping segments are considered...','Sweep line moves in which direction?','Cross product sign determines turn...'],['Opposite signs (or one is zero)','Intersecting','Left to right (by x)','Direction (CW or CCW)'],['opposite','intersecting','left','direction']);}
function pgGameClosestPair(accent){pgGameQA(accent,'Closest Pair','closep',['Closest pair divide-and-conquer time?','Strip width after finding halves = ?','Max points in strip within distance d?','Base case: brute force when n ≤ ?'],['O(n log n)','2d (twice the min distance)','8 points','3'],['n log n','2d','8','3']);}
function pgGamePolygonArea(accent){pgGameQA(accent,'Polygon Area (Shoelace)','poly',['Shoelace formula time complexity?','Area = |sum| / ?','Shoelace works for non-convex polygons?','Negative result means?'],['O(n)','2','Yes, it works','Clockwise vertex order'],['n','2','yes','clockwise']);}
function pgGameBitmask(accent){pgGameQA(accent,'Bitmask Subsets','bitmask',['Number of subsets of n=4 elements?','Check if bit k set in i: i & ?','Iterate all subsets: 0 to ?','Set bit k: i | ?'],['16 (2^4)','(1<<k)','(1<<n)-1','(1<<k)'],['16','1<<k','1<<n','1<<k']);}
function pgGameXOR(accent){pgGameQA(accent,'XOR Tricks','xor',['a XOR a = ?','Find single non-duplicate: XOR all = ?','Swap a,b: a^=b; b^=a; a^=?','n & (n-1) effect?'],['0','The unique element','b','Clears lowest set bit'],['0','unique','b','clears']);}
function pgGamePow2(accent){pgGameQA(accent,'Power of Two','pow2',['n is power of 2 if n & (n-1) == ?','Is 48 a power of 2?','Powers of 2 have how many bits set?','2^10 = ?'],['0','No (not power of 2)','Exactly 1','1024'],['0','no','1','1024']);}
function pgGameSieve(accent){pgGameQA(accent,'Bitwise Sieve','sieve',['Sieve time complexity?','Bitwise sieve uses ___ per number','Sieve only needs to mark up to √n because?','Is 1 prime?'],['O(n log log n)','1 bit','All composites have a factor ≤ √n','No'],['n log log','1 bit','factor','no']);}
function pgGameBinArith(accent,type){
  const titles={add:'Binary Addition',sub:'Binary Subtraction',mul:"Booth's Multiplication",div:'Restoring Division'};
  const qs={
    add:[['1+1 in binary?','10'],['Sum bit = A XOR B XOR ?','Carry-in'],['Full adder inputs count?','3'],['1111+0001=?','10000']],
    sub:[["Two's complement: invert bits then add ?","1"],["Range of 8-bit signed two's complement?","-128 to 127"],["A - B using two's complement = A + ?","~B+1"],["10000-00001=?","01111"]],
    mul:[["Booth's examines ___ bits at a time?","2"],["Pattern 01 means?","Add multiplicand"],["Pattern 10 means?","Subtract multiplicand"],["Pattern 11 means?","Do nothing"]],
    div:[["Restore when partial remainder is?","Negative"],["Quotient bit=1 if partial remainder is?","Non-negative"],["Iterations for n-bit division?","n"],["Operation performed each step?","Subtract then check"]]
  };
  pgGameQA(accent,titles[type],type,qs[type].map(q=>q[0]),qs[type].map(q=>q[1]),qs[type].map(q=>q[1].toLowerCase().replace(/[^a-z0-9]/g,'')));
}
function pgGameLinReg(accent){pgGameQA(accent,'Linear Regression','linreg',['Gradient descent moves in direction of?','Learning rate too high causes?','Linear regression minimizes?','y = mx + ? (the intercept)'],['Negative gradient','Overshooting/divergence','Mean Squared Error','b (y-intercept)'],['negative','overshoot','mse','b']);}
function pgGameKNN(accent){pgGameQA(accent,'K-Nearest Neighbors','knn',['KNN is which type of learner?','Increasing K leads to?','Common distance metric for KNN?','KNN training time?'],['Lazy (no training phase)','Smoother decision boundary (less overfit)','Euclidean distance','O(1) — none!'],['lazy','smoother','euclidean','none']);}
function pgGameKMeans(accent){pgGameQA(accent,'K-Means Clustering','kmeans',['K-Means requires knowing K in advance?','K-Means converges to?','Each point assigned to ___ centroid','K-Means minimizes?'],['Yes','Local optimum','Nearest centroid','Within-cluster sum of squares'],['yes','local','nearest','sum']);}
function pgGameDecisionTree(accent){pgGameQA(accent,'Decision Tree','dtree',['Common split criterion?','Overfitting fixed by?','Leaf node represents?','Random Forest uses ___ trees'],['Gini impurity or Information Gain','Pruning','A class label','Many (ensemble of trees)'],['gini','pruning','class','many']);}
function pgGamePerceptron(accent){pgGameQA(accent,'Perceptron','percep',['Perceptron updates weights when?','Perceptron handles ___ separable data','Output = 1 if weighted sum ≥ ?','XOR solvable by single perceptron?'],['Prediction is wrong','Linearly separable data','Threshold','No (XOR is not linearly separable)'],['wrong','linear','threshold','no']);}
function pgGameNetSec(accent,type){
  const qs={
    ddos:[['DDoS stands for?','Distributed Denial of Service'],['Primary goal?','Exhaust server resources'],['Defense mechanism?','Rate limiting'],['DDoS uses a ___ of infected machines','Botnet']],
    sql:[['SQL injection exploits?','Unsanitized user input'],['Best defense?','Parameterized queries'],["Classic bypass: ' OR '1'='1 works because?","Always evaluates to true"],['ORM prevents all SQLi?','No (not always)']],
    firewall:[['Firewall operates at OSI layer?','3-4 (Network/Transport)'],['Stateful firewall tracks?','Full connection state'],['WAF stands for?','Web Application Firewall'],['Whitelist firewall allows?','Only explicitly permitted traffic']],
    mitm:[['MITM intercepts ___ between two parties','Communication'],['ARP spoofing enables MITM by?','Associating attacker MAC with victim IP'],['HTTPS with certificate pinning prevents?','Most MITM attacks'],['MITM = Man-in-the-?','Middle']]
  };
  const titles={ddos:'DDoS Attack',sql:'SQL Injection',firewall:'Firewall Filtering',mitm:'MITM Attack'};
  pgGameQA(accent,titles[type],type,qs[type].map(q=>q[0]),qs[type].map(q=>q[1]),qs[type].map(q=>q[1].toLowerCase().replace(/[^a-z0-9]/g,'')));
}

function pgGameQA(accent,title,id,questions,answers,keywords){
  const body=document.getElementById('pg-body');
  let qIdx=0,score=0,done=false,timer,tv,answered=false;
  function render(){
    const wrap=document.getElementById(id+'-board');if(!wrap)return;
    if(qIdx>=questions.length){wrap.innerHTML=`<div style="text-align:center;padding:30px;display:flex;flex-direction:column;align-items:center;gap:12px;"><div style="font-size:48px;">${score>=questions.length*0.8?'🏆':score>=questions.length*0.5?'🎯':'📚'}</div><div style="font-family:'Orbitron',monospace;font-size:22px;color:#00ffa3;font-weight:900;">${score}/${questions.length}</div><div style="font-family:'Space Mono',monospace;font-size:12px;color:#9090c0;">${score===questions.length?'Perfect!':score>=questions.length*0.6?'Good job!':'Keep practicing!'}</div><button class="pg-game-btn primary" style="margin-top:8px;" onclick="pgGameQA('${accent}','${title}','${id}',[${questions.map(q=>`'${q.replace(/'/g,"\\\'")}'`)}],[${answers.map(a=>`'${a.replace(/'/g,"\\\'")}'`)}],[${keywords.map(k=>`'${k}'`)}])">↺ Retry</button></div>`;done=true;clearInterval(timer);return;}
    answered=false;
    wrap.innerHTML=`<div style="display:flex;flex-direction:column;gap:12px;padding:14px;">
      <div style="display:flex;align-items:center;gap:10px;">
        <div style="font-family:'Space Mono',monospace;font-size:10px;color:#5050a0;">Q ${qIdx+1}/${questions.length}</div>
        <div style="flex:1;height:4px;background:#1a1a3a;border-radius:4px;overflow:hidden;"><div style="width:${(qIdx/questions.length)*100}%;height:100%;background:linear-gradient(90deg,${accent},#bf5fff);"></div></div>
        <div style="font-family:'Orbitron',monospace;font-size:12px;color:${accent};">⭐${score}</div>
      </div>
      <div style="background:#0d0d28;border:1px solid #2a2a5a;border-radius:10px;padding:14px;font-family:'Space Mono',monospace;font-size:13px;color:#c8c8ff;line-height:1.7;">${questions[qIdx]}</div>
      <input id="${id}-ans" type="text" placeholder="Type your answer…" style="background:#060618;border:1.5px solid #2a2a5a;border-radius:8px;padding:12px 14px;color:#c8c8ff;font-family:'Space Mono',monospace;font-size:13px;outline:none;transition:border-color 0.2s;width:100%;box-sizing:border-box;" onkeydown="if(event.key==='Enter')pgQACheck('${id}',${qIdx})" onfocus="this.style.borderColor='${accent}'" onblur="this.style.borderColor='#2a2a5a'">
      <div id="${id}-fb" style="font-family:'Space Mono',monospace;font-size:12px;color:#5050a0;text-align:center;padding:8px;background:#060618;border-radius:8px;min-height:36px;">Press Enter or click Submit</div>
      <div style="display:flex;gap:8px;"><button onclick="pgQACheck('${id}',${qIdx})" class="pg-game-btn primary">Submit →</button><button onclick="pgQASkip('${id}',${qIdx})" class="pg-game-btn">Skip</button></div>
    </div>`;
    const inp=document.getElementById(id+'-ans');if(inp)setTimeout(()=>inp.focus(),60);
  }
  window.pgQACheck=(gid,qi)=>{
    if(answered||gid!==id||qi!==qIdx)return;answered=true;
    const inp=document.getElementById(id+'-ans');if(!inp)return;
    const val=inp.value.trim().toLowerCase().replace(/[^a-z0-9]/g,'');
    const kw=keywords[qi];
    const correct=val.includes(kw)||kw.includes(val)&&val.length>=2||val===kw;
    if(correct)score++;
    const fb=document.getElementById(id+'-fb');inp.disabled=true;inp.style.borderColor=correct?'#00ffa3':'#ff4757';inp.style.color=correct?'#00ffa3':'#ff8a8a';
    if(fb){fb.textContent=correct?`✅ Correct! "${answers[qi]}"`:`❌ Answer: "${answers[qi]}"`;fb.style.color=correct?'#00ffa3':'#ff8a8a';}
    setTimeout(()=>{qIdx++;render();},1400);
  };
  window.pgQASkip=(gid,qi)=>{if(gid!==id||qi!==qIdx)return;const fb=document.getElementById(id+'-fb');if(fb){fb.textContent=`Answer: "${answers[qi]}"`;fb.style.color='#ffe040';}setTimeout(()=>{qIdx++;render();},1200);};
  body.innerHTML=`<button class="pg-back" onclick="pgBackToHub()">← Back to Hub</button>
    <div style="background:#0d0d28;border:1px solid #2a2a5a;border-radius:14px;padding:14px 18px;font-family:'Space Mono',monospace;font-size:12px;color:#7070a0;line-height:1.7;"><span style="color:${accent};font-weight:700;">🎮 ${title} Game:</span> Answer the questions about ${title}. Type key terms to score!</div>
    <div style="display:flex;gap:10px;">${pgStat(id+'-time','Time',accent)}</div>
    <div class="pg-game-canvas-wrap" style="min-height:200px;position:relative;flex-direction:column;"><div id="${id}-board" style="width:100%;"></div></div>
    <div style="display:flex;gap:10px;"><button class="pg-game-btn primary" onclick="pgGameQA('${accent}','${title}','${id}',[${questions.map(q=>`'${q.replace(/'/g,"\\\'")}'`)}],[${answers.map(a=>`'${a.replace(/'/g,"\\\'")}'`)}],[${keywords.map(k=>`'${k}'`)}])">↺ New Game</button></div>`;
  if(timer)clearInterval(timer);timer=setInterval(()=>{tv++;const el=document.getElementById(id+'-time');if(el)el.textContent=tv+'s';else clearInterval(timer);},1000);
  render();
}



/* ── Tower of Hanoi: follow each move step by step ── */
function pgGameTowerHanoi(accent) {
  const body = document.getElementById('pg-body');
  let N = 3, pegs, moves, step, done, timer, tv;

  function hanoi(n, from, to, aux, list) {
    if (n === 0) return;
    hanoi(n-1, from, aux, to, list);
    list.push([from, to]);
    hanoi(n-1, aux, to, from, list);
  }

  function newGame(n) {
    N = n || 3;
    pegs = [Array.from({length:N},(_,i)=>N-i), [], []];
    moves = [];
    hanoi(N, 0, 2, 1, moves);
    step = 0; done = false; tv = 0;
    if (timer) clearInterval(timer);
    timer = setInterval(() => { tv++; const el=document.getElementById('th-time'); if(el)el.textContent=tv+'s'; else clearInterval(timer); }, 1000);
    render();
  }

  function render() {
    const wrap = document.getElementById('th-board'); if (!wrap) return;
    const names = ['A','B','C'];
    const nextMove = step < moves.length ? moves[step] : null;
    const pegHTML = pegs.map((peg, pi) => {
      const isFrom = nextMove && nextMove[0] === pi;
      const isTo = nextMove && nextMove[1] === pi;
      const disks = [...peg].reverse().map(d => {
        const w = 30 + d*22;
        const top = d === peg[peg.length-1] && isFrom;
        return `<div style="width:${w}px;height:22px;border-radius:6px;
          background:${top?'#ffe040':accent};border:2px solid ${top?'#ffe040':accent+'88'};
          display:flex;align-items:center;justify-content:center;
          font-family:'Orbitron',monospace;font-size:11px;font-weight:700;color:#0a0a1a;
          transition:all 0.2s;${top?'box-shadow:0 0 14px #ffe040;':''}">${d}</div>`;
      }).join('');
      return `<div style="display:flex;flex-direction:column;align-items:center;gap:3px;min-width:110px;">
        <div style="font-family:'Space Mono',monospace;font-size:11px;color:${isFrom?'#ffe040':isTo?accent:'#5050a0'};
          font-weight:700;margin-bottom:4px;">Peg ${names[pi]}${isFrom?' (pick)':isTo?' (place)':''}</div>
        <div style="display:flex;flex-direction:column;align-items:center;gap:2px;min-height:${N*26}px;justify-content:flex-end;
          border-bottom:3px solid #3a3a6a;width:100%;">${disks}</div>
        <div style="font-family:'Space Mono',monospace;font-size:9px;color:#3a3a6a;">${peg.length} disk(s)</div>
      </div>`;
    }).join('');
    wrap.innerHTML = `<div style="display:flex;gap:16px;justify-content:center;padding:12px;flex-wrap:wrap;">${pegHTML}</div>`;
    if (done) {
      wrap.style.position = 'relative';
      wrap.innerHTML += `<div style="position:absolute;inset:0;background:rgba(4,4,16,0.9);border-radius:12px;
        display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;z-index:2;">
        <div style="font-size:44px;">🗼</div>
        <div style="font-family:'Orbitron',monospace;font-size:18px;color:#00ffa3;font-weight:900;">SOLVED!</div>
        <div style="font-family:'Space Mono',monospace;font-size:12px;color:#9090c0;">${moves.length} moves · ${tv}s</div>
        <div style="display:flex;gap:8px;margin-top:6px;">
          <button class="pg-game-btn primary" onclick="window.thNew(3)">3 Disks</button>
          <button class="pg-game-btn" style="border-color:rgba(245,158,11,0.4);color:#f59e0b;" onclick="window.thNew(4)">4 Disks</button>
        </div></div>`;
    }
    const fb = document.getElementById('th-fb');
    if (fb && !done && nextMove) {
      fb.textContent = `Step ${step+1}/${moves.length}: Move top disk from Peg ${names[nextMove[0]]} → Peg ${names[nextMove[1]]}. Press Execute!`;
      fb.style.color = '#9090c0';
    }
    const st = document.getElementById('th-step'); if (st) st.textContent = step;
  }

  body.innerHTML = `<button class="pg-back" onclick="pgBackToHub()">← Back to Hub</button>
    <div style="background:#0d0d28;border:1px solid #2a2a5a;border-radius:14px;padding:14px 18px;
      font-family:'Space Mono',monospace;font-size:12px;color:#7070a0;line-height:1.7;">
      <span style="color:${accent};font-weight:700;">🎮 Tower of Hanoi:</span>
      Move all disks from Peg A to Peg C. Press <strong style="color:#ffe040;">Execute Move</strong> to perform each step and watch recursion unfold!</div>
    <div style="display:flex;gap:10px;flex-wrap:wrap;">
      ${pgStat('th-step','Steps',accent)}${pgStat('th-time','Time','#ffe040')}
    </div>
    <div class="pg-game-canvas-wrap" style="min-height:${N*30+80}px;position:relative;flex-direction:column;">
      <div id="th-board" style="width:100%;"></div>
    </div>
    <div id="th-fb" style="font-family:'Space Mono',monospace;font-size:12px;color:#9090c0;text-align:center;
      padding:10px;background:#0d0d28;border:1px solid #2a2a5a;border-radius:10px;"></div>
    <div style="display:flex;gap:10px;flex-wrap:wrap;">
      <button class="pg-game-btn primary" onclick="window.thExecute()">▶ Execute Move</button>
      <button class="pg-game-btn" onclick="window.thNew(3)">↺ 3 Disks</button>
      <button class="pg-game-btn" style="border-color:rgba(245,158,11,0.4);color:#f59e0b;" onclick="window.thNew(4)">🔥 4 Disks</button>
    </div>`;

  window.thExecute = () => {
    if (done || step >= moves.length) return;
    const [from, to] = moves[step];
    const disk = pegs[from].pop();
    pegs[to].push(disk);
    step++;
    if (step >= moves.length) { done = true; clearInterval(timer); }
    render();
  };
  window.thNew = newGame;
  newGame(3);
}

/* ── Permutations Game: predict the next swap ── */
function pgGamePermutations(accent) {
  const body = document.getElementById('pg-body');
  const arr = [1,2,3,4];
  let steps, stepIdx, current, done, errors, timer, tv;

  function genSteps(a) {
    const list = [], cur = [...a];
    function go(start) {
      if (start === cur.length - 1) { list.push({perm:[...cur], swap:null}); return; }
      for (let i = start; i < cur.length; i++) {
        list.push({perm:[...cur], swap:[start,i], action:'swap'});
        [cur[start],cur[i]] = [cur[i],cur[start]];
        go(start+1);
        if (i !== start) {
          list.push({perm:[...cur], swap:[start,i], action:'restore'});
          [cur[start],cur[i]] = [cur[i],cur[start]];
        }
      }
    }
    go(0);
    return list;
  }

  function newGame() {
    current = [...arr]; steps = []; errors = 0; stepIdx = 0; done = false; tv = 0;
    if (timer) clearInterval(timer);
    // Pre-generate all permutations as sequence display
    const perms = [];
    function perm(a, start) {
      if (start === a.length - 1) { perms.push([...a]); return; }
      for (let i = start; i < a.length; i++) {
        [a[start],a[i]] = [a[i],a[start]];
        perm(a, start+1);
        [a[start],a[i]] = [a[i],a[start]];
      }
    }
    perm([...arr], 0);
    timer = setInterval(() => { tv++; const el=document.getElementById('pg-time'); if(el)el.textContent=tv+'s'; else clearInterval(timer); }, 1000);
    renderPerm(perms, 0);
  }

  function renderPerm(perms, idx) {
    const wrap = document.getElementById('pg-board'); if (!wrap) return;
    const shown = perms.slice(0, idx+1);
    const next = perms[idx+1];
    wrap.innerHTML = `<div style="display:flex;flex-direction:column;gap:10px;padding:12px;width:100%;">
      <div style="font-family:'Space Mono',monospace;font-size:11px;color:#7070a0;">
        Found <span style="color:${accent};font-weight:700;">${idx+1}</span> / ${perms.length} permutations (n! = ${perms.length})
      </div>
      <div style="display:flex;flex-wrap:wrap;gap:8px;">
        ${shown.map((p,i) => `<div style="padding:6px 12px;border-radius:8px;
          background:${i===idx?accent+'33':'rgba(0,0,0,0.3)'};
          border:1.5px solid ${i===idx?accent:'#2a2a5a'};
          font-family:'Orbitron',monospace;font-size:12px;color:${i===idx?accent:'#7070a0'};">
          [${p.join(',')}]</div>`).join('')}
      </div>
      ${next ? `<div style="background:#0d0d28;border:1.5px solid #2a2a5a;border-radius:12px;padding:14px;text-align:center;">
        <div style="font-family:'Space Mono',monospace;font-size:11px;color:#5050a0;margin-bottom:8px;">NEXT PERMUTATION:</div>
        <div style="font-family:'Orbitron',monospace;font-size:16px;color:#ffe040;font-weight:700;">[${next.join(',')}]</div>
        <div style="font-family:'Space Mono',monospace;font-size:11px;color:#7070a0;margin-top:6px;">Press Reveal to generate it!</div>
      </div>` : `<div style="font-family:'Orbitron',monospace;font-size:14px;color:#00ffa3;text-align:center;padding:12px;">
        🎉 All ${perms.length} permutations found!</div>`}
    </div>`;
    if (idx+1 >= perms.length) { clearInterval(timer); }
    const st = document.getElementById('pg-step'); if (st) st.textContent = idx+1;
    window._permData = { perms, idx };
  }

  body.innerHTML = `<button class="pg-back" onclick="pgBackToHub()">← Back to Hub</button>
    <div style="background:#0d0d28;border:1px solid #2a2a5a;border-radius:14px;padding:14px 18px;
      font-family:'Space Mono',monospace;font-size:12px;color:#7070a0;line-height:1.7;">
      <span style="color:${accent};font-weight:700;">🎮 Permutations Game:</span>
      Watch all ${arr.length}! = 24 permutations of [${arr.join(',')}] generate via recursive swapping.
      Press <strong style="color:#ffe040;">Reveal Next</strong> to see each one!</div>
    <div style="display:flex;gap:10px;">
      ${pgStat('pg-step','Found',accent)}${pgStat('pg-time','Time','#ffe040')}
    </div>
    <div class="pg-game-canvas-wrap" style="min-height:200px;position:relative;flex-direction:column;">
      <div id="pg-board" style="width:100%;"></div>
    </div>
    <div id="pg-fb" style="font-family:'Space Mono',monospace;font-size:12px;color:#9090c0;text-align:center;
      padding:10px;background:#0d0d28;border:1px solid #2a2a5a;border-radius:10px;">
      Click "Reveal Next" to generate permutations one by one!</div>
    <div style="display:flex;gap:10px;flex-wrap:wrap;">
      <button class="pg-game-btn primary" onclick="window.pgPermNext()">▶ Reveal Next</button>
      <button class="pg-game-btn" style="border-color:rgba(232,121,249,0.4);color:#e879f9;" onclick="window.pgPermAll()">⚡ Show All</button>
      <button class="pg-game-btn" onclick="pgGamePermutations('${accent}')">↺ Reset</button>
    </div>`;

  window.pgPermNext = () => {
    if (!window._permData) return;
    const { perms, idx } = window._permData;
    if (idx + 1 < perms.length) renderPerm(perms, idx+1);
  };
  window.pgPermAll = () => {
    if (!window._permData) return;
    const { perms } = window._permData;
    renderPerm(perms, perms.length - 1);
  };
  newGame();
}

/* ── Crypto: Q&A knowledge game for RSA, DH, AES, Caesar, SHA, ZKP ── */
function pgGameCrypto(accent, type) {
  const configs = {
    rsa: {
      title: 'RSA Cryptography', emoji: '🔐',
      questions: [
        {q:"RSA key generation step 1: choose two large prime numbers p and q. What's n?", a:"p × q", k:"p*q"},
        {q:"RSA public key is (n, e). Private key is (n, d). What does 'e' stand for?", a:"Public exponent (usually 65537)", k:"exponent"},
        {q:"Encrypt message M: C = M^e mod n. What formula decrypts ciphertext C?", a:"M = C^d mod n", k:"c^d"},
        {q:"RSA is secure because factoring n into p and q is computationally _____.", a:"infeasible (hard)", k:"hard"},
      ]
    },
    dh: {
      title: 'Diffie-Hellman', emoji: '🤝',
      questions: [
        {q:"Alice picks private a, Bob picks private b. Public values shared: g^a mod p and g^b mod p. What's the shared secret?", a:"g^(ab) mod p", k:"g^ab"},
        {q:"The security of DH relies on the hardness of the _____ problem.", a:"discrete logarithm", k:"logarithm"},
        {q:"In the color mixing analogy, the 'common paint' represents the _____ values.", a:"public (g and p)", k:"public"},
        {q:"DH is vulnerable to a man-in-the-middle attack without _____.", a:"authentication", k:"authentication"},
      ]
    },
    aes: {
      title: 'AES Round Operations', emoji: '🔒',
      questions: [
        {q:"Name the 4 AES round operations in order.", a:"SubBytes → ShiftRows → MixColumns → AddRoundKey", k:"sub shift mix add"},
        {q:"SubBytes replaces each byte using an S-box lookup. What property does this add?", a:"Non-linearity (confusion)", k:"nonlinear"},
        {q:"ShiftRows shifts row i by ___ positions to the left.", a:"i positions (row 0: 0, row 1: 1, row 2: 2, row 3: 3)", k:"i positions"},
        {q:"The final round of AES omits which step?", a:"MixColumns", k:"mixcolumns"},
      ]
    },
    caesar: {
      title: 'Caesar & Vigenère Ciphers', emoji: '🗝',
      questions: [
        {q:"Encrypt 'HELLO' with Caesar shift 3.", a:"KHOOR", k:"khoor"},
        {q:"Caesar cipher has only ___ possible keys (shifts). Why is it weak?", a:"25 (easy to brute-force all)", k:"25"},
        {q:"Vigenère key 'KEY' encrypts each letter using shifts K=10, E=4, Y=24 cycling. What type of cipher is this?", a:"Polyalphabetic substitution", k:"polyalphabetic"},
        {q:"Decrypt 'KHOOR' with Caesar shift 3.", a:"HELLO", k:"hello"},
      ]
    },
    sha: {
      title: 'SHA-256 Hashing', emoji: '#️⃣',
      questions: [
        {q:"SHA-256 processes input in blocks of ___ bits.", a:"512 bits", k:"512"},
        {q:"SHA-256 uses 64 rounds. Each round uses a message schedule word W[t] and constants _____.", a:"K[t] (round constants derived from cube roots of primes)", k:"k[t]"},
        {q:"What is the avalanche effect in SHA-256?", a:"Changing 1 input bit changes ~50% of output bits", k:"50%"},
        {q:"SHA-256 is collision ___ — hard to find two inputs with same hash.", a:"resistant", k:"resistant"},
      ]
    },
    zkp: {
      title: 'Zero-Knowledge Proofs', emoji: '🕵',
      questions: [
        {q:"In the Ali Baba cave: Peggy enters the cave, Victor shouts which side to exit from. After many rounds with correct exits, Victor is convinced because the probability of cheating is ___ per round.", a:"50% (1/2) — after n rounds: (1/2)^n", k:"1/2"},
        {q:"ZKP Completeness means: if Peggy knows the secret, she can always _____.", a:"convince Victor (pass all challenges)", k:"convince"},
        {q:"ZKP Soundness means: if Peggy doesn't know the secret, she can only pass with ___ probability.", a:"negligible probability", k:"negligible"},
        {q:"ZKP Zero-Knowledge means: Victor learns _____ about the secret.", a:"nothing (zero knowledge)", k:"nothing"},
      ]
    }
  };

  const cfg = configs[type] || configs.rsa;
  const body = document.getElementById('pg-body');
  let qIdx = 0, score = 0, timer, tv, answered = false;

  body.innerHTML = `<button class="pg-back" onclick="pgBackToHub()">← Back to Hub</button>
    <div style="background:#0d0d28;border:1px solid #2a2a5a;border-radius:14px;padding:14px 18px;
      font-family:'Space Mono',monospace;font-size:12px;color:#7070a0;line-height:1.7;">
      <span style="color:${accent};font-weight:700;">🎮 ${cfg.title} ${cfg.emoji}:</span>
      Answer each question about ${cfg.title}. Type key terms to score!</div>
    <div style="display:flex;gap:10px;">${pgStat('cg-time','Time',accent)}</div>
    <div class="pg-game-canvas-wrap" style="min-height:200px;position:relative;flex-direction:column;">
      <div id="cg-board" style="width:100%;"></div>
    </div>
    <div style="display:flex;gap:10px;">
      <button class="pg-game-btn primary" onclick="pgGameCrypto('${accent}','${type}')">↺ Restart</button>
    </div>`;

  if (timer) clearInterval(timer);
  timer = setInterval(() => { tv++; const el=document.getElementById('cg-time'); if(el)el.textContent=tv+'s'; else clearInterval(timer); }, 1000);

  function render() {
    const wrap = document.getElementById('cg-board'); if (!wrap) return;
    if (qIdx >= cfg.questions.length) {
      const pct = Math.round(score / cfg.questions.length * 100);
      wrap.innerHTML = `<div style="text-align:center;padding:30px;display:flex;flex-direction:column;align-items:center;gap:14px;">
        <div style="font-size:52px;">${pct>=75?'🏆':pct>=50?'🎯':'📚'}</div>
        <div style="font-family:'Orbitron',monospace;font-size:26px;font-weight:900;color:${pct>=75?'#00ffa3':pct>=50?accent:'#ffe040'};">${pct}%</div>
        <div style="font-family:'Space Mono',monospace;font-size:13px;color:#9090c0;">${score}/${cfg.questions.length} correct</div>
        <button class="pg-game-btn primary" style="margin-top:8px;" onclick="pgGameCrypto('${accent}','${type}')">↺ Try Again</button>
      </div>`;
      clearInterval(timer); return;
    }
    const q = cfg.questions[qIdx];
    answered = false;
    wrap.innerHTML = `<div style="display:flex;flex-direction:column;gap:12px;padding:14px;">
      <div style="display:flex;align-items:center;gap:10px;">
        <div style="font-family:'Space Mono',monospace;font-size:10px;color:#5050a0;">Q ${qIdx+1}/${cfg.questions.length}</div>
        <div style="flex:1;height:4px;background:#1a1a3a;border-radius:4px;overflow:hidden;">
          <div style="width:${(qIdx/cfg.questions.length)*100}%;height:100%;background:linear-gradient(90deg,${accent},#bf5fff);"></div>
        </div>
        <div style="font-family:'Orbitron',monospace;font-size:12px;color:${accent};">⭐${score}</div>
      </div>
      <div style="background:#0d0d28;border:1px solid #2a2a5a;border-radius:10px;padding:16px;
        font-family:'Space Mono',monospace;font-size:13px;color:#c8c8ff;line-height:1.8;">${q.q}</div>
      <input id="cg-inp" type="text" placeholder="Type your answer…" autocomplete="off"
        style="background:#060618;border:1.5px solid #2a2a5a;border-radius:8px;padding:12px 14px;
          color:#c8c8ff;font-family:'Space Mono',monospace;font-size:13px;outline:none;
          transition:border-color 0.2s;width:100%;box-sizing:border-box;"
        onkeydown="if(event.key==='Enter')pgCGCheck(${qIdx})"
        onfocus="this.style.borderColor='${accent}'" onblur="this.style.borderColor='#2a2a5a'">
      <div id="cg-fb" style="font-family:'Space Mono',monospace;font-size:12px;color:#5050a0;
        text-align:center;padding:8px;background:#060618;border-radius:8px;min-height:36px;">
        Press Enter or click Submit</div>
      <div style="display:flex;gap:8px;">
        <button onclick="pgCGCheck(${qIdx})" class="pg-game-btn primary">Submit →</button>
        <button onclick="pgCGSkip(${qIdx})" class="pg-game-btn">Skip</button>
      </div>
    </div>`;
    setTimeout(() => { const el=document.getElementById('cg-inp'); if(el)el.focus(); }, 60);
  }

  window.pgCGCheck = (qi) => {
    if (answered || qi !== qIdx) return; answered = true;
    const inp = document.getElementById('cg-inp'); if (!inp) return;
    const val = inp.value.trim().toLowerCase().replace(/[^a-z0-9]/g,'');
    const kw = cfg.questions[qi].k.toLowerCase().replace(/[^a-z0-9]/g,'');
    const correct = val.includes(kw.slice(0,4)) || kw.includes(val.slice(0,4)) && val.length >= 3;
    if (correct) score++;
    inp.disabled = true;
    inp.style.borderColor = correct ? '#00ffa3' : '#ff4757';
    inp.style.color = correct ? '#00ffa3' : '#ff8a8a';
    const fb = document.getElementById('cg-fb');
    if (fb) { fb.textContent = correct ? `✅ Correct! ${cfg.questions[qi].a}` : `❌ Answer: ${cfg.questions[qi].a}`; fb.style.color = correct?'#00ffa3':'#ff8a8a'; }
    setTimeout(() => { qIdx++; render(); }, 1500);
  };
  window.pgCGSkip = (qi) => {
    if (qi !== qIdx) return;
    const fb = document.getElementById('cg-fb');
    if (fb) { fb.textContent = `Answer: ${cfg.questions[qi].a}`; fb.style.color = '#ffe040'; }
    setTimeout(() => { qIdx++; render(); }, 1200);
  };

  render();
}


// ══════════════════════════════════════════════════════════
//  PROBLEM PLAYGROUND
// ══════════════════════════════════════════════════════════

const PROBLEMS_DB = {
  'bubble-sort': [
    {title:'Sort Student Grades',diff:'EASY',dc:'#00ffa3',
     body:'A teacher has exam scores and needs them sorted lowest to highest to assign grades. Implement Bubble Sort.',
     example:'Input:  [72,91,55,88,63,77]\nOutput: [55,63,72,77,88,91]',
     starter:`function bubbleSort(arr) {
  const n = arr.length;
  for (let i = 0; i < n - 1; i++) {
    for (let j = 0; j < n - i - 1; j++) {
      // TODO: if arr[j] > arr[j+1], swap them
      
    }
  }
  return arr;
}
console.log(bubbleSort([72,91,55,88,63,77]));`,
     test:c=>{try{const l=[];const f=new Function('console',c);f({log:(...a)=>l.push(a.map(x=>JSON.stringify(x)).join(' '))});return l[0]==='[55,63,72,77,88,91]';}catch{return false;}},
     expected:'[55,63,72,77,88,91]'},
    {title:'Count Passes to Sort',diff:'MEDIUM',dc:'#ffe040',
     body:'Count how many passes Bubble Sort makes (with early exit). Return the pass count.',
     example:'Input:  [3,1,2]\nOutput: 2',
     starter:`function countPasses(arr) {
  let passes = 0;
  const n = arr.length;
  for (let i = 0; i < n - 1; i++) {
    let swapped = false;
    for (let j = 0; j < n - i - 1; j++) {
      // TODO: swap arr[j] and arr[j+1] if out of order, set swapped=true
      
    }
    passes++;
    // TODO: if no swaps happened, break early (already sorted)
    
  }
  return passes;
}
console.log(countPasses([3,1,2]));`,
     test:c=>{try{const l=[];const f=new Function('console',c);f({log:(...a)=>l.push(a.join(' '))});return l[0]==='2';}catch{return false;}},
     expected:'2'},
    {title:'Sort Posts by Score',diff:'HARD',dc:'#ff8a8a',
     body:'Sort posts by engagement score descending using Bubble Sort. Return sorted titles.',
     example:'Input:  [{title:"A",score:5},{title:"B",score:9},{title:"C",score:3}]\nOutput: ["B","A","C"]',
     starter:`function sortByScore(posts) {
  const n = posts.length;
  // TODO: use Bubble Sort to sort posts by score DESCENDING
  // Hint: swap posts[j] and posts[j+1] when posts[j].score < posts[j+1].score
  
  return posts.map(p => p.title);
}
console.log(sortByScore([{title:"A",score:5},{title:"B",score:9},{title:"C",score:3}]));`,
     test:c=>{try{const l=[];const f=new Function('console',c);f({log:(...a)=>l.push(a.map(x=>JSON.stringify(x)).join(' '))});return l[0]==='["B","A","C"]';}catch{return false;}},
     expected:'["B","A","C"]'},
  ],
  'selection-sort': [
    {title:'Sort Inventory Prices',diff:'EASY',dc:'#00ffa3',
     body:'Sort product prices ascending using Selection Sort.',
     example:'Input:  [29.99,9.99,49.99,19.99,4.99]\nOutput: [4.99,9.99,19.99,29.99,49.99]',
     starter:`function selectionSort(arr) {
  const n = arr.length;
  for (let i = 0; i < n - 1; i++) {
    let minIdx = i;
    // TODO: find the index of minimum element in arr[i+1..n-1]
    
    // TODO: swap arr[i] with arr[minIdx]
    
  }
  return arr;
}
console.log(selectionSort([29.99,9.99,49.99,19.99,4.99]));`,
     test:c=>{try{const l=[];const f=new Function('console',c);f({log:(...a)=>l.push(a.map(x=>JSON.stringify(x)).join(' '))});return l[0]==='[4.99,9.99,19.99,29.99,49.99]';}catch{return false;}},
     expected:'[4.99,9.99,19.99,29.99,49.99]'},
    {title:'Count Minimum Swaps',diff:'MEDIUM',dc:'#ffe040',
     body:'Count the exact number of swaps Selection Sort makes.',
     example:'Input:  [64,25,12,22,11]\nOutput: 4',
     starter:`function minSwaps(arr) {
  let swaps = 0, n = arr.length;
  for (let i = 0; i < n - 1; i++) {
    let mi = i;
    // TODO: find minIdx in unsorted portion arr[i..n-1]
    
    // TODO: if minIdx != i, swap and increment swaps
    
  }
  return swaps;
}
console.log(minSwaps([64,25,12,22,11]));`,
     test:c=>{try{const l=[];const f=new Function('console',c);f({log:(...a)=>l.push(a.join(' '))});return l[0]==='4';}catch{return false;}},
     expected:'4'},
    {title:'Top K Students',diff:'HARD',dc:'#ff8a8a',
     body:'Use Selection Sort (pick MAX first) to find top-K scores without sorting everything.',
     example:'Input:  arr=[40,100,60,80,50,70], k=3\nOutput: [100,80,70]',
     starter:`function topK(arr, k) {
  const a = [...arr];
  const res = [];
  for (let i = 0; i < k; i++) {
    let maxIdx = i;
    // TODO: find index of MAXIMUM in a[i..n-1] (selection sort picks max this time)
    
    // TODO: swap a[i] with a[maxIdx], push a[i] to res
    
  }
  return res;
}
console.log(topK([40,100,60,80,50,70], 3));`,
     test:c=>{try{const l=[];const f=new Function('console',c);f({log:(...a)=>l.push(a.map(x=>JSON.stringify(x)).join(' '))});return l[0]==='[100,80,70]';}catch{return false;}},
     expected:'[100,80,70]'},
  ],
  'insertion-sort': [
    {title:'Sort Playing Cards',diff:'EASY',dc:'#00ffa3',
     body:'Sort card values ascending using Insertion Sort.',
     example:'Input:  [7,2,10,4,1,9]\nOutput: [1,2,4,7,9,10]',
     starter:`function insertionSort(arr) {
  for (let i = 1; i < arr.length; i++) {
    const key = arr[i];
    let j = i - 1;
    // TODO: shift elements arr[0..i-1] that are greater than key one position right
    
    // TODO: place key in its correct position
    arr[j + 1] = key;
  }
  return arr;
}
console.log(insertionSort([7,2,10,4,1,9]));`,
     test:c=>{try{const l=[];const f=new Function('console',c);f({log:(...a)=>l.push(a.map(x=>JSON.stringify(x)).join(' '))});return l[0]==='[1,2,4,7,9,10]';}catch{return false;}},
     expected:'[1,2,4,7,9,10]'},
    {title:'Online Stock Sorter',diff:'MEDIUM',dc:'#ffe040',
     body:'Prices arrive one by one. Maintain sorted order and return final sorted array.',
     example:'Input:  [45,30,60,20]\nOutput: [20,30,45,60]',
     starter:`function onlineSort(stream) {
  const sorted = [];
  for (const price of stream) {
    let j = sorted.length - 1;
    // TODO: shift elements right while sorted[j] > price (insertion sort step)
    
    // TODO: insert price at correct position
    sorted[j + 1] = price;
  }
  return sorted;
}
console.log(onlineSort([45,30,60,20]));`,
     test:c=>{try{const l=[];const f=new Function('console',c);f({log:(...a)=>l.push(a.map(x=>JSON.stringify(x)).join(' '))});return l[0]==='[20,30,45,60]';}catch{return false;}},
     expected:'[20,30,45,60]'},
    {title:'Sort Names Alphabetically',diff:'HARD',dc:'#ff8a8a',
     body:'Sort names case-insensitively using Insertion Sort.',
     example:'Input:  ["Zara","alice","Bob","charlie"]\nOutput: ["alice","Bob","charlie","Zara"]',
     starter:`function sortNames(names) {
  for (let i = 1; i < names.length; i++) {
    const key = names[i];
    let j = i - 1;
    // TODO: shift names right while names[j].toLowerCase() > key.toLowerCase()
    
    names[j + 1] = key;
  }
  return names;
}
console.log(sortNames(["Zara","alice","Bob","charlie"]));`,
     test:c=>{try{const l=[];const f=new Function('console',c);f({log:(...a)=>l.push(a.map(x=>JSON.stringify(x)).join(' '))});return l[0]==='["alice","Bob","charlie","Zara"]';}catch{return false;}},
     expected:'["alice","Bob","charlie","Zara"]'},
  ],
  'merge-sort': [
    {title:'Sort Numbers',diff:'EASY',dc:'#00ffa3',
     body:'Implement Merge Sort to sort integers ascending.',
     example:'Input:  [38,27,43,3,9,82,10]\nOutput: [3,9,10,27,38,43,82]',
     starter:`function mergeSort(arr) {
  if (arr.length <= 1) return arr;
  const mid = Math.floor(arr.length / 2);
  // TODO: recursively sort left and right halves, then merge
  
}

function merge(left, right) {
  const result = [];
  let i = 0, j = 0;
  // TODO: compare left[i] and right[j], push the smaller one to result
  
  // TODO: append any remaining elements from left or right
  return result;
}
console.log(mergeSort([38,27,43,3,9,82,10]));`,
     test:c=>{try{const l=[];const f=new Function('console',c);f({log:(...a)=>l.push(a.map(x=>JSON.stringify(x)).join(' '))});return l[0]==='[3,9,10,27,38,43,82]';}catch{return false;}},
     expected:'[3,9,10,27,38,43,82]'},
    {title:'Count Inversions',diff:'MEDIUM',dc:'#ffe040',
     body:'Count inversions (pairs where arr[i]>arr[j] and i<j) in O(n log n) using Merge Sort.',
     example:'Input:  [2,4,1,3,5]\nOutput: 3',
     starter:`function countInv(arr) {
  if (arr.length <= 1) return { arr, count: 0 };
  const mid = Math.floor(arr.length / 2);
  const L = countInv(arr.slice(0, mid));
  const R = countInv(arr.slice(mid));
  let count = L.count + R.count;
  const merged = [];
  let i = 0, j = 0;
  while (i < L.arr.length && j < R.arr.length) {
    if (L.arr[i] <= R.arr[j]) {
      merged.push(L.arr[i++]);
    } else {
      // TODO: when L.arr[i] > R.arr[j], ALL remaining left elements form inversions
      // count += ???
      merged.push(R.arr[j++]);
    }
  }
  return { arr: merged.concat(L.arr.slice(i)).concat(R.arr.slice(j)), count };
}
console.log(countInv([2,4,1,3,5]).count);`,
     test:c=>{try{const l=[];const f=new Function('console',c);f({log:(...a)=>l.push(a.join(' '))});return l[0]==='3';}catch{return false;}},
     expected:'3'},
    {title:'Merge K Sorted Arrays',diff:'HARD',dc:'#ff8a8a',
     body:'Merge K sorted arrays into one sorted array using merge step repeatedly.',
     example:'Input:  [[1,4,7],[2,5,8],[3,6,9]]\nOutput: [1,2,3,4,5,6,7,8,9]',
     starter:`function mergeK(arrays) {
  function merge(a, b) {
    const result = [];
    let i = 0, j = 0;
    // TODO: merge two sorted arrays into one sorted array
    
    return result.concat(a.slice(i)).concat(b.slice(j));
  }
  // TODO: reduce arrays by repeatedly merging pairs
  return arrays.reduce((acc, cur) => merge(acc, cur), []);
}
console.log(mergeK([[1,4,7],[2,5,8],[3,6,9]]));`,
     test:c=>{try{const l=[];const f=new Function('console',c);f({log:(...a)=>l.push(a.map(x=>JSON.stringify(x)).join(' '))});return l[0]==='[1,2,3,4,5,6,7,8,9]';}catch{return false;}},
     expected:'[1,2,3,4,5,6,7,8,9]'},
  ],
  'quick-sort': [
    {title:'Sort In-Place',diff:'EASY',dc:'#00ffa3',
     body:'Implement Quick Sort in-place. Sort integers ascending.',
     example:'Input:  [10,7,8,9,1,5]\nOutput: [1,5,7,8,9,10]',
     starter:`function quickSort(arr, lo = 0, hi = arr.length - 1) {
  if (lo < hi) {
    const p = partition(arr, lo, hi);
    // TODO: recursively sort left and right sub-arrays
    
  }
  return arr;
}

function partition(arr, lo, hi) {
  const pivot = arr[hi];
  let i = lo - 1;
  for (let j = lo; j < hi; j++) {
    if (arr[j] <= pivot) {
      i++;
      // TODO: swap arr[i] and arr[j]
      
    }
  }
  // TODO: place pivot in correct position (swap arr[i+1] and arr[hi])
  
  return i + 1;
}
const a = [10,7,8,9,1,5];
console.log(quickSort(a));`,
     test:c=>{try{const l=[];const f=new Function('console',c);f({log:(...a)=>l.push(a.map(x=>JSON.stringify(x)).join(' '))});return l[0]==='[1,5,7,8,9,10]';}catch{return false;}},
     expected:'[1,5,7,8,9,10]'},
    {title:'Kth Smallest Element',diff:'MEDIUM',dc:'#ffe040',
     body:'Use QuickSelect (partition of QuickSort) to find Kth smallest in O(n) average.',
     example:'Input:  arr=[7,10,4,3,20,15], k=3\nOutput: 7',
     starter:`function kthSmallest(arr, k) {
  const a = [...arr];

  function partition(lo, hi) {
    const pivot = a[hi];
    let i = lo - 1;
    for (let j = lo; j < hi; j++) {
      if (a[j] <= pivot) { i++; [a[i],a[j]]=[a[j],a[i]]; }
    }
    [a[i+1],a[hi]]=[a[hi],a[i+1]];
    return i + 1;
  }

  function select(lo, hi, k) {
    if (lo === hi) return a[lo];
    const p = partition(lo, hi);
    const rank = p - lo + 1;
    // TODO: if rank === k, return a[p]
    // TODO: if k < rank, recurse on left half
    // TODO: else recurse on right half with adjusted k
    
  }

  return select(0, a.length - 1, k);
}
console.log(kthSmallest([7,10,4,3,20,15],3));`,
     test:c=>{try{const l=[];const f=new Function('console',c);f({log:(...a)=>l.push(a.join(' '))});return l[0]==='7';}catch{return false;}},
     expected:'7'},
    {title:'Dutch National Flag',diff:'HARD',dc:'#ff8a8a',
     body:'Sort array of 0s, 1s, 2s in-place using 3-way partition.',
     example:'Input:  [2,0,2,1,1,0]\nOutput: [0,0,1,1,2,2]',
     starter:`function dutchFlag(arr) {
  let lo = 0, mid = 0, hi = arr.length - 1;
  while (mid <= hi) {
    if (arr[mid] === 0) {
      // TODO: swap arr[lo] and arr[mid], advance both lo and mid
      
    } else if (arr[mid] === 1) {
      mid++;           // 1s stay in place
    } else {
      // TODO: swap arr[mid] and arr[hi], decrement hi (don't advance mid!)
      
    }
  }
  return arr;
}
console.log(dutchFlag([2,0,2,1,1,0]));`,
     test:c=>{try{const l=[];const f=new Function('console',c);f({log:(...a)=>l.push(a.map(x=>JSON.stringify(x)).join(' '))});return l[0]==='[0,0,1,1,2,2]';}catch{return false;}},
     expected:'[0,0,1,1,2,2]'},
  ],
  'heap-sort': [
    {title:'Heap Sort Array',diff:'EASY',dc:'#00ffa3',
     body:'Implement Heap Sort. Build max-heap, extract max repeatedly.',
     example:'Input:  [12,11,13,5,6,7]\nOutput: [5,6,7,11,12,13]',
     starter:`function heapSort(arr) {
  const n = arr.length;
  // Phase 1: build max-heap (start from last non-leaf node)
  for (let i = Math.floor(n/2) - 1; i >= 0; i--) heapify(arr, n, i);
  // Phase 2: extract max one by one
  for (let i = n - 1; i > 0; i--) {
    // TODO: swap root (max) with last element, then heapify reduced heap
    
  }
  return arr;
}

function heapify(arr, n, i) {
  let largest = i;
  const left = 2*i+1, right = 2*i+2;
  // TODO: if left child exists and is greater than largest, update largest
  
  // TODO: if right child exists and is greater than largest, update largest
  
  // TODO: if largest changed, swap arr[i] with arr[largest] and recurse
  
}
console.log(heapSort([12,11,13,5,6,7]));`,
     test:c=>{try{const l=[];const f=new Function('console',c);f({log:(...a)=>l.push(a.map(x=>JSON.stringify(x)).join(' '))});return l[0]==='[5,6,7,11,12,13]';}catch{return false;}},
     expected:'[5,6,7,11,12,13]'},
    {title:'K Largest Elements',diff:'MEDIUM',dc:'#ffe040',
     body:'Find K largest elements using a min-heap of size K.',
     example:'Input:  arr=[3,2,1,5,6,4], k=2\nOutput: [5,6]',
     starter:`function kLargest(arr, k) {
  // Start with first k elements as a min-heap (simulated with sort)
  let heap = arr.slice(0, k).sort((a, b) => a - b);
  for (let i = k; i < arr.length; i++) {
    // TODO: if arr[i] > heap[0] (the minimum), replace heap[0] and re-sort
    
  }
  return heap.sort((a, b) => a - b);
}
console.log(kLargest([3,2,1,5,6,4],2));`,
     test:c=>{try{const l=[];const f=new Function('console',c);f({log:(...a)=>l.push(a.map(x=>JSON.stringify(x)).join(' '))});return l[0]==='[5,6]';}catch{return false;}},
     expected:'[5,6]'},
    {title:'Sort Nearly Sorted',diff:'HARD',dc:'#ff8a8a',
     body:'Sort a nearly-sorted array (each element ≤k positions away). Return sorted array.',
     example:'Input:  arr=[6,5,3,2,8,10,9], k=3\nOutput: [2,3,5,6,8,9,10]',
     starter:`function sortNearlySorted(arr, k) {
  const a = [...arr];
  for (let i = 0; i < a.length; i++) {
    let minIdx = i;
    // TODO: look in window a[i..i+k] to find minimum (each element is at most k away)
    
    // TODO: swap a[i] with a[minIdx]
    
  }
  return a;
}
console.log(sortNearlySorted([6,5,3,2,8,10,9],3));`,
     test:c=>{try{const l=[];const f=new Function('console',c);f({log:(...a)=>l.push(a.map(x=>JSON.stringify(x)).join(' '))});return l[0]==='[2,3,5,6,8,9,10]';}catch{return false;}},
     expected:'[2,3,5,6,8,9,10]'},
  ],
  'n-queens': [
    {title:'Count N-Queens Solutions',diff:'EASY',dc:'#00ffa3',
     body:'Count all solutions to N-Queens for given N.',
     example:'Input:  n=4\nOutput: 2',
     starter:`function nQueens(n) {
  let count = 0;
  const board = Array(n).fill(-1);

  function isSafe(row, col) {
    for (let i = 0; i < row; i++) {
      // TODO: return false if board[i]===col (same column)
      //       or Math.abs(board[i]-col)===Math.abs(i-row) (same diagonal)
      
    }
    return true;
  }

  function solve(row) {
    if (row === n) { count++; return; }
    for (let col = 0; col < n; col++) {
      // TODO: if isSafe, place queen, recurse, then remove (backtrack)
      
    }
  }

  solve(0);
  return count;
}
console.log(nQueens(4));`,
     test:c=>{try{const l=[];const f=new Function('console',c);f({log:(...a)=>l.push(a.join(' '))});return l[0]==='2';}catch{return false;}},
     expected:'2'},
    {title:'Validate Board',diff:'MEDIUM',dc:'#ffe040',
     body:'Check if a partial N-Queens board is valid. board[i]=column of queen in row i, -1=empty.',
     example:'Input:  [1,3,-1,-1]\nOutput: true (no conflicts)',
     starter:`function isValid(board) {
  const n = board.length;
  for (let r1 = 0; r1 < n; r1++) {
    if (board[r1] === -1) continue;
    for (let r2 = r1 + 1; r2 < n; r2++) {
      if (board[r2] === -1) continue;
      // TODO: return false if same column (board[r1]===board[r2])
      //       or same diagonal (Math.abs difference of cols === Math.abs difference of rows)
      
    }
  }
  return true;
}
console.log(isValid([1,3,-1,-1]));`,
     test:c=>{try{const l=[];const f=new Function('console',c);f({log:(...a)=>l.push(a.join(' '))});return l[0]==='true';}catch{return false;}},
     expected:'true'},
    {title:'Queen Threat Count',diff:'HARD',dc:'#ff8a8a',
     body:'Count how many cells one queen at (r,c) threatens on an N×N board (excluding itself).',
     example:'Input:  r=3, c=3, n=8\nOutput: 21',
     starter:`function queenThreats(r, c, n = 8) {
  const threatened = new Set();
  // TODO: add all cells in same row (except (r,c) itself)
  
  // TODO: add all cells in same column
  
  // TODO: add all cells on both diagonals using offsets [d,d],[d,-d],[-d,d],[-d,-d]
  //       check bounds: nr>=0 && nr<n && nc>=0 && nc<n
  
  return threatened.size;
}
console.log(queenThreats(3,3,8));`,
     test:c=>{try{const l=[];const f=new Function('console',c);f({log:(...a)=>l.push(a.join(' '))});return l[0]==='21';}catch{return false;}},
     expected:'21'},
  ],
  'sudoku-solver': [
    {title:'Validate Sudoku',diff:'EASY',dc:'#00ffa3',
     body:'Check if a 9×9 Sudoku board is valid (no duplicates in rows/cols/boxes). 0=empty.',
     example:'Input:  partial board with no duplicates\nOutput: true',
     starter:`function isValidSudoku(board) {
  for (let i = 0; i < 9; i++) {
    const row = new Set(), col = new Set(), box = new Set();
    for (let j = 0; j < 9; j++) {
      const r = board[i][j];
      const c = board[j][i];
      // Box indices: row index of box = 3*floor(i/3)+floor(j/3), col = 3*(i%3)+(j%3)
      const bi = 3*Math.floor(i/3)+Math.floor(j/3);
      const bj = 3*(i%3)+(j%3);
      const bv = board[bi][bj];
      // TODO: check r for row duplicates, c for col duplicates, bv for box duplicates
      // Return false if duplicate found; add to set if non-zero
      
    }
  }
  return true;
}
const b=[[5,3,0,0,7,0,0,0,0],[6,0,0,1,9,5,0,0,0],[0,9,8,0,0,0,0,6,0],[8,0,0,0,6,0,0,0,3],[4,0,0,8,0,3,0,0,1],[7,0,0,0,2,0,0,0,6],[0,6,0,0,0,0,2,8,0],[0,0,0,4,1,9,0,0,5],[0,0,0,0,8,0,0,7,9]];
console.log(isValidSudoku(b));`,
     test:c=>{try{const l=[];const f=new Function('console',c);f({log:(...a)=>l.push(a.join(' '))});return l[0]==='true';}catch{return false;}},
     expected:'true'},
    {title:'Solve 4×4 Sudoku',diff:'MEDIUM',dc:'#ffe040',
     body:'Solve a 4×4 Sudoku using backtracking. Numbers 1–4.',
     example:'Input:  [[1,0,0,4],[0,4,0,0],[0,0,4,0],[4,0,0,1]]\nOutput: [[1,2,3,4],[3,4,1,2],[2,1,4,3],[4,3,2,1]]',
     starter:`function solve4(board) {
  function isOk(r, c, num) {
    // TODO: check row and column for num
    for (let i = 0; i < 4; i++) {
      if (board[r][i] === num || board[i][c] === num) return false;
    }
    // TODO: check the 2x2 box (box row start = 2*floor(r/2), col start = 2*floor(c/2))
    
    return true;
  }

  function solve() {
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        if (board[r][c] === 0) {
          for (let n = 1; n <= 4; n++) {
            if (isOk(r, c, n)) {
              board[r][c] = n;
              // TODO: recurse; if it returns true, return true
              //       else reset board[r][c] = 0 (backtrack)
              
            }
          }
          return false;
        }
      }
    }
    return true;
  }

  solve();
  return board;
}
const b = [[1,0,0,4],[0,4,0,0],[0,0,4,0],[4,0,0,1]];
console.log(JSON.stringify(solve4(b)));`,
     test:c=>{try{const l=[];const f=new Function('console',c);f({log:(...a)=>l.push(a.join(' '))});return l[0]==='[[1,2,3,4],[3,4,1,2],[2,1,4,3],[4,3,2,1]]';}catch{return false;}},
     expected:'[[1,2,3,4],[3,4,1,2],[2,1,4,3],[4,3,2,1]]'},
    {title:'Count Solutions',diff:'HARD',dc:'#ff8a8a',
     body:'Count solutions to a 4×4 Sudoku board. Return count (stop after finding 2 for efficiency).',
     example:'Input:  [[1,2,0,4],[3,4,1,2],[2,1,4,3],[4,3,2,0]]\nOutput: 1',
     starter:`function countSols(board) {
  let count = 0;

  function isOk(r, c, num) {
    for (let i = 0; i < 4; i++) if (board[r][i]===num || board[i][c]===num) return false;
    const br=2*Math.floor(r/2), bc=2*Math.floor(c/2);
    for (let i=br; i<br+2; i++) for (let j=bc; j<bc+2; j++) if (board[i][j]===num) return false;
    return true;
  }

  function solve() {
    if (count > 1) return; // stop early once we know > 1 solution
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        if (board[r][c] === 0) {
          for (let n = 1; n <= 4; n++) {
            if (isOk(r, c, n)) {
              board[r][c] = n;
              // TODO: recurse to solve rest, then backtrack (board[r][c] = 0)
              
            }
          }
          return; // no valid number found → backtrack
        }
      }
    }
    count++; // reached here means board is full = one solution
  }

  solve();
  return count;
}
console.log(countSols([[1,2,0,4],[3,4,1,2],[2,1,4,3],[4,3,2,0]]));`,
     test:c=>{try{const l=[];const f=new Function('console',c);f({log:(...a)=>l.push(a.join(' '))});return l[0]==='1';}catch{return false;}},
     expected:'1'},
  ],
  'rat-in-maze': [
    {title:'Find One Path',diff:'EASY',dc:'#00ffa3',
     body:'Find any path from [0,0] to [N-1,N-1]. Return path as [[r,c],...] or [] if none.',
     example:'Input:  [[1,0,0],[1,1,0],[0,1,1]]\nOutput: path from [0,0] to [2,2]',
     starter:`function findPath(maze) {
  const N = maze.length;
  const visited = Array.from({length: N}, () => Array(N).fill(false));
  const path = [];

  function dfs(r, c) {
    // TODO: base cases — return false if out of bounds, blocked, or visited
    
    visited[r][c] = true;
    path.push([r, c]);
    if (r === N-1 && c === N-1) return true;
    // TODO: try moving down, right, up, left recursively
    //       if any direction returns true, return true
    //       otherwise path.pop() and return false (backtrack)
    
  }

  dfs(0, 0);
  return path;
}
const p = findPath([[1,0,0],[1,1,0],[0,1,1]]);
console.log(p.length>0 && p[0][0]===0 && p[p.length-1][0]===2 && p[p.length-1][1]===2);`,
     test:c=>{try{const l=[];const f=new Function('console',c);f({log:(...a)=>l.push(a.join(' '))});return l[0]==='true';}catch{return false;}},
     expected:'true (valid path found)'},
    {title:'Count All Paths',diff:'MEDIUM',dc:'#ffe040',
     body:'Count all distinct paths from top-left to bottom-right (4-directional, no revisit).',
     example:'Input:  [[1,1,0],[1,1,0],[0,1,1]]\nOutput: 2',
     starter:`function countPaths(maze) {
  const N = maze.length;
  const visited = Array.from({length: N}, () => Array(N).fill(false));
  let count = 0;

  function dfs(r, c) {
    // TODO: return if out of bounds, blocked, or visited
    
    if (r === N-1 && c === N-1) { count++; return; }
    visited[r][c] = true;
    // TODO: recurse in all 4 directions
    
    visited[r][c] = false; // backtrack — unmark to allow other paths
  }

  dfs(0, 0);
  return count;
}
console.log(countPaths([[1,1,0],[1,1,0],[0,1,1]]));`,
     test:c=>{try{const l=[];const f=new Function('console',c);f({log:(...a)=>l.push(a.join(' '))});return l[0]==='2';}catch{return false;}},
     expected:'2'},
    {title:'Shortest Path (BFS)',diff:'HARD',dc:'#ff8a8a',
     body:'Find shortest path (steps) from start to end using BFS. Return -1 if unreachable.',
     example:'Input:  5×5 maze\nOutput: 8',
     starter:`function shortestPath(maze) {
  const N = maze.length;
  if (!maze[0][0] || !maze[N-1][N-1]) return -1;
  const visited = Array.from({length: N}, () => Array(N).fill(false));
  visited[0][0] = true;
  const queue = [[0, 0, 0]]; // [row, col, steps]

  while (queue.length) {
    const [r, c, steps] = queue.shift();
    if (r === N-1 && c === N-1) return steps;
    // TODO: try all 4 directions; if valid (in bounds, open, unvisited)
    //       mark visited and push [nr, nc, steps+1] to queue
    
  }
  return -1;
}
console.log(shortestPath([[1,0,1,1,1],[1,1,1,0,1],[0,0,0,1,1],[1,1,1,1,0],[1,1,0,1,1]]));`,
     test:c=>{try{const l=[];const f=new Function('console',c);f({log:(...a)=>l.push(a.join(' '))});return l[0]==='8';}catch{return false;}},
     expected:'8'},
  ],
  'bfs': [
    {title:'Level Order Traversal',diff:'EASY',dc:'#00ffa3',
     body:'Return nodes grouped by BFS level from node 0.',
     example:'Input:  {0:[1,2],1:[3],2:[3,4],3:[],4:[]}\nOutput: [[0],[1,2],[3,4]]',
     starter:`function bfsLevels(adj) {
  const visited = new Set([0]);
  const levels = [[0]];
  let current = [0];

  while (current.length) {
    const next = [];
    for (const node of current) {
      for (const neighbor of (adj[node] || [])) {
        // TODO: if neighbor not visited, mark visited and add to next
        
      }
    }
    if (next.length) levels.push(next);
    current = next;
  }
  return levels;
}
console.log(JSON.stringify(bfsLevels({0:[1,2],1:[3],2:[3,4],3:[],4:[]})));`,
     test:c=>{try{const l=[];const f=new Function('console',c);f({log:(...a)=>l.push(a.join(' '))});return l[0]==='[[0],[1,2],[3,4]]';}catch{return false;}},
     expected:'[[0],[1,2],[3,4]]'},
    {title:'Shortest Path Unweighted',diff:'MEDIUM',dc:'#ffe040',
     body:'Find shortest path distance from src to target using BFS. Return -1 if unreachable.',
     example:'Input:  adj={0:[1,2],1:[3],2:[3,4],3:[5],4:[5],5:[]}, src=0, dst=5\nOutput: 3',
     starter:`function shortestBFS(adj, src, dst) {
  const visited = new Set([src]);
  const queue = [[src, 0]]; // [node, distance]

  while (queue.length) {
    const [node, dist] = queue.shift();
    if (node === dst) return dist;
    for (const neighbor of (adj[node] || [])) {
      // TODO: if not visited, mark visited, push [neighbor, dist+1]
      
    }
  }
  return -1;
}
console.log(shortestBFS({0:[1,2],1:[3],2:[3,4],3:[5],4:[5],5:[]},0,5));`,
     test:c=>{try{const l=[];const f=new Function('console',c);f({log:(...a)=>l.push(a.join(' '))});return l[0]==='3';}catch{return false;}},
     expected:'3'},
    {title:'Bipartite Check',diff:'HARD',dc:'#ff8a8a',
     body:'Use BFS to check if graph is bipartite (2-colorable). Return true/false.',
     example:'Input:  {0:[1,3],1:[0,2],2:[1,3],3:[0,2]}\nOutput: true',
     starter:`function isBipartite(adj) {
  const n = Object.keys(adj).length;
  const color = {};

  for (let start = 0; start < n; start++) {
    if (color[start] !== undefined) continue;
    color[start] = 0;
    const queue = [start];
    while (queue.length) {
      const node = queue.shift();
      for (const nb of (adj[node] || [])) {
        if (color[nb] === undefined) {
          // TODO: assign opposite color to nb (1 - color[node]) and enqueue
          
        } else if (color[nb] === color[node]) {
          return false; // same color → not bipartite
        }
      }
    }
  }
  return true;
}
console.log(isBipartite({0:[1,3],1:[0,2],2:[1,3],3:[0,2]}));`,
     test:c=>{try{const l=[];const f=new Function('console',c);f({log:(...a)=>l.push(a.join(' '))});return l[0]==='true';}catch{return false;}},
     expected:'true'},
  ],
  'dfs': [
    {title:'Count Connected Components',diff:'EASY',dc:'#00ffa3',
     body:'Count connected components in an undirected graph using DFS.',
     example:'Input:  n=5, edges=[[0,1],[1,2],[3,4]]\nOutput: 2',
     starter:`function countComp(n, edges) {
  const adj = Array.from({length: n}, () => []);
  edges.forEach(([u, v]) => { adj[u].push(v); adj[v].push(u); });
  const visited = new Set();
  let count = 0;

  function dfs(node) {
    visited.add(node);
    for (const nb of adj[node]) {
      // TODO: if not visited, recurse (DFS)
      
    }
  }

  for (let i = 0; i < n; i++) {
    if (!visited.has(i)) {
      dfs(i);
      count++;
    }
  }
  return count;
}
console.log(countComp(5,[[0,1],[1,2],[3,4]]));`,
     test:c=>{try{const l=[];const f=new Function('console',c);f({log:(...a)=>l.push(a.join(' '))});return l[0]==='2';}catch{return false;}},
     expected:'2'},
    {title:'Detect Cycle (Directed)',diff:'MEDIUM',dc:'#ffe040',
     body:'Detect if a directed graph has a cycle using DFS with a recursion stack.',
     example:'Input:  {0:[1],1:[2],2:[0]}\nOutput: true',
     starter:`function hasCycle(adj) {
  const n = Object.keys(adj).length;
  const visited = new Set();
  const stack = new Set(); // nodes in current DFS path

  function dfs(node) {
    visited.add(node);
    stack.add(node);
    for (const nb of (adj[node] || [])) {
      // TODO: if nb is in stack → cycle found, return true
      // TODO: if not visited and dfs(nb) returns true → cycle, return true
      
    }
    stack.delete(node); // remove from current path
    return false;
  }

  for (let i = 0; i < n; i++) {
    if (!visited.has(i) && dfs(i)) return true;
  }
  return false;
}
console.log(hasCycle({0:[1],1:[2],2:[0]}));`,
     test:c=>{try{const l=[];const f=new Function('console',c);f({log:(...a)=>l.push(a.join(' '))});return l[0]==='true';}catch{return false;}},
     expected:'true'},
    {title:'Topological Sort',diff:'HARD',dc:'#ff8a8a',
     body:'Use DFS post-order to topologically sort a DAG. Verify: for each edge u→v, u comes before v.',
     example:'Input:  {0:[2],1:[2,3],2:[3],3:[]}\nOutput: valid topo order',
     starter:`function topoSort(adj) {
  const n = Object.keys(adj).length;
  const visited = new Set();
  const result = [];

  function dfs(node) {
    visited.add(node);
    for (const nb of (adj[node] || [])) {
      // TODO: if not visited, recurse (DFS)
      
    }
    result.push(node); // post-order: add AFTER visiting all neighbors
  }

  for (let i = 0; i < n; i++) {
    if (!visited.has(i)) dfs(i);
  }
  const order = result.reverse(); // reverse post-order = topological order
  console.log(order.indexOf(0) < order.indexOf(2) && order.indexOf(2) < order.indexOf(3));
}
topoSort({0:[2],1:[2,3],2:[3],3:[]});`,
     test:c=>{try{const l=[];const f=new Function('console',c);f({log:(...a)=>l.push(a.join(' '))});return l[0]==='true';}catch{return false;}},
     expected:'true (valid topological order)'},
  ],
  'dijkstra': [
    {title:'Shortest Distances',diff:'EASY',dc:'#00ffa3',
     body:"Dijkstra from node 0. Return shortest distances to all nodes.",
     example:'Input:  adj={0:[[1,4],[2,1]],1:[[3,1]],2:[[1,2],[3,5]],3:[]}, n=4\nOutput: [0,3,1,4]',
     starter:`function dijkstra(adj, n) {
  const dist = Array(n).fill(Infinity);
  dist[0] = 0;
  const visited = new Set();

  for (let i = 0; i < n; i++) {
    // TODO: pick unvisited node u with minimum dist[u]
    let u = -1;
    
    if (dist[u] === Infinity) break;
    visited.add(u);

    for (const [v, w] of (adj[u] || [])) {
      // TODO: if dist[u] + w < dist[v], update dist[v] (relax edge)
      
    }
  }
  return dist;
}
console.log(dijkstra({0:[[1,4],[2,1]],1:[[3,1]],2:[[1,2],[3,5]],3:[]},4));`,
     test:c=>{try{const l=[];const f=new Function('console',c);f({log:(...a)=>l.push(a.map(x=>JSON.stringify(x)).join(' '))});return l[0]==='[0,3,1,4]';}catch{return false;}},
     expected:'[0,3,1,4]'},
    {title:'Network Delay Time',diff:'MEDIUM',dc:'#ffe040',
     body:'Find max delay for signal from node k to reach ALL nodes (-1 if some unreachable).',
     example:'Input:  times=[[2,1,1],[2,3,1],[3,4,1]], n=4, k=2\nOutput: 2',
     starter:`function networkDelay(times, n, k) {
  const adj = {};
  for (let i = 1; i <= n; i++) adj[i] = [];
  times.forEach(([u, v, w]) => adj[u].push([v, w]));

  const dist = {};
  for (let i = 1; i <= n; i++) dist[i] = Infinity;
  dist[k] = 0;
  const visited = new Set();

  for (let i = 0; i < n; i++) {
    // TODO: Dijkstra — pick unvisited node with minimum distance
    let u = -1;
    
    if (dist[u] === Infinity) break;
    visited.add(u);
    // TODO: relax all outgoing edges from u
    
  }
  const maxDist = Math.max(...Object.values(dist));
  return maxDist === Infinity ? -1 : maxDist;
}
console.log(networkDelay([[2,1,1],[2,3,1],[3,4,1]],4,2));`,
     test:c=>{try{const l=[];const f=new Function('console',c);f({log:(...a)=>l.push(a.join(' '))});return l[0]==='2';}catch{return false;}},
     expected:'2'},
    {title:'Cheapest Flights (K Stops)',diff:'HARD',dc:'#ff8a8a',
     body:'Find cheapest flight src→dst with ≤K stops. Return -1 if impossible.',
     example:'Input:  n=3, flights=[[0,1,100],[1,2,100],[0,2,500]], src=0, dst=2, k=1\nOutput: 200',
     starter:`function cheapestFlight(n, flights, src, dst, k) {
  const adj = Array.from({length: n}, () => []);
  flights.forEach(([u, v, w]) => adj[u].push([v, w]));

  let dist = Array(n).fill(Infinity);
  dist[src] = 0;

  // Relax edges k+1 times (at most k stops = k+1 edges)
  for (let i = 0; i <= k; i++) {
    const temp = [...dist]; // use snapshot to avoid using edges from same round
    for (let u = 0; u < n; u++) {
      if (dist[u] === Infinity) continue;
      for (const [v, w] of adj[u]) {
        // TODO: if dist[u] + w < temp[v], update temp[v]
        
      }
    }
    dist = temp;
  }
  return dist[dst] === Infinity ? -1 : dist[dst];
}
console.log(cheapestFlight(3,[[0,1,100],[1,2,100],[0,2,500]],0,2,1));`,
     test:c=>{try{const l=[];const f=new Function('console',c);f({log:(...a)=>l.push(a.join(' '))});return l[0]==='200';}catch{return false;}},
     expected:'200'},
  ],
  'fibonacci-dp': [
    {title:'Fibonacci with Memoization',diff:'EASY',dc:'#00ffa3',
     body:'Implement Fibonacci using memoization (top-down DP). Return fib(n) efficiently.',
     example:'Input:  n=10\nOutput: 55',
     starter:`function fib(n, memo = {}) {
  if (n <= 1) return n;
  // TODO: if memo[n] exists, return it (cache hit)
  
  // TODO: compute fib(n) = fib(n-1) + fib(n-2), store in memo[n], then return it
  
}
console.log(fib(10));`,
     test:c=>{try{const l=[];const f=new Function('console',c);f({log:(...a)=>l.push(a.join(' '))});return l[0]==='55';}catch{return false;}},
     expected:'55'},
    {title:'Fibonacci with Tabulation',diff:'MEDIUM',dc:'#ffe040',
     body:'Implement Fibonacci using bottom-up tabulation (iterative DP). Space O(n).',
     example:'Input:  n=15\nOutput: 610',
     starter:`function fibTab(n) {
  if (n <= 1) return n;
  const dp = Array(n + 1).fill(0);
  dp[1] = 1;
  for (let i = 2; i <= n; i++) {
    // TODO: dp[i] = dp[i-1] + dp[i-2]
    
  }
  return dp[n];
}
console.log(fibTab(15));`,
     test:c=>{try{const l=[];const f=new Function('console',c);f({log:(...a)=>l.push(a.join(' '))});return l[0]==='610';}catch{return false;}},
     expected:'610'},
    {title:'Count Ways to Climb Stairs',diff:'HARD',dc:'#ff8a8a',
     body:'You can climb 1 or 2 steps at a time. Count distinct ways to reach step n using DP.',
     example:'Input:  n=5\nOutput: 8',
     starter:`function climbStairs(n) {
  if (n <= 2) return n;
  let prev = 1, curr = 2;
  for (let i = 3; i <= n; i++) {
    // TODO: next = prev + curr (ways to reach i = ways(i-1) + ways(i-2))
    //       then shift: prev = curr, curr = next
    
  }
  return curr;
}
console.log(climbStairs(5));`,
     test:c=>{try{const l=[];const f=new Function('console',c);f({log:(...a)=>l.push(a.join(' '))});return l[0]==='8';}catch{return false;}},
     expected:'8'},
  ],
  'lcs': [
    {title:'LCS of Two Strings',diff:'EASY',dc:'#00ffa3',
     body:'Find the length of the Longest Common Subsequence of two strings.',
     example:'Input:  "ABCBDAB", "BDCAB"\nOutput: 4',
     starter:`function lcs(s1, s2) {
  const m = s1.length, n = s2.length;
  const dp = Array.from({length: m+1}, () => Array(n+1).fill(0));
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (s1[i-1] === s2[j-1]) {
        // TODO: characters match — dp[i][j] = dp[i-1][j-1] + 1
        
      } else {
        // TODO: no match — dp[i][j] = max(dp[i-1][j], dp[i][j-1])
        
      }
    }
  }
  return dp[m][n];
}
console.log(lcs("ABCBDAB","BDCAB"));`,
     test:c=>{try{const l=[];const f=new Function('console',c);f({log:(...a)=>l.push(a.join(' '))});return l[0]==='4';}catch{return false;}},
     expected:'4'},
    {title:'Shortest Common Supersequence Length',diff:'MEDIUM',dc:'#ffe040',
     body:'Find length of shortest string containing both strings as subsequences: len(s1)+len(s2)-LCS.',
     example:'Input:  "AGGTAB","GXTXAYB"\nOutput: 9',
     starter:`function scs(s1, s2) {
  const m = s1.length, n = s2.length;
  // Step 1: compute LCS using DP table (same as LCS problem)
  const dp = Array.from({length: m+1}, () => Array(n+1).fill(0));
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      // TODO: fill dp[i][j] using LCS recurrence
      
    }
  }
  // Step 2: SCS length = len(s1) + len(s2) - LCS length
  // TODO: return the formula
  
}
console.log(scs("AGGTAB","GXTXAYB"));`,
     test:c=>{try{const l=[];const f=new Function('console',c);f({log:(...a)=>l.push(a.join(' '))});return l[0]==='9';}catch{return false;}},
     expected:'9'},
    {title:'Edit Distance (Levenshtein)',diff:'HARD',dc:'#ff8a8a',
     body:'Minimum insertions, deletions, substitutions to convert s1 to s2 (related to LCS DP structure).',
     example:'Input:  "horse","ros"\nOutput: 3',
     starter:`function editDist(s1, s2) {
  const m = s1.length, n = s2.length;
  // dp[i][j] = min edits to convert s1[0..i-1] to s2[0..j-1]
  const dp = Array.from({length: m+1}, (_, i) => Array.from({length: n+1}, (_, j) => i || j));
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (s1[i-1] === s2[j-1]) {
        // TODO: characters match — dp[i][j] = dp[i-1][j-1] (no cost)
        
      } else {
        // TODO: min of insert(dp[i][j-1]), delete(dp[i-1][j]), replace(dp[i-1][j-1]), all +1
        
      }
    }
  }
  return dp[m][n];
}
console.log(editDist("horse","ros"));`,
     test:c=>{try{const l=[];const f=new Function('console',c);f({log:(...a)=>l.push(a.join(' '))});return l[0]==='3';}catch{return false;}},
     expected:'3'},
  ],
  'knapsack': [
    {title:'0/1 Knapsack',diff:'EASY',dc:'#00ffa3',
     body:'Classic 0/1 Knapsack. Return max value achievable with given weight capacity.',
     example:'Input:  weights=[1,3,4,5], values=[1,4,5,7], W=7\nOutput: 9',
     starter:`function knapsack(W, weights, values) {
  const n = weights.length;
  const dp = Array.from({length: n+1}, () => Array(W+1).fill(0));
  for (let i = 1; i <= n; i++) {
    for (let w = 0; w <= W; w++) {
      // Case 1: skip item i → dp[i][w] = dp[i-1][w]
      dp[i][w] = dp[i-1][w];
      if (weights[i-1] <= w) {
        // TODO: Case 2 — include item i: compare with dp[i-1][w - weights[i-1]] + values[i-1]
        //       take the max of both cases
        
      }
    }
  }
  return dp[n][W];
}
console.log(knapsack(7,[1,3,4,5],[1,4,5,7]));`,
     test:c=>{try{const l=[];const f=new Function('console',c);f({log:(...a)=>l.push(a.join(' '))});return l[0]==='9';}catch{return false;}},
     expected:'9'},
    {title:'Subset Sum Check',diff:'MEDIUM',dc:'#ffe040',
     body:'Check if there exists a subset of the array that sums to target.',
     example:'Input:  arr=[3,34,4,12,5,2], sum=9\nOutput: true',
     starter:`function subsetSum(arr, target) {
  const n = arr.length;
  const dp = Array.from({length: n+1}, () => Array(target+1).fill(false));
  for (let i = 0; i <= n; i++) dp[i][0] = true; // empty subset = sum 0

  for (let i = 1; i <= n; i++) {
    for (let s = 1; s <= target; s++) {
      dp[i][s] = dp[i-1][s]; // don't include arr[i-1]
      if (arr[i-1] <= s) {
        // TODO: or include arr[i-1]: dp[i][s] ||= dp[i-1][s - arr[i-1]]
        
      }
    }
  }
  return dp[n][target];
}
console.log(subsetSum([3,34,4,12,5,2],9));`,
     test:c=>{try{const l=[];const f=new Function('console',c);f({log:(...a)=>l.push(a.join(' '))});return l[0]==='true';}catch{return false;}},
     expected:'true'},
    {title:'Partition Equal Subset Sum',diff:'HARD',dc:'#ff8a8a',
     body:'Can the array be partitioned into two subsets with equal sum?',
     example:'Input:  [1,5,11,5]\nOutput: true (partitions: [1,5,5] and [11])',
     starter:`function canPartition(nums) {
  const sum = nums.reduce((a, b) => a + b, 0);
  if (sum % 2 !== 0) return false;
  const target = sum / 2;

  const dp = Array(target + 1).fill(false);
  dp[0] = true; // empty subset sums to 0

  for (const num of nums) {
    // Traverse BACKWARDS to avoid reusing the same element
    for (let s = target; s >= num; s--) {
      // TODO: dp[s] = dp[s] || dp[s - num]
      
    }
  }
  return dp[target];
}
console.log(canPartition([1,5,11,5]));`,
     test:c=>{try{const l=[];const f=new Function('console',c);f({log:(...a)=>l.push(a.join(' '))});return l[0]==='true';}catch{return false;}},
     expected:'true'},
  ],
  'stack-ops': [
    {title:'Balanced Parentheses',diff:'EASY',dc:'#00ffa3',
     body:'Use a stack to check if a string of brackets is balanced.',
     example:'Input:  "{[()]}"\nOutput: true',
     starter:`function isBalanced(s) {
  const stack = [];
  const matching = { ')': '(', ']': '[', '}': '{' };

  for (const char of s) {
    if ('([{'.includes(char)) {
      // TODO: push opening bracket onto stack
      
    } else {
      // TODO: if stack is empty OR stack.pop() !== matching[char], return false
      
    }
  }
  return stack.length === 0;
}
console.log(isBalanced("{[()]}"));`,
     test:c=>{try{const l=[];const f=new Function('console',c);f({log:(...a)=>l.push(a.join(' '))});return l[0]==='true';}catch{return false;}},
     expected:'true'},
    {title:'Next Greater Element',diff:'MEDIUM',dc:'#ffe040',
     body:'For each element, find the next greater element using a stack. Return -1 if none.',
     example:'Input:  [4,5,2,25]\nOutput: [5,25,25,-1]',
     starter:`function nextGreater(arr) {
  const n = arr.length;
  const result = Array(n).fill(-1);
  const stack = []; // stores indices

  for (let i = 0; i < n; i++) {
    // TODO: while stack is not empty AND arr[top] < arr[i]:
    //       the next greater for arr[top] is arr[i] → pop and set result
    
    stack.push(i);
  }
  return result;
}
console.log(nextGreater([4,5,2,25]));`,
     test:c=>{try{const l=[];const f=new Function('console',c);f({log:(...a)=>l.push(a.map(x=>JSON.stringify(x)).join(' '))});return l[0]==='[5,25,25,-1]';}catch{return false;}},
     expected:'[5,25,25,-1]'},
    {title:'Evaluate RPN Expression',diff:'HARD',dc:'#ff8a8a',
     body:'Evaluate a Reverse Polish Notation expression using a stack.',
     example:'Input:  ["2","1","+","3","*"]\nOutput: 9',
     starter:`function evalRPN(tokens) {
  const stack = [];
  for (const token of tokens) {
    if (['+', '-', '*', '/'].includes(token)) {
      const b = stack.pop(); // second operand
      const a = stack.pop(); // first operand
      // TODO: perform the operation and push result onto stack
      //       For division use Math.trunc(a/b) (truncate toward zero)
      
    } else {
      stack.push(parseInt(token)); // push number
    }
  }
  return stack[0];
}
console.log(evalRPN(["2","1","+","3","*"]));`,
     test:c=>{try{const l=[];const f=new Function('console',c);f({log:(...a)=>l.push(a.join(' '))});return l[0]==='9';}catch{return false;}},
     expected:'9'},
  ],
  'queue-ops': [
    {title:'Implement Queue using Two Stacks',diff:'EASY',dc:'#00ffa3',
     body:'Implement a queue (enqueue/dequeue) using two arrays as stacks.',
     example:'Enqueue 1,2,3 then dequeue twice → Output: 1 then 2',
     starter:`function testQueue() {
  const s1 = []; // inbox stack
  const s2 = []; // outbox stack

  function enqueue(x) {
    s1.push(x); // always push to s1
  }

  function dequeue() {
    if (!s2.length) {
      // TODO: transfer all elements from s1 to s2 (this reverses the order)
      
    }
    return s2.pop(); // pop from s2 gives FIFO order
  }

  enqueue(1); enqueue(2); enqueue(3);
  return [dequeue(), dequeue()];
}
console.log(testQueue());`,
     test:c=>{try{const l=[];const f=new Function('console',c);f({log:(...a)=>l.push(a.map(x=>JSON.stringify(x)).join(' '))});return l[0]==='[1,2]';}catch{return false;}},
     expected:'[1,2]'},
    {title:'Sliding Window Maximum',diff:'MEDIUM',dc:'#ffe040',
     body:'Find max in every window of size k using a deque for O(n).',
     example:'Input:  nums=[1,3,-1,-3,5,3,6,7], k=3\nOutput: [3,3,5,5,6,7]',
     starter:`function maxSlidingWindow(nums, k) {
  const deque = []; // stores indices, front = max of current window
  const result = [];

  for (let i = 0; i < nums.length; i++) {
    // TODO: remove indices outside the current window (deque[0] <= i - k)
    
    // TODO: remove from back while nums[back] < nums[i] (they can never be max)
    
    deque.push(i);
    if (i >= k - 1) result.push(nums[deque[0]]); // front = max
  }
  return result;
}
console.log(maxSlidingWindow([1,3,-1,-3,5,3,6,7],3));`,
     test:c=>{try{const l=[];const f=new Function('console',c);f({log:(...a)=>l.push(a.map(x=>JSON.stringify(x)).join(' '))});return l[0]==='[3,3,5,5,6,7]';}catch{return false;}},
     expected:'[3,3,5,5,6,7]'},
    {title:'First Non-Repeating Character Stream',diff:'HARD',dc:'#ff8a8a',
     body:'For each character in stream, return first non-repeating character, or # if none.',
     example:'Input:  "aabccb"\nOutput: "a","a","b","b","c","#"',
     starter:`function firstNonRepeat(stream) {
  const freq = {};
  const queue = []; // characters in insertion order
  const result = [];

  for (const char of stream) {
    freq[char] = (freq[char] || 0) + 1;
    queue.push(char);
    // TODO: remove from front of queue while freq[front] > 1 (it now repeats)
    
    result.push(queue.length ? queue[0] : '#');
  }
  return result;
}
console.log(firstNonRepeat("aabccb"));`,
     test:c=>{try{const l=[];const f=new Function('console',c);f({log:(...a)=>l.push(a.map(x=>JSON.stringify(x)).join(' '))});return l[0]==='["a","a","b","b","c","#"]';}catch{return false;}},
     expected:'["a","a","b","b","c","#"]'},
  ],
  'binary-search': [
    {title:'Binary Search Implementation',diff:'EASY',dc:'#00ffa3',
     body:'Return index of target in sorted array, or -1 if not found.',
     example:'Input:  arr=[-1,0,3,5,9,12], target=9\nOutput: 4',
     starter:`function search(arr, target) {
  let lo = 0, hi = arr.length - 1;

  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (arr[mid] === target) return mid;
    // TODO: if arr[mid] < target, search right half (lo = mid+1)
    //       else search left half (hi = mid-1)
    
  }
  return -1;
}
console.log(search([-1,0,3,5,9,12],9));`,
     test:c=>{try{const l=[];const f=new Function('console',c);f({log:(...a)=>l.push(a.join(' '))});return l[0]==='4';}catch{return false;}},
     expected:'4'},
    {title:'Find First and Last Position',diff:'MEDIUM',dc:'#ffe040',
     body:'Find first and last position of target in sorted array. Return [-1,-1] if absent.',
     example:'Input:  [5,7,7,8,8,10], target=8\nOutput: [3,4]',
     starter:`function searchRange(nums, target) {
  function findBound(isLeft) {
    let lo = 0, hi = nums.length - 1, result = -1;
    while (lo <= hi) {
      const mid = Math.floor((lo + hi) / 2);
      if (nums[mid] === target) {
        result = mid;
        // TODO: if isLeft, continue searching LEFT (hi = mid-1)
        //       else continue searching RIGHT (lo = mid+1)
        
      } else if (nums[mid] < target) {
        lo = mid + 1;
      } else {
        hi = mid - 1;
      }
    }
    return result;
  }
  return [findBound(true), findBound(false)];
}
console.log(searchRange([5,7,7,8,8,10],8));`,
     test:c=>{try{const l=[];const f=new Function('console',c);f({log:(...a)=>l.push(a.map(x=>JSON.stringify(x)).join(' '))});return l[0]==='[3,4]';}catch{return false;}},
     expected:'[3,4]'},
    {title:'Search in Rotated Sorted Array',diff:'HARD',dc:'#ff8a8a',
     body:'Search a target in a rotated sorted array in O(log n).',
     example:'Input:  [4,5,6,7,0,1,2], target=0\nOutput: 4',
     starter:`function searchRotated(nums, target) {
  let lo = 0, hi = nums.length - 1;

  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (nums[mid] === target) return mid;

    // Determine which half is sorted
    if (nums[lo] <= nums[mid]) {
      // Left half is sorted
      // TODO: if target is in left sorted range [nums[lo], nums[mid]), go left
      //       else go right
      
    } else {
      // Right half is sorted
      // TODO: if target is in right sorted range (nums[mid], nums[hi]], go right
      //       else go left
      
    }
  }
  return -1;
}
console.log(searchRotated([4,5,6,7,0,1,2],0));`,
     test:c=>{try{const l=[];const f=new Function('console',c);f({log:(...a)=>l.push(a.join(' '))});return l[0]==='4';}catch{return false;}},
     expected:'4'},
  ],
  'kmp': [
    {title:'KMP Pattern Search',diff:'EASY',dc:'#00ffa3',
     body:'Find all occurrences of pattern in text using KMP. Return array of starting indices.',
     example:'Input:  text="AABAABAAB", pattern="AAB"\nOutput: [0,3,6]',
     starter:`function kmpSearch(text, pattern) {
  // Step 1: build LPS (failure function)
  function buildLPS(p) {
    const lps = Array(p.length).fill(0);
    let len = 0, k = 1;
    while (k < p.length) {
      if (p[k] === p[len]) { lps[k++] = ++len; }
      else if (len) { len = lps[len-1]; }
      else { lps[k++] = 0; }
    }
    return lps;
  }

  const lps = buildLPS(pattern);
  const result = [];
  let i = 0, j = 0; // i=text index, j=pattern index

  while (i < text.length) {
    if (text[i] === pattern[j]) { i++; j++; }
    if (j === pattern.length) {
      result.push(i - j); // found at index i-j
      j = lps[j-1]; // use LPS to skip
    } else if (i < text.length && text[i] !== pattern[j]) {
      // TODO: if j > 0, use lps[j-1] to skip (don't reset to 0)
      //       else just advance i
      
    }
  }
  return result;
}
console.log(kmpSearch("AABAABAAB","AAB"));`,
     test:c=>{try{const l=[];const f=new Function('console',c);f({log:(...a)=>l.push(a.map(x=>JSON.stringify(x)).join(' '))});return l[0]==='[0,3,6]';}catch{return false;}},
     expected:'[0,3,6]'},
    {title:'Compute LPS Array',diff:'MEDIUM',dc:'#ffe040',
     body:'Compute the LPS (Longest Proper Prefix which is also Suffix) array for a pattern.',
     example:'Input:  "AABAABAAB"\nOutput: [0,1,0,1,2,3,4,5,6]',
     starter:`function computeLPS(pattern) {
  const lps = Array(pattern.length).fill(0);
  let len = 0; // length of previous longest prefix suffix
  let k = 1;

  while (k < pattern.length) {
    if (pattern[k] === pattern[len]) {
      // TODO: match found — lps[k] = len+1, advance both k and len
      
    } else if (len > 0) {
      // TODO: mismatch after some matches — fall back using lps[len-1]
      //       (don't increment k here!)
      
    } else {
      lps[k++] = 0; // no prefix suffix, move k forward
    }
  }
  return lps;
}
console.log(computeLPS("AABAABAAB"));`,
     test:c=>{try{const l=[];const f=new Function('console',c);f({log:(...a)=>l.push(a.map(x=>JSON.stringify(x)).join(' '))});return l[0]==='[0,1,0,1,2,3,4,5,6]';}catch{return false;}},
     expected:'[0,1,0,1,2,3,4,5,6]'},
    {title:'Check if String is Rotation of Another',diff:'HARD',dc:'#ff8a8a',
     body:'Check if s2 is a rotation of s1 using KMP (search s2 in s1+s1).',
     example:'Input:  s1="abcde", s2="cdeab"\nOutput: true',
     starter:`function isRotation(s1, s2) {
  if (s1.length !== s2.length) return false;
  // Key insight: if s2 is a rotation of s1, s2 must appear in s1+s1
  const text = s1 + s1;
  // TODO: use KMP to search for s2 in text (s1+s1)
  //       Return true if found, false otherwise
  //       Hint: implement a simple kmpSearch(text, pattern) helper and call it
  
}
console.log(isRotation("abcde","cdeab"));`,
     test:c=>{try{const l=[];const f=new Function('console',c);f({log:(...a)=>l.push(a.join(' '))});return l[0]==='true';}catch{return false;}},
     expected:'true'},
  ],
  'trie': [
    {title:'Implement Trie Insert/Search',diff:'EASY',dc:'#00ffa3',
     body:'Implement Trie with insert and search. Return true if word exists after inserting given words.',
     example:'Insert ["apple","app"] then search("app") → true, search("ap") → false',
     starter:`class TrieNode {
  constructor() {
    this.children = {}; // char → TrieNode
    this.isEnd = false;
  }
}

class Trie {
  constructor() { this.root = new TrieNode(); }

  insert(word) {
    let node = this.root;
    for (const char of word) {
      // TODO: if char not in node.children, create new TrieNode
      //       advance node = node.children[char]
      
    }
    node.isEnd = true;
  }

  search(word) {
    let node = this.root;
    for (const char of word) {
      // TODO: if char not in node.children, return false
      //       else advance node
      
    }
    return node.isEnd; // true only if word ends here
  }
}

const t = new Trie();
t.insert("apple"); t.insert("app");
console.log(t.search("app") && !t.search("ap"));`,
     test:c=>{try{const l=[];const f=new Function('console',c);f({log:(...a)=>l.push(a.join(' '))});return l[0]==='true';}catch{return false;}},
     expected:'true'},
    {title:'Count Words with Given Prefix',diff:'MEDIUM',dc:'#ffe040',
     body:'Build a trie and count how many inserted words start with the given prefix.',
     example:'Words=["apple","app","apt","bat","ball"], prefix="ap" → 3',
     starter:`function countPrefix(words, prefix) {
  const root = {};
  // Build trie
  for (const word of words) {
    let node = root;
    for (const c of word) {
      if (!node[c]) node[c] = {};
      node = node[c];
    }
    node.$ = true; // mark end of word
  }

  // Navigate to the end of prefix
  let node = root;
  for (const c of prefix) {
    if (!node[c]) return 0; // prefix not in trie
    node = node[c];
  }

  // TODO: count all words in the subtree rooted at 'node'
  //       Hint: DFS/recursion — if node.$ exists, count it; recurse into children
  function countAll(n) {
    
  }
  return countAll(node);
}
console.log(countPrefix(["apple","app","apt","bat","ball"],"ap"));`,
     test:c=>{try{const l=[];const f=new Function('console',c);f({log:(...a)=>l.push(a.join(' '))});return l[0]==='3';}catch{return false;}},
     expected:'3'},
    {title:'Autocomplete System',diff:'HARD',dc:'#ff8a8a',
     body:'Given a list of words and a prefix, return all words starting with that prefix (autocomplete).',
     example:'Words=["code","coder","coding","coffee","cold"], prefix="cod" → ["code","coder","coding"]',
     starter:`function autocomplete(words, prefix) {
  const root = {};
  // Build trie (store full word at end node with key '$')
  for (const word of words) {
    let node = root;
    for (const c of word) { if (!node[c]) node[c] = {}; node = node[c]; }
    node.$ = word;
  }

  // Navigate to prefix
  let node = root;
  for (const c of prefix) {
    if (!node[c]) return [];
    node = node[c];
  }

  // TODO: DFS the subtree from 'node', collecting all words stored at '.$' nodes
  const results = [];
  function dfs(n) {
    
  }
  dfs(node);
  return results.sort();
}
console.log(autocomplete(["code","coder","coding","coffee","cold"],"cod"));`,
     test:c=>{try{const l=[];const f=new Function('console',c);f({log:(...a)=>l.push(a.map(x=>JSON.stringify(x)).join(' '))});return l[0]==='["code","coder","coding"]';}catch{return false;}},
     expected:'["code","coder","coding"]'},
  ],
  'union-find': [
    {title:'Number of Islands (Union-Find)',diff:'EASY',dc:'#00ffa3',
     body:'Count islands in a 2D grid using Union-Find. 1=land, 0=water.',
     example:'Input:  [["1","1","0"],["0","1","0"],["0","0","1"]]\nOutput: 2',
     starter:`function numIslands(grid) {
  const rows = grid.length, cols = grid[0].length;
  const parent = Array.from({length: rows * cols}, (_, i) => i);

  function find(x) {
    // TODO: find root with path compression
    // While parent[x] !== x, do parent[x] = parent[parent[x]], x = parent[x]
    
    return x;
  }

  function union(a, b) {
    parent[find(a)] = find(b);
  }

  let count = 0;
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      if (grid[i][j] === '1') {
        count++;
        // TODO: union with top neighbor if '1', and left neighbor if '1'
        //       index in parent array = i*cols + j
        
      }
    }
  }

  // Count unique roots among all land cells
  const roots = new Set();
  for (let i = 0; i < rows; i++)
    for (let j = 0; j < cols; j++)
      if (grid[i][j] === '1') roots.add(find(i * cols + j));
  return roots.size;
}
console.log(numIslands([["1","1","0"],["0","1","0"],["0","0","1"]]));`,
     test:c=>{try{const l=[];const f=new Function('console',c);f({log:(...a)=>l.push(a.join(' '))});return l[0]==='2';}catch{return false;}},
     expected:'2'},
    {title:'Detect Cycle using DSU',diff:'MEDIUM',dc:'#ffe040',
     body:'Use Union-Find to detect if an undirected graph has a cycle.',
     example:'Input:  n=4, edges=[[0,1],[1,2],[2,0]]\nOutput: true (cycle)',
     starter:`function hasCycleDSU(n, edges) {
  const parent = Array.from({length: n}, (_, i) => i);

  function find(x) {
    // TODO: find root with path compression
    
    return x;
  }

  for (const [u, v] of edges) {
    const rootU = find(u);
    const rootV = find(v);
    // TODO: if rootU === rootV, adding this edge creates a cycle — return true
    //       else union them: parent[rootU] = rootV
    
  }
  return false;
}
console.log(hasCycleDSU(4,[[0,1],[1,2],[2,0]]));`,
     test:c=>{try{const l=[];const f=new Function('console',c);f({log:(...a)=>l.push(a.join(' '))});return l[0]==='true';}catch{return false;}},
     expected:'true'},
    {title:'Accounts Merge',diff:'HARD',dc:'#ff8a8a',
     body:'Merge accounts sharing common emails. Return count of merged account groups.',
     example:'Input:  emails=[["a@x","b@x"],["b@x","c@x"],["d@x"]]\nOutput: 2 groups',
     starter:`function mergeAccounts(accounts) {
  const parent = {};

  function find(x) {
    if (parent[x] === undefined) parent[x] = x;
    // TODO: path compression — if parent[x] !== x, recursively find root
    
    return parent[x];
  }

  function union(a, b) {
    parent[find(a)] = find(b);
  }

  // Union all emails within the same account
  for (const acc of accounts) {
    const first = acc[0];
    for (let i = 1; i < acc.length; i++) {
      // TODO: union first with acc[i] (they're in the same account)
      
    }
  }

  // Count unique roots
  const groups = new Set();
  for (const acc of accounts) groups.add(find(acc[0]));
  return groups.size;
}
console.log(mergeAccounts([["a@x","b@x"],["b@x","c@x"],["d@x"]]));`,
     test:c=>{try{const l=[];const f=new Function('console',c);f({log:(...a)=>l.push(a.join(' '))});return l[0]==='2';}catch{return false;}},
     expected:'2'},
  ],
  'tower-of-hanoi': [
    {title:'Recursive Tower of Hanoi',diff:'EASY',dc:'#00ffa3',
     body:'Move n disks from peg A to peg C using peg B as auxiliary. Print each move.',
     example:'Input:  n=3\nOutput: A->C, A->B, C->B, A->C, B->A, B->C, A->C',
     starter:`function hanoi(n, from, to, aux) {
  if (n === 0) return;
  // TODO: move n-1 disks from 'from' to 'aux' using 'to' as helper
  
  console.log(from + '->' + to);
  // TODO: move n-1 disks from 'aux' to 'to' using 'from' as helper
  
}
hanoi(3, 'A', 'C', 'B');`,
     test:c=>{try{const l=[];const f=new Function('console',c);f({log:(...a)=>l.push(a.join(' '))});return l.length===7&&l[0]==='A->C'&&l[6]==='A->C';}catch{return false;}},
     expected:'7 moves: A->C, A->B, C->B, A->C, B->A, B->C, A->C'},
    {title:'Count Minimum Moves',diff:'MEDIUM',dc:'#ffe040',
     body:'Return the minimum number of moves needed to solve Tower of Hanoi with n disks.',
     example:'Input:  n=4\nOutput: 15',
     starter:`function minMoves(n) {
  // TODO: use the formula T(n) = 2*T(n-1) + 1, T(0) = 0
  // Can be solved recursively or with the closed form: 2^n - 1
  
}
console.log(minMoves(4));`,
     test:c=>{try{const l=[];const f=new Function('console',c);f({log:(...a)=>l.push(a.join(' '))});return l[0]==='15';}catch{return false;}},
     expected:'15'},
    {title:'Generalized Hanoi Path',diff:'HARD',dc:'#ff8a8a',
     body:'Return all moves as an array of [from, to] pairs for n disks.',
     example:'Input:  n=2\nOutput: [["A","B"],["A","C"],["B","C"]]',
     starter:`function hanoiMoves(n, from='A', to='C', aux='B') {
  if (n === 0) return [];
  // TODO: collect moves for n-1 disks to aux, then [from,to], then n-1 disks to to
  
}
console.log(JSON.stringify(hanoiMoves(2)));`,
     test:c=>{try{const l=[];const f=new Function('console',c);f({log:(...a)=>l.push(a.join(' '))});return l[0]==='[["A","B"],["A","C"],["B","C"]]';}catch{return false;}},
     expected:'[["A","B"],["A","C"],["B","C"]]'},
  ],
  'permutations': [
    {title:'Generate All Permutations',diff:'EASY',dc:'#00ffa3',
     body:'Generate all permutations of an array using recursive backtracking with swaps.',
     example:'Input:  [1,2,3]\nOutput: 6 permutations',
     starter:`function permutations(arr) {
  const result = [];
  function go(start) {
    if (start === arr.length - 1) { result.push([...arr]); return; }
    for (let i = start; i < arr.length; i++) {
      // TODO: swap arr[start] with arr[i], recurse go(start+1), then swap back
      
    }
  }
  go(0);
  return result;
}
console.log(permutations([1,2,3]).length);`,
     test:c=>{try{const l=[];const f=new Function('console',c);f({log:(...a)=>l.push(a.join(' '))});return l[0]==='6';}catch{return false;}},
     expected:'6'},
    {title:'Permutations of String',diff:'MEDIUM',dc:'#ffe040',
     body:'Generate all unique permutations of a string (no duplicates in output).',
     example:'Input:  "ABC"\nOutput: 6 unique permutations',
     starter:`function strPermutations(s) {
  const result = new Set();
  const arr = s.split('');
  function go(start) {
    if (start === arr.length - 1) { result.add(arr.join('')); return; }
    for (let i = start; i < arr.length; i++) {
      [arr[start],arr[i]] = [arr[i],arr[start]];
      go(start + 1);
      // TODO: swap back (backtrack)
      
    }
  }
  go(0);
  return [...result].sort();
}
console.log(strPermutations("ABC").length);`,
     test:c=>{try{const l=[];const f=new Function('console',c);f({log:(...a)=>l.push(a.join(' '))});return l[0]==='6';}catch{return false;}},
     expected:'6'},
    {title:'Kth Permutation',diff:'HARD',dc:'#ff8a8a',
     body:'Find the k-th permutation of digits [1..n] in lexicographic order without generating all permutations.',
     example:'Input:  n=3, k=3\nOutput: "213"',
     starter:`function kthPermutation(n, k) {
  const digits = Array.from({length:n},(_,i)=>i+1);
  const fact = Array(n+1).fill(1);
  for (let i=1;i<=n;i++) fact[i]=fact[i-1]*i;
  k--; // convert to 0-indexed
  let result = '';
  for (let i = n; i >= 1; i--) {
    // TODO: pick digit at index floor(k / fact[i-1]), append to result, remove from digits
    // Then k = k % fact[i-1]
    
  }
  return result;
}
console.log(kthPermutation(3, 3));`,
     test:c=>{try{const l=[];const f=new Function('console',c);f({log:(...a)=>l.push(a.join(' '))});return l[0]==='213';}catch{return false;}},
     expected:'"213"'},
  ],
  'bst-ops': [
    {title:'BST Insert & Search',diff:'EASY',dc:'#00ffa3',
     body:'Implement BST insert and search. Insert values then check if a value exists.',
     example:'Insert [5,3,7,1,4], search(4) → true, search(6) → false',
     starter:`class BST {
  constructor() { this.root = null; }
  insert(val) {
    const node = { val, left: null, right: null };
    if (!this.root) { this.root = node; return; }
    let cur = this.root;
    while (true) {
      if (val < cur.val) {
        // TODO: go left; if null, place node here
        
      } else {
        // TODO: go right; if null, place node here
        
      }
    }
  }
  search(val) {
    let cur = this.root;
    while (cur) {
      if (val === cur.val) return true;
      // TODO: go left if val < cur.val, else go right
      
    }
    return false;
  }
}
const bst = new BST();
[5,3,7,1,4].forEach(v => bst.insert(v));
console.log(bst.search(4) && !bst.search(6));`,
     test:c=>{try{const l=[];const f=new Function('console',c);f({log:(...a)=>l.push(a.join(' '))});return l[0]==='true';}catch{return false;}},
     expected:'true'},
    {title:'BST Inorder (Sorted Output)',diff:'MEDIUM',dc:'#ffe040',
     body:'Build a BST and return all values via inorder traversal (should be sorted ascending).',
     example:'Insert [5,3,7,1,4,6,8] → inorder: [1,3,4,5,6,7,8]',
     starter:`function bstInorder(values) {
  let root = null;
  function insert(node, val) {
    if (!node) return { val, left:null, right:null };
    if (val < node.val) node.left = insert(node.left, val);
    else node.right = insert(node.right, val);
    return node;
  }
  values.forEach(v => root = insert(root, v));
  const result = [];
  function inorder(node) {
    if (!node) return;
    // TODO: visit left, push node.val, visit right
    
  }
  inorder(root);
  return result;
}
console.log(bstInorder([5,3,7,1,4,6,8]));`,
     test:c=>{try{const l=[];const f=new Function('console',c);f({log:(...a)=>l.push(a.map(x=>JSON.stringify(x)).join(' '))});return l[0]==='[1,3,4,5,6,7,8]';}catch{return false;}},
     expected:'[1,3,4,5,6,7,8]'},
    {title:'Validate BST',diff:'HARD',dc:'#ff8a8a',
     body:'Check if a binary tree is a valid BST. Each node must satisfy min < node.val < max.',
     example:'Tree [5,3,7,1,4,6,8] → true. Tree [5,3,7,1,6,4,8] → false',
     starter:`function isValidBST(root, min=-Infinity, max=Infinity) {
  if (!root) return true;
  // TODO: if root.val <= min or root.val >= max, return false
  // TODO: recursively validate left (max=root.val) and right (min=root.val)
  
}
// Build test trees
function node(v,l,r){return{val:v,left:l,right:r};}
const valid = node(5, node(3,node(1,null,null),node(4,null,null)), node(7,node(6,null,null),node(8,null,null)));
const invalid = node(5, node(3,node(1,null,null),node(6,null,null)), node(7,node(4,null,null),node(8,null,null)));
console.log(isValidBST(valid) && !isValidBST(invalid));`,
     test:c=>{try{const l=[];const f=new Function('console',c);f({log:(...a)=>l.push(a.join(' '))});return l[0]==='true';}catch{return false;}},
     expected:'true'},
  ],
  'avl-tree': [
    {title:'AVL Balance Factor',diff:'EASY',dc:'#00ffa3',
     body:'Compute the balance factor (height(left) - height(right)) for every node in a binary tree. Return the maximum absolute balance factor.',
     example:'A balanced AVL tree should have max |balance| ≤ 1',
     starter:`function maxImbalance(root) {
  function height(node) {
    if (!node) return 0;
    // TODO: return 1 + max(height(left), height(right))
    
  }
  function check(node) {
    if (!node) return 0;
    const bf = Math.abs(height(node.left) - height(node.right));
    // TODO: return max of bf, check(node.left), check(node.right)
    
  }
  return check(root);
}
function node(v,l,r){return{val:v,left:l,right:r};}
const balanced = node(4, node(2,node(1,null,null),node(3,null,null)), node(6,node(5,null,null),node(7,null,null)));
const unbalanced = node(1, null, node(2, null, node(3,null,null)));
console.log(maxImbalance(balanced)<=1 && maxImbalance(unbalanced)>1);`,
     test:c=>{try{const l=[];const f=new Function('console',c);f({log:(...a)=>l.push(a.join(' '))});return l[0]==='true';}catch{return false;}},
     expected:'true'},
    {title:'Right Rotation',diff:'MEDIUM',dc:'#ffe040',
     body:'Implement a right rotation on a BST node. Used in AVL LL case.',
     example:'Rotate right on node with left child: left child becomes new root',
     starter:`function rotateRight(node) {
  // node.left becomes the new root
  // new root's right child becomes node
  // node's left child becomes new root's old right child
  const newRoot = node.left;
  // TODO: node.left = newRoot.right
  // TODO: newRoot.right = node
  // TODO: return newRoot
  
}
function nd(v,l,r){return{val:v,left:l,right:r};}
// Tree: 30(left=20(left=10)) — LL imbalance
const tree = nd(30, nd(20, nd(10,null,null), null), null);
const rotated = rotateRight(tree);
console.log(rotated.val===20 && rotated.right.val===30 && rotated.left.val===10);`,
     test:c=>{try{const l=[];const f=new Function('console',c);f({log:(...a)=>l.push(a.join(' '))});return l[0]==='true';}catch{return false;}},
     expected:'true'},
    {title:'Tree Height',diff:'HARD',dc:'#ff8a8a',
     body:'Compute height of binary tree. AVL ensures height ≤ 1.44 log₂(n). Return height.',
     example:'Input:  Complete tree with 7 nodes\nOutput: 3',
     starter:`function treeHeight(root) {
  // TODO: recursive height — 0 for null, 1 + max(left, right) otherwise
  
}
function nd(v,l,r){return{val:v,left:l,right:r};}
const tree = nd(4, nd(2,nd(1,null,null),nd(3,null,null)), nd(6,nd(5,null,null),nd(7,null,null)));
console.log(treeHeight(tree));`,
     test:c=>{try{const l=[];const f=new Function('console',c);f({log:(...a)=>l.push(a.join(' '))});return l[0]==='3';}catch{return false;}},
     expected:'3'},
  ],
  'tree-traversal': [
    {title:'Inorder Traversal',diff:'EASY',dc:'#00ffa3',
     body:'Return inorder traversal of a binary tree (Left → Root → Right).',
     example:'Input:  tree [4,2,6,1,3,5,7]\nOutput: [1,2,3,4,5,6,7]',
     starter:`function inorder(root) {
  const result = [];
  function dfs(node) {
    if (!node) return;
    // TODO: visit left, push node.val, visit right
    
  }
  dfs(root);
  return result;
}
function nd(v,l,r){return{val:v,left:l,right:r};}
const tree = nd(4, nd(2,nd(1,null,null),nd(3,null,null)), nd(6,nd(5,null,null),nd(7,null,null)));
console.log(inorder(tree));`,
     test:c=>{try{const l=[];const f=new Function('console',c);f({log:(...a)=>l.push(a.map(x=>JSON.stringify(x)).join(' '))});return l[0]==='[1,2,3,4,5,6,7]';}catch{return false;}},
     expected:'[1,2,3,4,5,6,7]'},
    {title:'Level Order Traversal',diff:'MEDIUM',dc:'#ffe040',
     body:'Return level-order (BFS) traversal of a binary tree, grouped by level.',
     example:'Input:  tree [4,2,6]\nOutput: [[4],[2,6]]',
     starter:`function levelOrder(root) {
  if (!root) return [];
  const result = [], queue = [root];
  while (queue.length) {
    const level = [], size = queue.length;
    for (let i = 0; i < size; i++) {
      const node = queue.shift();
      level.push(node.val);
      // TODO: enqueue left and right children if they exist
      
    }
    result.push(level);
  }
  return result;
}
function nd(v,l,r){return{val:v,left:l,right:r};}
const tree = nd(4, nd(2,nd(1,null,null),nd(3,null,null)), nd(6,nd(5,null,null),nd(7,null,null)));
console.log(JSON.stringify(levelOrder(tree)));`,
     test:c=>{try{const l=[];const f=new Function('console',c);f({log:(...a)=>l.push(a.join(' '))});return l[0]==='[[4],[2,6],[1,3,5,7]]';}catch{return false;}},
     expected:'[[4],[2,6],[1,3,5,7]]'},
    {title:'All Four Traversals',diff:'HARD',dc:'#ff8a8a',
     body:'Return an object with all four traversals: inorder, preorder, postorder, levelorder.',
     example:'Input:  tree [4,2,6]\nOutput: {in:[2,4,6],pre:[4,2,6],post:[2,6,4],level:[[4],[2,6]]}',
     starter:`function allTraversals(root) {
  const result = { in:[], pre:[], post:[], level:[] };
  function dfs(node) {
    if (!node) return;
    result.pre.push(node.val);   // preorder: root first
    dfs(node.left);
    result.in.push(node.val);    // inorder: root middle
    dfs(node.right);
    result.post.push(node.val);  // postorder: root last
  }
  dfs(root);
  // TODO: implement level order into result.level (use a queue)
  
  return result;
}
function nd(v,l,r){return{val:v,left:l,right:r};}
const tree = nd(4, nd(2,null,null), nd(6,null,null));
const t = allTraversals(tree);
console.log(t.in.join(',')+'/'+t.pre.join(',')+'/'+t.post.join(',')+'/'+JSON.stringify(t.level));`,
     test:c=>{try{const l=[];const f=new Function('console',c);f({log:(...a)=>l.push(a.join(' '))});return l[0]==='2,4,6/4,2,6/2,6,4/[[4],[2,6]]';}catch{return false;}},
     expected:'2,4,6/4,2,6/2,6,4/[[4],[2,6]]'},
  ],
  'red-black-tree': [
    {title:'Check Red-Black Property',diff:'EASY',dc:'#00ffa3',
     body:'Verify a simulated Red-Black tree satisfies: no red-red parent-child, all paths have same black height.',
     example:'Valid RB tree returns true',
     starter:`function checkRB(node, blackCount=0, pathBlack=null) {
  if (!node) {
    // TODO: if pathBlack is null, set it to blackCount; else check they're equal
    
    return true;
  }
  if (node.color === 'RED' && node.parent && node.parent.color === 'RED') return false;
  const newCount = node.color === 'BLACK' ? blackCount+1 : blackCount;
  return checkRB(node.left, newCount, pathBlack) && checkRB(node.right, newCount, pathBlack);
}
// Simple valid RB tree simulation: root black, leaves black
const tree = {val:10,color:'BLACK',parent:null,
  left:{val:5,color:'RED',parent:null,left:{val:0,color:'BLACK',parent:null,left:null,right:null},right:{val:7,color:'BLACK',parent:null,left:null,right:null}},
  right:{val:20,color:'RED',parent:null,left:{val:15,color:'BLACK',parent:null,left:null,right:null},right:{val:30,color:'BLACK',parent:null,left:null,right:null}}};
console.log(typeof checkRB(tree) === 'boolean');`,
     test:c=>{try{const l=[];const f=new Function('console',c);f({log:(...a)=>l.push(a.join(' '))});return l[0]==='true';}catch{return false;}},
     expected:'true'},
    {title:'Black Height Calculation',diff:'MEDIUM',dc:'#ffe040',
     body:'Compute the black-height (number of black nodes on path from root to any leaf) of a tree.',
     example:'Input:  tree where every root-to-leaf path has 2 black nodes\nOutput: 2',
     starter:`function blackHeight(node) {
  if (!node) return 0;
  const left = blackHeight(node.left);
  const right = blackHeight(node.right);
  if (left === -1 || right === -1 || left !== right) return -1; // invalid
  // TODO: return left + (node.color === 'BLACK' ? 1 : 0)
  
}
const rbt = {val:10,color:'BLACK',left:{val:5,color:'RED',left:{val:2,color:'BLACK',left:null,right:null},right:{val:7,color:'BLACK',left:null,right:null}},right:{val:20,color:'RED',left:{val:15,color:'BLACK',left:null,right:null},right:{val:25,color:'BLACK',left:null,right:null}}};
console.log(blackHeight(rbt));`,
     test:c=>{try{const l=[];const f=new Function('console',c);f({log:(...a)=>l.push(a.join(' '))});return l[0]==='2';}catch{return false;}},
     expected:'2'},
    {title:'Count Nodes by Color',diff:'HARD',dc:'#ff8a8a',
     body:'Count red and black nodes in the tree. Return {red, black}.',
     example:'Output: {red:2, black:5} (or similar)',
     starter:`function countColors(root) {
  const counts = { red: 0, black: 0 };
  function dfs(node) {
    if (!node) return;
    // TODO: increment counts.red or counts.black based on node.color
    
    dfs(node.left);
    dfs(node.right);
  }
  dfs(root);
  return counts;
}
const rbt = {val:10,color:'BLACK',left:{val:5,color:'RED',left:{val:2,color:'BLACK',left:null,right:null},right:{val:7,color:'BLACK',left:null,right:null}},right:{val:20,color:'RED',left:{val:15,color:'BLACK',left:null,right:null},right:{val:25,color:'BLACK',left:null,right:null}}};
const r = countColors(rbt);
console.log(r.red===2 && r.black===5);`,
     test:c=>{try{const l=[];const f=new Function('console',c);f({log:(...a)=>l.push(a.join(' '))});return l[0]==='true';}catch{return false;}},
     expected:'true'},
  ],
  'topo-sort': [
    {title:'Topological Sort (Kahn\'s BFS)',diff:'EASY',dc:'#00ffa3',
     body:'Implement Kahn\'s algorithm: repeatedly remove nodes with in-degree 0.',
     example:'Input:  {0:[1,2],1:[3],2:[3],3:[]}, n=4\nOutput: valid topo order',
     starter:`function kahnTopo(adj, n) {
  const indeg = Array(n).fill(0);
  for (let u=0;u<n;u++) for (const v of (adj[u]||[])) indeg[v]++;
  const queue = [];
  for (let i=0;i<n;i++) if (indeg[i]===0) queue.push(i);
  const order = [];
  while (queue.length) {
    const u = queue.shift();
    order.push(u);
    // TODO: for each neighbor v of u, decrement indeg[v]; if indeg[v]===0, enqueue v
    
  }
  return order.length === n ? order : []; // empty = cycle exists
}
const adj = {0:[1,2],1:[3],2:[3],3:[]};
const order = kahnTopo(adj, 4);
console.log(order.indexOf(0)<order.indexOf(1) && order.indexOf(1)<order.indexOf(3));`,
     test:c=>{try{const l=[];const f=new Function('console',c);f({log:(...a)=>l.push(a.join(' '))});return l[0]==='true';}catch{return false;}},
     expected:'true (valid topological order)'},
    {title:'Detect Cycle in DAG',diff:'MEDIUM',dc:'#ffe040',
     body:'Use topological sort to detect a cycle. If Kahn\'s doesn\'t process all nodes → cycle exists.',
     example:'Input:  {0:[1],1:[2],2:[0]} → true (cycle)\n{0:[1],1:[2],2:[]} → false',
     starter:`function hasCycleKahn(adj, n) {
  const indeg = Array(n).fill(0);
  for (let u=0;u<n;u++) for (const v of (adj[u]||[])) indeg[v]++;
  const q = [];
  for (let i=0;i<n;i++) if (indeg[i]===0) q.push(i);
  let processed = 0;
  while (q.length) {
    const u = q.shift(); processed++;
    for (const v of (adj[u]||[])) {
      // TODO: decrement indeg[v], push to q if 0
      
    }
  }
  // TODO: return true if processed < n (some nodes stuck in cycle)
  
}
console.log(hasCycleKahn({0:[1],1:[2],2:[0]},3) && !hasCycleKahn({0:[1],1:[2],2:[]},3));`,
     test:c=>{try{const l=[];const f=new Function('console',c);f({log:(...a)=>l.push(a.join(' '))});return l[0]==='true';}catch{return false;}},
     expected:'true'},
    {title:'Course Schedule',diff:'HARD',dc:'#ff8a8a',
     body:'Given n courses and prerequisites [[a,b] meaning b must come before a], can you finish all courses? Return true if possible.',
     example:'Input:  n=4, prereqs=[[1,0],[2,0],[3,1],[3,2]]\nOutput: true',
     starter:`function canFinish(n, prerequisites) {
  const adj = Array.from({length:n},()=>[]);
  const indeg = Array(n).fill(0);
  prerequisites.forEach(([a,b]) => { adj[b].push(a); indeg[a]++; });
  const q = [];
  for (let i=0;i<n;i++) if (indeg[i]===0) q.push(i);
  let done = 0;
  while (q.length) {
    const u = q.shift(); done++;
    for (const v of adj[u]) {
      // TODO: decrement indeg[v], push to q if becomes 0
      
    }
  }
  // TODO: return done === n
  
}
console.log(canFinish(4,[[1,0],[2,0],[3,1],[3,2]]));`,
     test:c=>{try{const l=[];const f=new Function('console',c);f({log:(...a)=>l.push(a.join(' '))});return l[0]==='true';}catch{return false;}},
     expected:'true'},
  ],
  'kruskal': [
    {title:'Kruskal\'s MST',diff:'EASY',dc:'#00ffa3',
     body:'Implement Kruskal\'s algorithm using Union-Find. Return total MST weight.',
     example:'Input:  edges=[[0,1,4],[0,2,1],[1,2,2],[1,3,5],[2,3,8]], n=4\nOutput: 8',
     starter:`function kruskalMST(n, edges) {
  edges.sort((a,b) => a[2]-b[2]); // sort by weight
  const parent = Array.from({length:n},(_,i)=>i);
  function find(x){while(parent[x]!==x){parent[x]=parent[parent[x]];x=parent[x];}return x;}
  function union(a,b){parent[find(a)]=find(b);}
  let totalWeight = 0, edgeCount = 0;
  for (const [u,v,w] of edges) {
    if (find(u) !== find(v)) {
      // TODO: union u and v, add w to totalWeight, increment edgeCount
      // Stop when edgeCount === n-1
      
    }
    if (edgeCount === n-1) break;
  }
  return totalWeight;
}
console.log(kruskalMST(4,[[0,1,4],[0,2,1],[1,2,2],[1,3,5],[2,3,8]]));`,
     test:c=>{try{const l=[];const f=new Function('console',c);f({log:(...a)=>l.push(a.join(' '))});return l[0]==='8';}catch{return false;}},
     expected:'8'},
    {title:'Minimum Spanning Tree Edges',diff:'MEDIUM',dc:'#ffe040',
     body:'Return the list of edges in the MST, not just total weight.',
     example:'Input:  n=4, edges=[[0,1,4],[0,2,1],[1,2,2],[1,3,5]]\nOutput: 3 MST edges',
     starter:`function kruskalEdges(n, edges) {
  edges.sort((a,b)=>a[2]-b[2]);
  const parent=Array.from({length:n},(_,i)=>i);
  function find(x){while(parent[x]!==x){parent[x]=parent[parent[x]];x=parent[x];}return x;}
  const mst=[];
  for (const [u,v,w] of edges) {
    if (find(u)!==find(v)) {
      // TODO: union u,v and push [u,v,w] to mst
      
    }
    if (mst.length===n-1) break;
  }
  return mst;
}
console.log(kruskalEdges(4,[[0,1,4],[0,2,1],[1,2,2],[1,3,5]]).length);`,
     test:c=>{try{const l=[];const f=new Function('console',c);f({log:(...a)=>l.push(a.join(' '))});return l[0]==='3';}catch{return false;}},
     expected:'3'},
    {title:'MST with Kruskal vs Prim',diff:'HARD',dc:'#ff8a8a',
     body:'Both algorithms should give the same MST total weight. Verify they agree.',
     example:'n=5, edges=[[0,1,2],[0,3,6],[1,2,3],[1,3,8],[1,4,5],[2,4,7],[3,4,9]] → both output 16',
     starter:`function kruskalW(n,edges){edges.sort((a,b)=>a[2]-b[2]);const p=Array.from({length:n},(_,i)=>i);function find(x){while(p[x]!==x){p[x]=p[p[x]];x=p[x];}return x;}let w=0,cnt=0;for(const[u,v,e]of edges){if(find(u)!==find(v)){p[find(u)]=find(v);w+=e;cnt++;}if(cnt===n-1)break;}return w;}
function primW(n,edges){const adj=Array.from({length:n},()=>[]);edges.forEach(([u,v,w])=>{adj[u].push([v,w]);adj[v].push([u,w]);});const vis=new Set([0]),dist=Array(n).fill(Infinity);dist[0]=0;// TODO: standard Prim — pick min dist unvisited node, relax neighbors
// (You can also just call kruskalW for now and check they match)

}
const edges=[[0,1,2],[0,3,6],[1,2,3],[1,3,8],[1,4,5],[2,4,7],[3,4,9]];
console.log(kruskalW(5,edges));`,
     test:c=>{try{const l=[];const f=new Function('console',c);f({log:(...a)=>l.push(a.join(' '))});return l[0]==='16';}catch{return false;}},
     expected:'16'},
  ],
  'prim': [
    {title:"Prim's MST Weight",diff:'EASY',dc:'#00ffa3',
     body:"Implement Prim's algorithm: grow MST from node 0 by always picking cheapest crossing edge. Return total weight.",
     example:'Input:  adj={0:[[1,4],[2,1]],1:[[0,4],[2,2],[3,5]],2:[[0,1],[1,2],[3,8]],3:[[1,5],[2,8]]}\nOutput: 8',
     starter:`function primMST(adj, n) {
  const inMST = new Set([0]);
  const dist = Array(n).fill(Infinity);
  dist[0] = 0;
  let totalWeight = 0;
  for (let i = 0; i < n - 1; i++) {
    // TODO: find node u not in MST with minimum dist[u]
    let u = -1;
    
    inMST.add(u);
    totalWeight += dist[u];
    // TODO: for each neighbor [v,w] of u: if v not in MST and w < dist[v], update dist[v]
    
  }
  return totalWeight;
}
const adj={0:[[1,4],[2,1]],1:[[0,4],[2,2],[3,5]],2:[[0,1],[1,2],[3,8]],3:[[1,5],[2,8]]};
console.log(primMST(adj,4));`,
     test:c=>{try{const l=[];const f=new Function('console',c);f({log:(...a)=>l.push(a.join(' '))});return l[0]==='8';}catch{return false;}},
     expected:'8'},
    {title:'MST Edge List from Prim',diff:'MEDIUM',dc:'#ffe040',
     body:"Return which edges are in the MST (as [u,v] pairs) using Prim's algorithm.",
     example:'n=4, return 3 edges',
     starter:`function primEdges(adj, n) {
  const inMST = new Set([0]);
  const dist = Array(n).fill(Infinity);
  const parent = Array(n).fill(-1);
  dist[0] = 0;
  for (let i = 0; i < n-1; i++) {
    let u = -1;
    for (let v=0;v<n;v++) if(!inMST.has(v)&&(u===-1||dist[v]<dist[u])) u=v;
    inMST.add(u);
    for (const [v,w] of (adj[u]||[])) {
      if (!inMST.has(v) && w < dist[v]) {
        dist[v] = w;
        // TODO: set parent[v] = u
        
      }
    }
  }
  // TODO: return edges as [[parent[v],v] for v=1..n-1]
  
}
const adj={0:[[1,4],[2,1]],1:[[0,4],[2,2],[3,5]],2:[[0,1],[1,2],[3,8]],3:[[1,5],[2,8]]};
console.log(primEdges(adj,4).length);`,
     test:c=>{try{const l=[];const f=new Function('console',c);f({log:(...a)=>l.push(a.join(' '))});return l[0]==='3';}catch{return false;}},
     expected:'3'},
    {title:'Connect All Cities Cheaply',diff:'HARD',dc:'#ff8a8a',
     body:'Given cities as [x,y] coordinates, connect all with minimum total cable (Euclidean MST). Return total distance (rounded).',
     example:'Input:  [[0,0],[2,0],[1,1]]\nOutput: approximately 4 (2+√2 ≈ 3.41, rounded to 3)',
     starter:`function minCableCost(points) {
  const n = points.length;
  function dist(a, b) { return Math.sqrt((a[0]-b[0])**2+(a[1]-b[1])**2); }
  const inMST = new Set([0]);
  const minDist = Array(n).fill(Infinity); minDist[0] = 0;
  let total = 0;
  for (let i = 0; i < n-1; i++) {
    // TODO: pick unvisited node u with smallest minDist
    let u = -1;
    
    inMST.add(u); total += minDist[u];
    // TODO: update minDist for all unvisited nodes v using dist(points[u], points[v])
    
  }
  return Math.round(total * 10) / 10;
}
console.log(minCableCost([[0,0],[2,0],[1,1]]));`,
     test:c=>{try{const l=[];const f=new Function('console',c);f({log:(...a)=>l.push(a.join(' '))});const v=parseFloat(l[0]);return v>=3.3&&v<=3.5;}catch{return false;}},
     expected:'≈3.4 (2 + √2)'},
  ],
  'bellman-ford': [
    {title:'Bellman-Ford Shortest Paths',diff:'EASY',dc:'#00ffa3',
     body:'Implement Bellman-Ford: relax all edges V-1 times. Return shortest distances from source 0.',
     example:'Input:  edges=[[0,1,1],[0,2,4],[1,2,-2]], n=3\nOutput: [0,1,-1]',
     starter:`function bellmanFord(n, edges) {
  const dist = Array(n).fill(Infinity);
  dist[0] = 0;
  for (let i = 0; i < n-1; i++) {
    for (const [u,v,w] of edges) {
      // TODO: if dist[u] !== Infinity and dist[u]+w < dist[v], update dist[v]
      
    }
  }
  return dist;
}
console.log(bellmanFord(3,[[0,1,1],[0,2,4],[1,2,-2]]));`,
     test:c=>{try{const l=[];const f=new Function('console',c);f({log:(...a)=>l.push(a.map(x=>JSON.stringify(x)).join(' '))});return l[0]==='[0,1,-1]';}catch{return false;}},
     expected:'[0,1,-1]'},
    {title:'Detect Negative Cycle',diff:'MEDIUM',dc:'#ffe040',
     body:'After V-1 relaxations, do one more pass. If any distance still decreases → negative cycle.',
     example:'Input:  edges=[[0,1,1],[1,2,-1],[2,0,-1]], n=3\nOutput: true (negative cycle)',
     starter:`function hasNegCycle(n, edges) {
  const dist = Array(n).fill(Infinity); dist[0] = 0;
  for (let i = 0; i < n-1; i++) {
    for (const [u,v,w] of edges) {
      if (dist[u]!==Infinity && dist[u]+w<dist[v]) dist[v]=dist[u]+w;
    }
  }
  // TODO: do one more relaxation pass; if any dist[v] still improves, return true
  
  return false;
}
console.log(hasNegCycle(3,[[0,1,1],[1,2,-1],[2,0,-1]]));`,
     test:c=>{try{const l=[];const f=new Function('console',c);f({log:(...a)=>l.push(a.join(' '))});return l[0]==='true';}catch{return false;}},
     expected:'true'},
    {title:'Currency Arbitrage Detection',diff:'HARD',dc:'#ff8a8a',
     body:'Given currency exchange rates, detect if arbitrage exists (a cycle with product > 1). Convert to log weights and use Bellman-Ford negative cycle detection.',
     example:'Input:  rates=[[1,0.5,2],[2,1,3],[0.5,0.33,1]] (3 currencies)\nOutput: true if arbitrage exists',
     starter:`function hasArbitrage(rates) {
  const n = rates.length;
  // Convert to negative log weights: if product of cycle > 1 → sum of -log < 0
  const edges = [];
  for (let i=0;i<n;i++) for (let j=0;j<n;j++) if (i!==j)
    edges.push([i,j,-Math.log(rates[i][j])]);
  const dist=Array(n).fill(0); // start all at 0 (any node could start)
  for (let i=0;i<n-1;i++) for (const[u,v,w]of edges) if(dist[u]+w<dist[v]) dist[v]=dist[u]+w;
  // TODO: one more relaxation — if any improve, return true (negative cycle = arbitrage)
  
  return false;
}
// Simple test: 3 currencies with profitable cycle
console.log(typeof hasArbitrage([[1,2,1],[0.5,1,2],[1,0.5,1]]) === 'boolean');`,
     test:c=>{try{const l=[];const f=new Function('console',c);f({log:(...a)=>l.push(a.join(' '))});return l[0]==='true';}catch{return false;}},
     expected:'true (returns boolean)'},
  ],
  'activity-selection': [
    {title:'Maximum Non-Overlapping Activities',diff:'EASY',dc:'#00ffa3',
     body:'Greedy activity selection: sort by finish time, pick each activity that starts after last selected ends.',
     example:'Input:  start=[1,3,0,5,8,5], finish=[2,4,6,7,9,9]\nOutput: 4',
     starter:`function activitySelection(start, finish) {
  const n = start.length;
  const activities = Array.from({length:n},(_,i)=>i).sort((a,b)=>finish[a]-finish[b]);
  let count = 1, lastEnd = finish[activities[0]];
  for (let i = 1; i < n; i++) {
    const idx = activities[i];
    // TODO: if start[idx] >= lastEnd, select this activity, update lastEnd and count
    
  }
  return count;
}
console.log(activitySelection([1,3,0,5,8,5],[2,4,6,7,9,9]));`,
     test:c=>{try{const l=[];const f=new Function('console',c);f({log:(...a)=>l.push(a.join(' '))});return l[0]==='4';}catch{return false;}},
     expected:'4'},
    {title:'Weighted Job Scheduling',diff:'MEDIUM',dc:'#ffe040',
     body:'Each job has start, end, weight. Find max weight non-overlapping selection using DP.',
     example:'Input:  jobs=[[1,2,50],[3,5,20],[6,19,100],[2,100,200]]\nOutput: 250',
     starter:`function weightedSchedule(jobs) {
  jobs.sort((a,b)=>a[1]-b[1]);
  const n=jobs.length;
  const dp=Array(n+1).fill(0);
  function lastNonConflict(i){let lo=0,hi=i-1;while(lo<=hi){const m=Math.floor((lo+hi)/2);if(jobs[m][1]<=jobs[i][0])lo=m+1;else hi=m-1;}return hi;}
  for(let i=0;i<n;i++){
    const p=lastNonConflict(i);
    // TODO: dp[i+1] = max(dp[i], dp[p+1] + jobs[i][2])
    
  }
  return dp[n];
}
console.log(weightedSchedule([[1,2,50],[3,5,20],[6,19,100],[2,100,200]]));`,
     test:c=>{try{const l=[];const f=new Function('console',c);f({log:(...a)=>l.push(a.join(' '))});return l[0]==='250';}catch{return false;}},
     expected:'250'},
    {title:'Meeting Rooms Required',diff:'HARD',dc:'#ff8a8a',
     body:'Given meeting intervals, find minimum meeting rooms needed (maximum overlap at any time).',
     example:'Input:  [[0,30],[5,10],[15,20]]\nOutput: 2',
     starter:`function minRooms(intervals) {
  const starts = intervals.map(i=>i[0]).sort((a,b)=>a-b);
  const ends = intervals.map(i=>i[1]).sort((a,b)=>a-b);
  let rooms=0, maxRooms=0, j=0;
  for (let i=0;i<starts.length;i++) {
    // TODO: if starts[i] < ends[j], increment rooms; else increment j
    // track maxRooms = max(maxRooms, rooms)
    
  }
  return maxRooms;
}
console.log(minRooms([[0,30],[5,10],[15,20]]));`,
     test:c=>{try{const l=[];const f=new Function('console',c);f({log:(...a)=>l.push(a.join(' '))});return l[0]==='2';}catch{return false;}},
     expected:'2'},
  ],
  'huffman-coding': [
    {title:'Build Huffman Codes',diff:'EASY',dc:'#00ffa3',
     body:'Build Huffman codes for characters. Return codes as an object.',
     example:'Input:  {a:5,b:9,c:12,d:13,e:16,f:45}\nOutput: object with codes (f gets shortest)',
     starter:`function huffmanCodes(freq) {
  // Priority queue simulation (min-heap via sorted array)
  let heap = Object.entries(freq).map(([ch,f])=>({ch,f,left:null,right:null})).sort((a,b)=>a.f-b.f);
  while (heap.length > 1) {
    const a = heap.shift(), b = heap.shift();
    const merged = {ch:null, f:a.f+b.f, left:a, right:b};
    // TODO: insert merged into heap maintaining sorted order by frequency
    
  }
  const codes = {};
  function traverse(node, code) {
    if (!node.left && !node.right) { codes[node.ch] = code || '0'; return; }
    // TODO: recurse left with code+'0', right with code+'1'
    
  }
  traverse(heap[0], '');
  return codes;
}
const codes = huffmanCodes({a:5,b:9,c:12,d:13,e:16,f:45});
console.log(codes['f'].length <= codes['a'].length);`,
     test:c=>{try{const l=[];const f=new Function('console',c);f({log:(...a)=>l.push(a.join(' '))});return l[0]==='true';}catch{return false;}},
     expected:'true (f gets shortest code)'},
    {title:'Encode a Message',diff:'MEDIUM',dc:'#ffe040',
     body:'Build Huffman codes then encode a message string. Return encoded binary string.',
     example:'Input:  "abacabad"\nOutput: binary string shorter than 8*8=64 bits',
     starter:`function huffmanEncode(text) {
  const freq={};for(const c of text)freq[c]=(freq[c]||0)+1;
  let heap=Object.entries(freq).map(([ch,f])=>({ch,f,l:null,r:null})).sort((a,b)=>a.f-b.f);
  while(heap.length>1){const a=heap.shift(),b=heap.shift();const m={ch:null,f:a.f+b.f,l:a,r:b};let i=0;while(i<heap.length&&heap[i].f<m.f)i++;heap.splice(i,0,m);}
  const codes={};
  function build(node,code){if(!node.l&&!node.r){codes[node.ch]=code||'0';return;}build(node.l,code+'0');build(node.r,code+'1');}
  build(heap[0],'');
  // TODO: encode: map each character in text to its code and join
  
}
const encoded = huffmanEncode("abacabad");
console.log(encoded.length < 64);`,
     test:c=>{try{const l=[];const f=new Function('console',c);f({log:(...a)=>l.push(a.join(' '))});return l[0]==='true';}catch{return false;}},
     expected:'true (compressed < 64 bits)'},
    {title:'Compression Ratio',diff:'HARD',dc:'#ff8a8a',
     body:'Compute compression ratio: original bits / encoded bits. Should be > 1 for natural text.',
     example:'Input:  "aaabbc"\nOutput: ratio > 1',
     starter:`function compressionRatio(text) {
  const freq={};for(const c of text)freq[c]=(freq[c]||0)+1;
  let heap=Object.entries(freq).map(([ch,f])=>({ch,f,l:null,r:null})).sort((a,b)=>a.f-b.f);
  while(heap.length>1){const a=heap.shift(),b=heap.shift();const m={ch:null,f:a.f+b.f,l:a,r:b};let i=0;while(i<heap.length&&heap[i].f<m.f)i++;heap.splice(i,0,m);}
  const codes={};
  function build(n,code){if(!n.l&&!n.r){codes[n.ch]=code||'0';return;}build(n.l,code+'0');build(n.r,code+'1');}
  build(heap[0],'');
  const originalBits = text.length * 8;
  // TODO: compute encodedBits = sum of freq[ch] * codes[ch].length for each character
  // return originalBits / encodedBits
  
}
const ratio = compressionRatio("aaabbc");
console.log(ratio > 1);`,
     test:c=>{try{const l=[];const f=new Function('console',c);f({log:(...a)=>l.push(a.join(' '))});return l[0]==='true';}catch{return false;}},
     expected:'true (ratio > 1)'},
  ],
  'interpolation-search': [
    {title:'Interpolation Search',diff:'EASY',dc:'#00ffa3',
     body:'Implement interpolation search on a uniformly distributed sorted array.',
     example:'Input:  arr=[10,20,30,40,50,60,70,80,90], target=70\nOutput: 6',
     starter:`function interpolationSearch(arr, target) {
  let lo = 0, hi = arr.length - 1;
  while (lo <= hi && target >= arr[lo] && target <= arr[hi]) {
    // Interpolation formula: estimate probe position
    const pos = lo + Math.floor(((target - arr[lo]) / (arr[hi] - arr[lo])) * (hi - lo));
    if (arr[pos] === target) return pos;
    // TODO: if arr[pos] < target, set lo = pos+1; else hi = pos-1
    
  }
  return -1;
}
console.log(interpolationSearch([10,20,30,40,50,60,70,80,90],70));`,
     test:c=>{try{const l=[];const f=new Function('console',c);f({log:(...a)=>l.push(a.join(' '))});return l[0]==='6';}catch{return false;}},
     expected:'6'},
    {title:'Compare Binary vs Interpolation',diff:'MEDIUM',dc:'#ffe040',
     body:'Count comparisons made by binary search vs interpolation search on a uniform array.',
     example:'Both find target; interpolation should use fewer steps on uniform data',
     starter:`function countSteps(arr, target, method) {
  let lo=0, hi=arr.length-1, steps=0;
  while(lo<=hi) {
    steps++;
    const mid = method==='binary'
      ? Math.floor((lo+hi)/2)
      : lo + Math.floor(((target-arr[lo])/(arr[hi]-arr[lo]))*(hi-lo));
    if(arr[mid]===target) return steps;
    // TODO: if arr[mid] < target, lo = mid+1; else hi = mid-1
    
  }
  return steps;
}
const arr = Array.from({length:100},(_,i)=>(i+1)*10);
const bSteps = countSteps(arr,700,'binary');
const iSteps = countSteps(arr,700,'interpolation');
console.log(bSteps >= iSteps);`,
     test:c=>{try{const l=[];const f=new Function('console',c);f({log:(...a)=>l.push(a.join(' '))});return l[0]==='true';}catch{return false;}},
     expected:'true (interpolation ≤ binary steps on uniform data)'},
    {title:'Square Root via Interpolation',diff:'HARD',dc:'#ff8a8a',
     body:'Find integer square root of n using interpolation-search-style approach on 1..n.',
     example:'Input:  n=144\nOutput: 12',
     starter:`function intSqrt(n) {
  let lo = 1, hi = n;
  while (lo <= hi) {
    // Interpolation estimate for x where x*x = n
    const mid = lo + Math.floor(((n - lo*lo) / (hi*hi - lo*lo)) * (hi-lo));
    const m = Math.max(lo, Math.min(hi, mid)); // clamp to valid range
    if (m*m === n) return m;
    if (m*m < n) lo = m+1;
    else hi = m-1;
  }
  return hi; // floor of sqrt
}
console.log(intSqrt(144));`,
     test:c=>{try{const l=[];const f=new Function('console',c);f({log:(...a)=>l.push(a.join(' '))});return l[0]==='12';}catch{return false;}},
     expected:'12'},
  ],
  'convex-hull': [
    {title:'Cross Product Sign',diff:'EASY',dc:'#00ffa3',
     body:'Implement cross product for 3 points. Returns >0 (CCW), <0 (CW), =0 (collinear).',
     example:'cross([0,0],[1,0],[0,1]) → 1 (counter-clockwise)',
     starter:`function cross(O, A, B) {
  // TODO: return (A[0]-O[0])*(B[1]-O[1]) - (A[1]-O[1])*(B[0]-O[0])
  
}
console.log(cross([0,0],[1,0],[0,1]) > 0);`,
     test:c=>{try{const l=[];const f=new Function('console',c);f({log:(...a)=>l.push(a.join(' '))});return l[0]==='true';}catch{return false;}},
     expected:'true (CCW turn is positive)'},
    {title:'Graham Scan Convex Hull',diff:'MEDIUM',dc:'#ffe040',
     body:'Implement Graham Scan to find convex hull of a set of points.',
     example:'Input:  [[0,0],[1,1],[2,2],[0,2],[2,0]]\nOutput: 4 hull points',
     starter:`function convexHull(points) {
  points.sort((a,b)=>a[1]-b[1]||a[0]-b[0]);
  const cross=(O,A,B)=>(A[0]-O[0])*(B[1]-O[1])-(A[1]-O[1])*(B[0]-O[0]);
  const anchor=points[0];
  points.sort((a,b)=>{const ang=Math.atan2(a[1]-anchor[1],a[0]-anchor[0])-Math.atan2(b[1]-anchor[1],b[0]-anchor[0]);return ang||Math.hypot(a[0]-anchor[0],a[1]-anchor[1])-Math.hypot(b[0]-anchor[0],b[1]-anchor[1]);});
  const hull=[];
  for(const p of points){
    // TODO: while hull has ≥2 points and cross(hull[-2],hull[-1],p)<=0, pop hull
    // Then push p to hull
    
  }
  return hull;
}
console.log(convexHull([[0,0],[1,1],[2,2],[0,2],[2,0]]).length);`,
     test:c=>{try{const l=[];const f=new Function('console',c);f({log:(...a)=>l.push(a.join(' '))});return parseInt(l[0])>=3&&parseInt(l[0])<=5;}catch{return false;}},
     expected:'4 (hull points)'},
    {title:'Is Point Inside Convex Hull',diff:'HARD',dc:'#ff8a8a',
     body:'Given a convex hull polygon, check if a query point is inside or on the hull.',
     example:'Hull=[[0,0],[4,0],[4,4],[0,4]], point=[2,2] → true',
     starter:`function pointInHull(hull, point) {
  const n = hull.length;
  const cross=(O,A,B)=>(A[0]-O[0])*(B[1]-O[1])-(A[1]-O[1])*(B[0]-O[0]);
  // All cross products of consecutive hull edges with the point must have same sign (or 0)
  let sign = 0;
  for (let i=0;i<n;i++) {
    const c = cross(hull[i], hull[(i+1)%n], point);
    // TODO: if c !== 0, set sign on first nonzero; if sign conflict, return false
    
  }
  return true;
}
console.log(pointInHull([[0,0],[4,0],[4,4],[0,4]],[2,2]) && !pointInHull([[0,0],[4,0],[4,4],[0,4]],[5,5]));`,
     test:c=>{try{const l=[];const f=new Function('console',c);f({log:(...a)=>l.push(a.join(' '))});return l[0]==='true';}catch{return false;}},
     expected:'true'},
  ],
  'line-intersection': [
    {title:'Do Segments Intersect?',diff:'EASY',dc:'#00ffa3',
     body:'Determine if two line segments intersect using cross products.',
     example:'Segments [0,0]-[2,2] and [0,2]-[2,0] → true',
     starter:`function segmentsIntersect(p1,p2,p3,p4) {
  function cross(O,A,B){return(A[0]-O[0])*(B[1]-O[1])-(A[1]-O[1])*(B[0]-O[0]);}
  function onSegment(p,q,r){return Math.min(p[0],r[0])<=q[0]&&q[0]<=Math.max(p[0],r[0])&&Math.min(p[1],r[1])<=q[1]&&q[1]<=Math.max(p[1],r[1]);}
  const d1=cross(p3,p4,p1), d2=cross(p3,p4,p2);
  const d3=cross(p1,p2,p3), d4=cross(p1,p2,p4);
  // TODO: if (d1*d2 < 0 && d3*d4 < 0) return true (proper intersection)
  // Check collinear cases with onSegment
  
  return false;
}
console.log(segmentsIntersect([0,0],[2,2],[0,2],[2,0]));`,
     test:c=>{try{const l=[];const f=new Function('console',c);f({log:(...a)=>l.push(a.join(' '))});return l[0]==='true';}catch{return false;}},
     expected:'true'},
    {title:'Count Intersecting Pairs',diff:'MEDIUM',dc:'#ffe040',
     body:'Count how many pairs of segments intersect from a list.',
     example:'Input:  4 segments → 2 intersecting pairs',
     starter:`function countIntersections(segs) {
  let count = 0;
  function cross(O,A,B){return(A[0]-O[0])*(B[1]-O[1])-(A[1]-O[1])*(B[0]-O[0]);}
  function intersects(s1,s2){const d1=cross(s2[0],s2[1],s1[0]),d2=cross(s2[0],s2[1],s1[1]),d3=cross(s1[0],s1[1],s2[0]),d4=cross(s1[0],s1[1],s2[1]);if(d1*d2<0&&d3*d4<0)return true;return false;}
  for(let i=0;i<segs.length;i++){
    for(let j=i+1;j<segs.length;j++){
      // TODO: if intersects(segs[i],segs[j]), increment count
      
    }
  }
  return count;
}
const segs=[[[0,0],[4,4]],[[0,4],[4,0]],[[1,0],[1,4]],[[3,1],[3,3]]];
console.log(countIntersections(segs));`,
     test:c=>{try{const l=[];const f=new Function('console',c);f({log:(...a)=>l.push(a.join(' '))});return parseInt(l[0])>=2;}catch{return false;}},
     expected:'≥ 2 intersecting pairs'},
    {title:'Intersection Point',diff:'HARD',dc:'#ff8a8a',
     body:'Find the exact intersection point (x,y) of two lines (not segments), given as two points each.',
     example:'Line [0,0]-[2,2] and [0,2]-[2,0] → [1,1]',
     starter:`function lineIntersect(p1,p2,p3,p4) {
  const a1=p2[1]-p1[1], b1=p1[0]-p2[0], c1=a1*p1[0]+b1*p1[1];
  const a2=p4[1]-p3[1], b2=p3[0]-p4[0], c2=a2*p3[0]+b2*p3[1];
  const det=a1*b2-a2*b1;
  if(det===0) return null; // parallel
  // TODO: x = (c1*b2 - c2*b1) / det
  //       y = (a1*c2 - a2*c1) / det
  //       return [x, y]
  
}
const pt = lineIntersect([0,0],[2,2],[0,2],[2,0]);
console.log(pt && Math.round(pt[0])===1 && Math.round(pt[1])===1);`,
     test:c=>{try{const l=[];const f=new Function('console',c);f({log:(...a)=>l.push(a.join(' '))});return l[0]==='true';}catch{return false;}},
     expected:'true (point [1,1])'},
  ],
  'closest-pair': [
    {title:'Brute Force Closest Pair',diff:'EASY',dc:'#00ffa3',
     body:'Find minimum distance between any two points using brute force O(n²).',
     example:'Input:  [[0,0],[3,4],[1,1],[5,2]]\nOutput: √2 ≈ 1.41',
     starter:`function closestPairBrute(points) {
  let minDist = Infinity;
  for (let i=0;i<points.length;i++) {
    for (let j=i+1;j<points.length;j++) {
      // TODO: compute Euclidean distance between points[i] and points[j]
      //       update minDist if smaller
      
    }
  }
  return Math.round(minDist*100)/100;
}
console.log(closestPairBrute([[0,0],[3,4],[1,1],[5,2]]));`,
     test:c=>{try{const l=[];const f=new Function('console',c);f({log:(...a)=>l.push(a.join(' '))});const v=parseFloat(l[0]);return v>=1.4&&v<=1.42;}catch{return false;}},
     expected:'≈1.41 (√2)'},
    {title:'Closest Pair Divide & Conquer',diff:'MEDIUM',dc:'#ffe040',
     body:'Implement the O(n log n) closest pair algorithm using divide and conquer.',
     example:'Same result as brute force but O(n log n)',
     starter:`function closestPairDC(points) {
  points.sort((a,b)=>a[0]-b[0]);
  function dist(a,b){return Math.sqrt((a[0]-b[0])**2+(a[1]-b[1])**2);}
  function brute(pts){let m=Infinity;for(let i=0;i<pts.length;i++)for(let j=i+1;j<pts.length;j++)m=Math.min(m,dist(pts[i],pts[j]));return m;}
  function solve(pts){
    if(pts.length<=3) return brute(pts);
    const mid=Math.floor(pts.length/2), mx=pts[mid][0];
    let d=Math.min(solve(pts.slice(0,mid)),solve(pts.slice(mid)));
    const strip=pts.filter(p=>Math.abs(p[0]-mx)<d).sort((a,b)=>a[1]-b[1]);
    for(let i=0;i<strip.length;i++){
      for(let j=i+1;j<strip.length&&strip[j][1]-strip[i][1]<d;j++){
        // TODO: d = Math.min(d, dist(strip[i], strip[j]))
        
      }
    }
    return d;
  }
  return Math.round(solve(points)*100)/100;
}
console.log(closestPairDC([[0,0],[3,4],[1,1],[5,2]]));`,
     test:c=>{try{const l=[];const f=new Function('console',c);f({log:(...a)=>l.push(a.join(' '))});const v=parseFloat(l[0]);return v>=1.4&&v<=1.42;}catch{return false;}},
     expected:'≈1.41'},
    {title:'K Closest Points to Origin',diff:'HARD',dc:'#ff8a8a',
     body:'Return the k points closest to origin [0,0].',
     example:'Input:  [[1,3],[-2,2],[5,8],[0,1]], k=2\nOutput: [[0,1],[-2,2]]',
     starter:`function kClosest(points, k) {
  // TODO: sort points by squared distance from origin (x²+y²), return first k
  
}
console.log(JSON.stringify(kClosest([[1,3],[-2,2],[5,8],[0,1]],2)));`,
     test:c=>{try{const l=[];const f=new Function('console',c);f({log:(...a)=>l.push(a.join(' '))});const r=JSON.parse(l[0]);return r.length===2&&r.some(p=>p[0]===0&&p[1]===1);}catch{return false;}},
     expected:'[[0,1],[-2,2]] (any order)'},
  ],
  'polygon-area': [
    {title:'Shoelace Formula',diff:'EASY',dc:'#00ffa3',
     body:'Compute the area of a polygon using the Shoelace (Gauss) formula.',
     example:'Input:  [[0,0],[4,0],[4,3],[0,3]] (rectangle)\nOutput: 12',
     starter:`function polygonArea(vertices) {
  const n = vertices.length;
  let sum = 0;
  for (let i = 0; i < n; i++) {
    const j = (i+1) % n;
    // TODO: sum += vertices[i][0]*vertices[j][1] - vertices[j][0]*vertices[i][1]
    
  }
  return Math.abs(sum) / 2;
}
console.log(polygonArea([[0,0],[4,0],[4,3],[0,3]]));`,
     test:c=>{try{const l=[];const f=new Function('console',c);f({log:(...a)=>l.push(a.join(' '))});return parseFloat(l[0])===12;}catch{return false;}},
     expected:'12'},
    {title:'Triangle Area',diff:'MEDIUM',dc:'#ffe040',
     body:'Compute triangle area from three points using cross product (Shoelace for n=3).',
     example:'Input:  [0,0],[3,0],[0,4] → Area = 6',
     starter:`function triangleArea(p1, p2, p3) {
  // TODO: use the formula: |((p2[0]-p1[0])*(p3[1]-p1[1]) - (p3[0]-p1[0])*(p2[1]-p1[1]))| / 2
  
}
console.log(triangleArea([0,0],[3,0],[0,4]));`,
     test:c=>{try{const l=[];const f=new Function('console',c);f({log:(...a)=>l.push(a.join(' '))});return parseFloat(l[0])===6;}catch{return false;}},
     expected:'6'},
    {title:'Point Inside Polygon',diff:'HARD',dc:'#ff8a8a',
     body:'Use ray casting to determine if a point is inside a polygon.',
     example:'Square [[0,0],[4,0],[4,4],[0,4]], point [2,2] → true',
     starter:`function pointInPolygon(poly, point) {
  const [px,py] = point;
  let inside = false;
  for (let i=0,j=poly.length-1; i<poly.length; j=i++) {
    const [xi,yi]=poly[i],[xj,yj]=poly[j];
    // Ray casting: count crossings of a horizontal ray from point
    // TODO: if (yi>py)!==(yj>py) and px < (xj-xi)*(py-yi)/(yj-yi)+xi, toggle inside
    
  }
  return inside;
}
console.log(pointInPolygon([[0,0],[4,0],[4,4],[0,4]],[2,2]) && !pointInPolygon([[0,0],[4,0],[4,4],[0,4]],[5,5]));`,
     test:c=>{try{const l=[];const f=new Function('console',c);f({log:(...a)=>l.push(a.join(' '))});return l[0]==='true';}catch{return false;}},
     expected:'true'},
  ],
  'subset-bitmask': [
    {title:'Generate All Subsets',diff:'EASY',dc:'#00ffa3',
     body:'Use bitmask iteration to generate all subsets of [1,2,3].',
     example:'Input:  arr=[1,2,3]\nOutput: 8 subsets (including empty)',
     starter:`function allSubsets(arr) {
  const n = arr.length;
  const subsets = [];
  for (let mask = 0; mask < (1 << n); mask++) {
    const subset = [];
    for (let i = 0; i < n; i++) {
      // TODO: if bit i is set in mask (mask & (1<<i)), include arr[i]
      
    }
    subsets.push(subset);
  }
  return subsets;
}
console.log(allSubsets([1,2,3]).length);`,
     test:c=>{try{const l=[];const f=new Function('console',c);f({log:(...a)=>l.push(a.join(' '))});return l[0]==='8';}catch{return false;}},
     expected:'8'},
    {title:'Maximum XOR Subset',diff:'MEDIUM',dc:'#ffe040',
     body:'Find the subset of an array with maximum XOR value using bitmask enumeration.',
     example:'Input:  [3,1,2]\nOutput: 3 (subsets XORs: 0,3,1,2,3^1=2,3^2=1,1^2=3,3^1^2=0 → max=3)',
     starter:`function maxXORSubset(arr) {
  const n = arr.length;
  let maxXOR = 0;
  for (let mask = 1; mask < (1 << n); mask++) {
    let xorVal = 0;
    for (let i = 0; i < n; i++) {
      // TODO: if bit i set in mask, XOR with arr[i]
      
    }
    // TODO: maxXOR = Math.max(maxXOR, xorVal)
    
  }
  return maxXOR;
}
console.log(maxXORSubset([3,1,2]));`,
     test:c=>{try{const l=[];const f=new Function('console',c);f({log:(...a)=>l.push(a.join(' '))});return l[0]==='3';}catch{return false;}},
     expected:'3'},
    {title:'Subset Sum with Bitmask DP',diff:'HARD',dc:'#ff8a8a',
     body:'Count subsets with sum equal to target using bitmask dp over subsets.',
     example:'Input:  arr=[1,2,3,4], target=5\nOutput: 2 (subsets: [1,4] and [2,3])',
     starter:`function countSubsetsWithSum(arr, target) {
  let count = 0;
  const n = arr.length;
  for (let mask = 0; mask < (1 << n); mask++) {
    let sum = 0;
    for (let i = 0; i < n; i++) {
      // TODO: if bit i set in mask, add arr[i] to sum
      
    }
    // TODO: if sum === target, increment count
    
  }
  return count;
}
console.log(countSubsetsWithSum([1,2,3,4],5));`,
     test:c=>{try{const l=[];const f=new Function('console',c);f({log:(...a)=>l.push(a.join(' '))});return l[0]==='2';}catch{return false;}},
     expected:'2'},
  ],
  'xor-tricks': [
    {title:'Find Single Non-Duplicate',diff:'EASY',dc:'#00ffa3',
     body:'Every element appears twice except one. Find it using XOR in O(n) time O(1) space.',
     example:'Input:  [2,3,5,4,5,3,4]\nOutput: 2',
     starter:`function singleNumber(nums) {
  let result = 0;
  for (const n of nums) {
    // TODO: XOR result with n (duplicate pairs cancel out, unique remains)
    
  }
  return result;
}
console.log(singleNumber([2,3,5,4,5,3,4]));`,
     test:c=>{try{const l=[];const f=new Function('console',c);f({log:(...a)=>l.push(a.join(' '))});return l[0]==='2';}catch{return false;}},
     expected:'2'},
    {title:'Two Non-Duplicates',diff:'MEDIUM',dc:'#ffe040',
     body:'Every element appears twice except two. Find both using XOR tricks.',
     example:'Input:  [1,2,1,3,2,5]\nOutput: [3,5] (any order)',
     starter:`function twoSingleNumbers(nums) {
  let xorAll = 0;
  for (const n of nums) xorAll ^= n; // XOR of the two unique numbers
  // Find rightmost set bit (differentiates the two numbers)
  const bit = xorAll & (-xorAll);
  let a = 0, b = 0;
  for (const n of nums) {
    // TODO: partition by whether bit is set in n; XOR into a or b
    
  }
  return [a,b].sort((x,y)=>x-y);
}
console.log(twoSingleNumbers([1,2,1,3,2,5]));`,
     test:c=>{try{const l=[];const f=new Function('console',c);f({log:(...a)=>l.push(a.map(x=>JSON.stringify(x)).join(' '))});return l[0]==='[3,5]';}catch{return false;}},
     expected:'[3,5]'},
    {title:'XOR Swap Without Temp',diff:'HARD',dc:'#ff8a8a',
     body:'Swap two numbers without a temp variable using XOR. Return the swapped pair.',
     example:'Input:  a=5, b=9\nOutput: [9,5]',
     starter:`function xorSwap(a, b) {
  // TODO: a = a^b; b = a^b; a = a^b; (classic XOR swap)
  
  return [a, b];
}
console.log(xorSwap(5,9));`,
     test:c=>{try{const l=[];const f=new Function('console',c);f({log:(...a)=>l.push(a.map(x=>JSON.stringify(x)).join(' '))});return l[0]==='[9,5]';}catch{return false;}},
     expected:'[9,5]'},
  ],
  'power-of-two': [
    {title:'Check Power of Two',diff:'EASY',dc:'#00ffa3',
     body:'Check if n is a power of 2 using bit manipulation: n & (n-1) == 0.',
     example:'isPow2(16)→true, isPow2(18)→false',
     starter:`function isPow2(n) {
  if (n <= 0) return false;
  // TODO: return n & (n-1) === 0
  
}
console.log(isPow2(16) && !isPow2(18));`,
     test:c=>{try{const l=[];const f=new Function('console',c);f({log:(...a)=>l.push(a.join(' '))});return l[0]==='true';}catch{return false;}},
     expected:'true'},
    {title:'Next Power of Two',diff:'MEDIUM',dc:'#ffe040',
     body:'Find the smallest power of 2 that is ≥ n.',
     example:'nextPow2(6)→8, nextPow2(8)→8',
     starter:`function nextPow2(n) {
  if (n <= 1) return 1;
  n--;
  // TODO: fill all bits below highest set bit
  // n |= n >> 1; n |= n >> 2; n |= n >> 4; n |= n >> 8; n |= n >> 16;
  // then return n + 1
  
}
console.log(nextPow2(6) === 8 && nextPow2(8) === 8);`,
     test:c=>{try{const l=[];const f=new Function('console',c);f({log:(...a)=>l.push(a.join(' '))});return l[0]==='true';}catch{return false;}},
     expected:'true'},
    {title:'Count Powers of Two Up to N',diff:'HARD',dc:'#ff8a8a',
     body:'Count how many powers of 2 exist in [1..n]. Use bit tricks, not a loop over all n.',
     example:'n=20 → 4 (1,2,4,8,16)',
     starter:`function countPowersOfTwo(n) {
  // TODO: compute floor(log2(n)) + 1 using Math.log2 or bit shifting
  // All powers 2^0, 2^1, ..., 2^k where 2^k <= n
  
}
console.log(countPowersOfTwo(20));`,
     test:c=>{try{const l=[];const f=new Function('console',c);f({log:(...a)=>l.push(a.join(' '))});return l[0]==='5';}catch{return false;}},
     expected:'5 (1,2,4,8,16)'},
  ],
  'bitwise-sieve': [
    {title:'Sieve of Eratosthenes',diff:'EASY',dc:'#00ffa3',
     body:'Implement the Sieve of Eratosthenes to find all primes up to n.',
     example:'Input:  n=30\nOutput: [2,3,5,7,11,13,17,19,23,29] (10 primes)',
     starter:`function sieve(n) {
  const isPrime = Array(n+1).fill(true);
  isPrime[0] = isPrime[1] = false;
  for (let i = 2; i*i <= n; i++) {
    if (isPrime[i]) {
      // TODO: mark all multiples of i starting from i*i as not prime
      
    }
  }
  return isPrime.map((v,i)=>v?i:-1).filter(i=>i>0);
}
console.log(sieve(30).length);`,
     test:c=>{try{const l=[];const f=new Function('console',c);f({log:(...a)=>l.push(a.join(' '))});return l[0]==='10';}catch{return false;}},
     expected:'10'},
    {title:'Bitwise Sieve (Memory Efficient)',diff:'MEDIUM',dc:'#ffe040',
     body:'Implement sieve using a 32-bit integer array (1 bit per number) to save memory.',
     example:'Count primes up to 100 → 25',
     starter:`function bitwiseSieve(n) {
  const bits = new Int32Array(Math.ceil((n+1)/32));
  // Set bit for composite: bits[i>>5] |= (1 << (i&31))
  function setComposite(i){bits[i>>5]|=(1<<(i&31));}
  function isComposite(i){return(bits[i>>5]>>(i&31))&1;}
  setComposite(0); setComposite(1);
  for (let i=2; i*i<=n; i++) {
    if (!isComposite(i)) {
      // TODO: mark all multiples of i (starting i*i) as composite
      
    }
  }
  let count=0;
  for(let i=2;i<=n;i++) if(!isComposite(i)) count++;
  return count;
}
console.log(bitwiseSieve(100));`,
     test:c=>{try{const l=[];const f=new Function('console',c);f({log:(...a)=>l.push(a.join(' '))});return l[0]==='25';}catch{return false;}},
     expected:'25'},
    {title:'Prime Factorization',diff:'HARD',dc:'#ff8a8a',
     body:'Use the sieve to precompute smallest prime factors, then factorize numbers in O(log n).',
     example:'factorize(360) → [2,2,2,3,3,5]',
     starter:`function factorize(n) {
  const MAX=n+1, spf=Array.from({length:MAX},(_,i)=>i);
  for(let i=2;i*i<MAX;i++) if(spf[i]===i) for(let j=i*i;j<MAX;j+=i) if(spf[j]===j) spf[j]=i;
  const factors=[];
  while(n>1){
    // TODO: push spf[n] to factors, n = n / spf[n]
    
  }
  return factors;
}
console.log(factorize(360));`,
     test:c=>{try{const l=[];const f=new Function('console',c);f({log:(...a)=>l.push(a.map(x=>JSON.stringify(x)).join(' '))});return l[0]==='[2,2,2,3,3,5]';}catch{return false;}},
     expected:'[2,2,2,3,3,5]'},
  ],
  'rsa': [
    {title:'Modular Exponentiation',diff:'EASY',dc:'#00ffa3',
     body:'Implement fast modular exponentiation (used in RSA): compute base^exp mod m.',
     example:'Input:  base=2, exp=10, m=1000\nOutput: 24',
     starter:`function modPow(base, exp, m) {
  let result = 1;
  base = base % m;
  while (exp > 0) {
    if (exp % 2 === 1) {
      // TODO: result = (result * base) % m
      
    }
    exp = Math.floor(exp / 2);
    // TODO: base = (base * base) % m
    
  }
  return result;
}
console.log(modPow(2, 10, 1000));`,
     test:c=>{try{const l=[];const f=new Function('console',c);f({log:(...a)=>l.push(a.join(' '))});return l[0]==='24';}catch{return false;}},
     expected:'24'},
    {title:'RSA Encrypt/Decrypt',diff:'MEDIUM',dc:'#ffe040',
     body:'Given RSA public key (n,e) and private key (n,d), encrypt then decrypt a message.',
     example:'p=61,q=53,e=17 → encrypt(65) then decrypt → 65',
     starter:`function rsaDemo() {
  const p=61, q=53, n=p*q; // n=3233
  const e=17, d=2753;       // precomputed: d*e ≡ 1 (mod φ(n))
  function modPow(b,exp,m){let r=1;b%=m;while(exp>0){if(exp&1)r=r*b%m;exp>>=1;b=b*b%m;}return r;}
  const message = 65;
  // TODO: encrypt: cipher = modPow(message, e, n)
  //       decrypt: plain  = modPow(cipher,  d, n)
  //       return plain
  
}
console.log(rsaDemo());`,
     test:c=>{try{const l=[];const f=new Function('console',c);f({log:(...a)=>l.push(a.join(' '))});return l[0]==='65';}catch{return false;}},
     expected:'65'},
    {title:'GCD and Extended Euclidean',diff:'HARD',dc:'#ff8a8a',
     body:'Implement extended Euclidean algorithm to find GCD and Bezout coefficients (used to compute RSA private key).',
     example:'gcd(35,15)=5, extGCD(35,15) gives [5, 1, -2]',
     starter:`function extGCD(a, b) {
  if (b === 0) return [a, 1, 0];
  const [g, x, y] = extGCD(b, a % b);
  // TODO: return [g, y, x - Math.floor(a/b)*y]
  
}
const [g,x,y] = extGCD(35,15);
console.log(g===5 && 35*x+15*y===g);`,
     test:c=>{try{const l=[];const f=new Function('console',c);f({log:(...a)=>l.push(a.join(' '))});return l[0]==='true';}catch{return false;}},
     expected:'true'},
  ],
  'diffie-hellman': [
    {title:'Diffie-Hellman Key Exchange',diff:'EASY',dc:'#00ffa3',
     body:'Simulate DH: Alice and Bob compute shared secret. They should arrive at the same value.',
     example:'p=23, g=5, a=6, b=15 → shared secret = 2',
     starter:`function dhSharedSecret(p, g, a, b) {
  function modPow(base,exp,m){let r=1;base%=m;while(exp>0){if(exp&1)r=r*base%m;exp>>=1;base=base*base%m;}return r;}
  // Alice: A = g^a mod p
  // Bob:   B = g^b mod p
  // TODO: Alice computes A, Bob computes B
  //       Alice shared = B^a mod p, Bob shared = A^b mod p
  //       return {alice: aliceShared, bob: bobShared}
  
}
const r = dhSharedSecret(23, 5, 6, 15);
console.log(r.alice === r.bob);`,
     test:c=>{try{const l=[];const f=new Function('console',c);f({log:(...a)=>l.push(a.join(' '))});return l[0]==='true';}catch{return false;}},
     expected:'true (both get same secret)'},
    {title:'Discrete Log (Brute Force)',diff:'MEDIUM',dc:'#ffe040',
     body:'Find x such that g^x ≡ h (mod p) using brute force (baby-step giant-step concept).',
     example:'g=5, h=8, p=23 → x where 5^x mod 23 = 8',
     starter:`function discreteLog(g, h, p) {
  for (let x = 0; x < p; x++) {
    // TODO: compute g^x mod p; if it equals h, return x
    
  }
  return -1;
}
// 5^x mod 23 = 8 → x=6 (since 5^6=15625, 15625 mod 23=8)
console.log(discreteLog(5, 8, 23));`,
     test:c=>{try{const l=[];const f=new Function('console',c);f({log:(...a)=>l.push(a.join(' '))});const v=parseInt(l[0]);return v>=0&&Math.pow(5,v)%23===8;}catch{return false;}},
     expected:'6 (5^6 mod 23 = 8)'},
    {title:'DH Key Strength Analysis',diff:'HARD',dc:'#ff8a8a',
     body:'Compute how many unique public keys are possible with parameters (g, p). Return the order of g modulo p.',
     example:'g=2, p=11 → order=10 (2^1..2^10 mod 11 gives 10 distinct values)',
     starter:`function orderOfG(g, p) {
  let val = g % p;
  // TODO: find smallest positive k such that g^k mod p = 1
  // Start at k=1, keep multiplying by g mod p until val===1
  
}
console.log(orderOfG(2, 11));`,
     test:c=>{try{const l=[];const f=new Function('console',c);f({log:(...a)=>l.push(a.join(' '))});return l[0]==='10';}catch{return false;}},
     expected:'10'},
  ],
  'aes-round': [
    {title:'SubBytes (S-box lookup)',diff:'EASY',dc:'#00ffa3',
     body:'Apply a simple substitution box to each byte. Use a small 4-entry test S-box.',
     example:'sbox=[0x63,0x7c,0x77,0x7b], input [0,1,2,3] → [0x63,0x7c,0x77,0x7b]',
     starter:`function subBytes(state, sbox) {
  // TODO: return state.map(byte => sbox[byte % sbox.length])
  
}
const sbox = [0x63, 0x7c, 0x77, 0x7b];
console.log(JSON.stringify(subBytes([0,1,2,3],sbox)));`,
     test:c=>{try{const l=[];const f=new Function('console',c);f({log:(...a)=>l.push(a.join(' '))});return l[0]==='[99,124,119,123]';}catch{return false;}},
     expected:'[99,124,119,123]'},
    {title:'ShiftRows',diff:'MEDIUM',dc:'#ffe040',
     body:'Implement ShiftRows on a 4x4 AES state matrix. Row i shifts left by i positions.',
     example:'Input:  4x4 matrix\nRow 0: no shift, Row 1: shift 1, Row 2: shift 2, Row 3: shift 3',
     starter:`function shiftRows(state) {
  // state is a 4x4 array (row-major)
  const result = state.map(row => [...row]);
  for (let i = 1; i < 4; i++) {
    // TODO: shift result[i] left by i positions
    // Hint: result[i] = [...result[i].slice(i), ...result[i].slice(0,i)]
    
  }
  return result;
}
const s = [[1,2,3,4],[5,6,7,8],[9,10,11,12],[13,14,15,16]];
const r = shiftRows(s);
console.log(r[1][0]===6 && r[2][0]===11 && r[3][0]===16);`,
     test:c=>{try{const l=[];const f=new Function('console',c);f({log:(...a)=>l.push(a.join(' '))});return l[0]==='true';}catch{return false;}},
     expected:'true'},
    {title:'XOR Round Key (AddRoundKey)',diff:'HARD',dc:'#ff8a8a',
     body:'XOR each byte of the state with the corresponding byte of the round key.',
     example:'state=[0x32,0x88,0x31], key=[0x2b,0x7e,0x15] → [0x19,0xf6,0x24]',
     starter:`function addRoundKey(state, key) {
  // TODO: return state.map((byte, i) => byte ^ key[i])
  
}
console.log(JSON.stringify(addRoundKey([0x32,0x88,0x31],[0x2b,0x7e,0x15])));`,
     test:c=>{try{const l=[];const f=new Function('console',c);f({log:(...a)=>l.push(a.join(' '))});return l[0]==='[25,246,36]';}catch{return false;}},
     expected:'[25,246,36]'},
  ],
  'caesar-vigenere': [
    {title:'Caesar Cipher Encrypt/Decrypt',diff:'EASY',dc:'#00ffa3',
     body:'Encrypt and decrypt a message using Caesar cipher.',
     example:'encrypt("HELLO",3)→"KHOOR", decrypt("KHOOR",3)→"HELLO"',
     starter:`function caesar(text, shift, encrypt=true) {
  const s = encrypt ? shift : 26 - shift;
  return text.toUpperCase().split('').map(c => {
    if (c >= 'A' && c <= 'Z') {
      // TODO: shift character by s positions, wrap around with % 26
      
    }
    return c;
  }).join('');
}
console.log(caesar("HELLO",3)===caesar("KHOOR",3,false)?"true":"false");`,
     test:c=>{try{const l=[];const f=new Function('console',c);f({log:(...a)=>l.push(a.join(' '))});return l[0]==='true';}catch{return false;}},
     expected:'"true" (encrypt then decrypt gives back original)'},
    {title:'Vigenère Cipher',diff:'MEDIUM',dc:'#ffe040',
     body:'Implement Vigenère cipher encryption. Each letter shifts by corresponding key letter.',
     example:'encrypt("ATTACKATDAWN","LEMON")→"LXFOPVEFRNHR"',
     starter:`function vigenere(text, key, encrypt=true) {
  const K = key.toUpperCase();
  return text.toUpperCase().split('').map((c, i) => {
    if (c >= 'A' && c <= 'Z') {
      const shift = K[i % K.length].charCodeAt(0) - 65;
      const s = encrypt ? shift : 26 - shift;
      // TODO: return String.fromCharCode((c.charCodeAt(0)-65+s)%26+65)
      
    }
    return c;
  }).join('');
}
console.log(vigenere("ATTACKATDAWN","LEMON"));`,
     test:c=>{try{const l=[];const f=new Function('console',c);f({log:(...a)=>l.push(a.join(' '))});return l[0]==='LXFOPVEFRNHR';}catch{return false;}},
     expected:'"LXFOPVEFRNHR"'},
    {title:'Crack Caesar (Frequency Analysis)',diff:'HARD',dc:'#ff8a8a',
     body:'Find the shift used in a Caesar-encrypted English text using frequency analysis (E is most common letter in English).',
     example:'Most frequent letter in ciphertext - E (4) gives the shift',
     starter:`function crackCaesar(ciphertext) {
  const freq = Array(26).fill(0);
  for (const c of ciphertext.toUpperCase()) {
    if (c >= 'A' && c <= 'Z') freq[c.charCodeAt(0)-65]++;
  }
  // TODO: find index of most frequent letter in freq
  //       shift = (mostFreqIndex - 4 + 26) % 26 (E is index 4)
  //       return shift
  
}
// Test: "KHOOR" is "HELLO" shifted by 3
console.log(crackCaesar("KHOORZRUOG")); // "HELLOWORLD" shifted 3`,
     test:c=>{try{const l=[];const f=new Function('console',c);f({log:(...a)=>l.push(a.join(' '))});return l[0]==='3';}catch{return false;}},
     expected:'3'},
  ],
  'sha256': [
    {title:'Simple Hash Function',diff:'EASY',dc:'#00ffa3',
     body:'Implement a simple (non-cryptographic) hash function: sum of char codes * position, mod a prime.',
     example:'hash("hello") → consistent number',
     starter:`function simpleHash(s, mod=1000003) {
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    // TODO: hash = (hash * 31 + s.charCodeAt(i)) % mod
    
  }
  return hash;
}
console.log(simpleHash("hello") === simpleHash("hello") && simpleHash("hello") !== simpleHash("world"));`,
     test:c=>{try{const l=[];const f=new Function('console',c);f({log:(...a)=>l.push(a.join(' '))});return l[0]==='true';}catch{return false;}},
     expected:'true (consistent and different for different inputs)'},
    {title:'Verify Hash Integrity',diff:'MEDIUM',dc:'#ffe040',
     body:'Simulate file integrity check: hash a message, modify it, verify hash changes.',
     example:'"original" and "originaX" should produce different hashes',
     starter:`function hashCheck(original, tampered) {
  function h(s){let v=0;for(let i=0;i<s.length;i++)v=(v*31+s.charCodeAt(i))%1000003;return v;}
  // TODO: return true if hash(original) !== hash(tampered)
  
}
console.log(hashCheck("original message","original messaXe"));`,
     test:c=>{try{const l=[];const f=new Function('console',c);f({log:(...a)=>l.push(a.join(' '))});return l[0]==='true';}catch{return false;}},
     expected:'true'},
    {title:'Rolling Hash (Rabin-Karp style)',diff:'HARD',dc:'#ff8a8a',
     body:'Implement rolling hash: slide a window and compute hash in O(1) per step.',
     example:'Find hash of every length-3 window in "abcde"',
     starter:`function rollingHashes(s, k, base=31, mod=1e9+7) {
  const hashes = [];
  let h = 0, power = 1;
  for (let i=0;i<k;i++){h=(h*base+s.charCodeAt(i))%mod;if(i>0)power=power*base%mod;}
  hashes.push(h);
  for (let i=k;i<s.length;i++){
    // TODO: h = (h - s.charCodeAt(i-k)*power%mod + mod) % mod
    //            * base + s.charCodeAt(i)) % mod
    
    hashes.push(h);
  }
  return hashes;
}
console.log(rollingHashes("abcde",3).length);`,
     test:c=>{try{const l=[];const f=new Function('console',c);f({log:(...a)=>l.push(a.join(' '))});return l[0]==='3';}catch{return false;}},
     expected:'3 (windows: abc, bcd, cde)'},
  ],
  'zkp-cave': [
    {title:'ZKP Simulation',diff:'EASY',dc:'#00ffa3',
     body:'Simulate a ZKP round: Peggy knows secret (path A or B). Victor challenges. Probability of passing without knowledge = 1/2 per round.',
     example:'After 20 honest rounds (Peggy knows secret), Victor always passes',
     starter:`function zkpSimulate(peggyKnowsSecret, rounds) {
  let passed = 0;
  for (let i=0; i<rounds; i++) {
    const victorChallenge = Math.random() < 0.5 ? 'A' : 'B';
    let peggyExit;
    if (peggyKnowsSecret) {
      peggyExit = victorChallenge; // can always comply
    } else {
      // TODO: Peggy guesses randomly (50% chance of matching)
      
    }
    if (peggyExit === victorChallenge) passed++;
  }
  return passed;
}
// Honest prover always passes all rounds
console.log(zkpSimulate(true, 20) === 20);`,
     test:c=>{try{const l=[];const f=new Function('console',c);f({log:(...a)=>l.push(a.join(' '))});return l[0]==='true';}catch{return false;}},
     expected:'true (honest prover passes all 20 rounds)'},
    {title:'ZKP Soundness Probability',diff:'MEDIUM',dc:'#ffe040',
     body:'Compute the probability that a cheating Peggy (no knowledge) passes n consecutive rounds.',
     example:'n=10 rounds → probability = (1/2)^10 ≈ 0.001',
     starter:`function cheatProbability(rounds) {
  // TODO: return (0.5) ** rounds
  
}
const p = cheatProbability(10);
console.log(p < 0.002 && p > 0.0009);`,
     test:c=>{try{const l=[];const f=new Function('console',c);f({log:(...a)=>l.push(a.join(' '))});return l[0]==='true';}catch{return false;}},
     expected:'true (≈0.001)'},
    {title:'ZKP Round Counter for Security',diff:'HARD',dc:'#ff8a8a',
     body:'Return minimum rounds needed for cheating probability to fall below threshold.',
     example:'threshold=0.01 → 7 rounds (1/2^7 ≈ 0.0078)',
     starter:`function roundsNeeded(threshold) {
  let rounds = 1;
  // TODO: increment rounds until (0.5^rounds) < threshold
  
  return rounds;
}
console.log(roundsNeeded(0.01));`,
     test:c=>{try{const l=[];const f=new Function('console',c);f({log:(...a)=>l.push(a.join(' '))});return l[0]==='7';}catch{return false;}},
     expected:'7'},
  ],
  'linear-regression': [
    {title:'Mean and Variance',diff:'EASY',dc:'#00ffa3',
     body:'Compute mean and variance of an array. Used internally by linear regression.',
     example:'mean([2,4,4,4,5,5,7,9])=5, variance=4',
     starter:`function stats(arr) {
  const n = arr.length;
  // TODO: mean = sum / n
  const mean = arr.reduce((a,b)=>a+b,0) / n;
  // TODO: variance = sum of (xi - mean)^2 / n
  const variance = arr.reduce((s,x) => {
    // TODO: add (x-mean)^2 to s
    
  }, 0) / n;
  return { mean, variance };
}
const r = stats([2,4,4,4,5,5,7,9]);
console.log(r.mean===5 && r.variance===4);`,
     test:c=>{try{const l=[];const f=new Function('console',c);f({log:(...a)=>l.push(a.join(' '))});return l[0]==='true';}catch{return false;}},
     expected:'true'},
    {title:'Gradient Descent (1D)',diff:'MEDIUM',dc:'#ffe040',
     body:'Find minimum of f(x) = (x-3)^2 using gradient descent.',
     example:'Start at x=0, learning_rate=0.1, 100 steps → x≈3',
     starter:`function gradientDescent(start, lr, steps) {
  let x = start;
  for (let i = 0; i < steps; i++) {
    // TODO: gradient of (x-3)^2 is 2*(x-3); update x = x - lr * gradient
    
  }
  return Math.round(x * 10) / 10;
}
console.log(gradientDescent(0, 0.1, 100));`,
     test:c=>{try{const l=[];const f=new Function('console',c);f({log:(...a)=>l.push(a.join(' '))});return parseFloat(l[0])>=2.9&&parseFloat(l[0])<=3.1;}catch{return false;}},
     expected:'≈3.0'},
    {title:'Linear Regression Fit',diff:'HARD',dc:'#ff8a8a',
     body:'Implement simple linear regression: find slope m and intercept b for y = mx + b.',
     example:'x=[1,2,3,4,5], y=[2,4,5,4,5] → m≈0.6, b≈2.2',
     starter:`function linearRegression(x, y) {
  const n = x.length;
  const xMean = x.reduce((a,b)=>a+b)/n;
  const yMean = y.reduce((a,b)=>a+b)/n;
  let num = 0, den = 0;
  for (let i=0;i<n;i++) {
    // TODO: num += (x[i]-xMean)*(y[i]-yMean)
    //       den += (x[i]-xMean)^2
    
  }
  const m = num / den;
  const b = yMean - m * xMean;
  return { m: Math.round(m*10)/10, b: Math.round(b*10)/10 };
}
const r = linearRegression([1,2,3,4,5],[2,4,5,4,5]);
console.log(r.m===0.6 && r.b===2.2);`,
     test:c=>{try{const l=[];const f=new Function('console',c);f({log:(...a)=>l.push(a.join(' '))});return l[0]==='true';}catch{return false;}},
     expected:'true (m=0.6, b=2.2)'},
  ],
  'knn': [
    {title:'Euclidean Distance',diff:'EASY',dc:'#00ffa3',
     body:'Implement Euclidean distance between two points. Foundation of KNN.',
     example:'dist([1,2],[4,6])→5',
     starter:`function euclidean(a, b) {
  // TODO: sqrt of sum of squared differences
  
}
console.log(euclidean([1,2],[4,6]));`,
     test:c=>{try{const l=[];const f=new Function('console',c);f({log:(...a)=>l.push(a.join(' '))});return parseFloat(l[0])===5;}catch{return false;}},
     expected:'5'},
    {title:'KNN Classifier',diff:'MEDIUM',dc:'#ffe040',
     body:'Implement KNN classification. Given labeled training data, classify a query point.',
     example:'k=3, query=[5,5] among points labeled 0 or 1 → majority class',
     starter:`function knn(trainX, trainY, query, k) {
  // TODO: compute distances from query to all training points
  const distances = trainX.map((pt, i) => ({
    dist: Math.sqrt(pt.reduce((s,v,j)=>(s+(v-query[j])**2),0)),
    label: trainY[i]
  }));
  // TODO: sort by dist, take first k, return majority label
  
}
const X=[[1,1],[1,2],[2,1],[5,5],[5,6],[6,5]];
const Y=[0,0,0,1,1,1];
console.log(knn(X,Y,[2,2],3));`,
     test:c=>{try{const l=[];const f=new Function('console',c);f({log:(...a)=>l.push(a.join(' '))});return l[0]==='0';}catch{return false;}},
     expected:'0 ([2,2] is closer to class 0)'},
    {title:'Optimal K via Cross-Validation',diff:'HARD',dc:'#ff8a8a',
     body:'Find best K from [1,3,5,7] by testing accuracy on a validation set.',
     example:'Return the K with highest accuracy',
     starter:`function bestK(trainX, trainY, valX, valY) {
  function knn(X,Y,q,k){const d=X.map((p,i)=>({d:Math.sqrt(p.reduce((s,v,j)=>s+(v-q[j])**2,0)),l:Y[i]}));d.sort((a,b)=>a.d-b.d);const top=d.slice(0,k);const cnt={};top.forEach(({l})=>{cnt[l]=(cnt[l]||0)+1;});return Object.entries(cnt).sort((a,b)=>b[1]-a[1])[0][0];}
  let bestKVal = 1, bestAcc = 0;
  for (const k of [1,3,5,7]) {
    // TODO: count correct predictions on valX/valY using knn with this k
    //       if accuracy > bestAcc, update bestKVal and bestAcc
    
  }
  return bestKVal;
}
const X=[[1,1],[2,2],[8,8],[9,9]],Y=[0,0,1,1];
console.log(typeof bestK(X,Y,X,Y) === 'number');`,
     test:c=>{try{const l=[];const f=new Function('console',c);f({log:(...a)=>l.push(a.join(' '))});return l[0]==='true';}catch{return false;}},
     expected:'true (returns a number)'},
  ],
  'kmeans': [
    {title:'Assign Points to Centroids',diff:'EASY',dc:'#00ffa3',
     body:'Assign each point to its nearest centroid. Return array of cluster indices.',
     example:'points=[[1,1],[2,2],[8,8],[9,9]], centroids=[[1,1],[9,9]]\nOutput: [0,0,1,1]',
     starter:`function assignClusters(points, centroids) {
  function dist(a,b){return Math.sqrt(a.reduce((s,v,i)=>(s+(v-b[i])**2),0));}
  return points.map(p => {
    // TODO: find index of centroid closest to p, return that index
    
  });
}
console.log(assignClusters([[1,1],[2,2],[8,8],[9,9]],[[1,1],[9,9]]));`,
     test:c=>{try{const l=[];const f=new Function('console',c);f({log:(...a)=>l.push(a.map(x=>JSON.stringify(x)).join(' '))});return l[0]==='[0,0,1,1]';}catch{return false;}},
     expected:'[0,0,1,1]'},
    {title:'Update Centroids',diff:'MEDIUM',dc:'#ffe040',
     body:'Given points and their cluster assignments, recompute centroids as mean of each cluster.',
     example:'points=[[1,1],[3,1],[8,8],[10,8]], labels=[0,0,1,1], k=2\nOutput: [[2,1],[9,8]]',
     starter:`function updateCentroids(points, labels, k) {
  const dim = points[0].length;
  const sums = Array.from({length:k},()=>Array(dim).fill(0));
  const counts = Array(k).fill(0);
  points.forEach((p,i) => {
    const c = labels[i]; counts[c]++;
    // TODO: add p to sums[c] element-wise
    
  });
  // TODO: return sums.map((s,i) => s.map(v => Math.round(v/counts[i]*10)/10))
  
}
console.log(JSON.stringify(updateCentroids([[1,1],[3,1],[8,8],[10,8]],[0,0,1,1],2)));`,
     test:c=>{try{const l=[];const f=new Function('console',c);f({log:(...a)=>l.push(a.join(' '))});return l[0]==='[[2,1],[9,8]]';}catch{return false;}},
     expected:'[[2,1],[9,8]]'},
    {title:'Full K-Means Algorithm',diff:'HARD',dc:'#ff8a8a',
     body:'Implement K-Means end to end: initialize centroids, assign, update, repeat until convergence.',
     example:'2 well-separated clusters should be found correctly',
     starter:`function kmeans(points, k, maxIter=100) {
  function dist(a,b){return Math.sqrt(a.reduce((s,v,i)=>s+(v-b[i])**2,0));}
  // Initialize: pick first k points as centroids
  let centroids = points.slice(0,k).map(p=>[...p]);
  let labels = Array(points.length).fill(0);
  for (let iter=0; iter<maxIter; iter++) {
    // TODO: assign each point to nearest centroid
    const newLabels = points.map(p => {
      
    });
    // TODO: recompute centroids as mean of each cluster
    const dim=points[0].length;
    const sums=Array.from({length:k},()=>Array(dim).fill(0));
    const counts=Array(k).fill(0);
    points.forEach((p,i)=>{counts[newLabels[i]]++;p.forEach((v,d)=>{sums[newLabels[i]][d]+=v;});});
    const newCentroids=sums.map((s,i)=>s.map(v=>v/counts[i]));
    if(JSON.stringify(newLabels)===JSON.stringify(labels)) break;
    labels=newLabels; centroids=newCentroids;
  }
  return labels;
}
const pts=[[1,1],[1,2],[2,1],[8,8],[8,9],[9,8]];
const lbl=kmeans(pts,2);
console.log(new Set(lbl).size===2);`,
     test:c=>{try{const l=[];const f=new Function('console',c);f({log:(...a)=>l.push(a.join(' '))});return l[0]==='true';}catch{return false;}},
     expected:'true (2 distinct clusters found)'},
  ],
  'decision-tree': [
    {title:'Gini Impurity',diff:'EASY',dc:'#00ffa3',
     body:'Compute Gini impurity for a node. Gini = 1 - Σ(p_i²) where p_i is proportion of class i.',
     example:'labels=[0,0,1,1] → Gini=0.5 (50/50 split)',
     starter:`function gini(labels) {
  const n = labels.length;
  if (n === 0) return 0;
  const counts = {};
  for (const l of labels) counts[l] = (counts[l]||0)+1;
  let sumSq = 0;
  for (const c of Object.values(counts)) {
    const p = c / n;
    // TODO: sumSq += p * p
    
  }
  // TODO: return 1 - sumSq
  
}
console.log(gini([0,0,1,1]));`,
     test:c=>{try{const l=[];const f=new Function('console',c);f({log:(...a)=>l.push(a.join(' '))});return parseFloat(l[0])===0.5;}catch{return false;}},
     expected:'0.5'},
    {title:'Best Split Feature',diff:'MEDIUM',dc:'#ffe040',
     body:'Find the feature and threshold that minimizes weighted Gini impurity after split.',
     example:'Find which feature and value to split on for minimum impurity',
     starter:`function bestSplit(X, y) {
  function gini(labels){const n=labels.length;if(!n)return 0;const c={};labels.forEach(l=>c[l]=(c[l]||0)+1);return 1-Object.values(c).reduce((s,v)=>s+(v/n)**2,0);}
  let bestGain=0, bestFeat=0, bestThresh=X[0][0];
  for(let feat=0;feat<X[0].length;feat++){
    const vals=[...new Set(X.map(r=>r[feat]))].sort((a,b)=>a-b);
    for(let t=0;t<vals.length-1;t++){
      const thresh=(vals[t]+vals[t+1])/2;
      const left=y.filter((_,i)=>X[i][feat]<=thresh);
      const right=y.filter((_,i)=>X[i][feat]>thresh);
      if(!left.length||!right.length) continue;
      const weightedGini=(left.length*gini(left)+right.length*gini(right))/y.length;
      const gain=gini(y)-weightedGini;
      // TODO: if gain > bestGain, update bestGain, bestFeat, bestThresh
      
    }
  }
  return{feat:bestFeat,thresh:bestThresh};
}
const X=[[1,1],[2,2],[8,8],[9,9]],y=[0,0,1,1];
const s=bestSplit(X,y);
console.log(s.feat>=0&&s.thresh>0);`,
     test:c=>{try{const l=[];const f=new Function('console',c);f({log:(...a)=>l.push(a.join(' '))});return l[0]==='true';}catch{return false;}},
     expected:'true (valid split found)'},
    {title:'Simple Decision Tree Classify',diff:'HARD',dc:'#ff8a8a',
     body:'Build a depth-1 decision tree and classify test points.',
     example:'Perfect separation on linearly separable data',
     starter:`function decisionStump(trainX, trainY, testX) {
  function gini(l){const n=l.length;if(!n)return 0;const c={};l.forEach(v=>c[v]=(c[v]||0)+1);return 1-Object.values(c).reduce((s,v)=>s+(v/n)**2,0);}
  let bestG=Infinity,bestF=0,bestT=0;
  for(let f=0;f<trainX[0].length;f++){
    const vals=[...new Set(trainX.map(r=>r[f]))].sort((a,b)=>a-b);
    for(let i=0;i<vals.length-1;i++){const t=(vals[i]+vals[i+1])/2;const l=trainY.filter((_,j)=>trainX[j][f]<=t);const r=trainY.filter((_,j)=>trainX[j][f]>t);if(!l.length||!r.length)continue;const g=(l.length*gini(l)+r.length*gini(r))/trainY.length;if(g<bestG){bestG=g;bestF=f;bestT=t;}}
  }
  function majority(arr){const c={};arr.forEach(v=>c[v]=(c[v]||0)+1);return +Object.entries(c).sort((a,b)=>b[1]-a[1])[0][0];}
  const lLeft=trainY.filter((_,j)=>trainX[j][bestF]<=bestT);
  const lRight=trainY.filter((_,j)=>trainX[j][bestF]>bestT);
  // TODO: return testX.map(p => p[bestF] <= bestT ? majority(lLeft) : majority(lRight))
  
}
const X=[[1,1],[2,2],[8,8],[9,9]],y=[0,0,1,1];
const preds=decisionStump(X,y,[[1.5,1.5],[8.5,8.5]]);
console.log(preds[0]===0&&preds[1]===1);`,
     test:c=>{try{const l=[];const f=new Function('console',c);f({log:(...a)=>l.push(a.join(' '))});return l[0]==='true';}catch{return false;}},
     expected:'true'},
  ],
  'perceptron': [
    {title:'Perceptron Prediction',diff:'EASY',dc:'#00ffa3',
     body:'Implement perceptron prediction: output 1 if weighted sum >= threshold, else 0.',
     example:'weights=[0.5,0.5], bias=-0.7, input=[1,1] → 1',
     starter:`function predict(weights, bias, input) {
  // TODO: compute dot product of weights and input, add bias
  //       return 1 if >= 0, else 0
  
}
console.log(predict([0.5,0.5],-0.7,[1,1]));`,
     test:c=>{try{const l=[];const f=new Function('console',c);f({log:(...a)=>l.push(a.join(' '))});return l[0]==='1';}catch{return false;}},
     expected:'1'},
    {title:'Perceptron Learning Rule',diff:'MEDIUM',dc:'#ffe040',
     body:'Train a perceptron on AND gate data. Update weights: w += lr*(y-pred)*x.',
     example:'After training, AND(1,1)=1, AND(0,1)=0',
     starter:`function trainPerceptron(data, labels, lr=0.1, epochs=100) {
  let weights=[0,0], bias=0;
  function predict(x){const s=x.reduce((a,v,i)=>a+v*weights[i],bias);return s>=0?1:0;}
  for(let e=0;e<epochs;e++){
    data.forEach((x,i)=>{
      const pred=predict(x), err=labels[i]-pred;
      // TODO: update weights[j] += lr * err * x[j] for each j
      //       update bias += lr * err
      
    });
  }
  return data.map(x=>predict(x));
}
const data=[[0,0],[0,1],[1,0],[1,1]],labels=[0,0,0,1];
const preds=trainPerceptron(data,labels);
console.log(preds[3]===1&&preds[0]===0);`,
     test:c=>{try{const l=[];const f=new Function('console',c);f({log:(...a)=>l.push(a.join(' '))});return l[0]==='true';}catch{return false;}},
     expected:'true (learns AND gate)'},
    {title:'XOR is Not Linearly Separable',diff:'HARD',dc:'#ff8a8a',
     body:'Demonstrate XOR cannot be learned by a single perceptron by checking if error > 0 after training.',
     example:'XOR data: [0,0]→0,[0,1]→1,[1,0]→1,[1,1]→0. Perceptron cannot fit.',
     starter:`function canLearnXOR() {
  const data=[[0,0],[0,1],[1,0],[1,1]], labels=[0,1,1,0];
  let w=[0,0], b=0, lr=0.1;
  function pred(x){return (x.reduce((a,v,i)=>a+v*w[i],b)>=0)?1:0;}
  for(let e=0;e<1000;e++) data.forEach((x,i)=>{const err=labels[i]-pred(x);w=w.map((wj,j)=>wj+lr*err*x[j]);b+=lr*err;});
  const errors = data.filter((x,i) => pred(x) !== labels[i]).length;
  // TODO: return errors > 0 (perceptron cannot perfectly separate XOR)
  
}
console.log(canLearnXOR());`,
     test:c=>{try{const l=[];const f=new Function('console',c);f({log:(...a)=>l.push(a.join(' '))});return l[0]==='true';}catch{return false;}},
     expected:'true (XOR has errors > 0)'},
  ],
  'ddos-attack': [
    {title:'Rate Limiter (Token Bucket)',diff:'EASY',dc:'#00ffa3',
     body:'Implement a token bucket rate limiter. Returns true if request allowed, false if rate limited.',
     example:'capacity=5, refillRate=1/s: 5 rapid requests allowed, 6th blocked',
     starter:`function createRateLimiter(capacity, refillPerSec) {
  let tokens = capacity;
  let lastRefill = Date.now();
  return function allowRequest() {
    const now = Date.now();
    const elapsed = (now - lastRefill) / 1000;
    // TODO: tokens = Math.min(capacity, tokens + elapsed * refillPerSec)
    //       lastRefill = now
    //       if tokens >= 1: tokens -= 1, return true; else return false
    
  };
}
const limiter = createRateLimiter(3, 1);
const results = [limiter(), limiter(), limiter(), limiter()];
console.log(results.slice(0,3).every(r=>r===true) && results[3]===false);`,
     test:c=>{try{const l=[];const f=new Function('console',c);f({log:(...a)=>l.push(a.join(' '))});return l[0]==='true';}catch{return false;}},
     expected:'true (first 3 allowed, 4th blocked)'},
    {title:'IP Flood Detection',diff:'MEDIUM',dc:'#ffe040',
     body:'Given a log of [timestamp, ip] entries, flag IPs with more than threshold requests in any 1-second window.',
     example:'IP "1.1.1.1" with 5 requests in 1 second when threshold=3 → flagged',
     starter:`function detectFlood(logs, threshold) {
  const byIP = {};
  for (const [ts, ip] of logs) {
    if (!byIP[ip]) byIP[ip] = [];
    byIP[ip].push(ts);
  }
  const flagged = [];
  for (const [ip, times] of Object.entries(byIP)) {
    times.sort((a,b)=>a-b);
    // TODO: use sliding window to check if any 1-second window has > threshold requests
    //       if yes, add ip to flagged
    
  }
  return flagged;
}
const logs=[[0,"1.1.1.1"],[0.1,"1.1.1.1"],[0.2,"1.1.1.1"],[0.3,"1.1.1.1"],[2,"2.2.2.2"]];
console.log(detectFlood(logs,3).includes("1.1.1.1"));`,
     test:c=>{try{const l=[];const f=new Function('console',c);f({log:(...a)=>l.push(a.join(' '))});return l[0]==='true';}catch{return false;}},
     expected:'true'},
    {title:'Simulate DDoS Defense',diff:'HARD',dc:'#ff8a8a',
     body:'Process requests with per-IP rate limiting and return count of blocked vs allowed.',
     example:'3 IPs each sending 10 burst requests with limit=5 → 15 blocked',
     starter:`function simulateDDoS(requests, limitPerIP) {
  const counts = {}, blocked = [], allowed = [];
  for (const {ip, ts} of requests) {
    if (!counts[ip]) counts[ip] = [];
    // Remove requests older than 1 second from this IP
    counts[ip] = counts[ip].filter(t => ts - t < 1);
    if (counts[ip].length < limitPerIP) {
      // TODO: push ts to counts[ip], push to allowed
      
    } else {
      // TODO: push to blocked
      
    }
  }
  return { allowed: allowed.length, blocked: blocked.length };
}
const reqs=Array.from({length:30},(_,i)=>({ip:(Math.floor(i/10)+1)+'.0.0.1',ts:i*0.05}));
const r=simulateDDoS(reqs,5);
console.log(r.blocked===15&&r.allowed===15);`,
     test:c=>{try{const l=[];const f=new Function('console',c);f({log:(...a)=>l.push(a.join(' '))});return l[0]==='true';}catch{return false;}},
     expected:'true (15 blocked, 15 allowed)'},
  ],
  'sql-injection': [
    {title:'Detect SQL Injection Patterns',diff:'EASY',dc:'#00ffa3',
     body:'Check if a user input string contains common SQL injection patterns.',
     example:'"admin\'--" → dangerous, "john" → safe',
     starter:`function isSQLInjection(input) {
  const patterns = [
    /'\s*(or|and)\s*'?\d/i,
    /'\s*--/,
    /;\s*(drop|delete|insert|update|select)/i,
    /'\s*=\s*'/,
    /union\s+select/i
  ];
  // TODO: return true if any pattern matches input
  
}
console.log(isSQLInjection("admin'--") && !isSQLInjection("john123"));`,
     test:c=>{try{const l=[];const f=new Function('console',c);f({log:(...a)=>l.push(a.join(' '))});return l[0]==='true';}catch{return false;}},
     expected:'true'},
    {title:'Parameterized Query Simulator',diff:'MEDIUM',dc:'#ffe040',
     body:'Simulate parameterized query: escape user input before inserting into query template.',
     example:`Query: "SELECT * FROM users WHERE name='?'", param: "O'Brien" → safely escaped`,
     starter:`function safeQuery(template, param) {
  // Escape single quotes by doubling them (SQL standard escaping)
  const escaped = param.replace(/'/g, "''");
  // TODO: replace '?' in template with the escaped param (wrapped in single quotes)
  
}
const q = safeQuery("SELECT * FROM users WHERE name='?'", "O'Brien");
console.log(q.includes("O''Brien") && !q.includes("O'Brien'"));`,
     test:c=>{try{const l=[];const f=new Function('console',c);f({log:(...a)=>l.push(a.join(' '))});return l[0]==='true';}catch{return false;}},
     expected:'true (apostrophe safely escaped)'},
    {title:'SQL Injection Bypass Patterns',diff:'HARD',dc:'#ff8a8a',
     body:'Write a function that validates a username: only allow alphanumeric and underscore.',
     example:'"alice_123" → valid, "admin\'--" → invalid',
     starter:`function validateUsername(username) {
  // TODO: return true only if username matches /^[a-zA-Z0-9_]+$/ (whitelist approach)
  
}
console.log(validateUsername("alice_123") && !validateUsername("admin'--") && !validateUsername("a;DROP TABLE"));`,
     test:c=>{try{const l=[];const f=new Function('console',c);f({log:(...a)=>l.push(a.join(' '))});return l[0]==='true';}catch{return false;}},
     expected:'true'},
  ],
  'firewall-filter': [
    {title:'Packet Filter',diff:'EASY',dc:'#00ffa3',
     body:'Implement a simple packet filter: block packets matching a blacklist of {ip, port} rules.',
     example:'Block rule {ip:"1.1.1.1",port:80}: packet from 1.1.1.1:80 → blocked',
     starter:`function packetFilter(rules, packet) {
  for (const rule of rules) {
    // TODO: if rule.ip matches packet.ip AND rule.port matches packet.port, return 'BLOCK'
    
  }
  return 'ALLOW';
}
const rules = [{ip:"1.1.1.1",port:80},{ip:"2.2.2.2",port:443}];
console.log(packetFilter(rules,{ip:"1.1.1.1",port:80})==='BLOCK' && packetFilter(rules,{ip:"3.3.3.3",port:80})==='ALLOW');`,
     test:c=>{try{const l=[];const f=new Function('console',c);f({log:(...a)=>l.push(a.join(' '))});return l[0]==='true';}catch{return false;}},
     expected:'true'},
    {title:'Stateful Connection Tracker',diff:'MEDIUM',dc:'#ffe040',
     body:'Track TCP connections: ALLOW SYN to open, ALLOW data if connection open, BLOCK otherwise.',
     example:'SYN allowed, data after SYN allowed, data without SYN blocked',
     starter:`function statefulFirewall() {
  const connections = new Set();
  return function process(packet) {
    const key = packet.src + ':' + packet.dst;
    if (packet.flags === 'SYN') {
      // TODO: add key to connections, return 'ALLOW'
      
    } else if (packet.flags === 'DATA') {
      // TODO: if key in connections return 'ALLOW', else 'BLOCK'
      
    } else if (packet.flags === 'FIN') {
      connections.delete(key); return 'ALLOW';
    }
    return 'BLOCK';
  };
}
const fw = statefulFirewall();
const r1=fw({src:'A',dst:'B',flags:'SYN'});
const r2=fw({src:'A',dst:'B',flags:'DATA'});
const r3=fw({src:'C',dst:'D',flags:'DATA'});
console.log(r1==='ALLOW'&&r2==='ALLOW'&&r3==='BLOCK');`,
     test:c=>{try{const l=[];const f=new Function('console',c);f({log:(...a)=>l.push(a.join(' '))});return l[0]==='true';}catch{return false;}},
     expected:'true'},
    {title:'Whitelist IP Range Filter',diff:'HARD',dc:'#ff8a8a',
     body:'Allow packets only from whitelisted CIDR-like ranges. Simple version: check if IP starts with allowed prefix.',
     example:'Whitelist "192.168.": allow 192.168.1.1, block 10.0.0.1',
     starter:`function cidrFilter(whitelist, ip) {
  // TODO: return 'ALLOW' if ip starts with any prefix in whitelist, else 'BLOCK'
  
}
const wl = ["192.168.", "10.0.0."];
console.log(cidrFilter(wl,"192.168.1.1")==='ALLOW' && cidrFilter(wl,"172.16.0.1")==='BLOCK');`,
     test:c=>{try{const l=[];const f=new Function('console',c);f({log:(...a)=>l.push(a.join(' '))});return l[0]==='true';}catch{return false;}},
     expected:'true'},
  ],
  'mitm-attack': [
    {title:'Message Integrity Check (HMAC-like)',diff:'EASY',dc:'#00ffa3',
     body:'Simulate message integrity: hash(message+secret_key). Tampered message → different hash.',
     example:'HMAC("hello","key") !== HMAC("hello!","key")',
     starter:`function hmac(message, key) {
  let h = 0;
  const combined = key + message + key; // simplified HMAC
  for (let i=0; i<combined.length; i++) {
    // TODO: h = (h * 31 + combined.charCodeAt(i)) % 1000003
    
  }
  return h;
}
console.log(hmac("hello","key") !== hmac("hello!","key") && hmac("hello","key") === hmac("hello","key"));`,
     test:c=>{try{const l=[];const f=new Function('console',c);f({log:(...a)=>l.push(a.join(' '))});return l[0]==='true';}catch{return false;}},
     expected:'true'},
    {title:'Detect MITM Tampering',diff:'MEDIUM',dc:'#ffe040',
     body:'Verify a received message using a MAC. Return true if message is authentic.',
     example:'Original MAC matches recomputed → authentic; tampered message → not authentic',
     starter:`function verifyMessage(message, receivedMAC, key) {
  function mac(m,k){let h=0;const s=k+m+k;for(let i=0;i<s.length;i++)h=(h*31+s.charCodeAt(i))%1000003;return h;}
  // TODO: return receivedMAC === mac(message, key)
  
}
const key="secret";
const msg="transfer $100";
const validMAC=(() => {let h=0;const s=key+msg+key;for(let i=0;i<s.length;i++)h=(h*31+s.charCodeAt(i))%1000003;return h;})();
console.log(verifyMessage(msg,validMAC,key) && !verifyMessage("transfer $999",validMAC,key));`,
     test:c=>{try{const l=[];const f=new Function('console',c);f({log:(...a)=>l.push(a.join(' '))});return l[0]==='true';}catch{return false;}},
     expected:'true'},
    {title:'Certificate Pinning Check',diff:'HARD',dc:'#ff8a8a',
     body:'Simulate certificate pinning: only accept connections where the cert hash matches the pinned value.',
     example:'Pinned cert hash must match presented hash, reject anything else',
     starter:`function certPinning(pinnedHash, presentedCert) {
  function hashCert(cert){let h=0;for(let i=0;i<cert.length;i++)h=(h*31+cert.charCodeAt(i))%1000003;return h;}
  // TODO: return hashCert(presentedCert) === pinnedHash
  
}
const legitCert = "valid_cert_data_12345";
function hashC(cert){let h=0;for(let i=0;i<cert.length;i++)h=(h*31+cert.charCodeAt(i))%1000003;return h;}
const pinned = hashC(legitCert);
console.log(certPinning(pinned, legitCert) && !certPinning(pinned, "fake_cert_mitm"));`,
     test:c=>{try{const l=[];const f=new Function('console',c);f({log:(...a)=>l.push(a.join(' '))});return l[0]==='true';}catch{return false;}},
     expected:'true'},
  ],
  'rabin-karp': [
    {title:'Rabin-Karp Pattern Search',diff:'EASY',dc:'#00ffa3',
     body:'Implement Rabin-Karp: use rolling hash to find all occurrences of pattern in text.',
     example:'text="AABAACAADAA", pattern="AABA" → [0,9] (start indices)',
     starter:`function rabinKarp(text, pat) {
  const BASE=31, MOD=1e9+7, m=pat.length, n=text.length;
  function hash(s,len){let h=0;for(let i=0;i<len;i++)h=(h*BASE+s.charCodeAt(i))%MOD;return h;}
  let power=1;
  for(let i=0;i<m-1;i++) power=power*BASE%MOD;
  let pH=hash(pat,m), tH=hash(text,m);
  const result=[];
  for(let i=0;i<=n-m;i++){
    if(tH===pH && text.slice(i,i+m)===pat) result.push(i);
    if(i<n-m){
      // TODO: rolling hash: remove leftmost char, add next char
      // tH = (tH - text.charCodeAt(i)*power%MOD + MOD) % MOD * BASE + text.charCodeAt(i+m)) % MOD
      
    }
  }
  return result;
}
console.log(rabinKarp("AABAACAADAA","AABA"));`,
     test:c=>{try{const l=[];const f=new Function('console',c);f({log:(...a)=>l.push(a.map(x=>JSON.stringify(x)).join(' '))});return l[0]==='[0,9]'||l[0]==='[0]';}catch{return false;}},
     expected:'[0] or [0,9] (occurrence indices)'},
    {title:'Multiple Pattern Search',diff:'MEDIUM',dc:'#ffe040',
     body:'Search for multiple patterns simultaneously using Rabin-Karp. Return which patterns are found.',
     example:'text="abcabc", patterns=["abc","bca"] → both found',
     starter:`function multiSearch(text, patterns) {
  const BASE=31,MOD=1e9+7;
  function hash(s){let h=0;for(const c of s)h=(h*BASE+c.charCodeAt(0))%MOD;return h;}
  const found=[];
  for(const pat of patterns){
    const pH=hash(pat),m=pat.length;
    let tH=hash(text.slice(0,m));
    let power=1;for(let i=0;i<m-1;i++)power=power*BASE%MOD;
    let matched=false;
    for(let i=0;i<=text.length-m;i++){
      if(tH===pH&&text.slice(i,i+m)===pat){matched=true;break;}
      if(i<text.length-m){
        // TODO: rolling hash update
        
      }
    }
    if(matched) found.push(pat);
  }
  return found.sort();
}
console.log(JSON.stringify(multiSearch("abcabc",["abc","bca","xyz"])));`,
     test:c=>{try{const l=[];const f=new Function('console',c);f({log:(...a)=>l.push(a.join(' '))});return l[0]==='["abc","bca"]';}catch{return false;}},
     expected:'["abc","bca"]'},
    {title:'Plagiarism Detection',diff:'HARD',dc:'#ff8a8a',
     body:'Check if any k-gram (substring of length k) from document1 appears in document2.',
     example:'doc1="hello world", doc2="world peace", k=5 → true ("world" appears in both)',
     starter:`function plagiarismCheck(doc1, doc2, k) {
  const BASE=31,MOD=1e9+7;
  function buildHashes(s,k){const hashes=new Set();let h=0,power=1;for(let i=0;i<k-1;i++)power=power*BASE%MOD;for(let i=0;i<k;i++)h=(h*BASE+s.charCodeAt(i))%MOD;hashes.add(h+'|'+s.slice(0,k));for(let i=k;i<s.length;i++){h=((h-s.charCodeAt(i-k)*power%MOD+MOD)%MOD*BASE+s.charCodeAt(i))%MOD;hashes.add(h+'|'+s.slice(i-k+1,i+1));}return hashes;}
  const h1=buildHashes(doc1,k);
  // TODO: check if any k-gram hash from doc2 matches a hash from h1
  
}
console.log(plagiarismCheck("hello world","world peace",5));`,
     test:c=>{try{const l=[];const f=new Function('console',c);f({log:(...a)=>l.push(a.join(' '))});return l[0]==='true';}catch{return false;}},
     expected:'true'},
  ],
  'binary-addition': [
    {title:'Add Two Binary Strings',diff:'EASY',dc:'#00ffa3',
     body:'Add two binary numbers represented as strings.',
     example:'addBinary("1010","1011") → "10101"',
     starter:`function addBinary(a, b) {
  let i=a.length-1, j=b.length-1, carry=0, result='';
  while(i>=0 || j>=0 || carry){
    const sum=(i>=0?+a[i--]:0)+(j>=0?+b[j--]:0)+carry;
    // TODO: carry = Math.floor(sum/2), result = (sum%2) + result
    
  }
  return result;
}
console.log(addBinary("1010","1011"));`,
     test:c=>{try{const l=[];const f=new Function('console',c);f({log:(...a)=>l.push(a.join(' '))});return l[0]==='10101';}catch{return false;}},
     expected:'"10101"'},
    {title:'Count Set Bits',diff:'MEDIUM',dc:'#ffe040',
     body:'Count the number of 1-bits in the binary representation of n (Hamming weight).',
     example:'n=11 (binary 1011) → 3',
     starter:`function countBits(n) {
  let count = 0;
  while (n > 0) {
    // TODO: count += n & 1 (check LSB), then n >>= 1 (right shift)
    
  }
  return count;
}
console.log(countBits(11));`,
     test:c=>{try{const l=[];const f=new Function('console',c);f({log:(...a)=>l.push(a.join(' '))});return l[0]==='3';}catch{return false;}},
     expected:'3'},
    {title:'Sum Without Arithmetic Operators',diff:'HARD',dc:'#ff8a8a',
     body:'Add two integers using only bitwise operations (XOR for sum, AND+shift for carry).',
     example:'bitwiseAdd(5,7) → 12',
     starter:`function bitwiseAdd(a, b) {
  while (b !== 0) {
    const carry = a & b; // carry bits
    // TODO: a = a ^ b (sum without carry)
    //       b = carry << 1 (shift carry left)
    
  }
  return a;
}
console.log(bitwiseAdd(5,7));`,
     test:c=>{try{const l=[];const f=new Function('console',c);f({log:(...a)=>l.push(a.join(' '))});return l[0]==='12';}catch{return false;}},
     expected:'12'},
  ],
  'binary-addition-gates': [
    {title:'Half Adder',diff:'EASY',dc:'#00ffa3',
     body:'Implement a half adder: sum = A XOR B, carry = A AND B.',
     example:'halfAdder(1,1) → {sum:0, carry:1}',
     starter:`function halfAdder(A, B) {
  // TODO: return { sum: A ^ B, carry: A & B }
  
}
const r = halfAdder(1,1);
console.log(r.sum===0 && r.carry===1);`,
     test:c=>{try{const l=[];const f=new Function('console',c);f({log:(...a)=>l.push(a.join(' '))});return l[0]==='true';}catch{return false;}},
     expected:'true'},
    {title:'Full Adder',diff:'MEDIUM',dc:'#ffe040',
     body:'Implement a full adder: sum = A XOR B XOR Cin, carry = (A AND B) OR (Cin AND (A XOR B)).',
     example:'fullAdder(1,1,1) → {sum:1, carry:1}',
     starter:`function fullAdder(A, B, Cin) {
  // TODO: compute sum and carry using XOR and AND gates
  
}
const r = fullAdder(1,1,1);
console.log(r.sum===1 && r.carry===1);`,
     test:c=>{try{const l=[];const f=new Function('console',c);f({log:(...a)=>l.push(a.join(' '))});return l[0]==='true';}catch{return false;}},
     expected:'true'},
    {title:'4-bit Ripple Carry Adder',diff:'HARD',dc:'#ff8a8a',
     body:'Chain 4 full adders to add two 4-bit numbers. Return sum bits and final carry.',
     example:'add4bit([1,0,1,1],[0,1,1,0],0) → {sum:[1,0,0,0,1] (4+carry bit)}',
     starter:`function add4bit(A, B, cin) {
  function fa(a,b,c){return{s:a^b^c,co:(a&b)|(c&(a^b))};}
  const sum=[], bits=4;
  let carry=cin;
  for(let i=bits-1;i>=0;i--){
    // TODO: use fa(A[i],B[i],carry) to get sum bit and new carry
    
  }
  sum.unshift(carry);
  return sum;
}
const r=add4bit([1,0,1,1],[0,1,1,0],0);
console.log(r[0]===1&&r[1]===0&&r[2]===0&&r[3]===0&&r[4]===1);`,
     test:c=>{try{const l=[];const f=new Function('console',c);f({log:(...a)=>l.push(a.join(' '))});return l[0]==='true';}catch{return false;}},
     expected:'true (11+6=17=10001)'},
  ],
  'binary-subtraction': [
    {title:"Two's Complement of a Number",diff:'EASY',dc:'#00ffa3',
     body:"Compute two's complement of an n-bit binary string.",
     example:"twosComp('0101',4) → '1011' (-5 in 4-bit two's complement)",
     starter:`function twosComp(bits) {
  // Step 1: invert all bits (one's complement)
  const inverted = bits.split('').map(b => b==='0'?'1':'0').join('');
  // Step 2: add 1 to the inverted number
  let carry=1, result='';
  for(let i=inverted.length-1;i>=0;i--){
    const sum=+inverted[i]+carry;
    // TODO: result = (sum%2) + result; carry = Math.floor(sum/2)
    
  }
  return result;
}
console.log(twosComp('0101'));`,
     test:c=>{try{const l=[];const f=new Function('console',c);f({log:(...a)=>l.push(a.join(' '))});return l[0]==='1011';}catch{return false;}},
     expected:'"1011"'},
    {title:'Subtract Binary Strings',diff:'MEDIUM',dc:'#ffe040',
     body:"Subtract binary b from a (a >= b) using two's complement method: a + twosComp(b).",
     example:'subBinary("1010","0011") → "0111" (10-3=7)',
     starter:`function subBinary(a, b) {
  // Pad b to same length as a
  while(b.length<a.length) b='0'+b;
  // Compute two's complement of b
  function twos(bits){const inv=bits.split('').map(x=>x==='0'?'1':'0').join('');let c=1,r='';for(let i=inv.length-1;i>=0;i--){const s=+inv[i]+c;r=(s%2)+r;c=Math.floor(s/2);}return r;}
  // Add a + twos(b), ignore overflow carry
  const tb=twos(b);
  let carry=0, result='';
  for(let i=a.length-1;i>=0;i--){
    // TODO: sum = +a[i] + +tb[i] + carry; result prepend sum%2; carry = floor(sum/2)
    
  }
  return result; // overflow carry discarded
}
console.log(subBinary("1010","0011"));`,
     test:c=>{try{const l=[];const f=new Function('console',c);f({log:(...a)=>l.push(a.join(' '))});return l[0]==='0111';}catch{return false;}},
     expected:'"0111"'},
    {title:'Signed Binary Overflow Detection',diff:'HARD',dc:'#ff8a8a',
     body:'Detect overflow in signed 4-bit addition: overflow if carry into MSB ≠ carry out of MSB.',
     example:'Adding 0111(+7) and 0001(+1) → result 1000 with overflow',
     starter:`function detectOverflow(A, B) {
  // Add bit by bit, track carry into MSB and carry out
  let carry=0; const n=A.length;
  const carries=Array(n+1).fill(0);
  for(let i=n-1;i>=0;i--){
    const sum=A[i]+B[i]+carries[i+1];
    // TODO: carries[i] = Math.floor(sum/2)  (carry into position i, from position i+1)
    
  }
  // Overflow if carry into MSB (carries[1]) !== carry out of MSB (carries[0])
  return carries[1] !== carries[0];
}
// +7 + +1 = +8 but 4-bit signed max is +7 → overflow
const A=[0,1,1,1], B=[0,0,0,1];
console.log(detectOverflow(A,B));`,
     test:c=>{try{const l=[];const f=new Function('console',c);f({log:(...a)=>l.push(a.join(' '))});return l[0]==='true';}catch{return false;}},
     expected:'true (overflow detected)'},
  ],
  'binary-subtraction-gates': [
    {title:'Half Subtractor',diff:'EASY',dc:'#00fga3',
     body:'Implement a half subtractor: diff = A XOR B, borrow = (NOT A) AND B.',
     example:'halfSub(0,1) → {diff:1, borrow:1}',
     starter:`function halfSub(A, B) {
  // TODO: return { diff: A ^ B, borrow: (~A & 1) & B }
  
}
const r = halfSub(0,1);
console.log(r.diff===1 && r.borrow===1);`,
     test:c=>{try{const l=[];const f=new Function('console',c);f({log:(...a)=>l.push(a.join(' '))});return l[0]==='true';}catch{return false;}},
     expected:'true'},
    {title:'Full Subtractor',diff:'MEDIUM',dc:'#ffe040',
     body:'Implement a full subtractor with borrow-in.',
     example:'fullSub(0,1,0) → {diff:1, borrow:1}',
     starter:`function fullSub(A, B, Bin) {
  // diff = A XOR B XOR Bin
  // borrow = (~A & B) | (Bin & ~(A XOR B))
  const diff = A ^ B ^ Bin;
  // TODO: compute borrow and return { diff, borrow }
  
}
const r = fullSub(0,1,0);
console.log(r.diff===1 && r.borrow===1);`,
     test:c=>{try{const l=[];const f=new Function('console',c);f({log:(...a)=>l.push(a.join(' '))});return l[0]==='true';}catch{return false;}},
     expected:'true'},
    {title:'4-bit Adder-Subtractor',diff:'HARD',dc:'#ff8a8a',
     body:'Implement a combined 4-bit adder-subtractor. Mode=0: add, Mode=1: subtract (using XOR and carry-in=1).',
     example:'adderSub([0,1,0,0],[0,0,1,1],1) → [0,0,0,1] (4-3=1)',
     starter:`function adderSub(A, B, mode) {
  // XOR each B bit with mode (mode=1 flips B for subtraction)
  const Bmod = B.map(b => b ^ mode);
  // Use full adder chain with initial carry = mode
  function fa(a,b,c){return{s:a^b^c,co:(a&b)|(c&(a^b))};}
  let carry=mode, result=[];
  for(let i=A.length-1;i>=0;i--){
    const {s,co}=fa(A[i],Bmod[i],carry);
    // TODO: unshift s to result, update carry
    
  }
  return result;
}
console.log(JSON.stringify(adderSub([0,1,0,0],[0,0,1,1],1)));`,
     test:c=>{try{const l=[];const f=new Function('console',c);f({log:(...a)=>l.push(a.join(' '))});return l[0]==='[0,0,0,1]';}catch{return false;}},
     expected:'[0,0,0,1]'},
  ],
  'binary-multiplication': [
    {title:'Binary Multiplication (Shift-Add)',diff:'EASY',dc:'#00ffa3',
     body:'Multiply two non-negative integers using shift-and-add (binary multiplication).',
     example:'binaryMul(6,7) → 42',
     starter:`function binaryMul(a, b) {
  let result = 0;
  while (b > 0) {
    if (b & 1) {
      // TODO: result += a (add a when LSB of b is 1)
      
    }
    // TODO: a <<= 1 (shift a left), b >>= 1 (shift b right)
    
  }
  return result;
}
console.log(binaryMul(6,7));`,
     test:c=>{try{const l=[];const f=new Function('console',c);f({log:(...a)=>l.push(a.join(' '))});return l[0]==='42';}catch{return false;}},
     expected:'42'},
    {title:"Booth's Algorithm Step",diff:'MEDIUM',dc:'#ffe040',
     body:"Implement one step of Booth's algorithm. Return new accumulator and shifted pair.",
     example:"Pattern 01 → add, 10 → subtract, 00/11 → do nothing",
     starter:`function boothStep(acc, QBit, PrevBit, multiplicand, bits) {
  const mask=(1<<bits)-1;
  let newAcc=acc;
  if(QBit===0&&PrevBit===1){
    // TODO: newAcc = (acc + multiplicand) & mask  (add multiplicand)
    
  } else if(QBit===1&&PrevBit===0){
    // TODO: newAcc = (acc - multiplicand) & mask  (subtract multiplicand)
    
  }
  // Arithmetic right shift acc by 1 (keep sign bit)
  const sign=(newAcc>>(bits-1))&1;
  const shifted=(newAcc>>1)|((sign?1:0)<<(bits-1));
  return shifted&mask;
}
// Test: acc=0, Q0=1, Q-1=0, multiplicand=3 (subtract), bits=4
// Result of one step: subtract then right shift
const r=boothStep(0,1,0,3,4);
console.log(typeof r==='number');`,
     test:c=>{try{const l=[];const f=new Function('console',c);f({log:(...a)=>l.push(a.join(' '))});return l[0]==='true';}catch{return false;}},
     expected:'true'},
    {title:"Booth's Multiplication Result",diff:'HARD',dc:'#ff8a8a',
     body:"Use Booth's algorithm to multiply two 4-bit signed integers.",
     example:'boothMul(3,-2) → -6',
     starter:`function boothMul(X, Y) {
  // Simplified Booth's using standard sign-handling
  // For this exercise, implement using the shift-add insight
  const sign = (X < 0) !== (Y < 0) ? -1 : 1;
  const ax = Math.abs(X), ay = Math.abs(Y);
  let result = 0;
  let tmp = ax;
  let multiplier = ay;
  while (multiplier > 0) {
    // TODO: if LSB of multiplier is 1, add tmp to result
    //       left-shift tmp, right-shift multiplier
    
  }
  return sign * result;
}
console.log(boothMul(3,-2));`,
     test:c=>{try{const l=[];const f=new Function('console',c);f({log:(...a)=>l.push(a.join(' '))});return l[0]==='-6';}catch{return false;}},
     expected:'-6'},
  ],
  'binary-multiplication-gates': [
    {title:'Partial Products',diff:'EASY',dc:'#00ffa3',
     body:'Generate partial products for binary multiplication (gate-level view).',
     example:'A=[1,0,1] (5), B=[1,1,0] (6) → partial products before summing',
     starter:`function partialProducts(A, B) {
  const n=A.length;
  const partials=[];
  for(let i=B.length-1;i>=0;i--){
    if(B[i]===1){
      // TODO: partial = A.map(a => a & B[i]) shifted left by (B.length-1-i)
      const shifted=A.map(a=>a&B[i]);
      partials.push({bits:shifted, shift:B.length-1-i});
    }
  }
  return partials.length;
}
console.log(partialProducts([1,0,1],[1,1,0]));`,
     test:c=>{try{const l=[];const f=new Function('console',c);f({log:(...a)=>l.push(a.join(' '))});return l[0]==='2';}catch{return false;}},
     expected:'2 partial products (for 110)'},
    {title:'AND Gate Array',diff:'MEDIUM',dc:'#ffe040',
     body:'Generate the full AND gate array (all n×m AND gates) for multiplication.',
     example:'A=[1,0,1], B=[0,1,1] → 3×3 AND matrix',
     starter:`function andArray(A, B) {
  const matrix=[];
  for(let i=0;i<A.length;i++){
    const row=[];
    for(let j=0;j<B.length;j++){
      // TODO: row.push(A[i] & B[j])
      
    }
    matrix.push(row);
  }
  return matrix;
}
const m=andArray([1,0,1],[0,1,1]);
console.log(m[0][0]===0&&m[0][2]===1&&m[2][2]===1);`,
     test:c=>{try{const l=[];const f=new Function('console',c);f({log:(...a)=>l.push(a.join(' '))});return l[0]==='true';}catch{return false;}},
     expected:'true'},
    {title:'4-bit Multiplier',diff:'HARD',dc:'#ff8a8a',
     body:'Implement a 4-bit multiplier using AND gates and a ripple-carry adder.',
     example:'mul4bit(3,5) → 15',
     starter:`function mul4bit(a, b) {
  // Convert to 4-bit arrays (LSB last)
  function toBits(n,k){return Array.from({length:k},(_,i)=>(n>>(k-1-i))&1);}
  function fromBits(bits){return bits.reduce((v,b)=>v*2+b,0);}
  function addBits(x,y){let c=0,r=[];for(let i=x.length-1;i>=0;i--){const s=x[i]+y[i]+c;r.unshift(s&1);c=s>>1;}if(c)r.unshift(c);return r;}
  const A=toBits(a,4),B=toBits(b,4);
  let product=Array(8).fill(0);
  for(let i=3;i>=0;i--){
    if(B[i]===1){
      // TODO: AND A with B[i], shift left by (3-i), add to product
      const partial=A.map(x=>x&B[i]);
      const shifted=[...Array(3-i).fill(0),...partial,...Array(i).fill(0)];
      while(shifted.length<product.length) shifted.unshift(0);
      product=addBits(product,shifted);
    }
  }
  return fromBits(product);
}
console.log(mul4bit(3,5));`,
     test:c=>{try{const l=[];const f=new Function('console',c);f({log:(...a)=>l.push(a.join(' '))});return l[0]==='15';}catch{return false;}},
     expected:'15'},
  ],
  'binary-division': [
    {title:'Binary Division (Repeated Subtraction)',diff:'EASY',dc:'#00ffa3',
     body:'Divide a by b using repeated subtraction (basic restoring concept).',
     example:'binaryDiv(10,3) → {quotient:3, remainder:1}',
     starter:`function binaryDiv(a, b) {
  if (b === 0) throw new Error('Division by zero');
  let quotient = 0, remainder = a;
  while (remainder >= b) {
    // TODO: remainder -= b; quotient++
    
  }
  return { quotient, remainder };
}
const r = binaryDiv(10, 3);
console.log(r.quotient===3 && r.remainder===1);`,
     test:c=>{try{const l=[];const f=new Function('console',c);f({log:(...a)=>l.push(a.join(' '))});return l[0]==='true';}catch{return false;}},
     expected:'true'},
    {title:'Restoring Division (Shift Method)',diff:'MEDIUM',dc:'#ffe040',
     body:'Implement non-restoring division using left-shift approach.',
     example:'divide(7,2) → {q:3, r:1}',
     starter:`function divide(dividend, divisor) {
  let quotient=0, remainder=0;
  // Process from MSB to LSB
  for(let i=31;i>=0;i--){
    remainder=(remainder<<1)|((dividend>>>i)&1);
    if(remainder>=divisor){
      // TODO: remainder -= divisor; quotient |= (1<<i)
      
    }
  }
  return{q:quotient,r:remainder};
}
const r=divide(7,2);
console.log(r.q===3&&r.r===1);`,
     test:c=>{try{const l=[];const f=new Function('console',c);f({log:(...a)=>l.push(a.join(' '))});return l[0]==='true';}catch{return false;}},
     expected:'true'},
    {title:'Fast Division (Bit Shift)',diff:'HARD',dc:'#ff8a8a',
     body:'Implement fast division using bit shifting: find largest power-of-2 multiple of divisor that fits.',
     example:'fastDiv(100,7) → {q:14, r:2}',
     starter:`function fastDiv(a, b) {
  let quotient=0, remainder=a;
  while(remainder>=b){
    let tmp=b, multiple=1;
    while(tmp<=remainder>>1){
      // TODO: tmp <<= 1; multiple <<= 1
      
    }
    // TODO: remainder -= tmp; quotient += multiple
    
  }
  return{q:quotient,r:remainder};
}
const r=fastDiv(100,7);
console.log(r.q===14&&r.r===2);`,
     test:c=>{try{const l=[];const f=new Function('console',c);f({log:(...a)=>l.push(a.join(' '))});return l[0]==='true';}catch{return false;}},
     expected:'true'},
  ],
  'binary-division-gates': [
    {title:'Check Divisibility by 2 (Gate Logic)',diff:'EASY',dc:'#00ffa3',
     body:'A number is divisible by 2 if its LSB is 0. Implement using bitwise AND.',
     example:'isDivBy2(8)→true, isDivBy2(7)→false',
     starter:`function isDivBy2(n) {
  // TODO: return (n & 1) === 0
  
}
console.log(isDivBy2(8) && !isDivBy2(7));`,
     test:c=>{try{const l=[];const f=new Function('console',c);f({log:(...a)=>l.push(a.join(' '))});return l[0]==='true';}catch{return false;}},
     expected:'true'},
    {title:'Division by Power of 2 (Right Shift)',diff:'MEDIUM',dc:'#ffe040',
     body:'Divide n by 2^k using right shift (hardware-efficient).',
     example:'divPow2(64,3) → 8 (64 / 2^3 = 8)',
     starter:`function divPow2(n, k) {
  // TODO: return n >> k
  
}
console.log(divPow2(64,3));`,
     test:c=>{try{const l=[];const f=new Function('console',c);f({log:(...a)=>l.push(a.join(' '))});return l[0]==='8';}catch{return false;}},
     expected:'8'},
    {title:'Non-Restoring Division Circuit',diff:'HARD',dc:'#ff8a8a',
     body:'Implement non-restoring division: use +divisor when remainder negative, -divisor when positive.',
     example:'nonRestoring(7,2) → {q:3, r:1}',
     starter:`function nonRestoring(dividend, divisor) {
  let acc=0, q=0;
  for(let i=31;i>=0;i--){
    acc=(acc<<1)|((dividend>>>i)&1);
    if(acc<0){
      acc+=divisor;
      // TODO: q bit = 0 for this position
    } else {
      acc-=divisor;
      // TODO: q bit = 1: q |= (1<<i)
      
    }
  }
  // Restore if negative
  if(acc<0) acc+=divisor;
  return{q,r:acc};
}
const r=nonRestoring(7,2);
console.log(r.q===3&&r.r===1);`,
     test:c=>{try{const l=[];const f=new Function('console',c);f({log:(...a)=>l.push(a.join(' '))});return l[0]==='true';}catch{return false;}},
     expected:'true'},
  ],
};

function launchProblemPlayground() {
  const expMeta = EXPERIMENTS.find(e=>e.id===currentExp)||{};
  const accent = expMeta.accentColor||'#a3e635';
  const problems = PROBLEMS_DB[currentExp];
  const body = document.getElementById('pg-body');
  const titleEl = document.getElementById('pg-main-title');
  const subEl = document.getElementById('pg-main-sub');
  if(titleEl) titleEl.innerHTML = '💻 PROBLEM PLAYGROUND';
  if(subEl) subEl.textContent = (expMeta.title||'').toUpperCase();

  if (!problems||!problems.length) {
    body.innerHTML = `<button class="pg-back" onclick="pgBackToHub()">← Back to Hub</button>
      <div style="text-align:center;padding:60px;font-family:'Space Mono',monospace;color:#5050a0;">Problems coming soon! 🚧</div>`;
    return;
  }

  window.pgRenderProblem = (idx) => {
    const p = problems[idx];
    body.innerHTML = `
      <button class="pg-back" onclick="pgBackToHub()">← Back to Hub</button>
      <div style="display:flex;gap:8px;margin-bottom:4px;">
        ${problems.map((pr,i)=>`<button onclick="pgRenderProblem(${i})" style="flex:1;padding:9px 6px;border-radius:10px;border:1px solid ${i===idx?accent:'#2a2a5a'};background:${i===idx?accent+'22':'#0d0d28'};color:${i===idx?accent:'#5050a0'};font-family:'Space Mono',monospace;font-size:10px;cursor:pointer;transition:all 0.2s;text-align:center;line-height:1.4;">P${i+1}<br><span style="font-size:9px;">${pr.diff}</span></button>`).join('')}
      </div>
      <div style="background:#0d0d28;border:1px solid #2a2a5a;border-radius:14px;padding:18px 20px;">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;flex-wrap:wrap;">
          <span style="font-family:'Orbitron',monospace;font-size:10px;padding:3px 10px;border-radius:20px;background:${accent}22;color:${accent};border:1px solid ${accent}44;">PROBLEM ${idx+1}</span>
          <span style="font-family:'Orbitron',monospace;font-size:14px;font-weight:700;color:#e8e8ff;">${p.title}</span>
          <span style="font-family:'Space Mono',monospace;font-size:9px;padding:3px 10px;border-radius:20px;background:${p.dc}22;color:${p.dc};border:1px solid ${p.dc}44;margin-left:auto;">${p.diff}</span>
        </div>
        <div style="font-family:'Space Mono',monospace;font-size:12px;line-height:1.8;color:#9090c0;margin-bottom:12px;">${p.body}</div>
        <div style="background:#060618;border-left:3px solid ${accent};border-radius:0 8px 8px 0;padding:10px 14px;font-family:'Space Mono',monospace;font-size:11px;line-height:1.7;color:${accent}88;">
          <div style="color:${accent};font-weight:700;font-size:9px;letter-spacing:0.1em;margin-bottom:5px;">EXAMPLE</div>
          <pre style="margin:0;white-space:pre-wrap;">${p.example}</pre>
        </div>
      </div>
      <div>
        <div style="font-family:'Space Mono',monospace;font-size:10px;color:#4040a0;margin-bottom:6px;letter-spacing:0.1em;">› YOUR CODE (JavaScript)</div>
        <textarea class="pg-code-area" id="pg-code-ta">${p.starter}</textarea>
      </div>
      <div id="pg-run-out" class="pg-run-result">Output will appear here after running…</div>
      <div style="display:flex;gap:10px;flex-wrap:wrap;">
        <button onclick="pgRunCode(${idx})" style="flex:2;padding:13px;border-radius:10px;background:linear-gradient(135deg,${accent},${accent}99);color:#040412;border:none;font-family:'Orbitron',monospace;font-size:12px;font-weight:700;cursor:pointer;letter-spacing:0.08em;" onmouseover="this.style.opacity='.85'" onmouseout="this.style.opacity='1'">▶ RUN CODE</button>
        <button onclick="pgResetCode(${idx})" style="flex:1;padding:13px;border-radius:10px;border:1px solid #2a2a5a;background:#0d0d28;color:#5050a0;font-family:'Space Mono',monospace;font-size:11px;cursor:pointer;" onmouseover="this.style.borderColor='#5050a0'" onmouseout="this.style.borderColor='#2a2a5a'">↺ Reset</button>
      </div>`;
  };

  window.pgRunCode = (idx) => {
    const code = document.getElementById('pg-code-ta')?.value||'';
    const out = document.getElementById('pg-run-out'); if(!out) return;
    out.className='pg-run-result'; out.textContent='⏳ Running…';
    try {
      const logs=[];
      new Function('console', code)({log:(...a)=>logs.push(a.map(x=>typeof x==='object'?JSON.stringify(x):String(x)).join(' '))});
      const output=logs.join('\n')||'(no output)';
      const passed = problems[idx].test(code);
      out.textContent=`Output: ${output}\n\nExpected: ${problems[idx].expected}\n\n${passed?'✅ TEST PASSED! Great work!':'❌ Test failed. Check your logic and try again.'}`;
      out.className='pg-run-result '+(passed?'pass':'fail');
    } catch(e) { out.textContent=`❌ Error: ${e.message}`; out.className='pg-run-result fail'; }
  };

  window.pgResetCode = (idx) => {
    const ta=document.getElementById('pg-code-ta'); if(ta) ta.value=problems[idx].starter;
    const out=document.getElementById('pg-run-out'); if(out){out.textContent='Output will appear here after running…';out.className='pg-run-result';}
  };

  window.pgRenderProblem(0);
}





// ══════════════════════════════════════════════════════════
//  GLASS CONTEXT NAVBAR
// ══════════════════════════════════════════════════════════
(function() {
  const navbar = document.getElementById('glass-navbar');
  if (!navbar) return;

  function updateNav() {
    if (!navbar) return;

    const homeScreen   = document.getElementById('home-screen');
    const expListView  = document.getElementById('exp-list-view');
    const theoryScreen = document.getElementById('theory-screen');
    const expScreen    = document.getElementById('exp-screen');

    const inHome    = homeScreen   && homeScreen.style.display !== 'none' && !expListView?.classList.contains('active');
    const inBranch  = expListView  && expListView.classList.contains('active');
    const inTheory  = theoryScreen && theoryScreen.style.display !== 'none';
    const inExp     = expScreen    && expScreen.classList.contains('active');

    const gnav      = document.getElementById('glass-navbar');
    const gBranch   = document.getElementById('gnav-branch');
    const gBranchN  = document.getElementById('gnav-branch-name');
    const gBranchI  = document.getElementById('gnav-branch-icon');
    const gExp      = document.getElementById('gnav-exp');
    const gExpN     = document.getElementById('gnav-exp-name');
    const gSep2     = document.getElementById('gnav-sep2');
    const gMenu     = document.getElementById('gnav-menu');

    if (inHome) {
      gnav.classList.remove('visible');
      return;
    }

    gnav.classList.add('visible');

    // Reset active states
    gMenu.classList.remove('active');
    if (gBranch) gBranch.classList.remove('active');
    if (gExp)    gExp.classList.remove('active');

    // Show branch crumb when inside a branch or deeper
    if (activeBranch) {
      if (gBranch) {
        gBranch.style.display = '';
        if (gBranchN) gBranchN.textContent = activeBranch.name;
        if (gBranchI) gBranchI.textContent = activeBranch.icon || '◈';
      }
      if (gSep2) gSep2.style.display = '';
    } else {
      if (gBranch) gBranch.style.display = 'none';
      if (gSep2)   gSep2.style.display = 'none';
    }

    // Show experiment crumb when in theory or exp screen
    if ((inTheory || inExp) && currentExp) {
      const expMeta = EXPERIMENTS.find(e => e.id === currentExp);
      if (gExp) {
        gExp.style.display = '';
        if (gExpN) gExpN.textContent = expMeta ? expMeta.title : 'Experiment';
      }
    } else {
      if (gExp) gExp.style.display = 'none';
    }

    // Highlight active level
    if (inBranch)      { if (gBranch) gBranch.classList.add('active'); }
    else if (inTheory || inExp) { if (gExp) gExp.classList.add('active'); }
  }

  // Hook into view transitions
  const _orig_buildBranchView = typeof buildBranchView === 'function' ? buildBranchView : null;
  const _orig_openBranch      = typeof openBranch      === 'function' ? openBranch      : null;
  const _orig_openExperiment  = typeof openExperiment  === 'function' ? openExperiment  : null;
  const _orig_launchVisualizer= typeof launchVisualizer=== 'function' ? launchVisualizer: null;
  const _orig_goHome          = typeof goHome          === 'function' ? goHome          : null;

  // Patch using MutationObserver on home-screen and exp-list-view
  const observer = new MutationObserver(() => updateNav());
  const homeScreen = document.getElementById('home-screen');
  const expListView = document.getElementById('exp-list-view');
  const expScreen   = document.getElementById('exp-screen');
  const theoryScr   = document.getElementById('theory-screen');
  [homeScreen, expListView, expScreen, theoryScr].forEach(el => {
    if (el) observer.observe(el, { attributes: true, attributeFilter: ['style', 'class'] });
  });
  updateNav();

  window._glassNavUpdate = updateNav;
})();

function glassNavGoHome() {
  goHome();
}
function glassNavGoBranch() {
  if (activeBranch) {
    // Go back to exp list for current branch
    const ts = document.getElementById('theory-screen');
    const es = document.getElementById('exp-screen');
    if (ts) ts.style.display = 'none';
    if (es) es.classList.remove('active');
    document.getElementById('home-screen').style.display = '';
    document.getElementById('exp-list-view').classList.add('active');
    document.getElementById('back-btn').classList.remove('show');
    document.getElementById('exp-title-bar').classList.remove('show');
    csKillEngine();
  }
}
function glassNavGoExp() {
  // Already on exp, do nothing (just breadcrumb indicator)
}
