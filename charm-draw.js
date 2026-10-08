// Shared drawing code: draws a rope + one charm shape on a canvas.
// Used by both studio.html (static preview) and overlay.html (swinging live version).

const MATERIALS = {
  metal: { base: '#8a94a3', shine: '#e6e9ee' },
  gold:  { base: '#d4af37', shine: '#fff6d1' },
  glass: { base: '#8ecbe6', shine: '#ffffff' },
  wood:  { base: '#8a5a34', shine: '#c99a68' },
};

const ROPES = {
  thread:  { color: '#cbb89a', width: 2,   style: 'solid' },
  chain:   { color: '#9aa3b0', width: 3,   style: 'links' },
  beads:   { color: '#caa6d6', width: 6,   style: 'beads' },
  silk:    { color: '#e6d9c3', width: 1.4, style: 'solid' },   // fine, elegant
  leather: { color: '#5a3a24', width: 4,   style: 'solid' },   // thick, matte cord
  wire:    { color: '#c7a05c', width: 1.6, style: 'solid' },   // thin brass wire
  ribbon:  { color: '#8a1f2b', width: 7,   style: 'solid' },   // flat wide band
};

// Every symbol we support, grouped the way a real charm library would group them.
// meaning is shown in the Studio UI so the shape actually connects to something.
const SHAPE_LIBRARY = {
  star:     { label: 'Star',     category: 'Classic',          meaning: 'Hope & guidance' },
  heart:    { label: 'Heart',    category: 'Classic',          meaning: 'Love & connection' },
  moon:     { label: 'Moon',     category: 'Classic',          meaning: 'Calm & new beginnings' },
  diamond:  { label: 'Diamond',  category: 'Classic',          meaning: 'Strength & clarity' },
  bead:     { label: 'Bead',     category: 'Classic',          meaning: 'Simplicity' },
  nazar:    { label: 'Nazar',    category: 'Protection',       meaning: 'Wards off bad energy' },
  hamsa:    { label: 'Hamsa',    category: 'Protection',       meaning: 'Blessing & protection' },
  horseshoe:{ label: 'Horseshoe',category: 'Protection',       meaning: 'Good luck at your door' },
  anchor:   { label: 'Anchor',   category: 'Protection',       meaning: 'Stability, staying grounded' },
  clover:   { label: 'Clover',   category: 'Luck & Fortune',   meaning: 'Good fortune' },
  key:      { label: 'Key',      category: 'Luck & Fortune',   meaning: 'New opportunity' },
  bell:     { label: 'Bell',     category: 'Luck & Fortune',   meaning: 'Calls in good news' },
  feather:  { label: 'Feather',  category: 'Nature & Emotion', meaning: 'Lightness, letting go' },
  paw:      { label: 'Paw',      category: 'Nature & Emotion', meaning: 'A companion close to heart' },
  infinity: { label: 'Infinity', category: 'Nature & Emotion', meaning: 'Endless bond' },
};

// Real illustrated charms (PNG files in the charms/ folder), grouped like a charm library.
const BUILT_IN_GALLERY = [
  { key: 'nazar',        label: 'Nazar Boncuğu', category: 'Protection',     meaning: 'Wards off bad energy',        file: 'charms/nazar.png' },
  { key: 'hamsa',        label: 'Hamsa',         category: 'Protection',     meaning: 'Blessing & protection',       file: 'charms/hamsa.png' },
  { key: 'horseshoe',    label: 'Horseshoe',     category: 'Protection',     meaning: 'Good luck at your door',      file: 'charms/horseshoe.png' },
  { key: 'guardian',     label: 'Drishti Bommai',category: 'Protection',     meaning: 'Guards against the evil eye', file: 'charms/guardian.png' },
  { key: 'nimbu-mirchi', label: 'Nimbu-mirchi',  category: 'Luck & Fortune', meaning: 'Wards off misfortune',        file: 'charms/nimbu-mirchi.png' },
  { key: 'daruma',       label: 'Daruma',        category: 'Luck & Fortune', meaning: 'Perseverance & wishes',       file: 'charms/daruma.png' },
  { key: 'maneki-neko',  label: 'Maneki-neko',   category: 'Luck & Fortune', meaning: 'Beckons good fortune',        file: 'charms/maneki-neko.png' },
  { key: 'red-knot',     label: 'Pánchángjié',   category: 'Luck & Fortune', meaning: 'Harmony & good fortune',      file: 'charms/red-knot.png' },
  { key: 'scarab',       label: 'Scarab',        category: 'Ritual & Home',  meaning: 'Renewal & protection',        file: 'charms/scarab.png' },
  { key: 'bell',         label: 'Ghanta',        category: 'Ritual & Home',  meaning: 'Calls in good news',          file: 'charms/bell.png' },
  { key: 'dreamcatcher', label: 'Dream Catcher', category: 'Ritual & Home',  meaning: 'Filters bad dreams',          file: 'charms/dreamcatcher.png' },
  { key: 'himmeli',      label: 'Himmeli',       category: 'Ritual & Home',  meaning: 'Light & good harvest',        file: 'charms/himmeli.png' },
  { key: 'bead',         label: 'Bead',          category: 'Classic',       meaning: 'Simplicity',                  file: 'charms/bead.png' },
  { key: 'camera',       label: 'Camera',        category: 'Classic',       meaning: 'Memories worth keeping',       file: 'charms/camera.png' },
  { key: 'gstar',        label: 'Star',          category: 'Classic',       meaning: 'Hope & guidance',              file: 'charms/star.png' },
  { key: 'gheart',       label: 'Heart',         category: 'Classic',       meaning: 'Love & connection',            file: 'charms/heart.png' },
  { key: 'gdiamond',     label: 'Diamond',       category: 'Classic',       meaning: 'Strength & clarity',           file: 'charms/diamond.png' },
  { key: 'spiderman',    label: 'Spider-Man',    category: 'Marvel',        meaning: 'A hero on a web',               file: 'charms/spiderman.png' },
];

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { BUILT_IN_GALLERY }; // only runs under Node (main.js); no-op in the browser
}

