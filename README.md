# madhup-portfolio

My personal portfolio. Plain HTML, CSS and JavaScript, with no build step and no dependencies.

```
index.html    page content (edit projects, about, books, links here)
me.html       the "me" page, served at /me (see "Clean URLs" below)
terminal.html the terminal page, served at /terminal
terminal.js   the terminal's commands (edit COMMANDS to add your own)
vercel.json   tells Vercel to serve me.html at /me
style.css     all styling; colours are the variables at the top
script.js     typing effect, sound effects, clock, dark mode, tall-grass banner
favicon.svg   tab icon
og.png        the picture shown when the site is shared (WhatsApp, LinkedIn…)
previews/     screenshots of each project, shown on hover (and as thumbnails on phones)
404.html      "page not found" page
```

## Run locally
Open `index.html` in a browser. That's it.

## Deploy

The site lives at **https://madhupbhardwaj.vercel.app** (main) and **https://madhup.onrender.com** (copy). Both deploy automatically from this repo's `main` branch.


**Vercel:** push this folder to a GitHub repo, then in Vercel choose *Add New → Project*, import the repo, and set Framework Preset to **Other**. Leave the build command empty and click **Deploy**.

**Render:** in Render choose *New → Static Site* and connect the repo. Leave the Build Command empty (or use `echo done`), set Publish Directory to `.`, and click **Create Static Site**.

## Add a project
Copy one `<li>` block inside `<ul class="projects">` in `index.html`, change the link, name and description, and pick a colour (`--c1` … `--c5`).

## Customise
- **Avatar:** the line drawing is embedded in `index.html` (inside `.avatar`) so its eyes can follow the cursor and blink; `avatar.svg` is the same drawing as a standalone file. How far the pupils move is set by `RX`, `UP` and `DOWN` in `script.js`.
- **Sounds:** generated in code with the Web Audio API (no audio files). Visitors can switch them off with the speaker icon or "sound on" in the footer. Browsers only allow sound after the first click/tap/keypress on the page.
- **Banner:** a field of tall grass drawn on a canvas. It sways in a breeze, parts as the cursor or a finger moves through it, and rustles (generated noise grains, louder the faster you move). Look for "Tall grass banner" in `script.js`.
- **"more about me" questions:** edit the `QUESTIONS` list near the bottom of `script.js`. Each `{ q: '...', a: '...' }` becomes a question button, and the answer is typed out in the speech bubble next to the avatar.
- **Welcome screen:** first-time visitors see a short "hi! welcome to my portfolio" screen. Browsers block all sound until the visitor clicks, taps or presses a key, so this one tap is what lets the typing and other sounds play from the very first scroll. It shows once per visit: every new tab or browser session sees it, but reloading the same tab skips it. To see it again while testing, open the site in a new tab.
- **"me" page:** `me.html` is one plain piece of writing. Add a paragraph with `<p>…</p>`, or a line that fills in word by word as you scroll with `<blockquote class="fill">…</blockquote>`. Links in the text use `class="dot"`.

## Clean URLs (/me, /about, /projects, /reading)
The site links to `/me`, `/terminal`, `/about`, `/projects` and `/reading` (no `.html`, no `#`). The host has to map those paths:
- **Render:** Dashboard → your static site → **Redirects/Rewrites** → add five rules, each with Action **Rewrite**:
  - `/me` → `/me.html`
  - `/terminal` → `/terminal.html`
  - `/about` → `/index.html`
  - `/projects` → `/index.html`
  - `/reading` → `/index.html`
- **Vercel:** already handled by `vercel.json`.
Note: when you open the files straight from your computer (not through a host), these links won't work, because they point at the root of a website.

## Terminal
`/terminal` is a small macOS-style terminal. Commands live in the `COMMANDS` object in `terminal.js`. Add one like:
`hobbies: { help: 'what i do for fun', run: () => 'your answer here' },`
Commands without a `help` line still work but stay hidden from `help` (handy for easter eggs).

## Volume
The speaker icon opens a volume card: ten ink strokes, click or drag to set 0–10 (default 7), plus a mute button. It's remembered in the browser. In the terminal, `volume 0-10` does the same.

## Little details
- **Project previews:** `previews/<name>.webp` (720×450) are screenshots of each project. If a project's look changes, replace its file with a new screenshot of the same name.
- **Share card:** `og.png` (1200×630). The share tags in each page point to `https://madhupbhardwaj.vercel.app` (the main address); if that changes, update those tags and the address printed on `og.png`.
- **Avatar moods:** eyes close while sound is muted, get sleepy from 11pm to 6am India time (with floating z's), and go wide if you click the avatar three times quickly.
- **Grass through the day:** morning dew (5–8am), plain daylight, sunset glow (5–7:30pm) and fireflies at night, all on India time. To preview one, add `?t=dawn`, `?t=day`, `?t=dusk` or `?t=night` to the address.
- **404 page:** `404.html`, shown for any address that doesn't exist.
- **Drag the avatar:** pick it up and throw it; it springs back home and says something.
- **Page transitions:** pages cross-fade (`@view-transition` in `style.css`); browsers without support get a quick fade from `script.js`.
- **Favicon:** `favicon.svg` switches to a light version when the browser is in dark mode.

## Visitor stats
Vercel Web Analytics (page views, countries, devices, referrers; no cookies). It loads only on `*.vercel.app`. To turn it on: Vercel dashboard → your project → **Analytics** → **Enable**. Stats appear in that same Analytics tab.
