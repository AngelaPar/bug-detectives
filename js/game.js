/* =========================================================
   Game loop: predict -> run / step -> crash or win -> fix
   ========================================================= */

let levels = HANDMADE;          // first playthrough uses the hand-made cases
let finishedOnce = false;       // after that, every new run gets random cases

let caseIndex = 0;              // which case we're on (0, 1, 2)
let code = [];                  // the arrows as the player has them now
let original = [];              // the arrows the case started with
let pos = [0, 0];               // the alien's square
let step = 0;                   // which instruction runs next
let running = false, timer = null;

const CELL = 88, OFFSET = 6;    // board square size and sprite inset, in px

/* ---------- screens ---------- */
function go(id) {
  document.querySelectorAll(".screen").forEach(s => s.classList.toggle("on", s.id === id));
  beep(660, .06);
}
function openCase1() { if (finishedOnce) levels = randomCases(); startCase(0); }
function playAgain() { levels = randomCases(); startCase(0); }

/* ---------- set up a case ---------- */
function startCase(i) {
  caseIndex = i;
  const lv = levels[i];
  code = [...lv.code]; original = [...lv.code];
  $("caseTitle").textContent = "CASE " + (i + 1);
  const bugs = [...lv.code].filter((c, k) => c !== lv.sol[k]).length;
  $("caseInfo").innerHTML = `BUGS HIDING: <b>${bugs}</b>`;
  go("game"); buildBoard(); renderCode(); resetAlien();
  say(lv.intro); highlight(1);
}

function buildBoard() {
  const board = $("board"), lv = levels[caseIndex];
  board.innerHTML = "";
  for (let y = 0; y < 5; y++) for (let x = 0; x < 5; x++) {
    const cell = document.createElement("div");
    cell.className = "cell " + ((x + y) % 2 ? "b" : "a");          // checkerboard
    cell.id = `c${x}_${y}`;
    if (lv.rocks.some(r => r[0] === x && r[1] === y)) cell.classList.add("rock");
    board.appendChild(cell);
  }
  board.insertAdjacentHTML("beforeend",
    `<div class="sprite" id="star">${STAR}</div><div class="sprite" id="alien">${ALIEN}</div>`);
  place($("star"), lv.star);
}

function place(el, [x, y]) {
  el.style.left = x * CELL + OFFSET + "px";
  el.style.top  = y * CELL + OFFSET + "px";
}

// draw the arrow tiles; clicking one rotates it to the next direction
function renderCode() {
  const box = $("code");
  box.innerHTML = "";
  code.forEach((d, i) => {
    const tile = document.createElement("div");
    tile.className = "tile" + (d !== original[i] ? " changed" : "");
    tile.id = "t" + i;
    tile.innerHTML = `<span class="n">${i + 1}</span>` + ARROW;
    tile.querySelector("svg").style.transform = `rotate(${ROT[d]}deg)`;
    tile.onclick = () => {
      if (running) return;
      code[i] = CYCLE[(CYCLE.indexOf(code[i]) + 1) % 4];
      renderCode(); resetAlien(true); beep(520, .05); highlight(3);
    };
    box.appendChild(tile);
  });
}

/* ---------- helpers ---------- */
function clearTiles() { document.querySelectorAll(".tile").forEach(t => t.classList.remove("now", "bad", "hint")); }
function setButtons(disabled) { ["bRun", "bHint"].forEach(id => $(id).disabled = disabled); }
function highlight(n) { [1, 2, 3].forEach(k => $("s" + k).classList.toggle("lit", k === n)); }   // 1 predict, 2 test, 3 fix
function say(html, type) {
  const m = $("msg");
  m.className = "msg px" + (type ? " " + type : "");
  m.innerHTML = html;
  void m.offsetWidth; m.classList.add("pop");          // restart the slide-in animation
}

// put the alien back on its start square (arrows stay as they are)
function resetAlien(quiet) {
  clearInterval(timer); running = false; step = 0;
  pos = [...levels[caseIndex].start];
  const a = $("alien");
  a.style.transition = "none"; place(a, pos); a.offsetHeight; a.style.transition = "";   // jump, don't glide
  document.querySelectorAll(".cell").forEach(c => c.classList.remove("trail"));
  clearTiles(); setButtons(false);
  if (!quiet) { say("Alien is back at the start. PREDICT, then RUN or STEP."); highlight(1); }
}