function lighten(hex, amt) {
  const c = parseInt(hex.slice(1), 16);
  const r = Math.min(255, (c >> 16) + amt);
  const g = Math.min(255, ((c >> 8) & 0xff) + amt);
  const b = Math.min(255, (c & 0xff) + amt);
  return `rgb(${r},${g},${b})`;
}

function drawRope(ctx, x1, y1, x2, y2, ropeKey) {
  const rope = ROPES[ropeKey] || ROPES.thread;
  ctx.strokeStyle = rope.color;
  ctx.lineWidth = rope.width;

  if (rope.style === 'beads') {
    const steps = 8;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const x = x1 + (x2 - x1) * t;
      const y = y1 + (y2 - y1) * t;
      ctx.beginPath();
      ctx.arc(x, y, rope.width / 1.5, 0, Math.PI * 2);
      ctx.fillStyle = rope.color;
      ctx.fill();
    }
  } else if (rope.style === 'links') {
    const steps = 10;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const x = x1 + (x2 - x1) * t;
      const y = y1 + (y2 - y1) * t;
      ctx.strokeRect(x - 3, y - 4, 6, 8);
    }
  } else {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }
}

// Draws a rope through a chain of {x,y} points (from a verlet simulation in the overlay)
// instead of a single straight line, so it visibly sags and trails like a real thread.
function drawFlexRope(ctx, nodes, ropeKey) {
  const rope = ROPES[ropeKey] || ROPES.thread;

  if (rope.style === 'beads') {
    ctx.fillStyle = rope.color;
    nodes.forEach((n) => {
      ctx.beginPath();
      ctx.arc(n.x, n.y, rope.width / 1.5, 0, Math.PI * 2);
      ctx.fill();
    });
    return;
  }

  if (rope.style === 'links') {
    ctx.strokeStyle = rope.color;
    ctx.lineWidth = rope.width;
    for (let i = 0; i < nodes.length - 1; i++) {
      const a = nodes[i], b = nodes[i + 1];
      const ang = Math.atan2(b.y - a.y, b.x - a.x);
      ctx.save();
      ctx.translate((a.x + b.x) / 2, (a.y + b.y) / 2);
      ctx.rotate(ang);
      ctx.strokeRect(-3, -4, 6, 8);
      ctx.restore();
    }
    return;
  }

  // smooth thread: a curve through the midpoints of each segment (quadratic smoothing),
  // plus a lighter dashed "sheen" stroke on top for a twisted-cord look instead of a flat line.
  function buildCurvePath() {
    ctx.beginPath();
    ctx.moveTo(nodes[0].x, nodes[0].y);
    for (let i = 1; i < nodes.length - 1; i++) {
      const midX = (nodes[i].x + nodes[i + 1].x) / 2;
      const midY = (nodes[i].y + nodes[i + 1].y) / 2;
      ctx.quadraticCurveTo(nodes[i].x, nodes[i].y, midX, midY);
    }
    const last = nodes[nodes.length - 1];
    ctx.lineTo(last.x, last.y);
  }

  ctx.lineCap = 'round';
  ctx.strokeStyle = rope.color;
  ctx.lineWidth = rope.width;
  buildCurvePath();
  ctx.stroke();

  ctx.save();
  ctx.setLineDash([4, 5]);
  ctx.strokeStyle = lighten(rope.color, 50);
  ctx.lineWidth = Math.max(1, rope.width * 0.45);
  ctx.globalAlpha = 0.55;
  buildCurvePath();
  ctx.stroke();
  ctx.restore();
}

