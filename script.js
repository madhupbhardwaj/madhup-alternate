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

/* ---------- Sound (synthesised with Web Audio — no files) ----------
   Everything runs through one quiet master bus with a compressor and a
   small generated "room" reverb, so sounds blend instead of clicking. */
const sfx = (() => {
  let ctx = null, noise = null, bus = null, voices = 0;
  const MAX_VOICES = 6;
  const enabled = () => root.dataset.sound !== 'off';

  function unlock() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();

    // white noise, reused for key taps
    noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = noise.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;

    // master: bus -> compressor -> volume -> speakers, plus a reverb send
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -20; comp.ratio.value = 4;
    const master = ctx.createGain(); master.gain.value = 0.8;
    bus = ctx.createGain();
    bus.connect(comp).connect(master).connect(ctx.destination);

    const len = ctx.sampleRate * 1.8, ir = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const b = ir.getChannelData(ch);
      for (let i = 0; i < len; i++) b[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
    }
    const verb = ctx.createConvolver(); verb.buffer = ir;
    const wet = ctx.createGain(); wet.gain.value = 0.22;
    bus.connect(verb).connect(wet).connect(comp);
  }
  ['pointerdown', 'keydown', 'touchstart'].forEach(e =>
    addEventListener(e, unlock, { passive: true }));

  const ready = () => enabled() && ctx && ctx.state === 'running';

  function burst({ freq, q = 1, dur = 0.03, gain = 0.1, type = 'bandpass' }) {
    const t = ctx.currentTime;
    const src = ctx.createBufferSource(); src.buffer = noise;
    const f = ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
    const g = ctx.createGain();
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f).connect(g).connect(bus);
    src.start(t, Math.random() * 0.9, dur + 0.02);
  }
  function tone(freq, { to = freq, dur = 0.06, gain = 0.08, type = 'sine', delay = 0 } = {}) {
    const t = ctx.currentTime + delay;
    const o = ctx.createOscillator(); o.type = type;
    o.frequency.setValueAtTime(freq, t);
    o.frequency.exponentialRampToValueAtTime(to, t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(bus);
    o.start(t); o.stop(t + dur + 0.02);
  }
  // Soft marimba-like note: fundamental + a quiet 4th harmonic, fast attack, gentle decay.
  function mallet(freq, { gain = 0.09, dur = 1.4, delay = 0 } = {}) {
    if (voices >= MAX_VOICES) return;
    voices++;
    const t = ctx.currentTime + delay;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    g.connect(bus);
    [[1, 1], [4, 0.12], [10, 0.02]].forEach(([mult, amp]) => {
      const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = freq * mult;
      const og = ctx.createGain(); og.gain.value = amp;
      if (mult > 1) { og.gain.setValueAtTime(amp, t); og.gain.exponentialRampToValueAtTime(0.0001, t + dur / (mult * 0.8)); }
      o.connect(og).connect(g); o.start(t); o.stop(t + dur + 0.05);
    });
    setTimeout(() => voices--, (delay + dur) * 1000);
  }

  let drone = null;
  return {
    unlock,
    key() {
      if (!ready()) return;
      burst({ freq: 1800 + Math.random() * 1600, q: 2.5, dur: 0.022, gain: 0.06 });
      burst({ freq: 180 + Math.random() * 60, q: 1, dur: 0.03, gain: 0.04, type: 'lowpass' });
    },
    click() {
      if (!ready()) return;
      tone(1100, { to: 700, dur: 0.045, gain: 0.06 });
    },
    hover() {
      if (!ready()) return;
      burst({ freq: 4200, q: 3, dur: 0.012, gain: 0.015 });
    },
    chime(up = true) {
      if (!ctx) return;
      const [a, b] = up ? [659.25, 987.77] : [987.77, 659.25];
      mallet(a, { gain: 0.07, dur: 0.8 });
      mallet(b, { gain: 0.07, dur: 1.0, delay: 0.08 });
    },
    // thocky mechanical key: a low felt "thock" + a soft upper click, a little different every time
    thock(space = false) {
      if (!ready()) return;
      const r = Math.random();
      burst({ freq: (space ? 260 : 420) + r * 160, q: 1.4, dur: space ? 0.07 : 0.05, gain: space ? 0.16 : 0.12, type: 'lowpass' });
      tone((space ? 110 : 150) + r * 40, { to: (space ? 70 : 90) + r * 20, dur: 0.05, gain: space ? 0.08 : 0.06 });
      burst({ freq: 2200 + r * 900, q: 3, dur: 0.012, gain: 0.025 });
    },
    // question button: a soft, round "pop"
    pop() {
      if (!ready()) return;
      tone(380, { to: 920, dur: 0.07, gain: 0.07 });
      mallet(1318.5, { gain: 0.035, dur: 0.35, delay: 0.05 });
    },
    // a cheerful little "hi!" — two quick rising notes
    hi() {
      if (!ready()) return;
      mallet(783.99, { gain: 0.07, dur: 0.5 });
      mallet(1174.66, { gain: 0.06, dur: 0.8, delay: 0.09 });
    },
    // Two notes in the ratio a:b, struck together, then a quiet sustained
    // hum of the same interval that fades out over `hold` seconds.
    interval(a, b, hold = 10) {
      if (!ready()) return;
      const base = 196 * (a <= 2 ? 1.5 : 1); // keep every interval in a comfy range
      const f1 = base, f2 = base * b / a;
      mallet(f1, { gain: 0.08, dur: 1.8 });
      mallet(f2, { gain: 0.07, dur: 1.8, delay: 0.09 });
      this.stopDrone();
      const t = ctx.currentTime;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.025, t + 0.8);
      g.gain.exponentialRampToValueAtTime(0.0001, t + hold);
      g.connect(bus);
      const oscs = [f1, f2].map(f => { const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = f; o.connect(g); o.start(t); o.stop(t + hold + 0.1); return o; });
      drone = { g, oscs };
    },
    stopDrone() {
      if (!drone || !ctx) return;
      const t = ctx.currentTime;
      drone.g.gain.cancelScheduledValues(t);
      drone.g.gain.setValueAtTime(Math.max(drone.g.gain.value, 0.0001), t);
      drone.g.gain.exponentialRampToValueAtTime(0.0001, t + 0.25);
      drone.oscs.forEach(o => { try { o.stop(t + 0.3); } catch (e) {} });
      drone = null;
    },
    // light tick while dragging between ratios
    notch() { if (ready()) burst({ freq: 2600, q: 4, dur: 0.015, gain: 0.03 }); },
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
// Avatar speech bubble: says "hi :)" on hover/tap, and types out answers to questions.
const avatarTalk = (() => {
  const av = document.getElementById('avatar');
  const bubble = av.querySelector('.bubble');
  let hideTimer, typeTimer, lastHi = 0, answering = false;

  const show = () => av.classList.add('say');
  const hide = () => { av.classList.remove('say'); answering = false; };

  function hi() {
    if (answering) return;                       // don't interrupt an answer
    clearTimeout(hideTimer);
    bubble.classList.remove('long');
    bubble.textContent = 'hi :)';
    if (!av.classList.contains('say') && performance.now() - lastHi > 600) { sfx.hi(); lastHi = performance.now(); }
    show();
  }
  av.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') hi(); });
  av.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse' && !answering) hide(); });
  av.addEventListener('pointerdown', e => {
    if (e.pointerType === 'mouse') return;
    sfx.unlock(); hi();
    if (!answering) hideTimer = setTimeout(hide, 2200);
  });

  // Type `text` into the bubble with thocky key sounds.
  function answer(text) {
    clearTimeout(hideTimer); clearTimeout(typeTimer);
    answering = true;
    bubble.classList.add('long');
    bubble.textContent = '';
    show();
    // bring the avatar into view if the visitor has scrolled away
    const r = av.getBoundingClientRect();
    if (r.top < 60 || r.bottom > innerHeight) av.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });

    if (reduceMotion) { bubble.textContent = text; return done(); }
    const out = document.createTextNode(''), caret = document.createElement('span');
    caret.className = 'tcaret';
    bubble.append(out, caret);
    let i = 0;
    (function next() {
      const ch = text[i++];
      out.data += ch;
      if (ch !== ' ' || i % 2) sfx.thock(ch === ' ');
      if (i < text.length) {
        const pause = /[.,!?]/.test(ch) ? 140 : 26;   // little breath after punctuation
        typeTimer = setTimeout(next, pause + Math.random() * 30);
      } else { caret.remove(); done(); }
      keepVisible();
    })();
    // if the bubble grows up under the sticky nav, scroll just enough to show it
    function keepVisible() {
      const top = bubble.getBoundingClientRect().top, navH = 64;
      if (top < navH) scrollBy({ top: top - navH - 8, behavior: 'auto' });
    }
    function done() { hideTimer = setTimeout(hide, Math.max(5000, text.length * 90)); }
  }
  return { answer, hide, isAnswering: () => answering };
})();

