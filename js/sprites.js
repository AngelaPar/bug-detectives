/* =========================================================
   Sprites: all pixel art is drawn from text maps.
   Each character in a map is one pixel; the palette says
   which colour each character is ("." = empty).
   ========================================================= */

function pixelArt(map, palette) {
  const rows = map.trim().split("\n").map(r => r.trim());
  const h = rows.length, w = rows[0].length;
  let rects = "";
  rows.forEach((row, y) => [...row].forEach((ch, x) => {
    if (palette[ch]) rects += `<rect x="${x}" y="${y}" width="1" height="1" fill="${palette[ch]}"/>`;
  }));
  return `<svg viewBox="0 0 ${w} ${h}" shape-rendering="crispEdges" xmlns="http://www.w3.org/2000/svg">${rects}</svg>`;
}

const ALIEN = pixelArt(`
..g......g..
...g....g...
...GGGGGG...
..GGGGGGGG..
.GGKKGGKKGG.
.GGKLGGKLGG.
.GGGGGGGGGG.
..GGGggGGG..
...GGGGGG...
..GG.GG.GG..
.GG..GG..GG.
............`, { g: "#16a346", G: "#39ff7a", K: "#040806", L: "#c9ffd8" });

const STAR = pixelArt(`
....y....
....y....
...yyy...
yyyyoyyyy
.yyyyyyy.
..yyyyy..
..yy.yy..
.yy...yy.
.y.....y.`, { y: "#ffb300", o: "#fff1c2" });

// one arrow pointing right; it gets rotated for up / down / left
const ARROW = pixelArt(`
...k...
...kk..
kkkkkk.
kkkkkkk
kkkkkk.
...kk..
...k...`, { k: "#39ff7a" });

// little explosion shown in the message when the alien crashes
const BOOM = pixelArt(`
....r....
..r.r.r..
.rrrarrr.
..raaar..
rraawaarr
..raaar..
.rrrarrr.
..r.r.r..
....r....`, { r: "#ff4d6d", a: "#ffb300", w: "#fff1c2" });

// 8x8 button icons; "currentColor" makes them match the button's text colour
const ICON_MAPS = {
  play: `
.xx.....
.xxx....
.xxxx...
.xxxxx..
.xxxxx..
.xxxx...
.xxx....
.xx.....`,
  step: `
xx....xx
xxx...xx
xxxx..xx
xxxxx.xx
xxxxx.xx
xxxx..xx
xxx...xx
xx....xx`,
  reset: `
..xxxx.x
.x....xx
x....xxx
x.......
x.......
x......x
.x....x.
..xxxx..`,
  hint: `
..xxxx..
.xx..xx.
.....xx.
....xxx.
...xxx..
...x....
........
...x....`,
  home: `
...xx...
..xxxx..
.xxxxxx.
xxxxxxxx
.xxxxxx.
.xx..xx.
.xx..xx.
.xx..xx.`,
};
const icon = name => pixelArt(ICON_MAPS[name], { x: "currentColor" });

// put icons into any button with data-icon (before text) or data-icon-after (after text)
document.querySelectorAll("[data-icon]").forEach(b => b.insertAdjacentHTML("afterbegin", icon(b.dataset.icon)));
document.querySelectorAll("[data-icon-after]").forEach(b => b.insertAdjacentHTML("beforeend", icon(b.dataset.iconAfter)));
