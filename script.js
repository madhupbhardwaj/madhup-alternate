// Current year in the header and footer.
const year = new Date().getFullYear();
document.getElementById('year').textContent = year;
document.getElementById('year2').textContent = year;

// Light / dark toggle (remembered per browser).
const root = document.documentElement;
document.getElementById('theme').addEventListener('click', () => {
  const current = root.dataset.theme ||
    (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  const next = current === 'dark' ? 'light' : 'dark';
  root.dataset.theme = next;
  try { localStorage.setItem('theme', next); } catch (e) {}
});
