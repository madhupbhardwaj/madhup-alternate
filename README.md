# madhup-portfolio

My personal portfolio. Plain HTML, CSS and JavaScript, with no build step and no dependencies.

```
index.html    page content (edit projects, about, books, links here)
style.css     all styling; colours are the variables at the top
script.js     typing effect, sound effects, clock, dark mode, harmonograph banner
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
- **Avatar:** `avatar.svg` is a hand-drawn line illustration. To use a photo instead, put `me.jpg` in the folder and change the `src` of the image inside `.avatar` in `index.html`.
- **Sounds:** generated in code with the Web Audio API (no audio files). Visitors can switch them off with the speaker icon or "sound on" in the footer. Browsers only allow sound after the first click/tap/keypress on the page.
- **Banner:** a harmonograph — a pen tracing two combined waves. Drag left/right to pick a ratio (1:2 octave … 5:6 minor third), or click/tap for the next one. You hear the same two notes the curve is drawn from. The list of ratios is the `ratios` array in `script.js`.
- **"more about me" questions:** edit the `QUESTIONS` list near the bottom of `script.js`. Each `{ q: '...', a: '...' }` becomes a question button, and the answer is typed out in the speech bubble next to the avatar.