function drawPolygon(ctx, r, sides, rotate = 0) {
  ctx.beginPath();
  for (let i = 0; i < sides; i++) {
    const a = rotate + (i * 2 * Math.PI) / sides;
    const x = Math.cos(a) * r, y = Math.sin(a) * r;
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.closePath();
}

function drawStarPath(ctx, r) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rad = i % 2 === 0 ? r : r * 0.42;
    const x = Math.cos(a) * rad, y = Math.sin(a) * rad;
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.closePath();
}

function drawHeartPath(ctx, r) {
  ctx.beginPath();
  ctx.moveTo(0, r * 0.3);
  ctx.bezierCurveTo(r, -r * 0.6, r * 1.3, r * 0.5, 0, r * 1.2);
  ctx.bezierCurveTo(-r * 1.3, r * 0.5, -r, -r * 0.6, 0, r * 0.3);
  ctx.closePath();
}

function drawMoonPath(ctx, r) {
  ctx.beginPath();
  ctx.arc(0, 0, r, Math.PI * 0.35, Math.PI * 1.75);
  ctx.arc(r * 0.5, 0, r * 0.85, Math.PI * 1.75, Math.PI * 0.35, true);
  ctx.closePath();
}

function drawHorseshoePath(ctx, r) {
  ctx.beginPath();
  ctx.arc(0, -r * 0.1, r, Math.PI * 0.05, Math.PI * 0.95, false);
  ctx.arc(0, -r * 0.1, r * 0.55, Math.PI * 0.95, Math.PI * 0.05, true);
  ctx.closePath();
}

function drawCloverPath(ctx, r) {
  const lr = r * 0.55;
  const offs = [[-lr * 0.75, -lr * 0.75], [lr * 0.75, -lr * 0.75], [-lr * 0.75, lr * 0.75], [lr * 0.75, lr * 0.75]];
  ctx.beginPath();
  offs.forEach(([ox, oy]) => { ctx.moveTo(ox + lr, oy); ctx.arc(ox, oy, lr, 0, Math.PI * 2); });
  ctx.rect(-r * 0.12, 0, r * 0.24, r * 0.8); // stem
}

function drawKeyPath(ctx, r) {
  ctx.beginPath();
  ctx.arc(0, -r * 0.45, r * 0.42, 0, Math.PI * 2); // head
  ctx.moveTo(-r * 0.12, -r * 0.1);
  ctx.lineTo(-r * 0.12, r * 0.9);
  ctx.lineTo(r * 0.12, r * 0.9);
  ctx.lineTo(r * 0.12, -r * 0.1);
  ctx.closePath();
  ctx.rect(r * 0.12, r * 0.5, r * 0.3, r * 0.14);   // tooth 1
  ctx.rect(r * 0.12, r * 0.72, r * 0.22, r * 0.14); // tooth 2
}

function drawPawPath(ctx, r) {
  ctx.beginPath();
  ctx.arc(0, r * 0.15, r * 0.6, 0, Math.PI * 2); // main pad
  const toes = [[-r * 0.55, -r * 0.55], [-r * 0.2, -r * 0.75], [r * 0.2, -r * 0.75], [r * 0.55, -r * 0.55]];
  toes.forEach(([tx, ty]) => { ctx.moveTo(tx + r * 0.25, ty); ctx.arc(tx, ty, r * 0.25, 0, Math.PI * 2); });
}

function drawAnchorPath(ctx, r) {
  ctx.beginPath();
  ctx.arc(0, -r * 0.7, r * 0.18, 0, Math.PI * 2);        // top ring
  ctx.rect(-r * 0.08, -r * 0.5, r * 0.16, r * 1.3);      // shaft
  ctx.rect(-r * 0.42, -r * 0.15, r * 0.84, r * 0.14);    // crossbar
  ctx.moveTo(-r * 0.08, r * 0.7);
  ctx.quadraticCurveTo(-r * 0.9, r * 0.75, -r * 0.65, r * 0.1);
  ctx.lineTo(-r * 0.4, r * 0.25);
  ctx.quadraticCurveTo(-r * 0.5, r * 0.6, -r * 0.08, r * 0.65);
  ctx.closePath();
  ctx.moveTo(r * 0.08, r * 0.7);
  ctx.quadraticCurveTo(r * 0.9, r * 0.75, r * 0.65, r * 0.1);
  ctx.lineTo(r * 0.4, r * 0.25);
  ctx.quadraticCurveTo(r * 0.5, r * 0.6, r * 0.08, r * 0.65);
  ctx.closePath();
}

