# madhup-portfolio

My personal portfolio. Plain HTML, CSS and JavaScript, with no build step and no dependencies.

```
index.html    page content (edit projects, about, books, links here)
style.css     all styling; colours are the variables at the top
script.js     year and dark-mode toggle
favicon.svg   tab icon
404.html      "page not found" page
```

## Run locally
Open `index.html` in a browser. That's it.

## Deploy

**Vercel:** push this folder to a GitHub repo, then in Vercel choose *Add New → Project*, import the repo, and set Framework Preset to **Other**. Leave the build command empty and click **Deploy**.

**Render:** in Render choose *New → Static Site* and connect the repo. Leave the Build Command empty (or use `echo done`), set Publish Directory to `.`, and click **Create Static Site**.

## Add a project
Copy one `<a class="row" ...>` block in `index.html`, change the link, name, description and number, and pick a colour (`--c1` … `--c5`).
