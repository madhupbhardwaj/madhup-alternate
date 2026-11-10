/* =========================================================
   madhup.  — small bits of behaviour, no libraries.
   ========================================================= */
const root = document.documentElement;
const $ = id => document.getElementById(id);   // pages share this script; parts skip themselves if their elements aren't on the page
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const store = {
  get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} },
};

/* ---------- Theme ---------- */
if (!root.dataset.theme) {
  root.dataset.theme = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}
$('themeBtn')?.addEventListener('click', () => {
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

  // Browsers only allow sound after the visitor clicks, taps or presses a key
  // (scrolling doesn't count). We set the engine up straight away anyway, so
  // that browsers which already allow sound for this site play it from the
  // very first keystroke, and resume it on the first real interaction otherwise.
  function unlock() {
    if (ctx) { if (ctx.state !== 'running') ctx.resume().catch(() => {}); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    try { ctx = new AC(); } catch (e) { return; }
    if (ctx.state !== 'running') ctx.resume().catch(() => {});

    // white noise, reused for key taps
    noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = noise.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;

    // master: bus -> compressor -> volume -> speakers, plus a reverb send
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -20; comp.ratio.value = 4;
    const master = ctx.createGain(); master.gain.value = 1.35;
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
  // every kind of interaction that browsers accept as "the visitor did something"
  ['pointerdown', 'pointerup', 'mousedown', 'keydown', 'touchstart', 'touchend', 'click'].forEach(e =>
    addEventListener(e, unlock, { passive: true, capture: true }));
  unlock();   // try right away

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
      burst({ freq: 4200, q: 3, dur: 0.012, gain: 0.02 });
    },
    // hover over items: a soft rising "bloop" sitting on a muted key thock.
    // `step` walks up a five-note scale, so moving down a list plays a little tune.
    bubble(step = 0, soft = false) {
      if (!ready()) return;
      const now = performance.now();
      if (now - (this._lastBubble || 0) < 45) return;   // no machine-gunning
      this._lastBubble = now;
      const scale = [523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1174.66, 1318.5];
      const f = scale[((step % scale.length) + scale.length) % scale.length];
      const k = soft ? 0.55 : 1;
      tone(f * 0.62, { to: f, dur: 0.09, gain: 0.055 * k });          // bloop
      burst({ freq: 520, q: 1.2, dur: 0.035, gain: 0.07 * k, type: 'lowpass' }); // thock
      burst({ freq: 2600, q: 3, dur: 0.01, gain: 0.015 * k });        // tiny key click
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
    // rustle: a handful of tiny filtered-noise grains, like brushing through leaves.
    // `level` (0..1) follows how fast the cursor moves: faster = louder, denser, brighter.
    rustle(level) {
      if (!ready() || level <= 0.02) return;
      const grains = 1 + Math.round(level * 4);
      for (let i = 0; i < grains; i++) {
        burst({
          freq: 1600 + Math.random() * (2500 + level * 3500),
          q: 0.7 + Math.random() * 1.6,
          dur: 0.012 + Math.random() * 0.035,
          gain: (0.02 + Math.random() * 0.045) * level,
        });
      }
      // now and then a softer, lower swish under the crackle
      if (Math.random() < 0.25 + level * 0.4)
        burst({ freq: 650 + Math.random() * 500, q: 0.8, dur: 0.07 + Math.random() * 0.06, gain: 0.04 * level });
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
// Avatar speech bubble: says "hi :)" on hover/tap, and types out answers to questions.
const avatarTalk = (() => {
  const av = $('avatar');
  if (!av) return { answer() {}, hide() {}, isAnswering: () => false };
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
  const btn = $('askBtn');
  if (!btn) return;
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

// Bubble-thock when the cursor moves onto an item. Each list plays its own rising scale.
[['.projects a', 0], ['.pill', 2], ['.nav-links a', 4]].forEach(([sel, base]) =>
  document.querySelectorAll(sel).forEach((el, i) =>
    el.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') sfx.bubble(base + i); })));
// question chips are created later, so listen on their container
$('questions')?.addEventListener('pointerover', e => {
  const q = e.target.closest('.q');
  if (!q || e.pointerType !== 'mouse' || q.contains(e.relatedTarget)) return;
  sfx.bubble(3 + [...q.parentNode.children].indexOf(q));
});

// On phones there's no hover, so project rows give a softer bubble as they scroll past the middle of the screen.
if (matchMedia('(hover: none)').matches && 'IntersectionObserver' in window) {
  let touched = false;
  addEventListener('touchstart', () => (touched = true), { passive: true, once: true });
  const rows = [...document.querySelectorAll('.projects li')];
  const mid = new IntersectionObserver(entries => entries.forEach(en => {
    if (en.isIntersecting && touched) sfx.bubble(rows.indexOf(en.target), true);
  }), { rootMargin: '-50% 0px -50% 0px' });
  rows.forEach(r => mid.observe(r));
}

// Sound toggle (nav icon + footer text)
const soundText = document.getElementById('soundText');
function syncSoundLabel() { if (soundText) soundText.textContent = root.dataset.sound === 'off' ? 'sound off' : 'sound on'; }
function toggleSound() {
  sfx.unlock();
  const off = root.dataset.sound !== 'off';
  if (off) { sfx.chime(false); root.dataset.sound = 'off'; }
  else { delete root.dataset.sound; sfx.chime(true); }
  store.set('sound', off ? 'off' : 'on');
  syncSoundLabel();
}
$('soundBtn')?.addEventListener('click', toggleSound);
soundText?.addEventListener('click', toggleSound);
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

/* ---------- Welcome screen ----------
   First visit only. Browsers won't play any sound until the visitor clicks,
   taps or presses a key, so this screen asks for exactly that, then lets the
   page start typing with sound. Returning visitors never see it. */
const entered = new Promise(resolve => {
  const screen = $('welcome');
  if (!screen) return resolve();                // pages without a welcome screen
  if ('welcomed' in root.dataset) { screen.remove(); return resolve(); }
  // a second copy of the face, with its own clip-path ids, so its eyes can move too
  const face = document.getElementById('face').cloneNode(true);
  face.id = 'faceWelcome';
  face.setAttribute('aria-hidden', 'true');
  face.querySelectorAll('clipPath').forEach(cp => {
    const old = cp.id; cp.id = 'w' + old;
    face.querySelectorAll(`[clip-path="url(#${old})"]`).forEach(el => el.setAttribute('clip-path', `url(#w${old})`));
  });
  document.getElementById('wAvatar').appendChild(face);
  trackEyes(face);
  // the greeting types itself out (silently: sound isn't allowed yet)
  const wText = document.getElementById('wText');
  setTimeout(() => typeInto(wText, 'hi! welcome to my portfolio', { speed: 45 }), 700);
  screen.focus({ preventScroll: true });

  let done = false;
  function enter(e) {
    if (done) return;
    if (e.type === 'keydown' && ['Tab', 'Shift', 'Alt', 'Control', 'Meta'].includes(e.key)) return;
    done = true;
    sfx.unlock();
    store.set('welcomed', '1');
    setTimeout(() => sfx.hi(), 150);   // give the audio engine a moment to wake up
    screen.classList.add('leaving');
    setTimeout(() => { root.dataset.welcomed = ''; screen.remove(); resolve(); }, reduceMotion ? 0 : 480);
  }
  screen.addEventListener('click', enter);
  screen.addEventListener('keydown', enter);
});

// Hero subtitle
const typed = $('typed');
if (typed) entered.then(() => setTimeout(() => typeInto(typed, typed.dataset.text, { speed: 60 }), 350));

// Click (or tap) the name to retype the subtitle
$('nameBtn')?.addEventListener('click', () => retype(typed, 60));

// Section headings type themselves in as they scroll into view
const heads = document.querySelectorAll('[data-type]');
heads.forEach(h => { h.dataset.text = h.textContent; h.setAttribute('aria-label', h.textContent); if (!reduceMotion) h.textContent = ''; });
if (!reduceMotion && 'IntersectionObserver' in window) {
  const io = new IntersectionObserver(entries => entries.forEach(en => {
    if (!en.isIntersecting) return;
    io.unobserve(en.target);
    typeInto(en.target, en.target.dataset.text, { speed: 70 });
  }), { rootMargin: '0px 0px -15% 0px' });
  entered.then(() => heads.forEach(h => io.observe(h)));   // start after the welcome screen
} else {
  heads.forEach(h => (h.textContent = h.dataset.text));
}
// Rest the cursor on a heading for 0.75 seconds (or tap it on a phone) to watch it type again
const HOVER_DELAY = 750;
heads.forEach(h => {
  let hoverTimer;
  h.addEventListener('pointerenter', e => {
    if (e.pointerType !== 'mouse') return;
    clearTimeout(hoverTimer);
    hoverTimer = setTimeout(() => retype(h, 70), HOVER_DELAY);
  });
  h.addEventListener('pointerleave', () => clearTimeout(hoverTimer));
  h.addEventListener('click', () => retype(h, 70));   // taps on phones (scroll-drags don't count)
});

/* ---------- Eyes follow the cursor ----------
   Each pupil looks toward the pointer on its own (so they converge a little
   when it's close), eases there smoothly, looks down when the pointer is below,
   drifts back to the middle when idle, and blinks now and then. */
function trackEyes(face) {
  const eyes = [...face.querySelectorAll('.eye')].map(g => ({
    cx: +g.dataset.cx, cy: +g.dataset.cy,
    pupil: g.querySelector('.pupil'), glint: g.querySelector('.glint'),
    lid: g.querySelector('.lid'), open: g.querySelector('.lid').dataset.open,
    x: 0, y: 0, tx: 0, ty: 0,
  }));
  // how far a pupil may travel (SVG units) inside the almond
  const RX = 3.6, UP = 1.2, DOWN = 2.3;
  const touchOnly = matchMedia('(hover: none)').matches;
  const pointer = { x: 0, y: 0, active: false, last: 0 };
  let visible = true, running = false;

  function aim(e) { pointer.x = e.clientX; pointer.y = e.clientY; pointer.active = true; pointer.last = performance.now(); kick(); }
  addEventListener('pointermove', aim, { passive: true });
  addEventListener('pointerdown', aim, { passive: true });
  document.addEventListener('mouseout', e => { if (!e.relatedTarget) { pointer.active = false; kick(); } });
  addEventListener('blur', () => { pointer.active = false; kick(); });
  addEventListener('scroll', kick, { passive: true });   // the face moves under a still cursor

  function targets() {
    const m = face.getScreenCTM();
    const idle = performance.now() - pointer.last > (touchOnly ? 2500 : 6000);
    for (const e of eyes) {
      if (!m || !pointer.active || idle) { e.tx = 0; e.ty = 0; continue; }
      const sx = m.a * e.cx + m.c * e.cy + m.e, sy = m.b * e.cx + m.d * e.cy + m.f;
      const dx = pointer.x - sx, dy = pointer.y - sy, d = Math.hypot(dx, dy) || 1;
      const reach = Math.min(1, d / 160);                 // close to the face = look nearly straight
      e.tx = (dx / d) * reach * RX;
      e.ty = (dy / d) * reach * (dy > 0 ? DOWN : UP);
    }
    return idle;
  }
  function frame() {
    const idle = targets();
    let moving = false;
    for (const e of eyes) {
      e.x += (e.tx - e.x) * 0.16; e.y += (e.ty - e.y) * 0.16;
      if (Math.abs(e.tx - e.x) > 0.01 || Math.abs(e.ty - e.y) > 0.01) moving = true;
      e.pupil.setAttribute('transform', `translate(${e.x.toFixed(2)} ${e.y.toFixed(2)})`);
      e.glint.setAttribute('transform', `translate(${(e.x * 0.85).toFixed(2)} ${(e.y * 0.85).toFixed(2)})`);
    }
    // keep going while easing, or while a pointer is around (so the idle drift-back can kick in)
    if (visible && (moving || (pointer.active && !idle))) requestAnimationFrame(frame); else running = false;
  }
  function kick() { if (!running && visible && !reduceMotion) { running = true; requestAnimationFrame(frame); } }

  if ('IntersectionObserver' in window)
    new IntersectionObserver(([en]) => { visible = en.isIntersecting; kick(); }).observe(face);

  // blinking: the upper lid sweeps down while the pupil squashes, then back
  function blink() {
    const closed = e => e.open.replace(/Q(\d+(?:\.\d+)?) (\d+(?:\.\d+)?)/, (_, x, y) => `Q${x} ${(+y + 9).toFixed(1)}`);
    eyes.forEach(e => { e.lid.setAttribute('d', closed(e)); e.pupil.style.opacity = e.glint.style.opacity = 0; });
    setTimeout(() => eyes.forEach(e => { e.lid.setAttribute('d', e.open); e.pupil.style.opacity = e.glint.style.opacity = ''; }), 120);
  }
  if (!reduceMotion) (function schedule() {
    setTimeout(() => {
      if (visible && !document.hidden) { blink(); if (Math.random() < 0.2) setTimeout(blink, 260); }
      schedule();
    }, 2800 + Math.random() * 4200);
  })();
}
if ($('face')) trackEyes($('face'));

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
if (clock) { tick(); setInterval(tick, 15000); }
if ($('year')) $('year').textContent = new Date().getFullYear();

/* ---------- Tall grass banner ----------
   Thin ink blades sway in a gentle breeze. Moving the cursor (or a finger)
   through them pushes them aside, and they rustle: the faster you move,
   the louder and brighter the rustle. */
(() => {
  const canvas = $('field');
  if (!canvas) return;
  const g = canvas.getContext('2d');
  let W = 0, H = 0, dpr = 1, blades = [], visible = true, t = 0, last = 0;
  let ink = '#8a8a84', inkDark = '#3d3d39';
  const pointer = { x: -999, y: -999, vx: 0, speed: 0, inside: false, lastMove: 0 };

  function readInk() {
    const cs = getComputedStyle(root);
    ink = cs.getPropertyValue('--muted').trim() || ink;
    inkDark = cs.getPropertyValue('--text').trim() || inkDark;
  }
  function makeBlades() {
    const n = Math.round(W / 3.6);
    blades = Array.from({ length: n }, (_, i) => {
      const x = (i + Math.random() * 0.9) * (W / n);
      return {
        x,
        h: H * (0.32 + Math.random() * 0.5) * (0.85 + 0.15 * Math.sin(x / W * 6.3 + 1)),  // gentle hills of height
        lean: (Math.random() - 0.5) * 0.25,     // natural resting tilt
        stiff: 0.06 + Math.random() * 0.05,     // spring back strength
        phase: Math.random() * Math.PI * 2,
        a: 0, v: 0,                             // bend angle and its speed
        w: 0.7 + Math.random() * 0.8,
        dark: Math.random() < 0.28,
      };
    });
  }
  function resize() {
    dpr = Math.min(devicePixelRatio || 1, 2);
    const r = canvas.getBoundingClientRect();
    W = r.width; H = r.height;
    canvas.width = W * dpr; canvas.height = H * dpr;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    makeBlades(); draw();
  }

  function step(dt) {
    t += dt;
    const k = Math.min(dt * 60, 3);              // frame-rate independent
    for (const b of blades) {
      // breeze: slow travelling waves across the field
      const wind = 0.07 * Math.sin(t * 0.9 + b.x * 0.012 + b.phase * 0.3) + 0.04 * Math.sin(t * 2.1 + b.x * 0.03);
      let force = (wind + b.lean - b.a) * b.stiff;
      // the cursor pushes blades it passes through, in the direction it's moving
      if (pointer.inside) {
        const dx = b.x - pointer.x, tipY = H - b.h;
        if (Math.abs(dx) < 34 && pointer.y > tipY - 10) {
          const near = 1 - Math.abs(dx) / 34;
          force += pointer.vx * 0.0025 * near + Math.sign(dx || 1) * 0.02 * near;
        }
      }
      b.v = (b.v + force * k) * Math.pow(0.9, k);
      b.a = Math.max(-1.1, Math.min(1.1, b.a + b.v * k));
    }
  }
  function draw() {
    g.clearRect(0, 0, W, H);
    g.lineCap = 'round';
    for (const pass of [false, true]) {          // light blades behind, darker ones in front
      g.strokeStyle = pass ? inkDark : ink;
      g.globalAlpha = pass ? 0.75 : 0.9;
      for (const b of blades) {
        if (b.dark !== pass) continue;
        const tipX = b.x + Math.sin(b.a) * b.h, tipY = H - Math.cos(b.a) * b.h;
        const midX = b.x + Math.sin(b.a * 0.45) * b.h * 0.55, midY = H - b.h * 0.55;
        g.lineWidth = b.w;
        g.beginPath(); g.moveTo(b.x, H + 2); g.quadraticCurveTo(midX, midY, tipX, tipY); g.stroke();
      }
    }
    g.globalAlpha = 1;
  }
  function frame(now) {
    const dt = Math.min((now - (last || now)) / 1000, 0.05); last = now;
    if (visible) {
      if (now - pointer.lastMove > 60) { pointer.vx *= 0.8; pointer.speed *= 0.8; }
      step(dt); draw();
    }
    requestAnimationFrame(frame);
  }

  // cursor / finger tracking + rustle sound
  let prev = null, lastRustle = 0;
  function move(e) {
    const r = canvas.getBoundingClientRect(), now = performance.now();
    const x = e.clientX - r.left, y = e.clientY - r.top;
    if (prev) {
      const dt = Math.max(now - prev.t, 8);
      pointer.vx = (x - prev.x) / dt * 16;      // px per frame-ish
      pointer.speed = Math.hypot(x - prev.x, y - prev.y) / dt;   // px per ms
    }
    prev = { x, y, t: now };
    Object.assign(pointer, { x, y, inside: true, lastMove: now });
    // only rustle when actually moving through the grass (below the tallest tips)
    const inGrass = y > H * 0.15;
    if (inGrass && now - lastRustle > 28) {
      lastRustle = now;
      sfx.rustle(Math.min(1, pointer.speed / 1.4));
    }
  }
  canvas.addEventListener('pointermove', move);
  canvas.addEventListener('pointerdown', e => { prev = null; move(e); });
  canvas.addEventListener('pointerleave', () => { pointer.inside = false; prev = null; });
  canvas.addEventListener('pointercancel', () => { pointer.inside = false; prev = null; });

  new MutationObserver(() => { readInk(); draw(); })
    .observe(root, { attributes: true, attributeFilter: ['data-theme'] });
  if ('IntersectionObserver' in window)
    new IntersectionObserver(([en]) => (visible = en.isIntersecting)).observe(canvas);
  addEventListener('resize', () => { clearTimeout(resize.t); resize.t = setTimeout(resize, 150); });

  readInk(); resize();
  if (reduceMotion) { draw(); return; }        // still grass, no animation
  requestAnimationFrame(frame);
})();