function drawFeatherPath(ctx, r) {
  ctx.beginPath();
  ctx.moveTo(0, -r * 1.1);
  ctx.quadraticCurveTo(r * 0.75, -r * 0.5, r * 0.35, r * 0.6);
  ctx.quadraticCurveTo(r * 0.15, r * 1.0, 0, r * 1.15);
  ctx.quadraticCurveTo(-r * 0.15, r * 1.0, -r * 0.35, r * 0.6);
  ctx.quadraticCurveTo(-r * 0.75, -r * 0.5, 0, -r * 1.1);
  ctx.closePath();
}

function drawInfinityPath(ctx, r) {
  ctx.beginPath();
  ctx.arc(-r * 0.42, 0, r * 0.42, 0, Math.PI * 2);
  ctx.arc(r * 0.42, 0, r * 0.42, 0, Math.PI * 2);
}

function drawBellPath(ctx, r) {
  ctx.beginPath();
  ctx.arc(0, r * 0.05, r * 0.15, 0, Math.PI * 2); // hanger nub
  ctx.moveTo(-r * 0.75, r * 0.55);
  ctx.quadraticCurveTo(-r * 0.7, -r * 0.75, 0, -r * 0.75);
  ctx.quadraticCurveTo(r * 0.7, -r * 0.75, r * 0.75, r * 0.55);
  ctx.quadraticCurveTo(0, r * 0.85, -r * 0.75, r * 0.55);
  ctx.closePath();
  ctx.arc(0, r * 1.0, r * 0.14, 0, Math.PI * 2); // clapper
}

function drawHamsaPath(ctx, r) {
  ctx.beginPath();
  ctx.moveTo(-r * 0.45, r * 0.9);
  ctx.quadraticCurveTo(-r * 0.65, r * 0.3, -r * 0.55, -r * 0.1); // palm left edge
  ctx.quadraticCurveTo(-r * 0.9, -r * 0.15, -r * 0.85, -r * 0.55); // thumb
  ctx.quadraticCurveTo(-r * 0.78, -r * 0.75, -r * 0.55, -r * 0.35);
  ctx.quadraticCurveTo(-r * 0.5, -r * 0.7, -r * 0.35, -r * 1.05); // finger 1
  ctx.quadraticCurveTo(-r * 0.2, -r * 0.75, -r * 0.28, -r * 0.4);
  ctx.quadraticCurveTo(-r * 0.12, -r * 0.9, 0, -r * 1.18); // finger 2 (middle)
  ctx.quadraticCurveTo(r * 0.12, -r * 0.9, r * 0.28, -r * 0.4);
  ctx.quadraticCurveTo(r * 0.2, -r * 0.75, r * 0.35, -r * 1.05); // finger 3
  ctx.quadraticCurveTo(r * 0.5, -r * 0.7, r * 0.55, -r * 0.35);
  ctx.quadraticCurveTo(r * 0.78, -r * 0.75, r * 0.85, -r * 0.55); // thumb (right, mirrored)
  ctx.quadraticCurveTo(r * 0.9, -r * 0.15, r * 0.55, -r * 0.1);
  ctx.quadraticCurveTo(r * 0.65, r * 0.3, r * 0.45, r * 0.9);
  ctx.quadraticCurveTo(0, r * 1.1, -r * 0.45, r * 0.9);
  ctx.closePath();
}

// Builds the outline path for a shape at radius r, on the already-translated/rotated ctx.
function buildShapePath(ctx, shape, r) {
  switch (shape) {
    case 'heart':     return drawHeartPath(ctx, r);
    case 'moon':      return drawMoonPath(ctx, r);
    case 'diamond':   return drawPolygon(ctx, r, 4, Math.PI / 4);
    case 'horseshoe': return drawHorseshoePath(ctx, r);
    case 'clover':    return drawCloverPath(ctx, r);
    case 'key':       return drawKeyPath(ctx, r);
    case 'paw':       return drawPawPath(ctx, r);
    case 'anchor':    return drawAnchorPath(ctx, r);
    case 'feather':   return drawFeatherPath(ctx, r);
    case 'infinity':  return drawInfinityPath(ctx, r);
    case 'bell':      return drawBellPath(ctx, r);
    case 'hamsa':     return drawHamsaPath(ctx, r);
    case 'nazar':
    case 'bead':
    default:
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.closePath();
  }
}

