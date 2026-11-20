/* =========================================================
   Levels
   The board is 5x5. Positions are [x, y], with [0,0] top-left.
   Moves: U = up, R = right, D = down, L = left.
   code = the buggy instructions the player starts with
   sol  = the intended fix (used to count bugs and give hints)
   ========================================================= */

const DIR   = { U: [0, -1], R: [1, 0], D: [0, 1], L: [-1, 0] };
const CYCLE = ["U", "R", "D", "L"];                 // order an arrow rotates through when clicked
const ROT   = { U: -90, R: 0, D: 90, L: 180 };     // how far to rotate the arrow picture

const INTROS = [
  "PREDICT first: where do you think the alien will end up? Then press RUN.",
  "Two bugs this time! Try STEP to test one move at a time.",
  "Watch out for ROCKS! If the alien hits one, that's a bug.",
];

// the three hand-made cases used on the first playthrough
const HANDMADE = [
  { start: [0, 4], star: [3, 2], rocks: [],               code: "UURRU",    sol: "UURRR",    intro: INTROS[0] },
  { start: [0, 4], star: [4, 0], rocks: [],               code: "RRULRRUD", sol: "RRUURRUU", intro: INTROS[1] },
  { start: [0, 4], star: [4, 4], rocks: [[2, 4], [2, 3]], code: "URRRRRDU", sol: "UURRRRDD", intro: INTROS[2] },
];

/* ---------- random level generator ---------- */
const randInt = n => Math.floor(Math.random() * n);
const key     = (x, y) => x + "," + y;
const inside  = (x, y) => x >= 0 && y >= 0 && x < 5 && y < 5;

// make a random path of n moves that never visits the same square twice
function randomPath(n) {
  for (let attempt = 0; attempt < 800; attempt++) {
    let x = randInt(5), y = randInt(5);
    const start = [x, y], visited = new Set([key(x, y)]), moves = [];
    let last = null;
    for (let i = 0; i < n; i++) {
      let options = CYCLE.filter(d => {
        const nx = x + DIR[d][0], ny = y + DIR[d][1];
        return inside(nx, ny) && !visited.has(key(nx, ny));
      });
      if (!options.length) break;
      if (last && options.includes(last) && Math.random() < .45) options = [last]; // keep going straight sometimes
      const d = options[randInt(options.length)];
      x += DIR[d][0]; y += DIR[d][1];
      visited.add(key(x, y)); moves.push(d); last = d;
    }
    const farEnough = Math.abs(x - start[0]) + Math.abs(y - start[1]) >= 3;
    if (moves.length === n && farEnough) return { start, moves, end: [x, y], visited };
  }
  return null;
}

// play a list of moves and say what happens: "win", "wrong", "off" or "crash"
function simulate(start, moves, rocks, star) {
  let [x, y] = start;
  for (const d of moves) {
    x += DIR[d][0]; y += DIR[d][1];
    if (!inside(x, y)) return "off";
    if (rocks.some(r => r[0] === x && r[1] === y)) return "crash";
  }
  return x === star[0] && y === star[1] ? "win" : "wrong";
}

// fewest arrow changes needed to reach the star (checks every combination up to "limit")
function fewestFixes(start, moves, rocks, star, limit = 3) {
  const n = moves.length;
  if (simulate(start, moves, rocks, star) === "win") return 0;
  function tryChanges(fromIndex, changesLeft, current) {
    if (changesLeft === 0) return simulate(start, current, rocks, star) === "win";
    for (let i = fromIndex; i < n; i++) {
      for (const d of CYCLE) {
        if (d === moves[i]) continue;
        const next = [...current]; next[i] = d;
        if (tryChanges(i + 1, changesLeft - 1, next)) return true;
      }
    }
    return false;
  }
  for (let k = 1; k <= limit; k++) if (tryChanges(0, k, [...moves])) return k;
  return limit + 1;
}

// build one level: a path, some rocks beside it, then break a few arrows
function makeLevel(length, bugCount, rockCount, intro) {
  for (let attempt = 0; attempt < 500; attempt++) {
    const p = randomPath(length);
    if (!p) continue;

    // rocks go on empty squares that touch the path, so a wrong turn can hit them
    const rocks = [];
    if (rockCount) {
      const spots = [];
      for (let y = 0; y < 5; y++) for (let x = 0; x < 5; x++) {
        if (p.visited.has(key(x, y))) continue;
        if (CYCLE.some(d => p.visited.has(key(x + DIR[d][0], y + DIR[d][1])))) spots.push([x, y]);
      }
      if (spots.length < rockCount) continue;
      while (rocks.length < rockCount) rocks.push(spots.splice(randInt(spots.length), 1)[0]);
    }

    // swap some arrows for wrong ones
    const buggy = [...p.moves], picked = new Set();
    while (picked.size < bugCount) picked.add(randInt(length));
    picked.forEach(i => {
      const wrong = CYCLE.filter(d => d !== p.moves[i]);
      buggy[i] = wrong[randInt(wrong.length)];
    });

    // only keep it if the bugs actually break it (and on rock levels, cause a crash)
    const result = simulate(p.start, buggy, rocks, p.end);
    if (result === "win") continue;
    if (rockCount && result !== "crash") continue;
    if (simulate(p.start, p.moves, rocks, p.end) !== "win") continue;
    if (fewestFixes(p.start, buggy, rocks, p.end) !== bugCount) continue;   // no shortcut fixes

    return { start: p.start, star: p.end, rocks, code: buggy.join(""), sol: p.moves.join(""), intro };
  }
}

function randomCases() {
  return [
    makeLevel(5 + randInt(2), 1, 0, INTROS[0]),   // case 1: 5-6 moves, 1 bug
    makeLevel(7 + randInt(2), 2, 0, INTROS[1]),   // case 2: 7-8 moves, 2 bugs
    makeLevel(8,              2, 2, INTROS[2]),   // case 3: 8 moves, 2 bugs, 2 rocks
  ];
}
