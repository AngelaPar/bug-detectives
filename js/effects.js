/* =========================================================
   Effects: sound, moving background, confetti, screen fit
   ========================================================= */

const $ = id => document.getElementById(id);

/* ---------- sound (generated, no audio files) ---------- */
let audio = null, muted = false;

function beep(freq = 440, length = .08, type = "square", volume = .06) {
  if (muted) return;
  try {
    audio = audio || new (window.AudioContext || window.webkitAudioContext)();
    const osc = audio.createOscillator(), gain = audio.createGain();
    osc.type = type; osc.frequency.value = freq;
    gain.gain.value = volume;
    gain.gain.exponentialRampToValueAtTime(.0001, audio.currentTime + length);
    osc.connect(gain); gain.connect(audio.destination);
    osc.start(); osc.stop(audio.currentTime + length);
  } catch (e) {}
}
function tune(notes) { notes.forEach((n, i) => setTimeout(() => beep(n, .12), i * 110)); }
function toggleMute() { muted = !muted; $("mute").innerHTML = `<span>SOUND: ${muted ? "OFF" : "ON"}</span>`; }

/* ---------- background: drifting dot grid + a few twinkles ---------- */
const bg = $("bg"), bgCtx = bg.getContext("2d");
const PIXEL = 4;                      // each background "pixel" is 4 screen pixels
let bgW = 0, bgH = 0, twinkles = [];

function sizeBackground() {
  bgW = bg.width  = Math.ceil(innerWidth  / PIXEL);
  bgH = bg.height = Math.ceil(innerHeight / PIXEL);
  const colours = ["#39ff7a", "#39ff7a", "#ffb300"];
  twinkles = Array.from({ length: 14 }, (_, i) => ({
    x: randInt(bgW), y: randInt(bgH), phase: Math.random() * 6.28, speed: .6 + Math.random() * .6, colour: colours[i % 3],
  }));
}

function drawBackground(t) {
  bgCtx.fillStyle = "#040806"; bgCtx.fillRect(0, 0, bgW, bgH);

  const gap = 12, drift = (t / 220) % gap;
  bgCtx.fillStyle = "#0f2416";
  for (let y = -gap; y < bgH + gap; y += gap)
    for (let x = -gap; x < bgW + gap; x += gap)
      bgCtx.fillRect(Math.round(x + drift), Math.round(y + drift), 1, 1);

  twinkles.forEach(p => {
    const v = (Math.sin(t / 900 * p.speed + p.phase) + 1) / 2;
    if (v < .55) return;
    bgCtx.globalAlpha = (v - .55) / .45 * .8; bgCtx.fillStyle = p.colour;
    bgCtx.fillRect(p.x, p.y, 1, 1);
    if (v > .85) {                                   // brightest moment: small + shape
      bgCtx.fillRect(p.x - 1, p.y, 1, 1); bgCtx.fillRect(p.x + 1, p.y, 1, 1);
      bgCtx.fillRect(p.x, p.y - 1, 1, 1); bgCtx.fillRect(p.x, p.y + 1, 1, 1);
    }
    bgCtx.globalAlpha = 1;
  });
  requestAnimationFrame(drawBackground);
}

/* ---------- confetti ---------- */
const cf = $("confetti"), cfCtx = cf.getContext("2d");
let bits = [];

function confetti() {
  cf.width = innerWidth; cf.height = innerHeight;
  const colours = ["#39ff7a", "#c9ffd8", "#ffb300", "#16a346", "#5ff3ff"];
  const alreadyRunning = bits.length > 0;
  for (let i = 0; i < 120; i++) bits.push({
    x: innerWidth / 2, y: innerHeight / 2,
    vx: (Math.random() - .5) * 18, vy: -Math.random() * 16 - 4,
    colour: colours[i % 5], size: 8 + Math.random() * 6, life: 90,
  });
  if (!alreadyRunning) confettiFrame();
}

function confettiFrame() {
  cfCtx.clearRect(0, 0, cf.width, cf.height);
  bits.forEach(b => {
    b.vy += .6; b.x += b.vx; b.y += b.vy; b.life--;
    cfCtx.fillStyle = b.colour;
    cfCtx.fillRect(Math.round(b.x / 4) * 4, Math.round(b.y / 4) * 4, b.size, b.size);   // snap to a 4px grid
  });
  bits = bits.filter(b => b.life > 0 && b.y < cf.height + 20);
  if (bits.length) requestAnimationFrame(confettiFrame);
  else cfCtx.clearRect(0, 0, cf.width, cf.height);
}

/* ---------- scale the 1280x720 stage to fit any window ---------- */
function fitStage() {
  const scale = Math.min(innerWidth / 1280, innerHeight / 720);
  $("stage").style.transform = `translate(-50%, -50%) scale(${scale})`;
  sizeBackground();
}
addEventListener("resize", fitStage);
fitStage();
requestAnimationFrame(drawBackground);