/* ---------- "more about me" ----------
   Edit this list: each question appears as a button, and its answer is
   typed out in the speech bubble next to the avatar. */
const QUESTIONS = [
  { q: 'what are you working towards?',
    a: "jee 2028 is the big one right now. building things is the passion that runs alongside it." },
  { q: 'why math?',
    a: "it's the most logical thing there is. everything is rigorous, and if you're brave enough, you can derive it yourself. it doesn't always show up in real life, but i'm here for the love of the game." },
  { q: 'which project are you proudest of?',
    a: "problemset.in, no contest." },
  { q: 'what are you bad at?',
    a: "art, and i'll own it. drawing is not my strong suit." },
  { q: 'a book that changed how you think?',
    a: "the almanack of naval ravikant. one of the most eye-opening books out there, and somehow still overlooked." },
];
(() => {
  const btn = document.getElementById('askBtn');
  const panel = document.getElementById('ask');
  const list = document.getElementById('questions');
  const live = document.getElementById('answerLive');

  QUESTIONS.forEach(({ q, a }) => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'q'; b.textContent = q;
    b.setAttribute('aria-pressed', 'false');
    b.addEventListener('click', () => {
      sfx.pop();
      list.querySelectorAll('.q').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
      live.textContent = a;
      setTimeout(() => avatarTalk.answer(a), 120);   // let the pop finish before typing starts
    });
    list.appendChild(b);
  });

  btn.addEventListener('click', () => {
    sfx.click();
    const open = panel.hidden;
    panel.hidden = !open;
    panel.classList.toggle('open', open);
    btn.setAttribute('aria-expanded', String(open));
    if (!open) { avatarTalk.hide(); list.querySelectorAll('.q').forEach(x => x.setAttribute('aria-pressed', 'false')); }
  });
})();

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
  if (el._typing) return;                      // already typing this one
  if (reduceMotion) { el.textContent = text; onDone && onDone(); return; }
  el._typing = true;
  el.textContent = '';
  let i = 0;
  (function next() {
    el.textContent = text.slice(0, ++i);
    if (text[i - 1] !== ' ') sfx.key();
    if (i < text.length) setTimeout(next, speed * (0.6 + Math.random() * 0.9));
    else { el._typing = false; el._typedAt = performance.now(); onDone && onDone(); }
  })();
}
// Retype on demand, with a short cooldown so it doesn't stutter
function retype(el, speed) {
  if (el._typing || performance.now() - (el._typedAt || 0) < 400) return;
  typeInto(el, el.dataset.text, { speed });
}

