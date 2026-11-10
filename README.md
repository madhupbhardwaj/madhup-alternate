# madhup-portfolio

My personal portfolio. Plain HTML, CSS and JavaScript, with no build step and no dependencies.

```
index.html    page content (edit projects, about, books, links here)
me.html       the "me" page: everything about me, linked from the nav
style.css     all styling; colours are the variables at the top
script.js     typing effect, sound effects, clock, dark mode, tall-grass banner
favicon.svg   tab icon
404.html      "page not found" page
```

## Run locally
Open `index.html` in a browser. That's it.

## Deploy

**Vercel:** push this folder to a GitHub repo, then in Vercel choose *Add New → Project*, import the repo, and set Framework Preset to **Other**. Leave the build command empty and click **Deploy**.

**Render:** in Render choose *New → Static Site* and connect the repo. Leave the Build Command empty (or use `echo done`), set Publish Directory to `.`, and click **Create Static Site**.

## Add a project
Copy one `<li>` block inside `<ul class="projects">` in `index.html`, change the link, name and description, and pick a colour (`--c1` … `--c5`).

## Customise
- **Avatar:** the line drawing is embedded in `index.html` (inside `.avatar`) so its eyes can follow the cursor and blink; `avatar.svg` is the same drawing as a standalone file. How far the pupils move is set by `RX`, `UP` and `DOWN` in `script.js`.
- **Sounds:** generated in code with the Web Audio API (no audio files). Visitors can switch them off with the speaker icon or "sound on" in the footer. Browsers only allow sound after the first click/tap/keypress on the page.
- **Banner:** a field of tall grass drawn on a canvas. It sways in a breeze, parts as the cursor or a finger moves through it, and rustles (generated noise grains, louder the faster you move). Look for "Tall grass banner" in `script.js`.
- **"more about me" questions:** edit the `QUESTIONS` list near the bottom of `script.js`. Each `{ q: '...', a: '...' }` becomes a question button, and the answer is typed out in the speech bubble next to the avatar.
- **Welcome screen:** first-time visitors see a short "hi! welcome to my portfolio" screen. Browsers block all sound until the visitor clicks, taps or presses a key, so this one tap is what lets the typing and other sounds play from the very first scroll. It's remembered in the browser, so returning visitors skip it. To show it again while testing, run `localStorage.removeItem('welcomed')` in the browser console and reload.
- **"me" page:** `me.html` is one plain piece of writing. Add a paragraph with `<p>…</p>`, or a line that fills in word by word as you scroll with `<blockquote class="fill">…</blockquote>`. Links in the text use `class="dot"`.
