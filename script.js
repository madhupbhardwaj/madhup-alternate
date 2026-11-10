/* =========================================================
   madhup.  — small bits of behaviour, no libraries.
   ========================================================= */
const root = document.documentElement;
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const store = {
  get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} },
};

/* ---------- Theme ---------- */
if (!root.dataset.theme) {
  root.dataset.theme = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}
document.getElementById('themeBtn').addEventListener('click', () => {
  root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
  store.set('theme', root.dataset.theme);
});

/* ---------- Sound (synthesised with Web Audio — no files) ---------- */
const sfx = (() => {
  let ctx = null, noise = null;
  const enabled = () => root.dataset.sound !== 'off';

  function unlock() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    // one second of white noise, reused for clicks and key taps
    noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = noise.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  ['pointerdown', 'keydown', 'touchstart'].forEach(e =>
    addEventListener(e, unlock, { passive: true }));

  const ready = () => enabled() && ctx && ctx.state === 'running';

  function burst({ freq, q = 1, dur = 0.03, gain = 0.1, type = 'bandpass' }) {
    const t = ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = noise;
    const f = ctx.createBiquadFilter();
    f.type = type; f.frequency.value = freq; f.Q.value = q;
    const g = ctx.createGain();
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f).connect(g).connect(ctx.destination);
    src.start(t, Math.random() * 0.9, dur + 0.02);
  }
  function tone(freq, { to = freq, dur = 0.06, gain = 0.08, type = 'sine', delay = 0 } = {}) {
    const t = ctx.currentTime + delay;
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    o.frequency.exponentialRampToValueAtTime(to, t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(ctx.destination);
    o.start(t); o.stop(t + dur + 0.02);
  }

  return {
    unlock,
    // typewriter-ish key tap
    key() {
      if (!ready()) return;
      burst({ freq: 1800 + Math.random() * 1600, q: 2.5, dur: 0.022, gain: 0.07 });
      burst({ freq: 180 + Math.random() * 60, q: 1, dur: 0.03, gain: 0.05, type: 'lowpass' });
    },
    // soft button click
    click() {
      if (!ready()) return;
      tone(1100, { to: 700, dur: 0.045, gain: 0.07 });
      burst({ freq: 3500, q: 1.5, dur: 0.015, gain: 0.05 });
    },
    // barely-there tick on hover
    hover() {
      if (!ready()) return;
      burst({ freq: 4200, q: 3, dur: 0.012, gain: 0.018 });
    },
    // little two-note chime
    chime(up = true) {
      if (!ctx) return;
      const [a, b] = up ? [660, 990] : [990, 660];
      tone(a, { dur: 0.09, gain: 0.06, type: 'triangle' });
      tone(b, { dur: 0.14, gain: 0.06, type: 'triangle', delay: 0.07 });
    },
    // pluck for the canvas
    pluck() {
      if (!ready()) return;
      const notes = [523.25, 587.33, 659.25, 783.99, 880];
      tone(notes[Math.floor(Math.random() * notes.length)], { dur: 0.35, gain: 0.05, type: 'triangle' });
    },
  };
})();