// Hero subtitle
const typed = document.getElementById('typed');
setTimeout(() => typeInto(typed, typed.dataset.text, { speed: 60 }), 500);

// Click (or tap) the name to retype the subtitle
document.getElementById('nameBtn').addEventListener('click', () => retype(typed, 60));

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
// Hover (mouse) or tap (touch) a heading to watch it type again
heads.forEach(h => {
  h.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') retype(h, 70); });
  h.addEventListener('click', () => retype(h, 70));   // taps on phones (scroll-drags don't count)
});

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

/* ---------- Harmonograph banner ----------
   A pen traces x = sin(a·s + φ)·e^(−ks), y = sin(b·s)·e^(−ks).
   The ratio a:b is the same ratio as the two notes you hear. */
(() => {
  const canvas = document.getElementById('field');
  const chip = document.querySelector('.chip');
  const g = canvas.getContext('2d');
  const ratios = [
    [1, 2, 'octave'], [2, 3, 'perfect fifth'], [3, 4, 'perfect fourth'],
    [3, 5, 'major sixth'], [4, 5, 'major third'], [5, 6, 'minor third'],
  ];
  const DRAW_SECONDS = 16, HOLD_SECONDS = 4;
  let S_END = 64, K = 0.026;
  let ri = 1, s = 0, W = 0, H = 0, dpr = 1, phase0 = 0, last = 0, holdUntil = 0, visible = true;
  let ink = '#1a1a18', pen;

  const pt = v => {
    const [a, b] = ratios[ri];
    const e = Math.exp(-K * v), phi = phase0 + 0.012 * v;
    return [W / 2 + Math.sin(a * v + phi) * e * W * 0.36,
            H / 2 + Math.sin(b * v) * e * H * 0.4];
  };
  function readInk() { ink = getComputedStyle(root).getPropertyValue('--muted').trim() || '#8a8a84'; }

  function drawRange(from, to) {
    const step = 0.012;
    g.strokeStyle = ink; g.lineWidth = 1; g.globalAlpha = 1; g.lineJoin = g.lineCap = 'round';
    g.beginPath();
    let [x, y] = pt(from); g.moveTo(x, y);
    for (let v = from + step; v < to; v += step) { [x, y] = pt(v); g.lineTo(x, y); }
    [x, y] = pt(to); g.lineTo(x, y);
    g.stroke(); g.globalAlpha = 1;
  }
  function redraw() {          // repaint everything drawn so far (resize / theme change)
    g.clearRect(0, 0, W, H);
    if (s > 0) drawRange(0, s);
  }
  function resize() {
    dpr = Math.min(devicePixelRatio || 1, 2);
    const r = canvas.getBoundingClientRect();
    W = r.width; H = r.height;
    canvas.width = W * dpr; canvas.height = H * dpr;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    redraw();
    if (pen) redrawTip();
  }
  function setChip(i = ri) { const [a, b, name] = ratios[i]; chip.textContent = `${a} : ${b} · ${name}`; }

  function start(index, withSound) {
    ri = (index + ratios.length) % ratios.length;
    // higher ratios wind faster, so give them fewer turns to keep every drawing equally calm
    S_END = 100 / ratios[ri][1]; K = 1.6 / S_END;
    s = 0; phase0 = Math.PI / 2 + (Math.random() - 0.5) * 0.6; holdUntil = 0;
    g.clearRect(0, 0, W, H); setChip();
    if (withSound) sfx.interval(ratios[ri][0], ratios[ri][1], DRAW_SECONDS * 0.8);
    if (reduceMotion) { s = S_END; redraw(); }
  }

  function frame(now) {
    const dt = Math.min((now - (last || now)) / 1000, 0.05); last = now;
    if (visible && !reduceMotion) {
      if (s < S_END) {
        const next = Math.min(S_END, s + dt * S_END / DRAW_SECONDS);
        drawRange(s, next); s = next;
        if (s >= S_END) holdUntil = now + HOLD_SECONDS * 1000;
      } else if (holdUntil && now > holdUntil) {
        start(ri + 1, false);  // moves on quietly by itself; sound only when you touch it
      }
      // pen tip
      pen.style.opacity = s < S_END ? 1 : 0;
      if (s < S_END) redrawTip();
    }
    requestAnimationFrame(frame);
  }
  // pen tip: a small dot positioned over the canvas
  pen = document.createElement('span');
  pen.className = 'pen'; canvas.after(pen);
  if (reduceMotion) pen.style.opacity = 0;
  function redrawTip() {
    const [x, y] = pt(s);
    pen.style.transform = `translate(${x}px, ${y}px)`;
  }

  // Drag left/right to pick a ratio; a plain click moves to the next one.
  let dragging = false, moved = false, downX = 0, picked = ri;
  const indexAt = x => Math.min(ratios.length - 1, Math.max(0, Math.floor(x / W * ratios.length)));
  canvas.addEventListener('pointerdown', e => {
    dragging = true; moved = false; downX = e.clientX; picked = ri;
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener('pointermove', e => {
    if (!dragging || Math.abs(e.clientX - downX) < 8) return;
    moved = true;
    const i = indexAt(e.clientX - canvas.getBoundingClientRect().left);
    if (i !== picked) { picked = i; setChip(picked); sfx.notch(); }
  });
  canvas.addEventListener('pointerup', () => {
    if (!dragging) return;
    dragging = false;
    start(moved ? picked : ri + 1, true);
  });
  canvas.addEventListener('pointercancel', () => { dragging = false; setChip(); });

  new MutationObserver(() => { readInk(); redraw(); })
    .observe(root, { attributes: true, attributeFilter: ['data-theme'] });
  if ('IntersectionObserver' in window)
    new IntersectionObserver(([en]) => (visible = en.isIntersecting)).observe(canvas);
  addEventListener('resize', () => { clearTimeout(resize.t); resize.t = setTimeout(resize, 150); });

  readInk(); resize(); start(1, false);
  requestAnimationFrame(frame);
})();