/* ---------- running the code ---------- */
// carry out one instruction
function doStep() {
  const lv = levels[caseIndex];
  clearTiles();
  if (step >= code.length) return finish();

  $("t" + step).classList.add("now");
  const [dx, dy] = DIR[code[step]];
  const nx = pos[0] + dx, ny = pos[1] + dy;
  $(`c${pos[0]}_${pos[1]}`)?.classList.add("trail");

  if (!inside(nx, ny)) return fail(`Step ${step + 1} walks the alien OFF the board!<br>That arrow looks like a bug.`);

  if (lv.rocks.some(r => r[0] === nx && r[1] === ny)) {
    pos = [nx, ny]; place($("alien"), pos);
    return setTimeout(() => fail(`CRASH! Step ${step + 1} hits a rock.<br>Is that arrow a bug?`), 330);
  }

  pos = [nx, ny]; place($("alien"), pos); beep(330 + step * 40, .06);
  step++;
  if (step >= code.length) setTimeout(finish, 360);
}

function fail(text) {
  clearInterval(timer); running = false; setButtons(false);
  const tile = $("t" + step);
  if (tile) { tile.classList.remove("now"); tile.classList.add("bad"); }
  $("alien").classList.add("shake"); setTimeout(() => $("alien").classList.remove("shake"), 800);
  tune([300, 220, 160]);
  say(`<span class="icon">${BOOM}</span>${text}<br>Click it to FIX, then test again.`, "oops");
  highlight(3);
  step = code.length + 1;
}

function finish() {
  clearInterval(timer); running = false; setButtons(false); clearTiles();
  const lv = levels[caseIndex];
  step = code.length + 1;

  if (pos[0] !== lv.star[0] || pos[1] !== lv.star[1]) {
    tune([300, 250]);
    say("Hmm... the alien stopped in the WRONG spot.<br>TEST it with STEP to find where it goes wrong.", "oops");
    highlight(2);
    return;
  }

  tune([523, 659, 784, 1046]); confetti();
  const won = `<span class="icon star">${STAR}</span>BUG FIXED! The alien reached the star.`;
  say(won, "win");
  setTimeout(() => {
    const last = caseIndex === levels.length - 1;
    const next = last
      ? `<button class="btn go" onclick="finishedOnce = true; go('end'); confetti()"><span>CLOSE THE CASE</span>${icon("play")}</button>`
      : `<button class="btn go" onclick="startCase(${caseIndex + 1})"><span>NEXT CASE</span>${icon("play")}</button>`;
    say(won + "<br>" + next, "win");
  }, 900);
}

/* ---------- buttons ---------- */
function run() {
  if (running) return;
  if (step > 0) resetAlien(true);                     // RUN always starts from the beginning
  running = true; setButtons(true); highlight(2); say("Running... watch each step!");
  timer = setInterval(() => { if (step >= code.length) { clearInterval(timer); return; } doStep(); }, 560);
}

function stepOnce() {
  if (running) return;
  if (step > code.length - 1) resetAlien(true);
  highlight(2); say(`Testing step ${step + 1} of ${code.length}...`);
  doStep();
}

function resetAll() {
  if (running) return;
  code = [...original]; renderCode(); resetAlien(true); highlight(1); beep(400, .06);
  say("Back to the start. Alien and code are reset. PREDICT, then RUN or STEP.");
}

function hint() {
  const lv = levels[caseIndex];
  resetAlien(true);
  const i = code.findIndex((c, k) => c !== lv.sol[k]);
  if (i < 0) { say("Your code looks right! Press RUN."); return; }
  $("t" + i).classList.add("hint"); beep(880, .08);
  say(`Detective tip: look closely at step ${i + 1}. Where should the alien go from there?`);
  highlight(1);
}

/* ---------- keyboard ---------- */
addEventListener("keydown", e => {
  const k = e.key.toLowerCase();
  if (k === "f") { document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen(); return; }
  if (!$("game").classList.contains("on")) return;
  if (e.code === "Space") { e.preventDefault(); run(); }
  if (k === "s") stepOnce();
  if (k === "r") resetAll();
  if (k === "h") hint();
});