// Click sound on anything marked data-sfx
document.addEventListener('pointerdown', e => {
  if (e.target.closest('[data-sfx]') && !e.target.closest('#soundBtn, #soundText')) sfx.click();
});
document.addEventListener('keydown', e => {
  if ((e.key === 'Enter' || e.key === ' ') && document.activeElement?.matches('[data-sfx]')) sfx.click();
});
// Soft tick when moving across projects / pills
document.querySelectorAll('.projects a, .pill').forEach(el =>
  el.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') sfx.hover(); }));

// Sound toggle (nav icon + footer text)
const soundText = document.getElementById('soundText');
function syncSoundLabel() { soundText.textContent = root.dataset.sound === 'off' ? 'sound off' : 'sound on'; }
function toggleSound() {
  sfx.unlock();
  const off = root.dataset.sound !== 'off';
  if (off) { sfx.chime(false); root.dataset.sound = 'off'; }
  else { delete root.dataset.sound; sfx.chime(true); }
  store.set('sound', off ? 'off' : 'on');
  syncSoundLabel();
}
document.getElementById('soundBtn').addEventListener('click', toggleSound);
soundText.addEventListener('click', toggleSound);
syncSoundLabel();

/* ---------- Typing ---------- */
function typeInto(el, text, { speed = 55, onDone } = {}) {
  if (reduceMotion) { el.textContent = text; onDone && onDone(); return; }
  el.textContent = '';
  let i = 0;
  (function next() {
    el.textContent = text.slice(0, ++i);
    if (text[i - 1] !== ' ') sfx.key();
    if (i < text.length) setTimeout(next, speed * (0.6 + Math.random() * 0.9));
    else onDone && onDone();
  })();
}

// Hero subtitle
const typed = document.getElementById('typed');
setTimeout(() => typeInto(typed, typed.dataset.text, { speed: 60 }), 500);

// Section headings type themselves in as they scroll into view
const heads = document.querySelectorAll('[data-type]');
heads.forEach(h => { h.dataset.text = h.textContent; h.setAttribute('aria-label', h.textContent); if (!reduceMotion) h.textContent = ''; });
if (!reduceMotion && 'IntersectionObserver' in window) {
  const io = new IntersectionObserver(entries => entries.forEach(en => {
    if (!en.isIntersecting) return;
    io.unobserve(en.target);
    typeInto(en.target, en.target.dataset.text, { speed: 70 });
  }), { rootMargin: '0px 0px -15% 0px' });
  heads.forEach(h => io.observe(h));
} else {
  heads.forEach(h => (h.textContent = h.dataset.text));
}

/* ---------- Local time in India ---------- */
const clock = document.getElementById('clock');
const offsetEl = document.getElementById('offset');
function tick() {
  const now = new Date();
  const opts = { timeZone: 'Asia/Kolkata' };
  const time = now.toLocaleTimeString('en-US', { ...opts, hour: 'numeric', minute: '2-digit' }).toLowerCase();
  const day = now.toLocaleDateString('en-US', { ...opts, weekday: 'long' }).toLowerCase();
  clock.textContent = `${time} · ${day}`;
  // Difference between India (UTC+5:30) and the visitor
  const diff = 330 + now.getTimezoneOffset(); // minutes
  if (diff === 0) offsetEl.textContent = '// same time as you';
  else {
    const a = Math.abs(diff), h = Math.floor(a / 60), m = a % 60;
    offsetEl.textContent = `// ${h ? h + 'h ' : ''}${m ? m + 'm ' : ''}${diff > 0 ? 'ahead' : 'behind'}`;
  }
}
tick(); setInterval(tick, 15000);
document.getElementById('year').textContent = new Date().getFullYear();

/* ---------- Flow field banner ---------- */
(() => {
  const canvas = document.getElementById('field');
  const chip = document.querySelector('.chip');
  const g = canvas.getContext('2d');
  const palettes = [
    { name: 'ember',  bg: '#1b1020', c: ['#ff6b3d', '#ffb347', '#ff3d6e', '#ffd9a0'] },
    { name: 'tide',   bg: '#0b1d2c', c: ['#3d7bff', '#4fd1c5', '#a5f3fc', '#1e40af'] },
    { name: 'meadow', bg: '#0f1d14', c: ['#16a36a', '#a3e635', '#fde047', '#4ade80'] },
    { name: 'dusk',   bg: '#160f24', c: ['#a855f7', '#f472b6', '#818cf8', '#fcd34d'] },
  ];
  let pi = 0, W = 0, H = 0, dpr = 1, parts = [], seed = Math.random() * 1000, t = 0, running = true;
  const pointer = { x: -999, y: -999, active: false };

  function field(x, y) {
    const s = 0.0055;
    return (Math.sin(x * s + seed) + Math.cos(y * s * 1.3 - seed * 0.7) +
            Math.sin((x + y) * s * 0.6 + t * 0.0004)) * Math.PI * 0.75;
  }
  function spawn(p = {}) {
    p.x = Math.random() * W; p.y = Math.random() * H;
    p.life = 60 + Math.random() * 140;
    p.c = palettes[pi].c[Math.floor(Math.random() * palettes[pi].c.length)];
    p.w = 1 + Math.random() * 2.4;
    return p;
  }
  function resize() {
    dpr = Math.min(devicePixelRatio || 1, 2);
    const r = canvas.getBoundingClientRect();
    W = r.width; H = r.height;
    canvas.width = W * dpr; canvas.height = H * dpr;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    paintBg(1);
    parts = Array.from({ length: Math.round(W * H / 260) }, () => spawn());
  }
  function paintBg(a) {
    g.globalAlpha = a; g.fillStyle = palettes[pi].bg; g.fillRect(0, 0, W, H); g.globalAlpha = 1;
  }
  function step() {
    paintBg(0.035);
    g.lineCap = 'round';
    for (const p of parts) {
      let a = field(p.x, p.y);
      let vx = Math.cos(a) * 1.4, vy = Math.sin(a) * 1.4;
      if (pointer.active) {
        const dx = p.x - pointer.x, dy = p.y - pointer.y, d2 = dx * dx + dy * dy;
        if (d2 < 6400) { const k = (1 - d2 / 6400) * 4; vx += (-dy / 40) * k + dx / 60 * k; vy += (dx / 40) * k + dy / 60 * k; }
      }
      g.strokeStyle = p.c; g.lineWidth = p.w; g.globalAlpha = 0.55;
      g.beginPath(); g.moveTo(p.x, p.y); p.x += vx; p.y += vy; g.lineTo(p.x, p.y); g.stroke();
      if (--p.life < 0 || p.x < -5 || p.x > W + 5 || p.y < -5 || p.y > H + 5) spawn(p);
    }
    g.globalAlpha = 1;
    t++;
  }
  function loop() { if (running) step(); requestAnimationFrame(loop); }
  function setChip() { chip.textContent = `0${pi + 1} / 0${palettes.length} · ${palettes[pi].name}`; }

  function pos(e) { const r = canvas.getBoundingClientRect(); pointer.x = e.clientX - r.left; pointer.y = e.clientY - r.top; }
  let lastPluck = 0;
  canvas.addEventListener('pointermove', e => {
    pos(e); pointer.active = true;
    const now = performance.now();
    if (e.pointerType === 'mouse' && now - lastPluck > 260 && Math.abs(e.movementX) + Math.abs(e.movementY) > 18) { sfx.pluck(); lastPluck = now; }
  });
  canvas.addEventListener('pointerleave', () => (pointer.active = false));
  canvas.addEventListener('click', e => {
    pos(e);
    pi = (pi + 1) % palettes.length; seed = Math.random() * 1000;
    paintBg(0.85); parts.forEach(p => spawn(p)); setChip(); sfx.chime(true);
    if (reduceMotion) for (let i = 0; i < 160; i++) step();
  });

  addEventListener('resize', () => { clearTimeout(resize.t); resize.t = setTimeout(resize, 150); });
  resize(); setChip();
  if (reduceMotion) { for (let i = 0; i < 160; i++) step(); return; }
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([en]) => (running = en.isIntersecting)).observe(canvas);
  }
  for (let i = 0; i < 40; i++) step(); // start with some texture already there
  loop();
})();