// ---- custom imported images ----
// Cache loaded Image objects by their data URL so we don't reload every frame.
const _imgCache = {};
function getCachedImage(dataUrl) {
  if (!dataUrl) return null;
  if (!_imgCache[dataUrl]) {
    const img = new Image();
    img.src = dataUrl;
    _imgCache[dataUrl] = img; // may still be loading; drawImage on an unloaded image is a no-op
  }
  return _imgCache[dataUrl];
}

// fillAmount: 0..1, used by the Focus Timer to "fill up" the charm like a glass.
// anchor: 'top' (default) draws from the translate origin downward — used by the overlay,
// where that origin IS the rope's end, so the charm sits flush with no gap.
// 'center' centers the image on the translate origin instead — used by Studio's standalone
// preview circle, which has no rope and should just show the charm centered in the stage.
function drawCharm(ctx, charm, fillAmount = 1, anchor = 'top') {
  const { shape, color, material, size } = charm;

  if (charm.customImage) {
    drawCustomImageCharm(ctx, charm, fillAmount, anchor);
    return;
  }

  const mat = MATERIALS[material] || MATERIALS.metal;
  const r = size;

  ctx.save();

  // outer material rim
  ctx.fillStyle = mat.base;
  buildShapePath(ctx, shape, r);
  ctx.fill();

  // clip to the shape, then fill from the bottom up by fillAmount (focus timer effect)
  ctx.save();
  buildShapePath(ctx, shape, r * 0.82);
  ctx.clip();

  const top = -r, bottom = r * 1.3;
  const fillTop = bottom - (bottom - top) * fillAmount;
  ctx.fillStyle = '#e8e8ec';
  ctx.fillRect(-r * 1.4, top, r * 2.8, bottom - top); // empty part (light)
  ctx.fillStyle = color;
  ctx.fillRect(-r * 1.4, fillTop, r * 2.8, bottom - fillTop); // filled part
  ctx.restore();

  // Nazar keeps its traditional concentric rings drawn on top, so it still reads as a nazar
  // no matter what colour is picked -- the chosen colour becomes the outer ring's tint.
  if (shape === 'nazar') {
    const rings = [
      [r * 1.0, color],
      [r * 0.78, '#f2f2f2'],
      [r * 0.56, '#2f5fc9'],
      [r * 0.32, '#f2f2f2'],
      [r * 0.16, '#1b1b1b'],
    ];
    rings.forEach(([rad, c]) => {
      ctx.beginPath();
      ctx.arc(0, 0, rad, 0, Math.PI * 2);
      ctx.fillStyle = c;
      ctx.fill();
    });
  }

  // shine highlight
  ctx.beginPath();
  ctx.arc(-r * 0.3, -r * 0.35, r * 0.25, 0, Math.PI * 2);
  ctx.fillStyle = mat.shine;
  ctx.globalAlpha = 0.5;
  ctx.fill();
  ctx.globalAlpha = 1;

  ctx.restore();
}

// Draws a user-imported image as the charm, centered and scaled to fit `size`,
// keeping its natural aspect ratio. Adds a subtle focus-timer tint overlay on top.
function drawCustomImageCharm(ctx, charm, fillAmount, anchor = 'top') {
  const { size, color } = charm;
  const img = getCachedImage(charm.customImage);
  if (!img || !img.complete || !img.naturalWidth) return; // not loaded yet, skip this frame

  const r = size;
  const targetSpan = r * 2;
  const scale = targetSpan / Math.max(img.naturalWidth, img.naturalHeight);
  const w = img.naturalWidth * scale;
  const h = img.naturalHeight * scale;
  const drawY = anchor === 'center' ? -h / 2 : 0;

  ctx.save();
  // 'top': ctx is translated to the rope's END point — drawing from y=0 downward means the
  // image's TOP pixel sits exactly where the rope stops, so there's never a gap.
  // 'center': ctx is translated to the stage's center — drawing from -h/2 centers it there.
  ctx.drawImage(img, -w / 2, drawY, w, h);

  // Focus-timer progress: a soft colour wash that rises up the image as time passes.
  if (fillAmount < 1) {
    ctx.save();
    ctx.globalCompositeOperation = 'source-atop'; // only tints pixels the image actually drew
    ctx.globalAlpha = 0.35;
    const bottom = drawY + h;
    const fillTop = bottom - h * fillAmount;
    ctx.fillStyle = color;
    ctx.fillRect(-w / 2, fillTop, w, bottom - fillTop);
    ctx.restore();
  }

  ctx.restore();
}
