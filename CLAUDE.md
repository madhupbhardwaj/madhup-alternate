# CLAUDE.md: context for working on this repo

Madhup Bhardwaj's personal portfolio. Madhup is a high school student in India who loves maths and builds small tools (preparing for JEE 2028). Plain HTML/CSS/JS, no framework, no build step. `README.md` has the file map and how-tos; this file holds the decisions and preferences behind them.

## Hosting and live setup
- **Main site:** https://madhupbhardwaj.vercel.app (Vercel project "madhupbhardwaj", connected to this repo's `main`). `vercel.json` gives clean URLs (`/me`, `/terminal`) and rewrites `/about`, `/projects` and `/reading` to `/`.
- **Render copy:** https://madhup.onrender.com also deploys from `main`, but a tiny script at the top of every HTML page forwards it to the same path on Vercel. Render dashboard rewrites exist for /me, /about, /projects, /reading and /terminal.
- Pushing to `main` updates both within about a minute. Always `git fetch` / `git pull --ff-only` before committing: Madhup sometimes edits files (especially `me.html`) directly on GitHub.
- Share tags and canonical links point to madhupbhardwaj.vercel.app; `og.png` (1200×630) shows that address.
- **Visitor stats:** Vercel Web Analytics, loaded from `script.js` only on `*.vercel.app` (enable it in the Vercel dashboard → Analytics).
- **Messages:** the terminal `message` command posts to Web3Forms (key `WEB3FORMS_KEY` in `terminal.js`; a public key is fine, it only emails Madhup). Free plan, 250/month. Known issue: Web3Forms' free "Advanced Spam Filter" (can't be disabled without Pro) puts messages from the vercel.app domain into its Spam tab instead of emailing them. Madhup chose to keep it as is. Alternatives offered: Resend email or Telegram via a Vercel serverless function.
- The cloud dev container can't reach Web3Forms (Cloudflare 403) or GitHub user-level APIs, so test those with mocked responses (Playwright routes).

## Design language (keep consistent)
- Ink on paper: off-white `--bg`, dotted guide lines and bands, hatch strips between sections; full dark mode via `data-theme` and `prefers-color-scheme`.
- Fonts: Instrument Serif (headings, names), Geist (body), Geist Mono (small labels), Architects Daughter (handwriting: bubbles, notes, totals).
- Everything lowercase in the site's voice. Short, casual, first person.
- Section headings type themselves in with key sounds (and retype after hovering 0.75s or tapping); the subtitle retypes when the name is clicked.

## Features already built (don't rebuild)
- First-visit **welcome screen** ("hi! welcome to my portfolio"), once per tab session (sessionStorage), because browsers block audio until the first click.
- **Sounds:** all synthesised in `script.js` (Web Audio, no files): typing thocks, bubble-thock hovers on a pentatonic scale, mallet chimes, grass rustle; master volume 0–10 (default 7) in a volume card under the speaker icon; mute.
- **Avatar:** inline SVG (`#face`) drawn as line art from Madhup's photo; eyes follow the cursor, blink, close when muted, get sleepy 11pm–6am India time (floating z's), go wide on triple click. It can be dragged and thrown and springs back. "hi :)" bubble on hover. The kurta has a mandarin collar, two-button placket and small flower prints. `avatar.svg` is the same drawing as a file. The 404 page's copy has a confused face (raised brow, wavy mouth, question marks).
- **Banner:** canvas tall grass that rustles when you move through it, lit by India time of day (morning dew, sunset, fireflies at night; preview with `?t=dawn|day|dusk|night`).
- **Projects:** hover shows a paper card with a real screenshot (`previews/*.webp`); rows grow slightly on hover (no colour change); phones show thumbnails.
- **"more about me"** questions: the `QUESTIONS` list in `script.js`; answers type into the avatar's bubble.
- **"building"** section: a year of GitHub contributions as ink dots (github-contributions-api.jogruber.de; hides if unavailable).
- **/me:** plain prose with `<blockquote class="fill">` quotes that darken word by word as you scroll.
- **/terminal** (and a working terminal on the 404 page): `terminal.js` `COMMANDS`, including `message`, `git log`, `cd`, `cat`/`ls`, `theme`, `sound`, `volume`.
- Phone menu (a "menu" pill that opens a card), page view transitions, dark-mode favicon, clean URLs.
- Tab title changes to "where'd you go?" when the visitor switches tabs, and "oh, you're back :)" briefly on return (all pages, `script.js`).

## Madhup's preferences (learned the hard way)
- **Never invent facts about him.** Only use what he has said; if wording is added for flow, tell him.
- **Avatar:** he prefers the current drawing. A highly "accurate" traced version and a redraw from his side-on photo were both rejected. Make only small, requested tweaks.
- **Books make no sound** on hover or scroll ("they don't pop out").
- Removed on request: the summation/odd-squares graphic, the harmonograph banner, and the terminal commands badat, whymath, now and history.
- He likes being asked before big changes and shown options; then build, test in a real browser (desktop, phone, dark mode), and push.
- Explain things simply; he isn't a developer. Give dashboard steps (Render, Vercel, Web3Forms) as numbered clicks.
- Keep the downloadable zip in sync when asked (`/home/user/madhup-portfolio.zip` in the old session; regenerate from the repo).

## Speed and accessibility (Lighthouse, Nov 2026)
- Scores after the audit: home 99/100/100/100, /me 98/95, /terminal and 404 97/100 (404's SEO 60 is the intended `noindex`; /me's 95 is the faded words in quote fills, which are decorative and `aria-hidden`).
- `--muted` grey is #6f6f69 (light) and #85857f (dark) so small text passes 4.5:1 contrast.
- `script.js` loads with `defer` on index and me; NOT on terminal and 404, where it made the page slower (the terminal is drawn by script).
- Phone thumbnails come from `previews/thumbs/` (240×150). Terminal dots have a 24px tap area. Google Fonts CSS stays render-blocking on purpose (avoids a flash of fallback fonts).
- `vercel.json` caches previews, og.png and icons for a day.

## Ideas suggested but not built yet
Problem of the day (and a `problem` terminal command), a "currently" line, JEE countdown, a ⌘K command menu, a lab page of maths demos, a papers section, a Konami easter egg.

Done since: maths terminal commands (calc/prime/factor/fib/gcd), the main-page about shortened to one paragraph + "read the long version →", and the "tap for sound" hint (`#soundHint`, home page only, uses `sfx.blocked`).
