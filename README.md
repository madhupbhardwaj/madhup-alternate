# madhup-portfolio

My personal portfolio. Plain HTML, CSS and JavaScript, with no build step and no dependencies.

```
index.html    page content (edit projects, about, books, links here)
style.css     all styling; colours are the variables at the top
script.js     typing effect, sound effects, clock, dark mode, flow-field banner
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
- **Photo:** replace `<span>mb</span>` inside `.avatar` in `index.html` with `<img src="me.jpg" alt="">` and add `me.jpg` to the folder.
- **Sounds:** generated in code with the Web Audio API (no audio files). Visitors can switch them off with the speaker icon or "sound on" in the footer. Browsers only allow sound after the first click/tap/keypress on the page.
- **Banner:** click it to cycle colour palettes; move the mouse over it to stir the strokes.
