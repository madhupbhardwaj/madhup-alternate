/* =========================================================
   terminal.js — a tiny macOS-style terminal for the site.
   To add a command, add an entry to COMMANDS below:
     name: { help: 'one line shown in `help`', run: args => 'output' }
   `run` returns text (or HTML when it builds links with link()).
   ========================================================= */
(() => {
  const out = document.getElementById('termOut');
  const input = document.getElementById('termIn');
  const body = document.getElementById('termBody');
  const term = document.getElementById('term');
  const LOST = term?.dataset.intro === '404';   // the 404 page's terminal opens differently
  if (!out || !input) return;

  // ---------- messages ----------
  // Paste your Web3Forms access key here (free: web3forms.com → enter your email → the key arrives by email).
  // It's safe to be public: it can only send messages to your inbox.
  const WEB3FORMS_KEY = '3ca3873a-9eb3-4e60-8c3a-58e2b397d6ca';

  // ---------- content (only things Madhup has said about himself) ----------
  const PROJECTS = [
    { name: 'problemset',   url: 'https://problemset.in',                desc: 'practice problems, sorted by topic: number theory to calculus.' },
    { name: 'problemslate', url: 'https://problemslate.vercel.app',      desc: 'a focused, pen-first whiteboard for macos and windows.' },
    { name: 'mypapers',     url: 'https://mypapers-madhup.vercel.app',   desc: 'papers, proofs, and ideas: my mathematical writing.' },
    { name: 'classroll',    url: 'https://classroll-sigma.vercel.app',   desc: 'attendance without the paper trail. scan a qr, enter your pin, done.' },
    { name: 'tenbars',      url: 'https://tenbars.vercel.app',           desc: 'find tv series and rate every episode out of ten.' },
  ];
  const BOOKS = [
    ['calculus made easy', 'silvanus p. thompson'],
    ['proofs', 'jay cummings'],
    ['the almanack of naval ravikant', 'eric jorgenson'],
  ];
  const LINKS = {
    github: 'https://github.com/madhupbhardwaj',
    linkedin: 'https://www.linkedin.com/in/madhup-bhardwaj/',
  };
  const TEXT = {
    about: "i'm madhup, a high school student in india who loves mathematics.\ni build small tools around how i learn, and share the ideas along the way.\nstill learning, always building.",
    now: "jee 2028 is the big one right now.\nbuilding things is the passion that runs alongside it.",
    whymath: "it's the most logical thing there is. everything is rigorous, and if you're\nbrave enough, you can derive it yourself. it doesn't always show up in real\nlife, but i'm here for the love of the game.",
  };

  // ---------- helpers ----------
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const link = (label, url) => `<a href="${url}" target="_blank" rel="noopener">${esc(label)}</a>`;
  const pad = (s, n) => s + ' '.repeat(Math.max(1, n - s.length));
  const html = s => ({ html: s });                      // mark output as already-safe HTML
  const go = (url, newTab) => setTimeout(() => newTab ? window.open(url, '_blank', 'noopener') : (location.href = url), 250);
  const findProject = q => PROJECTS.find(p => p.name === q) || PROJECTS.find(p => q && p.name.startsWith(q));

  const FILES = {
    'about.txt': () => TEXT.about,
    'now.txt': () => TEXT.now,
    'why-math.txt': () => TEXT.whymath,
    'books.txt': () => COMMANDS.books.run(),
    'contact.txt': () => COMMANDS.contact.run(),
  };

  // ---------- commands ----------
  const COMMANDS = {
    help: { help: 'show this list', run: () => html(
      '<span class="hl">things you can type:</span>\n\n' +
      Object.entries(COMMANDS).filter(([, c]) => c.help)
        .map(([n, c]) => `  <span class="g">${esc(pad(n + (c.args ? ' ' + c.args : ''), 21))}</span><span class="dim">${esc(c.help)}</span>`).join('\n') +
      '\n\n<span class="dim">tip: tab completes, ↑ ↓ scroll through history, ctrl+l clears.</span>') },
    about:    { help: 'who i am',                     run: () => TEXT.about },
    projects: { help: 'things i have built',          run: () => html(
      PROJECTS.map(p => `  <span class="b">${pad(p.name, 14)}</span>${esc(p.desc)}`).join('\n') +
      '\n\n<span class="dim">type</span> open &lt;name&gt; <span class="dim">to visit one, e.g.</span> open problemset\n' +
      '<span class="dim">proudest of:</span> problemset.in, no contest.') },
    open:     { help: 'open a project or link', args: '<name>', run: ([q]) => {
      if (!q) return html('usage: open &lt;name&gt;   <span class="dim">(' + PROJECTS.map(p => p.name).concat(Object.keys(LINKS)).join(', ') + ')</span>');
      const p = findProject(q.toLowerCase());
      const url = p ? p.url : LINKS[q.toLowerCase()];
      if (!url) return html(`<span class="err">open: no project called "${esc(q)}".</span> <span class="dim">try</span> projects`);
      go(url, true);
      return html(`opening ${link(p ? p.name : q, url)} in a new tab…`);
    } },
    books:    { help: "what's on my shelf",           run: () => html(
      BOOKS.map(([t, a]) => `  <span class="y">${pad(t, 32)}</span><span class="dim">${esc(a)}</span>`).join('\n') +
      '\n\n<span class="dim">the one that changed how i think:</span> the almanack of naval ravikant.') },
    contact:  { help: 'how to reach me',              run: () => html(
      `  linkedin   ${link('linkedin.com/in/madhup-bhardwaj', LINKS.linkedin)}\n  github     ${link('github.com/madhupbhardwaj', LINKS.github)}`) },
    github:   { help: 'open my github',               run: () => { go(LINKS.github, true); return html(`opening ${link('github', LINKS.github)}…`); } },
    linkedin: { help: 'open my linkedin',             run: () => { go(LINKS.linkedin, true); return html(`opening ${link('linkedin', LINKS.linkedin)}…`); } },
    ls:       { help: 'list files',                   run: () => html(Object.keys(FILES).map(f => `<span class="b">${f}</span>`).join('   ')) },
    cat:      { help: 'read a file', args: '<file>',  run: ([f]) => {
      if (!f) return 'usage: cat <file>   (try ls)';
      const file = FILES[f] || FILES[f + '.txt'];
      return file ? file() : html(`<span class="err">cat: ${esc(f)}: no such file or directory</span>`);
    } },
    date:     { help: 'my time in india',             run: () =>
      new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata', weekday: 'long', hour: 'numeric', minute: '2-digit', day: 'numeric', month: 'long' }).toLowerCase() + ' (india)' },
    echo:     { help: 'repeat after you', args: '<text>', run: args => args.join(' ') },
    theme:    { help: 'switch light / dark', args: '[light|dark]', run: ([m]) => {
      const next = m === 'light' || m === 'dark' ? m : (root.dataset.theme === 'dark' ? 'light' : 'dark');
      root.dataset.theme = next; store.set('theme', next);
      return `theme: ${next}`;
    } },
    sound:    { help: 'turn sounds on / off', args: '[on|off]', run: ([m]) => {
      const wantOff = m === 'off' || (m !== 'on' && root.dataset.sound !== 'off');
      if (wantOff !== (root.dataset.sound === 'off')) toggleSound();
      return `sound: ${root.dataset.sound === 'off' ? 'off' : 'on'}`;
    } },
    volume:   { help: 'set sound volume', args: '[0-10]', run: ([v]) => {
      if (v === undefined) return `volume: ${sfx.volume}/10`;
      const n = parseInt(v, 10);
      if (isNaN(n) || n < 0 || n > 10) return html('<span class="err">volume: give a number from 0 to 10</span>');
      sfx.setVolume(n); syncVolume();
      if (n > 0) sfx.bubble(n - 1);
      return `volume: ${n}/10`;
    } },
    git:      { help: 'my latest commits', args: 'log', run: ([sub]) => {
      if (sub !== 'log') return html('usage: <span class="g">git log</span> <span class="dim">(shows what i pushed to github lately)</span>');
      gitLog(); return null;
    } },
    message:  { help: 'send me a message',          run: () => { startMessage(); return null; } },
    clear:    { help: 'clear the screen',             run: () => { out.innerHTML = ''; return null; } },
    me:       { help: 'go to the "me" page',          run: () => { go('/me'); return 'going to /me…'; } },
    home:     { help: 'back to the main page',        run: () => { go('/'); return 'going home…'; } },
    exit:     { run: () => { go('/'); return html('<span class="dim">[process completed]</span>'); } },
    // a few easter eggs (not listed in help)
    whoami:   { run: () => html("visitor. i'm madhup. try <span class=\"g\">about</span>.") },
    hi:       { run: () => 'hi! :)' },
    hello:    { run: () => 'hello! :)' },
    sudo:     { run: () => html('<span class="err">visitor is not in the sudoers file. this incident will be reported.</span>') },
    cd:       { run: ([d = '~']) => {
      const where = d.replace(/^\/+|\/+$/g, '').toLowerCase();
      const places = { '': '/', '~': '/', home: '/', me: '/me', projects: '/projects', about: '/about', reading: '/reading', terminal: '/terminal' };
      if (where in places) {
        if (!LOST && (where === 'terminal' || where === '~' || where === '')) return '';   // already here
        go(places[where]); return `going to ${places[where]}…`;
      }
      return html(`<span class="err">cd: no such directory: ${esc(d)}</span> <span class="dim">(try</span> cd me<span class="dim">,</span> cd projects <span class="dim">or</span> cd ~<span class="dim">)</span>`);
    } },
    pwd:      { run: () => '/users/visitor/madhup' },
    vim:      { run: () => "you're safe. there's no vim here, so no need to work out how to quit it." },
    rm:       { run: () => html('<span class="err">rm: nice try.</span>') },
  };
  // a few friendly aliases
  Object.assign(COMMANDS, { reading: { run: COMMANDS.books.run }, socials: { run: COMMANDS.contact.run }, ll: { run: COMMANDS.ls.run }, cls: { run: COMMANDS.clear.run } });

  // ---------- printing ----------
  function print(content, cls) {
    if (content === null || content === undefined || content === '') return;
    const line = document.createElement('div');
    line.className = 'term-line' + (cls ? ' ' + cls : '');
    if (typeof content === 'object' && 'html' in content) line.innerHTML = content.html;
    else line.textContent = content;
    out.appendChild(line);
  }
  const promptHTML = '<span class="prompt"><span class="p-user">visitor@madhup</span> <span class="p-path">~</span> %</span> ';
  const scrollDown = () => { body.scrollTop = body.scrollHeight; };

  // ---------- running a command ----------
  const past = [];
  let cursor = 0;
  function run(raw) {
    if (flow) return flowInput(raw);
    const line = raw.trim();
    print(html(promptHTML + esc(raw)));
    if (line) { past.push(line); }
    cursor = past.length;
    if (!line) return scrollDown();
    const [name, ...args] = line.split(/\s+/);
    const cmd = COMMANDS[name.toLowerCase()];
    if (cmd) {
      try { print(cmd.run(args)); } catch (e) { print(html('<span class="err">something went wrong running that.</span>')); }
    } else {
      print(html(`<span class="err">zsh: command not found: ${esc(name)}</span>\n<span class="dim">type</span> help <span class="dim">to see what you can do.</span>`));
    }
    print(' ');
    scrollDown();
  }

  // ---------- "message": asks for name, email and message, then emails it to Madhup ----------
  let flow = null;
  const promptEl = document.querySelector('.term-input-line .prompt');
  const homePrompt = promptEl ? promptEl.innerHTML : '';
  const STEPS = [
    { key: 'name',    ask: 'your name',                       max: 80 },
    { key: 'email',   ask: 'your email (optional, so i can reply)', max: 120, optional: true },
    { key: 'message', ask: 'your message',                    max: 2000 },
    { key: 'confirm', ask: 'send it? (y/n)',                  max: 3 },
  ];
  const currentPrompt = () => flow ? `<span class="prompt"><span class="y">${esc(STEPS[flow.step].key)}</span> <span class="dim">›</span></span> ` : promptHTML;
  function setPrompt() { if (promptEl) promptEl.innerHTML = flow ? currentPrompt().replace(/^<span class="prompt">|<\/span> $/g, '') : homePrompt; }
  function ask() { print(html(`<span class="dim">${esc(STEPS[flow.step].ask)}:</span>`)); setPrompt(); scrollDown(); }
  function endFlow() { flow = null; setPrompt(); }
  function startMessage() {
    const last = +store.get('lastMessageAt') || 0;
    if (Date.now() - last < 60000) { print(html('<span class="dim">you just sent one. give it a minute and try again.</span>')); return; }
    flow = { step: 0, data: {} };
    print(html('<span class="hl">send me a message.</span> <span class="dim">it goes straight to my inbox. press ctrl+c to cancel.</span>'));
    print(' ');
    ask();
  }
  function flowInput(raw) {
    const s = STEPS[flow.step], v = raw.trim();
    print(html(currentPrompt() + esc(raw)));
    if (s.key === 'confirm') {
      if (/^y(es)?$/i.test(v)) { send(flow.data); endFlow(); return; }
      if (/^n(o)?$/i.test(v)) { endFlow(); print(html('<span class="dim">okay, not sent.</span>')); print(' '); return scrollDown(); }
      print(html('<span class="dim">type y or n.</span>')); return scrollDown();
    }
    if (!v && !s.optional) { print(html(`<span class="err">${esc(s.key)} can't be empty.</span>`)); return ask(); }
    if (v.length > s.max) { print(html(`<span class="err">that's a bit long (max ${s.max} characters).</span>`)); return ask(); }
    if (s.key === 'email' && v && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) { print(html('<span class="err">that doesn\'t look like an email. leave it empty to skip.</span>')); return ask(); }
    flow.data[s.key] = v;
    flow.step++;
    if (STEPS[flow.step].key === 'confirm') {
      const d = flow.data;
      print(' ');
      print(html(`<span class="dim">from:</span>    ${esc(d.name)}${d.email ? ' <span class="dim">&lt;' + esc(d.email) + '&gt;</span>' : ''}\n<span class="dim">message:</span> ${esc(d.message)}`));
      print(' ');
    }
    ask();
  }
  async function send(d) {
    if (!WEB3FORMS_KEY || WEB3FORMS_KEY.startsWith('YOUR-')) {
      print(html('<span class="err">messages aren\'t switched on yet.</span> <span class="dim">for now, reach me on</span> ' + link('linkedin', LINKS.linkedin) + '<span class="dim">.</span>'));
      print(' '); return scrollDown();
    }
    const line = document.createElement('div'); line.className = 'term-line dim'; line.textContent = 'sending'; out.appendChild(line); scrollDown();
    const dots = setInterval(() => { line.textContent = line.textContent.length > 10 ? 'sending' : line.textContent + '.'; }, 300);
    try {
      const res = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          access_key: WEB3FORMS_KEY,
          subject: `new message from ${d.name} (portfolio terminal)`,
          from_name: 'madhup. terminal',
          name: d.name, email: d.email || 'not given', message: d.message,
          page: location.href, botcheck: false,
        }),
      });
      const json = await res.json().catch(() => ({}));
      clearInterval(dots);
      if (res.ok && json.success !== false) {
        store.set('lastMessageAt', String(Date.now()));
        line.className = 'term-line'; line.innerHTML = '<span class="g">✓ sent.</span> thanks for writing, i\'ll read it soon.';
        sfx.chime(true);
      } else {
        line.className = 'term-line'; line.innerHTML = '<span class="err">couldn\'t send that right now.</span> <span class="dim">try again later, or reach me on</span> ' + link('linkedin', LINKS.linkedin) + '<span class="dim">.</span>'
          + (json.message ? `\n<span class="dim">(${esc(String(json.message).slice(0, 160))})</span>` : `\n<span class="dim">(error ${res.status})</span>`);
      }
    } catch (e) {
      clearInterval(dots);
      line.className = 'term-line'; line.innerHTML = '<span class="err">no connection, so it didn\'t send.</span> <span class="dim">try again in a bit.</span>';
    }
    print(' '); scrollDown();
  }

  // ---------- git log: latest public pushes, straight from GitHub ----------
  const ago = iso => {
    const s = (Date.now() - new Date(iso)) / 1000;
    for (const [u, n] of [['year', 31536000], ['month', 2592000], ['day', 86400], ['hour', 3600], ['minute', 60]])
      if (s >= n) { const v = Math.floor(s / n); return `${v} ${u}${v > 1 ? 's' : ''} ago`; }
    return 'just now';
  };
  async function gitLog() {
    const line = document.createElement('div'); line.className = 'term-line dim'; line.textContent = 'fetching from github…';
    out.appendChild(line); scrollDown();
    const GH = 'https://api.github.com', USER = 'madhupbhardwaj', CK = 'gh-log';
    try {
      let rows;
      const cached = JSON.parse(sessionStorage.getItem(CK) || 'null');
      if (cached && Date.now() - cached.t < 600e3) rows = cached.rows;
      else {
        const res = await fetch(`${GH}/users/${USER}/events/public?per_page=40`);
        if (!res.ok) throw new Error(res.status === 403 ? 'github says: too many requests for now' : 'github error ' + res.status);
        const events = await res.json();
        const pushes = events.filter(e => e.type === 'PushEvent').slice(0, 8);
        rows = await Promise.all(pushes.map(async e => {
          const repo = e.repo.name.split('/')[1], branch = (e.payload.ref || '').replace('refs/heads/', '');
          let sha = e.payload.head || '', msg = '';
          const commits = e.payload.commits;
          if (commits && commits.length) { const c = commits[commits.length - 1]; sha = c.sha; msg = c.message; }
          else if (sha) {   // newer API payloads leave commit messages out, so ask for this one
            try { const r = await fetch(`${GH}/repos/${e.repo.name}/commits/${sha}`); if (r.ok) msg = (await r.json()).commit.message; } catch (err) {}
          }
          return { sha: sha.slice(0, 7), repo, branch, msg: (msg || '(pushed)').split('\n')[0], when: e.created_at };
        }));
        try { sessionStorage.setItem(CK, JSON.stringify({ t: Date.now(), rows })); } catch (err) {}
      }
      if (!rows.length) { line.textContent = 'no public pushes lately.'; }
      else {
        line.className = 'term-line';
        line.innerHTML = rows.map(r =>
          `<span class="y">${esc(r.sha)}</span> <span class="b">(${esc(r.repo)}${r.branch && r.branch !== 'main' ? ':' + esc(r.branch) : ''})</span> ${esc(r.msg.slice(0, 72))} <span class="dim">· ${esc(ago(r.when))}</span>`
        ).join('\n') + `\n\n<span class="dim">more on</span> ${link('github.com/' + USER, 'https://github.com/' + USER)}`;
      }
    } catch (err) {
      line.className = 'term-line';
      line.innerHTML = `<span class="err">git log: couldn't reach github.</span> <span class="dim">(${esc(err.message || 'offline')})</span>`;
    }
    print(' '); scrollDown();
  }

  // ---------- tab completion ----------
  function complete() {
    const v = input.value, parts = v.split(/\s+/);
    let options = [], prefix = '';
    if (parts.length <= 1) {
      options = Object.keys(COMMANDS).filter(c => COMMANDS[c].help && c.startsWith(v.toLowerCase()));
    } else if (parts[0] === 'git' && parts.length === 2) {
      prefix = 'git '; options = ['log'].filter(o => o.startsWith(parts[1]));
    } else if (['open', 'cat'].includes(parts[0])) {
      prefix = parts[0] + ' ';
      const pool = parts[0] === 'open' ? PROJECTS.map(p => p.name).concat(Object.keys(LINKS)) : Object.keys(FILES);
      options = pool.filter(o => o.startsWith(parts[1].toLowerCase()));
    }
    if (options.length === 1) input.value = prefix + options[0] + (prefix ? '' : ' ');
    else if (options.length > 1) { print(html(promptHTML + esc(v))); print(options.join('   ')); scrollDown(); }
  }

  // ---------- keyboard ----------
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      sfx.thock(true);
      run(input.value); input.value = '';
      return;
    }
    if (e.key === 'Tab') { e.preventDefault(); if (!flow) complete(); sfx.thock(); return; }
    if (e.key === 'ArrowUp') { e.preventDefault(); if (!flow && cursor > 0) input.value = past[--cursor]; return; }
    if (e.key === 'ArrowDown') { e.preventDefault(); cursor = Math.min(past.length, cursor + 1); input.value = past[cursor] || ''; return; }
    if (e.ctrlKey && e.key.toLowerCase() === 'l') { e.preventDefault(); out.innerHTML = ''; return; }
    if (e.ctrlKey && e.key.toLowerCase() === 'c') {
      e.preventDefault(); print(html(currentPrompt() + esc(input.value) + '^C')); input.value = '';
      if (flow) { endFlow(); print(html('<span class="dim">message cancelled.</span>')); print(' '); }
      scrollDown(); return;
    }
  });
  // thocky key sound whenever the text changes: works for laptop keyboards and phone keyboards alike
  input.addEventListener('input', e => {
    if (e.inputType === 'insertText' || e.inputType === 'deleteContentBackward' || e.inputType === 'insertCompositionText')
      sfx.thock(e.data === ' ');
  });

  // clicking anywhere in the window focuses the prompt (unless selecting text or clicking a link)
  body.addEventListener('mouseup', e => {
    if (e.target.closest('a') || String(getSelection())) return;
    input.focus({ preventScroll: true });
  });

  // ---------- window buttons ----------
  document.getElementById('termClose')?.addEventListener('click', () => { sfx.click(); go('/'); });
  document.getElementById('termMin')?.addEventListener('click', () => { sfx.click(); term.classList.toggle('min'); });
  document.getElementById('termMax')?.addEventListener('click', () => { sfx.click(); term.classList.toggle('big'); setTimeout(updateSize, 400); });

  // title shows the window size in characters, like the real thing
  const sizeEl = document.getElementById('termSize');
  function updateSize() {
    if (!sizeEl) return;
    const probe = document.createElement('span');
    probe.textContent = 'M'; probe.style.visibility = 'hidden'; out.appendChild(probe);
    const cw = probe.getBoundingClientRect().width, lh = parseFloat(getComputedStyle(body).lineHeight) || 21;
    probe.remove();
    if (cw) sizeEl.textContent = `${Math.floor((body.clientWidth - 28) / cw)}×${Math.floor(body.clientHeight / lh)}`;
  }
  addEventListener('resize', updateSize);

  // ---------- start ----------
  if (LOST) {
    // the 404 page: show the address that didn't work, then hand over the prompt
    print(html(promptHTML + 'cd ' + esc(location.pathname)));
    print(html(`<span class="err">cd: no such page: ${esc(location.pathname)}</span>`));
    print(' ');
    print(html(promptHTML + 'ls'));
    print(html(['/', '/me', '/projects', '/terminal'].map(p => `<a href="${p}">${p === '/' ? 'home' : p.slice(1)}</a>`).join('   ')));
    print(' ');
    print(html('<span class="dim">you can type here too. try</span> <span class="g">help</span><span class="dim">, or</span> <span class="g">cd ~</span> <span class="dim">to go home.</span>'));
    print(' ');
  } else {
    const last = new Date().toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).replace(/,/g, '');
    print(html(`<span class="dim">Last login: ${esc(last)} on ttys001</span>`));
    print(html("welcome to madhup's terminal. type <span class=\"g\">help</span> to see what you can do."));
    print(' ');
    input.focus({ preventScroll: true });
  }
  updateSize();
})();
